# 💰 Puca Dashboard

Liam's personal finance dashboard — built by Puca.

Reads live from Google Sheets. Dark mode. Mobile friendly.

## Features

- **Savings tracker** — progress to $40k goal, projected date
- **Expense tracker** — work expenses by status (To Submit / Submitted / Reimbursed)
- **Spending breakdown** — category charts, Amex vs Scotiabank, month-over-month

## Setup

### 1. Create a Google Service Account

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the **Google Sheets API**
3. Create a **Service Account** → download the JSON key
4. Share your Google Sheet with the service account email (view only)

### 2. Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```
GOOGLE_SHEETS_SPREADSHEET_ID=18LnWSf85q8H9c3nYI9_sLGx2B-Vr9FcBOm_IiCGyDB0
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
```

### 3. Run locally

```bash
npm install
npm run dev
```

### 4. Deploy to Vercel

Import this repo in Vercel, add the environment variables, deploy.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Recharts
- Google Sheets API
