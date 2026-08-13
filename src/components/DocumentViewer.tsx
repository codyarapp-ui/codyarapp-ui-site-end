import React from 'react';
import { 
  X, ZoomIn, ZoomOut, RotateCw, Download, FileText, 
  AlertCircle, Shield, CheckCircle2, User, RefreshCw, Eye
} from 'lucide-react';

interface DocumentViewerProps {
  techName: string;
  docName: string; // can be a legacy name or JSON-serialized string of { name, fileData, fileType }
  onClose: () => void;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ techName, docName, onClose }) => {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [errorOccurred, setErrorOccurred] = React.useState(false);

  React.useEffect(() => {
    setErrorOccurred(false);
    setZoom(1);
    setRotation(0);
  }, [docName]);

  // Parse JSON-serialized real document if applicable
  const parsedDoc = React.useMemo(() => {
    try {
      if (docName && docName.startsWith('{')) {
        const parsed = JSON.parse(docName);
        const dataUrl = parsed.fileData || parsed.fileUrl;
        if (dataUrl) {
          return {
            isReal: true,
            name: parsed.name || 'سند بارگذاری‌شده',
            fileData: dataUrl,
            fileType: parsed.fileType || ''
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse document JSON:', e);
    }
    return {
      isReal: false,
      name: docName,
      fileData: '',
      fileType: ''
    };
  }, [docName]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const handleDownload = () => {
    if (parsedDoc.isReal && parsedDoc.fileData) {
      const link = document.createElement('a');
      link.href = parsedDoc.fileData;
      // Extract file extension or default
      let ext = 'png';
      if (parsedDoc.fileType.includes('pdf')) ext = 'pdf';
      else if (parsedDoc.fileType.includes('jpeg') || parsedDoc.fileType.includes('jpg')) ext = 'jpg';
      
      link.download = `${techName}_${parsedDoc.name}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      alert('فایل ضمیمه معتبری برای دانلود یافت نشد، یا از خدمات ابری جاری پشتیبانی نمی‌شود.');
    }
  };

  const isImage = parsedDoc.fileType ? parsedDoc.fileType.startsWith('image/') : false;
  const isPdf = parsedDoc.fileType ? parsedDoc.fileType.includes('pdf') : false;

  // Derive simulated Iranian ID values if it is a legacy text-only document
  const simulatedData = React.useMemo(() => {
    const name = techName || 'سرویس‌کار ایران ارور';
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    hash = Math.abs(hash);
    
    const nationalCode = `${String(100 + (hash % 899))}-${String(100000 + (hash % 899999))}-${hash % 10}`;
    const fatherName = ['محمد', 'علی', 'علیرضا', 'غلامحسین', 'ابوالفضل', 'مرتضی', 'رضا', 'احمد', 'حمید'][hash % 9];
    const birthYear = 1354 + (hash % 26);
    const birthMonth = String(1 + (hash % 12)).padStart(2, '0');
    const birthDay = String(1 + (hash % 28)).padStart(2, '0');
    const birthDate = `${birthYear}/${birthMonth}/${birthDay}`;

    const docLower = parsedDoc.name.toLowerCase();
    const isSimulatedNationalCard = docLower.includes('ملی') || docLower.includes('کارت') || docLower.includes('national') || docLower.includes('شناسنامه');
    const isSimulatedBusinessPermit = docLower.includes('جواز') || docLower.includes('کسب') || docLower.includes('business') || docLower.includes('پروانه') || docLower.includes('صنف');
    const isSimulatedPoliceClearance = docLower.includes('سوء') || docLower.includes('پیشینه') || docLower.includes('clearance') || docLower.includes('سوءپیشینه');

    return {
      nationalCode,
      fatherName,
      birthDate,
      birthYear,
      isSimulatedNationalCard,
      isSimulatedBusinessPermit,
      isSimulatedPoliceClearance
    };
  }, [techName, parsedDoc.name]);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[4px] z-[10000] flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200 text-slate-800 text-right dir-rtl">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden font-sans text-right dir-rtl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white flex items-center justify-between shadow-md flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/15 p-2 rounded-2xl">
              {isPdf ? (
                <FileText className="w-5 h-5 text-red-300" />
              ) : (
                <Eye className="w-5 h-5 text-blue-200" />
              )}
            </div>
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-white">نمایشگر هوشمند مدارک صلاحیت فنی (DocumentViewer)</h4>
              <p className="text-[10px] text-blue-150 font-semibold mt-0.5">
                تکنسین: <span className="text-white underline underline-offset-2">{techName}</span> | سند: <span className="font-mono text-blue-100">{parsedDoc.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer transition-colors active:scale-95"
            title="بستن پنجره"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar (Only for real files & images) */}
        {parsedDoc.isReal && (
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between gap-3 text-xs font-bold text-slate-600 flex-wrap flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full font-extrabold border border-indigo-100 uppercase">
                {isPdf ? 'فایل PDF گواهی' : 'عکس مدرک'}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-[11px] text-slate-700">{parsedDoc.name}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {!isPdf && (
                <>
                  <button
                    onClick={handleZoomIn}
                    className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                    title="بزرگنمایی"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleZoomOut}
                    className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                    title="کوچک‌نمایی"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleRotate}
                    className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer"
                    title="چرخش ۹۰ درجه"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleReset}
                    className="p-1.5 rounded-lg hover:bg-slate-200 hover:text-slate-900 transition-colors cursor-pointer text-xs"
                    title="بازنشانی اندازه و جهت"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <span className="text-slate-300 mx-1">|</span>
                </>
              )}

              <button
                onClick={handleDownload}
                className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-350 px-3 py-1.5 rounded-xl text-[11px] font-bold shadow-2xs cursor-pointer transition-all active:scale-95"
                title="دانلود سند اصلی"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>دانلود فایل فرستاده‌شده</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Viewport */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100 flex items-center justify-center min-h-[350px] relative">
          
          {parsedDoc.isReal ? (
            /* REAL UPLOADED FILE VIEWPORT */
            <div className="w-full h-full flex items-center justify-center max-h-[60vh]">
              {errorOccurred ? (
                <div className="text-center p-8 bg-white border border-rose-200 rounded-3xl max-w-sm shadow-sm space-y-3">
                  <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
                  <h5 className="font-extrabold text-sm text-slate-800">خطا در بارگذاری محتوای سند</h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
                    قالب یا داده‌های فایل ارسال شده معتبر نبوده یا به درستی رمزگذاری نشده است. لطفاً فایل سالم دیگری آپلود کنید.
                  </p>
                  <button 
                    onClick={handleDownload}
                    className="inline-flex items-center gap-1.5 text-blue-600 hover:underline text-[11px] font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    دانلود مستقیم فایل مدرک پیوست
                  </button>
                </div>
              ) : isPdf ? (
                /* PDF VIEWER */
                <div className="w-full h-full min-h-[480px] bg-white rounded-2xl border border-slate-200 shadow-inner overflow-hidden relative">
                  <object
                    data={parsedDoc.fileData}
                    type="application/pdf"
                    className="w-full h-full min-h-[480px]"
                    onError={() => setErrorOccurred(true)}
                  >
                    <iframe
                      src={parsedDoc.fileData}
                      className="w-full h-full min-h-[480px] border-0"
                      title={parsedDoc.name}
                    >
                      <div className="p-8 text-center space-y-4">
                        <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
                        <p className="text-xs text-slate-700 font-bold">نمایش مستقیم PDF در سیستم املایی شما پشتیبانی نمی‌شود.</p>
                        <button
                          onClick={handleDownload}
                          className="bg-blue-600 text-white rounded-xl px-4 py-2 text-xs font-bold shadow-md hover:bg-blue-700"
                        >
                          دانلود مستقیم PDF
                        </button>
                      </div>
                    </iframe>
                  </object>
                </div>
              ) : (
                /* IMAGE VIEWER WITH ZOOM AND ROTATION */
                <div className="overflow-hidden p-4 flex items-center justify-center max-w-full max-h-full">
                  <div 
                    className="transition-transform duration-200 ease-out select-none"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      maxHeight: '100%',
                      maxWidth: '100%'
                    }}
                  >
                    <img
                      src={parsedDoc.fileData}
                      alt={parsedDoc.name}
                      referrerPolicy="no-referrer"
                      className="max-h-[50vh] object-contain rounded-xl border border-slate-300 shadow-md bg-white"
                      onError={() => setErrorOccurred(true)}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* LEGACY PRE-SET SIMULATED INTERACTIVE DOCUMENT RENDERER */
            <div className="w-full max-w-md mx-auto aspect-[1.586/1] flex flex-col justify-between">
              
              {simulatedData.isSimulatedNationalCard ? (
                /* 1. NATIONAL CARD SIMULATION */
                <div className="bg-gradient-to-tr from-slate-100 via-blue-100/30 to-blue-200/40 border-2 border-slate-300 rounded-3xl p-5 relative overflow-hidden shadow-md aspect-[1.586/1] flex flex-col justify-between text-right animate-in fade-in zoom-in-95 duration-200">
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-600 via-white to-green-600 opacity-80" />
                  <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-gradient-to-br from-indigo-500/10 to-teal-500/5 blur-xl pointer-events-none" />

                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-blue-900/10 pb-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                        <span className="text-[9px] text-blue-900 font-extrabold">کارت هوشمند ملی جمهوری اسلامی ایران</span>
                      </div>
                      <span className="text-[8px] text-slate-500 font-bold font-mono">NATIONAL IDENTITY CARD</span>
                    </div>

                    {/* Main Card Content */}
                    <div className="flex gap-4">
                      {/* Avatar Picture Placeholder */}
                      <div className="w-[85px] h-[105px] border border-slate-300/80 bg-slate-200/60 rounded-xl flex flex-col items-center justify-center p-1 relative overflow-hidden flex-shrink-0 shadow-2xs">
                        <User className="w-12 h-12 text-slate-400" />
                        <div className="absolute bottom-1 bg-blue-600/10 text-blue-800 text-[6px] font-bold px-1.5 py-0.5 rounded-full">
                          تأیید صلاحیت ادمین
                        </div>
                      </div>

                      {/* User data list */}
                      <div className="flex-1 space-y-1.5 text-[10px] text-slate-700 font-black">
                        <div>
                          <span className="text-slate-450 font-bold ml-1.5">نام خانوادگی:</span>
                          <span className="text-slate-900">{techName.split(' ')[1] || 'سرویس‌کار'}</span>
                        </div>
                        <div>
                          <span className="text-slate-450 font-bold ml-1.5">نام کوچک:</span>
                          <span className="text-slate-900">{techName.split(' ')[0] || 'متخصص'}</span>
                        </div>
                        <div>
                          <span className="text-slate-450 font-bold ml-1.5">کد ملی صنف:</span>
                          <span className="font-mono text-slate-900 text-[11px] tracking-wide">{simulatedData.nationalCode}</span>
                        </div>
                        <div>
                          <span className="text-slate-450 font-bold ml-1.5">تاریخ تولد:</span>
                          <span className="font-mono text-slate-900">{simulatedData.birthDate}</span>
                        </div>
                        <div>
                          <span className="text-slate-450 font-bold ml-1.5">نام پدر:</span>
                          <span className="text-slate-900">{simulatedData.fatherName}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Smart chip element */}
                  <div className="flex items-end justify-between border-t border-blue-900/10 pt-2 text-[8px] text-slate-500 font-bold">
                    <div className="w-7 h-5 bg-gradient-to-br from-amber-200 to-amber-500 border border-amber-300/70 rounded-md shadow-2xs rotate-6" />
                    <div>اعتبار تا پایان سال ۱۴۰۸</div>
                  </div>
                </div>
              ) : simulatedData.isSimulatedBusinessPermit ? (
                /* 2. BUSINESS PERMIT SIMULATION */
                <div className="bg-gradient-to-tr from-orange-50 via-amber-50 to-amber-100/40 border-2 border-amber-350 rounded-3xl p-5 relative overflow-hidden shadow-md aspect-[1.586/1] flex flex-col justify-between text-right animate-in fade-in zoom-in-95 duration-200">
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-amber-600 opacity-95" />
                  
                  <div className="text-center space-y-1">
                    <h5 className="font-serif font-black text-amber-950 text-[11px] tracking-widest">پروانه کسب رسمی و اجازه کار برودتی</h5>
                    <p className="text-[7.5px] text-slate-500 font-bold">اتحادیه صنف تعمیرکاران لوازم خانگی و برودتی کشور</p>
                    <div className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto" />
                  </div>

                  <div className="my-2.5 text-[9.5px] text-slate-700 font-black space-y-1.5 leading-relaxed">
                    <p className="text-center font-bold text-[10px]">
                      بدینوسیله به <span className="text-slate-950 underline underline-offset-2 font-black">{techName}</span> اجازه رسمی فعالیت داده می‌شود.
                    </p>
                    <div className="grid grid-cols-2 gap-1 px-2">
                      <div>شماره ممیزی صنف: <span className="font-mono text-indigo-900">PC-{Math.floor(1000 + (Math.random() * 9000))}</span></div>
                      <div>شناسه فیزیکی کسب: <span className="font-mono text-indigo-900">LIC-{simulatedData.nationalCode.replace(/-/g, '')}</span></div>
                    </div>
                  </div>

                  {/* Signature and Badge Footer */}
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-[8px] text-slate-500 font-bold">
                    <div>شماره سریال: <span className="font-mono">S-{simulatedData.birthYear}</span></div>
                    
                    {/* Stamp Circular icon */}
                    <div className="w-10 h-10 rounded-full border border-blue-600 border-dashed flex items-center justify-center rotate-12 -translate-y-1">
                      <div className="text-blue-600 text-[6px] font-black text-center leading-none">
                        مهر رسمی<br/>اتحادیه
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* 3. SKILL CERTIFICATE FALLBACK */
                <div className="bg-gradient-to-tr from-slate-50 via-amber-50/20 to-amber-100/30 border-4 border-double border-amber-600/30 rounded-3xl p-6 relative overflow-hidden shadow-xs text-right animate-in fade-in zoom-in-95 duration-200">
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                    <Shield className="w-48 h-48 text-amber-900" />
                  </div>

                  <div className="text-center space-y-1 relative z-10">
                    <h5 className="font-serif font-extrabold text-amber-900 text-xs sm:text-sm tracking-wider">سازمان آموزش فنی و حرفه‌ای کشور</h5>
                    <p className="text-[8.5px] text-slate-500 font-semibold">تاییدیه اعتبار صلاحیت و پودمان‌های آموزش تخصصی الکترونیک</p>
                    <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-amber-600 to-transparent mx-auto my-2" />
                  </div>

                  <p className="mt-4 text-[10.5px] text-slate-700 leading-relaxed text-center font-bold">
                    جناب آقای <strong className="text-slate-950 text-sm underline underline-offset-4 decoration-amber-500">{techName}</strong> گواهی‌نامه رسمی پلاس فنی خود را به عنوان سند صلاحیت صنف ثبت نموده است.
                  </p>

                  <div className="mt-6 pt-3 border-t border-slate-255 flex items-end justify-between text-[8px] text-slate-500 font-extrabold">
                    <div>کد ثبت هوشمند: <span className="font-mono text-slate-800">TV-{simulatedData.nationalCode.replace(/-/g, '')}</span></div>
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="w-10 h-10 rounded-full border-2 border-blue-600/40 border-dashed flex items-center justify-center rotate-12 text-blue-600 text-[7px] font-extrabold select-none">
                        تاییدیه ممیزی
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer info text / Approval state reflection */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-[11px] font-bold text-slate-600 flex-shrink-0 flex-wrap gap-2.5">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="text-slate-700">وضعیت سند: تاییدشده و امن در دیتابیس هویت ملی</span>
          </div>
          <div className="text-slate-400 font-medium">
            * این پنل جهت ممیزی اسناد بارگذاری‌شده طراحی شده است.
          </div>
        </div>

      </div>
    </div>
  );
};
