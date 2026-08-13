import { getDbPool } from "../db/db";

export interface SessionRecord {
  id: string;
  user_id: string;
  token: string;
  refresh_token?: string;
  user_agent?: string;
  ip?: string;
  expires_at: Date;
  created_at?: Date;
}

export const SessionRepository = {
  async create(session: {
    id?: string;
    user_id: string;
    token: string;
    refresh_token?: string;
    user_agent?: string;
    ip?: string;
    expires_at: Date;
  }): Promise<SessionRecord> {
    const id = session.id || `sess_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const rec: SessionRecord = {
      id,
      user_id: session.user_id,
      token: session.token,
      refresh_token: session.refresh_token,
      user_agent: session.user_agent,
      ip: session.ip,
      expires_at: session.expires_at,
      created_at: new Date()
    };

    const pool = getDbPool();
    await pool.query(
      `INSERT INTO sessions (id, user_id, token, refresh_token, user_agent, ip, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        session.user_id,
        session.token,
        session.refresh_token || null,
        session.user_agent || null,
        session.ip || null,
        session.expires_at
      ]
    );

    return rec;
  },

  async findByToken(token: string): Promise<SessionRecord | null> {
    const pool = getDbPool();
    const [rows]: any = await pool.query(
      "SELECT * FROM sessions WHERE token = ? AND expires_at > NOW()",
      [token]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async findByRefreshToken(refreshToken: string): Promise<SessionRecord | null> {
    const pool = getDbPool();
    const [rows]: any = await pool.query(
      "SELECT * FROM sessions WHERE refresh_token = ? AND expires_at > NOW()",
      [refreshToken]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async deleteByToken(token: string): Promise<boolean> {
    const pool = getDbPool();
    const [result]: any = await pool.query("DELETE FROM sessions WHERE token = ?", [token]);
    return result.affectedRows > 0;
  },

  async deleteByRefreshToken(refreshToken: string): Promise<boolean> {
    const pool = getDbPool();
    const [result]: any = await pool.query("DELETE FROM sessions WHERE refresh_token = ?", [refreshToken]);
    return result.affectedRows > 0;
  },

  async deleteByUserId(userId: string): Promise<boolean> {
    const pool = getDbPool();
    const [result]: any = await pool.query("DELETE FROM sessions WHERE user_id = ?", [userId]);
    return result.affectedRows > 0;
  }
};
