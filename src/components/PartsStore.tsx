/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SparePart } from '../types';
import { ShoppingBag, Check, ShieldCheck, Cpu, Box, Sparkles, CreditCard, X } from 'lucide-react';

interface PartsStoreProps {
  parts: SparePart[];
  onPurchase: (part: SparePart, address: string, buyerName?: string, buyerPhone?: string, cardHolder?: string, trackNumber?: string) => void;
  brandFilter?: string;
  categoryFilter?: string;
  onClearFilters?: () => void;
}

export const PartsStore: React.FC<PartsStoreProps> = ({
  parts,
  onPurchase,
  brandFilter = '',
  categoryFilter = '',
  onClearFilters
}) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('همه');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [activeCheckoutPart, setActiveCheckoutPart] = React.useState<SparePart | null>(null);
  const [checkoutStep, setCheckoutStep] = React.useState<'form' | 'success'>('form');

  // Checkout Fields
  const [userName, setUserName] = React.useState('');
  const [userPhone, setUserPhone] = React.useState('');
  const [userAddress, setUserAddress] = React.useState('');
  const [cardHolder, setCardHolder] = React.useState('');
  const [trackNumber, setTrackNumber] = React.useState('');
  const categories = ['همه', 'پکیج', 'ماشین لباسشویی', 'یخچال و فریزر', 'کولر گازی'];

  const filteredParts = (parts || []).filter(part => {
    const matchesCategory = selectedCategory === 'همه' || part.category === selectedCategory;
    const compArray = Array.isArray(part.compatibility) ? part.compatibility : [];
    const matchesQuery = (part.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (part.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          compArray.some(c => (c || '').toLowerCase().includes(searchQuery.toLowerCase()));
    
    // contextual search if brand or category is passed down from selected error
    const matchesBrandFilter = !brandFilter || compArray.some(b => brandFilter.includes(b) || b.includes(brandFilter));
    const matchesCategoryFilter = !categoryFilter || (part.category || '').includes(categoryFilter) || categoryFilter.includes(part.category || '');

    return matchesCategory && matchesQuery && (brandFilter ? matchesBrandFilter : true) && (categoryFilter ? matchesCategoryFilter : true);
  });

  const handleStartCheckout = (part: SparePart) => {
    setActiveCheckoutPart(part);
    setCheckoutStep('form');
  };
  const handleConfirmPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userPhone || !userAddress || !cardHolder || !trackNumber || (activeCheckoutPart && activeCheckoutPart.stock < 1)) return;
    
    if (activeCheckoutPart) {
      onPurchase(activeCheckoutPart, userAddress, userName, userPhone, cardHolder, trackNumber);
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
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 mb-3 border border-slate-100">
                  <img
                    referrerPolicy="no-referrer"
                    src={part.image}
                    alt={part.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                  />
                  <span className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] px-2 py-0.5 rounded-md font-sans">
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

                {/* Compatibility Tags */}
                <div className="mb-4">
                  <span className="text-[10px] text-slate-400 block mb-1">برندهای سازگار:</span>
                  <div className="flex flex-wrap gap-1">
                    {(Array.isArray(part.compatibility) ? part.compatibility : []).map((c) => (
                      <span key={c} className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded-sm">
                        {c}
                      </span>
                    ))}
                  </div>
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
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-slate-500">دسته قطعه:</span>
                    <span className="text-slate-700">{activeCheckoutPart.category}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="font-bold text-slate-800">مبلغ نهایی پرداختی:</span>
                    <span className="font-bold text-blue-600 text-sm font-sans">
                      {activeCheckoutPart.price.toLocaleString('fa-IR')} تومان
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
    </div>
  );
};
