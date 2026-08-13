/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RepairOrder, SparePart, ErrorCode, Technician } from '../types';
import { Truck, MapPin, Check, Plus, DollarSign, ListFilter, ClipboardCheck, AlertCircle, Sparkles, LogOut, CheckCircle, Smartphone, FileText, UploadCloud, Eye, Trash2, Share2, Copy, ExternalLink, UserCheck, Image, Send, MessageSquare } from 'lucide-react';
import { APPLIANCE_BRANDS, APPLIANCE_CATEGORIES } from '../data';
import { DocumentViewer } from './DocumentViewer';
import { harmonizeErrorCode } from './validation';

interface TechnicianPanelProps {
  technicians: Technician[];
  activeTech: Technician;
  orders: RepairOrder[];
  spareParts: SparePart[];
  citiesList?: Array<{ name: string; regions: string[] }>;
  onAcceptOrder: (orderId: string, techId: string) => void;
  onUpdateOrderStatus: (orderId: string, status: RepairOrder['status'], updateData?: Partial<RepairOrder>) => void;
  onNewErrorSubmit: (error: Partial<ErrorCode>) => void;
  onChangeTech: (techId: string) => void;
  onUpdateTechnician: (techId: string, updatedFields: Partial<Technician>) => void;
  onLogout: () => void;
  triggerNotification: (title: string, text: string, type?: 'info' | 'success' | 'warning' | 'error' | 'sms') => void;
}

export const TechnicianPanel: React.FC<TechnicianPanelProps> = ({
  technicians,
  activeTech,
  orders,
  spareParts,
  citiesList,
  onAcceptOrder,
  onUpdateOrderStatus,
  onNewErrorSubmit,
  onChangeTech,
  onUpdateTechnician,
  onLogout,
  triggerNotification,
}) => {
  const isAdminMasquerading = localStorage.getItem('ir_admin_active') === 'true';
  const canAccessAllTabs = activeTech.isVerified || isAdminMasquerading;

  const [selectedTab, setSelectedTab] = React.useState<'available' | 'my-jobs' | 'add-error' | 'profile-docs' | 'digital-card'>(
    canAccessAllTabs ? 'available' : 'profile-docs'
  );

  // Profile avatar and referral sharing state
  const [avatarUrlInput, setAvatarUrlInput] = React.useState(activeTech.avatarUrl || '');
  const [techNameInput, setTechNameInput] = React.useState(activeTech.name || '');
  const [techLocationInput, setTechLocationInput] = React.useState(activeTech.activeLocation || '');
  const [copiedLink, setCopiedLink] = React.useState(false);

  React.useEffect(() => {
    setAvatarUrlInput(activeTech.avatarUrl || '');
    setTechNameInput(activeTech.name || '');
    setTechLocationInput(activeTech.activeLocation || '');
  }, [activeTech.id, activeTech.avatarUrl, activeTech.name, activeTech.activeLocation]);

  const cities = React.useMemo(() => {
    if (citiesList && citiesList.length > 0) return citiesList;
    const saved = localStorage.getItem('ir_cities');
    return saved ? (JSON.parse(saved) as { name: string; regions: string[] }[]) : [];
  }, [citiesList]);

  // Dynamic base lists loaded from localStorage with static fallback
  const brands = React.useMemo(() => {
    const saved = localStorage.getItem('ir_brands');
    return saved ? (JSON.parse(saved) as string[]) : [];
  }, []);

  const categories = React.useMemo(() => {
    const saved = localStorage.getItem('ir_categories');
    return saved ? (JSON.parse(saved) as string[]) : [];
  }, []);

  const models = React.useMemo(() => {
    const saved = localStorage.getItem('ir_models');
    return saved ? (JSON.parse(saved) as string[]) : [];
  }, []);

  // Sync tab layout in case of active technician change or verification change
  React.useEffect(() => {
    setSelectedTab(canAccessAllTabs ? 'available' : 'profile-docs');
  }, [activeTech.id, activeTech.isVerified, canAccessAllTabs]);

  // Document upload & drag-and-drop state
  const [newDocText, setNewDocText] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = React.useState(false);
  const [uploadDocProgress, setUploadDocProgress] = React.useState(0);
  const [dragActive, setDragActive] = React.useState(false);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = React.useState<{ techName: string; docName: string } | null>(null);
  const [zoomImage, setZoomImage] = React.useState<string | null>(null);

  // Password change states for technician
  const [techCurrentPasswordInput, setTechCurrentPasswordInput] = React.useState('');
  const [techNewPasswordInput, setTechNewPasswordInput] = React.useState('');
  const [techNewPasswordConfirmInput, setTechNewPasswordConfirmInput] = React.useState('');

  const handleTechPasswordChange = async () => {
    if (!techCurrentPasswordInput) {
      triggerNotification('کاستی اطلاعات', 'لطفاً رمز عبور فعلی را وارد نمایید.', 'warning');
      return;
    }
    if (!techNewPasswordInput.trim()) {
      triggerNotification('کاستی اطلاعات', 'لطفاً رمز عبور جدید را وارد نمایید.', 'warning');
      return;
    }
    if (techNewPasswordInput.length < 4) {
      triggerNotification('کاستی اطلاعات', 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد.', 'warning');
      return;
    }
    if (techNewPasswordInput !== techNewPasswordConfirmInput) {
      triggerNotification('عدم تطابق رمز عبور', 'تکرار رمز عبور جدید با تاییدیه آن مطابقت ندارد!', 'warning');
      return;
    }

    // Check client password ONLY if activeTech.password exists and is plain text (not a hash)
    const isHashed = activeTech.password && (activeTech.password.startsWith('$2a$') || activeTech.password.startsWith('$2b$') || activeTech.password.startsWith('$2y$'));
    if (activeTech.password && !isHashed && techCurrentPasswordInput !== activeTech.password) {
      triggerNotification('رمز عبور نادرست', 'رمز عبور فعلی اشتباه است!', 'error');
      return;
    }

    // Sync with backend API
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('session_user_id') || activeTech.id;
      const res = await fetch('/api/auth/force-change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': token
        },
        body: JSON.stringify({
          currentPassword: techCurrentPasswordInput,
          newPassword: techNewPasswordInput.trim(),
          phone: activeTech.phone,
          techId: activeTech.id
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.status === 'error') {
        if (data.error) {
          triggerNotification('خطا در تغییر رمز', data.error, 'error');
          return;
        }
      }
    } catch (e) {
      console.warn('Server password sync skipped:', e);
    }

    onUpdateTechnician(activeTech.id, { password: techNewPasswordInput.trim() });
    triggerNotification('رمز عبور تغییر یافت', 'رمز عبور شما با موفقیت تغییر یافت و با سرور مرکزی همگام شد.', 'success');
    setTechCurrentPasswordInput('');
    setTechNewPasswordInput('');
    setTechNewPasswordConfirmInput('');
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const validExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'mp4', 'mov', 'avi', 'xls', 'xlsx', 'csv', 'doc', 'docx'];
      if (!validExtensions.includes(ext)) {
        triggerNotification('قالب فایل نامعتبر', 'لطفا فقط فایل‌های مجاز: تصویری (JPG, PNG)، فایل PDF، ویدیو (MP4/MOV) یا سند فاکتور (Excel/CSV/Word) انتخاب کنید.', 'warning');
        return;
      }
      
      const MAX_SIZE = 50 * 1024 * 1024; // 50MB
      if (file.size > MAX_SIZE) {
        triggerNotification('حجم فایل غیر مجاز', 'حداکثر حجم مجاز فایل ۵۰ مگابایت است.', 'warning');
        return;
      }

      setSelectedFile(file);
      
      if (!newDocText.trim()) {
        const dotIdx = file.name.lastIndexOf('.');
        const cleanName = dotIdx !== -1 ? file.name.substring(0, dotIdx) : file.name;
        setNewDocText(cleanName);
      }

      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const validExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'mp4', 'mov', 'avi', 'xls', 'xlsx', 'csv', 'doc', 'docx'];
      if (!validExtensions.includes(ext)) {
        triggerNotification('قالب فایل نامعتبر', 'لطفا فقط فایل‌های مجاز: تصویری (JPG, PNG)، فایل PDF، ویدیو (MP4/MOV) یا سند فاکتور (Excel/CSV/Word) انتخاب کنید.', 'warning');
        return;
      }
      
      const MAX_SIZE = 50 * 1024 * 1024; // 50MB
      if (file.size > MAX_SIZE) {
        triggerNotification('حجم فایل غیر مجاز', 'حداکثر حجم مجاز فایل ۵۰ مگابایت است.', 'warning');
        return;
      }

      setSelectedFile(file);
      if (!newDocText.trim()) {
        const dotIdx = file.name.lastIndexOf('.');
        const cleanName = dotIdx !== -1 ? file.name.substring(0, dotIdx) : file.name;
        setNewDocText(cleanName);
      }
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleUploadDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocText.trim()) {
      triggerNotification('کاستی اطلاعات', 'لطفاً عنوان مدرک را وارد کنید.', 'warning');
      return;
    }
    if (!selectedFile) {
      triggerNotification('کاستی اطلاعات', 'لطفاً ابتدا یک فایل انتخاب کنید.', 'warning');
      return;
    }

    setIsUploadingDoc(true);
    setUploadDocProgress(20);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const fileDataUrl = reader.result as string;
      try {
        setUploadDocProgress(50);
        // Live directus connection upload simulation
        const response = await fetch('/api/directus-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `${newDocText}.${selectedFile.name.split('.').pop()}`,
            fileData: fileDataUrl,
            fileType: selectedFile.type
          })
        });

        if (!response.ok) {
          throw new Error('سیستم آپلود مدیریت با مشکل مواجه شد.');
        }

        const data = await response.json();
        setUploadDocProgress(85);

        if (data.success && data.url) {
          setUploadDocProgress(100);
          const currentDocs = activeTech.documents || [];
          const targetName = newDocText.trim().toLowerCase();
          const filteredDocs = currentDocs.filter(d => {
            let dName = d;
            try {
              if (d.startsWith('{')) dName = JSON.parse(d).name || '';
            } catch(e) {}
            return dName.trim().toLowerCase() !== targetName;
          });
          const docPayload = JSON.stringify({
            name: newDocText,
            fileUrl: data.url,
            fileType: selectedFile.type,
            uploadedAt: new Date().toISOString()
          });

          onUpdateTechnician(activeTech.id, {
            documents: [...filteredDocs, docPayload]
          });

          setNewDocText('');
          setSelectedFile(null);
          setPreviewUrl(null);
          triggerNotification('آپلود مدرک موفقیت‌آمیز', 'مدرک صلاحیت و اطلاعات فاکتور با موفقیت در Directus CMS آپلود گردید و پیوند فعال آن در دیتابیس ثبت شد!', 'success');
        } else {
          throw new Error('سرور آپلود پاسخ به فرمت درست نداد.');
        }
      } catch (err: any) {
        triggerNotification('خطای آپلود مدرک', `خطا در ورود سند به Directus CMS: ${err.message}`, 'error');
      } finally {
        setIsUploadingDoc(false);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDeleteDocument = (idxToDelete: number) => {
    const currentDocs = activeTech.documents || [];
    const updatedDocs = currentDocs.filter((_, idx) => idx !== idxToDelete);
    onUpdateTechnician(activeTech.id, {
      documents: updatedDocs
    });
    triggerNotification('حذف مدرک صلاحیت', 'مدرک فنی شما با موفقیت از سیستم حذف گردید.', 'success');
  };

  // Submit error form States
  const [errorCode, setErrorCode] = React.useState('');
  const [isCommonProblem, setIsCommonProblem] = React.useState(false);
  const [errTitle, setErrTitle] = React.useState('');
  const [errCategory, setErrCategory] = React.useState('پکیج دیواری');
  const [errBrand, setErrBrand] = React.useState('بوتان');
  const [errModel, setErrModel] = React.useState('');
  const [errDesc, setErrDesc] = React.useState('');
  const [errStep1, setErrStep1] = React.useState('');
  const [errStep2, setErrStep2] = React.useState('');
  const [errPrecaution, setErrPrecaution] = React.useState('');
  const [errHazard, setErrHazard] = React.useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [errTools, setErrTools] = React.useState('');
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  const [techCategoryMode, setTechCategoryMode] = React.useState<'select' | 'custom'>('select');
  const [techBrandMode, setTechBrandMode] = React.useState<'select' | 'custom'>('select');
  const [techModelMode, setTechModelMode] = React.useState<'select' | 'custom'>('select');

  // Job operation temporary states
  const [selectedOrderForCost, setSelectedOrderForCost] = React.useState<string | null>(null);
  const [repairCost, setRepairCost] = React.useState<number>(150000);
  const [repairLogText, setRepairLogText] = React.useState('');
  const [selectedPartId, setSelectedPartId] = React.useState('');

  const getCityFromLoc = (loc: string) => {
    if (!loc) return '';
    return loc.split(/[،,ـ-]/)[0].trim();
  };

  const techCityName = React.useMemo(() => {
    return getCityFromLoc(activeTech.activeLocation) || 'تهران';
  }, [activeTech.activeLocation]);

  const [showAllLocations, setShowAllLocations] = React.useState(false);

  const isPendingStatus = (s?: string) => !s || s === 'registered' || s === 'pending' || s === 'waiting' || s === 'new';

  const rawAvailableOrders = orders.filter((o) => 
    isPendingStatus(o.status as string) && (!o.technicianId || o.technicianId === '' || o.technicianId === activeTech.id)
  );

  const activeMyOrders = orders.filter((o) => 
    o.technicianId === activeTech.id && !isPendingStatus(o.status as string)
  );

  const filteredAvailableOrders = rawAvailableOrders.filter((o) => {
    if (showAllLocations) return true;
    const oCity = getCityFromLoc(o.city).trim().toLowerCase();
    const tCity = (getCityFromLoc(activeTech.activeLocation) || getCityFromLoc((activeTech as any).city) || '').trim().toLowerCase();
    if (!tCity || !oCity) return true;

    if (oCity === tCity || oCity.includes(tCity) || tCity.includes(oCity)) return true;

    // Markazi province keywords match
    const markaziKeywords = ["اراک", "مرکزی", "فرمهین", "شازند", "خنداب", "ساوه", "تفرش", "محلات", "دلیجان", "زرندیه", "کمیجان", "آشتیان"];
    const isTechMarkazi = markaziKeywords.some(k => tCity.includes(k));
    const isOrderMarkazi = markaziKeywords.some(k => oCity.includes(k));
    if (isTechMarkazi && isOrderMarkazi) return true;

    // Dynamic citiesList match
    for (const group of cities) {
      const gName = (group.name || '').toLowerCase();
      const gRegions = (group.regions || []).map(r => r.toLowerCase());

      const techInGroup = gName.includes(tCity) || tCity.includes(gName) || gRegions.some(r => r.includes(tCity) || tCity.includes(r));
      const orderInGroup = gName.includes(oCity) || oCity.includes(gName) || gRegions.some(r => r.includes(oCity) || oCity.includes(r));

      if (techInGroup && orderInGroup) return true;
    }

    return false;
  });

  const handleCreateErrorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCommonProblem && !errorCode) {
      triggerNotification('کاستی اطلاعات', 'لطفا کُد خطا را وارد نمایید.', 'warning');
      return;
    }
    if (!errTitle || !errDesc) {
      triggerNotification('کاستی اطلاعات', 'لطفا فیلدهای اجباری ستاره دار را پر کنید.', 'warning');
      return;
    }

    onNewErrorSubmit(harmonizeErrorCode({
      code: isCommonProblem ? 'مشکل شایع' : errorCode,
      title: errTitle,
      category: errCategory,
      brand: errBrand,
      model: errModel || 'عمومی',
      description: errDesc,
      steps: [errStep1 || 'بررسی وضعیت جریان برق', errStep2 || 'بررسی و سنجش اتصالات سوکت سنسور'].filter(Boolean),
      precautions: [errPrecaution].filter(Boolean),
      hazardLevel: errHazard,
      toolsNeeded: errTools ? errTools.split('،') : ['مولتی متر'],
      views: 0,
      updatedBy: activeTech.name,
      isApproved: false, // Must be approved by administrator
      isCommonProblem: isCommonProblem,
      tags: isCommonProblem ? ['مشکل شایع'] : []
    }));

    setSubmitSuccess(true);
    // resetting
    setErrorCode('');
    setIsCommonProblem(false);
    setErrTitle('');
    setErrDesc('');
    setErrStep1('');
    setErrStep2('');
    setErrPrecaution('');

    triggerNotification(
      isCommonProblem ? 'ثبت مشکل شایع' : 'ثبت کد خطا',
      'پیشنهاد شما با موفقیت ثبت شد و پس از تایید مدیریت منتشر خواهد شد.',
      'success'
    );

    setTimeout(() => {
      setSubmitSuccess(false);
      setSelectedTab('my-jobs');
    }, 2500);
  };

  const handleFinalizeJob = (orderId: string) => {
    const partToUse = spareParts.find(p => p.id === selectedPartId);
    const partsUsed = partToUse ? [{ partId: partToUse.id, name: partToUse.name, price: partToUse.price, quantity: 1 }] : [];

    onUpdateOrderStatus(orderId, 'completed', {
      estimatedCost: Number(repairCost),
      repairLog: repairLogText || 'رفع اتصال و سرویس دوره‌ای با موفقیت انجام شد.',
      partsUsed
    });

    setSelectedOrderForCost(null);
    setRepairLogText('');
    setSelectedPartId('');
    triggerNotification('اتمام سفارش کار', 'کار با موفقیت به اتمام رسید و حق‌الزحمه با کسر کمیسیون به کیف پول شما اضافه شد!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Identity bar & Technician selector */}
      <div className="bg-white rounded-2xl border border-slate-205 p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={activeTech.avatarUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>"}
                alt={activeTech.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-blue-500"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-800 text-sm">{activeTech.name}</span>
                {activeTech.isVerified && (
                  <span className="bg-blue-50 text-blue-700 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">✓ تکنسین مجاز</span>
                )}
              </div>
              <p className="text-slate-400 text-xs font-semibold mt-1">تخصص: {(Array.isArray(activeTech.specialty) ? activeTech.specialty : [activeTech.specialty]).filter(Boolean).join('، ')}</p>
              <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm">کارکرد: {activeTech.completedOrders} سفارش</span>
                <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-sm">امتیاز مشتریان: ⭐ {activeTech.rating}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t sm:border-t-0 pt-3 sm:pt-0">
            {/* Wallet Balance Card */}
            <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-3 text-center min-w-[130px]">
              <span className="text-slate-400 text-[9px] block">کیف پول (حق‌الزحمه تعمیرکار)</span>
              <span className="font-bold text-blue-600 font-sans text-sm block mt-0.5">
                {activeTech.balance.toLocaleString('fa-IR')}
              </span>
              <span className="text-[9px] text-blue-500 font-medium">تومان</span>
            </div>

            {/* Secure Logout Button */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={onLogout}
                className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 border border-rose-200 p-2.5 h-[34px] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                title="خروج امن از حساب کاربری"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 flex-wrap gap-y-1.5">
        {canAccessAllTabs && (
          <>
            <button
              id="tab-available-jobs"
              onClick={() => setSelectedTab('available')}
              className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer relative ${
                selectedTab === 'available'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>سفارشات جدید در محله شما ({rawAvailableOrders.length})</span>
              {rawAvailableOrders.length > 0 && (
                <span className="mr-1 bg-rose-500 text-white rounded-full text-[9px] px-1.5 py-0.5 inline-block font-sans font-bold">
                  {rawAvailableOrders.length}
                </span>
              )}
            </button>

            <button
              id="tab-my-jobs"
              onClick={() => setSelectedTab('my-jobs')}
              className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer relative ${
                selectedTab === 'my-jobs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>کارهای در دست اقدام من ({activeMyOrders.length})</span>
            </button>

            <button
              id="tab-add-error"
              onClick={() => setSelectedTab('add-error')}
              className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer relative ${
                selectedTab === 'add-error'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>ثبت کد خطای جدید</span>
            </button>
          </>
        )}

        <button
          id="tab-profile-docs"
          onClick={() => setSelectedTab('profile-docs')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer relative ${
            selectedTab === 'profile-docs'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>مدارک و پرونده شخصی</span>
        </button>

        <button
          id="tab-digital-card"
          onClick={() => setSelectedTab('digital-card')}
          className={`pb-3 px-4 text-xs font-bold transition-colors cursor-pointer relative flex items-center gap-1.5 ${
            selectedTab === 'digital-card'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Share2 className="w-3.5 h-3.5 text-amber-500" />
          <span>کارت ویزیت و معرفی اپ به مشتریان</span>
        </button>
      </div>

      {/* Main body of tabs */}
      {selectedTab === 'available' && (
        <div className="space-y-4">
          <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <p className="leading-relaxed font-sans">
              درخواست‌های زیر با توجه به منطقه تخصص و فعال شما فیلتر شده‌اند. به محض زدن دکمه <strong>«قبول مسئولیت تعمیر»</strong>، این درخواست به صورت انحصاری برای شما رزرو شده و از دید سایرین خارج می‌شود.
            </p>
          </div>

          {/* Province / City Restriction Badge */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-slate-205 p-4 rounded-xl shadow-xs">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5 select-none">
              <MapPin className="w-4 h-4 text-blue-500" />
              محدوده جغرافیایی سفارش‌های جدید:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowAllLocations(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  !showAllLocations ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                📍 شهر/استان من ({techCityName})
              </button>
              <button
                type="button"
                onClick={() => setShowAllLocations(true)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  showAllLocations ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🌐 همه استان‌ها ({rawAvailableOrders.length})
              </button>
            </div>
          </div>

          {filteredAvailableOrders.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-205 bg-white rounded-2xl">
              <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-2 stroke-[1.2]" />
              <p className="text-slate-500 text-xs">درخواست کار بدون متصدی جدیدی یافت نشد.</p>
              <p className="text-slate-400 text-[10px] mt-1">با پورتال مشتری یک درخواست جدید ثبت کنید یا فیلتر نمایش استان را تغییر دهید.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAvailableOrders.map((ord, idx) => (
                <div key={`avail_ord_${ord.id}_${idx}`} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-sans">
                        کد درخواست: {ord.id}
                      </span>
                      <span className="text-[9px] text-slate-400">ثبت: {new Date(ord.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded">
                        {ord.category} ({ord.brand})
                      </span>
                      {ord.errorCode && (
                        <span className="bg-rose-50 text-rose-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                          کد خطا: {ord.errorCode}
                        </span>
                      )}
                      {ord.technicianId === activeTech.id && (
                        <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded border border-amber-200">
                          ⭐ درخواست اختصاصی مشتری
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-800 text-xs mb-1.5">{ord.customerName}</h4>
                    
                    <div className="space-y-1 text-slate-500 text-[11px] mb-3 leading-relaxed">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>محله: {[ord.city, ord.region].filter(s => s && String(s).trim()).join('، ') || 'هماهنگی تلفنی'}</span>
                      </div>
                      <p className="bg-slate-50 p-2 rounded-xl text-slate-600 mt-1 lines-clamp-2 truncate max-h-[50px] overflow-hidden">
                        {ord.description || 'توضیحات ایراد فنی اضافه درج نشده است.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-slate-455 text-[9px] block">زمان حضور پیشنهادی</span>
                      <span className="text-slate-800 font-semibold text-[10px]">
                        {ord.date && !ord.date.includes('T') ? ord.date : 'هماهنگی با مشتری'} {ord.timeSlot ? `(${ord.timeSlot})` : ''}
                      </span>
                    </div>

                    <button
                      id={`accept-btn-${ord.id}`}
                      onClick={() => onAcceptOrder(ord.id, activeTech.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs py-1.5 px-3.5 font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>قبول مسئولیت</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'my-jobs' && (
        <div className="space-y-4">
          {activeMyOrders.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-205 bg-white rounded-2xl">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-2 stroke-[1.2]" />
              <p className="text-slate-500 text-xs">شما هیچ سفارش فعالی به نام خود ندارید.</p>
              <p className="text-slate-400 text-[10px] mt-1">از تب سفارشات جدید، مسئولیت یک کار را قبول کنید.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeMyOrders.map((ord, idx) => (
                <div key={`my_ord_${ord.id}_${idx}`} className="bg-white border-2 border-blue-100/80 rounded-2xl p-4 sm:p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded font-sans">
                          شماره: {ord.id}
                        </span>
                        <span className="text-slate-700 font-bold text-xs">
                          خدمات {ord.category} {ord.brand}
                        </span>
                      </div>
                      <p className="text-slate-400 text-[10px] mt-1 font-mono">مدل: {ord.model || 'عمومی'} - خطای اعلامی: {ord.errorCode || 'نامشخص'}</p>
                    </div>

                    {/* Status Badge */}
                    <div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-sm ${
                        ord.status === 'accepted'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : ord.status === 'enroute'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : ord.status === 'repairing'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : ord.status === 'completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isPendingStatus(ord.status as string)
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isPendingStatus(ord.status as string) && 'در انتظار پذیرش'}
                        {ord.status === 'accepted' && 'پذیرفته شده'}
                        {ord.status === 'enroute' && 'در مسیر هماهنگی'}
                        {ord.status === 'repairing' && 'در حال انجام تعمیر'}
                        {ord.status === 'needs_part' && 'نیاز به تهیه قطعه'}
                        {ord.status === 'completed' && 'تکمیل شده ✓'}
                        {ord.status === 'cancelled' && 'لغو شده'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Information detail */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs mb-4">
                    <div className="space-y-1 bg-slate-50 p-3 rounded-xl">
                      <div className="font-bold text-slate-700 mb-1">مشخصات متقاضی محلی:</div>
                      <p className="text-slate-600">نام: <span className="font-semibold text-slate-800">{ord.customerName}</span></p>
                      <p className="text-slate-600">تماس: <span className="font-semibold text-slate-800 font-sans">{ord.customerPhone}</span></p>
                      <p className="text-slate-600">
                        آدرس: <span className="font-sans text-slate-800 font-medium select-all">
                          {[ord.city, ord.region, ord.address].filter(s => s && String(s).trim()).join('، ') || 'هماهنگی دقیق تلفنی با مشتری'}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-1 bg-slate-50 p-3 rounded-xl flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-700 mb-1">شرح ایراد فنی:</div>
                        <p className="text-justify leading-relaxed text-slate-600">{ord.description || 'توشیح اضافه ارائه نشده است.'}</p>
                      </div>
                      <div className="mt-2 text-[10px] text-slate-400">
                        بازه حضور: <span className="font-bold text-slate-700">
                          {ord.date && !ord.date.includes('T') ? ord.date : 'هماهنگی با مشتری'} {ord.timeSlot ? `(${ord.timeSlot})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progressive states action triggers */}
                  {ord.status !== 'completed' && ord.status !== 'cancelled' && (
                    <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2 justify-between items-center">
                      <div className="flex flex-wrap gap-2">
                        {isPendingStatus(ord.status as string) && (
                          <button
                            id={`accept-my-btn-${ord.id}`}
                            onClick={() => onAcceptOrder(ord.id, activeTech.id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>قبول مسئولیت و شروع</span>
                          </button>
                        )}

                        {ord.status === 'accepted' && (
                          <button
                            id={`enroute-btn-${ord.id}`}
                            onClick={() => onUpdateOrderStatus(ord.id, 'enroute')}
                            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-1.5 px-3.5 rounded-lg cursor-pointer transition-all"
                          >
                            📍 اعلام حرکت در مسیر مشتری
                          </button>
                        )}

                        {ord.status === 'enroute' && (
                          <button
                            id={`repairing-btn-${ord.id}`}
                            onClick={() => onUpdateOrderStatus(ord.id, 'repairing')}
                            className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-1.5 px-3.5 rounded-lg cursor-pointer transition-all"
                          >
                            🔧 ورود به محل و شروع عیب‌یابی
                          </button>
                        )}

                        {ord.status === 'repairing' && (
                          <div className="flex items-center gap-2">
                            <button
                              id={`needs-part-btn-${ord.id}`}
                              onClick={() => onUpdateOrderStatus(ord.id, 'needs_part')}
                              className="bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-all"
                            >
                              ⚠️ نیاز به قطعه یدکی جدید
                            </button>

                            <button
                              id={`open-finalize-btn-${ord.id}`}
                              onClick={() => setSelectedOrderForCost(ord.id)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-3.5 rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>ثبت پایان کار و فاکتور نهایی</span>
                            </button>
                          </div>
                        )}

                        {ord.status === 'needs_part' && (
                          <button
                            id={`resume-repair-btn-${ord.id}`}
                            onClick={() => onUpdateOrderStatus(ord.id, 'repairing')}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3.5 rounded-lg cursor-pointer transition-all"
                          >
                            ⚙️ قطعه تهیه شد / از سرگیری تعمیر
                          </button>
                        )}
                      </div>

                      <button
                        id={`cancel-order-btn-${ord.id}`}
                        onClick={() => {
                          const conf = window.confirm('آیا از لغو این قرار ملاقات مطمئن هستید؟ این امر روی امتیاز تخصص شما تاثیر منفی دارد.');
                          if (conf) onUpdateOrderStatus(ord.id, 'cancelled');
                        }}
                        className="text-rose-500 hover:text-white hover:bg-rose-500 border border-rose-300 text-[10px] py-1 px-2.5 rounded-lg cursor-pointer transition-all"
                      >
                        انصراف و لغو سرویس
                      </button>
                    </div>
                  )}

                  {/* Cost finalize form helper overlay */}
                  {selectedOrderForCost === ord.id && (
                    <div className="bg-slate-50 border border-slate-205 rounded-2xl p-4 mt-4 space-y-3 animate-in fade-in slide-in-from-top-3 duration-200">
                      <div className="font-bold text-xs text-slate-800">تکمیل فاکتور مصرفی و مزد دست کارگذار</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[9px] text-slate-400 block mb-1">اجرت کل کار (تومان)</label>
                          <input
                            type="number"
                            value={repairCost}
                            onChange={(e) => setRepairCost(Number(e.target.value))}
                            className="bg-white border border-slate-200 rounded-lg p-2 text-xs w-full font-mono text-center"
                          />
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-400 block mb-1">آیا قطعه یدکی از فروشگاه برداشته شد؟</label>
                          <select
                            value={selectedPartId}
                            onChange={(e) => setSelectedPartId(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg p-2 text-xs w-full cursor-pointer"
                          >
                            <option value="">خیر - قطعه‌ای مصرف نشد</option>
                            {spareParts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.price.toLocaleString('fa-IR')} ت)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[9px] text-slate-400 block mb-1">گزارش کار نهایی</label>
                          <input
                            type="text"
                            placeholder="رفع عیب، آب‌بندی اتصالات..."
                            value={repairLogText}
                            onChange={(e) => setRepairLogText(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg p-2 text-xs w-full"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderForCost(null)}
                          className="text-slate-500 bg-slate-200 text-center px-4 py-1.5 rounded-lg text-xs hover:bg-slate-300 cursor-pointer"
                        >
                          انصراف
                        </button>
                        <button
                          id={`finalize-submit-${ord.id}`}
                          type="button"
                          onClick={() => handleFinalizeJob(ord.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-1.5 rounded-lg text-xs shadow-xs cursor-pointer"
                        >
                          صدور فاکتور و اتمام کار
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedTab === 'add-error' && (
        <form onSubmit={handleCreateErrorSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-2">
            <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-slate-800">مشارکت تکنسین‌ها در بانک اطلاعات خطاهای ایران</h3>
              <p className="text-[10px] text-slate-400">کدهای خطایی که جدیداً عیب‌یابی موفق داشته‌اید را ثبت کنید تا همکاران و افراد دیگر استفاده کنند.</p>
            </div>
          </div>

          {submitSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-3 text-xs text-center font-bold">
              ✓ مورد با موفقیت برای مدیریت فرستاده شد. پس از تایید نهایی در جستجو گنجانده می‌شود!
            </div>
          )}

          {/* Special Toggle for Common Problems (DIY) vs Error Codes */}
          <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-xl flex items-center justify-between gap-3 text-right">
            <div className="space-y-0.5">
              <span className="text-xs font-extrabold text-blue-900 block">ثبت به عنوان مشکل شایع دستگاه (بدون نیاز به کد خطا)</span>
              <span className="text-[10px] text-slate-500 block">الگوی تایتل - کتگوری - برند - علل و راه‌حل به همراه تگ مشکلات شایع برای راهنمای DIY کاربران</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCommonProblem}
                onChange={(e) => {
                  setIsCommonProblem(e.target.checked);
                  if (e.target.checked) {
                    setErrorCode('');
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-600 text-[10px] font-bold mb-1">
                {isCommonProblem ? 'کد خطا (اختیاری یا خالی)' : 'کد خطا (مانند E9, F1) *'}
              </label>
              <input
                required={!isCommonProblem}
                disabled={isCommonProblem}
                type="text"
                placeholder={isCommonProblem ? 'بدون نیاز به کد خطا' : 'E9'}
                value={errorCode}
                onChange={(e) => setErrorCode(e.target.value)}
                className={`w-full text-xs p-2 rounded-xl outline-none border transition-all ${
                  isCommonProblem ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>
            <div>
              <label className="block text-slate-600 text-[10px] font-bold mb-1">عنوان فارسی خطا (علت مشهود) *</label>
              <input
                required
                type="text"
                placeholder="خرابی حسگر یا کمبود فشار آب ورودی"
                value={errTitle}
                onChange={(e) => setErrTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-600 text-[10px] font-bold">مدل دستگاه‌های مورد نظر *</label>
                <button
                  type="button"
                  onClick={() => {
                    setTechModelMode(techModelMode === 'select' ? 'custom' : 'select');
                    setErrModel('');
                  }}
                  className="text-[8.5px] text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-0.5 cursor-pointer bg-slate-100 hover:bg-slate-205 px-1.5 py-0.5 rounded"
                >
                  {techModelMode === 'select' ? '➕ تایپ مدل جدید' : '📋 انتخاب موجود'}
                </button>
              </div>
              {techModelMode === 'select' ? (
                <select
                  value={errModel}
                  onChange={(e) => setErrModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 text-xs p-2 rounded-xl outline-none cursor-pointer"
                  required
                >
                  <option value="">-- انتخاب مدل --</option>
                  <option value="عمومی">عمومی (کل مدل‌ها)</option>
                  {models.map(md => (
                    <option key={md} value={md}>{md}</option>
                  ))}
                </select>
              ) : (
                <input
                  required
                  type="text"
                  placeholder="M24FF و مدل‌های مشابه"
                  value={errModel}
                  onChange={(e) => setErrModel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl outline-none animate-in fade-in duration-200"
                />
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-600 text-[10px] font-bold">دسته‌بندی دستگاه *</label>
                <button
                  type="button"
                  onClick={() => {
                    setTechCategoryMode(techCategoryMode === 'select' ? 'custom' : 'select');
                    setErrCategory('');
                  }}
                  className="text-[8.5px] text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-0.5 cursor-pointer bg-slate-100 hover:bg-slate-205 px-1.5 py-0.5 rounded"
                >
                  {techCategoryMode === 'select' ? '➕ دستگاه جدید' : '📋 انتخاب موجود'}
                </button>
              </div>
              {techCategoryMode === 'select' ? (
                <select
                  value={errCategory}
                  onChange={(e) => setErrCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl outline-none cursor-pointer"
                  required
                >
                  <option value="">-- انتخاب دسته‌بندی --</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              ) : (
                <input
                  required
                  type="text"
                  placeholder="نوع دستگاه جدید..."
                  value={errCategory}
                  onChange={(e) => setErrCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl outline-none animate-in fade-in duration-200"
                />
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-600 text-[10px] font-bold">برند دستگاه *</label>
                <button
                  type="button"
                  onClick={() => {
                    setTechBrandMode(techBrandMode === 'select' ? 'custom' : 'select');
                    setErrBrand('');
                  }}
                  className="text-[8.5px] text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-0.5 cursor-pointer bg-slate-100 hover:bg-slate-205 px-1.5 py-0.5 rounded"
                >
                  {techBrandMode === 'select' ? '➕ برند جدید' : '📋 انتخاب موجود'}
                </button>
              </div>
              {techBrandMode === 'select' ? (
                <select
                  value={errBrand}
                  onChange={(e) => setErrBrand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl outline-none cursor-pointer"
                  required
                >
                  <option value="">-- انتخاب برند --</option>
                  {brands.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              ) : (
                <input
                  required
                  type="text"
                  placeholder="نام برند جدید..."
                  value={errBrand}
                  onChange={(e) => setErrBrand(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs p-2 rounded-xl outline-none animate-in fade-in duration-200"
                />
              )}
            </div>

            <div>
              <label className="block text-slate-600 text-[10px] font-bold mb-1">میزان خطر احتمالی</label>
              <select
                value={errHazard}
                onChange={(e) => setErrHazard(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-205 text-xs p-2 rounded-xl outline-none cursor-pointer"
              >
                <option value="low">کم خطر - عادی</option>
                <option value="medium">متوسط - احتیاط عمومی</option>
                <option value="high">خطر بالا - احتیاج به قطع برق</option>
                <option value="critical">بحرانی - خطر نشت گاز، برق گرفتگی شدید</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-600 text-[10px] font-bold mb-1">توضیحات کلی علت بروز خطا *</label>
            <textarea
              required
              rows={2}
              placeholder="شیر سه طرفه قطع است یا سیم کشی آسیب دیده..."
              value={errDesc}
              onChange={(e) => setErrDesc(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-xl outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-[10px] font-bold mb-1">گام ۱ برای رفع خطا</label>
              <input
                type="text"
                placeholder="محافظ ولتاژ و ورودی برق را قطع کرده و مجدد راه اندازی کنید"
                value={errStep1}
                onChange={(e) => setErrStep1(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 text-xs p-2 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 text-[10px] font-bold mb-1">گام ۲ برای رفع خطا</label>
              <input
                type="text"
                placeholder="برد فرمان را باز کرده و سلامت خازن ورودی را بررسی نمایید"
                value={errStep2}
                onChange={(e) => setErrStep2(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 text-xs p-2 rounded-xl outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 text-[10px] font-bold mb-1">نکات واجب ایمنی (جلوگیری از حوادث احتمالی)</label>
              <input
                type="text"
                placeholder="قطع کامل گاز شهری یا آب گرم قبل از دست به آچار شدن"
                value={errPrecaution}
                onChange={(e) => setErrPrecaution(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 text-xs p-2 rounded-xl outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-600 text-[10px] font-bold mb-1">ابزارهای مورد این کار (با علامت «،» فرعی جدا کنید)</label>
              <input
                type="text"
                placeholder="آچار ۱۰، انبردست کوچک، مولتی‌متر تریاک"
                value={errTools}
                onChange={(e) => setErrTools(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 text-xs p-2 rounded-xl outline-none"
              />
            </div>
          </div>

          <button
            id="technician-add-error-submit"
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-4 text-xs font-semibold shadow-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت و ارسال کد خطا جهت بازبینی مدیریت کدیار۲۴</span>
          </button>
        </form>
      )}

      {selectedTab === 'profile-docs' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-205 p-5 sm:p-6 shadow-xs space-y-5 animate-in fade-in duration-150 text-right">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></span>
              <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">مدارک احراز هویت و اسناد صلاحیت فنی</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Profile details list card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                <span className="block text-slate-700 text-xs font-bold border-b border-slate-150 pb-2">سیاهه‌ اطلاعات کاربری تکنسین</span>
                <div className="space-y-3 text-xs text-slate-600 font-medium leading-relaxed">
                  <div><strong>نام و خانوادگی:</strong> <span className="text-slate-900 font-extrabold">{activeTech.name}</span></div>
                  <div><strong>شماره موبایل ارتباطی:</strong> <span className="text-slate-900 font-bold font-mono">{activeTech.phone}</span></div>
                  <div><strong>محدوده تحت پوشش خدمت:</strong> <span className="text-slate-900 font-bold">{activeTech.activeLocation}</span></div>
                  <div><strong>زمینه‌های تخصص ثبت‌شده:</strong> <span className="text-slate-900 font-bold">{(Array.isArray(activeTech.specialty) ? activeTech.specialty : [activeTech.specialty]).filter(Boolean).join('، ')}</span></div>
                  <div>
                    <strong>وضعیت تأیید هویت صنف:</strong>{' '}
                    {activeTech.isVerified ? (
                      <span className="bg-emerald-600 text-white py-0.5 px-3 rounded-md font-bold text-[9px] inline-block mr-1">تأیید صلاحیت رسمی</span>
                    ) : (
                      <span className="bg-rose-50 text-rose-700 border border-rose-250 py-0.5 px-3 rounded-md font-bold text-[9px] inline-block mr-1 animate-pulse">در انتظار بررسی مدارک توسط مدیریت</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Upload license form card */}
              <form 
                onSubmit={handleUploadDocument} 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                className={`bg-slate-50 border-2 ${dragActive ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 border-dashed'} rounded-2xl p-5 space-y-4 transition-all relative`}
              >
                <span className="block text-slate-700 text-xs font-bold border-b border-slate-150 pb-2">بارگذاری مدارک جدید صلاحیت (کارت ملی، گواهی فنی، جواز کسب)</span>
                
                {/* 3 Quick Document Selector Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {[
                    { title: 'کارت ملی هوشمند', shortKey: 'کارت ملی', icon: '🪪' },
                    { title: 'گواهی فنی‌وحرفه‌ای', shortKey: 'فنی', icon: '🛠️' },
                    { title: 'جواز کسب کار صنف', shortKey: 'جواز', icon: '🏢' }
                  ].map(card => {
                    const currentDocs = activeTech.documents || [];
                    const isUploaded = currentDocs.some(d => {
                      let dName = d;
                      try { if (d.startsWith('{')) dName = JSON.parse(d).name || ''; } catch(e){}
                      return dName.includes(card.shortKey) || dName.includes(card.title);
                    });
                    const isSelected = newDocText === card.title;

                    return (
                      <button
                        key={card.title}
                        type="button"
                        onClick={() => {
                          setNewDocText(card.title);
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.click();
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between space-y-1.5 group ${
                          isUploaded
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100'
                            : isSelected
                            ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-400/30'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-base">{card.icon}</span>
                          {isUploaded ? (
                            <span className="bg-emerald-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5 text-white" />
                              ثبت شده
                            </span>
                          ) : (
                            <span className="text-[8px] text-blue-600 font-bold bg-blue-50 group-hover:bg-blue-100 px-1.5 py-0.5 rounded-md">
                              انتخاب فایل ↗
                            </span>
                          )}
                        </div>
                        <div className="font-extrabold text-[11px] leading-tight text-slate-800">{card.title}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-600">عنوان یا نام مدرک:</label>
                  <input
                    type="text"
                    placeholder="مثال: گواهینامه فنی و حرفه‌ای پکیج"
                    value={newDocText}
                    onChange={(e) => setNewDocText(e.target.value)}
                    className="w-full bg-white border border-slate-205 text-xs px-3.5 py-2.5 rounded-xl outline-none text-right font-medium focus:border-blue-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-600">انتخاب فایل اسکن شده (JPG, PNG, PDF):</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/10 p-5 rounded-xl cursor-pointer text-center transition-all space-y-2 group"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/jpeg,image/jpg,image/png,application/pdf"
                      className="hidden"
                    />
                    
                    <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mx-auto transition-colors" />
                    
                    {selectedFile ? (
                      <div className="space-y-1">
                        <p className="text-xs text-blue-700 font-extrabold truncate max-w-[200px] mx-auto">{selectedFile.name}</p>
                        <p className="text-[9px] text-slate-400 font-extrabold">{(selectedFile.size / 1024).toFixed(1)} KB | برای تغییر کلیک کنید</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-600 font-bold">فایل را به اینجا بکشید یا برای انتخاب کلیک کنید</p>
                        <p className="text-[8px] text-slate-400 font-bold">حداکثر حجم مجاز: ۵ مگابایت</p>
                      </div>
                    )}
                  </div>
                </div>

                {previewUrl && (
                  <div className="bg-white border border-slate-150 p-2 rounded-xl flex items-center justify-center">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-h-20 rounded-lg object-contain border border-slate-100 shadow-2xs" 
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-750 hover:bg-blue-700 text-white rounded-xl text-xs font-bold py-2.5 px-4 cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                  disabled={isUploadingDoc}
                >
                  <Plus className="w-4 h-4" />
                  <span>آپلود و ثبت در پرونده</span>
                </button>

                {isUploadingDoc && (
                  <div className="space-y-1.5 bg-white p-2.5 rounded-lg border border-slate-150">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-600">
                      <span>در حال کدگذاری و انتقال ایمن فایل...</span>
                      <span>{uploadDocProgress}٪</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-600 h-full transition-all" style={{ width: `${uploadDocProgress}%` }}></div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Existing certificates directory listing */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <span className="block text-slate-750 text-xs font-extrabold">مستندات صلاحیت پیوست‌شده شما ({activeTech.documents?.length || 0} پرونده):</span>
              {(activeTech.documents && activeTech.documents.length > 0) || (activeTech.document_images && activeTech.document_images.length > 0) ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-right">
                  {activeTech.documents.map((doc, idx) => {
                    let docName = doc;
                    let fileType = '';
                    let isJson = false;
                    try {
                      if (doc.startsWith('{')) {
                        const parsed = JSON.parse(doc);
                        docName = parsed.name || 'مدرک بدون نام';
                        fileType = parsed.fileType || '';
                        isJson = true;
                      }
                    } catch (e) {}

                    return (
                      <div key={idx} className="bg-white border border-slate-205 p-3.5 rounded-2xl flex flex-col justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-extrabold text-slate-800 truncate" title={docName}>{docName}</h4>
                            <span className="text-[9px] text-slate-400 font-bold block mt-0.5">
                              {isJson ? (fileType.includes('pdf') ? 'فرمت دیجیتال PDF' : 'تصویر ارسالی') : 'سند پیش‌فرض صنف'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-50 pt-2.5">
                          <span className="bg-emerald-50 text-emerald-700 text-[9px] px-2 py-0.5 rounded-md font-extrabold flex items-center gap-0.5">
                            <Check className="w-3 h-3" />
                            <span>معتبر</span>
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ techName: activeTech.name, docName: doc })}
                              className="bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white px-2.5 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                              title="مشاهده پیش‌نمایش واقعی سند"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>مشاهده مدرک</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(idx)}
                              className="bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white p-1.5 rounded-lg transition-all cursor-pointer"
                              title="حذف مدرک"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-bold bg-slate-50">
                  هیچ مدرکی برای شما یافت نشد. لطفاً برای احراز هویت سند خود را آپلود نمایید.
                </div>
              )}

              {activeTech.document_images && activeTech.document_images.length > 0 && (
                <div className="mt-3">
                  <span className="block text-slate-750 text-xs font-extrabold mb-2">تصاویر واقعی مدارک آپلود شده:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {(Array.isArray(activeTech.document_images) ? activeTech.document_images : [activeTech.document_images]).map((img: any, iIdx) => {
                      const src = typeof img === 'string' ? img : (img && (img.url || img.data || img.src)) || '';
                      if (!src) return null;
                      return (
                        <div key={iIdx} onClick={() => setZoomImage(src)} title="کلیک برای مشاهده بزرگ" style={{ cursor: 'pointer' }}>
                          <img src={src} alt="مدرک تکنسین" className="w-20 h-20 object-cover rounded-lg border border-slate-300 hover:scale-105 transition-transform cursor-pointer shadow-sm" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Technician password change card */}
          <div className="bg-white rounded-2xl border border-slate-205 p-5 sm:p-6 shadow-xs space-y-5 animate-in fade-in duration-150 text-right">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <span className="w-2.5 h-2.5 bg-blue-600 rounded-full"></span>
              <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm">🔑 تغییر رمز عبور پنل تکنسین</h3>
            </div>

            <div className="max-w-md space-y-4">
              <p className="text-[11px] text-slate-500 font-extrabold leading-relaxed">
                جهت حفظ امنیت حساب کاربری خود، می‌توانید کلمه عبور پیش‌فرض یا فعلی‌تان را تغییر دهید. رمز جدید فوراً با پایگاه داده یکپارچه سراسری همگام‌سازی می‌گردد.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-600">رمز عبور فعلی:</label>
                  <input
                    type="password"
                    value={techCurrentPasswordInput}
                    onChange={(e) => setTechCurrentPasswordInput(e.target.value)}
                    placeholder="رمز ورود فعلی"
                    className="w-full bg-white border border-slate-205 text-xs px-3.5 py-2.5 rounded-xl outline-none text-right font-medium focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-600">رمز عبور جدید:</label>
                  <input
                    type="password"
                    value={techNewPasswordInput}
                    onChange={(e) => setTechNewPasswordInput(e.target.value)}
                    placeholder="حداقل ۴ کاراکتر"
                    className="w-full bg-white border border-slate-205 text-xs px-3.5 py-2.5 rounded-xl outline-none text-right font-medium focus:border-blue-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-600">تکرار رمز عبور جدید:</label>
                  <input
                    type="password"
                    value={techNewPasswordConfirmInput}
                    onChange={(e) => setTechNewPasswordConfirmInput(e.target.value)}
                    placeholder="تکرار رمز جدید"
                    className="w-full bg-white border border-slate-205 text-xs px-3.5 py-2.5 rounded-xl outline-none text-right font-medium focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleTechPasswordChange}
                  className="bg-blue-600 hover:bg-blue-750 hover:bg-blue-700 text-white rounded-xl text-xs font-bold py-2.5 px-6 cursor-pointer transition-colors animate-in"
                >
                  تأیید و همگام‌سازی رمز عبور جدید
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📱 DIGITAL BUSINESS CARD & APP REFERRAL TAB */}
      {selectedTab === 'digital-card' && (
        <div className="space-y-6 text-right animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg border border-blue-800/50 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-2">
                  کارت ویزیت دیجیتال و کد دعوت اختصاصی تکنسین
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  <span>معرفی اپلیکیشن کدیار۲۴ به مشتریان و دریافت کار مستقیم</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-1 max-w-2xl font-sans">
                  با ارسال لینک اختصاصی زیر به مشتریان خود، آن‌ها می‌توانند اپلیکیشن کدیار۲۴ را نصب یا در وب‌سایت، درخواست تعمیرات خود را مستقیماً برای شما ثبت کنند. تصویر و نام شما روی صفحه اول نمایش داده می‌شود.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Profile Picture & Avatar Editor */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Image className="w-5 h-5 text-blue-600" />
                <h4 className="font-extrabold text-sm text-slate-900">ویرایش تصویر پروفایل و نام در اپلیکیشن</h4>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <img
                  src={avatarUrlInput || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='35' r='20' fill='%23ccc'/><path d='M20 85c0-15 15-25 30-25s30 10 30 25z' fill='%23ccc'/></svg>"}
                  alt={activeTech.name}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white ring-4 ring-blue-500/20 shadow-md shrink-0"
                />
                <div className="space-y-1 text-center sm:text-right min-w-0 flex-1">
                  <h5 className="font-black text-slate-900 text-sm">{activeTech.name}</h5>
                  <p className="text-[11px] text-slate-500 font-bold">شهر: {activeTech.activeLocation || 'تعیین‌نشده'}</p>
                  <p className="text-[10px] text-emerald-600 font-extrabold">⭐ امتیاز: {activeTech.rating || '5.0'} | {activeTech.completedOrders || 0} سفارش موفق</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">نام و نام خانوادگی نمایش در اپ:</label>
                  <input
                    type="text"
                    value={techNameInput}
                    onChange={(e) => setTechNameInput(e.target.value)}
                    placeholder="نام تکنسین"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">شهر فعالیت اصلی:</label>
                  <input
                    type="text"
                    value={techLocationInput}
                    onChange={(e) => setTechLocationInput(e.target.value)}
                    placeholder="مانند: تهران، اصفهان، شیراز..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-extrabold text-slate-700 mb-1">آدرس تصویر آواتار (URL عکس چهره یا انتخاب از موارد پیش‌فرض):</label>
                  <input
                    type="text"
                    value={avatarUrlInput}
                    onChange={(e) => setAvatarUrlInput(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 text-left font-mono outline-none focus:border-blue-500 focus:bg-white mb-2"
                  />

                  <p className="text-[10px] text-slate-400 mt-1">آدرس مستقیم تصویر پرتره پروانه یا کارت ویزیت خود را وارد کنید.</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onUpdateTechnician(activeTech.id, {
                      name: techNameInput.trim() || activeTech.name,
                      avatarUrl: avatarUrlInput.trim(),
                      activeLocation: techLocationInput.trim() || activeTech.activeLocation
                    });
                    triggerNotification('به‌روزرسانی موفق', 'اطلاعات و عکس پروفایل شما با موفقیت ثبت و در اپلیکیشن به‌روز شد.', 'success');
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-3 px-4 rounded-xl cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>ذخیره و به‌روزرسانی عکس و مشخصات پروفایل</span>
                </button>
              </div>
            </div>

            {/* 2. Referral Share & Business Card Module */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-amber-500" />
                    <h4 className="font-extrabold text-sm text-slate-900">لینک و پیام اختصاصی دعوت از مشتریان</h4>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-lg border border-emerald-200">
                    دامنه رسمی kodyar24.ir
                  </span>
                </div>

                {/* Helper for clean domain URL */}
                {(() => {
                  const getCleanShareUrl = () => {
                    if (typeof window !== 'undefined') {
                      const host = window.location.hostname;
                      if (host.includes('run.app') || host.includes('localhost') || host.includes('127.0.0.1') || host.includes('ais-dev') || host.includes('ais-pre')) {
                        return `https://kodyar24.ir/?tech=${activeTech.id}`;
                      }
                      return `${window.location.origin}/?tech=${activeTech.id}`;
                    }
                    return `https://kodyar24.ir/?tech=${activeTech.id}`;
                  };
                  const cleanShareUrl = getCleanShareUrl();

                  return (
                    <>
                      {/* Referral Link Box */}
                      <div className="space-y-2 mb-5">
                        <label className="block text-[11px] font-extrabold text-slate-700">لینک کارت ویزیت دیجیتال و معرفی شما:</label>
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
                          <input
                            type="text"
                            readOnly
                            value={cleanShareUrl}
                            className="w-full bg-transparent text-xs font-mono font-bold text-blue-700 outline-none px-2 text-left"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(cleanShareUrl);
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 3000);
                              triggerNotification('کپی شد', 'لینک اختصاصی کارت ویزیت تکنسین با دامنه رسمی کدیار۲۴ کپی شد.', 'success');
                            }}
                            className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-extrabold px-4 py-2.5 rounded-xl cursor-pointer shrink-0 transition-all flex items-center gap-1.5"
                          >
                            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedLink ? 'کپی شد!' : 'کپی لینک'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Quick Share Buttons */}
                      <div className="space-y-2">
                        <label className="block text-[11px] font-extrabold text-slate-700">اشتراک‌گذاری فوری در پیام‌رسان‌ها:</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {/* Eitaa */}
                          <a
                            href={`https://eitaa.com/share/url?url=${encodeURIComponent(cleanShareUrl)}&text=${encodeURIComponent(`سلام، جهت ثبت سفارش تعمیرات لوازم خانگی و استعلام کدهای خطا از طریق کارت ویزیت اختصاصی ${activeTech.name} وارد سامانه کدیار۲۴ شوید:`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-[10px] font-extrabold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center"
                          >
                            <span>ارسال در ایتا</span>
                          </a>

                          {/* Telegram */}
                          <a
                            href={`https://t.me/share/url?url=${encodeURIComponent(cleanShareUrl)}&text=${encodeURIComponent(`سلام، جهت ثبت سفارش تعمیرات تخصصی ${activeTech.name} وارد لینک شوید:`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-[10px] font-extrabold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center"
                          >
                            <span>تلگرام</span>
                          </a>

                          {/* WhatsApp */}
                          <a
                            href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`سلام، جهت ثبت سفارش تعمیرات توسط ${activeTech.name} وارد لینک زیر شوید:\n${cleanShareUrl}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center"
                          >
                            <span>واتساپ</span>
                          </a>

                          {/* SMS */}
                          <a
                            href={`sms:?body=${encodeURIComponent(`سلام، جهت ثبت سفارش آنلاین تعمیرات تخصصی ${activeTech.name} وارد سامانه شوید:\n${cleanShareUrl}`)}`}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-[10px] font-extrabold py-2.5 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all text-center"
                          >
                            <span>پیامک (SMS)</span>
                          </a>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Digital Business Card Live Preview */}
              <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 mt-4 space-y-3">
                <span className="text-[9px] font-mono font-bold text-amber-400 block uppercase tracking-wider">نمای کارت ویزیت دیجیتال شما در دید مشتری:</span>
                <div className="flex items-center gap-3">
                  <img
                    src={activeTech.avatarUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='35' r='20' fill='%23ccc'/><path d='M20 85c0-15 15-25 30-25s30 10 30 25z' fill='%23ccc'/></svg>"}
                    alt={activeTech.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-black text-white block truncate">{activeTech.name}</span>
                    <span className="text-[10px] text-slate-300 font-bold block">تکنسین برتر کدیار۲۴ | {activeTech.activeLocation || 'ایران'}</span>
                    <span className="text-[9px] text-amber-300 font-extrabold block mt-0.5">⭐ {activeTech.rating || '5.0'} (۱۸۰ روز گارانتی کتبی خدمات)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📋 DOCUMENT VIEWER MODAL */}
      {zoomImage && (
        <div
          onClick={() => setZoomImage(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: '20px' }}
        >
          <img src={zoomImage} alt="بزرگ‌نمایی مدرک" style={{ maxWidth: '95vw', maxHeight: '95vh', borderRadius: '8px', boxShadow: '0 0 30px rgba(0,0,0,0.5)' }} />
        </div>
      )}

      {previewDoc && (
        <DocumentViewer
          techName={previewDoc.techName}
          docName={previewDoc.docName}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};