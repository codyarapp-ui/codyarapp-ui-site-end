import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  children?: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    try {
      fetch("/api/error-logs/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          errorMessage: error.message || error.toString(),
          stackTrace: errorInfo.componentStack || error.stack || "",
          url: window.location.href,
          userId: localStorage.getItem("session_user_id") || "guest"
        })
      }).catch(err => console.warn("Could not POST error log to server:", err));
    } catch (e) {
      console.warn("ErrorBoundary reporting failed:", e);
    }
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-6 text-right font-sans bg-slate-50 rounded-3xl border border-slate-200 shadow-sm max-w-lg mx-auto my-12">
          <div className="w-14 h-14 bg-red-105 bg-opacity-10 rounded-full flex items-center justify-center text-red-650 mb-4 animate-bounce">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-base font-extrabold text-slate-800 mb-2">{this.props.fallbackTitle || "بروز خطای غیرمنتظره در پردازش رابط کاربری"}</h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-sm text-center mb-6">
            داده‌های همگام‌ساز یا یکی از پردازش‌های گرافیکی با اختلال مواجه شد. برای بازگرداندن سیستم به حالت پایدار می‌توانید از دکمه زیر جهت ریست بهینه پایگاه شخصی اقدام نمایید.
          </p>
          {this.state.error && (
            <div className="w-full bg-slate-100 p-3 rounded-xl border border-slate-200 font-mono text-[9px] text-left text-red-700 overflow-auto max-h-28 mb-6 whitespace-pre-wrap">
              {this.state.error.toString()}
            </div>
          )}
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl cursor-pointer shadow-sm transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>راه‌اندازی مجدد و پاکسازی حافظه کش</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
