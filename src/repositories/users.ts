import { getDbPool } from "../db/db";

function formatUserRow(row: any): any {
  if (!row) return null;
  return {
    ...row,
    id: row.id,
    phone: row.phone || "",
    fullName: row.full_name || row.fullName || row.name || "",
    full_name: row.full_name || row.fullName || row.name || "",
    role: row.role || "user",
    isSuperAdmin: row.is_super_admin !== 0 && row.is_super_admin !== false && row.is_super_admin !== "0" && row.is_super_admin !== undefined,
    is_super_admin: row.is_super_admin !== 0 && row.is_super_admin !== false && row.is_super_admin !== "0" && row.is_super_admin !== undefined ? 1 : 0,
    city: row.city || "",
    address: row.address || "",
    walletBalance: Number(row.wallet_balance || row.walletBalance || 0),
    wallet_balance: Number(row.wallet_balance || row.walletBalance || 0),
    status: row.status || "active"
  };
}

export const UserRepository = {
  async findAll(): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM users ORDER BY created_at DESC");
    return (rows as any[]).map(formatUserRow);
  },

  async findById(id: string): Promise<any | null> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    const arr = rows as any[];
    return arr.length > 0 ? formatUserRow(arr[0]) : null;
  },

  async findByPhone(phone: string): Promise<any | null> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM users WHERE phone = ?", [phone]);
    const arr = rows as any[];
    return arr.length > 0 ? formatUserRow(arr[0]) : null;
  },

  async create(userData: any): Promise<any> {
    const id = userData.id || `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const phone = userData.phone || "";
    const fullName = userData.full_name || userData.fullName || userData.name || "";
    const role = userData.role || "user";
    const isSuperAdmin = (userData.is_super_admin || userData.isSuperAdmin) ? 1 : 0;
    const city = userData.city || "";
    const address = userData.address || "";
    const passwordHash = userData.password_hash || userData.passwordHash || "";
    const walletBalance = userData.wallet_balance ?? userData.walletBalance ?? 0;
    const status = userData.status || "active";

    const pool = getDbPool();
    await pool.query(
      `INSERT INTO users (id, phone, full_name, role, is_super_admin, city, address, password_hash, wallet_balance, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, phone, fullName, role, isSuperAdmin, city, address, passwordHash, walletBalance, status]
    );

    return (await UserRepository.findById(id));
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
    if (updates.role !== undefined) { fields.push("role = ?"); values.push(updates.role); }
    if (updates.is_super_admin !== undefined || updates.isSuperAdmin !== undefined) {
      fields.push("is_super_admin = ?");
      const isa = updates.is_super_admin ?? updates.isSuperAdmin;
      values.push(isa ? 1 : 0);
    }
    if (updates.city !== undefined) { fields.push("city = ?"); values.push(updates.city); }
    if (updates.address !== undefined) { fields.push("address = ?"); values.push(updates.address); }
    if (updates.status !== undefined) { fields.push("status = ?"); values.push(updates.status); }
    if (updates.password_hash !== undefined || updates.passwordHash !== undefined) {
      fields.push("password_hash = ?");
      values.push(updates.password_hash ?? updates.passwordHash);
    }
    if (updates.wallet_balance !== undefined || updates.walletBalance !== undefined) {
      fields.push("wallet_balance = ?");
      values.push(updates.wallet_balance ?? updates.walletBalance);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    return (await UserRepository.findById(id));
  },

  async deleteById(id: string): Promise<boolean> {
    const pool = getDbPool();
    const [result]: any = await pool.query("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};
