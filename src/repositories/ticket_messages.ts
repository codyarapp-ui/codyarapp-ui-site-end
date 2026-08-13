import { getDbPool } from "../db/db";

export const TicketMessageRepository = {
  async findByTicketId(ticketId: string): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC", [ticketId]);
    return rows as any[];
  },

  async create(msgData: any): Promise<any> {
    const id = msgData.id || `tm_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const ticketId = msgData.ticket_id || msgData.ticketId || "";
    const senderId = msgData.sender_id || msgData.senderId || "";
    const senderRole = msgData.sender_role || msgData.senderRole || "user";
    const message = msgData.message || "";

    const pool = getDbPool();
    await pool.query(
      `INSERT INTO ticket_messages (id, ticket_id, sender_id, sender_role, message)
       VALUES (?, ?, ?, ?, ?)`,
      [id, ticketId, senderId, senderRole, message]
    );

    const [rows] = await pool.query("SELECT * FROM ticket_messages WHERE id = ?", [id]);
    const arr = rows as any[];
    return arr.length > 0 ? arr[0] : { id, ticket_id: ticketId, sender_id: senderId, sender_role: senderRole, message };
  }
};
