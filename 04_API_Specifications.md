# REST API Specifications

All endpoints require a valid `Authorization: Bearer <JWT>` header unless specified.

## 1. Auth Module
### `POST /api/v1/auth/register`
- **Body:** `{ "email": "user@example.com", "password": "secure123", "name": "John" }`
- **Response (201):** `{ "token": "jwt_string", "user": {...} }`

### `POST /api/v1/auth/login`
- **Body:** `{ "email": "user@example.com", "password": "secure123" }`
- **Response (200):** `{ "token": "jwt_string" }`

## 2. Transactions Module
### `POST /api/v1/transactions`
- **Description:** Log a new income or expense.
- **Body:** 
  ```json
  {
    "type": "EXPENSE",
    "amount": 150.00,
    "category": "Food",
    "transaction_date": "2026-09-12"
  }
  ```
- **Response (201):** 
  ```json
  {
    "id": "uuid",
    "status": "success",
    "alerts": {
      "threshold_reached": true,
      "message": "Warning: You have crossed the 50% spending threshold."
    }
  }
  ```

### `GET /api/v1/transactions/summary`
- **Description:** Get the dashboard summary (60/40 rule calculation).
- **Query Params:** `?month=09&year=2026`
- **Response (200):**
  ```json
  {
    "total_income": 5000.00,
    "total_expenses": 3100.00,
    "spend_limit": 3000.00,
    "savings_allocation": 2000.00,
    "status": "OVER_LIMIT"
  }
  ```

## 3. Ledger Module
### `POST /api/v1/ledger`
- **Description:** Record money given or taken.
- **Body:** `{ "contact_name": "Alice", "type": "GAVE", "amount": 500.00 }`
- **Response (201):** `{ "id": "uuid", "status": "recorded" }`

### `GET /api/v1/ledger/contacts`
- **Description:** Get list of people and net balances.
- **Response (200):**
  ```json
  [
    { "contact_name": "Alice", "net_balance": 500.00, "status": "YOU_ARE_OWED" },
    { "contact_name": "Bob", "net_balance": -200.00, "status": "YOU_OWE" }
  ]
  ```
