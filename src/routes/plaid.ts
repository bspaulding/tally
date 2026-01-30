import { Router, Request, Response } from 'express';
import { createLinkToken, exchangePublicToken, syncTransactions } from '../services/plaid';

const router = Router();

// Create a link token for Plaid Link
router.post('/create_link_token', async (req: Request, res: Response) => {
  try {
    const userId = req.body.userId || 'default-user';
    const linkToken = await createLinkToken(userId);
    res.json({ link_token: linkToken });
  } catch (error) {
    console.error('Error creating link token:', error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

// Exchange public token for access token
router.post('/exchange_public_token', async (req: Request, res: Response) => {
  try {
    const { public_token } = req.body;
    
    if (!public_token) {
      return res.status(400).json({ error: 'public_token is required' });
    }
    
    const result = await exchangePublicToken(public_token);
    res.json({ success: true, item_id: result.itemId });
  } catch (error) {
    console.error('Error exchanging public token:', error);
    res.status(500).json({ error: 'Failed to exchange public token' });
  }
});

// Manually trigger transaction sync
router.post('/sync', async (req: Request, res: Response) => {
  try {
    await syncTransactions();
    res.json({ success: true, message: 'Sync completed' });
  } catch (error) {
    console.error('Error syncing transactions:', error);
    res.status(500).json({ error: 'Failed to sync transactions' });
  }
});

export default router;
