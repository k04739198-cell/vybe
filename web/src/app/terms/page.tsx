import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, ShieldCheck, Scale } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service — Vybe',
  description: 'Terms of Service and legal compliance guidelines for Vybe.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0B0B0F] text-gray-200 antialiased selection:bg-violet-500/30">
      {/* Top Navigation */}
      <header className="border-b border-white/10 bg-[#12121A]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2.5 text-white hover:opacity-80 transition-opacity">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 shadow-md">
              <span className="text-base font-black text-white">v</span>
            </div>
            <span className="font-extrabold text-lg tracking-tight">vybe</span>
          </Link>
          <Link
            href="/"
            className="flex items-center space-x-1.5 text-xs font-semibold text-gray-400 hover:text-white px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 transition-all"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to App</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-violet-600/15 border border-violet-500/30 text-violet-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Scale className="h-3.5 w-3.5" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Last Updated: November 23, 2026 · Effective Immediately
          </p>
        </div>

        {/* Legal Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-gray-300">
          {/* Important Callout */}
          <section className="rounded-2xl border border-red-500/30 bg-red-950/20 p-5">
            <div className="flex items-start space-x-3.5">
              <ShieldAlert className="h-6 w-6 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-bold text-white mb-1.5">
                  Critical Safety & CSAM Zero-Tolerance Policy
                </h2>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Vybe maintains a strict zero-tolerance policy against Child Sexual Abuse Material (CSAM), minor exploitation, and non-consensual sexual content. In accordance with Section 67B of the Indian IT Act, the Protection of Children from Sexual Offences (POCSO) Act, and United States 18 U.S.C. § 2258A, any detected or reported incident will be escalated immediately to the <strong>National Center for Missing & Exploited Children (NCMEC) CyberTipline</strong> and relevant law enforcement bodies. Violators will face immediate permanent IP banning and legal referral.
                </p>
              </div>
            </div>
          </section>

          {/* 1. Age Verification */}
          <section className="rounded-2xl border border-white/10 bg-[#12121A] p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
              <ShieldCheck className="h-5 w-5 text-violet-400" />
              <span>1. Strict Age Requirement (18+)</span>
            </h2>
            <p>
              You must be at least 18 years of age to access or use Vybe. By using the service, you affirm, represent, and warrant that you are 18 years of age or older and possess the legal capacity to enter into this agreement. If you are under 18, you are strictly prohibited from accessing Vybe. Misrepresenting your age is a direct violation of these Terms and may result in legal liability.
            </p>
          </section>

          {/* 2. Nature of Service & P2P Architecture */}
          <section className="rounded-2xl border border-white/10 bg-[#12121A] p-6">
            <h2 className="text-lg font-bold text-white mb-3">
              2. Nature of the Service & WebRTC Peer-to-Peer Architecture
            </h2>
            <p className="mb-3">
              Vybe provides a real-time communications matching platform that connects consenting adults via WebRTC video and audio streams.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-400 text-xs pl-2">
              <li><strong>Direct Peer-to-Peer Transmission:</strong> Video and audio streams travel directly between user browsers over encrypted WebRTC connections. Vybe servers do not intercept, view, or record live video or audio streams.</li>
              <li><strong>Signalling Server Role:</strong> The central server only facilitates initial connection introductions, queue matchmaking, and moderation reporting.</li>
              <li><strong>Unmoderated Real-Time Interactions:</strong> Because interactions occur live between strangers, you acknowledge that you may be exposed to material that you find objectionable. You participate at your own risk.</li>
            </ul>
          </section>

          {/* 3. Prohibited Conduct */}
          <section className="rounded-2xl border border-white/10 bg-[#12121A] p-6">
            <h2 className="text-lg font-bold text-white mb-3">
              3. Prohibited Conduct & Community Rules
            </h2>
            <p className="mb-3">You agree not to engage in any of the following prohibited behaviors:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-white block mb-1">Underage Participation</strong>
                Any involvement of minors or simulated minor content.
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-white block mb-1">Non-Consensual Exploitation</strong>
                Broadcasting intimate imagery or harassment without explicit mutual consent.
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-white block mb-1">Hate Speech & Bullying</strong>
                Targeted intimidation, slurs, defamation, or physical threats.
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-white block mb-1">Automated Bots & Scraping</strong>
                Using automated software, emulators, screen recorders, or scrapers.
              </div>
            </div>
          </section>

          {/* 4. Reporting & Enforcement */}
          <section className="rounded-2xl border border-white/10 bg-[#12121A] p-6">
            <h2 className="text-lg font-bold text-white mb-3">
              4. Reporting & Abuse Enforcement
            </h2>
            <p>
              Every active video session includes an easily accessible <strong>Report</strong> button. Users may report peers for violations including child safety concerns, unwanted nudity, harassment, or spam. Multiple reports or critical safety violations trigger automatic immediate disconnection, 24-hour to permanent IP bans, and escalation to safety authorities.
            </p>
          </section>

          {/* 5. Geographic Restrictions */}
          <section className="rounded-2xl border border-white/10 bg-[#12121A] p-6">
            <h2 className="text-lg font-bold text-white mb-3">
              5. Regional Jurisdiction & Geo-Blocking
            </h2>
            <p>
              Vybe is currently tailored for South Asian audiences (India, Pakistan, Bangladesh, Sri Lanka, Nepal). Due to statutory age-assurance mandates under the United Kingdom Online Safety Act 2023, access from the United Kingdom is strictly geo-blocked with HTTP Status 451.
            </p>
          </section>

          {/* 6. Limitation of Liability */}
          <section className="rounded-2xl border border-white/10 bg-[#12121A] p-6">
            <h2 className="text-lg font-bold text-white mb-3">
              6. Disclaimer of Warranties & Limitation of Liability
            </h2>
            <p className="text-xs text-gray-400">
              VYBE IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT PERMITTED BY LAW, VYBE AND ITS OPERATORS DISCLAIM ALL LIABILITY FOR ANY CONDUCT, BROADCASTS, OR CONTENT TRANSMITTED BY THIRD-PARTY USERS OF THE PLATFORM.
            </p>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© 2026 Vybe. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="hover:text-gray-300 underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-300 underline">Terms of Service</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
