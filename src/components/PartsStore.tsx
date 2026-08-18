/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SparePart } from '../types';
import { ShoppingBag, Check, ShieldCheck, Cpu, Box, Sparkles, CreditCard, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface PartsStoreProps {
  parts: SparePart[];
  categoriesList?: string[];
  onPurchase: (part: SparePart, address: string, buyerName?: string, buyerPhone?: string, cardHolder?: string, trackNumber?: string, quantity?: number) => void;
  brandFilter?: string;
  categoryFilter?: string;
  onClearFilters?: () => void;
}

export const PartsStore: React.FC<PartsStoreProps> = ({
  parts,
  categoriesList = [],
  onPurchase,
  brandFilter = '',
  categoryFilter = '',
  onClearFilters
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('همه');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [activeCheckoutPart, setActiveCheckoutPart] = React.useState<SparePart | null>(null);
  const [checkoutStep, setCheckoutStep] = React.useState<'form' | 'success'>('form');
  const [purchaseQuantity, setPurchaseQuantity] = React.useState<number>(1);
  const [zoomedPart, setZoomedPart] = React.useState<SparePart | null>(null);
  const [zoomScale, setZoomScale] = React.useState<number>(1);
  const [panPosition, setPanPosition] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const dragStartRef = React.useRef<{ startX: number; startY: number; initPosX: number; initPosY: number }>({ startX: 0, startY: 0, initPosX: 0, initPosY: 0 });

  const resetZoomAndPan = () => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only pan if zoomed in or dragged
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initPosX: panPosition.x,
      initPosY: panPosition.y
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;
    setPanPosition({
      x: dragStartRef.current.initPosX + deltaX,
      y: dragStartRef.current.initPosY + deltaY
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
      setIsDragging(false);
    }
  };

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomScale(prev => Math.min(3.5, Number((prev + 0.3).toFixed(2))));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomScale(prev => {
      const next = Math.max(0.7, Number((prev - 0.3).toFixed(2)));
      if (next <= 1) {
        setPanPosition({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const handleZoomWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoomScale(prev => Math.min(3.5, Number((prev + 0.2).toFixed(2))));
    } else {
      setZoomScale(prev => {
        const next = Math.max(0.7, Number((prev - 0.2).toFixed(2)));
        if (next <= 1) {
          setPanPosition({ x: 0, y: 0 });
        }
        return next;
      });
    }
  };

  // Checkout Fields
  const [userName, setUserName] = React.useState('');
  const [userPhone, setUserPhone] = React.useState('');
  const [userAddress, setUserAddress] = React.useState('');
  const [cardHolder, setCardHolder] = React.useState('');
  const [trackNumber, setTrackNumber] = React.useState('');

  // Dynamically derive categories from AdminPanel 'دسته‌بندی تجهیزات عیب‌یابی' (categoriesList)
  const categories = React.useMemo(() => {
    const customCats = Array.isArray(categoriesList) ? categoriesList.filter(Boolean) : [];
    if (customCats.length > 0) {
      return ['همه', ...customCats];
    }
    return ['همه', 'پکیج', 'ماشین لباسشویی', 'یخچال و فریزر', 'کولر گازی'];
  }, [categoriesList]);

  const filteredParts = (parts || []).filter(part => {
    const partCat = part.category || part.device_category || '';
    const matchesCategory = selectedCategory === 'همه' || 
                            partCat.includes(selectedCategory) || 
                            selectedCategory.includes(partCat);
    
    const compArray = Array.isArray(part.compatibility) && part.compatibility.length > 0 
      ? part.compatibility 
      : (part.compatible_brands ? part.compatible_brands.split(/[،,]/).map(s => s.trim()).filter(Boolean) : (part.brand ? [part.brand] : []));
    
    const partName = part.name || part.title || '';
    const partDesc = part.description || part.short_description || part.technical_description || '';
    const partModel = part.model || part.device_model || '';

    const matchesQuery = !searchQuery || 
                          partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          partDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          partModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          compArray.some(c => (c || '').toLowerCase().includes(searchQuery.toLowerCase()));
    
    // contextual search if brand or category is passed down from selected error
    const matchesBrandFilter = !brandFilter || compArray.some(b => brandFilter.includes(b) || b.includes(brandFilter));
    const matchesCategoryFilter = !categoryFilter || partCat.includes(categoryFilter) || categoryFilter.includes(partCat);

    return matchesCategory && matchesQuery && (brandFilter ? matchesBrandFilter : true) && (categoryFilter ? matchesCategoryFilter : true);
  });

  const handleStartCheckout = (part: SparePart) => {
    setActiveCheckoutPart(part);
    setPurchaseQuantity(1);
    setCheckoutStep('form');
  };

  const handleConfirmPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userPhone || !userAddress || !cardHolder || !trackNumber || (activeCheckoutPart && activeCheckoutPart.stock < 1)) return;
    
    if (activeCheckoutPart) {
      onPurchase(activeCheckoutPart, userAddress, userName, userPhone, cardHolder, trackNumber, purchaseQuantity);
      setCheckoutStep('success');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-250/60 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <span>فروشگاه قطعات یدکی اورجینال لوازم خانگی</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">تضمین اصالت کالا، ضمانت برگشت وجه و سازگاری کامل با دستگاه‌های ایرانی و خارجی</p>
        </div>

        {/* Filter categories */}
        <div className="flex flex-wrap gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-100">
          {categories.map((cat) => (
            <button
              id={`cat-btn-${cat}`}
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Contextual notification if user is filtering based on selected error */}
      {(brandFilter || categoryFilter) && (
        <div className="bg-blue-50/50 border border-blue-100 text-blue-900 text-xs rounded-xl p-3 mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 animate-pulse" />
            <span>
              نمایش قطعات سازگار با دستگاه انتخابی شما ({categoryFilter} {brandFilter})
            </span>
          </div>
          <button 
            onClick={() => onClearFilters ? onClearFilters() : window.location.reload()} 
            className="text-[10px] text-blue-700 underline font-semibold cursor-pointer py-1 px-2 hover:bg-blue-100/60 rounded-md"
          >
            پاک کردن فیلتر قطعه
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="mb-6">
        <input
          id="parts-search-input"
          type="text"
          placeholder="جستجوی قطعه مورد نظر (مثال: سنسور، برد برقی، پمپ، شیر گاز...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 text-xs outline-none transition-all placeholder:text-slate-400"
        />
      </div>

      {/* Grid of Parts */}
      {filteredParts.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
          <Box className="w-12 h-12 text-slate-300 mx-auto mb-3 stroke-[1.2]" />
          <p className="text-slate-500 text-xs">قفل سنسور یا قطعه مورد نظر پیدا نشد.</p>
          <p className="text-slate-400 text-[10px] mt-1">عنوان کالا یا فیلتر دسته‌بندی دیگری را امتحان کنید.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {filteredParts.map((part) => (
            <div key={part.id} className="group border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-slate-300/80 rounded-2xl p-4 transition-all hover:shadow-md flex flex-col justify-between">
              <div>
                <div
                  id={`part-img-wrap-${part.id}`}
                  onClick={() => {
                    setZoomedPart(part);
                    resetZoomAndPan();
                  }}
                  className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 mb-3 border border-slate-100 cursor-zoom-in group/img"
                  title="برای بزرگنمایی و مشاهده تصویر با کیفیت کلیک کنید"
                >
                  <img
                    referrerPolicy="no-referrer"
                    src={part.image}
                    alt={part.name}
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/0 group-hover/img:bg-slate-950/20 transition-all flex items-center justify-center pointer-events-none">
                    <span className="opacity-0 group-hover/img:opacity-100 transition-all bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2 py-1 rounded-lg flex items-center gap-1 shadow-md">
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>مشاهده تصویر بزرگ</span>
                    </span>
                  </div>
                  <span className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md font-sans pointer-events-none">
                    {part.category}
                  </span>
                </div>

                <div className="flex items-start gap-2 justify-between mb-2">
                  <h3 className="font-bold text-slate-800 text-xs leading-normal">
                    {part.name}
                  </h3>
                </div>

                <p className="text-slate-500 text-[11px] leading-relaxed mb-3 line-clamp-2">
                  {part.description}
                </p>

                {/* Compatibility Tags & Details */}
                <div className="mb-4 space-y-1.5">
                  {(() => {
                    const compList = Array.isArray(part.compatibility) && part.compatibility.length > 0
                      ? part.compatibility
                      : (part.compatible_brands ? part.compatible_brands.split(/[،,]/).map(s => s.trim()).filter(Boolean) : (part.brand ? [part.brand] : []));
                    const modelName = part.model || part.device_model;

                    return (
                      <>
                        {modelName && modelName !== 'همه مدل‌ها' && modelName !== 'عمومی' && (
                          <div className="text-[10px] text-slate-500">
                            <span className="text-slate-400">مدل: </span>
                            <span className="font-bold text-slate-700">{modelName}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-[10px] text-slate-400 block mb-1">برندهای سازگار:</span>
                          <div className="flex flex-wrap gap-1">
                            {compList.length > 0 ? (
                              compList.map((c) => (
                                <span key={c} className="bg-blue-50 text-blue-700 border border-blue-100 text-[9.5px] px-2 py-0.5 rounded-md font-bold">
                                  {c}
                                </span>
                              ))
                            ) : (
                              <span className="bg-slate-100 text-slate-500 text-[9px] px-1.5 py-0.5 rounded-sm">
                                عمومی / تمام برندها
                              </span>
                            )}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div>
                <hr className="border-slate-100 mb-3" />
                <div className="flex items-center justify-between mb-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">قیمت مصرف‌کننده</span>
                    <span className="font-bold text-slate-800 font-sans">{part.price.toLocaleString('fa-IR')}</span>
                    <span className="text-slate-500 text-[9px] mr-1">تومان</span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10px] block">وضعیت انبار</span>
                    {part.stock > 0 ? (
                      <span className="text-emerald-600 font-medium text-[10px] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {part.stock} عدد موجود
                      </span>
                    ) : (
                      <span className="text-rose-500 font-medium text-[10px]">اتمام موجودی</span>
                    )}
                  </div>
                </div>

                <button
                  id={`buy-btn-${part.id}`}
                  disabled={part.stock < 1}
                  onClick={() => handleStartCheckout(part)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    part.stock > 0
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow-md'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>سفارش فوری قطعه</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Checkout Modal of Shetab Gate */}
      {activeCheckoutPart && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-slate-250 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-slate-950 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-xs">ثبت رسید پرداخت کارت‌به‌کارت</h3>
              </div>
              <button
                onClick={() => setActiveCheckoutPart(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {checkoutStep === 'form' ? (
              <form onSubmit={handleConfirmPurchase} className="p-6">
                {/* Summary */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500">مورد خرید:</span>
                    <span className="font-bold text-slate-800">{activeCheckoutPart.name}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-500">قیمت واحد:</span>
                    <span className="text-slate-700 font-sans">{activeCheckoutPart.price.toLocaleString('fa-IR')} تومان</span>
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex justify-between items-center py-2.5 my-2 border-y border-slate-200/80 bg-white/70 px-3 rounded-xl">
                    <span className="font-bold text-slate-700 text-xs">تعداد سفارش:</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setPurchaseQuantity(prev => Math.max(1, prev - 1))}
                        disabled={purchaseQuantity <= 1}
                        className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-slate-700 text-sm transition-colors cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-bold text-slate-900 font-sans text-sm w-6 text-center">
                        {purchaseQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPurchaseQuantity(prev => Math.min(activeCheckoutPart.stock, prev + 1))}
                        disabled={purchaseQuantity >= activeCheckoutPart.stock}
                        className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center font-bold text-sm transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <span className="font-bold text-slate-800">مبلغ نهایی قابل پرداخت:</span>
                    <span className="font-bold text-blue-600 text-sm font-sans">
                      {(activeCheckoutPart.price * purchaseQuantity).toLocaleString('fa-IR')} تومان
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-slate-600 text-[10px] font-bold mb-1">نام و نام خانوادگی خریدار *</label>
                    <input
                      required
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="مثال: محمد مهدوی"
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-[10px] font-bold mb-1">شماره تلفن همراه *</label>
                    <input
                      required
                      type="tel"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      placeholder="مثال: 09121234567"
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl outline-none focus:bg-white focus:border-blue-500 text-left"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-[10px] font-bold mb-1">آدرس دقیق تحویل قطعه *</label>
                    <textarea
                      required
                      value={userAddress}
                      onChange={(e) => setUserAddress(e.target.value)}
                      placeholder="آدرس کامل پستی، کد پستی در صورت امکان"
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-[11px] text-amber-800 leading-relaxed">
                    لطفاً مبلغ فوق را به شماره کارت اعلامی توسط پشتیبانی واریز کرده و اطلاعات فیش را در زیر ثبت کنید.
                  </div>

                  <div>
                    <label className="block text-slate-600 text-[10px] font-bold mb-1">نام صاحب کارت واریزکننده *</label>
                    <input
                      required
                      type="text"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      placeholder="مثال: علی احمدی"
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl outline-none focus:bg-white focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 text-[10px] font-bold mb-1">شماره پیگیری فیش واریزی *</label>
                    <input
                      required
                      type="text"
                      value={trackNumber}
                      onChange={(e) => setTrackNumber(e.target.value)}
                      placeholder="مثال: 123456789"
                      className="w-full bg-slate-50 border border-slate-200 px-3 py-2 text-xs rounded-xl outline-none focus:bg-white focus:border-blue-500 text-left"
                    />
                  </div>
                </div>

                <button
                  id="checkout-confirm-btn"
                  type="submit"
                  className="w-full mt-5 bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>ثبت اطلاعات فیش پرداخت</span>                </button>
              </form>
            ) : (
              <div className="p-8 text-center bg-white">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 scale-105 animate-pulse">
                  <Check className="w-8 h-8 text-emerald-600" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-2">درخواست شما ثبت شد!</h4>
                <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto mb-4">
                  فیش پرداخت شما ثبت شد و پس از تایید توسط واحد مالی (حداکثر ۲ ساعت)، قطعه رزرو و ارسال می‌شود. نتیجه از طریق پیامک به شماره <span className="font-semibold text-slate-800">{userPhone}</span> اطلاع داده خواهد شد.
                </p>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-[11px] text-slate-600 text-right mb-5 grid grid-cols-2 gap-2">
                  <div>شماره پیگیری: <span className="font-bold text-slate-900 font-mono">{trackNumber}</span></div>
                  <div>وضعیت: <span className="text-amber-600 font-medium font-sans">در انتظار تایید پرداخت</span></div>
                </div>

                <button
                  id="checkout-close-btn"
                  onClick={() => setActiveCheckoutPart(null)}
                  className="w-full bg-slate-900 text-white text-xs py-2 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  بستن پنجره سفارش
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product Image Zoom Fullscreen Lightbox Stage */}
      {zoomedPart && (
        <div
          id="image-zoom-modal"
          className="fixed inset-0 bg-slate-950/95 backdrop-blur-xl z-50 flex flex-col justify-between select-none animate-in fade-in duration-200"
        >
          {/* Top Bar Floating Over Entire View */}
          <div className="relative z-30 flex items-center justify-between p-4 sm:p-5 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent">
            <div className="flex items-center gap-2.5 truncate">
              <span className="bg-blue-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg font-sans shadow-md">
                {zoomedPart.category}
              </span>
              <h3 className="font-bold text-sm sm:text-base text-white truncate drop-shadow-sm">
                {zoomedPart.name}
              </h3>
            </div>

            <button
              id="close-image-zoom-btn"
              type="button"
              onClick={() => {
                setZoomedPart(null);
                resetZoomAndPan();
              }}
              className="w-10 h-10 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/70 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-lg hover:scale-105"
              title="بستن تصویر (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Center Stage: True Responsive & Aspect-Adaptive Drag & Zoom Canvas */}
          <div
            id="zoom-pan-container"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleZoomWheel}
            className={`flex-1 w-full h-full flex items-center justify-center overflow-hidden touch-none relative ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            title="با ماوس یا انگشت تصویر را حرکت دهید | با اسکرول ماوس زوم کنید"
          >
            <div
              style={{
                transform: `translate3d(${panPosition.x}px, ${panPosition.y}px, 0) scale(${zoomScale})`,
                transition: isDragging ? 'none' : 'transform 0.15s cubic-bezier(0.2, 0, 0.2, 1)'
              }}
              className="w-full h-full flex items-center justify-center px-2 sm:px-6 py-2 origin-center pointer-events-none"
            >
              <img
                referrerPolicy="no-referrer"
                src={zoomedPart.image}
                alt={zoomedPart.name}
                draggable={false}
                className="w-auto h-auto max-w-[96vw] md:max-w-[90vw] lg:max-w-[85vw] max-h-[74vh] md:max-h-[80vh] lg:max-h-[84vh] object-contain rounded-2xl shadow-2xl select-none"
              />
            </div>

            {/* Floating Zoom Toolbar in Stage Bottom */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center pointer-events-none z-30">
              <div
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className="bg-slate-900/90 backdrop-blur-lg border border-slate-700/80 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-2xl pointer-events-auto text-white select-none"
              >
                <button
                  id="zoom-out-btn"
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoomScale <= 0.7}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer text-slate-200"
                  title="کوچک‌نمایی (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <span className="text-xs font-bold font-mono min-w-[52px] text-center text-blue-400 select-none">
                  {Math.round(zoomScale * 100)}%
                </span>

                <button
                  id="zoom-in-btn"
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoomScale >= 4}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer text-slate-200"
                  title="بزرگ‌نمایی (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {(zoomScale !== 1 || panPosition.x !== 0 || panPosition.y !== 0) && (
                  <button
                    id="zoom-reset-btn"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetZoomAndPan();
                    }}
                    className="w-8 h-8 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 flex items-center justify-center transition-colors cursor-pointer border border-blue-500/30"
                    title="بازنشانی اندازه و موقعیت اصلی"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Bar Floating Over Entire View */}
          <div className="relative z-30 p-4 sm:p-5 bg-gradient-to-t from-slate-950/95 via-slate-950/60 to-transparent flex items-center justify-between text-xs text-white border-t border-slate-800/40">
            <div>
              <span className="text-slate-400 text-[10px] block">قیمت قطعه</span>
              <span className="font-bold text-emerald-400 font-sans text-sm sm:text-base">{zoomedPart.price.toLocaleString('fa-IR')}</span>
              <span className="text-slate-400 text-[11px] mr-1">تومان</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const targetPart = zoomedPart;
                  setZoomedPart(null);
                  resetZoomAndPan();
                  handleStartCheckout(targetPart);
                }}
                disabled={zoomedPart.stock < 1}
                className={`px-5 py-2.5 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-lg ${
                  zoomedPart.stock > 0
                    ? 'bg-blue-600 hover:bg-blue-700 text-white hover:scale-[1.02]'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>ثبت سفارش کالا</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
