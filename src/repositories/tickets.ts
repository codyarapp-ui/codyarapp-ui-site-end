import { getDbPool } from "../db/db";

export const TicketRepository = {
  async findAll(): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM tickets ORDER BY created_at DESC");
    return rows as any[];
  },

  async findById(id: string): Promise<any | null> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM tickets WHERE id = ?", [id]);
    const arr = rows as any[];
    return arr.length > 0 ? arr[0] : null;
  },

  async findByUserId(userId: string): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC", [userId]);
    return rows as any[];
  },

  async create(ticketData: any): Promise<any> {
    const id = ticketData.id || `tick_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const userId = ticketData.user_id || ticketData.userId || "";
    const subject = ticketData.subject || ticketData.title || "";
    const status = ticketData.status || "open";
    const priority = ticketData.priority || "normal";
    const department = ticketData.department || "support";

    const pool = getDbPool();
    await pool.query(
      `INSERT INTO tickets (id, user_id, subject, status, priority, department)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, subject, status, priority, department]
    );

    return (await TicketRepository.findById(id));
  },

  async update(id: string, updates: any): Promise<any | null> {
    const pool = getDbPool();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) { fields.push("status = ?"); values.push(updates.status); }
    if (updates.priority !== undefined) { fields.push("priority = ?"); values.push(updates.priority); }
    if (updates.subject !== undefined) { fields.push("subject = ?"); values.push(updates.subject); }
    if (updates.department !== undefined) { fields.push("department = ?"); values.push(updates.department); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE tickets SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    return (await TicketRepository.findById(id));
  },

  async deleteById(id: string): Promise<boolean> {
    const pool = getDbPool();
    const [result]: any = await pool.query("DELETE FROM tickets WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};
