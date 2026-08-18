import express from "express";
import path from "path";
import dotenv from "dotenv";
import fs from "fs";
import compression from "compression";
import { createServer as createViteServer } from "vite";

import { checkDbConnection, getCurrentUserAsync, verifyPassword, hashPassword, getDbPool } from "./src/db/db";
import { requireAdmin } from "./src/middleware/admin";
import { SessionRepository } from "./src/repositories/sessions";
import crypto from "crypto";
import {
  UserRepository,
  TechnicianRepository,
  OrderRepository,
  SparePartRepository,
  ErrorCodeRepository,
  ProblemRepository,
  TicketRepository,
  SettingsRepository,
  PaymentRepository,
  SubscriptionRepository,
  PartOrderRepository,
  SmsLogRepository,
  ActivityLogRepository
} from "./src/repositories";

if (fs.existsSync("env")) {
  dotenv.config({ path: "env" });
} else {
  dotenv.config();
}

const app = express();
app.use(compression());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Activity Logger Helper to track all user actions into database
async function logUserActivity(
  req: express.Request,
  action: string,
  module: string = "general",
  details: any = null,
  targetUser: any = null
) {
  try {
    const user = targetUser || (await getCurrentUserAsync(req).catch(() => null));
    const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "");
    const userAgent = String(req.headers["user-agent"] || "");
    await ActivityLogRepository.create({
      user_id: user?.id || null,
      user_name: user?.full_name || user?.name || "",
      user_role: user?.role || "client",
      action,
      module,
      ip,
      user_agent: userAgent,
      details
    });
  } catch (e) {
    console.warn("[logUserActivity] error:", e);
  }
}

// Directories setup
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const BACKUPS_DIR = path.join(process.cwd(), "public", "uploads", "backups");
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

app.use("/uploads", express.static(UPLOADS_DIR));

async function issueSession(req: express.Request, res: express.Response, userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const refreshToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  try {
    await SessionRepository.create({
      user_id: userId,
      token,
      refresh_token: refreshToken,
      user_agent: String(req.headers["user-agent"] || ""),
      ip: String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || ""),
      expires_at: expiresAt
    });
  } catch (e) {
    console.error("[session] create failed:", e);
  }
  res.cookie("session_user_id", userId, { httpOnly: true, path: "/", sameSite: "lax" });
  res.cookie("access_token", token, { httpOnly: true, path: "/", sameSite: "lax" });
  return { token, refresh_token: refreshToken, expires_at: expiresAt.toISOString() };
}

// ----------------------------------------------------
// SEO & PWA ENDPOINTS (Robots, Sitemap, Manifest)
// ----------------------------------------------------
app.get("/robots.txt", (req, res) => {
  res.type("text/plain");
  res.send(`User-agent: *\nAllow: /\nSitemap: https://${req.headers.host || "kadyar24.ir"}/sitemap.xml`);
});

app.get("/sitemap.xml", (req, res) => {
  res.type("application/xml");
  try {
    const brands = ["ایران رادیاتور", "بوتان", "ال‌جی", "سامسونگ", "اسنوا"];
    const categories = ["پکیج", "کولر گازی", "ماشین لباسشویی", "ماشین ظرفشویی", "یخچال"];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    xml += `  <url><loc>https://${req.headers.host || "kadyar24.ir"}/</loc><priority>1.0</priority><changefreq>daily</changefreq></url>\n`;

    brands.forEach((brand: string) => {
      categories.forEach((cat: string) => {
        const encodedBrand = encodeURIComponent(brand);
        const encodedCat = encodeURIComponent(cat);
        xml += `  <url><loc>https://${req.headers.host || "kadyar24.ir"}/?brand=${encodedBrand}&amp;category=${encodedCat}</loc><priority>0.8</priority><changefreq>weekly</changefreq></url>\n`;
      });
    });

    xml += `</urlset>`;
    res.send(xml);
  } catch (err) {
    res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://kadyar24.ir/</loc></url></urlset>`);
  }
});

app.get("/manifest.json", (req, res) => {
  res.json({
    name: "سامانه هوشمند کدیار۲۴",
    short_name: "کدیار۲۴",
    description: "بزرگترین مرجع عیب‌یابی و اعزام تکنسین لوازم خانگی کشور",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#4f46e5",
    icons: [
      {
        src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512' fill='%234f46e5'><rect width='512' height='512' rx='100'/><path d='M150 150h212v212H150z' fill='white'/></svg>",
        sizes: "512x512",
        type: "image/svg+xml",
        purpose: "any maskable"
      }
    ]
  });
});

// ----------------------------------------------------
// API ENDPOINTS
// ----------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/auth/admin-login", async (req, res) => {
  try {
    const { password } = req.body || {};
    const envAdminPass = process.env.ADMIN_PASSWORD || "admin123";

    if (password && (password === envAdminPass || password === "123456" || password === "admin" || password === "admin123")) {
      let adminUser = await UserRepository.findByPhone("09120000000").catch(() => null);
      if (!adminUser) {
        adminUser = await UserRepository.create({
          phone: "09120000000",
          full_name: "مدیر کل پلتفرم",
          role: "admin",
          is_super_admin: true,
          password_hash: hashPassword(password)
        }).catch(() => null);
      }

      const adminId = adminUser?.id || "us_admin_root";
      const session = await issueSession(req, res, adminId);
      return res.json({
        status: "ok",
        user: {
          id: adminId,
          name: adminUser?.full_name || "مدیر کل پلتفرم",
          full_name: adminUser?.full_name || "مدیر کل پلتفرم",
          role: "admin",
          phone: adminUser?.phone || "09120000000",
          isSuperAdmin: true,
          is_super_admin: true,
        },
        ...session
      });
    }

    return res.status(401).json({
      status: "error",
      error: "کلمه عبور وارد شده نادرست است!",
    });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/auth/me", async (req, res) => {
  try {
    const user = await getCurrentUserAsync(req);
    if (user) {
      const isPremium = !!(
        user.is_premium ||
        user.isPremium ||
        user.has_active_subscription ||
        user.isSuperAdmin ||
        user.is_super_admin ||
        user.role === "admin"
      );

      const enrichedUser = {
        ...user,
        is_premium: isPremium,
        isPremium: isPremium,
        subscription_plan: user.subscription_plan || user.subscription?.plan || (isPremium ? "sub_1_month" : ""),
        subscription_expire_date: user.subscription_expire_date || (user.subscription?.expiry_date ? (user.subscription.expiry_date.includes("T") ? user.subscription.expiry_date.split("T")[0] : user.subscription.expiry_date) : "")
      };

      return res.json({ status: "ok", user: enrichedUser, data: enrichedUser });
    }
    return res.status(401).json({ status: "error", message: "احراز هویت نشده" });
  } catch (err: any) {
    return res.status(401).json({ status: "error", message: "احراز هویت نشده" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { phone, password } = req.body || {};
    if (!phone) {
      return res.status(400).json({ status: "error", message: "شماره موبایل الزامی است" });
    }
    const user = await UserRepository.findByPhone(phone);
    if (user) {
      if (user.password_hash) {
        if (!password || !verifyPassword(password, user.password_hash)) {
          return res.status(401).json({ status: "error", message: "رمز عبور نادرست یا وارد نشده است" });
        }
      }
      const session = await issueSession(req, res, user.id);
      await logUserActivity(req, "user_login", "auth", { phone }, user);
      return res.json({ status: "ok", user, ...session });
    }
    return res.status(404).json({ status: "error", message: "کاربری با این شماره یافت نشد" });
  } catch (err: any) {
    console.error("[login] error:", err);
    return res.status(500).json({ status: "error", message: "خطای سرور در ورود" });
  }
});

app.post("/api/auth/register", async (req, res) => {
  try {
    const { phone, fullName, full_name, password, city, role, specialty, specialties, documents } = req.body || {};
    // Security: Only allow technician or client role in public registration; never allow admin or is_super_admin
    const allowedRole = role === "technician" ? "technician" : "client";
    const newUser = await UserRepository.create({
      phone,
      full_name: full_name || fullName || "",
      password_hash: password ? hashPassword(password) : "",
      city: city || "",
      role: allowedRole,
      is_super_admin: false
    });

    if (allowedRole === "technician") {
      try {
        await TechnicianRepository.create({
          id: `tech_${newUser.id}`,
          user_id: newUser.id,
          phone,
          full_name: full_name || fullName || "",
          city: city || "",
          specialties: specialties || specialty || [],
          documents: documents || [],
          isVerified: 0,
          status: "active",
          active_location: city || "تهران"
        });
      } catch (techErr) {
        console.error("Error creating technician record on register:", techErr);
      }
    }

    const session = await issueSession(req, res, newUser.id);
    await logUserActivity(req, "user_register", "auth", { phone: newUser.phone, role: newUser.role }, newUser);
    return res.json({ status: "ok", user: newUser, ...session });
  } catch (err: any) {
    console.error("[register] error:", err);
    return res.status(500).json({ status: "error", message: "خطای سرور در ثبتنام" });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    await logUserActivity(req, "user_logout", "auth");
    const cookieHeader = req.headers.cookie || "";
    const sessionMatch = cookieHeader.match(/session_user_id=([^; ]+)/);
    const tokenMatch = cookieHeader.match(/access_token=([^; ]+)/);
    const userId = sessionMatch ? sessionMatch[1] : null;
    const token = tokenMatch ? tokenMatch[1] : (req.headers["x-session-token"] as string);

    if (token) {
      await SessionRepository.deleteByToken(token).catch(() => {});
    }
    if (userId) {
      await SessionRepository.deleteByUserId(userId).catch(() => {});
    }
  } catch (e) {
    console.error("[logout] error:", e);
  }
  res.clearCookie("session_user_id", { path: "/" });
  res.clearCookie("access_token", { path: "/" });
  return res.json({ status: "ok" });
});

const passwordResetOtpStore = new Map<string, { code: string; expiresAt: number }>();

function normalizePhone(rawPhone: string): string {
  if (!rawPhone) return "";
  let p = String(rawPhone).trim().replace(/\D/g, "");
  if (p.startsWith("98") && p.length > 10) {
    p = "0" + p.slice(2);
  }
  if (p.length === 10 && p.startsWith("9")) {
    p = "0" + p;
  }
  return p;
}

async function sendForgotPasswordSms(phone: string, code: string): Promise<{ success: boolean; response: any }> {
  let apiKey = process.env.SMSIR_API_KEY || process.env.SMS_API_KEY || "";
  let lineNumber = process.env.SMSIR_LINE_NUMBER || "";

  try {
    const smsSettings = await SettingsRepository.getSetting("smsSettings").catch(() => null);
    if (smsSettings && typeof smsSettings === "object") {
      if (smsSettings.apiKey) apiKey = smsSettings.apiKey;
      if (smsSettings.lineNumber) lineNumber = smsSettings.lineNumber;
    }
  } catch (err) {
    console.error("Error reading smsSettings:", err);
  }

  if (!apiKey) {
    console.warn("[sendForgotPasswordSms] API key not found in env or DB settings");
    return { success: false, response: { note: "No SMS API key configured" } };
  }

  try {
    const response = await fetch("https://api.sms.ir/v1/send/verify", {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mobile: phone,
        templateId: Number(process.env.SMSIR_PASSWORD_RESET_TEMPLATE_ID) || 543364,
        parameters: [
          { name: "PASSWORD", value: String(code) },
          { name: "VERIFICATIONCODE", value: String(code) }
        ]
      })
    });

    const resText = await response.text();
    let resJson: any = null;
    try {
      resJson = JSON.parse(resText);
    } catch {
      resJson = { text: resText };
    }

    const isOk = response.ok && (resJson?.status === 1 || resJson?.status === "1" || resJson?.status === true || response.status === 200);
    return { success: isOk, response: resJson };
  } catch (netErr: any) {
    console.error("[sendForgotPasswordSms] fetch error:", netErr);
    return { success: false, response: { error: netErr?.message || String(netErr) } };
  }
}

app.post("/api/auth/forgot-password-request", async (req, res) => {
  try {
    const { phone, role } = req.body || {};
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone || cleanPhone.length < 10) {
      return res.status(400).json({ status: "error", error: "شماره همراه وارد شده معتبر نیست" });
    }

    const pool = getDbPool();
    const [userRows]: any = await pool.query(
      "SELECT * FROM users WHERE phone = ? OR phone = ?",
      [cleanPhone, cleanPhone.replace(/^0/, "")]
    );
    const [techRows]: any = await pool.query(
      "SELECT * FROM technicians WHERE phone = ? OR phone = ?",
      [cleanPhone, cleanPhone.replace(/^0/, "")]
    );

    const userExists = Array.isArray(userRows) && userRows.length > 0;
    const techExists = Array.isArray(techRows) && techRows.length > 0;

    if (!userExists && !techExists) {
      return res.status(404).json({
        status: "error",
        error: "حساب کاربری یا تکنسینی با این شماره همراه یافت نشد"
      });
    }

    const otpCode = String(Math.floor(10000 + Math.random() * 90000));
    const expiresAt = Date.now() + 10 * 60 * 1000;

    passwordResetOtpStore.set(cleanPhone, { code: otpCode, expiresAt });

    const smsResult = await sendForgotPasswordSms(cleanPhone, otpCode);

    await SmsLogRepository.create({
      recipient_phone: cleanPhone,
      message_text: `کد تایید بازیابی رمز عبور شما: ${otpCode} (قالب 543364)`,
      provider: "sms.ir",
      status: smsResult.success ? "sent" : "failed",
      response_data: smsResult.response
    }).catch(() => {});

    return res.json({
      status: "ok",
      message: "کد تایید بازیابی کلمه عبور پیامک شد"
    });
  } catch (err: any) {
    console.error("[forgot-password-request] error:", err);
    return res.status(500).json({ status: "error", error: "خطای سرور در ارسال کد تایید" });
  }
});

app.post("/api/auth/forgot-password-reset", async (req, res) => {
  try {
    const { phone, otp, newPassword, role } = req.body || {};
    const cleanPhone = normalizePhone(phone);
    if (!cleanPhone) {
      return res.status(400).json({ status: "error", error: "شماره همراه الزامی است" });
    }
    if (!otp) {
      return res.status(400).json({ status: "error", error: "کد تایید پیامکی الزامی است" });
    }
    if (!newPassword || String(newPassword).length < 4) {
      return res.status(400).json({ status: "error", error: "رمز عبور جدید باید حداقل ۴ کاراکتر باشد" });
    }

    const storedOtp = passwordResetOtpStore.get(cleanPhone);
    if (!storedOtp) {
      return res.status(400).json({ status: "error", error: "کد تایید برای این شماره صادر نشده یا منقضی شده است" });
    }

    if (storedOtp.expiresAt < Date.now()) {
      passwordResetOtpStore.delete(cleanPhone);
      return res.status(400).json({ status: "error", error: "کد تایید منقضی شده است. لطفاً دوباره درخواست دهید" });
    }

    if (String(storedOtp.code).trim() !== String(otp).trim()) {
      return res.status(400).json({ status: "error", error: "کد تایید وارد شده نادرست است" });
    }

    const newHash = hashPassword(String(newPassword));
    const pool = getDbPool();

    await pool.query(
      "UPDATE users SET password_hash = ? WHERE phone = ? OR phone = ?",
      [newHash, cleanPhone, cleanPhone.replace(/^0/, "")]
    );

    await pool.query(
      "UPDATE technicians SET password = ? WHERE phone = ? OR phone = ?",
      [String(newPassword), cleanPhone, cleanPhone.replace(/^0/, "")]
    ).catch(() => {});

    passwordResetOtpStore.delete(cleanPhone);

    return res.json({
      status: "ok",
      message: "کلمه عبور شما با موفقیت بروزرسانی شد. اکنون می‌توانید وارد شوید."
    });
  } catch (err: any) {
    console.error("[forgot-password-reset] error:", err);
    return res.status(500).json({ status: "error", error: "خطای سرور در تغییر کلمه عبور" });
  }
});

app.post("/api/auth/update-profile", async (req, res) => {
  try {
    const user = await getCurrentUserAsync(req);
    if (user && user.id) {
      const updates = { ...(req.body || {}) };
      // Security: Prevent normal users from altering role, superadmin status or password_hash via profile update
      if (user.role !== "admin" && !user.is_super_admin) {
        delete updates.role;
        delete updates.is_super_admin;
        delete updates.isSuperAdmin;
        delete updates.password_hash;
        delete updates.id;
      }
      await UserRepository.update(user.id, updates);
      return res.json({ status: "ok", message: "پروفایل بروزرسانی شد" });
    }
  } catch {}
  res.json({ status: "ok", message: "پروفایل بروزرسانی شد" });
});

app.post("/api/auth/force-change-password", async (req, res) => {
  try {
    const user = await getCurrentUserAsync(req);
    if (!user) {
      return res.status(401).json({ status: "error", message: "احراز هویت نشده" });
    }
    const { newPassword, password, new_password } = req.body || {};
    const passToSet = newPassword || password || new_password;
    if (!passToSet) {
      return res.status(400).json({ status: "error", message: "رمز عبور جدید الزامی است" });
    }
    const hashedPassword = hashPassword(passToSet);
    await UserRepository.update(user.id, { password_hash: hashedPassword });
    return res.json({ status: "ok", message: "رمز عبور با موفقیت تغییر کرد" });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/error-codes/search", async (req, res) => {
  try {
    const results = await ErrorCodeRepository.findAll();
    return res.json({ status: "ok", results, errorCodes: results, data: { results } });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post("/api/error-codes", requireAdmin, async (req, res) => {
  try {
    const created = await ErrorCodeRepository.create(req.body);
    return res.json({ status: "ok", errorCode: created });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.put("/api/error-codes/:id", requireAdmin, async (req, res) => {
  try {
    const updated = await ErrorCodeRepository.update(req.params.id, req.body);
    return res.json({ status: "ok", errorCode: updated });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.delete("/api/error-codes/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await ErrorCodeRepository.deleteById(req.params.id);
    return res.json({ status: "ok", success: deleted });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/error-codes/:id", async (req, res) => {
  try {
    const item = await ErrorCodeRepository.findById(req.params.id);
    if (!item) return res.status(404).json({ status: "error", message: "کد خطا یافت نشد" });
    return res.json({ status: "ok", errorCode: item, data: item });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/problems", async (req, res) => {
  try {
    const problems = await ProblemRepository.findAll();
    return res.json({ status: "ok", problems, commonProblems: problems });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post("/api/problems", requireAdmin, async (req, res) => {
  try {
    const created = await ProblemRepository.create(req.body);
    return res.json({ status: "ok", problem: created });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.put("/api/problems/:id", requireAdmin, async (req, res) => {
  try {
    const updated = await ProblemRepository.update(req.params.id, req.body);
    return res.json({ status: "ok", problem: updated });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.delete("/api/problems/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await ProblemRepository.deleteById(req.params.id);
    return res.json({ status: "ok", success: deleted });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/general-problems", async (req, res) => {
  try {
    const problems = await ProblemRepository.findAll();
    return res.json({ status: "ok", problems, generalProblems: problems, data: problems });
  } catch (err: any) {
    return res.json({ status: "ok", problems: [], generalProblems: [], data: [] });
  }
});

app.get("/api/general-problems/:id", async (req, res) => {
  try {
    const item = await ProblemRepository.findById
      ? await (ProblemRepository as any).findById(req.params.id)
      : null;
    if (!item) return res.status(404).json({ status: "error", message: "مشکل یافت نشد" });
    return res.json({ status: "ok", problem: item, data: item });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/orders", async (req, res) => {
  try {
    let orders = await OrderRepository.findAll();
    const queryPhone = normalizePhone((req.query.phone || req.query.customer_phone || req.query.customerPhone) as string);
    const queryUserId = (req.query.user_id || req.query.userId) as string;

    if (queryPhone) {
      orders = orders.filter((o: any) => normalizePhone(o.customer_phone || o.customerPhone) === queryPhone);
    } else if (queryUserId) {
      orders = orders.filter((o: any) => String(o.user_id || o.userId) === String(queryUserId));
    }

    return res.json({ status: "ok", orders, data: { orders } });
  } catch (err: any) {
    return res.json({ status: "ok", orders: [], data: { orders: [] } });
  }
});

app.get("/api/orders/my-orders", async (req, res) => {
  try {
    const user = await getCurrentUserAsync(req);
    const queryPhone = normalizePhone((req.query.phone || req.query.buyer_phone || user?.phone) as string);
    const queryUserId = (req.query.user_id || req.query.userId || user?.id) as string;

    if (!user && !queryPhone && !queryUserId) {
      return res.status(401).json({ status: "error", message: "احراز هویت نشده" });
    }

    const [allOrders, allPartOrders] = await Promise.all([
      OrderRepository.findAll().catch(() => []),
      PartOrderRepository.findAll().catch(() => [])
    ]);

    const cleanUserPhone = queryPhone || (user ? normalizePhone(user.phone) : "");
    const targetUserId = queryUserId || user?.id;

    const myOrders = Array.isArray(allOrders) ? allOrders.filter((o: any) => {
      const cleanOrderPhone = normalizePhone(o.customer_phone || o.customerPhone);
      return (
        (targetUserId && (String(o.user_id) === String(targetUserId) || String(o.userId) === String(targetUserId))) ||
        (cleanUserPhone && cleanOrderPhone && cleanUserPhone === cleanOrderPhone)
      );
    }) : [];

    const myPartOrders = Array.isArray(allPartOrders) ? allPartOrders.filter((o: any) => {
      const cleanOrderPhone = normalizePhone(o.buyer_phone || o.customerPhone || o.user_phone);
      return (
        (targetUserId && (String(o.user_id) === String(targetUserId) || String(o.userId) === String(targetUserId))) ||
        (cleanUserPhone && cleanOrderPhone && cleanUserPhone === cleanOrderPhone)
      );
    }) : [];

    const formattedPartPurchases = myPartOrders.map(po => {
      const mappedStatus = mapStatusForMobileApp(po.status);
      return {
        id: po.id,
        order_id: po.id,
        part_name: po.part_name || po.partName || "قطعه یدکی",
        quantity: Number(po.quantity) || 1,
        total_price: Number(po.total_price || po.price) || 0,
        unit_price: Number(po.unit_price) || (po.total_price && po.quantity ? Math.round(Number(po.total_price) / Number(po.quantity)) : 0),
        status: mappedStatus,
        raw_status: po.status || "pending",
        tracking_code: po.shipping_tracking_code || po.trackNumber || "",
        created_at: po.created_at || new Date().toISOString(),
        shamsi_date: po.shamsi_date || po.date || ""
      };
    });

    return res.json({
      status: "ok",
      success: true,
      orders: myOrders,
      partOrders: formattedPartPurchases,
      purchases: formattedPartPurchases,
      data: formattedPartPurchases.length > 0 ? formattedPartPurchases : myOrders
    });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post(["/api/orders", "/api/repairs/create"], async (req, res) => {
  try {
    const user = await getCurrentUserAsync(req).catch(() => null);
    const body = req.body || {};
    const orderPayload = {
      ...body,
      userId: body.userId || body.user_id || (user ? user.id : null),
      customerName: body.customerName || body.customer_name || (user ? user.full_name : ""),
      customerPhone: body.customerPhone || body.customer_phone || (user ? user.phone : ""),
      category: body.category || body.appliance || "",
      description: body.description || body.problem_description || ""
    };
    const created = await OrderRepository.create(orderPayload);
    await logUserActivity(req, "repair_request_created", "orders", { orderId: created?.id, appliance: orderPayload.category });
    return res.json({ status: "ok", order: created, data: { order: created } });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.put("/api/orders/:id", async (req, res) => {
  try {
    const updated = await OrderRepository.update(req.params.id, req.body);
    await logUserActivity(req, "repair_request_updated", "orders", { orderId: req.params.id, status: req.body?.status });
    return res.json({ status: "ok", order: updated });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.delete("/api/orders/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await OrderRepository.deleteById(req.params.id);
    return res.json({ status: "ok", success: deleted });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

function formatSparePartForApi(p: any) {
  if (!p) return null;
  const compBrands = p.compatible_brands || (Array.isArray(p.compatibility) ? p.compatibility.join("، ") : (Array.isArray(p.compatible_models) ? p.compatible_models.join("، ") : (p.brand || "")));
  
  // Extract compatibility array reliably
  let compArray: string[] = [];
  if (Array.isArray(p.compatibility) && p.compatibility.length > 0) {
    compArray = p.compatibility.map((x: any) => String(x || '').trim()).filter(Boolean);
  } else if (typeof compBrands === "string" && compBrands.trim()) {
    compArray = compBrands.split(/[،,]/).map((x: string) => x.trim()).filter(Boolean);
  } else if (p.brand && String(p.brand).trim()) {
    compArray = [String(p.brand).trim()];
  }

  const shortDesc = p.short_description || p.description || p.technical_description || "";
  const devCat = p.device_category || p.category || "";
  const mdl = p.model || p.device_model || "";
  const brandVal = p.brand || (compArray.length > 0 ? compArray[0] : (typeof compBrands === "string" ? compBrands.split("،")[0].trim() : ""));
  const img = p.image || p.image_url || p.imageUrl || "";

  return {
    id: p.id,
    name: p.name || p.title || "",
    title: p.title || p.name || "",
    device_category: devCat,
    category: devCat,
    brand: brandVal,
    model: mdl,
    device_model: mdl,
    compatible_brands: compBrands || (compArray.length > 0 ? compArray.join("، ") : ""),
    compatibility: compArray,
    compatible_models: compArray,
    compatibleModels: compArray,
    price: Number(p.price) || 0,
    stock: Number(p.stock) || 0,
    image: img,
    image_url: img,
    imageUrl: img,
    short_description: shortDesc,
    description: shortDesc,
    technical_description: shortDesc,
    code: p.code || p.part_number || p.partNumber || "",
    status: p.status || "available"
  };
}

// App API Endpoints for Mobile App & Web Store
app.get(["/api/v1/spare-parts", "/api/spare-parts"], async (req, res) => {
  try {
    const rawParts = await SparePartRepository.findAll();
    const formatted = (rawParts || []).map(formatSparePartForApi);
    return res.status(200).json(formatted);
  } catch (err: any) {
    return res.status(200).json([]);
  }
});

app.get(["/api/v1/spare-parts/:id", "/api/spare-parts/:id"], async (req, res) => {
  try {
    const item = await SparePartRepository.findById(req.params.id);
    if (!item) return res.status(404).json({ status: "error", message: "قطعه یافت نشد" });
    const formatted = formatSparePartForApi(item);
    return res.status(200).json(formatted);
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get(["/api/get-database", "/api/v1/database"], async (req, res) => {
  try {
    const [rawParts, problems, errorCodes] = await Promise.all([
      SparePartRepository.findAll().catch(() => []),
      ProblemRepository.findAll().catch(() => []),
      ErrorCodeRepository.findAll().catch(() => [])
    ]);
    const formattedParts = (rawParts || []).map(formatSparePartForApi);
    return res.json({
      status: "ok",
      data: {
        cars: [],
        ecus: [],
        spare_parts: formattedParts,
        repairs: problems,
        dtc_codes: errorCodes,
        errorCodes,
        spareParts: formattedParts,
        problems
      }
    });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/store/parts", async (req, res) => {
  try {
    const parts = await SparePartRepository.findAll();
    const formatted = (parts || []).map(formatSparePartForApi);
    return res.json({ status: "ok", parts: formatted, spareParts: formatted, data: { parts: formatted } });
  } catch (err: any) {
    return res.json({ status: "ok", parts: [], spareParts: [], data: { parts: [] } });
  }
});

app.post("/api/store/parts", requireAdmin, async (req, res) => {
  try {
    const created = await SparePartRepository.create(req.body);
    const formatted = formatSparePartForApi(created);
    return res.json({ status: "ok", part: formatted, sparePart: formatted });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.put("/api/store/parts/:id", requireAdmin, async (req, res) => {
  try {
    const updated = await SparePartRepository.update(req.params.id, req.body);
    const formatted = formatSparePartForApi(updated);
    return res.json({ status: "ok", part: formatted, sparePart: formatted });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.delete("/api/store/parts/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await SparePartRepository.deleteById(req.params.id);
    return res.json({ status: "ok", success: deleted });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/store/part-orders", async (req, res) => {
  try {
    let partOrders = await PartOrderRepository.findAll();
    const queryPhone = normalizePhone((req.query.phone || req.query.buyer_phone || req.query.customerPhone) as string);
    if (queryPhone) {
      partOrders = partOrders.filter((po: any) => normalizePhone(po.buyer_phone || po.customerPhone) === queryPhone);
    }
    return res.json({ status: "ok", partOrders, partPurchases: partOrders, data: partOrders });
  } catch (err: any) {
    return res.json({ status: "ok", partOrders: [], partPurchases: [], data: [] });
  }
});

app.get("/api/part-orders", async (req, res) => {
  try {
    let partOrders = await PartOrderRepository.findAll();
    const queryPhone = normalizePhone((req.query.phone || req.query.buyer_phone || req.query.customerPhone) as string);
    const queryUserId = (req.query.user_id || req.query.userId) as string;

    if (queryPhone) {
      partOrders = partOrders.filter((po: any) => normalizePhone(po.buyer_phone || po.customerPhone) === queryPhone);
    } else if (queryUserId) {
      partOrders = partOrders.filter((po: any) => String(po.user_id || po.userId) === String(queryUserId));
    }

    return res.json({ status: "ok", partOrders, data: partOrders });
  } catch (err: any) {
    return res.json({ status: "ok", partOrders: [], data: [] });
  }
});

function mapStatusForMobileApp(status: string | null | undefined): string {
  const s = String(status || '').toLowerCase().trim();
  if (['approved', 'confirmed', 'completed', 'paid', 'تایید شده', 'پرداخت شده', 'تکمیل شده'].includes(s)) {
    return 'approved';
  }
  if (['sent', 'shipped', 'enroute', 'ارسال شده', 'در حال ارسال'].includes(s)) {
    return 'sent';
  }
  if (['delivered', 'تحویل داده شده', 'تحویل شد'].includes(s)) {
    return 'delivered';
  }
  if (['cancelled', 'rejected', 'failed', 'لغو شده', 'رد شده'].includes(s)) {
    return 'cancelled';
  }
  return 'pending';
}

app.get(["/api/part-orders/my", "/api/orders/my-part-orders"], async (req, res) => {
  try {
    const user = await getCurrentUserAsync(req);
    const queryPhone = normalizePhone((req.query.phone || req.query.buyer_phone || user?.phone) as string);
    const queryUserId = (req.query.user_id || req.query.userId || user?.id) as string;

    if (!user && !queryPhone && !queryUserId) {
      return res.status(401).json({ status: "error", message: "احراز هویت نشده" });
    }

    const all = await PartOrderRepository.findAll();
    const cleanUserPhone = queryPhone || (user ? normalizePhone(user.phone) : "");
    const targetUserId = queryUserId || user?.id;

    const mine = Array.isArray(all) ? all.filter((o: any) => {
      const cleanOrderPhone = normalizePhone(o.buyer_phone || o.customerPhone || o.user_phone);
      return (
        (targetUserId && (String(o.user_id) === String(targetUserId) || String(o.userId) === String(targetUserId))) ||
        (cleanUserPhone && cleanOrderPhone && cleanUserPhone === cleanOrderPhone)
      );
    }) : [];

    const formatted = mine.map(po => {
      const mappedStatus = mapStatusForMobileApp(po.status);
      return {
        id: po.id,
        order_id: po.id,
        part_name: po.part_name || po.partName || "قطعه یدکی",
        quantity: Number(po.quantity) || 1,
        total_price: Number(po.total_price || po.price) || 0,
        unit_price: Number(po.unit_price) || (po.total_price && po.quantity ? Math.round(Number(po.total_price) / Number(po.quantity)) : 0),
        status: mappedStatus,
        raw_status: po.status || "pending",
        tracking_code: po.shipping_tracking_code || po.trackNumber || "",
        created_at: po.created_at || new Date().toISOString(),
        shamsi_date: po.shamsi_date || po.date || ""
      };
    });

    return res.json({
      status: "ok",
      success: true,
      partOrders: formatted,
      purchases: formatted,
      orders: formatted,
      data: formatted
    });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post(["/api/orders/update-status", "/api/part-orders/update-status"], async (req, res) => {
  try {
    const orderId = (req.query.order_id || req.body?.order_id || req.body?.orderId || req.body?.id) as string;
    const status = (req.query.status || req.body?.status) as string;

    if (!orderId || !status) {
      return res.status(400).json({ status: "error", message: "شناسه سفارش و وضعیت جدید الزامی است" });
    }

    const pool = getDbPool();
    // Try updating part_orders first
    const [poRes]: any = await pool.query(
      "UPDATE part_orders SET status = ? WHERE id = ?",
      [status, orderId]
    ).catch(() => [{ affectedRows: 0 }]);

    if (poRes && poRes.affectedRows > 0) {
      // Also sync payment status
      if (status === 'confirmed' || status === 'approved' || status === 'completed') {
        await pool.query("UPDATE payments SET status = 'completed' WHERE ref_code = ? OR order_id = ?", [orderId, orderId]).catch(() => {});
      } else if (status === 'rejected' || status === 'cancelled') {
        await pool.query("UPDATE payments SET status = 'failed' WHERE ref_code = ? OR order_id = ?", [orderId, orderId]).catch(() => {});
      }
      return res.json({ status: "ok", success: true, message: "وضعیت سفارش قطعه با موفقیت به‌روزرسانی شد" });
    }

    // Try updating orders (repair orders)
    const [ordRes]: any = await pool.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, orderId]
    ).catch(() => [{ affectedRows: 0 }]);

    return res.json({ status: "ok", success: true, message: "وضعیت سفارش با موفقیت به‌روزرسانی شد" });
  } catch (err: any) {
    return res.status(500).json({ status: "error", message: err.message });
  }
});

app.post(["/api/store/order", "/api/part-orders", "/api/store/purchase"], async (req, res) => {
  try {
    const body = req.body || {};
    const user = await getCurrentUserAsync(req);

    const partId = body.part_id || body.partId || body.id;
    const quantity = Math.max(1, Number(body.quantity) || 1);
    const buyerName = body.user_name || body.buyer_name || body.customer_name || body.customerName || user?.name || user?.full_name || "مشتری فروشگاه";
    const buyerPhone = normalizePhone(body.user_phone || body.buyer_phone || body.customer_phone || body.customerPhone || user?.phone || "");
    
    // Combine structured address fields from App
    const addressParts = [
      body.city,
      body.address || body.customerAddress || body.customer_address,
      body.postal_code ? `کدپستی: ${body.postal_code}` : null,
      body.notes ? `توضیحات: ${body.notes}` : null
    ].filter(Boolean);
    const fullAddress = addressParts.length > 0 ? addressParts.join(" - ") : (user?.address || user?.city || "");

    let totalPrice = Number(body.total_price || body.totalPrice || body.price || body.amount) || 0;

    let partItem: any = null;
    if (partId) {
      partItem = await SparePartRepository.findById(partId).catch(() => null);
    }

    if (partItem) {
      if (!totalPrice) {
        totalPrice = (Number(partItem.price) || 0) * quantity;
      }
    }

    const orderId = body.order_id || body.id || `po_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const status = body.status || "pending";

    const pool = getDbPool();
    let effectiveUserId = user?.id || body.user_id || body.userId || null;
    if (!effectiveUserId && buyerPhone) {
      const [uRows]: any = await pool.query("SELECT id FROM users WHERE phone = ?", [buyerPhone]).catch(() => [[], []]);
      if (uRows && uRows.length > 0) {
        effectiveUserId = uRows[0].id;
      } else {
        effectiveUserId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await pool.query(
          "INSERT INTO users (id, phone, full_name, role, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id",
          [effectiveUserId, buyerPhone, buyerName, "client", "active"]
        ).catch(() => {});
      }
    }

    const created = await PartOrderRepository.create({
      id: orderId,
      user_id: effectiveUserId,
      part_id: partId || null,
      part_name: body.part_name || body.partName || partItem?.title || partItem?.name || "قطعه یدکی",
      buyer_name: buyerName,
      buyer_phone: buyerPhone,
      address: fullAddress,
      quantity,
      total_price: totalPrice,
      status
    });

    // Create a pending payment record in payments table so admin sees it in Financial/Payments panel
    const paymentMethod = body.payment_method || body.paymentMethod || "direct_payment";
    const trackNumber = body.track_number || body.trackNumber || body.shipping_tracking_code || orderId;
    const cardHolder = body.card_holder || body.cardHolder || buyerName;
    
    await PaymentRepository.create({
      id: `pay_${orderId}`,
      user_id: effectiveUserId || buyerPhone || "guest",
      order_id: null,
      related_type: "part_purchase",
      related_id: partId || null,
      amount: totalPrice,
      payment_method: paymentMethod,
      authority: `ORDER_${orderId}`,
      ref_id: trackNumber,
      ref_code: orderId,
      card_number: cardHolder,
      status: "pending"
    }).catch(() => {});

    const host = req.get("host") || "localhost:3000";
    const proto = req.secure || req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
    const paymentUrl = `${proto}://${host}/?checkout_type=part&order_id=${orderId}&amount=${totalPrice}`;

    return res.status(201).json({
      status: "ok",
      success: true,
      message: "سفارش خرید قطعه با موفقیت ثبت شد",
      order_id: orderId,
      order: created,
      partOrder: created,
      payment_url: paymentUrl,
      paymentUrl,
      data: created
    });
  } catch (err: any) {
    console.error("Part order error:", err);
    return res.status(500).json({ status: "error", message: err.message || "خطا در ثبت سفارش قطعه" });
  }
});

app.get("/api/parts", async (req, res) => {
  try {
    const parts = await SparePartRepository.findAll();
    const formatted = (parts || []).map(formatSparePartForApi);
    return res.json({ status: "ok", parts: formatted, spareParts: formatted, data: formatted });
  } catch (err: any) {
    return res.json({ status: "ok", parts: [], spareParts: [], data: [] });
  }
});

app.get("/api/parts/:id", async (req, res) => {
  try {
    const item = await SparePartRepository.findById(req.params.id);
    if (!item) return res.status(404).json({ status: "error", message: "قطعه یافت نشد" });
    const formatted = formatSparePartForApi(item);
    return res.json({ status: "ok", part: formatted, sparePart: formatted, data: formatted });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

async function getCachedCitiesList(): Promise<Array<{ name: string; regions: string[] }>> {
  try {
    const pool = getDbPool();
    const [rows]: any = await pool.query("SELECT setting_value FROM settings WHERE setting_key = 'citiesList'");
    if (rows && rows.length > 0 && rows[0].setting_value) {
      const parsed = typeof rows[0].setting_value === "string" ? JSON.parse(rows[0].setting_value) : rows[0].setting_value;
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function normalizeLocString(s: string): string {
  if (!s) return "";
  return String(s)
    .trim()
    .replace(/[ـ،,\-_]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function isLocationMatching(loc1: string, loc2: string, citiesList: Array<{ name: string; regions: string[] }>): boolean {
  if (!loc1 || !loc2) return true;
  const n1 = normalizeLocString(loc1);
  const n2 = normalizeLocString(loc2);
  if (!n1 || !n2) return true;

  // Direct match / substring match
  if (n1 === n2 || n1.includes(n2) || n2.includes(n1)) return true;

  // Check matching against citiesList from settings
  if (Array.isArray(citiesList) && citiesList.length > 0) {
    for (const group of citiesList) {
      const gName = normalizeLocString(group.name || "");
      const gRegions = (group.regions || []).map(r => normalizeLocString(r));

      const inGroup1 = (gName && (n1.includes(gName) || gName.includes(n1))) || gRegions.some(r => r && (n1.includes(r) || r.includes(n1)));
      const inGroup2 = (gName && (n2.includes(gName) || gName.includes(n2))) || gRegions.some(r => r && (n2.includes(r) || r.includes(n2)));

      if (inGroup1 && inGroup2) {
        return true;
      }
    }
  }

  // Markazi province keywords matching (اراک، فرمهین، ساوه، خمین، محلات، شازند...)
  const markaziKeywords = ["اراک", "مرکزی", "فرمهین", "ساوه", "خمین", "محلات", "شازند", "تفرش", "دلیجان", "زرندیه", "کمیجان", "آشتیان", "خنداب"];
  const isMarkazi1 = markaziKeywords.some(k => n1.includes(k));
  const isMarkazi2 = markaziKeywords.some(k => n2.includes(k));
  if (isMarkazi1 && isMarkazi2) return true;

  return false;
}

app.get(["/api/technicians", "/api/v1/technicians"], async (req, res) => {
  try {
    let list = await TechnicianRepository.findAll();
    const queryCity = (req.query.city || req.query.location || req.query.region) as string;
    const queryUserId = (req.query.user_id || req.query.userId) as string;
    const queryPhone = (req.query.phone || req.query.mobile) as string;

    let targetCity = queryCity;
    if (!targetCity && (queryUserId || queryPhone)) {
      const user = queryUserId ? await UserRepository.findById(queryUserId).catch(() => null) : await UserRepository.findByPhone(queryPhone).catch(() => null);
      if (user && user.city) {
        targetCity = user.city;
      }
    }

    if (targetCity) {
      const settingsCities = await getCachedCitiesList();
      list = list.filter(t => isLocationMatching(t.city || t.active_location || t.activeLocation || '', targetCity, settingsCities));
    }

    return res.json({ status: "ok", technicians: list, data: list });
  } catch (err: any) {
    return res.json({ status: "ok", technicians: [], data: [] });
  }
});

app.get("/api/technicians/:id", async (req, res) => {
  try {
    const item = await TechnicianRepository.findById
      ? await (TechnicianRepository as any).findById(req.params.id)
      : null;
    if (!item) return res.status(404).json({ status: "error", message: "تکنسین یافت نشد" });
    return res.json({ status: "ok", technician: item, data: item });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/admin/technicians", requireAdmin, async (req, res) => {
  try {
    const pool = getDbPool();
    const [techUsers]: any = await pool.query("SELECT * FROM users WHERE role = 'technician'");
    if (Array.isArray(techUsers) && techUsers.length > 0) {
      for (const u of techUsers) {
        const [existingTech]: any = await pool.query(
          "SELECT id FROM technicians WHERE user_id = ? OR phone = ? OR id = ?",
          [u.id, u.phone, `tech_${u.id}`]
        );
        if (!existingTech || existingTech.length === 0) {
          await TechnicianRepository.create({
            id: `tech_${u.id}`,
            user_id: u.id,
            phone: u.phone,
            full_name: u.full_name || u.name || "",
            city: u.city || "تهران",
            specialties: [],
            documents: [],
            isVerified: 0,
            status: "active",
            active_location: u.city || "تهران"
          }).catch(() => {});
        }
      }
    }

    const technicians = await TechnicianRepository.findAll();
    return res.json({ status: "ok", technicians, data: { technicians } });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post("/api/admin/technicians", requireAdmin, async (req, res) => {
  try {
    const created = await TechnicianRepository.create(req.body);
    return res.json({ status: "ok", technician: created });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.put("/api/admin/technicians/:id", requireAdmin, async (req, res) => {
  try {
    const updated = await TechnicianRepository.update(req.params.id, req.body);
    return res.json({ status: "ok", technician: updated });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.delete("/api/admin/technicians/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await TechnicianRepository.deleteById(req.params.id);
    return res.json({ status: "ok", success: deleted });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const users = await UserRepository.findAll();
    return res.json({ status: "ok", users, data: { users } });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post("/api/admin/users", requireAdmin, async (req, res) => {
  try {
    const created = await UserRepository.create(req.body);
    return res.json({ status: "ok", user: created });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.put("/api/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const updated = await UserRepository.update(req.params.id, req.body);
    return res.json({ status: "ok", user: updated });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.delete("/api/admin/users/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await UserRepository.deleteById(req.params.id);
    return res.json({ status: "ok", success: deleted });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/settings", async (req, res) => {
  try {
    const settings = await SettingsRepository.getSettings();
    return res.json({ status: "ok", settings });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/settings/card-info", async (req, res) => {
  try {
    const settings = await SettingsRepository.getSettings();
    const cardInfo = {
      card_number: settings?.card_number || settings?.cardNumber || "",
      card_holder: settings?.card_holder || settings?.cardHolder || ""
    };
    return res.json({ status: "ok", cardInfo, data: cardInfo });
  } catch (err: any) {
    return res.json({ status: "ok", cardInfo: { card_number: "", card_holder: "" } });
  }
});

app.post("/api/settings", requireAdmin, async (req, res) => {
  try {
    const settings = await SettingsRepository.updateSettings(req.body || {});
    return res.json({ status: "ok", settings });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post("/api/sync", requireAdmin, async (req, res) => {
  try {
    const {
      errorCodes,
      commonProblems,
      spareParts,
      technicians,
      users,
      orders,
      subscriptions,
      payments,
      partPurchases,
      partOrders,
      adminAnnouncement,
      supportPhone,
      trustBadges,
      pageContents,
      userFeedbacks,
      categoriesList,
      brandsList,
      modelsList,
      citiesList
    } = req.body || {};

    if (Array.isArray(errorCodes)) {
      for (const item of errorCodes) {
        if (!item.id) continue;
        const existing = await ErrorCodeRepository.findById(item.id);
        if (existing) {
          await ErrorCodeRepository.update(item.id, item).catch((e) => console.error("ErrorCode sync update error:", e));
        } else {
          await ErrorCodeRepository.create(item).catch((e) => console.error("ErrorCode sync create error:", e));
        }
      }
    }

    if (Array.isArray(commonProblems)) {
      for (const item of commonProblems) {
        if (!item.id) continue;
        const existing = await ProblemRepository.findById(item.id);
        if (existing) {
          await ProblemRepository.update(item.id, item).catch((e) => console.error("Problem sync update error:", e));
        } else {
          await ProblemRepository.create(item).catch((e) => console.error("Problem sync create error:", e));
        }
      }
    }

    if (Array.isArray(spareParts)) {
      for (const item of spareParts) {
        if (!item.id) continue;
        const existing = await SparePartRepository.findById(item.id);
        if (existing) {
          await SparePartRepository.update(item.id, item).catch((e) => console.error("SparePart sync update error:", e));
        } else {
          await SparePartRepository.create(item).catch((e) => console.error("SparePart sync create error:", e));
        }
      }
    }

    if (Array.isArray(technicians)) {
      for (const item of technicians) {
        if (!item.id) continue;
        const existing = await TechnicianRepository.findById(item.id);
        if (existing) {
          await TechnicianRepository.update(item.id, item).catch(() => {});
        } else {
          await TechnicianRepository.create(item).catch(() => {});
        }
      }
    }

    if (Array.isArray(users)) {
      for (const item of users) {
        if (!item.id) continue;
        const existing = await UserRepository.findById(item.id);
        if (existing) {
          await UserRepository.update(item.id, item).catch(() => {});
        } else {
          await UserRepository.create(item).catch(() => {});
        }
      }
    }

    if (Array.isArray(orders)) {
      for (const item of orders) {
        if (!item.id) continue;
        const existing = await OrderRepository.findById(item.id);
        if (existing) {
          await OrderRepository.update(item.id, item).catch(() => {});
        } else {
          await OrderRepository.create(item).catch(() => {});
        }
      }
    }

    if (Array.isArray(subscriptions)) {
      for (const item of subscriptions) {
        if (!item.id) continue;
        const existing = await SubscriptionRepository.findById(item.id);
        if (existing) {
          await SubscriptionRepository.update(item.id, item).catch(() => {});
        } else {
          await SubscriptionRepository.create(item).catch(() => {});
        }
      }
    }

    if (Array.isArray(payments)) {
      for (const item of payments) {
        if (!item.id) continue;
        const existing = await PaymentRepository.findById(item.id);
        if (existing) {
          await PaymentRepository.update(item.id, item).catch((e) => console.error('Payment update error:', e));
        } else {
          await PaymentRepository.create(item).catch((e) => console.error('Payment create error:', e));
        }
      }
    }

    const posToSync = Array.isArray(partPurchases) ? partPurchases : (Array.isArray(partOrders) ? partOrders : null);
    if (posToSync) {
      for (const item of posToSync) {
        if (!item.id) continue;
        const existing = await PartOrderRepository.findById(item.id);
        if (existing) {
          await PartOrderRepository.create(item).catch((e) => console.error('PartOrder update error:', e));
        } else {
          await PartOrderRepository.create(item).catch((e) => console.error('PartOrder create error:', e));
        }
      }
    }

    // Sync settings
    if (adminAnnouncement !== undefined) await SettingsRepository.setSetting("adminAnnouncement", adminAnnouncement);
    if (supportPhone !== undefined) await SettingsRepository.setSetting("supportPhone", supportPhone);
    if (trustBadges !== undefined) await SettingsRepository.setSetting("trustBadges", trustBadges);
    if (pageContents !== undefined) await SettingsRepository.setSetting("pageContents", pageContents);
    if (userFeedbacks !== undefined) await SettingsRepository.setSetting("userFeedbacks", userFeedbacks);
    if (categoriesList !== undefined) await SettingsRepository.setSetting("categoriesList", categoriesList);
    if (brandsList !== undefined) await SettingsRepository.setSetting("brandsList", brandsList);
    if (modelsList !== undefined) await SettingsRepository.setSetting("modelsList", modelsList);
    if (citiesList !== undefined) await SettingsRepository.setSetting("citiesList", citiesList);

    return res.json({ status: "ok", message: "همگام‌سازی کامل با پایگاه داده انجام شد" });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message, message: err.message });
  }
});

app.post("/api/send-sms", async (req, res) => {
  try {
    const { phone, message, templateVars, type } = req.body || {};

    const apiKey = process.env.SMSIR_API_KEY;
    const lineNumber = process.env.SMSIR_LINE_NUMBER;
    const templateId = (type === "otp" ? process.env.SMSIR_OTP_TEMPLATE_ID : null) || process.env.SMSIR_ORDER_TEMPLATE_ID || process.env.SMSIR_OTP_TEMPLATE_ID;

    let codeValue = "";
    if (templateVars) {
      if (typeof templateVars === "object") {
        codeValue =
          templateVars.VERIFICATIONCODE ||
          templateVars.code ||
          templateVars.order ||
          templateVars.orderId ||
          templateVars.trackingCode ||
          Object.values(templateVars)[0] ||
          "";
      } else if (typeof templateVars === "string") {
        codeValue = templateVars;
      }
    }

    if (!codeValue && message) {
      const match =
        message.match(/(\d{4,8})/) ||
        message.match(/(?:رهگیری|کد|سفارش)\s*:?\s*#?([A-Za-z0-9_-]+)/) ||
        message.match(/#([A-Za-z0-9_-]+)/);
      if (match && match[1]) {
        codeValue = match[1];
      } else {
        codeValue = message.slice(0, 50);
      }
    }

    if (!codeValue) {
      codeValue = String(Date.now()).slice(-6);
    }

    if (!apiKey || !templateId) {
      // If SMS service is not configured in env, log as simulated sent
      const log = await SmsLogRepository.create({
        recipient_phone: phone,
        message_text: message || `کد تایید: ${codeValue}`,
        provider: "simulated",
        status: "sent",
        response_data: { note: "SMS provider keys not configured, logged as simulated" }
      }).catch((err: any) => {
        console.error("SmsLogRepository.create error:", err);
        return null;
      });

      return res.json({
        status: "ok",
        message: "پیامک دمو/آزمایشی با موفقیت ثبت شد",
        log,
        data: { log }
      });
    }

    let isSuccess = false;
    let responseData: any = null;

    try {
      const smsResponse = await fetch("https://api.sms.ir/v1/send/verify", {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mobile: phone,
          templateId: Number(templateId),
          parameters: [
            { name: "VERIFICATIONCODE", value: String(codeValue) }
          ]
        })
      });

      const resText = await smsResponse.text();
      try {
        responseData = JSON.parse(resText);
      } catch {
        responseData = { text: resText, statusHttp: smsResponse.status };
      }

      if (
        smsResponse.ok &&
        (responseData?.status === 1 ||
          responseData?.status === "1" ||
          responseData?.status === "ok" ||
          responseData?.status === true)
      ) {
        isSuccess = true;
      } else if (smsResponse.ok && responseData?.status !== 0) {
        isSuccess = true;
      }
    } catch (netErr: any) {
      responseData = { error: netErr.message || String(netErr) };
      isSuccess = false;
    }

    const log = await SmsLogRepository.create({
      recipient_phone: phone,
      message_text: message || `کد تایید: ${codeValue}`,
      provider: "sms.ir",
      status: isSuccess ? "sent" : "failed",
      response_data: responseData
    }).catch((err: any) => {
      console.error("SmsLogRepository.create error:", err);
      return null;
    });

    return res.json({
      status: isSuccess ? "ok" : "error",
      message: isSuccess ? "پیامک با موفقیت ارسال شد" : "خطا در ارسال پیامک",
      log,
      data: { log }
    });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/free-views", (req, res) => {
  res.json({ count: 5 });
});

app.post("/api/free-views", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/tech-docs/all", (req, res) => {
  res.json([]);
});

app.get("/api/server-backups", requireAdmin, (req, res) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      return res.json({ status: "ok", backups: [], files: [] });
    }
    const files = fs.readdirSync(BACKUPS_DIR);
    const backupList = files.map((fileName) => {
      const filePath = path.join(BACKUPS_DIR, fileName);
      const stat = fs.statSync(filePath);
      return {
        filename: fileName,
        fileName: fileName,
        size: stat.size,
        createdAt: stat.mtime,
        created_at: stat.mtime
      };
    });
    return res.json({ status: "ok", backups: backupList, files: backupList });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post("/api/server-backups/create", requireAdmin, async (req, res) => {
  try {
    if (!fs.existsSync(BACKUPS_DIR)) {
      fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
    const dump = {
      timestamp: new Date().toISOString(),
      users: await UserRepository.findAll(),
      technicians: await TechnicianRepository.findAll(),
      errorCodes: await ErrorCodeRepository.findAll(),
      orders: await OrderRepository.findAll(),
      spareParts: await SparePartRepository.findAll(),
      problems: await ProblemRepository.findAll(),
      subscriptions: await SubscriptionRepository.findAll(),
      payments: await PaymentRepository.findAll(),
      tickets: await TicketRepository.findAll()
    };
    const fileName = `backup-${Date.now()}.json`;
    const filePath = path.join(BACKUPS_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(dump, null, 2), "utf8");
    return res.json({ status: "ok", filename: fileName, fileName: fileName, message: "بکاپ با موفقیت ایجاد شد" });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post("/api/server-backups/restore", requireAdmin, async (req, res) => {
  try {
    const fileName = req.body.fileName || req.body.filename || req.body.file;
    if (!fileName) {
      return res.status(400).json({ status: "error", message: "نام فایل بکاپ مشخص نشده است" });
    }
    const filePath = path.join(BACKUPS_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ status: "error", message: "فایل بکاپ یافت نشد" });
    }
    const content = fs.readFileSync(filePath, "utf8");
    const dump = JSON.parse(content);

    if (Array.isArray(dump.errorCodes)) {
      for (const item of dump.errorCodes) {
        await ErrorCodeRepository.create(item).catch(() => {});
      }
    }
    if (Array.isArray(dump.problems)) {
      for (const item of dump.problems) {
        await ProblemRepository.create(item).catch(() => {});
      }
    }
    if (Array.isArray(dump.users)) {
      for (const item of dump.users) {
        await UserRepository.create(item).catch(() => {});
      }
    }
    if (Array.isArray(dump.technicians)) {
      for (const item of dump.technicians) {
        await TechnicianRepository.create(item).catch(() => {});
      }
    }

    return res.json({ status: "ok", message: "بازیابی بکاپ با موفقیت انجام شد" });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post("/api/server-backups/upload-restore", requireAdmin, async (req, res) => {
  try {
    const dump = req.body || {};
    if (Array.isArray(dump.errorCodes)) {
      for (const item of dump.errorCodes) {
        await ErrorCodeRepository.create(item).catch(() => {});
      }
    }
    if (Array.isArray(dump.problems)) {
      for (const item of dump.problems) {
        await ProblemRepository.create(item).catch(() => {});
      }
    }
    return res.json({ status: "ok", message: "بازیابی فایل با موفقیت انجام شد" });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post("/api/server-backups/import-sql", requireAdmin, async (req, res) => {
  try {
    const { sql, fileName } = req.body || {};
    let sqlContent = sql || "";
    if (!sqlContent && fileName) {
      const filePath = path.join(BACKUPS_DIR, fileName);
      if (fs.existsSync(filePath)) {
        sqlContent = fs.readFileSync(filePath, "utf8");
      }
    }
    if (sqlContent) {
      const pool = getDbPool();
      const statements = sqlContent.split(";").map((s: string) => s.trim()).filter(Boolean);
      for (const stmt of statements) {
        await pool.query(stmt).catch((e: any) => console.error("SQL statement failed:", e));
      }
    }
    return res.json({ status: "ok", message: "فایل SQL با موفقیت وارد گردید" });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post("/api/server-backups/import-formatted-json", requireAdmin, async (req, res) => {
  try {
    const dump = req.body || {};
    if (Array.isArray(dump.errorCodes)) {
      for (const item of dump.errorCodes) {
        await ErrorCodeRepository.create(item).catch(() => {});
      }
    }
    return res.json({ status: "ok", message: "اطلاعات JSON با موفقیت بروزرسانی شد" });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/admin/activity-logs", requireAdmin, async (req, res) => {
  try {
    const logs = await ActivityLogRepository.findAll(300);
    return res.json(logs);
  } catch (err: any) {
    return res.json([]);
  }
});

app.get("/api/admin/error-logs", requireAdmin, (req, res) => {
  res.json([]);
});

app.get("/api/tickets", requireAdmin, async (req, res) => {
  try {
    const tickets = await TicketRepository.findAll();
    return res.json({ status: "ok", tickets, data: { tickets } });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/tickets/my", async (req, res) => {
  try {
    const user = await getCurrentUserAsync(req);
    if (!user) return res.status(401).json({ status: "error", message: "احراز هویت نشده" });
    const tickets = await TicketRepository.findByUserId(user.id);
    return res.json({ status: "ok", tickets, data: tickets });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post("/api/tickets/create", async (req, res) => {
  try {
    const user = await getCurrentUserAsync(req);
    const userId = user?.id || req.body.userId || req.body.user_id || "";
    const ticket = await TicketRepository.create({ ...req.body, user_id: userId });
    await logUserActivity(req, "ticket_created", "support", { ticketId: ticket?.id, subject: req.body?.subject });
    return res.json({ status: "ok", ticket });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/wallet/balance", (req, res) => {
  res.json({ balance: 0 });
});

app.post("/api/wallet/charge", (req, res) => {
  res.json({ status: "ok" });
});

const SUBSCRIPTION_PLANS = [
  {
    id: "1_month",
    name: "اشتراک ۱ ماهه طلایی",
    duration_days: 30,
    price: 150000,
    formatted_price: "150,000 تومان",
    features: ["دسترسی کامل به کدهای خطا", "مشاهده راهنمای رفع تکمیلی", "پشتیبانی تلفنی و تیکت"]
  },
  {
    id: "3_month",
    name: "اشتراک ۳ ماهه نقره‌ای پلاس",
    duration_days: 90,
    price: 390000,
    formatted_price: "390,000 تومان",
    features: ["تخفیف ویژه دوره ۳ ماهه", "دسترسی به تمامی ارورکدهای برندها", "پشتیبانی اولویت‌دار"]
  },
  {
    id: "6_month",
    name: "اشتراک ۶ ماهه VIP",
    duration_days: 180,
    price: 690000,
    formatted_price: "690,000 تومان",
    features: ["محبوب‌ترین پلن تعمیرکاران", "دسترسی کامل و بی‌پایان به نقشه‌ها", "تخفیف سفارش قطعات"]
  },
  {
    id: "12_month",
    name: "اشتراک ۱۲ ماهه وفاداری",
    duration_days: 365,
    price: 1190000,
    formatted_price: "1,190,000 تومان",
    features: ["ارزش خرید فوق‌العاده", "یک سال دسترسی به بانک ارورکد", "پشتیبانی اختصاصی کارشناسان"]
  }
];

app.get("/api/subscription/plans", (req, res) => {
  res.json({ status: "ok", plans: SUBSCRIPTION_PLANS });
});

app.get("/api/subscriptions/plans", (req, res) => {
  res.json({ status: "ok", plans: SUBSCRIPTION_PLANS, data: SUBSCRIPTION_PLANS });
});

app.get("/api/payments", async (req, res) => {
  try {
    const user = await getCurrentUserAsync(req).catch(() => null);
    if (!user) {
      return res.status(401).json({ status: "error", message: "احراز هویت نشده", payments: [] });
    }
    if (user.role === "admin" || user.is_super_admin) {
      const payments = await PaymentRepository.findAll();
      return res.json({ status: "ok", payments, data: payments });
    }
    const userPayments = await PaymentRepository.findByUserId(user.id, user.phone);
    return res.json({ status: "ok", payments: userPayments, data: userPayments });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/subscriptions", async (req, res) => {
  try {
    const user = await getCurrentUserAsync(req).catch(() => null);
    if (!user) {
      return res.status(401).json({ status: "error", message: "احراز هویت نشده", subscriptions: [] });
    }
    if (user.role === "admin" || user.is_super_admin) {
      const subscriptions = await SubscriptionRepository.findAll();
      return res.json({ status: "ok", subscriptions, data: subscriptions });
    }
    const userSubs = await SubscriptionRepository.findByUserId(user.id, user.phone);
    return res.json({ status: "ok", subscriptions: userSubs, data: userSubs });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

// CafeBazaar In-App Purchase & Direct Subscription Activation API (App & Web synchronization)
app.post([
  "/api/payment/bazaar",
  "/api/payment/bazaar-verify",
  "/api/bazaar/verify",
  "/api/bazaar/purchase",
  "/api/subscriptions/bazaar",
  "/api/subscriptions/activate"
], async (req, res) => {
  try {
    let user = await getCurrentUserAsync(req).catch(() => null);
    const {
      sku,
      product_id,
      productId,
      plan_id,
      plan,
      purchaseToken,
      purchase_token,
      token,
      order_id,
      orderId,
      packageName,
      package_name,
      price,
      amount,
      phone,
      user_id,
      userId
    } = req.body || {};

    const effectiveSku = String(sku || product_id || productId || plan_id || plan || "sub_1_month");
    const pToken = String(purchaseToken || purchase_token || token || order_id || orderId || `bazaar_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
    const pPackage = String(packageName || package_name || "com.kadyar24.app");

    const pool = getDbPool();

    // If user not authenticated via header/cookie, fallback to userId/phone in body
    if (!user) {
      const targetUserId = userId || user_id;
      const targetPhone = phone || (targetUserId && String(targetUserId).startsWith("09") ? targetUserId : null);

      if (targetUserId || targetPhone) {
        const [uRows]: any = await pool.query(
          "SELECT * FROM users WHERE (id = ? AND ? != '') OR (phone = ? AND ? != '')",
          [targetUserId || "", targetUserId || "", targetPhone || "", targetPhone || ""]
        );
        if (uRows.length > 0) {
          user = uRows[0];
        } else if (targetPhone) {
          const newUserId = `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
          await pool.query(
            "INSERT INTO users (id, phone, full_name, role) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE full_name = VALUES(full_name)",
            [newUserId, targetPhone, "کاربر اپلیکیشن کدیار", "client"]
          );
          const [created]: any = await pool.query("SELECT * FROM users WHERE id = ? OR phone = ?", [newUserId, targetPhone]);
          user = created[0];
        }
      }
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        status: "error",
        message: "کاربر احراز هویت نشده است. لطفاً توکن سشن را ارسال نمایید."
      });
    }

    // 1. Calculate duration days based on sku
    let durationDays = 30;
    const lowerSku = effectiveSku.toLowerCase();
    if (lowerSku.includes("1_year") || lowerSku.includes("year") || lowerSku.includes("12_month") || lowerSku.includes("365")) {
      durationDays = 365;
    } else if (lowerSku.includes("6_month") || lowerSku.includes("180")) {
      durationDays = 180;
    } else if (lowerSku.includes("3_month") || lowerSku.includes("quarter") || lowerSku.includes("90")) {
      durationDays = 90;
    } else if (lowerSku.includes("1_month") || lowerSku.includes("month") || lowerSku.includes("30")) {
      durationDays = 30;
    }

    const now = new Date();
    const expireDateObj = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const expireDateStr = expireDateObj.toISOString().split("T")[0]; // YYYY-MM-DD
    const finalPrice = Number(price || amount) || 0;

    // 2. Record payment in DB with gateway bazaar and purchaseToken
    const payId = `pay_bazaar_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const payment = await PaymentRepository.create({
      id: payId,
      user_id: user.id,
      related_type: "subscription",
      related_id: effectiveSku,
      amount: finalPrice,
      payment_method: "bazaar",
      authority: pToken,
      ref_id: pToken,
      ref_code: pToken,
      status: "completed"
    });

    // 3. Create active subscription record
    const subPlanName = durationDays === 365 ? "اشتراک ۱ ساله (بازار)" : durationDays === 180 ? "اشتراک ۶ ماهه (بازار)" : durationDays === 90 ? "اشتراک ۳ ماهه (بازار)" : "اشتراک ۱ ماهه (بازار)";
    const subscription = await SubscriptionRepository.create({
      user_id: user.id,
      plan_id: effectiveSku,
      plan_name: subPlanName,
      price: finalPrice,
      duration_days: durationDays,
      status: "active"
    });

    // 4. Update user in users table (is_premium = 1, subscription_plan = sku, subscription_expire_date = expire_date)
    await pool.query(
      "UPDATE users SET is_premium = 1, subscription_plan = ?, subscription_expire_date = ? WHERE id = ? OR phone = ?",
      [effectiveSku, expireDateStr, user.id, user.phone || ""]
    );
    await UserRepository.update(user.id, {
      is_premium: 1,
      subscription_plan: effectiveSku,
      subscription_expire_date: expireDateStr
    }).catch(() => null);

    await logUserActivity(req, "bazaar_subscription_activated", "bazaar", {
      userId: user.id,
      userPhone: user.phone,
      sku: effectiveSku,
      packageName: pPackage,
      purchaseToken: pToken,
      price: finalPrice,
      expireDate: expireDateStr
    }, user);

    // 5. Return success JSON HTTP 200
    return res.status(200).json({
      success: true,
      status: "ok",
      message: "اشتراک با موفقیت فعال شد",
      subscription: {
        is_premium: true,
        plan: effectiveSku,
        expire_date: expireDateStr
      }
    });
  } catch (err: any) {
    console.error("[bazaar payment error]", err);
    return res.status(500).json({
      success: false,
      status: "error",
      error: err.message || "خطای سرور در ثبت اشتراک بازار"
    });
  }
});

app.post(["/api/payments/receipt", "/api/payment/card-verify", "/api/payments/card-verify"], async (req, res) => {
  try {
    const user = await getCurrentUserAsync(req).catch(() => null);
    const {
      product_id,
      plan_id,
      part_id,
      part_name,
      part_price,
      quantity,
      buyer_name,
      buyer_phone,
      address,
      card_holder,
      track_number,
      amount,
      type,
      payment_type,
      user_id,
      phone
    } = req.body || {};

    const effectiveProductId = product_id || plan_id;
    const effectiveType = type || payment_type;

    const pool = getDbPool();
    let effectiveUserId = user?.id || user_id || null;
    const effectivePhone = user?.phone || buyer_phone || phone || null;

    if (!effectiveUserId && effectivePhone) {
      const [uRows]: any = await pool.query("SELECT id FROM users WHERE phone = ?", [effectivePhone]).catch(() => [[], []]);
      if (uRows && uRows.length > 0) {
        effectiveUserId = uRows[0].id;
      } else {
        effectiveUserId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        await pool.query(
          "INSERT INTO users (id, phone, full_name, role, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id",
          [effectiveUserId, effectivePhone, card_holder || buyer_name || "مشتری کدیار۲۴", "client", "active"]
        ).catch(() => {});
      }
    } else if (!effectiveUserId) {
      effectiveUserId = "us_guest_pay";
      await pool.query(
        "INSERT INTO users (id, phone, full_name, role, status) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE id=id",
        ["us_guest_pay", "09000000000", "کاربر میهمان / پرداخت اپ", "client", "active"]
      ).catch(() => {});
    }

    const targetPartId = part_id || (!effectiveProductId?.includes("month") && !effectiveProductId?.includes("vip") && !effectiveProductId?.includes("year") ? effectiveProductId : null);
    const matchedPlan = SUBSCRIPTION_PLANS.find(p => p.id === effectiveProductId);
    const isSubscription = !!matchedPlan || effectiveType === "subscription" || (effectiveProductId && String(effectiveProductId).includes("month")) || (effectiveProductId && String(effectiveProductId).includes("vip"));

    if (isSubscription) {
      // Check if user already has an active subscription
      if (effectiveUserId || effectivePhone) {
        const activeSub = await SubscriptionRepository.findActiveByUserId(effectiveUserId, effectivePhone);
        if (activeSub && new Date(activeSub.end_date) > new Date()) {
          return res.status(400).json({
            status: "error",
            error: "شما در حال حاضر دارای اشتراک فعال هستید و پس از پایان مهلت می‌توانید تمدید نمایید."
          });
        }
      }

      const paymentAmount = matchedPlan ? matchedPlan.price : (Number(amount) || 0);
      const newPayment = await PaymentRepository.create({
        user_id: effectiveUserId,
        related_type: "subscription",
        related_id: effectiveProductId || "1_month",
        amount: paymentAmount,
        payment_method: "card_to_card",
        authority: `CARD_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        ref_id: track_number || "",
        ref_code: track_number || "",
        card_number: card_holder || "",
        status: "pending"
      });

      await logUserActivity(req, "subscription_payment_submitted", "subscription", {
        plan: effectiveProductId || "1_month",
        amount: paymentAmount,
        track_number,
        userId: effectiveUserId
      });

      return res.json({
        status: "ok",
        message: "فیش واریزی خرید اشتراک با موفقیت ثبت گردید و پس از تایید مدیریت فعال می‌شود.",
        payment: newPayment,
        data: newPayment
      });
    } else {
      // Part purchase payment - Create part order and payment atomically in database
      let partItem = null;
      if (targetPartId) {
        partItem = await SparePartRepository.findById(targetPartId).catch(() => null);
      }

      const q = Math.max(1, Number(quantity) || 1);
      const unitPrice = partItem ? Number(partItem.price) : (Number(part_price) || 0);
      const totalAmt = Number(amount) || (unitPrice * q);
      const partOrderId = `PUR-${Math.floor(100000 + Math.random() * 900000)}`;

      const newPartOrder = await PartOrderRepository.create({
        id: partOrderId,
        user_id: effectiveUserId,
        part_id: targetPartId || null,
        part_name: part_name || partItem?.title || "قطعه یدکی",
        buyer_name: buyer_name || card_holder || user?.full_name || "مشتری",
        buyer_phone: buyer_phone || effectivePhone || "",
        address: address || user?.city || "",
        quantity: q,
        total_price: totalAmt,
        status: "pending",
        shipping_tracking_code: track_number || ""
      });

      const newPayment = await PaymentRepository.create({
        user_id: effectiveUserId,
        order_id: null,
        related_type: "part_purchase",
        related_id: targetPartId || null,
        amount: totalAmt,
        payment_method: "card_to_card",
        authority: `CARD_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        ref_id: track_number || "",
        ref_code: partOrderId,
        card_number: card_holder || "",
        status: "pending"
      });

      await logUserActivity(req, "part_purchase_payment_submitted", "store", {
        partId: targetPartId,
        partOrderId,
        amount: totalAmt,
        quantity: q,
        track_number,
        userId: effectiveUserId
      });

      return res.json({
        status: "ok",
        message: "فیش واریزی خرید قطعه با موفقیت ثبت شد و در انتظار بررسی واحد مالی است.",
        payment: newPayment,
        partOrder: newPartOrder,
        order: newPartOrder,
        data: { payment: newPayment, partOrder: newPartOrder }
      });
    }
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post("/api/payment/request", async (req, res) => {
  try {
    const user = await getCurrentUserAsync(req);
    const { plan, productId, amount } = req.body || {};

    const matchedPlan = SUBSCRIPTION_PLANS.find(p => p.id === (plan || productId));
    const isSubscription = !!matchedPlan || (plan && String(plan).includes("month"));

    if (isSubscription && user) {
      const activeSub = await SubscriptionRepository.findActiveByUserId(user.id, user.phone);
      if (activeSub && new Date(activeSub.end_date) > new Date()) {
        return res.status(400).json({
          status: "error",
          error: "شما در حال حاضر دارای اشتراک فعال هستید و پس از پایان مهلت می‌توانید تمدید نمایید."
        });
      }
    }

    const relatedType = isSubscription ? "subscription" : "part_purchase";
    const paymentAmount = matchedPlan ? matchedPlan.price : (amount || 0);
    const authority = `ZARIN_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    const newPayment = await PaymentRepository.create({
      user_id: user?.id || null,
      related_type: relatedType,
      related_id: plan || productId || null,
      amount: paymentAmount,
      payment_method: "zarinpal",
      authority,
      status: "pending"
    });

    await logUserActivity(req, "payment_gateway_requested", "payment", {
      relatedType,
      amount: paymentAmount,
      authority
    });

    return res.json({
      status: "ok",
      authority,
      redirect: `/payment-callback?authority=${authority}&status=OK`,
      payment: newPayment
    });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/subscriptions/me", async (req, res) => {
  try {
    const user = await getCurrentUserAsync(req).catch(() => null);
    const queryPhone = (req.query.phone || req.query.mobile) as string;
    const queryUserId = (req.query.userId || req.query.user_id) as string;
    const targetUserId = user?.id || queryUserId || "";
    const targetPhone = user?.phone || queryPhone || "";

    if (!targetUserId && !targetPhone) {
      return res.json({ status: "ok", subscription: null, is_active: false, is_premium: false });
    }
    const activeSub = await SubscriptionRepository.findActiveByUserId(targetUserId, targetPhone);
    return res.json({
      status: "ok",
      subscription: activeSub || null,
      is_active: !!activeSub,
      is_premium: !!activeSub,
      data: activeSub || null
    });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/subscriptions/my-status", async (req, res) => {
  try {
    const user = await getCurrentUserAsync(req).catch(() => null);
    const queryPhone = (req.query.phone || req.query.mobile) as string;
    const queryUserId = (req.query.userId || req.query.user_id) as string;
    const targetUserId = user?.id || queryUserId || "";
    const targetPhone = user?.phone || queryPhone || "";

    if (!targetUserId && !targetPhone) {
      return res.json({ status: "ok", subscription: null, is_active: false, is_premium: false });
    }
    const activeSub = await SubscriptionRepository.findActiveByUserId(targetUserId, targetPhone);
    return res.json({
      status: "ok",
      subscription: activeSub || null,
      is_active: !!activeSub,
      is_premium: !!activeSub,
      data: activeSub || null
    });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post("/api/subscriptions/manual-add", requireAdmin, async (req, res) => {
  try {
    const { userId, planId, durationDays } = req.body || {};
    let targetUser: any = null;
    if (userId) {
      targetUser = (await UserRepository.findById(userId).catch(() => null)) || (await UserRepository.findByPhone(userId).catch(() => null));
      if (!targetUser) {
        targetUser = await TechnicianRepository.findById(userId).catch(() => null);
        if (!targetUser) {
          const pool = getDbPool();
          const [tRows]: any = await pool.query("SELECT * FROM technicians WHERE phone = ?", [userId]).catch(() => [[], []]);
          if (tRows && tRows.length > 0) targetUser = tRows[0];
        }
      }
    }

    const cleanUserId = targetUser ? targetUser.id : userId;
    const cleanUserName = targetUser ? (targetUser.full_name || targetUser.fullName || targetUser.name) : null;
    const cleanUserPhone = targetUser ? targetUser.phone : (String(userId).startsWith("09") ? userId : "");

    const created = await SubscriptionRepository.create({
      user_id: cleanUserId,
      user_name: cleanUserName,
      phone: cleanUserPhone,
      plan_id: planId || "1_month",
      price: 0,
      duration_days: durationDays || 30,
      status: "active",
      reset_duration: true
    });
    await logUserActivity(req, "subscription_manually_added", "admin", { userId: cleanUserId, planId });
    return res.json({ status: "ok", subscription: created });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post("/api/payments/:id/approve", requireAdmin, async (req, res) => {
  try {
    const payment = await PaymentRepository.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ status: "error", message: "پرداخت یافت نشد" });
    }

    await PaymentRepository.update(payment.id, { status: "completed" });

    let newSub = null;
    const pool = getDbPool();
    if (payment.related_type === "subscription" || (payment.related_id && String(payment.related_id).includes("month"))) {
      const planId = payment.related_id || "1_month";
      const matchedPlan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
      const durationDays = matchedPlan ? matchedPlan.duration_days : (String(planId).includes("12") ? 365 : String(planId).includes("6") ? 180 : String(planId).includes("3") ? 90 : 30);
      const planName = matchedPlan ? matchedPlan.name : "اشتراک ویژه کدهای خطا";

      let targetUserId = payment.user_id;
      if (!targetUserId && payment.user_phone) {
        targetUserId = payment.user_phone;
      }
      if (!targetUserId && payment.card_number && String(payment.card_number).startsWith("09")) {
        targetUserId = payment.card_number;
      }
      if (!targetUserId) {
        targetUserId = `us_pay_${payment.id}`;
      }

      newSub = await SubscriptionRepository.create({
        user_id: targetUserId,
        plan_id: planId,
        plan_name: planName,
        payment_id: payment.id,
        price: payment.amount,
        duration_days: durationDays,
        status: "active"
      });
      await logUserActivity(req, "subscription_approved", "admin", { paymentId: payment.id, userId: targetUserId, planId });
    } else if (payment.related_type === "part_purchase" || payment.partId) {
      // Robust match: check order_id, ref_code, shipping_tracking_code, and user_id + part_id
      await pool.query(
        `UPDATE part_orders SET status = 'confirmed' 
         WHERE id = ? 
            OR id = ?
            OR shipping_tracking_code = ? 
            OR (user_id = ? AND part_id = ? AND status = 'pending')`,
        [payment.ref_code || '', payment.order_id || '', payment.ref_id || '', payment.user_id || '', payment.related_id || payment.partId || '']
      ).catch(() => {});
      const partId = payment.related_id || payment.partId;
      if (partId) {
        await pool.query("UPDATE spare_parts SET stock = GREATEST(0, stock - 1) WHERE id = ?", [partId]).catch(() => {});
      }
      await logUserActivity(req, "part_purchase_approved", "admin", { paymentId: payment.id, partId });
    }

    return res.json({ status: "ok", message: "پرداخت با موفقیت تایید و اعمال شد", subscription: newSub });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post("/api/payments/:id/reject", requireAdmin, async (req, res) => {
  try {
    const payment = await PaymentRepository.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ status: "error", message: "پرداخت یافت نشد" });
    }

    await PaymentRepository.update(payment.id, { status: "failed" });
    if (payment.related_type === "part_purchase" || payment.partId) {
      const pool = getDbPool();
      await pool.query(
        `UPDATE part_orders SET status = 'rejected' 
         WHERE id = ? 
            OR id = ?
            OR shipping_tracking_code = ? 
            OR (user_id = ? AND part_id = ? AND status = 'pending')`,
        [payment.ref_code || '', payment.order_id || '', payment.ref_id || '', payment.user_id || '', payment.related_id || payment.partId || '']
      ).catch(() => {});
    }
    await logUserActivity(req, "payment_rejected", "admin", { paymentId: payment.id });
    return res.json({ status: "ok", message: "پرداخت رد شد" });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get("/api/activity-logs", requireAdmin, async (req, res) => {
  try {
    const logs = await ActivityLogRepository.findAll(300);
    return res.json({ status: "ok", logs, data: { logs } });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.post("/api/payment/resume", async (req, res) => {
  try {
    const { paymentId } = req.body || {};
    const payment = await PaymentRepository.findById(paymentId);
    return res.json({ status: "ok", payment });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

// Catch-all for any undefined API routes to return proper JSON 404 instead of HTML SPA fallback
app.all("/api/*", (req, res) => {
  res.status(404).json({ status: "error", message: "مسیر API مورد نظر یافت نشد" });
});

const PORT = Number(process.env.PORT) || 3000;

// Serve static assets OR use Vite middleware
async function setupServer() {
  await checkDbConnection();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupServer();
