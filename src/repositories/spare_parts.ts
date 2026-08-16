import { getDbPool, parseJsonColumn } from "../db/db";

function formatSparePartRow(row: any): any {
  if (!row) return null;
  const compatibleModels = Array.isArray(row.compatible_models) ? row.compatible_models : parseJsonColumn(row.compatible_models) || [];
  const img = row.image_url || row.imageUrl || row.image || "";
  const titleName = row.title || row.name || "";
  const partCode = row.code || row.part_number || row.partNumber || "";
  const brandVal = row.brand || "";
  const catVal = row.device_category || row.category || "";
  const modelVal = row.model || row.device_model || "";
  const compBrandsVal = row.compatible_brands || (Array.isArray(compatibleModels) && compatibleModels.length > 0 ? compatibleModels.join("، ") : brandVal);
  const shortDescVal = row.short_description || row.description || row.technical_description || "";

  let compatibilityArr = Array.isArray(compatibleModels) && compatibleModels.length > 0 ? compatibleModels : [];
  if (compatibilityArr.length === 0 && compBrandsVal) {
    compatibilityArr = String(compBrandsVal).split(/[،,]/).map((b: string) => b.trim()).filter(Boolean);
  }
  if (compatibilityArr.length === 0 && brandVal) {
    compatibilityArr = [brandVal];
  }

  return {
    ...row,
    id: row.id,
    name: titleName,
    title: titleName,
    code: partCode,
    partNumber: partCode,
    part_number: partCode,
    device_category: catVal,
    category: catVal,
    brand: brandVal || (compatibilityArr[0] || ""),
    model: modelVal,
    device_model: modelVal,
    compatible_brands: compBrandsVal,
    short_description: shortDescVal,
    description: shortDescVal,
    technical_description: shortDescVal,
    price: Number(row.price) || 0,
    stock: Number(row.stock) || 0,
    imageUrl: img,
    image_url: img,
    image: img,
    status: row.status || "available",
    compatibleModels: compatibilityArr,
    compatible_models: compatibilityArr,
    compatibility: compatibilityArr
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
    const category = partData.device_category || partData.category || "";
    const deviceCategory = category;
    const model = partData.model || partData.device_model || "";
    const comp = partData.compatibility || partData.compatibleModels || partData.compatible_models || [];
    const compatibleBrands = partData.compatible_brands || (Array.isArray(comp) && comp.length > 0 ? comp.join("، ") : (partData.brand || ""));
    const brand = partData.brand || (Array.isArray(comp) && comp[0] ? comp[0] : (compatibleBrands ? compatibleBrands.split(/[،,]/)[0].trim() : ""));
    const price = Number(partData.price) || 0;
    const stock = Number(partData.stock) || 0;
    const status = partData.status || "available";
    const description = partData.short_description || partData.description || partData.technical_description || "";
    const shortDescription = description;
    const imageUrl = partData.imageUrl || partData.image_url || partData.image || "";
    const compatibleModels = typeof comp === "object" ? JSON.stringify(comp) : String(comp);

    const pool = getDbPool();
    await pool.query(
      `INSERT INTO spare_parts (id, title, code, category, device_category, brand, model, compatible_brands, price, stock, status, description, short_description, image_url, compatible_models, part_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       title = VALUES(title),
       code = VALUES(code),
       category = VALUES(category),
       device_category = VALUES(device_category),
       brand = VALUES(brand),
       model = VALUES(model),
       compatible_brands = VALUES(compatible_brands),
       price = VALUES(price),
       stock = VALUES(stock),
       status = VALUES(status),
       description = VALUES(description),
       short_description = VALUES(short_description),
       image_url = VALUES(image_url),
       compatible_models = VALUES(compatible_models),
       part_number = VALUES(part_number)`,
      [id, name, code, category, deviceCategory, brand, model, compatibleBrands, price, stock, status, description, shortDescription, imageUrl, compatibleModels, code]
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
    if (updates.code !== undefined || updates.partNumber !== undefined || updates.part_number !== undefined) {
      const c = updates.code ?? updates.partNumber ?? updates.part_number;
      fields.push("code = ?");
      values.push(c);
      fields.push("part_number = ?");
      values.push(c);
    }
    if (updates.category !== undefined || updates.device_category !== undefined) {
      const cat = updates.device_category ?? updates.category;
      fields.push("category = ?");
      values.push(cat);
      fields.push("device_category = ?");
      values.push(cat);
    }
    if (updates.brand !== undefined) { fields.push("brand = ?"); values.push(updates.brand); }
    if (updates.model !== undefined || updates.device_model !== undefined) {
      const mdl = updates.model ?? updates.device_model;
      fields.push("model = ?");
      values.push(mdl);
    }
    if (updates.compatible_brands !== undefined || updates.compatibleBrands !== undefined) {
      const cb = updates.compatible_brands ?? updates.compatibleBrands;
      fields.push("compatible_brands = ?");
      values.push(cb);
    }
    if (updates.price !== undefined) { fields.push("price = ?"); values.push(Number(updates.price)); }
    if (updates.stock !== undefined) { fields.push("stock = ?"); values.push(Number(updates.stock)); }
    if (updates.status !== undefined) { fields.push("status = ?"); values.push(updates.status); }
    if (updates.description !== undefined || updates.short_description !== undefined || updates.technical_description !== undefined) {
      const desc = updates.short_description ?? updates.description ?? updates.technical_description;
      fields.push("description = ?");
      values.push(desc);
      fields.push("short_description = ?");
      values.push(desc);
    }
    if (updates.imageUrl !== undefined || updates.image_url !== undefined || updates.image !== undefined) {
      const im = updates.imageUrl ?? updates.image_url ?? updates.image;
      fields.push("image_url = ?");
      values.push(im);
    }
    if (updates.compatibleModels !== undefined || updates.compatible_models !== undefined || updates.compatibility !== undefined) {
      fields.push("compatible_models = ?");
      const cm = updates.compatibleModels ?? updates.compatible_models ?? updates.compatibility;
      values.push(typeof cm === "object" ? JSON.stringify(cm) : String(cm));
      if (!updates.compatible_brands && Array.isArray(cm)) {
        fields.push("compatible_brands = ?");
        values.push(cm.join("، "));
      }
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
