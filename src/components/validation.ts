import { ErrorCode } from '../types';

/**
 * Persian/Arabic to English digit mapper
 */
export const toEnglishNumber = (str: string): string => {
  const farsiDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
  const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
  let workingStr = String(str);
  for (let i = 0; i < 10; i++) {
    workingStr = workingStr.replace(farsiDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
  }
  return workingStr;
};

/**
 * Filter out non-digit characters from the phone input during keystroke typing
 */
export const sanitizePhoneInput = (val: string): string => {
  const engVal = toEnglishNumber(val);
  return engVal.replace(/[^\d]/g, '').slice(0, 11);
};

/**
 * Strict Iranian mobile number validator
 * Must be exactly 11 digits, starts with 09 (or equivalent in Persian numbers)
 */
export const validateIranianMobile = (phone: string): { isValid: boolean; error?: string } => {
  const engPhone = toEnglishNumber(phone).trim();
  
  if (/[^\d]/.test(engPhone)) {
    return {
      isValid: false,
      error: 'شماره موبایل نامعتبر است. لطفاً فقط عدد وارد کنید.'
    };
  }

  if (engPhone.length === 0) {
    return {
      isValid: false,
      error: 'وارد کردن شماره موبایل الزامی است.'
    };
  }

  if (!engPhone.startsWith('09')) {
    return {
      isValid: false,
      error: 'شماره همراه معتبر نیست. شماره موبایل ایران باید با 09 آغاز گردد (مانند 09123456789).'
    };
  }

  if (engPhone.length !== 11) {
    return {
      isValid: false,
      error: `شماره موبایل نامعتبر است. طول شماره باید دقیقاً ۱۱ رقم باشد (در حال حاضر ${engPhone.length} رقم است).`
    };
  }

  return { isValid: true };
};

/**
 * URL validator
 * Only allows valid http/https URLs or empty string if optional
 */
export const validateUrl = (url: string, isOptional = true): { isValid: boolean; error?: string } => {
  const trimmedUrl = (url || '').trim();
  if (!trimmedUrl) {
    if (isOptional) {
      return { isValid: true };
    }
    return { isValid: false, error: 'وارد کردن نشانی اینترنتی (لینک) الزامی است.' };
  }

  try {
    const parsed = new URL(trimmedUrl);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      // Check if it has a host/domain like "example.com"
      if (!parsed.hostname || !parsed.hostname.includes('.')) {
        return { isValid: false, error: 'فرمت پیوند اینترنتی نامعتبر است. نمونه صحیح: https://example.com/image.jpg' };
      }
      return { isValid: true };
    }
    return { isValid: false, error: 'پیوند اینترنتی مجاز نیست. پیوند باید با پروتکل امن http یا https آغاز شود.' };
  } catch (e) {
    return { isValid: false, error: 'فرمت پیوند اینترنتی نامعتبر است. نمونه صحیح: https://example.com/image.jpg' };
  }
};

/**
 * Harmonizes/normalizes an ErrorCode object to guarantee a 100% unified, consistent schema.
 * Matches both traditional and new field definitions in a strict format and order.
 */
export function harmonizeErrorCode(raw: Partial<ErrorCode>): ErrorCode {
  const now = new Date().toISOString();
  
  // Clean string helper
  const cleanStr = (s: any): string => {
    if (s === undefined || s === null) return '';
    return String(s)
      .trim()
      .replace(/[يى]/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/\s+/g, ' ');
  };

  const code = cleanStr(raw.code || raw.error_code);
  const category = cleanStr(raw.category || raw.device_type || 'عمومی');
  const brand = cleanStr(raw.brand || 'عمومی');
  const rawModel = cleanStr(raw.model);
  const model = (!rawModel || ['عمومی', 'عمومي', 'کل مدل‌ها', 'کل مدلها', 'كل مدلها', 'همه', 'همه مدل‌ها', 'همه مدل ها', 'general'].includes(rawModel.toLowerCase()))
    ? 'عمومی'
    : rawModel;

  const title = cleanStr(raw.title || raw.error_title || `خطای ${code || 'نامشخص'}`);
  const description = cleanStr(raw.description || raw.error_title || title || 'بررسی وضعیت فنی دستگاه');

  // Causes handling
  let causes: string[] = [];
  if (Array.isArray(raw.causes)) {
    causes = raw.causes.map(cleanStr).filter(Boolean);
  } else if (typeof raw.causes === 'string' && raw.causes) {
    causes = (raw.causes as string).split(/[;\n|]/).map(cleanStr).filter(Boolean);
  }
  if (causes.length === 0) {
    causes = [description || 'علت فنی ثبت نشده است'];
  }

  // Steps / Solutions handling
  let steps: string[] = [];
  const rawSteps = raw.steps || raw.solutions;
  if (Array.isArray(rawSteps)) {
    steps = rawSteps.map(cleanStr).filter(Boolean);
  } else if (typeof rawSteps === 'string' && rawSteps) {
    steps = (rawSteps as string).split(/[;\n|]/).map(cleanStr).filter(Boolean);
  }
  if (steps.length === 0) {
    steps = ['مراجعه به تکنسین مجاز تعمیرات کدیار۲۴'];
  }

  // Precautions
  let precautions: string[] = [];
  if (Array.isArray(raw.precautions)) {
    precautions = raw.precautions.map(cleanStr).filter(Boolean);
  } else if (typeof raw.precautions === 'string' && raw.precautions) {
    precautions = (raw.precautions as string).split(/[;\n|]/).map(cleanStr).filter(Boolean);
  }
  if (precautions.length === 0) {
    precautions = ['قبل از شروع به کار، دوشاخه برق دستگاه را از پریز بکشید.'];
  }

  // Hazard level
  const hazardLevel = (raw.hazardLevel && ['low', 'medium', 'high', 'critical'].includes(raw.hazardLevel))
    ? raw.hazardLevel as 'low' | 'medium' | 'high' | 'critical'
    : 'medium';

  // Hazard description
  const hazardDescription = cleanStr(raw.hazardDescription) || (
    hazardLevel === 'low' ? 'خطر خاصی وجود ندارد.' :
    hazardLevel === 'medium' ? 'نیاز به احتیاط: حتماً نکات ایمنی پایه را رعایت کنید.' :
    hazardLevel === 'high' ? 'خطر بالا: حتماً جریان اصلی گاز یا برق را قطع نمایید.' :
    'بحرانی: خطر انفجار، گازگرفتگی شدید یا برق‌گرفتگی مرگبار. کار باید توسط تکنسین متخصص انجام شود.'
  );

  // Tools needed
  let toolsNeeded: string[] = [];
  if (Array.isArray(raw.toolsNeeded)) {
    toolsNeeded = raw.toolsNeeded.map(cleanStr).filter(Boolean);
  } else if (typeof raw.toolsNeeded === 'string' && raw.toolsNeeded) {
    toolsNeeded = (raw.toolsNeeded as string).split(/[،,;\n|]/).map(cleanStr).filter(Boolean);
  }

  // Related parts
  const relatedParts = Array.isArray(raw.relatedParts) ? raw.relatedParts.map(cleanStr).filter(Boolean) : [];

  // Compatible models
  let compatible_models: string[] = [];
  if (Array.isArray(raw.compatible_models)) {
    compatible_models = raw.compatible_models.map(cleanStr).filter(Boolean);
  } else if (model) {
    compatible_models = [model];
  }

  // Technician required (auto-calculated if not explicitly provided)
  const technician_required = typeof raw.technician_required === 'boolean'
    ? raw.technician_required
    : (hazardLevel === 'high' || hazardLevel === 'critical' || steps.some(s => s.toLowerCase().includes('تکنسین') || s.includes('سرویس‌کار') || s.includes('تعمیرکار')));

  const id = raw.id || `err_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return {
    id,
    code,
    error_code: code,
    category,
    device_type: category,
    brand,
    model,
    compatible_models,
    title,
    error_title: title,
    description,
    causes,
    steps,
    solutions: steps,
    precautions,
    hazardLevel,
    hazardDescription,
    toolsNeeded,
    relatedParts,
    views: Number(raw.views || 0),
    updatedBy: cleanStr(raw.updatedBy || 'سیستم'),
    isApproved: typeof raw.isApproved === 'boolean' ? raw.isApproved : false,
    isVirtual: typeof raw.isVirtual === 'boolean' ? raw.isVirtual : false,
    isCommonProblem: typeof raw.isCommonProblem === 'boolean' ? raw.isCommonProblem : false,
    tags: Array.isArray(raw.tags) ? raw.tags.map(cleanStr).filter(Boolean) : [],
    ai_analysis: cleanStr(raw.ai_analysis || ''),
    technician_required,
    created_at: raw.created_at || now,
    video_url: cleanStr(raw.video_url || '')
  };
}

