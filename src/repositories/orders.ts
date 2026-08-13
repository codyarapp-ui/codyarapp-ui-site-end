import { getDbPool, parseJsonColumn } from "../db/db";
import { OrderStatusHistoryRepository } from "./order_status_history";

function normalizePhoneDigits(rawPhone: string): string {
  if (!rawPhone) return "";
  let p = String(rawPhone).trim().replace(/\D/g, "");
  if (p.startsWith("0098")) p = "0" + p.slice(4);
  if (p.startsWith("98") && p.length > 10) p = "0" + p.slice(2);
  if (p.length === 10 && p.startsWith("9")) p = "0" + p;
  return p;
}

function parseAppOrderFields(orderData: any) {
  const desc = String(orderData.problem_description || orderData.problemDescription || orderData.description || "");
  let category = orderData.category || orderData.appliance || "";
  let brand = orderData.brand || "";
  let model = orderData.model || "";
  let errorCode = orderData.error_code || orderData.errorCode || "";
  let customerPhone = orderData.customer_phone || orderData.customerPhone || "";
  let date = orderData.date || "";
  let timeSlot = orderData.time_slot || orderData.timeSlot || "";
  let address = orderData.address || "";

  if (desc && (desc.includes("دستگاه") || desc.includes("خرابی") || desc.includes("مراجعه") || desc.includes("کد"))) {
    // 1. Category extraction
    const catMatch = desc.match(/دستگاه(?:\s*و\s*برند)?\s*:\s*([^ش\n\r]+?)(?=\s*(?:شرح خرابی|کد|زمان|تلفن|$))/);
    if (catMatch && (!category || category === "خدمات عمومی" || category === "عمومی")) {
      const extracted = catMatch[1].trim();
      if (extracted) category = extracted;
    }

    // 2. Error code extraction
    const errMatch = desc.match(/(?:کد\s*خطا|کد|ارور)\s*:?\s*([A-Za-z0-9\-_]+)/i);
    if (errMatch && !errorCode) {
      errorCode = errMatch[1].trim();
    }

    // 3. Preferred visit date/time extraction
    const timeMatch = desc.match(/زمان(?:\s*پیشنهادی)?(?:\s*مراجعه\s*کارشناس)?\s*:\s*([^ت\n\r]+?)(?=\s*(?:تلفن|$))/);
    if (timeMatch) {
      const extractedTime = timeMatch[1].trim();
      if (extractedTime && (!date || date.includes("T"))) {
        date = extractedTime;
      }
    }

    // 4. Phone extraction
    const phoneMatch = desc.match(/(?:تلفن|تماس|موبایل)(?:\s*تماس)?(?:\s*هماهنگی)?\s*:\s*(0?9\d{9})/);
    if (phoneMatch && (!customerPhone || customerPhone === "09120000000")) {
      customerPhone = phoneMatch[1].trim();
    }
  }

  // Safe keyword appliance classification if still generic
  if ((!category || category === "خدمات عمومی" || category === "عمومی") && desc) {
    if (desc.includes("لباسشویی")) category = "ماشین لباسشویی";
    else if (desc.includes("ظرفشویی")) category = "ماشین ظرفشویی";
    else if (desc.includes("پکیج")) category = "پکیج دیواری";
    else if (desc.includes("یخچال")) category = "یخچال فریزر";
    else if (desc.includes("کولر") || desc.includes("اسپلیت")) category = "کولر گازی";
    else if (desc.includes("اجاق") || desc.includes("گاز")) category = "اجاق گاز";
  }

  return {
    ...orderData,
    category: category || "خدمات عمومی",
    brand: brand || "",
    model: model || "",
    errorCode,
    customerPhone: normalizePhoneDigits(customerPhone) || customerPhone,
    date,
    timeSlot,
    address
  };
}

function formatOrderRow(row: any): any {
  if (!row) return null;
  const mediaUrls = Array.isArray(row.media_urls) ? row.media_urls : parseJsonColumn(row.media_urls) || [];

  return {
    ...row,
    id: row.id,
    userId: row.user_id || row.userId || null,
    user_id: row.user_id || row.userId || null,
    technicianId: row.technician_id || row.technicianId || null,
    technician_id: row.technician_id || row.technicianId || null,
    customerName: row.customer_name || row.customerName || "",
    customer_name: row.customer_name || row.customerName || "",
    customerPhone: row.customer_phone || row.customerPhone || "",
    customer_phone: row.customer_phone || row.customerPhone || "",
    category: row.category || "",
    appliance: row.category || row.appliance || "",
    brand: row.brand || "",
    model: row.model || "",
    errorCode: row.error_code || row.errorCode || "",
    error_code: row.error_code || row.errorCode || "",
    description: row.problem_description || row.description || "",
    problem_description: row.problem_description || row.description || "",
    problemDescription: row.problem_description || row.description || "",
    address: row.address || "",
    city: row.city || "",
    region: row.region || "",
    status: row.status || "pending",
    amount: Number(row.amount) || 0,
    report: row.report || "",
    technicianName: row.technician_name || row.technicianName || "",
    technician_name: row.technician_name || row.technicianName || "",
    technicianPhone: row.technician_phone || row.technicianPhone || "",
    technician_phone: row.technician_phone || row.technicianPhone || "",
    date: row.date || row.created_at || "",
    timeSlot: row.time_slot || row.timeSlot || "",
    time_slot: row.time_slot || row.timeSlot || "",
    mediaUrls: Array.isArray(mediaUrls) ? mediaUrls : [],
    media_urls: Array.isArray(mediaUrls) ? mediaUrls : [],
    createdAt: row.created_at || row.createdAt || new Date().toISOString(),
    created_at: row.created_at || row.createdAt || new Date().toISOString()
  };
}

export const OrderRepository = {
  async findAll(): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM orders ORDER BY created_at DESC");
    const orders = (rows as any[]).map(formatOrderRow);
    for (const o of orders) {
      o.trackingHistory = await OrderStatusHistoryRepository.findAll(o.id);
    }
    return orders;
  },

  async findById(id: string): Promise<any | null> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM orders WHERE id = ?", [id]);
    const arr = rows as any[];
    if (arr.length === 0) return null;
    const order = formatOrderRow(arr[0]);
    order.trackingHistory = await OrderStatusHistoryRepository.findAll(order.id);
    return order;
  },

  async findByUserId(userId: string): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", [userId]);
    const orders = (rows as any[]).map(formatOrderRow);
    for (const o of orders) {
      o.trackingHistory = await OrderStatusHistoryRepository.findAll(o.id);
    }
    return orders;
  },

  async findByTechnicianId(techId: string): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM orders WHERE technician_id = ? ORDER BY created_at DESC", [techId]);
    const orders = (rows as any[]).map(formatOrderRow);
    for (const o of orders) {
      o.trackingHistory = await OrderStatusHistoryRepository.findAll(o.id);
    }
    return orders;
  },

  async create(rawOrderData: any): Promise<any> {
    const orderData = parseAppOrderFields(rawOrderData || {});
    const id = orderData.id || `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const userId = orderData.user_id || orderData.userId || null;
    const techId = orderData.technician_id || orderData.technicianId || null;
    const category = orderData.category || "";
    const brand = orderData.brand || "";
    const model = orderData.model || "";
    const errorCode = orderData.error_code || orderData.errorCode || "";
    const problemDesc = orderData.problem_description || orderData.problemDescription || orderData.description || "";
    const customerName = orderData.customer_name || orderData.customerName || "";
    const customerPhone = orderData.customer_phone || orderData.customerPhone || "";
    const address = orderData.address || "";
    const city = orderData.city || "";
    const region = orderData.region || "";
    const status = orderData.status || "pending";
    const amount = orderData.amount || 0;
    const report = orderData.report || "";
    const technicianName = orderData.technician_name || orderData.technicianName || "";
    const technicianPhone = orderData.technician_phone || orderData.technicianPhone || "";
    const date = orderData.date || "";
    const timeSlot = orderData.time_slot || orderData.timeSlot || "";
    const mediaUrls = typeof orderData.mediaUrls === "object" ? JSON.stringify(orderData.mediaUrls) : (typeof orderData.media_urls === "object" ? JSON.stringify(orderData.media_urls) : "[]");

    const pool = getDbPool();
    await pool.query(
      `INSERT INTO orders (id, user_id, technician_id, category, brand, model, error_code, problem_description, customer_name, customer_phone, address, city, region, status, amount, report, technician_name, technician_phone, date, time_slot, media_urls)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, techId, category, brand, model, errorCode, problemDesc, customerName, customerPhone, address, city, region, status, amount, report, technicianName, technicianPhone, date, timeSlot, mediaUrls]
    );

    await OrderStatusHistoryRepository.create(id, {
      status,
      title: `ثبت سفارش جدید`,
      updated_by: customerName || "مشتری"
    });

    return (await OrderRepository.findById(id));
  },

  async update(id: string, updates: any): Promise<any | null> {
    const pool = getDbPool();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.user_id !== undefined || updates.userId !== undefined) {
      fields.push("user_id = ?");
      values.push(updates.user_id ?? updates.userId);
    }
    if (updates.technician_id !== undefined || updates.technicianId !== undefined) {
      fields.push("technician_id = ?");
      values.push(updates.technician_id ?? updates.technicianId);
    }
    if (updates.category !== undefined) { fields.push("category = ?"); values.push(updates.category); }
    if (updates.brand !== undefined) { fields.push("brand = ?"); values.push(updates.brand); }
    if (updates.model !== undefined) { fields.push("model = ?"); values.push(updates.model); }
    if (updates.error_code !== undefined || updates.errorCode !== undefined) {
      fields.push("error_code = ?");
      values.push(updates.error_code ?? updates.errorCode);
    }
    if (updates.problem_description !== undefined || updates.problemDescription !== undefined || updates.description !== undefined) {
      fields.push("problem_description = ?");
      values.push(updates.problem_description ?? updates.problemDescription ?? updates.description);
    }
    if (updates.customer_name !== undefined || updates.customerName !== undefined) {
      fields.push("customer_name = ?");
      values.push(updates.customer_name ?? updates.customerName);
    }
    if (updates.customer_phone !== undefined || updates.customerPhone !== undefined) {
      fields.push("customer_phone = ?");
      values.push(updates.customer_phone ?? updates.customerPhone);
    }
    if (updates.address !== undefined) { fields.push("address = ?"); values.push(updates.address); }
    if (updates.city !== undefined) { fields.push("city = ?"); values.push(updates.city); }
    if (updates.region !== undefined) { fields.push("region = ?"); values.push(updates.region); }
    if (updates.status !== undefined) { fields.push("status = ?"); values.push(updates.status); }
    if (updates.amount !== undefined) { fields.push("amount = ?"); values.push(updates.amount); }
    if (updates.report !== undefined) { fields.push("report = ?"); values.push(updates.report); }
    if (updates.technician_name !== undefined || updates.technicianName !== undefined) {
      fields.push("technician_name = ?");
      values.push(updates.technician_name ?? updates.technicianName);
    }
    if (updates.technician_phone !== undefined || updates.technicianPhone !== undefined) {
      fields.push("technician_phone = ?");
      values.push(updates.technician_phone ?? updates.technicianPhone);
    }
    if (updates.date !== undefined) { fields.push("date = ?"); values.push(updates.date); }
    if (updates.time_slot !== undefined || updates.timeSlot !== undefined) {
      fields.push("time_slot = ?");
      values.push(updates.time_slot ?? updates.timeSlot);
    }
    if (updates.media_urls !== undefined || updates.mediaUrls !== undefined) {
      fields.push("media_urls = ?");
      const m = updates.media_urls ?? updates.mediaUrls;
      values.push(typeof m === "object" ? JSON.stringify(m) : String(m));
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE orders SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    if (updates.historyItem || updates.note || updates.status) {
      await OrderStatusHistoryRepository.create(id, {
        status: updates.status || "pending",
        title: updates.note || updates.report || `تغییر وضعیت به ${updates.status}`,
        updated_by: updates.updated_by || updates.updatedBy || "سیستم"
      });
    }

    return (await OrderRepository.findById(id));
  },

  async deleteById(id: string): Promise<boolean> {
    const pool = getDbPool();
    const [result]: any = await pool.query("DELETE FROM orders WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};
