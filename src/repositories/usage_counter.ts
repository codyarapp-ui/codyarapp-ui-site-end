import { getDbPool } from "../db/db";

export const UsageCounterRepository = {
  async getUsage(key: string): Promise<number> {
    const pool = getDbPool();
    const [rows]: any = await pool.query("SELECT count_val FROM usage_counter WHERE usage_key = ?", [key]);
    if (rows && rows.length > 0) {
      return Number(rows[0].count_val) || 0;
    }
    return 0;
  },

  async increment(key: string, amount: number = 1): Promise<number> {
    const pool = getDbPool();
    await pool.query(
      `INSERT INTO usage_counter (usage_key, count_val) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE count_val = count_val + VALUES(count_val)`,
      [key, amount]
    );
    return (await UsageCounterRepository.getUsage(key));
  }
};
