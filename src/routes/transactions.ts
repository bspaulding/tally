import { Router, Request, Response } from 'express';
import db from '../database/db';

const router = Router();

interface Transaction {
  id: string;
  account_id: string;
  amount: number;
  date: string;
  name: string;
  merchant_name: string | null;
  pending: number;
  category_plaid: string | null;
  categories?: Array<{ id: number; name: string }>;
}

// Get all transactions
router.get('/', (req: Request, res: Response) => {
  try {
    const transactions = db.prepare(`
      SELECT * FROM transactions 
      ORDER BY date DESC, created_at DESC
      LIMIT 1000
    `).all() as Transaction[];

    // Fetch categories for each transaction
    const categoryStmt = db.prepare(`
      SELECT c.id, c.name 
      FROM categories c
      JOIN transaction_categories tc ON c.id = tc.category_id
      WHERE tc.transaction_id = ?
    `);

    transactions.forEach(transaction => {
      transaction.categories = categoryStmt.all(transaction.id) as Array<{ id: number; name: string }>;
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get a single transaction
router.get('/:id', (req: Request, res: Response) => {
  try {
    const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id) as Transaction | undefined;
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Fetch categories
    transaction.categories = db.prepare(`
      SELECT c.id, c.name 
      FROM categories c
      JOIN transaction_categories tc ON c.id = tc.category_id
      WHERE tc.transaction_id = ?
    `).all(transaction.id) as Array<{ id: number; name: string }>;

    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Assign categories to a transaction
router.post('/:id/categories', (req: Request, res: Response) => {
  try {
    const { categoryIds } = req.body;
    const transactionId = req.params.id;

    if (!Array.isArray(categoryIds)) {
      return res.status(400).json({ error: 'categoryIds must be an array' });
    }

    // Check if transaction exists
    const transaction = db.prepare('SELECT id FROM transactions WHERE id = ?').get(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Remove existing categories
    db.prepare('DELETE FROM transaction_categories WHERE transaction_id = ?').run(transactionId);

    // Add new categories
    const stmt = db.prepare('INSERT INTO transaction_categories (transaction_id, category_id) VALUES (?, ?)');
    
    for (const categoryId of categoryIds) {
      stmt.run(transactionId, categoryId);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error assigning categories:', error);
    res.status(500).json({ error: 'Failed to assign categories' });
  }
});

export default router;
