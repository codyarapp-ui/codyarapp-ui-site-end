/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  FileText, Download, Printer, Eye, Search, Lock, 
  Sparkles, Filter, ChevronDown, Check, FileCheck, ArrowDownToLine,
  X, ZoomIn, ZoomOut, RotateCw, RefreshCw, AlertCircle
} from 'lucide-react';

interface TechDoc {
  id: string;
  title: string;
  type: string;
  fileUrl: string;
  fileSize: string;
  uploadedAt: string;
}

interface Device {
  id: string;
  brand: string;
  category: string;
  model: string;
}

interface TechDocsPanelProps {
  deviceId: string;
  currentUser: any;
  onUpgradeClick?: () => void;
  triggerNotification?: (title: string, text: string, type: 'success' | 'warning' | 'info' | 'error') => void;
}

export const TechDocsPanel: React.FC<TechDocsPanelProps> = ({
  deviceId,
  currentUser,
  onUpgradeClick,
  triggerNotification
}) => {
  const [docs, setDocs] = useState<TechDoc[]>([]);
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [selectedDocForUpgrade, setSelectedDocForUpgrade] = useState<TechDoc | null>(null);
  
  // Real document viewer states
  const [activeViewerDoc, setActiveViewerDoc] = useState<TechDoc | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  const documentTypes = [
    { value: 'all', label: 'همه اسناد فنی' },
    { value: 'Service Manual', label: 'Service Manual (راهنمای سرویس)' },
    { value: 'Wiring Diagram', label: 'Wiring Diagram (نقشه سیم‌کشی)' },
    { value: 'Schematic', label: 'Schematic (شماتیک فنی)' },
    { value: 'Exploded View', label: 'Exploded View (نقشه انفجاری)' },
    { value: 'Datasheet (PDF)', label: 'Datasheet (دیتاشیت فنی)' },
    { value: 'PCB Layout', label: 'PCB Layout (طرح برد الکترونیکی)' },
    { value: 'Catalog', label: 'Catalog (کاتالوگ رسمی)' }
  ];

  useEffect(() => {
    const fetchTechDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/device/${deviceId}/tech-docs?t=${Date.now()}`);
        if (!response.ok) {
          throw new Error('خطا در بارگذاری اطلاعات اسناد فنی از سرور.');
        }
        const result = await response.json();
        setDocs(result.docs || []);
        setDevice(result.device || null);
      } catch (err: any) {
        console.error('Error fetching tech docs:', err);
        setError(err.message || 'خطای غیرمنتظره در ارتباط با سرور.');
      } finally {
        setLoading(false);
      }
    };

    if (deviceId) {
      fetchTechDocs();
    }
  }, [deviceId]);

  // Is premium check
  const isPremium = currentUser?.subscription?.is_premium || currentUser?.role === 'admin' || currentUser?.is_super_admin;

  const handleAction = (doc: TechDoc, action: 'view' | 'download' | 'print') => {
    // Premium documents restriction: Service Manuals, Wiring Diagrams, Schematics, Exploded Views, PCB Layouts are premium!
    const isPremiumDoc = ['Service Manual', 'Wiring Diagram', 'Schematic', 'PCB Layout', 'Exploded View'].includes(doc.type);

    if (isPremiumDoc && !isPremium) {
      setSelectedDocForUpgrade(doc);
      setShowUpgradeModal(true);
      if (triggerNotification) {
        triggerNotification('مدرک فنی ویژه', 'دسترسی به نقشه‌ها و کتابچه‌های تخصصی نیاز به اشتراک ویژه دارد.', 'warning');
      }
      return;
    }

    // Process action if allowed
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
        // Fallback inside frame or open in new window
        window.open(doc.fileUrl, '_blank');
      }
    }
  };

  const filteredDocs = docs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 sm:p-6 space-y-6 shadow-xs relative text-right">
      {/* Section Header */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-slate-900">📑 کتابچه‌ها، نقشه‌های سیم‌کشی و اسناد فنی دستگاه</h3>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">دیتاشیت‌ها، کاتالوگ‌ها، نقشه‌های مداری و کالبدشکافی قطعات الکترونیکی مربوط به این دستگاه</p>
          </div>
        </div>

        {/* Brand/Model Badge */}
        {device && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-200/70 border border-slate-300/40 px-3 py-1.5 rounded-xl text-[10.5px] text-slate-700 font-bold">
            <span className="text-slate-500">کیت اختصاصی:</span>
            <span>{device.category} {device.brand}</span>
            <span className="text-slate-400 font-mono">({device.model})</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center space-y-3">
          <div className="inline-block relative w-8 h-8">
            <span className="absolute inset-0 border-3 border-amber-500/20 rounded-full"></span>
            <span className="absolute inset-0 border-3 border-t-amber-500 rounded-full animate-spin"></span>
          </div>
          <p className="text-xs text-slate-500 font-bold animate-pulse">در حال فراخوانی پکیج نقشه‌ها و اسناد تخصصی دستگاه...</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-100 text-rose-850 p-4 rounded-2xl text-xs font-bold leading-relaxed">
          ⚠️ {error}
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-xs font-bold space-y-2">
          <p>مدرک فنی اختصاصی برای این مدل هنوز توسط کارگاه مدیریت بارگذاری نشده است.</p>
          <p className="text-[10px] text-slate-400/80">جهت درخواست نقشه و دیتاشیت با پشتیبانی کدیار24 تماس حاصل فرمایید.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Controls: Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در فایلهای فنی این دستگاه..."
                className="w-full bg-white border border-slate-200 text-xs px-10 py-2.5 rounded-xl outline-none focus:border-amber-500 font-bold text-right transition-all"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Document Type Filter */}
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 text-xs px-4 py-2.5 pr-10 rounded-xl outline-none focus:border-amber-500 font-bold text-right transition-all cursor-pointer"
              >
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <Filter className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* List of documents */}
          {filteredDocs.length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-[11px] font-bold">
              هیچ فایلی منطبق با فیلتر یا عبارت مورد جستجو یافت نشد.
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {filteredDocs.map((doc) => {
                const isPremiumDoc = ['Service Manual', 'Wiring Diagram', 'Schematic', 'PCB Layout', 'Exploded View'].includes(doc.type);
                const requiresLock = isPremiumDoc && !isPremium;

                return (
                  <div
                    key={doc.id}
                    className="bg-white border border-slate-200/70 hover:border-slate-300 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-start gap-3 text-right">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-3xs ${
                        doc.type === 'Wiring Diagram' || doc.type === 'Schematic' 
                          ? 'bg-blue-50 text-blue-600 border border-blue-100'
                          : doc.type === 'Service Manual'
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-[11px] sm:text-xs font-extrabold text-slate-800 leading-relaxed">{doc.title}</h4>
                          <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-md ${
                            doc.type === 'Wiring Diagram' || doc.type === 'Schematic'
                              ? 'bg-blue-100 text-blue-800'
                              : doc.type === 'Service Manual'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-150 text-slate-700'
                          }`}>
                            {doc.type}
                          </span>
                          {isPremiumDoc && (
                            <span className="bg-amber-100 text-amber-800 text-[8px] px-1.5 py-0.5 rounded-md font-extrabold flex items-center gap-1 shrink-0">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>ویژه</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[9.5px] text-slate-400 font-mono">
                          <span>حجم فایل: {doc.fileSize}</span>
                          <span>•</span>
                          <span>به‌روزرسانی: {doc.uploadedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 w-full md:w-auto shrink-0 self-stretch md:self-auto justify-end">
                      {/* View Button */}
                      <button
                        type="button"
                        onClick={() => handleAction(doc, 'view')}
                        className={`px-3 py-2 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer flex-1 md:flex-none justify-center ${
                          requiresLock
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {requiresLock ? (
                          <>
                            <Lock className="w-3.5 h-3.5 text-amber-600" />
                            <span>قفل اشتراک</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>پیش‌نمایش</span>
                          </>
                        )}
                      </button>

                      {/* Download Button */}
                      <button
                        type="button"
                        onClick={() => handleAction(doc, 'download')}
                        className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 px-3 py-2 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer flex-1 md:flex-none justify-center"
                      >
                        <Download className="w-3.5 h-3.5 text-white" />
                        <span>دریافت فایل</span>
                      </button>

                      {/* Print Button */}
                      <button
                        type="button"
                        onClick={() => handleAction(doc, 'print')}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-250 px-2.5 py-2 rounded-xl text-[10px] font-extrabold flex items-center gap-1 transition-all cursor-pointer hidden sm:flex shrink-0 justify-center"
                        title="چاپ مستقیم فیزیکی"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Account Upgrade Modal */}
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

            <div className="space-y-3">
              <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-[11px] leading-relaxed text-amber-900">
                مشاهده نقشه‌های الکترونیکی، شماتیک فنی مداری، طرح PCB و کتابچه کامل راهنمای عیب‌یابی (Service Manual) ماشین‌آلات صنعتی و لوازم خانگی به دلیل ماهیت تجاری و حق تکثیر کارخانه سازنده، منحصراً برای همکاران دارای <b>«عضویت ویژه کدیار۲۴»</b> باز است.
              </div>

              {selectedDocForUpgrade && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-right">
                  <div className="text-[10px] text-slate-400 font-bold">فایل قفل شده انتخاب شده:</div>
                  <div className="text-xs font-extrabold text-slate-750 mt-1">{selectedDocForUpgrade.title}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">نوع سند: {selectedDocForUpgrade.type} | حجم: {selectedDocForUpgrade.fileSize}</div>
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
                  if (onUpgradeClick) onUpgradeClick();
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

      {/* Real In-App Document Viewer Modal */}
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
                    سند فنی: <span className="text-amber-400 font-extrabold">{activeViewerDoc.title}</span> | دسته‌بندی: <span className="font-bold">{activeViewerDoc.type}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveViewerDoc(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors active:scale-95"
                title="بستن پنجره"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Toolbar for image viewer */}
            <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between gap-3 text-[10px] font-extrabold text-slate-600 flex-wrap flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-md font-extrabold border border-slate-300">
                  {/\.(jpg|jpeg|png|gif|webp|svg)/i.test(activeViewerDoc.fileUrl) ? 'تصویر نقشه/طرح' : /\.pdf/i.test(activeViewerDoc.fileUrl) ? 'سند رسمی PDF' : 'فایل فنی'}
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500 font-mono text-[9.5px]">حجم: {activeViewerDoc.fileSize}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {/\.(jpg|jpeg|png|gif|webp|svg)/i.test(activeViewerDoc.fileUrl) && (
                  <>
                    <button
                      onClick={() => setZoom(prev => Math.min(prev + 0.25, 3))}
                      className="p-1 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                      title="بزرگنمایی"
                    >
                      <ZoomIn className="w-4 h-4 text-slate-500" />
                    </button>
                    <button
                      onClick={() => setZoom(prev => Math.max(prev - 0.25, 0.5))}
                      className="p-1 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                      title="کوچک‌نمایی"
                    >
                      <ZoomOut className="w-4 h-4 text-slate-500" />
                    </button>
                    <button
                      onClick={() => setRotation(prev => (prev + 90) % 360)}
                      className="p-1 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                      title="چرخش ۹۰ درجه"
                    >
                      <RotateCw className="w-4 h-4 text-slate-500" />
                    </button>
                    <button
                      onClick={() => { setZoom(1); setRotation(0); }}
                      className="p-1 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                      title="بازنشانی اندازه و جهت"
                    >
                      <RefreshCw className="w-4 h-4 text-slate-500" />
                    </button>
                    <span className="text-slate-300 mx-1">|</span>
                  </>
                )}

                <button
                  onClick={() => handleAction(activeViewerDoc, 'download')}
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-[10px] font-black cursor-pointer transition-all active:scale-95 shadow-xs"
                >
                  <Download className="w-3 h-3 text-white" />
                  <span>دانلود مستقیم سند</span>
                </button>
              </div>
            </div>

            {/* Viewport content */}
            <div className="flex-1 overflow-auto p-4 bg-slate-100 flex items-center justify-center min-h-[400px] max-h-[60vh]">
              {/\.pdf/i.test(activeViewerDoc.fileUrl) ? (
                /* PDF Frame */
                <iframe
                  src={activeViewerDoc.fileUrl}
                  className="w-full h-[55vh] border-0 rounded-2xl bg-white shadow-sm"
                  title={activeViewerDoc.title}
                />
              ) : /\.(jpg|jpeg|png|gif|webp|svg)/i.test(activeViewerDoc.fileUrl) ? (
                /* Image container with stateful zoom and rotation */
                <div className="overflow-hidden p-2 flex items-center justify-center w-full h-full">
                  <div 
                    className="transition-transform duration-250 ease-out select-none"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                    }}
                  >
                    <img
                      src={activeViewerDoc.fileUrl}
                      alt={activeViewerDoc.title}
                      className="max-h-[50vh] max-w-full object-contain rounded-xl border border-slate-300 shadow-md bg-white"
                    />
                  </div>
                </div>
              ) : (
                /* Non-previewable fallback */
                <div className="text-center p-8 bg-white border border-slate-200 rounded-3xl max-w-md shadow-sm space-y-4">
                  <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
                  <h5 className="font-extrabold text-xs sm:text-sm text-slate-800">{activeViewerDoc.title}</h5>
                  <p className="text-[10.5px] text-slate-500 leading-relaxed font-bold">
                    این سند فنی با فرمت اختصاصی بارگذاری شده و پیش‌نمایش مستقیم آن در مرورگر امکان‌پذیر نیست. لطفا از دکمه زیر جهت دریافت مستقیم استفاده نمایید.
                  </p>
                  <button 
                    onClick={() => handleAction(activeViewerDoc, 'download')}
                    className="bg-blue-600 hover:bg-blue-700 text-white border border-blue-600 px-4 py-2 rounded-xl text-[10px] font-black shadow-md cursor-pointer transition-all active:scale-95 inline-flex items-center gap-1.5 mx-auto"
                  >
                    <Download className="w-3.5 h-3.5 text-white" />
                    <span>دانلود فایل فنی</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-3.5 border-t border-slate-200 text-center text-[10px] font-bold text-slate-500">
              توسعه داده شده توسط سامانه هوشمند عیب‌یابی کدیار۲۴ • اسناد و نقشه‌های تخصصی
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
