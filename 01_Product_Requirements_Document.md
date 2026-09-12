# Product Requirements Document (PRD): Personal Finance & Ledger App

## 1. Product Overview
The application is a simplified personal finance tracker and ledger, inspired by the usability of Khatabook. It enforces financial discipline through a strict rule-based engine (60% spend, 40% save) and manages peer-to-peer borrowing/lending.

## 2. Target Audience
- Individuals looking for simple, no-nonsense financial tracking.
- Users who frequently lend to or borrow from friends/family and need a ledger.
- Users who need automated financial discipline and alerts.

## 3. Core Features & User Stories

### 3.1. Income & Balance Tracking
- **Story:** As a user, I want to log my income sources so that the app can calculate my total available balance and spending limits.
- **Details:** 
  - Input field for Amount, Source (e.g., Salary, Freelance), and Date.
  - Calculation: `Total Balance = Sum of Income - Sum of Expenses`.

### 3.2. Expense Tracking (The 60% Rule)
- **Story:** As a user, I want to quickly add daily expenses so that I know where my money goes.
- **Details:**
  - Quick-add UI (Amount, Category, Optional Note).
  - The app calculates 60% of the user's logged monthly income as the "Spend Limit".

### 3.3. Alerting & Thresholds
- **Story:** As a user, I want to be warned when I am spending too much so I don't go into debt.
- **Details:**
  - **Warning 1 (Approaching Limit):** Triggered at 50% of total income (which is ~83% of the allocated spend budget). 
  - **Warning 2 (Debt / Rule Break Alert):** Triggered at 60% of total income. The app explicitly warns the user that further spending cuts into their 40% savings/investment allocation.

### 3.4. Borrowing & Lending Ledger (Double-Entry)
- **Story:** As a user, I want to record who owes me money and who I owe, so I never lose track.
- **Details:**
  - "Give" (Accounts Receivable) and "Got" (Accounts Payable) entries.
  - Associate entries with Contacts.
  - Auto-calculate net balance per contact.

## 4. Future Enhancements (Phase 2)
- WhatsApp/SMS payment reminders for the Ledger.
- Export Monthly Summaries to PDF/CSV.
- Recurring transaction automation.
