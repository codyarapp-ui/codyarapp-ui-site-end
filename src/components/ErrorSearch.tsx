/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { ErrorCode, SparePart, CommonProblem } from '../types';
import { Search, Flame, ShieldAlert, CheckCircle, Eye, Wrench, AlertTriangle, Cpu, Tag, Settings, Play, Check, ChevronLeft, Mic, MicOff, Video, ExternalLink, X, ShoppingBag, CreditCard, ShieldCheck, FileText, Download, Printer, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { APPLIANCE_BRANDS, APPLIANCE_CATEGORIES } from '../data';
import { TechDocsPanel } from '../modules/techDocs/TechDocsPanel';
import { sanitizePhoneInput, validateIranianMobile } from './validation';

const brandAliases: { [key: string]: string[] } = {
  'butan': ['بوتان', 'بتاح', 'بوتن', 'کالدا', 'ونزیا', 'اپتیما', 'بنر'],
  'bosch': ['بوش', 'بش'],
  'baxi': ['باکسی', 'بکسی'],
  'beko': ['بکو', 'بکوچ', 'بکوج'],
  'arcelik': ['آرچلیک', 'ارچلیک', 'ارچیلک'],
  'immergas': ['ایمرگاس', 'ایمرگاز', 'ایمرگس'],
  'isatis': ['ایساتیس', 'ایستیس', 'ایساتس'],
  'italterm': ['ایتالترم', 'ایتال ترم'],
  'iranradiator': ['ایران رادیاتور', 'ایران‌رادیاتور', 'ایران رادیاتور لورچ', 'ل کارز', 'ایران رادیاتر', 'ایرانرادیاتور', 'رادیاتور'],
  'iranradiater': ['ایران رادیاتور', 'ایران‌رادیاتور', 'ایران رادیاتر', 'ایرانرادیاتور', 'رادیاتور'],
  'demrad': ['دمیراد', 'دم راد'],
  'tachi': ['تاچی', 'تاچ'],
  'polar': ['پلار', 'بلار'],
  'biasi': ['بیاسی'],
  'valtro': ['والترو', 'والتر'],
  'alzan': ['آلزان', 'الزان'],
  'ariston': ['آریستون', 'اریستون'],
  'baykan': ['بایکن', 'بایکان'],
  'butane': ['بوتان'],
  'westel': ['وستل'],
  'gplus': ['جی پلاس', 'جی‌پلاس'],
  'samsung': ['سامسونگ'],
  'lg': ['ال جی', 'الجی', 'ال‌جی'],
  'daewoo': ['دوو'],
};

const normalizePersianArabic = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\u064A\u06CC]/g, 'ی') // Arabic Yeh and Persian Yeh -> Persian Yeh
    .replace(/[\u0643\u06A9]/g, 'ک') // Arabic Kaf and Persian Keheh -> Persian Keheh
    .trim();
};

const normalizeTextForSearch = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[\u064A\u06CC]/g, 'ی')
    .replace(/[\u0643\u06A9]/g, 'ک')
    .replace(/[-\s_.\u200c]/g, '') // Remove spaces, ZWNJ, hyphens, underscores, dots
    .trim();
};

const categoryAliases: { [key: string]: string[] } = {
  'پکیج': ['پکیج', 'پیج', 'پکیجها', 'پکیجهای', 'گرمایشی', 'شوفاژ', 'پکیج_دیواری', 'دیواری'],
  'کولر گازی': ['کولر', 'کولرگازی', 'کولر گازی', 'کولرها', 'اسپلیت', 'اسپیلت', 'کولر_گازی', 'کولرگری', 'گری'],
  'لباسشویی': ['لباسشویی', 'ماشین لباسشویی', 'لباس شویی'],
  'یخچال': ['یخچال', 'فریزر', 'یخچال فریزر', 'ساید'],
};

const matchesToken = (fieldValue: string, token: string): boolean => {
  const fLower = fieldValue.toLowerCase().trim();
  const tLower = token.toLowerCase().trim();
  
  if (!fLower || !tLower) return false;

  const fNorm = normalizePersianArabic(fieldValue);
  const tNorm = normalizePersianArabic(token);

  // 1. Direct contains check on standard normalized forms
  if (fNorm.includes(tNorm) || tNorm.includes(fNorm)) {
    return true;
  }

  // 1b. Check without spaces / hyphens to handle compound words (like "کولرگازی" vs "کولر گازی")
  const fSearchNorm = normalizeTextForSearch(fieldValue);
  const tSearchNorm = normalizeTextForSearch(token);
  if (fSearchNorm.includes(tSearchNorm) || tSearchNorm.includes(fSearchNorm)) {
    return true;
  }

  // 2. Brand alias lookup
  for (const [english, persianList] of Object.entries(brandAliases)) {
    const fNormMatchesBrand = fNorm.includes(english) || english.includes(fNorm);
    const tokenMatchesPersian = persianList.some(p => {
      const pNorm = normalizePersianArabic(p);
      return tNorm.includes(pNorm) || pNorm.includes(tNorm) || 
             normalizeTextForSearch(token).includes(normalizeTextForSearch(p)) ||
             normalizeTextForSearch(p).includes(normalizeTextForSearch(token));
    });
    
    if (fNormMatchesBrand && tokenMatchesPersian) {
      return true;
    }
    
    const fieldMatchesPersian = persianList.some(p => {
      const pNorm = normalizePersianArabic(p);
      return fNorm.includes(pNorm) || pNorm.includes(fNorm) ||
             normalizeTextForSearch(fieldValue).includes(normalizeTextForSearch(p)) ||
             normalizeTextForSearch(p).includes(normalizeTextForSearch(fieldValue));
    });
    const tokenMatchesBrand = tNorm.includes(english) || english.includes(tNorm);
    
    if (fieldMatchesPersian && tokenMatchesBrand) {
      return true;
    }
  }

  // 3. Category alias lookup
  for (const [canonical, aliases] of Object.entries(categoryAliases)) {
    const cNorm = normalizePersianArabic(canonical);
    const fNormMatchesCanonical = fNorm.includes(cNorm) || cNorm.includes(fNorm) ||
                                  normalizeTextForSearch(fieldValue).includes(normalizeTextForSearch(canonical)) ||
                                  normalizeTextForSearch(canonical).includes(normalizeTextForSearch(fieldValue));
    
    const tokenMatchesAlias = aliases.some(a => {
      const aNorm = normalizePersianArabic(a);
      return tNorm.includes(aNorm) || aNorm.includes(tNorm) ||
             normalizeTextForSearch(token).includes(normalizeTextForSearch(a)) ||
             normalizeTextForSearch(a).includes(normalizeTextForSearch(token));
    });
    
    if (fNormMatchesCanonical && tokenMatchesAlias) {
      return true;
    }

    const fieldMatchesAlias = aliases.some(a => {
      const aNorm = normalizePersianArabic(a);
      return fNorm.includes(aNorm) || aNorm.includes(fNorm) ||
             normalizeTextForSearch(fieldValue).includes(normalizeTextForSearch(a)) ||
             normalizeTextForSearch(a).includes(normalizeTextForSearch(fieldValue));
    });
    const tokenMatchesCanonical = tNorm.includes(cNorm) || cNorm.includes(tNorm) ||
                                  normalizeTextForSearch(token).includes(normalizeTextForSearch(canonical)) ||
                                  normalizeTextForSearch(canonical).includes(normalizeTextForSearch(token));

    if (fieldMatchesAlias && tokenMatchesCanonical) {
      return true;
    }
  }

  return false;
};

const normalizeCode = (code: string): string => {
  return code.toLowerCase().trim().replace(/[-_\s.]/g, '');
};

const isErrorCodeToken = (token: string): boolean => {
  const normalized = normalizeCode(token);
  return /^[a-z]{1,3}\d+$/i.test(normalized) || /^\d+$/i.test(normalized);
};

const matchesTokenPrecise = (fieldValue: string, token: string, isCodeField: boolean): boolean => {
  const fLower = fieldValue.toLowerCase().trim();
  const tLower = token.toLowerCase().trim();
  
  if (!fLower || !tLower) return false;

  // 1. If it's the exact 'code' field of an ErrorCode, we want exact match of normalized codes
  if (isCodeField) {
    return normalizeCode(fieldValue) === normalizeCode(token);
  }

  // 2. If the token looks like an error code (e.g. "E1", "F01", "12"), we must match it as an exact word,
  // preventing "E1" from matching inside "E11" or "E01".
  if (isErrorCodeToken(token)) {
    const tNorm = normalizeCode(token);
    
    // Exact word boundary check for alphanumeric tokens
    let index = fLower.indexOf(tNorm);
    if (index === -1) {
      index = fLower.indexOf(tLower);
    }
    
    while (index !== -1) {
      const matchLength = fLower.substring(index).startsWith(tLower) ? tLower.length : tNorm.length;
      const prevChar = index > 0 ? fLower.charAt(index - 1) : '';
      const nextChar = index + matchLength < fLower.length ? fLower.charAt(index + matchLength) : '';
      
      const isAlphaNum = (char: string) => /^[a-z0-9.\-_]$/i.test(char);
      
      if (!isAlphaNum(prevChar) && !isAlphaNum(nextChar)) {
        return true;
      }
      
      index = fLower.indexOf(tNorm, index + 1);
    }
    return false;
  }

  // 3. Fallback to general matchesToken alias lookup / partial contains
  return matchesToken(fieldValue, token);
};

interface ErrorSearchProps {
  errorCodes: ErrorCode[];
  commonProblems?: CommonProblem[];
  spareParts: SparePart[];
  onSelectError: (error: ErrorCode) => void;
  selectedError: ErrorCode | null;
  onBookRepair: (error: ErrorCode) => void;
  onFilterParts: (category: string, brand: string) => void;
  onSearchActiveChange?: (active: boolean) => void;
  currentUser?: any;
  onGoToDashboard?: () => void;
  onPurchase?: (part: SparePart, address: string, buyerName?: string, buyerPhone?: string, cardHolder?: string, trackNumber?: string) => void;
  triggerNotification?: (title: string, text: string, type: 'success' | 'warning' | 'info' | 'error') => void;
  affiliateProducts?: any[];
  categoryConfig?: any;
  technicians?: any[];
}

export const ErrorSearch: React.FC<ErrorSearchProps> = ({
  errorCodes = [],
  commonProblems = [],
  spareParts = [],
  onSelectError: originalOnSelectError,
  selectedError,
  onBookRepair,
  onFilterParts,
  onSearchActiveChange,
  currentUser,
  onGoToDashboard,
  onPurchase,
  triggerNotification,
  affiliateProducts = [],
  categoryConfig = {},
  technicians = [],
}) => {
  const isPremium = currentUser?.subscription?.is_premium || currentUser?.role === 'admin' || currentUser?.is_super_admin;

  const [viewedErrorCodes, setViewedErrorCodes] = React.useState<string[]>([]);
  const [viewedProblems, setViewedProblems] = React.useState<string[]>([]);

  const [showFreeLimitModal, setShowFreeLimitModal] = React.useState(false);
  const [freeLimitReachedType, setFreeLimitReachedType] = React.useState<'error_code' | 'common_problem'>('error_code');
  const [viewingTechCard, setViewingTechCard] = React.useState<any | null>(null);
  const [copiedTechId, setCopiedTechId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchFreeViews = async () => {
      try {
        const response = await fetch('/api/free-views');
        if (response.ok) {
          const data = await response.json();
          if (data.viewedErrorCodes) setViewedErrorCodes(data.viewedErrorCodes);
          if (data.viewedProblems) setViewedProblems(data.viewedProblems);
        }
      } catch (err) {
        console.warn('Failed to load free views from server:', err);
      }
    };
    fetchFreeViews();
  }, []);

  React.useEffect(() => {
    if (isPremium) {
      localStorage.setItem('had_premium_active', 'true');
    } else {
      const hadPremium = localStorage.getItem('had_premium_active') === 'true';
      if (hadPremium) {
        setViewedErrorCodes([]);
        setViewedProblems([]);
        localStorage.setItem('had_premium_active', 'false');
      }
    }
  }, [isPremium]);

  const onSelectError = (err: ErrorCode) => {
    if (!err) {
      originalOnSelectError(null as any);
      return;
    }

    if (isPremium) {
      originalOnSelectError(err);
      return;
    }

    const isAlreadyViewed = viewedErrorCodes.includes(err.id);
    if (!isAlreadyViewed) {
      if (viewedErrorCodes.length >= 1) {
        setFreeLimitReachedType('error_code');
        setShowFreeLimitModal(true);
        return;
      } else {
        const updated = [...viewedErrorCodes, err.id];
        setViewedErrorCodes(updated);
        fetch('/api/free-views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'error_code', id: err.id })
        }).catch(err => console.error(err));
      }
    }
    originalOnSelectError(err);
  };

  // Core interactive states
  const [query, setQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedBrand, setSelectedBrand] = React.useState('');
  const [selectedModel, setSelectedModel] = React.useState('');
  const [categoryInput, setCategoryInput] = React.useState('');
  const [brandInput, setBrandInput] = React.useState('');
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [showModelSuggestions, setShowModelSuggestions] = React.useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = React.useState(false);
  const [showBrandDropdown, setShowBrandDropdown] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [showAllCodes, setShowAllCodes] = React.useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = React.useState<string | null>(null);
  const [showPremiumAlert, setShowPremiumAlert] = React.useState<'none' | 'login' | 'premium'>('none');

  // Search Type filter state (Error Code, Common Problem, Datasheet, Diagram)
  const [searchType, setSearchType] = React.useState<'error_code' | 'common_problem' | 'datasheet' | 'diagram'>('error_code');

  // Document viewer and upgrade states for search results
  const [activeViewerDoc, setActiveViewerDoc] = React.useState<any | null>(null);
  const [zoom, setZoom] = React.useState<number>(1);
  const [rotation, setRotation] = React.useState<number>(0);
  const [showUpgradeModal, setShowUpgradeModal] = React.useState<boolean>(false);
  const [selectedDocForUpgrade, setSelectedDocForUpgrade] = React.useState<any | null>(null);

  // Real technical documents loaded from the server (instead of mock/simulated generators)
  const [realTechDocs, setRealTechDocs] = React.useState<any[]>([]);
  const [loadingRealTechDocs, setLoadingRealTechDocs] = React.useState(false);

  React.useEffect(() => {
    const fetchRealTechDocs = async () => {
      setLoadingRealTechDocs(true);
      try {
        const res = await fetch('/api/tech-docs/all');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setRealTechDocs(data.docs || []);
          }
        }
      } catch (err) {
        console.warn('Failed to load real technical documents:', err);
      } finally {
        setLoadingRealTechDocs(false);
      }
    };
    
    // Fetch only when the user is looking for datasheets or diagrams to optimize performance
    if (searchType === 'datasheet' || searchType === 'diagram') {
      fetchRealTechDocs();
    }
  }, [searchType]);

  // Technical Document logic for a specific error code / device using only real uploaded documents
  const getTechDocsForErrorCode = (err: ErrorCode) => {
    return realTechDocs.filter(doc => doc.device && doc.device.id === err.id);
  };

  // Handle preview, download, and printing of technical documents in search results
  const handleDocAction = (doc: any, action: 'view' | 'download' | 'print') => {
    const isPremiumDoc = ['Service Manual', 'Wiring Diagram', 'Schematic', 'PCB Layout', 'Exploded View'].includes(doc.type);

    if (isPremiumDoc && !isPremium) {
      setSelectedDocForUpgrade(doc);
      setShowUpgradeModal(true);
      if (triggerNotification) {
        triggerNotification('مدرک فنی ویژه', 'دسترسی به نقشه‌ها و کتابچه‌های تخصصی نیاز به اشتراک ویژه دارد.', 'warning');
      }
      return;
    }

    if (action === 'view') {
      if (triggerNotification) {
        triggerNotification('پیش‌نمایش سند', `در حال آماده‌سازی سند آنلاین: ${doc.title}`, 'info');
      }
      setZoom(1);
      setRotation(0);
      setActiveViewerDoc(doc);
    } else if (action === 'download') {
      if (triggerNotification) {
        triggerNotification('دانلود فایل فنی', `فایل ${doc.title} در صف دانلود فیزیکی مرورگر شما قرار گرفت.`, 'success');
      }
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.setAttribute('download', doc.title);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (action === 'print') {
      if (triggerNotification) {
        triggerNotification('آماده‌سازی چاپ', `در حال باز کردن سند ${doc.title} در ابزار چاپگر...`, 'info');
      }
      const win = window.open(doc.fileUrl, '_blank');
      if (win) {
        win.focus();
        win.print();
      } else {
        window.open(doc.fileUrl, '_blank');
      }
    }
  };

  // Checkout States for bottom products list
  const [activeCheckoutPartOfBottom, setActiveCheckoutPartOfBottom] = React.useState<SparePart | null>(null);
  const [bottomCheckoutStep, setBottomCheckoutStep] = React.useState<'form' | 'success'>('form');
  const [bottomBuyerName, setBottomBuyerName] = React.useState('');
  const [bottomBuyerPhone, setBottomBuyerPhone] = React.useState('');
  const [bottomBuyerAddress, setBottomBuyerAddress] = React.useState('');
  const [bottomCardNumber, setBottomCardNumber] = React.useState('');

  // Keep typeable inputs in sync with actual selected values
  React.useEffect(() => {
    setCategoryInput(selectedCategory);
  }, [selectedCategory]);

  React.useEffect(() => {
    setBrandInput(selectedBrand);
  }, [selectedBrand]);

  React.useEffect(() => {
    if (onSearchActiveChange) {
      onSearchActiveChange(!!selectedError);
    }
  }, [selectedError, onSearchActiveChange]);

  // Click outside to close custom dropdown panels cleanly
  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const mainSearchCont = document.getElementById('main-search-container');
      const catCont = document.getElementById('category-dropdown-container');
      const brandCont = document.getElementById('brand-dropdown-container');
      const modelCont = document.getElementById('model-dropdown-container');

      if (mainSearchCont && !mainSearchCont.contains(target)) {
        setShowSuggestions(false);
      }
      if (catCont && !catCont.contains(target)) {
        setShowCategoryDropdown(false);
      }
      if (brandCont && !brandCont.contains(target)) {
        setShowBrandDropdown(false);
      }
      if (modelCont && !modelCont.contains(target)) {
        setShowModelSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Dynamic base lists loaded from localStorage/data fallback
  const brands = React.useMemo(() => {
    const saved = localStorage.getItem('ir_brands');
    return saved ? (JSON.parse(saved) as string[]) : [];
  }, []);

  const categories = React.useMemo(() => {
    const saved = localStorage.getItem('ir_categories');
    return saved ? (JSON.parse(saved) as string[]) : [];
  }, []);

  // AI Interactive states
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiResult, setAiResult] = React.useState<{
    recommendedPartIds: string[];
    aiReason: string;
    additionalFittings?: string[];
  } | null>(null);
  const [aiError, setAiError] = React.useState('');

  const [aiDiagnoseResult, setAiDiagnoseResult] = React.useState<{
    causes: string[];
    likely_part: string;
    risk_level: string;
    diy_possible: string;
    repair_time: string;
    technician_required: boolean;
    detailed_analysis: string;
  } | null>(null);
  const [aiDiagnoseLoading, setAiDiagnoseLoading] = React.useState(false);
  const [aiDiagnoseError, setAiDiagnoseError] = React.useState('');

  // Quick buttons
  const quickCodes = ['E01', 'E02', '70 80', 'E51', 'IE', 'OE', '5E'];

  // Voice Search Handler
  const handleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('مرورگر شما از جستجوی صوتی پشتیبانی نمی‌کند. لطفاً از گوگل کروم یا فایرفاکس استفاده کنید.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'fa-IR';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      // Clean query and set it
      setQuery(transcript);
      setShowSuggestions(true);
      if (selectedError) onSelectError(null as any);
      
      // Reset filters to search globally across all categories, brands, and models
      setSelectedCategory('');
      setSelectedBrand('');
      setSelectedModel('');
      setCategoryInput('');
      setBrandInput('');
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      if (isListening) {
        recognition.stop();
        setIsListening(false);
      } else {
        recognition.start();
      }
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // Fetch AI suggestion when an error is clicked or re-analyzed
  const handleAiAnalysis = async (err: ErrorCode) => {
    if (!err) return;
    setAiLoading(true);
    setAiError('');
    setAiResult(null);

    try {
      const response = await fetch('/api/gemini/suggest-parts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorCode: err,
          availableParts: spareParts
        })
      });

      if (!response.ok) {
        throw new Error('سرویس هوش مصنوعی موقتاً در دسترس نیست یا خطایی رخ داده است.');
      }

      const data = await response.json();
      setAiResult(data);
    } catch (e: any) {
      console.error(e);
      setAiError(e.message || 'خطا در اتصال به موتور تحلیل هوشمند');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiDiagnose = async (err: ErrorCode) => {
    if (!err) return;
    setAiDiagnoseLoading(true);
    setAiDiagnoseError('');
    setAiDiagnoseResult(null);

    try {
      const response = await fetch('/api/gemini/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: err.code,
          brand: err.brand,
          model: err.model,
          category: err.category,
          hasDirectusMatch: !err.isVirtual,
          dbErrorRecord: err.isVirtual ? null : err
        })
      });

      if (!response.ok) {
        throw new Error('سیستم متبحر تحلیلگر هوشمند پاسخ نداد.');
      }

      const data = await response.json();
      setAiDiagnoseResult(data);
    } catch (e: any) {
      console.error(e);
      setAiDiagnoseError(e.message || 'خطا در بارگذاری گزارش کالبدشکافی هوشمند');
    } finally {
      setAiDiagnoseLoading(false);
    }
  };

  // Automatically trigger AI analysis on error selection
  React.useEffect(() => {
    if (selectedError) {
      handleAiAnalysis(selectedError);
      handleAiDiagnose(selectedError);
    } else {
      setAiResult(null);
      setAiError('');
      setAiDiagnoseResult(null);
      setAiDiagnoseError('');
    }
  }, [selectedError?.id]);

  // Smart suggestions based on query
  const suggestions = React.useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) return [];

    const allTokens = cleanQuery
      .split(/\s+/)
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (allTokens.length === 0) return [];

    const stopWords = ['ارور', 'ارورهای', 'خطا', 'خطاهای', 'کد', 'سرویس', 'دستگاه', 'دستگاهای', 'بروز', 'ایران', 'مشکل', 'عیب', 'کولر', 'گازی'];
    let meaningfulTokens = allTokens.filter(t => !stopWords.includes(t));
    if (meaningfulTokens.length === 0) {
      meaningfulTokens = allTokens;
    }

    return errorCodes.filter(err => {
      return meaningfulTokens.every(token => {
        return (
          err.code.toLowerCase().includes(token) ||
          matchesToken(err.title, token) ||
          matchesToken(err.description, token) ||
          matchesToken(err.brand, token) ||
          matchesToken(err.model, token) ||
          matchesToken(err.category, token)
        );
      });
    }).slice(0, 5);
  }, [query, errorCodes]);

  const resolvedCategory = React.useMemo(() => {
    if (selectedCategory) return selectedCategory;
    if (categoryInput.trim()) {
      const matched = categories.find(cat => 
        normalizePersianArabic(cat).includes(normalizePersianArabic(categoryInput.trim())) || 
        normalizePersianArabic(categoryInput.trim()).includes(normalizePersianArabic(cat)) ||
        normalizeTextForSearch(cat).includes(normalizeTextForSearch(categoryInput.trim())) ||
        normalizeTextForSearch(categoryInput.trim()).includes(normalizeTextForSearch(cat))
      );
      if (matched) return matched;
      return categoryInput.trim();
    }
    return '';
  }, [selectedCategory, categoryInput, categories]);

  // DYNAMIC CONNECTED LISTS
  // 1. Available brands based on selectedCategory
  const availableBrands = React.useMemo(() => {
    if (!resolvedCategory) return brands;
    
    // Scan all error codes and see what brands are registered under this category
    const brandsFromErrors = errorCodes
      .filter(err => err.category && (
        normalizePersianArabic(err.category) === normalizePersianArabic(resolvedCategory) ||
        normalizeTextForSearch(err.category) === normalizeTextForSearch(resolvedCategory)
      ))
      .map(err => err.brand);
      
    // Scan spare parts as well
    const brandsFromParts = spareParts
      .filter(part => part.category && (
        normalizePersianArabic(part.category) === normalizePersianArabic(resolvedCategory) ||
        normalizeTextForSearch(part.category) === normalizeTextForSearch(resolvedCategory)
      ))
      .flatMap(part => Array.isArray(part.compatibility) ? part.compatibility : []);

    const merged = Array.from(new Set([...brandsFromErrors, ...brandsFromParts]));
    
    // If no specific brand matches, fallback to total known brands
    return merged.length > 0 ? merged : brands;
  }, [resolvedCategory, errorCodes, spareParts, brands]);

  const resolvedBrand = React.useMemo(() => {
    if (selectedBrand) return selectedBrand;
    if (brandInput.trim()) {
      const matched = availableBrands.find(b => 
        normalizePersianArabic(b).includes(normalizePersianArabic(brandInput.trim())) || 
        normalizePersianArabic(brandInput.trim()).includes(normalizePersianArabic(b)) ||
        normalizeTextForSearch(b).includes(normalizeTextForSearch(brandInput.trim())) ||
        normalizeTextForSearch(brandInput.trim()).includes(normalizeTextForSearch(b))
      );
      if (matched) return matched;
      return brandInput.trim();
    }
    return '';
  }, [selectedBrand, brandInput, availableBrands]);

  const resolvedModel = React.useMemo(() => {
    return selectedModel.trim();
  }, [selectedModel]);

  const currentStep = React.useMemo(() => {
    if (!query.trim()) return 1;
    if (!resolvedCategory) return 2;
    if (!resolvedBrand) return 3;
    if (!resolvedModel) return 4;
    return 5;
  }, [query, resolvedCategory, resolvedBrand, resolvedModel]);

  // 2. Available models based on selectedCategory and selectedBrand
  const availableModels = React.useMemo(() => {
    // Collect models from database
    const modelsFromErrors = errorCodes
      .filter(err => {
        const matchCat = !resolvedCategory || err.category === resolvedCategory;
        const matchBrand = !resolvedBrand || err.brand.toLowerCase().includes(resolvedBrand.toLowerCase()) || resolvedBrand.toLowerCase().includes(err.brand.toLowerCase());
        return matchCat && matchBrand;
      })
      .map(err => err.model);

    // Hardcoded dictionary of popular Iranian and international models for instant auto-suggestions
    const brandToModelsDict: Record<string, string[]> = {
      'بوتان': ['کالدا ونزیا', 'اپتیما', 'پرلا پرو', 'بنسر پرو', 'ورونا', 'پارما', 'روما', 'بنسر'],
      'ایران رادیاتور': ['M24FF', 'L24FF', 'Eco22', 'K24', 'M28FF', 'L36FF', 'سرویس آرا'],
      'ال‌جی': ['دایرکت درایو گیربکسی', 'تسمه‌ای سری تایتان', 'ساید بای ساید', 'اینورتر نقره‌ای', '۷ کیلویی دایرکت'],
      'ال‌جی (LG)': ['دایرکت درایو گیربکسی', 'تسمه‌ای سری تایتان', 'ساید بای ساید', 'اینورتر نقره‌ای', '۷ کیلویی دایرکت'],
      'سامسونگ': ['ساید بای ساید RS50', 'یخچال دوقلو ریلی', 'فرنچ ۴ دربی', 'لباسشویی ادواش AddWash', 'ساید RS50'],
      'سامسونگ (Samsung)': ['ساید بای ساید RS50', 'یخچال دوقلو ریلی', 'فرنچ ۴ دربی', 'لباسشویی ادواش AddWash', 'ساید RS50'],
      'اسنوا': ['ساید گالری', 'لباسشویی مدل اکتا', 'یخچال دوقلو داکت'],
      'اسنوا (Snowa)': ['ساید گالری', 'لباسشویی مدل اکتا', 'یخچال دوقلو داکت'],
      'پاکشوما': ['سری کاریزما', 'دوقلو پروانه ای', 'روتاری پاکشوما'],
      'پاکشوما (Pakshoma)': ['سری کاریزما', 'دوقلو پروانه ای', 'روتاری پاکشوما'],
      'بوش': ['سری ۶ آلمان', 'سری ۸ زایلنت', 'پکیج بوش کامفورت'],
      'بوش (Bosch)': ['سری ۶ آلمان', 'سری ۸ زایلنت', 'پکیج بوش کامفورت']
    };

    let dictModels: string[] = [];
    if (resolvedBrand) {
      const key = Object.keys(brandToModelsDict).find(k => 
        k.toLowerCase().includes(resolvedBrand.toLowerCase()) || 
        resolvedBrand.toLowerCase().includes(k.toLowerCase())
      );
      if (key) {
        dictModels = brandToModelsDict[key];
      }
    } else {
      dictModels = Object.values(brandToModelsDict).flat().slice(0, 15);
    }

    const merged = Array.from(new Set([...modelsFromErrors, ...dictModels])).filter(Boolean);
    return merged;
  }, [resolvedCategory, resolvedBrand, errorCodes]);

  // Filtered categories for combobox typing
  const filteredCategories = React.useMemo(() => {
    if (!categoryInput || categoryInput === selectedCategory) return categories;
    return categories.filter(cat => 
      normalizePersianArabic(cat).includes(normalizePersianArabic(categoryInput)) ||
      normalizeTextForSearch(cat).includes(normalizeTextForSearch(categoryInput))
    );
  }, [categories, categoryInput, selectedCategory]);

  // Filtered brands for combobox typing
  const filteredBrands = React.useMemo(() => {
    if (!brandInput || brandInput === selectedBrand) return availableBrands;
    return availableBrands.filter(b => 
      normalizePersianArabic(b).includes(normalizePersianArabic(brandInput)) ||
      normalizeTextForSearch(b).includes(normalizeTextForSearch(brandInput))
    );
  }, [availableBrands, brandInput, selectedBrand]);

  // Overall filtered error list based on query + filters
  const filteredCodes = React.useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    
    // Strict exact code filtering when only error code query is entered
    const otherFiltersEmpty = !resolvedCategory && !resolvedBrand && !resolvedModel;
    if (cleanQuery && isErrorCodeToken(cleanQuery) && otherFiltersEmpty) {
      return errorCodes.filter(err => normalizeCode(err.code) === normalizeCode(cleanQuery));
    }

    return errorCodes.filter(err => {
      const matchesCategory = !resolvedCategory || (err.category && (
        normalizePersianArabic(err.category).includes(normalizePersianArabic(resolvedCategory)) ||
        normalizePersianArabic(resolvedCategory).includes(normalizePersianArabic(err.category)) ||
        normalizeTextForSearch(err.category).includes(normalizeTextForSearch(resolvedCategory)) ||
        normalizeTextForSearch(resolvedCategory).includes(normalizeTextForSearch(err.category))
      ));
      
      const matchesBrand = !resolvedBrand || (err.brand && (
        normalizePersianArabic(err.brand).includes(normalizePersianArabic(resolvedBrand)) || 
        normalizePersianArabic(resolvedBrand).includes(normalizePersianArabic(err.brand)) ||
        normalizeTextForSearch(err.brand).includes(normalizeTextForSearch(resolvedBrand)) ||
        normalizeTextForSearch(resolvedBrand).includes(normalizeTextForSearch(err.brand))
      ));
      
      const matchesModel = !resolvedModel || (err.model && (
        normalizePersianArabic(err.model).includes(normalizePersianArabic(resolvedModel)) || 
        normalizePersianArabic(resolvedModel).includes(normalizePersianArabic(err.model)) ||
        normalizeTextForSearch(err.model).includes(normalizeTextForSearch(resolvedModel)) ||
        normalizeTextForSearch(resolvedModel).includes(normalizeTextForSearch(err.model))
      ));
      
      if (!cleanQuery) {
        if (resolvedCategory || resolvedBrand || resolvedModel) {
          return matchesCategory && matchesBrand && matchesModel;
        }
        return false;
      }

      const allTokens = cleanQuery
        .split(/\s+/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

      if (allTokens.length === 0) {
        if (resolvedCategory || resolvedBrand || resolvedModel) {
          return matchesCategory && matchesBrand && matchesModel;
        }
        return false;
      }

      const stopWords = ['ارور', 'ارورهای', 'خطا', 'خطاهای', 'کد', 'سرویس', 'دستگاه', 'دستگاهای', 'بروز', 'ایران', 'مشکل', 'عیب', 'کولر', 'گازی'];
      let meaningfulTokens = allTokens.filter(t => !stopWords.includes(t));
      if (meaningfulTokens.length === 0) {
        meaningfulTokens = allTokens;
      }

      const matchesQuery = meaningfulTokens.every(token => {
        const isCodeToken = isErrorCodeToken(token);
        if (isCodeToken) {
          // If the token matches the code field, it MUST be an exact normalized match
          const codeMatchesExactly = normalizeCode(err.code) === normalizeCode(token);
          // It can also match other text fields as substring
          const otherFieldsMatch = 
            (err.title && err.title.toLowerCase().includes(token)) || 
            (err.description && err.description.toLowerCase().includes(token));
          return codeMatchesExactly || otherFieldsMatch;
        }
        return (
          matchesTokenPrecise(err.code, token, true) ||
          matchesTokenPrecise(err.title, token, false) ||
          matchesTokenPrecise(err.description, token, false) ||
          matchesTokenPrecise(err.brand, token, false) ||
          matchesTokenPrecise(err.model, token, false) ||
          matchesTokenPrecise(err.category, token, false)
        );
      });

      return matchesCategory && matchesBrand && matchesModel && matchesQuery;
    });
  }, [errorCodes, query, resolvedCategory, resolvedBrand, resolvedModel]);

  // Suggested codes for direct popup list under main search input
  const suggestedCodes = React.useMemo(() => {
    if (!query.trim()) return [];
    return filteredCodes.slice(0, 5);
  }, [filteredCodes, query]);

  // Overall filtered common problems based on query + filters
  const filteredProblems = React.useMemo(() => {
    return commonProblems.filter(prob => {
      const matchesCategory = !selectedCategory || 
        normalizePersianArabic(prob.category) === normalizePersianArabic(selectedCategory) || 
        normalizeTextForSearch(prob.category) === normalizeTextForSearch(selectedCategory) ||
        prob.category === 'عمومی';
      
      const matchesBrand = !selectedBrand || 
        normalizePersianArabic(prob.brand).includes(normalizePersianArabic(selectedBrand)) || 
        normalizePersianArabic(selectedBrand).includes(normalizePersianArabic(prob.brand)) ||
        normalizeTextForSearch(prob.brand).includes(normalizeTextForSearch(selectedBrand)) ||
        normalizeTextForSearch(selectedBrand).includes(normalizeTextForSearch(prob.brand)) ||
        prob.brand === 'عمومی';
      
      const cleanQuery = query.trim().toLowerCase();
      if (!cleanQuery) {
        if (selectedCategory || selectedBrand) {
          return matchesCategory && matchesBrand;
        }
        return false;
      }

      const allTokens = cleanQuery
        .split(/\s+/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

      if (allTokens.length === 0) {
        if (selectedCategory || selectedBrand) {
          return matchesCategory && matchesBrand;
        }
        return false;
      }

      const stopWords = ['ارور', 'ارورهای', 'خطا', 'خطاهای', 'کد', 'سرویس', 'دستگاه', 'دستگاهای', 'بروز', 'ایران', 'مشکل', 'عیب', 'کولر', 'گازی'];
      let meaningfulTokens = allTokens.filter(t => !stopWords.includes(t));
      if (meaningfulTokens.length === 0) {
        meaningfulTokens = allTokens;
      }

      const matchesQuery = meaningfulTokens.every(token => {
        return (
          matchesTokenPrecise(prob.title, token, false) ||
          matchesTokenPrecise(prob.category, token, false) ||
          matchesTokenPrecise(prob.brand, token, false) ||
          prob.causes.some(c => matchesTokenPrecise(c, token, false)) ||
          prob.solutions.some(s => matchesTokenPrecise(s, token, false)) ||
          (prob.tags && prob.tags.some(t => matchesTokenPrecise(t, token, false)))
        );
      });

      return matchesCategory && matchesBrand && matchesQuery;
    });
  }, [commonProblems, query, selectedCategory, selectedBrand]);

  // Overall filtered technical documents based on searchType, query, category, brand, model
  const filteredTechDocs = React.useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    
    // Collect all real uploaded technical documents
    const allDocs = realTechDocs;

    return allDocs.filter(doc => {
      // Check searchType category
      if (searchType === 'datasheet') {
        if (!["Datasheet (PDF)", "Service Manual", "Catalog"].includes(doc.type)) {
          return false;
        }
      } else if (searchType === 'diagram') {
        if (!["Wiring Diagram", "Schematic", "PCB Layout", "Exploded View"].includes(doc.type)) {
          return false;
        }
      } else {
        return false; // not searching technical documents
      }

      // Filter by selected category, brand, model
      const matchesCategory = !resolvedCategory || (doc.device.category && doc.device.category.toLowerCase().includes(resolvedCategory.toLowerCase()));
      
      const matchesBrand = !resolvedBrand || (doc.device.brand && (
        doc.device.brand.toLowerCase().includes(resolvedBrand.toLowerCase()) || 
        resolvedBrand.toLowerCase().includes(doc.device.brand.toLowerCase())
      ));
      
      const matchesModel = !resolvedModel || (doc.device.model && (
        doc.device.model.toLowerCase().includes(resolvedModel.toLowerCase()) || 
        resolvedModel.toLowerCase().includes(doc.device.model.toLowerCase())
      ));

      if (!cleanQuery) {
        if (resolvedCategory || resolvedBrand || resolvedModel) {
          return matchesCategory && matchesBrand && matchesModel;
        }
        return false;
      }

      const allTokens = cleanQuery
        .split(/\s+/)
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const matchesQuery = allTokens.every(token => {
        return (
          doc.title.toLowerCase().includes(token) ||
          doc.type.toLowerCase().includes(token) ||
          doc.device.brand.toLowerCase().includes(token) ||
          doc.device.category.toLowerCase().includes(token) ||
          doc.device.model.toLowerCase().includes(token)
        );
      });

      return matchesCategory && matchesBrand && matchesModel && matchesQuery;
    });
  }, [realTechDocs, searchType, query, resolvedCategory, resolvedBrand, resolvedModel]);

  const [selectedProblemState, setSelectedProblemState] = React.useState<CommonProblem | null>(null);

  const selectedProblem = selectedProblemState;
  const setSelectedProblem = (prob: CommonProblem | null) => {
    if (!prob) {
      setSelectedProblemState(null);
      return;
    }

    if (isPremium) {
      setSelectedProblemState(prob);
      return;
    }

    const isAlreadyViewed = viewedProblems.includes(prob.id);
    if (!isAlreadyViewed) {
      if (viewedProblems.length >= 1) {
        setFreeLimitReachedType('common_problem');
        setShowFreeLimitModal(true);
        return;
      } else {
        const updated = [...viewedProblems, prob.id];
        setViewedProblems(updated);
        fetch('/api/free-views', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'common_problem', id: prob.id })
        }).catch(err => console.error(err));
      }
    }
    setSelectedProblemState(prob);
  };

  const handleSelectProblemAsErrorCode = (prob: CommonProblem) => {
    // Check premium limits for common problem
    if (!isPremium) {
      const isAlreadyViewed = viewedProblems.includes(prob.id);
      if (!isAlreadyViewed) {
        if (viewedProblems.length >= 1) {
          setFreeLimitReachedType('common_problem');
          setShowFreeLimitModal(true);
          return;
        } else {
          const updated = [...viewedProblems, prob.id];
          setViewedProblems(updated);
          fetch('/api/free-views', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'common_problem', id: prob.id })
          }).catch(err => console.error(err));
        }
      }
    }

    // Convert to ErrorCode structure
    const mapped: ErrorCode = {
      id: prob.id,
      code: prob.code || 'مشکل شایع',
      category: prob.category,
      brand: prob.brand,
      model: prob.model || 'عمومی',
      title: prob.title,
      description: prob.description || 'راهنمای عیب‌یابی و برطرف‌سازی گام‌به‌گام',
      causes: prob.causes || [],
      steps: prob.steps || prob.solutions || [],
      precautions: prob.precautions || [],
      hazardLevel: prob.hazardLevel || 'low',
      hazardDescription: prob.hazardLevel === 'critical' ? 'خطر شدید جانی و مالی - لطفاً کلیه سوکت‌های برق و شیر اصلی گاز را سریعاً قطع کنید.' : prob.hazardLevel === 'high' ? 'خطر بالا - احتیاج به قطع برق' : 'کم خطر/عادی',
      toolsNeeded: [],
      relatedParts: [],
      views: (prob.views || 0) + 1,
      isApproved: true,
    };

    prob.views = (prob.views || 0) + 1;
    onSelectError(mapped);
  };

  const handleSelectSuggestion = (err: ErrorCode) => {
    onSelectError(err);
    setQuery(err.code);
    setSelectedCategory(err.category);
    setSelectedBrand(err.brand);
    setSelectedModel(err.model);
    setShowSuggestions(false);
  };

  const handleModelChange = (val: string) => {
    setSelectedModel(val);
    if (selectedError) onSelectError(null as any);
    
    // Autofill Brand and Category if there's a match
    if (val) {
      const match = errorCodes.find(err => 
        err.model.toLowerCase().includes(val.toLowerCase()) || 
        val.toLowerCase().includes(err.model.toLowerCase())
      );
      if (match) {
        if (!selectedCategory) setSelectedCategory(match.category);
        if (!selectedBrand) setSelectedBrand(match.brand);
      }
    }
  };

  const handleConfirmBottomPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bottomBuyerName || !bottomBuyerPhone || !bottomBuyerAddress || !activeCheckoutPartOfBottom) return;

    if (onPurchase) {
      onPurchase(
        activeCheckoutPartOfBottom,
        bottomBuyerAddress,
        bottomBuyerName,
        bottomBuyerPhone
      );
      setBottomCheckoutStep('success');
    }
  };

  const getHazardBadge = (level: ErrorCode['hazardLevel']) => {
    switch (level) {
      case 'critical':
        return (
          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1 animate-pulse">
            <Flame className="w-3.5 h-3.5 fill-white" />
            <span>بحرانی و پرخطر ⚠️</span>
          </span>
        );
      case 'high':
        return (
          <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
            <span>خطر بالا ⚡</span>
          </span>
        );
      case 'medium':
        return (
          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1">
            <Settings className="w-3.5 h-3.5 text-white" />
            <span>احتیاط عمومی</span>
          </span>
        );
      default:
        return (
          <span className="bg-slate-500 text-white text-[10px] font-bold px-2 py-1 rounded-sm flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-white" />
            <span>کم‌خطر</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input Card - Highly Visible and Boxed */}
      <div className="bg-gradient-to-br from-white to-slate-50/40 rounded-3xl border-2 border-blue-600/25 p-6 sm:p-8 shadow-lg shadow-blue-900/5 relative overflow-visible z-50">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="mb-6 relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="bg-blue-600 text-white text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              پایگاه اطلاعات کدهای خطا
            </span>
            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
              بروزرسانی زنده خرداد ۱۴۰۵
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            <span>جستجوی هوشمند و کالبدشکافی کدهای خطای لوازم خانگی ایران</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            کد خطا (مانند E01، F3 یا IE) یا مشکل کلی دستگاه را جستجو کنید تا فوراً علل بروز، راهکارهای گام‌به‌گام و ابزارهای ایمنی مورد نیاز نمایش داده شوند.
          </p>
        </div>

        {/* Segmented Search Type Selector - 100% Client-side scope selection */}
        <div className="mb-6 relative z-30 border-b border-slate-100 pb-5">
          <label className="text-[11px] font-black text-slate-400 block mb-2 text-right">موضوع تخصصی جستجو را انتخاب کنید:</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setSearchType('error_code');
                if (selectedError) onSelectError(null as any);
              }}
              className={`px-4 py-3 rounded-2xl text-xs font-black transition-all duration-250 cursor-pointer flex items-center justify-center gap-2 border-2 ${
                searchType === 'error_code'
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/25 scale-[101%]'
                  : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <Search className={`w-4 h-4 ${searchType === 'error_code' ? 'text-white' : 'text-blue-600'}`} />
              <span>کدهای عیب‌یابی (کد خطا)</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                setSearchType('common_problem');
                if (selectedError) onSelectError(null as any);
              }}
              className={`px-4 py-3 rounded-2xl text-xs font-black transition-all duration-250 cursor-pointer flex items-center justify-center gap-2 border-2 ${
                searchType === 'common_problem'
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/25 scale-[101%]'
                  : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <Wrench className={`w-4 h-4 ${searchType === 'common_problem' ? 'text-white' : 'text-indigo-600'}`} />
              <span>مشکلات شایع دستگاه</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                setSearchType('datasheet');
                if (selectedError) onSelectError(null as any);
              }}
              className={`px-4 py-3 rounded-2xl text-xs font-black transition-all duration-250 cursor-pointer flex items-center justify-center gap-2 border-2 ${
                searchType === 'datasheet'
                  ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-lg shadow-amber-500/20 scale-[101%]'
                  : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <FileText className={`w-4 h-4 ${searchType === 'datasheet' ? 'text-slate-900' : 'text-amber-500'}`} />
              <span>دیتاشیت و کاتالوگ فنی</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                setSearchType('diagram');
                if (selectedError) onSelectError(null as any);
              }}
              className={`px-4 py-3 rounded-2xl text-xs font-black transition-all duration-250 cursor-pointer flex items-center justify-center gap-2 border-2 ${
                searchType === 'diagram'
                  ? 'bg-teal-600 border-teal-600 text-white shadow-lg shadow-teal-500/25 scale-[101%]'
                  : 'bg-white border-slate-200/80 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              <Cpu className={`w-4 h-4 ${searchType === 'diagram' ? 'text-white' : 'text-teal-600'}`} />
              <span>نقشه‌ها و دیاگرام سیم‌کشی</span>
            </button>
          </div>
        </div>

        {/* Step-by-Step Drill-down Guide */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-4 text-right font-sans">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[11px] font-black text-white">
                🔎
              </span>
              <span className="text-xs sm:text-xs font-black text-slate-800">
                راهنمای جستجوی پلکانی کدهای خطا (مرحله به مرحله):
              </span>
            </div>
            <div className="flex flex-wrap gap-2 items-center text-[10px] sm:text-xs">
              {/* Step 1 */}
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-black border transition-all ${
                currentStep === 1 
                  ? 'bg-blue-50 border-blue-200 text-blue-700 animate-pulse ring-2 ring-blue-100' 
                  : currentStep > 1 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-750' 
                    : 'bg-white border-slate-100 text-slate-400'
              }`}>
                <span>{currentStep > 1 ? '✓' : '۱.'}</span>
                <span>کد ارور</span>
              </div>
              <span className="text-slate-300 text-[10px]">➔</span>

              {/* Step 2 */}
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-black border transition-all ${
                currentStep === 2 
                  ? 'bg-blue-50 border-blue-200 text-blue-700 animate-pulse ring-2 ring-blue-100' 
                  : currentStep > 2 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-750' 
                    : 'bg-white border-slate-100 text-slate-400'
              }`}>
                <span>{currentStep > 2 ? '✓' : '۲.'}</span>
                <span>نوع دستگاه</span>
              </div>
              <span className="text-slate-300 text-[10px]">➔</span>

              {/* Step 3 */}
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-black border transition-all ${
                currentStep === 3 
                  ? 'bg-blue-50 border-blue-200 text-blue-700 animate-pulse ring-2 ring-blue-100' 
                  : currentStep > 3 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-750' 
                    : 'bg-white border-slate-100 text-slate-400'
              }`}>
                <span>{currentStep > 3 ? '✓' : '۳.'}</span>
                <span>برند</span>
              </div>
              <span className="text-slate-300 text-[10px]">➔</span>

              {/* Step 4 */}
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-black border transition-all ${
                currentStep === 4 
                  ? 'bg-blue-50 border-blue-200 text-blue-700 animate-pulse ring-2 ring-blue-100' 
                  : currentStep > 4 
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-750' 
                    : 'bg-white border-slate-100 text-slate-400'
              }`}>
                <span>{currentStep > 4 ? '✓' : '۴.'}</span>
                <span>مدل</span>
              </div>
            </div>
          </div>
          
          {/* Dynamic Helper Text in Persian */}
          <p className="text-[10px] sm:text-[11px] text-slate-550 font-bold mt-2.5 border-t border-slate-150 pt-2 leading-relaxed">
            {currentStep === 1 && "💡 ابتدا کد خطا (مثل E1 یا F3) یا نام ایراد فنی را در فیلد زیر بنویسید تا کدهای ارور تمام دستگاه‌ها نمایش داده شوند."}
            {currentStep === 2 && `💡 کد ارور ارزیابی شد. اکنون برای محدودسازی، «دسته‌بندی دستگاه» (مثلاً پکیج، کولر گازی) را انتخاب یا جستجو نمایید.`}
            {currentStep === 3 && `💡 دستگاه مشخص شد. حال «برند دستگاه» (مثلاً بوتان، ایران رادیاتور) را از لیست برگزینید تا فقط کدهای این برند تفکیک شوند.`}
            {currentStep === 4 && `💡 عالی است! گام نهایی: «مدل دقیق دستگاه» را از لیست پیشنهادهای متناظر برگزینید یا تایپ کنید تا ارور منحصر به همان مدل نمایش داده شود.`}
            {currentStep === 5 && `✅ فرآیند جستجوی پلکانی تکمیل شد! هم‌اکنون نتایج جستجو به مدل دقیق دستگاه فیلتر شده است.`}
          </p>
        </div>

        {/* Form controls */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 relative z-30">
          {/* Main search bar with voice recognition entry */}
          <div className="col-span-12 md:col-span-6 lg:col-span-3 relative z-20" id="main-search-container">
            <div className="relative">
              <span className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-blue-600">
                <Search className="w-5 h-5" />
              </span>
              <input
                id="search-main"
                type="text"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="تایپ کنید: E1 ، 5E ، F3 ، یا نام ایراد فنی..."
                value={query}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  setShowSuggestions(true);
                  if (selectedError) onSelectError(null as any); // Reset details to show search results
                }}
                className={`w-full text-xs sm:text-sm rounded-2xl pr-12 pl-14 py-4 border-2 outline-none transition-all font-bold placeholder-slate-400 text-slate-800 ${currentStep === 1 ? 'bg-blue-50/15 border-blue-500 ring-4 ring-blue-100' : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100'}`}
              />
              {/* Mic Icon Button for Voice Search */}
              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`absolute inset-y-1.5 left-1.5 flex items-center justify-center px-3.5 rounded-xl transition-all border outline-none select-none cursor-pointer ${
                  isListening 
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse hover:bg-rose-700 shadow-md shadow-rose-500/25' 
                    : 'bg-white border-slate-200/80 hover:bg-slate-100 text-slate-500 hover:text-blue-600 shadow-xs'
                }`}
                title="جستجوی با مکالمه صوتی فارسی"
              >
                {isListening ? (
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
                    <Mic className="w-4 h-4" />
                  </div>
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Float Autocomplete suggestions list is completely disabled to avoid overlaying on mobile inputs */}
          </div>

          {/* Custom Category Dropdown - Now typeable! */}
          <div className={`col-span-12 md:col-span-6 lg:col-span-3 relative ${showCategoryDropdown ? 'z-50' : 'z-20'}`} id="category-dropdown-container">
              <div className="relative">
                <input
                  type="text"
                  id="category-input-field"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="⚙️ همه دستگاه‌ها (کل دسته‌ها)"
                  value={categoryInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCategoryInput(val);
                    setShowCategoryDropdown(true);
                    if (!val) {
                      setSelectedCategory('');
                      setSelectedBrand('');
                      setSelectedModel('');
                      if (selectedError) onSelectError(null as any);
                    }
                  }}
                  onFocus={() => {
                    setShowCategoryDropdown(true);
                    setShowBrandDropdown(false);
                    setShowModelSuggestions(false);
                  }}
                  className={`w-full text-right text-xs sm:text-xs rounded-2xl p-4 pr-10 pl-8 border-2 outline-none transition-all font-bold text-slate-850 flex items-center justify-between shadow-xs ${currentStep === 2 ? 'bg-blue-50/15 border-blue-500 ring-4 ring-blue-100' : 'bg-white hover:bg-slate-50 border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100'}`}
                />
                <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
                  ⚙️
                </span>
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] transition-transform duration-200 pointer-events-none ${showCategoryDropdown ? 'rotate-180' : ''}`}>
                  ▼
                </span>
                {categoryInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryInput('');
                      setSelectedCategory('');
                      setSelectedBrand('');
                      setSelectedModel('');
                      if (selectedError) onSelectError(null as any);
                    }}
                    className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {showCategoryDropdown && (
                <div 
                  className="absolute right-0 left-0 mt-1.5 bg-white opacity-100 rounded-2xl shadow-2xl border-2 border-slate-200 z-50 max-h-56 overflow-y-auto text-right text-xs"
                  style={{ backgroundColor: '#ffffff', opacity: 1 }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="bg-slate-50 p-2.5 text-[10px] font-extrabold text-slate-500 border-b border-slate-150">
                    دسته‌بندی دستگاه مورد نظر خود را برگزینید:
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('');
                      setCategoryInput('');
                      setSelectedBrand(''); // Connected: Reset brand
                      setBrandInput('');
                      setSelectedModel(''); // Connected: Reset model
                      if (selectedError) onSelectError(null as any);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-right hover:bg-slate-100 transition-colors border-b border-slate-100 cursor-pointer font-extrabold block text-rose-700 ${!selectedCategory ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-700'}`}
                  >
                    ⚙️ همه دستگاه‌ها (کل دسته‌ها)
                  </button>
                  {filteredCategories.length === 0 ? (
                    <div className="px-4 py-3 text-slate-450 text-center font-bold text-[11px]">
                      دستگاهی مطابق با تایپ شما یافت نشد...
                    </div>
                  ) : (
                    filteredCategories.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setCategoryInput(cat);
                          setSelectedBrand(''); // Connected: Reset brand
                          setBrandInput('');
                          setSelectedModel(''); // Connected: Reset model
                          if (selectedError) onSelectError(null as any);
                          setShowCategoryDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-right hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-0 cursor-pointer font-bold block ${selectedCategory === cat ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-755'}`}
                      >
                        {cat}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

          {/* Custom Brand Dropdown - Connected - Now typeable! */}
          <div className={`col-span-12 md:col-span-6 lg:col-span-3 relative ${showBrandDropdown ? 'z-50' : 'z-20'}`} id="brand-dropdown-container">
              <div className="relative">
                <input
                  type="text"
                  id="brand-input-field"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder={selectedCategory ? `🏆 برند ${selectedCategory}` : '🏆 همه برندها (کل مارک‌ها)'}
                  value={brandInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBrandInput(val);
                    setShowBrandDropdown(true);
                    if (!val) {
                      setSelectedBrand('');
                      setSelectedModel('');
                      if (selectedError) onSelectError(null as any);
                    }
                  }}
                  onFocus={() => {
                    setShowBrandDropdown(true);
                    setShowCategoryDropdown(false);
                    setShowModelSuggestions(false);
                  }}
                  className={`w-full text-right text-xs sm:text-xs rounded-2xl p-4 pr-10 pl-8 border-2 outline-none transition-all font-bold text-slate-850 flex items-center justify-between shadow-xs ${currentStep === 3 ? 'bg-blue-50/15 border-blue-500 ring-4 ring-blue-100' : 'bg-white hover:bg-slate-50 border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100'}`}
                />
                <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
                  🏆
                </span>
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[10px] transition-transform duration-200 pointer-events-none ${showBrandDropdown ? 'rotate-180' : ''}`}>
                  ▼
                </span>
                {brandInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setBrandInput('');
                      setSelectedBrand('');
                      setSelectedModel('');
                      if (selectedError) onSelectError(null as any);
                    }}
                    className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {showBrandDropdown && (
                <div 
                  className="absolute right-0 left-0 mt-1.5 bg-white rounded-2xl shadow-2xl border-2 border-slate-200 z-50 max-h-56 overflow-y-auto text-right text-xs"
                  style={{ backgroundColor: '#ffffff', opacity: 1 }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="bg-slate-50 p-2.5 text-[10px] font-extrabold text-slate-500 border-b border-slate-150">
                    برند دستگاه متبوع خود را انتخاب نمایید:
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBrand('');
                      setBrandInput('');
                      setSelectedModel(''); // Connected: Reset model on brand change
                      if (selectedError) onSelectError(null as any);
                      setShowBrandDropdown(false);
                    }}
                    className={`w-full px-4 py-3 text-right hover:bg-slate-100 transition-colors border-b border-slate-100 cursor-pointer font-extrabold block text-blue-700 ${!selectedBrand ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-700'}`}
                  >
                    🏆 همه برندها
                  </button>
                  {filteredBrands.length === 0 ? (
                    <div className="px-4 py-3 text-slate-400 text-center font-bold text-[11px]">
                      برندی مطابق با تایپ شما یافت نشد...
                    </div>
                  ) : (
                    filteredBrands.map((br) => (
                      <button
                        type="button"
                        key={br}
                        onClick={() => {
                          setSelectedBrand(br);
                          setBrandInput(br);
                          setSelectedModel(''); // Connected: Reset model on brand change
                          if (selectedError) onSelectError(null as any);
                          setShowBrandDropdown(false);
                        }}
                        className={`w-full px-4 py-3 text-right hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-0 cursor-pointer font-bold block ${selectedBrand === br ? 'bg-blue-50 text-blue-700' : 'bg-white text-slate-700'}`}
                      >
                        {br}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

          {/* Model Input & dynamic typing recommendations - Connected */}
          <div className={`col-span-12 md:col-span-6 lg:col-span-3 relative ${showModelSuggestions ? 'z-50' : 'z-20'}`} id="model-dropdown-container">
              <div className="relative">
                <input
                  id="model-input"
                  type="text"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="📝 درج یا انتخاب مدل..."
                  value={selectedModel}
                  onChange={(e) => handleModelChange(e.target.value)}
                  onFocus={() => {
                    setShowModelSuggestions(true);
                    setShowCategoryDropdown(false);
                    setShowBrandDropdown(false);
                  }}
                  className={`w-full text-right text-xs sm:text-xs rounded-2xl p-4 pr-10 pl-8 border-2 outline-none transition-all font-bold text-slate-850 flex items-center justify-between shadow-xs placeholder-slate-400 ${currentStep === 4 ? 'bg-blue-50/15 border-blue-500 ring-4 ring-blue-100' : 'bg-white hover:bg-slate-50 border-slate-200 focus:border-blue-600 focus:ring-4 focus:ring-blue-100'}`}
                />
                <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
                  📝
                </span>
                {selectedModel && (
                  <button
                    onClick={() => handleModelChange('')}
                    className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-rose-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {showModelSuggestions && (
                <div 
                  className="absolute right-0 left-0 mt-1.5 bg-white rounded-2xl shadow-2xl border-2 border-slate-200 z-50 max-h-56 overflow-y-auto text-right text-xs"
                  style={{ backgroundColor: '#ffffff', opacity: 1 }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="bg-slate-50 p-2.5 text-[10px] font-extrabold text-slate-500 border-b border-slate-150 flex justify-between">
                    <span>مدل‌های پیشنهادی متناظر:</span>
                    <span className="text-blue-600 font-mono">({availableModels.length})</span>
                  </div>
                  {availableModels.length === 0 ? (
                    <div className="px-4 py-3 text-slate-400 text-center font-bold text-[11px]">
                      مدل پیش‌فرضی یافت نشد. می‌توانید مدل را دستی تایپ نمایید.
                    </div>
                  ) : (
                    availableModels
                      .filter(m => !selectedModel || m.toLowerCase().includes(selectedModel.toLowerCase()))
                      .map((m) => (
                        <button
                          id={`model-opt-${m}`}
                          type="button"
                          key={m}
                          onClick={() => {
                            setSelectedModel(m);
                            setShowModelSuggestions(false);
                            if (selectedError) onSelectError(null as any);
                            
                            // Smart auto-fill linking
                            const match = errorCodes.find(err => 
                              err.model.toLowerCase().includes(m.toLowerCase()) || 
                              m.toLowerCase().includes(err.model.toLowerCase())
                            );
                            if (match) {
                              setSelectedCategory(match.category);
                              setSelectedBrand(match.brand);
                            }
                          }}
                          className="w-full px-4 py-3 text-right bg-white hover:bg-slate-100 transition-colors border-b border-slate-100 last:border-0 cursor-pointer text-slate-705 block font-bold"
                        >
                          {m}
                        </button>
                      ))
                  )}
                </div>
              )}
            </div>
          </div>

        {/* Quick searches */}
        <div className="flex flex-wrap items-center gap-2 mt-5 text-xs border-t border-slate-200/60 pt-4 relative z-10">
          <span className="text-slate-500 text-[10.5px] font-bold">پرتقاضاترین کدهای عیب‌یابی کدیار24:</span>
          {quickCodes.map((code) => {
            const matchedError = errorCodes.find((err) => err.code === code);
            const level = matchedError ? matchedError.hazardLevel : 'low';
            return (
              <button
                id={`quick-code-${code}`}
                key={code}
                onClick={() => {
                  setQuery(code);
                  if (matchedError) {
                    onSelectError(matchedError);
                    setSelectedCategory(matchedError.category);
                    setSelectedBrand(matchedError.brand);
                    setSelectedModel(matchedError.model);
                  }
                }}
                className={`inline-flex items-center justify-center min-w-[64px] text-center font-mono text-[11px] px-3.5 py-1.5 rounded-xl select-auto transition-all cursor-pointer font-extrabold border focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs ${
                  level === 'critical' || level === 'high'
                    ? 'bg-red-600 text-white hover:bg-red-750 border-red-700 hover:text-white shadow-sm shadow-red-100'
                    : level === 'medium'
                    ? 'bg-amber-500 text-white hover:bg-amber-600 border-amber-600 hover:text-white shadow-sm shadow-amber-100'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-700 hover:text-white shadow-sm shadow-emerald-100'
                }`}
              >
                {code}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main detail page OR list view */}
      <div className="opacity-100 mt-6 transition-all duration-300 w-full max-w-full overflow-hidden">
        {selectedError ? (
        <div className="space-y-6 w-full max-w-full overflow-hidden">
          {/* Back button */}
          <button
            onClick={() => onSelectError(null as any)}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-blue-600 cursor-pointer p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
            <span>بازگشت به نتایج جستجو</span>
          </button>

          {/* Error Details Board */}
          <div className="bg-white -mx-4 md:mx-0 rounded-none md:rounded-3xl border-x-0 md:border border-slate-200/90 shadow-xs overflow-hidden w-auto max-w-none">
            {/* Upper Info Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-600/15 rounded-full blur-2xl" />

              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
                <div className="space-y-1 min-w-0 flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md font-mono">
                      {selectedError.code}
                    </span>
                    <span className="bg-white/10 text-slate-200 text-[10px] px-2 py-0.5 rounded-md">
                      {selectedError.brand}
                    </span>
                    <span className="bg-white/10 text-slate-200 text-[10px] px-2 py-0.5 rounded-md">
                      {selectedError.category}
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-2 break-words whitespace-normal leading-relaxed text-right select-all">
                    {selectedError.title}
                  </h1>
                  <p className="text-slate-300 text-xs font-mono break-words whitespace-normal text-right">
                    سازگار با مدل‌های: {selectedError.model}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {getHazardBadge(selectedError.hazardLevel)}
                </div>
              </div>
            </div>

            {/* Glowing red alert box for hazards */}
            {['critical', 'high'].includes(selectedError.hazardLevel) && (
              <div className="bg-rose-50 border-y border-rose-200 p-4 text-xs text-rose-900 flex items-start gap-3 animate-pulse">
                <ShieldAlert className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <span>هشدار امنیتی بسیار مهم: خطای با خطر شدید!</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed font-sans break-words whitespace-normal">{selectedError.hazardDescription}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-t border-slate-100 w-full max-w-full">
              {/* Primary Trouble diagnosis & instructions */}
              <div className="lg:col-span-8 p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-full overflow-hidden">
                {(() => {
                  const hasDbContent = !!(
                    selectedError.description || 
                    (selectedError.causes && selectedError.causes.length > 0) || 
                    (selectedError.steps && selectedError.steps.length > 0) || 
                    (selectedError.precautions && selectedError.precautions.length > 0)
                  );

                  const hasAiContent = !!(aiDiagnoseResult || aiResult || aiLoading || aiDiagnoseLoading);

                  return (
                    <div className="space-y-6">
                      {/* 2- Information Recorded in the Site (Database Content) - Officially Prioritized to be displayed first */}
                      {hasDbContent && (
                        <div className="bg-white border-2 border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs relative">
                          {/* Section Header */}
                          <div className="border-b border-slate-100 pb-3 flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-2xl bg-blue-105 flex items-center justify-center text-blue-600">
                              <CheckCircle className="w-5 h-5 font-bold" />
                            </div>
                            <div>
                              <h3 className="text-xs sm:text-sm font-black text-slate-800">۲) اطلاعات ثبت‌شده در سایت (رسمی)</h3>
                              <p className="text-[10px] text-slate-500 font-medium font-sans">توضیحات رسمی و مستندات ثبت‌شده در دیتابیس کدیار24</p>
                            </div>
                          </div>

                          {/* Video Guide Play Banner */}
                          {selectedError.video_url && (
                            <div className="bg-gradient-to-r from-rose-500/10 to-amber-500/10 border border-rose-500/15 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                              <div className="flex items-center gap-3 text-right">
                                <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center text-white shrink-0 shadow-md">
                                  <Play className="w-6 h-6 fill-current pr-0.5" />
                                </div>
                                <div className="space-y-0.5">
                                  <h4 className="text-xs font-extrabold text-slate-800">فیلم راهنمای تصویری ویدیویی رفع عیب</h4>
                                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans font-medium">برای این خطای خاص، راهنمای ویدیویی و رفع عیب کارگاهی ثبت شده است.</p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!currentUser) {
                                    setShowPremiumAlert('login');
                                  } else if (!isPremium) {
                                    setShowPremiumAlert('premium');
                                  } else {
                                    setActiveVideoUrl(selectedError.video_url || null);
                                  }
                                }}
                                className="bg-red-650 hover:bg-red-700 text-white font-extrabold text-[10.5px] px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs hover:shadow active:scale-[97%] w-full md:w-auto justify-center"
                              >
                                <Video className="w-4 h-4 text-white" />
                                <span>پخش فیلم آموزشی عیب‌یابی</span>
                              </button>
                            </div>
                          )}

                          {/* 2.1 Content from Database Admin: محتوای ذخیره‌شده توسط مدیر سایت */}
                          {selectedError.description && (
                            <div className="space-y-1">
                              <h4 className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                                <span>محتوای ذخیره‌شده توسط مدیر سایت:</span>
                              </h4>
                              <p className="text-slate-600 text-xs leading-relaxed font-sans bg-slate-50 p-3.5 rounded-2xl border border-slate-100/70 whitespace-pre-line font-medium">
                                {selectedError.description}
                              </p>
                            </div>
                          )}

                          {/* 2.2 Official Error Code Explanation: توضیحات رسمی کد خطا */}
                          {selectedError.causes && selectedError.causes.length > 0 && (
                            <div className="bg-slate-50/55 rounded-2xl border border-slate-101 p-4 space-y-1.5">
                              <h4 className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-amber-550 rounded-full"></span>
                                <span>توضیحات رسمی کد خطا و دلایل شایع:</span>
                              </h4>
                              <ul className="space-y-1.5 text-xs text-slate-650 list-disc pr-4 font-sans leading-relaxed font-medium">
                                {selectedError.causes.map((cause, i) => (
                                  <li key={i}>{cause}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* 2.3 Instructions/notes in database: آموزش‌ها یا نکات ثبت‌شده در دیتابیس */}
                          {selectedError.steps && selectedError.steps.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                                <span>آموزش‌ها یا نکات ثبت‌شده در دیتابیس (مراحل رفع عیب):</span>
                              </h4>
                              <div className="space-y-2.5 mt-1">
                                {selectedError.steps.map((step, idx) => (
                                  <div key={idx} className="flex gap-3">
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold flex items-center justify-center font-sans">
                                      {idx + 1}
                                    </div>
                                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex-1">
                                      <p className="text-slate-700 text-xs leading-relaxed font-sans font-medium">{step}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Precautions in Database */}
                          {selectedError.precautions && selectedError.precautions.length > 0 && (
                            <div className="bg-amber-50/30 border border-amber-200/60 rounded-2xl p-4">
                              <h4 className="text-[11.5px] font-bold text-amber-800 mb-2 flex items-center gap-1.5">
                                <ShieldAlert className="w-4 h-4 text-amber-600" />
                                <span>دستورالعمل‌ها و نکات ایمنی واجب ثبت‌شده در دیتابیس:</span>
                              </h4>
                              <ul className="space-y-1.5 text-xs text-slate-600 list-inside pr-4 list-decimal font-sans leading-relaxed">
                                {selectedError.precautions.map((p, idx) => (
                                  <li key={idx}>{p}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* TechDocs Panel - Technical documents, manual, schematics */}
                      {selectedError && (
                        <TechDocsPanel
                          deviceId={selectedError.id}
                          currentUser={currentUser}
                          onUpgradeClick={onGoToDashboard}
                          triggerNotification={triggerNotification}
                        />
                      )}

                      {/* 1- AI Diagnosis Result - Separated Block */}
                      {hasAiContent && (
                        <div className="bg-gradient-to-br from-indigo-50/70 via-blue-50/50 to-slate-50/80 border border-blue-150 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xs">
                          {/* Section Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-100 pb-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600 animate-pulse">
                                <Cpu className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                  <span>۱) نتیجه تحلیل هوش مصنوعی (اختصاصی)</span>
                                  <span className="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-md font-bold tracking-wider animate-pulse">
                                    GEMINI AI
                                  </span>
                                </h3>
                                <p className="text-[10px] text-slate-500 font-medium">سرویس عیب‌یابی آنلاین و بهینه‌سازی شده بر پایه پردازش زبان طبیعی</p>
                              </div>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => {
                                handleAiAnalysis(selectedError);
                                handleAiDiagnose(selectedError);
                              }}
                              className="self-start sm:self-auto text-[9.5px] font-extrabold text-blue-700 hover:text-white bg-white hover:bg-blue-600 border border-blue-100 hover:border-blue-600 px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs whitespace-nowrap"
                              disabled={aiLoading || aiDiagnoseLoading}
                            >
                              {aiLoading || aiDiagnoseLoading ? "در حال بازخوانی..." : "🔄 آنالیز مجدد خطا"}
                            </button>
                          </div>

                          {(aiLoading || aiDiagnoseLoading) && (
                            <div className="py-8 text-center space-y-3">
                              <div className="inline-block relative w-8 h-8">
                                <span className="absolute inset-0 border-3 border-blue-600/25 rounded-full"></span>
                                <span className="absolute inset-0 border-3 border-t-blue-600 rounded-full animate-spin"></span>
                              </div>
                              <p className="text-[11px] text-blue-900 font-extrabold animate-pulse">
                                در حال تحلیل و کالبدشکافی کد خطا...
                              </p>
                            </div>
                          )}

                          {aiDiagnoseError && (
                            <div className="bg-rose-50 border border-rose-150 text-rose-900 p-4 rounded-2xl text-[11px]">
                              {aiDiagnoseError}
                            </div>
                          )}

                          {aiDiagnoseResult && (
                            <div className="bg-gradient-to-br from-indigo-950 to-blue-900 text-white rounded-2xl p-5 border border-indigo-900/50 shadow-md space-y-4 font-sans animate-in fade-in duration-200">
                              <div className="flex items-center justify-between border-b border-indigo-800/60 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-pulse-fast"></span>
                                  <h4 className="font-extrabold text-[11px] sm:text-xs text-cyan-300">🤖 گزارش عیب‌یابی مصلح فنی - تحلیل تعمیرگاهی هوشمند</h4>
                                </div>
                                <span className="bg-cyan-500/10 text-cyan-400 text-[8px] font-bold px-2 py-0.5 rounded-full border border-cyan-400/20">مدل جمینای ۳.۵</span>
                              </div>

                              {/* Top Specs Grid */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-right font-sans">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                  <span className="text-[10px] text-indigo-200 block mb-0.5">⚠️ میزان خطر (هشدارهای لازم):</span>
                                  <strong className={`text-xs ${
                                    aiDiagnoseResult.risk_level.includes('بحرانی') || aiDiagnoseResult.risk_level.includes('بالا') 
                                      ? 'text-rose-400 animate-pulse' 
                                      : 'text-emerald-400'
                                  }`}>
                                    {aiDiagnoseResult.risk_level}
                                  </strong>
                                </div>

                                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                                  <span className="text-[10px] text-indigo-200 block mb-0.5">⏱️ زمان تعمیر:</span>
                                  <strong className="text-xs text-white">{aiDiagnoseResult.repair_time}</strong>
                                </div>

                                <div className="bg-white/5 rounded-xl p-3 border border-white/5 col-span-2">
                                  <span className="text-[10px] text-indigo-200 block mb-0.5">🏠 امکان تعمیر در منزل:</span>
                                  <strong className="text-[11px] text-indigo-100 block truncate" title={aiDiagnoseResult.diy_possible}>
                                    {aiDiagnoseResult.diy_possible}
                                  </strong>
                                </div>
                              </div>

                              {/* Technician Requirement Alert - Warnings section */}
                              <div className={`p-4 rounded-xl border flex items-start gap-2.5 text-right ${
                                aiDiagnoseResult.technician_required 
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' 
                                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                              }`}>
                                <span className="text-sm mt-0.5">{aiDiagnoseResult.technician_required ? '⚠️' : '✅'}</span>
                                <div className="text-right">
                                  <h5 className="font-extrabold text-xs text-white/95">نیاز به حضور تکنسین متخصص (هشدارهای لازم):</h5>
                                  <p className="text-[10px] text-white/80 mt-0.5 leading-normal">
                                    {aiDiagnoseResult.technician_required 
                                      ? 'بله، به علت الزامات ایمنی و فنی، رفع این خطا مستلزم حضور کارشناس کارآزموده ایران ارور در محل است.' 
                                      : 'خیر، با ممارست و ابراز احتیاط، امکان عیب‌یابی ساده توسط شما در منزل مقدور است.'}
                                  </p>
                                </div>
                              </div>

                              {/* Suggested Causes - Causes of Error */}
                              <div className="space-y-1 text-right">
                                <span className="text-[10.5px] font-bold text-cyan-300 block">🔌 علت احتمالی خطا:</span>
                                <ul className="space-y-1 text-[11px] text-indigo-100 list-disc pr-4 font-sans leading-relaxed font-semibold">
                                  {aiDiagnoseResult.causes.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                              </div>

                              {/* Likely Spare Part */}
                              <div className="bg-indigo-900/40 p-3 rounded-xl border border-indigo-800/60 text-xs text-right">
                                <span className="text-[10.5px] text-indigo-200">🔍 قطعه احتمالی آسیب‌دیده:</span>
                                <strong className="text-cyan-200 font-bold mr-1 inline-block text-xs">{aiDiagnoseResult.likely_part}</strong>
                              </div>

                              {/* Detailed Analysis Output - AI-specific Analysis & Suggested Solution */}
                              <div className="bg-slate-950/20 p-4 rounded-xl border border-white/5 text-right">
                                <span className="text-[10.5px] font-black text-cyan-300 block mb-1">📝 تحلیل اختصاصی AI و راهحل پیشنهادی:</span>
                                <p className="text-indigo-50 text-xs leading-relaxed font-sans whitespace-pre-line font-medium">
                                  {aiDiagnoseResult.detailed_analysis}
                                </p>
                              </div>
                            </div>
                          )}

                          {aiError && (
                            <div className="bg-rose-50 border border-rose-150 text-rose-900 p-4 rounded-2xl text-xs space-y-2">
                              <p className="font-bold">بروز خطا در اتصال به سرویس هوش مصنوعی:</p>
                              <p className="text-slate-600 font-sans leading-relaxed">{aiError}</p>
                              <button 
                                type="button"
                                onClick={() => handleAiAnalysis(selectedError)}
                                className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-1.5 rounded-xl text-[10.5px] cursor-pointer font-bold transition-all inline-block shadow-xs"
                              >
                                ارتباط مجدد با سرور
                              </button>
                            </div>
                          )}

                          {aiResult && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-1 duration-200 text-right">
                              {/* AI Analysis Summary as part of AI-specific Analysis */}
                              <div className="bg-white/95 border border-slate-150 rounded-2xl p-4 shadow-2xs">
                                <h5 className="text-[11.5px] font-black text-indigo-950 mb-1.5 flex items-center gap-1">
                                  <span>📝 گزارش تحلیل اختصاصی AI:</span>
                                </h5>
                                <p className="text-slate-705 text-xs leading-relaxed font-sans whitespace-pre-line font-semibold">
                                  {aiResult.aiReason}
                                </p>
                              </div>

                              {/* Suggested available parts inside store - Suggested solution component */}
                              <div className="space-y-2.5">
                                <span className="text-[10.5px] font-black text-slate-700 block text-right">🛍️ قطعات یدکی منطبق شناسایی شده در بخش فروشگاه (راهحل پیشنهادی):</span>
                                
                                {aiResult.recommendedPartIds && aiResult.recommendedPartIds.filter(id => spareParts.some(p => p.id === id)).length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {spareParts
                                      .filter(part => aiResult.recommendedPartIds.includes(part.id))
                                      .map((part) => (
                                        <div key={part.id} className="bg-white hover:bg-slate-50 border border-slate-150 hover:border-blue-300 rounded-2xl p-3 flex gap-3 transition-all shadow-2xs relative">
                                          <img
                                            referrerPolicy="no-referrer"
                                            src={part.image}
                                            alt={part.name}
                                            className="w-14 h-14 rounded-xl object-cover bg-slate-100 flex-shrink-0 border border-slate-100"
                                          />
                                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                              <div className="flex items-center gap-1 mb-1">
                                                <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[8px] font-bold px-1.5 py-0.5 rounded-md">انبار اصلی</span>
                                                <span className="text-[9px] text-slate-400 font-mono">کد: {part.id}</span>
                                              </div>
                                              <h6 className="font-extrabold text-[10px] sm:text-[10.5px] text-slate-800 line-clamp-1 text-right" title={part.name}>{part.name}</h6>
                                            </div>
                                            <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-50">
                                              <span className="text-blue-600 font-sans font-extrabold text-[10.5px]">
                                                {part.price.toLocaleString('fa-IR')} تومان
                                              </span>
                                              <button
                                                type="button"
                                                onClick={() => onFilterParts(selectedError.category, selectedError.brand)}
                                                className="bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white transition-all text-[9px] font-extrabold px-2 py-1 rounded-lg cursor-pointer"
                                              >
                                                خرید فوری →
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-500 bg-white/70 p-3.5 rounded-2xl border border-slate-150 leading-relaxed font-sans text-right">
                                    قطعه مستقیم متناظری در دیتابیس فعلی پیدا نشد. برای عیب‌یابی دقیق‌تر یا تعویض قطعات جانبی می‌توانید با پشتیبانی کدیار24 تماس بگیرید یا درخواست اعزام تکنسین بسازید.
                                  </p>
                                )}
                              </div>

                              {/* Additional custom fittings/actions */}
                              {aiResult.additionalFittings && aiResult.additionalFittings.length > 0 && (
                                <div className="bg-slate-100/50 rounded-2xl p-3.5 border border-slate-150 text-right">
                                  <span className="text-[10.5px] font-black text-indigo-950 block mb-2">💡 سایر قطعات متمم یا اقدامات پیشنهادی:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {aiResult.additionalFittings.map((item, idx) => (
                                      <span key={idx} className="bg-white text-indigo-900 text-[10px] px-3 py-1.5 rounded-xl border border-slate-150 shadow-2xs font-semibold">
                                        🔍 {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {!hasDbContent && !hasAiContent && (
                        <div className="text-center py-6 bg-slate-50 border border-slate-100 rounded-3xl text-xs text-slate-500 font-sans font-semibold">
                          هیچ اطلاعات رسمی یا تحلیل هوش مصنوعی برای این خطا ثبت نشده است.
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Sidebar actions: order parts, request service, and tools needed */}
              <div className="lg:col-span-4 bg-slate-50/30 lg:border-r border-slate-150/80 p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-full overflow-hidden">
                {/* Book Technician Box */}
                <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs">نتوانستید مشکل را حل کنید؟</h4>
                    <p className="text-slate-300 text-[10px] leading-relaxed">
                      اگر ابزار لازم ندارید یا احساس خطر میکنید، کار را به تعمیرکار باسابقه و تایید شده بسپارید.
                    </p>
                  </div>

                  <button
                    id="detailed-book-repair-btn"
                    onClick={() => onBookRepair(selectedError)}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>درخواست اعزام سریع تعمیرکار ۲۴ساعته</span>
                  </button>
                  <div className="text-center text-[9px] text-slate-400">تضمین سرویس عیب‌یابی و ۱۸۰ روز گارانتی رسمی قطعات</div>
                </div>

                {/* Tools Box */}
                {selectedError.toolsNeeded && selectedError.toolsNeeded.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200/60 p-4">
                    <h4 className="font-bold text-xs text-slate-800 mb-3 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-slate-500" />
                      <span>ابزار موردنیاز رفع خطا</span>
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedError.toolsNeeded?.map((t, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] px-2.5 py-1 rounded-md border border-slate-200/50">
                          ⚙️ {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Related Parts List with Warehouse (Priority 1) & Affiliate Store (Priority 2) */}
                <div className="bg-white rounded-2xl border border-slate-200/60 p-4 space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-blue-600" />
                    <span>تامین و خرید قطعه جایگزین مرتبط با خطای «{selectedError.code}»</span>
                  </h4>
                  <p className="text-[10px] text-slate-400">اتصال هوشمند به انبار اختصاصی و فروشگاه‌های همکار افیلیت:</p>
                  
                  <div className="space-y-2">
                    {(() => {
                      const cleanStr = (s?: string) => s ? s.trim().toLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/\s+/g, ' ') : '';

                      // 1. Calculate Score for Warehouse Spare Parts (spareParts)
                      const getWarehousePartScore = (part: SparePart) => {
                        let score = 0;
                        if (selectedError.relatedParts?.includes(part.id)) score += 100;
                        
                        if (part.category && selectedError.category) {
                          const c1 = cleanStr(part.category);
                          const c2 = cleanStr(selectedError.category);
                          if (c1 === c2 || c1.includes(c2) || c2.includes(c1)) {
                            score += 30;
                          }
                        }
                        
                        if (selectedError.brand) {
                          const cleanErrBrand = cleanStr(selectedError.brand);
                          if (part.compatibility?.some(b => cleanStr(b) === cleanErrBrand || cleanStr(b).includes(cleanErrBrand) || cleanErrBrand.includes(cleanStr(b)))) {
                            score += 30;
                          }
                        }
                        
                        if (selectedError.model && selectedError.model !== 'عمومی' && selectedError.model !== 'کل مدل‌ها') {
                          const cleanErrModel = cleanStr(selectedError.model);
                          const partDesc = cleanStr(`${part.name} ${part.description || ''}`);
                          if (partDesc.includes(cleanErrModel)) {
                            score += 20;
                          }
                        }
                        
                        const errorText = `${selectedError.code} ${selectedError.title} ${selectedError.description || ''} ${(selectedError.causes || []).join(' ')} ${(selectedError.steps || []).join(' ')}`.toLowerCase();
                        const keyWords = ['برد', 'پمپ', 'شیر', 'سنسور', 'موتور', 'خازن', 'ترموستات', 'دیفراست', 'فن', 'جرقه', 'شیر برقی', 'کلید', 'پرشر', 'ntc', 'مبدل', 'گیج', 'فلومتر', 'فلوسوئیچ', 'گرمایش', 'حرارتی', 'انتیسی', 'المنت', 'دما'];
                        for (const kw of keyWords) {
                          if (errorText.includes(kw) && (part.name.toLowerCase().includes(kw) || (part.description || '').toLowerCase().includes(kw))) {
                            score += 25;
                          }
                        }
                        return score;
                      };

                      const matchingWarehouseParts = (spareParts || [])
                        .map(p => ({ part: p, score: getWarehousePartScore(p) }))
                        .filter(item => item.score >= 20 || selectedError.relatedParts?.includes(item.part.id))
                        .sort((a, b) => b.score - a.score)
                        .map(item => item.part);

                      // PRIORITY 1: Warehouse Parts Match
                      if (matchingWarehouseParts.length > 0) {
                        const topWarehouseParts = matchingWarehouseParts.slice(0, 3);
                        return (
                          <div className="space-y-2">
                            <div className="bg-emerald-50 border border-emerald-200/80 p-2 rounded-xl text-[10px] text-emerald-800 font-bold flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                موجود در انبار مرکزی (تامین مستقیم و فوری)
                              </span>
                              <span className="text-[9px] bg-emerald-100 px-2 py-0.5 rounded-md text-emerald-900 font-extrabold">{topWarehouseParts.length} قطعه انبار</span>
                            </div>
                            {topWarehouseParts.map((p) => (
                              <div key={p.id} className="border border-slate-150 hover:border-blue-400 bg-white p-3 rounded-2xl flex items-center gap-3 shadow-xs hover:shadow-md transition-all">
                                <img
                                  referrerPolicy="no-referrer"
                                  src={p.image || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f1f5f9'/><text x='50' y='55' font-size='28' text-anchor='middle'>🛠️</text></svg>"}
                                  alt={p.name}
                                  className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 border border-slate-100"
                                />
                                <div className="flex-1 min-w-0 text-right">
                                  <span className="font-extrabold text-xs text-slate-800 block truncate leading-snug">{p.name}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9.5px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">انبار اختصاصی</span>
                                    <span className="text-[11px] text-blue-600 font-sans font-black">{p.price ? p.price.toLocaleString('fa-IR') + ' تومان' : 'قیمت روز'}</span>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveCheckoutPartOfBottom(p);
                                    setBottomCheckoutStep('form');
                                    setBottomBuyerName('');
                                    setBottomBuyerPhone('');
                                    setBottomBuyerAddress('');
                                    setBottomCardNumber('');
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[10px] font-black px-3 py-2 rounded-xl transition-all cursor-pointer shadow-xs hover:shadow-md shrink-0 flex items-center gap-1"
                                >
                                  <span>سفارش از انبار</span>
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // PRIORITY 2: Fallback to Affiliate Store (affiliateProducts) if Warehouse is Empty or No Warehouse Match
                      const getAffiliateProductScore = (prod: any) => {
                        let score = 0;
                        if (selectedError.relatedParts?.includes(prod.id) || (selectedError as any).relatedAffiliateParts?.includes(prod.id)) score += 100;
                        
                        if (prod.category && selectedError.category) {
                          const c1 = cleanStr(prod.category);
                          const c2 = cleanStr(selectedError.category);
                          if (c1 === c2 || c1.includes(c2) || c2.includes(c1)) {
                            score += 30;
                          }
                        }
                        
                        if (selectedError.brand) {
                          const cleanErrBrand = cleanStr(selectedError.brand);
                          const prodBrand = cleanStr(prod.brand || '');
                          const prodDesc = cleanStr(`${prod.name} ${prod.description || ''} ${prod.model || ''}`);
                          if (prodBrand === cleanErrBrand || prodDesc.includes(cleanErrBrand) || cleanErrBrand.includes(prodBrand)) {
                            score += 30;
                          }
                        }
                        
                        if (selectedError.model && selectedError.model !== 'عمومی' && selectedError.model !== 'کل مدل‌ها') {
                          const cleanErrModel = cleanStr(selectedError.model);
                          const prodDesc = cleanStr(`${prod.name} ${prod.description || ''} ${prod.model || ''}`);
                          if (prodDesc.includes(cleanErrModel)) {
                            score += 20;
                          }
                        }
                        
                        const errorText = `${selectedError.code} ${selectedError.title} ${selectedError.description || ''} ${(selectedError.causes || []).join(' ')} ${(selectedError.steps || []).join(' ')}`.toLowerCase();
                        const keyWords = ['برد', 'پمپ', 'شیر', 'سنسور', 'موتور', 'خازن', 'ترموستات', 'دیفراست', 'فن', 'جرقه', 'شیر برقی', 'کلید', 'پرشر', 'ntc', 'مبدل', 'گیج', 'فلومتر', 'فلوسوئیچ', 'گرمایش', 'حرارتی', 'انتیسی', 'المنت', 'دما'];
                        for (const kw of keyWords) {
                          if (errorText.includes(kw) && (prod.name?.toLowerCase().includes(kw) || prod.description?.toLowerCase().includes(kw))) {
                            score += 25;
                          }
                        }
                        return score;
                      };

                      const matchingAffiliateProducts = (affiliateProducts || [])
                        .map(ap => ({ product: ap, score: getAffiliateProductScore(ap) }))
                        .filter(item => item.score >= 20 || selectedError.relatedParts?.includes(item.product.id))
                        .sort((a, b) => b.score - a.score)
                        .map(item => item.product);

                      if (matchingAffiliateProducts.length > 0) {
                        const topAffiliates = matchingAffiliateProducts.slice(0, 3);
                        return (
                          <div className="space-y-2">
                            <div className="bg-purple-50 border border-purple-200/80 p-2 rounded-xl text-[10px] text-purple-900 font-bold flex items-center justify-between">
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping"></span>
                                تامین از فروشگاه همکار (افیلیت معتبر کدیار۲۴)
                              </span>
                              <span className="text-[9px] bg-purple-100 px-2 py-0.5 rounded-md text-purple-900 font-extrabold">{topAffiliates.length} قطعه همکار</span>
                            </div>
                            {topAffiliates.map((aff) => (
                              <div key={aff.id} className="border border-purple-100 hover:border-purple-300 bg-white p-3 rounded-2xl flex items-center gap-3 shadow-xs hover:shadow-md transition-all">
                                <img
                                  referrerPolicy="no-referrer"
                                  src={aff.image || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f1f5f9'/><text x='50' y='55' font-size='28' text-anchor='middle'>⚙️</text></svg>"}
                                  alt={aff.name || aff.title || aff.brand}
                                  className="w-12 h-12 rounded-xl object-cover bg-slate-100 shrink-0 border border-purple-100"
                                />
                                <div className="flex-1 min-w-0 text-right">
                                  <span className="font-extrabold text-xs text-slate-800 block truncate leading-snug">{aff.name || aff.title || `${aff.brand} ${aff.model}`}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9.5px] text-purple-700 font-bold bg-purple-50 px-1.5 py-0.5 rounded">فروشگاه همکار (افیلیت)</span>
                                    <span className="text-[11px] text-purple-700 font-sans font-black">{aff.price ? Number(aff.price).toLocaleString('fa-IR') + ' تومان' : 'خرید آنلاين'}</span>
                                  </div>
                                </div>
                                <a
                                  href={aff.purchaseUrl || aff.link || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-[10px] font-black px-3 py-2 rounded-xl transition-all shadow-sm hover:shadow-md shrink-0 flex items-center gap-1"
                                >
                                  <span>خرید از فروشگاه همکار</span>
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // 3. Fallback when neither Warehouse nor Affiliate Store has matching parts
                      return (
                        <div className="border border-dashed border-slate-200 bg-slate-50/70 rounded-2xl p-4 text-center space-y-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-500 mx-auto flex items-center justify-center">
                            <Cpu className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-bold text-slate-700">قطعه یدکی ثبت‌شده برای این کد خطا در انبار/افیلیت موجود نیست</p>
                          <p className="text-[10.5px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                            مدیر سایت هنوز قطعه‌ای برای کد خطای «{selectedError.code}» ({selectedError.brand || ''} {selectedError.model || ''}) در انبار یا افیلیت قرار نداده است.
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => onBookRepair(selectedError)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                            >
                              درخواست اعزام تکنسین و استعلام قطعه
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Category Matching Products at the end of Troubleshooting Details */}
            {selectedError.category && (
              <div className="border-t border-slate-150 p-4 sm:p-6 lg:p-8 bg-slate-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 text-right font-sans">
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-xs text-slate-950 flex items-center gap-1.5 justify-start">
                      <Cpu className="w-4 h-4 text-blue-600" />
                      <span>قطعات یدکی و قطعات مصرفی مرتبط با دسته «{selectedError.category}»</span>
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      لیست جامع کلیه تجهیزات رسمی مربوط به {selectedError.category} در فروشگاه مرکزی کدیار24 با گارانتی اصالت کالا
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onFilterParts(selectedError.category, selectedError.brand);
                    }}
                    className="text-[10px] text-blue-700 bg-blue-50/80 hover:bg-blue-100 font-extrabold px-3 py-1.5 rounded-xl border border-blue-200 transition-all cursor-pointer whitespace-nowrap active:scale-95 text-center flex items-center gap-1 self-start sm:self-auto"
                  >
                    <span>نمایش همه دسته‌ها در فروشگاه</span>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>

                {(() => {
                  const matchingParts = spareParts.filter(part => {
                    return part.category === selectedError.category;
                  });

                  if (matchingParts.length === 0) {
                    return (
                      <div className="text-center py-6 text-xs text-slate-400 bg-white border border-slate-150 rounded-2xl">
                        قطعهٔ ثبت شده‌ای متمایز با این دسته‌بندی در انبار مرکزی یافت نشد.
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {matchingParts.map((part) => (
                        <div key={part.id} className="group bg-white border border-slate-150 hover:border-slate-300 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-2xs hover:shadow-xs relative">
                          <div className="flex gap-4">
                            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-150 border border-slate-150 shrink-0 select-none">
                              <img
                                referrerPolicy="no-referrer"
                                src={part.image}
                                alt={part.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                              />
                            </div>
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <div className="flex items-center gap-1">
                                <span className="bg-blue-50 text-blue-700 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md border border-blue-105 font-sans">
                                  {part.category}
                                </span>
                                <span className="text-slate-400 text-[9px] font-mono">کد کالا: {part.id}</span>
                              </div>
                              <h4 className="font-extrabold text-[11px] sm:text-xs text-slate-800 line-clamp-1 text-right">
                                {part.name}
                              </h4>
                              <p className="text-[10px] text-slate-500 leading-relaxed font-sans line-clamp-2 text-right">
                                {part.description}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 pt-3 border-t border-slate-105 flex items-center justify-between">
                            <div className="text-right">
                              <span className="text-[9px] text-slate-400 block font-normal">قیمت مصرف‌کننده:</span>
                              <span className="font-extrabold text-blue-600 text-xs font-sans">
                                {part.price.toLocaleString('fa-IR')}
                              </span>
                              <span className="text-slate-500 text-[10px] mr-1 font-bold">تومان</span>
                            </div>

                            <div className="flex items-center gap-1.5 font-sans">
                              {part.stock > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveCheckoutPartOfBottom(part);
                                    setBottomCheckoutStep('form');
                                    setBottomBuyerName('');
                                    setBottomBuyerPhone('');
                                    setBottomBuyerAddress('');
                                    setBottomCardNumber('');
                                  }}
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold px-3.5 py-2 rounded-xl cursor-pointer shadow-2xs hover:shadow transition-all inline-flex items-center gap-1"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>خرید فوری</span>
                                </button>
                              ) : (
                                <span className="text-rose-500 font-bold text-[10px] bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                                  اتمام موجودی
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      ) : (query.trim() || selectedCategory || selectedBrand || selectedModel) ? (
        /* Results Table and Catalog Layout + Common Problems Bento Dashboard */
        <div className="space-y-6 text-right font-sans">
          
          {/* CATEGORY: ERROR CODES (کد خطا) */}
          {searchType === 'error_code' && (
            <div className="bg-white rounded-2xl border border-slate-200/85 overflow-hidden animate-in fade-in duration-200">
              <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between text-xs font-bold text-slate-600">
                <span>کدهای خطای مطابق با فیلتر شما ({filteredCodes.length} مورد)</span>
                <span className="text-slate-400 font-medium">نتایج فوری آپلود دیتابیس ایران</span>
              </div>

              {filteredCodes.length === 0 ? (
                <div className="divide-y divide-slate-100">
                  <div className="text-center py-16 text-slate-400">
                    <AlertTriangle className="w-12 h-12 text-slate-200 mx-auto mb-3 stroke-[1.2]" />
                    <p className="text-xs">هیچ کد خطایی با پارامترهای بالا تطابق ندارد.</p>
                    <p className="text-[10px] mt-1">تعداد کاراکتر سرچ خود را تغییر داده یا برندهای دیگری همچون بوتان، ال‌جی، یا سامسونگ را بررسی و جستجو کنید.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 md:p-5 bg-slate-50/20">
                  {(showAllCodes ? filteredCodes : filteredCodes.slice(0, 6)).map((err) => (
                    <a
                      href={`/?code=${encodeURIComponent(err.code)}&brand=${encodeURIComponent(err.brand)}&category=${encodeURIComponent(err.category)}`}
                      onClick={(e) => {
                        e.preventDefault();
                        onSelectError(err);
                      }}
                      key={err.id}
                      className="p-4 rounded-2xl border border-slate-150 bg-white hover:bg-blue-50/5 hover:border-blue-300 hover:shadow-xs cursor-pointer transition-all duration-200 flex flex-col justify-between gap-4 h-full"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 font-mono font-bold text-xs sm:text-sm px-3 py-1.5 rounded-xl border flex items-center justify-center min-w-[55px] ${
                          err.hazardLevel === 'critical' || err.hazardLevel === 'high'
                            ? 'bg-red-600 text-white border-red-700 shadow-sm shadow-red-100'
                            : err.hazardLevel === 'medium'
                            ? 'bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-100'
                            : 'bg-emerald-600 text-white border-emerald-700 shadow-sm shadow-emerald-100'
                        }`}>
                          {err.code}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                            <span className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-md">
                              {err.brand}
                            </span>
                            <span className="bg-slate-150 text-slate-600 text-[9px] px-2 py-0.5 rounded-md">
                              {err.category}
                            </span>
                            <span className="text-[9px] text-slate-400 font-mono truncate">
                              {err.model}
                            </span>
                          </div>
                          <h3 className="font-bold text-xs sm:text-sm text-slate-800 mb-1 truncate text-right">
                            {!isPremium ? (
                              <span className="blur-[5px] select-none text-slate-400 inline-block">
                                {err.title}
                              </span>
                            ) : (
                              err.title
                            )}
                          </h3>
                          {isPremium && (
                            <p className="text-slate-500 text-[11px] leading-relaxed line-clamp-1 truncate font-sans text-right">
                              {err.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100/60">
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 block mb-0.5">شدت خطا:</span>
                          {err.hazardLevel === 'critical' ? (
                            <span className="text-rose-600 text-[10px] font-bold">⚠️ فوق بحرانی</span>
                          ) : err.hazardLevel === 'high' ? (
                            <span className="text-amber-600 text-[10px] font-bold">⚡ خطر جدی</span>
                          ) : (
                            <span className="text-slate-500 text-[10px]">عادی</span>
                          )}
                        </div>
                        
                        <button
                          id={`err-details-view-${err.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSelectError(err);
                          }}
                          className="bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 text-xs font-semibold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        >
                          <span>عیب‌یابی</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </a>
                  ))}
                </div>
              )}

              {filteredCodes.length > 6 && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center flex justify-center items-center">
                  <button
                    type="button"
                    id="toggle-all-codes"
                    onClick={() => setShowAllCodes(!showAllCodes)}
                    className="bg-white hover:bg-slate-50 text-blue-600 hover:text-blue-800 border border-slate-200 hover:border-slate-300 font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm transition-all active:scale-95 select-none"
                  >
                    {showAllCodes ? '🔽 نمایش کمتر' : `🔼 نمایش بیشتر (کل ${filteredCodes.length} نتیجه)`}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* CATEGORY: COMMON PROBLEMS (مشکلات شایع) */}
          {searchType === 'common_problem' && (
            <div className="bg-gradient-to-br from-indigo-650 to-blue-800 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-indigo-600/50 space-y-4 text-right animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/20 pb-3">
                <div className="space-y-0.5 text-right">
                  <div className="flex items-center gap-1.5 justify-start">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="font-extrabold text-[#38bdf8] text-[10px] bg-white/10 px-2 py-0.5 rounded">عیب‌یابی خودکار DIY</span>
                  </div>
                  <h3 className="font-extrabold text-sm sm:text-base flex items-center justify-start gap-1.5 hover:text-[#38bdf8] mt-1">
                    <span>🛠️ راهکارهای هوشمند گام‌به‌گام برای مشکلات شایع ({filteredProblems.length} مورد)</span>
                  </h3>
                </div>
                <span className="text-[10px] text-indigo-200 font-medium font-sans">تطابق هوشمند صوتی و متنی بهار خدمت</span>
              </div>

              {filteredProblems.length === 0 ? (
                <div className="text-center py-12 text-indigo-200">
                  <AlertTriangle className="w-12 h-12 text-indigo-300/40 mx-auto mb-3 stroke-[1.2]" />
                  <p className="text-xs font-bold">هیچ راهکار عیب‌یابی متناظری با پارامترهای فیلتر فعلی یافت نشد.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredProblems.map((prob) => {
                    const isExpanded = selectedProblem?.id === prob.id;
                    return (
                      <div 
                        key={prob.id} 
                        className={`bg-white text-slate-800 rounded-2xl p-4 transition-all duration-300 border shadow-xs flex flex-col justify-between text-right ${
                          isExpanded ? 'ring-4 ring-[#38bdf8]/40 border-indigo-400' : 'hover:bg-slate-50 border-slate-100 hover:border-slate-200'
                        }`}
                      >
                        <div className="space-y-2.5 text-right">
                          <div className="flex justify-between items-start gap-2">
                            <div className="text-right">
                              <span className="font-extrabold text-xs sm:text-sm text-indigo-950 block leading-relaxed text-right">{prob.title}</span>
                              {prob.code && (
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-bold inline-block mt-1">کد خطا: {prob.code}</span>
                              )}
                            </div>
                            <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-md flex-shrink-0">
                              {prob.category || 'عمومی'} ({prob.brand || 'عمومی'})
                            </span>
                          </div>

                          {/* Always show custom description or preview of causes if closed */}
                          {!isExpanded ? (
                            <div className="space-y-1">
                              {prob.description && (
                                <p className="text-[10.5px] text-slate-600 line-clamp-2 leading-relaxed text-right">{prob.description}</p>
                              )}
                              <p onClick={() => {
                                setSelectedProblem(prob);
                                prob.views = (prob.views || 0) + 1;
                              }} className="text-[10.5px] text-indigo-600 font-extrabold cursor-pointer hover:underline flex items-center gap-1">
                                <span>🔍 برای مشاهده راهنمای گام‌به‌گام و علل رویداد روی متن ضربه بزنید...</span>
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3 pt-2 text-[11px] leading-relaxed border-t border-slate-150 animate-in fade-in duration-200 text-right">
                              {prob.description && (
                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 text-[10.5px]">
                                  <span className="font-extrabold block text-slate-800 text-[10px] mb-0.5">📝 تشریح چالش:</span>
                                  {prob.description}
                                </div>
                              )}

                              {prob.model && prob.model !== 'عمومی' && (
                                <div className="text-[10px] text-slate-500 font-bold">
                                  📱 مدل‌های مشمول: <span className="text-slate-800">{prob.model}</span>
                                </div>
                              )}

                              <div className="bg-rose-50/50 p-2.5 rounded-xl border border-rose-100 space-y-1 text-right">
                                <span className="font-extrabold text-rose-800 block text-[10px] text-right">⚠️ علل شایع بروز این چالش:</span>
                                <ul className="list-disc list-inside space-y-0.5 pr-2.5 text-slate-705 text-right">
                                  {prob.causes.map((c, idx) => (
                                    <li key={idx} className="cursor-text text-right">{c}</li>
                                  ))}
                                </ul>
                              </div>

                              <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100 space-y-1 text-right">
                                <span className="font-extrabold text-emerald-800 block text-[10px] text-right">⚙️ مراحل اقدامات گام‌به‌گام برطرف‌سازی (DIY):</span>
                                <ol className="list-decimal list-inside space-y-0.5 pr-2.5 text-slate-755 text-right">
                                  {(prob.steps || prob.solutions || []).map((s, idx) => (
                                    <li key={idx} className="cursor-text text-right">{idx + 1}. {s}</li>
                                  ))}
                                </ol>
                              </div>

                              {prob.precautions && prob.precautions.length > 0 && (
                                <div className="bg-amber-50/65 p-2.5 rounded-xl border border-amber-100 space-y-1 text-right">
                                  <span className="font-extrabold text-amber-800 block text-[10px] text-right">🛡️ نکات پیشگیری و ایمنی حین تعمیر:</span>
                                  <ul className="list-disc list-inside space-y-0.5 pr-2.5 text-slate-700 text-right">
                                    {prob.precautions.map((p, idx) => (
                                      <li key={idx} className="cursor-text text-right">{p}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              
                              {prob.hazardLevel && prob.hazardLevel !== 'low' && (
                                <div className="text-[10px] font-extrabold text-rose-650 flex items-center gap-1">
                                  ⚠️ سطح خطر: 
                                  <span className="bg-rose-100 px-2 py-0.5 rounded text-[9px]">
                                    {prob.hazardLevel === 'critical' ? 'بحرانی - قطع فوری برق/گاز' : prob.hazardLevel === 'high' ? 'بالا - احتیاط جدی' : 'متوسط'}
                                  </span>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => handleSelectProblemAsErrorCode(prob)}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-indigo-200"
                              >
                                🖥️ بازکردن بورد تخصصی عیب‌یابی و رزرو تعمیرکار کدیار24
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-slate-100">
                          {prob.views ? (
                            <span className="text-[9px] text-slate-400 font-mono">⏱️ خوانده شده: {prob.views} مرتبه</span>
                          ) : (
                            <span className="text-[9px] text-slate-400">⏱️ مرجع عیب‌یابی بومی سریع</span>
                          )}
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSelectProblemAsErrorCode(prob)}
                              className="text-[9px] font-extrabold px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-all cursor-pointer"
                            >
                              🖥️ بورد کامل
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (isExpanded) {
                                  setSelectedProblem(null);
                                } else {
                                  setSelectedProblem(prob);
                                  prob.views = (prob.views || 0) + 1;
                                }
                              }}
                              className={`text-[9px] font-extrabold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                                isExpanded ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-white hover:bg-slate-800'
                              }`}
                            >
                              {isExpanded ? '🔼 بستن' : '📖 مشاهده سریع'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CATEGORY: DATASHEET (دیتاشیت و کاتالوگ فنی) */}
          {searchType === 'datasheet' && (
            <div className="bg-white rounded-2xl border border-slate-200/85 overflow-hidden text-right animate-in fade-in duration-200">
              <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>دفترچه‌های راهنما، دیتاشیت‌ها و کاتالوگ‌های فنی یافت شده ({filteredTechDocs.length} مورد)</span>
                </span>
                <span className="text-slate-400 font-medium">سرویس جستجوی آفلاین دیتاشیت کدیار24</span>
              </div>

              {filteredTechDocs.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <AlertTriangle className="w-12 h-12 text-slate-200 mx-auto mb-3 stroke-[1.2]" />
                  <p className="text-xs">هیچ دیتاشیت یا کاتالوگی با فیلتر شما تطابق ندارد.</p>
                  <p className="text-[10px] mt-1 font-sans">تعداد واژگان جستجو را کاهش دهید یا برند و دسته‌بندی دیگری انتخاب کنید.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 md:p-5 bg-slate-50/20">
                  {filteredTechDocs.map((doc) => {
                    const isPremiumDoc = ['Service Manual', 'Wiring Diagram', 'Schematic', 'PCB Layout', 'Exploded View'].includes(doc.type);
                    return (
                      <div key={doc.id} className="bg-white rounded-2xl p-4 border border-slate-150 shadow-xs hover:shadow-md hover:border-amber-300 transition-all duration-200 flex flex-col justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 flex-shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex flex-wrap gap-1 justify-end">
                              <span className="bg-slate-100 text-slate-600 text-[9px] px-2 py-0.5 rounded-md font-bold">
                                {doc.device.brand}
                              </span>
                              <span className="bg-amber-50 text-amber-700 text-[9px] px-2 py-0.5 rounded-md font-bold">
                                {doc.type}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <h4 className="font-extrabold text-[11px] sm:text-[11.5px] text-slate-900 leading-relaxed line-clamp-2">
                              {doc.title}
                            </h4>
                            <div className="flex items-center justify-start gap-3 mt-2 text-[9px] text-slate-400 font-mono">
                              <span>📁 حجم: {doc.fileSize}</span>
                              <span>⏱️ انتشار: {doc.uploadedAt}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100/85">
                          <div className="flex items-center gap-1">
                            {isPremiumDoc ? (
                              <span className="bg-amber-100 text-amber-850 text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-0.5">
                                <Lock className="w-3 h-3 text-amber-800" />
                                <span>ویژه کدیار24</span>
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded">
                                رایگان
                              </span>
                            )}
                          </div>
                          
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectError(doc.device.errorCode);
                                handleDocAction(doc, 'view');
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
                            >
                              <Eye className="w-3 h-3" />
                              <span>پیش‌نمایش</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDocAction(doc, 'download');
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
                            >
                              <Download className="w-3 h-3" />
                              <span>دانلود</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CATEGORY: DIAGRAM (نقشه و دیاگرام سیم‌کشی) */}
          {searchType === 'diagram' && (
            <div className="bg-white rounded-2xl border border-slate-200/85 overflow-hidden text-right animate-in fade-in duration-200">
              <div className="p-4 bg-slate-50 border-b border-slate-150 flex items-center justify-between text-xs font-bold text-slate-600">
                <span className="flex items-center gap-1">
                  <Cpu className="w-4 h-4 text-teal-600" />
                  <span>نقشه‌های فنی، شماتیک برد و دیاگرام سیم‌کشی یافت شده ({filteredTechDocs.length} مورد)</span>
                </span>
                <span className="text-slate-400 font-medium">سرویس جستجوی آفلاین نقشه‌ سیم‌کشی کدیار24</span>
              </div>

              {filteredTechDocs.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <AlertTriangle className="w-12 h-12 text-slate-200 mx-auto mb-3 stroke-[1.2]" />
                  <p className="text-xs">هیچ نقشه یا دیاگرام فنی با فیلتر شما تطابق ندارد.</p>
                  <p className="text-[10px] mt-1 font-sans">تعداد واژگان جستجو را کاهش دهید یا برند و دسته‌بندی دیگری انتخاب کنید.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 md:p-5 bg-slate-50/20">
                  {filteredTechDocs.map((doc) => {
                    const isPremiumDoc = ['Service Manual', 'Wiring Diagram', 'Schematic', 'PCB Layout', 'Exploded View'].includes(doc.type);
                    return (
                      <div key={doc.id} className="bg-white rounded-2xl p-4 border border-slate-150 shadow-xs hover:shadow-md hover:border-teal-300 transition-all duration-200 flex flex-col justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 flex-shrink-0">
                              <Cpu className="w-5 h-5" />
                            </div>
                            <div className="flex flex-wrap gap-1 justify-end">
                              <span className="bg-slate-100 text-slate-600 text-[9px] px-2 py-0.5 rounded-md font-bold">
                                {doc.device.brand}
                              </span>
                              <span className="bg-teal-50 text-teal-700 text-[9px] px-2 py-0.5 rounded-md font-bold">
                                {doc.type}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <h4 className="font-extrabold text-[11px] sm:text-[11.5px] text-slate-900 leading-relaxed line-clamp-2">
                              {doc.title}
                            </h4>
                            <div className="flex items-center justify-start gap-3 mt-2 text-[9px] text-slate-400 font-mono">
                              <span>📁 حجم: {doc.fileSize}</span>
                              <span>⏱️ انتشار: {doc.uploadedAt}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-100/85">
                          <div className="flex items-center gap-1">
                            {isPremiumDoc ? (
                              <span className="bg-amber-100 text-amber-850 text-[9px] font-black px-2 py-0.5 rounded flex items-center gap-0.5">
                                <Lock className="w-3 h-3 text-amber-800" />
                                <span>نقشه تخصصی</span>
                              </span>
                            ) : (
                              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded">
                                رایگان
                              </span>
                            )}
                          </div>
                          
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                onSelectError(doc.device.errorCode);
                                handleDocAction(doc, 'view');
                              }}
                              className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
                            >
                              <Eye className="w-3 h-3" />
                              <span>پیش‌نمایش</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDocAction(doc, 'download');
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-0.5"
                            >
                              <Download className="w-3 h-3" />
                              <span>دانلود</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      ) : (
        <div className="space-y-6 mt-6 animate-in fade-in duration-200 text-right font-sans">
          {/* Direct Appliance Category Quick Filters */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>دسترسی سریع به کدهای خطای دسته‌بندی‌های لوازم خانگی</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">جهت مشاهده کامل کدهای خطا، نقشه برد و راهنمای تعمیرات، یک دسته‌بندی را انتخاب کنید.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {categories.map((cat) => {
                const errorCount = errorCodes.filter(err => err.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      setCategoryInput(cat);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="group bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-2xl p-4 transition-all duration-200 text-right flex flex-col justify-between cursor-pointer space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center text-sm font-bold">
                        🛠️
                      </span>
                      <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                        {errorCount} ارور
                      </span>
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900 text-xs group-hover:text-blue-600 transition-colors">
                        عیب‌یابی {cat}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-bold block mt-1">مشاهده فهرست کامل ←</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>



          {/* Affiliate Partner Products Section (Only if available) */}
          {affiliateProducts && affiliateProducts.length > 0 && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-2xs">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span>قطعات یدکی همکاران</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {affiliateProducts.map((p) => (
                  <div key={p.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between text-right space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-start">
                        <span className="bg-slate-900 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md">
                          {p.brand}
                        </span>
                        <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          {p.category}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900">
                        {p.name || p.title || `${p.brand} ${p.model}`}
                      </h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2">
                        {p.description || `قطعه همکار مناسب دستگاه ${p.brand} مدل ${p.model}`}
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                      <span className="font-black text-xs text-blue-700 font-mono">
                        {p.price ? `${Number(p.price).toLocaleString('fa-IR')} تومان` : 'خرید آنلاین'}
                      </span>
                      {(p.purchaseUrl || p.link) && (
                        <a
                          href={p.purchaseUrl || p.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl cursor-pointer"
                        >
                          مشاهده و خرید
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Account Upgrade Modal for Search Results */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-right animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                <h3 className="font-black text-sm text-slate-900">🔒 قفل دسترسی به نقشه‌ها و اسناد ویژه</h3>
              </div>
              <button 
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedDocForUpgrade(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-slate-700">
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-[11px] leading-relaxed text-amber-900">
                مشاهده نقشه‌های الکترونیکی، شماتیک فنی مداری، طرح PCB و کتابچه کامل راهنمای عیب‌یابی (Service Manual) ماشین‌آلات صنعتی و لوازم خانگی به دلیل ماهیت تجاری و حق تکثیر کارخانه سازنده، منحصراً برای همکاران دارای <b>«عضویت ویژه کدیار۲۴»</b> باز است.
              </div>

              {selectedDocForUpgrade && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-right">
                  <div className="text-[10px] text-slate-400 font-bold">فایل قفل شده انتخاب شده:</div>
                  <div className="text-xs font-extrabold text-slate-750 mt-1">{selectedDocForUpgrade.title}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5 font-bold">نوع سند: {selectedDocForUpgrade.type} | حجم: {selectedDocForUpgrade.fileSize}</div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-black">✓</div>
                  <span>دسترسی به ۳۵,۰۰۰ نقشه سیم‌کشی و PCB لوازم خانگی</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-black">✓</div>
                  <span>دانلود بدون محدودیت کاتالوگ‌ها و Service Manual ها</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px] font-black">✓</div>
                  <span>پشتیبانی مستقیم تلفنی از مهندسین مشاور کارگاه مرکزی</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedDocForUpgrade(null);
                  if (onGoToDashboard) onGoToDashboard();
                }}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-black text-xs py-3 rounded-xl transition-all cursor-pointer text-center shadow-md flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-slate-900" />
                <span>خرید یا ارتقاء به پکیج همکاران کدیار۲۴</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedDocForUpgrade(null);
                }}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer text-center"
              >
                انصراف و بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real In-App Document Viewer Modal for Search Results */}
      {activeViewerDoc && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-[4px] z-[1000] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 text-slate-800 text-right dir-rtl">
          <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden font-sans text-right dir-rtl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 sm:p-5 text-white flex items-center justify-between shadow-md flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500/10 p-2 rounded-2xl text-amber-500">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-white">نمایشگر اختصاصی اسناد فنی کدیار۲۴</h4>
                  <p className="text-[10px] text-slate-300 font-medium mt-0.5">
                    سند فنی: <span className="text-amber-400 font-extrabold">{activeViewerDoc.title}</span> | دسته‌بندی: <span className="font-bold text-white">{activeViewerDoc.type}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveViewerDoc(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors active:scale-95 font-bold"
                title="بستن پنجره"
              >
                ✕
              </button>
            </div>

            {/* Toolbar */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between gap-3 text-[10px] font-extrabold text-slate-600 flex-wrap flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-md font-extrabold border border-slate-300">
                  سند رسمی PDF
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 font-mono text-[9.5px]">حجم: {activeViewerDoc.fileSize}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleDocAction(activeViewerDoc, 'download')}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-750 text-white px-3 py-1.5 rounded-xl text-[10px] font-black cursor-pointer transition-all active:scale-95 shadow-xs"
                >
                  <Download className="w-3 h-3 text-white" />
                  <span>دانلود مستقیم سند</span>
                </button>
              </div>
            </div>

            {/* Viewport content */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center min-h-[400px] max-h-[60vh]">
              <iframe
                src={activeViewerDoc.fileUrl}
                className="w-full h-[55vh] border-0 rounded-2xl bg-white shadow-sm"
                title={activeViewerDoc.title}
              />
            </div>
          </div>
        </div>
      )}

      {/* GORGEOUS VIDEO PLAYER OVERLAY MODAL */}
      {activeVideoUrl && (
        <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl w-full max-w-3xl animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70 text-right">
              <button
                type="button"
                onClick={() => setActiveVideoUrl(null)}
                className="text-slate-450 hover:text-white bg-slate-800/60 hover:bg-slate-800 p-2 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5 font-bold" />
              </button>
              <span className="text-xs sm:text-sm font-black text-slate-100 flex items-center gap-2">
                🎥 پخش آنلاین فیلم راهنمای عیب‌یابی لوازم خانگی
              </span>
            </div>

            {/* Video Content */}
            <div className="p-4 sm:p-6 space-y-4">
              {(() => {
                const isDirect = activeVideoUrl.endsWith('.mp4') || activeVideoUrl.endsWith('.webm') || activeVideoUrl.endsWith('.ogg') || activeVideoUrl.includes('/storage/') || activeVideoUrl.includes('.mp4?');
                
                let embedUrl = '';
                const aparatMatch = activeVideoUrl.match(/aparat\.com\/v\/([a-zA-Z0-9]+)/);
                const youtubeMatch = activeVideoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
                
                if (aparatMatch) {
                  embedUrl = `https://www.aparat.com/video/video/embed/videohash/${aparatMatch[1]}/vt/frame`;
                } else if (youtubeMatch) {
                  embedUrl = `https://www.youtube.com/embed/${youtubeMatch[1]}`;
                }

                if (isDirect) {
                  return (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-md">
                      <video
                        src={activeVideoUrl}
                        controls
                        className="w-full h-full"
                        autoPlay
                      />
                    </div>
                  );
                } else if (embedUrl) {
                  return (
                    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-md">
                      <iframe
                        src={embedUrl}
                        allowFullScreen
                        className="w-full h-full border-0"
                        title="Video Player"
                      />
                    </div>
                  );
                } else {
                  return (
                    <div className="bg-slate-800 border border-slate-700/60 rounded-2xl p-6 text-center space-y-4 max-w-md mx-auto">
                      <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                        <Play className="w-6 h-6 fill-current pr-0.5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-200">سیستم پخش خودکار این ویدیو آماده است</h4>
                        <p className="text-[10px] text-slate-400">به علت عدم تشخیص فرمت آدرس مستقیم یا بستر آپارات/یوتیوب، می‌توانید مستقیماً فیلم را در وب‌سایت منبع مشاهده کنید.</p>
                      </div>
                      <a
                        href={activeVideoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-750 text-white font-extrabold text-[11.1px] px-5 py-2.5 rounded-xl transition-all cursor-pointer mx-auto"
                      >
                        <span>باز کردن لینک مستقیم پخش ویدیو</span>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  );
                }
              })()}

              {/* Info/Open Link */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-right">
                <p className="text-[10px] text-slate-400 font-sans">
                  نکته: در صورت اختلال در لودینگ، می‌توانید فیلم را مستقیماً در پنجره جداگانه باز کنید.
                </p>
                <a
                  href={activeVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10.5px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 font-bold shrink-0 cursor-pointer"
                >
                  <span>ورود به آدرس اصلی فیلم</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM CHANNELS EXCLUSIVE PAYWALL DIALOG CONTAINER */}
      {showPremiumAlert !== 'none' && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full rounded-3xl border border-slate-100 shadow-2xl overflow-hidden text-right font-sans">
            {/* Header image/gradient bar with crown icon */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-white flex flex-col items-center text-center relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-2 text-white text-3xl shadow-lg border border-white/20">
                👑
              </div>
              <h3 className="font-black text-sm">دسترسی محرمانه به ویدیوهای عیب‌یابی</h3>
              <p className="text-[9.5px] text-amber-50/90 mt-1 leading-relaxed font-mono">EXCLUSIVE VIP VIDEO RESOURCE</p>
            </div>

            <div className="p-6 space-y-4">
              {showPremiumAlert === 'login' ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-805 leading-relaxed font-bold">
                    کاربر گرامی، فیلم‌های کارگاهی و ویدیوهای شایع رفع عیب کدهای خطا، متعلق به متخصصین برتر سامانه است.
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    جهت تماشای این فیلم‌ها، ابتدا باید یک حساب کاربری ثبت کرده یا وارد سیستم شوید و پلن پولی تهیه کنید.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-amber-950 leading-relaxed font-bold bg-amber-50/80 p-3 rounded-2xl border border-amber-100">
                    🎉 حساب کاربری شما فعال است، اما هنوز فاقد اشتراک ویژه طلایی هستید!
                  </p>
                  <p className="text-[11px] text-slate-550 leading-relaxed">
                    این ویدیو آموزشی منحصر به خریداران پکیج عضویت ویژه پولی کدیار24 است. برای فعال‌سازی کامل پنل و دسترسی نامحدود به ویدیوها، لطفاً اقدام به فعال‌سازی اشتراک پولی نمایید.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPremiumAlert('none');
                    if (onGoToDashboard) {
                      onGoToDashboard();
                    } else {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs py-3 px-4 rounded-xl transition-all cursor-pointer text-center shadow-md active:scale-[98%]"
                >
                  {showPremiumAlert === 'login' ? '🔑 ورود / ثبت‌نام سریع در سیستم' : '💳 مشاهده و تهیه پکیج‌های اشتراک ویژه'}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowPremiumAlert('none')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-[11px] py-2 px-4 rounded-lg transition-all cursor-pointer text-center"
                >
                  بعداً بررسی می‌کنم
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FREE ACCESS TRIAL EXCEEDED LIMIT MODAL */}
      {showFreeLimitModal && (
        <div className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white max-w-sm w-full rounded-2xl border border-rose-100 shadow-2xl overflow-hidden text-right font-sans">
            {/* Header with warning/lock icon */}
            <div className="bg-gradient-to-r from-red-500 to-rose-600 p-6 text-white flex flex-col items-center text-center relative">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-2 text-white text-3xl shadow-lg border border-white/20">
                🔒
              </div>
              <h3 className="font-extrabold text-sm">پایان اعتبار دسترسی رایگان</h3>
              <p className="text-[10px] text-rose-10/90 mt-1 leading-relaxed font-mono">DEMO FREE ACCESS EXCEEDED</p>
            </div>

            <div className="p-6 space-y-4 text-right">
              <div className="space-y-3">
                <p className="text-xs text-rose-800 leading-relaxed font-bold bg-rose-50 border border-rose-100 p-3 rounded-xl text-right">
                  {freeLimitReachedType === 'error_code' 
                    ? '⚠️ شما از حداکثر ۱ سهمیه مشاهده رایگان کدهای خطا استفاده کرده‌اید.'
                    : '⚠️ شما از حداکثر ۱ سهمیه مشاهده رایگان عیب‌یابی مشکلات متداول استفاده کرده‌اید.'}
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed text-right">
                  کاربر گرامی، دسترسی رایگان آزمایشی شما به اطلاعات تخصصی سامانه به اتمام رسیده است. جهت مشاهده بی‌مرز جزییات، راهکارهای قدم‌به‌قدم برای رفع خطا، مشاهده نقشه‌های فنی ویژه و عیب‌یابی کدهای نامحدود نیاز به فعال‌سازی پکیج عضویت ویژه دارید.
                </p>
                <p className="text-[10px] text-indigo-600 bg-indigo-50/50 p-2.5 rounded-lg leading-relaxed border border-indigo-100 text-right">
                  ℹ️ تمامی دوره‌های اشتراکی کدیار24 زمان‌دار هستند و بعد از طی شدن مدت معین (مانند یک ماه)، حساب شما مجدداً شامل ۱ دسترسی رایگان اولیه خواهد شد.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowFreeLimitModal(false);
                    if (onGoToDashboard) {
                      onGoToDashboard();
                    } else {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs py-3 px-4 rounded-xl transition-all cursor-pointer text-center shadow-md active:scale-[98%]"
                >
                  💳 خرید و ارتقای سریع به اشتراک ویژه‌
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowFreeLimitModal(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold text-[11px] py-2 px-4 rounded-lg transition-all cursor-pointer text-center"
                >
                  متوجه شدم (بعداً بررسی می‌کنم)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal for bottom related parts */}
      {activeCheckoutPartOfBottom && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-250 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-xs font-sans">درگاه پرداخت الکترونیک شتاب</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCheckoutPartOfBottom(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bottomCheckoutStep === 'form' ? (
              <form onSubmit={handleConfirmBottomPurchase} className="p-6 text-right font-sans">
                {/* Summary */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500">مورد خرید:</span>
                    <span className="font-bold text-slate-800">{activeCheckoutPartOfBottom.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500">دسته قطعه:</span>
                    <span className="text-slate-700">{activeCheckoutPartOfBottom.category}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-800">مبلغ نهایی پرداختی:</span>
                    <span className="font-bold text-blue-600 text-sm font-sans">
                      {activeCheckoutPartOfBottom.price.toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-605 text-[10px] font-bold mb-1 text-right">نام و نام خانوادگی خریدار *</label>
                    <input
                      required
                      type="text"
                      value={bottomBuyerName}
                      onChange={(e) => setBottomBuyerName(e.target.value)}
                      placeholder="مثال: محمد مهدوی"
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl outline-none focus:bg-white focus:border-blue-500 text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-605 text-[10px] font-bold mb-1 text-right">شماره تلفن همراه *</label>
                    <input
                      required
                      type="tel"
                      value={bottomBuyerPhone}
                      onChange={(e) => setBottomBuyerPhone(sanitizePhoneInput(e.target.value))}
                      placeholder="مثال: 09121234567"
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl outline-none focus:bg-white focus:border-blue-500 text-left font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-605 text-[10px] font-bold mb-1 text-right">آدرس دقیق تحویل قطعه *</label>
                    <textarea
                      required
                      value={bottomBuyerAddress}
                      onChange={(e) => setBottomBuyerAddress(e.target.value)}
                      placeholder="آدرس کامل پستی، کد پستی در صورت امکان"
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl outline-none focus:bg-white focus:border-blue-500 text-right"
                    />
                  </div>

                  {/* Card number simulation */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="text-[9px] text-slate-400 block mb-1 text-right">شماره کارت ۱۶ رقمی شتاب (دلخواه)</span>
                    <input
                      maxLength={19}
                      type="text"
                      value={bottomCardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const p = val.match(/.{1,4}/g) || [];
                        setBottomCardNumber(p.join('-'));
                      }}
                      placeholder="۶۰۳۷-۹۹۷۵-...."
                      className="w-full bg-white border border-slate-200 px-3 py-2 text-xs rounded-lg text-center tracking-widest font-mono select-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-[98%]"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>تایید پرداخت و ثبت نهایی سفارش قطعه</span>
                </button>
              </form>
            ) : (
              <div className="p-8 text-center bg-white font-sans">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 scale-105 animate-pulse">
                  <Check className="w-8 h-8 text-emerald-600 font-bold" />
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm mb-2">پرداخت شتاب با موفقیت انجام شد!</h4>
                <p className="text-slate-500 text-xs leading-relaxed mb-6">
                  سفارش خرید قطعه "{activeCheckoutPartOfBottom.name}" ثبت نهایی شد و فاکتور فروش برای شمارهٔ <span className="font-mono font-bold text-slate-800">{bottomBuyerPhone}</span> پیامک گردید.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveCheckoutPartOfBottom(null)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl cursor-pointer shadow-xs"
                >
                  بستن پنجره پرداخت
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 📱 DIGITAL BUSINESS CARD MODAL FOR CUSTOMERS */}
      {viewingTechCard && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md dir-rtl font-sans text-right animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden relative space-y-0">
            {/* Top Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-900 to-blue-900 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setViewingTechCard(null)}
                className="absolute top-4 left-4 text-slate-300 hover:text-white bg-white/10 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-3 pt-2">
                <div className="relative inline-block">
                  <img
                    src={viewingTechCard.avatarUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='35' r='20' fill='%23ccc'/><path d='M20 85c0-15 15-25 30-25s30 10 30 25z' fill='%23ccc'/></svg>"}
                    alt={viewingTechCard.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-amber-400 shadow-xl mx-auto"
                  />
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">{viewingTechCard.name}</h3>
                  <p className="text-xs text-amber-300 font-extrabold mt-0.5">کارشناس ارشد و تکنسین برتر کدیار۲۴</p>
                  <p className="text-[11px] text-slate-300 font-bold mt-1">📍 محدوده فعالیت: {viewingTechCard.activeLocation || 'سراسر کشور'}</p>
                </div>
              </div>
            </div>

            {/* Card Content Body */}
            <div className="p-6 space-y-5 bg-slate-50/50">
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 text-center bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs">
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold">امتیاز رضایت</span>
                  <span className="block text-xs font-black text-amber-600 mt-0.5">⭐ {viewingTechCard.rating || '5.0'}</span>
                </div>
                <div className="border-r border-l border-slate-100">
                  <span className="block text-[10px] text-slate-500 font-bold">سفارش موفق</span>
                  <span className="block text-xs font-black text-emerald-600 mt-0.5">{viewingTechCard.completedOrders || 0}+ کار</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 font-bold">ضمانت رسمی</span>
                  <span className="block text-xs font-black text-blue-600 mt-0.5">۱۸۰ روز</span>
                </div>
              </div>

              {/* Specs */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-700">
                  <span className="font-bold text-slate-500">تخصص‌های اصلی:</span>
                  <span className="font-black text-slate-900">{viewingTechCard.specialty?.join('، ') || 'تعمیرات لوازم خانگی و پکیج'}</span>
                </div>
                <div className="flex justify-between items-center text-slate-700 pt-2 border-t border-slate-100">
                  <span className="font-bold text-slate-500">پوشش خدمات:</span>
                  <span className="font-black text-emerald-600">پشتیبانی فوری و حضور در محل</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onBookRepair) {
                      if (selectedError) {
                        onBookRepair(selectedError);
                      } else {
                        onBookRepair({
                          id: 'tech_booking_' + viewingTechCard.id,
                          category: viewingTechCard.city || 'لوازم خانگی',
                          brand: 'کدیار24',
                          code: 'اعزام تکنسین',
                          title: `درخواست اعزام تکنسین (${viewingTechCard.name})`,
                          reason: 'درخواست مستقیم اعزام کارشناس به محل',
                          solution: 'اعزام کارشناس جهت عیب‌یابی و تعمیر',
                          technicianId: viewingTechCard.id,
                          technicianName: viewingTechCard.name,
                          technicianPhone: viewingTechCard.phone
                        } as any);
                      }
                    }
                    setViewingTechCard(null);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-md cursor-pointer text-center"
                >
                  📅 رزرو آنلاین درخواست تعمیر با این تکنسین
                </button>

                {viewingTechCard.phone && (
                  <a
                    href={`tel:${viewingTechCard.phone}`}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-2xl transition-all shadow-md cursor-pointer text-center block"
                  >
                    📞 تماس مستقیم با کارشناس ({viewingTechCard.phone})
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
