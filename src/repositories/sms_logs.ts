import { getDbPool } from "../db/db";

export const SmsLogRepository = {
  async findAll(): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM sms_logs ORDER BY created_at DESC");
    return rows as any[];
  },

  async create(logData: any): Promise<any> {
    const id = logData.id || `smslog_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const recipientPhone = logData.recipient_phone || logData.phone || "";
    const messageText = logData.message_text || logData.message || "";
    const provider = logData.provider || "ghasedak";
    const status = logData.status || "sent";
    const responseData = typeof logData.response_data === "object" ? JSON.stringify(logData.response_data) : (logData.response_data || "");

    const pool = getDbPool();
    await pool.query(
      `INSERT INTO sms_logs (id, recipient_phone, message_text, provider, status, response_data)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, recipientPhone, messageText, provider, status, responseData]
    );

    const [rows] = await pool.query("SELECT * FROM sms_logs WHERE id = ?", [id]);
    const arr = rows as any[];
    return arr.length > 0 ? arr[0] : { id, recipient_phone: recipientPhone, message_text: messageText, provider, status, response_data: responseData };
  }
};
