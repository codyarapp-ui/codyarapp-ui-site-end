/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  Search, 
  User, 
  MapPin, 
  Clock, 
  ListOrdered, 
  TrendingUp, 
  Database, 
  Flame, 
  Check, 
  Bell, 
  MessageSquare,
  Sparkles,
  ShoppingBag,
  ArrowRightLeft,
  Truck,
  Heart,
  Smartphone,
  PhoneCall,
  Laptop,
  Shield,
  Home,
  Megaphone,
  X
} from 'lucide-react';
import { ErrorCode, RepairOrder, Technician, SparePart, Notification, CommonProblem, PartPurchase } from './types';
import { 
  INITIAL_ERROR_CODES, 
  INITIAL_TECHNICIANS, 
  INITIAL_REPAIR_ORDERS, 
  INITIAL_SPARE_PARTS, 
  INITIAL_AFFILIATE_PRODUCTS,
  IRAN_CITIES,
  APPLIANCE_BRANDS,
  APPLIANCE_CATEGORIES,
  INITIAL_COMMON_PROBLEMS
} from './data';
import { NotificationCenter } from './components/NotificationCenter';
import { PartsStore } from './components/PartsStore';
import { ErrorSearch } from './components/ErrorSearch';
import { BookingForm } from './components/BookingForm';
import { TechnicianPanel } from './components/TechnicianPanel';
import { AdminPanel } from './components/AdminPanel';
import { ForcedPasswordChange } from './components/ForcedPasswordChange';
import { InfoPageModal } from './components/InfoPageModal';
import { TechnicianAuth } from './components/TechnicianAuth';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ClientDashboard } from './components/ClientDashboard';
import { harmonizeErrorCode } from './components/validation';

export const cleanModelsList = (list: string[]): string[] => {
  if (!Array.isArray(list)) return [];
  const debris = [
    "تیکه", "دو", "اری", "sh", "ch", "g", "t-1", "undefined", "null", "بانه", "ای",
    "و", "یا", "مدل", "عمومی", "کد", "دستگاه", "سایر", "دیواری", "ایستاده", "اسپلیت",
    "پکیج", "کولر", "گازی", "کاستی", "کانالی", "سقفی", "زمینی", "پنجره", "پنجره ای",
    "اینورتر", "inverter", "floor", "stand"
  ];
  return list
    .map(m => String(m || "").trim())
    .filter(m => {
      if (!m || m.length <= 1) return false;
      if (/^\d+$/.test(m)) return false;
      if (debris.includes(m.toLowerCase())) return false;
      return true;
    })
    .filter((value, index, self) => self.indexOf(value) === index);
};

export const cleanCitiesList = (list: any): { name: string; regions: string[] }[] => {
  const rawList = Array.isArray(list) ? list : [];
  const parsed = rawList.map(item => {
    if (typeof item === 'string') {
      return { name: item.trim(), regions: [] };
    }
    if (item && typeof item === 'object') {
      return {
        name: String(item.name || '').trim(),
        regions: Array.isArray(item.regions) ? item.regions.map((r: any) => String(r || '').trim()).filter(Boolean) : []
      };
    }
    return null;
  }).filter((c): c is { name: string; regions: string[] } => !!c && !!c.name);

  const cityMap = new Map<string, string[]>();

  parsed.forEach(c => {
    const existing = cityMap.get(c.name) || [];
    const combined = Array.from(new Set([...existing, ...c.regions]));
    cityMap.set(c.name, combined);
  });

  return Array.from(cityMap.entries()).map(([name, regions]) => ({ name, regions }));
};

export const cleanErrorCodesList = (list: any): ErrorCode[] => {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const cleaned: ErrorCode[] = [];
  for (const item of list) {
    if (item && typeof item === 'object' && item.id) {
      const idStr = String(item.id).trim();
      if (!seen.has(idStr)) {
        seen.add(idStr);
        cleaned.push(item as ErrorCode);
      }
    }
  }
  return cleaned;
};

export const cleanCommonProblemsList = (list: any): CommonProblem[] => {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const cleaned: CommonProblem[] = [];
  for (const item of list) {
    if (item && typeof item === 'object' && item.id) {
      const idStr = String(item.id).trim();
      if (!seen.has(idStr)) {
        seen.add(idStr);
        cleaned.push(item as CommonProblem);
      }
    }
  }
  return cleaned;
};

export const cleanTechniciansList = (list: any): Technician[] => {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const cleaned: Technician[] = [];
  for (const item of list) {
    if (item && typeof item === 'object' && item.id) {
      const idStr = String(item.id).trim();
      if (!seen.has(idStr)) {
        seen.add(idStr);
        cleaned.push(item as Technician);
      }
    }
  }
  return cleaned;
};

export const cleanOrdersList = (list: any): RepairOrder[] => {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const cleaned: RepairOrder[] = [];
  for (const item of list) {
    if (item && typeof item === 'object' && item.id) {
      const idStr = String(item.id).trim();
      if (!seen.has(idStr)) {
        seen.add(idStr);
        cleaned.push(item as RepairOrder);
      }
    }
  }
  return cleaned;
};

export const cleanSparePartsList = (list: any): SparePart[] => {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const cleaned: SparePart[] = [];
  for (const item of list) {
    if (item && typeof item === 'object' && item.id) {
      const idStr = String(item.id).trim();
      if (!seen.has(idStr)) {
        seen.add(idStr);

        let compatibility: string[] = [];
        const compRaw = item.compatibility || item.compatibleModels || item.compatible_models;
        if (Array.isArray(compRaw)) {
          compatibility = compRaw.map((x: any) => String(x || '').trim()).filter(Boolean);
        } else if (typeof compRaw === 'string' && compRaw.trim()) {
          try {
            const parsed = JSON.parse(compRaw);
            if (Array.isArray(parsed)) {
              compatibility = parsed.map((x: any) => String(x || '').trim()).filter(Boolean);
            } else {
              compatibility = compRaw.split(',').map((x: string) => x.trim()).filter(Boolean);
            }
          } catch {
            compatibility = compRaw.split(',').map((x: string) => x.trim()).filter(Boolean);
          }
        }

        const img = item.image || item.imageUrl || item.image_url || '';
        const nameVal = item.name || item.title || 'قطعه یدکی';
        const codeVal = item.code || item.partNumber || item.part_number || '';

        cleaned.push({
          ...item,
          id: idStr,
          name: nameVal,
          title: nameVal,
          category: item.category || 'عمومی',
          brand: item.brand || (compatibility[0] || ''),
          price: Number(item.price) || 0,
          stock: Number(item.stock) || 0,
          image: img,
          imageUrl: img,
          image_url: img,
          code: codeVal,
          partNumber: codeVal,
          part_number: codeVal,
          description: item.description || '',
          compatibility,
          compatibleModels: compatibility,
          compatible_models: compatibility
        } as SparePart);
      }
    }
  }
  return cleaned;
};

const DEFAULT_CATEGORIES: string[] = [];
const DEFAULT_BRANDS: string[] = [];
const DEFAULT_MODELS: string[] = [];
const DEFAULT_CITIES: { name: string; regions: string[] }[] = [];

export default function App() {
  const lastLocalUpdateRef = React.useRef(0);
  // Current user / auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [clientActiveTab, setClientActiveTab] = useState<'search' | 'dashboard'>('search');

  const checkAuth = async () => {
    setIsAuthChecking(true);
    try {
      const token = localStorage.getItem('session_user_id') || '';
      const response = await fetch('/api/auth/me', {
        headers: {
          'X-Session-Token': token
        }
      });
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          if (data.status === 'ok' && data.user) {
            setCurrentUser(data.user);
            localStorage.setItem('session_user_id', data.user.id);
            if ((data.user.role === 'admin' || data.user.is_super_admin) && !loggedInTechId) {
              setCurrentRole('admin');
              setRoleSelection('admin');
            }
            // Real-time synchronization: pull updated database collections (e.g. usersList) on login or registration
            loadDatabase();
            return data.user;
          }
        } else {
          console.warn('Expected JSON response from checkAuth, but got:', contentType);
        }
      }
      setCurrentUser(null);
      return null;
    } catch (error) {
      console.error('Error checking auth:', error);
      setCurrentUser(null);
      return null;
    } finally {
      setIsAuthChecking(false);
    }
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.is_super_admin === 1 || currentUser?.is_super_admin === true;

  // Current user role view
  const [currentRole, setCurrentRole] = useState<'client' | 'technician' | 'admin'>(() => {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') {
      const savedRole = localStorage.getItem('ir_current_role');
      if (savedRole === 'admin' || savedRole === 'client') {
        return savedRole;
      }
      return 'client';
    }

    const savedRole = localStorage.getItem('ir_current_role');
    if (savedRole === 'admin' || savedRole === 'technician' || savedRole === 'client') {
      return savedRole as 'client' | 'technician' | 'admin';
    }
    const loggedTechId = localStorage.getItem('ir_logged_in_tech_id');
    if (loggedTechId) {
      return 'technician';
    }
    return 'client';
  });

  const [roleSelection, setRoleSelection] = useState<'none' | 'client' | 'technician' | 'admin'>(() => {
    const path = window.location.pathname;
    if (path === '/' || path === '/index.html') {
      const savedSel = localStorage.getItem('ir_role_selection');
      if (savedSel === 'admin' || savedSel === 'client' || savedSel === 'none') {
        return savedSel as 'none' | 'client' | 'admin';
      }
      return 'none';
    }

    const savedSel = localStorage.getItem('ir_role_selection');
    if (savedSel === 'admin' || savedSel === 'technician' || savedSel === 'client' || savedSel === 'none') {
      return savedSel as 'none' | 'client' | 'technician' | 'admin';
    }
    const loggedTechId = localStorage.getItem('ir_logged_in_tech_id');
    if (loggedTechId) {
      return 'technician';
    }
    return 'none'; // Starts on the role-selection landing gateway by default
  });

  // Automatically synchronize role and selection states to localStorage
  useEffect(() => {
    localStorage.setItem('ir_current_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('ir_role_selection', roleSelection);
  }, [roleSelection]);
  
  // Storage states
  const [errorCodes, _setErrorCodes] = useState<ErrorCode[]>([]);
  const setErrorCodes = (val: ErrorCode[] | ((prev: ErrorCode[]) => ErrorCode[])) => {
    if (typeof val === 'function') {
      _setErrorCodes(prev => cleanErrorCodesList(val(prev)));
    } else {
      _setErrorCodes(cleanErrorCodesList(val));
    }
  };

  const [commonProblems, _setCommonProblems] = useState<CommonProblem[]>([]);
  const setCommonProblems = (val: CommonProblem[] | ((prev: CommonProblem[]) => CommonProblem[])) => {
    if (typeof val === 'function') {
      _setCommonProblems(prev => cleanCommonProblemsList(val(prev)));
    } else {
      _setCommonProblems(cleanCommonProblemsList(val));
    }
  };

  const [technicians, _setTechnicians] = useState<Technician[]>([]);
  const setTechnicians = (val: Technician[] | ((prev: Technician[]) => Technician[])) => {
    if (typeof val === 'function') {
      _setTechnicians(prev => cleanTechniciansList(val(prev)));
    } else {
      _setTechnicians(cleanTechniciansList(val));
    }
  };

  const [orders, _setOrders] = useState<RepairOrder[]>([]);
  const setOrders = (val: RepairOrder[] | ((prev: RepairOrder[]) => RepairOrder[])) => {
    if (typeof val === 'function') {
      _setOrders(prev => cleanOrdersList(val(prev)));
    } else {
      _setOrders(cleanOrdersList(val));
    }
  };

  const [spareParts, _setSpareParts] = useState<SparePart[]>([]);
  const setSpareParts = (val: SparePart[] | ((prev: SparePart[]) => SparePart[])) => {
    if (typeof val === 'function') {
      _setSpareParts(prev => cleanSparePartsList(val(prev)));
    } else {
      _setSpareParts(cleanSparePartsList(val));
    }
  };
  const [partPurchases, setPartPurchases] = useState<PartPurchase[]>(() => {
    try {
      const saved = localStorage.getItem('ir_purchases');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return localStorage.getItem('ir_admin_password') || '';
  });
  const [smsSettings, setSmsSettings] = useState<any>({
    provider: 'simulated',
    apiKey: '',
    lineNumber: '',
    otpPatternCode: '',
    statusNotificationPatternCode: '',
    enabled: false
  });
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
const reconcileSubscriptionsWithPayments = (subs: any[], payments: any[]) => {
  const plansList = [
    { id: "1_month", name: "اشتراک ۱ ماهه کدهای خطا", duration_days: 30 },
    { id: "3_month", name: "اشتراک ۳ ماهه کدهای خطا", duration_days: 90 },
    { id: "6_month", name: "اشتراک ۶ ماهه کدهای خطا", duration_days: 180 },
    { id: "12_month", name: "اشتراک ۱۲ ماهه کدهای خطا", duration_days: 365 },
    { id: "permanent", name: "اشتراک دائمی همکار / مدیریت", duration_days: 36500 }
  ];

  const resultSubs = Array.isArray(subs) ? [...subs] : [];
  const existingSubIds = new Set(resultSubs.map(s => String(s.id)));
  const existingPayIds = new Set(resultSubs.map(s => String(s.payment_id || s.paymentId)).filter(Boolean));

  if (Array.isArray(payments)) {
    for (const pay of payments) {
      if (pay && (pay.status === 'completed' || pay.status === 'confirmed')) {
        const isSubPay = pay.type === 'subscription' || pay.related_type === 'subscription' || (pay.related_id && (String(pay.related_id).includes('month') || pay.related_id === 'permanent')) || (pay.plan && !pay.partId);
        if (isSubPay) {
          const subId = `sub_pay_${pay.id}`;
          const planKey = pay.plan || pay.related_id || "1_month";
          const matchedPlan = plansList.find(p => p.id === planKey) || {
            id: planKey,
            name: String(planKey).includes("12") ? "اشتراک ۱۲ ماهه کدهای خطا" : String(planKey).includes("6") ? "اشتراک ۶ ماهه کدهای خطا" : String(planKey).includes("3") ? "اشتراک ۳ ماهه کدهای خطا" : "اشتراک ۱ ماهه کدهای خطا",
            duration_days: String(planKey).includes("12") ? 365 : String(planKey).includes("6") ? 180 : String(planKey).includes("3") ? 90 : 30
          };

          const hasMatchingSub = existingSubIds.has(subId) || existingPayIds.has(String(pay.id)) || resultSubs.some(s => (String(s.user_id) === String(pay.user_id) || String(s.userId) === String(pay.user_id)) && (s.plan_id === planKey || s.plan === planKey));

          if (!hasMatchingSub) {
            const startDate = pay.created_at || new Date().toISOString();
            const expDate = new Date(new Date(startDate).getTime() + (matchedPlan.duration_days || 30) * 24 * 60 * 60 * 1000).toISOString();
            const autoSub = {
              id: subId,
              user_id: pay.user_id || pay.user_phone || "usr_client",
              userId: pay.user_id || pay.user_phone || "usr_client",
              plan_id: matchedPlan.id,
              plan_name: matchedPlan.name,
              planName: matchedPlan.name,
              plan: matchedPlan.id,
              payment_id: pay.id,
              start_date: startDate,
              end_date: expDate,
              expiry_date: expDate,
              status: 'active',
              is_active: true,
              is_premium: true
            };
            resultSubs.push(autoSub);
            existingSubIds.add(subId);
            existingPayIds.add(String(pay.id));
          }
        }
      }
    }
  }
  return resultSubs;
};

  const [usersList, setUsersList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('ir_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [paymentsList, setPaymentsList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('ir_payments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [subscriptionsList, setSubscriptionsList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('ir_subscriptions');
      const savedSubs = saved ? JSON.parse(saved) : [];
      const savedPays = localStorage.getItem('ir_payments');
      const parsedPays = savedPays ? JSON.parse(savedPays) : [];
      return reconcileSubscriptionsWithPayments(savedSubs, parsedPays);
    } catch {
      return [];
    }
  });
  
  const [adminAnnouncement, setAdminAnnouncement] = useState<{
    text: string;
    isActive: boolean;
    style: 'info' | 'warning' | 'success' | 'danger';
  }>(() => {
    try {
      const saved = localStorage.getItem('ir_announcement');
      return saved ? JSON.parse(saved) : { text: '', isActive: false, style: 'info' };
    } catch {
      return { text: '', isActive: false, style: 'info' };
    }
  });

  const [trustBadges, setTrustBadges] = useState<{
    badge1Link: string;
    badge1Image: string;
    badge2Link: string;
    badge2Image: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('ir_trust_badges');
      return saved ? JSON.parse(saved) : {
        badge1Link: 'https://enamad.ir',
        badge1Image: '',
        badge2Link: 'https://samandehi.ir',
        badge2Image: ''
      };
    } catch {
      return {
        badge1Link: '',
        badge1Image: '',
        badge2Link: '',
        badge2Image: ''
      };
    }
  });
  
  const [supportPhone, setSupportPhone] = useState<string>(() => {
    return localStorage.getItem('ir_support_phone') || '۱۸۴۰';
  });

  const [affiliateProducts, setAffiliateProducts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('ir_affiliate_products');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [categoryConfig, setCategoryConfig] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('ir_category_config');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [pageContents, setPageContents] = useState<{
    aboutUs: string;
    contactUs: string;
    rules: string;
    dispute: string;
    appDownloadUrl?: string;
  }>(() => {
    try {
      const saved = localStorage.getItem('ir_page_contents');
      return saved ? JSON.parse(saved) : {
        aboutUs: `مجتمع فنی کدیار۲۴ با ارائه خدمات تخصصی عیب‌یابی و تعمیرات انواع لوازم خانگی، پکیج و کولر گازی، بستری امن و هوشمند برای ارتباط مشتریان با تکنسین‌های مجرب فراهم کرده است.`,
        contactUs: `دفتر مرکزی تهران: خیابان ولیعصر، بالاتر از میدان ولیعصر، مجتمع اداری تجاری ایرانیان، طبقه ۵، واحد ۱۲\n📞 تلفن تماس پشتیبانی فوری: ۱۸۴۰\n✉️ پست الکترونیک: office@kodyar24.ir\nساعات پاسخگویی تیم پشتیبانی تلفنی: ۷ صبح الی ۲۳ شب (تمام روزهای هفته)`,
        rules: `۱. تمام تکنسین‌های منتخب دارای گواهی عدم سوء‌پیشینه و مدارک فنی و حرفه‌ای معتبر می‌باشند.\n۲. نرخ تمامی اقدامات فنی و قطعات بر اساس مصوبه رسمی اتحادیه محاسبه می‌شود.\n۳. قطعات مصرفی تا ۱۸۰ روز شامل گارانتی کتبی خواهند بود.`,
        dispute: `در صورت بروز هرگونه ابهام، مغایرت در رفتار تکنسین یا تعرفه دریافتی، کاربری می‌تواند حداکثر ظرف ۴۸ ساعت پس از اتمام کار برگه‌ شکایت خود را جهت بازبینی مبالغ پرداختی ثبت نماید. داوران مجتمع ظرف ۱۲ ساعت به موضوع رسیدگی خواهند کرد و در صورت تایید مغایرت، مبالغ اضافی عودت داده می‌شود.`,
        appDownloadUrl: `https://kodyar24.ir/download/app.apk`
      };
    } catch {
      return {
        aboutUs: 'درباره ما',
        contactUs: 'تماس با ما',
        rules: 'قوانین و مقررات',
        dispute: 'حل اختلاف و شکایت',
        appDownloadUrl: 'https://kodyar24.ir/download/app.apk'
      };
    }
  });

  const [userFeedbacks, setUserFeedbacks] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('ir_user_feedbacks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [openedInfoPage, setOpenedInfoPage] = useState<{
    isOpen: boolean;
    pageId: 'about' | 'contact' | 'rules' | 'dispute' | 'insurance' | 'settlement' | 'union' | '';
    title: string;
  }>({
    isOpen: false,
    pageId: '',
    title: ''
  });

  const [announcementDismissed, setAnnouncementDismissed] = useState<boolean>(() => {
    const savedText = localStorage.getItem('ir_announcement_dismissed_text');
    try {
      const savedAnnouncement = localStorage.getItem('ir_announcement');
      if (savedAnnouncement && savedText) {
        const parsed = JSON.parse(savedAnnouncement);
        return parsed.text === savedText;
      }
    } catch {}
    return false;
  });
  
  // Base metadata customizable by Admin
  const [citiesList, setCitiesList] = useState<{name: string, regions: string[]}[]>(() => {
    try {
      const saved = localStorage.getItem('ir_cities');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [brandsList, setBrandsList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ir_brands');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [categoriesList, setCategoriesList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ir_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  const [modelsList, setModelsList] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ir_models');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // Logged in technician ID state
  const [loggedInTechId, setLoggedInTechId] = useState<string | null>(null);

  const handleSetLoggedInTechId = (id: string | null) => {
    setLoggedInTechId(id);
    if (id) {
      localStorage.setItem('ir_logged_in_tech_id', id);
    } else {
      localStorage.removeItem('ir_logged_in_tech_id');
    }
  };
  
  // Phone number digits normalizer to English
  const toEnglishDigits = (str: string): string => {
    if (!str) return '';
    return str.toString()
      .trim()
      .replace(/[\u0660-\u0669\u06f0-\u06f9]/g, c => (c.charCodeAt(0) & 0xf).toString())
      .replace(/\D/g, '');
  };

  // Client specific states
  const [selectedError, setSelectedError] = useState<ErrorCode | null>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [referredTech, setReferredTech] = useState<Technician | null>(null);
  const [preselectedTechForBooking, setPreselectedTechForBooking] = useState<Technician | null>(null);
  const [trackingPhoneNumber, setTrackingPhoneNumber] = useState('');

  // Referral URL query parameter listener
  useEffect(() => {
    if (technicians && technicians.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const techRef = params.get('tech') || params.get('ref') || params.get('technician');
      if (techRef) {
        const found = technicians.find(t => String(t.id) === String(techRef));
        if (found) {
          setReferredTech(found);
          sessionStorage.setItem('ir_referred_tech', JSON.stringify(found));
        }
      } else {
        const saved = sessionStorage.getItem('ir_referred_tech');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const found = technicians.find(t => String(t.id) === String(parsed.id));
            if (found) setReferredTech(found);
          } catch (e) {}
        }
      }
    }
  }, [technicians]);
  const [activeTrackingOrder, setActiveTrackingOrder] = useState<RepairOrder | null>(null);
  const [successOrder, setSuccessOrder] = useState<RepairOrder | null>(null);
  const [selectedTech, setSelectedTech] = useState<Technician | null>(null);

  // Filter transmission for parts shop
  const [shopCategoryFilter, setShopCategoryFilter] = useState('');
  const [shopBrandFilter, setShopBrandFilter] = useState('');

  // Admin passcode modal entry states
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [adminLoginPasswordInput, setAdminLoginPasswordInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  const handleCancelAdminLogin = () => {
    setIsAdminLoginModalOpen(false);
    setAdminLoginPasswordInput('');
    setAdminLoginError('');
    window.history.pushState({}, '', '/');
    setCurrentRole('client');
    setRoleSelection('none');
  };

  const handleSubmitAdminLogin = async () => {
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: adminLoginPasswordInput })
      });
      const data = await response.json();
      if (response.ok && data.status === 'ok') {
        const userObj = data.user || {
          id: 'us_admin_root',
          full_name: 'مدیر کل پلتفرم',
          name: 'مدیر کل پلتفرم',
          role: 'admin',
          phone: '09120000000',
          is_super_admin: true
        };
        localStorage.setItem('session_user_id', String(userObj.id));
        setCurrentUser(userObj);
        setCurrentRole('admin');
        setRoleSelection('admin');
        setIsAdminLoginModalOpen(false);
        setAdminLoginPasswordInput('');
        setAdminLoginError('');
        triggerNotification('ورود موفق مدیریت', 'شما به عنوان مدیر عالی پلتفرم وارد شدید.', 'success');
        await loadDatabase(true);
      } else {
        setAdminLoginError(typeof data.error === 'string' ? data.error : (data.error?.message || data.message || 'کلمه عبور وارد شده نادرست است!'));
      }
    } catch (e) {
      setAdminLoginError('خطا در ارتباط با سرور.');
    }
  };

  // Backups and recovery state
  const [backupsList, setBackupsList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('ir_database_backups');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isBackupManagerOpen, setIsBackupManagerOpen] = useState(false);
  const [activeBackupTab, setActiveBackupTab] = useState<'server' | 'client'>('server');
  const [serverBackups, setServerBackups] = useState<any[]>([]);
  const [isLoadingServerBackups, setIsLoadingServerBackups] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const triggerCustomConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm
    });
  };

  const fetchServerBackups = async () => {
    setIsLoadingServerBackups(true);
    try {
      const res = await fetch('/api/server-backups');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setServerBackups(data.backups);
        }
      }
    } catch (err) {
      console.error('Error fetching server backups:', err);
    } finally {
      setIsLoadingServerBackups(false);
    }
  };

  const createServerBackup = async () => {
    try {
      const res = await fetch('/api/server-backups/create', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          triggerNotification('پشتیبان‌گیری ابری موفقیت‌آمیز', 'یک نسخه پشتیبان با اصالت روی سرور ایجاد و ذخیره شد.', 'success');
          fetchServerBackups();
        } else {
          triggerNotification('خطای پشتیبان‌گیری', data.error || 'ایجاد نسخه پشتیبان ناموفق بود.', 'error');
        }
      } else {
        triggerNotification('خطای پشتیبان‌گیری', 'اتصال به سرور برقرار نشد.', 'error');
      }
    } catch (err) {
      console.error('Error creating server backup:', err);
      triggerNotification('خطای پشتیبان‌گیری', 'اتصال به سرور برقرار نشد.', 'error');
    }
  };

  const restoreServerBackup = async (fileName: string) => {
    try {
      const res = await fetch('/api/server-backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          triggerNotification('بازیابی موفقیت‌آمیز', 'کل اطلاعات پلتفرم با موفقیت به نسخه پشتیبان سرور بازیابی شد. صفحه جهت اعمال تغییرات بروزرسانی می‌شود.', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          triggerNotification('خطای بازیابی', data.error || 'بازیابی نسخه پشتیبان ناموفق بود.', 'error');
        }
      } else {
        triggerNotification('خطای بازیابی', 'اتصال به سرور برقرار نشد.', 'error');
      }
    } catch (err) {
      console.error('Error restoring server backup:', err);
      triggerNotification('خطای بازیابی', 'اتصال به سرور برقرار نشد.', 'error');
    }
  };

  const deleteServerBackup = async (fileName: string) => {
    try {
      const res = await fetch(`/api/server-backups/${fileName}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          triggerNotification('حذف موفقیت‌آمیز', 'نسخه پشتیبان از روی سرور حذف گردید.', 'success');
          fetchServerBackups();
        }
      }
    } catch (err) {
      console.error('Error deleting server backup:', err);
    }
  };

  const uploadAndRestoreDatabase = async (jsonPayload: any) => {
    try {
      const res = await fetch('/api/server-backups/upload-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonPayload)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          triggerNotification('بارگذاری و بازیابی موفق', 'کل پایگاه داده سرور با فایل ارسالی با موفقیت بازنویسی و بازیابی شد. صفحه بازنشانی می‌شود.', 'success');
          setTimeout(() => {
            window.location.reload();
          }, 1500);
          return true;
        }
      }
      triggerNotification('خطای بارگذاری', 'بارگذاری فایل روی سرور با شکست مواجه شد.', 'error');
      return false;
    } catch (err) {
      console.error('Error in uploadAndRestoreDatabase:', err);
      triggerNotification('خطای ارتباط با سرور', 'بارگذاری فایل روی سرور با شکست مواجه شد.', 'error');
      return false;
    }
  };

  useEffect(() => {
    if (isBackupManagerOpen) {
      fetchServerBackups();
    }
  }, [isBackupManagerOpen]);

  const latestStateRef = useRef<any>({});

  useEffect(() => {
    latestStateRef.current = {
      orders,
      technicians,
      errorCodes,
      commonProblems,
      spareParts,
      citiesList,
      brandsList,
      categoriesList,
      modelsList,
      partPurchases,
      notifications
    };
  }, [orders, technicians, errorCodes, commonProblems, spareParts, citiesList, brandsList, categoriesList, modelsList, partPurchases, notifications]);

  const createBackup = (isAuto = false) => {
    try {
      const state = latestStateRef.current;
      const backupData = {
        orders: state.orders || [],
        technicians: state.technicians || [],
        errorCodes: state.errorCodes || [],
        commonProblems: state.commonProblems || [],
        spareParts: state.spareParts || [],
        citiesList: state.citiesList || [],
        brandsList: state.brandsList || [],
        categoriesList: state.categoriesList || [],
        modelsList: state.modelsList || [],
        partPurchases: state.partPurchases || [],
        notifications: state.notifications || []
      };

      const timestamp = Date.now();
      const formattedDate = new Date().toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const hash = `hash_${Math.random().toString(36).substring(2, 9)}_${timestamp}`;

      const newBackupItem: any = {
        id: hash,
        timestamp,
        formattedDate,
        isAuto,
        dataSizeKB: Math.round(JSON.stringify(backupData).length / 1024),
        data: backupData
      };

      const existingRaw = localStorage.getItem('ir_database_backups');
      let backups: any[] = [];
      if (existingRaw) {
        try {
          backups = JSON.parse(existingRaw);
        } catch {
          backups = [];
        }
      }

      backups.unshift(newBackupItem);

      // Keep only up to 4 historical backups to save significant localStorage space (previously 10)
      if (backups.length > 4) {
        backups = backups.slice(0, 4);
      }

      // Quota-resilient saving mechanism
      let success = false;
      let maxBackups = 4;
      let stripLargeData = false;

      while (!success && maxBackups >= 0) {
        if (stripLargeData) {
          // Strip massive redundant dataset (like static errorCodes) from backups to free up massive chunks of space
          if (newBackupItem.data && newBackupItem.data.errorCodes) {
            delete newBackupItem.data.errorCodes;
            newBackupItem.dataSizeKB = Math.round(JSON.stringify(newBackupItem.data).length / 1024);
          }
          backups.forEach(b => {
            if (b.data && b.data.errorCodes) {
              delete b.data.errorCodes;
              b.dataSizeKB = Math.round(JSON.stringify(b.data).length / 1024);
            }
          });
        }

        if (backups.length > maxBackups) {
          backups = backups.slice(0, maxBackups);
        }

        if (maxBackups === 0) {
          // If we can't even save one tiny backup, we clear everything to protect app integrity
          localStorage.removeItem('ir_database_backups');
          backups = [];
          success = true;
          break;
        }

        try {
          localStorage.setItem('ir_database_backups', JSON.stringify(backups));
          success = true;
        } catch (e: any) {
          if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22) {
            console.warn(`LocalStorage quota exceeded. Retrying with fewer backups (max: ${maxBackups - 1}) or stripped metadata...`);
            if (maxBackups > 1) {
              maxBackups--;
              if (backups.length > 0) {
                backups.pop();
              }
            } else if (!stripLargeData) {
              stripLargeData = true;
            } else {
              maxBackups = 0;
            }
          } else {
            throw e;
          }
        }
      }

      setBackupsList(backups);
      
      if (!isAuto) {
        triggerNotification('پشتیبان‌گیری موفقیت‌آمیز', 'نسخه پشتیبان محلی با موفقیت ذخیره شد.', 'success');
      } else {
        console.log(`[Auto-Backup] Completed successfully at ${formattedDate}`);
      }
      return backups;
    } catch (error) {
      console.error('Error creating database backup:', error);
      if (!isAuto) {
        triggerNotification('خطای پشتیبان‌گیری', 'ذخیره نسخه پشتیبان با شکست مواجه شد.', 'error');
      }
      return [];
    }
  };

  const rollbackToBackup = async (backupId: string) => {
    try {
      const existingRaw = localStorage.getItem('ir_database_backups');
      if (!existingRaw) return false;
      const backups = JSON.parse(existingRaw);
      const found = backups.find((b: any) => b.id === backupId);
      if (!found) {
        triggerNotification('خطای بازیابی', 'نسخه پشتیبان مورد نظر یافت نشد.', 'error');
        return false;
      }

      const { data } = found;
      
      // Update React states & client storage
      if (data.orders) {
        setOrders(data.orders);
        localStorage.setItem('ir_orders', JSON.stringify(data.orders));
      }
      if (data.technicians) {
        setTechnicians(data.technicians);
        localStorage.setItem('ir_techs', JSON.stringify(data.technicians));
      }
      if (data.errorCodes) {
        setErrorCodes(data.errorCodes);
        localStorage.setItem('ir_errors', JSON.stringify(data.errorCodes));
      }
      if (data.commonProblems) {
        setCommonProblems(data.commonProblems);
        localStorage.setItem('ir_common_problems', JSON.stringify(data.commonProblems));
      }
      if (data.spareParts) {
        setSpareParts(data.spareParts);
        localStorage.setItem('ir_parts', JSON.stringify(data.spareParts));
      }
      if (data.citiesList) {
        const cleanedCities = cleanCitiesList(data.citiesList);
        setCitiesList(cleanedCities);
        localStorage.setItem('ir_cities', JSON.stringify(cleanedCities));
      }
      if (data.brandsList) {
        setBrandsList(data.brandsList);
        localStorage.setItem('ir_brands', JSON.stringify(data.brandsList));
      }
      if (data.categoriesList) {
        setCategoriesList(data.categoriesList);
        localStorage.setItem('ir_categories', JSON.stringify(data.categoriesList));
      }
      if (data.modelsList) {
        setModelsList(data.modelsList);
        localStorage.setItem('ir_models', JSON.stringify(data.modelsList));
      }
      if (data.partPurchases) {
        setPartPurchases(data.partPurchases);
        localStorage.setItem('ir_purchases', JSON.stringify(data.partPurchases));
      }
      if (data.notifications) {
        setNotifications(data.notifications);
        localStorage.setItem('ir_notifs', JSON.stringify(data.notifications));
      }

      // Sync with backend
      await syncWithBackend({
        orders: data.orders || [],
        technicians: data.technicians || [],
        errorCodes: data.errorCodes || [],
        commonProblems: data.commonProblems || [],
        spareParts: data.spareParts || []
      });

      triggerNotification('بازیابی موفقیت‌آمیز', 'کل اطلاعات پلتفرم با موفقیت به نسخه پشتیبان بازیابی شد.', 'success');
      return true;
    } catch (err) {
      console.error('Error rolling back to backup:', err);
      triggerNotification('خطای بازیابی', 'بازیابی نسخه پشتیبان ناموفق بود.', 'error');
      return false;
    }
  };

  // Auto-backup interval disabled per user request
  useEffect(() => {
    // Disabled
  }, []);

  // 1. Initial LocalStorage, Backend fetch, and real-time polling synchronizer
  const loadDatabase = async (forceForce: boolean = false) => {
    if (forceForce) {
      lastLocalUpdateRef.current = 0;
    }
    // Prevents race conditions: skip overwriting local UI memory if we performed a sync recently (12s protection window)
    if (!forceForce && Date.now() - lastLocalUpdateRef.current < 12000) {
      return;
    }
    try {
      console.log('[App] Fetching database state from backend modular endpoints...');
      const token = localStorage.getItem('session_user_id') || '';
      const headers = { 'X-Session-Token': token };

      const [errorsRes, ordersRes, partsRes, techsRes, usersRes, problemsRes, subsRes, paymentsRes, partOrdersRes, settingsRes] = await Promise.allSettled([
        fetch(`/api/error-codes/search?page=1&limit=1000&t=${Date.now()}`, { cache: 'no-store', headers }),
        fetch(`/api/orders?page=1&limit=1000&t=${Date.now()}`, { cache: 'no-store', headers }),
        fetch(`/api/store/parts?page=1&limit=1000&t=${Date.now()}`, { cache: 'no-store', headers }),
        fetch(`/api/admin/technicians?page=1&limit=1000&t=${Date.now()}`, { cache: 'no-store', headers }),
        fetch(`/api/admin/users?page=1&limit=1000&t=${Date.now()}`, { cache: 'no-store', headers }),
        fetch(`/api/problems?t=${Date.now()}`, { cache: 'no-store', headers }),
        fetch(`/api/subscriptions?t=${Date.now()}`, { cache: 'no-store', headers }),
        fetch(`/api/payments?t=${Date.now()}`, { cache: 'no-store', headers }),
        fetch(`/api/store/part-orders?t=${Date.now()}`, { cache: 'no-store', headers }),
        fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store', headers })
      ]);

      // Double check: if user did any local updates while this fetch was in flight, skip
      if (!forceForce && Date.now() - lastLocalUpdateRef.current < 12000) {
        console.log('[App] Skipping state override to prevent race conditions.');
        return;
      }

      if (errorsRes.status === 'fulfilled' && errorsRes.value.ok) {
        const json = await errorsRes.value.json();
        const items = json.data?.results || json.results || json.errorCodes;
        if (items) {
          setErrorCodes(items);
          localStorage.setItem('ir_errors', JSON.stringify(items));
        }
      }

      if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
        const json = await ordersRes.value.json();
        const items = json.data?.orders || json.orders || json.repair_requests;
        if (items) {
          setOrders(items);
          localStorage.setItem('ir_orders', JSON.stringify(items));
        }
      }

      if (partsRes.status === 'fulfilled' && partsRes.value.ok) {
        const json = await partsRes.value.json();
        const items = json.data?.parts || json.parts || json.spareParts;
        if (items) {
          setSpareParts(items);
          localStorage.setItem('ir_parts', JSON.stringify(items));
        }
      }

      if (techsRes.status === 'fulfilled' && techsRes.value.ok) {
        const json = await techsRes.value.json();
        const items = json.data?.technicians || json.technicians;
        if (items) {
          setTechnicians(items);
          localStorage.setItem('ir_techs', JSON.stringify(items));
        }
      }

      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const json = await usersRes.value.json();
        const items = json.data?.users || json.users;
        if (items) {
          setUsersList(items);
          localStorage.setItem('ir_users', JSON.stringify(items));
        }
      }

      if (problemsRes.status === 'fulfilled' && problemsRes.value.ok) {
        const json = await problemsRes.value.json();
        const items = json.commonProblems || json.problems;
        if (items) {
          setCommonProblems(items);
          localStorage.setItem('ir_common_problems', JSON.stringify(items));
        }
      }

      let loadedSubs: any[] = [];
      let loadedPayments: any[] = [];

      if (subsRes.status === 'fulfilled' && subsRes.value.ok) {
        const json = await subsRes.value.json();
        const items = json.subscriptions || json.data;
        if (Array.isArray(items)) {
          loadedSubs = items;
        }
      }

      if (paymentsRes.status === 'fulfilled' && paymentsRes.value.ok) {
        const json = await paymentsRes.value.json();
        const items = json.payments || json.data;
        if (Array.isArray(items)) {
          loadedPayments = items;
          setPaymentsList(items);
          localStorage.setItem('ir_payments', JSON.stringify(items));
        }
      }

      const localSavedSubs = JSON.parse(localStorage.getItem('ir_subscriptions') || '[]');
      const localSavedPays = JSON.parse(localStorage.getItem('ir_payments') || '[]');
      const finalSubsSource = loadedSubs.length > 0 ? loadedSubs : localSavedSubs;
      const finalPaysSource = loadedPayments.length > 0 ? loadedPayments : localSavedPays;
      const reconciledSubs = reconcileSubscriptionsWithPayments(finalSubsSource, finalPaysSource);

      setSubscriptionsList(reconciledSubs);
      localStorage.setItem('ir_subscriptions', JSON.stringify(reconciledSubs));

      if (partOrdersRes.status === 'fulfilled' && partOrdersRes.value.ok) {
        const json = await partOrdersRes.value.json();
        const items = json.partPurchases || json.partOrders || json.data;
        if (items) {
          setPartPurchases(items);
          localStorage.setItem('ir_purchases', JSON.stringify(items));
        }
      }

      if (settingsRes.status === 'fulfilled' && settingsRes.value.ok) {
        const json = await settingsRes.value.json();
        const s = json.settings || {};
        if (s.adminAnnouncement) setAdminAnnouncement(s.adminAnnouncement);
        if (s.supportPhone) setSupportPhone(s.supportPhone);
        if (s.trustBadges) setTrustBadges(s.trustBadges);
        if (s.pageContents) setPageContents(s.pageContents);
        if (s.userFeedbacks) setUserFeedbacks(s.userFeedbacks);

        // Cities sync
        const localCitiesRaw = localStorage.getItem('ir_cities');
        const localCities = localCitiesRaw ? cleanCitiesList(JSON.parse(localCitiesRaw)) : [];
        if (Array.isArray(s.citiesList) && s.citiesList.length > 0) {
          const cleanedCities = cleanCitiesList(s.citiesList);
          setCitiesList(cleanedCities);
          localStorage.setItem('ir_cities', JSON.stringify(cleanedCities));
        } else if (localCities.length > 0) {
          setCitiesList(localCities);
          syncWithBackend({ citiesList: localCities });
        }

        // Brands sync
        const dbBrands = Array.isArray(s.brandsList) ? s.brandsList : [];
        if (dbBrands.length > 0) {
          setBrandsList(dbBrands);
          localStorage.setItem('ir_brands', JSON.stringify(dbBrands));
        } else {
          const localBrandsRaw = localStorage.getItem('ir_brands');
          const localBrands = localBrandsRaw ? JSON.parse(localBrandsRaw) : [];
          if (localBrands.length > 0) {
            setBrandsList(localBrands);
            syncWithBackend({ brandsList: localBrands });
          }
        }

        // Categories sync
        const dbCats = Array.isArray(s.categoriesList) ? s.categoriesList : [];
        if (dbCats.length > 0) {
          setCategoriesList(dbCats);
          localStorage.setItem('ir_categories', JSON.stringify(dbCats));
        } else {
          const localCatsRaw = localStorage.getItem('ir_categories');
          const localCats = localCatsRaw ? JSON.parse(localCatsRaw) : [];
          if (localCats.length > 0) {
            setCategoriesList(localCats);
            syncWithBackend({ categoriesList: localCats });
          }
        }

        // Models sync
        const dbModels = Array.isArray(s.modelsList) ? cleanModelsList(s.modelsList) : [];
        if (dbModels.length > 0) {
          setModelsList(dbModels);
          localStorage.setItem('ir_models', JSON.stringify(dbModels));
        } else {
          const localModelsRaw = localStorage.getItem('ir_models');
          const localModels = localModelsRaw ? cleanModelsList(JSON.parse(localModelsRaw)) : [];
          if (localModels.length > 0) {
            setModelsList(localModels);
            syncWithBackend({ modelsList: localModels });
          }
        }

        // Dedicated repository endpoints (errorsRes, partsRes, problemsRes) serve as the primary DB source of truth.
        // Only override from settings if s explicitly provides non-empty arrays.
        if (Array.isArray(s.errorCodes) && s.errorCodes.length > 0) {
          setErrorCodes(s.errorCodes);
          localStorage.setItem('ir_errors', JSON.stringify(s.errorCodes));
        }

        if (Array.isArray(s.spareParts) && s.spareParts.length > 0) {
          setSpareParts(s.spareParts);
          localStorage.setItem('ir_parts', JSON.stringify(s.spareParts));
        }

        if (Array.isArray(s.commonProblems) && s.commonProblems.length > 0) {
          setCommonProblems(s.commonProblems);
          localStorage.setItem('ir_common_problems', JSON.stringify(s.commonProblems));
        }
      }



    } catch (err) {
      console.warn('[App] Backend synchronization offline, using client-side fallback:', err);
      
      const localAffiliate = localStorage.getItem('ir_affiliate_products');
      if (localAffiliate) {
        setAffiliateProducts(JSON.parse(localAffiliate));
      }
      const localCatConfig = localStorage.getItem('ir_category_config');
      if (localCatConfig) {
        setCategoryConfig(JSON.parse(localCatConfig));
      }

      const localErrors = localStorage.getItem('ir_errors');
      const localProblems = localStorage.getItem('ir_common_problems');
      const localTechs = localStorage.getItem('ir_techs');
      const localOrders = localStorage.getItem('ir_orders');
      const localParts = localStorage.getItem('ir_parts');
      const localUsers = localStorage.getItem('ir_users');
      const localSubs = localStorage.getItem('ir_subscriptions');
      const localPayments = localStorage.getItem('ir_payments');
      const localPurchases = localStorage.getItem('ir_purchases');

      setErrorCodes(localErrors ? JSON.parse(localErrors) : INITIAL_ERROR_CODES);
      setCommonProblems(localProblems ? JSON.parse(localProblems) : INITIAL_COMMON_PROBLEMS);
      setTechnicians(localTechs ? JSON.parse(localTechs) : INITIAL_TECHNICIANS);
      setOrders(localOrders ? JSON.parse(localOrders) : INITIAL_REPAIR_ORDERS);
      setSpareParts(localParts ? JSON.parse(localParts) : INITIAL_SPARE_PARTS);
      if (localUsers) {
        setUsersList(JSON.parse(localUsers));
      }
      if (localPayments) {
        setPaymentsList(JSON.parse(localPayments));
      }
      const parsedLocalSubs = localSubs ? JSON.parse(localSubs) : [];
      const parsedLocalPays = localPayments ? JSON.parse(localPayments) : [];
      const reconciledFallbackSubs = reconcileSubscriptionsWithPayments(parsedLocalSubs, parsedLocalPays);
      setSubscriptionsList(reconciledFallbackSubs);
      localStorage.setItem('ir_subscriptions', JSON.stringify(reconciledFallbackSubs));
      if (localPurchases) {
        setPartPurchases(JSON.parse(localPurchases));
      }

      const localCities = localStorage.getItem('ir_cities');
      const localBrands = localStorage.getItem('ir_brands');
      const localCategories = localStorage.getItem('ir_categories');
      const localModels = localStorage.getItem('ir_models');

      const cleanedLocalCities = cleanCitiesList(localCities ? JSON.parse(localCities) : []);
      setCitiesList(cleanedLocalCities);
      setBrandsList(localBrands ? JSON.parse(localBrands) : []);
      setCategoriesList(localCategories ? JSON.parse(localCategories) : []);
      setModelsList(localModels ? cleanModelsList(JSON.parse(localModels)) : []);

      const localAnnouncement = localStorage.getItem('ir_announcement');
      if (localAnnouncement) {
        setAdminAnnouncement(JSON.parse(localAnnouncement));
      }
      const localBadges = localStorage.getItem('ir_trust_badges');
      if (localBadges) {
        setTrustBadges(JSON.parse(localBadges));
      }
      const localPhone = localStorage.getItem('ir_support_phone');
      if (localPhone) {
        setSupportPhone(localPhone);
      }
      const localPageContents = localStorage.getItem('ir_page_contents');
      if (localPageContents) {
        setPageContents(JSON.parse(localPageContents));
      }
      const localFeedbacks = localStorage.getItem('ir_user_feedbacks');
      if (localFeedbacks) {
        setUserFeedbacks(JSON.parse(localFeedbacks));
      }
    }

    // Restore session and notifications
    const localLoggedInTechId = localStorage.getItem('ir_logged_in_tech_id');
    if (localLoggedInTechId) setLoggedInTechId(localLoggedInTechId);

    const localNotifs = localStorage.getItem('ir_notifs');
    if (localNotifs) {
      try {
        const parsed = JSON.parse(localNotifs);
        if (Array.isArray(parsed)) {
          const seen = new Set();
          const deduplicated = parsed.filter(item => {
            if (!item || !item.id) return false;
            const cleanId = String(item.id);
            if (seen.has(cleanId)) return false;
            seen.add(cleanId);
            return true;
          });
          setNotifications(deduplicated);
          localStorage.setItem('ir_notifs', JSON.stringify(deduplicated));
        } else {
          setNotifications([]);
        }
      } catch {
        setNotifications([]);
      }
    } else {
      setNotifications([]);
    }
  };

  useEffect(() => {
    checkAuth();
    loadDatabase(true);

    const handleOnline = () => {
      triggerNotification('اتصال شبکه', 'اتصال اینترنت شما دوباره برقرار شد. اطلاعات با سرور همگام‌سازی شد.', 'success');
      loadDatabase(true);
    };

    const handleOffline = () => {
      triggerNotification('قطع شبکه', 'ارتباط اینترنت شما قطع گردید. اطلاعات محلی تا زمان اتصال مجدد محفوظ است.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Setup periodic state polling synchronizer (every 12 seconds) synchronized with lastLocalUpdateRef protection window
    // Polling pauses when admin panel is active to prevent overlapping state writes
    const pollInterval = setInterval(() => {
      if (currentRole !== 'admin') {
        loadDatabase();
      }
    }, 12000);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentRole]);

  // Prevent F12 / Developer Tools inspection to protect sensitive details
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable F12
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }
      // Disable Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
      ) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Synchronizer to show announcement if the message text has changed
  useEffect(() => {
    if (adminAnnouncement?.text) {
      const savedText = localStorage.getItem('ir_announcement_dismissed_text');
      setAnnouncementDismissed(savedText === adminAnnouncement.text);
    } else {
      setAnnouncementDismissed(false);
    }
  }, [adminAnnouncement?.text]);

  // Synchronize client order tracking drawer details instantly when order progresses dynamically
  useEffect(() => {
    if (activeTrackingOrder) {
      const liveOrderState = orders.find(o => o.id === activeTrackingOrder.id);
      if (liveOrderState) {
        if (JSON.stringify(liveOrderState) !== JSON.stringify(activeTrackingOrder)) {
          setActiveTrackingOrder(liveOrderState);
        }
      } else {
        setActiveTrackingOrder(null);
      }
    }
  }, [orders, activeTrackingOrder]);

  // Deep linking and URL parsing on initial database load for high Google indexation rate
  useEffect(() => {
    if (errorCodes.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    const brandParam = params.get('brand');
    const categoryParam = params.get('category');

    if (codeParam) {
      const found = errorCodes.find(e => 
        e.code.toLowerCase() === codeParam.toLowerCase() && 
        (!brandParam || e.brand.toLowerCase() === brandParam.toLowerCase()) &&
        (!categoryParam || e.category.toLowerCase() === categoryParam.toLowerCase())
      );
      if (found) {
        setSelectedError(found);
        setRoleSelection('client');
        setCurrentRole('client');
      }
    }
  }, [errorCodes]);

  // Dynamic Browser SEO Metadata (Title, Description, and Structured FAQ Schema JSON-LD)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (selectedError) {
      params.set('code', selectedError.code);
      params.set('brand', selectedError.brand);
      params.set('category', selectedError.category);
      window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);

      document.title = `کد خطا ${selectedError.code} ${selectedError.brand} ${selectedError.category} - عیب‌یابی متبوع`;

      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', `کد خطای ${selectedError.code} مربوط به ${selectedError.category} برند ${selectedError.brand}. عیب‌یابی تخصصی به همراه راه‌حل‌ها: ${selectedError.description || 'بررسی وضعیت شیر برقی و پمپ'}`);

      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', `${selectedError.code}, ارور ${selectedError.code}, خطای ${selectedError.brand}, تعمیرات ${selectedError.category}, بهار خدمت`);

      let scriptLd = document.getElementById('seo-jsonld-schema');
      if (scriptLd) {
        scriptLd.remove();
      }
      scriptLd = document.createElement('script');
      scriptLd.setAttribute('id', 'seo-jsonld-schema');
      scriptLd.setAttribute('type', 'application/ld+json');
      scriptLd.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{
          "@type": "Question",
          "name": `علت و راه‌حل ارور ${selectedError.code} در ${selectedError.category} ${selectedError.brand} چیست؟`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": `علت بروز خطا: ${selectedError.description || 'بررسی مدار الکترونیکی و سنسورها'}.`
          }
        }]
      });
      document.head.appendChild(scriptLd);

    } else {
      if (params.has('code')) {
        params.delete('code');
        params.delete('brand');
        params.delete('category');
        window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`);
      }
      document.title = "سامانه مدیریت کدهای خطا و تعمیرات لوازم خانگی - بهار خدمت";

      let metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', "پلتفرم جامع جستجوی کدهای خطا و ثبت آنلاین درخواست تعمیر لوازم خانگی در سراسر ایران");
      }

      let scriptLd = document.getElementById('seo-jsonld-schema');
      if (scriptLd) {
        scriptLd.remove();
      }
      scriptLd = document.createElement('script');
      scriptLd.setAttribute('id', 'seo-jsonld-schema');
      scriptLd.setAttribute('type', 'application/ld+json');
      scriptLd.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": "سامانه مدیریت کدهای خطا و تعمیرات - بهار خدمت",
        "description": "پلتفرم تخصصی تعمیرات و عیب‌یابی ارور لوازم خانگی",
        "telephone": "021-91000000",
        "address": {
          "@type": "PostalAddress",
          "addressLocality": "تهران",
          "addressCountry": "IR"
        }
      });
      document.head.appendChild(scriptLd);
    }
  }, [selectedError]);

  // 2. Strict Access Control & Routing redirects for Requirements 2 & 8
  useEffect(() => {
    if (isAuthChecking) return;

    const checkAdminRouteAccess = () => {
      const path = window.location.pathname;
      setCurrentPath(path);
      const isAdminActive = currentUser?.role === 'admin' || currentUser?.is_super_admin === 1 || currentUser?.is_super_admin === true;

      if (path === '/kodyar24-hq-secure-monitoring' || path === '/kodyar24-gate-99') {
        if (isAdminActive) {
          window.history.pushState({}, '', '/admin-panel');
          setCurrentPath('/admin-panel');
          setCurrentRole('admin');
          setRoleSelection('admin');
        } else {
          setIsAdminLoginModalOpen(true);
        }
      } else if (path === '/admin-panel' || path === '/admin') {
        if (isAdminActive) {
          if (currentRole === 'technician' && loggedInTechId) {
            // Under simulation masquerading, let them stay in 'technician' role!
            return;
          }
          setCurrentRole('admin');
          setRoleSelection('admin');
        } else {
          // Allow logging in from guessable paths rather than redirecting to home immediately
          setIsAdminLoginModalOpen(true);
        }
      } else if (path === '/technician' || path === '/tech') {
        if (currentRole !== 'technician') {
          setCurrentRole('technician');
          setRoleSelection('technician');
        }
      } else {
        // If they are on regular path, but active role is admin, guide URL back to admin-panel
        if (currentRole === 'admin' && path !== '/admin-panel' && path !== '/admin') {
          if (isAdminActive) {
            window.history.pushState({}, '', '/admin-panel');
            setCurrentPath('/admin-panel');
          }
        }
      }
    };

    checkAdminRouteAccess();

    window.addEventListener('popstate', checkAdminRouteAccess);
    return () => {
      window.removeEventListener('popstate', checkAdminRouteAccess);
    };
  }, [currentRole, currentUser, loggedInTechId, isAuthChecking]);

  // Sync helper with database in the backend
  const syncWithBackend = async (payload: Record<string, any>) => {
    lastLocalUpdateRef.current = Date.now();
    try {
      const token = localStorage.getItem('session_user_id') || '';
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        console.error('[App] Sync failed with status:', response.status);
        return false;
      }
      return true;
    } catch (err) {
      console.error('[App] Sync error:', err);
      return false;
    }
  };

  // Update Technician state helper
  const getActiveTech = (): Technician | undefined => {
    if (loggedInTechId) {
      const found = technicians.find(t => t.id === loggedInTechId || t.phone === loggedInTechId);
      if (found) return found;
      if (loggedInTechId === 'admin' || loggedInTechId === 'tech_admin' || (currentUser && (currentUser.role === 'admin' || currentUser.is_super_admin))) {
        return {
          id: loggedInTechId,
          name: currentUser?.full_name || 'مدیریت عالی کدیار۲۴',
          phone: currentUser?.phone || '09120947304',
          specialty: ['کلیه تعمیرات تخصصی', 'نظارت ارشد'],
          rating: 5.0,
          completedOrders: 99,
          balance: 0,
          isVerified: true,
          activeLocation: 'تهران',
          documents: [],
          avatarUrl: ''
        };
      }
      return {
        id: loggedInTechId,
        name: 'متخصص کدیار۲۴',
        phone: loggedInTechId,
        specialty: ['کلیه خدمات تخصصی'],
        rating: 5.0,
        completedOrders: 10,
        balance: 0,
        isVerified: true,
        activeLocation: 'ایران',
        documents: [],
        avatarUrl: ''
      };
    }
    return undefined;
  };

  const activeTech = getActiveTech();

  const effectiveUser = React.useMemo(() => {
    if (!currentUser) {
      if (loggedInTechId && activeTech) {
        return {
          id: activeTech.id,
          phone: activeTech.phone,
          full_name: activeTech.name,
          role: 'technician',
          subscription: { is_premium: true, is_active: true, expiry_date: '2099-12-31' },
          has_active_subscription: true,
          payments: paymentsList.filter(p => String(p.user_id) === String(activeTech.id) || String(p.user_phone) === String(activeTech.phone))
        };
      }
      return null;
    }

    const userSubs = subscriptionsList.filter(s =>
      String(s.user_id || s.userId) === String(currentUser.id) ||
      (currentUser.phone && String(s.user_phone || s.phone || s.user_id) === String(currentUser.phone))
    );
    let sub = Array.isArray(currentUser.subscription)
      ? (currentUser.subscription.find((s: any) => s.is_active || s.is_premium) || currentUser.subscription[0])
      : currentUser.subscription;

    const planNameMap: Record<string, string> = {
      '1_month': 'اشتراک ۱ ماهه کدهای خطا',
      '3_month': 'اشتراک ۳ ماهه کدهای خطا',
      '6_month': 'اشتراک ۶ ماهه کدهای خطا',
      '12_month': 'اشتراک ۱۲ ماهه کدهای خطا',
      'permanent': 'اشتراک دائمی همکار / مدیریت'
    };

    if (userSubs.length > 0) {
      const activeSubs = userSubs.filter(s => {
        const exp = s.expiry_date || s.end_date;
        return (s.is_active || s.is_premium || s.status === 'active' || s.status === 'completed') && exp && new Date(exp) > new Date();
      }).sort((a, b) => new Date(b.expiry_date || b.end_date || 0).getTime() - new Date(a.expiry_date || a.end_date || 0).getTime());

      if (activeSubs.length > 0) {
        const latest = activeSubs[0];
        const expiryDate = new Date(latest.expiry_date || latest.end_date).toISOString();
        const rawTitle = latest.plan_name || latest.planName || "";
        const planTitle = (rawTitle && !['1_month','3_month','6_month','12_month','permanent','gold'].includes(rawTitle))
          ? rawTitle
          : (planNameMap[latest.plan_id] || planNameMap[latest.plan] || "اشتراک ویژه کدهای خطا");

        sub = {
          ...latest,
          is_premium: true,
          is_active: true,
          expiry_date: expiryDate,
          end_date: expiryDate,
          plan_name: planTitle,
          planName: planTitle
        };
      }
    } else if (sub && (sub.end_date || sub.expiry_date)) {
      const exp = new Date(sub.expiry_date || sub.end_date).toISOString();
      const isActive = new Date(exp) > new Date();
      const rawTitle = sub.plan_name || sub.planName || "";
      const planTitle = (rawTitle && !['1_month','3_month','6_month','12_month','permanent','gold'].includes(rawTitle))
        ? rawTitle
        : (planNameMap[sub.plan_id] || planNameMap[sub.plan] || "اشتراک ویژه کدهای خطا");

      sub = {
        ...sub,
        is_premium: isActive,
        is_active: isActive,
        expiry_date: exp,
        end_date: exp,
        plan_name: planTitle,
        planName: planTitle
      };
    }

    const myPayments = paymentsList.filter(p => String(p.user_id) === String(currentUser.id) || (currentUser.phone && String(p.user_phone) === String(currentUser.phone)));
    const mergedPayments = myPayments.length > 0 ? myPayments : (currentUser.payments || []);

    return {
      ...currentUser,
      subscription: sub,
      has_active_subscription: !!(sub && (sub.is_premium || sub.is_active)),
      payments: mergedPayments
    };
  }, [currentUser, loggedInTechId, activeTech, subscriptionsList, paymentsList]);

  // Real & simulated backend SMS sender Integration
  const dispatchSmsNotification = async (phone: string, text: string, type: 'otp' | 'status' = 'status', variables?: Record<string, string>) => {
    try {
      console.log(`[API Connect] Dispatching SMS to ${phone}...`);
      if (type === 'otp') {
        triggerNotification('کد تایید پیامکی', text, 'sms');
      }
      const response = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          message: text,
          templateVars: variables,
          type
        })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.log) {
          setSmsLogs(prev => [data.log, ...prev].slice(0, 500));
        }
      }
    } catch (err) {
      console.error('[SMS System API] Backend dispatch failed:', err);
    }
  };

  // Helper trigger for notifications + mock SMS logs
  const triggerNotification = (title: any, text: any, type: Notification['type'] = 'info', orderId?: string) => {
    const safeTitle = typeof title === 'string' ? title : (title?.message || String(title || ''));
    const safeText = typeof text === 'string' ? text : (text?.message || JSON.stringify(text || ''));
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const newNotif: Notification = {
      id: `notif_${now.getTime()}_${Math.floor(Math.random() * 1000000)}`,
      title: safeTitle,
      text: safeText,
      date: timeStr,
      type,
      orderId
    };

    setNotifications(prev => {
      const updated = [newNotif, ...prev];
      localStorage.setItem('ir_notifs', JSON.stringify(updated));
      return updated;
    });

    setActiveToasts(prev => [...prev, newNotif]);
    setTimeout(() => {
      setActiveToasts(prev => prev.filter(t => t.id !== newNotif.id));
    }, 5000);
  };

  // State synchronization with DB simulation inside localStorage and Backend API
  const saveErrorsToStorage = (updated: ErrorCode[]) => {
    setErrorCodes(updated);
    localStorage.setItem('ir_errors', JSON.stringify(updated));
    syncWithBackend({ errorCodes: updated });
  };

  const saveCommonProblemsToStorage = (updated: CommonProblem[]) => {
    setCommonProblems(updated);
    localStorage.setItem('ir_common_problems', JSON.stringify(updated));
    syncWithBackend({ commonProblems: updated });
  };

  const saveOrdersToStorage = (updated: RepairOrder[]) => {
    setOrders(updated);
    localStorage.setItem('ir_orders', JSON.stringify(updated));
    syncWithBackend({ orders: updated });
  };

  const saveTechsToStorage = (updated: Technician[]) => {
    setTechnicians(updated);
    localStorage.setItem('ir_techs', JSON.stringify(updated));

    const activeTechIds = new Set(updated.map(t => String(t.id)));
    let updatedUsers = usersList;
    if (usersList && usersList.length > 0) {
      const removedTechs = technicians.filter(t => !activeTechIds.has(String(t.id)));
      if (removedTechs.length > 0) {
        const removedIds = new Set(removedTechs.map(t => String(t.id)));
        const removedPhones = new Set(removedTechs.map(t => String(t.phone)));
        updatedUsers = usersList.filter(u => !removedIds.has(String(u.id)) && !removedPhones.has(String(u.phone)));
        setUsersList(updatedUsers);
        localStorage.setItem('ir_users', JSON.stringify(updatedUsers));
      }
    }

    syncWithBackend({ technicians: updated, users: updatedUsers });
  };

  const savePartsToStorage = (updated: SparePart[]) => {
    setSpareParts(updated);
    localStorage.setItem('ir_parts', JSON.stringify(updated));
    syncWithBackend({ spareParts: updated });
  };

  const savePurchasesToStorage = (updated: PartPurchase[]) => {
    setPartPurchases(updated);
    localStorage.setItem('ir_purchases', JSON.stringify(updated));
    syncWithBackend({ partPurchases: updated });
  };

  const savePageContentsToStorage = (contents: any) => {
    setPageContents(contents);
    localStorage.setItem('ir_page_contents', JSON.stringify(contents));
    syncWithBackend({ pageContents: contents });
  };

  const saveFeedbacksToStorage = (feedbacks: any[]) => {
    setUserFeedbacks(feedbacks);
    localStorage.setItem('ir_user_feedbacks', JSON.stringify(feedbacks));
    syncWithBackend({ userFeedbacks: feedbacks });
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    localStorage.removeItem('ir_notifs');
  };

  const handleRemoveNotification = (id: string) => {
    setNotifications(prev => {
      const filtered = prev.filter(n => n.id !== id);
      localStorage.setItem('ir_notifs', JSON.stringify(filtered));
      return filtered;
    });
  };

  // CUSTOMER INTERACTIVE METHODS
  const handleBookingSubmit = (newOrderData: Partial<RepairOrder>) => {
    const orderId = `REQ-${Math.floor(100000 + Math.random() * 900000)}`;
    const cleanPhone = toEnglishDigits(newOrderData.customerPhone || '09120000000').trim();
    const fullOrder: RepairOrder = {
      id: orderId,
      userId: currentUser?.id || undefined,
      customerName: newOrderData.customerName || currentUser?.full_name || 'مشتری بدون نام',
      customerPhone: /^09\d{9}$/.test(cleanPhone) ? cleanPhone : (currentUser?.phone || '09120000000'),
      city: newOrderData.city || 'تهران',
      region: newOrderData.region || 'نامشخص',
      address: newOrderData.address || 'ورودی دستی',
      category: newOrderData.category || 'پکیج دیواری',
      brand: newOrderData.brand || 'بوتان',
      model: newOrderData.model || 'عمومی',
      errorCode: newOrderData.errorCode || 'نامعلوم',
      description: newOrderData.description || '',
      status: 'waiting',
      date: newOrderData.date || new Date().toLocaleDateString('fa-IR'),
      timeSlot: newOrderData.timeSlot || '۰۹:۰۰ الی ۱۲:۰۰',
      technicianId: newOrderData.technicianId || '',
      technicianName: newOrderData.technicianName || '',
      technicianPhone: newOrderData.technicianPhone || '',
      mediaUrls: newOrderData.mediaUrls || [],
      createdAt: new Date().toISOString()
    };

    const updatedOrders = [fullOrder, ...orders];
    saveOrdersToStorage(updatedOrders);
    setIsBookingOpen(false);

    // Call backend endpoint to persist repair request synchronously
    fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Token': localStorage.getItem('session_user_id') || ''
      },
      body: JSON.stringify({
        ...fullOrder,
        user_id: currentUser?.id || null,
        userId: currentUser?.id || null
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.status === 'ok' && data.order) {
        setOrders(prev => {
          const list = [data.order, ...prev.filter(o => o.id !== fullOrder.id)];
          localStorage.setItem('ir_orders', JSON.stringify(list));
          return list;
        });
        if (currentUser && typeof checkAuth === 'function') {
          checkAuth().catch(() => {});
        }
      }
    })
    .catch(err => console.error('Error syncing repair request:', err));

    // Active instant tracking for current screen
    setTrackingPhoneNumber(fullOrder.customerPhone);
    setActiveTrackingOrder(fullOrder);

    // Trigger on-screen gorgeous modal
    setSuccessOrder(fullOrder);

    // Simulate standard OTP & assignment message
    triggerNotification(
      'ثبت موفقیت‌آمیز درخواست',
      `قبض موقت ${orderId} با موفقیت در سامانه هماهنگ گردید. تکنسین‌های تایید شده در منطقه هم‌اکنون این پرونده را ارزیابی می‌کنند.`,
      'success'
    );

    // Simulated SMS & real integration dispatch call
    const jobLabel = fullOrder.category === 'پکیج دیواری' ? 'تعمیر پکیج' : `تعمیر ${fullOrder.category}`;
    const smsMessageText = `مشتری گرامی ${fullOrder.customerName}، درخواست "${jobLabel} ${fullOrder.brand}" شما با شماره رهگیری ${orderId} با موفقیت در سامانه ثبت گردید. منتظر تماس همکاران ما بمانید. کدیار24`;
    
    // Call our real/simulated SMS dispatcher gateway
    dispatchSmsNotification(fullOrder.customerPhone, smsMessageText, 'status');

    triggerNotification(
      'سامانه پیامک کدیار24',
      smsMessageText,
      'sms',
      orderId
    );
  };

  const handleSearchTrackingPhoneNumber = () => {
    if (!trackingPhoneNumber) {
      alert('لطفا شماره تلفن همراه خود را ابتدا وارد کنید.');
      return;
    }
    const cleanSearch = toEnglishDigits(trackingPhoneNumber);
    const matched = orders.find(o => {
      const cleanOrderPhone = toEnglishDigits(o.customerPhone);
      return cleanOrderPhone === cleanSearch || 
             (cleanOrderPhone.length >= 10 && cleanSearch.length >= 10 && 
              (cleanOrderPhone.endsWith(cleanSearch.slice(-10)) || cleanSearch.endsWith(cleanOrderPhone.slice(-10))));
    });

    if (matched) {
      setActiveTrackingOrder(matched);
      triggerNotification('پیگیری سفارش', `سفارش شماره ${matched.id} برای نمایش در پنل ره‌گیری بارگذاری شد.`, 'info');
    } else {
      alert('هیچ درخواستی با این شماره تلفن همراه یافت نشد.');
    }
  };
  const handlePurchasePart = async (part: SparePart, address: string, buyerName: string, buyerPhone: string, cardHolder: string, trackNumber: string) => {
    try {
      const token = localStorage.getItem('session_user_id') || '';
      const response = await fetch('/api/payment/card-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token
        },
        body: JSON.stringify({
          card_holder: cardHolder,
          track_number: trackNumber,
          product_id: part.id,
          part_id: part.id,
          part_name: part.name,
          buyer_name: buyerName || currentUser?.full_name || 'کاربر',
          buyer_phone: buyerPhone || currentUser?.phone || '',
          address: address || '',
          user_id: currentUser?.id || null,
          user_phone: currentUser?.phone || buyerPhone || '',
          phone: buyerPhone || currentUser?.phone || '',
          type: 'part_purchase',
          amount: part.price
        })
      });
      const data = await response.json();

      if (!response.ok || data.status !== 'ok') {
        triggerNotification('ثبت ناموفق', data.error || data.message || 'ثبت اطلاعات فیش پرداخت با خطا مواجه شد.', 'error');
        return;
      }

      const generatedId = data.partOrder?.id || data.order?.id || `PUR-${Math.floor(100000 + Math.random() * 900000)}`;
      const newPurchase: PartPurchase = {
        id: generatedId,
        partId: part.id,
        part_id: part.id,
        partName: part.name,
        part_name: part.name,
        partCategory: part.category,
        customerName: buyerName || currentUser?.full_name || 'مشتری',
        buyer_name: buyerName || currentUser?.full_name || 'مشتری',
        customerPhone: buyerPhone || currentUser?.phone || '',
        buyer_phone: buyerPhone || currentUser?.phone || '',
        customerAddress: address,
        address: address,
        price: part.price,
        total_price: part.price,
        date: new Date().toLocaleDateString('fa-IR'),
        status: 'pending',
        cardHolder,
        trackNumber,
        shipping_tracking_code: trackNumber,
        user_id: currentUser?.id || null,
        userId: currentUser?.id || null
      };

      if (data.payment) {
        setPaymentsList(prev => [data.payment, ...prev.filter(p => p.id !== data.payment.id)]);
      } else {
        const newPayRecord = {
          id: `pay_${Date.now()}`,
          user_id: currentUser?.id || null,
          user_name: buyerName || currentUser?.full_name || 'کاربر',
          user_phone: buyerPhone || currentUser?.phone || '',
          related_type: 'part_purchase',
          type: 'part_purchase',
          partId: part.id,
          partName: part.name,
          amount: part.price,
          ref_id: trackNumber,
          ref_code: generatedId,
          card_number: cardHolder,
          status: 'pending',
          payment_method: 'card_to_card',
          created_at: new Date().toISOString()
        };
        setPaymentsList(prev => [newPayRecord, ...prev]);
      }

      const updatedPurchases = [newPurchase, ...partPurchases.filter(p => p.id !== newPurchase.id)];
      setPartPurchases(updatedPurchases);
      savePurchasesToStorage(updatedPurchases);

      triggerNotification(
        'ثبت درخواست خرید قطعه',
        `اطلاعات فیش پرداخت "${part.name}" با موفقیت ثبت شد و به تب پرداخت‌های مدیریت ارسال گردید.`,
        'success'
      );
    } catch (err) {
      triggerNotification('خطای اتصال', 'امکان ارتباط با سرور برای ثبت پرداخت وجود ندارد.', 'error');
    }
  };

  const handleFilterPartsForSelectedError = (category: string, brand: string) => {
    setShopCategoryFilter(category);
    setShopBrandFilter(brand);
    // Scroll to shopping block smoothly
    const element = document.getElementById('parts-store-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // TECHNICIAN METHODS
  const handleAcceptOrder = (orderId: string, techId: string) => {
    const techObj = technicians.find(t => t.id === techId);
    if (!techObj) return;

    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          status: 'accepted' as any,
          technicianId: techObj.id,
          technicianName: techObj.name,
          technicianPhone: techObj.phone
        };
      }
      return o;
    });

    saveOrdersToStorage(updatedOrders);

    // Notify Customer through simulated SMS
    const currentOrd = orders.find(o => o.id === orderId);
    if (currentOrd) {
      triggerNotification(
        'ارجاع تکنسین',
        `درخواست تعمیرکار شماره ${orderId} توسط "${techObj.name}" پذیرش گردید.`,
        'success'
      );

      triggerNotification(
        'اطلاع‌رسانی پیامکی مشتری',
        `مشتری محترم، تکنسین با تجربه جناب ${techObj.name} با شماره تماس ${techObj.phone} عهده دفتار فنی شما گردیدند. جهت بررسی مراجعه به زودی تماس خواهند گرفت.`,
        'sms',
        orderId
      );
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: RepairOrder['status'], updateData?: Partial<RepairOrder>) => {
    const currentOrder = orders.find(o => o.id === orderId);
    if (!currentOrder) return;

    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        const merged = { ...o, status, ...updateData };
        return merged;
      }
      return o;
    });

    saveOrdersToStorage(updatedOrders);

    // If completed sum technician earnings minus 15% system fee
    if (status === 'completed' && updateData?.estimatedCost) {
      const payout = updateData.estimatedCost * 0.85; // 85% goes to tech
      const updatedTechs = technicians.map(t => {
        if (t.id === currentOrder.technicianId) {
          return {
            ...t,
            completedOrders: t.completedOrders + 1,
            balance: t.balance + payout
          };
        }
        return t;
      });
      saveTechsToStorage(updatedTechs);

      // Decrement part stock if used in repair
      if (updateData.partsUsed && updateData.partsUsed.length > 0) {
        const usedId = updateData.partsUsed[0].partId;
        const revisedParts = spareParts.map(sp => {
          if (sp.id === usedId) {
            return { ...sp, stock: Math.max(0, sp.stock - 1) };
          }
          return sp;
        });
        savePartsToStorage(revisedParts);
      }
    }

    // Dynamic Notifications based on state transitions
    let messageText = '';
    let smsText = '';

    if (status === 'enroute') {
      messageText = `تکنسین برای سفارش ${orderId} اعلام حرکت کرد.`;
      smsText = `مشتری ارجمند، تکنسین ${currentOrder.technicianName} در مسیر حرکت به سمت منزل/کارگاه شما جهت اقدامات فنی هستند.`;
    } else if (status === 'repairing') {
      messageText = `عیب‌یابی فعال و پروسه تعمیر برای سفارش ${orderId} رسماً آغاز شد.`;
      smsText = `تعمیرکار وارد محل کار شده و مشغول بررسی فنی جهت رفع کد خطای ${currentOrder.errorCode || 'دستگاه'} هستند.`;
    } else if (status === 'needs_part') {
      messageText = `سفارش ${orderId} به علت نیاز به قطعات یدکی به حالت تعلیق موقت درآمد.`;
      smsText = `نیاز به تهیه قطعه تکمیلی برای دستگاه شما؛ تکنسین پس از تهیه قطعه از انبار مرکزی، اقدام را ادامه خواهند داد.`;
    } else if (status === 'completed') {
      messageText = `فرآیند فاکتورسازی و اتمام کار با موفقیت تایید شد. مبلغ نهایی: ${updateData?.estimatedCost?.toLocaleString('fa-IR')} تومان.`;
      smsText = `پایان فرآیند تعمیر با موفقیت. از اعتماد شما به کدیار24 سپاسگزاریم. کد ضمانت قطعه مصرفی صادر شد.`;
    } else if (status === 'cancelled') {
      messageText = `سفارش فنی ${orderId} به خواست مشتری یا مصلحت تکنسین ملغی گردید.`;
      smsText = `درخواست تعمیر ${orderId} شما ملغی گردید. با آرزوی تندرستی، دفتار مرکزی کدیار24.`;
    }

    triggerNotification('تغییر وضعیت سرویس', messageText, 'info', orderId);
    if (smsText) {
      triggerNotification('پیامک اطلاع‌رسانی خودکار دفتار فنی', smsText, 'sms', orderId);
      dispatchSmsNotification(currentOrder.customerPhone || '09120000000', smsText, 'status', { "order": orderId, "status": status });
    }

    // Update current active track if is the same
    if (activeTrackingOrder && activeTrackingOrder.id === orderId) {
      const syncOrd = updatedOrders.find(o => o.id === orderId);
      setActiveTrackingOrder(syncOrd || null);
    }
  };

  const handleNewErrorCodeSubmitFromTech = (newErr: Partial<ErrorCode>) => {
    const cleanStr = (s: string) => {
      if (!s) return '';
      return s
        .trim()
        .toLowerCase()
        .replace(/[يى]/g, 'ی')
        .replace(/ك/g, 'ک')
        .replace(/\s+/g, ' ');
    };

    const cleanModel = (m: string) => {
      const clean = cleanStr(m);
      if (!clean || clean === 'عمومی' || clean === 'عمومي' || clean === 'کل مدل‌ها' || clean === 'کل مدلها' || clean === 'كل مدلها' || clean === 'همه' || clean === 'همه مدل‌ها' || clean === 'همه مدل ها' || clean === 'general') {
        return 'عمومی';
      }
      return clean;
    };

    const targetCode = cleanStr(newErr.code || 'CODE');
    const targetCat = cleanStr(newErr.category || 'پکیج دیواری');
    const targetBrand = cleanStr(newErr.brand || 'بوتان');
    const targetModel = cleanModel(newErr.model || 'عمومی');

    const isDuplicate = errorCodes.some(err => {
      const codeClean = cleanStr(err.code);
      const catClean = cleanStr(err.category);
      const brandClean = cleanStr(err.brand);
      const modelClean = cleanModel(err.model || 'عمومی');
      return codeClean === targetCode && catClean === targetCat && brandClean === targetBrand && modelClean === targetModel;
    });

    if (isDuplicate) {
      triggerNotification(
        'خطا در ثبت کد',
        `کُد خطای "${newErr.code}" قبلاً برای دستگاه "${newErr.category}" برند "${newErr.brand}" ثبت شده است و نیازی به تعریف مجدد نیست.`,
        'error'
      );
      alert(`⚠️ کُد خطای تکراری: کُد خطای "${newErr.code}" برای این دستگاه، برند و مدل هم‌اکنون موجود است.`);
      return;
    }

    const freshErr = harmonizeErrorCode({
      id: `err_pro_${new Date().getTime()}`,
      code: newErr.code || 'CODE',
      category: newErr.category || 'پکیج دیواری',
      brand: newErr.brand || 'بوتان',
      model: newErr.model || 'عمومی',
      title: newErr.title || 'ثبت شده توسط تکنسین',
      description: newErr.description || '',
      causes: newErr.causes || [],
      steps: newErr.steps || [],
      precautions: newErr.precautions || [],
      hazardLevel: newErr.hazardLevel || 'medium',
      toolsNeeded: newErr.toolsNeeded || [],
      relatedParts: [],
      views: 0,
      updatedBy: newErr.updatedBy || 'تکنیسین ناشناس',
      isApproved: false // Needs admin check
    });

    const updated = [freshErr, ...errorCodes];
    saveErrorsToStorage(updated);

    // Auto-register newly typed category, brand, or model by technician to the database lists
    let updatedCats = false, updatedBrands = false, updatedMods = false;
    const newCategories = [...categoriesList];
    const newBrands = [...brandsList];
    const newModels = [...modelsList];

    if (freshErr.category.trim() && !newCategories.includes(freshErr.category.trim())) {
      newCategories.push(freshErr.category.trim());
      updatedCats = true;
    }
    if (freshErr.brand.trim() && !newBrands.includes(freshErr.brand.trim())) {
      newBrands.push(freshErr.brand.trim());
      updatedBrands = true;
    }
    if (freshErr.model.trim() && freshErr.model !== 'عمومی' && !newModels.includes(freshErr.model.trim())) {
      const m = freshErr.model.trim();
      if (!newModels.includes(m)) {
        newModels.push(m);
        updatedMods = true;
      }
    }

    if (updatedCats) {
      setCategoriesList(newCategories);
      localStorage.setItem('ir_categories', JSON.stringify(newCategories));
      syncWithBackend({ categoriesList: newCategories });
    }
    if (updatedBrands) {
      setBrandsList(newBrands);
      localStorage.setItem('ir_brands', JSON.stringify(newBrands));
      syncWithBackend({ brandsList: newBrands });
    }
    if (updatedMods) {
      setModelsList(newModels);
      localStorage.setItem('ir_models', JSON.stringify(newModels));
      syncWithBackend({ modelsList: newModels });
    }

    triggerNotification(
      'ثبت کد خطای جدید',
      `کد خطای ${freshErr.code} متعلق به برند "${freshErr.brand}" ثبت گردید و هم‌اکنون در صف بررسی مدیر است.`,
      'success'
    );
  };

  // ADMIN METHODS
  const handleApproveErrorCode = (id: string) => {
    const target = errorCodes.find(err => err.id === id);
    if (!target) return;

    if (target.isCommonProblem) {
      // Create CommonProblem object
      const newProb: CommonProblem = {
        id: target.id,
        code: 'مشکل شایع',
        category: target.category,
        brand: target.brand,
        model: target.model || 'عمومی',
        title: target.title,
        description: target.description,
        causes: target.causes || [],
        steps: target.steps || [],
        precautions: target.precautions || [],
        hazardLevel: target.hazardLevel || 'low',
        tags: target.tags || ['مشکل شایع'],
        views: target.views || 0,
        solutions: target.steps || []
      };

      // Remove from errorCodes
      const updatedErrors = errorCodes.filter(err => err.id !== id);
      saveErrorsToStorage(updatedErrors);

      // Add to commonProblems
      const updatedProblems = [newProb, ...commonProblems];
      setCommonProblems(updatedProblems);
      localStorage.setItem('ir_common_problems', JSON.stringify(updatedProblems));
      syncWithBackend({ commonProblems: updatedProblems });

      triggerNotification('ممیزی مشکل شایع تایید شد', 'مورد جدید تایید و به بخش مشکلات شایع اضافه شد.', 'success');
    } else {
      const updated = errorCodes.map(err => {
        if (err.id === id) {
          return harmonizeErrorCode({ ...err, isApproved: true });
        }
        return err;
      });
      saveErrorsToStorage(updated);
      triggerNotification('ممیزی کد خطا تایید شد', 'کد خطای جدید مورد تایید علمی قرار گرفت و منتشر شد.', 'success');
    }

    let updatedCats = false, updatedBrands = false, updatedMods = false;
    const newCategories = [...categoriesList];
    const newBrands = [...brandsList];
    const newModels = [...modelsList];

    if (target.category && target.category.trim() && !newCategories.includes(target.category.trim())) {
      newCategories.push(target.category.trim());
      updatedCats = true;
    }
    if (target.brand && target.brand.trim() && !newBrands.includes(target.brand.trim())) {
      newBrands.push(target.brand.trim());
      updatedBrands = true;
    }
    if (target.model && target.model.trim() && target.model !== 'عمومی' && target.model !== 'کل مدل‌ها') {
      const sm = target.model.trim();
      if (!newModels.includes(sm)) {
        newModels.push(sm);
        updatedMods = true;
      }
    }

    if (updatedCats) {
      setCategoriesList(newCategories);
      localStorage.setItem('ir_categories', JSON.stringify(newCategories));
      syncWithBackend({ categoriesList: newCategories });
    }
    if (updatedBrands) {
      setBrandsList(newBrands);
      localStorage.setItem('ir_brands', JSON.stringify(newBrands));
      syncWithBackend({ brandsList: newBrands });
    }
    if (updatedMods) {
      setModelsList(newModels);
      localStorage.setItem('ir_models', JSON.stringify(newModels));
      syncWithBackend({ modelsList: newModels });
    }
  };

  const handleBulkApproveErrorCodes = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idsSet = new Set(ids);

    const newCommonProbsToAdd: CommonProblem[] = [];
    const newCategories = [...categoriesList];
    const newBrands = [...brandsList];
    const newModels = [...modelsList];
    let updatedCats = false, updatedBrands = false, updatedMods = false;

    let approvedCount = 0;
    const updatedErrors: ErrorCode[] = [];

    errorCodes.forEach(err => {
      if (idsSet.has(err.id)) {
        approvedCount++;
        if (err.isCommonProblem) {
          const newProb: CommonProblem = {
            id: err.id,
            code: 'مشکل شایع',
            category: err.category,
            brand: err.brand,
            model: err.model || 'عمومی',
            title: err.title,
            description: err.description,
            causes: err.causes || [],
            steps: err.steps || [],
            precautions: err.precautions || [],
            hazardLevel: err.hazardLevel || 'low',
            tags: err.tags || ['مشکل شایع'],
            views: err.views || 0,
            solutions: err.steps || []
          };
          newCommonProbsToAdd.push(newProb);
        } else {
          updatedErrors.push(harmonizeErrorCode({ ...err, isApproved: true }));
        }

        if (err.category && err.category.trim() && !newCategories.includes(err.category.trim())) {
          newCategories.push(err.category.trim());
          updatedCats = true;
        }
        if (err.brand && err.brand.trim() && !newBrands.includes(err.brand.trim())) {
          newBrands.push(err.brand.trim());
          updatedBrands = true;
        }
        if (err.model && err.model.trim() && err.model !== 'عمومی' && err.model !== 'کل مدل‌ها') {
          const sm = err.model.trim();
          if (!newModels.includes(sm)) {
            newModels.push(sm);
            updatedMods = true;
          }
        }
      } else {
        updatedErrors.push(err);
      }
    });

    saveErrorsToStorage(updatedErrors);

    let updatedProblems = [...commonProblems];
    if (newCommonProbsToAdd.length > 0) {
      updatedProblems = [...newCommonProbsToAdd, ...commonProblems];
      setCommonProblems(updatedProblems);
      localStorage.setItem('ir_common_problems', JSON.stringify(updatedProblems));
    }

    if (updatedCats) {
      setCategoriesList(newCategories);
      localStorage.setItem('ir_categories', JSON.stringify(newCategories));
    }
    if (updatedBrands) {
      setBrandsList(newBrands);
      localStorage.setItem('ir_brands', JSON.stringify(newBrands));
    }
    if (updatedMods) {
      setModelsList(newModels);
      localStorage.setItem('ir_models', JSON.stringify(newModels));
    }

    syncWithBackend({
      errorCodes: updatedErrors,
      ...(newCommonProbsToAdd.length > 0 ? { commonProblems: updatedProblems } : {}),
      ...(updatedCats ? { categoriesList: newCategories } : {}),
      ...(updatedBrands ? { brandsList: newBrands } : {}),
      ...(updatedMods ? { modelsList: newModels } : {}),
    });

    triggerNotification(
      'تایید دسته‌جمعی ممیزی کدهای خطا',
      `تعداد ${approvedCount} کد خطا با موفقیت تایید و در سیستم منتشر گردید.`,
      'success'
    );
  };

  const handleRejectErrorCode = async (id: string) => {
    try {
      const token = localStorage.getItem('session_user_id') || '';
      const response = await fetch(`/api/error-codes/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          'X-Session-Token': token
        }
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && (data.status === 'ok' || data.success)) {
        const updated = errorCodes.filter(err => err.id !== id);
        setErrorCodes(updated);
        localStorage.setItem('ir_errors', JSON.stringify(updated));
        triggerNotification('پیشنهاد کد خطا حذف گردید', 'عیب‌یابی ثبت شده توسط ادمین تایید نشد و حذف گردید.', 'warning');
      } else {
        alert(data.error || data.message || 'خطا در حذف کد خطا از سرور');
      }
    } catch (err: any) {
      alert(err.message || 'خطا در شبکه هنگام حذف کد خطا');
    }
  };

  const handleVerifyTechnician = (id: string, isVerified: boolean) => {
    const target = technicians.find(t => t.id === id);
    const updated = technicians.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          isVerified,
          documents: isVerified ? t.documents : [] // Force resubmission by wiping existing documents upon suspension
        };
      }
      return t;
    });
    saveTechsToStorage(updated);
    triggerNotification(
      isVerified ? 'تکنسین تایید صلاحیت شد' : 'تکنسین معلق گردید',
      isVerified ? 'وضعیت تایید هویت تکنسین کلیدی بروزرسانی و فعال شد.' : 'همکاری معلق گردید و به دلیل تعلیق دسترسی، نامبرده ملزم به ارسال مجدد اسناد صلاحیت شد.',
      isVerified ? 'success' : 'info'
    );
  };

  const handleUpdatePartStock = (id: string, newStock: number, newPrice: number) => {
    const updated = spareParts.map(p => {
      if (p.id === id) {
        return { ...p, stock: newStock, price: newPrice };
      }
      return p;
    });
    savePartsToStorage(updated);
    triggerNotification('ویراستار قطعات انبار', 'قیمت و تعداد موجودی با موفقیت اصلاح شد.', 'success');
  };

  const handleAdminCancelOrder = (orderId: string) => {
    handleUpdateOrderStatus(orderId, 'cancelled');
  };

  const handleApprovePayment = async (paymentId: string) => {
    const pIndex = paymentsList.findIndex(p => p.id === paymentId);
    if (pIndex === -1) return;
    
    const payment = paymentsList[pIndex];
    if (payment.status === 'completed') return;
    
    const updatedPayments = [...paymentsList];
    updatedPayments[pIndex] = {
      ...payment,
      status: 'completed',
      completed_at: new Date().toISOString()
    };

    // 1. If it's a part purchase
    if (payment.type === 'part_purchase' || payment.related_type === 'part_purchase' || payment.partId || payment.related_id) {
      const targetPartId = payment.partId || payment.related_id;
      const updatedParts = spareParts.map(p =>
        p.id === targetPartId ? { ...p, stock: Math.max(0, p.stock - 1) } : p
      );
      const updatedPurchases = partPurchases.map(pp => {
        const isMatch = (payment.ref_id && (pp.trackNumber === payment.ref_id || pp.shipping_tracking_code === payment.ref_id)) ||
                        (payment.ref_code && (pp.id === payment.ref_code || pp.orderId === payment.ref_code)) ||
                        (payment.order_id && pp.id === payment.order_id) ||
                        (pp.id === payment.id) ||
                        (targetPartId && (pp.partId === targetPartId || pp.part_id === targetPartId) && (pp.status === 'pending' || pp.status === 'pending_payment'));
        return isMatch ? { ...pp, status: 'confirmed' as const } : pp;
      });

      setSpareParts(updatedParts);
      setPartPurchases(updatedPurchases);
      savePurchasesToStorage(updatedPurchases);
      setPaymentsList(updatedPayments);

      try {
        const token = localStorage.getItem('session_user_id') || '';
        await fetch(`/api/payments/${paymentId}/approve`, {
          method: 'POST',
          headers: { 'X-Session-Token': token }
        });
      } catch (e) {
        console.warn("Backend part approve error:", e);
      }

      const success = await syncWithBackend({
        payments: updatedPayments,
        spareParts: updatedParts,
        partPurchases: updatedPurchases
      });

      if (success) {
        triggerNotification('تایید پرداخت قطعه', 'فیش پرداخت قطعه تایید شد و وضعیت سفارش به "تایید شده (آماده ارسال)" تغییر یافت.', 'success');
        
        const customerPhone = payment.customerPhone || payment.user_phone || payment.phone;
        if (customerPhone) {
          dispatchSmsNotification(
            customerPhone,
            `مشتری گرامی، پرداخت شما بابت خرید قطعه ${payment.partName || ''} تایید گردید و سفارش شما در مرحله ارسال قرار گرفت. کدیار۲۴`,
            'status'
          );
        }
      }
      return;
    }
    
    // 2. If it's a subscription purchase
    const plansList = [
      { id: "1_month", name: "اشتراک ۱ ماهه کدهای خطا", duration_days: 30 },
      { id: "3_month", name: "اشتراک ۳ ماهه کدهای خطا", duration_days: 90 },
      { id: "6_month", name: "اشتراک ۶ ماهه کدهای خطا", duration_days: 180 },
      { id: "12_month", name: "اشتراک ۱۲ ماهه کدهای خطا", duration_days: 365 }
    ];
    const planKey = payment.plan || payment.related_id || "1_month";
    const selectedPlan = plansList.find(pl => pl.id === planKey) || plansList[0];
    
    let userTargetId = payment.user_id || payment.user_phone;
    if (!userTargetId && payment.card_number && String(payment.card_number).startsWith("09")) {
      userTargetId = payment.card_number;
    }
    if (!userTargetId) {
      userTargetId = `us_pay_${payment.id}`;
    }

    const activeSub = subscriptionsList
      .filter((s: any) => (s.user_id === userTargetId || s.userId === userTargetId) && (s.is_active || s.status === 'active'))
      .sort((a: any, b: any) => new Date(b.expiry_date || b.end_date || 0).getTime() - new Date(a.expiry_date || a.end_date || 0).getTime())[0];

    let baseTime = activeSub && new Date(activeSub.expiry_date || activeSub.end_date) > new Date() ? new Date(activeSub.expiry_date || activeSub.end_date) : new Date();
    baseTime.setDate(baseTime.getDate() + (selectedPlan ? selectedPlan.duration_days : 30));
    const newExpiryDateStr = baseTime.toISOString();
    
    let newSub = {
      id: `sub_card_${Date.now()}`,
      user_id: userTargetId,
      userId: userTargetId,
      plan_id: selectedPlan.id,
      plan_name: selectedPlan.name,
      planName: selectedPlan.name,
      payment_id: payment.id,
      start_date: new Date().toISOString(),
      end_date: newExpiryDateStr,
      expiry_date: newExpiryDateStr,
      status: 'active',
      is_active: true,
      is_premium: true
    };

    // Explicitly invoke backend approval endpoint for MySQL persistence
    try {
      const token = localStorage.getItem('session_user_id') || '';
      const res = await fetch(`/api/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'X-Session-Token': token }
      });
      const data = await res.json();
      if (res.ok && data.subscription) {
        newSub = data.subscription;
      }
    } catch (e) {
      console.warn("Direct approve endpoint error:", e);
    }

    const updatedSubList = [newSub, ...subscriptionsList.filter((s: any) => s.id !== newSub.id)];

    const updatedUsers = usersList.map(u => {
      if (String(u.id) === String(payment.user_id) || String(u.phone) === String(payment.user_phone || payment.user_id)) {
        return {
          ...u,
          has_active_subscription: true,
          subscription: newSub
        };
      }
      return u;
    });
    setUsersList(updatedUsers);

    if (currentUser && (String(currentUser.id) === String(payment.user_id) || String(currentUser.phone) === String(payment.user_phone))) {
      setCurrentUser((prev: any) => prev ? {
        ...prev,
        has_active_subscription: true,
        subscription: newSub
      } : prev);
    }
    
    setPaymentsList(updatedPayments);
    setSubscriptionsList(updatedSubList);
    localStorage.setItem('ir_payments', JSON.stringify(updatedPayments));
    localStorage.setItem('ir_subscriptions', JSON.stringify(updatedSubList));
    localStorage.setItem('ir_users', JSON.stringify(updatedUsers));
    
    const success = await syncWithBackend({
      payments: updatedPayments,
      subscriptions: updatedSubList,
      users: updatedUsers
    });
    
    if (success) {
      triggerNotification('تایید عضویت پرداخت', 'اشتراک ویژه با تایید تراکنش با موفقیت فعال شد.', 'success');
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const pIndex = paymentsList.findIndex(p => p.id === paymentId);
    if (pIndex === -1) return;
    
    const payment = paymentsList[pIndex];
    const updatedPayments = [...paymentsList];
    updatedPayments[pIndex] = {
      ...payment,
      status: 'failed'
    };

    try {
      const token = localStorage.getItem('session_user_id') || '';
      await fetch(`/api/payments/${paymentId}/reject`, {
        method: 'POST',
        headers: { 'X-Session-Token': token }
      });
    } catch (e) {
      console.warn("Direct reject endpoint error:", e);
    }

    if (payment.type === 'part_purchase' || payment.related_type === 'part_purchase' || payment.partId || payment.related_id) {
      const targetPartId = payment.partId || payment.related_id;
      const updatedPurchases = partPurchases.map(pp => {
        const isMatch = (payment.ref_id && (pp.trackNumber === payment.ref_id || pp.shipping_tracking_code === payment.ref_id)) ||
                        (payment.ref_code && (pp.id === payment.ref_code || pp.orderId === payment.ref_code)) ||
                        (payment.order_id && pp.id === payment.order_id) ||
                        (pp.id === payment.id) ||
                        (targetPartId && (pp.partId === targetPartId || pp.part_id === targetPartId) && (pp.status === 'pending' || pp.status === 'pending_payment'));
        return isMatch ? { ...pp, status: 'rejected' as const } : pp;
      });
      setPartPurchases(updatedPurchases);
      savePurchasesToStorage(updatedPurchases);
      setPaymentsList(updatedPayments);
      const success = await syncWithBackend({
        payments: updatedPayments,
        partPurchases: updatedPurchases
      });
      if (success) {
        triggerNotification('رد فیش پرداخت قطعه', 'درخواست خرید قطعه رد شد.', 'warning');
      }
      return;
    }
    
    setPaymentsList(updatedPayments);
    const success = await syncWithBackend({
      payments: updatedPayments
    });
    if (success) {
      triggerNotification('رد فیش تراکنش', 'تراکنش مربوطه به حالت ناموفق تغییر یافت.', 'warning');
    }
  };

  const handleManualAddSubscription = async (userId: string, planId: string, customDays?: number) => {
    const durationMap: Record<string, number> = {
      '1_month': 30,
      '3_month': 90,
      '6_month': 180,
      '12_month': 365,
      'permanent': 36500
    };
    const days = customDays || durationMap[planId] || 30;

    const planNameMap: Record<string, string> = {
      '1_month': 'اشتراک ۱ ماهه کدهای خطا',
      '3_month': 'اشتراک ۳ ماهه کدهای خطا',
      '6_month': 'اشتراک ۶ ماهه کدهای خطا',
      '12_month': 'اشتراک ۱۲ ماهه کدهای خطا',
      'permanent': 'اشتراک دائمی همکار / مدیریت'
    };
    const pName = planNameMap[planId] || 'اشتراک ویژه کدهای خطا';

    const activeSub = subscriptionsList
      .filter((s: any) => s.user_id === userId && s.is_active)
      .sort((a: any, b: any) => new Date(b.expiry_date || b.end_date || 0).getTime() - new Date(a.expiry_date || a.end_date || 0).getTime())[0];

    let baseTime = activeSub && new Date(activeSub.expiry_date || activeSub.end_date) > new Date() ? new Date(activeSub.expiry_date || activeSub.end_date) : new Date();
    baseTime.setDate(baseTime.getDate() + days);
    const newExpiryDateStr = baseTime.toISOString();

    let newSub = {
      id: `sub_manual_${Date.now()}`,
      user_id: userId,
      plan_id: planId,
      plan_name: pName,
      planName: pName,
      start_date: new Date().toISOString(),
      end_date: newExpiryDateStr,
      expiry_date: newExpiryDateStr,
      status: 'active',
      is_active: true,
      is_premium: true
    };

    try {
      const token = localStorage.getItem('session_user_id') || '';
      const res = await fetch('/api/subscriptions/manual-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token
        },
        body: JSON.stringify({ userId, planId, durationDays: days })
      });
      const data = await res.json();
      if (res.ok && data.subscription) {
        newSub = data.subscription;
      }
    } catch (e) {
      console.warn("Manual add sub error:", e);
    }

    const updatedSubList = [newSub, ...subscriptionsList.filter((s: any) => s.id !== newSub.id)];
    setSubscriptionsList(updatedSubList);

    const userObj = usersList.find((u: any) => String(u.id) === String(userId) || String(u.phone) === String(userId)) ||
                    technicians.find((t: any) => String(t.id) === String(userId) || String(t.phone) === String(userId));
    const userName = userObj ? (userObj.full_name || userObj.name || 'کاربر') : 'کاربر';
    const userPhone = userObj ? (userObj.phone || userId) : userId;
    const userRole = userObj ? (userObj.role || (userObj.isVerified !== undefined ? 'technician' : 'client')) : 'client';

    const newPayment = {
      id: `pay_manual_${Date.now()}`,
      user_id: userId,
      user_phone: userPhone,
      user_name: userName,
      user_role: userRole,
      amount: 0,
      gateway: 'admin_manual',
      status: 'completed',
      ref_id: `MANUAL-${Math.floor(100000 + Math.random() * 900000)}`,
      card_holder: 'مدیریت کل سیستم',
      type: 'subscription',
      plan: planId,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString()
    };

    const updatedPayments = [newPayment, ...paymentsList];
    setPaymentsList(updatedPayments);
    localStorage.setItem('ir_payments', JSON.stringify(updatedPayments));
    localStorage.setItem('ir_subscriptions', JSON.stringify(updatedSubList));

    const success = await syncWithBackend({
      subscriptions: updatedSubList,
      payments: updatedPayments
    });

    if (success) {
      triggerNotification('فعال‌سازی اشتراک', `اشتراک ویژه برای کاربر ${userName} با موفقیت فعال شد.`, 'success');
      if (userPhone) {
        dispatchSmsNotification(
          userPhone,
          `کاربر گرامی (${userName})، اشتراک ویژه کد خطا و مشکلات شما در سامانه کدیار۲۴ با موفقیت فعال گردید.`,
          'status'
        );
      }
    }
  };

  const handleUpdatePostalTrackCode = async (purchaseId: string, postalCode: string) => {
    const updatedPurchases = partPurchases.map(pp => {
      if (pp.id === purchaseId || pp.trackNumber === purchaseId) {
        return {
          ...pp,
          trackNumber: postalCode,
          postalTrackingCode: postalCode,
          status: pp.status === 'pending' || pp.status === 'pending_payment' ? ('shipped' as const) : pp.status
        };
      }
      return pp;
    });

    setPartPurchases(updatedPurchases);

    const updatedPayments = paymentsList.map(pay => {
      if (pay.id === purchaseId || pay.ref_id === purchaseId) {
        return {
          ...pay,
          ref_id: postalCode,
          status: 'completed'
        };
      }
      return pay;
    });
    setPaymentsList(updatedPayments);

    const targetOrder = partPurchases.find(pp => pp.id === purchaseId);
    const success = await syncWithBackend({
      partPurchases: updatedPurchases,
      payments: updatedPayments
    });

    if (success) {
      triggerNotification('کد رهگیری پستی', 'کد رهگیری پستی با موفقیت ثبت شد و به مشتری اطلاع‌رسانی گردید.', 'success');
      const targetPhone = targetOrder?.customerPhone;
      if (targetPhone) {
        dispatchSmsNotification(
          targetPhone,
          `مشتری گرامی، کد رهگیری پستی مرسوله قطعه یدکی شما (${targetOrder?.partName || 'سفارش'}) عبارت است از: ${postalCode}. پیگیری در post.ir`,
          'status'
        );
      }
    }
  };

  const activeTrackingSteps = [
    { label: 'ثبت شد', value: 'registered' },
    { label: 'در انتظار تکنسین', value: 'waiting' },
    { label: 'پذیرفته شد', value: 'accepted' },
    { label: 'تکنسین در مسیر', value: 'enroute' },
    { label: 'تعمیر در حال انجام', value: 'repairing' },
    { label: 'نیاز به قطعه یدکی', value: 'needs_part' },
    { label: 'تکمیل شد', value: 'completed' },
    { label: 'لغو شد', value: 'cancelled' }
  ];

  const getStepProgressPercentage = (status: RepairOrder['status']) => {
    const steps = ['registered', 'waiting', 'accepted', 'enroute', 'repairing', 'needs_part', 'completed'];
    const idx = steps.indexOf(status);
    if (idx === -1) return 100; // cancelled or invalid is full/different
    return Math.round(((idx + 1) / steps.length) * 100);
  };

  if (currentUser?.mustChangePassword === true) {
    return <ForcedPasswordChange user={currentUser} onPasswordChanged={checkAuth} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-start items-stretch font-sans transition-all duration-300 w-full overflow-x-hidden">
      
      {/* Full-Width Content Frame */}
      <div className="w-full bg-white flex flex-col overflow-visible relative">
      
      {/* Universal Top Notification Banner */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-350 py-1.5 px-4 text-[10px] sm:text-xs">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>سامانه متمرکز خدمات پس از فروش و رفع عیوب مکانیکی، کولر، برودت و پکیج ایران</span>
          </div>
          <div className="hidden md:flex items-center gap-4">
            <a href={`tel:${supportPhone}`} className="text-white hover:text-amber-300 transition-colors flex items-center gap-1 font-extrabold animate-pulse">
              <span>📞 پشتیبانی فوری: {supportPhone}</span>
            </a>
            <span className="text-slate-500">|</span>
            <span>بیمه ۱۸۰ روزه قطعه و اجرت کارگذار</span>
          </div>
        </div>
      </div>

      {/* Shared Preview URL Notice */}
      {typeof window !== 'undefined' && (window.location.hostname.includes('ais-pre') || window.location.href.includes('-pre-')) && (
        <div className="bg-amber-600 text-white font-extrabold text-[11px] sm:text-xs py-2.5 px-4 text-center border-b border-amber-700 flex flex-col sm:flex-row items-center justify-center gap-3 animate-pulse shadow-md" id="shared-preview-notice">
          <span>⚠️ هشدار: شما در حال مشاهده نسخه قدیمیِ فریز شده (Preview URL) هستید. تغییرات جدید کدیار۲۴ (از جمله دکمه مستندات فنی TechDocs) فقط در لینک زنده توسعه قابل مشاهده است.</span>
          <a 
            href="https://ais-dev-ufsm2uycrw2mrszk6yttmq-571469118534.us-west2.run.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-white text-amber-900 px-3.5 py-1.5 rounded-xl font-black hover:bg-amber-100 transition-all text-xs shadow-xs cursor-pointer inline-flex items-center gap-1"
          >
            <span>ورود به آدرس زنده و جدید (Dev URL) 🚀</span>
          </a>
        </div>
      )}

      {/* Admin Broadcast Announcement Bar */}
      {adminAnnouncement?.isActive && adminAnnouncement?.text && !announcementDismissed && (
        <div className={`w-full py-3 px-4 flex items-center justify-between text-right gap-3 transition-all duration-300 border-b animate-in slide-in-from-top ${
          adminAnnouncement.style === 'success' 
            ? 'bg-emerald-50 border-emerald-100/90 text-emerald-900' 
            : adminAnnouncement.style === 'warning' 
            ? 'bg-amber-50 border-amber-100/90 text-amber-900' 
            : adminAnnouncement.style === 'danger' 
            ? 'bg-rose-50 border-rose-100/80 text-rose-950 font-semibold' 
            : 'bg-blue-50 border-blue-100/90 text-blue-950'
        }`} id="admin-global-announcement">
          <div className="flex items-center gap-2.5 mx-auto">
            <Megaphone className={`w-4 h-4 flex-shrink-0 animate-bounce ${
              adminAnnouncement.style === 'danger' ? 'text-rose-600' : 'text-blue-600'
            }`} />
            <span className="text-[11px] sm:text-xs leading-relaxed font-black">
              {adminAnnouncement.text}
            </span>
          </div>
          <button
            id="dismiss-announcement-btn"
            onClick={() => {
              setAnnouncementDismissed(true);
              localStorage.setItem('ir_announcement_dismissed_text', adminAnnouncement.text);
            }}
            className="p-1.5 rounded-full hover:bg-black/5 text-slate-500 hover:text-slate-800 transition-all font-bold text-xs shrink-0 cursor-pointer"
            title="بستن این پیام"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Beautiful Header Navigation - Solid Solid Sticky Opaque Layout */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-50 shadow-md w-full" id="main-app-header">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-3 flex flex-col md:flex-row items-center justify-between gap-3.5 text-right">
          
          {/* Logo container and mobile actions */}
          <div className="w-full md:w-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-gradient-to-tr from-blue-700 to-sky-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/10 flex-shrink-0">
                <Wrench className="w-5 h-5" />
              </div>
              <div className="text-right">
                <h1 className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight">
                  سامانه هوشمند کدیار24
                </h1>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                  <p className="text-[10px] text-slate-400 font-semibold">عیب‌یابی کدهای خطا، درخواست اعزام تکنسین و تأمین قطعات اصلی</p>
                  <a href={`tel:${supportPhone}`} className="text-[10px] text-emerald-700 hover:text-emerald-800 font-extrabold flex items-center gap-1 bg-emerald-50 border border-emerald-100/70 px-2 py-0.5 rounded-full hover:underline transition-all shadow-3xs" title="تماس فوری با پشتیبانی">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>پشتیبانی: {supportPhone}</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Mobile Actions Only */}
            <div className="flex md:hidden items-center gap-2">
              {roleSelection !== 'none' && currentRole !== 'admin' && (
                <button
                  id="role-exit-mobile-btn"
                  onClick={() => {
                    if (currentRole === 'technician' || loggedInTechId) {
                      handleSetLoggedInTechId(null);
                    }
                    setRoleSelection('none');
                    setCurrentRole('client');
                    setSelectedError(null);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 font-extrabold px-3 py-1.5 rounded-xl text-[10px] cursor-pointer"
                >
                  تغییر نقش
                </button>
              )}
              {currentRole === 'client' && (
                <button
                  onClick={() => {
                    setRoleSelection('client');
                    setClientActiveTab('dashboard');
                  }}
                  className="bg-amber-500 text-slate-900 p-2.5 rounded-xl border border-amber-650/20 shadow-xs flex items-center justify-center cursor-pointer"
                  title="داشبورد من"
                >
                  <User className="w-4.5 h-4.5" />
                </button>
              )}
              <button
                id="back-to-home-header-btn-mobile"
                onClick={() => {
                  setSelectedError(null);
                  setActiveTrackingOrder(null);
                  setTrackingPhoneNumber('');
                  const s = document.getElementById('search-main');
                  if (s) {
                    s.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    s.focus();
                  } else {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                className="bg-blue-50 text-blue-700 p-2.5 rounded-xl transition-all border border-blue-200/50 shadow-xs flex items-center justify-center cursor-pointer"
                title="صفحه اصلی"
              >
                <Home className="w-4.5 h-4.5" />
              </button>
              {currentRole === 'admin' && (
                <NotificationCenter
                  notifications={notifications}
                  onClear={handleClearNotifications}
                  onRemove={handleRemoveNotification}
                />
              )}
            </div>
          </div>

          {/* Core App Role Switching Navigation */}
          {(isAdmin || !!loggedInTechId || currentUser?.role === 'technician') && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/60 max-w-full overflow-x-auto scrollbar-none">
              <button
                id="role-client-tab"
                onClick={() => {
                  setCurrentRole('client');
                  setRoleSelection('client');
                  setSelectedError(null);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  (currentRole as string) === 'client'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50/60'
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>پورتال مشتریان روتین</span>
              </button>

              <button
                id="role-technician-tab"
                onClick={() => {
                  setCurrentRole('technician');
                  setRoleSelection('technician');
                  setSelectedError(null);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                  (currentRole as string) === 'technician'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-650 hover:text-slate-900 hover:bg-slate-50/60'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>پنل اختصاصی تکنسین‌ها</span>
              </button>

              {isAdmin && currentRole === 'admin' && (
                <button
                  id="role-admin-tab"
                  onClick={() => {
                    setCurrentRole('admin');
                    setRoleSelection('admin');
                    setSelectedError(null);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap bg-rose-600 text-white shadow-sm flex-shrink-0"
                >
                  <Laptop className="w-4 h-4" />
                  <span>پنل مدیریت (خروج با کلیک)</span>
                </button>
              )}
            </div>
          )}

          {/* Desktop Actions Only */}
          <div className="hidden md:flex items-center gap-2.5">
            {roleSelection !== 'none' && currentRole !== 'admin' && (
              <button
                id="role-exit-desktop-btn"
                onClick={() => {
                  if (currentRole === 'technician' || loggedInTechId) {
                    handleSetLoggedInTechId(null);
                  }
                  setRoleSelection('none');
                  setCurrentRole('client');
                  setSelectedError(null);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold px-3.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="تغییر نقش یا خروج از سیستم"
              >
                <span>خروج و تغییر نقش</span>
              </button>
            )}

            {currentRole === 'client' && (
              <button
                onClick={() => {
                  setRoleSelection('client');
                  setClientActiveTab('dashboard');
                }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <User className="w-4 h-4" />
                <span>{currentUser ? 'پروفایل / اشتراک من' : 'ورود / ثبت‌نام مشتریان'}</span>
              </button>
            )}

            <button
              id="back-to-home-header-btn"
              onClick={() => {
                setSelectedError(null);
                setActiveTrackingOrder(null);
                setTrackingPhoneNumber('');
                const s = document.getElementById('search-main');
                if (s) {
                  s.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  s.focus();
                } else {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              className="bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer border border-blue-200/50 shadow-xs"
              title="بازگشت زنده به صفحه اصلی عیب‌یابی"
            >
              <Home className="w-4 h-4" />
              <span>صفحه اصلی</span>
            </button>

            {currentRole === 'admin' && (
              <NotificationCenter
                notifications={notifications}
                onClear={handleClearNotifications}
                onRemove={handleRemoveNotification}
              />
            )}
          </div>

        </div>
      </header>

      {/* Admins Masquerading Banner */}
      {isAdmin && currentRole === 'technician' && loggedInTechId && (
        <div className="bg-gradient-to-r from-amber-600 to-rose-600 text-white text-center py-2.5 px-4 text-xs font-bold font-sans flex flex-col sm:flex-row items-center justify-center gap-3 shadow-md border-b border-amber-500/30 animate-in slide-in-from-top duration-300">
          <span>⚠️ دسترسی نظارتی ارشد: شما در حال حاضر کنترل کامل پنل تکنسین <strong>{activeTech?.name || 'مربوطه'}</strong> را به عنوان مدیر کل در اختیار دارید.</span>
          <button
            onClick={() => {
              handleSetLoggedInTechId(null);
              setCurrentRole('admin');
              setRoleSelection('admin');
              triggerNotification('بازگشت به مدیریت', 'با موفقیت به پنل مدیریت بازگشتید.', 'info');
            }}
            className="bg-white/25 hover:bg-white/35 text-white border border-white/40 px-3.5 py-1.5 rounded-xl text-[10px] font-extrabold cursor-pointer transition-colors"
          >
            ← خروج و بازگشت به پنل مدیریت
          </button>
        </div>
      )}

      {/* Main Content Body Layout */}
      <main className="flex-1 w-full p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 space-y-8">
        
        <AnimatePresence mode="wait">
          {((currentPath === '/admin-panel' || currentPath === '/admin' || currentPath === '/kodyar24-hq-secure-monitoring' || currentPath === '/kodyar24-gate-99') && !isAdmin) ? (
            <motion.div
              key="admin-login-screen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto my-12 bg-white border border-slate-200 p-8 rounded-3xl text-right space-y-6 shadow-xl font-sans"
            >
              <div className="flex flex-col items-center text-center space-y-3 pb-4 border-b border-slate-100">
                <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center border border-rose-100 shadow-xs">
                  <Shield className="w-9 h-9 text-rose-600 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-900">پورتال پشتیبانی فنی کدیار۲۴</h2>
                  <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed">
                    جهت دسترسی به خدمات فنی و مدیریتی، لطفاً کلمه عبور خود را وارد نمایید.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-black text-slate-800">کلمه عبور مدیریت:</label>
                  <input
                    type="password"
                    value={adminLoginPasswordInput}
                    onChange={(e) => {
                      setAdminLoginPasswordInput(e.target.value);
                      setAdminLoginError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmitAdminLogin();
                    }}
                    className="w-full bg-white border border-slate-200 text-xs px-4 py-3 rounded-xl outline-none focus:border-rose-600 font-mono text-center text-base font-extrabold tracking-widest text-slate-900"
                    placeholder="••••••"
                    autoFocus
                  />
                  {adminLoginError && (
                    <p className="text-rose-600 text-[10px] font-extrabold">{adminLoginError}</p>
                  )}
                </div>

                <button
                  onClick={handleSubmitAdminLogin}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3 rounded-xl text-xs transition-colors cursor-pointer text-center"
                >
                  تایید و ورود به پورتال
                </button>

                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      setCurrentPath('/');
                      setRoleSelection('none');
                      window.history.pushState({}, '', '/');
                    }}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-semibold cursor-pointer"
                  >
                    بازگشت به پورتال اصلی کدیار۲۴
                  </button>
                </div>
              </div>
            </motion.div>
          ) : currentPath.toLowerCase().includes('/download') || currentPath.toLowerCase().includes('.apk') ? (
            <motion.div
              key="download-landing-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-xl mx-auto my-6 sm:my-12 bg-white border border-slate-250 p-6 sm:p-10 rounded-3xl text-right space-y-6 shadow-xl"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center border border-emerald-150 shadow-xs">
                  <Smartphone className="w-9 h-9 animate-bounce text-emerald-600" />
                </div>
                <div className="space-y-1.5">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900">دانلود مستقیم اپلیکیشن اندروید کدیار۲۴</h2>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-md leading-relaxed">
                    با دانلود و نصب اپلیکیشن اندروید کدیار۲۴، به راحتی و در هر لحظه به صورت آفلاین به ارورها، عیب‌یابی و مأموریت‌های تعمیراتی دسترسی داشته باشید.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 text-center space-y-4">
                <a
                  href={pageContents.appDownloadUrl || "https://kodyar24.ir/download/app.apk"}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black px-6 py-3.5 rounded-2xl transition-all inline-flex items-center gap-2 shadow-md hover:shadow-emerald-200 active:scale-95 cursor-pointer w-full justify-center"
                  download
                >
                  <Smartphone className="w-5 h-5" />
                  <span>شروع دانلود مستقیم فایل APK</span>
                </a>
                
                <div className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto text-center space-y-1">
                  <p className="font-bold text-slate-700">📱 راهنمای نصب:</p>
                  <p>
                    پس از دانلود فایل APK، آن را در گوشی اندرویدی خود اجرا کرده و با تأیید مجوز نصب، اپلیکیشن کدیار۲۴ را به راحتی نصب نمایید.
                  </p>
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <button
                  onClick={() => {
                    setCurrentPath('/');
                    setRoleSelection('none');
                    window.history.pushState({}, '', '/');
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-250 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-3xs"
                >
                  ← ورود به صفحه اصلی سامانه کدیار۲۴
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* USER SELECTION IDENTITY GATE - RENDERED BY DEFAULT ON NEW VISITS */}
              {roleSelection === 'none' && currentRole !== 'admin' && (
            <motion.div
              key="gateway-gate"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto my-4 space-y-8 text-center font-sans animate-fade-in"
            >
              <div className="space-y-3">
                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-4 py-1.5 rounded-full text-xs font-black inline-block shadow-xs">
                  درگاه ورودی اختصاصی پلتفرم کدیار24 🇮🇷
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight leading-relaxed">
                  لطفاً نقش خود را جهت ورود به پورتال انتخاب فرمایید
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
                  جهت تسهیل و تسریع در ارائه خدمات، دسترسی مشتریان محترم و تکنسین‌های فنی به صورت کامل مجزا گردیده است.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                {/* 1. CUSTOMER PORTAL GATE */}
                <div 
                  onClick={() => {
                    setRoleSelection('client');
                    setCurrentRole('client');
                  }}
                  className="bg-white border-2 border-slate-200 hover:border-blue-600 rounded-3xl p-6 sm:p-8 text-right space-y-5 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group select-none"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 group-hover:bg-blue-100/50 rounded-full -mr-16 -mt-16 transition-colors" />
                  
                  <div className="relative z-10 w-12 h-12 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center border border-blue-200 shadow-sm mb-4">
                    <Smartphone className="w-6 h-6" />
                  </div>

                  <div className="relative z-10 space-y-2">
                    <h3 className="font-black text-md sm:text-lg text-slate-900 group-hover:text-blue-700 transition-colors">
                      ورود به عنوان مشتری (یافتن کدهای ارور / اعزام فوری تعمیرکار)
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      اگر صاحب دستگاه معیوب هستید؛ عکس یا کد خطا را عیب‌یابی کنید، راهکارهای علمی را مطالعه کنید، استعلام قطعه بگیرید یا نوبت اعزام تعمیرکار ثبت نمایید.
                    </p>
                  </div>

                  <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold">بخش عمومی - بدون نیاز به حساب</span>
                    <span className="bg-blue-600 group-hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1">
                      ورود به پورتال مشتریان
                    </span>
                  </div>
                </div>

                {/* 2. TECHNICIAN PORTAL GATE */}
                <div 
                  onClick={() => {
                    setRoleSelection('technician');
                    setCurrentRole('technician');
                  }}
                  className="bg-white border-2 border-slate-200 hover:border-slate-900 rounded-3xl p-6 sm:p-8 text-right space-y-5 cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group select-none"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 group-hover:bg-slate-200/50 rounded-full -mr-16 -mt-16 transition-colors" />
                  
                  <div className="relative z-10 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center border border-slate-800 shadow-sm mb-4">
                    <Truck className="w-6 h-6" />
                  </div>

                  <div className="relative z-10 space-y-2">
                    <h3 className="font-black text-md sm:text-lg text-slate-900 group-hover:text-slate-950 transition-colors">
                      ورود به عنوان همکار فنی (تکنسین متخصص صنف)
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      ویژه تکنسین‌ها و همکاران فنی. مدیریت مأموریت‌ها، ثبت گزارش فنی و دسترسی به راهکارهای عیب‌یابی.
                    </p>
                  </div>

                  <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold">ملزم به احراز هویت و کلمه عبور</span>
                    <span className="bg-slate-900 group-hover:bg-black text-white rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1">
                      احراز هویت و ورود تکنسین
                    </span>
                  </div>
                </div>
              </div>



            </motion.div>
          )}

          {/* 1. CUSTOMER PORTAL */}
          {roleSelection === 'client' && currentRole === 'client' && (
            <ErrorBoundary fallbackTitle="خطا در بارگذاری پنل عیب‌یابی لوازم خانگی">
              <motion.div
                key="client-portal"
                initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-8"
            >
              {/* Tab Selector pills for Client Portal */}
              <div className="flex justify-center mb-6">
                <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 flex items-center gap-1.5 shadow-2xs">
                  <button
                    onClick={() => setClientActiveTab('search')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                      clientActiveTab === 'search'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Search className="w-4 h-4" />
                    <span>جستجو و عیب‌یابی کدهای خطا</span>
                  </button>
                  <button
                    onClick={() => setClientActiveTab('dashboard')}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 relative ${
                      clientActiveTab === 'dashboard'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span>داشبورد و حساب کاربری</span>
                    {(effectiveUser?.subscription?.is_premium || effectiveUser?.role === 'technician' || !!loggedInTechId) && (
                      <span className="absolute top-1 left-1.5 w-2 h-2 bg-amber-500 rounded-full" />
                    )}
                  </button>
                </div>
              </div>

              {clientActiveTab === 'dashboard' ? (
                <ClientDashboard
                  currentUser={effectiveUser}
                  checkAuth={checkAuth}
                  onLogout={async () => {
                    try {
                      const token = localStorage.getItem('session_user_id') || '';
                      await fetch('/api/auth/logout', { 
                        method: 'POST',
                        headers: { 'X-Session-Token': token }
                      });
                    } catch (e) {}
                    document.cookie = "session_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    localStorage.removeItem('session_user_id');
                    localStorage.setItem('ir_current_role', 'client');
                    localStorage.setItem('ir_role_selection', 'none');
                    localStorage.removeItem('ir_logged_in_tech_id');
                    setCurrentUser(null);
                    setCurrentRole('client');
                    setRoleSelection('none');
                    window.location.href = '/';
                  }}
                  triggerNotification={triggerNotification}
                  citiesList={citiesList}
                  orders={orders}
                  partPurchases={partPurchases}
                />
              ) : (
                <>
                  {/* Error Search and visual diagnosing Engine section - Placed First for Max Saliency */}
              <div id="quick-diagnosis-section" className="scroll-mt-24 space-y-4">
                {pageContents.appDownloadUrl && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-3xs text-right">
                    <div className="flex items-center gap-3 text-right">
                      <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0">
                        <Smartphone className="w-5 h-5 animate-bounce" />
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="font-extrabold text-xs text-slate-900">اپلیکیشن اندروید و نسخه وب کدیار24</h3>
                        <p className="text-slate-500 text-[10px]">برای کاربری سریع‌تر و دسترسی آفلاین به عیب‌یابی کدهای خطا، اپلیکیشن رسمی کدیار24 را دانلود کنید.</p>
                      </div>
                    </div>
                    <a
                      href={pageContents.appDownloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] sm:text-xs font-black px-4 py-2.5 rounded-xl transition-all w-max inline-flex items-center gap-1.5 shadow-xs active:scale-95 cursor-pointer shrink-0"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>دانلود مستقیم اپلیکیشن</span>
                    </a>
                  </div>
                )}

                <div className="bg-blue-600 text-white rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm border border-blue-700/50">
                  <div className="space-y-0.5">
                    <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-md inline-block">راهنمای هوشمند پیشگیری</span>
                    <h3 className="font-bold text-xs sm:text-xs">ابتدا کد ارور خود را عیب‌یابی کنید</h3>
                    <p className="text-blue-100 text-[10px]">بیش از ۹۰٪ خرابی‌های لوازم خانگی به صورت دستی با عیب‌یابی کدهای خطا مرتفع شده است.</p>
                  </div>
                  <button
                    onClick={() => {
                      const s = document.getElementById('search-main');
                      if (s) s.focus();
                    }}
                    className="bg-white text-blue-700 text-[10px] sm:text-xs font-extrabold px-3.5 py-1.5 rounded-xl hover:bg-blue-50 transition-colors w-max"
                  >
                    پرش سریع به فیلد جستجو
                  </button>
                </div>

                <ErrorSearch
                  errorCodes={(errorCodes || []).filter(c => c && c.isApproved)}
                  commonProblems={commonProblems || []}
                  spareParts={spareParts || []}
                  affiliateProducts={affiliateProducts || []}
                  onSelectError={setSelectedError}
                  selectedError={selectedError}
                  onBookRepair={(err) => {
                    setSelectedError(err);
                    setIsBookingOpen(true);
                  }}
                  onFilterParts={handleFilterPartsForSelectedError}
                  onSearchActiveChange={setIsSearchActive}
                  currentUser={currentUser || (loggedInTechId ? { id: loggedInTechId, role: 'technician', full_name: activeTech?.name, phone: activeTech?.phone } : null)}
                  triggerNotification={triggerNotification}
                  onGoToDashboard={() => {
                    setRoleSelection('client');
                    setClientActiveTab('dashboard');
                    setTimeout(() => {
                      const element = document.getElementById('client-premium-plans-section') || document.getElementById('role-client-tab');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }
                    }, 200);
                  }}
                  onPurchase={handlePurchasePart}
                  categoryConfig={categoryConfig || {}}
                  technicians={technicians || []}
                />
              </div>

              {!isSearchActive && (
                <>
                  {/* Promotional Hero Block */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-blue-955 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-lg">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-600/5 rounded-full blur-3xl" />

                <div className="relative z-10 max-w-3xl space-y-4">
                  <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10.5px] font-bold px-3 py-1 rounded-full inline-block">
                    مرجع جامع کدهای ارور لوازم خانگی ایران
                  </span>
                  
                  <h2 className="text-xl sm:text-2xl font-extrabold leading-normal sm:leading-relaxed text-white">
                    حل سریع و تضمینی تمام کدهای خطای پکیج، کولرگازی و لباسشویی
                  </h2>

                  <p className="text-slate-300 text-xs leading-relaxed font-sans">
                    دیگر نیازی به گشت و گذارهای خسته‌کننده در سایت‌های نامعتبر نیست. اینجا کدهای ارور تمام برندها (بوتان، ایران رادیاتور، ال‌جی، سامسونگ، اسنوا و...) به صورت علمی مستند شده است. در صورت نیاز، متبحرترین تکنسین محلی در کنار شماست.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      id="scroll-to-search-btn"
                      onClick={() => {
                        const s = document.getElementById('search-main');
                        if (s) {
                          s.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          s.focus();
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold py-2.5 px-5 transition-transform hover:scale-[1.02] cursor-pointer"
                    >
                      شروع عیب‌یابی فوری کد خطا
                    </button>
                    
                    <button
                      id="order-repair-direct"
                      onClick={() => setIsBookingOpen(true)}
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-semibold py-2.5 px-5 transition-transform hover:scale-[1.02] cursor-pointer"
                    >
                      اعزام مستقیم تعمیرکار بدون کد خطا
                    </button>
                  </div>
                </div>
              </div>

              {/* Online Tracker Module per customer request */}
              <div id="tracking-section" className="bg-white rounded-2xl border border-slate-205 p-5 shadow-xs space-y-4">
                <div className="border-r-3 border-sky-505 pr-2">
                  <h3 className="font-extrabold text-slate-800 text-xs sm:text-xs">پیگیری برخط وضعیت گام‌های سفارش تعمیر</h3>
                  <p className="text-slate-400 text-[10px] mt-0.5">شماره موبایلی که با آن سفارش داده‌اید را وارد کنید تا وضعیت لحظه‌ای تکنسین در مسیر را پیگیری کنید.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 max-w-xl">
                  <input
                    id="track-phone-input"
                    type="tel"
                    placeholder="مثال: 09123456789"
                    value={trackingPhoneNumber}
                    onChange={(e) => setTrackingPhoneNumber(e.target.value.replace(/[^0-9۰-۹\u0660-\u0669\u06f0-\u06f9]/g, ''))}
                    className="bg-slate-50 border border-slate-220 text-xs px-4 py-2.5 rounded-xl flex-1 focus:bg-white outline-none focus:border-blue-500 text-left font-mono"
                  />
                  <button
                    id="track-phone-submit"
                    onClick={handleSearchTrackingPhoneNumber}
                    className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold py-2.5 px-5 transition-colors cursor-pointer"
                  >
                    پیگیری آنلاین وضعیت
                  </button>
                </div>

                {/* Tracking Progress visualized */}
                {activeTrackingOrder && (
                  <div className="mt-4 bg-blue-50/20 border border-blue-100 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
                    <div className="flex flex-wrap items-center justify-between gap-1 border-b border-blue-105 pb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 block">برند و مدل دستگاه</span>
                        <span className="text-slate-800 font-bold text-xs">
                          {activeTrackingOrder.category} {activeTrackingOrder.brand} {activeTrackingOrder.model && `(${activeTrackingOrder.model})`}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">کد رهگیری فاکتور</span>
                        <span className="text-blue-700 font-bold font-mono text-xs">{activeTrackingOrder.id}</span>
                      </div>
                    </div>

                    {/* Progress milestone line */}
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-2">
                        <span>روند پیشرفت:</span>
                        <span className="text-blue-600">{getStepProgressPercentage(activeTrackingOrder.status)}٪</span>
                      </div>
                      
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${getStepProgressPercentage(activeTrackingOrder.status)}%` }} 
                        />
                      </div>
                    </div>

                    {/* Horizon display dots */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center pt-2">
                      {activeTrackingSteps.map((s) => {
                        const isCurrent = activeTrackingOrder.status === s.value;
                        return (
                          <div 
                            key={s.value} 
                            className={`p-2 rounded-xl border text-[10px] font-bold transition-all ${
                              isCurrent 
                                ? 'bg-blue-600 text-white border-blue-650 scale-105 shadow-xs' 
                                : 'bg-slate-100/60 text-slate-500 border-slate-100'
                            }`}
                          >
                            <span>{s.label}</span>
                          </div>
                        );
                      })}
                    </div>

                    <div className="bg-white rounded-xl border border-slate-150 p-3 text-xs leading-relaxed text-slate-600 block sm:flex sm:items-center justify-between gap-4 font-sans">
                      <div>
                        <strong>وضعیت تکنسین: </strong>
                        {activeTrackingOrder.technicianName ? (
                          <span>جناب {activeTrackingOrder.technicianName} عهده‌دار سفارش هستند (شماره تماس: <span className="font-semibold">{activeTrackingOrder.technicianPhone}</span>)</span>
                        ) : (
                          <span>در حال جستجوی نزدیک‌ترین تکنسین تایید صلاحیت شده در محله شما...</span>
                        )}
                        {activeTrackingOrder.repairLog && (
                          <div className="mt-1 text-[11px] text-blue-700 bg-blue-50/50 p-1.5 rounded-lg">گزارش کار نهایی: {activeTrackingOrder.repairLog}</div>
                        )}
                      </div>

                      {/* Display cancel option for clients if order is still fresh */}
                      {activeTrackingOrder.status === 'waiting' && (
                        <button
                          id="client-cancel-own-order"
                          onClick={() => handleUpdateOrderStatus(activeTrackingOrder.id, 'cancelled')}
                          className="text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 text-[10px] py-1 px-3 rounded-lg flex-shrink-0 cursor-pointer text-center mt-2 sm:mt-0"
                        >
                          انصراف از رزرو نوبت
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 14. SPARE PARTS MARKETPLACE SECTION */}
              <div id="parts-store-section">
                <PartsStore
                  parts={spareParts}
                  onPurchase={handlePurchasePart}
                  brandFilter={shopBrandFilter}
                  categoryFilter={shopCategoryFilter}
                  onClearFilters={() => {
                    setShopBrandFilter('');
                    setShopCategoryFilter('');
                  }}
                />
              </div>
            </>
          )}
                </>
              )}
        </motion.div>
            </ErrorBoundary>
          )}

          {/* 2. TECHNICIAN PORTAL */}
          {roleSelection === 'technician' && currentRole === 'technician' && (
            <ErrorBoundary fallbackTitle="خطا در پردازش پنل اختصاصی تکنسین‌های فنی">
              <motion.div
                key="technician-portal"
                initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              {loggedInTechId && activeTech && (activeTech.isVerified || isAdmin) ? (
                <TechnicianPanel
                  technicians={technicians}
                  activeTech={activeTech}
                  orders={orders}
                  spareParts={spareParts}
                  citiesList={citiesList}
                  onAcceptOrder={handleAcceptOrder}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onNewErrorSubmit={handleNewErrorCodeSubmitFromTech}
                  triggerNotification={triggerNotification}
                  onUpdateTechnician={(techId, updatedFields) => {
                    const updated = technicians.map(t => {
                      if (t.id === techId) {
                        return { ...t, ...updatedFields };
                      }
                      return t;
                    });
                    saveTechsToStorage(updated);
                  }}
                  onLogout={() => {
                    const isAdminActive = isAdmin;
                    handleSetLoggedInTechId(null);
                    if (isAdminActive) {
                      setCurrentRole('admin');
                      setRoleSelection('admin');
                      triggerNotification('پایان مدیریت هویت', 'با موفقیت به پنل مدیریت بازگشتید.', 'info');
                    } else {
                      setRoleSelection('none');
                      setCurrentRole('client');
                      triggerNotification('خروج موفق', 'با موفقیت از پنل اختصاصی تکنسین خارج شدید.', 'info');
                    }
                  }}
                  onChangeTech={(id) => {
                    const techObj = technicians.find(t => t.id === id);
                    if (techObj) {
                      handleSetLoggedInTechId(id);
                      // switch active technician simulation
                      const temp = [...technicians];
                      const idx = temp.findIndex(t => t.id === id);
                      if (idx > -1) {
                        temp.splice(idx, 1);
                        temp.unshift(techObj); // Make first
                        setTechnicians(temp);
                      }
                    }
                  }}
                />
              ) : (
                <TechnicianAuth
                  technicians={technicians}
                  loggedInTech={loggedInTechId && activeTech ? activeTech : null}
                  citiesList={citiesList}
                  categoriesList={categoriesList}
                  onRegister={(newTech) => {
                    const updated = [...technicians, newTech];
                    saveTechsToStorage(updated);
                    // Automatically mark password and cache so they fall into login context
                    handleSetLoggedInTechId(newTech.id);
                  }}
                  onLoginSuccess={(techId) => {
                    handleSetLoggedInTechId(techId);
                  }}
                  onLogout={() => {
                    handleSetLoggedInTechId(null);
                    setRoleSelection('none');
                    triggerNotification('خروج از حساب', 'با موفقیت از سامانه احراز هویت خارج شدید.', 'info');
                  }}
                  onResubmitDocs={(techId, newDocs) => {
                    const updated = technicians.map(t => {
                      if (t.id === techId) {
                        return { ...t, documents: newDocs };
                      }
                      return t;
                    });
                    saveTechsToStorage(updated);
                    triggerNotification('ارسال مجدد مدارک', 'اسناد جدید صلاحیت شغلی صمیمانه پیوست شد و در صف اولویت ممیزی قرار گرفت.', 'success');
                  }}
                  triggerNotification={triggerNotification}
                />
              )}
            </motion.div>
            </ErrorBoundary>
          )}

          {/* 3. ADMINISTRATIVE CONTROL PANEL */}
          {currentRole === 'admin' && (
            <ErrorBoundary fallbackTitle="خطا در پردازش داشبورد ممیزی مدیریت کل">
              <motion.div
                key="admin-portal"
                initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <AdminPanel
                orders={orders}
                errorCodes={errorCodes}
                usersList={usersList}
                subscriptionsList={subscriptionsList}
                paymentsList={paymentsList}
                adminPassword={adminPassword}
                adminAnnouncement={adminAnnouncement}
                onUpdateAdminAnnouncement={(announcement) => {
                  setAdminAnnouncement(announcement);
                  localStorage.setItem('ir_announcement', JSON.stringify(announcement));
                  syncWithBackend({ adminAnnouncement: announcement });
                }}
                trustBadges={trustBadges}
                onUpdateTrustBadges={(badges) => {
                  setTrustBadges(badges);
                  localStorage.setItem('ir_trust_badges', JSON.stringify(badges));
                  syncWithBackend({ trustBadges: badges });
                }}
                supportPhone={supportPhone}
                onUpdateSupportPhone={(phone) => {
                  setSupportPhone(phone);
                  localStorage.setItem('ir_support_phone', phone);
                  syncWithBackend({ supportPhone: phone });
                }}
                onUpdateAdminPassword={(newPass) => {
                  setAdminPassword(newPass);
                  localStorage.setItem('ir_admin_password', newPass);
                  syncWithBackend({ adminPassword: newPass });
                }}
                smsSettings={smsSettings}
                onUpdateSmsSettings={(settings) => {
                  setSmsSettings(settings);
                  syncWithBackend({ smsSettings: settings });
                }}
                smsLogs={smsLogs}
                onSendTestSms={dispatchSmsNotification}
                technicians={technicians}
                spareParts={spareParts}
                citiesList={citiesList}
                brandsList={brandsList}
                categoriesList={categoriesList}
                modelsList={modelsList}
                onApproveErrorCode={handleApproveErrorCode}
                onBulkApproveErrorCodes={handleBulkApproveErrorCodes}
                onRejectErrorCode={handleRejectErrorCode}
                onVerifyTechnician={handleVerifyTechnician}
                onUpdatePartStock={handleUpdatePartStock}
                onAdminCancelOrder={handleAdminCancelOrder}
                onApprovePayment={handleApprovePayment}
                onRejectPayment={handleRejectPayment}
                onManualAddSubscription={handleManualAddSubscription}
                onUpdatePostalTrackCode={handleUpdatePostalTrackCode}
                onUpdateCitiesList={(list) => {
                  const cleanedCities = cleanCitiesList(list);
                  setCitiesList(cleanedCities);
                  localStorage.setItem('ir_cities', JSON.stringify(cleanedCities));
                  syncWithBackend({ citiesList: cleanedCities });
                }}
                onUpdateBrandsList={(list) => {
                  setBrandsList(list);
                  localStorage.setItem('ir_brands', JSON.stringify(list));
                  syncWithBackend({ brandsList: list });
                }}
                onUpdateCategoriesList={(list) => {
                  setCategoriesList(list);
                  localStorage.setItem('ir_categories', JSON.stringify(list));
                  syncWithBackend({ categoriesList: list });
                }}
                onUpdateModelsList={(list) => {
                  const cleaned = cleanModelsList(list);
                  setModelsList(cleaned);
                  localStorage.setItem('ir_models', JSON.stringify(cleaned));
                  syncWithBackend({ modelsList: cleaned });
                }}
                onUpdateErrorCodesList={(list) => {
                  setErrorCodes(list);
                  localStorage.setItem('ir_errors', JSON.stringify(list));
                  syncWithBackend({ errorCodes: list });
                }}
                onUpdateSparePartsList={(list) => {
                  setSpareParts(list);
                  localStorage.setItem('ir_parts', JSON.stringify(list));
                  syncWithBackend({ spareParts: list });
                }}
                commonProblems={commonProblems}
                onUpdateCommonProblemsList={saveCommonProblemsToStorage}
                partPurchases={partPurchases}
                onUpdatePartPurchases={savePurchasesToStorage}
                pageContents={pageContents}
                onUpdatePageContents={savePageContentsToStorage}
                userFeedbacks={userFeedbacks}
                onUpdateUserFeedbacks={saveFeedbacksToStorage}
                affiliateProducts={affiliateProducts}
                onUpdateAffiliateProducts={(products) => {
                  setAffiliateProducts(products);
                  localStorage.setItem('ir_affiliate_products', JSON.stringify(products));
                  syncWithBackend({ affiliateProducts: products });
                }}
                categoryConfig={categoryConfig}
                onUpdateCategoryConfig={(config) => {
                  setCategoryConfig(config);
                  localStorage.setItem('ir_category_config', JSON.stringify(config));
                  syncWithBackend({ categoryConfig: config });
                }}
                onLoginAsTechnician={(techId) => {
                  handleSetLoggedInTechId(techId);
                  setCurrentRole('technician');
                  setRoleSelection('technician');
                  triggerNotification('دسترسی نظارت ارشد', 'ورود موازی مدیریت و کنترل کامل پنل اختصاصی تکنسین فعال گردید.', 'success');
                }}
                onResetDatabase={async () => {
                  setErrorCodes([]);
                  setCommonProblems([]);
                  setCategoriesList([]);
                  setBrandsList([]);
                  setModelsList([]);
                  localStorage.setItem('ir_errors', '[]');
                  localStorage.setItem('ir_common_problems', '[]');
                  localStorage.setItem('ir_categories', '[]');
                  localStorage.setItem('ir_brands', '[]');
                  localStorage.setItem('ir_models', '[]');
                  try {
                    await syncWithBackend({
                      errorCodes: [],
                      commonProblems: [],
                      categoriesList: [],
                      brandsList: [],
                      modelsList: []
                    });
                    
                    // Send simulated SMS alert to the manager
                    const managerSmsMsg = 'مدیر گرامی، کدهای خطا و مشکلات عیب‌یابی در سامانه کدیار۲۴ با موفقیت پاکسازی شدند. اطلاعات هویتی تکنسین‌ها، اشتراک‌ها و سفارشات اعزام کاملاً ایمن و محفوظ هستند.';
                    dispatchSmsNotification('09120000000', managerSmsMsg, 'status');

                    triggerNotification('پاکسازی کدهای خطا', 'کدهای عیب‌یابی و مشکلات متداول با موفقیت پاکسازی شدند.', 'warning');
                    triggerNotification('حفظ اطلاعات مهم', 'اطلاعات تکنسین‌ها، سفارشات، اشتراک‌ها و خریدها کاملاً ایمن و بدون تغییر باقی ماندند.', 'success');
                    
                    alert('⚠️ مدیریت محترم کدیار۲۴\n\nکدهای خطا و مشکلات عیب‌یابی با موفقیت پاکسازی شدند.\n\nتکنسین‌ها، اشتراک‌ها، سفارشات اعزام و خریدها کاملاً بدون تغییر و محفوظ مانده‌اند.');
                  } catch (err: any) {
                    triggerNotification('خطای همگام‌سازی', 'خطا در همگام‌سازی ریست دیتابیس با سرور مرکزی.', 'warning');
                  }
                }}
                onUpdateTechniciansList={saveTechsToStorage}
                onLogout={async () => {
                  try {
                    const token = localStorage.getItem('session_user_id') || '';
                    await fetch('/api/auth/logout', { 
                      method: 'POST',
                      headers: { 'X-Session-Token': token }
                    });
                  } catch (e) {}
                  document.cookie = "session_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                  localStorage.removeItem('session_user_id');
                  localStorage.setItem('ir_current_role', 'client');
                  localStorage.setItem('ir_role_selection', 'none');
                  localStorage.removeItem('ir_logged_in_tech_id');
                  setCurrentUser(null);
                  setCurrentRole('client');
                  setRoleSelection('none');
                  window.location.href = '/';
                }}
                onForceRefreshDatabase={async () => {
                  await loadDatabase(true);
                }}
              />
            </motion.div>
            </ErrorBoundary>
          )}
            </>
          )}
        </AnimatePresence>

      </main>

      {/* Booking Form Overlay Drawer */}
      {isBookingOpen && (
        <BookingForm
          prefilledError={selectedError}
          preselectedTech={preselectedTechForBooking || referredTech}
          onBookingSubmit={handleBookingSubmit}
          onClose={() => {
            setIsBookingOpen(false);
            setPreselectedTechForBooking(null);
          }}
          citiesList={citiesList}
          brandsList={brandsList}
          categoriesList={categoriesList}
          onSendSms={dispatchSmsNotification}
        />
      )}

      {/* Booking Success On-Screen Notification Modal */}
      {successOrder && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[4px] font-sans text-right dir-rtl" id="booking-success-modal">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Success Header banner styled beautifully with custom background gradient */}
            <div className="bg-gradient-to-l from-emerald-600 to-teal-600 text-white p-6 text-center space-y-2 relative">
              <div className="mx-auto w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-bounce mb-1">
                <Check className="w-6 h-6 text-white stroke-[3.5]" />
              </div>
              <h3 className="font-extrabold text-base">ثبت موفقیت‌آمیز سفارش کار</h3>
              <p className="text-[11px] text-emerald-50">درخواست شما با موفقیت در شبکه همکاران کدیار24 گشایش گردید</p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-xs space-y-2.5">
                <div className="text-center font-extrabold text-[13px] text-slate-800 border-b border-slate-200/55 pb-2.5 mb-2 flex items-center justify-center gap-1.5">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md text-[10px] font-bold">تأییدیه رزرو</span>
                  <span>جزئیات پرونده فنی و تعمیراتی فرستاده شده</span>
                </div>
                <div className="grid grid-cols-2 gap-3.5 text-slate-705 leading-relaxed font-sans">
                  <div>
                    <span className="text-slate-400 block text-[9.5px]">نام متقاضی محترم:</span>
                    <strong className="text-slate-900 font-extrabold">{successOrder.customerName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9.5px]">کد رهگیری پیگیری فاکتور:</span>
                    <strong className="text-blue-700 font-extrabold font-mono text-xs">{successOrder.id}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9.5px]">نوع سرویس و محصول:</span>
                    <strong className="text-slate-900 font-extrabold">
                      {successOrder.category === 'پکیج دیواری' ? 'تعمیر پکیج دیواری' : `تعمیر ${successOrder.category}`} {successOrder.brand}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9.5px]">مدل و خطای اعلام شده:</span>
                    <strong className="text-orange-600 font-bold font-mono">{successOrder.errorCode || 'عیب‌یابی عمومی'}</strong>
                  </div>
                  <div className="col-span-2 border-t border-slate-200/40 pt-2.5">
                    <span className="text-slate-400 block text-[9.5px]">موقعیت مأموریت و خدمت:</span>
                    <strong className="text-slate-850 font-bold">{successOrder.city}، {successOrder.region}، {successOrder.address}</strong>
                  </div>
                  <div className="col-span-2 border-t border-slate-200/40 pt-2.5">
                    <span className="text-slate-400 block text-[9.5px]">زمان برنامه‌ریزی‌شده حضور تکنسین:</span>
                    <span className="text-slate-850 font-bold font-semibold text-rose-600">{successOrder.date} (بازه {successOrder.timeSlot})</span>
                  </div>
                </div>
              </div>

              {/* Informative SMS block */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-2.5">
                <span className="bg-emerald-100 p-1.5 rounded-lg text-emerald-700 mt-0.5 shrink-0">
                  <Smartphone className="w-5 h-5 text-emerald-700" />
                </span>
                <div className="text-[11px] leading-relaxed text-slate-700">
                  <span className="font-extrabold text-emerald-800 block mb-0.5">سیستم پایش پیامکی خدمت:</span>
                  <span>پیامک تأیید نهایی ثبت درخواست و کد رهگیری برای شماره همراه <span className="font-bold underline">{successOrder.customerPhone}</span> ارسال گردید. هم‌اکنون این خدمت به کارتابل تکنسین‌های فعال در محدوده شما ارسال شد.</span>
                </div>
              </div>

              {/* Submit & Close */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSuccessOrder(null);
                    // Scroll to the online tracking progress section to show it immediately
                    setTimeout(() => {
                      const element = document.getElementById('tracking-section');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 100);
                  }}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl py-3 px-4 text-xs transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>امضای فاکتور و مشاهده زنده روند کارشناسی</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Brand-new inline gorgeous Modal for Admin Authentication, fully compatible with Sandboxed Iframes */}
      {isAdminLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs font-sans">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 text-right space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="flex items-center gap-1.5 font-black text-rose-600 text-sm">
                <Shield className="w-5 h-5 text-rose-600" />
                پورتال پشتیبانی فنی کدیار۲۴
              </span>
              <button 
                onClick={handleCancelAdminLogin}
                className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg transition-all cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">تاییدی امنیتی ورود ناظر ممیزی</p>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                به منظور تایید هویت ناظر محترم ارشد، لطفاً کلمه عبور مدیر ارشد سامانه را وارد فرمایید.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-800">کلمه عبور مدیر ارشد:</label>
              <input
                type="password"
                value={adminLoginPasswordInput}
                onChange={(e) => {
                  setAdminLoginPasswordInput(e.target.value);
                  setAdminLoginError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmitAdminLogin();
                }}
                className="w-full bg-white border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-rose-600 font-mono text-center text-sm font-extrabold tracking-widest text-slate-900"
                placeholder="••••••"
                autoFocus
              />
              {adminLoginError && (
                <p className="text-rose-600 text-[10px] font-extrabold">{adminLoginError}</p>
              )}
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={handleSubmitAdminLogin}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-center"
              >
                ورود به پورتال سازمانی
              </button>
              <button
                onClick={handleCancelAdminLogin}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-center"
              >
                انصراف و لغو
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal professional footer */}
      <footer className="bg-slate-900 text-white border-t border-slate-800 mt-12 py-8 px-4 font-sans rounded-t-3xl sm:rounded-t-[40px] shadow-2xl">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 grid grid-cols-1 md:grid-cols-4 gap-8 text-xs text-slate-400">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white">
              <Wrench className="w-5 h-5 text-blue-500" />
              <span className="font-bold text-sm">مجتمع دفاتر و خدمات فنی کدیار24</span>
            </div>
            <p className="leading-relaxed text-[11px]">
              مرجع تخصصی کدهای ارور، هماهنگی اعزام تکنسین، عیب‌یابی و تأمین قطعات اصلی لوازم خانگی با فاکتور رسمی و ضمانت کتبی.
            </p>
          </div>

          <div className="space-y-2 select-none">
            <span className="font-bold text-white text-xs block mb-1">حمایت کاربری و قوانین کدیار24</span>
            <p 
              onClick={() => triggerNotification('بیمه حوادث کدیار24', '🛡️ بیمه امنیت پلتفرم: این پوشش کارگاهی بر روی کلیه اقدامات متخصصین منصوبه پلتفرم دایر است و تا سقف مصوب اتحادیه تامین خسارت می‌کند.', 'success')}
              className="cursor-pointer hover:text-blue-400 hover:underline transition-all text-slate-300 font-medium text-[11px]"
            >
              • بیمه کامل خسارت‌های احتمالی ناشی از تعمیرات (مشاهده جزئیات)
            </p>
            <p 
              onClick={() => triggerNotification('تسویه رضایت مشتری', '💳 سیستم گروگذاری وجه: حق‌العمل تعمیرکار تنها پس از تایید نهایی کار با اخذ فیش چاپی و به صورت امن پایا تسویه می‌گردد.', 'info')}
              className="cursor-pointer hover:text-blue-400 hover:underline transition-all text-slate-300 font-medium text-[11px]"
            >
              • تسویه پس از اتمام کار با رمز رضایت شتابی (مشاهده جزئیات)
            </p>
            <p 
              onClick={() => triggerNotification('تعرفه مصوب اتحادیه', '⚖️ تعرفه خدمات: تمام نرخ‌های خدمات ثبت‌شده در سیستم مطابق با آخرین ضوابط اتحادیه تنظیم شده‌اند.', 'success')}
              className="cursor-pointer hover:text-blue-400 hover:underline transition-all text-slate-300 font-medium text-[11px]"
            >
              • کنترل قیمت‌ها بر اساس مصوبه رسمی اتحادیه (مشاهده جزئیات)
            </p>
          </div>

          <div className="space-y-2 text-right">
            <span className="font-bold text-white text-xs block mb-1 select-none">صفحات راهنما و تماس مجتمع</span>
            <ul className="space-y-1.5 text-[11px] list-none p-0 inline-block text-right">
              <li className="text-right font-sans">
                <button
                  type="button"
                  onClick={() => setOpenedInfoPage({
                    isOpen: true,
                    pageId: 'about',
                    title: 'درباره ما و معرفی مجتمع کدیار24'
                  })}
                  className="hover:text-blue-400 hover:underline transition-all text-slate-300 font-medium cursor-pointer block text-right"
                >
                  • درباره ما و معرفی مجتمع کدیار24
                </button>
              </li>
              <li className="text-right">
                <button
                  type="button"
                  onClick={() => setOpenedInfoPage({
                    isOpen: true,
                    pageId: 'contact',
                    title: 'تماس با ما و کانال‌های ارتباطی رسمی'
                  })}
                  className="hover:text-blue-400 hover:underline transition-all text-slate-300 font-medium cursor-pointer block text-right"
                >
                  • تماس با ما و فرم ارتباط مستقیم
                </button>
              </li>
              <li className="text-right">
                <button
                  type="button"
                  onClick={() => setOpenedInfoPage({
                    isOpen: true,
                    pageId: 'rules',
                    title: 'قوانین و مقررات فعالیت در کدیار24'
                  })}
                  className="hover:text-blue-400 hover:underline transition-all text-slate-300 font-medium cursor-pointer block text-right"
                >
                  • قوانین عمومی و ضوابط فعالیت متخصصین
                </button>
              </li>
              <li className="text-right">
                <button
                  type="button"
                  onClick={() => setOpenedInfoPage({
                    isOpen: true,
                    pageId: 'dispute',
                    title: 'راهنمای حل اختلاف و شکایت از فاکتور'
                  })}
                  className="hover:text-blue-400 hover:underline transition-all text-slate-300 font-medium cursor-pointer block text-right"
                >
                  • رسیدگی به شکایات، ممیزی و حل اختلاف صنفی
                </button>
              </li>
            </ul>
            <div className="pt-2 text-[9.5px] text-blue-400 font-bold select-none">تاریخ آپدیت رسمی دیتابیس ایران: خرداد ۱۴۰۵ • نسخه ۲.۰</div>
          </div>

          <div className="space-y-2.5">
            <span className="font-bold text-white text-xs block mb-1">مجوزها و نمادهای الکترونیکی</span>
            <div className="flex items-center gap-3 justify-start pt-1">
              {/* Badge 1 */}
              <a
                href={(trustBadges && typeof trustBadges === 'object' && !Array.isArray(trustBadges) && (trustBadges as any).badge1Link) || 'https://enamad.ir'}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-800 hover:bg-slate-750 transition-all border border-slate-700/60 p-2 rounded-xl flex items-center justify-center w-16 h-16 shadow-xs group cursor-pointer relative overflow-hidden"
                title="نماد اعتماد اول (ای‌نماد)"
              >
                {trustBadges && typeof trustBadges === 'object' && !Array.isArray(trustBadges) && (trustBadges as any).badge1Image ? (
                  <img
                    src={(trustBadges as any).badge1Image}
                    alt="نماد اعتماد اول"
                    className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[9px] text-slate-400 font-extrabold leading-tight select-none">
                    <Shield className="w-5 h-5 text-blue-500 mb-0.5" />
                    <span>ای‌نماد</span>
                  </div>
                )}
              </a>

              {/* Badge 2 */}
              <a
                href={(trustBadges && typeof trustBadges === 'object' && !Array.isArray(trustBadges) && (trustBadges as any).badge2Link) || 'https://samandehi.ir'}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-slate-800 hover:bg-slate-750 transition-all border border-slate-700/60 p-2 rounded-xl flex items-center justify-center w-16 h-16 shadow-xs group cursor-pointer relative overflow-hidden"
                title="نماد اعتماد دوم (ساماندهی)"
              >
                {trustBadges && typeof trustBadges === 'object' && !Array.isArray(trustBadges) && (trustBadges as any).badge2Image ? (
                  <img
                    src={(trustBadges as any).badge2Image}
                    alt="نماد اعتماد دوم"
                    className="w-full h-full object-contain filter grayscale group-hover:grayscale-0 transition-all"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-[9px] text-slate-400 font-extrabold leading-tight select-none">
                    <Shield className="w-5 h-5 text-indigo-500 mb-0.5" />
                    <span>ساماندهی</span>
                  </div>
                )}
              </a>
            </div>
          </div>
        </div>

        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 border-t border-slate-800/80 mt-6 pt-4 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 font-sans">
          <span>کپی‌رایت © ۲۰۲۶-۱۴۰۵ تمامی حقوق و مالکیت فناوری متعلق به کدیار24 دات آی‌آر است.</span>
          <span>توسعه یافته بر پایه استانداردهای وب ایران با کاربری آسان</span>
        </div>
      </footer>

      {/* Absolute Admin Floating Back-to-Admin-panel Button */}
      {isAdmin && currentRole !== 'admin' && (
        <div className="fixed bottom-6 left-6 z-50 group font-sans animate-bounce">
          <button
            onClick={() => {
              setCurrentRole('admin');
              setRoleSelection('admin');
              setSelectedError(null);
            }}
            className="bg-rose-650 hover:bg-rose-700 text-white font-black text-xs px-4 py-3 rounded-2xl shadow-xl transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-2 border border-rose-500"
            title="بازگشت فوری به پنل مدیریت"
          >
            <Laptop className="w-4 h-4 text-white" />
            <span>🔙 بازگشت به پنل مدیریت ارشد</span>
          </button>
        </div>
      )}

      <InfoPageModal
        isOpen={openedInfoPage.isOpen}
        pageId={openedInfoPage.pageId}
        title={openedInfoPage.title}
        onClose={() => setOpenedInfoPage({ isOpen: false, pageId: '', title: '' })}
        pageContents={pageContents}
        onSubmitFeedback={(newFeedback) => {
          const feedbackWithMeta = {
            ...newFeedback,
            id: `fb-${Date.now()}`,
            submittedAt: new Date().toLocaleDateString('fa-IR') + ' ' + new Date().toLocaleTimeString('fa-IR', {hour: '2-digit', minute:'2-digit'}),
            isRead: false
          };
          saveFeedbacksToStorage([feedbackWithMeta, ...userFeedbacks]);
          triggerNotification('ثبت موفقیت‌آمیز دیدگاه', 'پیام شما به صندوق نظرات ارسال شد و در صف ممیزی مدیریت قرار گرفت.', 'success');
        }}
      />

      {/* Floating Smart Backup & Rollback Widget */}
      {isAdmin && (
        <div className="fixed bottom-3 left-3 z-30 font-sans">
          <button
            onClick={() => setIsBackupManagerOpen(true)}
            className="bg-slate-900/95 hover:bg-slate-800 text-white font-extrabold text-[10px] px-3 py-2 rounded-xl shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-1.5 border border-slate-700/80 backdrop-blur-xs"
            title="سیستم پشتیبان‌گیری و بازیابی هوشمند"
          >
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>پشتیبان‌گیری دیتابیس</span>
          </button>
        </div>
      )}

      {/* Backup and Recovery Manager Modal */}
      {isAdmin && isBackupManagerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs font-sans text-right">
          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="flex items-center gap-2 font-black text-slate-800 text-sm">
                <Database className="w-5 h-5 text-blue-600" />
                مرکز پشتیبان‌گیری و بازگردانی دیتابیس کدیار۲۴ (کاملاً واقعی)
              </span>
              <button 
                onClick={() => setIsBackupManagerOpen(false)}
                className="text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 p-1.5 rounded-lg transition-all cursor-pointer text-xs font-bold"
              >
                ✕ بستن پنجره
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200/60 rounded-2xl p-4 text-[11px] leading-relaxed text-amber-900 font-sans font-medium">
              🛡️ <b>سیستم پشتیبان‌گیری چند لایه:</b> اکنون پلتفرم کدیار۲۴ از دو مکانیزم واقعی پشتیبان‌گیری پشتیبانی می‌کند. نسخه‌های <b>ابری سرور</b> مستقیماً در دیسک سرور مرکزی ذخیره شده و مستقل از مرورگر هستند. نسخه‌های <b>محلی مرورگر</b> جهت حفاظت سریع کلاینت عمل می‌کنند. برای هر دو لایه، دکمه‌های بازیابی زنده فعال و کاملاً واقعی هستند.
            </div>

            {/* Tab Toggles */}
            <div className="flex border-b border-slate-200">
              <button
                onClick={() => setActiveBackupTab('server')}
                className={`flex-1 py-2.5 text-center text-xs font-black border-b-2 transition-all cursor-pointer ${
                  activeBackupTab === 'server'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/20'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                ☁️ نسخه‌های ابری سرور مرکزی (واقعی و ایمن)
              </button>
              <button
                onClick={() => setActiveBackupTab('client')}
                className={`flex-1 py-2.5 text-center text-xs font-black border-b-2 transition-all cursor-pointer ${
                  activeBackupTab === 'client'
                    ? 'border-blue-600 text-blue-600 bg-blue-50/20'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                💻 نسخه‌های اضطراری کلاینت (محلی مرورگر)
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeBackupTab === 'server' ? (
                <button
                  type="button"
                  onClick={createServerBackup}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>☁️ ایجاد نسخه پشتیبان ابری روی سرور</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => createBackup(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <span>➕ ایجاد نسخه پشتیبان دستی محلی</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  try {
                    // Export the current database state directly!
                    const state = latestStateRef.current;
                    const databaseDump = {
                      orders: state.orders || [],
                      technicians: state.technicians || [],
                      errorCodes: state.errorCodes || [],
                      commonProblems: state.commonProblems || [],
                      spareParts: state.spareParts || [],
                      citiesList: state.citiesList || [],
                      brandsList: state.brandsList || [],
                      categoriesList: state.categoriesList || [],
                      modelsList: state.modelsList || [],
                      partPurchases: state.partPurchases || [],
                      notifications: state.notifications || []
                    };
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(databaseDump));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", `kodyar24_database_export_${Date.now()}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    triggerNotification('خروجی پشتیبان', 'فایل فیزیکی دیتابیس کدیار۲۴ با فرمت JSON با موفقیت دانلود شد.', 'success');
                  } catch (e) {
                    triggerNotification('خطای خروجی', 'امکان دانلود فایل پشتیبان مهیا نشد.', 'error');
                  }
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                title="دانلود نسخه فیزیکی دیتابیس فعلی سیستم"
              >
                <span>📥 استخراج کل دیتابیس (Export JSON)</span>
              </button>

              <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5">
                <span>📤 بازیابی مستقیم از فایل (Import JSON)</span>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const fileReader = new FileReader();
                    if (e.target.files && e.target.files[0]) {
                      fileReader.readAsText(e.target.files[0], "UTF-8");
                      fileReader.onload = async (event) => {
                        try {
                          const parsed = JSON.parse(event.target?.result as string);
                          if (parsed.orders || parsed.technicians || parsed.errorCodes) {
                            triggerCustomConfirm(
                              'بارگذاری دیتابیس',
                              'آیا مطمئن هستید که می‌خواهید کل پایگاه داده سرور کدیار۲۴ را با فایل آپلود شده رونویسی کنید؟ تمام اطلاعات قبلی پاک خواهند شد و این عمل غیرقابل بازگشت است.',
                              async () => {
                                await uploadAndRestoreDatabase(parsed);
                              }
                            );
                          } else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].data) {
                            try {
                              localStorage.setItem('ir_database_backups', JSON.stringify(parsed));
                              setBackupsList(parsed);
                              triggerNotification('بارگذاری موفق', 'لیست پشتیبان‌ها با موفقیت ایمپورت شد. اکنون می‌توانید هر کدام را بازیابی کنید.', 'success');
                            } catch (e: any) {
                              if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22) {
                                // Try to strip errorCodes from the imported list to fit inside quota
                                const stripped = parsed.map(b => {
                                  if (b.data && b.data.errorCodes) {
                                    const copy = { ...b, data: { ...b.data } };
                                    delete copy.data.errorCodes;
                                    copy.dataSizeKB = Math.round(JSON.stringify(copy.data).length / 1024);
                                    return copy;
                                  }
                                  return b;
                                }).slice(0, 3);
                                try {
                                  localStorage.setItem('ir_database_backups', JSON.stringify(stripped));
                                  setBackupsList(stripped);
                                  triggerNotification('بارگذاری موفق (فشرده)', 'پشتیبان‌ها به دلیل محدودیت فضا به صورت فشرده (بدون کدهای خطا) و محدود به ۳ نسخه ذخیره شدند.', 'warning');
                                } catch {
                                  triggerNotification('خطای فضای ذخیره‌سازی', 'فضای ذخیره‌سازی مرورگر شما پر است و امکان بارگذاری فایل وجود ندارد.', 'error');
                                }
                              } else {
                                throw e;
                              }
                            }
                          } else {
                            triggerNotification('فرمت نامعتبر', 'فرمت ساختاری فایل پشتیبان منطبق بر کدیار۲۴ نیست.', 'error');
                          }
                        } catch {
                          triggerNotification('خطای پارس فایل', 'محتوای فایل معتبر یا خوانا نیست.', 'error');
                        }
                      };
                    }
                  }}
                />
              </label>

              {activeBackupTab === 'client' && backupsList.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    triggerCustomConfirm(
                      'حذف کل بک‌آپ‌های مرورگر',
                      'آیا از حذف کامل تاریخچه کل نسخه‌های پشتیبان مرورگر اطمینان دارید؟ این عمل غیرقابل بازگشت است.',
                      () => {
                        localStorage.removeItem('ir_database_backups');
                        setBackupsList([]);
                        triggerNotification('پاکسازی نسخه‌ها', 'کل تاریخچه آرشیو پشتیبان مرورگر پاکسازی شد.', 'warning');
                      }
                    );
                  }}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 mr-auto"
                >
                  <span>🗑️ پاکسازی کل بک‌آپ‌های مرورگر</span>
                </button>
              )}
            </div>

            <div className="space-y-3.5">
              <span className="text-xs font-extrabold text-slate-800 block">
                📋 {activeBackupTab === 'server' ? 'لیست نسخه‌های پشتیبان ابری ذخیره شده روی سرور مرکزی:' : 'لیست نسخه‌های اضطراری ذخیره شده در حافظه مرورگر کلاینت:'}
              </span>
              
              {activeBackupTab === 'server' ? (
                isLoadingServerBackups ? (
                  <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-bold animate-pulse">
                    در حال بازیابی لیست فایل‌های پشتیبان واقعی سرور...
                  </div>
                ) : serverBackups.length === 0 ? (
                  <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-bold">
                    هنوز هیچ نسخه پشتیبان ابری روی هارد سرور ایجاد نشده است. روی دکمه سبز رنگ بالا کلیک کنید.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {serverBackups.map((backup: any) => (
                      <div 
                        key={backup.id}
                        className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all text-right"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-700">
                            <Database className="w-5 h-5" />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-slate-800">{backup.formattedDate}</span>
                              <span className="text-[8.5px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                                واقعی - دیسک سرور
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">({backup.dataSizeKB} KB)</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-bold leading-relaxed mt-1">
                              فایل سیستم: <span className="text-blue-600 font-mono select-all">{backup.fileName}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              triggerCustomConfirm(
                                'بازیابی بک‌آپ ابری سرور',
                                `آیا مطمئن هستید که می‌خواهید کل پایگاه داده سرور کدیار۲۴ را به نسخه پشتیبان «${backup.formattedDate}» بازگردانی (Restore) کنید؟ این عملیات تمام تغییرات اخیر را رونویسی می‌کند.`,
                                () => {
                                  restoreServerBackup(backup.fileName);
                                }
                              );
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                          >
                            <span>🔄 بازگردانی واقعی (Restore)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              triggerCustomConfirm(
                                'حذف بک‌آپ ابری',
                                'آیا از حذف این نسخه پشتیبان ابری از روی سرور اطمینان دارید؟ این فایل برای همیشه از دیسک پاک خواهد شد.',
                                () => {
                                  deleteServerBackup(backup.fileName);
                                }
                              );
                            }}
                            className="text-rose-600 hover:bg-rose-50 border border-slate-200 px-2 py-2 rounded-xl text-xs cursor-pointer"
                            title="حذف دائمی از روی دیسک"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : backupsList.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs font-bold">
                  هنوز هیچ نسخه پشتیبان مرورگر ثبت نشده است.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                  {backupsList.map((backup: any) => (
                    <div 
                      key={backup.id}
                      className="bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all text-right"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          backup.isAuto ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          <Database className="w-5 h-5" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black text-slate-800">{backup.formattedDate}</span>
                            <span className={`text-[8.5px] font-extrabold px-2 py-0.5 rounded-md ${
                              backup.isAuto ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {backup.isAuto ? 'خودکار کلاینت' : 'ممیزی دستی'}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono">({backup.dataSizeKB} KB)</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold leading-relaxed mt-1">
                            موجودیت‌ها: {Object.keys(backup.data || {}).map(k => {
                              if (k === 'orders') return `${backup.data[k]?.length || 0} سفارش`;
                              if (k === 'technicians') return `${backup.data[k]?.length || 0} تکنسین`;
                              if (k === 'errorCodes') return `${backup.data[k]?.length || 0} کد ارور`;
                              if (k === 'commonProblems') return `${backup.data[k]?.length || 0} مشکل متداول`;
                              return null;
                            }).filter(Boolean).join(' • ')}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            triggerCustomConfirm(
                              'بازیابی بک‌آپ محلی مرورگر',
                              `آیا مطمئن هستید که می‌خواهید کل داده‌های کدیار۲۴ را به تاریخ «${backup.formattedDate}» بازیابی کنید؟`,
                              () => {
                                rollbackToBackup(backup.id);
                              }
                            );
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black px-3.5 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <span>🔄 واگردانی محلی (Rollback)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const filtered = backupsList.filter(b => b.id !== backup.id);
                            localStorage.setItem('ir_database_backups', JSON.stringify(filtered));
                            setBackupsList(filtered);
                            triggerNotification('حذف نسخه پشتیبان', 'نسخه مورد نظر با موفقیت حذف شد.', 'info');
                          }}
                          className="text-rose-600 hover:bg-rose-50 border border-slate-200 px-2 py-2 rounded-xl text-xs cursor-pointer"
                          title="حذف این نسخه"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      </div> {/* Closing Boxed Content Frame */}

      {/* Floating Dynamic Toasts Panel */}
      <div className="fixed top-5 left-5 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {activeToasts.map((toast) => {
            let bgColor = 'bg-slate-900 border-slate-700 text-white';
            let iconElement = null;
            if (toast.type === 'success') {
              bgColor = 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20';
              iconElement = <span className="text-lg">✓</span>;
            } else if (toast.type === 'error') {
              bgColor = 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/20';
              iconElement = <span className="text-lg">⚠️</span>;
            } else if (toast.type === 'warning') {
              bgColor = 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/15';
              iconElement = <span className="text-lg">🔥</span>;
            } else if (toast.type === 'sms') {
              bgColor = 'bg-sky-600 border-sky-500 text-white shadow-lg shadow-sky-600/20';
              iconElement = <span className="text-lg">📨</span>;
            }

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20, scale: 0.9, x: -20 }}
                animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.85, x: -30, transition: { duration: 0.2 } }}
                className={`p-4 rounded-2xl shadow-xl border backdrop-blur-xs flex items-start gap-3 pointer-events-auto text-right font-sans ${bgColor}`}
                style={{ direction: 'rtl' }}
              >
                <div className="flex-shrink-0 mt-0.5">{iconElement}</div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-[12px]">{toast.title}</h4>
                  <p className="text-[11px] opacity-90 leading-relaxed mt-0.5">{toast.text}</p>
                </div>
                <button
                  onClick={() => setActiveToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-current opacity-60 hover:opacity-100 cursor-pointer hover:bg-black/10 p-1 rounded-lg self-start"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 🔮 CUSTOM SECURE DIALOG OVERLAY (IFRAME PROOF) */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans text-right" style={{ direction: 'rtl' }}>
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Database className="w-5 h-5 animate-bounce" />
              </div>
              <div className="space-y-0.5">
                <h4 className="font-extrabold text-xs text-slate-900">{confirmDialog.title}</h4>
                <p className="text-[9px] text-slate-400">سامانه تایید چند مرحله‌ای کدیار۲۴</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-bold">
              {confirmDialog.message}
            </p>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-extrabold transition-all cursor-pointer shadow-md text-center"
              >
                بله، اطمینان دارم
              </button>
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl py-2.5 text-xs font-extrabold transition-all cursor-pointer text-center"
              >
                انصراف و لغو
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
