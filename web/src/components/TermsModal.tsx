'use client';

import React from 'react';
import { X, ShieldAlert, BookOpen } from 'lucide-react';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl border border-white/10 bg-[#14141E] shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-violet-400" />
            <h3 className="font-bold text-base">Vybe — Legal & Compliance</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5 text-xs text-gray-300 leading-relaxed">
          <section>
            <h4 className="font-semibold text-white text-sm mb-1">1. Age Requirement (18+ Strictly Enforced)</h4>
            <p>
              Vybe is exclusively designed and operated for individuals who are at least 18 years of age. If you are under 18, you are strictly prohibited from using or accessing this platform. False declaration of age constitutes a violation of these terms and applicable regional telecommunications laws.
            </p>
          </section>

          <section className="bg-red-950/25 border border-red-500/30 rounded-xl p-3">
            <div className="flex items-center space-x-2 text-red-400 font-semibold mb-1">
              <ShieldAlert className="h-4 w-4" />
              <span>Zero Tolerance for CSAM & POCSO Compliance</span>
            </div>
            <p className="text-gray-300">
              Vybe strictly prohibits the transmission, streaming, or solicitation of Child Sexual Abuse Material (CSAM) or any exploitation of minors. In accordance with the Protection of Children from Sexual Offences (POCSO) Act, Indian IT Act 2021, and international law, all suspicious incidents are proactively reported to law enforcement agencies and NCMEC (National Center for Missing & Exploited Children).
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-white text-sm mb-1">2. Peer-to-Peer Architecture & Data Handling</h4>
            <p>
              Video and audio streams are transmitted directly peer-to-peer (P2P) via WebRTC between participating browsers. Vybe servers do not store or record live stream audio or video frames. Transient metadata (IP addresses for connection establishment and moderation logs) are retained solely for network routing, security, and abuse prevention.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-white text-sm mb-1">3. Community Standards & Reporting</h4>
            <p>
              Harassment, non-consensual sexual exploitation, hate speech, threats, and automated bot usage are prohibited. Every session features an accessible &quot;Report&quot; button. Repeated violations will result in temporary or permanent IP bans and device blacklisting.
            </p>
          </section>

          <section>
            <h4 className="font-semibold text-white text-sm mb-1">4. Jurisdictional Notice</h4>
            <p>
              Vybe is currently tailored for South Asian audiences (India, Pakistan, Bangladesh, Sri Lanka, Nepal). Users in jurisdictions requiring specialized statutory age-assurance regimes (such as the UK Online Safety Act) are advised to refrain from access until local regulatory verification modules are enabled.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-medium text-xs transition-colors"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
