import React, { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { AuraOrb } from '../AuraOrb';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[AURA Global Error Boundary Caught Exception]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  private handleReturnHome = () => {
    this.setState({ hasError: false, error: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#05070D] flex flex-col items-center justify-center p-6 text-white relative overflow-hidden select-none">
          {/* Ambient Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 max-w-md w-full bg-[#090D1A] border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-6">
            <div className="relative mx-auto flex items-center justify-center">
              <AuraOrb size="sm" state="idle" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span>Workspace Application Error</span>
              </div>
              <h1 className="text-xl font-display font-bold text-white tracking-tight">
                Something unexpected occurred
              </h1>
              <p className="text-xs text-gray-400 leading-relaxed">
                AURA encountered an unforeseen rendering issue. Your workspace state is safe and protected.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl aura-gradient-btn text-white text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-indigo-600/30"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={this.handleReturnHome}
                className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
