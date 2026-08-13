import React, { useState, useEffect } from 'react';
import { 
  User, Lock, Phone, MapPin, CreditCard, CheckCircle, AlertCircle, 
  Eye, EyeOff, ChevronLeft, LogOut, Calendar, DollarSign, 
  FileText, Check, RotateCcw, Edit2, Shield, Sparkles, Smartphone, Award, Wallet
} from 'lucide-react';
import { validateIranianMobile, toEnglishNumber, sanitizePhoneInput } from './validation';

interface ClientDashboardProps {
  currentUser: any;
  checkAuth: () => Promise<any>;
  onLogout: () => void;
  triggerNotification: (title: string, text: string, type?: 'info' | 'success' | 'warning' | 'error' | 'sms') => void;
  citiesList?: Array<{ name: string; regions: string[] }>;
  orders?: any[];
  partPurchases?: any[];
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  currentUser,
  checkAuth,
  onLogout,
  triggerNotification,
  citiesList = [],
  orders = [],
  partPurchases = []
}) => {
  // Navigation tabs for non-logged-in state
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot_password'>('login');
  const [orderTab, setOrderTab] = useState<'technician' | 'parts'>('technician');

  // Combine backend-provided lists with frontend real-time state for maximum robustness
  const combinedOrders = React.useMemo(() => {
    if (!currentUser) return [];
    const map = new Map<string, any>();
    
    // 1. Add backend repair requests
    if (currentUser.repair_requests && Array.isArray(currentUser.repair_requests)) {
      currentUser.repair_requests.forEach((r: any) => {
        map.set(r.id, {
          id: r.id,
          appliance: r.appliance || 'نامعلوم',
          brand: r.brand || 'نامعلوم',
          model: r.model || 'نامعلوم',
          city: r.city || currentUser.city,
          status: r.status || 'pending',
          date: r.created_at ? new Date(r.created_at).toLocaleDateString('fa-IR') : 'نامعلوم'
        });
      });
    }

    // 2. Add local frontend state orders matching user phone or user ID
    const normalizeDigits = (p?: string) => {
      if (!p) return '';
      let str = toEnglishNumber(String(p)).replace(/[^\d]/g, '');
      if (str.startsWith('0098')) str = '0' + str.slice(4);
      if (str.startsWith('98') && str.length > 10) str = '0' + str.slice(2);
      if (str.length === 10 && str.startsWith('9')) str = '0' + str;
      return str;
    };

    const cleanUserPhone = normalizeDigits(currentUser.phone);

    orders.forEach((o: any) => {
      const cleanOrderPhone = normalizeDigits(o.customerPhone || o.customer_phone);
      const isSameUser = (cleanUserPhone && cleanOrderPhone && cleanUserPhone === cleanOrderPhone) ||
        (o.userId && String(o.userId) === String(currentUser.id)) ||
        (o.user_id && String(o.user_id) === String(currentUser.id));
      if (isSameUser) {
        map.set(o.id, {
          id: o.id,
          appliance: o.category || o.appliance || 'نامعلوم',
          brand: o.brand || 'نامعلوم',
          model: o.model || 'نامعلوم',
          city: o.city || 'تهران',
          status: o.status,
          date: o.date || 'نامعلوم'
        });
      }
    });

    return Array.from(map.values());
  }, [currentUser, orders]);

  const combinedPurchases = React.useMemo(() => {
    if (!currentUser) return [];
    const map = new Map<string, any>();

    // 1. Add backend part purchases
    if (currentUser.part_purchases && Array.isArray(currentUser.part_purchases)) {
      currentUser.part_purchases.forEach((p: any) => {
        map.set(p.id, {
          id: p.id,
          partName: p.partName,
          partCategory: p.partCategory,
          price: p.price,
          date: p.date,
          status: p.status || 'pending',
          postalTrackingCode: p.postalTrackingCode || p.trackNumber || ''
        });
      });
    }

    // 2. Add local frontend state part purchases matching user phone
    const myUserPhone = toEnglishNumber(currentUser.phone || '').replace(/[^\d]/g, '');
    partPurchases.forEach((p: any) => {
      const pPhone = toEnglishNumber(p.customerPhone || '').replace(/[^\d]/g, '');
      if (pPhone === myUserPhone) {
        map.set(p.id, {
          id: p.id,
          partName: p.partName,
          partCategory: p.partCategory,
          price: p.price,
          date: p.date,
          status: p.status || 'pending',
          postalTrackingCode: p.postalTrackingCode || p.trackNumber || ''
        });
      }
    });

    return Array.from(map.values());
  }, [currentUser, partPurchases]);
  
  // Login fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Register fields
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCity, setRegCity] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  // Forgot password simulation fields
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [simulatedOtpCode, setSimulatedOtpCode] = useState('');

  // Profile editing fields
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Wallet state hooks
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletHistory, setWalletHistory] = useState<any[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [chargeAmount, setChargeAmount] = useState<string>('50000');

  // Referral state hooks
  const [referralClaimCodeInput, setReferralClaimCodeInput] = useState('');
  const [referralStatusMsg, setReferralStatusMsg] = useState('');
  const [referralLoading, setReferralLoading] = useState(false);

  // Tickets support center hooks
  const [ticketsList, setTicketsList] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('technical');
  const [ticketMessage, setTicketMessage] = useState('');
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [ticketReplyInput, setTicketReplyInput] = useState('');
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  // Subscription configuration & gateways
  const [plans, setPlans] = useState<any[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentGateway, setPaymentGateway] = useState<'zarinpal' | 'card_to_card'>('zarinpal');
  const [cardHolderName, setCardHolderName] = useState('');
  const [cardTrackNumber, setCardTrackNumber] = useState('');
  const [subscribingLoading, setSubscribingLoading] = useState(false);
  const [resumingPaymentId, setResumingPaymentId] = useState<string | null>(null);

  const handleResumePayment = async (paymentId: string) => {
    setResumingPaymentId(paymentId);
    try {
      const token = localStorage.getItem('session_user_id') || '';
      const response = await fetch('/api/payment/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token
        },
        body: JSON.stringify({ paymentId })
      });
      const data = await response.json();
      if (response.ok && data.status === 'ok') {
        triggerNotification('انتقال مجدد', 'در حال انتقال مجدد به درگاه ایمن پرداخت...', 'info');
        if (data.redirect) {
          window.location.href = data.redirect;
        }
      } else {
        triggerNotification('خطا', data.error || 'امکان از سرگیری پرداخت وجود ندارد.', 'error');
      }
    } catch (err) {
      console.error('Error resuming payment:', err);
      triggerNotification('خطای شبکه', 'خطایی در ارتباط با سرور رخ داد.', 'error');
    } finally {
      setResumingPaymentId(null);
    }
  };

  // Fetch Wallet, Referrals, and Support Tickets on client load
  useEffect(() => {
    if (currentUser) {
      // 1. Fetch wallet status
      setWalletLoading(true);
      fetch('/api/wallet/balance', {
        headers: { 'X-Session-Token': localStorage.getItem('session_user_id') || '' }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setWalletBalance(data.balance || 0);
          setWalletHistory(data.history || []);
        }
        setWalletLoading(false);
      })
      .catch(err => {
        console.error("Wallet fetch error:", err);
        setWalletLoading(false);
      });

      // 2. Fetch support tickets list
      setTicketsLoading(true);
      fetch('/api/tickets/my', {
        headers: { 'X-Session-Token': localStorage.getItem('session_user_id') || '' }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setTicketsList(data.tickets || []);
        }
        setTicketsLoading(false);
      })
      .catch(err => {
        console.error("Tickets fetch error:", err);
        setTicketsLoading(false);
      });
    }
  }, [currentUser]);

  const handleChargeWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseInt(chargeAmount, 10);
    if (!amountNum || amountNum < 1000) {
      triggerNotification('خطای شارژ کیف پول', 'حداقل مبلغ شارژ ۱,۰۰۰ تومان می‌باشد.', 'warning');
      return;
    }

    setWalletLoading(true);
    try {
      const res = await fetch('/api/wallet/charge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': localStorage.getItem('session_user_id') || ''
        },
        body: JSON.stringify({ amount: amountNum })
      });
      const data = await res.json();
      if (data.success) {
        setWalletBalance(data.balance);
        setWalletHistory(data.history || []);
        triggerNotification('شارژ موفق', `کیف پول شما با موفقیت مبلغ ${amountNum.toLocaleString('fa-IR')} تومان شارژ شد.`, 'success');
      } else {
        triggerNotification('ناموفق', data.error || 'خطا در افزایش موجودی.', 'error');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWalletLoading(false);
    }
  };

  const handleClaimReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralClaimCodeInput.trim()) return;

    setReferralLoading(true);
    setReferralStatusMsg('');
    try {
      const res = await fetch('/api/referral/claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': localStorage.getItem('session_user_id') || ''
        },
        body: JSON.stringify({ code: referralClaimCodeInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setReferralStatusMsg(`✅ تبریک! ${data.bonusAmount.toLocaleString('fa-IR')} تومان هدیه رفرال به کیف پول شما و معرف واریز شد!`);
        // Refresh wallet
        setWalletBalance(data.newWalletBalance);
        triggerNotification('هدیه رفرال فعال شد', 'مبلغ هدیه معرف به کیف پول شما افزوده گردید.', 'success');
      } else {
        setReferralStatusMsg(`❌ خطا: ${data.error}`);
      }
    } catch (err: any) {
      setReferralStatusMsg(`❌ خطا: ${err.message}`);
    } finally {
      setReferralLoading(false);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      triggerNotification('خطای تیکت', 'تکمیل عنوان و متن پیام الزامی است.', 'warning');
      return;
    }

    setSubmittingTicket(true);
    try {
      const res = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': localStorage.getItem('session_user_id') || ''
        },
        body: JSON.stringify({
          subject: ticketSubject,
          category: ticketCategory,
          message: ticketMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        setTicketsList(prev => [data.ticket, ...prev]);
        setTicketSubject('');
        setTicketMessage('');
        triggerNotification('تیکت با موفقیت ثبت شد', 'کارشناسان ما به زودی پاسخگوی شما خواهند بود.', 'success');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSendTicketReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicketId || !ticketReplyInput.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/tickets/${activeTicketId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': localStorage.getItem('session_user_id') || ''
        },
        body: JSON.stringify({ message: ticketReplyInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        // Update ticket in local list
        setTicketsList(prev => prev.map(t => t.id === activeTicketId ? data.ticket : t));
        setTicketReplyInput('');
        triggerNotification('پیام ارسال شد', 'پاسخ شما با موفقیت ثبت و ضمیمه گردید.', 'success');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Load available premium pricing plans from database
  useEffect(() => {
    const fetchPlans = async () => {
      setPlansLoading(true);
      try {
        const res = await fetch('/api/subscription/plans');
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'ok' && data.plans) {
            setPlans(data.plans);
          }
        }
      } catch (err) {
        console.error('Error fetching subscription plans:', err);
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPhone || !loginPassword) {
      triggerNotification('خطای ورود', 'وارد کردن شماره همراه و رمز عبور الزامی است.', 'warning');
      return;
    }

    const { isValid, error } = validateIranianMobile(loginPhone);
    if (!isValid) {
      triggerNotification('خطای اعتبار سنجی', error || 'فرمت شماره همراه اشتباه است.', 'warning');
      return;
    }

    setLoginLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loginPhone, password: loginPassword })
      });
      const data = await response.json();
      if (response.ok && data.status === 'ok') {
        triggerNotification('ورود موفقیت‌آمیز', data.message || 'خوش آمدید!', 'success');
        if (data.user && data.user.id) {
          localStorage.setItem('session_user_id', data.user.id);
        }
        await checkAuth();
      } else {
        triggerNotification('عدم تایید مشخصات', data.error || 'کلمه عبور یا شماره همراه اشتباه است.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerNotification('خطای سرور', 'اشکال در اتصال به سرور احراز هویت.', 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regPhone || !regPassword || !regName || !regCity) {
      triggerNotification('تکمیل فیلدها', 'پر کردن تمامی اطلاعات ستاره‌دار الزامی است.', 'warning');
      return;
    }

    const { isValid, error } = validateIranianMobile(regPhone);
    if (!isValid) {
      triggerNotification('فرمت نامعتبر', error || 'فرمت شماره همراه اشتباه است.', 'warning');
      return;
    }

    setRegisterLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: regPhone,
          password: regPassword,
          full_name: regName,
          city: regCity,
          role: 'client'
        })
      });
      const data = await response.json();
      if (response.ok && data.status === 'ok') {
        triggerNotification('ثبت‌نام موفق', data.message || 'حساب پیشرفته شما ایجاد شد.', 'success');
        if (data.user && data.user.id) {
          localStorage.setItem('session_user_id', data.user.id);
        }
        await checkAuth();
      } else {
        const errMsg = data.error || 'مشکلی در ثبت‌نام پیش آمد.';
        if (errMsg.includes('قبلا') || errMsg.includes('تکراری') || errMsg.includes('register') || response.status === 409) {
          triggerNotification('ثبت‌نام شده‌اید', 'این شماره همراه قبلاً در سامانه ثبت شده است. لطفاً وارد شوید.', 'info');
          setLoginPhone(regPhone);
          setAuthMode('login');
        } else {
          triggerNotification('سیستم خطا', errMsg, 'error');
        }
      }
    } catch (err) {
      console.error(err);
      triggerNotification('خطا', 'عدم امکان ثبت‌نام آنلاین.', 'error');
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPhone) {
      triggerNotification('شماره همراه', 'لطفاً شماره همراه خود را وارد کنید.', 'warning');
      return;
    }
    const { isValid } = validateIranianMobile(forgotPhone);
    if (!isValid) {
      triggerNotification('خطا', 'شماره همراه وارد شده صحیح نیست.', 'warning');
      return;
    }

    setForgotLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: forgotPhone, role: 'client' })
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

  const handleForgotPasswordReset = async (e: React.FormEvent) => {
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
          phone: forgotPhone,
          otp: forgotOtp,
          newPassword: forgotNewPassword,
          role: 'client'
        })
      });
      const data = await response.json();
      if (!response.ok || data.status !== 'ok') {
        triggerNotification('خطا', data.error || 'تغییر رمز عبور با خطا مواجه شد.', 'error');
        return;
      }
      
      triggerNotification('تغییر موفقیت‌آمیز رمز', 'رمز عبور شما با موفقیت تغییر یافت. هم‌اکنون لاگین کنید.', 'success');
      setAuthMode('login');
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

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName || !editCity) {
      triggerNotification('تکمیل فیلدها', 'وارد کردن نام و شهر الزامی ست.', 'warning');
      return;
    }

    setEditLoading(true);
    try {
      const token = localStorage.getItem('session_user_id') || '';
      const response = await fetch('/api/auth/update-profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Session-Token': token
        },
        body: JSON.stringify({ 
          full_name: editName, 
          city: editCity, 
          password: editPassword || undefined 
        })
      });
      const data = await response.json();
      if (response.ok && data.status === 'ok') {
        triggerNotification('به‌روزرسانی موفق', data.message || 'پروفایل با موفقیت ویرایش شد.', 'success');
        setIsEditProfileOpen(false);
        setEditPassword('');
        await checkAuth();
      } else {
        triggerNotification('خطا', data.error || 'تغییرات ذخیره نشد.', 'error');
      }
    } catch (err) {
      console.error(err);
      triggerNotification('سیستم قطعی', 'خطا در برقراری ارتباط با سرور.', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleOpenEditProfile = () => {
    setEditName(currentUser?.full_name || '');
    setEditCity(currentUser?.city || '');
    setEditPassword('');
    setIsEditProfileOpen(true);
  };

  // Subscription buying
  const handlePurchaseSubscription = async (plan: any) => {
    if (paymentGateway === 'zarinpal') {
      setSubscribingLoading(true);
      try {
        const token = localStorage.getItem('session_user_id') || '';
        const response = await fetch('/api/payment/request', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Session-Token': token
          },
          body: JSON.stringify({ plan: plan.id })
        });
        const data = await response.json();
        if (response.ok && data.status === 'ok') {
          triggerNotification('انتقال به درگاه', 'در حال انتقال به درگاه بانکی امن زرین‌پال...', 'info');
          if (data.redirect) {
            window.location.href = data.redirect;
          }
        } else {
          triggerNotification('ناموفق', data.error || 'امکان ایجاد فرآیند پرداخت نیست.', 'error');
        }
      } catch (err) {
        triggerNotification('اتصال', 'عدم توانایی ارتباط با درگاه پرداخت صنف.', 'error');
      } finally {
        setSubscribingLoading(false);
      }
    } else if (paymentGateway === 'card_to_card') {
      if (!cardHolderName.trim()) {
        triggerNotification('خطای اطلاعات', 'لطفاً نام پرداخت‌کننده را وارد کنید.', 'warning');
        return;
      }
      if (!cardTrackNumber.trim()) {
        triggerNotification('خطای اطلاعات', 'لطفاً شماره پیگیری یا فیش واریز کارت به کارت را وارد کنید.', 'warning');
        return;
      }
      setSubscribingLoading(true);
      try {
        const token = localStorage.getItem('session_user_id') || '';
        const response = await fetch('/api/payment/card-verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Session-Token': token
          },
          body: JSON.stringify({
            product_id: plan.id,
            card_holder: cardHolderName,
            track_number: cardTrackNumber
          })
        });
        const data = await response.json();
        if (response.ok && data.status === 'ok') {
          triggerNotification('ثبت فیش واریزی', data.message || 'فیش واریزی با موفقیت ثبت شد!', 'success');
          setCardHolderName('');
          setCardTrackNumber('');
          setSelectedPlanId(null);
          await checkAuth();
        } else {
          triggerNotification('خطا در تایید فیش', data.error || 'خطایی رخ داد.', 'error');
        }
      } catch (err) {
        console.error(err);
        triggerNotification('خطای شبکه', 'ارتباط برقرار نشد. لطفاً وضعیت اینترنت را چک کنید.', 'error');
      } finally {
        setSubscribingLoading(false);
      }
    }
  };

  const handleLogoutClick = async () => {
    try {
      const token = localStorage.getItem('session_user_id') || '';
      await fetch('/api/auth/logout', { 
        method: 'POST', 
        headers: { 'X-Session-Token': token } 
      });
      localStorage.removeItem('session_user_id');
      triggerNotification('خروج از حساب', 'با موفقیت خارج شدید.', 'info');
      onLogout();
    } catch {
      localStorage.removeItem('session_user_id');
      onLogout();
    }
  };

  // Convert English dates to beautiful Iranian local time representation of UTC
  const formatIranDate = (dateStr: string | null) => {
    if (!dateStr) return 'نامعلوم';
    try {
      const parsedStr = dateStr.includes('T') ? dateStr : dateStr.replace(/-/g, '/');
      const dt = new Date(parsedStr);
      if (isNaN(dt.getTime())) return dateStr;
      return dt.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Render Login / Register forms if currentUser is null
  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-lg mx-auto my-6 font-sans">
        <div className="p-6 bg-slate-900 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-2xl" />
          <h2 className="text-md sm:text-lg font-black tracking-tight flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-blue-400" />
            <span>حساب کاربری اعضای پلتفرم کدیار۲۴</span>
          </h2>
          <p className="text-[10px] text-slate-300 mt-1">با ایجاد حساب به کدهای خطا، ارگانایزر عیب‌یابی و پشتیبانی آنلاین مجهز شوید.</p>
          
          {/* Form Switcher */}
          <div className="flex gap-2 mt-4 relative z-10">
            <button
              onClick={() => { setAuthMode('login'); setForgotStep(1); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                authMode === 'login' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
            >
              ورود به حساب
            </button>
            <button
              onClick={() => { setAuthMode('register'); setForgotStep(1); }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                authMode === 'register' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
            >
              ثبت نام رایگان
            </button>
          </div>
        </div>

        <div className="p-6">
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">شماره موبایل</label>
                <div className="relative">
                  <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    required
                    type="tel"
                    placeholder="مثال: 09123456789"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(sanitizePhoneInput(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-blue-500 text-right font-sans"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-bold text-slate-700">کلمه عبور (رمز)</label>
                  <button
                    type="button"
                    onClick={() => setAuthMode('forgot_password')}
                    className="text-[10px] font-extrabold text-blue-600 hover:underline cursor-pointer"
                  >
                    رمز را فراموش کرده‌اید؟
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    required
                    type={showLoginPassword ? 'text' : 'password'}
                    placeholder="رمز ورود خود را وارد کنید"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-10 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-blue-500 text-right"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-sans cursor-pointer focus:outline-none"
                  >
                    {showLoginPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-350"
              >
                {loginLoading ? 'در حال بررسی مشخصات...' : 'ورود امن به حساب کاربری ←'}
              </button>
            </form>
          )}

          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">نام و نام خانوادگی به فارسی *</label>
                <div className="relative">
                  <User className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    required
                    type="text"
                    placeholder="مثال: رضا عباسی"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-blue-500 text-right"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">شماره تلفن همراه *</label>
                <div className="relative">
                  <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    required
                    type="tel"
                    placeholder="مثال: 09123456789"
                    value={regPhone}
                    onChange={(e) => setRegPhone(sanitizePhoneInput(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-blue-500 text-right font-sans"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">شهر سکونت *</label>
                  <div className="relative">
                    <MapPin className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <select
                      required
                      value={regCity}
                      onChange={(e) => setRegCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-3 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-blue-500 appearance-none text-right cursor-pointer"
                    >
                      <option value="">انتخاب شهر...</option>
                      {citiesList && citiesList.map((c: any) => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">کلمه عبور دلخواه *</label>
                  <div className="relative">
                    <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      required
                      type={showRegPassword ? 'text' : 'password'}
                      placeholder="حداقل ۴ کاراکتر"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-10 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-blue-500 text-right"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-sans cursor-pointer focus:outline-none"
                    >
                      {showRegPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={registerLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3 rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-350"
              >
                {registerLoading ? 'در حال صدور حساب کاربری...' : 'درخواست ثبت نام فوری در کدیار۲۴'}
              </button>
            </form>
          )}

          {authMode === 'forgot_password' && (
            <div className="space-y-4">
              {forgotStep === 1 ? (
                <form onSubmit={handleForgotPasswordRequest} className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[10.5px] p-3 rounded-xl text-right leading-relaxed">
                    شماره همراه خود را وارد کنید تا کد بارگذاری مجدد کلمه عبور ارسال شود.
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">شماره موبایل ثبت نامی</label>
                    <div className="relative">
                      <Phone className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <input
                        required
                        type="tel"
                        placeholder="مثال: 09123456789"
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-10 pl-4 py-2.5 text-xs font-bold outline-none focus:bg-white focus:border-blue-500 text-right font-sans"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthMode('login')}
                      className="px-4 py-2.5 text-stone-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      بازگشت به ورود
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      {forgotLoading ? 'در حال ارسال پیامک...' : 'درخواست کد تایید پیامکی'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleForgotPasswordReset} className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-150 text-emerald-800 text-[10.5px] p-3 rounded-xl text-right leading-relaxed">
                    کد تایید ۵ رقمی پیام داده شده به شماره شما را به همراه رمز دلخواه جدید وارد کنید.
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">کد تایید ۵ رقمی دریافت شده</label>
                    <input
                      required
                      type="text"
                      maxLength={6}
                      placeholder="کد تایید ۵ رقمی را وارد کنید"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-center outline-none focus:bg-white tracking-widest font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">کلمه عبور دلخواه جدید</label>
                    <input
                      required
                      type="password"
                      placeholder="کلمه عبور جدید را وارد کنید"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-right outline-none focus:bg-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setForgotStep(1)}
                      className="px-4 py-2.5 text-stone-600 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      مرحله قبل
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2.5 rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      کد گذاری مجدد و ثبت نهایی رمز
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render Client Account Panel if currentUser exists
  return (
    <div className="space-y-8 font-sans">
      
      {/* 2.1 Header profile card */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden border border-slate-800 shadow-md">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-600/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-right">
            <div className="w-14 h-14 bg-gradient-to-tr from-blue-700 to-emerald-500 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">
              {currentUser.full_name?.charAt(0) || <User className="w-6 h-6" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-white">{currentUser.full_name}</h2>
                {currentUser.role === 'admin' ? (
                  <span className="bg-rose-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                    <Award className="w-3.5 h-3.5" />
                    <span>مدیر ارشد سامانه</span>
                  </span>
                ) : currentUser.role === 'technician' ? (
                  <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 shadow-sm">
                    <Award className="w-3.5 h-3.5" />
                    <span>تکنسین متخصص (دسترسی نامحدود)</span>
                  </span>
                ) : currentUser.subscription?.is_premium ? (
                  <span className="bg-amber-500 text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 animate-pulse">
                    <Award className="w-3.5 h-3.5" />
                    <span>مشتری طلایی ویژه VIP</span>
                  </span>
                ) : (
                  <span className="bg-slate-850 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-md">حساب رایگان و عادی</span>
                )}
              </div>
              <p className="text-[10.5px] text-slate-400 flex items-center gap-2">
                <span>تلفن: {currentUser.phone}</span>
                <span className="text-slate-600">•</span>
                <span>شهر: {currentUser.city || 'ثبت نشده'}</span>
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1 bg-slate-900/50 p-1.5 rounded-xl border border-white/5 w-fit">
                <span className="text-[9.5px] text-slate-300 inline-flex items-center gap-1">
                  <span>شناسه اختصاصی شما جهت اثبات پرداخت:</span>
                  <span className="font-mono font-black text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded-lg select-all">{currentUser.id}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentUser.id);
                    triggerNotification('کپی موفق', 'شناسه انحصاری شما در کلیپ‌بورد ذخیره شد.', 'success');
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white text-[8px] font-black px-2 py-0.5 rounded-lg cursor-pointer transition-all"
                >
                  کپی شناسه
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center">
            <button
              onClick={handleOpenEditProfile}
              className="bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Edit2 className="w-4 h-4" />
              <span>ویرایش مقادیر پروفایل</span>
            </button>
            <button
              onClick={handleLogoutClick}
              className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>خروج از حساب</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2.2 Active Subscription State panel */}
      <div className="bg-white rounded-3xl border border-slate-200/95 p-5 md:p-6 shadow-sm space-y-4">
        <div className="border-r-3 border-amber-500 pr-2.5 flex items-center justify-between w-full">
          <div>
            <h3 className="font-extrabold text-slate-800 text-xs sm:text-xs">پکیج اشتراک کدیار۲۴</h3>
            <p className="text-slate-500 text-[10px] mt-0.5">وضعیت فعال کدهای ارور، بهینه‌سازی دیتابیس و عیب‌یابی جینی هوشمند</p>
          </div>
          <div>
            {currentUser.role === 'admin' || currentUser.role === 'technician' ? (
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-black px-3 py-1 rounded-full">
                دسترسی همکار: دائمی و نامحدود VIP
              </span>
            ) : currentUser.subscription?.is_premium ? (
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10.5px] font-black px-3 py-1 rounded-full">
                تاریخ انقضای فعال: {formatIranDate(currentUser.subscription.expiry_date)}
              </span>
            ) : (
              <span className="bg-rose-50 text-rose-800 border border-rose-200 text-[10.5px] font-black px-3 py-1 rounded-full">
                اشتراک فعال منقضی یا ناموجود است
              </span>
            )}
          </div>
        </div>

        {/* Dynamic List of plans */}
        <div className="pt-2">
          <h4 className="text-[11px] font-bold text-slate-700 mb-3.5 flex items-center gap-1.5 gray-800">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>پلن‌های عضویت طلایی صنف (استفاده از تمام کدهای ارور و ابزار عیب‌یابی جینی)</span>
          </h4>

          {plansLoading ? (
            <div className="text-center py-6 text-xs text-slate-500">در حال لود لیست تعرفه‌ها از شبکه صنف...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map((pl) => {
                const isSelected = selectedPlanId === pl.id;
                return (
                  <div
                    key={pl.id}
                    onClick={() => setSelectedPlanId(pl.id)}
                    className={`border-2 rounded-2xl p-4 cursor-pointer text-right transition-all duration-150 relative ${
                      isSelected 
                        ? 'border-blue-600 bg-blue-50/20 shadow-sm' 
                        : 'border-slate-200 hover:border-slate-350 bg-white'
                    }`}
                  >
                    {pl.id === '12_month' && (
                      <span className="absolute -top-2.5 left-4 bg-amber-500 text-slate-900 text-[8px] font-extrabold px-2 py-0.5 rounded-full">خرید به صرفه</span>
                    )}
                    <h5 className="font-extrabold text-xs text-slate-800">{pl.name}</h5>
                    <p className="text-[10px] text-slate-500 mt-1 leading-relaxed min-h-[32px]">{pl.description}</p>
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                      <span className="text-[9px] text-slate-400 font-bold">قیمت دوره</span>
                      <span className="text-blue-700 font-black text-xs">{pl.price.toLocaleString('fa-IR')} <span className="text-[9px] font-normal text-slate-500">تومان</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Checkout parameters section */}
          {selectedPlanId && (
            <div className="mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-5 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-[10.5px] font-bold text-slate-500">پلن انتخابی جهت سفارش:</span>
                  <div className="text-xs font-black text-slate-800">
                    {plans.find(p => p.id === selectedPlanId)?.name} — {plans.find(p => p.id === selectedPlanId)?.price.toLocaleString('fa-IR')} تومان
                  </div>
                </div>

                <div className="space-y-1 w-full sm:w-auto">
                  <span className="text-[10.5px] font-bold text-slate-500">انتخاب متد پرداخت:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setPaymentGateway('zarinpal')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                        paymentGateway === 'zarinpal' ? 'bg-amber-500 text-slate-900' : 'bg-slate-200 text-slate-650 hover:bg-slate-250'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>زرین‌پال آنلاین</span>
                    </button>
                    <button
                      onClick={() => setPaymentGateway('card_to_card')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                        paymentGateway === 'card_to_card' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-650 hover:bg-slate-250'
                      }`}
                    >
                      <Wallet className="w-4 h-4" />
                      <span>کارت به کارت (بانکی)</span>
                    </button>
                  </div>
                </div>
              </div>

              {paymentGateway === 'card_to_card' && (
                <div className="mt-4 p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                    {/* Bank Card Info */}
                    <div className="bg-gradient-to-br from-indigo-700 to-slate-800 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden flex flex-col justify-between min-h-[120px]">
                      <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full" />
                      <div>
                        <div className="text-[10px] text-indigo-200 font-bold mb-1">شماره کارت جهت واریز وجه:</div>
                        <div className="text-sm font-black tracking-wider font-mono dir-ltr text-right select-all">6104-3389-6112-6667</div>
                      </div>
                      <div className="flex justify-between items-end mt-4">
                        <div>
                          <div className="text-[8px] text-indigo-300">به نام مدیریت:</div>
                          <div className="text-[11px] font-black">شرکت کدیار۲۴ (مهدی عباسی)</div>
                        </div>
                        <div className="text-[10px] font-bold text-indigo-100">  بانک ملت</div>
                      </div>
                    </div>

                    {/* Instruction Details */}
                    <div className="text-right space-y-1.5 flex flex-col justify-center">
                      <div className="text-xs font-black text-slate-800">مراحل ارتقای حساب از طریق کارت‌به‌کارت:</div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        ۱. مبلغ <strong className="text-indigo-700 font-mono">{(plans.find(p => p.id === selectedPlanId)?.price || 0).toLocaleString('fa-IR')} تومان</strong> را به کارت فوق واریز بفرمایید.
                      </p>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        ۲. پس از انجام انتقال، نام صاحب کارت خودتان و شماره پیگیری تراکنش را در فیلدهای روبرو ثبت نمایید.
                      </p>
                      <p className="text-[10px] text-indigo-950 font-bold bg-indigo-50/70 p-1.5 rounded-lg border border-indigo-100/40">
                        💡 این تراکنش به شناسه کاربری شما <strong className="font-mono text-indigo-750 underline">{currentUser.id}</strong> الحاق می‌شود تا امور مالی فوراً صحت و سقم فعال‌سازی را بررسی نماید.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-right">
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-bold text-slate-700">نام و نام خانوادگی واریزکننده (صاحب کارت شما) *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: علی احمدی"
                        value={cardHolderName}
                        onChange={(e) => setCardHolderName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500 text-right"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10.5px] font-bold text-slate-700">شماره پیگیری / شماره ارجاع تراکنش *</label>
                      <input
                        type="text"
                        required
                        placeholder="مثال: 1254784"
                        value={cardTrackNumber}
                        onChange={(e) => setCardTrackNumber(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-center outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-slate-250 flex justify-end gap-2">
                <button
                  onClick={() => setSelectedPlanId(null)}
                  className="px-4 py-2 border-slate-200 hover:bg-slate-100 border text-slate-600 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  onClick={() => handlePurchaseSubscription(plans.find(p => p.id === selectedPlanId))}
                  disabled={subscribingLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-2 rounded-xl text-xs transition-colors shadow-sm cursor-pointer disabled:bg-slate-350"
                >
                  {subscribingLoading ? 'در حال برقراری ارتباط...' : 'پرداخت و شارژ آنی اشتراک ویژه ←'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2.3 User Payment history logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Payment History Card */}
        <div className="bg-white rounded-3xl border border-slate-200/95 p-5 md:p-6 shadow-sm space-y-4">
          <div className="border-r-3 border-blue-500 pr-2.5">
            <h3 className="font-extrabold text-slate-800 text-xs sm:text-xs">سوابق تراکنش پرداخت شما</h3>
            <p className="text-slate-500 text-[10px] mt-0.5">آبونمان شارژ شده و تراکنش‌های بانکی رسمی متصل به حساب در دیتابیس کدیار۲۴</p>
          </div>

          <div className="overflow-x-auto w-full">
            {!currentUser.payments || currentUser.payments.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400">تراکنش پرداختی ثبت نگردیده است.</div>
            ) : (
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-500 font-bold">
                    <th className="py-2.5 pr-2">توضیحات/دوره</th>
                    <th className="py-2.5">مبلغ</th>
                    <th className="py-2.5">درگاه</th>
                    <th className="py-2.5 pr-2">وضعیت تراکنش</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {currentUser.payments.map((p: any, i: number) => {
                    const isPart = p.type === 'part_purchase' || p.related_type === 'part_purchase' || p.partId;
                    const planNames: Record<string, string> = {
                      '1_month': 'اشتراک ۱ ماهه کدهای خطا',
                      '3_month': 'اشتراک ۳ ماهه کدهای خطا',
                      '6_month': 'اشتراک ۶ ماهه کدهای خطا',
                      '12_month': 'اشتراک ۱۲ ماهه کدهای خطا'
                    };
                    const title = isPart 
                      ? (p.partName ? `🔧 خرید قطعه: ${p.partName}` : '🔧 خرید قطعه یدکی انبار')
                      : `⭐ ${planNames[p.plan || p.related_id] || p.plan_name || p.plan || 'اشتراک ویژه کدهای خطا'}`;

                    return (
                      <tr key={i} className="text-[11px] font-bold text-slate-700">
                        <td className="py-2.5 pr-2">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black ${isPart ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-blue-100 text-blue-900 border border-blue-300'}`}>
                              {isPart ? 'قطعه' : 'اشتراک'}
                            </span>
                            <span className="truncate max-w-[180px] sm:max-w-xs">{title}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-blue-700">{p.amount?.toLocaleString('fa-IR') || '0'} ت</td>
                        <td className="py-2.5 text-[10px] font-normal">
                          {p.gateway === 'zarinpal' ? 'زرین‌پال' : p.gateway === 'admin_manual' ? 'شارژ توسط مدیریت' : 'کارت به کارت'}
                        </td>
                        <td className="py-2.5 flex flex-wrap items-center gap-1.5 min-h-[36px]">
                          <span className={`px-2 py-0.5 rounded-md text-[9px] inline-block ${
                            p.status === 'completed' 
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' 
                              : p.status === 'pending' 
                                ? 'bg-amber-50 text-amber-800 border border-amber-150' 
                                : 'bg-rose-50 text-rose-800 border border-rose-150'
                          }`}>
                            {p.status === 'completed' ? 'تایید و شارژ شده' : p.status === 'pending' ? (p.gateway === 'card_to_card' ? 'در انتظار ممیزی ادمین' : 'در انتظار پرداخت') : 'لغو/ناموفق'}
                          </span>
                          {p.status !== 'completed' && p.gateway === 'zarinpal' && (
                            <button
                              type="button"
                              onClick={() => handleResumePayment(p.id)}
                              disabled={resumingPaymentId === p.id}
                              className="px-2 py-0.5 text-[8.5px] font-black text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[96%] disabled:bg-slate-350 cursor-pointer rounded transition-all leading-none inline-flex items-center"
                            >
                              {resumingPaymentId === p.id ? 'ریست درگاه...' : '💳 پرداخت'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

        {/* 2.2.5 Wallet and Referral System Module */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Wallet Container */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4 text-right">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Wallet className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-slate-800 text-xs sm:text-xs">کیف پول دیجیتال (پرداخت امن و آنی)</h3>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">موجودی کیف پول شما:</span>
              <span className="text-blue-700 font-black text-sm">{walletBalance?.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-500">تومان</span></span>
            </div>

            <form onSubmit={handleChargeWallet} className="space-y-3">
              <label className="block text-[11px] font-bold text-slate-700">افزایش موجودی دستی (کارت شتابی)</label>
              <div className="flex gap-2">
                <input
                  required
                  type="number"
                  placeholder="مبلغ شارژ به تومان..."
                  value={chargeAmount}
                  onChange={(e) => setChargeAmount(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-left outline-none focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={walletLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer disabled:bg-slate-350"
                >
                  {walletLoading ? 'در حال شارژ...' : 'شارژ آنلاین'}
                </button>
              </div>
            </form>

            {/* Wallet History */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-bold text-slate-700 block">گردش حساب و تراکنش‌های اخیر</span>
              {walletHistory.length === 0 ? (
                <p className="text-[10px] text-slate-400">تراکنشی یافت نشد.</p>
              ) : (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {walletHistory.map((w: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-2 border border-slate-50 rounded-lg text-[10px]">
                      <span className="text-slate-600">{w.description}</span>
                      <span className={w.amount >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                        {w.amount >= 0 ? `+${w.amount.toLocaleString('fa-IR')}` : w.amount.toLocaleString('fa-IR')} ت
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Referral Container */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4 text-right">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Award className="w-5 h-5 text-amber-500 animate-pulse" />
              <h3 className="font-extrabold text-slate-800 text-xs sm:text-xs">سیستم ارجاع و کسب درآمد همکاران (Referrals)</h3>
            </div>
            <p className="text-[10.5px] text-slate-500 leading-relaxed">
              با ارسال کد معرف خود به دوستان، در اولین شارژ کیف پول آن‌ها، هدیه نقدی ویژه ۵,۰۰۰ تومانی دریافت کنید! دوست شما نیز ۵,۰۰۰ تومان شارژ اولیه رایگان هدیه می‌گیرد.
            </p>

            <div className="bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200 space-y-1">
              <span className="text-[10px] text-slate-400 block font-bold">کد معرف اختصاصی شما:</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-black text-slate-800 text-xs">{currentUser.phone || 'GUEST'}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(currentUser.phone);
                    triggerNotification('کپی کد معرف', 'کد معرف شما با موفقیت کپی شد.', 'success');
                  }}
                  className="text-[9px] bg-slate-200 hover:bg-slate-300 px-2.5 py-1 rounded-lg transition-all"
                >
                  کپی کد
                </button>
              </div>
            </div>

            <form onSubmit={handleClaimReferral} className="space-y-3 pt-1">
              <label className="block text-[11px] font-bold text-slate-700">ثبت کد معرف (کسب هدیه خوش‌آمدگویی ۵,۰۰۰ تومانی)</label>
              <div className="flex gap-2">
                <input
                  required
                  type="text"
                  placeholder="شماره همراه معرف خود را وارد کنید..."
                  value={referralClaimCodeInput}
                  onChange={(e) => setReferralClaimCodeInput(e.target.value)}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-left outline-none focus:bg-white"
                />
                <button
                  type="submit"
                  disabled={referralLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold px-4 py-2 rounded-xl text-xs transition-colors cursor-pointer disabled:bg-slate-350"
                >
                  ثبت معرف
                </button>
              </div>
            </form>
            {referralStatusMsg && (
              <p className="text-[11px] font-bold text-slate-750 text-right mt-2">{referralStatusMsg}</p>
            )}
          </div>
        </div>

        {/* 2.2.6 Ticketing & Notifications Center */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 md:p-6 shadow-sm space-y-4 text-right">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <FileText className="w-5 h-5 text-blue-600 animate-bounce" />
            <h3 className="font-extrabold text-slate-800 text-xs sm:text-xs">مرکز پشتیبانی تیکتی آنلاین و تعاملی کدیار۲۴</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create new Ticket form */}
            <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <span className="text-xs font-extrabold text-slate-800 block">ایجاد تیکت پشتیبانی جدید</span>
              <form onSubmit={handleCreateTicket} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">موضوع تیکت</label>
                  <input
                    required
                    type="text"
                    placeholder="مثال: سوال در مورد نحوه ممیزی کد خطا"
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none text-right"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">بخش مربوطه</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none appearance-none"
                  >
                    <option value="technical">پشتیبانی فنی کدهای خطا</option>
                    <option value="wallet">مسائل مالی و شارژ کیف پول</option>
                    <option value="technician">امور تکنسین‌ها و احراز هویت</option>
                    <option value="other">سایر پیشنهادات و انتقادات</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">شرح جزئیات درخواست</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="متن پیام خود را وارد کنید..."
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none text-right"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 rounded-xl text-xs transition-colors cursor-pointer"
                >
                  {submittingTicket ? 'در حال ثبت...' : 'ارسال تیکت به واحد مربوطه'}
                </button>
              </form>
            </div>

            {/* Tickets list and dynamic thread conversation */}
            <div className="lg:col-span-2 space-y-4">
              <span className="text-xs font-extrabold text-slate-800 block">مکالمات فعال و تیکت‌های شما</span>
              {ticketsLoading ? (
                <p className="text-xs text-slate-500 py-6 text-center">در حال لود مکالمات...</p>
              ) : ticketsList.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-150 rounded-2xl text-xs text-slate-400">تاکنون مکالمه یا تیکت پشتیبانی ایجاد نکرده‌اید.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Scrollable ticket items */}
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {ticketsList.map((tk: any) => (
                      <div
                        key={tk.id}
                        onClick={() => setActiveTicketId(tk.id)}
                        className={`p-3 border rounded-xl cursor-pointer text-right transition-all ${
                          activeTicketId === tk.id
                            ? 'border-blue-500 bg-blue-50/20'
                            : 'border-slate-100 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-800">{tk.subject}</span>
                          <span className={`px-2 py-0.5 rounded text-[8.5px] font-extrabold ${
                            tk.status === 'closed'
                              ? 'bg-slate-100 text-slate-500'
                              : tk.replies?.length > 0 && tk.replies[tk.replies.length - 1]?.senderRole === 'admin'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-amber-50 text-amber-800'
                          }`}>
                            {tk.status === 'closed' ? 'بسته شده' : (tk.replies?.length > 0 && tk.replies[tk.replies.length - 1]?.senderRole === 'admin' ? 'پاسخ داده شده' : 'در انتظار بررسی')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] text-slate-400 mt-2">
                          <span>بخش: {tk.category === 'technical' ? 'فنی کدهای خطا' : tk.category === 'wallet' ? 'مالی کیف پول' : 'امور تکنسین‌ها'}</span>
                          <span>شناسه: #{tk.id?.substring(0,6)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Active Ticket Conversation Chat Box */}
                  <div className="border border-slate-150 rounded-2xl p-3 bg-slate-50 flex flex-col justify-between min-h-[220px]">
                    {(() => {
                      const activeTicket = ticketsList.find(t => t.id === activeTicketId);
                      if (!activeTicket) {
                        return <p className="text-[10.5px] text-slate-400 m-auto text-center">برای بررسی پیام‌ها، یک تیکت از منوی سمت راست انتخاب کنید.</p>;
                      }

                      return (
                        <div className="flex flex-col h-full justify-between gap-3 text-right">
                          <div className="border-b border-slate-200/60 pb-1.5">
                            <span className="text-[11px] font-extrabold text-slate-800 block">{activeTicket.subject}</span>
                            <span className="text-[9px] text-slate-400">آخرین بروزرسانی: {new Date(activeTicket.updatedAt).toLocaleDateString('fa-IR')}</span>
                          </div>

                          {/* Message Threads Scrollable */}
                          <div className="flex-1 space-y-2.5 overflow-y-auto max-h-44 text-[10.5px] pr-1">
                            {/* Main initial message */}
                            <div className="p-2.5 bg-blue-50 text-blue-950 rounded-xl leading-relaxed">
                              <span className="font-extrabold text-[9px] text-blue-800 block mb-1">پیام شما (مشتری):</span>
                              {activeTicket.message}
                            </div>

                            {/* Replies thread */}
                            {activeTicket.replies && activeTicket.replies.map((rp: any, rIdx: number) => (
                              <div
                                key={rIdx}
                                className={`p-2.5 rounded-xl leading-relaxed ${
                                  rp.senderRole === 'admin'
                                    ? 'bg-emerald-50 text-emerald-950 border-r-3 border-emerald-500'
                                    : 'bg-blue-50 text-blue-950'
                                }`}
                              >
                                <span className={`font-extrabold text-[9px] block mb-1 ${
                                  rp.senderRole === 'admin' ? 'text-emerald-800' : 'text-blue-800'
                                }`}>
                                  {rp.senderRole === 'admin' ? 'پاسخ کارشناس کدیار۲۴:' : 'پیام شما:'}
                                </span>
                                {rp.message}
                              </div>
                            ))}
                          </div>

                          {/* Send reply input form */}
                          <form onSubmit={handleSendTicketReply} className="flex gap-1.5 border-t border-slate-200/60 pt-2">
                            <input
                              required
                              type="text"
                              placeholder="پاسخ خود را بنویسید..."
                              value={ticketReplyInput}
                              onChange={(e) => setTicketReplyInput(e.target.value)}
                              className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-bold outline-none"
                            />
                            <button
                              type="submit"
                              disabled={submittingReply}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-3 py-1.5 rounded-lg text-[10.5px] transition-all disabled:bg-slate-350 cursor-pointer"
                            >
                              {submittingReply ? 'ارسال...' : 'فرستادن'}
                            </button>
                          </form>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Orders & Purchases Panel with Tabs */}
        <div className="bg-white rounded-3xl border border-slate-200/95 p-5 md:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
            <div className="border-r-3 border-sky-500 pr-2.5">
              <h3 className="font-extrabold text-slate-800 text-xs sm:text-xs">سوابق درخواست‌ها و خریدهای شما</h3>
              <p className="text-slate-500 text-[10px] mt-0.5 font-medium">پیگیری اعزام سرویس‌کار متبحر و خریدهای قطعات یدکی مرتبط با حساب کاربری شما</p>
            </div>
            
            {/* Segmented Tab Switcher */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-max self-end sm:self-center">
              <button
                type="button"
                onClick={() => setOrderTab('technician')}
                className={`px-3 py-1.5 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer ${
                  orderTab === 'technician'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                🛠️ اعزام تکنسین ({combinedOrders.length})
              </button>
              <button
                type="button"
                onClick={() => setOrderTab('parts')}
                className={`px-3 py-1.5 rounded-lg text-[10.5px] font-extrabold transition-all cursor-pointer ${
                  orderTab === 'parts'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-850'
                }`}
              >
                ⚙️ خرید قطعات ({combinedPurchases.length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            {orderTab === 'technician' ? (
              combinedOrders.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 font-medium">درخواستی برای اعزام تکنسین تاکنون ثبت نکرده‌اید.</div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-bold">
                      <th className="py-2.5 pr-2">کد پیگیری</th>
                      <th className="py-2.5">نام دستگاه/معیوب</th>
                      <th className="py-2.5">برند/مدل</th>
                      <th className="py-2.5">تاریخ ثبت</th>
                      <th className="py-2.5 pr-2">وضعیت اعزام</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {combinedOrders.map((r: any, idx: number) => {
                      const statusLabels: Record<string, string> = {
                        'registered': 'ثبت شده',
                        'pending': 'در انتظار بررسی',
                        'waiting': 'در انتظار تکنسین',
                        'accepted': 'ارجاع به تکنسین',
                        'enroute': 'تکنسین در مسیر',
                        'repairing': 'تعمیر در حال انجام',
                        'needs_part': 'نیاز به قطعه',
                        'completed': 'پایان موفق کار',
                        'cancelled': 'انصراف مشتری'
                      };
                      return (
                        <tr key={r.id || idx} className="text-[11px] font-bold text-slate-700">
                          <td className="py-2.5 pr-2 font-mono text-slate-500 text-[10px]">{r.id}</td>
                          <td className="py-2.5">{r.appliance}</td>
                          <td className="py-2.5 text-slate-650">{r.brand} {r.model}</td>
                          <td className="py-2.5 text-[10px] font-normal text-slate-500">{r.date}</td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] inline-block ${
                              r.status === 'completed' 
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-150' 
                                : r.status === 'cancelled' 
                                  ? 'bg-slate-100 text-slate-500 border border-slate-200' 
                                  : 'bg-blue-50 text-blue-800 border border-blue-150'
                            }`}>
                              {statusLabels[r.status] || r.status || 'ثبت شده'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            ) : (
              combinedPurchases.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 font-medium">خرید قطعه‌ای تاکنون ثبت نکرده‌اید.</div>
              ) : (
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 font-bold">
                      <th className="py-2.5 pr-2">کد خرید</th>
                      <th className="py-2.5">نام قطعه یدکی</th>
                      <th className="py-2.5">دسته قطعه</th>
                      <th className="py-2.5">قیمت پرداخت شده</th>
                      <th className="py-2.5">تاریخ سفارش</th>
                      <th className="py-2.5">کد رهگیری پستی</th>
                      <th className="py-2.5 pr-2">وضعیت ارسال</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {combinedPurchases.map((p: any, idx: number) => {
                      const purchaseStatusLabels: Record<string, string> = {
                        'pending': '⏳ در انتظار تایید و بررسی مدیر',
                        'pending_payment': '⏳ در انتظار تایید و بررسی مدیر',
                        'confirmed': '📦 تایید شده - در حال آماده‌سازی',
                        'shipped': '🚚 ارسال شده به پست',
                        'delivered': '✅ تحویل داده شده',
                        'rejected': '❌ رد شده توسط مدیر'
                      };
                      const trackingCode = p.postalTrackingCode || p.trackNumber || (partPurchases.find((item: any) => item.id === p.id)?.postalTrackingCode) || '';

                      return (
                        <tr key={p.id || idx} className="text-[11px] font-bold text-slate-700">
                          <td className="py-2.5 pr-2 font-mono text-slate-500 text-[10px]">{p.id}</td>
                          <td className="py-2.5 text-blue-800">{p.partName}</td>
                          <td className="py-2.5 text-[10.5px] font-normal text-slate-500">{p.partCategory}</td>
                          <td className="py-2.5 text-emerald-600 font-sans">{p.price?.toLocaleString('fa-IR')} ت</td>
                          <td className="py-2.5 text-[10px] font-normal text-slate-500">{p.date}</td>
                          <td className="py-2.5 font-mono text-[10.5px] text-indigo-700 select-all">
                            {trackingCode ? (
                              <span className="bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-bold dir-ltr inline-block tracking-wider">
                                {trackingCode}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">ثبت نشده</span>
                            )}
                          </td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] inline-block ${
                              p.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-150'
                                : p.status === 'shipped'
                                  ? 'bg-sky-50 text-sky-800 border border-sky-150'
                                  : 'bg-amber-50 text-amber-800 border border-amber-150'
                            }`}>
                              {purchaseStatusLabels[p.status] || p.status || 'در انتظار ارسال'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>

      {/* 2.4 Edit Profile Modal dialog view */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-[3px] text-right">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden max-w-sm w-full animate-in zoom-in-95 duration-150 p-6 space-y-4">
            <div className="border-b border-slate-150 pb-2.5 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 text-xs sm:text-xs">ویرایش مشخصات شخصی</h3>
              <button 
                onClick={() => setIsEditProfileOpen(false)}
                className="text-stone-400 hover:text-stone-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditProfileSubmit} className="space-y-4 text-right">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">نام و نام خانوادگی به فارسی</label>
                <input
                  required
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">شهر سکونت</label>
                <select
                  required
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:bg-white appearance-none"
                >
                  <option value="">انتخاب شهر...</option>
                  {citiesList && citiesList.map((c: any) => (
                    <option key={c.name} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">کلمه عبور جدید (اختیاری)</label>
                <input
                  type="password"
                  placeholder="اگر مایلید تغییر دهید"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:bg-white text-right"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 hover:bg-slate-50 border border-slate-200 font-bold rounded-xl text-xs transition-colors flex-1"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 px-4 rounded-xl text-xs transition-colors shadow-sm flex-1 disabled:bg-slate-350"
                >
                  {editLoading ? 'در حال ثبت نهایی...' : 'ثبت تغییرات مقتضی'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
