import { getDbPool } from "../db/db";

export const WalletTransactionRepository = {
  async findAll(): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM wallet_transactions ORDER BY created_at DESC");
    return rows as any[];
  },

  async findByUserId(userId: string): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC", [userId]);
    return rows as any[];
  },

  async create(txData: any): Promise<any> {
    const id = txData.id || `wtx_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const userId = txData.user_id || txData.userId || "";
    const type = txData.type || "deposit";
    const amount = txData.amount || 0;
    const description = txData.description || "";
    const status = txData.status || "completed";

    const pool = getDbPool();
    await pool.query(
      `INSERT INTO wallet_transactions (id, user_id, type, amount, description, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, type, amount, description, status]
    );

    const [rows] = await pool.query("SELECT * FROM wallet_transactions WHERE id = ?", [id]);
    const arr = rows as any[];
    return arr.length > 0 ? arr[0] : { id, user_id: userId, type, amount, description, status };
  }
};
