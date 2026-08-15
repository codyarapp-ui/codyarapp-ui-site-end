import { getDbPool } from "../db/db";

function formatPaymentRow(row: any): any {
  if (!row) return null;
  const isPart = row.related_type === 'part_purchase' || (row.related_id && !String(row.related_id).includes('month'));
  return {
    ...row,
    id: row.id,
    user_id: row.user_id,
    userId: row.user_id,
    user_name: row.user_name || row.buyer_name || "",
    userName: row.user_name || row.buyer_name || "",
    user_phone: row.user_phone || row.buyer_phone || "",
    userPhone: row.user_phone || row.buyer_phone || "",
    user_role: row.user_role || "client",
    userRole: row.user_role || "client",
    order_id: row.order_id,
    related_type: isPart ? 'part_purchase' : 'subscription',
    relatedType: isPart ? 'part_purchase' : 'subscription',
    type: isPart ? 'part_purchase' : 'subscription',
    related_id: row.related_id,
    relatedId: row.related_id,
    partId: isPart ? row.related_id : undefined,
    partName: row.part_name || (isPart ? 'قطعه یدکی' : undefined),
    plan: !isPart ? row.related_id : undefined,
    amount: Number(row.amount) || 0,
    price: Number(row.amount) || 0,
    authority: row.authority,
    ref_id: row.ref_id,
    refId: row.ref_id,
    ref_code: row.ref_code,
    refCode: row.ref_code,
    trackNumber: row.ref_code || row.ref_id,
    card_number: row.card_number,
    cardNumber: row.card_number,
    cardHolder: row.card_number,
    status: row.status,
    payment_method: row.payment_method || 'card_to_card',
    gateway: row.payment_method || 'card_to_card',
    created_at: row.created_at
  };
}

export const PaymentRepository = {
  async findAll(): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT p.*, 
              COALESCE(u.full_name, p.card_number, 'کاربر') as user_name, 
              COALESCE(u.phone, p.user_id) as user_phone, 
              COALESCE(u.role, 'client') as user_role,
              sp.title as part_name
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.id OR (u.phone IS NOT NULL AND p.user_id = u.phone)
       LEFT JOIN spare_parts sp ON p.related_id = sp.id
       ORDER BY p.created_at DESC`
    );
    return (rows as any[]).map(formatPaymentRow);
  },

  async findById(id: string): Promise<any | null> {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT p.*, 
              COALESCE(u.full_name, p.card_number, 'کاربر') as user_name, 
              COALESCE(u.phone, p.user_id) as user_phone, 
              COALESCE(u.role, 'client') as user_role,
              sp.title as part_name
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.id OR (u.phone IS NOT NULL AND p.user_id = u.phone)
       LEFT JOIN spare_parts sp ON p.related_id = sp.id
       WHERE p.id = ?`,
      [id]
    );
    const arr = rows as any[];
    return arr.length > 0 ? formatPaymentRow(arr[0]) : null;
  },

  async findByAuthority(authority: string): Promise<any | null> {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT p.*, 
              COALESCE(u.full_name, p.card_number, 'کاربر') as user_name, 
              COALESCE(u.phone, p.user_id) as user_phone, 
              COALESCE(u.role, 'client') as user_role,
              sp.title as part_name
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.id OR (u.phone IS NOT NULL AND p.user_id = u.phone)
       LEFT JOIN spare_parts sp ON p.related_id = sp.id
       WHERE p.authority = ?`,
      [authority]
    );
    const arr = rows as any[];
    return arr.length > 0 ? formatPaymentRow(arr[0]) : null;
  },

  async findByUserId(userId: string, userPhone?: string): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT p.*, 
              COALESCE(u.full_name, p.card_number, 'کاربر') as user_name, 
              COALESCE(u.phone, p.user_id) as user_phone, 
              COALESCE(u.role, 'client') as user_role,
              sp.title as part_name
       FROM payments p
       LEFT JOIN users u ON p.user_id = u.id OR (u.phone IS NOT NULL AND p.user_id = u.phone)
       LEFT JOIN spare_parts sp ON p.related_id = sp.id
       WHERE (p.user_id = ? AND ? != '') 
          OR (p.user_id = ? AND ? != '')
          OR (u.phone = ? AND ? != '')
       ORDER BY p.created_at DESC`,
      [userId || "", userId || "", userPhone || "", userPhone || "", userPhone || "", userPhone || ""]
    );
    return (rows as any[]).map(formatPaymentRow);
  },

  async create(payData: any): Promise<any> {
    const id = payData.id || `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const userId = payData.user_id || payData.userId || null;
    const orderId = payData.order_id || payData.orderId || null;
    const relatedType = payData.related_type || payData.relatedType || payData.type || (payData.partId || payData.type === 'part_purchase' ? "part_purchase" : "subscription");
    const relatedId = payData.related_id || payData.relatedId || payData.partId || payData.plan || null;
    const amount = Number(payData.amount || payData.price) || 0;
    const authority = payData.authority || payData.ref_id || `AUTH_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const refId = payData.ref_id || payData.refId || payData.trackNumber || null;
    const refCode = payData.ref_code || payData.refCode || payData.trackNumber || "";
    const cardNumber = payData.card_number || payData.cardNumber || payData.cardHolder || "";
    const status = payData.status || "pending";
    const paymentMethod = payData.payment_method || payData.paymentMethod || "card_to_card";

    const pool = getDbPool();
    await pool.query(
      `INSERT INTO payments (id, user_id, order_id, related_type, related_id, amount, authority, ref_id, ref_code, card_number, status, payment_method)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       ref_id = VALUES(ref_id),
       ref_code = VALUES(ref_code),
       card_number = VALUES(card_number),
       amount = VALUES(amount),
       payment_method = VALUES(payment_method)`,
      [id, userId, orderId, relatedType, relatedId, amount, authority, refId, refCode, cardNumber, status, paymentMethod]
    );

    return (await PaymentRepository.findById(id));
  },

  async update(id: string, updates: any): Promise<any | null> {
    const pool = getDbPool();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) { fields.push("status = ?"); values.push(updates.status); }
    if (updates.ref_id !== undefined || updates.refId !== undefined) {
      fields.push("ref_id = ?");
      values.push(updates.ref_id ?? updates.refId);
    }
    if (updates.ref_code !== undefined || updates.refCode !== undefined) {
      fields.push("ref_code = ?");
      values.push(updates.ref_code ?? updates.refCode);
    }
    if (updates.card_number !== undefined || updates.cardNumber !== undefined || updates.cardHolder !== undefined) {
      fields.push("card_number = ?");
      values.push(updates.card_number ?? updates.cardNumber ?? updates.cardHolder);
    }
    if (updates.payment_method !== undefined || updates.paymentMethod !== undefined) {
      fields.push("payment_method = ?");
      values.push(updates.payment_method ?? updates.paymentMethod);
    }
    if (updates.amount !== undefined) { fields.push("amount = ?"); values.push(updates.amount); }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE payments SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    return (await PaymentRepository.findById(id));
  },

  async deleteById(id: string): Promise<boolean> {
    const pool = getDbPool();
    const [result]: any = await pool.query("DELETE FROM payments WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};
