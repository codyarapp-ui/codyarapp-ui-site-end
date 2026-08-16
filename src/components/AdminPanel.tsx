/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { RepairOrder, ErrorCode, Technician, SparePart, CommonProblem, PartPurchase } from '../types';
import { Shield, Users, User, AlertTriangle, FileCheck, Check, Ban, BarChart3, TrendingUp, Activity, PenTool, Layers, CheckCircle2, DollarSign, X, Info, Key, Eye, Truck, Laptop, Settings, Plus, Trash2, MapPin, Search, FileText, LogOut, MessageSquare, Send, Terminal, CheckCircle, Inbox, ShoppingBag, RefreshCw, Megaphone, Phone, Smartphone, Upload, Edit, Database, ChevronUp, ChevronDown } from 'lucide-react';
import { DocumentViewer } from './DocumentViewer';
import { sanitizePhoneInput, validateIranianMobile, validateUrl, harmonizeErrorCode } from './validation';

const SmartCombobox: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  onSelectSuggestion?: (val: string) => void;
  placeholder: string;
  suggestions: string[];
  required?: boolean;
}> = ({ label, value, onChange, onSelectSuggestion, placeholder, suggestions, required }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const matches = React.useMemo(() => {
    const cleanVal = value.trim().toLowerCase();
    if (!cleanVal) return suggestions.slice(0, 8);
    return suggestions.filter(s => s.toLowerCase().includes(cleanVal));
  }, [value, suggestions]);

  return (
    <div ref={containerRef} className="relative text-right">
      <label className="block text-slate-700 text-[10px] font-extrabold mb-1">{label}</label>
      <div className="relative">
        <input
          required={required}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full bg-slate-50 border border-slate-205 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold transition-all text-right"
        />
        {value && (
          <button
            type="button"
            onClick={() => { onChange(''); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-xs"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && matches.length > 0 && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-56 overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
          {matches.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                if (onSelectSuggestion) {
                  onSelectSuggestion(item);
                } else {
                  onChange(item);
                }
                setIsOpen(false);
              }}
              className="w-full text-right px-4 py-2.5 hover:bg-blue-50/50 text-[11px] font-bold text-slate-750 hover:text-blue-700 transition-all flex items-center justify-between"
            >
              <span>{item}</span>
              <span className="text-[9px] text-slate-400 font-normal">پیشنهاد سیستم</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface AdminPanelProps {
  orders: RepairOrder[];
  errorCodes: ErrorCode[];
  technicians: Technician[];
  spareParts: SparePart[];
  citiesList: {name: string, regions: string[]}[];
  brandsList: string[];
  categoriesList: string[];
  modelsList: string[];
  onApproveErrorCode: (id: string) => void;
  onBulkApproveErrorCodes?: (ids: string[]) => void;
  onRejectErrorCode: (id: string) => void;
  onVerifyTechnician: (id: string, isVerified: boolean) => void;
  onUpdatePartStock: (id: string, newStock: number, newPrice: number) => void;
  onAdminCancelOrder: (orderId: string) => void;
  onApprovePayment?: (paymentId: string) => void;
  onRejectPayment?: (paymentId: string) => void;
  onUpdateCitiesList: (list: {name: string, regions: string[]}[]) => void;
  onUpdateBrandsList: (list: string[]) => void;
  onUpdateCategoriesList: (list: string[]) => void;
  onUpdateModelsList: (list: string[]) => void;
  onUpdateErrorCodesList: (list: ErrorCode[]) => void;
  onUpdateSparePartsList?: (list: SparePart[]) => void;
  commonProblems?: CommonProblem[];
  onUpdateCommonProblemsList?: (list: CommonProblem[]) => void;
  onLoginAsTechnician?: (techId: string) => void;
  onUpdateTechniciansList?: (list: Technician[]) => void;
  onLogout?: () => void;
  adminPassword?: string;
  onUpdateAdminPassword?: (newPass: string) => void;
  smsSettings?: any;
  onUpdateSmsSettings?: (settings: any) => void;
  smsLogs?: any[];
  onSendTestSms?: (phone: string, text: string, type: 'otp' | 'status') => void;
  onResetDatabase?: () => void;
  partPurchases?: PartPurchase[];
  onUpdatePartPurchases?: (list: PartPurchase[]) => void;
  usersList?: any[];
  subscriptionsList?: any[];
  paymentsList?: any[];
  onForceRefreshDatabase?: () => Promise<void>;
  adminAnnouncement?: { text: string; isActive: boolean; style: 'info' | 'warning' | 'success' | 'danger' };
  onUpdateAdminAnnouncement?: (announcement: { text: string; isActive: boolean; style: 'info' | 'warning' | 'success' | 'danger' }) => void;
  trustBadges?: {
    badge1Link: string;
    badge1Image: string;
    badge2Link: string;
    badge2Image: string;
  };
  onUpdateTrustBadges?: (badges: {
    badge1Link: string;
    badge1Image: string;
    badge2Link: string;
    badge2Image: string;
  }) => void;
  supportPhone?: string;
  onUpdateSupportPhone?: (phone: string) => void;
  pageContents?: {
    aboutUs: string;
    contactUs: string;
    rules: string;
    dispute: string;
    appDownloadUrl?: string;
  };
  onUpdatePageContents?: (contents: {
    aboutUs: string;
    contactUs: string;
    rules: string;
    dispute: string;
    appDownloadUrl?: string;
  }) => void;
  userFeedbacks?: any[];
  onUpdateUserFeedbacks?: (feedbacks: any[]) => void;
  affiliateProducts?: any[];
  onUpdateAffiliateProducts?: (products: any[]) => void;
  categoryConfig?: any;
  onUpdateCategoryConfig?: (config: any) => void;
  onManualAddSubscription?: (userId: string, planId: string, customDays?: number) => void;
  onUpdatePostalTrackCode?: (purchaseId: string, postalCode: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  orders,
  errorCodes,
  technicians,
  spareParts,
  citiesList,
  brandsList,
  categoriesList,
  modelsList,
  onApproveErrorCode,
  onBulkApproveErrorCodes,
  onRejectErrorCode,
  onVerifyTechnician,
  onUpdatePartStock,
  onAdminCancelOrder,
  onApprovePayment,
  onRejectPayment,
  onUpdateCitiesList,
  onUpdateBrandsList,
  onUpdateCategoriesList,
  onUpdateModelsList,
  onUpdateErrorCodesList,
  onUpdateSparePartsList,
  commonProblems = [],
  onUpdateCommonProblemsList,
  onLoginAsTechnician,
  onUpdateTechniciansList,
  onLogout,
  adminPassword,
  onUpdateAdminPassword,
  smsSettings,
  onUpdateSmsSettings,
  smsLogs = [],
  onSendTestSms,
  onResetDatabase,
  partPurchases = [],
  onUpdatePartPurchases,
  usersList = [],
  subscriptionsList = [],
  paymentsList = [],
  onForceRefreshDatabase,
  adminAnnouncement = { text: '', isActive: false, style: 'info' },
  onUpdateAdminAnnouncement,
  trustBadges = { badge1Link: 'https://enamad.ir', badge1Image: '', badge2Link: 'https://samandehi.ir', badge2Image: '' },
  onUpdateTrustBadges,
  supportPhone = '۱۸۴۰',
  onUpdateSupportPhone,
  pageContents = { aboutUs: '', contactUs: '', rules: '', dispute: '', appDownloadUrl: '' },
  onUpdatePageContents,
  userFeedbacks = [],
  onUpdateUserFeedbacks,
  affiliateProducts = [],
  onUpdateAffiliateProducts,
  categoryConfig = {},
  onUpdateCategoryConfig,
  onManualAddSubscription,
  onUpdatePostalTrackCode,
}) => {
  const [activeTab, setActiveTab] = React.useState<string>('metrics');
  
  // Support Tickets States
  const [adminTicketsList, setAdminTicketsList] = React.useState<any[]>([]);
  const [adminTicketsLoading, setAdminTicketsLoading] = React.useState(false);
  const [activeAdminTicketId, setActiveAdminTicketId] = React.useState<string | null>(null);
  const [adminReplyInput, setAdminReplyInput] = React.useState('');
  const [submittingAdminReply, setSubmittingAdminReply] = React.useState(false);
  const [adminTicketFilter, setAdminTicketFilter] = React.useState<'all' | 'open' | 'pending' | 'resolved' | 'closed'>('all');
  const [adminTicketStatusMsg, setAdminTicketStatusMsg] = React.useState('');

  // Payment, Subscription & Shipping Modal States
  const [payRoleFilter, setPayRoleFilter] = React.useState<'all' | 'client' | 'technician'>('all');
  const [payTypeFilter, setPayTypeFilter] = React.useState<'all' | 'subscription' | 'part_purchase'>('all');
  const [payStatusFilter, setPayStatusFilter] = React.useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  
  const [subRoleFilter, setSubRoleFilter] = React.useState<'all' | 'client' | 'technician'>('all');
  const [manualSubModalOpen, setManualSubModalOpen] = React.useState(false);
  const [manualSubUserId, setManualSubUserId] = React.useState('');
  const [manualSubPlan, setManualSubPlan] = React.useState('1_month');
  const [manualSubUserSearch, setManualSubUserSearch] = React.useState('');

  const [postalTrackModalItem, setPostalTrackModalItem] = React.useState<any | null>(null);
  const [postalTrackInput, setPostalTrackInput] = React.useState('');

  // Custom states for security audit, backup logs, and telemetry errors
  const [adminBackupsList, setAdminBackupsList] = React.useState<any[]>([]);
  const [adminBackupsLoading, setAdminBackupsLoading] = React.useState(false);
  const [activityLogsList, setActivityLogsList] = React.useState<any[]>([]);
  const [activityLogsLoading, setActivityLogsLoading] = React.useState(false);
  const [systemErrorsList, setSystemErrorsList] = React.useState<any[]>([]);
  const [systemErrorsLoading, setSystemErrorsLoading] = React.useState(false);

  // TechDocs state hooks
  const [selectedDeviceForDocs, setSelectedDeviceForDocs] = React.useState<any>(null);
  const [deviceDocsList, setDeviceDocsList] = React.useState<any[]>([]);
  const [deviceDocsLoading, setDeviceDocsLoading] = React.useState(false);
  const [deviceDocsError, setDeviceDocsError] = React.useState('');
  const [newDocTitleInput, setNewDocTitleInput] = React.useState('');
  const [newDocTypeInput, setNewDocTypeInput] = React.useState('Service Manual');
  const [newDocSizeInput, setNewDocSizeInput] = React.useState('2.5 MB');
  const [techDocsSearchQuery, setTechDocsSearchQuery] = React.useState('');
  const [techDocsStatusMsg, setTechDocsStatusMsg] = React.useState('');

  const [uploadMethod, setUploadMethod] = React.useState<'file' | 'link'>('file');
  const [uploadedFileBase64, setUploadedFileBase64] = React.useState('');
  const [uploadedFileName, setUploadedFileName] = React.useState('');
  const [externalUrlInput, setExternalUrlInput] = React.useState('');
  const [isSavingDoc, setIsSavingDoc] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedFileBase64(event.target.result as string);
        setUploadedFileName(file.name);
        
        const sizeInMB = file.size / (1024 * 1024);
        if (sizeInMB < 1) {
          setNewDocSizeInput(`${(file.size / 1024).toFixed(1)} KB`);
        } else {
          setNewDocSizeInput(`${sizeInMB.toFixed(1)} MB`);
        }
        
        if (!newDocTitleInput.trim()) {
          const titleWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
          setNewDocTitleInput(titleWithoutExt);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  React.useEffect(() => {
    if (selectedDeviceForDocs) {
      setDeviceDocsLoading(true);
      setDeviceDocsError('');
      fetch(`/api/device/${selectedDeviceForDocs.id}/tech-docs`)
        .then(res => {
          if (!res.ok) throw new Error('خطا در بارگذاری مدارک فنی');
          return res.json();
        })
        .then(data => {
          setDeviceDocsList(data.docs || []);
          setDeviceDocsLoading(false);
        })
        .catch(err => {
          setDeviceDocsError(err.message || 'خطای شبکه در دریافت اسناد');
          setDeviceDocsLoading(false);
        });
    } else {
      setDeviceDocsList([]);
    }
  }, [selectedDeviceForDocs]);

  // Fetch Admin Backups list when tab is active
  React.useEffect(() => {
    if (activeTab === 'backups') {
      setAdminBackupsLoading(true);
      fetch('/api/server-backups')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setAdminBackupsList(data.backups || []);
          }
          setAdminBackupsLoading(false);
        })
        .catch(err => {
          console.error("Error fetching backups:", err);
          setAdminBackupsLoading(false);
        });
    }
  }, [activeTab]);

  // Fetch Activity Logs when tab is active
  React.useEffect(() => {
    if (activeTab === 'activitylogs') {
      setActivityLogsLoading(true);
      fetch('/api/admin/activity-logs')
        .then(res => res.json())
        .then(data => {
          setActivityLogsList(data.logs || []);
          setActivityLogsLoading(false);
        })
        .catch(err => {
          console.error("Error fetching activity logs:", err);
          setActivityLogsLoading(false);
        });
    }
  }, [activeTab]);

  // Fetch System error_logs table when tab is active
  React.useEffect(() => {
    if (activeTab === 'system_errors') {
      setSystemErrorsLoading(true);
      fetch('/api/admin/error-logs')
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSystemErrorsList(data.errors || []);
          }
          setSystemErrorsLoading(false);
        })
        .catch(err => {
          console.error("Error fetching system errors:", err);
          setSystemErrorsLoading(false);
        });
    }
  }, [activeTab]);

  // Fetch Support Tickets when tab is active
  React.useEffect(() => {
    if (activeTab === 'tickets') {
      fetchTickets();
    }
  }, [activeTab]);

  const fetchTickets = () => {
    setAdminTicketsLoading(true);
    fetch('/api/tickets')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAdminTicketsList(data.tickets || []);
        }
        setAdminTicketsLoading(false);
      })
      .catch(err => {
        console.error("Error fetching admin tickets:", err);
        setAdminTicketsLoading(false);
      });
  };

  const handleAdminSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAdminTicketId || !adminReplyInput.trim()) return;

    setSubmittingAdminReply(true);
    try {
      const res = await fetch(`/api/tickets/${activeAdminTicketId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: adminReplyInput.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setAdminTicketsList(prev => prev.map(t => t.id === activeAdminTicketId ? data.ticket : t));
        setAdminReplyInput('');
        setAdminTicketStatusMsg('✅ پاسخ شما با موفقیت ثبت و ارسال شد.');
        setTimeout(() => setAdminTicketStatusMsg(''), 4000);
      } else {
        setAdminTicketStatusMsg('❌ خطا در ارسال پاسخ: ' + (data.error || 'خطای ناشناخته'));
        setTimeout(() => setAdminTicketStatusMsg(''), 4000);
      }
    } catch (e: any) {
      console.error("Error responding to ticket:", e);
      setAdminTicketStatusMsg('❌ خطا در ارتباط با سرور: ' + e.message);
      setTimeout(() => setAdminTicketStatusMsg(''), 4000);
    } finally {
      setSubmittingAdminReply(false);
    }
  };

  const handleAdminChangeStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setAdminTicketsList(prev => prev.map(t => t.id === ticketId ? data.ticket : t));
        setAdminTicketStatusMsg('✅ وضعیت تیکت با موفقیت بروزرسانی شد.');
        setTimeout(() => setAdminTicketStatusMsg(''), 4000);
      } else {
        setAdminTicketStatusMsg('❌ خطا در تغییر وضعیت: ' + (data.error || 'خطای ناشناخته'));
        setTimeout(() => setAdminTicketStatusMsg(''), 4000);
      }
    } catch (e: any) {
      console.error("Error updating status:", e);
      setAdminTicketStatusMsg('❌ خطا در ارتباط با سرور: ' + e.message);
      setTimeout(() => setAdminTicketStatusMsg(''), 4000);
    }
  };

  const handleAddTechDoc = async () => {
    if (!selectedDeviceForDocs || !newDocTitleInput.trim() || !newDocTypeInput) {
      setTechDocsStatusMsg('❌ لطفا فیلدهای عنوان و نوع سند را وارد کنید.');
      setTimeout(() => setTechDocsStatusMsg(''), 4000);
      return;
    }

    if (uploadMethod === 'file' && !uploadedFileBase64) {
      setTechDocsStatusMsg('❌ لطفا ابتدا فایل مورد نظر خود را برای آپلود انتخاب کنید.');
      setTimeout(() => setTechDocsStatusMsg(''), 4000);
      return;
    }

    if (uploadMethod === 'link' && !externalUrlInput.trim()) {
      setTechDocsStatusMsg('❌ لطفا لینک دانلود مستقیم سند فنی را وارد کنید.');
      setTimeout(() => setTechDocsStatusMsg(''), 4000);
      return;
    }

    setIsSavingDoc(true);
    try {
      const res = await fetch(`/api/device/${selectedDeviceForDocs.id}/tech-docs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newDocTitleInput,
          type: newDocTypeInput,
          fileSize: newDocSizeInput,
          fileBase64: uploadMethod === 'file' ? uploadedFileBase64 : undefined,
          fileName: uploadMethod === 'file' ? uploadedFileName : undefined,
          externalUrl: uploadMethod === 'link' ? externalUrlInput.trim() : undefined
        })
      });
      if (!res.ok) throw new Error('خطا در ذخیره‌سازی سند');
      const data = await res.json();
      if (data.success) {
        setDeviceDocsList(prev => [data.doc, ...prev]);
        setNewDocTitleInput('');
        setUploadedFileBase64('');
        setUploadedFileName('');
        setExternalUrlInput('');
        setTechDocsStatusMsg('✅ سند فنی جدید با موفقیت اضافه و پیوست شد.');
        setTimeout(() => setTechDocsStatusMsg(''), 4000);
      }
    } catch (err: any) {
      setTechDocsStatusMsg(`❌ خطا: ${err.message}`);
      setTimeout(() => setTechDocsStatusMsg(''), 4000);
    } finally {
      setIsSavingDoc(false);
    }
  };

  const handleDeleteTechDoc = async (docId: string) => {
    if (!selectedDeviceForDocs) return;
    try {
      const res = await fetch(`/api/device/${selectedDeviceForDocs.id}/tech-docs/${docId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('خطا در حذف سند');
      const data = await res.json();
      if (data.success) {
        setDeviceDocsList(prev => prev.filter(d => d.id !== docId));
        setTechDocsStatusMsg('🗑️ سند فنی با موفقیت حذف گردید.');
        setTimeout(() => setTechDocsStatusMsg(''), 4000);
      }
    } catch (err: any) {
      setTechDocsStatusMsg(`❌ خطا در حذف: ${err.message}`);
      setTimeout(() => setTechDocsStatusMsg(''), 4000);
    }
  };

  // Editing tech doc state
  const [editingDocId, setEditingDocId] = React.useState<string | null>(null);
  const [editingDocTitle, setEditingDocTitle] = React.useState('');
  const [editingDocType, setEditingDocType] = React.useState('');
  const [editingDocSize, setEditingDocSize] = React.useState('');
  const [editingDocUrl, setEditingDocUrl] = React.useState('');

  // Separated management of error codes & problems by category
  const [selectedErrCatFilter, setSelectedErrCatFilter] = React.useState<string>('all');
  const [errSearchQuery, setErrSearchQuery] = React.useState<string>('');
  const [selectedProbCatFilter, setSelectedProbCatFilter] = React.useState<string>('all');

  const handleStartEditDoc = (doc: any) => {
    setEditingDocId(doc.id);
    setEditingDocTitle(doc.title);
    setEditingDocType(doc.type);
    setEditingDocSize(doc.fileSize);
    setEditingDocUrl(doc.fileUrl);
  };

  const handleCancelEditDoc = () => {
    setEditingDocId(null);
  };

  const handleSaveEditDoc = async () => {
    if (!selectedDeviceForDocs || !editingDocId) return;
    try {
      const res = await fetch(`/api/device/${selectedDeviceForDocs.id}/tech-docs/${editingDocId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingDocTitle,
          type: editingDocType,
          fileSize: editingDocSize,
          externalUrl: editingDocUrl
        })
      });
      if (!res.ok) throw new Error('خطا در ویرایش سند');
      const data = await res.json();
      if (data.success) {
        setDeviceDocsList(prev => prev.map(d => d.id === editingDocId ? data.doc : d));
        setEditingDocId(null);
        setTechDocsStatusMsg('✅ سند فنی با موفقیت ویرایش گردید.');
        setTimeout(() => setTechDocsStatusMsg(''), 4000);
      }
    } catch (err: any) {
      setTechDocsStatusMsg(`❌ خطا در ویرایش: ${err.message}`);
      setTimeout(() => setTechDocsStatusMsg(''), 4000);
    }
  };
  
  // Server-side database backup & recovery system inside Admin Panel
  const [adminServerBackups, setAdminServerBackups] = React.useState<any[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = React.useState(false);
  const [backupStatusMsg, setBackupStatusMsg] = React.useState('');

  const fetchAdminBackups = async () => {
    setIsLoadingBackups(true);
    try {
      const res = await fetch('/api/server-backups');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAdminServerBackups(data.backups);
        }
      }
    } catch (err: any) {
      console.error('Error fetching admin backups:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const createAdminBackup = async () => {
    try {
      setBackupStatusMsg('⏳ در حال ایجاد نسخه پشتیبان از کل پایگاه داده روی هاست...');
      const res = await fetch('/api/server-backups/create', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBackupStatusMsg('✅ نسخه پشتیبان کامل با موفقیت روی هاست ذخیره گردید.');
          fetchAdminBackups();
          setTimeout(() => setBackupStatusMsg(''), 5000);
        } else {
          throw new Error(data.error || 'خطای ناپیوسته');
        }
      } else {
        throw new Error('خطا در برقراری ارتباط با سرور');
      }
    } catch (err: any) {
      setBackupStatusMsg(`❌ خطا در پشتیبان‌گیری: ${err.message}`);
      setTimeout(() => setBackupStatusMsg(''), 5000);
    }
  };

  const restoreAdminBackup = async (fileName: string) => {
    try {
      setBackupStatusMsg('⏳ در حال بازگردانی و بازنویسی دیتابیس کل سایت...');
      const res = await fetch('/api/server-backups/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBackupStatusMsg('🎉 بازگردانی کامل با موفقیت انجام شد! در حال راه‌اندازی مجدد پلتفرم...');
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          throw new Error(data.error || 'خطای بازنشانی');
        }
      } else {
        throw new Error('خطا در پاسخ‌دهی سرور');
      }
    } catch (err: any) {
      setBackupStatusMsg(`❌ خطا در بازگردانی: ${err.message}`);
      setTimeout(() => setBackupStatusMsg(''), 5000);
    }
  };

  const deleteAdminBackup = async (fileName: string) => {
    try {
      const res = await fetch(`/api/server-backups/${fileName}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBackupStatusMsg('🗑️ فایل پشتیبان با موفقیت از روی سرور حذف شد.');
          fetchAdminBackups();
          setTimeout(() => setBackupStatusMsg(''), 4000);
        }
      }
    } catch (err: any) {
      setBackupStatusMsg(`❌ خطا در حذف پشتیبان: ${err.message}`);
      setTimeout(() => setBackupStatusMsg(''), 4000);
    }
  };

  React.useEffect(() => {
    fetchAdminBackups();
  }, []);

  // Helper to determine if we should update a local state from polled backend props.
  // It returns false if the element is currently focused (the user is typing or pasting)
  // or if the local state was modified by the user and differs from the backend prop (user hasn't saved yet).
  const shouldUpdateField = (elementId: string, currentLocalVal: string, propVal: string) => {
    if (typeof document !== 'undefined' && document.activeElement && document.activeElement.id === elementId) {
      return false;
    }
    if (currentLocalVal !== propVal) {
      return false;
    }
    return true;
  };

  // Support Phone state Hook
  const [sPhone, setSPhone] = React.useState(supportPhone || '۱۸۴۰');
  const [phoneStatusMsg, setPhoneStatusMsg] = React.useState('');

  // Informational Page contents state hooks
  const [pgAboutUs, setPgAboutUs] = React.useState(pageContents?.aboutUs || '');
  const [pgContactUs, setPgContactUs] = React.useState(pageContents?.contactUs || '');
  const [pgRules, setPgRules] = React.useState(pageContents?.rules || '');
  const [pgDispute, setPgDispute] = React.useState(pageContents?.dispute || '');
  const [pgAppDownloadUrl, setPgAppDownloadUrl] = React.useState(pageContents?.appDownloadUrl || '');
  const [pageStatusMsg, setPageStatusMsg] = React.useState('');

  React.useEffect(() => {
    if (pageContents) {
      setPgAboutUs(prev => shouldUpdateField('admin-pg-about-us', prev, pageContents.aboutUs || '') ? (pageContents.aboutUs || '') : prev);
      setPgContactUs(prev => shouldUpdateField('admin-pg-contact-us', prev, pageContents.contactUs || '') ? (pageContents.contactUs || '') : prev);
      setPgRules(prev => shouldUpdateField('admin-pg-rules', prev, pageContents.rules || '') ? (pageContents.rules || '') : prev);
      setPgDispute(prev => shouldUpdateField('admin-pg-dispute', prev, pageContents.dispute || '') ? (pageContents.dispute || '') : prev);
      setPgAppDownloadUrl(prev => shouldUpdateField('admin-pg-app-download-url', prev, pageContents.appDownloadUrl || '') ? (pageContents.appDownloadUrl || '') : prev);
    }
  }, [pageContents]);

  React.useEffect(() => {
    if (supportPhone) {
      setSPhone(prev => shouldUpdateField('admin-support-phone', prev, supportPhone) ? supportPhone : prev);
    }
  }, [supportPhone]);

  const handleToggleReadFeedback = (fbId: string) => {
    if (!onUpdateUserFeedbacks) return;
    const updated = userFeedbacks.map(f => f.id === fbId ? { ...f, isRead: !f.isRead } : f);
    onUpdateUserFeedbacks(updated);
  };

  const handleDeleteFeedback = (fbId: string) => {
    if (!onUpdateUserFeedbacks) return;
    const updated = userFeedbacks.filter(f => f.id !== fbId);
    onUpdateUserFeedbacks(updated);
  };

  // Trust Badges state hooks
  const [b1Link, setB1Link] = React.useState(trustBadges?.badge1Link || '');
  const [b1Img, setB1Img] = React.useState(trustBadges?.badge1Image || '');
  const [b2Link, setB2Link] = React.useState(trustBadges?.badge2Link || '');
  const [b2Img, setB2Img] = React.useState(trustBadges?.badge2Image || '');
  const [badgesStatusMsg, setBadgesStatusMsg] = React.useState('');

  React.useEffect(() => {
    if (trustBadges) {
      setB1Link(prev => shouldUpdateField('admin-b1-link', prev, trustBadges.badge1Link || '') ? (trustBadges.badge1Link || '') : prev);
      setB1Img(prev => shouldUpdateField('admin-b1-img', prev, trustBadges.badge1Image || '') ? (trustBadges.badge1Image || '') : prev);
      setB2Link(prev => shouldUpdateField('admin-b2-link', prev, trustBadges.badge2Link || '') ? (trustBadges.badge2Link || '') : prev);
      setB2Img(prev => shouldUpdateField('admin-b2-img', prev, trustBadges.badge2Image || '') ? (trustBadges.badge2Image || '') : prev);
    }
  }, [trustBadges]);

  // Admin Announcement local state hooks
  const [annTxt, setAnnTxt] = React.useState(adminAnnouncement?.text || '');
  const [annIsActive, setAnnIsActive] = React.useState(adminAnnouncement?.isActive || false);
  const [annStyle, setAnnStyle] = React.useState<'info' | 'warning' | 'success' | 'danger'>(adminAnnouncement?.style || 'info');
  const [annStatusMsg, setAnnStatusMsg] = React.useState('');

  React.useEffect(() => {
    if (adminAnnouncement) {
      setAnnTxt(prev => shouldUpdateField('admin-announcement-text', prev, adminAnnouncement.text || '') ? (adminAnnouncement.text || '') : prev);
      setAnnIsActive(adminAnnouncement.isActive || false);
      setAnnStyle(adminAnnouncement.style || 'info');
    }
  }, [adminAnnouncement]);
  const [isDbRefreshing, setIsDbRefreshing] = React.useState(false);
  const [pendingCodesSearchVal, setPendingCodesSearchVal] = React.useState('');
  const [sparePartsSearchVal, setSparePartsSearchVal] = React.useState('');
  const [approvedCodesSearchVal, setApprovedCodesSearchVal] = React.useState('');
  const [errGroupCategoryFilter, setErrGroupCategoryFilter] = React.useState('');
  const [errGroupBrandFilter, setErrGroupBrandFilter] = React.useState('');
  const [errGroupViewMode, setErrGroupViewMode] = React.useState<'grouped' | 'simple'>('grouped');
  const [expandedErrGroups, setExpandedErrGroups] = React.useState<Record<string, boolean>>({});
  const [bulkEditingGroup, setBulkEditingGroup] = React.useState<{
    key: string;
    category: string;
    brand: string;
    model: string;
    errors: any[];
  } | null>(null);
  const [bulkEditNewCategory, setBulkEditNewCategory] = React.useState('');
  const [bulkEditNewBrand, setBulkEditNewBrand] = React.useState('');
  const [bulkEditNewModel, setBulkEditNewModel] = React.useState('');
  const [purchaseSearch, setPurchaseSearch] = React.useState('');
  const [userSearchVal, setUserSearchVal] = React.useState('');
  const [userRoleFilter, setUserRoleFilter] = React.useState<'client' | 'technician' | 'all'>('all');
  const [subSearchVal, setSubSearchVal] = React.useState('');
  const [paySearchVal, setPaySearchVal] = React.useState('');

  const approvedPurchases = React.useMemo(() => {
    return (partPurchases || []).filter(p => p.status !== 'pending' && p.status !== 'pending_payment');
  }, [partPurchases]);

  const filteredPurchases = approvedPurchases.filter(p => {
    const query = purchaseSearch.toLowerCase();
    return (
      (p.id && p.id.toLowerCase().includes(query)) ||
      (p.customerName && p.customerName.toLowerCase().includes(query)) ||
      (p.customerPhone && p.customerPhone.includes(query)) ||
      (p.partName && p.partName.toLowerCase().includes(query)) ||
      (p.partCategory && p.partCategory.toLowerCase().includes(query)) ||
      (p.customerAddress && p.customerAddress.toLowerCase().includes(query))
    );
  });

  // Local states for custom configuration additions
  const [newBrandName, setNewBrandName] = React.useState('');
  const [newCategoryName, setNewCategoryName] = React.useState('');
  const [newModelName, setNewModelName] = React.useState('');
  
  const [newCityName, setNewCityName] = React.useState('');
  const [newRegionName, setNewRegionName] = React.useState('');
  const [selectedConfigCity, setSelectedConfigCity] = React.useState('');

  // Unified global configuration search
  const [globalConfigSearch, setGlobalConfigSearch] = React.useState('');

  // Mass Bulk Import
  const [importType, setImportType] = React.useState<'errors' | 'categories' | 'brands' | 'cities'>('errors');
  const [pastedImportData, setPastedImportData] = React.useState('');
  const [importStatus, setImportStatus] = React.useState<{ type: 'idle' | 'success' | 'error'; msg: string }>({ type: 'idle', msg: '' });

  // Quick edit for errors
  const [editingError, setEditingError] = React.useState<ErrorCode | null>(null);

  // Local states for direct error code submission
  const [dirCode, setDirCode] = React.useState('');
  const [dirTitle, setDirTitle] = React.useState('');
  const [dirCategory, setDirCategory] = React.useState('');
  const [dirBrand, setDirBrand] = React.useState('');
  const [dirModel, setDirModel] = React.useState('');
  const [dirReason, setDirReason] = React.useState('');
  const [dirSolution, setDirSolution] = React.useState('');
  const [dirVideoUrl, setDirVideoUrl] = React.useState('');
  const [dirHazard, setDirHazard] = React.useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [dirIsCommon, setDirIsCommon] = React.useState(false);
  const [directInsertStatus, setDirectInsertStatus] = React.useState<{ type: 'idle' | 'success' | 'warning' | 'error'; msg: string; code?: string; category?: string; brand?: string; model?: string } | null>(null);
  
  const [categoryMode, setCategoryMode] = React.useState<'select' | 'custom'>('select');
  const [brandMode, setBrandMode] = React.useState<'select' | 'custom'>('select');
  const [modelMode, setModelMode] = React.useState<'select' | 'custom'>('select');

  // Common Problems Local States
  const [probTitle, setProbTitle] = React.useState('');
  const [probCategory, setProbCategory] = React.useState('');
  const [probBrand, setProbBrand] = React.useState('');
  const [probCausesRaw, setProbCausesRaw] = React.useState('');
  const [probSolutionsRaw, setProbSolutionsRaw] = React.useState('');
  const [probTagsRaw, setProbTagsRaw] = React.useState('');
  const [probCode, setProbCode] = React.useState('');
  const [probModel, setProbModel] = React.useState('');
  const [probDescription, setProbDescription] = React.useState('');
  const [probPrecautionsRaw, setProbPrecautionsRaw] = React.useState('');
  const [probHazardLevel, setProbHazardLevel] = React.useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [probModelMode, setProbModelMode] = React.useState<'select' | 'custom'>('select');
  const [editingProblemId, setEditingProblemId] = React.useState<string | null>(null);
  const [deletingProblemId, setDeletingProblemId] = React.useState<string | null>(null);
  const [probCategoryMode, setProbCategoryMode] = React.useState<'select' | 'custom'>('select');
  const [probBrandMode, setProbBrandMode] = React.useState<'select' | 'custom'>('select');
  const [probSearchQuery, setProbSearchQuery] = React.useState('');
  const [probImportText, setProbImportText] = React.useState('');
  const [probImportStatus, setProbImportStatus] = React.useState<{ type: 'idle' | 'success' | 'error'; msg: string }>({ type: 'idle', msg: '' });
  const [probFormMessage, setProbFormMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Common Problems Handlers
  const handleResetProblemForm = () => {
    setProbTitle('');
    setProbCategory('');
    setProbBrand('');
    setProbCausesRaw('');
    setProbSolutionsRaw('');
    setProbTagsRaw('');
    setProbCode('');
    setProbModel('');
    setProbDescription('');
    setProbPrecautionsRaw('');
    setProbHazardLevel('low');
    setEditingProblemId(null);
    setProbFormMessage(null);
  };

  const handleAddProblem = () => {
    if (!probTitle.trim()) {
      setProbFormMessage({ type: 'error', text: 'عنوان مشکل نمی‌تواند خالی باشد.' });
      return;
    }
    const finalCategory = probCategory.trim() || 'عمومی';
    const finalBrand = probBrand.trim() || 'عمومی';
    const finalCauses = probCausesRaw.split('\n').map(c => c.trim()).filter(Boolean);
    const finalSolutions = probSolutionsRaw.split('\n').map(s => s.trim()).filter(Boolean);
    const finalTags = probTagsRaw.split(',').map(t => t.trim()).filter(Boolean);
    const finalPrecautions = probPrecautionsRaw.split('\n').map(p => p.trim()).filter(Boolean);

    let updatedList: CommonProblem[] = [...commonProblems];
    
    if (editingProblemId) {
      // Edit
      updatedList = updatedList.map(p => p.id === editingProblemId ? {
        ...p,
        code: probCode.trim(),
        title: probTitle.trim(),
        category: finalCategory,
        brand: finalBrand,
        model: probModel.trim() || 'عمومی',
        description: probDescription.trim(),
        causes: finalCauses,
        steps: finalSolutions, // unified steps matches the solutions textarea
        solutions: finalSolutions,
        precautions: finalPrecautions,
        hazardLevel: probHazardLevel,
        tags: finalTags
      } : p);
      setProbFormMessage({ type: 'success', text: `مشکل شایع "${probTitle}" با موفقیت ویرایش گردید.` });
    } else {
      // Add
      const newProb: CommonProblem = {
        id: `prob-${Date.now()}`,
        code: probCode.trim(),
        title: probTitle.trim(),
        category: finalCategory,
        brand: finalBrand,
        model: probModel.trim() || 'عمومی',
        description: probDescription.trim(),
        causes: finalCauses,
        steps: finalSolutions,
        solutions: finalSolutions,
        precautions: finalPrecautions,
        hazardLevel: probHazardLevel,
        tags: finalTags,
        views: 0
      };
      updatedList.unshift(newProb);
      setProbFormMessage({ type: 'success', text: `مشکل شایع جدید با عنوان "${probTitle}" ثبت شد.` });
    }

    // Auto-extract and register category and brand to system configuration
    let updatedCats = false, updatedBrands = false;
    const newCategories = [...categoriesList];
    const newBrands = [...brandsList];

    if (finalCategory.trim() && finalCategory.trim() !== 'عمومی' && !newCategories.includes(finalCategory.trim())) {
      newCategories.push(finalCategory.trim());
      updatedCats = true;
    }

    if (finalBrand.trim() && finalBrand.trim() !== 'عمومی' && !newBrands.includes(finalBrand.trim())) {
      newBrands.push(finalBrand.trim());
      updatedBrands = true;
    }

    if (updatedCats) onUpdateCategoriesList(newCategories);
    if (updatedBrands) onUpdateBrandsList(newBrands);

    if (onUpdateCommonProblemsList) {
      onUpdateCommonProblemsList(updatedList);
    }
    
    // Clear form except the feedback message which will clear in 3s
    setTimeout(() => setProbFormMessage(null), 3000);
    setProbTitle('');
    setProbCategory('');
    setProbBrand('');
    setProbCausesRaw('');
    setProbSolutionsRaw('');
    setProbTagsRaw('');
    setProbCode('');
    setProbModel('');
    setProbDescription('');
    setProbPrecautionsRaw('');
    setProbHazardLevel('low');
    setEditingProblemId(null);
  };

  const handleEditProblemClick = (p: CommonProblem) => {
    setEditingProblemId(p.id);
    setProbTitle(p.title);
    setProbCategory(p.category);
    setProbBrand(p.brand);
    setProbCausesRaw(Array.isArray(p.causes) ? p.causes.join('\n') : (p.causes || ''));
    setProbSolutionsRaw(Array.isArray(p.steps || p.solutions) ? (p.steps || p.solutions).join('\n') : '');
    setProbTagsRaw(Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''));
    setProbCode(p.code || '');
    setProbModel(p.model || '');
    setProbDescription(p.description || '');
    setProbPrecautionsRaw(Array.isArray(p.precautions) ? p.precautions.join('\n') : (p.precautions || ''));
    setProbHazardLevel(p.hazardLevel || 'low');
    setProbFormMessage(null);
    
    // Scroll to the problems form smoothly
    const element = document.getElementById('problems-form-top');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDeleteProblem = async (id: string) => {
    try {
      const token = localStorage.getItem('session_user_id') || '';
      const res = await fetch(`/api/problems/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: { 'X-Session-Token': token }
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.status === 'ok' || data.success)) {
        const updatedList = commonProblems.filter(p => p.id !== id);
        if (onUpdateCommonProblemsList) {
          onUpdateCommonProblemsList(updatedList);
        }
      } else {
        alert(data.error || data.message || 'خطا در حذف مشکل شایع از سرور');
      }
    } catch (err: any) {
      alert(err.message || 'خطا در ارتباط با سرور');
    }
  };

  const handleImportProblemsJSON = () => {
    if (!probImportText.trim()) {
      setProbImportStatus({ type: 'error', msg: 'داده‌ای برای درون‌ریزی یافت نشد.' });
      return;
    }
    try {
      const parsed = JSON.parse(probImportText.trim());
      const rawArray = Array.isArray(parsed) ? parsed : [parsed];
      
      const imported: CommonProblem[] = [];
      for (const item of rawArray) {
        if (!item.title) continue;
        const stepsArr = Array.isArray(item.steps) ? item.steps : 
                         (Array.isArray(item.solutions) ? item.solutions : 
                          String(item.steps || item.solutions || '').split('\n').filter(Boolean));
        
        imported.push({
          id: item.id || `prob-imported-${Math.round(Math.random() * 1000000)}`,
          code: String(item.code || '').trim(),
          category: String(item.category || 'عمومی').trim(),
          brand: String(item.brand || 'عمومی').trim(),
          model: String(item.model || 'عمومی').trim(),
          title: String(item.title).trim(),
          description: String(item.description || '').trim(),
          causes: Array.isArray(item.causes) ? item.causes : String(item.causes || '').split('\n').filter(Boolean),
          steps: stepsArr,
          solutions: stepsArr, // keep for compatibility
          precautions: Array.isArray(item.precautions) ? item.precautions : String(item.precautions || '').split('\n').filter(Boolean),
          hazardLevel: (item.hazardLevel === 'critical' || item.hazardLevel === 'high' || item.hazardLevel === 'medium' || item.hazardLevel === 'low') ? item.hazardLevel : 'low',
          tags: Array.isArray(item.tags) ? item.tags : String(item.tags || '').split(',').map(t => t.trim()).filter(Boolean),
          views: Number(item.views) || 0
        });
      }

      if (imported.length === 0) {
        setProbImportStatus({ type: 'error', msg: 'فرمت داده نامعتبر است یا عنوان وجود ندارد.' });
        return;
      }

      const merged = [...imported, ...commonProblems];
      if (onUpdateCommonProblemsList) {
        onUpdateCommonProblemsList(merged);
      }

      setProbImportStatus({ type: 'success', msg: `تعداد ${imported.length} مشکل شایع جدید با موفقیت به سیستم اضافه گردید.` });
      setProbImportText('');
    } catch (err: any) {
      setProbImportStatus({ type: 'error', msg: `خطا در پارس اطلاعات: ${err.message}` });
    }
  };

  // Real-time matching logic for other categories and same category
  const matchingCodeRefs = React.useMemo(() => {
    if (!dirCode.trim()) return [];
    const searchCode = dirCode.trim().toLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک');
    return errorCodes.filter(err => {
      const codeClean = err.code.trim().toLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک');
      return codeClean === searchCode || codeClean.includes(searchCode) || searchCode.includes(codeClean);
    });
  }, [dirCode, errorCodes]);

  const matchingInCurrentCategory = React.useMemo(() => {
    if (!dirCategory.trim()) return matchingCodeRefs;
    const catClean = dirCategory.trim().toLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک');
    return matchingCodeRefs.filter(err => {
      const errCatClean = err.category.trim().toLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک');
      return errCatClean === catClean;
    });
  }, [dirCategory, matchingCodeRefs]);

  const matchingInOtherCategories = React.useMemo(() => {
    if (!dirCategory.trim()) return [];
    const catClean = dirCategory.trim().toLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک');
    return matchingCodeRefs.filter(err => {
      const errCatClean = err.category.trim().toLowerCase().replace(/[يى]/g, 'y').replace(/[يى]/g, 'ی').replace(/ك/g, 'ک');
      return errCatClean !== catClean;
    });
  }, [dirCategory, matchingCodeRefs]);

  // local temporary stock adjustments state
  const [editingPartId, setEditingPartId] = React.useState<string | null>(null);
  const [tempPrice, setTempPrice] = React.useState<number>(0);
  const [tempStock, setTempStock] = React.useState<number>(0);

  // Local states for adding a new spare part product
  const [newPartName, setNewPartName] = React.useState('');
  const [newPartDescription, setNewPartDescription] = React.useState('');
  const [newPartPrice, setNewPartPrice] = React.useState<number | ''>('');
  const [newPartPriceError, setNewPartPriceError] = React.useState('');
  const [newPartCategory, setNewPartCategory] = React.useState('');
  const [newPartModel, setNewPartModel] = React.useState('');
  const [newPartBrands, setNewPartBrands] = React.useState<string[]>([]);
  const [newPartStock, setNewPartStock] = React.useState<number | ''>('');
  const [newPartStockError, setNewPartStockError] = React.useState('');
  const [newPartImage, setNewPartImage] = React.useState('');
  const [newPartImageError, setNewPartImageError] = React.useState('');
  const [isAddPartOpen, setIsAddPartOpen] = React.useState(false);

  // Inline edit states for global config
  const [editingBrand, setEditingBrand] = React.useState<string | null>(null);
  const [editingBrandVal, setEditingBrandVal] = React.useState('');

  const [editingCategory, setEditingCategory] = React.useState<string | null>(null);
  const [editingCategoryVal, setEditingCategoryVal] = React.useState('');

  const [editingModel, setEditingModel] = React.useState<string | null>(null);
  const [editingModelVal, setEditingModelVal] = React.useState('');

  const [editingCity, setEditingCity] = React.useState<string | null>(null);
  const [editingCityVal, setEditingCityVal] = React.useState('');

  const [editingRegionCity, setEditingRegionCity] = React.useState<string | null>(null);
  const [editingRegion, setEditingRegion] = React.useState<string | null>(null);
  const [editingRegionVal, setEditingRegionVal] = React.useState('');

  const [adminPassMessage, setAdminPassMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [brandMessage, setBrandMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [categoryMessage, setCategoryMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [modelMessage, setModelMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [cityMessage, setCityMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [partMessage, setPartMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);

  // SMS Gateway state integrations
  const [smsProviderInput, setSmsProviderInput] = React.useState(smsSettings?.provider || 'simulated');
  const [smsApiKeyInput, setSmsApiKeyInput] = React.useState(smsSettings?.apiKey || '');
  const [smsLineNumberInput, setSmsLineNumberInput] = React.useState(smsSettings?.lineNumber || '');
  const [smsOtpPatternInput, setSmsOtpPatternInput] = React.useState(smsSettings?.otpPatternCode || '');
  const [smsStatusPatternInput, setSmsStatusPatternInput] = React.useState(smsSettings?.statusNotificationPatternCode || '');
  const [smsEnabledInput, setSmsEnabledInput] = React.useState(smsSettings?.enabled || false);

  // For testing sms dispatch
  const [testPhoneInput, setTestPhoneInput] = React.useState('');
  const [testMessageInput, setTestMessageInput] = React.useState('ارسال موفقیت‌آمیز پیامک از سامانه ب‌نیاز');
  const [testSmsStatus, setTestSmsStatus] = React.useState<{ type: 'idle' | 'loading' | 'success' | 'error', msg: string }>({ type: 'idle', msg: '' });

  React.useEffect(() => {
    if (smsSettings) {
      setSmsProviderInput(prev => shouldUpdateField('admin-sms-provider', prev, smsSettings.provider || 'simulated') ? (smsSettings.provider || 'simulated') : prev);
      setSmsApiKeyInput(prev => shouldUpdateField('admin-sms-api-key', prev, smsSettings.apiKey || '') ? (smsSettings.apiKey || '') : prev);
      setSmsLineNumberInput(prev => shouldUpdateField('admin-sms-line-number', prev, smsSettings.lineNumber || '') ? (smsSettings.lineNumber || '') : prev);
      setSmsOtpPatternInput(prev => shouldUpdateField('admin-sms-otp-pattern', prev, smsSettings.otpPatternCode || '') ? (smsSettings.otpPatternCode || '') : prev);
      setSmsStatusPatternInput(prev => shouldUpdateField('admin-sms-status-pattern', prev, smsSettings.statusNotificationPatternCode || '') ? (smsSettings.statusNotificationPatternCode || '') : prev);
      setSmsEnabledInput(smsSettings.enabled || false);
    }
  }, [smsSettings]);

  const handleSaveSmsSettings = () => {
    if (onUpdateSmsSettings) {
      onUpdateSmsSettings({
        provider: smsProviderInput,
        apiKey: smsApiKeyInput,
        lineNumber: smsLineNumberInput,
        otpPatternCode: smsOtpPatternInput,
        statusNotificationPatternCode: smsStatusPatternInput,
        enabled: smsEnabledInput,
      });
      alert('تنظیمات وب‌سرویس و درگاه پیامک با موفقیت همگام‌سازی شد.');
    }
  };

  const handleTestSmsSend = async () => {
    if (!testPhoneInput) {
      alert('لطفاً شماره موبایل گیرنده را وارد نمایید.');
      return;
    }
    setTestSmsStatus({ type: 'loading', msg: 'درحال برقراری ارتباط با پکیج مخابراتی...' });
    try {
      if (onSendTestSms) {
        await onSendTestSms(testPhoneInput, testMessageInput, 'status');
        setTestSmsStatus({ 
          type: 'success', 
          msg: `پیامک آزمایشی به شماره ${testPhoneInput} با موفقیت ارسال شد و در صف سیستم مرکزی ثبت گردید.`  
        });
      } else {
        throw new Error('روابط ارتباطی با وب‌سرویس قطع است.');
      }
    } catch (e: any) {
      setTestSmsStatus({ type: 'error', msg: `خطا در فرآیند ارسال آزمایشی: ${e.message || e}` });
    }
  };

  // Administrator password configuration states
  const [currentAdminPass, setCurrentAdminPass] = React.useState('');
  const [newAdminPass, setNewAdminPass] = React.useState('');
  const [newAdminPassConfirm, setNewAdminPassConfirm] = React.useState('');

  const handleChangeAdminPass = () => {
    setAdminPassMessage(null);
    const savedAdminPassword = adminPassword || '';
    if (!currentAdminPass) {
      alert('لطفاً کلمه عبور فعلی مدیریت را وارد فرمایید.');
      return;
    }
    if (currentAdminPass !== savedAdminPassword) {
      alert('کلمه عبور فعلی وارد شده نادرست است!');
      return;
    }
    if (!newAdminPass.trim()) {
      alert('لطفاً کلمه عبور جدید را وارد فرمایید.');
      return;
    }
    if (newAdminPass !== newAdminPassConfirm) {
      alert('رمز عبور جدید با تاییدیه آن مطابقت ندارد!');
      return;
    }
    if (onUpdateAdminPassword) {
      onUpdateAdminPassword(newAdminPass.trim());
    } else {
      localStorage.setItem('ir_admin_password', newAdminPass.trim());
    }
    setAdminPassMessage({ type: 'success', text: 'کلمه عبور مدیر ارشد با موفقیت تغییر یافت. کلمه عبور جدید ثبت شد.' });
    alert('کلمه عبور مدیر ارشد با موفقیت تغییر یافت. از این پس برای ورود کلید واژه جدید معتبر خواهد بود.');
    setCurrentAdminPass('');
    setNewAdminPass('');
    setNewAdminPassConfirm('');
  };

  // Manual technician insertion form states
  const [isAddTechOpen, setIsAddTechOpen] = React.useState(false);
  const [newTechName, setNewTechName] = React.useState('');
  const [newTechPhone, setNewTechPhone] = React.useState('');
  const [newTechPhoneError, setNewTechPhoneError] = React.useState('');
  const [newTechPassword, setNewTechPassword] = React.useState('');
  const [newTechSpecialties, setNewTechSpecialties] = React.useState<string[]>([]);
  const [newTechLocation, setNewTechLocation] = React.useState('');
  const [newTechAvatar, setNewTechAvatar] = React.useState('');
  const [newTechAvatarError, setNewTechAvatarError] = React.useState('');
  const [newTechRating, setNewTechRating] = React.useState(5.0);
  const [newTechSatisfactionRate, setNewTechSatisfactionRate] = React.useState(98);

  // Manual technician editing states
  const [editingTechId, setEditingTechId] = React.useState<string | null>(null);
  const [editTechName, setEditTechName] = React.useState('');
  const [editTechPhone, setEditTechPhone] = React.useState('');
  const [editTechPhoneError, setEditTechPhoneError] = React.useState('');
  const [editTechPassword, setEditTechPassword] = React.useState('');
  const [editTechSpecialties, setEditTechSpecialties] = React.useState<string[]>([]);
  const [editTechLocation, setEditTechLocation] = React.useState('');
  const [editTechAvatar, setEditTechAvatar] = React.useState('');
  const [editTechAvatarError, setEditTechAvatarError] = React.useState('');
  const [editTechRating, setEditTechRating] = React.useState(5.0);
  const [editTechSatisfactionRate, setEditTechSatisfactionRate] = React.useState(98);

  // Affiliate Products states
  const [isAddAffiliateOpen, setIsAddAffiliateOpen] = React.useState(false);
  const [newAffiliateTitle, setNewAffiliateTitle] = React.useState('');
  const [newAffiliateCategory, setNewAffiliateCategory] = React.useState('');
  const [newAffiliateBrand, setNewAffiliateBrand] = React.useState('');
  const [newAffiliateModel, setNewAffiliateModel] = React.useState('');
  const [newAffiliatePrice, setNewAffiliatePrice] = React.useState(0);
  const [newAffiliateLink, setNewAffiliateLink] = React.useState('');
  const [newAffiliateImage, setNewAffiliateImage] = React.useState('');
  const [newAffiliateCommission, setNewAffiliateCommission] = React.useState(0);

  const [editingAffiliateId, setEditingAffiliateId] = React.useState<string | null>(null);
  const [editAffiliateTitle, setEditAffiliateTitle] = React.useState('');
  const [editAffiliateCategory, setEditAffiliateCategory] = React.useState('');
  const [editAffiliateBrand, setEditAffiliateBrand] = React.useState('');
  const [editAffiliateModel, setEditAffiliateModel] = React.useState('');
  const [editAffiliatePrice, setEditAffiliatePrice] = React.useState(0);
  const [editAffiliateLink, setEditAffiliateLink] = React.useState('');
  const [editAffiliateImage, setEditAffiliateImage] = React.useState('');
  const [editAffiliateCommission, setEditAffiliateCommission] = React.useState(0);

  const handleTechAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        if (isEdit) {
          setEditTechAvatar(event.target.result as string);
        } else {
          setNewTechAvatar(event.target.result as string);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddNewTech = (e: React.FormEvent) => {
    e.preventDefault();
    setNewTechPhoneError('');
    setNewTechAvatarError('');

    if (!newTechName.trim()) {
      alert('لطفاً نام و نام خانوادگی تکنسین را وارد کنید.');
      return;
    }

    const phoneValidation = validateIranianMobile(newTechPhone);
    if (!phoneValidation.isValid) {
      setNewTechPhoneError(phoneValidation.error || '');
      alert(phoneValidation.error || 'خطا در شماره تلفن همراه تکنسین');
      return;
    }

    if (newTechAvatar.trim()) {
      const urlValidation = validateUrl(newTechAvatar);
      if (!urlValidation.isValid) {
        setNewTechAvatarError(urlValidation.error || '');
        alert(urlValidation.error || 'فرم آدرس عکس آواتار نامعتبر است.');
        return;
      }
    }

    const newTechObj: any = {
      id: `tech_${Date.now()}`,
      name: newTechName.trim(),
      phone: newTechPhone.trim(),
      password: newTechPassword.trim() || '123456',
      specialty: newTechSpecialties.length > 0 ? newTechSpecialties : ['پکیج'],
      rating: newTechRating,
      satisfactionRate: newTechSatisfactionRate,
      completedOrders: 0,
      balance: 0,
      isVerified: true,
      activeLocation: newTechLocation.trim() || 'تهران',
      avatarUrl: newTechAvatar.trim() || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>",
      documents: []
    };

    if (onUpdateTechniciansList) {
      onUpdateTechniciansList([...technicians, newTechObj]);
      alert(`پرونده تکنسین جدید "${newTechName.trim()}" با موفقیت ایجاد و فعال شد!`);
      setNewTechName('');
      setNewTechPhone('');
      setNewTechPhoneError('');
      setNewTechPassword('');
      setNewTechSpecialties([]);
      setNewTechLocation('');
      setNewTechAvatar('');
      setNewTechAvatarError('');
      setNewTechRating(5.0);
      setNewTechSatisfactionRate(98);
      setIsAddTechOpen(false);
    } else {
      alert('خطا: امکان بروزرسانی لیست تکنسین‌ها وجود ندارد (به دلیل عدم دسترسی به دیتابیس همکاران).');
    }
  };

  const handleEditTechSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTechName.trim()) {
      alert('لطفاً نام و نام خانوادگی تکنسین را وارد کنید.');
      return;
    }
    const phoneValidation = validateIranianMobile(editTechPhone);
    if (!phoneValidation.isValid) {
      alert(phoneValidation.error || 'خطا در شماره تلفن همراه تکنسین');
      return;
    }

    if (onUpdateTechniciansList && editingTechId) {
      const updated = technicians.map(t => {
        if (t.id === editingTechId) {
          return {
            ...t,
            name: editTechName.trim(),
            phone: editTechPhone.trim(),
            password: editTechPassword.trim(),
            specialty: editTechSpecialties.length > 0 ? editTechSpecialties : ['پکیج'],
            rating: parseFloat(editTechRating.toString()) || 5.0,
            satisfactionRate: parseInt(editTechSatisfactionRate.toString()) || 98,
            activeLocation: editTechLocation.trim() || 'تهران',
            avatarUrl: editTechAvatar.trim() || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>"
          };
        }
        return t;
      });
      onUpdateTechniciansList(updated);
      alert('اطلاعات پرسنلی و ارزیابی تکنسین با موفقیت بروزرسانی شد!');
      setEditingTechId(null);
    }
  };

  const handleAddAffiliateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAffiliateCategory || !newAffiliateBrand || !newAffiliateModel || !newAffiliateLink) {
      alert('لطفاً تمامی فیلدهای الزامی ستاره‌دار را تکمیل نمایید.');
      return;
    }

    const titleVal = newAffiliateTitle.trim() || `${newAffiliateBrand} ${newAffiliateModel} - ${newAffiliateCategory}`;
    const imgVal = newAffiliateImage.trim() || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f1f5f9'/><text x='50' y='55' font-size='28' text-anchor='middle'>⚙️</text></svg>";

    const newProduct = {
      id: `aff_${Date.now()}`,
      name: titleVal,
      title: titleVal,
      category: newAffiliateCategory,
      brand: newAffiliateBrand,
      model: newAffiliateModel,
      price: Number(newAffiliatePrice) || 0,
      link: newAffiliateLink.trim(),
      purchaseUrl: newAffiliateLink.trim(),
      image: imgVal,
      commission: Number(newAffiliateCommission) || 0,
      description: `قطعه همکار ${titleVal} برای ${newAffiliateBrand} مدل ${newAffiliateModel}`,
      created_at: new Date().toISOString()
    };

    if (onUpdateAffiliateProducts) {
      const updated = [...(affiliateProducts || []), newProduct];
      onUpdateAffiliateProducts(updated);
      alert('محصول همکاری در فروش جدید با موفقیت ثبت شد!');
      // Reset form
      setNewAffiliateTitle('');
      setNewAffiliateImage('');
      setNewAffiliateCategory('');
      setNewAffiliateBrand('');
      setNewAffiliateModel('');
      setNewAffiliatePrice(0);
      setNewAffiliateLink('');
      setNewAffiliateCommission(0);
      setIsAddAffiliateOpen(false);
    }
  };

  const handleEditAffiliateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAffiliateCategory || !editAffiliateBrand || !editAffiliateModel || !editAffiliateLink) {
      alert('لطفاً تمامی فیلدهای الزامی ستاره‌دار را تکمیل نمایید.');
      return;
    }

    const titleVal = editAffiliateTitle.trim() || `${editAffiliateBrand} ${editAffiliateModel} - ${editAffiliateCategory}`;

    if (onUpdateAffiliateProducts && editingAffiliateId) {
      const updated = (affiliateProducts || []).map(p => {
        if (p.id === editingAffiliateId) {
          return {
            ...p,
            name: titleVal,
            title: titleVal,
            category: editAffiliateCategory,
            brand: editAffiliateBrand,
            model: editAffiliateModel,
            price: Number(editAffiliatePrice) || 0,
            link: editAffiliateLink.trim(),
            purchaseUrl: editAffiliateLink.trim(),
            image: editAffiliateImage.trim() || p.image || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f1f5f9'/><text x='50' y='55' font-size='28' text-anchor='middle'>⚙️</text></svg>",
            commission: Number(editAffiliateCommission) || 0,
            description: `قطعه همکار ${titleVal} برای ${editAffiliateBrand} مدل ${editAffiliateModel}`
          };
        }
        return p;
      });
      onUpdateAffiliateProducts(updated);
      alert('تغییرات محصول همکاری در فروش با موفقیت ذخیره شد!');
      setEditingAffiliateId(null);
    }
  };

  // Dedicated interactive document previewer modal state
  const [previewDoc, setPreviewDoc] = React.useState<{ techName: string; docName: string } | null>(null);

  // Custom visual confirm dialog to work flawlessly in sandboxed iFrames
  const [showConfirmModal, setShowConfirmModal] = React.useState<{
    title: string;
    message: string;
    onConfirm: (typedPassword?: string) => void;
    requiresPasswordVerify?: boolean;
  } | null>(null);

  const [confirmPasswordInput, setConfirmPasswordInput] = React.useState('');
  const [confirmPasswordError, setConfirmPasswordError] = React.useState('');

  const triggerSafeConfirm = (
    title: string,
    message: string,
    onConfirm: (typedPassword?: string) => void,
    requiresPasswordVerify?: boolean
  ) => {
    setConfirmPasswordInput('');
    setConfirmPasswordError('');
    setShowConfirmModal({ title, message, onConfirm, requiresPasswordVerify });
  };

  const handleDeletePart = (id: string) => {
    if (onUpdateSparePartsList) {
      const part = spareParts.find((p) => p.id === id);
      triggerSafeConfirm(
        'حذف محصول فروشگاه',
        `آیا از حذف قطعه/محصول "${part?.name || 'انتخابی'}" از بورس قطعات رجیستر شده اطمینان کامل دارید؟`,
        async () => {
          try {
            const token = localStorage.getItem('session_user_id') || '';
            const res = await fetch(`/api/store/parts/${encodeURIComponent(id)}`, {
              method: 'DELETE',
              headers: { 'X-Session-Token': token }
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && (data.status === 'ok' || data.success)) {
              const filtered = spareParts.filter((p) => p.id !== id);
              onUpdateSparePartsList(filtered);
              alert(`محصول/قطعه "${part?.name || 'انتخابی'}" با موفقیت از دیتابیس بورس قطعات کدیار۲۴ حذف گردید.`);
            } else {
              alert(data.error || data.message || 'خطا در حذف قطعه از سرور');
            }
          } catch (err: any) {
            alert(err.message || 'خطا در ارتباط با سرور');
          }
        }
      );
    }
  };

  const handleAddNewPart = (e: React.FormEvent) => {
    e.preventDefault();
    setNewPartImageError('');
    setNewPartPriceError('');
    setNewPartStockError('');

    if (!newPartName.trim()) {
      alert('لطفاً نام قطعه یدکی را وارد کنید.');
      return;
    }

    const priceNum = Number(newPartPrice);
    if (newPartPrice === '' || isNaN(priceNum) || priceNum < 0) {
      setNewPartPriceError('قیمت کالا باید یک عدد بزرگتر یا مساوی صفر باشد.');
      alert('خطا: قیمت کالا باید یک عدد بزرگتر یا مساوی صفر باشد.');
      return;
    }

    const stockNum = Number(newPartStock);
    if (newPartStock === '' || isNaN(stockNum) || stockNum < 0) {
      setNewPartStockError('موجودی انبار باید یک عدد بزرگتر یا مساوی صفر باشد.');
      alert('خطا: موجودی انبار باید یک عدد بزرگتر یا مساوی صفر باشد.');
      return;
    }

    if (newPartImage.trim()) {
      const urlValidation = validateUrl(newPartImage);
      if (!urlValidation.isValid) {
        setNewPartImageError(urlValidation.error || '');
        alert(urlValidation.error || 'نشانی تصویر قطعه نامعتبر است.');
        return;
      }
    }

    // Fallback image SVG if empty
    let finalImage = newPartImage.trim();
    if (!finalImage) {
      finalImage = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f1f5f9'/><text x='50' y='55' font-size='28' text-anchor='middle'>⚙️</text></svg>";
    }

    const newPartObj: SparePart = {
      id: 'part_' + Date.now(),
      name: newPartName.trim(),
      description: newPartDescription.trim() || `قطعه اورجینال ${newPartName.trim()}`,
      price: priceNum,
      image: finalImage,
      category: newPartCategory || 'سایر',
      brand: newPartBrands.length > 0 ? newPartBrands[0] : 'عمومی',
      compatibility: newPartBrands.length > 0 ? newPartBrands : ['عمومی'],
      model: newPartModel.trim() || 'همه مدل‌ها',
      stock: stockNum
    };

    if (onUpdateSparePartsList) {
      onUpdateSparePartsList([...spareParts, newPartObj]);
      setPartMessage({ type: 'success', text: `محصول قطعه یدکی "${newPartName.trim()}" با موفقیت ذخیره شد.` });
      alert(`قطعه فنی جدید "${newPartName.trim()}" با موفقیت ثبت نهایی شد و در انبار محصولات در دسترس قرار گرفت.`);
      // Reset form
      setNewPartName('');
      setNewPartDescription('');
      setNewPartPrice('');
      setNewPartPriceError('');
      setNewPartCategory('');
      setNewPartModel('');
      setNewPartBrands([]);
      setNewPartStock('');
      setNewPartStockError('');
      setNewPartImage('');
      setNewPartImageError('');
      setIsAddPartOpen(false);
    }
  };

  // platform stats
  const totalInvoiced = orders
    .filter((o) => o.status === 'completed' && o.estimatedCost)
    .reduce((sum, o) => sum + (o.estimatedCost || 0), 0);

  // Platform takes 15% commission
  const platformEarning = totalInvoiced * 0.15;

  // Dynamic distribution of sold parts and performed services based on real category data
  const categoryDistribution = React.useMemo(() => {
    const catMap: Record<string, { orders: number; purchases: number; total: number }> = {};

    const baseCats = ['پکیج', 'کولر گازی', 'یخچال', 'لباسشویی', 'ظرفشویی'];

    // Helper to map category variations to canonical names
    const normalizeCat = (rawCat?: string): string => {
      if (!rawCat) return 'سایر';
      const clean = String(rawCat).trim();
      for (const b of baseCats) {
        if (clean.includes(b) || b.includes(clean)) {
          return b;
        }
      }
      return clean;
    };

    // Initialize base categories
    baseCats.forEach(cat => {
      catMap[cat] = { orders: 0, purchases: 0, total: 0 };
    });

    // 1. Service Repair Orders (خدمات تعمیر)
    (orders || []).forEach(o => {
      if (o.category) {
        const cat = normalizeCat(o.category);
        if (!catMap[cat]) catMap[cat] = { orders: 0, purchases: 0, total: 0 };
        catMap[cat].orders += 1;
        catMap[cat].total += 1;
      }
    });

    // 2. Error Codes / Technical Knowledge Base (عیب‌یابی / کدهای خطا)
    // Only count if no repair orders or along with them to represent active knowledge services
    const errorCodesList = (errorCodes || []);
    errorCodesList.forEach(ec => {
      if (ec.category) {
        const cat = normalizeCat(ec.category);
        if (!catMap[cat]) catMap[cat] = { orders: 0, purchases: 0, total: 0 };
        catMap[cat].orders += 1;
        catMap[cat].total += 1;
      }
    });

    // 3. Purchased/Sold Parts (سفارشات/خرید قطعات)
    (partPurchases || []).forEach(p => {
      const pCat = p.partCategory || (p as any).category;
      if (pCat) {
        const cat = normalizeCat(pCat);
        if (!catMap[cat]) catMap[cat] = { orders: 0, purchases: 0, total: 0 };
        catMap[cat].purchases += 1;
        catMap[cat].total += 1;
      }
    });

    // 4. Inventory Spare Parts (قطعات موجود در انبار/انبارداری)
    (spareParts || []).forEach(sp => {
      if (sp.category) {
        const cat = normalizeCat(sp.category);
        if (!catMap[cat]) catMap[cat] = { orders: 0, purchases: 0, total: 0 };
        const qty = typeof sp.stock === 'number' && sp.stock > 0 ? sp.stock : 1;
        catMap[cat].purchases += qty;
        catMap[cat].total += qty;
      }
    });

    const totalSum = Object.values(catMap).reduce((sum, item) => sum + item.total, 0);

    const sortedList = Object.entries(catMap)
      .map(([catName, stats]) => ({
        category: catName,
        orders: stats.orders,
        purchases: stats.purchases,
        total: stats.total,
        percentage: totalSum > 0 ? Math.round((stats.total / totalSum) * 100) : 0
      }))
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total);

    return { list: sortedList, totalSum };
  }, [categoriesList, orders, partPurchases, spareParts, errorCodes]);

  const pendingErrors = errorCodes.filter((err) => !err.isApproved);
  const approvedErrors = errorCodes.filter((err) => err.isApproved);

  const filteredPendingErrors = React.useMemo(() => {
    const query = pendingCodesSearchVal.trim().toLowerCase();
    if (!query) return pendingErrors;
    return pendingErrors.filter(err =>
      (err.code || '').toLowerCase().includes(query) ||
      (err.brand || '').toLowerCase().includes(query) ||
      (err.category || '').toLowerCase().includes(query) ||
      (err.model || '').toLowerCase().includes(query) ||
      (err.title || '').toLowerCase().includes(query) ||
      (err.description || '').toLowerCase().includes(query) ||
      (err.updatedBy || '').toLowerCase().includes(query)
    );
  }, [pendingCodesSearchVal, pendingErrors]);

  const filteredSpareParts = React.useMemo(() => {
    const query = sparePartsSearchVal.trim().toLowerCase();
    if (!query) return spareParts;
    return spareParts.filter(p =>
      (p.name || '').toLowerCase().includes(query) ||
      (p.category || '').toLowerCase().includes(query) ||
      (p.description || '').toLowerCase().includes(query) ||
      (Array.isArray(p.compatibility) && p.compatibility.some(c => (c || '').toLowerCase().includes(query)))
    );
  }, [sparePartsSearchVal, spareParts]);

  const filteredApprovedErrors = React.useMemo(() => {
    const query = approvedCodesSearchVal.trim().toLowerCase();
    if (!query) return approvedErrors;
    return approvedErrors.filter(err => 
      (err.code || '').toLowerCase().includes(query) ||
      (err.brand || '').toLowerCase().includes(query) ||
      (err.category || '').toLowerCase().includes(query) ||
      (err.title || '').toLowerCase().includes(query) ||
      (err.description || '').toLowerCase().includes(query)
    );
  }, [approvedCodesSearchVal, approvedErrors]);

  const uniqueErrCategories = React.useMemo(() => {
    return Array.from(new Set(approvedErrors.map(e => e.category).filter(Boolean)));
  }, [approvedErrors]);

  const uniqueErrBrands = React.useMemo(() => {
    return Array.from(new Set(approvedErrors.map(e => e.brand).filter(Boolean)));
  }, [approvedErrors]);

  const groupedApprovedErrors = React.useMemo(() => {
    let filtered = filteredApprovedErrors;
    
    if (errGroupCategoryFilter) {
      filtered = filtered.filter(err => err.category === errGroupCategoryFilter);
    }
    
    if (errGroupBrandFilter) {
      filtered = filtered.filter(err => err.brand === errGroupBrandFilter);
    }

    const groups: Record<string, { category: string; brand: string; model: string; errors: any[] }> = {};
    filtered.forEach(err => {
      const cat = err.category || 'سایر';
      const brand = err.brand || 'سایر';
      const model = err.model || 'عمومی';
      const key = `${cat} | ${brand} | ${model}`;
      if (!groups[key]) {
        groups[key] = {
          category: cat,
          brand: brand,
          model: model,
          errors: []
        };
      }
      groups[key].errors.push(err);
    });

    return Object.entries(groups).map(([key, value]) => ({
      key,
      ...value
    })).sort((a, b) => {
      const catComp = a.category.localeCompare(b.category, 'fa');
      if (catComp !== 0) return catComp;
      const brandComp = a.brand.localeCompare(b.brand, 'fa');
      if (brandComp !== 0) return brandComp;
      return a.model.localeCompare(b.model, 'fa');
    });
  }, [filteredApprovedErrors, errGroupCategoryFilter, errGroupBrandFilter]);

  const activeJobsCount = orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length;

  // Let's compute matched configurations for the unified search to prevent clutter:
  const matchedCategories = React.useMemo(() => {
    const query = globalConfigSearch.trim().toLowerCase();
    if (!query) return categoriesList;
    return categoriesList.filter(cat => cat.toLowerCase().includes(query));
  }, [globalConfigSearch, categoriesList]);

  const matchedBrands = React.useMemo(() => {
    const query = globalConfigSearch.trim().toLowerCase();
    if (!query) return brandsList;
    return brandsList.filter(brand => brand.toLowerCase().includes(query));
  }, [globalConfigSearch, brandsList]);

  const matchedModels = React.useMemo(() => {
    const query = globalConfigSearch.trim().toLowerCase();
    if (!query) return modelsList;
    return modelsList.filter(model => model.toLowerCase().includes(query));
  }, [globalConfigSearch, modelsList]);

  const matchedCitiesAndRegions = React.useMemo(() => {
    const query = globalConfigSearch.trim().toLowerCase();
    if (!query) {
      const results: Array<{ cityName: string; regionName?: string }> = [];
      citiesList?.forEach(city => {
        if (!city?.name) return;
        results.push({ cityName: city.name });
        city.regions?.forEach(reg => {
          results.push({ cityName: city.name, regionName: reg });
        });
      });
      return results;
    }
    
    const results: Array<{ cityName: string; regionName?: string }> = [];
    citiesList?.forEach(city => {
      if (!city?.name) return;
      if (city.name.toLowerCase().includes(query)) {
        results.push({ cityName: city.name });
      }
      city.regions?.forEach(reg => {
        if (city.name.toLowerCase().includes(query) || reg.toLowerCase().includes(query)) {
          results.push({ cityName: city.name, regionName: reg });
        }
      });
    });
    return results;
  }, [globalConfigSearch, citiesList]);

  const matchedErrors = React.useMemo(() => {
    const query = globalConfigSearch.trim().toLowerCase();
    if (!query) return errorCodes;
    return errorCodes.filter(err => 
      err.code.toLowerCase().includes(query) ||
      err.title.toLowerCase().includes(query) ||
      err.category.toLowerCase().includes(query) ||
      err.brand.toLowerCase().includes(query) ||
      (err.model && err.model.toLowerCase().includes(query)) ||
      (err.description && err.description.toLowerCase().includes(query)) ||
      err.causes.some(c => c.toLowerCase().includes(query)) ||
      err.steps.some(s => s.toLowerCase().includes(query))
    );
  }, [globalConfigSearch, errorCodes]);

  const matchedTechnicians = React.useMemo(() => {
    const query = globalConfigSearch.trim().toLowerCase();
    if (!query) return technicians;
    return technicians.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.phone.toLowerCase().includes(query) ||
      (t.activeLocation && t.activeLocation.toLowerCase().includes(query)) ||
      t.specialty.some(s => s.toLowerCase().includes(query))
    );
  }, [globalConfigSearch, technicians]);

  const matchedSpareParts = React.useMemo(() => {
    const query = globalConfigSearch.trim().toLowerCase();
    if (!query) return spareParts;
    return (spareParts || []).filter(p => 
      (p.name || '').toLowerCase().includes(query) ||
      (p.description || '').toLowerCase().includes(query) ||
      (p.category || '').toLowerCase().includes(query) ||
      (Array.isArray(p.compatibility) && p.compatibility.some(c => (c || '').toLowerCase().includes(query)))
    );
  }, [globalConfigSearch, spareParts]);

  const smartRecommendedBrands = React.useMemo(() => {
    if (!dirCategory) return brandsList;
    const related = errorCodes.filter(err => err.category === dirCategory).map(err => err.brand);
    const uniq = Array.from(new Set(related)).filter(Boolean);
    const others = brandsList.filter(b => !uniq.includes(b));
    return [...uniq, ...others];
  }, [dirCategory, brandsList, errorCodes]);

  const smartRecommendedModels = React.useMemo(() => {
    if (!dirCategory && !dirBrand) return modelsList;
    const related = errorCodes
      .filter(err => (!dirCategory || err.category === dirCategory) && (!dirBrand || err.brand === dirBrand))
      .map(err => err.model ? err.model.split('/').map(m => m.trim()) : [])
      .flat();
    const uniq = Array.from(new Set(related)).filter(Boolean);
    const others = modelsList.filter(m => !uniq.includes(m));
    return [...uniq, ...others];
  }, [dirCategory, dirBrand, modelsList, errorCodes]);

  const handleStartEditPart = (p: SparePart) => {
    setEditingPartId(p.id);
    setTempPrice(p.price);
    setTempStock(p.stock);
  };

  const handleSavePartChanges = (id: string) => {
    onUpdatePartStock(id, tempStock, tempPrice);
    setEditingPartId(null);
    alert('موجودی و قیمت قطعه با موفقیت در بانک اطلاعاتی بروزرسانی شد.');
  };

  const handleAddBrand = () => {
    if (!newBrandName.trim()) return;
    if (brandsList.includes(newBrandName.trim())) {
      alert('این برند از قبل در سیستم موجود است.');
      return;
    }
    onUpdateBrandsList([...brandsList, newBrandName.trim()]);
    setBrandMessage({ type: 'success', text: `برند جدید "${newBrandName.trim()}" اضافه شد.` });
    alert(`برند جدید "${newBrandName.trim()}" با موفقیت به بانک اطلاعات و پیکربندی برندها الحاق گردید.`);
    setNewBrandName('');
  };

  const handleRemoveBrand = (br: string) => {
    triggerSafeConfirm(
      'حذف برند سیستم',
      `آیا از حذف برند "${br}" از اطلاعات پایه اطمینان دارید؟ کدهای خطای مربوطه ممکن است یتیم شوند.`,
      () => {
        onUpdateBrandsList(brandsList.filter(b => b !== br));
        setBrandMessage({ type: 'success', text: `برند "${br}" حذف شد.` });
        alert(`برند "${br}" با موفقیت از سیستم حذف گردید.`);
      }
    );
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    if (categoriesList.includes(newCategoryName.trim())) {
      alert('این دسته‌بندی از قبل در سیستم موجود است.');
      return;
    }
    onUpdateCategoriesList([...categoriesList, newCategoryName.trim()]);
    setCategoryMessage({ type: 'success', text: `دسته‌بندی جدید "${newCategoryName.trim()}" ایجاد شد.` });
    alert(`دسته‌بندی دستگاه جدید "${newCategoryName.trim()}" با موفقیت به پیکربندی لوازم خانگی اضافه شد.`);
    setNewCategoryName('');
  };

  const handleRemoveCategory = (cat: string) => {
    triggerSafeConfirm(
      'حذف دسته‌بندی سیستم',
      `آیا از حذف کامل دسته‌بندی "${cat}" از اطلاعات پایه اطمینان دارید؟`,
      () => {
        onUpdateCategoriesList(categoriesList.filter(c => c !== cat));
        setCategoryMessage({ type: 'success', text: `دسته‌بندی "${cat}" با موفقیت حذف شد.` });
        alert(`دسته‌بندی "${cat}" با موفقیت از سیستم حذف گردید.`);
      }
    );
  };

  const handleAddCity = () => {
    if (!newCityName.trim()) return;
    if (citiesList.some(c => c.name === newCityName.trim())) {
      alert('این شهر از قبل در سیستم موجود است.');
      return;
    }
    const updated = [...citiesList, { name: newCityName.trim(), regions: [] }];
    onUpdateCitiesList(updated);
    setCityMessage({ type: 'success', text: `شهر "${newCityName.trim()}" به شهرهای تحت پوشش اضافه شد.` });
    alert(`شهر جدید "${newCityName.trim()}" با موفقیت ارتقا یافته و به عنوان محدوده پوشش خدمات ثبت شد.`);
    setSelectedConfigCity(newCityName.trim());
    setNewCityName('');
  };

  const handleRemoveCity = (cityName: string) => {
    triggerSafeConfirm(
      'حذف موقعیت شهری',
      `آیا از حذف شهر "${cityName}" با کلیه محلات مربوطه مطمئن هستید؟ با این کار حوزه‌های فعالیت تکنسین‌ها کوچک‌تر می‌شود.`,
      () => {
        onUpdateCitiesList(citiesList.filter(c => c.name !== cityName));
        if (selectedConfigCity === cityName) setSelectedConfigCity('');
        setCityMessage({ type: 'success', text: `موقعیت شهر "${cityName}" حذف شد.` });
        alert(`شهر "${cityName}" و کل مناطق آن با موفقیت حذف و از سیستم خدمات تفکیکی سراسری برداشته شد.`);
      }
    );
  };

  const handleAddRegion = () => {
    if (!selectedConfigCity || !newRegionName.trim()) return;
    const targetCity = citiesList.find(c => c.name === selectedConfigCity);
    if (!targetCity) return;
    if (targetCity.regions.includes(newRegionName.trim())) {
      alert('این محله از قبل در شهر انتخابی موجود است.');
      return;
    }
    const updated = citiesList.map(c => {
      if (c.name === selectedConfigCity) {
        return { ...c, regions: [...c.regions, newRegionName.trim()] };
      }
      return c;
    });
    onUpdateCitiesList(updated);
    setCityMessage({ type: 'success', text: `منطقه "${newRegionName.trim()}" برای شهر "${selectedConfigCity}" ثبت شد.` });
    alert(`منطقه جدید "${newRegionName.trim()}" با موفقیت در زیرمجموعه‌ی محله‌های فعال شهر "${selectedConfigCity}" رجیستر شد.`);
    setNewRegionName('');
  };

  const handleRemoveRegion = (cityName: string, region: string) => {
    triggerSafeConfirm(
      'حذف محله از شهر',
      `آیا از حذف محله "${region}" از شهر "${cityName}" اطمینان دارید؟ کاربران و تکنسین‌های این منطقه ممکن است تحت تاثیر قرار گیرند.`,
      () => {
        const updated = citiesList.map(c => {
          if (c.name === cityName) {
            return { ...c, regions: c.regions.filter(r => r !== region) };
          }
          return c;
        });
        onUpdateCitiesList(updated);
        setCityMessage({ type: 'success', text: `محله "${region}" از شهر "${cityName}" برداشته شد.` });
        alert(`منطقه/محله "${region}" با موفقیت از پوشش شهر الکترونیکی خدمات حذف گردید.`);
      }
    );
  };

  const handleAddModel = () => {
    if (!newModelName.trim()) return;
    if (modelsList.includes(newModelName.trim())) {
      alert('این مدل از قبل در سیستم موجود است.');
      return;
    }
    onUpdateModelsList([...modelsList, newModelName.trim()]);
    setModelMessage({ type: 'success', text: `دستگاه مدل "${newModelName.trim()}" به لیست مدل‌ها افزوده شد.` });
    alert(`تیپ/مدل دستگاه جدید "${newModelName.trim()}" با موفقیت تعریف گردید.`);
    setNewModelName('');
  };

  const handleRemoveModel = (mod: string) => {
    triggerSafeConfirm(
      'حذف مدل دستگاه',
      `آیا از حذف مدل "${mod}" از اطلاعات پایه تکنسین‌ها و کاربران مأموریت مطمئن هستید؟`,
      () => {
        onUpdateModelsList(modelsList.filter(m => m !== mod));
        setModelMessage({ type: 'success', text: `مدل دستگاه "${mod}" ملغی شد.` });
        alert(`دستگاه مدل "${mod}" با موفقیت غیرفعال و از لیست سیستم کلان حذف گردید.`);
      }
    );
  };

  const handleRenameBrand = (oldVal: string, newVal: string) => {
    if (!newVal.trim() || oldVal === newVal.trim()) {
      setEditingBrand(null);
      return;
    }
    if (brandsList.includes(newVal.trim())) {
      alert('این شرکت/برند از قبل در سیستم موجود است.');
      return;
    }
    const updated = brandsList.map(b => b === oldVal ? newVal.trim() : b);
    onUpdateBrandsList(updated);
    setBrandMessage({ type: 'success', text: `برند "${oldVal}" به "${newVal.trim()}" تغییر نام داد.` });
    alert(`برند انتخابی با موفقیت از عنوان قدیمی "${oldVal}" به نام نوین "${newVal.trim()}" ویرایش شد.`);
    setEditingBrand(null);
  };

  const handleRenameCategory = (oldVal: string, newVal: string) => {
    if (!newVal.trim() || oldVal === newVal.trim()) {
      setEditingCategory(null);
      return;
    }
    if (categoriesList.includes(newVal.trim())) {
      alert('این دسته‌بندی از قبل در سیستم موجود است.');
      return;
    }
    const updated = categoriesList.map(c => c === oldVal ? newVal.trim() : c);
    onUpdateCategoriesList(updated);
    setCategoryMessage({ type: 'success', text: `دسته‌بندی "${oldVal}" به "${newVal.trim()}" ویرایش شد.` });
    alert(`دسته‌بندی هدف با موفقیت از عنوان قدیمی "${oldVal}" به نام نوین "${newVal.trim()}" تجدید عنوان یافت.`);
    setEditingCategory(null);
  };

  const handleRenameModel = (oldVal: string, newVal: string) => {
    if (!newVal.trim() || oldVal === newVal.trim()) {
      setEditingModel(null);
      return;
    }
    if (modelsList.includes(newVal.trim())) {
      alert('این مدل از قبل در سیستم موجود است.');
      return;
    }
    const updated = modelsList.map(m => m === oldVal ? newVal.trim() : m);
    onUpdateModelsList(updated);
    setModelMessage({ type: 'success', text: `مدل "${oldVal}" به "${newVal.trim()}" بازنویسی شد.` });
    alert(`مدل انتخابی دستگاه با موفقیت از عنوان قبلی "${oldVal}" به نام جدید "${newVal.trim()}" ویراست شد.`);
    setEditingModel(null);
  };

  const handleRenameCity = (oldVal: string, newVal: string) => {
    if (!newVal.trim() || oldVal === newVal.trim()) {
      setEditingCity(null);
      return;
    }
    if (citiesList.some(c => c.name === newVal.trim())) {
      alert('این شهر از قبل در سیستم موجود است.');
      return;
    }
    const updated = citiesList.map(c => {
      if (c.name === oldVal) {
        return { ...c, name: newVal.trim() };
      }
      return c;
    });
    onUpdateCitiesList(updated);
    setCityMessage({ type: 'success', text: `نام شهر "${oldVal}" به "${newVal.trim()}" تغییر نام یافت.` });
    alert(`نام پایگاه شهری با موفقیت از عنوان قبلی "${oldVal}" به عنوان ترجیحی "${newVal.trim()}" تصحیح گردید.`);
    if (selectedConfigCity === oldVal) setSelectedConfigCity(newVal.trim());
    setEditingCity(null);
  };

  const handleRenameRegionField = (cityName: string, oldVal: string, newVal: string) => {
    if (!newVal.trim() || oldVal === newVal.trim()) {
      setEditingRegion(null);
      setEditingRegionCity(null);
      return;
    }
    const targetCity = citiesList.find(c => c.name === cityName);
    if (targetCity && targetCity.regions.includes(newVal.trim())) {
      alert('این محله از قبل در این شهر با همین نویسه موجود است.');
      return;
    }
    const updated = citiesList.map(c => {
      if (c.name === cityName) {
        return {
          ...c,
          regions: c.regions.map(r => r === oldVal ? newVal.trim() : r)
        };
      }
      return c;
    });
    onUpdateCitiesList(updated);
    setEditingRegion(null);
    setEditingRegionCity(null);
  };

  const handleAutofillInsertForm = (cat?: string, brand?: string, model?: string) => {
    if (cat) setDirCategory(cat);
    if (brand) setDirBrand(brand);
    if (model) setDirModel(model);
    
    const formElement = document.getElementById('direct-error-insert-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSaveQuickEditError = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingError) return;

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

    const newCodeClean = cleanStr(editingError.code);
    const newCatClean = cleanStr(editingError.category);
    const newBrandClean = cleanStr(editingError.brand);
    const newModelClean = cleanModel(editingError.model || 'عمومی');

    const isDuplicate = errorCodes.some(err => {
      if (err.id === editingError.id) return false; // skip self
      const codeClean = cleanStr(err.code);
      const catClean = cleanStr(err.category);
      const brandClean = cleanStr(err.brand);
      const modelClean = cleanModel(err.model || 'عمومی');
      return codeClean === newCodeClean && catClean === newCatClean && brandClean === newBrandClean && modelClean === newModelClean;
    });

    if (isDuplicate) {
      alert(`⚠️ خطای تکراری: کُد خطای تغییر یافته "${editingError.code}" برای دستگاه "${editingError.category}"، برند "${editingError.brand}" و مدل "${editingError.model || 'عمومی'}" قبلاً در ردیف دیگری از سامانه ثبت شده است. ذخیره‌سازی تایید نشد.`);
      return;
    }

    const harmonizedEdited = harmonizeErrorCode(editingError);
    const updated = errorCodes.map(err => err.id === editingError.id ? harmonizedEdited : err);
    onUpdateErrorCodesList(updated);

    // Auto-extract brand, category, and model to system configuration if they are updated
    let updatedCats = false, updatedBrands = false, updatedModels = false;
    const newCategories = [...categoriesList];
    const newBrands = [...brandsList];
    const newModels = [...modelsList];

    if (editingError.category && !newCategories.includes(editingError.category.trim())) {
      newCategories.push(editingError.category.trim());
      updatedCats = true;
    }
    if (editingError.brand && !newBrands.includes(editingError.brand.trim())) {
      newBrands.push(editingError.brand.trim());
      updatedBrands = true;
    }
    if (editingError.model && editingError.model !== 'عمومی' && editingError.model !== 'کل مدل‌ها') {
      const sm = editingError.model.trim();
      if (!newModels.includes(sm)) {
        newModels.push(sm);
        updatedModels = true;
      }
    }

    if (updatedCats) onUpdateCategoriesList(newCategories);
    if (updatedBrands) onUpdateBrandsList(newBrands);
    if (updatedModels) onUpdateModelsList(newModels);

    setEditingError(null);
    alert('تغییرات کد خطا با موفقیت بصورت آنی ذخیره شد.');
  };

  const handleAddDirectErrorCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dirIsCommon && !dirCode) {
      setDirectInsertStatus({
        type: 'warning',
        msg: 'لطفاً کُد خطا را وارد نمایید.'
      });
      return;
    }
    if (!dirCategory || !dirBrand || !dirModel) {
      setDirectInsertStatus({
        type: 'warning',
        msg: 'لطفاً فیلدهای الزامی نوع دستگاه، برند و مدل را تکمیل نمایید.'
      });
      return;
    }

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

    const newCodeClean = cleanStr(dirIsCommon ? 'مشکل شایع' : dirCode);
    const newCatClean = cleanStr(dirCategory);
    const newBrandClean = cleanStr(dirBrand);
    const newModelClean = cleanModel(dirModel || 'عمومی');

    if (dirIsCommon) {
      // 1. Common Problem Insertion
      const newProb: CommonProblem = {
        id: `prob_dir_${Date.now()}`,
        code: 'مشکل شایع',
        category: dirCategory,
        brand: dirBrand,
        model: newModelClean,
        title: dirTitle || `مشکل شایع ${dirCategory} ${dirBrand}`,
        description: dirReason || dirTitle || 'بررسی و رفع مشکل فنی',
        causes: dirReason ? [dirReason] : ['علل فیزیکی عمومی'],
        steps: dirSolution ? [dirSolution] : ['سرویس و راهکار تخصصی'],
        precautions: ['نکات ایمنی پایه لوازم خانگی رعایت گردد.'],
        hazardLevel: dirHazard,
        tags: ['مشکل شایع'],
        views: 0,
        solutions: dirSolution ? [dirSolution] : ['سرویس و راهکار تخصصی']
      };

      // Auto-extract and register category, brand, and model to system configuration
      let updatedCats = false, updatedBrands = false, updatedMod = false;
      const newCategories = [...categoriesList];
      const newBrands = [...brandsList];
      const newModels = [...modelsList];

      if (dirCategory.trim() && !newCategories.includes(dirCategory.trim())) {
        newCategories.push(dirCategory.trim());
        updatedCats = true;
      }

      if (dirBrand.trim() && !newBrands.includes(dirBrand.trim())) {
        newBrands.push(dirBrand.trim());
        updatedBrands = true;
      }

      if (dirModel.trim() && dirModel !== 'کل مدل‌ها') {
        const m = dirModel.trim();
        if (!newModels.includes(m)) {
          newModels.push(m);
          updatedMod = true;
        }
      }

      if (updatedCats) onUpdateCategoriesList(newCategories);
      if (updatedBrands) onUpdateBrandsList(newBrands);
      if (updatedMod) onUpdateModelsList(newModels);

      if (onUpdateCommonProblemsList) {
        onUpdateCommonProblemsList([newProb, ...commonProblems]);
      }

      setDirectInsertStatus({
        type: 'success',
        msg: `🎉 موفقیت‌آمیز: مشکل شایع با موفقیت در بخش فوت‌وفن و مشکلات شایع ثبت گردید!`,
        category: dirCategory,
        brand: dirBrand,
        model: dirModel || 'کل مدل‌ها'
      });

      alert(`🎉 موفقیت‌آمیز:\nمشکل شایع "${dirTitle || dirCategory}" مربوط به برند "${dirBrand}" با موفقیت ثبت و به بخش مشکلات شایع اضافه شد.`);

      setDirCode('');
      setDirTitle('');
      setDirModel('');
      setDirReason('');
      setDirSolution('');
      setDirVideoUrl('');
      setDirIsCommon(false);

      const element = document.getElementById('direct-error-insert-form');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // 2. Regular Error Code Insertion
    const isDuplicate = errorCodes.some(err => {
      const codeClean = cleanStr(err.code);
      const catClean = cleanStr(err.category);
      const brandClean = cleanStr(err.brand);
      const modelClean = cleanModel(err.model || 'عمومی');
      return codeClean === newCodeClean && catClean === newCatClean && brandClean === newBrandClean && modelClean === newModelClean;
    });

    if (isDuplicate) {
      setDirectInsertStatus({
        type: 'error',
        msg: `🚫 خطا: این کُد خطا برای مشخصات وارد شده تکراری است و هم‌اکنون در سیستم موجود است!`,
        code: dirCode,
        category: dirCategory,
        brand: dirBrand,
        model: dirModel || 'عمومی'
      });
      // Smooth scroll to form container so they see it
      const element = document.getElementById('direct-error-insert-form');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const newErr = harmonizeErrorCode({
      id: `err_dir_${Date.now()}`,
      code: dirCode,
      title: dirTitle || `بررسی خطای ${dirCode}`,
      category: dirCategory,
      brand: dirBrand,
      model: dirModel,
      description: dirReason || 'عدم ثبت علت بوجود آمدن خطا',
      causes: dirReason ? [dirReason] : ['عدم ثبت علت فیزیکی'],
      steps: dirSolution ? [dirSolution] : ['مراجعه به تکنسین مجاز سرویس'],
      precautions: ['نکات ایمنی پایه لوازم خانگی رعایت گردد.'],
      hazardLevel: dirHazard,
      isApproved: true,
      video_url: dirVideoUrl
    });
    
    // Auto-extract and register category, brand, and model to system configuration
    let updatedCats = false, updatedBrands = false, updatedMod = false;
    const newCategories = [...categoriesList];
    const newBrands = [...brandsList];
    const newModels = [...modelsList];

    if (dirCategory.trim() && !newCategories.includes(dirCategory.trim())) {
      newCategories.push(dirCategory.trim());
      updatedCats = true;
    }

    if (dirBrand.trim() && !newBrands.includes(dirBrand.trim())) {
      newBrands.push(dirBrand.trim());
      updatedBrands = true;
    }

    if (dirModel.trim() && dirModel !== 'کل مدل‌ها') {
      const m = dirModel.trim();
      if (!newModels.includes(m)) {
        newModels.push(m);
        updatedMod = true;
      }
    }

    if (updatedCats) onUpdateCategoriesList(newCategories);
    if (updatedBrands) onUpdateBrandsList(newBrands);
    if (updatedMod) onUpdateModelsList(newModels);

    onUpdateErrorCodesList([...errorCodes, newErr]);
    
    setDirectInsertStatus({
      type: 'success',
      msg: `🎉 موفقیت‌آمیز: کُد خطا با موفقیت مستقیماً ایجاد و ثبت نهایی شد!`,
      code: dirCode,
      category: dirCategory,
      brand: dirBrand,
      model: dirModel || 'کل مدل‌ها'
    });

    alert(`کد خطا "${dirCode}" مربوط به برند "${dirBrand}" با موفقیت ایجاد و ذخیره شد.`);

    setDirCode('');
    setDirTitle('');
    setDirModel('');
    setDirReason('');
    setDirSolution('');
    setDirVideoUrl('');

    const element = document.getElementById('direct-error-insert-form');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const processBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedImportData.trim()) {
      setImportStatus({ type: 'error', msg: 'لطفاً ابتدا متنی درج یا فایلی بارگذاری کنید.' });
      return;
    }

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

    const checkIsCommonProblem = (item: {
      code?: string;
      isCommonProblem?: boolean;
      tags?: string[];
    }) => {
      if (item.isCommonProblem) return true;
      const code = cleanStr(item.code || '');
      if (!code || code === 'مشکل شایع' || code === 'مشکلات شایع' || code === 'عیب شایع' || code === 'diy' || code === 'common_problem') {
        return true;
      }
      const tagList = item.tags || [];
      const hasCommonTag = tagList.some(t => {
        const ct = cleanStr(t);
        return ct.includes('شایع') || ct.includes('common_problem') || ct.includes('مشکل شایع') || ct.includes('diy');
      });
      return hasCommonTag;
    };

    const KEY_MAPS = {
      code: ['error_code', 'code', 'aror', 'ارور', 'کد', 'کد خطا', 'کد_خطا', 'کدخطا', 'error', 'err', 'e'],
      title: ['title', 'error_title', 'عنوان', 'شرح', 'نام خطا', 'نام_خطا', 'نام', 'عنوان_خطا', 'عنوان خطا'],
      category: ['category', 'device_type', 'نوع دستگاه', 'دستگاه', 'نوع_دستگاه', 'دسته‌بندی', 'دسته‌بندي', 'دسته', 'device', 'type'],
      brand: ['brand', 'برند', 'سازنده'],
      model: ['model', 'مدل', 'مدل‌ها', 'مدلها', 'مدل ها'],
      description: ['description', 'details', 'توضیحات', 'توضیح', 'شرح_جزئیات', 'شرح جزئیات', 'شرح'],
      causes: ['causes', 'cause', 'دلایل', 'علت', 'علت_خطا', 'علت ها', 'علتها', 'علت خطای ثبتی'],
      steps: ['steps', 'solutions', 'solution', 'راهکارها', 'راه حل', 'روش_حل', 'روش حل', 'اقدامات'],
      precautions: ['precautions', 'safety', 'اقدامات_ایمنی', 'نکات_ایمنی', 'نکات ایمنی', 'ایمنی'],
      hazardLevel: ['hazardlevel', 'hazard_level', 'hazard', 'سطح_خطر', 'سطح خطر', 'خطر', 'ریسک', 'درجه خطر', 'درجه_خطر', 'درجه‌خطر', 'درجه‌خطرناکی']
    };

    const getFieldWithFallback = (obj: any, keys: string[], defaultVal = '') => {
      for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null) return obj[k];
        const cleanK = k.toLowerCase().replace(/_/g, '').replace(/\s+/g, '');
        for (const actualK of Object.keys(obj)) {
          const cleanActualK = actualK.toLowerCase().replace(/_/g, '').replace(/\s+/g, '');
          if (cleanK === cleanActualK) {
            return obj[actualK];
          }
        }
      }
      return defaultVal;
    };

    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if ((char === ',' || char === ';' || char === '\t') && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    try {
      const text = pastedImportData.trim();
      let importedCount = 0;
      let correctionsMade: string[] = [];

      if (text.startsWith('[') || text.startsWith('{')) {
        const parsed = JSON.parse(text);
        const array = Array.isArray(parsed) ? parsed : [parsed];

        if (importType === 'errors') {
          const isProbablyCities = array.some(item => (item.regions && Array.isArray(item.regions)) || (item.name && !item.code && !item.error_code && !item.error_title));
          if (isProbablyCities) {
            setImportStatus({
              type: 'error',
              msg: 'درخواست به دلیل ناسازگاری ساختار رد شد: این فایل حاوی اطلاعات موقعیت و شهرها است و به دلیل عدم همخوانی با طرح دیتابیس کدهای خطا، امکان ثبت آن در بخش خطاهای تعمیرگاهی وجود ندارد.'
            });
            return;
          }

          const newErrors = [...errorCodes];
          const newProblems = [...commonProblems];

          array.forEach((item, index) => {
            const finalCode = getFieldWithFallback(item, KEY_MAPS.code);
            const finalTitle = getFieldWithFallback(item, KEY_MAPS.title) || `کد خطا ${finalCode}`;
            const finalCategory = getFieldWithFallback(item, KEY_MAPS.category);
            const finalBrand = getFieldWithFallback(item, KEY_MAPS.brand);
            const finalModel = getFieldWithFallback(item, KEY_MAPS.model) || 'عمومی';
            const finalDesc = getFieldWithFallback(item, KEY_MAPS.description) || finalTitle || 'ثبت شده از طریق واردات انبوه';

            const isItemCommon = checkIsCommonProblem({
              code: finalCode ? String(finalCode) : '',
              isCommonProblem: !!item.isCommonProblem,
              tags: Array.isArray(item.tags) ? item.tags.map(String) : (item.tag ? [String(item.tag)] : [])
            });

            if (isItemCommon) {
              if (!finalCategory || !finalBrand) {
                const missingFields = [];
                if (!finalCategory) missingFields.push('دسته‌بندی (category / device_type / نوع دستگاه)');
                if (!finalBrand) missingFields.push('برند (brand / برند)');
                
                correctionsMade.push(`ردیف ${index + 1}: فاقد فیلدهای الزامی برای مشکل شایع: ${missingFields.join('، ')} (رد شد)`);
                return;
              }
            } else {
              if (!finalCode || !finalCategory || !finalBrand) {
                const missingFields = [];
                if (!finalCode) missingFields.push('کد خطا (code / error_code / ارور)');
                if (!finalCategory) missingFields.push('دسته‌بندی (category / device_type / نوع دستگاه)');
                if (!finalBrand) missingFields.push('برند (brand / برند)');
                
                correctionsMade.push(`ردیف ${index + 1}: فاقد فیلدهای الزامی: ${missingFields.join('، ')} (رد شد)`);
                return;
              }
            }

            const tCodeClean = cleanStr(String(finalCode));
            const tCatClean = cleanStr(String(finalCategory));
            const tBrandClean = cleanStr(String(finalBrand));
            const tModelClean = cleanModel(String(finalModel));

            const rawCauses = getFieldWithFallback(item, KEY_MAPS.causes);
            const finalCauses = Array.isArray(rawCauses) 
              ? rawCauses.map(String) 
              : rawCauses 
                ? String(rawCauses).split(/[،,;\n|]/).map(s => s.trim()).filter(Boolean) 
                : [finalDesc];

            const rawSteps = getFieldWithFallback(item, KEY_MAPS.steps);
            const finalSteps = Array.isArray(rawSteps)
              ? rawSteps.map(String)
              : rawSteps
                ? String(rawSteps).split(/[،,;\n|]/).map(s => s.trim()).filter(Boolean)
                : ['مراجعه به سرویس‌کار مجاز.'];

            const rawSafety = getFieldWithFallback(item, KEY_MAPS.precautions);
            const finalPrecautions = Array.isArray(rawSafety)
              ? rawSafety.map(String)
              : rawSafety
                ? String(rawSafety).split(/[،,;\n|]/).map(s => s.trim()).filter(Boolean)
                : ['نکات ایمنی رعایت گردد.'];

            const rawHazard = cleanStr(String(getFieldWithFallback(item, KEY_MAPS.hazardLevel) || 'low'));
            const finalHazard = (['low', 'medium', 'high', 'critical'].includes(rawHazard))
              ? rawHazard as 'low' | 'medium' | 'high' | 'critical'
              : 'low';

            if (isItemCommon) {
              const isDuplicateProb = newProblems.some(p => {
                return cleanStr(p.category) === tCatClean && cleanStr(p.brand) === tBrandClean && cleanModel(p.model || 'عمومی') === tModelClean && cleanStr(p.title) === cleanStr(String(finalTitle));
              });

              if (isDuplicateProb) {
                correctionsMade.push(`ردیف ${index + 1}: مشکل شایع با عنوان "${finalTitle}" تکراری تشخیص داده شد و رد گردید.`);
                return;
              }

              newProblems.push({
                id: item.id || `prob_import_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                code: 'مشکل شایع',
                category: String(finalCategory),
                brand: String(finalBrand),
                model: tModelClean,
                title: String(finalTitle),
                description: String(finalDesc),
                causes: finalCauses,
                steps: finalSteps,
                precautions: finalPrecautions,
                hazardLevel: finalHazard,
                tags: Array.isArray(item.tags) ? item.tags.map(String) : ['مشکل شایع'],
                views: Number(item.views || 0),
                solutions: finalSteps
              });

              correctionsMade.push(`ردیف ${index + 1}: به علت ساختار بدون کُد خطا، به عنوان «مشکل شایع» ثبت نهایی شد.`);
            } else {
              const isDuplicateImport = newErrors.some(err => {
                const codeClean = cleanStr(err.code);
                const catClean = cleanStr(err.category);
                const brandClean = cleanStr(err.brand);
                const modelClean = cleanModel(err.model || 'عمومی');
                return codeClean === tCodeClean && catClean === tCatClean && brandClean === tBrandClean && modelClean === tModelClean;
              });

              if (isDuplicateImport) {
                correctionsMade.push(`ردیف ${index + 1}: کُد خطای "${finalCode}" به صورت تکراری تشخیص داده شد و رد گردید.`);
                return;
              }

              newErrors.push(harmonizeErrorCode({
                id: item.id || `err_import_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                code: String(finalCode),
                title: String(finalTitle),
                category: String(finalCategory),
                brand: String(finalBrand),
                model: tModelClean,
                description: String(finalDesc),
                causes: finalCauses,
                steps: finalSteps,
                precautions: finalPrecautions,
                hazardLevel: finalHazard,
                toolsNeeded: Array.isArray(item.toolsNeeded) ? item.toolsNeeded.map(String) : [],
                relatedParts: Array.isArray(item.relatedParts) ? item.relatedParts.map(String) : [],
                views: Number(item.views || 0),
                isApproved: true
              }));
            }

            importedCount++;
          });

          if (importedCount > 0) {
            onUpdateErrorCodesList(newErrors);
            if (onUpdateCommonProblemsList) {
              onUpdateCommonProblemsList(newProblems);
            }

            // Cascade newly imported categories/brands/models
            const newCategories = [...categoriesList];
            const newBrands = [...brandsList];
            const newModels = [...modelsList];
            let updatedCats = false, updatedBrands = false, updatedModels = false;

            const checkAndAddMetaData = (cat: string, bnd: string, mdl: string) => {
              const c = cat ? cat.trim() : '';
              const b = bnd ? bnd.trim() : '';
              const m = mdl ? mdl.trim() : '';
              if (c && !newCategories.includes(c)) {
                newCategories.push(c);
                updatedCats = true;
              }
              if (b && !newBrands.includes(b)) {
                newBrands.push(b);
                updatedBrands = true;
              }
              if (m && m !== 'عمومی' && m !== 'کل مدل‌ها' && !newModels.includes(m)) {
                newModels.push(m);
                updatedModels = true;
              }
            };

            const importedErrors = newErrors.slice(errorCodes.length);
            importedErrors.forEach(err => checkAndAddMetaData(err.category, err.brand, err.model || 'عمومی'));

            const importedProblems = newProblems.slice(commonProblems.length);
            importedProblems.forEach(prob => checkAndAddMetaData(prob.category, prob.brand, prob.model || 'عمومی'));

            if (updatedCats) onUpdateCategoriesList(newCategories);
            if (updatedBrands) onUpdateBrandsList(newBrands);
            if (updatedModels) onUpdateModelsList(newModels);

            let summaryMsg = `رکوردهای کدهای خطا و مشکلات شایع (${importedCount} مورد) با موفقیت در دیتابیس ثبت گردید.`;
            if (correctionsMade.length > 0) {
              summaryMsg += `\n\nگزارش ممیزی خودکار:\n` + correctionsMade.slice(0, 10).join('\n') + (correctionsMade.length > 10 ? '\n...' : '');
            }
            setImportStatus({ type: 'success', msg: summaryMsg });
          } else {
            setImportStatus({
              type: 'error',
              msg: 'هیچ رکورد معتبری برای درون‌ریزی یافت نشد. فیلدهای الزامی (کد، عنوان، برند، دسته‌بندی) ناقص هستند.'
            });
          }
        } else if (importType === 'categories') {
          const names = array.map(item => typeof item === 'object' ? item.name || item.title || item.category : String(item)).filter(Boolean);
          const uniq = Array.from(new Set(names));
          importedCount = uniq.length;
          onUpdateCategoriesList(uniq);
        } else if (importType === 'brands') {
          const names = array.map(item => typeof item === 'object' ? item.name || item.title || item.brand : String(item)).filter(Boolean);
          const uniq = Array.from(new Set(names));
          importedCount = uniq.length;
          onUpdateBrandsList(uniq);
        } else if (importType === 'cities') {
          const newCities: { name: string; regions: string[] }[] = [];
          array.forEach(item => {
            if (typeof item === 'object' && item.name) {
              const existing = newCities.find(c => c.name.toLowerCase() === item.name.toLowerCase());
              const regList = Array.isArray(item.regions) ? item.regions : [];
              if (existing) {
                existing.regions = Array.from(new Set([...existing.regions, ...regList]));
              } else {
                newCities.push({ name: item.name, regions: regList });
              }
              importedCount++;
            } else if (typeof item === 'string') {
              if (!newCities.some(c => c.name.toLowerCase() === item.toLowerCase())) {
                newCities.push({ name: item, regions: [] });
                importedCount++;
              }
            }
          });
          onUpdateCitiesList(newCities);
        }
      } else {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        
        if (importType === 'errors') {
          const firstCols = parseCSVLine(lines[0]);
          
          const isHeader = firstCols.some(col => {
            const norm = cleanStr(col).replace(/_/g, '').replace(/\s+/g, '');
            return [
              'code', 'errorcode', 'aror', 'ارور', 'کد', 'کدخطا', 'e', 'error', 'err',
              'title', 'errortitle', 'عنوان', 'شرح', 'نامخطا',
              'category', 'devicetype', 'نوعدستگاه', 'دستگاه', 'دستهبندی', 'دسته',
              'brand', 'برند', 'سازنده', 'model', 'مدل', 'مدلها'
            ].includes(norm);
          });

          let headers: string[] = [];
          let startIdx = 0;
          if (isHeader) {
            headers = firstCols;
            startIdx = 1;
          } else {
            headers = ['code', 'category', 'brand', 'model', 'title', 'description', 'causes', 'steps', 'precautions', 'hazardLevel'];
            startIdx = 0;
          }

          const newErrors = [...errorCodes];
          const newProblems = [...commonProblems];

          for (let i = startIdx; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

            const rowObj: any = {};
            headers.forEach((h, index) => {
              rowObj[h] = cols[index] || '';
            });

            if (!isHeader) {
              rowObj['code'] = cols[0] || '';
              rowObj['category'] = cols[1] || '';
              rowObj['brand'] = cols[2] || '';
              rowObj['model'] = cols[3] || '';
              rowObj['title'] = cols[4] || '';
              rowObj['description'] = cols[5] || '';
              rowObj['causes'] = cols[6] || '';
              rowObj['steps'] = cols[7] || '';
              rowObj['precautions'] = cols[8] || '';
              rowObj['hazardLevel'] = cols[9] || 'medium';
            }

            const finalCode = getFieldWithFallback(rowObj, KEY_MAPS.code);
            const finalTitle = getFieldWithFallback(rowObj, KEY_MAPS.title) || `شرح کد خطای ${finalCode}`;
            const finalCategory = getFieldWithFallback(rowObj, KEY_MAPS.category);
            const finalBrand = getFieldWithFallback(rowObj, KEY_MAPS.brand);
            const finalModel = getFieldWithFallback(rowObj, KEY_MAPS.model) || 'عمومی';
            const finalDesc = getFieldWithFallback(rowObj, KEY_MAPS.description) || finalTitle || 'ثبت شده از طریق واردات انبوه';

            const isItemCommon = checkIsCommonProblem({
              code: finalCode ? String(finalCode) : '',
              isCommonProblem: false, // Not explicitly flaggable in plain CSV unless via tag or code
              tags: []
            });

            if (isItemCommon) {
              if (!finalCategory || !finalBrand) {
                correctionsMade.push(`سطر ${i + 1}: فاقد فیلدهای الزامی دسته‌بندی یا برند برای مشکل شایع (رد شد)`);
                continue;
              }
            } else {
              if (!finalCode || !finalCategory || !finalBrand) {
                correctionsMade.push(`سطر ${i + 1}: فاقد فیلدهای الزامی کد خطا، دسته‌بندی یا برند (رد شد)`);
                continue;
              }
            }

            const tCodeClean = cleanStr(String(finalCode));
            const tCatClean = cleanStr(String(finalCategory));
            const tBrandClean = cleanStr(String(finalBrand));
            const tModelClean = cleanModel(String(finalModel));

            const rawCauses = getFieldWithFallback(rowObj, KEY_MAPS.causes);
            const finalCauses = Array.isArray(rawCauses)
               ? rawCauses.map(String)
               : rawCauses
                 ? String(rawCauses).split(/[،,;\n|]/).map(s => s.trim()).filter(Boolean)
                 : [String(finalDesc)];

            const rawSteps = getFieldWithFallback(rowObj, KEY_MAPS.steps);
            const finalSteps = Array.isArray(rawSteps)
               ? rawSteps.map(String)
               : rawSteps
                 ? String(rawSteps).split(/[،,;\n|]/).map(s => s.trim()).filter(Boolean)
                 : ['مراجعه به سرویس‌کار مجاز.'];

            const rawSafety = getFieldWithFallback(rowObj, KEY_MAPS.precautions);
            const finalPrecautions = Array.isArray(rawSafety)
               ? rawSafety.map(String)
               : rawSafety
                 ? String(rawSafety).split(/[،,;\n|]/).map(s => s.trim()).filter(Boolean)
                 : ['نکات ایمنی رعایت گردد.'];

            const rawHazard = cleanStr(String(getFieldWithFallback(rowObj, KEY_MAPS.hazardLevel) || 'low'));
            const finalHazard = (['low', 'medium', 'high', 'critical'].includes(rawHazard))
              ? rawHazard as 'low' | 'medium' | 'high' | 'critical'
              : 'low';

            if (isItemCommon) {
              const isDuplicateProb = newProblems.some(p => {
                return cleanStr(p.category) === tCatClean && cleanStr(p.brand) === tBrandClean && cleanModel(p.model || 'عمومی') === tModelClean && cleanStr(p.title) === cleanStr(String(finalTitle));
              });

              if (isDuplicateProb) {
                correctionsMade.push(`سطر ${i + 1}: مشکل شایع تکراری رد شد.`);
                continue;
              }

              newProblems.push({
                id: `prob_import_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                code: 'مشکل شایع',
                category: String(finalCategory),
                brand: String(finalBrand),
                model: tModelClean,
                title: String(finalTitle),
                description: String(finalDesc),
                causes: finalCauses.length > 0 ? finalCauses : [String(finalDesc)],
                steps: finalSteps.length > 0 ? finalSteps : ['مراجعه به سرویس‌کار مجاز.'],
                precautions: finalPrecautions.length > 0 ? finalPrecautions : ['نکات ایمنی رعایت گردد.'],
                hazardLevel: finalHazard,
                tags: ['مشکل شایع'],
                views: 0,
                solutions: finalSteps.length > 0 ? finalSteps : ['مراجعه به سرویس‌کار مجاز.']
              });

              correctionsMade.push(`سطر ${i + 1}: به دلیل ساختار بدون کد خطا به عنوان «مشکل شایع» درون‌ریزی شد.`);
            } else {
              const isDuplicateImport = newErrors.some(err => {
                const codeClean = cleanStr(err.code);
                const catClean = cleanStr(err.category);
                const brandClean = cleanStr(err.brand);
                const modelClean = cleanModel(err.model || 'عمومی');
                return codeClean === tCodeClean && catClean === tCatClean && brandClean === tBrandClean && modelClean === tModelClean;
              });

              if (isDuplicateImport) {
                correctionsMade.push(`سطر ${i + 1}: کد خطای "${finalCode}" برای ${finalCategory} ${finalBrand} (${tModelClean}) تکراری تشخیص داده شد و رد گردید.`);
                continue;
              }

              newErrors.push({
                id: `err_import_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                code: String(finalCode),
                title: String(finalTitle),
                category: String(finalCategory),
                brand: String(finalBrand),
                model: tModelClean,
                description: String(finalDesc),
                causes: finalCauses.length > 0 ? finalCauses : [String(finalDesc)],
                steps: finalSteps.length > 0 ? finalSteps : ['مراجعه به سرویس‌کار مجاز.'],
                precautions: finalPrecautions.length > 0 ? finalPrecautions : ['نکات ایمنی رعایت گردد.'],
                hazardLevel: finalHazard,
                hazardDescription: finalHazard === 'low' ? 'خطر خاصی وجود ندارد.' : 'با احتیاط کامل کار کنید.',
                toolsNeeded: [],
                relatedParts: [],
                views: 0,
                isApproved: true
              });
            }

            importedCount++;
          }

          if (importedCount > 0) {
            onUpdateErrorCodesList(newErrors);
            if (onUpdateCommonProblemsList) {
              onUpdateCommonProblemsList(newProblems);
            }

            // Cascade newly imported lists - preserve existing configurations and append new ones as requested
            const newCategories = [...categoriesList];
            const newBrands = [...brandsList];
            const newModels = [...modelsList];
            let updatedCats = false, updatedBrands = false, updatedModels = false;

            const checkAndAddMetaData = (cat: string, bnd: string, mdl: string) => {
              const c = cat ? cat.trim() : '';
              const b = bnd ? bnd.trim() : '';
              const m = mdl ? mdl.trim() : '';
              if (c && !newCategories.includes(c)) {
                newCategories.push(c);
                updatedCats = true;
              }
              if (b && !newBrands.includes(b)) {
                newBrands.push(b);
                updatedBrands = true;
              }
              if (m && m !== 'عمومی' && m !== 'کل مدل‌ها' && !newModels.includes(m)) {
                newModels.push(m);
                updatedModels = true;
              }
            };

            const importedErrors = newErrors.slice(errorCodes.length);
            importedErrors.forEach(err => checkAndAddMetaData(err.category, err.brand, err.model || 'عمومی'));

            const importedProblems = newProblems.slice(commonProblems.length);
            importedProblems.forEach(prob => checkAndAddMetaData(prob.category, prob.brand, prob.model || 'عمومی'));

            if (updatedCats) onUpdateCategoriesList(newCategories);
            if (updatedBrands) onUpdateBrandsList(newBrands);
            if (updatedModels) onUpdateModelsList(newModels);

            let summaryMsg = `رکوردهای کدهای خطا و مشکلات شایع (${importedCount} مورد) با موفقیت در دیتابیس ثبت گردید.`;
            if (correctionsMade.length > 0) {
              summaryMsg += `\n\nگزارش ممیزی خودکار:\n` + correctionsMade.slice(0, 10).join('\n') + (correctionsMade.length > 10 ? '\n...' : '');
            }
            setImportStatus({ type: 'success', msg: summaryMsg });
          } else {
            throw new Error('فرمت ستون‌های فایل CSV نامعتبر است یا کدهای خطا همگی تکراری تشخیص داده شدند.');
          }
        } else if (importType === 'categories') {
          const names = lines.map(line => line.replace(/^["']|["']$/g, '').trim()).filter(Boolean);
          const uniq = Array.from(new Set(names));
          importedCount = uniq.length;
          onUpdateCategoriesList(uniq);
        } else if (importType === 'brands') {
          const names = lines.map(line => line.replace(/^["']|["']$/g, '').trim()).filter(Boolean);
          const uniq = Array.from(new Set(names));
          importedCount = uniq.length;
          onUpdateBrandsList(uniq);
        } else if (importType === 'cities') {
          const newCities: { name: string; regions: string[] }[] = [];
          lines.forEach(line => {
            const cols = line.split(/[,;]/).map(c => c.trim().replace(/^["']|["']$/g, ''));
            const cityName = cols[0];
            if (cityName) {
              const existing = newCities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
              const regList = cols.slice(1).filter(Boolean);
              if (existing) {
                existing.regions = Array.from(new Set([...existing.regions, ...regList]));
              } else {
                newCities.push({ name: cityName, regions: regList });
              }
              importedCount++;
            }
          });
          onUpdateCitiesList(newCities);
        }
      }

      setPastedImportData('');
    } catch (err: any) {
      setImportStatus({ type: 'error', msg: `خطا در پردازش اطلاعات: ${err.message}` });
    }
  };

  return (
    <div className="space-y-6">
      {/* Platform Title */}
      <div className="bg-slate-900 rounded-2xl p-5 sm:p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm sm:text-base font-bold">پنل مدیریت یکپارچه کدیار۲۴</h2>
          </div>
          <p className="text-[11px] text-slate-350">نظارت بر تخصیص هوشمند، مالیه کمیسیون‌ها، ممیزی کدهای خطا و اصالت قطعات انبار مرکزی</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <div className="bg-white/10 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-450 animate-ping"></span>
            <span>سرور مرکزی: ایمن و آنلاین ۲۴ساعته</span>
          </div>
          {onForceRefreshDatabase && (
            <button
              onClick={async () => {
                if (isDbRefreshing) return;
                setIsDbRefreshing(true);
                try {
                  await onForceRefreshDatabase();
                } catch (e) {}
                setTimeout(() => setIsDbRefreshing(false), 900);
              }}
              className="bg-slate-850 hover:bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-1.5 text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 duration-150"
              title="به‌روزرسانی کل پایگاه داده"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-400 ${isDbRefreshing ? 'animate-spin' : ''}`} />
              <span>{isDbRefreshing ? 'یافتن اطلاعات...' : 'بروزرسانی داده‌ها (Sync)'}</span>
            </button>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-4 py-1.5 text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-1.5 active:scale-95 duration-150"
              title="خروج ایمن از پنل مدیریت"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج از مدیریت</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4 mb-2">
        {[
          { id: 'metrics', label: 'داشبورد و آمار مالی', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'orders', label: `مدیریت تعمیرات (${orders.length})`, icon: <PenTool className="w-4 h-4" /> },
          { id: 'errors', label: `ممیزی کدهای خطا (${pendingErrors.length})`, icon: <FileCheck className="w-4 h-4" /> },
          { id: 'techs', label: `تایید هویت تکنسین‌ها (${technicians.length})`, icon: <Users className="w-4 h-4" /> },
          { id: 'stocks', label: `انبار و قیمت قطعات (${spareParts.length})`, icon: <Layers className="w-4 h-4" /> },
          { id: 'purchases', label: `سوابق خرید قطعات (${approvedPurchases.length})`, icon: <ShoppingBag className="w-4 h-4" /> },
          { id: 'users', label: `کاربران (${usersList.filter((u: any) => u.role !== 'technician').length})`, icon: <User className="w-4 h-4" /> },
          { id: 'subscriptions', label: `اشتراک‌ها (${subscriptionsList.length})`, icon: <FileText className="w-4 h-4" /> },
          { id: 'payments', label: `پرداخت‌ها (${paymentsList.length})`, icon: <DollarSign className="w-4 h-4" /> },
          { id: 'affiliate', label: `همکاری در فروش (${affiliateProducts.length})`, icon: <ShoppingBag className="w-4 h-4" /> },
          { id: 'featured_categories', label: 'دسته‌بندی‌های پیشنهادی و تکنسین برتر', icon: <Layers className="w-4 h-4" /> },
          { id: 'config', label: `اطلاعات پایه و پورتال (${(categoriesList?.length || 0) + (brandsList?.length || 0) + (modelsList?.length || 0) + (citiesList?.length || 0)})`, icon: <Settings className="w-4 h-4" /> },
          { id: 'messages', label: `پیام‌ها و نظرات (${userFeedbacks?.length || 0})`, icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'techdocs', label: 'مستندات فنی (TechDocs)', icon: <FileText className="w-4 h-4" /> },
          { id: 'activitylogs', label: 'لاگ فعالیت و امنیت (Audit)', icon: <Activity className="w-4 h-4" /> },
          { id: 'backups', label: 'پشتیبان‌گیری (Backups)', icon: <Database className="w-4 h-4" /> },
          { id: 'system_errors', label: 'جدول خطاهای سیستم (Telemetry)', icon: <AlertTriangle className="w-4 h-4" /> },
          { id: 'tickets', label: 'تیکت‌های پشتیبانی (Tickets)', icon: <MessageSquare className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            id={`admin-tab-${tab.id}`}
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all duration-150 cursor-pointer flex items-center gap-1.5 border whitespace-nowrap active:scale-[97%] select-none ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white text-slate-650 border-slate-200 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      {activeTab === 'metrics' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Card stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-220/60 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">مجموع درآمدهای کل</span>
                <span className="font-bold text-slate-800 text-lg font-mono">{(totalInvoiced).toLocaleString('fa-IR')}</span>
                <span className="text-[10px] text-slate-500 mr-1">تومان</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-220/60 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">سهم کمیسیون پلتفرم (۱۵٪)</span>
                <span className="font-bold text-blue-600 text-lg font-mono">{(platformEarning).toLocaleString('fa-IR')}</span>
                <span className="text-[10px] text-blue-500 mr-1">تومان</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-650 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-220/60 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">سفارشات تعمیر در جریان</span>
                <span className="font-bold text-slate-800 text-lg font-mono">{activeJobsCount}</span>
                <span className="text-[10.5px] text-slate-500 mr-1">مورد فعال</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-650 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-220/60 p-5 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold block">کدهای خطای تایید شده</span>
                <span className="font-bold text-slate-800 text-lg font-mono">{approvedErrors.length}</span>
                <span className="text-[10.5px] text-slate-500 mr-1">کد خطا علمی</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Quick instructions panel */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 text-right font-sans">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-xs">توزیع واقعی قطعات و خدمات بر اساس دسته‌بندی</h3>
                <span className="text-[10px] text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-md">
                  مجموع: {categoryDistribution.totalSum.toLocaleString('fa-IR')} مورد
                </span>
              </div>

              <div className="space-y-3 pt-1">
                {categoryDistribution.list.length > 0 ? (
                  categoryDistribution.list.slice(0, 6).map((item, idx) => {
                    const colors = [
                      'bg-blue-600',
                      'bg-emerald-600',
                      'bg-amber-500',
                      'bg-purple-600',
                      'bg-rose-500',
                      'bg-indigo-600'
                    ];
                    const barColor = colors[idx % colors.length];
                    return (
                      <div key={item.category} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-800 font-extrabold">
                            {item.category}
                            <span className="text-[10px] text-slate-500 font-normal mr-1.5">
                              ({item.orders.toLocaleString('fa-IR')} خدمت | {item.purchases.toLocaleString('fa-IR')} قطعه)
                            </span>
                          </span>
                          <span className="font-extrabold font-mono text-slate-900">{item.percentage.toLocaleString('fa-IR')}٪</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2.5 rounded-2xl overflow-hidden">
                          <div
                            className={`${barColor} h-full rounded-2xl transition-all duration-300`}
                            style={{ width: `${Math.max(item.percentage, 4)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4 font-bold">
                    هنوز داده‌ای برای این دسته‌بندی ثبت نشده است.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-205 rounded-2xl p-5 flex flex-col justify-between font-sans">
              <div className="space-y-2 text-xs">
                <span className="bg-slate-900 text-white rounded px-2 py-0.5 text-[9px] font-bold">راهنمای کسب درآمد پلتفرم</span>
                <p className="text-slate-700 leading-relaxed">
                  کمیسیون کدیار۲۴ به میزان ۱۵ درصد از فاکتورهای خدمات تکنسین‌ها به طور خودکار کسر می‌گردد. همچنین با فروش مجزای قطعات از انبار مرکزی، حاشیه سود ۳۰ درصدی کالا برای صندوق مدیر ثبت می‌شود.
                </p>
                <p className="text-slate-400 text-[10px]">سیستم با استفاده از کدهای رهگیری هوشمند، تراکنش‌های شتاب را با تسویه هفتگی پایا انجام می‌دهد.</p>
              </div>
              <div className="text-xs font-bold text-blue-600 mt-4">
                تراز کلی بهینه پلتفرم: مثبت و فاقد کسری بدهی
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-205 overflow-hidden animate-in fade-in duration-150">
          <div className="p-4 bg-slate-50 border-b border-slate-150 text-xs font-bold text-slate-700">
            لیست جامع تمامی تعمیرات ثبت‌شده
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 uppercase text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-4">کد سفارش</th>
                  <th className="p-4">مشخصات متقاضی</th>
                  <th className="p-4">نوع دستگاه / برند</th>
                  <th className="p-4">زمان مراجعه پیشنهادی</th>
                  <th className="p-4">تکنسین متصدی</th>
                  <th className="p-4">وضعیت فرآیند</th>
                  <th className="p-4">اقدام</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-105">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-mono font-bold text-slate-800">{ord.id}</td>
                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{ord.customerName}</div>
                      <div className="text-slate-400 text-[10px] font-mono mt-0.5">{ord.customerPhone} | {ord.region}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {ord.category} ({ord.brand})
                      </span>
                      {ord.errorCode && <span className="mr-1 inline-block text-rose-600 font-mono font-bold text-[10.5px]">خطای {ord.errorCode}</span>}
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{ord.date} ({ord.timeSlot})</td>
                    <td className="p-4">
                      {ord.technicianName ? (
                        <span className="text-slate-800 font-semibold text-xs">{ord.technicianName}</span>
                      ) : (
                        <span className="text-amber-600 font-bold text-[10px] animate-pulse">⏰ در انتظار پذیرش</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`text-[9.5px] font-bold px-2 py-0.5 rounded-sm ${
                        ord.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : ord.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-850'
                          : ord.status === 'repairing'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {ord.status === 'registered' && 'ثبت اولیه'}
                        {ord.status === 'waiting' && 'در انتظار تکنسین'}
                        {ord.status === 'accepted' && 'پذیرش شده'}
                        {ord.status === 'enroute' && 'در مسیر هماهنگی'}
                        {ord.status === 'repairing' && 'بررسی عیب یابی'}
                        {ord.status === 'needs_part' && 'در انتظار سفارش قطعه'}
                        {ord.status === 'completed' && 'انجام شد'}
                        {ord.status === 'cancelled' && 'لغو شد'}
                      </span>
                    </td>
                    <td className="p-4">
                      {ord.status !== 'completed' && ord.status !== 'cancelled' ? (
                        <button
                          id={`admin-cancel-${ord.id}`}
                          onClick={() => {
                            triggerSafeConfirm(
                              'لغو مأموریت فنی',
                              'آیا مطمئن هستید که می‌خواهید به عنوان ناظر کل این سفارش را لغو کنید؟ پیامک عذرخواهی برای مشتری ارسال خواهد شد.',
                              () => onAdminCancelOrder(ord.id)
                            );
                          }}
                          className="bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white px-2.5 py-1 rounded-lg text-[10.5px] font-bold border border-rose-200 transition-all cursor-pointer"
                        >
                          لغو سفارش
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[10px]">پایان یافته</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'errors' && (
        <div className="space-y-4 animate-in fade-in duration-150 text-right">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-xs text-blue-900 flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div>
              <strong>صف ممیزی کدهای خطا:</strong> کدهایی که توسط تکنسین‌های میدانی از سراسر ایران کشف و راهنمای تعمیر آن‌ها نوشته شده است در این صف منتظر تایید است. تایید شما این کدهای خطا را به لیست جستجو سراسری متصل می‌کند. کدهای خطای فعال یا منتشرشده قبلی نیز از بخش دوم همین صفحه قابل مشاهده و حذف درصورت لزوم هستند.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-205 overflow-hidden shadow-xs">
            <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-800">
                  ⚡ صف ممیزی کدهای خطا ({pendingErrors.length} مورد در انتظار)
                </span>
                {filteredPendingErrors.length !== pendingErrors.length && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                    نتیجه فیلتر: {filteredPendingErrors.length} مورد
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative flex-1 sm:w-64">
                  <input
                    type="text"
                    value={pendingCodesSearchVal}
                    onChange={(e) => setPendingCodesSearchVal(e.target.value)}
                    placeholder="جستجو بر اساس کد، برند، دستگاه یا تکنسین..."
                    className="w-full bg-white border border-slate-200 text-[10.5px] pr-8 pl-3 py-1.5 rounded-xl font-medium outline-none focus:border-blue-500 text-right"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {filteredPendingErrors.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      triggerSafeConfirm(
                        'تایید و انتشار دسته‌جمعی',
                        `آیا از تایید و انتشار همزمان تمام ${filteredPendingErrors.length} کد خطای نمایش‌داده‌شده اطمینان کامل دارید؟`,
                        () => {
                          if (onBulkApproveErrorCodes) {
                            onBulkApproveErrorCodes(filteredPendingErrors.map(err => err.id));
                          } else {
                            filteredPendingErrors.forEach(err => onApproveErrorCode(err.id));
                          }
                        }
                      );
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10.5px] px-3 py-1.5 rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>تایید دسته‌جمعی همه ({filteredPendingErrors.length})</span>
                  </button>
                )}
              </div>
            </div>

            {pendingErrors.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <AlertTriangle className="w-10 h-10 text-slate-200 mx-auto mb-2 stroke-[1.2]" />
                <p className="text-xs font-bold text-slate-600">هیچ کد خطای جدیدی منتظر ممیزی شما نیست.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">تکنسین‌ها می‌توانند از پنل خود کدهای عیب‌یابی جدیدی پیشنهاد دهند.</p>
              </div>
            ) : filteredPendingErrors.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <p className="text-xs font-bold text-slate-500">هیچ کد خطایی با عبارت «{pendingCodesSearchVal}» یافت نشد.</p>
                <button
                  onClick={() => setPendingCodesSearchVal('')}
                  className="text-[10px] text-blue-600 underline font-bold mt-1 cursor-pointer"
                >
                  پاکسازی فیلتر جستجو
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredPendingErrors.map((err) => (
                  <div key={err.id} className="p-3 sm:p-3.5 hover:bg-slate-50/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-right">
                    
                    {/* Details Column */}
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-blue-600 text-white font-mono font-black text-xs px-2 py-0.5 rounded-md shadow-2xs">
                          کد: {err.code}
                        </span>
                        <span className="bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          برند: {err.brand}
                        </span>
                        <span className="bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          دسته: {err.category}
                        </span>
                        {err.model && (
                          <span className="text-slate-500 text-[10px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                            مدل: {err.model}
                          </span>
                        )}
                        <span className="text-[9.5px] text-slate-400 mr-auto font-sans">
                          تکنسین: <strong className="text-slate-700">{err.updatedBy || 'مستعار'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-[13px]">{err.title}</h4>
                      </div>
                      
                      {err.description && (
                        <p className="text-slate-600 text-[11px] leading-snug line-clamp-1">{err.description}</p>
                      )}

                      {/* Collapsible Steps details */}
                      <details className="group/steps text-[10.5px]">
                        <summary className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer text-[10px] inline-flex items-center gap-1 select-none py-0.5">
                          <span>📖 مشاهده دستورالعمل رفع عیب گام‌به‌گام</span>
                          <span className="group-open/steps:rotate-180 transition-transform">▼</span>
                        </summary>
                        <div className="mt-2 border border-slate-200/80 bg-slate-50/80 rounded-xl p-3 text-[10.5px] text-slate-700 space-y-1.5 font-sans leading-relaxed">
                          {err.steps && err.steps[0] && (
                            <div><strong className="text-blue-900">گام اول:</strong> {err.steps[0]}</div>
                          )}
                          {err.steps && err.steps[1] && (
                            <div><strong className="text-blue-900">گام دوم:</strong> {err.steps[1]}</div>
                          )}
                          {err.precautions && err.precautions[0] && (
                            <div className="text-amber-800 bg-amber-50 p-1.5 rounded-lg border border-amber-100">
                              <strong>احتیاط‌های واجب:</strong> {err.precautions[0]}
                            </div>
                          )}
                        </div>
                      </details>
                    </div>

                    {/* Action Buttons Column */}
                    <div className="flex items-center gap-1.5 flex-wrap justify-end flex-shrink-0 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => setEditingError(err)}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10.5px] font-bold py-1 px-2.5 rounded-xl border border-blue-200 transition-all cursor-pointer flex items-center gap-1"
                      >
                        ✏️ اصلاح
                      </button>

                      <button
                        type="button"
                        id={`reject-err-${err.id}`}
                        onClick={() => {
                          triggerSafeConfirm(
                            'رد پیشنهاد عیب‌یابی',
                            `آیا از رد کردن پیشنهاد کد خطای "${err.code}" به عنوان مدیر سیستم اطمینان کامل دارید؟ این پیشنهاد کلاً حذف خواهد شد.`,
                            () => onRejectErrorCode(err.id)
                          );
                        }}
                        className="bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-700 text-[10.5px] font-bold py-1 px-2.5 rounded-xl border border-rose-200 transition-all cursor-pointer"
                      >
                        رد عیب‌یابی
                      </button>

                      <button
                        type="button"
                        id={`approve-err-${err.id}`}
                        onClick={() => onApproveErrorCode(err.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10.5px] font-extrabold py-1 px-3 rounded-xl shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تایید و انتشار</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 1.5) Direct Insert Error Code Form inside Errors Tab (Collapsible, closed by default) */}
          <div className="bg-white rounded-2xl border border-slate-205 shadow-sm overflow-hidden text-right">
            <details className="group" open={false}>
              <summary className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 font-bold text-xs text-slate-800 cursor-pointer selection:bg-transparent transition-all">
                <div className="flex items-center gap-2 justify-start">
                  <span className="text-base">➕</span>
                  <span className="font-extrabold text-slate-800">درج مستقیم کد خطای جدید سراسری (ثبت مستقیم در دیتابیس)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[8.5px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-extrabold font-mono">QUICK INSERT</span>
                  <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                </div>
              </summary>

              <div className="p-5 border-t border-slate-100 bg-slate-50/30 space-y-5 text-right">
                <p className="text-[10px] text-slate-450 leading-relaxed -mt-1">
                  از این بخش می‌توانید بدون نیاز به ارسال پیشنهاد تکنسین، مستقیماً کدهای خطای جدید را به بانک داده کدیار۲۴ اضافه کنید. همزمان با ثبت، نوع دستگاه، برند و مدل به لیست‌های سیستم افزوده می‌شوند.
                </p>

                {/* Dynamic Status Alert Banner */}
                {directInsertStatus && (
                  <div 
                    className={`p-4 rounded-xl text-xs font-bold leading-relaxed text-right border relative flex flex-col gap-2.5 transition-all shadow-xs ${
                      directInsertStatus.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' :
                      directInsertStatus.type === 'error' ? 'bg-rose-50 text-rose-900 border-rose-200' : 
                      'bg-amber-50 text-amber-900 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {directInsertStatus.type === 'success' ? '✓' : directInsertStatus.type === 'error' ? '🚫' : '⚠️'}
                        </span>
                        <span className="font-extrabold text-[12px]">{directInsertStatus.msg}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setDirectInsertStatus(null)}
                        className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-1 rounded-lg text-[10px] w-5 h-5 flex items-center justify-center border border-slate-200 shadow-2xs"
                      >
                        ✕
                      </button>
                    </div>

                    {directInsertStatus.code && (
                      <div className="bg-white/70 p-3 rounded-lg border border-slate-100 space-y-1.5 text-[10.5px]">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-700">
                          <div>
                            <span className="text-slate-400 font-bold">کد خطا:</span>{' '}
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-black">{directInsertStatus.code}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">دستگاه:</span>{' '}
                            <span className="text-slate-900 font-bold">{directInsertStatus.category}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">برند:</span>{' '}
                            <span className="text-slate-900 font-bold">{directInsertStatus.brand}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-bold">مدل:</span>{' '}
                            <span className="text-slate-900 font-bold">{directInsertStatus.model}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleAddDirectErrorCode} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Error Code */}
                    <div>
                      <label className="block text-slate-700 text-[10px] font-bold mb-1">کد خطا (مانند: E01, F1) *</label>
                      <input
                        required
                        type="text"
                        value={dirCode}
                        onChange={(e) => setDirCode(e.target.value)}
                        placeholder="مانند: E01, F3"
                        className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500 font-bold text-left font-mono text-slate-800"
                      />
                    </div>

                    {/* Error title */}
                    <div>
                      <label className="block text-slate-700 text-[10px] font-bold mb-1">عنوان فنی / توصیف عیب *</label>
                      <input
                        required
                        type="text"
                        value={dirTitle}
                        onChange={(e) => setDirTitle(e.target.value)}
                        placeholder="مانند: خطای عدم تخلیه آب"
                        className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500 font-bold text-slate-800"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 text-[10px] font-bold">نوع دستگاه *</label>
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryMode(categoryMode === 'select' ? 'custom' : 'select');
                            setDirCategory('');
                          }}
                          className="text-[9px] text-blue-600 hover:text-blue-800 font-bold"
                        >
                          {categoryMode === 'select' ? '➕ جدید' : '📋 لیست'}
                        </button>
                      </div>
                      {categoryMode === 'select' ? (
                        <select
                          value={dirCategory}
                          onChange={(e) => setDirCategory(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs p-2 rounded-xl outline-none font-bold text-slate-800 cursor-pointer text-right"
                          required
                        >
                          <option value="">-- انتخاب دستگاه --</option>
                          {categoriesList.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          required
                          type="text"
                          value={dirCategory}
                          onChange={(e) => setDirCategory(e.target.value)}
                          placeholder="مانند: ماشین لباسشویی"
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500 font-bold text-right text-slate-800"
                        />
                      )}
                    </div>

                    {/* Brand */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 text-[10px] font-bold">برند *</label>
                        <button
                          type="button"
                          onClick={() => {
                            setBrandMode(brandMode === 'select' ? 'custom' : 'select');
                            setDirBrand('');
                          }}
                          className="text-[9px] text-blue-600 hover:text-blue-800 font-bold"
                        >
                          {brandMode === 'select' ? '➕ جدید' : '📋 لیست'}
                        </button>
                      </div>
                      {brandMode === 'select' ? (
                        <select
                          value={dirBrand}
                          onChange={(e) => setDirBrand(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs p-2 rounded-xl outline-none font-bold text-slate-800 cursor-pointer text-right"
                          required
                        >
                          <option value="">-- انتخاب برند --</option>
                          {brandsList.map(br => (
                            <option key={br} value={br}>{br}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          required
                          type="text"
                          value={dirBrand}
                          onChange={(e) => setDirBrand(e.target.value)}
                          placeholder="مانند: اسنوا"
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500 font-bold text-right text-slate-800"
                        />
                      )}
                    </div>

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* Model */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-slate-700 text-[10px] font-bold">مدل‌های مشمول *</label>
                        <button
                          type="button"
                          onClick={() => {
                            setModelMode(modelMode === 'select' ? 'custom' : 'select');
                            setDirModel('');
                          }}
                          className="text-[9px] text-blue-600 hover:text-blue-800 font-bold"
                        >
                          {modelMode === 'select' ? '➕ جدید' : '📋 لیست'}
                        </button>
                      </div>
                      {modelMode === 'select' ? (
                        <select
                          value={dirModel}
                          onChange={(e) => setDirModel(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs p-2 rounded-xl outline-none font-bold text-slate-800 cursor-pointer text-right"
                          required
                        >
                          <option value="">-- انتخاب مدل --</option>
                          <option value="عمومی">عمومی (کل مدل‌ها)</option>
                          {modelsList.map(md => (
                            <option key={md} value={md}>{md}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          required
                          type="text"
                          value={dirModel}
                          onChange={(e) => setDirModel(e.target.value)}
                          placeholder="تایپ مدل جدید (مانند: عمومی، یا مدل خاص)"
                          className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500 font-bold text-right text-slate-800"
                        />
                      )}
                    </div>

                    {/* Hazard */}
                    <div>
                      <label className="block text-slate-700 text-[10px] font-bold mb-1">درجه خطر احتمالی عیب</label>
                      <select
                        value={dirHazard}
                        onChange={(e) => setDirHazard(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 text-xs p-2 rounded-xl outline-none font-bold text-slate-800 cursor-pointer text-right"
                      >
                        <option value="low">کم خطر - بی‌خطر</option>
                        <option value="medium">متوسط - نیاز به احتیاط</option>
                        <option value="high">خطر بالا - قطع گاز/برق</option>
                        <option value="critical">بحرانی - خطر انفجار/برق‌گرفتگی شدید</option>
                      </select>
                    </div>

                    {/* Causes */}
                    <div>
                      <label className="block text-slate-700 text-[10px] font-bold mb-1">علت بروز خرابی</label>
                      <input
                        type="text"
                        value={dirReason}
                        onChange={(e) => setDirReason(e.target.value)}
                        placeholder="مانند: انسداد فیلتر تخلیه یا سوختن مگنترون"
                        className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500 font-bold text-right text-slate-800"
                      />
                    </div>

                  </div>

                  <div>
                    <label className="block text-slate-700 text-[10px] font-bold mb-1">راهکار و راهنمای تفصیلی عیب‌یابی گام‌به‌گام *</label>
                    <textarea
                      required
                      rows={3}
                      value={dirSolution}
                      onChange={(e) => setDirSolution(e.target.value)}
                      placeholder="مراحل گام‌به‌گام رفع عیب را در اینجا بنویسید..."
                      className="w-full bg-white border border-slate-200 text-xs p-3 rounded-xl outline-none focus:border-blue-500 font-bold text-right text-slate-800 leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 text-[10px] font-bold mb-1">لینک ویدیو آموزشی (آپارات، یوتیوب یا لینک مستقیم - اختیاری)</label>
                    <input
                      type="text"
                      value={dirVideoUrl}
                      onChange={(e) => setDirVideoUrl(e.target.value)}
                      placeholder="مانند: https://aparat.com/v/XXXXX"
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-blue-500 font-mono text-left"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 px-6 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span>💾 ثبت کد خطا در دیتابیس سراسری</span>
                    </button>
                  </div>
                </form>
              </div>
            </details>
          </div>


          {/* 2) Approved/Active system errors */}
          <div className="bg-white rounded-2xl border border-slate-205 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700 block">🗂️ مدیریت پیشرفته کدهای خطای پلتفرم ({approvedErrors.length})</span>
                  <p className="text-[10px] text-slate-400">کدهای خطای تاییدشده را به صورت گروهی بر اساس دستگاه، برند و مدل یا تکی مدیریت، ویرایش و حذف کنید.</p>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
                  <button
                    type="button"
                    onClick={() => setErrGroupViewMode('grouped')}
                    className={`px-3 py-1.5 text-[10.5px] font-bold rounded-xl transition-all cursor-pointer ${
                      errGroupViewMode === 'grouped'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    🗂️ نمای دسته‌بندی شده (پیشرفته)
                  </button>
                  <button
                    type="button"
                    onClick={() => setErrGroupViewMode('simple')}
                    className={`px-3 py-1.5 text-[10.5px] font-bold rounded-xl transition-all cursor-pointer ${
                      errGroupViewMode === 'simple'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📋 نمای لیست ساده
                  </button>

                  {errGroupViewMode === 'grouped' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          const newMap: Record<string, boolean> = {};
                          groupedApprovedErrors.forEach(g => { newMap[g.key] = false; });
                          setExpandedErrGroups(newMap);
                        }}
                        className="px-2.5 py-1.5 text-[10px] font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                        title="بستن همه دسته‌ها"
                      >
                        📁 بستن همه
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const newMap: Record<string, boolean> = {};
                          groupedApprovedErrors.forEach(g => { newMap[g.key] = true; });
                          setExpandedErrGroups(newMap);
                        }}
                        className="px-2.5 py-1.5 text-[10px] font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
                        title="باز کردن همه دسته‌ها"
                      >
                        📂 باز کردن همه
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Advanced Filter Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-right">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="جستجو در متن کد، برند یا عنوان..."
                    id="admin-approved-codes-search"
                    className="w-full bg-white border border-slate-200 text-[10.5px] pr-8 pl-3 py-2 rounded-xl text-right font-medium outline-none focus:border-slate-400"
                    onChange={(e) => setApprovedCodesSearchVal(e.target.value)}
                    value={approvedCodesSearchVal}
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Category Filter */}
                <div>
                  <select
                    className="w-full bg-white border border-slate-200 text-[10.5px] px-3 py-2 rounded-xl text-right font-bold outline-none focus:border-slate-400"
                    value={errGroupCategoryFilter}
                    onChange={(e) => setErrGroupCategoryFilter(e.target.value)}
                  >
                    <option value="">📂 تمامی دسته‌بندی‌ها (دستگاه‌ها)</option>
                    {uniqueErrCategories.map(cat => (
                      <option key={cat} value={cat}>🔧 {cat}</option>
                    ))}
                  </select>
                </div>

                {/* Brand Filter */}
                <div>
                  <select
                    className="w-full bg-white border border-slate-200 text-[10.5px] px-3 py-2 rounded-xl text-right font-bold outline-none focus:border-slate-400"
                    value={errGroupBrandFilter}
                    onChange={(e) => setErrGroupBrandFilter(e.target.value)}
                  >
                    <option value="">🏷️ تمامی برندها</option>
                    {uniqueErrBrands.map(br => (
                      <option key={br} value={br}>⭐ {br}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* View Mode Logic */}
            {errGroupViewMode === 'grouped' ? (
              // Grouped Accordion View
              <div className="p-4 space-y-3 bg-slate-50/50 max-h-[600px] overflow-y-auto">
                {groupedApprovedErrors.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    هیچ گروه عیب‌یابی منطبق بر فیلتر یا جستجوی فعلی یافت نشد.
                  </div>
                ) : (
                  groupedApprovedErrors.map((group) => {
                    const isExpanded = expandedErrGroups[group.key] ?? false; // closed by default
                    return (
                      <div key={group.key} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        {/* Group Header */}
                        <div className="p-4 bg-slate-50/80 hover:bg-slate-100/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 transition-all select-none">
                          <div 
                            className="flex items-center gap-2 cursor-pointer flex-1 text-right"
                            onClick={() => setExpandedErrGroups(prev => ({ ...prev, [group.key]: !isExpanded }))}
                          >
                            <span className="text-slate-400 text-xs shrink-0 font-mono">
                              {isExpanded ? '▼' : '◀'}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="bg-blue-100 text-blue-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                                {group.category}
                              </span>
                              <span className="bg-amber-100 text-amber-800 text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                                برند: {group.brand}
                              </span>
                              <span className="text-slate-600 text-[11px] font-bold">
                                مدل: {group.model}
                              </span>
                            </div>
                            <span className="bg-slate-200 text-slate-700 text-[9px] px-2 py-0.5 rounded-md font-extrabold mr-auto">
                              {group.errors.length} کد خطا
                            </span>
                          </div>

                          {/* Group Bulk Actions */}
                          <div className="flex items-center gap-1.5 self-end sm:self-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setBulkEditingGroup(group);
                                setBulkEditNewCategory(group.category);
                                setBulkEditNewBrand(group.brand);
                                setBulkEditNewModel(group.model);
                              }}
                              className="bg-sky-50 hover:bg-sky-500 hover:text-white text-sky-700 text-[10px] font-extrabold py-1 px-2.5 rounded-lg border border-sky-200 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <span>✏️ ویرایش یکجای کل گروه</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                triggerSafeConfirm(
                                  'حذف گروهی کدهای خطا',
                                  `آیا از حذف دائم و کامل تمام ${group.errors.length} کد خطای موجود در گروه "${group.category} - ${group.brand} - ${group.model}" به صورت یکجا اطمینان دارید؟ استفاده از این کدهای خطا در پلتفرم به طور کامل متوقف خواهد شد.`,
                                  async () => {
                                    try {
                                      const idsToDel = group.errors.map(e => e.id);
                                      const token = localStorage.getItem('session_user_id') || '';
                                      const results = await Promise.all(
                                        idsToDel.map(id =>
                                          fetch(`/api/error-codes/${encodeURIComponent(id)}`, {
                                            method: 'DELETE',
                                            headers: { 'X-Session-Token': token }
                                          })
                                        )
                                      );
                                      const allOk = results.every(r => r.ok);
                                      if (allOk) {
                                        const updated = errorCodes.filter(e => !idsToDel.includes(e.id));
                                        onUpdateErrorCodesList(updated);
                                        alert(`تعداد ${group.errors.length} کد خطا با موفقیت حذف گردید.`);
                                      } else {
                                        alert('خطا در حذف برخی کدهای خطا از سرور');
                                      }
                                    } catch (err: any) {
                                      alert(err.message || 'خطا در ارتباط با سرور');
                                    }
                                  }
                                );
                              }}
                              className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 text-[10px] font-extrabold py-1 px-2.5 rounded-lg border border-rose-200 transition-all cursor-pointer flex items-center gap-1"
                            >
                              <span>🗑️ حذف یکجای گروه</span>
                            </button>
                          </div>
                        </div>

                        {/* Group Errors list */}
                        {isExpanded && (
                          <div className="divide-y divide-slate-100 p-2 bg-white">
                            {group.errors.map((err) => (
                              <div key={err.id} className="p-3 hover:bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="bg-slate-900 text-white font-mono font-bold text-[10px] px-1.5 py-0.2 rounded">
                                      {err.code}
                                    </span>
                                    <h5 className="font-bold text-slate-800 text-xs">{err.title}</h5>
                                  </div>
                                  <p className="text-slate-500 text-[10px] leading-relaxed line-clamp-1 max-w-xl">{err.description}</p>
                                </div>

                                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => setEditingError(err)}
                                    className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-[9px] font-bold py-1 px-2 rounded-lg border border-slate-200 transition-all cursor-pointer"
                                  >
                                    ویرایش مشخصات
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      triggerSafeConfirm(
                                        'حذف قطعی کد خطا',
                                        `آیا از حذف دائم کد خطای "${err.code}" متعلق به برند "${err.brand}" اطمینان دارید؟`,
                                        () => onRejectErrorCode(err.id)
                                      );
                                    }}
                                    className="bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 text-[9px] font-bold py-1 px-2 rounded-lg border border-rose-200 transition-all cursor-pointer"
                                  >
                                    حذف
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              // Simple Flat List View (Original layout)
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {filteredApprovedErrors.length === 0 ? (
                  <div className="py-8 text-center text-slate-450 text-xs">
                    هیچ کد خطایی با معیار جستجوی شما مطابقت ندارد.
                  </div>
                ) : (
                  filteredApprovedErrors.map((err) => (
                    <div key={err.id} className="p-4 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 text-right">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="bg-slate-900 text-white font-mono font-bold text-[10px] px-2 py-0.5 rounded-sm">
                            کد: {err.code}
                          </span>
                          <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-sm font-bold">
                            برند: {err.brand}
                          </span>
                          <span className="bg-slate-100 text-slate-700 text-[9px] px-2 py-0.5 rounded-sm font-bold">
                            دسته: {err.category}
                          </span>
                          {err.model && <span className="text-slate-450 text-[9px]">سازگاری: {err.model}</span>}
                        </div>
                        <h4 className="font-bold text-slate-800 text-xs">{err.title}</h4>
                        <p className="text-slate-500 text-[10.5px] line-clamp-2 max-w-2xl leading-normal">{err.description}</p>
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => setEditingError(err)}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold py-1 px-3 rounded-xl border border-emerald-200 transition-all cursor-pointer"
                        >
                          اصلاح مشخصات
                        </button>
                        <button
                          type="button"
                          id={`delete-approved-err-${err.id}`}
                          onClick={() => {
                            triggerSafeConfirm(
                              'حذف قطعی کد خطا',
                              `آیا از حذف دائم و کامل کد خطای "${err.code}" متعلق به برند "${err.brand}" اطمینان دارید؟ استفاده از این کد در عیب‌یابی‌ها مسدود خواهد شد.`,
                              () => onRejectErrorCode(err.id)
                            );
                          }}
                          className="bg-red-50 hover:bg-red-600 hover:text-white text-red-700 text-[10px] font-black py-1.5 px-3 rounded-xl border border-red-200 transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف دائم</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'techs' && (
        <div className="bg-white rounded-2xl border border-slate-205 overflow-hidden animate-in fade-in duration-150 text-right">
          <div className="p-4 bg-slate-50 border-b border-slate-150 text-xs font-bold text-slate-705 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>تایید هویت دو مرحله‌ای و راستی‌آزمایی صلاحیت تکنسین‌ها</span>
            <button
              onClick={() => setIsAddTechOpen(!isAddTechOpen)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2 text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all text-right"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddTechOpen ? 'بستن فرم درج' : 'افزودن تکنسین جدید'}</span>
            </button>
          </div>

          {isAddTechOpen && (
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <form onSubmit={handleAddNewTech} className="bg-slate-900 text-slate-100 rounded-2xl p-4 sm:p-5 border border-slate-850 shadow-lg text-right space-y-4">
                <div className="border-b border-slate-800 pb-2.5 mb-2 flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-blue-400 font-extrabold">NEW PERSONNEL REGISTRATION</span>
                  <h4 className="text-xs font-extrabold text-white">درج و ایجاد فوری پرونده تکنسین جدید</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-300 text-[10.5px] font-bold mb-1">نام و نام خانوادگی تکنسین *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: رضا کریمی"
                      value={newTechName}
                      onChange={(e) => setNewTechName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-[10.5px] font-bold mb-1">شماره تلفن همراه *</label>
                    <input
                      type="tel"
                      required
                      placeholder="مثال: 09121112233"
                      value={newTechPhone}
                      onChange={(e) => {
                        const sanitized = sanitizePhoneInput(e.target.value);
                        setNewTechPhone(sanitized);
                        if (sanitized) {
                          const check = validateIranianMobile(sanitized);
                          setNewTechPhoneError(check.isValid ? '' : (check.error || ''));
                        } else {
                          setNewTechPhoneError('وارد کردن شماره موبایل الزامی است.');
                        }
                      }}
                      maxLength={11}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white text-center font-mono focus:border-blue-500 outline-none"
                    />
                    {newTechPhoneError && (
                      <p className="text-red-400 text-[10px] mt-1 text-right font-medium">{newTechPhoneError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 text-[10.5px] font-bold mb-1">رمز عبور ورود به پنل</label>
                    <input
                      type="text"
                      placeholder="پیش‌فرض: 123456"
                      value={newTechPassword}
                      onChange={(e) => setNewTechPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white text-center font-mono focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-300 text-[10.5px] font-bold mb-1">محدوده اصلی فعالیت</label>
                    <input
                      type="text"
                      placeholder="مثال: تهران، منطقه ۲"
                      value={newTechLocation}
                      onChange={(e) => setNewTechLocation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-[10.5px] font-bold mb-1">آدرس عکس پرسنلی (آواتار)</label>
                    <input
                      type="url"
                      placeholder="مثال: https://images.unsplash.com..."
                      value={newTechAvatar}
                      onChange={(e) => {
                        setNewTechAvatar(e.target.value);
                        if (e.target.value.trim()) {
                          const check = validateUrl(e.target.value);
                          setNewTechAvatarError(check.isValid ? '' : (check.error || ''));
                        } else {
                          setNewTechAvatarError('');
                        }
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white text-left font-mono focus:border-blue-500 outline-none"
                    />
                    {newTechAvatarError && (
                      <p className="text-red-400 text-[10px] mt-1 text-right font-medium">{newTechAvatarError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-300 text-[10.5px] font-bold mb-1">تخصص‌های تعمیراتی (با کاما جدا کنید) *</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: پکیج، کولرگازی، یخچال"
                      onChange={(e) => {
                        const arr = e.target.value.split('،').map(x => x.trim()).filter(Boolean);
                        setNewTechSpecialties(arr);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-[10.5px] font-bold mb-1">بارگذاری عکس پرسنلی (آواتار)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleTechAvatarUpload(e, false)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white file:bg-slate-800 file:text-white file:border-none file:px-2 file:py-1 file:rounded file:cursor-pointer cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-[10.5px] font-bold mb-1">امتیاز پیش‌فرض (Rating - از ۵.۰)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      max="5.0"
                      value={newTechRating}
                      onChange={(e) => setNewTechRating(Number(e.target.value) || 5.0)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white text-center font-mono focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-[10.5px] font-bold mb-1">میزان رضایت پیش‌فرض (از ۱۰۰٪)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newTechSatisfactionRate}
                      onChange={(e) => setNewTechSatisfactionRate(Number(e.target.value) || 98)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white text-center font-mono focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-2.5 text-xs font-bold shadow-md cursor-pointer transition-all"
                  >
                    ثبت نهایی اطلاعات پرسنلی تکنسین
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5 bg-slate-50">
            {technicians.map((t) => (
              <div key={t.id} className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-5 flex flex-col gap-4 shadow-3xs transition-all duration-150 justify-between text-right">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <img
                      src={t.avatarUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2394a3b8'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>"}
                      alt={t.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-100 flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-800 text-sm sm:text-xs">{t.name}</span>
                        {t.isVerified ? (
                          <span className="bg-emerald-50 text-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">فعال و تایید صلاحیت</span>
                        ) : (
                          <span className="bg-red-50 text-red-800 text-[9px] font-bold px-1.5 py-0.5 rounded-sm">معلق / متوقف موقت</span>
                        )}
                      </div>
                      <p className="text-slate-400 text-[10px] mt-1">تخصص تعمیرات: {(Array.isArray(t.specialty) ? t.specialty : [t.specialty]).filter(Boolean).join('، ')}</p>
                      <div className="text-[9.5px] text-slate-500 mt-1">محدوده اصلی سرویس: {t.activeLocation} | شماره موبایل: {t.phone}</div>
                      
                      {/* Password and Credentials visibility for the administrator */}
                      <div className="mt-2 text-[10px] bg-slate-100 p-2 rounded-xl flex items-center justify-between text-slate-700 max-w-sm border border-slate-200">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Key className="w-3.5 h-3.5 text-blue-600" />
                          <span>موبایل: <span className="font-mono text-[11px] text-slate-800">{t.phone}</span></span>
                          <span className="mx-1 text-slate-300">|</span>
                          <span>رمز عبور ورود: <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-slate-300 text-blue-700">{t.password || '123456'}</span></span>
                        </div>
                      </div>

                      {t.documents && t.documents.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] text-slate-500 font-bold">مدارک ارسالی جهت احراز صلاحیت:</span>
                          {t.documents.filter((d) => typeof d === 'string' && !d.startsWith('data:') && !d.startsWith('http') && d.length < 300).map((doc, dIdx) => {
                            let docName = doc;
                            try {
                              if (doc.startsWith('{')) {
                                docName = JSON.parse(doc).name || 'مدرک بدون نام';
                              }
                            } catch (e) {}
                            return (
                              <button
                                key={dIdx}
                                type="button"
                                onClick={() => setPreviewDoc({ techName: t.name, docName: doc })}
                                className="bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 hover:border-blue-300 border border-slate-200 text-[10px] px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                                title="کلیک جهت مشاهده کامل سند فنی"
                              >
                                <FileText className="w-3.5 h-3.5 text-current" />
                                <span>{docName}</span>
                                <span className="text-[8px] opacity-75 mr-0.5">(مشاهده سند 🔎)</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {t.document_images && (Array.isArray(t.document_images) ? t.document_images.length > 0 : true) && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] text-slate-500 font-bold">تصاویر واقعی مدارک آپلود شده:</span>
                          {(Array.isArray(t.document_images) ? t.document_images : [t.document_images]).map((img: any, iIdx) => {
                            const src = typeof img === 'string' ? img : (img && (img.url || img.data || img.src)) || '';
                            if (!src || !(src.startsWith('data:') || src.startsWith('http') || src.startsWith('/'))) return null;
                            return (
                              <a key={iIdx} href={src} target="_blank" rel="noopener noreferrer" title="کلیک برای مشاهده تصویر واقعی مدرک">
                                <img src={src} alt="مدرک تکنسین" className="w-16 h-16 object-cover rounded-lg border border-slate-300 hover:scale-105 transition-transform cursor-pointer shadow-sm" />
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 self-end sm:self-start">
                    {/* Direct impersonation/login to technician panel for Manager */}
                    {onLoginAsTechnician && (
                      <button
                        onClick={() => onLoginAsTechnician(t.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1.5 px-3.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 w-full justify-center sm:w-auto"
                        title="ورود و کنترل کامل پنل این شخص"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ورود مستقیم به پنل متخصص</span>
                      </button>
                    )}

                    {t.isVerified ? (
                      <button
                        id={`suspend-tech-${t.id}`}
                        onClick={() => onVerifyTechnician(t.id, false)}
                        className="bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white text-xs font-bold py-1.5 px-3 rounded-xl border border-rose-200 transition-all cursor-pointer w-full text-center sm:w-auto"
                      >
                        تعلیق همکاری
                      </button>
                    ) : (
                      <button
                        id={`verify-tech-${t.id}`}
                        onClick={() => onVerifyTechnician(t.id, true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 px-4 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer w-full justify-center sm:w-auto"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>تایید و فعالسازی مجاز</span>
                      </button>
                    )}

                    {onUpdateTechniciansList && (
                      <button
                        onClick={() => {
                          setEditingTechId(t.id);
                          setEditTechName(t.name);
                          setEditTechPhone(t.phone);
                          setEditTechPassword(t.password || '123456');
                          setEditTechSpecialties(t.specialty || []);
                          setEditTechLocation(t.activeLocation || 'تهران');
                          setEditTechAvatar(t.avatarUrl || '');
                          setEditTechRating(t.rating || 5.0);
                          setEditTechSatisfactionRate(t.satisfactionRate || 98);
                        }}
                        className="bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 hover:border-amber-600 text-xs font-bold py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer w-full sm:w-auto mt-1 animate-pulse"
                        title="ویرایش اطلاعات پرسنلی و ارزیابی تکنسین"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>ویرایش پرونده و ارزیابی</span>
                      </button>
                    )}

                    {onUpdateTechniciansList && (
                      <button
                        onClick={() => {
                          triggerSafeConfirm(
                            'حذف دائم پرونده تکنسین',
                            `آیا از حذف کامل پرونده تکنسین "${t.name}" از شبکه سراسری کدیار۲۴ اطمینان قطعی دارید؟ مأموریت‌های همکار مسدود و اطلاعات وی پاک خواهد شد.`,
                            async () => {
                              try {
                                const token = localStorage.getItem('session_user_id') || '';
                                const res = await fetch(`/api/admin/technicians/${encodeURIComponent(t.id)}`, {
                                  method: 'DELETE',
                                  headers: { 'X-Session-Token': token }
                                });
                                const data = await res.json().catch(() => ({}));
                                if (res.ok && (data.status === 'ok' || data.success)) {
                                  const filtered = technicians.filter(tech => tech.id !== t.id);
                                  onUpdateTechniciansList(filtered);
                                  alert(`پرونده همکاری تکنسین "${t.name}" با موفقیت برای همیشه حذف و پرونده وی مسدود گردید.`);
                                } else {
                                  alert(data.error || data.message || 'خطا در حذف پرونده تکنسین از سرور');
                                }
                              } catch (err: any) {
                                alert(err.message || 'خطا در ارتباط با سرور');
                              }
                            }
                          );
                        }}
                        className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 hover:border-red-600 text-xs font-bold py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer w-full sm:w-auto mt-1"
                        title="حذف حساب کاربری تکنسین"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف کامل تکنسین</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Detailed Activities List - See all actions of this technician */}
                {(() => {
                  const techOrders = orders.filter(o => o.technicianId === t.id);
                  return (
                    <div className="bg-slate-50/70 hover:bg-slate-50 rounded-xl p-3 border border-slate-200/50">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center text-[10px] font-extrabold text-slate-700 mb-2 pb-1 border-b border-dashed border-slate-200 gap-1">
                        <span className="flex items-center gap-1 text-slate-850">
                          <Activity className="w-3.5 h-3.5 text-emerald-650" />
                          <span>سوابق و مأموریت‌های صحرایی تکنسین ({techOrders.length} مورد ارجاعی)</span>
                        </span>
                        <span className="text-blue-700">کل سهم انباشته مهارتی تکنسین: {t.balance.toLocaleString('fa-IR')} تومان</span>
                      </div>
                      
                      {techOrders.length === 0 ? (
                        <p className="text-[9.5px] text-slate-400 font-medium">تاکنون مأموریتی از جانب پلتفرم به این تکنسین واگذار نگردیده است.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                          {techOrders.map(order => (
                            <div key={order.id} className="flex justify-between items-start text-[9.5px] bg-white p-2 rounded-xl border border-slate-100 hover:border-slate-200 transition-all gap-2">
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-800">
                                  سفارش {order.customerName} <span className="font-mono text-slate-400 text-[8px]">({order.id})</span>
                                </div>
                                <div className="text-slate-500 font-semibold text-[8px]">
                                  برند: {order.brand} - کد عیب: {order.errorCode}
                                </div>
                                <div className="text-slate-400 text-[8px]">
                                  موقعیّت: {order.city}، {order.region}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                <span className="text-slate-500 font-bold font-mono text-[8.5px]">{order.date}</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold ${
                                  order.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' :
                                  order.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-150' :
                                  'bg-amber-50 text-amber-700 border border-amber-150'
                                }`}>
                                  {order.status === 'completed' ? 'تکمیل شده' :
                                   order.status === 'cancelled' ? 'لغو شده' :
                                   order.status === 'repairing' ? 'درحال تعمیر' :
                                   order.status === 'enroute' ? 'در مسیر' :
                                   order.status === 'accepted' ? 'پذیرفته شده' : 'معلق'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>

          {/* Edit Technician Profile Modal */}
          {editingTechId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100 text-right">
              <div className="bg-slate-900 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-2xl max-w-2xl w-full space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <button 
                    onClick={() => setEditingTechId(null)}
                    className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 px-3 py-1.5 rounded-xl cursor-pointer"
                  >
                    انصراف
                  </button>
                  <h4 className="text-xs font-extrabold text-white">ویرایش پرونده پرسنلی و ارزیابی تکنسین</h4>
                </div>

                <form onSubmit={handleEditTechSubmit} className="space-y-4 text-xs font-bold">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 text-[10.5px] font-bold mb-1">نام و نام خانوادگی تکنسین *</label>
                      <input
                        type="text"
                        required
                        value={editTechName}
                        onChange={(e) => setEditTechName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 text-[10.5px] font-bold mb-1">تلفن همراه تکنسین *</label>
                      <input
                        type="text"
                        required
                        value={editTechPhone}
                        onChange={(e) => setEditTechPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-left font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 text-[10.5px] font-bold mb-1">رمز عبور ورود به پنل تکنسین *</label>
                      <input
                        type="text"
                        required
                        value={editTechPassword}
                        onChange={(e) => setEditTechPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-left font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 text-[10.5px] font-bold mb-1">محدوده سرویس‌دهی تکنسین *</label>
                      <input
                        type="text"
                        required
                        value={editTechLocation}
                        onChange={(e) => setEditTechLocation(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 text-[10.5px] font-bold mb-1">تخصص‌های مهارتی (با کاما جدا کنید) *</label>
                      <input
                        type="text"
                        required
                        value={(Array.isArray(editTechSpecialties) ? editTechSpecialties : []).join('، ')}
                        onChange={(e) => {
                          const arr = e.target.value.split('،').map(x => x.trim()).filter(Boolean);
                          setEditTechSpecialties(arr);
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 text-[10.5px] font-bold mb-1">بارگذاری عکس جدید پرسنلی</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleTechAvatarUpload(e, true)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white file:bg-slate-850 file:text-white file:border-none file:px-2 file:py-1 file:rounded file:cursor-pointer cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1">
                      <label className="block text-slate-300 text-[10.5px] font-bold mb-1">امتیاز ارزیابی (Rating - از ۵.0)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1.0"
                        max="5.0"
                        value={editTechRating}
                        onChange={(e) => setEditTechRating(parseFloat(e.target.value) || 5.0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white text-center font-mono focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1">
                      <label className="block text-slate-300 text-[10.5px] font-bold mb-1">میزان رضایت ارزیابی (از ۱۰۰٪)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editTechSatisfactionRate}
                        onChange={(e) => setEditTechSatisfactionRate(parseInt(e.target.value) || 98)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white text-center font-mono focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-1 flex flex-col justify-end">
                      {editTechAvatar && (
                        <div className="flex items-center gap-2 bg-slate-950/40 p-1.5 rounded-xl border border-slate-800">
                          <img src={editTechAvatar} className="w-8 h-8 rounded-full object-cover" alt="پیش نمایش" />
                          <span className="text-[10px] text-slate-400">عکس لود شده</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-2.5 text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      ثبت و اعمال فوری تغییرات پرونده
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'stocks' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          
          {/* Header Action Control Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-right">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">مدیریت بورس قطعات و انبار کالا (فروشگاه همکاران)</h3>
              <p className="text-[11px] text-slate-400 mt-1">امکان تعریف انواع قطعه یدکی، موجودی‌گیری، ارزش‌گذاری مالی و حذف محصولات ثبت‌شده از پایگاه داده فدرال</p>
            </div>
            
            <button
              onClick={() => setIsAddPartOpen(!isAddPartOpen)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 transition-all self-stretch sm:self-auto justify-center"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddPartOpen ? 'انصراف' : 'افزودن محصول جدید'}</span>
            </button>
          </div>

          {/* Collapsible Add New Product Form */}
          {isAddPartOpen && (
            <div className="bg-slate-900 text-slate-100 rounded-3xl p-5 sm:p-6 border border-slate-800 shadow-xl space-y-4 text-right animate-in slide-in-from-top duration-200">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-blue-400 font-extrabold">NEW SPARE PART REGISTERED SYSTEM</span>
                <h4 className="text-xs font-extrabold text-white">افزودن قطعه جدید به انبار و بورس قطعات یدکی</h4>
              </div>

              <form onSubmit={handleAddNewPart} className="space-y-4 text-xs font-bold text-slate-350">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-350 text-[10px] font-extrabold mb-1">نام قطعه یدکی *</label>
                    <input
                      type="text"
                      required
                      value={newPartName}
                      onChange={(e) => setNewPartName(e.target.value)}
                      placeholder="مانند: پمپ هیدرو کلیک پکیج دیواری"
                      className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none text-right focus:border-blue-500 transition-all font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-350 text-[10px] font-extrabold mb-1">دسته‌بندی دستگاه مربوطه *</label>
                    <select
                      required
                      value={newPartCategory}
                      onChange={(e) => setNewPartCategory(e.target.value)}
                      className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl p-2.5 text-xs font-bold outline-none text-right cursor-pointer focus:border-blue-500 transition-all"
                    >
                      <option value="">⚙️ انتخاب دسته‌بندی</option>
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="سایر">سایر موارد</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-350 text-[10px] font-extrabold mb-1">آدرس آیکون یا تصویر کالا (اختیاری)</label>
                    <input
                      type="url"
                      value={newPartImage}
                      onChange={(e) => {
                        setNewPartImage(e.target.value);
                        if (e.target.value.trim()) {
                          const check = validateUrl(e.target.value);
                          setNewPartImageError(check.isValid ? '' : (check.error || ''));
                        } else {
                          setNewPartImageError('');
                        }
                      }}
                      placeholder="لینک تصویر مستقیم یا رها کنید تا خودکار قرار گیرد"
                      className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-3.5 py-2.5 text-xs font-semibold outline-none text-left focus:border-blue-500 transition-all font-mono"
                    />
                    {newPartImageError && (
                      <p className="text-red-400 text-[10px] mt-1 text-right font-medium">{newPartImageError}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-350 text-[10px] font-extrabold mb-1">قیمت کالا (تومان) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newPartPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setNewPartPrice('');
                          setNewPartPriceError('وارد کردن قیمت کالا الزامی است.');
                        } else {
                          const num = Number(val);
                          setNewPartPrice(num);
                          if (num < 0) {
                            setNewPartPriceError('قیمت کالا نمی‌تواند منفی باشد.');
                          } else {
                            setNewPartPriceError('');
                          }
                        }
                      }}
                      placeholder="مانند: ۵۵۰۰۰۰"
                      className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none text-center focus:border-blue-500 transition-all font-mono"
                    />
                    {newPartPriceError && (
                      <p className="text-red-400 text-[10px] mt-1 text-right font-medium">{newPartPriceError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-350 text-[10px] font-extrabold mb-1">موجودی اولیه در انبار *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newPartStock}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setNewPartStock('');
                          setNewPartStockError('وارد کردن موجودی اولیه الزامی است.');
                        } else {
                          const num = Number(val);
                          setNewPartStock(num);
                          if (num < 0) {
                            setNewPartStockError('موجودی انبار نمی‌تواند منفی باشد.');
                          } else {
                            setNewPartStockError('');
                          }
                        }
                      }}
                      placeholder="مثال: ۱۵"
                      className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none text-center focus:border-blue-500 transition-all font-mono"
                    />
                    {newPartStockError && (
                      <p className="text-red-400 text-[10px] mt-1 text-right font-medium">{newPartStockError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-350 text-[10px] font-extrabold mb-1">مدل دستگاه (اختیاری)</label>
                    <input
                      type="text"
                      value={newPartModel}
                      onChange={(e) => setNewPartModel(e.target.value)}
                      placeholder="مانند: ورونا پرلا ۲۴ یا همه مدل‌ها"
                      className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl px-3.5 py-2.5 text-xs font-bold outline-none text-right focus:border-blue-500 transition-all font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-350 text-[10px] font-extrabold mb-1">برندهای سازگار (چند گزینه‌ای)</label>
                  <div className="flex flex-wrap gap-2.5 bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                    {brandsList.map((brand) => {
                      const isSelected = newPartBrands.includes(brand);
                      return (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setNewPartBrands(newPartBrands.filter(b => b !== brand));
                            } else {
                              setNewPartBrands([...newPartBrands, brand]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600 text-white border border-blue-500'
                              : 'bg-slate-850 bg-slate-800 text-slate-400 border border-slate-700 hover:text-white'
                          }`}
                        >
                          {brand}
                        </button>
                      );
                    })}
                    {brandsList.length === 0 && (
                      <span className="text-slate-500 text-[10px]">ابتدا برندی تعریف کنید یا پیشفرض عمومی اعمال خواهد شد.</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-350 text-[10px] font-extrabold mb-1">توضیحات کوتاه فنی محصول</label>
                  <textarea
                    rows={2}
                    value={newPartDescription}
                    onChange={(e) => setNewPartDescription(e.target.value)}
                    placeholder="مانند: ساخت کشور ایتالیا، دارای سه سرعته مجزا، سیم‌پیچ مسی صد در صد تضمینی..."
                    className="w-full bg-white border border-slate-300 text-slate-900 placeholder-slate-400 rounded-xl p-3 text-xs font-bold outline-none text-right focus:border-blue-500 transition-all font-sans"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-8 py-2.5 text-xs font-extrabold shadow-md active:scale-95 cursor-pointer transition-all"
                  >
                    ثبت نهایی محصول در بورس انبار
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddPartOpen(false)}
                    className="bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-xl px-5 py-2.5 text-xs font-extrabold cursor-pointer transition-all"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* List of Products / Spare Parts */}
          <div className="bg-white rounded-3xl border border-slate-205 overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-right">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-slate-800">
                  📦 لیست کل قطعات یدکی جاری انبار مرکزی ({spareParts.length} کالا)
                </span>
                {filteredSpareParts.length !== spareParts.length && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                    نتیجه جستجو: {filteredSpareParts.length} کالا
                  </span>
                )}
              </div>

              <div className="relative sm:w-72">
                <input
                  type="text"
                  value={sparePartsSearchVal}
                  onChange={(e) => setSparePartsSearchVal(e.target.value)}
                  placeholder="جستجوی فوری در انبار (نام کالا، دسته‌بندی، سازگاری)..."
                  className="w-full bg-white border border-slate-200 text-[10.5px] pr-8 pl-3 py-1.5 rounded-xl text-right font-medium outline-none focus:border-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {spareParts.length === 0 ? (
              <div className="p-10 text-center text-slate-450 text-xs font-bold space-y-2">
                <p>هیچ قطعه یا محصولی در بورس قطعات تعریف نشده است.</p>
                <p className="text-[10px] text-slate-400 font-normal">جهت ایجاد قطعه از دکمه «افزودن محصول جدید» کمک بگیرید.</p>
              </div>
            ) : filteredSpareParts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-bold space-y-2">
                <p>هیچ قطعه‌ای در انبار با عبارت «{sparePartsSearchVal}» یافت نشد.</p>
                <button
                  type="button"
                  onClick={() => setSparePartsSearchVal('')}
                  className="text-[10px] text-blue-600 underline font-bold cursor-pointer"
                >
                  نمایش مجدد تمام قطعات انبار
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-5 bg-slate-50">
                {filteredSpareParts.map((p) => (
                  <div key={p.id} className="bg-white border border-slate-200 hover:border-slate-300 rounded-3xl p-5 flex flex-col justify-between gap-4 text-right shadow-3xs transition-all duration-150">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-12 h-12 rounded-xl object-cover bg-slate-50 border border-slate-100 flex-shrink-0"
                      />
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-xs">{p.name}</h4>
                        <p className="text-slate-400 text-[10px] mt-0.5">دسته‌بندی: {p.category || 'عمومی'} | سازگار با: {(Array.isArray(p.compatibility) ? p.compatibility : []).join('، ')}</p>
                        <p className="text-slate-400 text-[9.5px] font-normal leading-relaxed text-right mt-1 font-mono">{p.description}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[10px]">
                          <span className="text-slate-500">قیمت فعال: <strong className="text-slate-805 font-mono">{p.price.toLocaleString('fa-IR')}</strong> ت</span>
                          <span className="text-slate-350">|</span>
                          <span className={p.stock > 5 ? 'text-emerald-600 font-extrabold' : 'text-rose-500 font-bold'}>موجودی فعال: {p.stock} عدد</span>
                        </div>
                      </div>
                    </div>

                    {editingPartId === p.id ? (
                      <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-start">
                        <div className="flex gap-2 text-right">
                          <div className="w-24">
                            <label className="text-[9px] text-slate-400 block mb-0.5 font-bold">قیمت (تومان)</label>
                            <input
                              type="number"
                              value={tempPrice}
                              onChange={(e) => setTempPrice(Number(e.target.value))}
                              className="bg-white border border-slate-250 p-1 rounded-lg text-xs w-full font-mono text-center"
                            />
                          </div>
                          <div className="w-16">
                            <label className="text-[9px] text-slate-400 block mb-0.5 font-bold">موجودی</label>
                            <input
                              type="number"
                              value={tempStock}
                              onChange={(e) => setTempStock(Number(e.target.value))}
                              className="bg-white border border-slate-250 p-1 rounded-lg text-xs w-full font-mono text-center"
                            />
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => handleSavePartChanges(p.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded p-1.5 text-xs font-bold cursor-pointer transition-all"
                            title="ذخیره تغییرات مستقیم"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingPartId(null)}
                            className="bg-slate-300 text-slate-600 rounded p-1.5 text-xs cursor-pointer transition-all"
                            title="انصراف"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                        <button
                          id={`edit-stock-${p.id}`}
                          onClick={() => handleStartEditPart(p)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-extrabold py-1.5 px-3.5 rounded-xl border border-slate-200 transition-all cursor-pointer"
                        >
                          ویرایش قیمت و انبار
                        </button>
                        <button
                          onClick={() => handleDeletePart(p.id)}
                          className="p-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 hover:text-rose-700 transition-all cursor-pointer"
                          title="حذف قطعه از پایگاه داده فروشگاه"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'purchases' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-150 rounded-2xl p-4 text-xs text-teal-950 leading-relaxed flex items-start gap-2.5">
            <ShoppingBag className="w-5.5 h-5.5 text-teal-600 flex-shrink-0 mt-0.5 animate-bounce" />
            <div className="space-y-1 text-right">
              <h4 className="font-extrabold text-[13px] text-teal-900">سوابق خرید آنلاین قطعات یدکی توسط مشتریان (دیتابیس سراسری)</h4>
              <p>در این بخش کلیه تراکنش‌ها و سفارشات مستقیم قطعات یدکی ثبت شده توسط مشتریان در دیتابیس برای استفاده‌های بعدی بایگانی شده است. شما به عنوان مدیر کل می‌توانید سوابق خرید را با توجه به نام مشتری، شماره تلفن، یا نام قطعه جستجو کرده و وضعیت مرسوله‌ها را به «ارسال شده» یا «تحویل شده» تغییر دهید.</p>
            </div>
          </div>

          {/* Quick Metrics for purchases */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-right shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">تعداد کل سفارشات تایید شده</span>
              <span className="font-black text-xl text-slate-900 font-sans">{approvedPurchases.length}</span>
              <span className="text-[10px] text-teal-600 block mt-1">سفارشات قطعات تایید شده توسط مدیر</span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-right shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">مجموع مبالغ قطعات تایید شده</span>
              <span className="font-black text-xl text-emerald-600 font-sans">
                {approvedPurchases.reduce((sum, p) => sum + (p.price || 0), 0).toLocaleString('fa-IR')} <span className="text-xs font-bold text-slate-500">تومان</span>
              </span>
              <span className="text-[10px] text-slate-400 block mt-1">مبالغ تایید و واریز شده</span>
            </div>
            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-right shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold block mb-1">در حال آماده‌سازی و ارسال</span>
              <span className="font-black text-xl text-amber-500 font-sans">
                {approvedPurchases.filter(p => p.status === 'confirmed').length}
              </span>
              <span className="text-[10px] text-amber-600 block mt-1">مرسوله‌های تایید شده آماده صدور کد رهگیری</span>
            </div>
          </div>

          {/* Filter & Live Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-xs">
            <div className="relative">
              <input
                type="text"
                placeholder="🔍 جستجو بر اساس نام مـشتری، شماره همراه، کدرهگیری خرید، یا نام قطعه..."
                className="w-full bg-slate-50 text-right text-xs rounded-xl p-3.5 pr-10 border border-slate-200 outline-none focus:border-blue-500 focus:bg-white text-slate-800 font-bold transition-all"
                value={purchaseSearch}
                onChange={(e) => setPurchaseSearch(e.target.value)}
              />
              <span className="absolute inset-y-0 right-3.5 flex items-center pointer-events-none text-slate-400 text-xs">
                🔍
              </span>
            </div>

            {/* Purchases List view */}
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50">
                <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-bold">هیچ سابقه خریدی مطابق با جستجوی شما یافت نشد.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-150">
                <table className="w-full text-right text-xs border-collapse" dir="rtl">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-150 text-slate-600 font-extrabold">
                      <th className="p-3.5 text-right font-black">کد سفارش</th>
                      <th className="p-3.5 text-right font-black">تاریخ ثبت</th>
                      <th className="p-3.5 text-right font-black">مشخصات خریدار (نقش)</th>
                      <th className="p-3.5 text-right font-black">قطعه خریداری شده</th>
                      <th className="p-3.5 text-right font-black">مبلغ پرداختی</th>
                      <th className="p-3.5 text-right font-black">آدرس ارسال مرسوله</th>
                      <th className="p-3.5 text-right font-black">کد رهگیری پستی</th>
                      <th className="p-3.5 text-right font-black">وضعیت ارسال</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredPurchases.map((purchase, pIdx) => {
                      const isTech = purchase.customerRole === 'technician' || technicians.some(t => t.phone === purchase.customerPhone);
                      return (
                        <tr key={`purchase_${purchase.id}_${pIdx}`} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-bold text-slate-900 font-mono tracking-wider">
                            {purchase.id}
                          </td>
                          <td className="p-3.5 text-slate-600 font-sans">
                            {purchase.date}
                          </td>
                          <td className="p-3.5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-800 text-[11.5px]">{purchase.customerName}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold ${
                                  isTech ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {isTech ? 'تکنسین' : 'مشتری'}
                                </span>
                              </div>
                              <span className="font-mono text-slate-500 text-[10.5px] block">{purchase.customerPhone}</span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900 block">{purchase.partName}</span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md inline-block font-bold">
                                {purchase.partCategory}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 font-extrabold text-blue-600 font-sans">
                            {(purchase.price || 0).toLocaleString('fa-IR')} تومان
                          </td>
                          <td className="p-3.5 text-slate-600 leading-relaxed text-[10.5px] max-w-xs truncate" title={purchase.customerAddress}>
                            {purchase.customerAddress}
                          </td>
                          <td className="p-3.5">
                            <div className="space-y-1">
                              <span className="font-mono text-[11px] font-bold text-indigo-700 block select-all">
                                {purchase.postalTrackingCode || purchase.trackNumber || 'ثبت نشده'}
                              </span>
                              <button
                                onClick={() => {
                                  setPostalTrackModalItem(purchase);
                                  setPostalTrackInput(purchase.postalTrackingCode || purchase.trackNumber || '');
                                }}
                                className="text-[9.5px] font-bold text-indigo-600 hover:text-indigo-800 underline bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-all cursor-pointer"
                              >
                                ✏️ ثبت / ویرایش کد پستی
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <select
                              value={purchase.status}
                              onChange={(e) => {
                                const newStatus = e.target.value as 'pending' | 'pending_payment' | 'confirmed' | 'shipped' | 'delivered' | 'rejected';
                                if ((newStatus === 'shipped' || newStatus === 'delivered') && purchase.status === 'pending') {
                                  const targetPart = spareParts.find(sp => sp.id === purchase.partId);
                                  if (targetPart && targetPart.stock > 0 && onUpdatePartStock) {
                                    onUpdatePartStock(targetPart.id, Math.max(0, targetPart.stock - 1), targetPart.price);
                                  }
                                }
                                const updated = partPurchases.map(p => p.id === purchase.id ? { ...p, status: newStatus } : p);
                                if (onUpdatePartPurchases) {
                                  onUpdatePartPurchases(updated);
                                }
                              }}
                              className={`p-1.5 text-[10px] font-black rounded-lg border outline-none cursor-pointer transition-all ${
                                purchase.status === 'delivered' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                purchase.status === 'shipped' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                                purchase.status === 'confirmed' ? 'bg-teal-50 border-teal-200 text-teal-700' :
                                purchase.status === 'rejected' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                'bg-amber-50 border-amber-200 text-amber-700'
                              }`}
                            >
                              <option value="pending">⏳ در انتظار تایید و بررسی مدیر</option>
                              <option value="confirmed">📦 تایید شده - آماده ارسال</option>
                              <option value="shipped">🚚 ارسال شده به پست</option>
                              <option value="delivered">✅ تحویل داده شده</option>
                              <option value="rejected">❌ رد شده توسط مدیر</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm text-right">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 font-sans">مدیریت مشتریان سیستم</h3>
                <p className="text-[11px] text-slate-500 mt-1">لیست کامل مشتریان مأموریتی ب‌نیاز به همراه وضعیت و اطلاعات تماس</p>
              </div>
              <div className="w-full sm:w-72 relative">
                <input
                  type="text"
                  placeholder="جستجو بر اساس نام یا شماره همراه..."
                  value={userSearchVal}
                  onChange={(e) => setUserSearchVal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold transition-all text-right"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {usersList.filter((u: any) => u.role !== 'technician').length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                کاربر عادی در دیتابیس ثبت نشده است.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-700 bg-slate-50/50">
                      <th className="py-3 px-4 font-extrabold">شناسه</th>
                      <th className="py-3 px-4 font-extrabold">نام کامل</th>
                      <th className="py-3 px-4 font-extrabold">شماره همراه</th>
                      <th className="py-3 px-4 font-extrabold">شهر</th>
                      <th className="py-3 px-4 font-extrabold">نقش کاربری</th>
                      <th className="py-3 px-4 font-extrabold">تاریخ عضویت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList
                      .filter((u: any) => u.role !== 'technician')
                      .filter((u: any) => {
                        const q = userSearchVal.toLowerCase();
                        const matchesSearch = (u.full_name || '').toLowerCase().includes(q) || (u.phone || '').includes(q);
                        return matchesSearch;
                      })
                      .map((u: any, uIdx: number) => {
                        return (
                          <tr key={`user_${u.id}_${uIdx}`} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-500">{u.id}</td>
                            <td className="py-3 px-4 font-bold text-slate-800">{u.full_name || 'کاربر گرامی'}</td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-700">{u.phone}</td>
                            <td className="py-3 px-4 font-bold text-slate-600">{u.city || 'ثبت نشده'}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold ${
                                u.role === 'admin' || u.is_super_admin
                                  ? 'bg-red-50 text-red-600 border border-red-100'
                                  : 'bg-green-50 text-green-600 border border-green-100'
                              }`}>
                                {u.is_super_admin || u.role === 'admin' ? 'مدیر عالی' : 'مشتری عادی'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 font-mono">
                              {u.created_at ? new Date(u.created_at).toLocaleDateString('fa-IR') : 'نامشخص'}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'subscriptions' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm text-right space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 font-sans">مدیریت اشتراک‌های ویژه</h3>
                <p className="text-[11px] text-slate-500 mt-1">لیست کل اشتراک‌های فعال یا منقضی شده صادر شده برای کاربران و تکنسین‌ها</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setManualSubModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <span>+ افزودن / فعال‌سازی دستی اشتراک</span>
                </button>
                <div className="w-full sm:w-64 relative">
                  <input
                    type="text"
                    placeholder="جستجو بر اساس شناسه یا شماره..."
                    value={subSearchVal}
                    onChange={(e) => setSubSearchVal(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold transition-all text-right"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Subscriptions Role Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
              <span className="text-slate-500 text-[11px] pl-2">فیلتر نقش:</span>
              <button
                onClick={() => setSubRoleFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  subRoleFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                همه ({subscriptionsList.length})
              </button>
              <button
                onClick={() => setSubRoleFilter('client')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  subRoleFilter === 'client' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                مشتریان عادی
              </button>
              <button
                onClick={() => setSubRoleFilter('technician')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  subRoleFilter === 'technician' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                }`}
              >
                تکنسین‌ها
              </button>
            </div>

            {subscriptionsList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                اشتراکی در دیتابیس ثبت نشده است.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-700 bg-slate-50/50">
                      <th className="py-3 px-4 font-extrabold">شناسه اشتراک</th>
                      <th className="py-3 px-4 font-extrabold">کاربر (نام / نقش)</th>
                      <th className="py-3 px-4 font-extrabold">پلن خریداری‌شده</th>
                      <th className="py-3 px-4 font-extrabold">تاریخ شروع</th>
                      <th className="py-3 px-4 font-extrabold">تاریخ انقضا</th>
                      <th className="py-3 px-4 font-extrabold">روزهای باقیمانده</th>
                      <th className="py-3 px-4 font-extrabold">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {subscriptionsList
                      .filter(s => {
                        const q = subSearchVal.toLowerCase().trim();
                        const userObj = usersList.find((u: any) => String(u.id) === String(s.user_id) || String(u.phone) === String(s.user_id)) ||
                                        technicians.find((t: any) => String(t.id) === String(s.user_id) || String(t.phone) === String(s.user_id));
                        const userName = userObj ? (userObj.full_name || userObj.name || s.user_id || '') : (s.user_id || '');
                        const userPhone = userObj ? (userObj.phone || '') : '';
                        const isTech = userObj ? (userObj.role === 'technician' || userObj.isVerified !== undefined) : false;

                        if (subRoleFilter === 'client' && isTech) return false;
                        if (subRoleFilter === 'technician' && !isTech) return false;

                        if (!q) return true;
                        return (
                          (s.id || '').toLowerCase().includes(q) ||
                          (s.user_id || '').toLowerCase().includes(q) ||
                          (s.plan_name || '').toLowerCase().includes(q) ||
                          (s.planName || '').toLowerCase().includes(q) ||
                          (s.plan_id || '').toLowerCase().includes(q) ||
                          String(userName).toLowerCase().includes(q) ||
                          String(userPhone).toLowerCase().includes(q)
                        );
                      })
                      .map((s: any, sIdx: number) => {
                        const userObj = usersList.find((u: any) => String(u.id) === String(s.user_id) || String(u.phone) === String(s.user_id)) ||
                                        technicians.find((t: any) => String(t.id) === String(s.user_id) || String(t.phone) === String(s.user_id));
                        const userName = userObj ? (userObj.full_name || userObj.name || s.user_id) : s.user_id;
                        const userPhone = userObj ? userObj.phone : '';
                        const isTech = userObj ? (userObj.role === 'technician' || userObj.isVerified !== undefined) : false;

                        const now = new Date();
                        const rawExp = s.expiry_date || s.end_date;
                        const expDate = rawExp ? new Date(rawExp) : new Date(Date.now() + 30 * 86400000);
                        const isExpired = !s.is_active || expDate < now;
                        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
                        const startDateVal = s.start_date || s.startDate || s.created_at;

                        return (
                          <tr key={`sub_${s.id}_${sIdx}`} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-500">{s.id}</td>
                            <td className="py-3 px-4">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800 text-[11.5px]">{userName}</span>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold ${
                                    isTech ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {isTech ? 'تکنسین' : 'مشتری'}
                                  </span>
                                </div>
                                {userPhone && <span className="font-mono text-slate-500 text-[10.5px] block">{userPhone}</span>}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-800">
                              {s.plan_name === '1_month' || s.plan_id === '1_month' ? 'اشتراک ۱ ماهه کدهای خطا' :
                               s.plan_name === '3_month' || s.plan_id === '3_month' ? 'اشتراک ۳ ماهه کدهای خطا' :
                               s.plan_name === '6_month' || s.plan_id === '6_month' ? 'اشتراک ۶ ماهه کدهای خطا' :
                               s.plan_name === '12_month' || s.plan_id === '12_month' ? 'اشتراک ۱۲ ماهه کدهای خطا' :
                               s.plan_name === 'permanent' || s.plan_id === 'permanent' ? 'اشتراک دائمی همکار / مدیریت' : (s.plan_name || s.planName || s.plan_id || 'اشتراک ویژه')}
                            </td>
                            <td className="py-3 px-4 text-slate-600 font-mono">{startDateVal ? new Date(startDateVal).toLocaleDateString('fa-IR') : '---'}</td>
                            <td className="py-3 px-4 text-slate-600 font-mono">{rawExp ? new Date(rawExp).toLocaleDateString('fa-IR') : '---'}</td>
                            <td className="py-3 px-4 font-mono font-bold">
                              {isExpired ? (
                                <span className="text-red-500">۰ روز</span>
                              ) : (
                                <span className="text-emerald-600">{diffDays > 3000 ? 'نامحدود' : `${diffDays} روز`}</span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold ${
                                isExpired
                                  ? 'bg-red-50 text-red-600 border border-red-100'
                                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              }`}>
                                {isExpired ? 'منقضی شده' : 'فعال'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100 shadow-sm text-right space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 font-sans">مدیریت تراکنش‌های پرداخت</h3>
                <p className="text-[11px] text-slate-500 mt-1">مدیریت و تایید فیش‌های کارت‌به‌کارت و تراکنش‌های درگاه بانکی</p>
              </div>
              <div className="w-full sm:w-72 relative">
                <input
                  type="text"
                  placeholder="جستجو بر اساس شناسه یا کد ارجاع..."
                  value={paySearchVal}
                  onChange={(e) => setPaySearchVal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold transition-all text-right"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Payments Filters Bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold pt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">نقش:</span>
                <button
                  onClick={() => setPayRoleFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    payRoleFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  همه
                </button>
                <button
                  onClick={() => setPayRoleFilter('client')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    payRoleFilter === 'client' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  مشتری
                </button>
                <button
                  onClick={() => setPayRoleFilter('technician')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    payRoleFilter === 'technician' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  تکنسین
                </button>
              </div>

              <div className="h-4 w-px bg-slate-200 mx-1" />

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">نوع:</span>
                <button
                  onClick={() => setPayTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    payTypeFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  همه
                </button>
                <button
                  onClick={() => setPayTypeFilter('subscription')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    payTypeFilter === 'subscription' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
                >
                  اشتراک ویژه
                </button>
                <button
                  onClick={() => setPayTypeFilter('part_purchase')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    payTypeFilter === 'part_purchase' ? 'bg-teal-600 text-white' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
                  }`}
                >
                  خرید قطعه
                </button>
              </div>

              <div className="h-4 w-px bg-slate-200 mx-1" />

              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-[11px]">وضعیت:</span>
                <button
                  onClick={() => setPayStatusFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    payStatusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  همه
                </button>
                <button
                  onClick={() => setPayStatusFilter('pending')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    payStatusFilter === 'pending' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                  }`}
                >
                  در انتظار تایید
                </button>
                <button
                  onClick={() => setPayStatusFilter('completed')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    payStatusFilter === 'completed' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  موفق
                </button>
                <button
                  onClick={() => setPayStatusFilter('failed')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    payStatusFilter === 'failed' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  ناموفق
                </button>
              </div>
            </div>

            {paymentsList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                تراکنشی در دیتابیس ثبت نشده است.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-150 text-slate-700 bg-slate-50/50">
                      <th className="py-3 px-4 font-extrabold whitespace-nowrap text-right">شناسه تراکنش</th>
                      <th className="py-3 px-4 font-extrabold whitespace-nowrap text-right">کاربر (نام / نقش)</th>
                      <th className="py-3 px-4 font-extrabold whitespace-nowrap text-right">مبلغ (تومان)</th>
                      <th className="py-3 px-4 font-extrabold whitespace-nowrap text-right">درگاه پرداخت</th>
                      <th className="py-3 px-4 font-extrabold whitespace-nowrap text-right">نوع تراکنش / بابت</th>
                      <th className="py-3 px-4 font-extrabold whitespace-nowrap text-right">کد ارجاع بانکی (Reference)</th>
                      <th className="py-3 px-4 font-extrabold whitespace-nowrap text-right">واریزکننده/فیش</th>
                      <th className="py-3 px-4 font-extrabold whitespace-nowrap text-right">وضعیت پرداخت</th>
                      <th className="py-3 px-4 font-extrabold whitespace-nowrap text-right">تاریخ تراکنش</th>
                      <th className="py-3 px-4 font-extrabold text-center min-w-[240px] whitespace-nowrap">عملیات ممیزی</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paymentsList
                      .filter(p => {
                        const q = paySearchVal.toLowerCase();
                        const matchesSearch = (p.id || '').toLowerCase().includes(q) || (p.ref_id || '').toLowerCase().includes(q) || (p.user_id || '').toLowerCase().includes(q) || (p.user_phone || '').includes(q) || (p.user_name || '').toLowerCase().includes(q);
                        if (!matchesSearch) return false;

                        const userObj = usersList.find((u: any) => String(u.id) === String(p.user_id) || String(u.phone) === String(p.user_phone || p.user_id)) ||
                                        technicians.find((t: any) => String(t.id) === String(p.user_id) || String(t.phone) === String(p.user_phone || p.user_id));
                        const isTech = p.user_role === 'technician' || (userObj ? (userObj.role === 'technician' || userObj.isVerified !== undefined) : false);

                        if (payRoleFilter === 'client' && isTech) return false;
                        if (payRoleFilter === 'technician' && !isTech) return false;

                        const isPart = p.type === 'part_purchase' || !!p.partId;
                        if (payTypeFilter === 'subscription' && isPart) return false;
                        if (payTypeFilter === 'part_purchase' && !isPart) return false;

                        if (payStatusFilter === 'pending' && !(p.status === 'pending' || p.status === 'pending_payment')) return false;
                        if (payStatusFilter === 'completed' && p.status !== 'completed') return false;
                        if (payStatusFilter === 'failed' && !(p.status === 'failed' || p.status === 'rejected')) return false;

                        return true;
                      })
                      .map((p: any, pIdx: number) => {
                        const userObj = usersList.find((u: any) => String(u.id) === String(p.user_id) || String(u.phone) === String(p.user_phone || p.user_id)) ||
                                        technicians.find((t: any) => String(t.id) === String(p.user_id) || String(t.phone) === String(p.user_phone || p.user_id));
                        const userName = p.user_name || (userObj ? (userObj.full_name || userObj.name) : 'کاربر');
                        const userPhone = p.user_phone || (userObj ? userObj.phone : p.user_id);
                        const isTech = p.user_role === 'technician' || (userObj ? (userObj.role === 'technician' || userObj.isVerified !== undefined) : false);

                        return (
                          <tr key={`pay_${p.id}_${pIdx}`} className="hover:bg-slate-50/40 transition-colors">
                            <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{p.id}</td>
                            <td className="py-3 px-4">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-800 text-[11.5px]">{userName}</span>
                                  <span className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold ${
                                    isTech ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {isTech ? 'تکنسین' : 'مشتری'}
                                  </span>
                                </div>
                                <span className="font-mono text-slate-500 text-[10.5px] block">{userPhone}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 font-bold text-blue-600 font-mono whitespace-nowrap">{(p.amount || 0).toLocaleString('fa-IR')} تومان</td>
                            <td className="py-3 px-4 text-slate-700 font-bold whitespace-nowrap">
                              <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold">
                                {p.gateway === 'zarinpal' ? 'زرین‌پال' : p.gateway === 'admin_manual' ? 'دستی ادمین' : 'کارت به کارت'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold whitespace-nowrap">
                              {p.type === 'part_purchase' || p.related_type === 'part_purchase' || p.partId ? (
                                <span className="px-2 py-1 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1">
                                  🔧 خرید قطعه: {p.partName || p.part_name || p.partId || 'قطعه یدکی'}
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-indigo-50 text-indigo-800 border border-indigo-200/80 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1">
                                  ⭐ خرید اشتراک کد خطا {p.plan ? `(${p.plan === '1_month' ? '۱ ماهه' : p.plan === '3_month' ? '۳ ماهه' : p.plan === '6_month' ? '۶ ماهه' : p.plan === '12_month' ? '۱۲ ماهه' : p.plan})` : ''}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono font-bold text-slate-600 whitespace-nowrap select-all">{p.ref_id || '---'}</td>
                            <td className="py-3 px-4 text-slate-700 font-bold whitespace-nowrap">
                              {p.gateway === 'card_to_card' ? (
                                <span className="text-[10px] text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg">
                                  {p.card_holder || 'نامشخص'}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">—</span>
                              )}
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold ${
                                p.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  : p.status === 'failed' || p.status === 'rejected'
                                  ? 'bg-red-50 text-red-600 border border-red-100'
                                  : 'bg-amber-50 text-amber-600 border border-amber-100'
                              }`}>
                                {p.status === 'completed' ? 'موفق' : p.status === 'failed' || p.status === 'rejected' ? 'ناموفق / رد شد' : 'در انتظار تایید ادمین'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-550 font-mono whitespace-nowrap">
                              {p.created_at ? new Date(p.created_at).toLocaleDateString('fa-IR') : '---'}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              {p.status === 'pending' || p.status === 'pending_payment' ? (
                                <div className="flex gap-2.5 justify-center items-center my-0.5">
                                  <button
                                    onClick={() => onApprovePayment && onApprovePayment(p.id)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10.5px] font-extrabold tracking-tight transition-all duration-200 cursor-pointer shadow-xs whitespace-nowrap flex items-center justify-center gap-1 active:scale-95"
                                  >
                                    <span>{p.type === 'part_purchase' || p.related_type === 'part_purchase' || p.partId ? 'تایید و ثبت ارسال قطعه' : 'تایید و فعال‌سازی اشتراک'}</span>
                                  </button>
                                  <button
                                    onClick={() => onRejectPayment && onRejectPayment(p.id)}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[10.5px] font-extrabold tracking-tight transition-all duration-200 cursor-pointer shadow-xs whitespace-nowrap flex items-center justify-center gap-1 active:scale-95"
                                  >
                                    <span>رد و ابطال فیش</span>
                                  </button>
                                </div>
                              ) : p.status === 'completed' || p.status === 'confirmed' ? (
                              <span className="text-emerald-600 font-extrabold text-[11px] block py-1">
                                {p.type === 'part_purchase' || p.related_type === 'part_purchase' || p.partId ? '✓ پرداخت تایید شد (آماده ارسال)' : '✓ تکمیل و فعال‌سازی اشتراک'}
                              </span>
                            ) : p.status === 'failed' || p.status === 'rejected' ? (
                              <span className="text-rose-500 font-bold text-[11px] block py-1">لغو شده / رد شده</span>
                            ) : (
                              <span className="text-amber-600 font-bold text-[10px] block py-1">در انتظار بررسی مدیریت</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="space-y-6 animate-in fade-in duration-200 text-right font-sans">
          
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-150 rounded-2xl p-4 text-xs text-indigo-950 leading-relaxed flex items-start gap-2.5">
            <MessageSquare className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1 text-right">
              <h4 className="font-extrabold text-[13px] text-indigo-900">صندوق ابراز نظرات، پیشنهادها و شکایات کاربران و تکنسین‌ها</h4>
              <p>مکاتبات ارسال شده از بخش «تماس با ما» فوتر سایت، مستقیماً به این صندوق ممیزی وارد می‌شوند. شما می‌توانید نظرات را مطالعه کنید، نوع پیام‌ها را تفکیک کنید و سوابق را آرشیو یا حذف نمایید.</p>
            </div>
          </div>

          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-right flex items-center justify-between shadow-3xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold block">کل پیام‌های واصله</span>
                <strong className="text-xl font-black text-slate-800 font-mono">{userFeedbacks?.length || 0}</strong>
              </div>
              <Inbox className="w-8 h-8 text-indigo-500/80 bg-indigo-50 p-1.5 rounded-xl" />
            </div>
            
            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-right flex items-center justify-between shadow-3xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold block">پیام‌های خوانده‌نشده</span>
                <strong className="text-xl font-black text-amber-600 font-mono">
                  {userFeedbacks?.filter(f => !f.isRead).length || 0}
                </strong>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 text-right flex items-center justify-between shadow-3xs">
              <div className="space-y-0.5">
                <span className="text-[10px] text-slate-400 font-bold block">شکایات ثبتی بخش حل اختلاف</span>
                <strong className="text-xl font-black text-rose-600 font-mono">
                  {userFeedbacks?.filter(f => f.subject?.includes('شکایت')).length || 0}
                </strong>
              </div>
              <AlertTriangle className="w-8 h-8 text-rose-500/80 bg-rose-50 p-1.5 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Interactive grid filter search */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 text-right space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 justify-start w-full sm:w-auto">
                <Search className="w-4 h-4 text-slate-400" />
                <h3 className="font-extrabold text-xs text-slate-800">لیست پیام‌ها و پیشنهادهای دریافتی</h3>
              </div>
              
              {/* Reset database style clean button for state sync test */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={() => {
                    if (onUpdateUserFeedbacks) {
                      // Seed custom message to demonstrate if empty
                      const seedFb = [
                        ...userFeedbacks,
                        {
                          id: `fb_test_${Date.now()}`,
                          name: 'کاربر آزمایشی نمونه',
                          phone: '۰۹۳۰۰۰۰۰۰۰۰',
                          role: 'user',
                          subject: 'پیشنهاد بهبود',
                          message: 'بررسی صحت عملکرد همگام‌سازی، سرعت لود مطالب و خوانایی مطلوب کدهای ارور بر روی مانیتورها بی‌نظیر است.',
                          submittedAt: '۱۴۰۵/۰۳/۱۷ ۱۰:۳۰',
                          isRead: false
                        }
                      ];
                      onUpdateUserFeedbacks(seedFb);
                    }
                  }}
                  className="bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 rounded-lg px-2.5 py-1 text-[10px] font-bold cursor-pointer transition-all active:scale-95"
                >
                  ➕ ایجاد پیام آزمایشی مدیریت
                </button>
              </div>
            </div>

            {userFeedbacks?.length === 0 ? (
              <div className="p-12 text-center text-slate-450 text-xs font-bold bg-slate-50 rounded-2xl flex flex-col items-center justify-center gap-2 border border-dashed border-slate-200">
                <Inbox className="w-10 h-10 text-slate-305" />
                <span>هیچ پیامی در صندوق ممیزی یافت نشد.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {userFeedbacks?.map((f) => (
                  <div 
                    key={f.id} 
                    className={`border rounded-2xl p-4 transition-all duration-200 text-right ${
                      f.isRead 
                        ? 'bg-slate-50/50 border-slate-200 text-slate-600' 
                        : 'bg-white border-indigo-200 shadow-xs ring-1 ring-indigo-100/30 text-slate-850'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-2.5 mb-2.5">
                      <div className="flex items-center gap-2.5 justify-start">
                        <span className={`w-2.5 h-2.5 rounded-full ${f.isRead ? 'bg-slate-300' : 'bg-indigo-600 animate-pulse'}`} />
                        <span className="font-extrabold text-[12px]">{f.name}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">({f.role === 'technician' ? '🔧 همکار تکنسین' : '👤 متقاضی آزاد'})</span>
                        <a href={`tel:${f.phone}`} className="text-[10.5px] text-blue-600 hover:underline font-mono font-bold tracking-wider">{f.phone}</a>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-405 font-mono">{f.submittedAt}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                          f.subject?.includes('شکایت') 
                            ? 'bg-rose-50 text-rose-700 border border-rose-100'
                            : f.subject?.includes('همکاری')
                            ? 'bg-purple-10s0 text-purple-800 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {f.subject || 'گزارش عمومی'}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-sans mb-3 text-right">
                      {f.message}
                    </p>

                    <div className="flex justify-end items-center gap-2 border-t border-slate-100/60 pt-2.5">
                      <button
                        type="button"
                        onClick={() => handleToggleReadFeedback(f.id)}
                        className={`px-3 py-1 text-[10.5px] font-black rounded-lg transition-all cursor-pointer border ${
                          f.isRead 
                            ? 'bg-slate-100 hover:bg-slate-205 text-slate-650 border-slate-205' 
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-100'
                        }`}
                      >
                        {f.isRead ? '🔴 علامتگذاری به عنوان خوانده نشده' : '✓ علامتگذاری به عنوان خوانده شده'}
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => handleDeleteFeedback(f.id)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150 rounded-lg px-2.5 py-1 text-[10.5px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1 active:scale-95"
                        title="حذف دائمی پیام"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>منقضی و حذف کردن</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'techdocs' && (() => {
        // Group error codes by device to find unique Category + Brand + Model combinations
        const uniqueDevices: any[] = [];
        const deviceKeys = new Set();
        errorCodes.forEach((err: any) => {
          if (!err.category || !err.brand || !err.model) return;
          const key = `${err.category.trim()}_${err.brand.trim()}_${err.model.trim()}`;
          if (!deviceKeys.has(key)) {
            deviceKeys.add(key);
            uniqueDevices.push({
              id: err.id, // using the error code ID as a proxy for the device
              category: err.category,
              brand: err.brand,
              model: err.model
            });
          }
        });

        const filteredDevices = uniqueDevices.filter((dev: any) => {
          const search = techDocsSearchQuery.toLowerCase().trim();
          if (!search) return true;
          return (
            dev.category.toLowerCase().includes(search) ||
            dev.brand.toLowerCase().includes(search) ||
            dev.model.toLowerCase().includes(search)
          );
        });

        return (
          <div className="space-y-6 animate-in fade-in duration-200 text-right font-sans">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-150 rounded-2xl p-4 text-xs text-amber-950 leading-relaxed flex items-start gap-2.5">
              <FileText className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1 text-right">
                <h4 className="font-extrabold text-[13px] text-amber-900">سامانه متمرکز مدیریت مستندات فنی، نقشه‌های سیم‌کشی و دیتاشیت‌ها (TechDocs)</h4>
                <p>در این بخش، شما به عنوان مدیر کدیار۲۴ می‌توانید دفترچه‌های راهنمای کارگاهی، نقشه‌های مدار الکترونیکی، شماتیک‌ها و کاتالوگ‌های فنی پیوست‌شده به هر تیپ دستگاه را ممیزی کنید. تکنسین‌ها به این بخش دسترسی مستقیم ندارند و هر سندی برای انتشار عمومی در بخش جستجو باید از فیلتر تایید شما عبور کند.</p>
              </div>
            </div>

            {techDocsStatusMsg && (
              <div className="bg-blue-50 border-2 border-blue-200 text-blue-900 font-bold p-4 rounded-xl text-xs animate-pulse text-right">
                {techDocsStatusMsg}
              </div>
            )}

            {selectedDeviceForDocs ? (
              // DEVICE DOCUMENTS DETAIL MANAGER VIEW
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 text-right space-y-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-150 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 justify-start">
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-lg">
                        {selectedDeviceForDocs.category}
                      </span>
                      <h3 className="font-black text-sm text-slate-800">
                        {selectedDeviceForDocs.brand} - {selectedDeviceForDocs.model}
                      </h3>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium">مدیریت فایل‌های فنی اختصاصی پیوست‌شده به این دستگاه</p>
                  </div>
                  
                  <button
                    onClick={() => setSelectedDeviceForDocs(null)}
                    className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl px-4 py-2 text-xs font-bold cursor-pointer transition-all active:scale-95"
                  >
                    بازگشت به لیست دستگاه‌ها ↩
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* LEFT COLUMN: ADD NEW DOCUMENT FORM */}
                  <div className="lg:col-span-4 bg-slate-50 border border-slate-150 rounded-2xl p-4 sm:p-5 space-y-4">
                    <h4 className="font-extrabold text-xs text-slate-800 border-b border-slate-200 pb-2">➕ بارگذاری و ثبت سند جدید برای این تیپ</h4>
                    
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">عنوان دقیق سند فنی (فارسی یا انگلیسی)</label>
                      <input
                        type="text"
                        value={newDocTitleInput}
                        onChange={(e) => setNewDocTitleInput(e.target.value)}
                        placeholder="مثال: نقشه مداری برد اصلی پکیج بوتان"
                        className="w-full bg-white border border-slate-250 text-xs px-3 py-2 rounded-xl outline-none focus:border-amber-500 font-bold text-right"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">نوع سند فنی</label>
                      <select
                        value={newDocTypeInput}
                        onChange={(e) => setNewDocTypeInput(e.target.value)}
                        className="w-full bg-white border border-slate-250 text-xs px-3 py-2 rounded-xl outline-none focus:border-amber-500 font-bold text-right cursor-pointer"
                      >
                        <option value="Service Manual">Service Manual (راهنمای کارگاهی سرویس)</option>
                        <option value="Wiring Diagram">Wiring Diagram (نقشه اتصالات سیم‌کشی)</option>
                        <option value="Schematic">Schematic (شماتیک فنی برد)</option>
                        <option value="Exploded View">Exploded View (نقشه انفجاری قطعات)</option>
                        <option value="Datasheet (PDF)">Datasheet (دیتاشیت قطعات اصلی)</option>
                        <option value="PCB Layout">PCB Layout (طرح برد اصلی)</option>
                        <option value="Catalog">Catalog (کاتالوگ یا دفترچه مشتری)</option>
                      </select>
                    </div>

                    {/* Method Selector */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">روش بارگذاری سند</label>
                      <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/60 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setUploadMethod('file')}
                          className={`py-1.5 text-[9.5px] font-black rounded-lg transition-all cursor-pointer ${
                            uploadMethod === 'file'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-700 hover:bg-slate-300/40'
                          }`}
                        >
                          📥 آپلود مستقیم فایل
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadMethod('link')}
                          className={`py-1.5 text-[9.5px] font-black rounded-lg transition-all cursor-pointer ${
                            uploadMethod === 'link'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-700 hover:bg-slate-300/40'
                          }`}
                        >
                          🔗 لینک مستقیم دانلود
                        </button>
                      </div>
                    </div>

                    {uploadMethod === 'file' ? (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 block">انتخاب فایل سند فنی (حداکثر ۵۰ مگابایت)</label>
                        <div className="relative border-2 border-dashed border-slate-300 rounded-xl p-4 text-center bg-white hover:bg-amber-50/20 hover:border-amber-400 transition-all cursor-pointer group">
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.zip"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          />
                          <div className="space-y-1.5">
                            <Upload className="w-5 h-5 text-slate-400 group-hover:text-amber-500 mx-auto transition-colors" />
                            <p className="text-[10.5px] font-extrabold text-slate-700 leading-tight">
                              {uploadedFileName ? `📂 فایل: ${uploadedFileName}` : 'کلیک کنید یا فایل را بکشید اینجا'}
                            </p>
                            <p className="text-[8.5px] text-slate-400">فرمت‌ها: PDF، عکس (PNG, JPG) یا ZIP</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">لینک مستقیم دانلود فایل (مثال: آدرس هاست دانلود شما)</label>
                        <input
                          type="text"
                          value={externalUrlInput}
                          onChange={(e) => setExternalUrlInput(e.target.value)}
                          placeholder="https://kodyar24.ir/docs/butan-model1-wiring.pdf"
                          className="w-full bg-white border border-slate-250 text-xs px-3 py-2 rounded-xl outline-none focus:border-amber-500 font-medium text-left font-mono"
                          dir="ltr"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">حجم تقریبی فایل (جهت نمایش به کاربر)</label>
                      <input
                        type="text"
                        value={newDocSizeInput}
                        onChange={(e) => setNewDocSizeInput(e.target.value)}
                        placeholder="مثال: 3.2 MB"
                        className="w-full bg-white border border-slate-250 text-xs px-3 py-2 rounded-xl outline-none focus:border-amber-500 font-bold text-right font-mono"
                      />
                    </div>

                    <button
                      onClick={handleAddTechDoc}
                      disabled={isSavingDoc}
                      className={`w-full bg-amber-500 hover:bg-amber-600 border border-amber-600 text-white rounded-xl py-2.5 text-xs font-black cursor-pointer shadow-md transition-all active:scale-95 text-center block mt-2 ${
                        isSavingDoc ? 'opacity-60 cursor-not-allowed animate-pulse' : ''
                      }`}
                    >
                      {isSavingDoc ? 'در حال آپلود و ذخیره‌سازی...' : 'ثبت و انتشار رسمی سند فنی'}
                    </button>
                  </div>

                  {/* RIGHT COLUMN: CURRENT DOCUMENTS LIST */}
                  <div className="lg:col-span-8 space-y-4">
                    <h4 className="font-extrabold text-xs text-slate-800">اسناد فنی تعریف شده ({deviceDocsList.length} سند)</h4>
                    
                    {deviceDocsLoading ? (
                      <div className="py-12 text-center text-slate-500 text-xs font-bold animate-pulse">
                        در حال برقراری ارتباط زنده با سرور و فراخوانی اسناد فنی...
                      </div>
                    ) : deviceDocsError ? (
                      <div className="bg-rose-50 border border-rose-150 p-4 rounded-xl text-rose-800 text-xs font-bold text-right">
                        ⚠️ {deviceDocsError}
                      </div>
                    ) : deviceDocsList.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        هیچ سند فنی اختصاصی برای این مدل هنوز آپلود نشده است.
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                        {deviceDocsList.map((doc: any) => {
                          if (editingDocId === doc.id) {
                            return (
                              <div
                                key={doc.id}
                                className="bg-amber-50/40 border-2 border-amber-300 rounded-2xl p-4 space-y-3 text-right"
                              >
                                <div className="text-xs font-black text-amber-900 border-b border-amber-200 pb-1.5 flex items-center justify-between">
                                  <span>✍️ ویرایش اطلاعات سند فنی</span>
                                  <span className="bg-amber-100 px-2 py-0.5 rounded text-[10px] font-bold">{doc.type}</span>
                                </div>
                                
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-600 block">عنوان دقیق سند فنی</label>
                                  <input
                                    type="text"
                                    value={editingDocTitle}
                                    onChange={(e) => setEditingDocTitle(e.target.value)}
                                    className="w-full bg-white border border-slate-300 text-xs px-3 py-1.5 rounded-xl outline-none font-bold text-right"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-600 block">نوع سند</label>
                                    <select
                                      value={editingDocType}
                                      onChange={(e) => setEditingDocType(e.target.value)}
                                      className="w-full bg-white border border-slate-300 text-xs px-3 py-1.5 rounded-xl outline-none font-bold text-right"
                                    >
                                      <option value="Service Manual">Service Manual (راهنمای کارگاهی)</option>
                                      <option value="Wiring Diagram">Wiring Diagram (نقشه سیم‌کشی)</option>
                                      <option value="Schematic">Schematic (شماتیک فنی برد)</option>
                                      <option value="Exploded View">Exploded View (نقشه انفجاری)</option>
                                      <option value="Datasheet (PDF)">Datasheet (دیتاشیت قطعات)</option>
                                      <option value="PCB Layout">PCB Layout (طرح برد اصلی)</option>
                                      <option value="Catalog">Catalog (کاتالوگ یا دفترچه)</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-600 block">حجم فایل</label>
                                    <input
                                      type="text"
                                      value={editingDocSize}
                                      onChange={(e) => setEditingDocSize(e.target.value)}
                                      className="w-full bg-white border border-slate-300 text-xs px-3 py-1.5 rounded-xl outline-none font-bold text-right ltr"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-600 block">لینک مستقیم فایل</label>
                                  <input
                                    type="text"
                                    value={editingDocUrl}
                                    onChange={(e) => setEditingDocUrl(e.target.value)}
                                    className="w-full bg-white border border-slate-300 text-xs px-3 py-1.5 rounded-xl outline-none font-medium text-left ltr font-mono"
                                  />
                                </div>

                                <div className="flex justify-end gap-2 pt-1 border-t border-amber-200/60">
                                  <button
                                    onClick={handleCancelEditDoc}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black rounded-lg px-3 py-1.5 cursor-pointer transition-all"
                                  >
                                    انصراف
                                  </button>
                                  <button
                                    onClick={handleSaveEditDoc}
                                    className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black rounded-lg px-4 py-1.5 cursor-pointer transition-all shadow-sm"
                                  >
                                    ذخیره تغییرات
                                  </button>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div
                              key={doc.id}
                              className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4 transition-all hover:bg-slate-50"
                            >
                              <div className="space-y-1 flex-1 min-w-0 text-right">
                                <div className="flex items-center gap-2">
                                  <span className="bg-slate-100 text-slate-700 text-[9px] font-black px-2 py-0.5 rounded-md">
                                    {doc.type}
                                  </span>
                                  {doc.isDefault ? (
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[8px] px-1.5 py-0.5 rounded-md font-bold">
                                      سند سیستمی هوشمند
                                    </span>
                                  ) : (
                                    <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[8px] px-1.5 py-0.5 rounded-md font-bold">
                                      سند ثبت‌شده ادمین
                                    </span>
                                  )}
                                </div>
                                <h5 className="font-extrabold text-xs text-slate-850 truncate">{doc.title}</h5>
                                <div className="flex items-center gap-3 text-[10px] text-slate-450 font-medium">
                                  <span>حجم: <span className="font-mono">{doc.fileSize}</span></span>
                                  <span>•</span>
                                  <span>ثبت: <span className="font-mono">{doc.uploadedAt}</span></span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {!doc.isDefault && (
                                  <button
                                    onClick={() => handleStartEditDoc(doc)}
                                    className="bg-amber-50 hover:bg-amber-100 border border-amber-150 text-amber-750 rounded-xl p-2.5 text-xs font-bold cursor-pointer transition-all active:scale-95"
                                    title="ویرایش اطلاعات سند"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                )}
                                {!doc.isDefault ? (
                                  <button
                                    onClick={() => handleDeleteTechDoc(doc.id)}
                                    className="bg-rose-50 hover:bg-rose-100 border border-rose-150 text-rose-700 rounded-xl p-2.5 text-xs font-bold cursor-pointer transition-all active:scale-95"
                                    title="حذف دائمی سند"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-1.5 rounded-xl">
                                    غیرقابل حذف
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // DEVICES GRID LIST
              <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 text-right space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2 justify-start w-full sm:w-auto">
                    <Search className="w-4 h-4 text-slate-400" />
                    <h3 className="font-extrabold text-xs text-slate-800">لیست کل تیپ‌های دستگاه فعال در سایت</h3>
                  </div>

                  <input
                    type="text"
                    value={techDocsSearchQuery}
                    onChange={(e) => setTechDocsSearchQuery(e.target.value)}
                    placeholder="جستجو در دسته‌ها، برندها یا مدل‌ها..."
                    className="w-full sm:w-72 bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none focus:border-amber-500 font-bold text-right transition-all"
                  />
                </div>

                {filteredDevices.length === 0 ? (
                  <div className="p-12 text-center text-slate-450 text-xs font-bold bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    دستگاهی یافت نشد. برای پیوست سند فنی باید ابتدا یک کد خطای متناظر با برند و مدل ثبت شده باشد.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDevices.map((dev: any, index: number) => (
                      <div
                        key={index}
                        className="border border-slate-200 bg-slate-50/50 rounded-2xl p-4 flex flex-col justify-between gap-3 hover:border-amber-400 transition-all hover:bg-white"
                      >
                        <div className="space-y-1.5 text-right">
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded-md inline-block">
                            {dev.category}
                          </span>
                          <h4 className="font-extrabold text-xs text-slate-800">{dev.brand}</h4>
                          <p className="text-[10px] text-slate-500 font-mono">مدل: {dev.model}</p>
                        </div>

                        <div className="border-t border-slate-100/80 pt-3 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400 font-bold">وضعیت: آماده ممیزی</span>
                          
                          <button
                            onClick={() => setSelectedDeviceForDocs(dev)}
                            className="bg-amber-500 hover:bg-amber-600 border border-amber-600 text-white rounded-xl px-3.5 py-1.5 text-[11px] font-extrabold cursor-pointer transition-all active:scale-95"
                          >
                            مدیریت مستندات فنی و دیتاشیت‌ها
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === 'activitylogs' && (
        <div className="space-y-6 animate-in fade-in duration-200 text-right font-sans">
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-150 rounded-2xl p-4 text-xs text-blue-950 leading-relaxed flex items-start gap-2.5">
            <Activity className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-right">
              <h4 className="font-extrabold text-[13px] text-blue-900">گزارش فعالیت‌ها و دسترسی‌های کاربران سیستم (Audit Logs)</h4>
              <p>این بخش مسئول ردیابی و ذخیره تاریخچه کامل فعالیت‌های حساس کاربران، ادمین‌ها و تکنسین‌ها به صورت زنده است. در پایین می‌توانید گزارش کاربری و مالی را استخراج نمایید.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800">خروجی فرمت‌های نظارتی صنف (صادرات داده)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-slate-50/50">
                <span className="text-xs font-extrabold text-slate-700 block">دانلود فایل اکسل گزارشات صنف (Excel/CSV UTF-8)</span>
                <p className="text-[11px] text-slate-500">لیست جامع تمامی سفارشات فعال و بایگانی‌شده تعمیرات لوازم خانگی به همراه مشخصات مشتریان.</p>
                <div className="flex gap-2 justify-start">
                  <a
                    href="/api/admin/export/excel?type=orders"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span>اکسپورت سفارشات تعمیرات</span>
                  </a>
                  <a
                    href="/api/admin/export/excel?type=users"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm"
                  >
                    <Users className="w-4 h-4" />
                    <span>لیست کاربران</span>
                  </a>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-slate-50/50">
                <span className="text-xs font-extrabold text-slate-700 block">چاپ مستقیم فایل PDF و گزارشات چاپی (HTML/PDF)</span>
                <p className="text-[11px] text-slate-500">طرح‌بندی استاندارد چاپی با فونت‌های اصلاح شده فارسی و جداول با وضوح بالا برای تحویل به مراجع نظارتی.</p>
                <div className="flex gap-2 justify-start">
                  <a
                    href="/api/admin/export/pdf?type=orders"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span>چاپ فاکتورها و سفارشات</span>
                  </a>
                  <a
                    href="/api/admin/export/pdf?type=users"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-sm"
                  >
                    <Users className="w-4 h-4" />
                    <span>چاپ کاربران سیستم</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800">لیست زنده لاگ فعالیت‌ها</h3>
            {activityLogsLoading ? (
              <div className="text-center py-12 text-xs text-slate-500">در حال دریافت تاریخچه فعالیت‌ها...</div>
            ) : activityLogsList.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">تاکنون فعالیتی در پایگاه ثبت نگردیده است.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <th className="p-3 text-right">کاربر</th>
                      <th className="p-3 text-right">عملیات</th>
                      <th className="p-3 text-right">آدرس IP</th>
                      <th className="p-3 text-right">تاریخ و ساعت</th>
                      <th className="p-3 text-right">جزئیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activityLogsList.map((log: any) => (
                      <tr key={log.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-700 text-right">{log.userId === 'admin' ? 'مدیر ارشد' : log.userId}</td>
                        <td className="p-3 text-right"><span className="bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded-md text-[10px]">{log.action}</span></td>
                        <td className="p-3 font-mono text-slate-500 text-right">{log.ip}</td>
                        <td className="p-3 text-slate-500 text-right">{new Date(log.created_at).toLocaleDateString('fa-IR', {hour:'2-digit', minute:'2-digit'})}</td>
                        <td className="p-3 text-slate-650 max-w-xs truncate text-right" title={log.details}>{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'backups' && (
        <div className="space-y-6 animate-in fade-in duration-200 text-right font-sans">
          
          {/* Header Hero Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white border border-indigo-800/60 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-2">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider inline-block">
                  مرکز یکپارچه فرماندهی پایگاه داده کدیار۲۴
                </span>
                <h3 className="text-xl sm:text-2xl font-black flex items-center gap-2.5">
                  <Database className="w-7 h-7 text-amber-400" />
                  <span>پشتیبان‌گیری، بازگردانی و ایستگاه درون‌ریزی کل داده‌های سایت</span>
                </h3>
                <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                  مدیریت کامل و متمرکز تمام نسخه‌های پشتیبان دیتابیس شامل اطلاعات هویتی مشتریان، حساب‌های تکنسین‌ها، سفارشات تعمیرات، تراکنش‌های مالی، کدهای خطا، قطعات انبار و تنظیمات پلتفرم.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={fetchAdminBackups}
                  className="bg-white/10 hover:bg-white/20 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                  <span>بروزرسانی لیست</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fullBackup = {
                      exportedAt: new Date().toISOString(),
                      version: "2.0",
                      app: "kodyar24",
                      stats: {
                        errorCodesCount: errorCodes?.length || 0,
                        usersCount: usersList?.length || 0,
                        techniciansCount: technicians?.length || 0,
                        ordersCount: orders?.length || 0,
                      },
                      errorCodes,
                      technicians,
                      usersList,
                      orders,
                      spareParts,
                      commonProblems,
                      partPurchases,
                      subscriptionsList,
                      paymentsList,
                      categoriesList,
                      brandsList,
                      modelsList,
                      citiesList,
                      categoryConfig,
                      affiliateProducts,
                      smsSettings,
                      pageContents,
                      trustBadges,
                      supportPhone,
                      adminAnnouncement
                    };
                    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `kodyar24_FULL_DATABASE_BACKUP_${new Date().toISOString().slice(0,10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setBackupStatusMsg('✅ بکاپ کامل تمام داده‌های سایت (مشتریان، تکنسین‌ها، ارورها و...) با موفقیت دانلود شد.');
                    setTimeout(() => setBackupStatusMsg(''), 6000);
                  }}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 rotate-180" />
                  <span>دانلود فوری فایل JSON کل سایت</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-indigo-800/50">
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold block">مشتریان و تکنسین‌ها</span>
                <span className="text-sm font-black text-amber-300 font-mono">
                  {(usersList?.length || 0) + (technicians?.length || 0)} نفر
                </span>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold block">کدهای خطا و عیب‌یابی</span>
                <span className="text-sm font-black text-emerald-300 font-mono">
                  {(errorCodes?.length || 0).toLocaleString('fa-IR')} مورد
                </span>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold block">سفارشات و مأموریت‌ها</span>
                <span className="text-sm font-black text-sky-300 font-mono">
                  {(orders?.length || 0).toLocaleString('fa-IR')} سفارش
                </span>
              </div>
              <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold block">نسخه‌های ذخیره هاست</span>
                <span className="text-sm font-black text-indigo-300 font-mono">
                  {adminServerBackups.length} نسخه
                </span>
              </div>
            </div>
          </div>

          {/* Status Message Banner */}
          {backupStatusMsg && (
            <div className="p-4 bg-amber-50 border-2 border-amber-300 text-amber-950 text-xs font-black rounded-2xl text-center shadow-xs animate-pulse font-sans flex items-center justify-center gap-2">
              <Info className="w-4 h-4 text-amber-600" />
              <span>{backupStatusMsg}</span>
            </div>
          )}

          {/* SECTION 1: SERVER SNAPSHOTS & HOST BACKUPS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <span>۱. مرکز نسخه پشتیبان خودکار و دستی روی هاست سرور (Host Snapshots)</span>
                </h4>
                <p className="text-xs text-slate-500">
                  سیستم به طور خودکار هر ۲ ساعت یک‌بار دیتابیس را روی هاست فشرده و ذخیره می‌کند. همچنین می‌توانید دستی بکاپ بسازید.
                </p>
              </div>
              <button
                type="button"
                onClick={createAdminBackup}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-2 shrink-0"
              >
                <RefreshCw className="w-4 h-4" />
                <span>➕ ایجاد فوری بکاپ جدید روی هاست</span>
              </button>
            </div>

            {/* List of server backups */}
            <div className="space-y-3">
              <h5 className="font-extrabold text-xs text-slate-800">📋 نسخه‌های فیزیکی ذخیره شده در هاست ({adminServerBackups.length} نسخه)</h5>
              <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 bg-slate-50/50">
                {adminServerBackups.map((bk) => (
                  <div key={bk.fileName || bk.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white transition-colors">
                    <div className="space-y-1 text-right">
                      <span className="font-black text-xs text-slate-800 block">🗓️ نسخه پشتیبان: {bk.formattedDate || bk.fileName}</span>
                      <span className="text-[10px] text-slate-500 font-mono block">فایل: {bk.fileName} | حجم: {bk.dataSizeKB} KB</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          triggerSafeConfirm(
                            'بازگردانی دیتابیس به این نسخه',
                            `آیا از بازگردانی کامل داده‌های سایت به نسخه مورخ "${bk.formattedDate || bk.fileName}" اطمینان دارید؟ تمامی اطلاعات شامل تکنسین‌ها، کاربران و سفارشات به همان تاریخ برمی‌گردند.`,
                            () => restoreAdminBackup(bk.fileName)
                          );
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>🔄 بازیابی این نسخه</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          triggerSafeConfirm(
                            'حذف نسخه پشتیبان',
                            `آیا از حذف دائم فایل بکاپ "${bk.fileName}" از روی هاست سرور اطمینان دارید؟`,
                            () => deleteAdminBackup(bk.fileName)
                          );
                        }}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-bold p-2 rounded-xl border border-rose-200 transition-all cursor-pointer"
                        title="حذف فایل"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {adminServerBackups.length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-400 font-bold">
                    ☁️ هیچ نسخه پشتیبان فیزیکی روی هاست سرور یافت نشد. جهت امنیت اطلاعات، همین حالا اولین بکاپ را ایجاد کنید.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: MANUAL JSON BACKUP EXPORT & IMPORT (Customers, Techs, Orders & All) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <span>۲. خروجی گرفتن و بازیابی دستی کل دیتابیس (فایل JSON)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                ذخیره فایل کامل دیتابیس روی سیستم شخصی خود یا بازیابی کامل سایت با آپلود فایل بکاپ قبلی.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Export JSON Card */}
              <div className="bg-blue-50/40 border border-blue-100 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md inline-block">
                    خروجی به رایانه (Full Export)
                  </span>
                  <h5 className="font-extrabold text-xs text-slate-900">دانلود پشتیبان شامل کل اطلاعات مشتریان، تکنسین‌ها و کدهای خطا</h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    با کلیک روی این دکمه، یک فایل کامل <code className="font-mono text-blue-700 bg-white px-1 py-0.5 rounded border border-blue-200">.json</code> دانلود می‌شود که دقیقاً شامل تمام جداول دیتابیس کدیار۲۴ است.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const fullBackup = {
                      exportedAt: new Date().toISOString(),
                      version: "2.0",
                      app: "kodyar24",
                      stats: {
                        errorCodesCount: errorCodes?.length || 0,
                        usersCount: usersList?.length || 0,
                        techniciansCount: technicians?.length || 0,
                        ordersCount: orders?.length || 0,
                      },
                      errorCodes,
                      technicians,
                      usersList,
                      orders,
                      spareParts,
                      commonProblems,
                      partPurchases,
                      subscriptionsList,
                      paymentsList,
                      categoriesList,
                      brandsList,
                      modelsList,
                      citiesList,
                      categoryConfig,
                      affiliateProducts,
                      smsSettings,
                      pageContents,
                      trustBadges,
                      supportPhone,
                      adminAnnouncement
                    };
                    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `kodyar24_FULL_DATABASE_BACKUP_${new Date().toISOString().slice(0,10)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    setBackupStatusMsg('✅ فایل پشتیبان جامع روی سیستم شما بارگیری شد.');
                    setTimeout(() => setBackupStatusMsg(''), 6000);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4 rotate-180" />
                  <span>دانلود پشتیبان کامل پایگاه داده (.json)</span>
                </button>
              </div>

              {/* Restore from Uploaded JSON Card */}
              <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-2">
                  <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-md inline-block">
                    بازگردانی از کامپیوتر (Full Restore)
                  </span>
                  <h5 className="font-extrabold text-xs text-slate-900">آپلود و جایگزینی کامل دیتابیس سایت از فایل JSON</h5>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    فایل بکاپ دانلود شده قبلی را انتخاب کنید تا کل اطلاعات سایت (کاربران، تکنسین‌ها، ارورها و سفارشات) به طور کامل بازنویسی گردند.
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    id="full-json-restore-input"
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();
                      reader.onload = async (evt) => {
                        const content = evt.target?.result;
                        if (typeof content !== 'string') return;
                        try {
                          const parsed = JSON.parse(content);
                          triggerSafeConfirm(
                            'بازنویسی کامل پایگاه داده',
                            `آیا از بازنویسی کامل دیتابیس سایت با فایل "${file.name}" مطمئن هستید؟ تمام اطلاعات موجود جایگزین داده‌های داخل این فایل می‌شوند.`,
                            async () => {
                              setBackupStatusMsg('⏳ در حال ارسال داده‌های بکاپ به سرور و اعمال روی دیتابیس...');
                              const res = await fetch('/api/server-backups/upload-restore', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(parsed)
                              });
                              const data = await res.json();
                              if (res.ok && data.success) {
                                setBackupStatusMsg('🎉 دیتابیس با موفقیت کامل با فایل بکاپ شما بازنویسی گردید! در حال بارگذاری مجدد...');
                                setTimeout(() => window.location.reload(), 2000);
                              } else {
                                setBackupStatusMsg(`❌ خطا در بازگردانی: ${data.error || 'عملیات شکست خورد'}`);
                              }
                            }
                          );
                        } catch (err: any) {
                          setBackupStatusMsg(`❌ فایل JSON انتخابی معتبر نیست: ${err.message}`);
                        }
                      };
                      reader.readAsText(file);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => document.getElementById('full-json-restore-input')?.click()}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>انتخاب فایل بکاپ JSON و بازگردانی سایت</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: DATABASE FILES IMPORT STATION (SQL & FORMATTED JSON) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                <span>۳. ایستگاه درون‌ریزی فایل‌های پایگاه داده (SQL / JSON مرجع)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                درون‌ریزی ساختار دیتابیس، بارگذاری کدهای خطا یا اجرای اسکریپت‌های SQL.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sub-card 1: Import migration.sql */}
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black text-emerald-950 block mb-1">⚡ درون‌ریزی فایل ساختار مهاجرت (migration.sql)</span>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    اجرای فایل مهاجرت دیتابیس سرور شامل ساختار پایه‌ای تمامی جداول کاربران، تکنسین‌ها، تنظیمات عمومی سیستم، فاکتورهای مالی، سفارشات و حساب‌های مدیریتی پیش‌فرض.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setBackupStatusMsg('⏳ در حال درون‌ریزی فایل مهاجرت migration.sql ...');
                      const res = await fetch('/api/server-backups/import-sql', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fromFile: 'migration.sql' })
                      });
                      const data = await res.json();
                      if (res.ok && data.success) {
                        setBackupStatusMsg(`✅ با موفقیت انجام شد: ${data.message}`);
                        setTimeout(() => window.location.reload(), 1500);
                      } else {
                        setBackupStatusMsg(`❌ خطا: ${data.error || 'عملیات شکست خورد'}`);
                      }
                    } catch (err: any) {
                      setBackupStatusMsg(`❌ خطا در ارتباط با سرور: ${err.message}`);
                    }
                    setTimeout(() => setBackupStatusMsg(''), 8000);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Database className="w-4 h-4" />
                  <span>شروع درون‌ریزی فایل migration.sql</span>
                </button>
              </div>

              {/* Sub-card 2: Import error_codes_formatted.json */}
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/20 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-black text-blue-950 block mb-1">📊 بارگذاری کامل مرجع سراسری عیب‌یابی (۶,۵۰۰+ خطای لوازم خانگی)</span>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    بارگذاری و درون‌ریزی آنی آرشیو طلایی کدهای عیب‌یابی پکیج، کولر گازی، یخچال، لباسشویی و ظرفشویی از روی فایل سیستم سرور کدیار۲۴.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      setBackupStatusMsg('⏳ در حال بارگذاری و تحلیل فایل عظیم مرجع کدهای خطا...');
                      const res = await fetch('/api/server-backups/import-formatted-json', { method: 'POST' });
                      const data = await res.json();
                      if (res.ok && data.success) {
                        setBackupStatusMsg(`✅ با موفقیت انجام شد: ${data.message}`);
                        setTimeout(() => window.location.reload(), 1500);
                      } else {
                        setBackupStatusMsg(`❌ خطا: ${data.error || 'عملیات شکست خورد'}`);
                      }
                    } catch (err: any) {
                      setBackupStatusMsg(`❌ خطا در ارتباط با سرور: ${err.message}`);
                    }
                    setTimeout(() => setBackupStatusMsg(''), 8000);
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-[11px] font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>درون‌ریزی کدهای عیب‌یابی</span>
                </button>
              </div>
            </div>

            {/* Custom SQL Executer */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <span className="text-xs font-black text-slate-800 block">📂 بارگذاری و اجرای فایل SQL دلخواه از روی دستگاه شما</span>
              <p className="text-[10px] text-slate-500">
                می‌توانید هر فایل اس‌کیوال با پسوند <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-indigo-700">.sql</code> را انتخاب کرده تا کدهای آن مستقیماً روی پایگاه داده اجرا گردند.
              </p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  id="custom-sql-upload-input"
                  type="file"
                  accept=".sql"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    
                    const reader = new FileReader();
                    reader.onload = async (evt) => {
                      const sqlText = evt.target?.result;
                      if (typeof sqlText !== 'string') return;
                      
                      try {
                        setBackupStatusMsg(`⏳ در حال ارسال و اجرای فایل SQL "${file.name}" روی سرور...`);
                        const res = await fetch('/api/server-backups/import-sql', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ sqlContent: sqlText })
                        });
                        const data = await res.json();
                        if (res.ok && data.success) {
                          setBackupStatusMsg(`✅ فایل با موفقیت اجرا شد: ${data.message}`);
                          setTimeout(() => window.location.reload(), 2000);
                        } else {
                          setBackupStatusMsg(`❌ خطا در اجرای اسکریپت: ${data.error || 'عملیات شکست خورد'}`);
                        }
                      } catch (err: any) {
                        setBackupStatusMsg(`❌ خطا در ارتباط: ${err.message}`);
                      }
                      setTimeout(() => setBackupStatusMsg(''), 8000);
                    };
                    reader.readAsText(file);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('custom-sql-upload-input')?.click()}
                  className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl px-5 py-2.5 text-[11px] font-extrabold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 shrink-0"
                >
                  <Upload className="w-4 h-4" />
                  <span>انتخاب و اجرای فایل SQL سفارشی</span>
                </button>
                <span className="text-[10px] text-slate-400 font-sans self-center">پشتیبانی از دستورات CREATE, DROP, INSERT, UPDATE, SET</span>
              </div>
            </div>
          </div>

          {/* SECTION 4: BULK DATA IMPORT WIZARD (CSV/Excel/JSON) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" />
                <span>۴. سامانه درون‌ریزی گروهی داده‌ها (اکسل، CSV و JSON)</span>
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                وارد کردن دسته جمعی کدهای خطا، دسته‌بندی‌ها، برندها یا شهرها از طریق کپی کردن یا بارگذاری فایل CSV/JSON.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">نوع محتوای وارداتی را مشخص کنید:</label>
                  <select
                    value={importType}
                    onChange={(e) => setImportType(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 p-2.5 w-full text-xs rounded-xl font-bold cursor-pointer text-right outline-none focus:border-blue-500"
                  >
                    <option value="errors">📂 پرونده کامل کدهای خطای فنی (Error Codes)</option>
                    <option value="categories">🏷️ دسته‌بندی لوازم و نوع دستگاه‌ها</option>
                    <option value="brands">🏭 شرکت‌های سازنده و برندها</option>
                    <option value="cities">📍 شهرها به همراه محلات (فرمت CSV: شهر,محله۱,محله۲)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1">بارگذاری فایل از دیسک (.json, .csv):</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".json,.csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const text = event.target?.result as string;
                            if (text) {
                              setPastedImportData(text);
                              setImportStatus({ type: 'idle', msg: `فایل "${file.name}" بارگذاری شد. جهت ثبت، روی دکمه شروع پردازش کلیک کنید.` });
                            }
                          };
                          reader.readAsText(file);
                        }
                      }}
                      className="hidden"
                      id="bulk-file-uploader-backups-tab"
                    />
                    <label
                      htmlFor="bulk-file-uploader-backups-tab"
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs py-2.5 px-4 rounded-xl border border-slate-300 transition-all font-bold cursor-pointer inline-block"
                    >
                      📂 انتخاب فایل از رایانه
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-extrabold text-slate-700 block mb-1">داده‌های کپی شده از اکسل/متن را در کادر زیر بچسبانید:</label>
                <textarea
                  rows={4}
                  value={pastedImportData}
                  onChange={(e) => setPastedImportData(e.target.value)}
                  placeholder={
                    importType === 'errors' 
                      ? 'فرمت نمونه JSON: [{"code": "E1", "title": "خطای ترمیستور", "category": "پکیج", "brand": "Valtro", "model": "B5-C2", "description": "نقص در مدار آبگرم"}]'
                      : 'داده‌ها را خط به خط وارد کنید.'
                  }
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-2xl text-[11px] font-mono text-right outline-none focus:border-blue-500"
                />
              </div>

              {importStatus.msg && (
                <div className={`p-3 rounded-xl text-xs font-bold leading-relaxed text-right border ${
                  importStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-250' :
                  importStatus.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-250' : 'bg-blue-50 text-blue-800 border-blue-250 font-sans'
                }`}>
                  {importStatus.type === 'success' ? '✓ ' : importStatus.type === 'error' ? '✕ ' : 'ℹ️ '}
                  {importStatus.msg}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={processBulkImport}
                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-8 py-3 text-xs font-black shadow-md transition-all cursor-pointer"
                >
                  شروع پردازش و ادغام با دیتابیس کدیار۲۴
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 5: SAFE DATA WIPING & CLEANING OPERATIONS */}
          <div className="bg-white border border-rose-200 shadow-sm rounded-3xl p-6 space-y-4">
            <div className="border-b border-rose-100 pb-3">
              <h4 className="font-extrabold text-sm text-rose-950 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <span>۵. پاکسازی و صفر کردن کدهای خطا و عیب‌یابی</span>
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                صفر کردن کدهای خطای موجود جهت بارگذاری دیتابیس جدید. توجه: حساب مشتریان، تکنسین‌ها و سفارشات کاملاً دست‌نخورده باقی می‌مانند.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
              <div className="text-right space-y-1">
                <span className="text-xs font-black text-rose-950 block">محدوده پاکسازی: فقط کدهای خطا و مشکلات متداول</span>
                <span className="text-[10px] text-slate-500 block">اطلاعات هویتی تکنسین‌ها، مشتریان، خریدهای انبار و سفارشات کاملاً حفظ می‌شوند.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!onResetDatabase) return;
                  triggerSafeConfirm(
                    'پاکسازی کدهای خطا و عیب‌یابی',
                    'کلیه کدهای خطای ثبت شده دائم حذف خواهند شد. اطلاعات تکنسین‌ها، مشتریان و سفارشات حفظ می‌شوند. آیا مطمئن هستید؟ جهت تایید رمز عبور مدیریت الزامی است.',
                    () => onResetDatabase(),
                    true
                  );
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-6 py-2.5 text-xs font-extrabold transition-all cursor-pointer shadow-xs flex items-center gap-1.5 shrink-0"
              >
                <Trash2 className="w-4 h-4" />
                <span>پاکسازی ارورها و ریست عیب‌یابی</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'system_errors' && (
        <div className="space-y-6 animate-in fade-in duration-200 text-right font-sans">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-150 rounded-2xl p-4 text-xs text-red-950 leading-relaxed flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-right">
              <h4 className="font-extrabold text-[13px] text-red-900">جدول ردیابی خطاهای نرم‌افزاری و تلمتری کرش (error_logs Table Analyzer)</h4>
              <p>این جدول به صورت کاملاً خودکار کرش‌های مربوط به مرورگر کاربران، خطاهای سرور و خطاهای دیتابیس را به همراه Stack Trace ذخیره می‌کند تا توسعه‌دهندگان بتوانند بلافاصله مشکلات سیستم را برطرف کنند.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800">کدهای خطای ثبت شده (React & Express Runtime)</h3>
            {systemErrorsLoading ? (
              <div className="text-center py-12 text-xs text-slate-500">در حال بارگذاری لیست خطاها...</div>
            ) : systemErrorsList.length === 0 ? (
              <div className="text-center py-12 text-xs text-emerald-650 font-bold bg-emerald-50 rounded-2xl border border-emerald-100 p-4">بسیار عالی! هیچ خطای نرم‌افزاری گزارش نشده و وضعیت سیستم کاملاً پایدار (Healthy) است.</div>
            ) : (
              <div className="space-y-4">
                {systemErrorsList.map((err: any) => (
                  <div key={err.id} className="p-4 border border-red-100 bg-red-50/20 rounded-2xl space-y-2 text-right">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-red-105/10 pb-2">
                      <span className="text-xs font-black text-red-700 text-right block">{err.errorMessage}</span>
                      <span className="text-[10px] text-slate-400 font-mono text-left block">{err.created_at ? new Date(err.created_at).toLocaleString('fa-IR') : ''}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500">
                      <span className="text-right">کاربر: <strong className="text-slate-700">{err.userId}</strong></span>
                      <span className="text-left">صفحه: <strong className="text-slate-700 font-mono">{err.url}</strong></span>
                    </div>
                    {err.stack_trace && (
                      <pre className="w-full bg-slate-900 text-slate-200 text-[9px] p-3 rounded-xl overflow-x-auto text-left font-mono max-h-28 whitespace-pre-wrap">
                        {err.stack_trace}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'tickets' && (
        <div className="space-y-6 animate-in fade-in duration-200 text-right font-sans">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-150 rounded-2xl p-4 text-xs text-indigo-950 leading-relaxed flex items-start gap-2.5">
            <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-right">
              <h4 className="font-extrabold text-[13px] text-blue-900">سامانه پشتیبانی و تیکت‌های کاربران کدیار۲۴</h4>
              <p>این مرکز ارتباط هوشمند به کاربران و مشتریان اجازه می‌دهد تیکت‌های فنی یا مالی باز کنند. شما به عنوان پشتیبان می‌توانید مکالمات فعال را پیگیری کنید، به سؤالات تخصصی پاسخ دهید و وضعیت تیکت‌ها را مدیریت نمایید.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tickets List Section */}
            <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-slate-800">لیست تیکت‌ها</h3>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  {adminTicketsList.length} تیکت
                </span>
              </div>

              {/* Status Filter */}
              <div className="flex flex-wrap gap-1">
                {(['all', 'open', 'pending', 'resolved', 'closed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setAdminTicketFilter(st)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-all ${
                      adminTicketFilter === st
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st === 'all' ? 'همه' : st === 'open' ? 'باز' : st === 'pending' ? 'پاسخ داده شده' : st === 'resolved' ? 'حل شده' : 'بسته شده'}
                  </button>
                ))}
              </div>

              {/* Scrollable list */}
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                {adminTicketsLoading ? (
                  <div className="text-center py-10 text-xs text-slate-400">در حال دریافت تیکت‌ها...</div>
                ) : adminTicketsList.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">هیچ تیکتی وجود ندارد.</div>
                ) : (
                  adminTicketsList
                    .filter(t => adminTicketFilter === 'all' || t.status === adminTicketFilter)
                    .map((tk: any) => (
                      <div
                        key={tk.id}
                        onClick={() => setActiveAdminTicketId(tk.id)}
                        className={`p-3 border rounded-xl cursor-pointer text-right transition-all ${
                          activeAdminTicketId === tk.id
                            ? 'border-blue-500 bg-blue-50/25'
                            : 'border-slate-100 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-800 line-clamp-1">{tk.title || tk.subject}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-extrabold ${
                            tk.status === 'closed'
                              ? 'bg-slate-100 text-slate-500'
                              : tk.status === 'resolved'
                                ? 'bg-emerald-50 text-emerald-800'
                                : tk.status === 'pending'
                                  ? 'bg-blue-50 text-blue-800'
                                  : 'bg-amber-50 text-amber-850'
                          }`}>
                            {tk.status === 'closed' ? 'بسته' : tk.status === 'resolved' ? 'حل شده' : tk.status === 'pending' ? 'پاسخ داده شده' : 'در انتظار بررسی'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-2 flex justify-between items-center">
                          <span>بخش: {tk.category === 'technical' ? 'فنی' : tk.category === 'wallet' ? 'مالی کیف پول' : 'عمومی'}</span>
                          <span>اولویت: {tk.priority === 'high' ? '🔴 فوری' : tk.priority === 'medium' ? '🟡 متوسط' : '🟢 معمولی'}</span>
                        </div>
                        <div className="text-[9px] text-slate-400 mt-1 flex justify-between items-center border-t border-slate-50 pt-1.5 font-mono">
                          <span>کاربر: {tk.userName} ({tk.userPhone})</span>
                          <span>{new Date(tk.updatedAt).toLocaleDateString('fa-IR')}</span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Conversation/Thread Area */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-5 text-right flex flex-col justify-between min-h-[450px]">
              {(() => {
                const activeTicket = adminTicketsList.find(t => t.id === activeAdminTicketId);
                if (!activeTicket) {
                  return (
                    <div className="m-auto text-center space-y-2">
                      <MessageSquare className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-400">یک تیکت را برای مشاهده گفتگو و ارسال پاسخ انتخاب کنید.</p>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col h-full justify-between gap-4">
                    {/* Header */}
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-start flex-wrap gap-2">
                      <div className="space-y-1">
                        <span className="text-xs bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-full font-bold font-mono">تیکت #{activeTicket.id?.substring(0, 8)}</span>
                        <h4 className="font-extrabold text-sm text-slate-800 mt-1">{activeTicket.title || activeTicket.subject}</h4>
                        <p className="text-[10px] text-slate-400">کاربر: {activeTicket.userName} ({activeTicket.userPhone}) | آخرین بروزرسانی: {new Date(activeTicket.updatedAt).toLocaleString('fa-IR')}</p>
                      </div>

                      {/* Status Action controls */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10.5px] text-slate-500 font-bold ml-1">تغییر وضعیت:</span>
                        {(['open', 'resolved', 'closed'] as const).map((st) => (
                          <button
                            key={st}
                            onClick={() => handleAdminChangeStatus(activeTicket.id, st)}
                            className={`px-2 py-1 text-[9.5px] font-black rounded-lg transition-all cursor-pointer ${
                              activeTicket.status === st
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {st === 'open' ? 'بررسی مجدد' : st === 'resolved' ? 'حل شده' : 'بستن تیکت'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Messages Scrollbox */}
                    <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] text-xs p-2 bg-slate-50 rounded-2xl border border-slate-100">
                      {/* Initial description card */}
                      <div className="p-3 bg-blue-50/70 border border-blue-100/50 rounded-2xl space-y-1">
                        <div className="flex justify-between items-center text-[10px] text-blue-800 font-bold font-mono">
                          <span>شروع کننده گفتگو ({activeTicket.userName})</span>
                          <span>{new Date(activeTicket.createdAt).toLocaleString('fa-IR')}</span>
                        </div>
                        <p className="text-slate-800 leading-relaxed text-[11px] whitespace-pre-wrap">{activeTicket.description || activeTicket.message}</p>
                      </div>

                      {/* Messages Thread list */}
                      {activeTicket.messages && activeTicket.messages.map((m: any, mIdx: number) => {
                        const isStaff = m.sender === 'staff';
                        return (
                          <div
                            key={mIdx}
                            className={`p-3 rounded-2xl max-w-[85%] space-y-1 transition-all ${
                              isStaff
                                ? 'bg-indigo-600 text-white mr-auto border-l-4 border-indigo-500 rounded-tl-none'
                                : 'bg-white text-slate-800 ml-auto border border-slate-150 rounded-tr-none'
                            }`}
                          >
                            <div className={`flex justify-between items-center text-[9px] font-black ${
                              isStaff ? 'text-indigo-200' : 'text-slate-400'
                            }`}>
                              <span>{m.senderName} ({isStaff ? 'پشتیبان سیستم' : 'مشتری'})</span>
                              <span className="font-mono">{new Date(m.createdAt).toLocaleString('fa-IR')}</span>
                            </div>
                            <p className="leading-relaxed text-[10.5px] whitespace-pre-wrap">{m.text}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick message feedback status */}
                    {adminTicketStatusMsg && (
                      <p className="text-xs text-right animate-pulse transition-all font-bold text-emerald-650">{adminTicketStatusMsg}</p>
                    )}

                    {/* Reply Form */}
                    <form onSubmit={handleAdminSendReply} className="border-t border-slate-100 pt-3 space-y-2.5">
                      <div className="flex gap-2">
                        <textarea
                          required
                          rows={2}
                          value={adminReplyInput}
                          onChange={(e) => setAdminReplyInput(e.target.value)}
                          placeholder="پاسخ یا نظر فنی خود را برای کاربر ارسال نمایید..."
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all resize-none"
                        />
                        <button
                          type="submit"
                          disabled={submittingAdminReply}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:bg-slate-300"
                        >
                          {submittingAdminReply ? 'در حال ارسال...' : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              <span>ارسال</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'affiliate' && (
        <div className="bg-white rounded-2xl border border-slate-205 overflow-hidden p-5 animate-in fade-in duration-150 text-right space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">سامانه همکاری در فروش قطعات (Affiliate Products)</h3>
              <p className="text-slate-500 text-[11px] mt-1">
                مدیریت محصولات فروشگاه‌های همکار کدیار۲۴ جهت معرفی قطعات، لوازم جانبی و کسب درآمد از کمیسیون فروش.
              </p>
            </div>
            <button
              onClick={() => setIsAddAffiliateOpen(!isAddAffiliateOpen)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 transition-all text-right active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddAffiliateOpen ? 'بستن فرم ثبت' : 'افزودن محصول همکار'}</span>
            </button>
          </div>

          {isAddAffiliateOpen && (
            <form onSubmit={handleAddAffiliateProduct} className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-850 shadow-lg space-y-4">
              <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-blue-400 font-extrabold font-mono">NEW FILE DATA ENTRY</span>
                <h4 className="text-xs font-extrabold text-white">ثبت محصول همکاری در فروش جدید</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-300 text-[10.5px] font-bold mb-1">نام قطعه / عنوان کالا *</label>
                  <input
                    type="text"
                    required
                    placeholder="مانند: پمپ هیدرو کلیک پکیج، سنسور NTC، برد کنترل"
                    value={newAffiliateTitle}
                    onChange={(e) => setNewAffiliateTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-right font-sans"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[10.5px] font-bold mb-1">آدرس آیکون یا تصویر کالا (اختیاری)</label>
                  <input
                    type="url"
                    placeholder="لینک تصویر کالا یا رها کنید تا پیشفرض قرار گیرد"
                    value={newAffiliateImage}
                    onChange={(e) => setNewAffiliateImage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-left font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-300 text-[10.5px] font-bold mb-1">دسته‌بندی محصول *</label>
                  <select
                    required
                    value={newAffiliateCategory}
                    onChange={(e) => setNewAffiliateCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-right cursor-pointer"
                  >
                    <option value="">انتخاب دسته‌بندی...</option>
                    {categoriesList.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-[10.5px] font-bold mb-1">برند دستگاه *</label>
                  <select
                    required
                    value={newAffiliateBrand}
                    onChange={(e) => setNewAffiliateBrand(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-right cursor-pointer"
                  >
                    <option value="">انتخاب برند...</option>
                    {brandsList.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-[10.5px] font-bold mb-1">مدل دستگاه *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: ورونا پرلا ۲۴"
                    value={newAffiliateModel}
                    onChange={(e) => setNewAffiliateModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-right"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-300 text-[10.5px] font-bold mb-1">قیمت محصول (تومان)</label>
                  <input
                    type="number"
                    placeholder="مثال: 450000"
                    value={newAffiliatePrice || ''}
                    onChange={(e) => setNewAffiliatePrice(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white text-center font-mono focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[10.5px] font-bold mb-1">درصد کمیسیون فروش (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="مثال: 10"
                    value={newAffiliateCommission || ''}
                    onChange={(e) => setNewAffiliateCommission(Number(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white text-center font-mono focus:border-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-[10.5px] font-bold mb-1">لینک خرید همکاری (Affiliate Link) *</label>
                  <input
                    type="url"
                    required
                    placeholder="https://partnerstore.com/product/123"
                    value={newAffiliateLink}
                    onChange={(e) => setNewAffiliateLink(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white text-left font-mono focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-2.5 text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                >
                  ثبت قطعه همکاری در فروش
                </button>
              </div>
            </form>
          )}

          {/* Edit Affiliate Product Modal */}
          {editingAffiliateId && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-100">
              <div className="bg-slate-900 text-slate-100 rounded-3xl p-5 border border-slate-800 shadow-2xl max-w-2xl w-full text-right space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <button 
                    onClick={() => setEditingAffiliateId(null)}
                    className="text-slate-400 hover:text-white text-xs font-bold bg-slate-800 px-3 py-1.5 rounded-xl"
                  >
                    انصراف
                  </button>
                  <h4 className="text-xs font-extrabold text-white">ویرایش محصول همکاری در فروش</h4>
                </div>

                <form onSubmit={handleEditAffiliateProduct} className="space-y-4 text-xs font-bold">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-300 text-[10.5px] font-bold mb-1">نام قطعه / عنوان کالا *</label>
                      <input
                        type="text"
                        required
                        value={editAffiliateTitle}
                        onChange={(e) => setEditAffiliateTitle(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-right font-sans"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 text-[10.5px] font-bold mb-1">آدرس آیکون یا تصویر کالا (اختیاری)</label>
                      <input
                        type="url"
                        value={editAffiliateImage}
                        onChange={(e) => setEditAffiliateImage(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-left font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-300 text-[10.5px] font-bold mb-1">دسته‌بندی محصول *</label>
                      <select
                        required
                        value={editAffiliateCategory}
                        onChange={(e) => setEditAffiliateCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-right cursor-pointer"
                      >
                        {categoriesList.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 text-[10.5px] font-bold mb-1">برند دستگاه *</label>
                      <select
                        required
                        value={editAffiliateBrand}
                        onChange={(e) => setEditAffiliateBrand(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-right cursor-pointer"
                      >
                        {brandsList.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 text-[10.5px] font-bold mb-1">مدل دستگاه *</label>
                      <input
                        type="text"
                        required
                        value={editAffiliateModel}
                        onChange={(e) => setEditAffiliateModel(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 outline-none text-right"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-300 text-[10.5px] font-bold mb-1">قیمت محصول (تومان)</label>
                      <input
                        type="number"
                        value={editAffiliatePrice || ''}
                        onChange={(e) => setEditAffiliatePrice(Number(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white text-center font-mono focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 text-[10.5px] font-bold mb-1">درصد کمیسیون فروش (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editAffiliateCommission || ''}
                        onChange={(e) => setEditAffiliateCommission(Number(e.target.value) || 0)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white text-center font-mono focus:border-blue-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 text-[10.5px] font-bold mb-1">لینک خرید همکاری *</label>
                      <input
                        type="url"
                        required
                        value={editAffiliateLink}
                        onChange={(e) => setEditAffiliateLink(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white text-left font-mono focus:border-blue-500 outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-2.5 text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
                    >
                      ذخیره تغییرات محصول
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Affiliate Products Table */}
          {(!affiliateProducts || affiliateProducts.length === 0) ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 text-xs font-bold">هیچ محصول همکاری در فروش ثبت نشده است.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-3xs">
              <table className="w-full text-right text-xs font-bold text-slate-700">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-800 text-[11px] font-black">
                  <tr>
                    <th className="p-3">ردیف</th>
                    <th className="p-3">نام قطعه / کالا</th>
                    <th className="p-3">دسته‌بندی</th>
                    <th className="p-3">برند و مدل</th>
                    <th className="p-3">قیمت قطعه</th>
                    <th className="p-3">درصد کمیسیون</th>
                    <th className="p-3">لینک خرید</th>
                    <th className="p-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {affiliateProducts.map((p, index) => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-slate-400 font-mono">{index + 1}</td>
                      <td className="p-3 font-extrabold text-slate-900">
                        <div className="flex items-center gap-2">
                          <img
                            src={p.image || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23f1f5f9'/><text x='50' y='55' font-size='28' text-anchor='middle'>⚙️</text></svg>"}
                            alt={p.name || p.title || p.brand}
                            className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <span>{p.name || p.title || `${p.brand} ${p.model}`}</span>
                        </div>
                      </td>
                      <td className="p-3 text-blue-700">{p.category}</td>
                      <td className="p-3 text-slate-800">{p.brand} | {p.model}</td>
                      <td className="p-3 text-emerald-700 font-mono">{p.price ? `${p.price.toLocaleString('fa-IR')} تومان` : 'نامشخص'}</td>
                      <td className="p-3 text-amber-600 font-mono">%{p.commission || 0}</td>
                      <td className="p-3">
                        <a
                          href={p.link || p.purchaseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                        >
                          مشاهده لینک خرید ↗
                        </a>
                      </td>
                      <td className="p-3 text-center flex justify-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingAffiliateId(p.id);
                            setEditAffiliateTitle(p.title || p.name || '');
                            setEditAffiliateImage(p.image || '');
                            setEditAffiliateCategory(p.category);
                            setEditAffiliateBrand(p.brand);
                            setEditAffiliateModel(p.model);
                            setEditAffiliatePrice(p.price || 0);
                            setEditAffiliateLink(p.link || p.purchaseUrl || '');
                            setEditAffiliateCommission(p.commission || 0);
                          }}
                          className="bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white px-2.5 py-1 rounded-lg border border-amber-200 transition-all cursor-pointer text-[10px]"
                        >
                          ویرایش
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`آیا از حذف محصول همکاری در فروش "${p.name || p.title || p.brand + ' ' + p.model}" اطمینان دارید؟`)) {
                              if (onUpdateAffiliateProducts) {
                                const filtered = affiliateProducts.filter(x => x.id !== p.id);
                                onUpdateAffiliateProducts(filtered);
                              }
                            }
                          }}
                          className="bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white px-2.5 py-1 rounded-lg border border-rose-200 transition-all cursor-pointer text-[10px]"
                        >
                          حذف
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'featured_categories' && (
        <div className="bg-white rounded-2xl border border-slate-205 overflow-hidden p-5 animate-in fade-in duration-150 text-right space-y-6">
          <div>
            <h3 className="text-sm font-extrabold text-slate-800">مدیریت دسته‌بندی‌های پیشنهادی و تکنسین برتر</h3>
            <p className="text-slate-500 text-[11px] mt-1">
              در این بخش می‌توانید اولویت نمایش دسته‌بندی‌ها در اپلیکیشن اندروید را تنظیم کرده و تکنسین برتر (توصیه‌کننده اصلی) هر دسته را مشخص کنید.
            </p>
          </div>

          <div className="border border-slate-150 rounded-2xl overflow-hidden">
            <div className="p-3 bg-slate-50 text-xs font-bold text-slate-700 grid grid-cols-12 gap-2 border-b border-slate-150 text-right">
              <div className="col-span-1 text-center">اولویت</div>
              <div className="col-span-3">نام دسته‌بندی پیشنهادی</div>
              <div className="col-span-5">تکنسین برتر (توصیه‌کننده اصلی)</div>
              <div className="col-span-3 text-center">جابجایی و ترتیب</div>
            </div>

            <div className="divide-y divide-slate-100">
              {categoriesList.map((cat, index) => {
                const currentConfig = categoryConfig?.[cat] || {};
                const currentTopTechId = currentConfig.topTechId || '';

                return (
                  <div key={cat} className="p-3 grid grid-cols-12 gap-2 items-center text-xs font-bold text-slate-800 hover:bg-slate-50/50">
                    <div className="col-span-1 text-center font-mono bg-slate-100 rounded-lg py-1">{index + 1}</div>
                    <div className="col-span-3 font-extrabold text-blue-700">{cat}</div>
                    <div className="col-span-5">
                      <select
                        value={currentTopTechId}
                        onChange={(e) => {
                          const updatedConfig = {
                            ...(categoryConfig || {}),
                            [cat]: {
                              ...(categoryConfig?.[cat] || {}),
                              topTechId: e.target.value
                            }
                          };
                          onUpdateCategoryConfig(updatedConfig);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-bold text-slate-700 focus:border-blue-500 outline-none cursor-pointer"
                      >
                        <option value="">بدون تکنسین برتر (انتخاب خودکار سیستم)</option>
                        {technicians.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name} (امتیاز: {t.rating} | رضایت: {t.satisfactionRate || 98}%)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3 flex justify-center gap-1">
                      <button
                        disabled={index === 0}
                        onClick={() => {
                          const newList = [...categoriesList];
                          const temp = newList[index];
                          newList[index] = newList[index - 1];
                          newList[index - 1] = temp;
                          if (onUpdateCategoriesList) {
                            onUpdateCategoriesList(newList);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-all"
                        title="انتقال به بالا"
                      >
                        <ChevronUp className="w-4 h-4 text-slate-650" />
                      </button>
                      <button
                        disabled={index === categoriesList.length - 1}
                        onClick={() => {
                          const newList = [...categoriesList];
                          const temp = newList[index];
                          newList[index] = newList[index + 1];
                          newList[index + 1] = temp;
                          if (onUpdateCategoriesList) {
                            onUpdateCategoriesList(newList);
                          }
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer transition-all"
                        title="انتقال به پایین"
                      >
                        <ChevronDown className="w-4 h-4 text-slate-650" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-150 rounded-2xl p-4 text-xs text-blue-950 leading-relaxed flex items-start gap-2.5">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-right">
              <h4 className="font-extrabold text-[13px] text-blue-900">مرکز فرماندهی توسعه اطلاعات پایه و کدهای خطا</h4>
              <p>به عنوان مدیر عالی کدیار۲۴، در این بخش برای اولین بار به «موتور عمیق همه‌جانبه» متصل هستید. برای خلوت ماندن صفحه، کلیه اطلاعات اعم از انواع دستگاه‌ها، برندها، مدل‌ها، شهرها و مناطق و به همراه تمامی ارورها در یک نوار جستجوی زنده ادغام شده‌اند تا با کاربری فوق‌العاده سریع به حذف، ویرایش یا عیب‌یابی بپردازید.</p>
            </div>
          </div>

          {/* DEDICATED MOBILE APP DOWNLOAD LINK SETTINGS - REQUESTED BY USER */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 text-right space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 justify-start">
              <Smartphone className="w-5 h-5 text-emerald-600 animate-pulse" />
              <h3 className="font-extrabold text-sm text-slate-800">📲 مدیریت اختصاصی لینک دانلود اپلیکیشن موبایل</h3>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              لینک مستقیم فایل نصب اپلیکیشن اندروید یا نسخه PWA سامانه را در فیلد زیر قرار دهید. این آدرس روی تمامی دکمه‌های «دانلود اپلیکیشن» سراسر سایت به صورت زنده برای کاربران اعمال می‌شود.
            </p>

            <div className="space-y-2">
              <label className="block text-[11px] font-black text-slate-700 flex items-center gap-1 justify-start">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                لینک دانلود فایل اپلیکیشن (APK / Direct URL):
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={pgAppDownloadUrl}
                  onChange={(e) => setPgAppDownloadUrl(e.target.value)}
                  placeholder="مثال: https://kodyar24.ir/download/app.apk"
                  className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white text-left focus:border-emerald-500 transition-all font-mono font-semibold"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdatePageContents) {
                      onUpdatePageContents({
                        aboutUs: pgAboutUs.trim(),
                        contactUs: pgContactUs.trim(),
                        rules: pgRules.trim(),
                        dispute: pgDispute.trim(),
                        appDownloadUrl: pgAppDownloadUrl.trim()
                      });
                      alert('✅ لینک دانلود مستقیم اپلیکیشن با موفقیت ذخیره و در سراسر سامانه منتشر شد.');
                    }
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl px-5 py-2.5 text-xs transition-all cursor-pointer hover:shadow-md active:scale-95 shrink-0"
                >
                  ذخیره و به روز رسانی لینک اپلیکیشن
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                💡 پیشنهاد می‌شود لینک را به صورت <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-600 text-[10px]">https://kodyar24.ir/download/app.apk</code> قرار دهید و فایل APK خود را در پوشه download هاست آپلود نمایید.
              </p>
            </div>
          </div>

          {/* INFORMATIONAL PAGES CONTENT WRITER */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 text-right space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 justify-start">
              <FileCheck className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-sm text-slate-800">مدیریت محتوای متنی صفحات اطلاع‌رسانی فوتر (درباره ما، قوانین و راهنماها)</h3>
            </div>

            <p className="text-[11px] text-slate-505 leading-relaxed">
              از طریق این پنل ویژه ادمین می‌توانید محتوای متنی صفحاتی که از پایین‌ترین بخش سایت (فوتر) در اختیار کاربران و تکنسین‌ها قرار دارد را به دلخواه بازنویسی نمایید. این تغییرات فوراً و به صورت زنده بر روی فرانت‌اند ذخیره و همگام‌سازی می‌شود.
            </p>

            {pageStatusMsg && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-xl text-xs font-bold text-center">
                {pageStatusMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* About Us editing */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-705 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  متن صفحه درباره ما (معرفی مجتمع فنی و اهداف خدمت):
                </label>
                <textarea
                  id="admin-pg-about-us"
                  rows={4}
                  value={pgAboutUs}
                  onChange={(e) => setPgAboutUs(e.target.value)}
                  placeholder="محتوای متنی درباره ما..."
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white text-right focus:border-indigo-505 transition-all font-semibold"
                />
              </div>

              {/* Contact Us Details */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-705 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  جزئیات تماس رسمی (تلفن‌ها، آدرس فیزیکی دفتر مرکزی و پست الکترونیک):
                </label>
                <textarea
                  id="admin-pg-contact-us"
                  rows={4}
                  value={pgContactUs}
                  onChange={(e) => setPgContactUs(e.target.value)}
                  placeholder="اطلاعات تماس دفتری..."
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white text-right focus:border-indigo-550 transition-all font-semibold"
                />
              </div>

              {/* Rules & Regulations */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-705 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  قوانین و ضوابط عمومی کدیار۲۴:
                </label>
                <textarea
                  id="admin-pg-rules"
                  rows={4}
                  value={pgRules}
                  onChange={(e) => setPgRules(e.target.value)}
                  placeholder="قوانین کلی استفاده از پلتفرم..."
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white text-right focus:border-indigo-550 transition-all font-semibold"
                />
              </div>

              {/* Dispute Resolution Guidelines */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-black text-slate-705 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  راهنما و فرآیند حل اختلاف / ممیزی فاکتور و شکایت صنف:
                </label>
                <textarea
                  id="admin-pg-dispute"
                  rows={4}
                  value={pgDispute}
                  onChange={(e) => setPgDispute(e.target.value)}
                  placeholder="دستورالعمل داوری فاکتور و حل اختلاف مالی..."
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white text-right focus:border-indigo-505 transition-all font-semibold"
                />
              </div>

              {/* App Download Link */}
              <div className="space-y-1.5 md:col-span-2 text-right">
                <label className="block text-[11px] font-black text-slate-700 flex items-center gap-1 justify-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  لینک دانلود مستقیم اپلیکیشن موبایل برای بازدیدکنندگان (Android/PWA/Direct Link):
                </label>
                <input
                  id="admin-pg-app-download-url"
                  type="text"
                  value={pgAppDownloadUrl}
                  onChange={(e) => setPgAppDownloadUrl(e.target.value)}
                  placeholder="https://example.com/app.apk"
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white text-left focus:border-indigo-500 transition-all font-mono font-semibold"
                />
                <p className="text-[9px] text-slate-400">کاربران عادی با کلیک روی دکمه‌های دانلود در هدر و بدنه سایت به این آدرس هدایت خواهند شد.</p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onUpdatePageContents) {
                    onUpdatePageContents({
                      aboutUs: pgAboutUs.trim(),
                      contactUs: pgContactUs.trim(),
                      rules: pgRules.trim(),
                      dispute: pgDispute.trim(),
                      appDownloadUrl: pgAppDownloadUrl.trim()
                    });
                    setPageStatusMsg('✅ متون اطلاع‌رسانی و لینک دانلود اپ با موفقیت در بانک مرکزی بروز شد.');
                    setTimeout(() => setPageStatusMsg(''), 4000);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl px-5 py-2.5 text-xs transition-all cursor-pointer hover:shadow-md active:scale-95"
              >
                ذخیره و انتشار برخط صفحات راهنما و لینک اپلیکیشن
              </button>
            </div>
          </div>

          {/* ANNOUNCEMENT CONFIGURATION SECTION */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 text-right space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 justify-start">
              <Megaphone className="w-5 h-5 text-blue-600" />
              <h3 className="font-extrabold text-sm text-slate-800">تنظیمات اطلاعیه و پیام سراسری بالای سایت برای کاربران</h3>
            </div>
            
            <p className="text-[11px] text-slate-500 leading-relaxed">
              با استفاده از این بخش می‌توانید پیام‌های سراسری، هشدارها یا خوش‌آمدگویی دلخواه خود را در صفحه اول سامانه برای تمامی مراجعین (کاربران، تکنسین‌ها و...) با امکان بستن نمایش دهید.
            </p>

            {annStatusMsg && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-xl text-xs font-bold text-center">
                {annStatusMsg}
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">✍️ متن پیام اطلاعیه یا اعلان:</label>
                <textarea
                  id="admin-announcement-text"
                  rows={2}
                  value={annTxt}
                  onChange={(e) => setAnnTxt(e.target.value)}
                  placeholder="مثال: مشتریان گرامی، به مناسبت عید غدیر خم، تمامی سرویس‌های نصب و عیب‌یابی پکیج و کولر گازی تا انتهای هفته جاری شامل ۱۰٪ تخفیف خواهند بود."
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white text-right font-sans focus:border-blue-500 transition-all font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700">🎨 نوع و رنگ‌بندی قاب پیام اطلاعیه:</label>
                  <select
                    value={annStyle}
                    onChange={(e) => setAnnStyle(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none font-bold"
                  >
                    <option value="info">🔵 آبی (اطلاع‌رسانی عمومی و اخبار جدید)</option>
                    <option value="warning">🟡 زرد (هشدار موقت و نکات فنی مهم)</option>
                    <option value="success">🟢 سبز (پیشنهادات ویژه و تبریکات مناسبتی)</option>
                    <option value="danger">🔴 قرمز (اطلاعیه خیلی فوری / اختلال یا تعمیرات زیرساخت)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end h-full pt-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <span className="text-xs font-bold text-slate-700">🔔 وضعیت نمایش اطلاعیه در بالای سایت برای همگان فعال باشد:</span>
                    <input
                      type="checkbox"
                      checked={annIsActive}
                      onChange={(e) => setAnnIsActive(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-550"
                    />
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (onUpdateAdminAnnouncement) {
                      onUpdateAdminAnnouncement({
                        text: annTxt,
                        isActive: annIsActive,
                        style: annStyle
                      });
                      setAnnStatusMsg('✅ تغییرات پیام سراسری سایت با موفقیت ذخیره شد و در بالای سایت اعمال گردید.');
                      setTimeout(() => setAnnStatusMsg(''), 5000);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-[97%]"
                >
                  ذخیره و فعال‌سازی سراسری اعلان
                </button>
              </div>
            </div>
          </div>

          {/* SITE SUPPORT PHONE CONFIGURATION SECTION */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 text-right space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 justify-start">
              <Phone className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-800 font-sans">تنظیمات شماره پشتیبانی سایت (بالای سایت)</h3>
            </div>
            
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              در این بخش می‌توانید شماره تماس پشتیبانی یا تلفن فوری پلتفرم را تعیین کنید تا در بالاترین بخش وب‌سایت (نوار پیمایش) پیش چشم تمامی کاربران قرار گیرد.
            </p>

            {phoneStatusMsg && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-xl text-xs font-bold text-center font-sans">
                {phoneStatusMsg}
              </div>
            )}

            <div className="space-y-4 text-right">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-700">📞 شماره تماس پشتیبانی رسمی:</label>
                <input
                  id="admin-support-phone"
                  type="text"
                  value={sPhone}
                  onChange={(e) => setSPhone(e.target.value)}
                  placeholder="مثال: ۱۸۴۰ یا ۰۲۱-۹۱۰۰۱۹۰۰"
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white text-right font-sans focus:border-emerald-500 transition-all font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onUpdateSupportPhone) {
                    onUpdateSupportPhone(sPhone);
                    setPhoneStatusMsg('✅ شماره پشتیبانی سایت با موفقیت به روز گردید و در هدر سایت ثبت شد.');
                    setTimeout(() => setPhoneStatusMsg(''), 5000);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-[97%] font-sans"
              >
                ذخیره شماره پشتیبانی سایت
              </button>
            </div>
          </div>

          {/* TRUST BADGES CONFIGURATION SECTION */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-6 text-right space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 justify-start">
              <Shield className="w-5 h-5 text-indigo-600" />
              <h3 className="font-extrabold text-sm text-slate-800 font-sans">تنظیمات نمادهای اعتماد و مجوزهای پلتفرم (فوتر سایت)</h3>
            </div>
            
            <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
              در این بخش می‌توانید آدرس اینترنتی (لینک) و همچنین آدرس تصویر نمادهای اعتماد خود (مانند ای‌نماد، ساماندهی یا مجوزهای مشابه) را تنظیم نمایید تا در دو جایگاه مشخص در فوتر وب‌سایت نمایش داده شوند. در صورت خالی بودن آدرس تصویر، نمادها در قاب امنیتی طراحی‌شده نمایش داده خواهند شد.
            </p>

            {badgesStatusMsg && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-3 rounded-xl text-xs font-bold text-center font-sans">
                {badgesStatusMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-2">
              {/* Badge 1 (e.g. eNamad) */}
              <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 font-sans">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  نماد اعتماد اول (مثال: ای‌نماد)
                </div>
                <div className="space-y-1 text-right">
                  <label className="block text-[10px] text-slate-500 font-bold font-sans">🔗 لینک مقصد (کلیک روی نماد):</label>
                  <input
                    id="admin-b1-link"
                    type="text"
                    value={b1Link}
                    onChange={(e) => setB1Link(e.target.value)}
                    placeholder="https://enamad.ir/..."
                    className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none text-left font-mono"
                  />
                </div>
                <div className="space-y-1 text-right">
                  <label className="block text-[10px] text-slate-500 font-bold font-sans">🖼️ آدرس تصویر لوگوی پیوند:</label>
                  <input
                    id="admin-b1-img"
                    type="text"
                    value={b1Img}
                    onChange={(e) => setB1Img(e.target.value)}
                    placeholder="https://example.com/enamad.png"
                    className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none text-left font-mono"
                  />
                </div>
              </div>

              {/* Badge 2 (e.g. Samandehi) */}
              <div className="border border-slate-100 p-4 rounded-2xl bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-700 font-sans">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  نماد اعتماد دوم (مثال: ساماندهی)
                </div>
                <div className="space-y-1 text-right">
                  <label className="block text-[10px] text-slate-500 font-bold font-sans">🔗 لینک مقصد (کلیک روی نماد):</label>
                  <input
                    id="admin-b2-link"
                    type="text"
                    value={b2Link}
                    onChange={(e) => setB2Link(e.target.value)}
                    placeholder="https://samandehi.ir/..."
                    className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none text-left font-mono"
                  />
                </div>
                <div className="space-y-1 text-right">
                  <label className="block text-[10px] text-slate-500 font-bold font-sans">🖼️ آدرس تصویر لوگوی پیوند:</label>
                  <input
                    id="admin-b2-img"
                    type="text"
                    value={b2Img}
                    onChange={(e) => setB2Img(e.target.value)}
                    placeholder="https://example.com/samandehi.png"
                    className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none text-left font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onUpdateTrustBadges) {
                    onUpdateTrustBadges({
                      badge1Link: b1Link,
                      badge1Image: b1Img,
                      badge2Link: b2Link,
                      badge2Image: b2Img
                    });
                    setBadgesStatusMsg('✅ تغییرات جاهای درج نماد اعتماد با موفقیت ذخیره شد.');
                    setTimeout(() => setBadgesStatusMsg(''), 5000);
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 text-xs font-extrabold transition-all cursor-pointer shadow-xs active:scale-[97%] font-sans"
              >
                ذخیره نمادها و مجوزهای الکترونیکی
              </button>
            </div>
          </div>

          {/* SECTION A: SMART GRAPHICAL UNIFIED SEARCH SEARCH ENGINE */}
          <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden text-right border border-slate-800">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl" />
            <div className="relative z-10 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-blue-400 font-mono">CORE GLOBAL SEARCH ENGINE</span>
                <h3 className="text-sm font-extrabold">موتور جستجوی همه‌جانبه اطلاعات و کدهای خطا (پیشگیری از شلوغی)</h3>
                <p className="text-[11px] text-slate-400">کافیست بنویسید «پکیج»، «بوتان» یا «E01» تا نوع دستگاه، برندها، مدل‌ها، شهرها و ارورهای مرتبط فوراً با قابلیت کنترل و حذف سریع استخراج شوند.</p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={globalConfigSearch}
                  onChange={(e) => setGlobalConfigSearch(e.target.value)}
                  placeholder="✍️ عبارتی جستجو کنید... (مثال: پکیج دیواری، اصفهان، کدهای لباسشویی، رونیا، بوتان)"
                  className="w-full bg-slate-950/80 border border-slate-700/80 placeholder-slate-500 rounded-2xl py-3.5 pr-11 pl-4 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-bold text-slate-100"
                />
                <Search className="w-5 h-5 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2" />
                {globalConfigSearch && (
                  <button
                    onClick={() => setGlobalConfigSearch('')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition-all"
                  >
                    پاک کردن
                  </button>
                )}
              </div>

              {globalConfigSearch && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md font-mono">نتایج زنده منطبق:</span>
                  {matchedCategories.length > 0 && <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 rounded-md font-bold">دسته‌بندی ({matchedCategories.length})</span>}
                  {matchedBrands.length > 0 && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 rounded-md font-bold">برند ({matchedBrands.length})</span>}
                  {matchedModels.length > 0 && <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 rounded-md font-bold">مدل ({matchedModels.length})</span>}
                  {matchedCitiesAndRegions.length > 0 && <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 rounded-md font-bold">موقعیت‌ها ({matchedCitiesAndRegions.length})</span>}
                  {matchedTechnicians.length > 0 && <span className="text-[10px] bg-slate-500/20 text-slate-400 px-2 rounded-md font-bold">تکنسین‌ها ({matchedTechnicians.length})</span>}
                  {matchedSpareParts.length > 0 && <span className="text-[10px] bg-sky-500/20 text-sky-400 px-2 rounded-md font-bold">محصولات ({matchedSpareParts.length})</span>}
                  {matchedErrors.length > 0 && <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 rounded-md font-bold">کدهای خطا ({matchedErrors.length})</span>}
                  
                  {matchedCategories.length === 0 && matchedBrands.length === 0 && matchedModels.length === 0 && matchedCitiesAndRegions.length === 0 && matchedErrors.length === 0 && matchedTechnicians.length === 0 && matchedSpareParts.length === 0 && (
                    <span className="text-[10px] text-rose-400 font-extrabold bg-rose-500/10 px-2.5 py-0.5 rounded-md">هیچ موردی هماهنگ با جستجو یافت نشد.</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* LIVE SEARCH RESULTS DISPLAY SCREEN (Only triggers if search is not empty) */}
          {globalConfigSearch && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 space-y-6 text-right animate-in slide-in-from-top duration-300">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs bg-indigo-600 text-white rounded-full px-3 py-1 font-extrabold font-sans">نتایج پردازش به تفکیک ساختار</span>
                <h4 className="font-extrabold text-sm text-slate-800">بررسی همپوشانی و رکوردهای یافت شده</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                
                {/* 1. Categories Found */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <h5 className="font-extrabold text-xs text-blue-800 border-b border-blue-50 pb-1.5 mb-2 flex items-center justify-between">
                    <span>📂 نوع تجهیزات و دستگاه‌ها</span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal">({matchedCategories.length})</span>
                  </h5>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {matchedCategories.map(cat => (
                      <div key={cat} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl text-xs font-bold text-slate-700">
                        <span>{cat}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAutofillInsertForm(cat, undefined, undefined)}
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-2 py-0.5 rounded text-[9px] transition-all"
                            title="قرار دادن در فرم درج"
                          >
                            درج ارور
                          </button>
                          <button
                            onClick={() => handleRemoveCategory(cat)}
                            className="text-rose-600 hover:text-rose-800 font-bold px-1"
                            title="حذف"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    {matchedCategories.length === 0 && (
                      <span className="text-[10px] text-slate-400 block p-2">موردی یافت نشد.</span>
                    )}
                  </div>
                </div>

                {/* 2. Brands Found */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <h5 className="font-extrabold text-xs text-emerald-800 border-b border-emerald-50 pb-1.5 mb-2 flex items-center justify-between">
                    <span>🏷️ برندهای لوازم خانگی</span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal">({matchedBrands.length})</span>
                  </h5>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {matchedBrands.map(br => (
                      <div key={br} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl text-xs font-bold text-slate-700">
                        <span>{br}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAutofillInsertForm(undefined, br, undefined)}
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-2 py-0.5 rounded text-[9px] transition-all"
                            title="قرار دادن در فرم درج"
                          >
                            درج ارور
                          </button>
                          <button
                            onClick={() => handleRemoveBrand(br)}
                            className="text-rose-600 hover:text-rose-800 font-bold px-1"
                            title="حذف"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    {matchedBrands.length === 0 && (
                      <span className="text-[10px] text-slate-400 block p-2">موردی یافت نشد.</span>
                    )}
                  </div>
                </div>

                {/* 3. Models Found */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <h5 className="font-extrabold text-xs text-indigo-800 border-b border-indigo-50 pb-1.5 mb-2 flex items-center justify-between">
                    <span>💡 سری و مدل‌ها (هم‌پوشان)</span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal">({matchedModels.length})</span>
                  </h5>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {matchedModels.map(m => (
                      <div key={m} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl text-xs font-bold text-slate-700">
                        <span className="truncate max-w-[120px]" title={m}>{m}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAutofillInsertForm(undefined, undefined, m)}
                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-2 py-0.5 rounded text-[9px] transition-all"
                            title="قرار دادن در فرم درج"
                          >
                            درج ارور
                          </button>
                          <button
                            onClick={() => handleRemoveModel(m)}
                            className="text-rose-600 hover:text-rose-800 font-bold px-1"
                            title="حذف"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    {matchedModels.length === 0 && (
                      <span className="text-[10px] text-slate-400 block p-2">موردی یافت نشد.</span>
                    )}
                  </div>
                </div>

                {/* 4. Cities & Locations Found */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <h5 className="font-extrabold text-xs text-amber-800 border-b border-amber-50 pb-1.5 mb-2 flex items-center justify-between">
                    <span>📍 شهرهای تحت پوشش و مناطق</span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal">({matchedCitiesAndRegions.length})</span>
                  </h5>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {matchedCitiesAndRegions.map((loc, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl text-xs font-bold text-slate-705">
                        <span className="truncate">
                          {loc.cityName}{loc.regionName ? ` ← ${loc.regionName}` : ''}
                        </span>
                        <button
                          onClick={() => {
                            if (loc.regionName) {
                              handleRemoveRegion(loc.cityName, loc.regionName);
                            } else {
                              handleRemoveCity(loc.cityName);
                            }
                          }}
                          className="text-rose-600 hover:text-rose-850 font-bold mx-1 text-[11px]"
                          title="حذف نهایی"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    {matchedCitiesAndRegions.length === 0 && (
                      <span className="text-[10px] text-slate-400 block p-2">موردی یافت نشد.</span>
                    )}
                  </div>
                </div>

                {/* 5. Technicians Found */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <h5 className="font-extrabold text-xs text-indigo-800 border-b border-indigo-50 pb-1.5 mb-2 flex items-center justify-between">
                    <span>👥 پرونده‌ی تکنسین‌ها</span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal font-bold">({matchedTechnicians.length})</span>
                  </h5>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {matchedTechnicians.map(t => (
                      <div key={t.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl text-xs font-bold text-slate-705">
                        <span className="truncate pr-1" title={t.name}>{t.name}</span>
                        {onUpdateTechniciansList && (
                          <button
                            onClick={() => {
                              triggerSafeConfirm(
                                'حذف حساب تکنسین',
                                `آیا از حذف پرونده تکنسین "${t.name}" اطمینان قلبی دارید؟ حساب وی مسدود خواهد شد.`,
                                () => {
                                  const filtered = technicians.filter(tech => tech.id !== t.id);
                                  onUpdateTechniciansList(filtered);
                                  alert(`پرونده تکنسین "${t.name}" با موفقیت برای همیشه حذف گردید.`);
                                }
                              );
                            }}
                            className="text-rose-600 hover:text-rose-850 font-black px-1.5 text-xs cursor-pointer"
                            title="حذف حساب"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    {matchedTechnicians.length === 0 && (
                      <span className="text-[10px] text-slate-405 block p-2">موردی یافت نشد.</span>
                    )}
                  </div>
                </div>

                {/* 6. Spare Parts Found */}
                <div className="bg-white p-4 rounded-2xl border border-slate-200">
                  <h5 className="font-extrabold text-xs text-emerald-800 border-b border-emerald-50 pb-1.5 mb-2 flex items-center justify-between">
                    <span>📦 محصولات فروشگاه</span>
                    <span className="text-[10px] text-slate-400 font-sans font-normal font-bold">({matchedSpareParts.length})</span>
                  </h5>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {matchedSpareParts.map(p => (
                      <div key={p.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-xl text-xs font-bold text-slate-705">
                        <span className="truncate pr-1" title={p.name}>{p.name}</span>
                        {onUpdateSparePartsList && (
                          <button
                            onClick={() => {
                              triggerSafeConfirm(
                                'حذف محصول فروشگاه',
                                `آیا از حذف دائم محصول/قطعه "${p.name}" از دیتابیس بورس قطعات مطمئن هستید؟`,
                                () => {
                                  const filtered = spareParts.filter(part => part.id !== p.id);
                                  onUpdateSparePartsList(filtered);
                                  alert(`محصول/قطعه "${p.name}" با موفقیت حذف گردید.`);
                                }
                              );
                            }}
                            className="text-rose-600 hover:text-rose-850 font-black px-1.5 text-xs cursor-pointer"
                            title="حذف محصول"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    {matchedSpareParts.length === 0 && (
                      <span className="text-[10px] text-slate-405 block p-2">موردی یافت نشد.</span>
                    )}
                  </div>
                </div>

              </div>

              {/* 5. Error Codes Search Results Display */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/90 space-y-3">
                <span className="block text-xs font-extrabold text-rose-800">🛠️ کدهای خطای سراسری منطبق با جستجو ({matchedErrors.length} مورد)</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[350px] overflow-y-auto p-1 bg-slate-50/50 rounded-xl">
                  {matchedErrors.map((err) => (
                    <div key={err.id} className="bg-white border border-slate-200 hover:border-blue-400 p-4 rounded-xl space-y-3 transition-all relative">
                      <div className="flex items-start justify-between gap-1.5">
                        <div>
                          <span className="bg-slate-100 text-slate-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold">{err.code}</span>
                          <h6 className="font-extrabold text-xs text-slate-800 mt-1">{err.title}</h6>
                        </div>
                        <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-extrabold">{err.category} / {err.brand}</span>
                      </div>

                      <div className="space-y-1 text-[10px] text-slate-550 leading-relaxed border-t border-slate-100 pt-2">
                        <p className="font-bold">سازگاری: {err.model}</p>
                        <p className="line-clamp-2">تشخیص علت: {err.description}</p>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100 mt-1">
                        <button
                          onClick={() => {
                            setDirCode(err.code);
                            setDirTitle(err.title);
                            setDirCategory(err.category);
                            setDirBrand(err.brand);
                            setDirModel(err.model);
                            setDirReason(err.causes?.[0] || err.description);
                            setDirSolution(err.steps?.[0] || 'مراجعه به تکنسین');
                            const formElement = document.getElementById('direct-error-insert-form');
                            if (formElement) formElement.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2.5 py-1 rounded text-[10px] font-bold"
                          type="button"
                        >
                          رونویسی و بارگذاری اطلاعات
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingError(err)}
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded text-[10px] font-bold"
                        >
                          ویرایش سریع دستی
                        </button>
                        <button
                          type="button"
                          onClick={() => onRejectErrorCode(err.id)}
                          className="bg-rose-50 text-rose-700 hover:bg-rose-100 px-2.5 py-1 rounded text-[10px] font-bold"
                        >
                          حذف نهایی ارور
                        </button>
                      </div>
                    </div>
                  ))}
                  {matchedErrors.length === 0 && (
                    <div className="col-span-2 text-center text-xs text-slate-400 p-8">هیچ عیب و کدی مطابق با جستجوی شما پیدا نشد.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* QUICK HAND EDIT OVERLAY DIALOG */}
          {editingError && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 text-right">
                <form onSubmit={handleSaveQuickEditError}>
                  <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                    <button type="button" onClick={() => setEditingError(null)} className="text-white hover:text-rose-400 font-bold">✕</button>
                    <h4 className="font-extrabold text-sm flex items-center gap-1">
                      <span>⚙️ اصلاح زنده مشخصات ارور {editingError.code}</span>
                    </h4>
                  </div>

                  <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-700">کد برخط</label>
                        <input
                          type="text"
                          value={editingError.code}
                          onChange={(e) => setEditingError({ ...editingError, code: e.target.value })}
                          className="w-full bg-slate-50 border p-2.5 text-xs rounded-xl mt-1 font-mono text-left outline-none focus:bg-white focus:border-blue-550"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700">عنوان و مفهوم عیب</label>
                        <input
                          type="text"
                          value={editingError.title}
                          onChange={(e) => setEditingError({ ...editingError, title: e.target.value })}
                          className="w-full bg-slate-50 border p-2.5 text-xs rounded-xl mt-1 font-bold outline-none focus:bg-white focus:border-blue-555"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-705">نوع دستگاه (Category)</label>
                        <input
                          type="text"
                          value={editingError.category}
                          onChange={(e) => setEditingError({ ...editingError, category: e.target.value })}
                          className="w-full bg-slate-50 border p-2.5 text-xs rounded-xl mt-1 outline-none focus:bg-white focus:border-blue-555"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-705">برند سازنده (Brand)</label>
                        <input
                          type="text"
                          value={editingError.brand}
                          onChange={(e) => setEditingError({ ...editingError, brand: e.target.value })}
                          className="w-full bg-slate-50 border p-2.5 text-xs rounded-xl mt-1 outline-none focus:bg-white focus:border-blue-555"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700">مدل‌های مشمول</label>
                      <input
                        type="text"
                        value={editingError.model}
                        onChange={(e) => setEditingError({ ...editingError, model: e.target.value })}
                        className="w-full bg-slate-50 border p-2.5 text-xs rounded-xl mt-1 outline-none focus:bg-white focus:border-blue-555"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700">علت فنی یا تشریحی کلی خرابی (Description)</label>
                      <textarea
                        rows={2}
                        value={editingError.description || ''}
                        onChange={(e) => setEditingError({ ...editingError, description: e.target.value })}
                        className="w-full bg-slate-50 border p-2.5 text-xs rounded-xl mt-1 leading-relaxed outline-none focus:bg-white focus:border-blue-555"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700">دلایل شایع و علت‌های احتمالی (Causes - هر مورد در یک سطر)</label>
                      <textarea
                        rows={2}
                        value={Array.isArray(editingError.causes) ? editingError.causes.join('\n') : (editingError.causes || '')}
                        onChange={(e) => setEditingError({ ...editingError, causes: e.target.value.split('\n') })}
                        placeholder="مثال:&#10;افت ولتاژ شبکه‌ی برق&#10;خرابی برد الکترونیک"
                        className="w-full bg-slate-50 border p-2.5 text-xs rounded-xl mt-1 leading-relaxed outline-none focus:bg-white focus:border-blue-555"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700">راهکار و مراحل رفع عیب گام‌به‌گام (Steps - هر مرحله در یک سطر)</label>
                      <textarea
                        rows={3}
                        value={Array.isArray(editingError.steps) ? editingError.steps.join('\n') : (editingError.steps || '')}
                        onChange={(e) => setEditingError({ ...editingError, steps: e.target.value.split('\n') })}
                        placeholder="مثال:&#10;۱. بررسی شیر ورودی آب&#10;۲. تست برد و هیدرواستات"
                        className="w-full bg-slate-50 border p-2.5 text-xs rounded-xl mt-1 leading-relaxed outline-none focus:bg-white focus:border-blue-555"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-700">هشدارها و نکات ایمنی (Precautions - هر نکته در یک سطر)</label>
                      <textarea
                        rows={2}
                        value={Array.isArray(editingError.precautions) ? editingError.precautions.join('\n') : (editingError.precautions || '')}
                        onChange={(e) => setEditingError({ ...editingError, precautions: e.target.value.split('\n') })}
                        placeholder="مثال:&#10;قبل از کار، دوشاخه برق را از پریز بکشید.&#10;از محافظ برق استاندارد استفاده کنید."
                        className="w-full bg-slate-50 border p-2.5 text-xs rounded-xl mt-1 leading-relaxed outline-none focus:bg-white focus:border-blue-555"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-700">سطح خطرات ایمنی و فنی (Hazard Level)</label>
                        <select
                          value={editingError.hazardLevel || 'medium'}
                          onChange={(e) => setEditingError({ ...editingError, hazardLevel: e.target.value as any })}
                          className="w-full bg-slate-50 border p-2.5 text-xs rounded-xl mt-1 outline-none focus:bg-white focus:border-blue-555 font-bold"
                        >
                          <option value="low">کم‌خطر (Low)</option>
                          <option value="medium">متوسط / نیازمند احتیاط (Medium)</option>
                          <option value="high">پرخطر / قطع برق و گاز (High)</option>
                          <option value="critical">بحرانی / خطر برق‌گرفتگی یا انفجار (Critical)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-700">لینک فیلم آموزشی عیب‌یابی (ویدیو)</label>
                        <input
                          type="text"
                          value={editingError.video_url || ''}
                          onChange={(e) => setEditingError({ ...editingError, video_url: e.target.value })}
                          placeholder="مانند: https://www.aparat.com/v/XXXXX"
                          className="w-full bg-slate-50 border p-2.5 text-xs rounded-xl mt-1 outline-none focus:bg-white focus:border-blue-555 text-left font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 border-t flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingError(null)}
                      className="bg-slate-205 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                    >
                      بستن و انصراف
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer"
                    >
                      اعمال تغییرات فوری دیتابیس
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* BULK EDIT GROUP OVERLAY DIALOG */}
          {bulkEditingGroup && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 text-right">
                <div className="bg-slate-900 text-slate-100 p-5 flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-wider text-sky-400 font-bold uppercase">Bulk Group Editor</span>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>✏️ اصلاح همزمان گروه کدهای خطا ({bulkEditingGroup.errors.length} مورد)</span>
                  </h4>
                </div>

                <div className="p-6 space-y-4 text-right">
                  <div className="bg-sky-50 border border-sky-100 p-3 rounded-xl text-[10.5px] text-sky-900 leading-relaxed">
                    با تغییر مقادیر زیر، دسته‌بندی، برند و مدل برای <strong>هر {bulkEditingGroup.errors.length} کد خطای موجود</strong> در این گروه، به طور همزمان بروزرسانی خواهد شد.
                  </div>

                  {/* Category Field */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-700 block">📂 نوع دستگاه (دسته‌بندی):</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl mt-1 outline-none focus:bg-white focus:border-blue-500 font-bold text-right"
                      value={bulkEditNewCategory}
                      onChange={(e) => setBulkEditNewCategory(e.target.value)}
                      placeholder="مانند: ماشین لباسشویی"
                    />
                  </div>

                  {/* Brand Field */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-700 block">🏷️ برند دستگاه:</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl mt-1 outline-none focus:bg-white focus:border-blue-500 font-bold text-right"
                      value={bulkEditNewBrand}
                      onChange={(e) => setBulkEditNewBrand(e.target.value)}
                      placeholder="مانند: اسنوا"
                    />
                  </div>

                  {/* Model Field */}
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-700 block">📌 مدل (یا کل مدل‌ها/عمومی):</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 text-xs rounded-xl mt-1 outline-none focus:bg-white focus:border-blue-500 font-bold text-right"
                      value={bulkEditNewModel}
                      onChange={(e) => setBulkEditNewModel(e.target.value)}
                      placeholder="مانند: عمومی، یا مدل خاص"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border-t flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkEditingGroup(null)}
                    className="bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    بستن و انصراف
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const idsToUpdate = bulkEditingGroup.errors.map(e => e.id);
                      const catVal = bulkEditNewCategory.trim();
                      const brandVal = bulkEditNewBrand.trim();
                      const modelVal = bulkEditNewModel.trim() || 'عمومی';

                      if (!catVal || !brandVal) {
                        alert('لطفا فیلدهای دسته‌بندی و برند را خالی نگذارید.');
                        return;
                      }

                      const updated = errorCodes.map(err => {
                        if (idsToUpdate.includes(err.id)) {
                          return {
                            ...err,
                            category: catVal,
                            brand: brandVal,
                            model: modelVal
                          };
                        }
                        return err;
                      });

                      onUpdateErrorCodesList(updated);

                      // Sync lists
                      const newCats = [...categoriesList];
                      if (!newCats.includes(catVal)) {
                        newCats.push(catVal);
                        onUpdateCategoriesList(newCats);
                      }
                      const newBrands = [...brandsList];
                      if (!newBrands.includes(brandVal)) {
                        newBrands.push(brandVal);
                        onUpdateBrandsList(newBrands);
                      }
                      const newModels = [...modelsList];
                      if (modelVal !== 'عمومی' && modelVal !== 'کل مدل‌ها' && !newModels.includes(modelVal)) {
                        newModels.push(modelVal);
                        onUpdateModelsList(newModels);
                      }

                      setBulkEditingGroup(null);
                      alert(`مشخصات تعداد ${bulkEditingGroup.errors.length} کد خطا با موفقیت ویرایش گردید.`);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs cursor-pointer"
                  >
                    بروزرسانی همزمان کل گروه
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECTION B: COLLAPSING BASICS MANAGERS (Hide when searching to keep page ultra-clean) */}
          {!globalConfigSearch && (
            <div className="space-y-6 animate-in fade-in duration-250">
              
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <details className="group" open={false}>
                  <summary className="flex items-center justify-between p-5 font-bold text-xs text-slate-800 cursor-pointer hover:bg-slate-50 selection:bg-transparent">
                    <span className="flex items-center gap-2 font-extrabold text-blue-900 border-r-4 border-blue-600 pr-2.5">
                      ⚙️ پیکربندی محرمانه برندها، دسته‌ها و مدل‌ها (جهت توسعه دستی)
                    </span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>

                  <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/50 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* 1. Brands setup */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                        <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-650"></span>
                          <span>برندهای لوازم خانگی سراسری</span>
                        </h4>
                        {brandMessage && (
                          <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-2 rounded-xl text-[9px] font-bold text-center leading-relaxed font-sans">
                            {brandMessage.text}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newBrandName}
                            onChange={(e) => setNewBrandName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddBrand();
                              }
                            }}
                            placeholder="مانند: بکو، آرچلیک"
                            className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white text-right"
                          />
                          <button
                            type="button"
                            onClick={handleAddBrand}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-3 py-2 text-[11px] font-bold"
                          >
                            ثبت برند
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl">
                          {brandsList.map(br => {
                            const isEditing = editingBrand === br;
                            return (
                              <div key={br} className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-xs">
                                {isEditing ? (
                                  <div className="flex items-center gap-1 font-sans">
                                    <input
                                      type="text"
                                      value={editingBrandVal}
                                      onChange={(e) => setEditingBrandVal(e.target.value)}
                                      className="border border-blue-550 rounded px-1.5 py-0.5 text-[9px] font-bold w-20 outline-none text-right"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameBrand(br, editingBrandVal);
                                        if (e.key === 'Escape') setEditingBrand(null);
                                      }}
                                    />
                                    <button
                                      onClick={() => handleRenameBrand(br, editingBrandVal)}
                                      className="text-emerald-600 font-black cursor-pointer text-xs"
                                      title="تایید ویرایش"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => setEditingBrand(null)}
                                      className="text-rose-600 font-black cursor-pointer text-xs"
                                      title="لغو"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span 
                                      onClick={() => { setEditingBrand(br); setEditingBrandVal(br); }}
                                      className="cursor-pointer hover:text-blue-600 transition-colors"
                                      title="جهت تغییر نام کلیک کنید"
                                    >
                                      {br}
                                    </span>
                                    <button onClick={() => handleRemoveBrand(br)} className="text-rose-600 font-extrabold cursor-pointer">✕</button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 2. Categories setup */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                        <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-violet-650"></span>
                          <span>دسته‌بندی تجهیزات عیب‌یابی</span>
                        </h4>
                        {categoryMessage && (
                          <div className="bg-purple-50 text-purple-800 border border-purple-100 p-2 rounded-xl text-[9px] font-bold text-center leading-relaxed font-sans">
                            {categoryMessage.text}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCategory();
                              }
                            }}
                            placeholder="مانند: فر دیواری"
                            className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white text-right"
                          />
                          <button
                            type="button"
                            onClick={handleAddCategory}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-3 py-2 text-[11px] font-bold"
                          >
                            ثبت دسته
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl">
                          {categoriesList.map(cat => {
                            const isEditing = editingCategory === cat;
                            return (
                              <div key={cat} className="bg-white border border-slate-200 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-xs font-sans">
                                {isEditing ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingCategoryVal}
                                      onChange={(e) => setEditingCategoryVal(e.target.value)}
                                      className="border border-blue-550 rounded px-1.5 py-0.5 text-[9px] font-bold w-20 outline-none text-right"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameCategory(cat, editingCategoryVal);
                                        if (e.key === 'Escape') setEditingCategory(null);
                                      }}
                                    />
                                    <button
                                      onClick={() => handleRenameCategory(cat, editingCategoryVal)}
                                      className="text-emerald-600 font-black cursor-pointer text-xs"
                                      title="تایید ویرایش"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => setEditingCategory(null)}
                                      className="text-rose-600 font-black cursor-pointer text-xs"
                                      title="لغو"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span 
                                      onClick={() => { setEditingCategory(cat); setEditingCategoryVal(cat); }}
                                      className="cursor-pointer hover:text-blue-600 transition-colors"
                                      title="جهت تغییر نام کلیک کنید"
                                    >
                                      {cat}
                                    </span>
                                    <button onClick={() => handleRemoveCategory(cat)} className="text-rose-650 hover:text-rose-800 font-extrabold cursor-pointer">✕</button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* 3. Models setup */}
                      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
                        <h4 className="font-extrabold text-xs text-indigo-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                          <span>مدل‌های مجزای هم‌پوشان</span>
                        </h4>
                        {modelMessage && (
                          <div className="bg-indigo-50 text-indigo-800 border border-indigo-100 p-2 rounded-xl text-[9px] font-bold text-center leading-relaxed font-sans">
                            {modelMessage.text}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newModelName}
                            onChange={(e) => setNewModelName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddModel();
                              }
                            }}
                            placeholder="مانند: تیتان اس، ورونا"
                            className="flex-1 bg-slate-50 border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white text-right"
                          />
                          <button
                            type="button"
                            onClick={handleAddModel}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-3 py-2 text-[11px] font-bold"
                          >
                            ثبت مدل
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl">
                          {modelsList.map(mod => {
                            const isEditing = editingModel === mod;
                            return (
                              <div key={mod} className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 shadow-xs font-sans">
                                {isEditing ? (
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="text"
                                      value={editingModelVal}
                                      onChange={(e) => setEditingModelVal(e.target.value)}
                                      className="border border-blue-550 rounded px-1.5 py-0.5 text-[9px] font-bold w-20 outline-none text-right"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleRenameModel(mod, editingModelVal);
                                        if (e.key === 'Escape') setEditingModel(null);
                                      }}
                                    />
                                    <button
                                      onClick={() => handleRenameModel(mod, editingModelVal)}
                                      className="text-emerald-600 font-black cursor-pointer text-xs"
                                      title="تایید ویرایش"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={() => setEditingModel(null)}
                                      className="text-rose-600 font-black cursor-pointer text-xs"
                                      title="لغو"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <span 
                                      onClick={() => { setEditingModel(mod); setEditingModelVal(mod); }}
                                      className="cursor-pointer hover:text-blue-600 transition-colors"
                                      title="جهت تغییر نام کلیک کنید"
                                    >
                                      {mod}
                                    </span>
                                    <button onClick={() => handleRemoveModel(mod)} className="text-rose-600 font-extrabold cursor-pointer">✕</button>
                                  </>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                    </div>
                  </div>
                </details>
              </div>

              {/* Cities Collapse Area */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden font-sans">
                <details className="group">
                  <summary className="flex items-center justify-between p-5 font-bold text-xs text-slate-800 cursor-pointer hover:bg-slate-50 selection:bg-transparent animate-in fade-in duration-200">
                    <span className="flex items-center gap-2 font-extrabold text-blue-900 border-r-4 border-emerald-600 pr-2.5">
                      📍 پیکربندی شهرهای متبوع و مناطق تحت پوشش بهار خدمت
                    </span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>

                  <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                    {cityMessage && (
                      <div className="mb-4 bg-emerald-50 text-emerald-800 border border-emerald-150 p-3.5 rounded-2xl text-[10px] font-bold text-right leading-relaxed flex items-center gap-1.5 justify-start">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{cityMessage.text}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 text-right">
                        <span className="block text-xs font-extrabold text-slate-800">۱. افزودن شهر جدید به حوزه‌ها</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newCityName}
                            onChange={(e) => setNewCityName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddCity();
                              }
                            }}
                            placeholder="مانند: تبریز، اهواز"
                            className="flex-1 bg-slate-50 border p-2.5 text-xs rounded-xl"
                          />
                          <button
                            type="button"
                            onClick={handleAddCity}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-xs font-bold rounded-xl"
                          >
                            ثبت و انتخاب
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 text-right">
                        <span className="block text-xs font-extrabold text-slate-800">۲. افزودن محله مجاز در شهر</span>
                        <div className="flex gap-2">
                          <select
                            value={selectedConfigCity}
                            onChange={(e) => setSelectedConfigCity(e.target.value)}
                            className="bg-slate-50 border p-2.5 text-xs rounded-xl w-32 font-bold cursor-pointer"
                          >
                            <option value="">انتخاب شهر</option>
                            {citiesList.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                          </select>
                          <input
                            disabled={!selectedConfigCity}
                            type="text"
                            value={newRegionName}
                            onChange={(e) => setNewRegionName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddRegion();
                              }
                            }}
                            placeholder="نام محله"
                            className="flex-1 disabled:bg-slate-100 bg-slate-50 border p-2.5 text-xs rounded-xl"
                          />
                          <button
                            type="button"
                            disabled={!selectedConfigCity}
                            onClick={handleAddRegion}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-350 text-white px-4 py-2 text-xs font-bold rounded-xl"
                          >
                            افزودن محله
                          </button>
                        </div>
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                      {citiesList.map(c => {
                        const isEditingCity = editingCity === c.name;
                        return (
                          <div key={c.name} className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                            <div className="flex justify-between items-center border-b pb-1.5">
                              {isEditingCity ? (
                                <div className="flex items-center gap-1 font-sans">
                                  <input
                                    type="text"
                                    value={editingCityVal}
                                    onChange={(e) => setEditingCityVal(e.target.value)}
                                    className="border border-blue-550 rounded px-1 py-0.5 text-[10px] font-bold w-24 outline-none text-right"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleRenameCity(c.name, editingCityVal);
                                      if (e.key === 'Escape') setEditingCity(null);
                                    }}
                                  />
                                  <button
                                    onClick={() => handleRenameCity(c.name, editingCityVal)}
                                    className="text-emerald-600 font-bold text-xs cursor-pointer"
                                    title="تایید ویرایش نام شهر"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() => setEditingCity(null)}
                                    className="text-rose-600 font-bold text-xs cursor-pointer"
                                    title="لغو"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <span 
                                  onClick={() => { setEditingCity(c.name); setEditingCityVal(c.name); }}
                                  className="font-extrabold text-xs text-slate-800 cursor-pointer hover:text-blue-600 transition-colors"
                                  title="کلیک برای ویرایش نام شهر"
                                >
                                  📍 {c.name}
                                </span>
                              )}
                              <button onClick={() => handleRemoveCity(c.name)} className="text-rose-600 text-[10px] font-bold hover:underline cursor-pointer">حذف شهر</button>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {c.regions.map(r => {
                                const isEditingRegion = editingRegionCity === c.name && editingRegion === r;
                                return (
                                  <div key={r} className="bg-slate-50 border text-[9px] font-bold text-slate-650 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                    {isEditingRegion ? (
                                      <div className="flex items-center gap-1 font-sans">
                                        <input
                                          type="text"
                                          value={editingRegionVal}
                                          onChange={(e) => setEditingRegionVal(e.target.value)}
                                          className="border border-emerald-550 rounded px-1 py-0 w-16 text-[9px] font-bold outline-none text-right"
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleRenameRegionField(c.name, r, editingRegionVal);
                                            if (e.key === 'Escape') {
                                              setEditingRegion(null);
                                              setEditingRegionCity(null);
                                            }
                                          }}
                                        />
                                        <button
                                          onClick={() => handleRenameRegionField(c.name, r, editingRegionVal)}
                                          className="text-emerald-600 font-bold text-[9px] cursor-pointer"
                                        >
                                          ✓
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingRegion(null);
                                            setEditingRegionCity(null);
                                          }}
                                          className="text-rose-600 font-bold text-[9px] cursor-pointer"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <span 
                                          onClick={() => {
                                            setEditingRegionCity(c.name);
                                            setEditingRegion(r);
                                            setEditingRegionVal(r);
                                          }}
                                          className="cursor-pointer hover:text-emerald-700 transition-colors"
                                          title="کلیک برای ویرایش نام محله"
                                        >
                                          {r}
                                        </span>
                                        <button onClick={() => handleRemoveRegion(c.name, r)} className="text-rose-600 cursor-pointer">✕</button>
                                      </>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </details>
              </div>

              {/* SECTION C: NEW DEDICATED COMMON PROBLEMS & DIY SOLUTIONS BUILDER */}
              <div id="problems-form-top" className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden font-sans scroll-mt-24 transition-all">
                <details className="group" open={false}>
                  <summary className="flex items-center justify-between p-5 font-bold text-xs text-slate-800 cursor-pointer hover:bg-slate-50 selection:bg-transparent">
                    <span className="flex items-center gap-2 font-extrabold text-blue-900 border-r-4 border-indigo-600 pr-2.5">
                      🔧 مدیریت پیشرفته فوت‌وفن و مشکلات شایع دستگاه‌ها (عیب‌یابی عاری از خطا)
                    </span>
                    <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2.5 py-0.5 rounded-full font-extrabold">آرشیو فعال: {commonProblems.length} مسئله</span>
                  </summary>

                  <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-6 text-right">
                    
                    <div className="bg-indigo-50/80 rounded-2xl p-4 border border-indigo-100/80 text-[11px] leading-relaxed text-indigo-900 flex flex-col md:flex-row gap-3 items-start justify-between">
                      <div className="space-y-1">
                        <span className="font-extrabold text-indigo-950 block">💡 راهنمای کاربری مدیریت محتوای عیب‌یابی بومی:</span>
                        <p>
                          شما می‌توانید مشکلات شایع نظیر «علت گرم نکردن پکیج»، «عدم تخلیه آب ماشین لباسشویی» و ... را به همراه منشأ اصلی خرابی و گام‌های راه‌حل خانگی (DIY) در این پایگاه ثبت کنید. این اطلاعات به صورت آنی در کادر جستجوی سراسری کاربران نمایان شده و تجربه کاربری شگفت‌انگیزی رقم می‌زند.
                        </p>
                      </div>
                      <button 
                        type="button" 
                        onClick={handleResetProblemForm}
                        className="bg-indigo-600 text-white font-bold hover:bg-indigo-700 text-[10px] px-3.5 py-2 rounded-xl flex-shrink-0 transition-colors cursor-pointer"
                      >
                        🔄 بازنشانی فرم ورودی
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                      
                      {/* Sub-card 1: Manual Insert & Edit Form */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-xs">
                        <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b pb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                          <span>{editingProblemId ? '✍️ ویرایش و تغییر چالش فنی جاری' : '➕ افزودن دستی مشکل فنی / عیب‌یابی جدید'}</span>
                        </h4>

                        {probFormMessage && (
                          <div className={`p-3 rounded-xl text-[10px] font-bold text-center border animate-pulse ${
                            probFormMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-150' : 'bg-rose-50 text-rose-800 border-rose-150'
                          }`}>
                            {probFormMessage.text}
                          </div>
                        )}

                        <div className="space-y-3.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-extrabold text-slate-705">کد خطا (مانند: E01, F1 - اختیاری):</label>
                              <input
                                type="text"
                                value={probCode}
                                onChange={(e) => setProbCode(e.target.value)}
                                placeholder="مانند: E01, F3, OE"
                                className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:bg-white outline-none font-bold font-mono text-left"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-extrabold text-slate-705">مدل‌های مشمول (اختیاری):</label>
                              <input
                                type="text"
                                value={probModel}
                                onChange={(e) => setProbModel(e.target.value)}
                                placeholder="مانند: کالدا ونزیا / همه مدل‌ها"
                                className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:bg-white outline-none font-bold"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-705">عنوان چرک‌نویس یا پرسش شایع کاربر:</label>
                            <input
                              type="text"
                              value={probTitle}
                              onChange={(e) => setProbTitle(e.target.value)}
                              placeholder="مثال: چرا ماشین لباسشویی لرزش شدیدی دارد و حرکت می‌کند؟"
                              className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-3 rounded-xl focus:bg-white outline-none font-bold"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="block text-[10px] font-extrabold text-slate-705">دسته‌بندی دستگاه:</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProbCategoryMode(probCategoryMode === 'select' ? 'custom' : 'select');
                                    setProbCategory('');
                                  }}
                                  className="text-[8.5px] text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-0.5 cursor-pointer bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                                >
                                  {probCategoryMode === 'select' ? '➕ دسته جدید' : '📋 لیست موجود'}
                                </button>
                              </div>
                              {probCategoryMode === 'select' ? (
                                <select
                                  value={probCategory}
                                  onChange={(e) => setProbCategory(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 text-xs px-2.5 py-2.5 rounded-xl outline-none font-bold cursor-pointer"
                                >
                                  <option value="">دسته‌بندی عمومی</option>
                                  {categoriesList.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={probCategory}
                                  onChange={(e) => setProbCategory(e.target.value)}
                                  placeholder="نام دسته‌بندی جدید..."
                                  className="w-full bg-slate-50 border border-slate-200 text-xs px-2.5 py-2.5 rounded-xl outline-none font-bold text-slate-800 animate-in fade-in duration-200"
                                />
                              )}
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <label className="block text-[10px] font-extrabold text-slate-705">برند اختصاصی:</label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProbBrandMode(probBrandMode === 'select' ? 'custom' : 'select');
                                    setProbBrand('');
                                  }}
                                  className="text-[8.5px] text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-0.5 cursor-pointer bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded"
                                >
                                  {probBrandMode === 'select' ? '➕ برند جدید' : '📋 لیست موجود'}
                                </button>
                              </div>
                              {probBrandMode === 'select' ? (
                                <select
                                  value={probBrand}
                                  onChange={(e) => setProbBrand(e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 text-xs px-2.5 py-2.5 rounded-xl outline-none font-bold cursor-pointer"
                                >
                                  <option value="">همه برندها (عمومی)</option>
                                  {brandsList.map(br => <option key={br} value={br}>{br}</option>)}
                                </select>
                              ) : (
                                <input
                                  type="text"
                                  value={probBrand}
                                  onChange={(e) => setProbBrand(e.target.value)}
                                  placeholder="نام برند جدید..."
                                  className="w-full bg-slate-50 border border-slate-200 text-xs px-2.5 py-2.5 rounded-xl outline-none font-bold text-slate-800 animate-in fade-in duration-200"
                                />
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-705">توضیحات جامع مشکل (توضیح فیزیکی یا رفتاری دستگاه - اختیاری):</label>
                            <textarea
                              rows={2}
                              value={probDescription}
                              onChange={(e) => setProbDescription(e.target.value)}
                              placeholder="توضیحات کوتاهی درباره نشانه یا رفتار این مشکل بنویسید..."
                              className="w-full bg-slate-50 border border-slate-200 text-[11px] p-3 rounded-xl focus:bg-white outline-none leading-relaxed"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-705">علل اصلی رویداد کدهای خطا یا رفتار دستگاه (هر دلیل در یک خط جدید):</label>
                            <textarea
                              rows={3}
                              value={probCausesRaw}
                              onChange={(e) => setProbCausesRaw(e.target.value)}
                              placeholder="دلیل اول: گرفتگی کمک‌فنرهای لرزه‌گیر زیر مخزن لباسشویی&#10;دلیل دوم: تراز نبودن چهار پایه پلاستیکی روی سطح سرامیک"
                              className="w-full bg-slate-50 border border-slate-200 text-[11px] p-3 rounded-xl focus:bg-white outline-none leading-relaxed"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-705">راهکارهای کاربردی خانگی و فنی گام‌به‌گام (هر مورد در یک خط جدید):</label>
                            <textarea
                              rows={3}
                              value={probSolutionsRaw}
                              onChange={(e) => setProbSolutionsRaw(e.target.value)}
                              placeholder="راهکار اول: با استفاده از آچار مخصوص، پایه‌های ریگلاژ را در خط تراز کف محکم کنید.&#10;راهکار دوم: کمک‌فنرهای فلزی و لاستیکی مستعمل را تعویض نمایید."
                              className="w-full bg-slate-50 border border-slate-200 text-[11px] p-3 rounded-xl focus:bg-white outline-none leading-relaxed"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-extrabold text-slate-705">شدت ایمنی و خطر احتمالی:</label>
                              <select
                                value={probHazardLevel}
                                onChange={(e) => setProbHazardLevel(e.target.value as any)}
                                className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-xl outline-none font-bold cursor-pointer"
                              >
                                <option value="low">کم خطر - عادی و بی‌خطر</option>
                                <option value="medium">متوسط - احتیاط حین کار</option>
                                <option value="high">خطر بالا - قطع منبع گاز یا برق</option>
                                <option value="critical">بحرانی - خطر شدید جانی و مالی</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <label className="block text-[10px] font-extrabold text-slate-705">جستجوی صوتی و تگ‌های متنی کمکی (با ویرگول جدا کنید):</label>
                              <input
                                type="text"
                                value={probTagsRaw}
                                onChange={(e) => setProbTagsRaw(e.target.value)}
                                placeholder="لرزش لباسشویی, حرکت میکند, صدا در زمان خشک کن, تکان خوردن"
                                className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl focus:bg-white outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-extrabold text-slate-705">نکات و اقدامات پیشگیرانه ایمنی (هر مورد در یک خط جدید - اختیاری):</label>
                            <textarea
                              rows={2}
                              value={probPrecautionsRaw}
                              onChange={(e) => setProbPrecautionsRaw(e.target.value)}
                              placeholder="مورد اول: از لمس قطعات فلزی داغ بپرهیزید.&#10;مورد دوم: دوشاخه برق را حتماً بکشید."
                              className="w-full bg-slate-50 border border-slate-200 text-[11px] p-3 rounded-xl focus:bg-white outline-none leading-relaxed"
                            />
                          </div>

                          <div className="flex gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={handleAddProblem}
                              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-500/10"
                            >
                              {editingProblemId ? '💾 ذخیره تغییرات عیب‌یابی' : '➕ ثبت و ذخیره مشکل شایع'}
                            </button>
                            {editingProblemId && (
                              <button
                                type="button"
                                onClick={handleResetProblemForm}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-5 rounded-xl transition-all"
                              >
                                لغو ویرایش
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sub-card 2: Bulk Import JSON */}
                      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-4 shadow-xs">
                        <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 border-b pb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                          <span>📂 بارگذاری و آپلود دسته‌ای کدهای عیب‌یابی (JSON)</span>
                        </h4>

                        <div className="space-y-3">
                          <div className="p-3 bg-slate-50 border rounded-xl text-[10.5px] leading-relaxed text-slate-600">
                            شما می‌توانید کدهای عیب‌یابی یا مشکلات جمع‌آوری شده اکسل را به فرمت <strong className="text-indigo-900 font-mono">JSON</strong> تبدیل کرده و با چسباندن در فیلد زیر به صورت یکباره درج کنید.
                          </div>

                          <textarea
                            rows={8}
                            value={probImportText}
                            onChange={(e) => setProbImportText(e.target.value)}
                            placeholder='[&#10;  {&#10;    "title": "علت پریدن فیوز مینیاتوری مایکروفر",&#10;    "category": "مایکروفر",&#10;    "brand": "سامسونگ",&#10;    "causes": ["اتصالی برد تغذیه", "خرابی مگنترون"],&#10;    "solutions": ["سرویس کامل یا تعویض لامپ مگنترون"],&#10;    "tags": ["فیوز مایکروفر", "اتصالی مایکروویو"]&#10;  }&#10;]'
                            className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl text-[10.5px] font-mono text-left outline-none leading-relaxed"
                            style={{ direction: 'ltr' }}
                          />

                          {probImportStatus.msg && (
                            <div className={`p-3 rounded-xl text-[10px] font-bold text-right border ${
                              probImportStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-150' : 'bg-rose-50 text-rose-800 border-rose-150'
                            }`}>
                              {probImportStatus.msg}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={handleImportProblemsJSON}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow"
                          >
                            ⚡ بارگذاری و ادغام فوری لیست درون‌ریزی با دیتابیس
                          </button>
                        </div>
                      </div>

                    </div>

                    {/* Section C Part 3: Live searchable list inside admin layout */}
                    <div className="mt-6 pt-5 border-t border-slate-200/80 space-y-4">
                      
                      {/* 🏷️ CATEGORY FILTER TABS FOR COMMON PROBLEMS */}
                      <div className="space-y-1.5 w-full">
                        <label className="text-[10.5px] font-extrabold text-slate-700 block">🏷️ تفکیک مشکلات متداول بر اساس دسته‌بندی لوازم خانگی:</label>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedProbCatFilter('all')}
                            className={`text-[10px] font-extrabold px-3.5 py-1.5 rounded-xl cursor-pointer transition-all border ${
                              selectedProbCatFilter === 'all'
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            همه لوازم خانگی ({commonProblems.length})
                          </button>
                          {categoriesList.map((cat) => {
                            const count = commonProblems.filter(p => p.category === cat).length;
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setSelectedProbCatFilter(cat)}
                                className={`text-[10px] font-extrabold px-3.5 py-1.5 rounded-xl cursor-pointer transition-all border ${
                                  selectedProbCatFilter === cat
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                    : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                {cat} ({count})
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-3xs w-full">
                        <span className="font-extrabold text-[11px] text-slate-800 mr-2">🔎 جستجوی زنده در مسائل ثبت شده:</span>
                        <div className="relative w-full sm:w-80">
                          <input
                            type="text"
                            value={probSearchQuery}
                            onChange={(e) => setProbSearchQuery(e.target.value)}
                            placeholder="کلمه کلیدی یا دسته را بنویسید..."
                            className="w-full bg-slate-50 border text-xs px-3.5 pl-9 py-2 rounded-xl text-right outline-none focus:bg-white"
                          />
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        </div>

                        {/* Bulk Delete for Selected Category */}
                        {selectedProbCatFilter !== 'all' && (
                          <button
                            type="button"
                            onClick={() => {
                              const targetCat = selectedProbCatFilter;
                              const countInCat = commonProblems.filter(p => p.category === targetCat).length;
                              if (countInCat === 0) {
                                alert(`هیچ مشکل متداولی در دسته‌بندی "${targetCat}" وجود ندارد.`);
                                return;
                              }
                              triggerSafeConfirm(
                                'حذف دسته‌جمعی مشکلات متداول',
                                `آیا از حذف دائم و کامل تمام ${countInCat} مشکل شایع دسته‌بندی "${targetCat}" اطمینان دارید؟ با این کار مشکلات متداول دیگر دسته‌بندی‌ها یا کدهای خطا هیچ تغییری نخواهند کرد.`,
                                async () => {
                                  try {
                                    const toDelete = commonProblems.filter(p => p.category === targetCat);
                                    const token = localStorage.getItem('session_user_id') || '';
                                    const results = await Promise.all(
                                      toDelete.map(p =>
                                        fetch(`/api/problems/${encodeURIComponent(p.id)}`, {
                                          method: 'DELETE',
                                          headers: { 'X-Session-Token': token }
                                        })
                                      )
                                    );
                                    const allOk = results.every(r => r.ok);
                                    if (allOk) {
                                      const updated = commonProblems.filter(p => p.category !== targetCat);
                                      onUpdateCommonProblemsList(updated);
                                      alert(`✅ تمامی ${countInCat} مشکل متداول مربوط به "${targetCat}" با موفقیت حذف شدند.`);
                                    } else {
                                      alert('خطا در حذف برخی مشکلات از سرور');
                                    }
                                  } catch (err: any) {
                                    alert(err.message || 'خطا در ارتباط با سرور');
                                  }
                                }
                              );
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl py-2 px-4 text-[10px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 self-end sm:self-auto"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>حذف یکجای مشکلات متداول "{selectedProbCatFilter}"</span>
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                        {commonProblems.filter(p => {
                          const matchesCategory = selectedProbCatFilter === 'all' || p.category === selectedProbCatFilter;
                          if (!matchesCategory) return false;
                          if (!probSearchQuery.trim()) return true;
                          const q = probSearchQuery.toLowerCase();
                          return (
                            p.title.toLowerCase().includes(q) ||
                            p.category.toLowerCase().includes(q) ||
                            p.brand.toLowerCase().includes(q) ||
                            (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
                          );
                        }).map((prob, idx) => (
                          <div key={prob.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 space-y-3 hover:shadow-xs transition-shadow relative">
                            <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-2.5">
                              <div className="space-y-1 select-all min-w-0">
                                <span className="font-black text-xs text-indigo-950 block truncate leading-relaxed">{prob.title}</span>
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] px-2 py-0.5 rounded-md font-bold">{prob.category}</span>
                                  <span className="bg-slate-100 border text-slate-600 text-[10px] px-2 py-0.5 rounded-md font-bold">{prob.brand}</span>
                                  {prob.views ? (
                                    <span className="text-[10px] text-slate-400 font-mono">⏱️ {prob.views} بار خوانده شده</span>
                                  ) : null}
                                </div>
                              </div>
                              {deletingProblemId === prob.id ? (
                                <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-xl animate-in fade-in slide-in-from-left-2 duration-150 border border-rose-100">
                                  <span className="text-[9px] font-black text-rose-800 px-1">حذف؟</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDeleteProblem(prob.id);
                                      setDeletingProblemId(null);
                                    }}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[9px] px-1.5 py-1 rounded transition cursor-pointer"
                                  >
                                    بله
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingProblemId(null)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[9px] px-1.5 py-1 rounded transition cursor-pointer"
                                  >
                                    خیر
                                  </button>
                                </div>
                              ) : (
                                <div className="flex gap-1.5 flex-shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleEditProblemClick(prob)}
                                    className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg hover:scale-105 transition-all outline-none cursor-pointer"
                                    title="ویرایش چالش"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeletingProblemId(prob.id)}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg hover:scale-105 transition-all outline-none cursor-pointer"
                                    title="حذف دائمی"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[10.5px] leading-relaxed">
                              <div className="bg-slate-50/75 p-2.5 rounded-xl space-y-1">
                                <span className="font-extrabold text-rose-700 block text-[10px]">⚠️ علل بروز احتمالی:</span>
                                <ul className="list-disc list-inside space-y-0.5 text-slate-700 pr-1.5">
                                  {prob.causes.map((c, cIdx) => <li key={cIdx}>{c}</li>)}
                                </ul>
                              </div>

                              <div className="bg-emerald-50/40 p-2.5 rounded-xl space-y-1">
                                <span className="font-extrabold text-emerald-800 block text-[10px]">⚙️ اقدامات برطرف‌سازی خانگی DIY:</span>
                                <ul className="list-decimal list-inside space-y-0.5 text-slate-755 pr-1.5">
                                  {prob.solutions.map((s, sIdx) => <li key={sIdx}>{s}</li>)}
                                </ul>
                              </div>
                            </div>

                            {prob.tags && prob.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 text-[9px] text-slate-400 font-sans">
                                {prob.tags.map((t, tIdx) => <span key={tIdx} className="bg-slate-50 px-1 py-0.5 rounded border">{t}</span>)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </details>
              </div>

              {/* SECURITY & ADMIN CREDENTIALS CONFIGURATION CARD */}
              <div className="bg-white rounded-3xl border border-slate-200 hover:border-slate-300 shadow-sm overflow-hidden transition-all">
                <details className="group">
                  <summary className="flex items-center justify-between p-5 font-bold text-xs text-slate-800 cursor-pointer hover:bg-slate-50 selection:bg-transparent">
                    <span className="flex items-center gap-2 font-extrabold text-slate-900 border-r-4 border-rose-600 pr-2.5">
                      🔒 تنظیمات امنیتی پلتفرم و تغییر رمز عبور مدیر عالی
                    </span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>

                  <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-5 text-right font-sans">
                    <div className="bg-white border-r-4 border-rose-500 p-4 rounded-xl text-[11px] leading-relaxed text-slate-700 shadow-xs">
                      <p className="font-extrabold text-slate-900 mb-1">⚠️ ضوابط بهداشت رمز عبور پلتفرم کدیار24</p>
                      <p>
                        به منظور جلوگیری از دسترسی غیرمجاز یا تغییر هویتی اطلاعات، توصیه می‌شود رمز عبور خود را به صورت دوره‌ای تغییر دهید. رمز عبور باید دارای حداقل ۸ کاراکتر و ترکیبی از حروف بزرگ، کوچک، اعداد و علائم خاص باشد.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold text-slate-700">کلمه عبور فعلی مدیریت کل:</label>
                        <input
                          type="password"
                          value={currentAdminPass}
                          onChange={(e) => setCurrentAdminPass(e.target.value)}
                          placeholder="کلمه عبور فعلی را وارد نمایید"
                          className="w-full bg-white border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold text-slate-700">کلمه عبور جدید:</label>
                        <input
                          type="password"
                          value={newAdminPass}
                          onChange={(e) => setNewAdminPass(e.target.value)}
                          placeholder="رمز عبور مستحکم بنویسید"
                          className="w-full bg-white border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-[10px] font-extrabold text-slate-700">تکرار کلمه عبور جدید:</label>
                        <input
                          type="password"
                          value={newAdminPassConfirm}
                          onChange={(e) => setNewAdminPassConfirm(e.target.value)}
                          placeholder="تکرار رمز عبور جدید جهت اطمینان"
                          className="w-full bg-white border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none"
                        />
                      </div>
                    </div>

                    {adminPassMessage && (
                      <div className="bg-emerald-50 text-emerald-800 border border-emerald-250 p-3.5 rounded-2xl text-[11px] font-bold text-right leading-relaxed flex items-center gap-1.5 justify-start">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{adminPassMessage.text}</span>
                      </div>
                    )}

                    <div className="flex justify-start">
                      <button
                        onClick={handleChangeAdminPass}
                        className="bg-slate-900 hover:bg-slate-950 text-white border border-slate-250 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer shadow-xs active:scale-95 duration-150"
                      >
                        ذخیره کلمه عبور جدید مدیر ارشد
                      </button>
                    </div>
                  </div>
                </details>
              </div>

              {/* SECTION C: MASS DATA IMPORTER (CSV / JSON FILE UPLOAD) */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-3xl overflow-hidden text-right">
                <details className="group" open={false}>
                  <summary className="flex items-center justify-between p-5 font-bold text-xs text-slate-800 cursor-pointer hover:bg-slate-50 selection:bg-transparent">
                    <span className="flex items-center gap-2 font-extrabold text-indigo-900 border-r-4 border-indigo-600 pr-2.5">
                      📥 بارگذاری انبوه همگانی اطلاعات با فایل JSON یا CSV (درون‌ریزی سریع)
                    </span>
                    <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
                  </summary>

                  <div className="p-5 border-t border-slate-100 bg-slate-50/50 space-y-4">
                    <p className="text-[10px] text-slate-500 mb-2 leading-relaxed">
                      امکانی بی‌نظیر برای دپوی کل کدهای خطا، برندها یا شهرهای جدید در کسری از ثانیه؛ کافیست فایل را انتخاب کرده یا داده را کپی کنید.
                    </p>

                    {/* Unified Fields Schema & Golden Template */}
                    <div className="bg-white rounded-2xl border border-indigo-100 p-4 sm:p-5 space-y-4 text-slate-800">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-indigo-50 pb-3">
                        <span className="flex items-center gap-2 text-xs font-black text-indigo-950">
                          <span className="flex h-2.5 w-2.5 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-600"></span>
                          </span>
                          📌 الگوی متحد فیلدهای دیتابیس (هماهنگی کامل ثبت دستی با فایل Excel / CSV)
                        </span>
                        <span className="text-[9.5px] bg-indigo-50 text-indigo-800 border border-indigo-150 px-2.5 py-0.5 rounded-lg font-black">
                          تطابق همگانی فیلدها و درجه خطر
                        </span>
                      </div>

                      <p className="text-[10.5px] text-slate-600 leading-relaxed">
                        جهت برقراری هماهنگی صد‌در‌صدی و همگام‌سازی، تمامی پرونده‌های عیوب کدهای خطا (چه تکنسین یا مدیریت به صورت دستی ثبت کنند و چه به صورت دسته‌جمعی از فایل با پسوند <strong className="font-mono text-indigo-600">.csv / .xlsx</strong> درون‌ریزی کنید) از الگو و فیلدهای یکسانی پیروی می‌کنند. ثبت گزینه‌ی <strong className="text-rose-600">درجه خطر (سطح ریسک امنیتی)</strong> در هر دو حالت برای پیشگیری از حوادث گاز گرفتگی و اتصالی **الزامی** است.
                      </p>

                      <div className="overflow-x-auto border border-slate-150 rounded-xl bg-slate-50">
                        <table className="w-full text-right border-collapse text-[10px] sm:text-[10.5px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-705 border-b border-slate-200">
                              <th className="p-2.5 font-extrabold border-l border-slate-200">نام فیلد فارسی</th>
                              <th className="p-2.5 font-extrabold border-l border-slate-200">کد ستون اکسل / CSV (یا فیلد JSON)</th>
                              <th className="p-2.5 font-extrabold border-l border-slate-200">وضعیت فیلد</th>
                              <th className="p-2.5 font-extrabold">مقادیر مجاز حین واردات و پنل</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-700">
                            <tr>
                              <td className="p-2.5 font-bold text-slate-900 border-l border-slate-200">کدهایی که دارید</td>
                              <td className="p-2.5 font-mono text-indigo-700 border-l border-slate-200 font-bold">code</td>
                              <td className="p-2.5 font-bold text-rose-600 border-l border-slate-200">الزامی (کلید)</td>
                              <td className="p-2.5 text-slate-500">کد کوتاه خطا مانند <code className="font-mono bg-white px-1 border rounded text-slate-800">E01</code> یا <code className="font-mono bg-white px-1 border rounded text-slate-800">F1</code></td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold text-slate-900 border-l border-slate-200">نوع دستگاه</td>
                              <td className="p-2.5 font-mono text-indigo-700 border-l border-slate-200 font-bold">category</td>
                              <td className="p-2.5 font-bold text-rose-600 border-l border-slate-200">الزامی</td>
                              <td className="p-2.5 text-slate-500">تجهیز مربوطه مانند: <code className="font-sans font-bold text-slate-800">پکیج دیواری</code>، <code className="font-sans font-bold text-slate-800">کولر گازی</code>، <code className="font-sans font-bold text-slate-800">ماشین لباسشویی</code></td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold text-slate-900 border-l border-slate-200">برند یا سازنده</td>
                              <td className="p-2.5 font-mono text-indigo-700 border-l border-slate-200 font-bold">brand</td>
                              <td className="p-2.5 font-bold text-rose-600 border-l border-slate-200">الزامی</td>
                              <td className="p-2.5 text-slate-500">برند مربوطه مانند: <code className="font-sans font-bold text-slate-800">بوتان</code>، <code className="font-sans font-bold text-slate-800">ایران رادیاتور</code>، <code className="font-sans font-bold text-slate-800">سامسونگ</code></td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold text-slate-900 border-l border-slate-200">مدل کالا</td>
                              <td className="p-2.5 font-mono text-indigo-700 border-l border-slate-200 font-bold">model</td>
                              <td className="p-2.5 font-bold text-rose-600 border-l border-slate-200">الزامی</td>
                              <td className="p-2.5 text-slate-500">مدل‌های مشمول با خط فاصله یا اسلش مانند <code className="font-mono bg-white px-1 border rounded text-slate-800">L24FF / L28FF</code> یا عبارت عمومی <code className="font-sans bg-white px-1 border rounded text-slate-800">عمومی</code></td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold text-slate-900 border-l border-slate-200">درجه خطر (ریسک)</td>
                              <td className="p-2.5 font-mono text-indigo-700 border-l border-slate-200 font-bold">hazardLevel</td>
                              <td className="p-2.5 font-bold text-amber-700 border-l border-slate-200 font-sans">بله (تضمینی)</td>
                              <td className="p-2.5 text-slate-500">
                                به عنوان فیلد مشترک اجباری، یکی از ۴ متغیر انگلیسی بنویسید:
                                <div className="flex flex-wrap gap-1 mt-1 font-mono text-[9px] font-bold">
                                  <span className="bg-emerald-50 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-250">low (بی‌خطر)</span>
                                  <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-250">medium (متوسط)</span>
                                  <span className="bg-orange-50 text-orange-850 px-1.5 py-0.5 rounded border border-orange-200">high (خطر بالا)</span>
                                  <span className="bg-red-50 text-red-800 px-1.5 py-0.5 rounded border border-red-200">critical (بحرانی)</span>
                                </div>
                              </td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold text-slate-900 border-l border-slate-200">عنوان توصیفی خرابی</td>
                              <td className="p-2.5 font-mono text-indigo-700 border-l border-slate-200 font-bold">title</td>
                              <td className="p-2.5 text-slate-400 border-l border-slate-200">اختیاری</td>
                              <td className="p-2.5 text-slate-500">خلاصه فنی کوتاه مانند: نقص در سنسور آبگرم مصرفی دستگاه یا دودمانه فن</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold text-slate-900 border-l border-slate-200">شرح علت و فیزیک عیب</td>
                              <td className="p-2.5 font-mono text-indigo-700 border-l border-slate-200 font-bold">description / causes</td>
                              <td className="p-2.5 text-slate-400 border-l border-slate-200">اختیاری</td>
                              <td className="p-2.5 text-slate-500">شرح جزئیات فنی خرابی قطعه برای آگاهی همکار تکنسین و مراجعین</td>
                            </tr>
                            <tr>
                              <td className="p-2.5 font-bold text-slate-900 border-l border-slate-200">دستورالعمل عیب‌یابی</td>
                              <td className="p-2.5 font-mono text-indigo-700 border-l border-slate-200 font-bold">steps</td>
                              <td className="p-2.5 text-slate-400 border-l border-slate-200">اختیاری</td>
                              <td className="p-2.5 text-slate-500">مراحل گام به گام حل خطا که با کاما (,) یا خط جدید مجزا می‌شوند.</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-start items-center p-3.5 bg-indigo-50/40 rounded-xl border border-indigo-100">
                        <span className="text-[10px] text-indigo-950 font-extrabold ml-auto">کپی قالب و فایل دیتای تست:</span>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              const templateCSV = "code,category,brand,model,title,description,causes,steps,precautions,hazardLevel\nE01,پکیج دیواری,بوتان,عمومی,عدم تشکیل شعله,نرسیدن گاز به برنر یا معیوب بودن یون حسگر,سیم سوخته یا شیر برقی خراب,۱. جریان شیر اصلی گاز را چک کنید ۲. یون را سمباده بکشید ۳. رله برد را تعویض کنید,برق دستگاه قطع شده و بوی گاز استشمام نگردد,critical\nE25,کولر گازی,جنرال,همه مدل‌ها,اورلود کمپرستور,حرارت بالا موتور کولر,خرابی رله استارت یا افت ولتاژ شبکه,خازن را تعویض کنید و لوله‌ها را شستشو دهید,دست به بدنه نزنید خطر داغی بالا,high";
                              navigator.clipboard.writeText(templateCSV);
                              alert("📋 الگوی فایل اکسل (فرمت CSV) شامل فیلد درجه خطر کپی شد! می‌توانید آن را در یک فایل متنی با پسوند .csv مجزا ذخیره و در بخش زیر بارگذاری کنید.");
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] sm:text-[10.5px] font-black py-1.5 px-3 rounded-lg flex items-center gap-1 cursor-pointer active:scale-95 transition-all outline-none"
                          >
                            📋 کپی نمونه CSV به همراه درجه خطر
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const templateJSON = JSON.stringify([
                                {
                                  "code": "E01",
                                  "category": "پکیج دیواری",
                                  "brand": "ایران رادیاتور",
                                  "model": "M24FF",
                                  "title": "خطای ترمیستور مدار گرمایش",
                                  "description": "خرابی یا اتصالی سنسور حرارتی NTC گرمایش",
                                  "causes": ["خرابی سنسور", "قطع کابل فبستون"],
                                  "steps": ["سنسور تعویض گردد", "سیم‌بندی چک شود"],
                                  "precautions": ["آب مدار کاملاً تخلیه شده باشد"],
                                  "hazardLevel": "medium"
                                }
                              ], null, 2);
                              navigator.clipboard.writeText(templateJSON);
                              alert("📋 فایل نمونه JSON کپی شد! می‌توانید کپی را مستقیماً در کادر متنی پایین بچسبانید.");
                            }}
                            className="bg-white hover:bg-slate-100 text-slate-800 text-[10px] sm:text-[10.5px] font-black py-1.5 px-3 rounded-lg border border-slate-300 flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
                          >
                            📋 کپی نمونه JSON کپی‌شونده
                          </button>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={processBulkImport} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-slate-700">نوع محتوای وارداتی را مشخص کنید</label>
                          <select
                            value={importType}
                            onChange={(e) => setImportType(e.target.value as any)}
                            className="bg-slate-50 border p-2.5 w-full text-xs rounded-xl font-bold cursor-pointer mt-1 text-right"
                          >
                            <option value="errors">📂 پرونده کامل کدهای خطای فنی (Error Codes)</option>
                            <option value="categories">🏷️ دسته‌بندی لوازم و نوع دستگاه‌ها</option>
                            <option value="brands">🏭 شرکت‌های سازنده و برندها</option>
                            <option value="cities">📍 شهرها به همرا محلات (با فرمت CSV: شهر,محله۱,محله۲)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-700">انتخاب و بارگذاری مستقیم فایل از دیسک (.json, .csv)</label>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="file"
                              accept=".json,.csv"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    const text = event.target?.result as string;
                                    if (text) {
                                      setPastedImportData(text);
                                      setImportStatus({ type: 'idle', msg: `فایل "${file.name}" بارگذاری شد. جهت تطابق روی دکمه در درون‌ریزی کلیک کنید.` });
                                    }
                                  };
                                  reader.readAsText(file);
                                }
                              }}
                              className="hidden"
                              id="bulk-file-uploader"
                            />
                            <label
                              htmlFor="bulk-file-uploader"
                              className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs py-2 px-4 rounded-xl border border-slate-300 transition-all font-bold cursor-pointer inline-block"
                            >
                              📂 انتخاب فایل از رایانه
                            </label>
                            <span className="text-[10px] text-slate-450 truncate">فرمت‌های استاندار با تشخیص هوشمند نوع دلیمیتر</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-705">داده‌های کپی شده از اکسل/متن را مستقیماً این‌جا بچسبانید (یا فایل بالا را گزینش کنید)</label>
                        <textarea
                          rows={4}
                          value={pastedImportData}
                          onChange={(e) => setPastedImportData(e.target.value)}
                          placeholder={
                            importType === 'errors' 
                              ? 'نمونه فرمت استاندارد JSON: [{"code": "E1", "title": "خطای ترمیستور", "category": "پکیج", "brand": "Valtro", "model": "B5-C2", "description": "نقص در مدار آبگرم"}] \nیا فرمت CSV: کد,نوع دستگاه,برند,مدل,عنوان,علت خطا'
                              : 'نام‌ها را خط به خط چسبانده و ثبت نمایید.'
                          }
                          className="w-full bg-slate-50 border p-3 rounded-xl mt-1 text-[11px] font-mono text-right leading-relaxed"
                        />
                      </div>

                      {importStatus.msg && (
                        <div className={`p-3 rounded-xl text-xs font-bold leading-relaxed text-right border ${
                          importStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-250 animate-bounce' :
                          importStatus.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-250' : 'bg-blue-50 text-blue-800 border-blue-250 font-sans'
                        }`}>
                          {importStatus.type === 'success' ? '✓ ' : importStatus.type === 'error' ? '✕ ' : 'ℹ️ '}
                          {importStatus.msg}
                        </div>
                      )}

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-12 py-3 text-xs font-bold shadow transition-all cursor-pointer"
                        >
                          شروع پردازش و ادغام با دیتابیس کدیار۲۴
                        </button>
                      </div>
                    </form>
                  </div>
                </details>
              </div>

              {/* UNIFIED BACKUP & RESTORE REDIRECT CARD */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md text-right space-y-3 mt-5 border border-indigo-800 font-sans">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full inline-block">
                      مدیریت پشتیبان‌گیری
                    </span>
                    <h4 className="font-black text-sm text-white flex items-center gap-2">
                      <Database className="w-5 h-5 text-amber-400" />
                      <span>مرکز پشتیبان‌گیری، بازگردانی و درون‌ریزی کل اطلاعات سایت</span>
                    </h4>
                    <p className="text-xs text-slate-300">
                      تمامی ابزارهای بکاپ‌گیری دیتابیس، بازیابی مشتریان و تکنسین‌ها، دانلود فایل JSON، اجرای اسکریپت‌های SQL و درون‌ریزی داده‌ها در یک تب واحد «پشتیبان‌گیری (Backups)» تجمیع شده‌اند.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('backups')}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-6 py-3 rounded-2xl shadow-lg transition-all cursor-pointer shrink-0 flex items-center gap-2"
                  >
                    <Database className="w-4 h-4" />
                    <span>ورود به مرکز یکپارچه پشتیبان‌گیری</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* SECTION E: SMS GATEWAY SYSTEM MANAGER & TELEMETRY */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden text-right">
            <details className="group" open={false}>
              <summary className="flex items-center justify-between p-5 sm:p-6 font-bold text-sm text-slate-800 cursor-pointer hover:bg-slate-50 selection:bg-transparent">
                <div className="flex items-center gap-2 justify-start">
                  <MessageSquare className="w-5 h-5 text-indigo-600" />
                  <span className="font-extrabold text-sm text-slate-800">تنظیمات وب‌سرویس پیامکی (Kavenegar & FarazSMS)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md font-extrabold font-mono">SMS GATEWAY READY</span>
                  <span className="text-slate-450 group-open:rotate-180 transition-transform">▼</span>
                </div>
              </summary>

              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/50 space-y-6">
                <p className="text-[10px] text-slate-450 -mt-2 mb-4">اتصال مستقیم به پنل پیامکی، ارسال کد OTP، اطلاع‌رسانی وضعیت اعزام تکنسین و مشاهده لاگ‌های ارسال.</p>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 font-sans">
              
              {/* Left Column (8 cols): Interactive Dashboard Config & Test Dispatcher */}
              <div className="lg:col-span-12 xl:col-span-7 space-y-6">
                
                {/* Gateway config credentials */}
                <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                      پیکربندی هویت درگاه مخابراتی
                    </h4>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <span className="text-[10.5px] font-bold text-slate-600">فعال بودن سیستم پیامک:</span>
                      <input 
                        type="checkbox"
                        checked={smsEnabledInput}
                        onChange={(e) => setSmsEnabledInput(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-550"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700">انتخاب کارگزار / وب‌سرویس پیامکی:</label>
                      <select
                        id="admin-sms-provider"
                        value={smsProviderInput}
                        onChange={(e) => setSmsProviderInput(e.target.value)}
                        className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none font-bold"
                      >
                        <option value="simulated">📢 ارسال کننده مجازی سیستمی کدیار۲۴ (ثبت در دیتابیس)</option>
                        <option value="smsir">🔗 سامانه پیامکی اَبری sms.ir (وب‌سرویس سریع الگویی)</option>
                        <option value="farazsms">🚀 سامانه ملی فراز اس‌ام‌اس (FarazSMS IPPanel)</option>
                        <option value="kavenegar">⚡ کارگزار رسمی کاوه نگار (Kavenegar Gateway)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700">کد خط اختصاصی فرستنده (Line Number):</label>
                      <input
                        id="admin-sms-line-number"
                        type="text"
                        value={smsLineNumberInput}
                        onChange={(e) => setSmsLineNumberInput(e.target.value)}
                        placeholder="مثال: 3000505"
                        className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none font-mono text-left"
                      />
                    </div>
                  </div>

                  {/* 📚 DYNAMIC PROVIDER GUIDE INFOBAR */}
                  {smsProviderInput === 'smsir' && (
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-right text-[10.5px] leading-relaxed text-amber-900 font-sans space-y-1.5 animate-in fade-in duration-200">
                      <p className="font-extrabold flex items-center gap-1">
                        ⚠️ راهنمای وب‌سرویس اَبری SMS.ir (بسیار مهم):
                      </p>
                      <p>
                        ۱. در سامانه <strong>sms.ir</strong>، کدهای الگو حتماً باید یک <strong>شناسه عددی (Template ID)</strong> معتبر باشند (مثال: <code className="font-mono bg-amber-100 px-1 py-0.5 rounded font-bold">100000</code>). استفاده از حروف انگلیسی یا فارسی نامعتبر در فیلد کد الگو موجب بروز خطای <strong className="text-rose-700">«قالب یافت نشد» (وضعیت ۱۱۳)</strong> می‌گردد.
                      </p>
                      <p>
                        ۲. در الگوهای ارسالی خود حتماً پارامتری با نام <code className="font-mono bg-amber-100 px-1 py-0.5 rounded font-bold">code</code> یا <code className="font-mono bg-amber-100 px-1 py-0.5 rounded font-bold">Code</code> جهت جایگذاری کدهای تایید یا رهگیری تعریف نمایید.
                      </p>
                    </div>
                  )}

                  {smsProviderInput === 'farazsms' && (
                    <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-right text-[10.5px] leading-relaxed text-indigo-900 font-sans space-y-1.5 animate-in fade-in duration-200">
                      <p className="font-extrabold flex items-center gap-1">
                        🚀 راهنمای وب‌سرویس FarazSMS / IPPanel:
                      </p>
                      <p>
                        ۱. فیلد کد الگو را با <strong>کد الگوی متنی (Pattern Code)</strong> ثبت شده در پنل آی‌پنل خود مقداردهی نمایید (مانند حروف انگلیسی و عددی).
                      </p>
                      <p>
                        ۲. در الگوهای خود حتماً متغیر با نام <code className="font-mono bg-indigo-100 px-1 py-0.5 rounded font-bold">code</code> را گنجانده باشید تا جایگذاری پیامک‌ها به درستی انجام گیرد.
                      </p>
                    </div>
                  )}

                  {smsProviderInput === 'kavenegar' && (
                    <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-right text-[10.5px] leading-relaxed text-blue-900 font-sans space-y-1.5 animate-in fade-in duration-200">
                      <p className="font-extrabold flex items-center gap-1">
                        ⚡ راهنمای وب‌سرویس Kavenegar:
                      </p>
                      <p>
                        ۱. کد الگو را برابر با <strong>نام قالب تأیید هویت (Template)</strong> در پنل کاوه‌نگار قرار دهید (مثال: <code className="font-mono bg-blue-100 px-1 py-0.5 rounded font-bold">verify</code>).
                      </p>
                      <p>
                        ۲. متغیر توکن شما به عنوان پارامتر ارسال می‌شود. شماره خط فرستنده در این متد الزامی نیست و به طور خودکار تعیین می‌گردد.
                      </p>
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[10px] font-bold text-slate-700">کلید دسترسی API / توکن وب‌سرویس (API Key):</label>
                      {smsProviderInput === 'simulated' && (
                        <span className="text-[9px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded">ارسال سیستمی نیازی به کلید وب‌سرویس ندارد</span>
                      )}
                    </div>
                    <input
                      id="admin-sms-api-key"
                      type="password"
                      value={smsApiKeyInput}
                      onChange={(e) => setSmsApiKeyInput(e.target.value)}
                      placeholder={smsProviderInput === 'simulated' ? 'در حالت ارسال سیستمی خالی بگذارید' : 'توکن محرمانه دریافتی از درگاه پیامک مربوطه'}
                      className="w-full bg-white border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none font-mono text-left"
                      disabled={smsProviderInput === 'simulated'}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700">کد الگوی تایید هویت پترن (OTP Template Code):</label>
                      <input
                        id="admin-sms-otp-pattern"
                        type="text"
                        value={smsOtpPatternInput}
                        onChange={(e) => setSmsOtpPatternInput(e.target.value)}
                        placeholder="مانند: ykpd44s"
                        className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none font-mono text-left"
                        disabled={smsProviderInput === 'simulated'}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700">کد الگوی رهگیری وضعیت کاربری (Repair Status Template):</label>
                      <input
                        id="admin-sms-status-pattern"
                        type="text"
                        value={smsStatusPatternInput}
                        onChange={(e) => setSmsStatusPatternInput(e.target.value)}
                        placeholder="مانند: order_status_template"
                        className="w-full bg-white border border-slate-200 text-xs px-3 py-2 rounded-xl outline-none font-mono text-left"
                        disabled={smsProviderInput === 'simulated'}
                      />
                    </div>
                  </div>

                  <div className="flex justify-start pt-2">
                    <button
                      onClick={handleSaveSmsSettings}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>ذخیره و فعال‌سازی تنظیمات درگاه پیامک</span>
                    </button>
                  </div>
                </div>

                {/* Simulated testing device form */}
                <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl space-y-4">
                  <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1">
                    🎯 آزمون ارتباطی و ارسال آزمایشی پیامک
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1 space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700">شماره گیرنده جهت ارسال آزمایشی:</label>
                      <input
                        type="text"
                        value={testPhoneInput}
                        onChange={(e) => setTestPhoneInput(e.target.value)}
                        placeholder="مثال: 09123456789"
                        className="w-full bg-white border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none text-left font-mono"
                      />
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[10px] font-bold text-slate-700">متن آزمایشی پیامک:</label>
                      <input
                        type="text"
                        value={testMessageInput}
                        onChange={(e) => setTestMessageInput(e.target.value)}
                        placeholder="متن پیام را وارد کنید..."
                        className="w-full bg-white border border-slate-200 text-xs px-3 py-2.5 rounded-xl outline-none"
                      />
                    </div>
                  </div>

                  {testSmsStatus.msg && (
                    <div className={`p-3 rounded-xl text-[11px] font-medium leading-relaxed border ${
                      testSmsStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-250' :
                      testSmsStatus.type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-250' : 'bg-blue-50 text-blue-800 border-blue-200'
                    }`}>
                      {testSmsStatus.msg}
                    </div>
                  )}

                  <div className="flex justify-start">
                    <button
                      onClick={handleTestSmsSend}
                      className="bg-slate-900 hover:bg-slate-950 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5 text-blue-400" />
                      <span>ارسال آزمایشی پیامک</span>
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Column (4 cols): Real-time monitor log feed */}
              <div className="lg:col-span-12 xl:col-span-5 flex flex-col h-full min-h-[300px]">
                <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-lg p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="w-4.5 h-4.5 text-emerald-500" />
                      <span className="text-xs font-black">گزارش و وضعیت ارسال پیامک‌ها</span>
                    </div>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">LIVE STREAM</span>
                  </div>

                  <div className="flex-1 overflow-y-auto max-h-[380px] space-y-2.5 pr-1 font-mono text-[10px] text-right scrollbar-thin">
                    {smsLogs && smsLogs.length > 0 ? (
                      smsLogs.map((log: any, index: number) => {
                        const isSimulated = log.provider === 'simulated';
                        const isSuccess = log.status === 'sent' || log.status === 'simulated' || log.status === 'success';
                        return (
                          <div key={log.id || index} className="p-3 bg-slate-950/80 rounded-xl border border-slate-850 space-y-2 shadow-xs transition-all hover:bg-slate-950">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-450 text-[9px]">{log.timestamp}</span>
                              <span className="font-extrabold text-blue-400">{log.recipient}</span>
                            </div>

                            <p className="text-[10.5px] leading-relaxed text-slate-300 font-sans">{log.message}</p>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-850 text-[8.5px]">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">کارگزار: {log.provider}</span>
                                <span className="text-slate-600">|</span>
                                <span className={`font-bold ${log.type === 'otp' ? 'text-amber-400' : 'text-blue-400'}`}>
                                  {log.type === 'otp' ? '🔐 احراز هویت' : '⚙️ اطلاع‌رسانی فنی'}
                                </span>
                              </div>

                              <span className={`px-2 py-0.5 rounded font-extrabold ${
                                isSimulated ? 'bg-teal-950/50 text-teal-400' :
                                isSuccess ? 'bg-emerald-950/50 text-emerald-400' : 'bg-rose-950/50 text-rose-400'
                              }`}>
                                {isSimulated ? '📢 سیستمی' : isSuccess ? '✓ ارسال شده' : '✕ خطا در ارسال'}
                              </span>
                            </div>
                            
                            {log.response && (
                              <div className="bg-slate-900 p-1.5 rounded text-[8px] text-slate-500 overflow-x-auto text-left mt-1 max-w-full truncate font-mono">
                                Resp: {typeof log.response === 'object' ? JSON.stringify(log.response) : log.response}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-40 flex flex-col items-center justify-center text-slate-500 space-y-2">
                        <Inbox className="w-8 h-8 text-slate-600 animate-pulse" />
                        <span className="text-[10.5px] font-sans">هیچ لاگ یا تراکنش مخابراتی بر روی وب‌سرویس‌ها ثبت نشده است.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
              </div>
            </details>
          </div>

          {/* SECTION D: DIRECT ERROR CODE BUILDER */}
          <div id="direct-error-insert-form" className="bg-white rounded-3xl border border-slate-200/90 shadow-md overflow-hidden text-right scroll-mt-24">
            <details className="group" open={false}>
              <summary className="flex items-center justify-between p-5 font-bold text-sm text-slate-800 cursor-pointer hover:bg-slate-50 selection:bg-transparent">
                <div className="flex items-center gap-2 justify-start">
                  <Settings className="w-5 h-5 text-blue-600" />
                  <span className="font-extrabold text-sm text-slate-800">درج مستقیم کد خطای جدید سراسری (فوق‌سریع و هوشمند)</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-extrabold font-mono">INTELLIGENT INTEGRATION</span>
                  <span className="text-slate-455 group-open:rotate-180 transition-transform">▼</span>
                </div>
              </summary>

              <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/50 space-y-5">
                <p className="text-[10px] text-slate-450 -mt-2 mb-4 leading-relaxed">
                  با تشکر از سیستم خودکار، همزمان با تایپ نام مدل‌های هم‌پوشان به بانک مدل‌های سیستم افزوده می‌گردد تا تکرار پروسه با راحتی تمام باشد.
                </p>

            {/* Dynamic Status Alert Banner */}
            {directInsertStatus && (
              <div 
                className={`p-4 rounded-2xl text-xs font-bold leading-relaxed text-right border relative flex flex-col gap-2.5 transition-all shadow-sm ${
                  directInsertStatus.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' :
                  directInsertStatus.type === 'error' ? 'bg-rose-50 text-rose-900 border-rose-200' : 
                  'bg-amber-50 text-amber-900 border-amber-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {directInsertStatus.type === 'success' ? '✓' : directInsertStatus.type === 'error' ? '🚫' : '⚠️'}
                    </span>
                    <span className="font-extrabold text-[12px]">{directInsertStatus.msg}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setDirectInsertStatus(null)}
                    className="text-slate-450 hover:text-slate-700 bg-white hover:bg-slate-100/80 p-1 rounded-lg text-[10px] w-5 h-5 flex items-center justify-center border border-slate-200 shadow-2xs"
                  >
                    ✕
                  </button>
                </div>

                {directInsertStatus.code && (
                  <div className="bg-white/70 p-3 rounded-xl border border-slate-100 space-y-1.5 text-[10.5px]">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-slate-700">
                      <div>
                        <span className="text-slate-400 font-bold">کد خطا:</span>{' '}
                        <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-black">{directInsertStatus.code}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold">نوع دستگاه:</span>{' '}
                        <span className="text-slate-900 font-bold">{directInsertStatus.category}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold">برند:</span>{' '}
                        <span className="text-slate-900 font-bold">{directInsertStatus.brand}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold">مدل:</span>{' '}
                        <span className="text-slate-900 font-bold">{directInsertStatus.model}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleAddDirectErrorCode} className="space-y-4">
              {/* Common Problem Toggle */}
              <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between gap-3 text-right">
                <div className="space-y-0.5">
                  <span className="text-xs font-extrabold text-indigo-955 block">ثبت مستقیم به عنوان مشکل شایع دستگاه (بدون نیاز به کد خطا)</span>
                  <span className="text-[10px] text-slate-500 block">با فعال کردن این گزینه، اطلاعات ورودی به عنوان عیب‌یابی عمومی/فوت‌وفن در بخش «مشکلات شایع» ثبت می‌شود و از تداخل با کدهای خطا کاملاً مصون می‌ماند.</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dirIsCommon}
                    onChange={(e) => {
                      setDirIsCommon(e.target.checked);
                      if (e.target.checked) {
                        setDirCode('');
                      }
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Error Code */}
                <div>
                  <label className="block text-slate-705 text-[10px] font-extrabold mb-1">
                    {dirIsCommon ? 'کد خطا (اختیاری یا خالی)' : 'کد خطا (مانند: E01, F1) *'}
                  </label>
                  <input
                    required={!dirIsCommon}
                    disabled={dirIsCommon}
                    type="text"
                    value={dirCode}
                    onChange={(e) => setDirCode(e.target.value)}
                    placeholder={dirIsCommon ? 'بدون نیاز به کد خطا' : 'مانند: E01, F3, OE'}
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-left font-mono border transition-all ${
                      dirIsCommon ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                {/* Error title */}
                <div>
                  <label className="block text-slate-705 text-[10px] font-extrabold mb-1">عنوان فنی یا خرابی قطعه (اختیاری)</label>
                  <input
                    type="text"
                    value={dirTitle}
                    onChange={(e) => setDirTitle(e.target.value)}
                    placeholder="مانند: عدم تغذیه آب، خرابی سنسور یون"
                    className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-slate-800"
                  />
                </div>

                {/* Category (Smart dropdown selection) */}
                {/* Category (Smart dropdown selection) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-705 text-[10px] font-extrabold">نوع دستگاه (تجهیز) *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryMode(categoryMode === 'select' ? 'custom' : 'select');
                        setDirCategory('');
                      }}
                      className="text-[9px] text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-0.5 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-all"
                    >
                      {categoryMode === 'select' ? '➕ ثبت دستگاه جدید' : '📋 انتخاب از لیست'}
                    </button>
                  </div>
                  {categoryMode === 'select' ? (
                    <select
                      value={dirCategory}
                      onChange={(e) => setDirCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-xl outline-none font-bold text-slate-800 cursor-pointer text-right"
                      required
                    >
                      <option value="">-- انتخاب از لیست موجود --</option>
                      {categoriesList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      required
                      type="text"
                      value={dirCategory}
                      onChange={(e) => setDirCategory(e.target.value)}
                      placeholder="نام دستگاه جدید (مانند: مایکروویو)..."
                      className="w-full bg-slate-50 border border-slate-205 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-right text-slate-800 animate-in fade-in duration-200"
                    />
                  )}
                </div>

                {/* Brand (Smart recommended brands selection) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-705 text-[10px] font-extrabold">برند شرکت سازنده *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setBrandMode(brandMode === 'select' ? 'custom' : 'select');
                        setDirBrand('');
                      }}
                      className="text-[9px] text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-0.5 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-all"
                    >
                      {brandMode === 'select' ? '➕ ثبت برند جدید' : '📋 انتخاب از لیست'}
                    </button>
                  </div>
                  {brandMode === 'select' ? (
                    <select
                      value={dirBrand}
                      onChange={(e) => setDirBrand(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-xl outline-none font-bold text-slate-800 cursor-pointer text-right"
                      required
                    >
                      <option value="">-- انتخاب از لیست برندها --</option>
                      {brandsList.map(br => (
                        <option key={br} value={br}>{br}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      required
                      type="text"
                      value={dirBrand}
                      onChange={(e) => setDirBrand(e.target.value)}
                      placeholder="نام برند جدید (مانند: روتس)..."
                      className="w-full bg-slate-50 border border-slate-205 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-right text-slate-800 animate-in fade-in duration-200"
                    />
                  )}
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                
                {/* Overlapping Models */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-705 text-[10px] font-extrabold">مدل‌های مشمول خطا *</label>
                    <button
                      type="button"
                      onClick={() => {
                        setModelMode(modelMode === 'select' ? 'custom' : 'select');
                        setDirModel('');
                      }}
                      className="text-[9px] text-blue-600 hover:text-blue-800 font-extrabold flex items-center gap-0.5 cursor-pointer bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-md transition-all"
                    >
                      {modelMode === 'select' ? '➕ تایپ مدل سفارشی' : '📋 انتخاب از لیست'}
                    </button>
                  </div>
                  {modelMode === 'select' ? (
                    <select
                      value={dirModel}
                      onChange={(e) => setDirModel(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-xl outline-none font-bold text-slate-800 cursor-pointer text-right"
                      required
                    >
                      <option value="">-- انتخاب از لیست مدل‌ها --</option>
                      <option value="عمومی">عمومی (کل مدل‌ها)</option>
                      {modelsList.map(md => (
                        <option key={md} value={md}>{md}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      required
                      type="text"
                      value={dirModel}
                      onChange={(e) => setDirModel(e.target.value)}
                      placeholder="تایپ مدل جدید یا هم‌پوشان با اسلش (/) مانند: L24FF / L28FF..."
                      className="w-full bg-slate-50 border border-slate-205 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-right text-slate-800 animate-in fade-in duration-200"
                    />
                  )}
                </div>

                {/* Hazard Level */}
                <div>
                  <label className="block text-slate-705 text-[10px] font-extrabold mb-1">دسته ایمنی و خطر احتمالی</label>
                  <select
                    value={dirHazard}
                    onChange={(e) => setDirHazard(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 text-xs p-2.5 rounded-xl outline-none font-bold text-slate-[705] cursor-pointer text-right text-slate-800"
                  >
                    <option value="low">کم خطر - عادی و بی‌خطر</option>
                    <option value="medium">متوسط - احتیاط حین لمس بدنه</option>
                    <option value="high">خطر بالا - قطع منبع گاز یا برق ساختمان</option>
                    <option value="critical">بحرانی - پتانسیل نشت شدید، خطر حتمی لمس</option>
                  </select>
                </div>

                {/* Technical causes */}
                <div>
                  <label className="block text-slate-705 text-[10px] font-extrabold mb-1">علت و فیزیک به وجود آمدن عیب</label>
                  <input
                    type="text"
                    value={dirReason}
                    onChange={(e) => setDirReason(e.target.value)}
                    placeholder="مانند: افت فشار مسیر گاز یا قطع ترموکوپل"
                    className="w-full bg-slate-50 border border-slate-100 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-bold text-slate-800"
                  />
                </div>

              </div>

              {/* Step by step diagnostic loop */}
              <div>
                <label className="block text-slate-705 text-[10px] font-extrabold mb-1">دستورالعمل عیب‌یابی رسمی گام‌به‌گام برای تکنسین و مراجعین (اختیاری)</label>
                <textarea
                  rows={4}
                  value={dirSolution}
                  onChange={(e) => setDirSolution(e.target.value)}
                  placeholder="نوشتن گام‌ها به صورت شماره‌گذاری شده راحتی مراجع را دوچندان می‌کند: ۱. فیش فستون را جدا و اتصالات رله را تست کنید. ۲..."
                  className="w-full bg-slate-50 border border-slate-200 text-xs p-3.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 leading-relaxed font-bold text-right text-slate-800"
                />
              </div>

              {/* Video URL */}
              <div>
                <label className="block text-slate-705 text-[10px] font-extrabold mb-1">لینک یا آدرس فیلم راهنمای حل مشکل (آدرس ویدیو آپارات، یوتیوب یا لینک فایل تصویری - اختیاری)</label>
                <input
                  type="text"
                  value={dirVideoUrl}
                  onChange={(e) => setDirVideoUrl(e.target.value)}
                  placeholder="مثال: https://aparat.com/v/XXXXXیا لینک مستقیم پخش"
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3.5 py-2.5 rounded-xl outline-none focus:bg-white focus:border-blue-500 font-mono text-left"
                />
              </div>

              {/* Dynamic matching codes real-time assistant panel */}
              {matchingCodeRefs.length > 0 && (
                <div className="bg-amber-50/45 border-2 border-amber-200 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in slide-in-from-top-3 duration-250 text-right font-sans">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-200/80 pb-2.5">
                    <span className="flex items-center gap-2 text-xs font-black text-amber-900">
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                      </span>
                      🔍 ردیاب و تطابق‌یاب زنده کدهای ثبت‌شده مشابه ({matchingCodeRefs.length} مورد مشابه پیدا شد)
                    </span>
                    <span className="text-[9.5px] bg-amber-100 border border-amber-200 text-amber-800 px-2.5 py-0.5 rounded-lg font-black">
                      سامانه بررسی یکپارچگی ثبت داده‌ها
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Column 1: Match in the current category */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                          هم‌گروه دستگاه انتخابی شما: {(dirCategory || 'نامشخص')}
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold font-mono">SAME CATEGORY</span>
                      </div>

                      {matchingInCurrentCategory.length === 0 ? (
                        <p className="text-[10.5px] text-slate-500 italic pr-2 font-medium">
                          هیچ کد خطایی با نام "{dirCode}" برای نوع دستگاه "{dirCategory || 'جاری'}" ثبت نشده است. (امن و بدون هم‌پوشانی)
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {matchingInCurrentCategory.map(ref => (
                            <div key={ref.id} className="bg-white p-3 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all flex items-center justify-between gap-4">
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-slate-800 text-[10.5px]">{ref.brand}</span>
                                  {ref.model && (
                                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[9px] font-bold">
                                      مدل: {ref.model}
                                    </span>
                                  )}
                                </div>
                                <p className="text-slate-500 text-[10px] truncate font-medium">{ref.title}</p>
                              </div>
                              <span className="shrink-0 font-mono text-[10px] font-black bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 text-left">
                                {ref.code}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Column 2: Matches in other categories */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold text-indigo-800 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg">
                          بر روی سایر وسایل و دستگاه‌ها:
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold font-mono">CROSS-CATEGORY REFERENCE</span>
                      </div>

                      {matchingInOtherCategories.length === 0 ? (
                        <p className="text-[10.5px] text-slate-500 italic pr-2 font-medium">
                          این کد خطا در هیچ‌کدام از سایر دستگاه‌ها و دسته‌بندی‌های دیگر تعریف نشده است.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {matchingInOtherCategories.map(ref => (
                            <div key={ref.id} className="bg-white p-3 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-xs transition-all flex items-center justify-between gap-4">
                              <div className="space-y-0.5 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="bg-indigo-50 text-indigo-800 border border-indigo-150 px-1.5 py-0.2 rounded text-[9px] font-black">
                                    {ref.category}
                                  </span>
                                  <span className="font-extrabold text-slate-800 text-[10.5px]">{ref.brand}</span>
                                </div>
                                <p className="text-slate-500 text-[10px] truncate font-medium">{ref.title}</p>
                              </div>
                              <span className="shrink-0 font-mono text-[10px] font-black bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200 text-left">
                                {ref.code}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-12 py-3.5 text-xs font-extrabold shadow-md active:scale-[99%] cursor-pointer transition-all flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>ثبت و تطبیق فوری در دیتابیس کدهای آنلاین ایران</span>
                </button>
              </div>

            </form>
              </div>
            </details>
          </div>

          {/* SECTION E: GLOBAL ERROR CODES MANAGEMENT & QUICK DELETE */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-md p-5 sm:p-6 space-y-4 text-right">
            <details className="group" open={false}>
              <summary className="flex items-center justify-between font-bold text-xs text-slate-800 cursor-pointer hover:bg-slate-50 selection:bg-transparent">
                <span className="flex items-center gap-2 font-extrabold text-blue-900 border-r-4 border-rose-600 pr-2.5">
                  🛡️ مدیریت کل بانک کدهای خطا ({errorCodes.length} مورد فعال) - حذف مستقیم و ممیزی تفصیلی
                </span>
                <span className="text-slate-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>

              <div className="pt-5 border-t border-slate-100 space-y-4">
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                  در لیست زیر تمامی کدهای ثبت شده فعال در پایگاه داده کلان کدیار۲۴ آورده شده است. کدهایی که توسط همکاران تکنسین پیشنهاد شده یا مستقیماً توسط مدیر کل درج گردیده‌اند از این بخش با یک کلیک قابل بازنگری، اصلاح فوری دستی یا حذف دائم برای پیشگیری از نویز هستند.
                </p>

                {/* 🏷️ CATEGORY FILTER TABS FOR ERROR CODES */}
                <div className="space-y-1.5 w-full">
                  <label className="text-[10.5px] font-extrabold text-slate-700 block">🏷️ تفکیک کدهای خطا بر اساس دسته‌بندی لوازم خانگی:</label>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedErrCatFilter('all')}
                      className={`text-[10px] font-extrabold px-3.5 py-1.5 rounded-xl cursor-pointer transition-all border ${
                        selectedErrCatFilter === 'all'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      همه لوازم خانگی ({errorCodes.length})
                    </button>
                    {categoriesList.map((cat) => {
                      const count = errorCodes.filter(err => err.category === cat).length;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedErrCatFilter(cat)}
                          className={`text-[10px] font-extrabold px-3.5 py-1.5 rounded-xl cursor-pointer transition-all border ${
                            selectedErrCatFilter === cat
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {cat} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 w-full">
                  <span className="font-extrabold text-[11px] text-slate-800 mr-2">🔎 جستجوی زنده در کدهای خطا:</span>
                  <div className="relative w-full sm:w-80">
                    <input
                      type="text"
                      placeholder="🔍 جستجوی کد، برند یا مدل..."
                      value={errSearchQuery}
                      onChange={(e) => setErrSearchQuery(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3.5 pr-4 text-[11px] font-bold outline-none text-right focus:border-blue-400 transition-all"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  {/* Bulk Delete for Selected Category */}
                  {selectedErrCatFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetCat = selectedErrCatFilter;
                        const countInCat = errorCodes.filter(err => err.category === targetCat).length;
                        if (countInCat === 0) {
                          alert(`هیچ کد خطایی در دسته‌بندی "${targetCat}" وجود ندارد.`);
                          return;
                        }
                        triggerSafeConfirm(
                          'حذف دسته‌جمعی کدهای خطا',
                          `آیا از حذف دائم و کامل تمام ${countInCat} کد خطای دسته‌بندی "${targetCat}" اطمینان دارید؟ با این کار هیچ کد خطایی برای "${targetCat}" باقی نخواهد ماند و دیگر دسته‌بندی‌ها هیچ آسیبی نمی‌بینند.`,
                          async () => {
                            try {
                              const toDelete = errorCodes.filter(err => err.category === targetCat);
                              const token = localStorage.getItem('session_user_id') || '';
                              const results = await Promise.all(
                                toDelete.map(err =>
                                  fetch(`/api/error-codes/${encodeURIComponent(err.id)}`, {
                                    method: 'DELETE',
                                    headers: { 'X-Session-Token': token }
                                  })
                                )
                              );
                              const allOk = results.every(r => r.ok);
                              if (allOk) {
                                const updated = errorCodes.filter(err => err.category !== targetCat);
                                onUpdateErrorCodesList(updated);
                                alert(`✅ تمامی ${countInCat} کد خطای مربوط به "${targetCat}" با موفقیت حذف شدند.`);
                              } else {
                                alert('خطا در حذف برخی کدهای خطا از سرور');
                              }
                            } catch (err: any) {
                              alert(err.message || 'خطا در ارتباط با سرور');
                            }
                          }
                        );
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl py-2 px-4 text-[10px] font-black cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 self-end sm:self-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>حذف یکجای کلیه کدهای خطای "{selectedErrCatFilter}"</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
                  {errorCodes.filter(err => {
                    const matchesCategory = selectedErrCatFilter === 'all' || err.category === selectedErrCatFilter;
                    if (!matchesCategory) return false;
                    if (!errSearchQuery.trim()) return true;
                    const q = errSearchQuery.toLowerCase();
                    return (
                      err.code.toLowerCase().includes(q) ||
                      err.title.toLowerCase().includes(q) ||
                      err.brand.toLowerCase().includes(q) ||
                      err.category.toLowerCase().includes(q) ||
                      err.model.toLowerCase().includes(q) ||
                      err.description.toLowerCase().includes(q)
                    );
                  }).map((err) => (
                    <div
                      key={err.id}
                      className="local-err-item bg-white border border-slate-200 hover:border-rose-450 p-4 rounded-xl space-y-3 transition-all relative text-right"
                      data-code={err.code.toLowerCase()}
                      data-text={`${err.title} ${err.brand} ${err.category} ${err.model}`.toLowerCase()}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <div className="text-right">
                          <div className="flex items-center gap-1.5 justify-start">
                            <span className="bg-slate-100 text-slate-800 text-[10px] font-mono px-2 py-0.5 rounded font-bold">{err.code}</span>
                            {!err.isApproved && (
                              <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded">در انتظار تایید منشور علمی</span>
                            )}
                          </div>
                          <h6 className="font-extrabold text-xs text-slate-800 mt-1 text-right">{err.title}</h6>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-extrabold">{err.category} / {err.brand}</span>
                          {err.video_url && (
                            <span className="text-[8px] bg-rose-50 border border-rose-100 text-rose-600 px-1 py-0.2 rounded font-black">
                              🎥 دارای آموزش ویدیویی
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 text-[10px] text-slate-500 leading-relaxed border-t border-slate-105 pt-2 text-right">
                        <p className="font-bold text-slate-700">مدل‌های سازگار: {err.model}</p>
                        <p className="line-clamp-2">علت‌یابی مراجع: {err.description}</p>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-100 mt-1">
                        {err.video_url && (
                          <a
                            href={err.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-red-50 text-red-700 hover:bg-red-100 px-2.5 py-1 rounded text-[10px] font-extrabold transition-all cursor-pointer ml-auto flex items-center gap-1.5"
                          >
                            <span>🎥 پخش فیلم</span>
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditingError(err)}
                          className="bg-emerald-50 text-emerald-800 hover:bg-emerald-100 px-2.5 py-1 rounded text-[10px] font-extrabold transition-all cursor-pointer"
                        >
                          اصلاح مشخصات
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            triggerSafeConfirm(
                              'حذف دائمی کد خطا',
                              `آیا از حذف دائم کد خطای "${err.code}" به همراه تمامی آموزش‌ها و راهکارهایش اطمینان دارید؟`,
                              () => onRejectErrorCode(err.id)
                            );
                          }}
                          className="bg-rose-50 text-rose-850 hover:bg-rose-100 px-2.5 py-1 rounded text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>حذف نهایی دیتابیس</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  {errorCodes.length === 0 && (
                    <div className="col-span-2 text-center text-xs text-slate-400 p-8 font-bold">هیچ رکورد خطایی در سامانه ثبت نشده است.</div>
                  )}
                </div>
              </div>
            </details>
          </div>

        </div>
      )}

      {/* 📋 PROFESSIONAL DOCUMENT INSPECTOR MODAL */}
      {previewDoc && (
        <DocumentViewer
          techName={previewDoc.techName}
          docName={previewDoc.docName}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {false && (() => {
        // Simple hash to derive static pseudo-random values for this technician to make them look real
        const name = previewDoc.techName || '';
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
          hash = name.charCodeAt(i) + ((hash << 5) - hash);
        }
        hash = Math.abs(hash);
        
        // Derive variables
        const nationalCode = `${String(100 + (hash % 899))}-${String(100000 + (hash % 899999))}-${hash % 10}`;
        const fatherName = ['محمد', 'علی', 'علیرضا', 'غلامحسین', 'ابوالفضل', 'مرتضی', 'رضا', 'احمد', 'حمید'][hash % 9];
        const birthYear = 1354 + (hash % 26);
        const birthMonth = String(1 + (hash % 12)).padStart(2, '0');
        const birthDay = String(1 + (hash % 28)).padStart(2, '0');
        const birthDate = `${birthYear}/${birthMonth}/${birthDay}`;
        
        const docNameLower = previewDoc.docName.toLowerCase();
        const isNationalId = docNameLower.includes('ملی') || docNameLower.includes('national') || docNameLower.includes('شناسنامه') || docNameLower.includes('کارت');
        const isBusinessPermit = docNameLower.includes('جواز') || docNameLower.includes('کسب') || docNameLower.includes('business') || docNameLower.includes('پروانه') || docNameLower.includes('صنف');
        const isPoliceClearance = docNameLower.includes('سوء') || docNameLower.includes('پیشینه') || docNameLower.includes('clearance') || docNameLower.includes('سوءپیشینه');

        const nameParts = name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || 'سرویس‌کار';

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] z-[9999] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 text-slate-800 text-right dir-rtl">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden font-sans text-right dir-rtl animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-blue-200 animate-pulse" />
                  <div className="text-right font-sans">
                    <h4 className="font-extrabold text-sm text-white">ممیزی دیجیتال و اصالت‌سنجی مدارک فنی</h4>
                    <p className="text-[10px] text-blue-200/90 font-bold font-sans">سامانه اعتبار‌سنجی صلاحیت فنی تکنسین‌های ایران ارور</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors"
                  title="بستن دسترسی"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Document Content / Visualizer */}
              <div className="p-6 space-y-6 font-sans">
                {/* Alert Notice */}
                <div className="bg-blue-50/80 border border-blue-100 rounded-2xl p-4 flex items-start gap-3 text-right">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-blue-900 block">بررسی خودکار سندی ممیزان مالی و هویتی</span>
                    <p className="text-[10px] text-slate-650 leading-relaxed font-bold font-sans">
                      مدرک ذیل توسط همکار بارگذاری گردیده است. به کمک الگوهای دیجیتال، تایید اعتبار هویت بر اساس داده‌های ارسالی بازسازی و جهت ممیزی نهایی در دسترس شماست.
                    </p>
                  </div>
                </div>

                {/* DYNAMIC DOCUMENT RENDERING ACCORDING TO ACTUAL FILE NAME */}
                {isNationalId ? (
                  /* 1. IRANIAN INTELLIGENT NATIONAL CARD SIMULATION */
                  <div className="bg-gradient-to-tr from-slate-100 via-blue-100/30 to-blue-200/40 border-2 border-slate-300 rounded-3xl p-5 relative overflow-hidden shadow-md max-w-md mx-auto aspect-[1.586/1] flex flex-col justify-between">
                    {/* Flag visual strip */}
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-white to-green-600 opacity-80" />
                    
                    {/* Hologram Circle */}
                    <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-indigo-500/10 to-teal-500/5 blur-xl pointer-events-none" />

                    <div>
                      {/* Top Header Section */}
                      <div className="flex justify-between items-start">
                        <div className="text-[7.5px] text-slate-500 font-extrabold text-left font-sans leading-tight">
                          <div>ISLAMIC REPUBLIC OF IRAN</div>
                          <div>NATIONAL IDENTITY CARD</div>
                        </div>
                        <div className="text-center">
                          <span className="text-[10px] font-extrabold text-slate-800 block">کارت هوشمند ملی</span>
                          <span className="text-[7.5px] text-slate-500 font-bold block">جمهوری اسلامی ایران | وزارت کشور</span>
                        </div>
                        {/* Emblem Mock */}
                        <div className="w-5 h-5 border border-slate-300 rounded-full flex items-center justify-center text-[7px] bg-white font-extrabold text-red-600 shrink-0">
                          الله
                        </div>
                      </div>

                      {/* Golden Smart Chip & Photo Slot Row */}
                      <div className="flex gap-3 mt-3">
                        {/* Golden Electronic Chip Layout */}
                        <div className="w-9 h-7 bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 rounded-md border border-amber-600/40 shadow-xs flex flex-col justify-between p-1 shrink-0">
                          <div className="flex justify-between">
                            <div className="w-0.5 h-1 bg-amber-700/30" />
                            <div className="w-1 h-1 bg-amber-700/30 rounded-full" />
                            <div className="w-0.5 h-1 bg-amber-700/30" />
                          </div>
                          <div className="h-0.5 bg-amber-700/20" />
                          <div className="flex justify-between">
                            <div className="w-1.5 h-1 bg-amber-700/20 border-r border-amber-800" />
                            <div className="w-1.5 h-1 bg-amber-700/20 border-l border-amber-800" />
                          </div>
                        </div>

                        {/* Identification Fields */}
                        <div className="flex-1 space-y-0.5 text-right text-[10px] font-bold text-slate-700">
                          <div>
                            <span className="text-slate-400">نام:</span> <span className="text-slate-900 font-extrabold">{firstName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">نام خانوادگی:</span> <span className="text-slate-900 font-extrabold">{lastName}</span>
                          </div>
                          <div>
                            <span className="text-slate-400">نام پدر:</span> <span className="text-slate-800">{fatherName}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-1 text-[8.5px]">
                            <div>
                              <span className="text-slate-400">تولد:</span> <span className="text-slate-800 font-mono">{birthDate}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">جنسیت:</span> <span className="text-slate-850">مرد</span>
                            </div>
                          </div>
                        </div>

                        {/* User Photo Box */}
                        <div className="w-16 h-20 bg-slate-205 rounded-lg border border-slate-300 shadow-inner flex flex-col items-center justify-center text-slate-400 relative overflow-hidden shrink-0">
                          <User className="w-8 h-8 text-slate-400" />
                          <div className="absolute bottom-0 inset-x-0 bg-slate-800/20 text-[6px] py-0.5 text-center text-slate-600 font-bold">
                            الکترونیک ۴*۳
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer National ID bar */}
                    <div className="pt-2 border-t border-slate-300 flex items-center justify-between mt-2 text-[9.5px]">
                      <div>
                        <span className="text-slate-450 font-bold">شماره ملی:</span>{' '}
                        <strong className="text-slate-950 font-mono text-xs font-black tracking-wide bg-white/70 px-1.5 py-0.5 rounded border border-slate-250">
                          {nationalCode}
                        </strong>
                      </div>
                      <div className="text-[8px] text-slate-450 font-semibold text-left leading-none">
                        <div>اعتبار تا: <span className="font-mono text-slate-800 font-bold">۱۴۱۰/۱۲/۲۹</span></div>
                        <div className="text-[7px] text-blue-800 font-serif font-black underline underline-offset-1 mt-0.5">{previewDoc.docName}</div>
                      </div>
                    </div>
                  </div>
                ) : isBusinessPermit ? (
                  /* 2. IRANIAN TRADESMEN BUSINESS LICENSE SIMULATION */
                  <div className="bg-amber-50/15 border-4 border-double border-emerald-800/30 rounded-3xl p-6 relative overflow-hidden shadow-sm text-right bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] text-slate-700">
                    {/* Watermark symbol background */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none select-none">
                      <Shield className="w-64 h-64 text-emerald-900" />
                    </div>

                    {/* Top Ornate Header */}
                    <div className="text-center space-y-1 relative z-10">
                      <h5 className="font-serif font-black text-emerald-900 text-[13px] tracking-wider">وزارت صنعت، معدن و تجارت جمهوری اسلامی ایران</h5>
                      <span className="text-[9.5px] text-slate-500 font-bold block">دبیرخانه هیئت عالی نظارت بر سازمان‌های صنفی کشور</span>
                      <strong className="inline-block bg-emerald-600/10 text-emerald-900 text-[10px] px-4 py-1 rounded-full font-extrabold border border-emerald-200 mt-1">
                        پروانه‌ کسب دائم فعالیتهای صنف خدمات لوازم خانگی و پکیج
                      </strong>
                    </div>

                    {/* Document details layout */}
                    <div className="mt-5 space-y-3.5 text-xs font-bold text-slate-800 relative z-10">
                      <div className="grid grid-cols-2 gap-4 border-b border-dashed border-emerald-700/10 pb-2">
                        <div>
                          <span className="text-slate-400">صاحب پروانه کسب:</span>{' '}
                          <span className="text-slate-950 underline underline-offset-2 font-extrabold">{previewDoc.techName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">شناسه صنفی رقمی:</span>{' '}
                          <span className="text-slate-900 font-mono text-[11px]">۰۴۶۷۳۷۹۱۲۳</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div>
                          <span className="text-slate-400">نوع فعالیت و رسته شغلی مجاز:</span>{' '}
                          <span className="text-emerald-900 font-extrabold">تعمیرات تخصصی، نصب، لوله‌کشی گاز، سرویس اساسی و رفع ارورهای انواع سیستم برودتی، پکیج‌ها و اسپلیت</span>
                        </div>
                        <div>
                          <span className="text-slate-400">نام کامل فایل ارسالی:</span>{' '}
                          <span className="text-blue-700 font-mono text-[11px] font-extrabold">{previewDoc.docName}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 leading-tight">
                        <div className="text-center bg-white/70 p-2 rounded-xl border border-slate-200/60">
                          <div className="text-slate-400 text-[8.5px]">کد ملی متقاضی</div>
                          <div className="text-slate-900 font-mono text-[10.5px] mt-0.5">{nationalCode}</div>
                        </div>
                        <div className="text-center bg-white/70 p-2 rounded-xl border border-slate-200/60">
                          <div className="text-slate-400 text-[8.5px]">تاریخ صدور مجوز</div>
                          <div className="text-slate-900 font-mono text-[10.5px] mt-0.5">۱۴۰۳/۰۴/۱۵</div>
                        </div>
                        <div className="text-center bg-white/70 p-2 rounded-xl border border-slate-200/60">
                          <div className="text-slate-400 text-[8.5px]">وضعیت تاییدیه صنف</div>
                          <div className="text-emerald-700 mt-0.5">فعال و تاییدشده</div>
                        </div>
                      </div>
                    </div>

                    {/* Seals & Signatures in bottom footer */}
                    <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center justify-between relative z-10">
                      <div className="text-[8px] text-slate-500 font-bold max-w-sm">
                        * این پروانه کسب بر اساس تلاقی مستندات برخط و فیزیکی صادر شده و در سامانه ایران ارور معتبر قلمداد می‌شود.
                      </div>
                      
                      {/* Stamp design */}
                      <div className="flex flex-col items-center">
                        <div className="w-12 h-12 rounded-full border-3 border-emerald-600/40 border-dashed flex items-center justify-center rotate-6 text-emerald-600 text-[8px] font-black select-none">
                          <div className="text-center leading-none">
                            مهر رسمی<br/>صنعت معدن
                          </div>
                        </div>
                        <span className="text-[7.5px] text-slate-455 mt-1 font-bold">اتحادیه سرویس‌کاران کشوری</span>
                      </div>
                    </div>
                  </div>
                ) : isPoliceClearance ? (
                  /* 3. POLICE CLEARANCE CERTIFICATE (JUDICIARY) SYSTEM */
                  <div className="bg-white border-2 border-slate-300 rounded-3xl p-6 relative overflow-hidden shadow-sm text-right text-slate-800">
                    {/* Header bar */}
                    <div className="border-b-2 border-double border-slate-350 pb-3 mb-4 text-center relative z-10">
                      <div className="flex justify-between items-center text-[8.5px] text-slate-500 font-bold mb-1">
                        <div>شماره ابلاغیه: <span className="font-mono text-slate-800">{Math.floor(1000000 + Math.random() * 9000000)}</span></div>
                        <div className="font-serif font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                          <span>قوه قضاییه جمهوری اسلامی ایران</span>
                        </div>
                        <div>تاریخ ابلاغ برخط: <span className="font-mono text-slate-800">۱۴۰۵/۰۲/۱۴</span></div>
                      </div>
                      <span className="text-[10px] text-slate-500 block font-bold">سامانه ابلاغ قضایی الکترونیک (ثنا) - معاونت آمار و اطلاعات</span>
                      <h5 className="font-extrabold text-slate-950 text-xs mt-2 font-sans">گواهی الکترونیکی عدم سوء پیشینه کیفری</h5>
                    </div>

                    {/* Core Body of police clearance */}
                    <div className="space-y-4 text-xs font-bold leading-relaxed text-slate-700 text-right pr-2 pl-2 relative z-10">
                      <p>
                        در پاسخ به تقاضای همکار فنی گرامی که سوابق هویتی ایشان در بستر احراز هویت هوشمند ثنا مورد تایید قرار گرفته است، به استحضار مراجع ممیزی و اداری می‌رساند:
                      </p>
                      
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-205 space-y-1 my-3">
                        <div>
                          <span className="text-slate-450">متقاضی محترم:</span>{' '}
                          <span className="text-slate-950 text-xs font-black">{previewDoc.techName}</span>
                        </div>
                        <div>
                          <span className="text-slate-450">به شماره ملی ثبت احوال:</span>{' '}
                          <span className="text-slate-900 font-mono text-[11px]">{nationalCode}</span>
                        </div>
                        <div>
                          <span className="text-slate-450">نام پدر متقاضی:</span>{' '}
                          <span className="text-slate-800">{fatherName}</span>
                        </div>
                        <div>
                          <span className="text-slate-450">مدرک بارگذاری شده:</span>{' '}
                          <span className="text-blue-750 font-mono font-bold">{previewDoc.docName}</span>
                        </div>
                      </div>

                      <p className="text-slate-950 leading-relaxed text-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-200/80 text-emerald-950">
                        👨‍⚖️ طبق بررسی‌های سیستمی برخط از اداره کل سجل کیفری و عفو و بخشودگی قوه‌ قضائیه و مراجع محترم فراجا، نامبرده در تاریخ استعلام، **فاقد هرگونه سابقه کیفری موثر یا محکومیت قضایی فعال** در سراسر گستره مرزی جمهوری اسلامی ایران می‌باشد.
                      </p>
                    </div>

                    {/* QR and Barcode signature footer */}
                    <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-end justify-between relative z-10">
                      <div className="space-y-0.5 text-[8.5px] text-slate-455 font-bold text-right">
                        <div>تاییدیه دیجیتال: <span className="text-emerald-700 font-bold">صحیح و فاقد خدشه</span></div>
                        <div>این سند از طریق سامانه <span className="font-mono text-slate-800">adliran.ir</span> ابلاغ الکترونیک صادر گردیده است.</div>
                        <div className="font-mono text-[8.0px] text-slate-400 mt-1.5">||||| ||| ||||||| ||||| ||||||| {Math.floor(100000 + Math.random() * 900000)}</div>
                      </div>

                      <div className="flex flex-col items-center">
                        {/* Simulated QR Code representation */}
                        <div className="w-12 h-12 bg-slate-100 p-1.5 rounded-lg border border-slate-250 flex flex-wrap gap-[2px] items-center justify-center opacity-70">
                          {Array.from({ length: 16 }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-2.5 h-2.5 rounded-xs ${
                                (i * 3 + 5) % 4 === 0 || i === 0 || i === 2 || i === 7 || i === 11 || i === 15 
                                  ? 'bg-slate-850' 
                                  : 'bg-transparent'
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-[7px] text-slate-500 font-bold mt-1">شناسه کیوآر ثنا</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 4. DEFAULT: OFFICIAL TVTO COMPETENCE CERTIFICATE */
                  <div className="bg-amber-50/20 border-4 border-double border-amber-600/30 rounded-3xl p-6 relative overflow-hidden shadow-xs text-right card-farsi">
                    {/* Visual watermark background symbol */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                      <Shield className="w-72 h-72 text-amber-900" />
                    </div>

                    {/* Certificate content heading layout */}
                    <div className="text-center space-y-2 relative z-10">
                      <h5 className="font-serif font-extrabold text-amber-900 text-sm tracking-wider">سازمان آموزش فنی و حرفه‌ای کشور</h5>
                      <p className="text-[9px] text-slate-500 font-bold">معاونت مهارت‌سنجی و تایید گواهی‌نامه‌های الکترونیک</p>
                      
                      <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto my-3" />
                      
                      <span className="inline-block bg-amber-600/10 text-amber-900 text-[10px] px-3.5 py-1 rounded-full font-extrabold border border-amber-100">
                        گواهی رسمی تاییدیه مهارت و صلاحیت فنی‌و‌صنعتی
                      </span>
                    </div>

                    {/* Certificate main text body */}
                    <div className="mt-6 space-y-4 text-xs text-slate-700 leading-relaxed text-center relative z-10 font-bold">
                      <p className="text-slate-800 leading-relaxed">
                        بدینوسیله گواهی می‌شود همکار محترم پودمان فنی جناب آقای <strong className="text-slate-950 text-sm underline underline-offset-4 decoration-amber-500">{previewDoc.techName}</strong> با ارائه مستندات رسمی الکترونیک گواهینامه صلاحیت صادر شده خود را تسلیم نموده است.
                      </p>
                      <div className="flex justify-center py-1">
                        <div className="bg-white/95 border border-slate-200/80 px-4 py-2.5 rounded-xl inline-block shadow-2xs space-y-0.5">
                          <div className="text-slate-[550] text-[10px]">نوع فایل و گواهی ثبت شده تکنسین:</div>
                          <div className="text-blue-700 font-mono text-xs font-bold leading-none">{previewDoc.docName}</div>
                        </div>
                      </div>
                    </div>

                    {/* Date & Signature Stamp Footer */}
                    <div className="mt-8 pt-4 border-t border-slate-200/55 flex items-end justify-between relative z-10 text-right">
                      <div className="space-y-1 text-[9px] text-slate-500 font-extrabold">
                        <div>کد ثبت هوشمند گواهی: <span className="font-mono text-slate-800">TV-{Math.floor(100000 + Math.random() * 900000)}</span></div>
                        <div>نام تخصص احرازشده: <span className="text-slate-800 underline underline-offset-1">سرویس برودتی و پکیج</span></div>
                        <div>وضعیت فیزیکی مدرک: <span className="text-emerald-700">بارگذاری شده و سالم</span></div>
                      </div>

                      {/* Stamp Design Badge */}
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-14 h-14 rounded-full border-4 border-blue-600/30 border-dashed flex items-center justify-center rotate-12 text-blue-600 text-[9px] font-extrabold select-none">
                          <div className="border border-blue-600/50 p-1 rounded-full text-center leading-none">
                            تاییدیه<br/>ممیزی
                          </div>
                        </div>
                        <span className="text-[8px] text-slate-400 font-extrabold">نمایندگی استان تهران</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Form */}
              <div className="bg-slate-50 p-5 border-t border-slate-150 flex items-center justify-between flex-wrap gap-3">
                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>بررسی و تایید موقت با موفقیت گارانتی شد.</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer transition-all"
                  >
                    انصراف
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      alert('مهر صحت گواهی همکار با موفقیت در سیستم ثبت گردید.');
                      setPreviewDoc(null);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>تایید اصالت و ثبت در سیستم</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Manual Subscription Grant Modal */}
      {manualSubModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs text-right animate-in fade-in duration-150">
          <div className="bg-white border border-slate-205 shadow-2xl rounded-3xl p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900">⚡ فعال‌سازی دستی اشتراک ویژه برای کاربر</h4>
              <button
                type="button"
                onClick={() => setManualSubModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-extrabold p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">انتخاب کاربر (مشتری یا تکنسین):</label>
                <input
                  type="text"
                  placeholder="جستجوی نام یا شماره همراه..."
                  value={manualSubUserSearch}
                  onChange={(e) => setManualSubUserSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs px-3 py-2 rounded-xl mb-2 text-right outline-none focus:border-blue-500 font-bold"
                />
                <select
                  value={manualSubUserId}
                  onChange={(e) => setManualSubUserId(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs px-3 py-2.5 rounded-xl font-bold outline-none focus:border-blue-500 text-right"
                >
                  <option value="">-- یک کاربر انتخاب کنید --</option>
                  {usersList
                    .concat(technicians.map(t => ({ id: t.id || t.phone, full_name: t.name, phone: t.phone, role: 'technician' } as any)))
                    .filter(u => {
                      const q = manualSubUserSearch.toLowerCase();
                      return (u.full_name || u.name || '').toLowerCase().includes(q) || (u.phone || '').includes(q);
                    })
                    .map((u, uIdx) => (
                      <option key={`manual_user_${u.id || u.phone}_${uIdx}`} value={u.id || u.phone}>
                        {u.full_name || u.name || 'کاربر'} ({u.phone}) [{u.role === 'technician' ? 'تکنسین' : 'مشتری'}]
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">نوع پلن اشتراک:</label>
                <select
                  value={manualSubPlan}
                  onChange={(e) => setManualSubPlan(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs px-3 py-2.5 rounded-xl font-bold outline-none focus:border-blue-500 text-right"
                >
                  <option value="1_month">۱ ماهه طلایی (۳۰ روز)</option>
                  <option value="3_month">۳ ماهه نقره‌ای پلاس (۹۰ روز)</option>
                  <option value="6_month">۶ ماهه VIP (۱۸۰ روز)</option>
                  <option value="12_month">۱۲ ماهه وفاداری (۳۶۵ روز)</option>
                  <option value="permanent">دائمی / نامحدود (۱۰۰ سال)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setManualSubModalOpen(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={!manualSubUserId}
                onClick={() => {
                  if (onManualAddSubscription && manualSubUserId) {
                    onManualAddSubscription(manualSubUserId, manualSubPlan);
                    setManualSubModalOpen(false);
                    setManualSubUserId('');
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                تایید و فعال‌سازی اشتراک
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Postal Tracking Code Modal */}
      {postalTrackModalItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs text-right animate-in fade-in duration-150">
          <div className="bg-white border border-slate-205 shadow-2xl rounded-3xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-sm text-slate-900">🚚 ثبت / ویرایش کد رهگیری پستی مرسوله</h4>
              <button
                type="button"
                onClick={() => setPostalTrackModalItem(null)}
                className="text-slate-400 hover:text-slate-600 font-extrabold p-1 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
                <div><strong className="text-slate-700">خریدار:</strong> {postalTrackModalItem.customerName} ({postalTrackModalItem.customerPhone})</div>
                <div><strong className="text-slate-700">قطعه:</strong> {postalTrackModalItem.partName}</div>
                <div><strong className="text-slate-700">آدرس:</strong> {postalTrackModalItem.customerAddress}</div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">کد رهگیری پستی ۲۴ رقمی اداره پست:</label>
                <input
                  type="text"
                  placeholder="مثال: 123456789012345678901234"
                  value={postalTrackInput}
                  onChange={(e) => setPostalTrackInput(e.target.value)}
                  className="w-full bg-white border border-slate-200 text-xs px-3 py-2.5 rounded-xl font-bold font-mono tracking-wider dir-ltr text-center outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPostalTrackModalItem(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={!postalTrackInput.trim()}
                onClick={() => {
                  if (onUpdatePostalTrackCode && postalTrackModalItem) {
                    onUpdatePostalTrackCode(postalTrackModalItem.id, postalTrackInput.trim());
                    setPostalTrackModalItem(null);
                    setPostalTrackInput('');
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                ذخیره و ارسال پیامک به خریدار
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs text-right animate-in fade-in duration-150">
          <div className="bg-white border border-slate-205 shadow-2xl rounded-3xl p-6 max-w-sm w-full space-y-4">
            <div className="flex items-center gap-2 text-rose-600 border-b border-slate-100 pb-2.5">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce" />
              <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">{showConfirmModal.title}</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-bold">
              {showConfirmModal.message}
            </p>

            {showConfirmModal.requiresPasswordVerify && (
              <div className="space-y-1.5 text-right">
                <label className="block text-[10px] font-black text-slate-700">رمز عبور مدیریت کل سیستم:</label>
                <input
                  type="password"
                  placeholder="رمز عبور مدیریت را وارد کنید"
                  value={confirmPasswordInput}
                  onChange={(e) => {
                    setConfirmPasswordInput(e.target.value);
                    setConfirmPasswordError('');
                  }}
                  className="w-full bg-slate-50 border border-slate-205 text-xs px-3 py-2.5 rounded-xl outline-none focus:bg-white focus:border-rose-500 font-bold font-sans text-right"
                />
                {confirmPasswordError && (
                  <p className="text-[10px] text-rose-600 font-bold leading-normal">
                    {confirmPasswordError}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                انصراف و بازگشت
              </button>
              <button
                type="button"
                onClick={() => {
                  if (showConfirmModal.requiresPasswordVerify) {
                    if (!confirmPasswordInput.trim()) {
                      setConfirmPasswordError('⚠️ لطفا پسورد مدیریت را وارد کنید.');
                      return;
                    }
                    const activePass = adminPassword || '';
                    if (confirmPasswordInput !== activePass) {
                      setConfirmPasswordError('❌ رمز عبور مدیریت اشتباه است. با احترام عملیات مسدود گردید.');
                      return;
                    }
                  }
                  showConfirmModal.onConfirm(confirmPasswordInput);
                  setShowConfirmModal(null);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
              >
                تایید حذف قطعی
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
