import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';
import db from '../database/db';

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV as keyof typeof PlaidEnvironments || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export async function createLinkToken(userId: string) {
  const request = {
    user: {
      client_user_id: userId,
    },
    client_name: 'Tally',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: 'en',
  };

  const response = await plaidClient.linkTokenCreate(request);
  return response.data.link_token;
}

export async function exchangePublicToken(publicToken: string) {
  const response = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });

  const accessToken = response.data.access_token;
  const itemId = response.data.item_id;

  // Get institution info
  const itemResponse = await plaidClient.itemGet({ access_token: accessToken });
  const institutionId = itemResponse.data.item.institution_id;
  
  let institutionName = '';
  if (institutionId) {
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: [CountryCode.Us],
    });
    institutionName = institutionResponse.data.institution.name;
  }

  // Store in database
  const stmt = db.prepare(`
    INSERT INTO plaid_items (plaid_item_id, plaid_access_token, institution_id, institution_name)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(itemId, accessToken, institutionId, institutionName);

  // Fetch and store accounts
  await syncAccounts(accessToken, itemId);

  return { accessToken, itemId };
}

export async function syncAccounts(accessToken: string, itemId: string) {
  const response = await plaidClient.accountsGet({ access_token: accessToken });
  
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO accounts (id, plaid_account_id, name, official_name, type, subtype, mask, current_balance, available_balance, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);

  for (const account of response.data.accounts) {
    stmt.run(
      account.account_id,
      account.account_id,
      account.name,
      account.official_name || null,
      account.type,
      account.subtype || null,
      account.mask || null,
      account.balances.current || null,
      account.balances.available || null
    );
  }

  return response.data.accounts;
}

export async function syncTransactions() {
  const items = db.prepare('SELECT plaid_item_id, plaid_access_token FROM plaid_items').all() as Array<{
    plaid_item_id: string;
    plaid_access_token: string;
  }>;

  for (const item of items) {
    try {
      // Get last sync date or default to 30 days ago
      const lastSync = db.prepare('SELECT last_sync_at FROM plaid_items WHERE plaid_item_id = ?').get(item.plaid_item_id) as { last_sync_at: string | null } | undefined;
      
      const startDate = lastSync?.last_sync_at 
        ? new Date(lastSync.last_sync_at).toISOString().split('T')[0]
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const endDate = new Date().toISOString().split('T')[0];

      const response = await plaidClient.transactionsGet({
        access_token: item.plaid_access_token,
        start_date: startDate,
        end_date: endDate,
      });

      const transactionStmt = db.prepare(`
        INSERT OR REPLACE INTO transactions (id, account_id, plaid_transaction_id, amount, date, name, merchant_name, pending, category_plaid)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const transaction of response.data.transactions) {
        transactionStmt.run(
          transaction.transaction_id,
          transaction.account_id,
          transaction.transaction_id,
          transaction.amount,
          transaction.date,
          transaction.name,
          transaction.merchant_name || null,
          transaction.pending ? 1 : 0,
          transaction.category ? transaction.category.join(', ') : null
        );
      }

      // Update last sync time
      db.prepare('UPDATE plaid_items SET last_sync_at = CURRENT_TIMESTAMP WHERE plaid_item_id = ?').run(item.plaid_item_id);
      
      console.log(`Synced ${response.data.transactions.length} transactions for item ${item.plaid_item_id}`);
    } catch (error) {
      console.error(`Error syncing transactions for item ${item.plaid_item_id}:`, error);
    }
  }
}

export { plaidClient };
