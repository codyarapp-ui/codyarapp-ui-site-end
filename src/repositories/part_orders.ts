import { getDbPool } from "../db/db";

function toShamsiDate(dateInput: any): string {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("fa-IR-u-nu-latn", {
      timeZone: "Asia/Tehran",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(d);
  } catch (e) {
    return "";
  }
}

function formatPartOrderRow(row: any): any {
  if (!row) return null;
  const shamsi = toShamsiDate(row.created_at);
  return {
    ...row,
    id: row.id,
    user_id: row.user_id,
    userId: row.user_id,
    part_id: row.part_id,
    partId: row.part_id,
    partName: row.part_name || "",
    customerName: row.buyer_name || "مشتری",
    customerPhone: row.buyer_phone || "",
    customerAddress: row.address || "",
    quantity: Number(row.quantity) || 1,
    total_price: Number(row.total_price) || 0,
    price: Number(row.total_price) || 0,
    status: row.status || "pending",
    shipping_tracking_code: row.shipping_tracking_code,
    trackNumber: row.shipping_tracking_code || "",
    date: shamsi || (row.created_at ? new Date(row.created_at).toLocaleDateString('fa-IR') : new Date().toLocaleDateString('fa-IR')),
    shamsi_date: shamsi,
    created_at_shamsi: shamsi
  };
}

export const PartOrderRepository = {
  async findAll(): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT po.*, sp.title as part_name, sp.category as part_category 
       FROM part_orders po 
       LEFT JOIN spare_parts sp ON po.part_id = sp.id 
       ORDER BY po.created_at DESC`
    );
    return (rows as any[]).map(formatPartOrderRow);
  },

  async findById(id: string): Promise<any | null> {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT po.*, sp.title as part_name, sp.category as part_category 
       FROM part_orders po 
       LEFT JOIN spare_parts sp ON po.part_id = sp.id 
       WHERE po.id = ?`,
      [id]
    );
    const arr = rows as any[];
    return arr.length > 0 ? formatPartOrderRow(arr[0]) : null;
  },

  async findByUserId(userId: string, userPhone?: string): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT po.*, sp.title as part_name, sp.category as part_category 
       FROM part_orders po 
       LEFT JOIN spare_parts sp ON po.part_id = sp.id 
       WHERE (po.user_id = ? AND ? != '') 
          OR (po.user_id = ? AND ? != '') 
          OR (po.buyer_phone = ? AND ? != '')
       ORDER BY po.created_at DESC`,
      [userId || "", userId || "", userPhone || "", userPhone || "", userPhone || "", userPhone || ""]
    );
    return (rows as any[]).map(formatPartOrderRow);
  },

  async create(poData: any): Promise<any> {
    const id = poData.id || `po_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const userId = poData.user_id || poData.userId || null;
    const partId = poData.part_id || poData.partId || null;
    const buyerName = poData.buyer_name || poData.customerName || "";
    const buyerPhone = poData.buyer_phone || poData.customerPhone || "";
    const address = poData.address || poData.customerAddress || "";
    const quantity = Number(poData.quantity) || 1;
    const totalPrice = Number(poData.total_price || poData.totalPrice || poData.price) || 0;
    const status = poData.status || "pending";
    const trackNumber = poData.shipping_tracking_code || poData.trackNumber || "";

    const pool = getDbPool();
    await pool.query(
      `INSERT INTO part_orders (id, user_id, part_id, buyer_name, buyer_phone, address, quantity, total_price, status, shipping_tracking_code)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       buyer_name = VALUES(buyer_name),
       buyer_phone = VALUES(buyer_phone),
       address = VALUES(address),
       quantity = VALUES(quantity),
       total_price = VALUES(total_price),
       status = VALUES(status),
       shipping_tracking_code = VALUES(shipping_tracking_code)`,
      [id, userId, partId, buyerName, buyerPhone, address, quantity, totalPrice, status, trackNumber]
    );

    return (await PartOrderRepository.findById(id));
  },

  // Atomic Part Purchase with transaction
  async createPartPurchaseTransaction(data: {
    userId: string;
    partId: string;
    quantity: number;
    totalPrice: number;
    paymentMethod?: string;
  }): Promise<{ partOrder: any; payment: any }> {
    const poId = `po_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const payId = `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const authority = `AUTH_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [stockResult]: any = await connection.query(
        "UPDATE spare_parts SET stock = stock - ? WHERE id = ? AND stock >= ?",
        [data.quantity, data.partId, data.quantity]
      );

      if (stockResult.affectedRows === 0) {
        throw new Error("موجودی قطعه کافی نیست.");
      }

      await connection.query(
        `INSERT INTO part_orders (id, user_id, part_id, quantity, total_price, status)
         VALUES (?, ?, ?, ?, ?, 'paid')`,
        [poId, data.userId, data.partId, data.quantity, data.totalPrice]
      );

      await connection.query(
        `INSERT INTO payments (id, user_id, amount, authority, status, payment_method, related_type, related_id)
         VALUES (?, ?, ?, ?, 'completed', ?, 'part_order', ?)`,
        [payId, data.userId, data.totalPrice, authority, data.paymentMethod || "wallet", poId]
      );

      await connection.commit();
    } catch (err) {
      try {
        await connection.rollback();
      } catch (rbErr) {
        console.warn("[createPurchaseTransaction] rollback error:", rbErr);
      }
      throw err;
    } finally {
      try {
        connection.release();
      } catch (relErr) {
        console.warn("[createPurchaseTransaction] release error:", relErr);
      }
    }

    const [poRows] = await pool.query("SELECT * FROM part_orders WHERE id = ?", [poId]);
    const [payRows] = await pool.query("SELECT * FROM payments WHERE id = ?", [payId]);

    return {
      partOrder: (poRows as any[])[0],
      payment: (payRows as any[])[0]
    };
  },

  async updateStatusTransaction(id: string, newStatus: string): Promise<any> {
    const pool = getDbPool();
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [rows] = await connection.query("SELECT * FROM part_orders WHERE id = ?", [id]);
      const arr = rows as any[];
      if (arr.length === 0) throw new Error("سفارش قطعه یافت نشد.");
      const currentPO = arr[0];

      if (currentPO.status !== "cancelled" && newStatus === "cancelled") {
        await connection.query(
          "UPDATE spare_parts SET stock = stock + ? WHERE id = ?",
          [currentPO.quantity, currentPO.part_id]
        );
      }

      await connection.query(
        "UPDATE part_orders SET status = ? WHERE id = ?",
        [newStatus, id]
      );

      await connection.commit();
    } catch (err) {
      try {
        await connection.rollback();
      } catch (rbErr) {
        console.warn("[updateStatusTransaction] rollback error:", rbErr);
      }
      throw err;
    } finally {
      try {
        connection.release();
      } catch (relErr) {
        console.warn("[updateStatusTransaction] release error:", relErr);
      }
    }

    return (await PartOrderRepository.findById(id));
  },

  async update(id: string, updates: any): Promise<any | null> {
    const pool = getDbPool();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) { fields.push("status = ?"); values.push(updates.status); }
    if (updates.quantity !== undefined) { fields.push("quantity = ?"); values.push(updates.quantity); }
    if (updates.total_price !== undefined || updates.totalPrice !== undefined) {
      fields.push("total_price = ?");
      values.push(updates.total_price ?? updates.totalPrice);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE part_orders SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    return (await PartOrderRepository.findById(id));
  },

  async deleteById(id: string): Promise<boolean> {
    const pool = getDbPool();
    const [result]: any = await pool.query("DELETE FROM part_orders WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};
