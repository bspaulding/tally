import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { initDatabase } from './database/db';
import { startScheduler } from './services/scheduler';
import plaidRoutes from './routes/plaid';
import transactionRoutes from './routes/transactions';
import categoryRoutes from './routes/categories';
import accountRoutes from './routes/accounts';

// Load environment variables
dotenv.config();

// Initialize database
initDatabase();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/plaid', plaidRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/accounts', accountRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start scheduler for automatic transaction sync
startScheduler();

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════╗
║   Tally - Personal Accounting App     ║
╚═══════════════════════════════════════╝

Server running on http://localhost:${PORT}
  
To get started:
1. Copy .env.example to .env
2. Add your Plaid API credentials
3. Open http://localhost:${PORT} in your browser
4. Link your bank accounts

Transaction sync runs automatically every hour.
  `);
});
