import React, { useState } from 'react';
import { Technician } from '../types';
import { IRAN_CITIES, APPLIANCE_CATEGORIES } from '../data';
import { User, Lock, Phone, MapPin, Check, Briefcase, FileText, UploadCloud, AlertCircle, Eye, EyeOff, Sparkles, Clock, X, Plus, Search, ChevronDown } from 'lucide-react';
import { sanitizePhoneInput, validateIranianMobile } from './validation';

interface TechnicianAuthProps {
  technicians: Technician[];
  loggedInTech?: Technician | null;
  onRegister: (newTech: Technician) => void;
  onLoginSuccess: (techId: string) => void;
  onLogout?: () => void;
  onResubmitDocs?: (techId: string, docs: string[]) => void;
  triggerNotification: (title: string, text: string, type?: 'info' | 'success' | 'warning' | 'error' | 'sms') => void;
  citiesList?: Array<{ name: string; regions: string[] }>;
  categoriesList?: string[];
}

export const TechnicianAuth: React.FC<TechnicianAuthProps> = ({
  technicians,
  loggedInTech = null,
  onRegister,
  onLoginSuccess,
  onLogout,
  onResubmitDocs,
  triggerNotification,
  citiesList,
  categoriesList
}) => {
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Dynamic base lists loaded from prop or localStorage with static fallback
  const cities = React.useMemo(() => {
    if (citiesList && citiesList.length > 0) return citiesList;
    const saved = localStorage.getItem('ir_cities');
    return saved ? (JSON.parse(saved) as {name: string, regions: string[]}[]) : [];
  }, [citiesList]);

  const categories = React.useMemo(() => {
    if (categoriesList && categoriesList.length > 0) return categoriesList;
    const saved = localStorage.getItem('ir_categories');
    return saved ? (JSON.parse(saved) as string[]) : [];
  }, [categoriesList]);

  // Login Form State
  const [loginPhone, setLoginPhone] = useState<string>('');
  const [loginPhoneError, setLoginPhoneError] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Register Form State
  const [regName, setRegName] = useState<string>('');
  const [regPhone, setRegPhone] = useState<string>('');
  const [regPhoneError, setRegPhoneError] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regCity, setRegCity] = useState<string>('');
  const [regRegion, setRegRegion] = useState<string>('');

  React.useEffect(() => {
    if (cities && cities.length > 0) {
      if (!regCity || !cities.some(c => c.name === regCity)) {
        setRegCity(cities[0].name);
      }
    } else {
      setRegCity('');
    }
  }, [cities, regCity]);
  const [regSpecialties, setRegSpecialties] = useState<string[]>([]);
  const [specSearchQuery, setSpecSearchQuery] = useState<string>('');
  const [isSpecDropdownOpen, setIsSpecDropdownOpen] = useState<boolean>(false);
  const [regDocs, setRegDocs] = useState<string[]>([]);
  const [uploadedDocName, setUploadedDocName] = useState<string>('');
  const [selectedFileObj, setSelectedFileObj] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [registerError, setRegisterError] = useState<string>('');
  const [registerSuccess, setRegisterSuccess] = useState<boolean>(false);

  // File input refs for opening file picker directly when clicking document cards
  const regFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const profileFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Forgot Password States for Technician
  const [isForgotMode, setIsForgotMode] = useState<boolean>(false);
  const [forgotPhone, setForgotPhone] = useState<string>('');
  const [forgotOtp, setForgotOtp] = useState<string>('');
  const [forgotNewPassword, setForgotNewPassword] = useState<string>('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotLoading, setForgotLoading] = useState<boolean>(false);
  const [simulatedOtpCode, setSimulatedOtpCode] = useState<string>('');

  // Normalize numbers to look clean (converting En to Fa or vice versa for comparisons)
  const toFarsiNumber = (n: string) => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return n.replace(/[0-9]/g, (w) => farsiDigits[parseInt(w)]);
  };

  const toEnglishNumber = (n: string) => {
    if (!n) return '';
    let str = n.toString().trim();
    // Convert Arabic and Persian numbers to English characters using unicode range matching
    str = str.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, (c) => {
      return (c.charCodeAt(0) & 0xf).toString();
    });
    // Remove non-digits completely to ignore spaces, symbols or letters
    str = str.replace(/\D/g, '');
    // Standardize 98xxxxxxxxxx to 0xxxxxxxxxx
    if (str.startsWith('98') && str.length > 10) {
      str = '0' + str.slice(2);
    }
    // Standardize 9xxxxxxxxx to 09xxxxxxxxx
    if (str.length === 10 && !str.startsWith('0')) {
      str = '0' + str;
    }
    return str;
  };

  const handleTechForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPhone) {
      triggerNotification('شماره همراه', 'لطفاً شماره همراه خود را وارد کنید.', 'warning');
      return;
    }
    const checkPhone = validateIranianMobile(forgotPhone);
    if (!checkPhone.isValid) {
      triggerNotification('خطا', checkPhone.error || 'شماره همراه وارد شده صحیح نیست.', 'warning');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: toEnglishNumber(forgotPhone), role: 'technician' })
      });
      const data = await response.json();
      if (!response.ok || data.status !== 'ok') {
        triggerNotification('خطا', data.error || 'ارسال کد تایید با خطا مواجه شد.', 'error');
        return;
      }

      setSimulatedOtpCode(data.otp || '');
      setForgotStep(2);
      triggerNotification('کد تایید صادر شد', `کد تایید بازیابی کلمه عبور ارسال شد. ${data.otp ? `کد تایید دمو: ${data.otp}` : ''}`, 'sms');
    } catch (err) {
      triggerNotification('خطا در ارتباط', 'خطا در برقراری ارتباط با سرور رخ داد.', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleTechForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp) {
      triggerNotification('کد تایید', 'لطفاً کد تایید پیامکی را وارد کنید.', 'warning');
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 4) {
      triggerNotification('رمز جدید', 'رمز عبور حداقل باید ۴ کاراکتر باشد.', 'warning');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: toEnglishNumber(forgotPhone),
          otp: forgotOtp,
          newPassword: forgotNewPassword,
          role: 'technician'
        })
      });
      const data = await response.json();
      if (!response.ok || data.status !== 'ok') {
        triggerNotification('خطا', data.error || 'تغییر رمز عبور با خطا مواجه شد.', 'error');
        return;
      }

      triggerNotification('تغییر موفقیت‌آمیز رمز', 'رمز عبور شما با موفقیت تغییر یافت. هم‌اکنون لاگین کنید.', 'success');
      setIsForgotMode(false);
      setForgotStep(1);
      setForgotPhone('');
      setForgotOtp('');
      setForgotNewPassword('');
    } catch (err) {
      triggerNotification('خطای غیرمنتظره', 'خطایی در ثبت رمز عبور جدید رخ داد.', 'error');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginPhoneError('');

    if (!loginPhone || !loginPassword) {
      setLoginError('لطفاً شماره موبایل و کلمه عبور را وارد نمایید.');
      return;
    }

    const checkPhone = validateIranianMobile(loginPhone);
    if (!checkPhone.isValid) {
      setLoginPhoneError(checkPhone.error || '');
      setLoginError(checkPhone.error || 'خطا در قالب شماره همراه.');
      return;
    }

    const inputPhoneEng = toEnglishNumber(loginPhone);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: inputPhoneEng, password: loginPassword })
      });
      const data = await response.json();

      if (!response.ok || data.status !== 'ok') {
        setLoginError(data.error || 'کلمه عبور یا شماره همراه نادرست است.');
        return;
      }

      // Check if they are technician or admin
      const loggedUser = data.user;
      if (loggedUser.role !== 'technician' && loggedUser.role !== 'admin' && !loggedUser.is_super_admin) {
        setLoginError('خطا: حساب شما به عنوان تکنسین ثبت نشده است.');
        return;
      }

      // Find matching technician profile by phone
      let foundTech = technicians.find((t) => {
        return toEnglishNumber(t.phone) === inputPhoneEng;
      });

      if (!foundTech) {
        // Dynamically create a technician profile if user exists but has no custom profile
        foundTech = {
          id: `tech_${loggedUser.id}`,
          name: loggedUser.full_name || 'تکنسین گرامی',
          phone: inputPhoneEng,
          password: loginPassword,
          specialty: regSpecialties.length > 0 ? regSpecialties : ['تعمیرات عمومی'],
          rating: 5.0,
          completedOrders: 0,
          balance: 0,
          isVerified: true,
          activeLocation: loggedUser.city || 'تهران',
          documents: [],
          avatarUrl: ""
        };
        onRegister(foundTech);
      }

      // Success
      if (!foundTech.isVerified) {
        if (!foundTech.documents || foundTech.documents.length === 0) {
          triggerNotification('⚠️ تعلیق همکاری موقت', `جناب ${foundTech.name}، قرارداد همکاری شما معلق شده است. لطفاً جهت فعال‌سازی مجدد مدارک خود را بارگذاری و ارسال کنید.`, 'error');
        } else {
          triggerNotification(' پرونده در انتظار تایید', `جناب ${foundTech.name}، تقاضای شما ثبت شده و منتظر بررسی و تایید مدارک مقتضی توسط دفتر مدیریت است.`, 'info');
        }
      } else {
        triggerNotification('ورود موفق تکنسین', `جناب ${foundTech.name} خوش آمدید. کارتابل فنی شما لود گردید.`, 'success');
      }

      // Sync user session id with the page context
      localStorage.setItem('session_user_id', loggedUser.id);
      onLoginSuccess(foundTech.id);

    } catch (err) {
      console.error(err);
      setLoginError('خطایی در ارتباط با سرور رخ داده است. مجدداً تلاش کنید.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');
    setRegPhoneError('');

    if (!regName || !regPhone || !regPassword) {
      setRegisterError('لطفاً تمامی فیلدهای ستاره‌دار عمومی را تکمیل کنید.');
      return;
    }

    const checkPhone = validateIranianMobile(regPhone);
    if (!checkPhone.isValid) {
      setRegPhoneError(checkPhone.error || '');
      setRegisterError(checkPhone.error || 'خطا در قالب شماره همراه ثبت‌نام.');
      return;
    }

    if (regSpecialties.length === 0) {
      setRegisterError('لطفاً حداقل یک مهارت فنی از لیست انتخاب نمایید.');
      return;
    }

    // Deduplicate documents by name
    const uniqueDocsMap = new Map<string, string>();
    regDocs.forEach(d => {
      let dName = d;
      try {
        if (d.startsWith('{')) dName = JSON.parse(d).name || d;
      } catch (e) {}
      if (dName.trim()) {
        uniqueDocsMap.set(dName.trim().toLowerCase(), d);
      }
    });

    // Automatically attach currently selected/typed file if not explicitly uploaded first
    if (uploadedDocName.trim()) {
      const cleanTitle = uploadedDocName.trim().toLowerCase();
      if (!uniqueDocsMap.has(cleanTitle)) {
        let fileDataUrl = '';
        let fileType = 'image/svg+xml';
        
        if (selectedFileObj) {
          try {
            fileDataUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(selectedFileObj);
            });
            fileType = selectedFileObj.type;
          } catch (err) {
            console.error('[TechnicianAuth] File reader error:', err);
          }
        } else {
          fileDataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23f8fafc"/><rect x="25" y="25" width="750" height="550" rx="30" fill="none" stroke="%233b82f6" stroke-width="6" stroke-dasharray="15 10"/><text x="50%" y="30%" font-family="sans-serif" font-size="28" font-weight="extrabold" fill="%231e3a8a" dominant-baseline="middle" text-anchor="middle">تأییدیه سند فنی و مدارک هویت صنف</text><text x="50%" y="45%" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23475569" dominant-baseline="middle" text-anchor="middle">نام مدرک: ${uploadedDocName}</text><text x="50%" y="55%" font-family="sans-serif" font-size="16" fill="%23059669" dominant-baseline="middle" text-anchor="middle">بررسی و آماده ممیزی در سامانه ایران ارور</text><circle cx="400" cy="450" r="40" fill="%2310b981" fill-opacity="0.15"/><path d="M380 450 l15 15 l30 -30" fill="none" stroke="%2310b981" stroke-width="6" stroke-linecap="round"/></svg>`;
        }
        
        if (fileDataUrl) {
          const docPayload = JSON.stringify({
            name: uploadedDocName,
            fileData: fileDataUrl,
            fileType: fileType
          });
          uniqueDocsMap.set(cleanTitle, docPayload);
        }
      }
    }

    let finalDocs = Array.from(uniqueDocsMap.values());

    const inputPhoneEng = toEnglishNumber(regPhone);

    try {
      // Call server registration endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: inputPhoneEng,
          password: regPassword,
          full_name: regName.trim(),
          city: regCity,
          specialty: regSpecialties,
          specialties: regSpecialties,
          documents: finalDocs,
          role: 'technician'
        })
      });
      const data = await response.json();

      if (!response.ok || data.status !== 'ok') {
        const errMsg = data.error || 'ثبت‌نام آنلاین تکنسین در پایگاه داده مرکزی با خطا مواجه شد.';
        setRegisterError(errMsg);
        if (errMsg.includes('قبلا') || errMsg.includes('تکراری') || response.status === 409) {
          triggerNotification('ثبت‌نام شده‌اید', 'این شماره همراه قبلاً در سامانه ثبت شده است. لطفاً وارد شوید.', 'info');
          setLoginPhone(regPhone);
          setIsLoginMode(true);
        } else {
          triggerNotification('خطا در ثبت‌نام', errMsg, 'error');
        }
        return;
      }

      // Create a new Technician object with pending verification status
      const newTech: Technician = {
        id: `tech_${data.user.id}`,
        name: regName.trim(),
        phone: inputPhoneEng,
        password: regPassword.trim(),
        specialty: regSpecialties,
        rating: 5.0,
        completedOrders: 0,
        balance: 0,
        isVerified: false, // Must be approved by manager
        activeLocation: `${regCity}، ${regRegion || 'تمام نقاط'}`,
        documents: finalDocs,
        avatarUrl: ""
      };

      onRegister(newTech);
      setRegisterSuccess(true);
      triggerNotification('درخواست همکاری تکنسین', `ثبت‌نام اولیه‌ی ${regName} با موفقیت انجام شد. مدارک جهت بررسی به مدیریت ارسال گردید.`, 'success');
      
      // Auto login after registered
      setTimeout(() => {
        localStorage.setItem('session_user_id', data.user.id);
        onLoginSuccess(newTech.id);
      }, 2000);

    } catch (err) {
      console.error(err);
      setRegisterError('خطا در برقراری ارتباط با پایگاه داده ثبت‌نام تکنسین‌ها.');
    }
  };

  const handleToggleSpecialty = (spec: string) => {
    if (regSpecialties.includes(spec)) {
      setRegSpecialties(regSpecialties.filter(s => s !== spec));
    } else {
      setRegSpecialties([...regSpecialties, spec]);
    }
  };

  const handleMockUploadFile = () => {
    if (!uploadedDocName.trim()) {
      triggerNotification('کاستی در اطلاعات', 'لطفاً نام یا شرح مدرکی که می‌خواهید بارگذاری کنید را در کادر بنویسید یا از دکمه‌های درج سریع زیر استفاده کنید.', 'warning');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const proceedWithJsonFile = (fileDataUrl: string, fileType: string) => {
      const docPayload = JSON.stringify({
        name: uploadedDocName,
        fileData: fileDataUrl,
        fileType: fileType
      });

      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setRegDocs(prevDocs => {
                const targetName = uploadedDocName.trim().toLowerCase();
                const filtered = prevDocs.filter(d => {
                  let dName = d;
                  try {
                    if (d.startsWith('{')) dName = JSON.parse(d).name || '';
                  } catch(e) {}
                  return dName.trim().toLowerCase() !== targetName;
                });
                return [...filtered, docPayload];
              });
              setUploadedDocName('');
              setSelectedFileObj(null);
              setIsUploading(false);
              triggerNotification('آپلود موفقیت‌آمیز', `سند "${uploadedDocName}" با موفقیت پیوست شد.`, 'success');
            }, 350);
            return 100;
          }
          return prev + 20;
        });
      }, 100);
    };

    if (selectedFileObj) {
      const reader = new FileReader();
      reader.onloadend = () => {
        proceedWithJsonFile(reader.result as string, selectedFileObj.type);
      };
      reader.readAsDataURL(selectedFileObj);
    } else {
      setIsUploading(false);
      setUploadProgress(0);
      triggerNotification('انتخاب مدرک لازم است', `لطفاً فایل مدرک «${uploadedDocName}» را از روی دستگاه خود انتخاب کنید. برای این کار روی آیکون ابر ☁️ داخل کادر ضربه بزنید.`, 'warning');
    }
  };

  const handleSelectQuickDocTitle = (docName: string, isProfileUpdate = false) => {
    setUploadedDocName(docName);
    setSelectedFileObj(null); // Reset previous file object so user selects a new file for this document
    
    // Direct file picker trigger
    if (isProfileUpdate && profileFileInputRef.current) {
      profileFileInputRef.current.click();
    } else if (regFileInputRef.current) {
      regFileInputRef.current.click();
    } else {
      const element = document.getElementById('simulated-doc-title-input');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.focus();
      }
    }
  };

  const handleQuickAddDoc = (docTitle: string) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    // We can also serialize these quick add documents as standard JSON!
    const dummySvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%23f8fafc"/><rect x="25" y="25" width="750" height="550" rx="30" fill="none" stroke="%233b82f6" stroke-width="6" stroke-dasharray="15 10"/><text x="50%" y="30%" font-family="sans-serif" font-size="28" font-weight="extrabold" fill="%231e3a8a" dominant-baseline="middle" text-anchor="middle">پیوست ممیزی سریع صنف</text><text x="50%" y="45%" font-family="sans-serif" font-size="18" font-weight="bold" fill="%23475569" dominant-baseline="middle" text-anchor="middle">سند: ${docTitle}</text><text x="50%" y="55%" font-family="sans-serif" font-size="16" fill="%23059669" dominant-baseline="middle" text-anchor="middle">وضعیت: تایید صلاحیت در دست ممیزی اداری</text><circle cx="400" cy="450" r="40" fill="%232563eb" fill-opacity="0.15"/><path d="M380 450 l15 15 l30 -30" fill="none" stroke="%232563eb" stroke-width="6" stroke-linecap="round"/></svg>`;
    const docPayload = JSON.stringify({
      name: docTitle,
      fileData: dummySvg,
      fileType: 'image/svg+xml'
    });

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setRegDocs(prevDocs => {
              const alreadyExists = prevDocs.some(d => {
                if (d.startsWith('{')) {
                  try {
                    return JSON.parse(d).name === docTitle;
                  } catch(e) {}
                }
                return d === docTitle;
              });
              if (alreadyExists) return prevDocs;
              return [...prevDocs, docPayload];
            });
            setIsUploading(false);
            triggerNotification('آپلود موفقیت‌آمیز', `سند "${docTitle}" به ملحقات پیوست گردید.`, 'success');
          }, 350);
          return 100;
        }
        return prev + 25;
      });
    }, 80);
  };

  const handleFileChangeSimulate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const fileName = file.name || '';
      const dotIdx = fileName.lastIndexOf('.');
      const ext = dotIdx > -1 ? fileName.substring(dotIdx + 1).toLowerCase() : '';
      
      const fileTypeLower = (file.type || '').toLowerCase();
      const isImg = fileTypeLower.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'].includes(ext);
      const isPdf = fileTypeLower === 'application/pdf' || ext === 'pdf';
      const isDoc = fileTypeLower.includes('document') || ['txt', 'doc', 'docx'].includes(ext);

      if (!isImg && !isPdf && !isDoc) {
        triggerNotification('فرمت فایل نامعتبر', 'لطفاً تصویر (JPG/PNG/WEBP/HEIC) یا سند (PDF/DOC) معتبر انتخاب کنید.', 'warning');
        return;
      }
      setSelectedFileObj(file);
      // Preserve document title if selected via quick card, otherwise use file name
      setUploadedDocName(prev => (prev.trim() ? prev : file.name));
      triggerNotification('فایل انتخاب شد', `فایل "${file.name}" آماده بارگذاری است. اکنون دکمه آپلود را جهت بررسی مدیر بفشارید.`, 'info');
    }
  };

  if (loggedInTech && !loggedInTech.isVerified) {
    // Is it suspended or newly registered?
    // If they have no documents, or they were suspended, they must resubmit.
    const isSuspended = !loggedInTech.documents || loggedInTech.documents.length === 0;

    return (
      <div className="bg-slate-50 rounded-2xl border border-slate-200/90 shadow-xl p-4 sm:p-8 max-w-xl mx-auto my-6 font-sans">
        <div className="text-center mb-6">
          <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-3 border shadow-sm ${
            isSuspended ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200 shadow-2xs'
          }`}>
            {isSuspended ? <AlertCircle className="w-7 h-7 animate-pulse" /> : <Clock className="w-7 h-7" />}
          </div>
          <h2 className="text-md sm:text-lg font-black text-slate-800">
            {isSuspended ? '⚠️ وضعیت حساب همکاری شما: تعلیق موقت فعالیت' : '⏳ وضعیت پرونده: در انتظار تایید صلاحیت صنف'}
          </h2>
          <p className="text-xs text-slate-450 mt-2.5 leading-relaxed font-semibold">
            {isSuspended 
              ? `جناب آقای ${loggedInTech.name}، قرارداد همکاری شما به دلیل تعلیق موقت توسط دفتر مدیریت متوقف شده است. جهت ارزیابی مجدد صلاحیت شغلی و پایان محدودیت، مقتضی است مدارک معتبر جدید خود را در زیر ارسال فرمایید.`
              : `جناب آقای ${loggedInTech.name}، مدارک و فرم تقاضای همکاری شما در صف ارزیابی علمی و مهارتی دفتر مدیریت مرکزی قرار دارد. همکاران کارگاه خدمات ظرف ۲۴ ساعت آینده پرونده را تایید خواهند نمود.`
            }
          </p>
        </div>

        {/* Action center for Resubmitting documents */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>پیوست‌های تایید صلاحیت شما ({loggedInTech.documents?.length || 0} مدرک)</span>
            </span>
            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-lg border ${
              isSuspended ? 'bg-red-50 text-red-700 border-red-150' : 'bg-amber-50 text-amber-700 border-amber-150'
            }`}>
              {isSuspended ? 'محدود شده و معلق' : 'در حال بررسی تخصصی'}
            </span>
          </div>

          {loggedInTech.documents && loggedInTech.documents.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 py-1">
              {loggedInTech.documents.map((doc, idx) => {
                let docName = doc;
                try {
                  if (doc.startsWith('{')) {
                    docName = JSON.parse(doc).name || 'مدرک بدون نام';
                  }
                } catch (e) {}
                return (
                  <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] py-1 px-2.5 rounded-lg font-bold flex items-center gap-1 shadow-xs animate-in zoom-in-95">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    <span>{docName}</span>
                  </span>
                );
              })}
            </div>
          ) : (
            <div className="text-[10px] text-slate-450 font-bold py-4 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              🔴 هیچ پرونده یا مدرک فعالی ثبت نشده است. جهت بررسی مجدد صلاحیت، حداقل یک مدرک معتبر در بخش زیر ضمیمه کنید.
            </div>
          )}

          {/* Display Technician Specialty Section to handle "تخصص تکنسین در گوشی نمایش نمیداد" */}
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-blue-600" />
              <span>زمینه‌های تخصص و مهارت‌های انتخابی شما:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {loggedInTech.specialty && loggedInTech.specialty.length > 0 ? (
                loggedInTech.specialty.map((spec) => (
                  <span key={spec} className="bg-slate-100 text-slate-700 text-[10px] py-1 px-2.5 rounded-lg font-bold border border-slate-200/60 shadow-2xs">
                    {spec}
                  </span>
                ))
              ) : (
                <span className="text-[10px] text-rose-500 font-bold">⚠️ هیچ تخصصی برای شما ثبت نشده است!</span>
              )}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <span className="block text-slate-700 text-[11px] font-extrabold flex items-center gap-1 mb-1">
              <UploadCloud className="w-4 h-4 text-slate-500" />
              <span>ارسال و ویرایش مدارک جهت ممیزی جدید:</span>
            </span>

            {/* 3 Interactive Cards for Profile Document Resubmission */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1">
              {[
                { title: 'کارت ملی هوشمند', shortKey: 'کارت ملی', icon: '🪪', desc: 'اسکن کارت ملی جدید' },
                { title: 'گواهی فنی‌وحرفه‌ای', shortKey: 'فنی', icon: '🛠️', desc: 'مدرک فنی صنف' },
                { title: 'جواز کسب کار صنف', shortKey: 'جواز', icon: '🏢', desc: 'پروانه/جواز کسب' }
              ].map(card => {
                const currentDocs = loggedInTech.documents || [];
                const isUploaded = currentDocs.some(d => {
                  let dName = d;
                  try { if (d.startsWith('{')) dName = JSON.parse(d).name || ''; } catch(e){}
                  return dName.includes(card.shortKey) || dName.includes(card.title);
                });
                const isSelected = uploadedDocName === card.title;

                return (
                  <button
                    key={card.title}
                    type="button"
                    onClick={() => handleSelectQuickDocTitle(card.title, true)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between space-y-2 group ${
                      isUploaded
                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 shadow-2xs hover:bg-emerald-100'
                        : isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs ring-2 ring-blue-400/30'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xl">{card.icon}</span>
                      {isUploaded ? (
                        <span className="bg-emerald-600 text-white text-[8.5px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                          <Check className="w-3 h-3 text-white" />
                          آپلود شد
                        </span>
                      ) : isSelected ? (
                        <span className="bg-blue-600 text-white text-[8.5px] font-black px-2 py-0.5 rounded-md animate-pulse">
                          انتخاب فایل...
                        </span>
                      ) : (
                        <span className="text-[8.5px] text-blue-600 font-extrabold bg-blue-50 group-hover:bg-blue-100 px-1.5 py-0.5 rounded-md transition-colors">
                          انتخاب و آپلود ↗
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="font-black text-xs leading-tight text-slate-800">{card.title}</div>
                      <div className="text-[9px] text-slate-400 font-medium mt-0.5">{card.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* File text input + File selection + Upload Button */}
            <div className="bg-white p-3 rounded-xl border border-slate-220 space-y-2.5">
              <div className="space-y-1">
                <label className="block text-[10.5px] font-bold text-slate-700 text-right">
                  عنوان مدرک جدید جهت بررسی مدیر:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="مثال: کارت ملی هوشمند جدید / گواهی فنی"
                    value={uploadedDocName}
                    onChange={(e) => setUploadedDocName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-250 text-xs px-3 py-2 pl-9 rounded-xl outline-none focus:bg-white focus:border-blue-500 text-right font-bold text-slate-800"
                  />
                  <label 
                    onClick={() => profileFileInputRef.current?.click()}
                    className="absolute inset-y-0 left-2.5 flex items-center cursor-pointer text-slate-400 hover:text-blue-600" 
                    title="انتخاب فایل از روی دستگاه"
                  >
                    <UploadCloud className="w-4 h-4" />
                  </label>
                  <input 
                    ref={profileFileInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*,.pdf" 
                    onChange={handleFileChangeSimulate} 
                  />
                </div>
              </div>

              {selectedFileObj ? (
                <div className="text-[10px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-bold flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>فایل انتخاب شده: <strong className="text-emerald-900">{selectedFileObj.name}</strong> ({(selectedFileObj.size / 1024).toFixed(0)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => profileFileInputRef.current?.click()}
                    className="text-blue-600 hover:underline text-[9.5px] font-bold cursor-pointer"
                  >
                    تغییر فایل
                  </button>
                </div>
              ) : (
                <div className="text-[10px] text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-medium flex items-center justify-between">
                  <span>روی کارت‌های بالا کلیک کنید تا پنجره انتخاب عکس/PDF باز شود.</span>
                  <button
                    type="button"
                    onClick={() => profileFileInputRef.current?.click()}
                    className="text-amber-900 hover:underline font-bold cursor-pointer whitespace-nowrap"
                  >
                    انتخاب فایل 📂
                  </button>
                </div>
              )}

              <button
                type="button"
                disabled={isUploading}
                onClick={() => {
                  if (!uploadedDocName.trim()) {
                    triggerNotification('کاستی اطلاعات', 'لطفاً ابتدا روی یکی از کارت‌های مدرک بالا کلیک کنید یا نام مدرک را وارد کنید.', 'warning');
                    return;
                  }
                  if (onResubmitDocs) {
                    setIsUploading(true);
                    setUploadProgress(0);

                    const proceedResubmit = (fileDataUrl: string, fileType: string) => {
                      const docPayload = JSON.stringify({
                        name: uploadedDocName,
                        fileData: fileDataUrl,
                        fileType: fileType
                      });
                      const currentDocs = loggedInTech.documents || [];
                      const targetName = uploadedDocName.trim().toLowerCase();
                      const filteredDocs = currentDocs.filter(d => {
                        let dName = d;
                        try {
                          if (d.startsWith('{')) dName = JSON.parse(d).name || '';
                        } catch(e) {}
                        return dName.trim().toLowerCase() !== targetName;
                      });
                      onResubmitDocs(loggedInTech.id, [...filteredDocs, docPayload]);
                      setUploadedDocName('');
                      setSelectedFileObj(null);
                      setIsUploading(false);
                      triggerNotification('ارسال موفق', 'مدرک جدید شما با موفقیت به پرونده ممیزی ضمیمه گردید.', 'success');
                    };

                    if (selectedFileObj) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        proceedResubmit(reader.result as string, selectedFileObj.type);
                      };
                      reader.readAsDataURL(selectedFileObj);
                    } else {
                      triggerNotification('انتخاب فایل', 'لطفاً ابتدا فایل مدرک را انتخاب نمایید.', 'warning');
                    }
                  }
                }}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs py-2.5 px-4 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <UploadCloud className="w-4 h-4 text-blue-400" />
                <span>{isUploading ? 'در حال بارگذاری...' : `پیوست و ارسال مدرک (${uploadedDocName || 'مدرک انتخابی'}) جهت بررسی مدیر`}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl py-2.5 text-xs font-black transition-all cursor-pointer text-center"
            >
              ← خروج از حساب کاربری و بازگشت به ورود تکنسین‌ها
            </button>
          )}
        </div>
      </div>
    );
  }

  const activeCityObj = cities.find(c => c.name === regCity) || cities[0] || { name: '', regions: [] as string[] };

  return (
    <div className="bg-slate-50 rounded-2xl border border-slate-200/90 shadow-xl p-4 sm:p-8 max-w-xl mx-auto my-6 font-sans">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-blue-105 rounded-2xl mx-auto flex items-center justify-center text-blue-600 mb-3 border border-blue-200 shadow-sm">
          <Briefcase className="w-6 h-6" />
        </div>
        <h2 className="text-lg sm:text-xl font-extrabold text-slate-800">
          {isLoginMode ? 'ورود به کارتابل فنی تکنسین‌ها' : 'ثبت نام و درخواست همکاری تکنسین'}
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          {isLoginMode 
            ? 'ارتباط مستقیم با مرکز تعمیرات، گرفتن مأموریت‌های آدرس دار و افزایش موجودی' 
            : 'مدارک صلاحیت خود را ارسال کنید؛ کارشناسان ما مدارک را بررسی کرده و ظرف ۲۴ ساعت تأیید خواهند نمود.'}
        </p>
      </div>

      {isLoginMode ? (
        isForgotMode ? (
          /* FORGOT PASSWORD FORM */
          <div className="space-y-4">
            {forgotStep === 1 ? (
              <form onSubmit={handleTechForgotRequest} className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px] p-3.5 rounded-xl text-right leading-relaxed">
                  شماره همراه تکنسینی خود را وارد کنید تا کد تایید بازیابی کلمه عبور ارسال شود.
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-600 text-xs font-bold mb-1 text-right">شماره همراه تکنسین *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      required
                      type="tel"
                      placeholder="مثال: 09123456789"
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(sanitizePhoneInput(e.target.value))}
                      className="w-full bg-white border border-slate-220 text-xs px-4 pr-10 py-3 rounded-xl outline-none focus:border-blue-500 font-mono text-left"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotMode(false);
                      setForgotStep(1);
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    بازگشت به ورود
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    {forgotLoading ? 'در حال ارسال...' : 'درخواست کد تایید'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleTechForgotReset} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-slate-600 text-xs font-bold mb-1 text-right">کد تایید ۵ رقمی پیامکی *</label>
                  <input
                    required
                    type="text"
                    maxLength={6}
                    placeholder="کد تایید ۵ رقمی را وارد کنید"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    className="w-full bg-white border border-slate-220 text-xs px-4 py-3 rounded-xl outline-none focus:border-blue-500 font-mono text-center font-bold tracking-widest"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-600 text-xs font-bold mb-1 text-right">کلمه عبور جدید تکنسین *</label>
                  <input
                    required
                    type="password"
                    placeholder="رمز عبور جدید را وارد کنید"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full bg-white border border-slate-220 text-xs px-4 py-3 rounded-xl outline-none focus:border-blue-500 text-right"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    مرحله قبل
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    ثبت نهایی رمز جدید
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {loginError && (
              <div className="bg-rose-50 border border-rose-150 p-3.5 rounded-xl text-rose-700 text-xs font-bold leading-normal flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-slate-600 text-xs font-bold mb-1">شماره موبایل ثبت‌شده *</label>
              <div className="relative">
                <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  placeholder="مثال: 09123456789"
                  value={loginPhone}
                  onChange={(e) => {
                    const sanitized = sanitizePhoneInput(e.target.value);
                    setLoginPhone(sanitized);
                    if (sanitized) {
                      const check = validateIranianMobile(sanitized);
                      setLoginPhoneError(check.isValid ? '' : (check.error || ''));
                    } else {
                      setLoginPhoneError('وارد کردن شماره موبایل الزامی است.');
                    }
                  }}
                  maxLength={11}
                  className="w-full bg-white border border-slate-220 text-xs px-4 pr-10 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono text-left"
                  required
                />
              </div>
              {loginPhoneError && (
                <p className="text-red-500 text-[10px] mt-1 text-right font-medium">{loginPhoneError}</p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-slate-600 text-xs font-bold">کلمه عبور *</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(true);
                    setForgotStep(1);
                    setLoginError('');
                  }}
                  className="text-[10.5px] font-extrabold text-blue-600 hover:underline cursor-pointer"
                >
                  رمز را فراموش کرده‌اید؟
                </button>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="رمز عبور کاربری خود را بنویسید"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-white border border-slate-220 text-xs px-4 pr-10 pl-11 py-3 rounded-xl outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-right"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-600 outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-xs font-bold shadow-md hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1"
            >
              <Check className="w-4 h-4" />
              <span>تأیید و ورود به صفحه خودم</span>
            </button>

            <div className="text-center pt-3 border-t border-slate-200">
              <p className="text-xs text-slate-500">
                هنوز ثبت‌نام نکرده‌اید؟{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLoginMode(false);
                    setLoginError('');
                  }}
                  className="text-blue-600 hover:underline font-extrabold cursor-pointer"
                >
                  ثبت نام و درخواست همکاری جدید
                </button>
              </p>
            </div>
          </form>
        )
      ) : (
        /* REGISTER FORM */
        <form onSubmit={handleRegisterSubmit} className="space-y-5">
          {registerSuccess ? (
            <div className="bg-emerald-50 border border-emerald-150 p-5 rounded-2xl text-center text-emerald-800 space-y-3">
              <Sparkles className="w-8 h-8 text-emerald-600 mx-auto animate-bounce" />
              <h3 className="font-extrabold text-sm">پیام از دفتار ثبت صلاحیت تکنسین‌ها</h3>
              <p className="text-xs leading-relaxed">
                درخواست همکاری و مدارک ارسالی شما با موفقیت ثبت شد. در حال بارگذاری خودکار کارتابل اختصاصی شما...
              </p>
            </div>
          ) : (
            <>
              {registerError && (
                <div className="bg-rose-50 border border-rose-150 p-3.5 rounded-xl text-rose-700 text-xs font-bold leading-normal flex items-start gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{registerError}</span>
                </div>
              )}

              {/* General inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-slate-600 text-[11px] font-bold">نام و نام خانوادگی *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      placeholder="مانند: استاد جواد مقدم"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full bg-white border border-slate-210 text-xs pr-9 pl-3 py-3 rounded-xl outline-none focus:border-blue-500 text-right font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-600 text-[11px] font-bold">شماره تلفن همراه *</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      placeholder="مثال: 09123456789"
                      value={regPhone}
                      onChange={(e) => {
                        const sanitized = sanitizePhoneInput(e.target.value);
                        setRegPhone(sanitized);
                        if (sanitized) {
                          const check = validateIranianMobile(sanitized);
                          setRegPhoneError(check.isValid ? '' : (check.error || ''));
                        } else {
                          setRegPhoneError('وارد کردن شماره تلفن همراه الزامی است.');
                        }
                      }}
                      maxLength={11}
                      className="w-full bg-white border border-slate-210 text-xs pr-9 pl-3 py-3 rounded-xl outline-none focus:border-blue-500 font-mono text-left"
                      required
                    />
                  </div>
                  {regPhoneError && (
                    <p className="text-red-500 text-[10px] mt-1 text-right font-semibold">{regPhoneError}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-600 text-[11px] font-bold">پسورد اختصاصی پنل شخصی *</label>
                <div className="relative">
                  <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type="password"
                    placeholder="یک رمز عبور قوی تعریف کنید (جهت ورودهای آتی)"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-white border border-slate-210 text-xs pr-9 pl-3 py-3 rounded-xl outline-none focus:border-blue-500 text-right"
                    required
                  />
                </div>
              </div>

              {/* Specialties & Capabilities On-Page Selection Grid */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-800 text-[11.5px] font-extrabold flex items-center gap-1.5 text-blue-700">
                    <Briefcase className="w-4 h-4 text-blue-600" />
                    <span>انتخاب تخصص‌ها و مهارت‌های فنی شما * (ثبت در پورتال مرکزی)</span>
                  </span>
                  <span className="bg-blue-50 text-blue-705 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {regSpecialties.length} تخصص انتخاب شده
                  </span>
                </div>

                <div className="bg-blue-50/40 border border-blue-100/60 p-3 rounded-xl text-[10.5px] text-blue-800 leading-normal">
                  ⚠️ تخصص‌های مجاز مستقیماً توسط مدیریت کل سامانه کدیار۲۴ پایش و تعریف می‌شود. تکنسین تنها قادر به فعالیت در تخصص‌های ثبت شده توسط مدیریت می‌باشد. اگر تخصص فرعی شما در لیست نیست، بعد از ثبت‌نام به پشتیبانی اطلاع دهید.
                </div>

                {/* Filter and layout */}
                <div className="space-y-3">
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400 font-sans">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="🔎 فیلتر و جستجوی سریع در تخصص‌های فعال..."
                      value={specSearchQuery}
                      onChange={(e) => setSpecSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs pr-9 pl-3 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 text-right font-bold transition-all"
                    />
                  </div>

                  {/* Specialty Buttons Grid */}
                  {(() => {
                    const query = specSearchQuery.trim().toLowerCase();
                    const filtered = categories.filter(cat => 
                      cat.toLowerCase().includes(query)
                    );

                    if (filtered.length === 0) {
                      return (
                        <div className="py-6 text-center text-slate-400 text-xs font-semibold">
                          هیچ موردی منطبق با عبارت "{specSearchQuery}" در لیست تخصص‌های مصوب یافت نشد.
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-105 rounded-xl bg-slate-50/50">
                        {filtered.map((cat) => {
                          const isChecked = regSpecialties.includes(cat);
                          return (
                            <button
                              type="button"
                              key={cat}
                              onClick={() => handleToggleSpecialty(cat)}
                              className={`p-2.5 rounded-xl border text-right text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                isChecked
                                  ? 'bg-blue-600 text-white border-blue-650 shadow-sm scale-[0.98]'
                                  : 'bg-white text-slate-700 hover:bg-slate-105 border-slate-200'
                              }`}
                            >
                              <span className="truncate">{cat}</span>
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                isChecked ? 'bg-white border-blue-700 text-blue-600' : 'bg-slate-105 border-slate-300'
                              }`}>
                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Selected Specialties Tag Cloud */}
                {regSpecialties.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-100">
                    {regSpecialties.map((spec) => (
                      <span
                        key={spec}
                        className="inline-flex items-center gap-1 bg-slate-900 text-white text-[10.5px] font-bold pr-2.5 pl-1.5 py-1 rounded-lg shadow-xs"
                      >
                        <span>{spec}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleSpecialty(spec)}
                          className="w-4 h-4 hover:bg-slate-800 text-slate-300 hover:text-white rounded-full flex items-center justify-center cursor-pointer transition-colors"
                          title="حذف تخصص"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[10px] text-amber-600 font-bold block py-1">
                    ⚠️ هنوز هیچ تخصصی انتخاب نکرده‌اید (باید حداقل ۱ تخصص را از لیست انتخاب کنید).
                  </span>
                )}
              </div>

              {/* City and Neighborhood Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block text-slate-600 text-[11px] font-bold">شهر متبوع فعالیت *</label>
                  <select
                    value={regCity}
                    onChange={(e) => {
                      setRegCity(e.target.value);
                      setRegRegion(''); // Reset region on city change
                    }}
                    className="w-full bg-white border border-slate-210 text-xs p-3 rounded-xl outline-none focus:border-blue-500 font-bold text-slate-700 cursor-pointer"
                  >
                    {cities && cities.length > 0 ? (
                      cities.map((c) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))
                    ) : (
                      <option value="">⚠️ هیچ شهری توسط مدیریت تعریف نشده است</option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-600 text-[11px] font-bold">محدوده/محلات فعالیت (اختیاری)</label>
                  <select
                    value={regRegion}
                    onChange={(e) => setRegRegion(e.target.value)}
                    className="w-full bg-white border border-slate-210 text-xs p-3 rounded-xl outline-none focus:border-blue-500 font-bold text-slate-700 cursor-pointer"
                  >
                    <option value="">⚙️ همه محلات شهر</option>
                    {activeCityObj && activeCityObj.regions && activeCityObj.regions.map((reg) => (
                      <option key={reg} value={reg}>{reg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Documents upload section */}
              <div className="bg-slate-100 p-4 rounded-xl border border-slate-220 space-y-3">
                <span className="block text-slate-800 text-[11px] font-extrabold flex items-center gap-1">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>بارگذاری مدارک سه گانه (کارت ملی، گواهی فنی‌و‌حرفه‌ای، جواز کسب) *</span>
                </span>
                
                <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                  برای آپلود هر یک از مدارک زیر، روی کارت مربوطه کلیک کنید تا فیلد نام تکمیل شده و پنجره انتخاب فایل فوراً باز شود:
                </p>

                {/* 3 Predefined Document Upload Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 py-1">
                  {[
                    { title: 'کارت ملی هوشمند', shortKey: 'کارت ملی', icon: '🪪', desc: 'اسکن کارت ملی' },
                    { title: 'گواهی فنی‌وحرفه‌ای', shortKey: 'فنی', icon: '🛠️', desc: 'مدرک صلاحیت فنی' },
                    { title: 'جواز کسب کار صنف', shortKey: 'جواز', icon: '🏢', desc: 'پروانه/جواز صنف' }
                  ].map(card => {
                    const isUploaded = regDocs.some(d => {
                      let dName = d;
                      try { if (d.startsWith('{')) dName = JSON.parse(d).name || ''; } catch(e){}
                      return dName.includes(card.shortKey) || dName.includes(card.title);
                    });
                    const isSelected = uploadedDocName === card.title;

                    return (
                      <button
                        key={card.title}
                        type="button"
                        onClick={() => handleSelectQuickDocTitle(card.title, false)}
                        className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between space-y-2 group ${
                          isUploaded
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-900 shadow-2xs hover:bg-emerald-100'
                            : isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs ring-2 ring-blue-400/30'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xl">{card.icon}</span>
                          {isUploaded ? (
                            <span className="bg-emerald-600 text-white text-[8.5px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                              <Check className="w-3 h-3 text-white" />
                              آپلود شد
                            </span>
                          ) : isSelected ? (
                            <span className="bg-blue-600 text-white text-[8.5px] font-black px-2 py-0.5 rounded-md animate-pulse">
                              انتخاب فایل...
                            </span>
                          ) : (
                            <span className="text-[8.5px] text-blue-600 font-extrabold bg-blue-50 group-hover:bg-blue-100 px-1.5 py-0.5 rounded-md transition-colors">
                              انتخاب و آپلود ↗
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="font-black text-xs leading-tight text-slate-800">{card.title}</div>
                          <div className="text-[9px] text-slate-400 font-medium mt-0.5">{card.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Simulated/Real File upload input & action box */}
                <div className="bg-white p-3 rounded-xl border border-slate-220 space-y-2.5">
                  <div className="space-y-1">
                    <label className="block text-[10.5px] font-bold text-slate-700 text-right">
                      عنوان مدرک انتخابی جهت بررسی مدیر:
                    </label>
                    <div className="relative">
                      <input
                        id="simulated-doc-title-input"
                        type="text"
                        placeholder="مثال: کارت ملی هوشمند / گواهی فنی‌وحرفه‌ای"
                        value={uploadedDocName}
                        onChange={(e) => setUploadedDocName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-250 text-xs px-3 py-2 pl-9 rounded-xl outline-none focus:bg-white focus:border-blue-500 text-right font-bold text-slate-800"
                      />
                      <label 
                        onClick={() => regFileInputRef.current?.click()}
                        className="absolute inset-y-0 left-2.5 flex items-center cursor-pointer text-slate-400 hover:text-blue-600" 
                        title="انتخاب فایل از دستگاه"
                      >
                        <UploadCloud className="w-4 h-4" />
                      </label>
                      <input 
                        ref={regFileInputRef}
                        type="file" 
                        className="hidden" 
                        accept="image/*,.pdf" 
                        onChange={handleFileChangeSimulate} 
                      />
                    </div>
                  </div>

                  {/* Selected file info */}
                  {selectedFileObj ? (
                    <div className="text-[10px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 font-bold flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>فایل آماده بارگذاری: <strong className="text-emerald-900">{selectedFileObj.name}</strong> ({(selectedFileObj.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => regFileInputRef.current?.click()}
                        className="text-blue-600 hover:underline text-[9.5px] font-bold cursor-pointer"
                      >
                        تغییر فایل
                      </button>
                    </div>
                  ) : (
                    <div className="text-[10px] text-amber-800 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 font-medium flex items-center justify-between">
                      <span>فایلی انتخاب نشده است؛ روی کارت‌های بالا کلیک کنید تا پنجره انتخاب عکس/PDF باز شود.</span>
                      <button
                        type="button"
                        onClick={() => regFileInputRef.current?.click()}
                        className="text-amber-900 hover:underline font-bold cursor-pointer whitespace-nowrap"
                      >
                        انتخاب فایل 📂
                      </button>
                    </div>
                  )}

                  {/* Upload Execution Button */}
                  <button
                    type="button"
                    onClick={handleMockUploadFile}
                    disabled={isUploading}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs py-2.5 px-4 rounded-xl font-bold cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4 text-blue-400" />
                    <span>
                      {isUploading 
                        ? 'در حال کدگذاری و بارگذاری...' 
                        : uploadedDocName 
                        ? `آپلود مدرک (${uploadedDocName}) جهت بررسی مدیر` 
                        : 'پیوست و آپلود مدرک جهت بررسی مدیر'}
                    </span>
                  </button>
                </div>

                {isUploading && (
                  <div className="space-y-1.5 animate-pulse bg-white p-2 text-right rounded-lg border border-slate-200">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-600">
                      <span>در حال کدگذاری و انتقال مدرک به پرونده مدیریت...</span>
                      <span>{uploadProgress}٪</span>
                    </div>
                    <div className="w-full bg-slate-250 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  </div>
                )}

                {/* Uploaded records list */}
                <div className="space-y-1.5 pt-1">
                  <span className="block text-[10px] font-extrabold text-slate-600">مدارک پیوست‌شده شما برای ممیزی:</span>
                  {regDocs.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {regDocs.map((doc, idx) => {
                        let docName = doc;
                        try {
                          if (doc.startsWith('{')) {
                            docName = JSON.parse(doc).name || 'مدرک بدون نام';
                          }
                        } catch (e) {}
                        return (
                          <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] py-1 px-2.5 rounded-lg font-bold flex items-center gap-1.5 leading-none shadow-2xs animate-in zoom-in-95 duration-100">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{docName}</span>
                            <button
                              type="button"
                              onClick={() => setRegDocs(prev => prev.filter((_, i) => i !== idx))}
                              className="text-slate-400 hover:text-rose-600 font-extrabold px-1 py-0.5 rounded hover:bg-rose-50 cursor-pointer transition-colors"
                              title="حذف این مدرک"
                            >
                              ✕
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-[10px] text-slate-450 font-bold py-1 text-center">
                      ⚠ هنوز هیچ مدرکی پیوست نشده است. لطفاً روی یکی از کارت‌های بالا کلیک کنید.
                    </div>
                  )}
                </div>
              </div>

              {/* Submit triggers */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-3 text-xs font-bold shadow-md hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>ثبت نام و ارسال مدارک جهت بررسی مدیریت</span>
              </button>

              <div className="text-center pt-2.5 border-t border-slate-200">
                <p className="text-xs text-slate-500">
                  قبلاً ثبت‌نام کرده‌اید؟{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(true);
                      setRegisterError('');
                    }}
                    className="text-blue-600 hover:underline font-extrabold cursor-pointer"
                  >
                    ورود به پنل شخصی با پسورد
                  </button>
                </p>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
};
