/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Notification } from '../types';
import { Bell, MessageSquare, ShieldAlert, CheckCircle, Info, Flame, Eye, X } from 'lucide-react';

interface NotificationCenterProps {
  notifications: Notification[];
  onClear: () => void;
  onRemove: (id: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onClear,
  onRemove,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <Flame className="w-5 h-5 text-amber-500" />;
      case 'error':
        return <ShieldAlert className="w-5 h-5 text-rose-500" />;
      case 'sms':
        return <MessageSquare className="w-5 h-5 text-sky-500" />;
      default:
        return <Info className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="relative z-40">
      {/* Trigger Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl transition-all border border-slate-200/80 cursor-pointer shadow-sm"
        aria-label="اعلان‌ها"
      >
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-bounce">
            {notifications.length}
          </span>
        )}
      </button>

      {/* Overlay Drawer */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/10 z-30" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-4 z-40 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">اعلان‌ها و پیام‌های رسمی سیستم</h3>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    onClick={onClear}
                    className="text-[11px] text-slate-400 hover:text-rose-500 cursor-pointer transition-colors"
                  >
                    حذف همه
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {notifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 stroke-[1.5]" />
                  <p className="text-slate-400 text-xs text-center">هیچ اعلانی یافت نشد.</p>
                  <p className="text-slate-400 text-[10px] mt-1 text-center">با ثبت سفارش یا تغییر وضعیت تعمیرات، پیامک‌های زنده بلافاصله صادر می‌شوند.</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-xl border text-xs relative group transition-all ${
                      notif.type === 'sms'
                        ? 'bg-sky-50/50 border-sky-100 text-sky-900'
                        : notif.type === 'success'
                        ? 'bg-emerald-50/30 border-emerald-100 text-slate-800'
                        : notif.type === 'warning'
                        ? 'bg-amber-50/40 border-amber-100 text-slate-800 font-medium'
                        : notif.type === 'error'
                        ? 'bg-rose-50/40 border-rose-100 text-slate-800 font-medium'
                        : 'bg-slate-50/60 border-slate-100 text-slate-800'
                    }`}
                  >
                    <button
                      onClick={() => onRemove(notif.id)}
                      className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 hover:bg-white/80 p-0.5 rounded transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 flex-shrink-0">{getIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="font-bold text-slate-800 text-[11px] block truncate">
                            {notif.type === 'sms' ? `📨 پیامک: ${notif.title}` : notif.title}
                          </span>
                          <span className="text-[9px] text-slate-400 flex-shrink-0">{notif.date}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed font-sans">{notif.text}</p>
                        {notif.type === 'sms' && (
                          <div className="mt-1 text-[9px] bg-sky-100/60 text-sky-700 px-2 py-0.5 rounded inline-block">
                            شماره گیرنده: مشتری / تکنسین
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="mt-3 pt-2 text-center border-t border-slate-100 text-[9px] text-slate-400">
                سیستم اطلاع‌رسانی کدیار۲۴ فعال است.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
