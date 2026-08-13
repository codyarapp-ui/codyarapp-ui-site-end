/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RepairOrder, ErrorCode } from '../types';
import { IRAN_CITIES, APPLIANCE_BRANDS, APPLIANCE_CATEGORIES } from '../data';
import { Truck, Calendar, Phone, MapPin, Upload, FileText, CheckCircle2, ShieldAlert, ArrowRight, ShieldCheck, X } from 'lucide-react';
import { sanitizePhoneInput, validateIranianMobile } from './validation';

interface BookingFormProps {
  prefilledError: ErrorCode | null;
  preselectedTech?: any;
  onBookingSubmit: (newOrder: Partial<RepairOrder>) => void;
  onClose: () => void;
  citiesList?: Array<{ name: string; regions: string[] }>;
  brandsList?: string[];
  categoriesList?: string[];
  onSendSms?: (phone: string, text: string, type: 'otp' | 'status') => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  prefilledError,
  preselectedTech,
  onBookingSubmit,
  onClose,
  citiesList,
  brandsList,
  categoriesList,
  onSendSms,
}) => {
  const [step, setStep] = React.useState<1 | 2 | 3>(1);

  // Dynamic lists loaded from props or localStorage with static fallback
  const cities = React.useMemo(() => {
    if (citiesList && citiesList.length > 0) return citiesList;
    const saved = localStorage.getItem('ir_cities');
    return saved ? (JSON.parse(saved) as {name: string, regions: string[]}[]) : [];
  }, [citiesList]);

  const brands = React.useMemo(() => {
    if (brandsList && brandsList.length > 0) return brandsList;
    const saved = localStorage.getItem('ir_brands');
    return saved ? (JSON.parse(saved) as string[]) : [];
  }, [brandsList]);

  const categories = React.useMemo(() => {
    if (categoriesList && categoriesList.length > 0) return categoriesList;
    const saved = localStorage.getItem('ir_categories');
    return saved ? (JSON.parse(saved) as string[]) : [];
  }, [categoriesList]);

  // Form states
  const [customerName, setCustomerName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [customerPhoneError, setCustomerPhoneError] = React.useState('');
  const [selectedCity, setSelectedCity] = React.useState('');
  const [selectedRegion, setSelectedRegion] = React.useState('');

  React.useEffect(() => {
    if (cities && cities.length > 0 && !selectedCity) {
      setSelectedCity(cities[0].name);
    }
  }, [cities, selectedCity]);
  const [address, setAddress] = React.useState('');
  
  const [category, setCategory] = React.useState(prefilledError?.category || '');
  const [brand, setBrand] = React.useState(prefilledError?.brand || '');
  const [model, setModel] = React.useState(prefilledError?.model || '');

  React.useEffect(() => {
    if (categories && categories.length > 0 && !category) {
      setCategory(categories[0]);
    }
  }, [categories, category]);

  React.useEffect(() => {
    if (brands && brands.length > 0 && !brand) {
      setBrand(brands[0]);
    }
  }, [brands, brand]);
  const [errorCode, setErrorCode] = React.useState(prefilledError?.code || '');
  const [description, setDescription] = React.useState('');
  
  const dateOptions = React.useMemo(() => {
    const options = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dateVal = d.toLocaleDateString('fa-IR');
      const dayName = d.toLocaleDateString('fa-IR', { weekday: 'long' });
      const label = i === 0 ? `فوری امروز (${dayName} ${dateVal})` : i === 1 ? `فردا (${dayName} ${dateVal})` : `${dayName} (${dateVal})`;
      options.push({ value: dateVal, label });
    }
    return options;
  }, []);

  const [date, setDate] = React.useState(dateOptions[0]?.value || '');
  const [timeSlot, setTimeSlot] = React.useState('۰۹:۰۰ الی ۱۲:۰۰');
  const [otpSent, setOtpSent] = React.useState(false);
  const [generatedOtp, setGeneratedOtp] = React.useState('');
  const [otpCode, setOtpCode] = React.useState('');
  const [imagePlaceholder, setImagePlaceholder] = React.useState<string | null>(null);

  // Available regions based on selected city
  const regions = React.useMemo(() => {
    const cityObj = cities.find(c => c.name === selectedCity);
    return cityObj ? cityObj.regions : [];
  }, [selectedCity, cities]);

  // Set first region as default when city changes
  React.useEffect(() => {
    if (regions.length > 0) {
      setSelectedRegion(regions[0]);
    }
  }, [regions]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!customerName.trim()) {
        alert('لطفاً نام و نام خانوادگی خود را وارد نمایید.');
        return;
      }
      const validationResponse = validateIranianMobile(customerPhone);
      if (!validationResponse.isValid) {
        setCustomerPhoneError(validationResponse.error || '');
        alert(validationResponse.error || 'خطا در شماره تلفن همراه');
        return;
      } else {
        setCustomerPhoneError('');
      }
      if (!address.trim()) {
        alert('لطفاً آدرس دقیق پستی محل اعزام را وارد نمایید.');
        return;
      }
    }
    setStep((prev) => (prev + 1) as any);
  };

  const handlePrevStep = () => {
    setStep((prev) => (prev - 1) as any);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImagePlaceholder(e.target.files[0].name);
    }
  };

  const toEnglishNumber = (str: string) => {
    const farsiDigits = [/۰/g, /۱/g, /۲/g, /۳/g, /۴/g, /۵/g, /۶/g, /۷/g, /۸/g, /۹/g];
    const arabicDigits = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let workingStr = String(str);
    for (let i = 0; i < 10; i++) {
      workingStr = workingStr.replace(farsiDigits[i], i.toString()).replace(arabicDigits[i], i.toString());
    }
    return workingStr;
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      alert('لطفاً ابتدا کد تایید پیامکی را دریافت نمایید.');
      return;
    }
    const cleanEntered = toEnglishNumber(otpCode).trim();
    const cleanGenerated = toEnglishNumber(generatedOtp).trim();

    if (!cleanEntered || cleanEntered !== cleanGenerated) {
      alert('کد تایید پیامکی وارد شده اشتباه است. لطفاً کد ۴ رقمی دریافتی را به دقت وارد نمایید.');
      return;
    }

    onBookingSubmit({
      customerName,
      customerPhone,
      city: selectedCity,
      region: selectedRegion,
      address,
      category,
      brand,
      model,
      errorCode,
      description,
      date,
      timeSlot,
      technicianId: preselectedTech?.id,
      technicianName: preselectedTech?.name,
      technicianPhone: preselectedTech?.phone,
      mediaUrls: imagePlaceholder ? ["data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'><path d='M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 16H6c-.55 0-1-.45-1-1V6c0-.55.45-1 1-1h12c.55 0 1 .45 1 1v12c0 .55-.45 1-1 1z'/></svg>"] : [],
    });
    setStep(3);
  };

  const triggerGetOtp = () => {
    if (!customerPhone) return;
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);
    // Send OTP using our backend dispatcher
    if (onSendSms) {
      onSendSms(customerPhone, `کد تایید سفارش اعزام تکنسین کدیار24: ${code}`, 'otp');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl border border-slate-250 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header decoration */}
        <div className="bg-slate-950 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-sm">فرم درخواست اعزام فوری تعمیرکار لوازم خانگی</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="bg-slate-50 border-b border-slate-100 py-3 px-6 flex items-center justify-between text-xs">
          <span className={`font-semibold ${step === 1 ? 'text-blue-600' : 'text-slate-400'}`}>۱. آدرس و مشخصات مشتری</span>
          <span className="text-slate-300">|</span>
          <span className={`font-semibold ${step === 2 ? 'text-blue-600' : 'text-slate-400'}`}>۲. جزئیات خرابی و برند</span>
          <span className="text-slate-300">|</span>
          <span className={`font-semibold ${step === 3 ? 'text-blue-600' : 'text-slate-400'}`}>۳. تایید هویت دو مرحله‌ای (MFA)</span>
        </div>

        {/* Wizard Form */}
        <div className="p-6">
          {preselectedTech && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center gap-3 text-right">
              <img
                src={preselectedTech.avatarUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='35' r='20' fill='%23ccc'/><path d='M20 85c0-15 15-25 30-25s30 10 30 25z' fill='%23ccc'/></svg>"}
                alt={preselectedTech.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500 shadow-xs shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-emerald-700 block">درخواست ارجاع مستقیم به تکنسین برتر:</span>
                <span className="text-xs font-black text-slate-900 block truncate">{preselectedTech.name} (⭐ {preselectedTech.rating || '5.0'})</span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-[10px] font-bold mb-1">نام و نام خانوادگی متقاضی *</label>
                  <input
                    required
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="سامان بهرامی"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 text-[10px] font-bold mb-1">تلفن همراه (جهت هماهنگی پیامکی) *</label>
                  <input
                    required
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => {
                      const sanitized = sanitizePhoneInput(e.target.value);
                      setCustomerPhone(sanitized);
                      if (sanitized) {
                        const check = validateIranianMobile(sanitized);
                        setCustomerPhoneError(check.isValid ? '' : (check.error || ''));
                      } else {
                        setCustomerPhoneError('وارد کردن شماره موبایل الزامی است.');
                      }
                    }}
                    placeholder="09112345678"
                    maxLength={11}
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-blue-500 text-left font-mono"
                  />
                  {customerPhoneError && (
                    <p className="text-red-500 text-[9px] mt-1 text-right font-medium">{customerPhoneError}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-[10px] font-bold mb-1">شهر اسکان *</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 text-xs p-2.5 rounded-xl outline-none cursor-pointer"
                  >
                    {cities.map((c) => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 text-[10px] font-bold mb-1">منطقه / محله *</label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 text-xs p-2.5 rounded-xl outline-none cursor-pointer"
                  >
                    {regions.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 text-[10px] font-bold mb-1">آدرس دقیق محل سکونت جهت اعزام تعمیرکار *</label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="بلوار، خیابان اصلی، کوچه، پلاک، واحد و طبقه..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-xs px-3.5 py-2 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              {/* Delivery info note */}
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 text-[10px] text-blue-800 flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p>سیستم به صورت هوشمند، این اطلاعات را فیلتر کرده و درخواست شما را به واجد شرایط ترین تکنسین های محلی منطقه شما معرفی می کند.</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  id="book-step1-next"
                  onClick={handleNextStep}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2.5 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <span>مرحله بعدی: نوع خرابی</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-[10px] font-bold mb-1">نوع دستگاه معیوب *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-xl outline-none cursor-pointer"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 text-[10px] font-bold mb-1">برند دستگاه *</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-xl outline-none cursor-pointer"
                  >
                    {brands.map((br) => (
                      <option key={br} value={br}>{br}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-[10px] font-bold mb-1">مدل حدودی دستگاه</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="مثال: کالداونزیا ۲۴ یا ساید با ساید"
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 text-[10px] font-bold mb-1">کد خطای نمایش داده شده (در صورت وجود)</label>
                  <input
                    type="text"
                    value={errorCode}
                    onChange={(e) => setErrorCode(e.target.value)}
                    placeholder="مثال: E1, OE, F3..."
                    className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-xs px-3.5 py-2.5 rounded-xl outline-none focus:border-blue-500 font-mono text-center"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 text-[10px] font-bold mb-1">تاریخ مراجعه پیشنهادی *</label>
                  <select
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-xl outline-none cursor-pointer"
                  >
                    {dateOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 text-[10px] font-bold mb-1">ساعت مراجعه پیشنهادی *</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="۰۹:۰۰ الی ۱۲:۰۰">صبح (۹:۰۰ الی ۱۲:۰۰)</option>
                    <option value="۱۲:۰۰ الی ۱۵:۰۰">ظهر (۱۲:۰۰ الی ۱۵:۰۰)</option>
                    <option value="۱۵:۰۰ الی ۱۸:۰۰">عصر (۱۵:۰۰ الی ۱۸:۰۰)</option>
                    <option value="۱۸:۰۰ الی ۲۱:۰۰">شب (۱۸:۰۰ الی ۲۱:۰۰)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 text-[10px] font-bold mb-1">توضیحات ایراد فنی دستگاه</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="موارد فنی اضافه یا توضیح حالت رخداد خطا..."
                  className="w-full bg-slate-50 border border-slate-200 focus:bg-white text-xs px-3.5 py-2 rounded-xl outline-none focus:border-blue-500"
                />
              </div>

              {/* Photo Upload Simulation */}
              <div>
                <label className="block text-slate-600 text-[10px] font-bold mb-1">آپلود عکس/ویدیو خطا (اختیاری جهت عیب‌یابی دقیق‌تر)</label>
                <div className="border-2 border-dashed border-slate-250 rounded-xl p-3 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <p className="text-[10px] text-slate-500">فایل ویدیو یا تصویر صفحه مانیتور خطا را بکشید یا کلیک کنید</p>
                    {imagePlaceholder && <p className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md mt-1">✓ {imagePlaceholder}</p>}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-between">
                <button
                  id="book-step2-prev"
                  type="button"
                  onClick={handlePrevStep}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-5 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  بازگشت قبلی
                </button>
                <button
                  id="book-step2-next"
                  type="button"
                  onClick={handleNextStep}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2.5 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  <span>مرحله نهایی: پیامک تایید</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-200 pb-2">
                  <span>پیش نمایش فاکتور ثبت اولیه سفارش</span>
                  <span className="text-blue-600 text-[10px]">آماده تخصیص تکنسین</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-600 text-[11px] leading-relaxed">
                  <div>مشتری: <span className="font-bold text-slate-800">{customerName}</span></div>
                  <div>شماره تماس: <span className="font-semibold text-slate-800 font-sans">{customerPhone}</span></div>
                  <div>شهر و منطقه: <span className="font-semibold text-slate-800">{selectedCity} - {selectedRegion}</span></div>
                  <div>خطای ثبت شده: <span className="text-orange-600 font-bold font-mono">{errorCode || 'فاقد خطا'}</span></div>
                  <div className="col-span-2 border-t border-slate-100 pt-1.5 text-[10px]">دستگاه: {category} برند {brand} - زمان: {date} ({timeSlot})</div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 space-y-4 bg-blue-50/20">
                <div className="text-center space-y-1">
                  <h4 className="font-bold text-slate-800 text-xs">احراز هویت دو مرحله‌ای (OTP) کدیار24</h4>
                  <p className="text-slate-500 text-[10px]">رمز یکبار مصرف ارسال شده به شماره همراه خود را وارد نمایید.</p>
                </div>

                {!otpSent ? (
                  <button
                    id="get-otp-btn"
                    type="button"
                    onClick={triggerGetOtp}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2 px-4 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    ارسال پیامک تایید هویت به شماره {customerPhone || 'ورودی'}
                  </button>
                ) : (
                  <form onSubmit={handleSubmitOrder} className="space-y-3">
                    <div className="bg-emerald-50 text-emerald-800 border border-emerald-100/60 rounded-xl px-3 py-2 text-center text-[11px] leading-relaxed">
                      کد تایید ۴ رقمی به شماره <span className="font-sans font-bold">{customerPhone}</span> ارسال گردید.
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-1">
                      <input
                        required
                        type="text"
                        maxLength={4}
                        placeholder="کد ۴ رقمی پیامکی"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9۰-۹\u0660-\u0669\u06f0-\u06f9]/g, ''))}
                        className="bg-white border border-slate-300 text-center text-sm font-bold tracking-widest leading-10 rounded-xl w-36 shadow-xs font-mono outline-none focus:border-blue-600"
                      />
                    </div>
                    <p className="text-[10px] text-center text-slate-500 leading-relaxed max-w-[280px] mx-auto select-none">
                      کد ۴ رقمی پیام کوتاه شده را در کادر بالا وارد نمایید تا درخواست تعمیرات شما نهایی و بلافاصله ثبت گردد.
                    </p>
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode('');
                        }}
                        className="text-[10px] text-rose-500 font-semibold cursor-pointer hover:underline"
                      >
                        تغییر شماره همراه
                      </button>

                      <button
                        id="submit-order-confirm"
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2 text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>ثبت نهایی درخواست و ارسال به تکنسین</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
