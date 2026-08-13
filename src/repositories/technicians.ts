import { getDbPool, parseJsonColumn } from "../db/db";

function formatTechnicianRow(row: any): any {
  if (!row) return null;
  const specialties = Array.isArray(row.specialties) ? row.specialties : (typeof row.specialties === 'string' && row.specialties.startsWith('[') ? parseJsonColumn(row.specialties) || [] : (row.specialties ? [row.specialties] : []));
  const documents = Array.isArray(row.documents) ? row.documents : parseJsonColumn(row.documents) || [];

  return {
    ...row,
    id: row.id,
    userId: row.user_id || row.userId || null,
    name: row.full_name || row.fullName || row.name || "",
    full_name: row.full_name || row.fullName || row.name || "",
    phone: row.phone || "",
    nationalId: row.national_id || row.nationalId || "",
    city: row.city || "تهران",
    activeLocation: row.active_location || row.activeLocation || row.city || "تهران",
    specialty: Array.isArray(specialties) ? specialties : [String(specialties)],
    specialties: Array.isArray(specialties) ? specialties : [String(specialties)],
    rating: Number(row.rating) || 5.0,
    completedOrders: Number(row.completed_orders || row.completedOrders || 0),
    balance: Number(row.wallet_balance || row.balance || 0),
    walletBalance: Number(row.wallet_balance || row.balance || 0),
    isVerified: row.is_verified !== 0 && row.is_verified !== false && row.is_verified !== "0" && row.is_verified !== undefined,
    documents: Array.isArray(documents) ? documents : [],
    avatarUrl: row.avatar_url || row.avatarUrl || ""
  };
}

export const TechnicianRepository = {
  async findAll(): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM technicians");
    const formatted = (rows as any[]).map(formatTechnicianRow);
    return formatted.sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeB - timeA;
    });
  },

  async findById(id: string): Promise<any | null> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM technicians WHERE id = ? OR phone = ? OR user_id = ?", [id, id, id]);
    const arr = rows as any[];
    return arr.length > 0 ? formatTechnicianRow(arr[0]) : null;
  },

  async create(techData: any): Promise<any> {
    const id = techData.id || `tech_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const userId = techData.user_id || techData.userId || null;
    const fullName = techData.full_name || techData.fullName || techData.name || "";
    const phone = techData.phone || "";
    const nationalId = techData.national_id || techData.nationalId || "";
    const city = techData.city || techData.activeLocation || "تهران";
    const status = techData.status || "active";
    const rating = techData.rating || 5;
    const completedOrders = techData.completedOrders || techData.completed_orders || 0;
    const specialties = typeof techData.specialties === "object" ? JSON.stringify(techData.specialties) : (typeof techData.specialty === "object" ? JSON.stringify(techData.specialty) : (techData.specialties || "[]"));
    const avatarUrl = techData.avatar_url || techData.avatarUrl || null;
    const walletBalance = techData.wallet_balance || techData.walletBalance || techData.balance || 0;
    const isVerified = techData.isVerified !== undefined ? (techData.isVerified ? 1 : 0) : (techData.is_verified !== undefined ? (techData.is_verified ? 1 : 0) : 1);
    const documents = typeof techData.documents === "object" ? JSON.stringify(techData.documents) : "[]";
    const activeLocation = techData.activeLocation || techData.active_location || city;

    const pool = getDbPool();
    await pool.query(
      `INSERT INTO technicians (id, user_id, phone, full_name, national_id, city, specialties, avatar_url, status, rating, completed_orders, wallet_balance, is_verified, documents, active_location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         user_id = COALESCE(VALUES(user_id), user_id),
         full_name = VALUES(full_name),
         city = VALUES(city),
         specialties = VALUES(specialties),
         documents = VALUES(documents),
         active_location = VALUES(active_location),
         is_verified = VALUES(is_verified)`,
      [id, userId, phone, fullName, nationalId, city, specialties, avatarUrl, status, rating, completedOrders, walletBalance, isVerified, documents, activeLocation]
    );

    return (await TechnicianRepository.findById(id));
  },

  async update(id: string, updates: any): Promise<any | null> {
    const pool = getDbPool();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.full_name !== undefined || updates.fullName !== undefined || updates.name !== undefined) {
      fields.push("full_name = ?");
      values.push(updates.full_name ?? updates.fullName ?? updates.name);
    }
    if (updates.phone !== undefined) { fields.push("phone = ?"); values.push(updates.phone); }
    if (updates.national_id !== undefined || updates.nationalId !== undefined) {
      fields.push("national_id = ?");
      values.push(updates.national_id ?? updates.nationalId);
    }
    if (updates.city !== undefined || updates.activeLocation !== undefined) {
      fields.push("city = ?");
      values.push(updates.city ?? updates.activeLocation);
    }
    if (updates.status !== undefined) { fields.push("status = ?"); values.push(updates.status); }
    if (updates.rating !== undefined) { fields.push("rating = ?"); values.push(updates.rating); }
    if (updates.completed_orders !== undefined || updates.completedOrders !== undefined) {
      fields.push("completed_orders = ?");
      values.push(updates.completed_orders ?? updates.completedOrders);
    }
    if (updates.specialties !== undefined || updates.specialty !== undefined) {
      fields.push("specialties = ?");
      const spec = updates.specialties ?? updates.specialty;
      values.push(typeof spec === "object" ? JSON.stringify(spec) : String(spec));
    }
    if (updates.avatar_url !== undefined || updates.avatarUrl !== undefined) {
      fields.push("avatar_url = ?");
      values.push(updates.avatar_url ?? updates.avatarUrl);
    }
    if (updates.wallet_balance !== undefined || updates.walletBalance !== undefined || updates.balance !== undefined) {
      fields.push("wallet_balance = ?");
      values.push(updates.wallet_balance ?? updates.walletBalance ?? updates.balance);
    }
    if (updates.isVerified !== undefined || updates.is_verified !== undefined) {
      fields.push("is_verified = ?");
      const v = updates.isVerified ?? updates.is_verified;
      values.push(v ? 1 : 0);
    }
    if (updates.documents !== undefined) {
      fields.push("documents = ?");
      values.push(typeof updates.documents === "object" ? JSON.stringify(updates.documents) : String(updates.documents));
    }
    if (updates.activeLocation !== undefined || updates.active_location !== undefined) {
      fields.push("active_location = ?");
      values.push(updates.activeLocation ?? updates.active_location);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE technicians SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    return (await TechnicianRepository.findById(id));
  },

  async deleteById(id: string): Promise<boolean> {
    const pool = getDbPool();
    const [result]: any = await pool.query("DELETE FROM technicians WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};
