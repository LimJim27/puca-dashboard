"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const CAD = (n: number) =>
  new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n);

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
const CAT_COLORS: Record<string, string> = {
  "Eating Out": "#f59e0b",
  "Pints/Bar": "#ef4444",
  "Groceries": "#10b981",
  "Travel": "#3b82f6",
  "Transport": "#06b6d4",
  "Gym": "#84cc16",
  "Subscriptions": "#8b5cf6",
  "Shopping": "#ec4899",
  "Work Expense": "#64748b",
  "Other": "#475569",
};

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"savings" | "expenses" | "spending">("savings");

  useEffect(() => {
    fetch("/api/finance")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-400 text-lg animate-pulse">Loading your finances...</div>
    </div>
  );

  if (!data || data.error) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-red-400 text-lg">Error loading data. Check your environment variables.</div>
    </div>
  );

  const { savings, expenseSummary, monthlySpending, accountBreakdown, expenses, budget } = data;
  const categories = ["Eating Out", "Pints/Bar", "Groceries", "Travel", "Transport", "Gym", "Subscriptions", "Shopping", "Other"];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">💰 Puca Dashboard</h1>
          <p className="text-sm text-gray-400">Liam's Finance Overview</p>
        </div>
        <div className="text-sm text-gray-500">{new Date().toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}</div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 px-6">
        <div className="flex gap-6">
          {(["savings", "expenses", "spending"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab ? "border-blue-500 text-blue-400" : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab === "savings" ? "💰 Savings" : tab === "expenses" ? "🧾 Expenses" : "📊 Spending"}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto space-y-6">

        {/* SAVINGS TAB */}
        {activeTab === "savings" && (
          <>
            {/* Goal card */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">Savings Goal</h2>
                  <p className="text-sm text-gray-400">Target: {CAD(savings.goal)}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400">{CAD(savings.currentBalance)}</div>
                  <div className="text-sm text-gray-400">current balance</div>
                </div>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-4 mb-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-green-400 h-4 rounded-full transition-all duration-1000"
                  style={{ width: `${savings.progress}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-400 mb-4">
                <span>{savings.progress}% there</span>
                <span>{CAD(savings.goal - savings.currentBalance)} to go</span>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-800">
                <div className="text-center">
                  <div className="text-lg font-semibold text-blue-400">{savings.monthsToGoal}</div>
                  <div className="text-xs text-gray-400">months to goal</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-purple-400">{savings.projectedDate}</div>
                  <div className="text-xs text-gray-400">projected date</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-yellow-400">{CAD(savings.monthlySavingsTarget)}</div>
                  <div className="text-xs text-gray-400">monthly target</div>
                </div>
              </div>
            </div>

            {/* Monthly totals chart */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Monthly Total Spending</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlySpending}>
                  <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 12 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                    formatter={(v: number) => CAD(v)}
                  />
                  <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Account breakdown */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">This Month: Scotiabank vs Amex</h2>
              <div className="flex items-center gap-8">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie data={accountBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                      {accountBreakdown.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => CAD(v)} contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3 flex-1">
                  {accountBreakdown.map((a: any, i: number) => (
                    <div key={a.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                        <span className="text-gray-300">{a.name}</span>
                      </div>
                      <span className="font-semibold">{CAD(a.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* EXPENSES TAB */}
        {activeTab === "expenses" && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "To Submit", value: expenseSummary.toSubmit, color: "text-red-400", bg: "bg-red-950 border-red-900" },
                { label: "Submitted", value: expenseSummary.submitted, color: "text-yellow-400", bg: "bg-yellow-950 border-yellow-900" },
                { label: "Reimbursed", value: expenseSummary.reimbursed, color: "text-green-400", bg: "bg-green-950 border-green-900" },
              ].map((s) => (
                <div key={s.label} className={`rounded-xl p-5 border ${s.bg}`}>
                  <div className="text-sm text-gray-400 mb-1">{s.label}</div>
                  <div className={`text-2xl font-bold ${s.color}`}>{CAD(s.value)}</div>
                </div>
              ))}
            </div>

            {/* Expense list */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold">Work Expenses</h2>
              </div>
              {expenses.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">No expenses logged yet. Send receipts to Puca on Telegram!</div>
              ) : (
                <div className="divide-y divide-gray-800">
                  {expenses.map((e: any, i: number) => (
                    <div key={i} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{e.description}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{e.date} · {e.account} · {e.category}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold">{CAD(e.amount)}</span>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          e.status === "Reimbursed" ? "bg-green-900 text-green-300" :
                          e.status === "Submitted" ? "bg-yellow-900 text-yellow-300" :
                          "bg-red-900 text-red-300"
                        }`}>{e.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* SPENDING TAB */}
        {activeTab === "spending" && (
          <>
            {/* Category breakdown over time */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold mb-4">Spending by Category (Last 6 Months)</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlySpending}>
                  <XAxis dataKey="month" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                    formatter={(v: number) => CAD(v)}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px" }} />
                  {["Eating Out", "Pints/Bar", "Groceries", "Travel", "Transport", "Other"].map((cat) => (
                    <Bar key={cat} dataKey={cat} stackId="a" fill={CAT_COLORS[cat]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Budget vs actual */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="text-lg font-semibold">Budget vs Actual — This Month</h2>
              </div>
              <div className="divide-y divide-gray-800">
                {budget.map((b: any) => {
                  const pct = Math.min(100, b.budget > 0 ? (b.spent / b.budget) * 100 : 0);
                  const over = b.spent > b.budget;
                  return (
                    <div key={b.category} className="px-6 py-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium">{b.category}</span>
                        <span className={`text-sm font-semibold ${over ? "text-red-400" : "text-green-400"}`}>
                          {CAD(b.spent)} <span className="text-gray-500 font-normal">/ {CAD(b.budget)}</span>
                        </span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all ${over ? "bg-red-500" : "bg-green-500"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
