import { getDbPool, parseJsonColumn } from "../db/db";
import fs from "fs";
import path from "path";
import { logger } from "../utils/logger";

function formatErrorCodeRow(row: any): any {
  if (!row) return null;
  const causes = Array.isArray(row.causes) ? row.causes : parseJsonColumn(row.causes) || [];
  const steps = Array.isArray(row.steps) ? row.steps : parseJsonColumn(row.steps) || [];
  const precautions = Array.isArray(row.precautions) ? row.precautions : parseJsonColumn(row.precautions) || [];

  return {
    ...row,
    id: row.id,
    code: row.code || "",
    category: row.category || "",
    brand: row.brand || "",
    model: row.model || "",
    title: row.title || row.title_fa || "",
    description: row.description || row.cause || "",
    causes: Array.isArray(causes) ? causes : (causes ? [String(causes)] : []),
    steps: Array.isArray(steps) ? steps : (steps ? [String(steps)] : []),
    precautions: Array.isArray(precautions) ? precautions : (precautions ? [String(precautions)] : []),
    hazardLevel: row.hazard_level || row.hazardLevel || "medium",
    solution: row.solution || (Array.isArray(steps) ? steps.join("\n") : ""),
    isApproved: row.is_approved !== 0 && row.is_approved !== false && row.is_approved !== "0" && row.is_approved !== undefined,
    submittedBy: row.submitted_by || row.submittedBy || "",
    submittedAt: row.submitted_at || row.submittedAt || "",
    videoUrl: row.video_url || row.videoUrl || "",
    audioUrl: row.audio_url || row.audioUrl || "",
    techPdfUrl: row.tech_pdf_url || row.techPdfUrl || "",
    diagramUrl: row.diagram_url || row.diagramUrl || ""
  };
}

export const ErrorCodeRepository = {
  async findAll(): Promise<any[]> {
    const pool = getDbPool();
    const [rows]: any = await pool.query("SELECT * FROM error_codes ORDER BY created_at DESC");
    return (rows || []).map(formatErrorCodeRow);
  },

  async findById(id: string): Promise<any | null> {
    const pool = getDbPool();
    const [rows]: any = await pool.query("SELECT * FROM error_codes WHERE id = ?", [id]);
    if (rows && rows.length > 0) {
      return formatErrorCodeRow(rows[0]);
    }
    return null;
  },

  async findByCodeBrandModel(code: string, brand: string, model: string): Promise<any | null> {
    const pool = getDbPool();
    const [rows]: any = await pool.query(
      "SELECT * FROM error_codes WHERE UPPER(TRIM(code)) = UPPER(TRIM(?)) AND LOWER(TRIM(brand)) = LOWER(TRIM(?)) AND LOWER(TRIM(model)) = LOWER(TRIM(?))",
      [code, brand, model]
    );
    if (rows && rows.length > 0) {
      return formatErrorCodeRow(rows[0]);
    }

    // Secondary fallback search by code and brand if model is generic
    const [secondaryRows]: any = await pool.query(
      "SELECT * FROM error_codes WHERE UPPER(TRIM(code)) = UPPER(TRIM(?)) AND LOWER(TRIM(brand)) = LOWER(TRIM(?))",
      [code, brand]
    );
    if (secondaryRows && secondaryRows.length > 0) {
      return formatErrorCodeRow(secondaryRows[0]);
    }

    return null;
  },

  async create(errData: any): Promise<any> {
    const id = errData.id || `err_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const code = String(errData.code || "").trim();
    const brand = String(errData.brand || "").trim();
    const model = String(errData.model || "").trim();
    const category = String(errData.category || "").trim();
    const title = String(errData.title || errData.title_fa || "").trim();
    const description = String(errData.description || errData.cause || "").trim();

    const causes = Array.isArray(errData.causes) ? JSON.stringify(errData.causes) : (typeof errData.causes === "string" ? JSON.stringify(errData.causes.split("\n").filter(Boolean)) : JSON.stringify([]));
    const steps = Array.isArray(errData.steps) ? JSON.stringify(errData.steps) : (typeof errData.steps === "string" ? JSON.stringify(errData.steps.split("\n").filter(Boolean)) : JSON.stringify([]));
    const precautions = Array.isArray(errData.precautions) ? JSON.stringify(errData.precautions) : (typeof errData.precautions === "string" ? JSON.stringify(errData.precautions.split("\n").filter(Boolean)) : JSON.stringify([]));
    const hazardLevel = String(errData.hazardLevel || errData.hazard_level || "medium");
    const solution = String(errData.solution || "");
    const isApproved = errData.isApproved !== undefined ? (errData.isApproved ? 1 : 0) : (errData.is_approved !== undefined ? (errData.is_approved ? 1 : 0) : 1);
    const submittedBy = String(errData.submittedBy || errData.submitted_by || "");
    const submittedAt = String(errData.submittedAt || errData.submitted_at || "");
    const videoUrl = String(errData.videoUrl || errData.video_url || "");
    const audioUrl = String(errData.audioUrl || errData.audio_url || "");
    const techPdfUrl = String(errData.techPdfUrl || errData.tech_pdf_url || "");
    const diagramUrl = String(errData.diagramUrl || errData.diagram_url || "");

    const pool = getDbPool();
    await pool.query(
      `INSERT INTO error_codes (id, code, brand, model, category, title, description, causes, steps, precautions, hazard_level, solution, is_approved, submitted_by, submitted_at, video_url, audio_url, tech_pdf_url, diagram_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, code, brand, model, category, title, description, causes, steps, precautions, hazardLevel, solution, isApproved, submittedBy, submittedAt, videoUrl, audioUrl, techPdfUrl, diagramUrl]
    );

    return (await ErrorCodeRepository.findById(id));
  },

  async update(id: string, updates: any): Promise<any | null> {
    const pool = getDbPool();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.code !== undefined) { fields.push("code = ?"); values.push(String(updates.code).trim()); }
    if (updates.brand !== undefined) { fields.push("brand = ?"); values.push(String(updates.brand).trim()); }
    if (updates.model !== undefined) { fields.push("model = ?"); values.push(String(updates.model).trim()); }
    if (updates.category !== undefined) { fields.push("category = ?"); values.push(String(updates.category).trim()); }
    if (updates.title !== undefined) { fields.push("title = ?"); values.push(String(updates.title).trim()); }
    if (updates.description !== undefined) { fields.push("description = ?"); values.push(String(updates.description).trim()); }

    if (updates.causes !== undefined) {
      fields.push("causes = ?");
      values.push(Array.isArray(updates.causes) ? JSON.stringify(updates.causes) : (typeof updates.causes === "string" ? JSON.stringify(updates.causes.split("\n").filter(Boolean)) : JSON.stringify([])));
    }
    if (updates.steps !== undefined) {
      fields.push("steps = ?");
      values.push(Array.isArray(updates.steps) ? JSON.stringify(updates.steps) : (typeof updates.steps === "string" ? JSON.stringify(updates.steps.split("\n").filter(Boolean)) : JSON.stringify([])));
    }
    if (updates.precautions !== undefined) {
      fields.push("precautions = ?");
      values.push(Array.isArray(updates.precautions) ? JSON.stringify(updates.precautions) : (typeof updates.precautions === "string" ? JSON.stringify(updates.precautions.split("\n").filter(Boolean)) : JSON.stringify([])));
    }
    if (updates.hazardLevel !== undefined || updates.hazard_level !== undefined) {
      fields.push("hazard_level = ?");
      values.push(String(updates.hazardLevel || updates.hazard_level || "medium"));
    }
    if (updates.solution !== undefined) {
      fields.push("solution = ?");
      values.push(String(updates.solution));
    }
    if (updates.isApproved !== undefined || updates.is_approved !== undefined) {
      fields.push("is_approved = ?");
      const val = updates.isApproved !== undefined ? updates.isApproved : updates.is_approved;
      values.push(val ? 1 : 0);
    }
    if (updates.submittedBy !== undefined || updates.submitted_by !== undefined) {
      fields.push("submitted_by = ?");
      values.push(String(updates.submittedBy ?? updates.submitted_by ?? ""));
    }
    if (updates.submittedAt !== undefined || updates.submitted_at !== undefined) {
      fields.push("submitted_at = ?");
      values.push(String(updates.submittedAt ?? updates.submitted_at ?? ""));
    }
    if (updates.videoUrl !== undefined || updates.video_url !== undefined) {
      fields.push("video_url = ?");
      values.push(String(updates.videoUrl ?? updates.video_url ?? ""));
    }
    if (updates.audioUrl !== undefined || updates.audio_url !== undefined) {
      fields.push("audio_url = ?");
      values.push(String(updates.audioUrl ?? updates.audio_url ?? ""));
    }
    if (updates.techPdfUrl !== undefined || updates.tech_pdf_url !== undefined) {
      fields.push("tech_pdf_url = ?");
      values.push(String(updates.techPdfUrl ?? updates.tech_pdf_url ?? ""));
    }
    if (updates.diagramUrl !== undefined || updates.diagram_url !== undefined) {
      fields.push("diagram_url = ?");
      values.push(String(updates.diagramUrl ?? updates.diagram_url ?? ""));
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE error_codes SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    return (await ErrorCodeRepository.findById(id));
  },

  async deleteById(id: string): Promise<boolean> {
    const pool = getDbPool();
    const [result]: any = await pool.query("DELETE FROM error_codes WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};

