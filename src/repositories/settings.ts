import { getDbPool, parseJsonColumn } from "../db/db";

const defaultSettingsDefaults: Record<string, any> = {
  smsSettings: { apiKey: "", lineNumber: "", provider: "ghasedak" },
  citiesList: [],
  brandsList: [],
  categoriesList: [],
  modelsList: [],
  commonProblems: [],
  adminAnnouncement: "",
  trustBadges: [],
  supportPhone: ""
};

export const SettingsRepository = {
  async getSettings(): Promise<any> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM settings");
    const result: any = { ...defaultSettingsDefaults };

    if (Array.isArray(rows)) {
      for (const row of rows as any[]) {
        result[row.setting_key] = parseJsonColumn(row.setting_value);
      }
    }

    delete result.adminPassword;
    return result;
  },

  async getSetting(key: string): Promise<any> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT setting_value FROM settings WHERE setting_key = ?", [key]);
    const arr = rows as any[];
    if (arr.length === 0) return defaultSettingsDefaults[key] ?? null;
    return parseJsonColumn(arr[0].setting_value);
  },

  async setSetting(key: string, value: any): Promise<void> {
    const pool = getDbPool();
    const valStr = typeof value === "object" ? JSON.stringify(value) : String(value);
    await pool.query(
      `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      [key, valStr]
    );
  },

  async updateSettings(updates: Record<string, any>): Promise<any> {
    for (const [k, v] of Object.entries(updates)) {
      await SettingsRepository.setSetting(k, v);
    }
    return SettingsRepository.getSettings();
  }
};
