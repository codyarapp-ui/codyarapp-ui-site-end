import { Request, Response, NextFunction } from "express";
import { getCurrentUserAsync } from "../db/db";

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await getCurrentUserAsync(req);

    if (!user) {
      return res.status(401).json({ status: "error", error: "جهت دسترسی به این بخش باید وارد حساب کاربری شوید." });
    }

    if (user.role !== "admin" && !user.is_super_admin) {
      return res.status(403).json({ status: "error", error: "دسترسی غیرمجاز. فقط مدیر ارشد سیستم مجاز است." });
    }

    (req as any).user = user;
    next();
  } catch (err: any) {
    return res.status(500).json({ status: "error", error: "خطا در اعتبارسنجی سطح دسترسی مدیر: " + err.message });
  }
}
