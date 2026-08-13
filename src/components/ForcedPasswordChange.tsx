import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, AlertCircle, CheckCircle } from 'lucide-react';

interface ForcedPasswordChangeProps {
  user: any;
  onPasswordChanged: () => Promise<any>;
}

export function ForcedPasswordChange({ user, onPasswordChanged }: ForcedPasswordChangeProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmedPassword = newPassword.trim();
    if (!trimmedPassword) {
      setError('وارد کردن کلمه عبور جدید الزامی است.');
      return;
    }

    if (trimmedPassword.length < 6) {
      setError('کلمه عبور جدید باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    if (trimmedPassword === '1234') {
      setError('شما نمی‌توانید از کلمه عبور پیش‌فرض (1234) استفاده کنید. لطفاً یک کلمه عبور اختصاصی وارد نمایید.');
      return;
    }

    if (trimmedPassword !== confirmPassword.trim()) {
      setError('کلمه عبور جدید با تکرار آن مطابقت ندارد.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/force-change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': localStorage.getItem('session_user_id') || ''
        },
        body: JSON.stringify({ newPassword: trimmedPassword })
      });

      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setSuccess('کلمه عبور شما با موفقیت تغییر یافت! در حال انتقال به پنل کاربری...');
        setTimeout(async () => {
          await onPasswordChanged();
        }, 1500);
      } else {
        setError(data.error || 'خطایی در تغییر رمز عبور رخ داد.');
      }
    } catch (err) {
      console.error(err);
      setError('خطا در اتصال به سرور. مجدداً تلاش نمایید.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('session_user_id');
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-blue-500/20 overflow-hidden relative">
        {/* Top Header Background */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-8 text-center text-white relative">
          <div className="absolute top-4 right-4 bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse">
            تغییر اجباری کلمه عبور
          </div>
          <div className="mx-auto w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 border border-white/20 shadow-inner">
            <Lock className="w-8 h-8 text-amber-300 animate-bounce" />
          </div>
          <h2 className="text-xl font-black tracking-tight">تغییر رمز عبور پیش‌فرض</h2>
          <p className="text-xs text-blue-150 font-bold mt-1.5">
            کاربر گرامی، جهت حفظ امنیت حساب کاربری خود، لطفاً رمز پیش‌فرض (1234) را تغییر دهید.
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 mb-5 text-[11px] font-bold text-slate-600 leading-relaxed">
            🤝 کاربر هویتی: <span className="text-blue-700 font-extrabold">{user.full_name}</span> ({user.phone})
            <br />
            ⚠️ برای دسترسی به خدمات کدیار۲۴، تغییر کلمه عبور اجباری بوده و تا انتخاب کلمه عبور جدید، حساب شما معلق خواهد بود.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                کلمه عبور جدید (حداقل ۶ کاراکتر):
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200/80 rounded-2xl p-4 pl-12 pr-4 text-xs font-bold focus:bg-white focus:border-blue-600 outline-none transition-all text-left"
                  placeholder="••••••"
                  style={{ direction: 'ltr' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-black text-slate-700 mb-1.5">
                تکرار کلمه عبور جدید:
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-200/80 rounded-2xl p-4 pl-12 pr-4 text-xs font-bold focus:bg-white focus:border-blue-600 outline-none transition-all text-left"
                  placeholder="••••••"
                  style={{ direction: 'ltr' }}
                />
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="bg-rose-50 border border-rose-150 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-rose-700 font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="bg-emerald-50 border border-emerald-150 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-emerald-850 font-bold">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{success}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black text-xs text-white transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20 active:scale-[98%]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'در حال ذخیره‌سازی...' : 'ذخیره کلمه عبور جدید و ورود'}</span>
            </button>
          </form>

          {/* Cancel/Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full mt-4 text-center text-[10px] text-slate-400 hover:text-rose-600 font-extrabold transition-all cursor-pointer"
          >
            ❌ خروج از حساب کاربری و بازگشت به صفحه ورود
          </button>
        </div>
      </div>
    </div>
  );
}
