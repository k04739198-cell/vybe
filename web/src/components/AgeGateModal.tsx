'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface AgeGateModalProps {
  onVerified: () => void;
  onOpenTerms?: () => void;
}

export default function AgeGateModal({ onVerified }: AgeGateModalProps) {
  const [isChecked, setIsChecked] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if user already confirmed age in this browser
    const storedAgeConsent = localStorage.getItem('vybe_age_consent');
    if (!storedAgeConsent) {
      setVisible(true);
    } else {
      onVerified();
    }
  }, [onVerified]);

  const handleConfirm = () => {
    if (!isChecked) return;
    localStorage.setItem('vybe_age_consent', new Date().toISOString());
    setVisible(false);
    onVerified();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#12121A] p-6 shadow-2xl md:p-8">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-violet-600/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-fuchsia-600/20 blur-3xl pointer-events-none" />

        {/* Brand Icon Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-600/30">
            <span className="text-3xl font-black tracking-tight text-white">v</span>
          </div>

          <h2 className="mt-5 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Welcome to <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">vybe</span>
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Every stranger is a Vybe away. Instant live video connection.
          </p>
        </div>

        {/* 18+ Advisory Banner */}
        <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-950/20 p-4">
          <div className="flex items-start space-x-3">
            <ShieldCheck className="h-5 w-5 text-violet-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed text-gray-300">
              <strong className="text-white block mb-1">Age Verification & Legal Safety</strong>
              Vybe is an unmoderated peer-to-peer live video platform intended strictly for adults aged 18 and older. Zero tolerance for CSAM, exploitation, or illegal conduct.
            </div>
          </div>
        </div>

        {/* Consent Checkbox */}
        <label className="mt-6 flex items-start space-x-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={(e) => setIsChecked(e.target.checked)}
            className="mt-0.5 h-5 w-5 rounded-md border-gray-600 bg-[#1A1A28] text-violet-600 focus:ring-violet-500 focus:ring-offset-0 cursor-pointer accent-violet-600"
          />
          <span className="text-xs text-gray-300 leading-normal select-none group-hover:text-white transition-colors">
            I certify that I am at least <strong className="text-violet-400">18 years of age</strong> and accept the{' '}
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-violet-400 underline hover:text-violet-300"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-violet-400 underline hover:text-violet-300"
            >
              Privacy Policy
            </a>.
          </span>
        </label>

        {/* Action Button */}
        <div className="mt-7">
          <button
            onClick={handleConfirm}
            disabled={!isChecked}
            className={`w-full py-3.5 px-6 rounded-2xl font-semibold text-sm transition-all duration-300 flex items-center justify-center space-x-2 ${
              isChecked
                ? 'bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg shadow-violet-600/40 hover:opacity-95 active:scale-[0.98]'
                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
            }`}
          >
            <span>Enter Vybe</span>
            <Sparkles className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-gray-500">
          Compliant with Indian IT Act 2021 & Global CSAM Prevention Guidelines
        </p>
      </div>
    </div>
  );
}
