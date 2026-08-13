import React, { useState } from 'react';
import { X, Send, User, Phone, Shield, HelpCircle, FileText, CheckCircle, Info, HeartHandshake, MapPin, Mail, Clock } from 'lucide-react';

interface InfoPageModalProps {
  isOpen: boolean;
  pageId: 'about' | 'contact' | 'rules' | 'dispute' | 'insurance' | 'settlement' | 'union' | '';
  title: string;
  onClose: () => void;
  pageContents: {
    aboutUs: string;
    contactUs: string;
    rules: string;
    dispute: string;
  };
  onSubmitFeedback: (feedback: {
    name: string;
    phone: string;
    role: 'user' | 'technician';
    subject: string;
    message: string;
  }) => void;
}

export const InfoPageModal: React.FC<InfoPageModalProps> = ({
  isOpen,
  pageId,
  title,
  onClose,
  pageContents,
  onSubmitFeedback,
}) => {
  if (!isOpen || !pageId) return null;

  // Local state for the contact / suggestion form
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState<'user' | 'technician'>('user');
  const [subject, setSubject] = useState('پیشنهاد');
  const [message, setMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setFormError('لطفاً نام و نام خانوادگی خود را وارد کنید.');
      return;
    }
    if (!phoneNumber.trim()) {
      setFormError('لطفاً شماره تماس معتبر خود را وارد سازید.');
      return;
    }
    if (!message.trim()) {
      setFormError('لطفاً متن پیام یا پیشنهاد خود را مکتوب فرمایید.');
      return;
    }

    // Submit to parent list
    onSubmitFeedback({
      name: name.trim(),
      phone: phoneNumber.trim(),
      role,
      subject,
      message: message.trim(),
    });

    setSuccessMsg('✅ پیام شما با موفقیت ثبت شد و در صف ممیزی مدیریت قرار گرفت.');
    setName('');
    setPhoneNumber('');
    setMessage('');

    setTimeout(() => {
      setSuccessMsg('');
    }, 5000);
  };

  const getPageIcon = () => {
    switch (pageId) {
      case 'about': return <Info className="w-6 h-6 text-indigo-600 animate-pulse" />;
      case 'contact': return <Mail className="w-6 h-6 text-emerald-600 animate-pulse" />;
      case 'rules': return <FileText className="w-6 h-6 text-amber-500 animate-pulse" />;
      case 'dispute': return <HelpCircle className="w-6 h-6 text-rose-500 animate-pulse" />;
      case 'insurance': return <Shield className="w-6 h-6 text-blue-500 animate-pulse" />;
      case 'settlement': return <HeartHandshake className="w-6 h-6 text-purple-500 animate-pulse" />;
      case 'union': return <Shield className="w-6 h-6 text-sky-500 animate-pulse" />;
      default: return <FileText className="w-6 h-6 text-slate-500" />;
    }
  };

  // Static auxiliary content in case of pages like insurance, settlement, union
  const getStaticPageContent = () => {
    if (pageId === 'insurance') {
      return `🛡️ بیمه جامع کدیار۲۴ کارگاه خدمات و منازل را تحت پوشش مسئولیت مدنی بیمه البرز قرار می‌دهد. بدین ترتیب در صورت وارد آمدن هرگونه خسارت ناخواسته یا نفوذ رطوبت به برد سایر دستگاه‌ها، پلتفرم تا سقف ۵۰۰,۰۰۰,۰۰۰ ریال غرامت کارگاهی تضمین و به مشتری پرداخت خواهد کرد.`;
    }
    if (pageId === 'settlement') {
      return `💳 سیستم سپرده امن رضایت مشتری به این صورت است که وجوه پرداختی شما به صورت امانت نزد دپارتمان مالی کدیار۲۴ نگهداری می‌شود. تکنسین تنها پس از اتمام کار، ممهور کردن فاکتور و ارائه رمز معتبر رضایت شتابی که برای گوشی شما پیامک شده، مجاز به تسویه خواهد بود. این یعنی تضمین ۱۰۰٪ پاسخگویی در ارائه کار معتبر.`;
    }
    if (pageId === 'union') {
      return `⚖️ نرخ خدمات کدیار۲۴ بر اساس تعرفه‌های مصوب اتحادیه محاسبه می‌شود. کلیه فاکتورهای صادره توسط تکنسین‌ها بررسی گردیده تا هزینه‌ها کاملاً شفاف و مطابق نرخ رسمی باشند.`;
    }
    
    // Dynamic editable content
    if (pageId === 'about') return pageContents.aboutUs;
    if (pageId === 'contact') return pageContents.contactUs;
    if (pageId === 'rules') return pageContents.rules;
    if (pageId === 'dispute') return pageContents.dispute;

    return '';
  };

  const formattedContent = getStaticPageContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs font-sans text-right">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header toolbar */}
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 justify-start">
            {getPageIcon()}
            <h2 className="font-black text-sm text-slate-800 leading-tight">{title}</h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 bg-slate-200/50 hover:bg-slate-200 p-2 rounded-xl transition-all cursor-pointer text-xs flex items-center justify-center w-8 h-8 font-mono"
            title="بستن پنجره"
          >
            ✕
          </button>
        </div>

        {/* Modal Scroll Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
          
          {/* Formatted Content Text Board */}
          <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl">
            <h4 className="text-xs font-black text-slate-700 mb-2 border-b border-slate-200/50 pb-2 flex items-center gap-1">
              <Info className="w-4 h-4 text-indigo-500" />
              جزئیات و مستندات رسمی:
            </h4>
            <p className="text-xs text-slate-650 leading-relaxed font-sans whitespace-pre-line font-medium text-right">
              {formattedContent}
            </p>
          </div>

          {/* Interactive feedback form inside Contact Page */}
          {pageId === 'contact' && (
            <div className="border border-indigo-100 bg-indigo-50/20 p-5 rounded-2xl space-y-4">
              <div className="border-b border-indigo-50 pb-2 flex items-center gap-2 justify-start">
                <Send className="w-4 h-4 text-indigo-600 animate-bounce" />
                <h3 className="font-extrabold text-xs text-slate-800">فرستادن مستقیم نظرات، پیشنهادها و شکایات کاربران</h3>
              </div>

              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                شما می‌توانید پیام، گزارش باگ یا درخواست پیگیری صنفی خود را از طریق فرم زیر مکتوب نمایید تا در اسرع وقت مستقیماً روی میز کار ناظر ارشد ممیزی و مدیریت سیستم بارگذاری گردد.
              </p>

              {formError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-xl text-xs font-bold text-center">
                  ⚠️ {formError}
                </div>
              )}

              {successMsg && (
                <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 p-3 rounded-xl text-xs font-extrabold text-center animate-pulse">
                  {successMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-right">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-600 font-bold">👤 نام و نام خانوادگی:</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="مانند: سهراب رحمانی"
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Phone field */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-600 font-bold">📞 شماره تلفن تماس:</label>
                    <input
                      type="tel"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none text-left font-mono focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Role field */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-600 font-bold">💼 نقش شما در پلتفرم:</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'user' | 'technician')}
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500"
                    >
                      <option value="user">کاربر گرامی / متقاضی اعزام کارشناس</option>
                      <option value="technician">تکنسین فعال / همکار فنی مجتمع</option>
                    </select>
                  </div>

                  {/* Subject field */}
                  <div className="space-y-1">
                    <label className="block text-[10px] text-slate-600 font-bold">📌 موضوع پیام:</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500"
                    >
                      <option value="پیشنهاد بهبود">💡 پیشنهاد، انتقاد یا ایده سازنده</option>
                      <option value="شکایت از خدمات">⚠️ شکایت صنف، رفتار تکنسین یا مغایرت تعرفه</option>
                      <option value="درخواست همکاری">🤝 درخواست عضویت فنی در شبکه تکنسین‌ها</option>
                      <option value="تامین قطعه">⚙️ تامین قطعات یدکی خاص</option>
                      <option value="سایر">💬 سایر موضوعات عمومی و ابهامات</option>
                    </select>
                  </div>
                </div>

                {/* Message field */}
                <div className="space-y-1">
                  <label className="block text-[10px] text-slate-600 font-bold">✉️ شرح پیام شما:</label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="شرح کامل نظر، پیشنهاد یا جزئیات شکایت خود را وارد سازید..."
                    className="w-full bg-white border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:border-indigo-500 font-sans"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 text-xs font-black transition-all cursor-pointer shadow-md active:scale-[97%] flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4 text-white" />
                    <span>ارسال نهایی پیام به ناظر سامانه</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Quick legal disclaimer */}
          <div className="text-[10px] text-slate-400 text-right leading-relaxed font-sans mt-2">
            کلیه اطلاعات و درخواست‌های ثبت‌شده جهت حفظ امنیت و بهبود کیفیت خدمات بررسی می‌شوند.
          </div>

        </div>

        {/* Footer toolbar close */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold rounded-xl px-4 py-2 text-xs transition-colors cursor-pointer text-center"
          >
            متوجه شدم • بستن پنجره عمومی
          </button>
        </div>

      </div>
    </div>
  );
};
