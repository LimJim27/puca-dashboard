import { google } from "googleapis";
import { NextResponse } from "next/server";

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID!;

async function getSheets() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth });
}

export async function GET() {
  try {
    const sheets = await getSheets();

    const [txnRes, expRes, budRes] = await Promise.all([
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Transactions!A2:G2000",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Expenses!A4:H200",
      }),
      sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: "Budget!A2:F20",
      }),
    ]);

    const transactions = (txnRes.data.values || [])
      .filter((r) => r[0] && r[2])
      .map((r) => ({
        date: r[0],
        description: r[1] || "",
        amount: parseFloat(String(r[2]).replace(/[$,]/g, "")) || 0,
        type: r[3] || "Expense",
        category: r[4] || "Other",
        account: r[5] || "",
        notes: r[6] || "",
      }));

    const expenses = (expRes.data.values || [])
      .filter((r) => r[0] && r[2])
      .map((r) => ({
        date: r[0],
        description: r[1] || "",
        amount: parseFloat(String(r[2]).replace(/[$,]/g, "")) || 0,
        category: r[3] || "",
        account: r[4] || "",
        status: r[5] || "To Submit",
        dateSubmitted: r[6] || "",
        notes: r[7] || "",
      }));

    const budget = (budRes.data.values || [])
      .filter((r) => r[0] && r[1])
      .map((r) => ({
        category: r[0],
        budget: parseFloat(String(r[1]).replace(/[$,]/g, "")) || 0,
        spent: parseFloat(String(r[2]).replace(/[$,]/g, "")) || 0,
        remaining: parseFloat(String(r[3]).replace(/[$,]/g, "")) || 0,
        percentUsed: parseFloat(String(r[4]).replace(/%/g, "")) || 0,
        status: r[5] || "",
      }));

    // Monthly spending
    const monthlyMap: Record<string, Record<string, number>> = {};
    for (const t of transactions) {
      if (t.type !== "Expense") continue;
      const month = t.date.slice(0, 7);
      if (!monthlyMap[month]) monthlyMap[month] = {};
      monthlyMap[month][t.category] = (monthlyMap[month][t.category] || 0) + t.amount;
    }

    const months = Object.keys(monthlyMap).sort();
    const categories = ["Eating Out", "Pints/Bar", "Groceries", "Travel", "Transport", "Gym", "Subscriptions", "Shopping", "Work Expense", "Other"];
    const monthlySpending = months.slice(-6).map((month) => ({
      month,
      ...Object.fromEntries(categories.map((c) => [c, Math.round(monthlyMap[month]?.[c] || 0)])),
      total: Math.round(Object.values(monthlyMap[month]).reduce((a, b) => a + b, 0)),
    }));

    // Account breakdown (current month)
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentTxns = transactions.filter((t) => t.date.startsWith(currentMonth) && t.type === "Expense");
    const scotiaTotal = currentTxns.filter((t) => t.account === "Scotiabank").reduce((a, t) => a + t.amount, 0);
    const amexTotal = currentTxns.filter((t) => t.account === "Amex").reduce((a, t) => a + t.amount, 0);

    // Savings calc
    const income = transactions.filter((t) => t.type === "Income").reduce((a, t) => a + t.amount, 0);
    const totalExpenses = transactions.filter((t) => t.type === "Expense" && t.category !== "Work Expense").reduce((a, t) => a + t.amount, 0);
    const netSaved = income - totalExpenses;
    const currentBalance = 20000 + netSaved;
    const savingsGoal = 40000;
    const monthlySavingsTarget = 2200;
    const monthsToGoal = Math.ceil((savingsGoal - currentBalance) / monthlySavingsTarget);
    const projectedDate = new Date();
    projectedDate.setMonth(projectedDate.getMonth() + monthsToGoal);

    return NextResponse.json({
      transactions,
      expenses,
      budget,
      monthlySpending,
      accountBreakdown: [
        { name: "Scotiabank", value: Math.round(scotiaTotal) },
        { name: "Amex", value: Math.round(amexTotal) },
      ],
      savings: {
        currentBalance: Math.round(currentBalance),
        goal: savingsGoal,
        progress: Math.min(100, Math.round((currentBalance / savingsGoal) * 100)),
        monthsToGoal,
        projectedDate: projectedDate.toLocaleDateString("en-CA", { month: "long", year: "numeric" }),
        monthlySavingsTarget,
      },
      expenseSummary: {
        toSubmit: expenses.filter((e) => e.status === "To Submit").reduce((a, e) => a + e.amount, 0),
        submitted: expenses.filter((e) => e.status === "Submitted").reduce((a, e) => a + e.amount, 0),
        reimbursed: expenses.filter((e) => e.status === "Reimbursed").reduce((a, e) => a + e.amount, 0),
      },
    });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
