import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../data/tally.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

export function initDatabase() {
  // Create accounts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      plaid_account_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      official_name TEXT,
      type TEXT NOT NULL,
      subtype TEXT,
      mask TEXT,
      current_balance REAL,
      available_balance REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create categories table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      plaid_transaction_id TEXT UNIQUE NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      name TEXT NOT NULL,
      merchant_name TEXT,
      pending BOOLEAN NOT NULL DEFAULT 0,
      category_plaid TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
    )
  `);

  // Create transaction_categories junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transaction_categories (
      transaction_id TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (transaction_id, category_id),
      FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
    )
  `);

  // Create plaid_items table to store linked bank connections
  db.exec(`
    CREATE TABLE IF NOT EXISTS plaid_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plaid_item_id TEXT UNIQUE NOT NULL,
      plaid_access_token TEXT NOT NULL,
      institution_id TEXT,
      institution_name TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_sync_at DATETIME
    )
  `);

  console.log('Database initialized successfully');
}

export default db;
