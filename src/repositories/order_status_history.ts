import { getDbPool } from "../db/db";

export const OrderStatusHistoryRepository = {
  async findAll(orderId?: string): Promise<any[]> {
    const pool = getDbPool();
    if (orderId) {
      const [rows] = await pool.query("SELECT * FROM order_status_history WHERE order_id = ? ORDER BY created_at ASC", [orderId]);
      return rows as any[];
    }
    const [rows] = await pool.query("SELECT * FROM order_status_history ORDER BY created_at DESC");
    return rows as any[];
  },

  async create(orderId: string, historyItem: any): Promise<any> {
    const id = historyItem.id || `osh_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const status = historyItem.status || "updated";
    const title = historyItem.title || historyItem.report || "";
    const updatedBy = historyItem.updated_by || historyItem.updatedBy || "system";

    const pool = getDbPool();
    await pool.query(
      `INSERT INTO order_status_history (id, order_id, status, title, updated_by)
       VALUES (?, ?, ?, ?, ?)`,
      [id, orderId, status, title, updatedBy]
    );

    const [rows] = await pool.query("SELECT * FROM order_status_history WHERE id = ?", [id]);
    const arr = rows as any[];
    return arr.length > 0 ? arr[0] : { id, order_id: orderId, status, title, updated_by: updatedBy };
  }
};
