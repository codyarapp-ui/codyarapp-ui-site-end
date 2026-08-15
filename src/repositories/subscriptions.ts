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
    const [rows] = await pool.query("SELECT * FROM subscriptions ORDER BY created_at DESC");
    return (rows as any[]).map(formatSubRow);
  },

  async findById(id: string): Promise<any | null> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM subscriptions WHERE id = ?", [id]);
    const arr = rows as any[];
    return arr.length > 0 ? formatSubRow(arr[0]) : null;
  },

  async findByUserId(userId: string, userPhone?: string): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query(
      `SELECT * FROM subscriptions 
       WHERE (user_id = ? AND ? != '') 
          OR (user_id = ? AND ? != '') 
       ORDER BY created_at DESC`,
      [userId || "", userId || "", userPhone || "", userPhone || ""]
    );
    return (rows as any[]).map(formatSubRow);
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
    const rawUserId = subData.user_id || subData.userId || "";

    const pool = getDbPool();
    let targetUserId = rawUserId;
    if (rawUserId) {
      const [uRows]: any = await pool.query("SELECT id, phone FROM users WHERE id = ? OR phone = ?", [rawUserId, rawUserId]);
      if (uRows.length > 0) {
        targetUserId = uRows[0].id;
      }
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

    // If user already has an active subscription, extend from its expiry date
    const activeExisting = await this.findActiveByUserId(targetUserId, rawUserId);
    let baseTime = new Date();
    if (activeExisting && new Date(activeExisting.end_date) > new Date()) {
      baseTime = new Date(activeExisting.end_date);
    }

    let endDate: string;
    if (subData.end_date || subData.endDate || subData.expiry_date) {
      endDate = safeMySqlDate(subData.end_date || subData.endDate || subData.expiry_date);
    } else {
      const calcEndDate = new Date(baseTime.getTime() + durationDays * 24 * 60 * 60 * 1000);
      endDate = safeMySqlDate(calcEndDate);
    }

    const startDate = safeMySqlDate(subData.start_date || new Date());
    const price = Number(subData.price) || 0;

    await pool.query(
      `INSERT INTO subscriptions (id, user_id, plan_name, plan_id, status, start_date, end_date, price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       plan_name = VALUES(plan_name),
       plan_id = VALUES(plan_id),
       status = VALUES(status),
       start_date = VALUES(start_date),
       end_date = VALUES(end_date),
       price = VALUES(price)`,
      [id, targetUserId, planName, planId, status, startDate, endDate, price]
    );

    return (await SubscriptionRepository.findById(id));
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
