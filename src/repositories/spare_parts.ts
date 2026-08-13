import { getDbPool, parseJsonColumn } from "../db/db";

function formatSparePartRow(row: any): any {
  if (!row) return null;
  const compatibleModels = Array.isArray(row.compatible_models) ? row.compatible_models : parseJsonColumn(row.compatible_models) || [];
  const img = row.image_url || row.imageUrl || row.image || "";
  const titleName = row.title || row.name || "";
  const partCode = row.code || row.part_number || row.partNumber || "";
  const brandVal = row.brand || "";
  const catVal = row.category || "";

  return {
    ...row,
    id: row.id,
    name: titleName,
    title: titleName,
    code: partCode,
    partNumber: partCode,
    part_number: partCode,
    category: catVal,
    brand: brandVal,
    price: Number(row.price) || 0,
    stock: Number(row.stock) || 0,
    imageUrl: img,
    image_url: img,
    image: img,
    status: row.status || "available",
    description: row.description || "",
    compatibleModels: Array.isArray(compatibleModels) ? compatibleModels : [],
    compatible_models: Array.isArray(compatibleModels) ? compatibleModels : [],
    compatibility: Array.isArray(compatibleModels) ? compatibleModels : []
  };
}

export const SparePartRepository = {
  async findAll(): Promise<any[]> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM spare_parts ORDER BY created_at DESC");
    return (rows as any[]).map(formatSparePartRow);
  },

  async findById(id: string): Promise<any | null> {
    const pool = getDbPool();
    const [rows] = await pool.query("SELECT * FROM spare_parts WHERE id = ?", [id]);
    const arr = rows as any[];
    return arr.length > 0 ? formatSparePartRow(arr[0]) : null;
  },

  async create(partData: any): Promise<any> {
    const id = partData.id || `part_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const name = partData.name || partData.title || "";
    const code = partData.code || partData.partNumber || partData.part_number || `SP-${Math.floor(1000 + Math.random() * 9000)}`;
    const category = partData.category || "";
    const brand = partData.brand || (Array.isArray(partData.compatibility) && partData.compatibility[0] ? partData.compatibility[0] : "") || "";
    const price = Number(partData.price) || 0;
    const stock = Number(partData.stock) || 0;
    const status = partData.status || "available";
    const description = partData.description || "";
    const imageUrl = partData.imageUrl || partData.image_url || partData.image || "";
    const comp = partData.compatibility || partData.compatibleModels || partData.compatible_models || [];
    const compatibleModels = typeof comp === "object" ? JSON.stringify(comp) : String(comp);

    const pool = getDbPool();
    await pool.query(
      `INSERT INTO spare_parts (id, title, code, category, brand, price, stock, status, description, image_url, compatible_models, part_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       title = VALUES(title),
       code = VALUES(code),
       category = VALUES(category),
       brand = VALUES(brand),
       price = VALUES(price),
       stock = VALUES(stock),
       status = VALUES(status),
       description = VALUES(description),
       image_url = VALUES(image_url),
       compatible_models = VALUES(compatible_models),
       part_number = VALUES(part_number)`,
      [id, name, code, category, brand, price, stock, status, description, imageUrl, compatibleModels, code]
    );

    return (await SparePartRepository.findById(id));
  },

  async update(id: string, updates: any): Promise<any | null> {
    const pool = getDbPool();
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined || updates.title !== undefined) {
      fields.push("title = ?");
      values.push(updates.name ?? updates.title);
    }
    if (updates.code !== undefined || updates.partNumber !== undefined) {
      fields.push("code = ?");
      values.push(updates.code ?? updates.partNumber);
      fields.push("part_number = ?");
      values.push(updates.code ?? updates.partNumber);
    }
    if (updates.category !== undefined) { fields.push("category = ?"); values.push(updates.category); }
    if (updates.brand !== undefined) { fields.push("brand = ?"); values.push(updates.brand); }
    if (updates.price !== undefined) { fields.push("price = ?"); values.push(Number(updates.price)); }
    if (updates.stock !== undefined) { fields.push("stock = ?"); values.push(Number(updates.stock)); }
    if (updates.status !== undefined) { fields.push("status = ?"); values.push(updates.status); }
    if (updates.description !== undefined) { fields.push("description = ?"); values.push(updates.description); }
    if (updates.imageUrl !== undefined || updates.image_url !== undefined || updates.image !== undefined) {
      fields.push("image_url = ?");
      values.push(updates.imageUrl ?? updates.image_url ?? updates.image);
    }
    if (updates.compatibleModels !== undefined || updates.compatible_models !== undefined || updates.compatibility !== undefined) {
      fields.push("compatible_models = ?");
      const cm = updates.compatibleModels ?? updates.compatible_models ?? updates.compatibility;
      values.push(typeof cm === "object" ? JSON.stringify(cm) : String(cm));
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(`UPDATE spare_parts SET ${fields.join(", ")} WHERE id = ?`, values);
    }

    return (await SparePartRepository.findById(id));
  },

  async deleteById(id: string): Promise<boolean> {
    const pool = getDbPool();
    const [result]: any = await pool.query("DELETE FROM spare_parts WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};
