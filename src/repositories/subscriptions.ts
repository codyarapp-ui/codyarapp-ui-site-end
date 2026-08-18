import { getDbPool } from "../db/db";

function safeMySqlDate(val: any): string {
  if (!val) return new Date().toISOString().slice(0, 19).replace('T', ' ');
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 19).replace('T', ' ');
    return d.toISOString().slice(0, 19).replace('T', ' ');
  } catch {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  }
}

function formatSubRow(row: any): any {
  if (!row) return null;
  const endDateStr = row.end_date ? new Date(row.end_date).toISOString() : (row.expiry_date ? new Date(row.expiry_date).toISOString() : new Date().toISOString());
  const isActive = (row.status === 'active' || row.status === 'completed') && new Date(endDateStr) > new Date();

  const planNameMap: Record<string, string> = {
    '1_month': 'اشتراک ۱ ماهه کدهای خطا',
    '3_month': 'اشتراک ۳ ماهه کدهای خطا',
    '6_month': 'اشتراک ۶ ماهه کدهای خطا',
    '12_month': 'اشتراک ۱۲ ماهه کدهای خطا',
    'permanent': 'اشتراک دائمی همکار / مدیریت'
  };

  const rawTitle = row.plan_name || row.planName || "";
  const planTitle = (rawTitle && !['1_month','3_month','6_month','12_month','permanent','gold'].includes(rawTitle))
    ? rawTitle
    : (planNameMap[row.plan_id] || planNameMap[row.plan] || "اشتراک ویژه کدهای خطا");

  return {
    ...row,
    id: row.id,
    user_id: row.user_id,
    userId: row.user_id,
    plan_name: planTitle,
    planName: planTitle,
    plan: row.plan_id || row.plan_name || "1_month",
    plan_id: row.plan_id || row.plan_name || "1_month",
    status: row.status || "active",
    is_active: isActive,
    is_premium: isActive,
    start_date: row.start_date,
    end_date: endDateStr,
    expiry_date: endDateStr
  };
}

export const SubscriptionRepository = {
  async findAll(): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM subscriptions ORDER BY created_at DESC").catch(() => [[], []]);
    const dbSubs = ((rows as any[]) || []).map(formatSubRow);

    // Auto-reconcile with completed payments in payments table to guarantee no subscription is ever lost
    try {
      const [payRows]: any = await pool.query(
        "SELECT * FROM payments WHERE (status = 'completed' OR status = 'confirmed') AND (related_type = 'subscription' OR related_id LIKE '%month%' OR related_id = 'permanent') AND (payment_method != 'admin_manual' AND (gateway IS NULL OR gateway != 'admin_manual') AND id NOT LIKE 'pay_manual_%' AND id NOT LIKE 'manual_%') ORDER BY created_at DESC"
      );
      if (Array.isArray(payRows) && payRows.length > 0) {
        const existingSubIds = new Set(dbSubs.map(s => String(s.id)));
        const existingPayIds = new Set(dbSubs.map(s => String(s.payment_id || s.paymentId)).filter(Boolean));

        for (const pay of payRows) {
          const subId = `sub_pay_${pay.id}`;
          const planId = pay.related_id || "1_month";
          const userKey = pay.user_id || pay.user_phone || "unknown";

          if (!existingSubIds.has(subId) && !existingPayIds.has(String(pay.id))) {
            const newSub = await this.create({
              id: subId,
              user_id: userKey,
              plan_id: planId,
              payment_id: pay.id,
              status: "active",
              start_date: pay.created_at || new Date().toISOString()
            }).catch(() => null);

            if (newSub) {
              dbSubs.push(newSub);
              existingSubIds.add(newSub.id);
              existingPayIds.add(String(pay.id));
            }
          }
        }
      }
    } catch {
      // Ignore payment sync error
    }

    return dbSubs;
  },

  async findById(id: string): Promise<any | null> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM subscriptions WHERE id = ?", [id]);
    const arr = rows as any[];
    return arr.length > 0 ? formatSubRow(arr[0]) : null;
  },

  async findByUserId(userId: string, userPhone?: string): Promise<any[]> {
    const pool = getDbPool();
    let cleanPhone = userPhone ? String(userPhone).trim() : "";
    let cleanId = userId ? String(userId).trim() : "";

    // If only ID is provided, look up phone from users table
    if (cleanId && !cleanPhone) {
      try {
        const [uRows]: any = await pool.query("SELECT phone FROM users WHERE id = ?", [cleanId]);
        if (uRows && uRows.length > 0 && uRows[0].phone) {
          cleanPhone = String(uRows[0].phone).trim();
        }
      } catch {}
    }
    // If only phone is provided, look up ID from users table
    if (cleanPhone && !cleanId) {
      try {
        const [uRows]: any = await pool.query("SELECT id FROM users WHERE phone = ?", [cleanPhone]);
        if (uRows && uRows.length > 0 && uRows[0].id) {
          cleanId = String(uRows[0].id).trim();
        }
      } catch {}
    }

    try {
      const [rows]: any = await pool.query(
        `SELECT DISTINCT s.* FROM subscriptions s
         LEFT JOIN payments p ON s.payment_id = p.id
         WHERE (s.user_id = ? AND ? != '') 
            OR (s.user_id = ? AND ? != '')
            OR (p.user_id = ? AND ? != '')
            OR (p.card_number = ? AND ? != '')
         ORDER BY s.created_at DESC`,
        [cleanId, cleanId, cleanPhone, cleanPhone, cleanId, cleanId, cleanPhone, cleanPhone]
      );
      return ((rows as any[]) || []).map(formatSubRow);
    } catch {
      const [rows]: any = await pool.query(
        `SELECT * FROM subscriptions 
         WHERE (user_id = ? AND ? != '') 
            OR (user_id = ? AND ? != '') 
         ORDER BY created_at DESC`,
        [cleanId, cleanId, cleanPhone, cleanPhone]
      ).catch(() => [[], []]);
      return ((rows as any[]) || []).map(formatSubRow);
    }
  },

  async findActiveByUserId(userId: string, userPhone?: string): Promise<any | null> {
    const all = await this.findByUserId(userId, userPhone);
    const active = all
      .filter(s => (s.is_active || s.is_premium || s.status === 'active' || s.status === 'completed') && new Date(s.end_date) > new Date())
      .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
    return active.length > 0 ? active[0] : null;
  },

  async create(subData: any): Promise<any> {
    const id = subData.id || `sub_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    let rawUserId = String(subData.user_id || subData.userId || "").trim();

    const pool = getDbPool();
    let targetUserId = rawUserId;
    if (!targetUserId || targetUserId === "null" || targetUserId === "undefined") {
      targetUserId = `us_guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }

    const [uRows]: any = await pool.query("SELECT id, phone, full_name FROM users WHERE id = ? OR phone = ?", [targetUserId, targetUserId]).catch(() => [[], []]);
    if (uRows && uRows.length > 0) {
      targetUserId = uRows[0].id;
    } else {
      // Check technicians table before fallback
      const [tRows]: any = await pool.query("SELECT id, phone, name FROM technicians WHERE id = ? OR phone = ?", [targetUserId, targetUserId]).catch(() => [[], []]);
      const actualName = subData.user_name || subData.userName || (tRows && tRows.length > 0 ? tRows[0].name : "") || "کاربر کدیار";
      const phoneVal = (tRows && tRows.length > 0 ? tRows[0].phone : "") || (String(targetUserId).startsWith("09") ? targetUserId : (subData.phone || `0999${Math.floor(1000000 + Math.random() * 9000000)}`));
      const roleVal = tRows && tRows.length > 0 ? "technician" : "client";

      await pool.query(
        "INSERT INTO users (id, phone, full_name, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id",
        [targetUserId, phoneVal, actualName, roleVal]
      ).catch(() => {});
    }

    let planId = subData.plan_id || subData.planId || subData.plan || "1_month";
    let durationDays = Number(subData.duration_days || subData.durationDays) || 0;
    if (!durationDays) {
      if (planId === "1_month") durationDays = 30;
      else if (planId === "3_month") durationDays = 90;
      else if (planId === "6_month") durationDays = 180;
      else if (planId === "12_month") durationDays = 365;
      else if (planId === "permanent") durationDays = 36500;
      else durationDays = 30;
    }

    const planNameMap: Record<string, string> = {
      '1_month': 'اشتراک ۱ ماهه کدهای خطا',
      '3_month': 'اشتراک ۳ ماهه کدهای خطا',
      '6_month': 'اشتراک ۶ ماهه کدهای خطا',
      '12_month': 'اشتراک ۱۲ ماهه کدهای خطا',
      'permanent': 'اشتراک دائمی همکار / مدیریت'
    };

    let planName = subData.plan_name || subData.planName || "";
    if (!planName || ['1_month','3_month','6_month','12_month','permanent','gold'].includes(planName)) {
      planName = planNameMap[planId] || "اشتراک ویژه کدهای خطا";
    }

    const status = subData.status || "active";
    const paymentId = subData.payment_id || subData.paymentId || null;

    // Base time calculation
    let baseTime = new Date();
    if (!subData.reset_duration) {
      const activeExisting = await this.findActiveByUserId(targetUserId, rawUserId);
      if (activeExisting && new Date(activeExisting.end_date) > new Date()) {
        baseTime = new Date(activeExisting.end_date);
      }
    }

    let endDate: string;
    if (subData.end_date || subData.endDate || subData.expiry_date) {
      endDate = safeMySqlDate(subData.end_date || subData.endDate || subData.expiry_date);
    } else {
      const calcEndDate = new Date(baseTime.getTime() + durationDays * 24 * 60 * 60 * 1000);
      endDate = safeMySqlDate(calcEndDate);
    }

    const startDate = safeMySqlDate(subData.start_date || new Date());

    await pool.query(
      `INSERT INTO subscriptions (id, user_id, plan_id, plan_name, plan_type, payment_id, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       plan_id = VALUES(plan_id),
       plan_name = VALUES(plan_name),
       plan_type = VALUES(plan_type),
       payment_id = VALUES(payment_id),
       start_date = VALUES(start_date),
       end_date = VALUES(end_date),
       status = VALUES(status),
       updated_at = NOW()`,
      [id, targetUserId, planId, planName, planName, paymentId, startDate, endDate, status]
    );

    const created = await SubscriptionRepository.findById(id);
    return created || formatSubRow({
      id,
      user_id: targetUserId,
      plan_id: planId,
      plan_name: planName,
      plan_type: planName,
      payment_id: paymentId,
      start_date: startDate,
      end_date: endDate,
      status
    });
  },

  async update(id: string, updates: any): Promise<any | null> {
    const pool = getDbPool();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) { fields.push("status = ?"); values.push(updates.status); }
    if (updates.plan_name !== undefined || updates.planName !== undefined || updates.plan !== undefined) {
      fields.push("plan_name = ?");
      values.push(updates.plan_name ?? updates.planName ?? updates.plan);
    }
    if (updates.end_date !== undefined || updates.endDate !== undefined || updates.expiry_date !== undefined) {
      fields.push("end_date = ?");
      values.push(safeMySqlDate(updates.end_date ?? updates.endDate ?? updates.expiry_date));
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE subscriptions SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    return (await SubscriptionRepository.findById(id));
  },

  async deleteById(id: string): Promise<boolean> {
    const pool = getDbPool();
    const [result]: any = await pool.query("DELETE FROM subscriptions WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};
