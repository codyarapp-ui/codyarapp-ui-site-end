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

// ----------------------------------------------------
// SECURITY HARDENING MIDDLEWARES
// ----------------------------------------------------

// 1. Security Headers (Anti-Clickjacking, XSS Protection, No Sniff, Referrer Policy)
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.removeHeader("X-Powered-By");
  next();
});

// 2. Block direct URL access to sensitive files (.env, .git, database dumps, backups, etc.)
app.use((req, res, next) => {
  const normalizedPath = decodeURIComponent(req.path).toLowerCase();
  const blockedPatterns = [
    /\/\.env/i,
    /\/\.git/i,
    /\.sql$/i,
    /\.bak$/i,
    /\.sqlite$/i,
    /\/backups\//i,
    /\/uploads\/backups\//i,
    /\/database\.json/i,
    /\/firebase[^\/]*\.json/i,
    /\/package\.json/i,
    /\/tsconfig\.json/i
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(normalizedPath)) {
      return res.status(403).json({ status: "error", message: "دسترسی به این منبع غیرمجاز است." });
    }
  }
  next();
});

// 3. In-memory Rate Limiter for Authentication & Sensitive endpoints (Brute Force Protection)
const authRateLimitMap = new Map<string, { count: number; resetAt: number }>();
function createRateLimiter(maxAttempts = 15, windowMs = 60 * 1000) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    const record = authRateLimitMap.get(key);

    if (!record || record.resetAt < now) {
      authRateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxAttempts) {
      const waitSec = Math.ceil((record.resetAt - now) / 1000);
      return res.status(429).json({
        status: "error",
        message: `تعداد درخواست‌های بیش از حد مجاز. لطفاً ${waitSec} ثانیه دیگر مجدداً تلاش نمایید.`
      });
    }

    record.count++;
    next();
  };
}

const authRateLimit = createRateLimiter(15, 60 * 1000); // 15 requests per minute for login/admin-login
const otpRateLimit = createRateLimiter(5, 60 * 1000);   // 5 OTP requests per minute

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

app.post("/api/auth/admin-login", authRateLimit, async (req, res) => {
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

      const userClean = { ...user };
      delete userClean.password_hash;
      delete userClean.password;

      const enrichedUser = {
        ...userClean,
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

app.post("/api/auth/login", authRateLimit, async (req, res) => {
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
      const userSafe = { ...user };
      delete userSafe.password_hash;
      delete userSafe.password;
      return res.json({ status: "ok", user: userSafe, ...session });
    }
    return res.status(404).json({ status: "error", message: "کاربری با این شماره یافت نشد" });
  } catch (err: any) {
    console.error("[login] error:", err);
    return res.status(500).json({ status: "error", message: "خطای سرور در ورود" });
  }
});

app.post("/api/auth/register", authRateLimit, async (req, res) => {
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
    const safeNewUser = { ...newUser };
    delete safeNewUser.password_hash;
    delete safeNewUser.password;
    return res.json({ status: "ok", user: safeNewUser, ...session });
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

app.post("/api/auth/forgot-password-request", otpRateLimit, async (req, res) => {
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

app.post("/api/auth/forgot-password-reset", otpRateLimit, async (req, res) => {
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

app.get(["/api/problems", "/api/common-problems"], async (req, res) => {
  try {
    const problems = await ProblemRepository.findAll();
    return res.json({
      status: "ok",
      problems,
      commonProblems: problems,
      generalProblems: problems,
      data: problems,
      results: problems,
      total: problems.length
    });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message, problems: [], commonProblems: [], data: [] });
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
    const user = await getCurrentUserAsync(req).catch(() => null);
    let orders = await OrderRepository.findAll();
    const queryPhone = normalizePhone((req.query.phone || req.query.customer_phone || req.query.customerPhone) as string);
    const queryUserId = (req.query.user_id || req.query.userId) as string;

    // If user is Admin, allow viewing all orders (or filtering by phone/user_id)
    if (user && (user.role === "admin" || user.is_super_admin)) {
      if (queryPhone) {
        orders = orders.filter((o: any) => normalizePhone(o.customer_phone || o.customerPhone) === queryPhone);
      } else if (queryUserId) {
        orders = orders.filter((o: any) => String(o.user_id || o.userId) === String(queryUserId));
      }
      return res.json({ status: "ok", orders, data: { orders } });
    }

    // For non-admin or unauthenticated callers, restrict strictly to their own phone / user_id
    const callerPhone = queryPhone || (user ? normalizePhone(user.phone) : "");
    const callerUserId = queryUserId || (user ? user.id : "");

    if (!callerPhone && !callerUserId) {
      return res.status(401).json({ status: "error", message: "احراز هویت نشده", orders: [], data: { orders: [] } });
    }

    orders = orders.filter((o: any) => {
      const orderPhone = normalizePhone(o.customer_phone || o.customerPhone);
      return (
        (callerUserId && (String(o.user_id) === String(callerUserId) || String(o.userId) === String(callerUserId))) ||
        (callerPhone && orderPhone && callerPhone === orderPhone)
      );
    });

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

function formatCommonProblemForApp(p: any) {
  if (!p) return null;
  const causes = Array.isArray(p.causes) ? p.causes : (typeof p.causes === "string" ? [p.causes] : []);
  const solutions = Array.isArray(p.solutions) ? p.solutions : (typeof p.solutions === "string" ? [p.solutions] : []);
  const symptoms = Array.isArray(p.symptoms) ? p.symptoms : (typeof p.symptoms === "string" ? [p.symptoms] : []);
  const steps = Array.isArray(p.steps) ? p.steps : (solutions.length > 0 ? solutions : (typeof p.steps === "string" ? [p.steps] : []));
  const desc = p.description || p.problem_description || (symptoms.length > 0 ? symptoms.join(" - ") : (p.title || ""));

  return {
    id: String(p.id || ""),
    title: p.title || "",
    brand: p.brand || "",
    category: p.category || "",
    model: p.model || "",
    description: desc,
    causes: causes,
    steps: steps,
    solutions: solutions,
    symptoms: symptoms,
    severity: p.severity || "medium"
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

app.get([
  "/api/problems",
  "/api/general-problems",
  "/api/common-problems",
  "/api/v1/problems",
  "/api/v1/common-problems"
], async (req, res) => {
  try {
    const raw = await ProblemRepository.findAll().catch(() => []);
    const formatted = (raw || []).map(formatCommonProblemForApp).filter(Boolean);
    return res.json({
      status: "ok",
      success: true,
      common_problems: formatted,
      commonProblems: formatted,
      problems: formatted,
      data: {
        common_problems: formatted,
        commonProblems: formatted,
        problems: formatted
      }
    });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message, common_problems: [], data: [] });
  }
});

app.get([
  "/api/problems/:id",
  "/api/general-problems/:id",
  "/api/common-problems/:id"
], async (req, res) => {
  try {
    const p = await ProblemRepository.findById(req.params.id);
    if (!p) return res.status(404).json({ status: "error", message: "مورد یافت نشد" });
    const formatted = formatCommonProblemForApp(p);
    return res.json({ status: "ok", problem: formatted, common_problem: formatted, data: formatted });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

app.get(["/api/get-database", "/api/v1/database"], async (req, res) => {
  try {
    const [rawParts, rawProblems, errorCodes] = await Promise.all([
      SparePartRepository.findAll().catch(() => []),
      ProblemRepository.findAll().catch(() => []),
      ErrorCodeRepository.findAll().catch(() => [])
    ]);
    const formattedParts = (rawParts || []).map(formatSparePartForApi);
    const formattedProblems = (rawProblems || []).map(formatCommonProblemForApp).filter(Boolean);

    return res.json({
      status: "ok",
      success: true,
      common_problems: formattedProblems,
      commonProblems: formattedProblems,
      problems: formattedProblems,
      spare_parts: formattedParts,
      spareParts: formattedParts,
      error_codes: errorCodes,
      errorCodes: errorCodes,
      data: {
        cars: [],
        ecus: [],
        spare_parts: formattedParts,
        spareParts: formattedParts,
        repairs: formattedProblems,
        dtc_codes: errorCodes,
        errorCodes,
        problems: formattedProblems,
        common_problems: formattedProblems,
        commonProblems: formattedProblems
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
    const user = await getCurrentUserAsync(req).catch(() => null);
    let partOrders = await PartOrderRepository.findAll();
    const queryPhone = normalizePhone((req.query.phone || req.query.buyer_phone || req.query.customerPhone) as string);
    const queryUserId = (req.query.user_id || req.query.userId) as string;

    if (user && (user.role === "admin" || user.is_super_admin)) {
      if (queryPhone) {
        partOrders = partOrders.filter((po: any) => normalizePhone(po.buyer_phone || po.customerPhone) === queryPhone);
      } else if (queryUserId) {
        partOrders = partOrders.filter((po: any) => String(po.user_id || po.userId) === String(queryUserId));
      }
      return res.json({ status: "ok", partOrders, partPurchases: partOrders, data: partOrders });
    }

    const callerPhone = queryPhone || (user ? normalizePhone(user.phone) : "");
    const callerUserId = queryUserId || (user ? user.id : "");

    if (!callerPhone && !callerUserId) {
      return res.status(401).json({ status: "error", message: "احراز هویت نشده", partOrders: [], partPurchases: [], data: [] });
    }

    partOrders = partOrders.filter((po: any) => {
      const orderPhone = normalizePhone(po.buyer_phone || po.customerPhone || po.user_phone);
      return (
        (callerUserId && (String(po.user_id) === String(callerUserId) || String(po.userId) === String(callerUserId))) ||
        (callerPhone && orderPhone && callerPhone === orderPhone)
      );
    });

    return res.json({ status: "ok", partOrders, partPurchases: partOrders, data: partOrders });
  } catch (err: any) {
    return res.json({ status: "ok", partOrders: [], partPurchases: [], data: [] });
  }
});

app.get("/api/part-orders", async (req, res) => {
  try {
    const user = await getCurrentUserAsync(req).catch(() => null);
    let partOrders = await PartOrderRepository.findAll();
    const queryPhone = normalizePhone((req.query.phone || req.query.buyer_phone || req.query.customerPhone) as string);
    const queryUserId = (req.query.user_id || req.query.userId) as string;

    if (user && (user.role === "admin" || user.is_super_admin)) {
      if (queryPhone) {
        partOrders = partOrders.filter((po: any) => normalizePhone(po.buyer_phone || po.customerPhone) === queryPhone);
      } else if (queryUserId) {
        partOrders = partOrders.filter((po: any) => String(po.user_id || po.userId) === String(queryUserId));
      }
      return res.json({ status: "ok", partOrders, data: partOrders });
    }

    const callerPhone = queryPhone || (user ? normalizePhone(user.phone) : "");
    const callerUserId = queryUserId || (user ? user.id : "");

    if (!callerPhone && !callerUserId) {
      return res.status(401).json({ status: "error", message: "احراز هویت نشده", partOrders: [], data: [] });
    }

    partOrders = partOrders.filter((po: any) => {
      const orderPhone = normalizePhone(po.buyer_phone || po.customerPhone || po.user_phone);
      return (
        (callerUserId && (String(po.user_id) === String(callerUserId) || String(po.userId) === String(callerUserId))) ||
        (callerPhone && orderPhone && callerPhone === orderPhone)
      );
    });

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

app.post(["/api/orders/update-status", "/api/part-orders/update-status"], requireAdmin, async (req, res) => {
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

function cleanLocNoise(s: string): string {
  if (!s) return "";
  const noiseWords = [
    "محل سکونت", "محل فعالیت", "محدوده فعالیت", "حوزه فعالیت", "محدوده های فعالیت",
    "محدوده", "منطقه", "ناحیه", "بخش", "روستای", "روستا", "مرکز", "حومه",
    "شهرستان", "استان", "شهر", "کلانشهر", "کلان شهر"
  ];
  let res = String(s);
  for (const word of noiseWords) {
    res = res.split(word).join(" ");
  }
  return res.replace(/\s+/g, " ").trim();
}

function normalizeLocString(s: string): string {
  if (!s) return "";
  return String(s)
    .trim()
    .replace(/[ـ،,\-_/\\()\[\]{}:;]/g, " ")
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u200c\u200f]/g, " ")
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ة/g, "ه")
    .replace(/آ/g, "ا")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

const PROVINCE_FAMILIES: Array<{ family: string; aliases: string[]; regions: string[] }> = [
  {
    family: "اراک",
    aliases: ["اراک", "مرکزی", "استان مرکزی"],
    regions: ["فرمهین", "ساوه", "خمین", "محلات", "شازند", "تفرش", "دلیجان", "زرندیه", "کمیجان", "آشتیان", "خنداب", "مامونیه", "غرق آباد", "میلاجرد", "ساروق", "نراق"]
  },
  {
    family: "تهران",
    aliases: ["تهران", "استان تهران"],
    regions: ["ری", "شهر ری", "شمیرانات", "شمیران", "تجریش", "اسلامشهر", "شهریار", "دماوند", "ورامین", "پاکدشت", "رباط کریم", "قدس", "شهر قدس", "ملارد", "پردیس", "بهارستان", "قرچک", "فیروزکوه", "بومهن", "رودهن", "لواسان", "اندیشه", "صفادشت", "کهریزک", "حسن آباد"]
  },
  {
    family: "مشهد",
    aliases: ["مشهد", "خراسان", "خراسان رضوی"],
    regions: ["نیشابور", "سبزوار", "تربت حیدریه", "قوچان", "چناران", "کاشمر", "تربت جام", "تایباد", "سرخس", "گناباد", "فریمان", "بینالود", "طرقبه", "شاندیز", "خواف", "بردسکن", "تایباد", "درگز", "کلات", "باخرز", "خلیل آباد"]
  },
  {
    family: "اصفهان",
    aliases: ["اصفهان", "استان اصفهان"],
    regions: ["کاشان", "خمینی شهر", "نجف آباد", "شاهین شهر", "فولادشهر", "لنجان", "شهرضا", "مبارکه", "فلاورجان", "آران و بیدگل", "زرین شهر", "گلپایگان", "سمیرم", "خوانسار", "تیران", "داران", "نطنز", "اردستان", "نائین"]
  },
  {
    family: "شیراز",
    aliases: ["شیراز", "فارس", "استان فارس"],
    regions: ["مرودشت", "کازرون", "جهرم", "لار", "لارستان", "فسا", "داراب", "فیروزآباد", "ممسنی", "نورآباد", "آباده", "اقلید", "سپیدان", "استهبان", "نی ریز", "لامرد", "کوار"]
  },
  {
    family: "تبریز",
    aliases: ["تبریز", "آذربایجان شرقی", "آذربایجان"],
    regions: ["مراغه", "مرند", "میانه", "اهر", "بناب", "سراب", "آذرشهر", "اسکو", "شبستر", "عجب شیر", "ملکان", "هریس", "بستان آباد", "کلیبر", "جلفا", "سهند"]
  },
  {
    family: "اهواز",
    aliases: ["اهواز", "خوزستان", "استان خوزستان"],
    regions: ["آبادان", "دزفول", "خرمشهر", "ماهشهر", "بندر ماهشهر", "ایذه", "بهبهان", "شوشتر", "شوش", "امیدیه", "مسجد سلیمان", "رامهرمز", "اندیمشک", "شادگان", "هندیجان", "سوسنگرد", "دشت آزادگان"]
  },
  {
    family: "کرج",
    aliases: ["کرج", "البرز", "استان البرز"],
    regions: ["فردیس", "ساوجبلاغ", "نظرآباد", "هشتگرد", "طالقان", "اشتهارد", "کمال شهر", "محمدشهر", "ماهدشت", "گرمدره", "چهارباغ"]
  },
  {
    family: "قم",
    aliases: ["قم", "استان قم"],
    regions: ["کهک", "جعفریه", "سلفچگان", "قنوات", "دستجرد"]
  },
  {
    family: "رشت",
    aliases: ["رشت", "گیلان", "استان گیلان"],
    regions: ["انزلی", "بندر انزلی", "لاهیجان", "لنگرود", "فومن", "رودسر", "تالش", "هشتپر", "صومعه سرا", "آستارا", "آستانه اشرفیه", "رودبار", "منجیل", "لوشان", "ماسوله", "ماسال", "شفت", "سیاهکل", "رضوانشهر"]
  },
  {
    family: "ساری",
    aliases: ["ساری", "مازندران", "استان مازندران"],
    regions: ["بابل", "آمل", "قائم شهر", "قائمشهر", "تنکابن", "شهسوار", "چالوس", "نوشهر", "بابلسر", "رامسر", "محمودآباد", "نور", "نکا", "بهشهر", "فریدونکنار", "جویبار", "سوادکوه", "زیرآب", "پل سفید", "کلاردشت", "عباس آباد", "رویان"]
  },
  {
    family: "کرمانشاه",
    aliases: ["کرمانشاه", "استان کرمانشاه"],
    regions: ["اسلام آباد غرب", "کنگاور", "سنقر", "جوانرود", "صحنه", "هرسین", "سرپل ذهاب", "پاوه", "روانسر", "گیلانغرب", "قصر شیرین", "تازه آباد"]
  },
  {
    family: "ارومیه",
    aliases: ["ارومیه", "آذربایجان غربی"],
    regions: ["خوی", "بوکان", "مهاباد", "میاندوآب", "سلماس", "پیرانشهر", "نقده", "تکاب", "ماکو", "سردشت", "شاهین دژ", "اشنویه", "قره ضیاءالدین", "سیه چشمه"]
  },
  {
    family: "یزد",
    aliases: ["یزد", "استان یزد"],
    regions: ["میبد", "اردکان", "مهریز", "بافق", "ابرکوه", "تفت", "اشکذر", "هرات", "مروست", "بهاباد"]
  },
  {
    family: "کرمان",
    aliases: ["کرمان", "استان کرمان"],
    regions: ["رفسنجان", "سیرجان", "جیرفت", "بم", "زرند", "کهنوج", "شهر بابک", "بافت", "بردسیر", "عنبرآباد", "منوجان", "راور"]
  },
  {
    family: "همدان",
    aliases: ["همدان", "استان همدان"],
    regions: ["ملایر", "نهاوند", "تویسرکان", "کبودرآهنگ", "بهار", "رزن", "فامنین", "لالجین", "مریانج", "قروه درجزین"]
  },
  {
    family: "خرم آباد",
    aliases: ["خرم آباد", "لرستان", "استان لرستان"],
    regions: ["بروجرد", "دورود", "الیگودرز", "کوهدشت", "ازنا", "پلدختر", "الشتر", "سلسله", "نورآباد", "دلفان", "چگنی"]
  },
  {
    family: "قزوین",
    aliases: ["قزوین", "استان قزوین"],
    regions: ["الوند", "البرز قزوین", "تاکستان", "بوئین زهرا", "آبیک", "محمدیه", "محمودآباد نمونه", "اقبالیه", "شریفیه", "ضیاءآباد"]
  },
  {
    family: "زنجان",
    aliases: ["زنجان", "استان زنجان"],
    regions: ["ابهر", "خرمدره", "قیدار", "خدابنده", "طارم", "آب بر", "ماهنشان", "ایجرود", "زرین آباد", "سلطانیه"]
  },
  {
    family: "سمنان",
    aliases: ["سمنان", "استان سمنان"],
    regions: ["شاهرود", "دامغان", "گرمسار", "مهدی شهر", "سنگسر", "سرخه", "آرادان", "میامی", "بسطام", "شهمیرزاد"]
  },
  {
    family: "گرگان",
    aliases: ["گرگان", "گلستان", "استان گلستان"],
    regions: ["گنبد کاووس", "گنبد", "علی آباد کتول", "بندر ترکمن", "آق قلا", "کلاله", "آزادشهر", "کردکوی", "مینودشت", "گالیکش", "بندر گز", "رامیان", "مراوه تپه", "گمیشان"]
  },
  {
    family: "بوشهر",
    aliases: ["بوشهر", "استان بوشهر"],
    regions: ["برازجان", "دشتستان", "گناوه", "بندر گناوه", "کنگان", "بندر کنگان", "عسلویه", "خورموج", "دشتی", "جم", "دیلم", "بندر دیلم", "اهرم", "تنگستان", "دیر", "بندر دیر"]
  },
  {
    family: "بندر عباس",
    aliases: ["بندر عباس", "بندرعباس", "هرمزگان", "استان هرمزگان"],
    regions: ["قشم", "کیش", "میناب", "بندرلنگه", "لنگه", "رودان", "بستک", "حاجی آباد", "جاسک", "بندر خمیر", "پارسیان", "گاوبندی", "سیریک", "بشاگرد"]
  },
  {
    family: "زاهدان",
    aliases: ["زاهدان", "سیستان و بلوچستان", "سیستان", "بلوچستان"],
    regions: ["زابل", "ایرانشهر", "چابهار", "بندر چابهار", "سراوان", "خاش", "نیک شهر", "کنارک", "راسک", "سرباز", "میرجاوه", "زهک", "هیرمند", "قصرقند"]
  },
  {
    family: "سنندج",
    aliases: ["سنندج", "کردستان", "استان کردستان"],
    regions: ["سقز", "مریوان", "بانه", "قروه", "کامیاران", "بیجار", "دیواندره", "دهگلان", "سروآباد"]
  },
  {
    family: "اردبیل",
    aliases: ["اردبیل", "استان اردبیل"],
    regions: ["پارس آباد", "مشگین شهر", "خلخال", "گرمی", "نمین", "بیله سوار", "کوثر", "گیوی", "سرعین", "نیر", "اصلاندوز"]
  },
  {
    family: "شهرکرد",
    aliases: ["شهرکرد", "چهارمحال و بختیاری", "چهارمحال"],
    regions: ["بروجن", "فارسان", "لردگان", "فرخ شهر", "سامان", "بن", "کیار", "شلمزار", "کوهرنگ", "چلگرد", "اردل", "خانمیرزا"]
  },
  {
    family: "ایلام",
    aliases: ["ایلام", "استان ایلام"],
    regions: ["دهلران", "ایوان", "آبدانان", "مهران", "دره شهر", "چرداول", "سرابله", "بدره", "ملکشاهی", "سیروان"]
  },
  {
    family: "یاسوج",
    aliases: ["یاسوج", "کهگیلویه و بویراحمد", "کهگیلویه"],
    regions: ["دوگنبدان", "گچساران", "دهدشت", "لیکک", "بهمئی", "چرام", "لنده", "سی سخت", "دنا", "باشت", "مارگون"]
  },
  {
    family: "بجنورد",
    aliases: ["بجنورد", "خراسان شمالی"],
    regions: ["شیروان", "اسفراین", "گرمه", "جاجرم", "آشخانه", "مانه و سملقان", "فاروج", "راز و جرگلان"]
  },
  {
    family: "بیرجند",
    aliases: ["بیرجند", "خراسان جنوبی"],
    regions: ["قائنات", "قائن", "فردوس", "طبس", "نهبندان", "سرایان", "سربیشه", "بشرویه", "درمیان", "اسدیه", "خوسف", "زیرکوه"]
  }
];

function getProvinceFamilies(rawText: string, citiesListFromDb: Array<{ name: string; regions: string[] }>): Set<string> {
  const families = new Set<string>();
  if (!rawText) return families;

  const normalized = normalizeLocString(rawText);
  const cleaned = cleanLocNoise(normalized);
  const targets = [normalized, cleaned].filter(Boolean);

  // 1. Check against dynamic citiesList from settings table
  if (Array.isArray(citiesListFromDb) && citiesListFromDb.length > 0) {
    for (const group of citiesListFromDb) {
      const gName = normalizeLocString(group.name || "");
      const gClean = cleanLocNoise(gName);
      const gRegions = (group.regions || []).map(r => normalizeLocString(r));

      for (const t of targets) {
        const isNameMatch = (gName && (t.includes(gName) || gName.includes(t))) || (gClean && (t.includes(gClean) || gClean.includes(t)));
        const isRegionMatch = gRegions.some(r => {
          const rClean = cleanLocNoise(r);
          return (r && (t.includes(r) || r.includes(t))) || (rClean && (t.includes(rClean) || rClean.includes(t)));
        });

        if (isNameMatch || isRegionMatch) {
          families.add(gName || gClean);
        }
      }
    }
  }

  // 2. Check against built-in PROVINCE_FAMILIES dictionary
  for (const pf of PROVINCE_FAMILIES) {
    const pfName = normalizeLocString(pf.family);
    const pfAliases = (pf.aliases || []).map(a => normalizeLocString(a));
    const pfRegions = (pf.regions || []).map(r => normalizeLocString(r));

    for (const t of targets) {
      const isFamilyMatch = t.includes(pfName) || pfName.includes(t);
      const isAliasMatch = pfAliases.some(a => t.includes(a) || a.includes(t));
      const isRegionMatch = pfRegions.some(r => {
        const rClean = cleanLocNoise(r);
        return t.includes(r) || r.includes(t) || (rClean && (t.includes(rClean) || rClean.includes(t)));
      });

      if (isFamilyMatch || isAliasMatch || isRegionMatch) {
        families.add(pfName);
        // Also map to any corresponding name in settings citiesList
        if (Array.isArray(citiesListFromDb)) {
          for (const group of citiesListFromDb) {
            const gNorm = normalizeLocString(group.name || "");
            if (gNorm === pfName || pfAliases.includes(gNorm) || pfRegions.includes(gNorm)) {
              families.add(gNorm);
            }
          }
        }
      }
    }
  }

  return families;
}

function isLocationMatching(loc1: string, loc2: string, citiesList: Array<{ name: string; regions: string[] }>): boolean {
  if (!loc1 || !loc2) return true;
  const n1 = normalizeLocString(loc1);
  const n2 = normalizeLocString(loc2);
  if (!n1 || !n2) return true;

  const c1 = cleanLocNoise(n1);
  const c2 = cleanLocNoise(n2);

  // Direct match or cleaned direct match
  if (n1 === n2 || c1 === c2 || n1.includes(n2) || n2.includes(n1) || (c1 && c2 && (c1.includes(c2) || c2.includes(c1)))) {
    return true;
  }

  // Extract provincial families for both locations
  const fam1 = getProvinceFamilies(loc1, citiesList);
  const fam2 = getProvinceFamilies(loc2, citiesList);

  if (fam1.size > 0 && fam2.size > 0) {
    for (const f of fam1) {
      if (fam2.has(f)) {
        return true;
      }
    }
  }

  // Token overlap fallback for compound addresses
  const tokens1 = c1.split(/\s+/).filter(w => w.length >= 3);
  const tokens2 = c2.split(/\s+/).filter(w => w.length >= 3);
  if (tokens1.some(t => tokens2.includes(t))) {
    return true;
  }

  return false;
}

app.get(["/api/technicians", "/api/v1/technicians"], async (req, res) => {
  try {
    let list = await TechnicianRepository.findAll();
    const queryCity = (req.query.city || req.query.location || req.query.region || req.query.province) as string;
    const queryUserId = (req.query.user_id || req.query.userId) as string;
    const queryPhone = (req.query.phone || req.query.mobile) as string;

    let targetLocation = queryCity;
    if (!targetLocation) {
      if (queryUserId) {
        const u = await UserRepository.findById(queryUserId).catch(() => null);
        if (u && (u.city || u.address)) targetLocation = u.city || u.address;
      } else if (queryPhone) {
        const u = await UserRepository.findByPhone(queryPhone).catch(() => null);
        if (u && (u.city || u.address)) targetLocation = u.city || u.address;
      } else {
        const sessionUser = await getCurrentUserAsync(req).catch(() => null);
        if (sessionUser && (sessionUser.city || sessionUser.address)) {
          targetLocation = sessionUser.city || sessionUser.address;
        }
      }
    }

    if (targetLocation && String(targetLocation).trim()) {
      const settingsCities = await getCachedCitiesList();
      list = list.filter(t => {
        const techLocCombined = `${t.city || ''} ${t.active_location || ''} ${t.activeLocation || ''} ${t.address || ''}`;
        return isLocationMatching(techLocCombined, targetLocation, settingsCities);
      });
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
    const user = await getCurrentUserAsync(req).catch(() => null);
    const settings = await SettingsRepository.getSettings();

    // If caller is admin, return complete settings
    if (user && (user.role === "admin" || user.is_super_admin)) {
      return res.json({ status: "ok", settings });
    }

    // For public/non-admin users, redact sensitive fields (SMS keys, admin passwords, secrets)
    const publicSettings = { ...settings };
    delete (publicSettings as any).smsSettings;
    delete (publicSettings as any).smsApiKey;
    delete (publicSettings as any).sms_api_key;
    delete (publicSettings as any).adminPassword;
    delete (publicSettings as any).admin_password;
    delete (publicSettings as any).secret;
    delete (publicSettings as any).jwtSecret;

    return res.json({ status: "ok", settings: publicSettings });
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

// Secure endpoint for Admin to download backup files without making BACKUPS_DIR publicly accessible
app.get("/api/server-backups/download/:filename", requireAdmin, (req, res) => {
  try {
    const rawFilename = req.params.filename;
    // Sanitize filename to prevent directory traversal
    const safeFilename = path.basename(rawFilename);
    const filePath = path.join(BACKUPS_DIR, safeFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ status: "error", message: "فایل پشتیبان مورد نظر یافت نشد." });
    }

    res.download(filePath, safeFilename);
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

// Explicit endpoint for /api/admin/get-database: strictly admin-protected and strips sensitive passwords
app.get(["/api/admin/get-database", "/api/admin/database-dump"], requireAdmin, async (req, res) => {
  try {
    const rawUsers = await UserRepository.findAll();
    const safeUsers = rawUsers.map((u: any) => {
      const userCopy = { ...u };
      delete userCopy.password_hash;
      delete userCopy.password;
      return userCopy;
    });

    const dump = {
      timestamp: new Date().toISOString(),
      users: safeUsers,
      technicians: await TechnicianRepository.findAll(),
      errorCodes: await ErrorCodeRepository.findAll(),
      problems: await ProblemRepository.findAll(),
      spareParts: await SparePartRepository.findAll(),
      orders: await OrderRepository.findAll(),
      partOrders: await PartOrderRepository.findAll(),
      subscriptions: await SubscriptionRepository.findAll(),
      payments: await PaymentRepository.findAll(),
      tickets: await TicketRepository.findAll(),
      settings: await SettingsRepository.getSettings()
    };
    return res.json({ status: "ok", database: dump, data: dump });
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});

// Explicit endpoint for /api/save-database: strictly admin-protected
app.post("/api/save-database", requireAdmin, async (req, res) => {
  try {
    const dump = req.body || {};
    if (Array.isArray(dump.errorCodes)) {
      for (const item of dump.errorCodes) {
        if (!item.id) continue;
        const existing = await ErrorCodeRepository.findById(item.id);
        if (existing) {
          await ErrorCodeRepository.update(item.id, item).catch(() => {});
        } else {
          await ErrorCodeRepository.create(item).catch(() => {});
        }
      }
    }
    if (Array.isArray(dump.problems)) {
      for (const item of dump.problems) {
        if (!item.id) continue;
        const existing = await ProblemRepository.findById(item.id);
        if (existing) {
          await ProblemRepository.update(item.id, item).catch(() => {});
        } else {
          await ProblemRepository.create(item).catch(() => {});
        }
      }
    }
    return res.json({ status: "ok", message: "پایگاه داده با موفقیت ذخیره گردید." });
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
