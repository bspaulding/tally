import { Router, Request, Response } from 'express';
import db from '../database/db';

const router = Router();

interface Account {
  id: string;
  plaid_account_id: string;
  name: string;
  official_name: string | null;
  type: string;
  subtype: string | null;
  mask: string | null;
  current_balance: number | null;
  available_balance: number | null;
  created_at: string;
  updated_at: string;
}

// Get all accounts
router.get('/', (req: Request, res: Response) => {
  try {
    const accounts = db.prepare('SELECT * FROM accounts ORDER BY name').all() as Account[];
    res.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    res.status(500).json({ error: 'Failed to fetch accounts' });
  }
});

export default router;
