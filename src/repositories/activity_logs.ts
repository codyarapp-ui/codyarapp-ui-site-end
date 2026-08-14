import { getDbPool } from "../db/db";

function formatActivityLogRow(row: any): any {
  if (!row) return null;
  let parsedDetails = null;
  if (row.details) {
    try {
      parsedDetails = typeof row.details === "string" ? JSON.parse(row.details) : row.details;
    } catch {
      parsedDetails = row.details;
    }
  }
  return {
    ...row,
    id: row.id,
    user_id: row.user_id,
    userId: row.user_id,
    user_name: row.user_name || "",
    userName: row.user_name || "",
    user_role: row.user_role || "",
    action: row.action,
    module: row.module || "",
    ip: row.ip || "",
    user_agent: row.user_agent || "",
    details: parsedDetails,
    created_at: row.created_at
  };
}

export const ActivityLogRepository = {
  async findAll(limit = 200): Promise<any[]> {
    try {
      const pool = getDbPool();
      const [rows] = await pool.query(
        "SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?",
        [Number(limit) || 200]
      );
      return (rows as any[]).map(formatActivityLogRow);
    } catch (err) {
      console.error("[ActivityLogRepository.findAll] error:", err);
      return [];
    }
  },

  async findByUserId(userId: string, limit = 100): Promise<any[]> {
    try {
      const pool = getDbPool();
      const [rows] = await pool.query(
        "SELECT * FROM activity_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
        [userId, Number(limit) || 100]
      );
      return (rows as any[]).map(formatActivityLogRow);
    } catch (err) {
      console.error("[ActivityLogRepository.findByUserId] error:", err);
      return [];
    }
  },

  async create(data: {
    id?: string;
    user_id?: string | null;
    user_name?: string;
    user_role?: string;
    action: string;
    module?: string;
    ip?: string;
    user_agent?: string;
    details?: any;
  }): Promise<any> {
    try {
      const id = data.id || `act_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const userId = data.user_id || null;
      const userName = data.user_name || "";
      const userRole = data.user_role || "";
      const action = data.action || "action";
      const moduleName = data.module || "general";
      const ip = data.ip || "";
      const userAgent = data.user_agent || "";
      const detailsStr = data.details
        ? typeof data.details === "string"
          ? data.details
          : JSON.stringify(data.details)
        : null;

      const pool = getDbPool();
      await pool.query(
        `INSERT INTO activity_logs (id, user_id, user_name, user_role, action, module, ip, user_agent, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, userId, userName, userRole, action, moduleName, ip, userAgent, detailsStr]
      );

      return { id, user_id: userId, action, module: moduleName, created_at: new Date() };
    } catch (err) {
      console.error("[ActivityLogRepository.create] error:", err);
      return null;
    }
  }
};
