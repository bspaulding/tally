# Tally - Personal Accounting Application

A personal accounting application that allows you to link bank accounts, synchronize transactions automatically, and categorize your spending.

## Features

- 🏦 **Bank Account Linking**: Connect your bank accounts securely using Plaid
- 🔄 **Automatic Sync**: Transactions are synchronized automatically every hour
- 📊 **Transaction View**: View all your transactions in a clean web interface
- 🏷️ **Categories**: Create custom categories and assign multiple categories to transactions
- 💾 **Local Database**: All data is stored locally in SQLite

## Prerequisites

- Node.js 18+ and npm
- A Plaid account (free sandbox account available at https://plaid.com)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Plaid credentials:
   - `PLAID_CLIENT_ID`: Your Plaid client ID
   - `PLAID_SECRET`: Your Plaid secret (use sandbox secret for testing)
   - `PLAID_ENV`: Set to `sandbox` for testing, `development` or `production` for real data

3. **Build the application**:
   ```bash
   npm run build
   ```

4. **Start the server**:
   ```bash
   npm start
   ```
   
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Open in browser**:
   Navigate to `http://localhost:3000`

## Usage

### Linking Bank Accounts

1. Click the "Link Bank Account" button
2. Follow the Plaid Link flow to connect your bank
3. Your accounts and recent transactions will be imported automatically

### Managing Categories

1. Click "Manage Categories" to create new categories
2. Give each category a name and optional description
3. Delete categories you no longer need

### Assigning Categories to Transactions

1. In the transactions list, click "Assign" next to any transaction
2. Select one or more categories that apply
3. Click "Save" to update

### Transaction Sync

- Transactions sync automatically every hour
- Click "Sync Transactions" to manually trigger a sync
- The initial sync pulls the last 30 days of transactions

## Project Structure

```
tally/
├── src/
│   ├── database/
│   │   └── db.ts              # Database schema and initialization
│   ├── routes/
│   │   ├── accounts.ts        # Account endpoints
│   │   ├── categories.ts      # Category CRUD endpoints
│   │   ├── plaid.ts          # Plaid integration endpoints
│   │   └── transactions.ts    # Transaction endpoints
│   ├── services/
│   │   ├── plaid.ts          # Plaid service layer
│   │   └── scheduler.ts       # Cron job for auto-sync
│   ├── public/
│   │   └── index.html        # Frontend web interface
│   └── index.ts              # Express server entry point
├── data/
│   └── tally.db              # SQLite database (created on first run)
├── .env                      # Environment configuration (create from .env.example)
└── package.json
```

## API Endpoints

### Plaid
- `POST /api/plaid/create_link_token` - Create a Plaid Link token
- `POST /api/plaid/exchange_public_token` - Exchange public token for access token
- `POST /api/plaid/sync` - Manually trigger transaction sync

### Accounts
- `GET /api/accounts` - List all linked accounts

### Transactions
- `GET /api/transactions` - List all transactions
- `GET /api/transactions/:id` - Get a specific transaction
- `POST /api/transactions/:id/categories` - Assign categories to a transaction

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create a new category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category

## Database Schema

### Tables
- **accounts**: Linked bank accounts
- **transactions**: Financial transactions
- **categories**: User-defined categories
- **transaction_categories**: Many-to-many relationship between transactions and categories
- **plaid_items**: Plaid connection metadata

## Development

### Building
```bash
npm run build
```

### Running in Development Mode
```bash
npm run dev
```

## Security Notes

- Never commit your `.env` file or expose your Plaid credentials
- Use Plaid's sandbox environment for testing
- In production, implement proper authentication and user management
- Consider encrypting sensitive data in the database

## License

ISC