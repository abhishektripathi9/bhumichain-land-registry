import React from "react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.state = { hasError: true, error, errorInfo };
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoPublic = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex flex-col items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-white border border-gray-200 rounded-3xl p-8 shadow-xl text-center space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-black text-gray-900">
                Console Interface Restored
              </h2>
              <p className="text-xs text-gray-500 leading-relaxed">
                The application caught an unexpected UI render state and preserved session security.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-left font-mono text-[11px] text-rose-700 break-all max-h-32 overflow-y-auto">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={this.handleGoPublic}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-xs font-bold text-gray-700 transition-colors flex items-center justify-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Citizen Portal</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-xs font-bold text-white shadow-md transition-colors flex items-center justify-center space-x-1.5"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Console</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
