import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, EyeOff, Server, Database } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — Vybe',
  description: 'Privacy Policy and data protection standards for Vybe.',
};

export default function PrivacyPage() {
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
            <Lock className="h-3.5 w-3.5" />
            <span>Privacy & Data Protection</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Last Updated: November 23, 2026 · Effective Immediately
          </p>
        </div>

        {/* Privacy Highlight Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="p-5 rounded-2xl border border-white/10 bg-[#12121A] flex flex-col justify-between">
            <EyeOff className="h-7 w-7 text-violet-400 mb-3" />
            <div>
              <h3 className="font-bold text-white text-sm mb-1">Zero Video Storage</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                All video and audio is streamed directly peer-to-peer over WebRTC. No video frames are ever recorded or stored on our servers.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/10 bg-[#12121A] flex flex-col justify-between">
            <Lock className="h-7 w-7 text-fuchsia-400 mb-3" />
            <div>
              <h3 className="font-bold text-white text-sm mb-1">Hashed IP Addresses</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                We never store raw IP addresses. All network identifiers are cryptographically hashed using SHA-256 with a private salt.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl border border-white/10 bg-[#12121A] flex flex-col justify-between">
            <ShieldCheck className="h-7 w-7 text-emerald-400 mb-3" />
            <div>
              <h3 className="font-bold text-white text-sm mb-1">No Accounts / No PII</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                No names, emails, phone numbers, or social media logins are requested or retained. Complete pseudonymity by design.
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Sections */}
        <div className="space-y-8 text-sm leading-relaxed text-gray-300">
          {/* 1. Information We Do NOT Collect */}
          <section className="rounded-2xl border border-white/10 bg-[#12121A] p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
              <EyeOff className="h-5 w-5 text-violet-400" />
              <span>1. Information We Never Collect</span>
            </h2>
            <p className="mb-2">
              Privacy by design is the foundation of Vybe. We intentionally do NOT collect:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-400 pl-2">
              <li>Names, email addresses, phone numbers, or passwords (no registration is required).</li>
              <li>Camera or microphone recordings. Video and audio streams exist exclusively in memory on participating user devices.</li>
              <li>Chat logs or conversation transcripts between users.</li>
              <li>Location tracking coordinates or GPS data.</li>
            </ul>
          </section>

          {/* 2. Information Processed for Functionality */}
          <section className="rounded-2xl border border-white/10 bg-[#12121A] p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
              <Server className="h-5 w-5 text-violet-400" />
              <span>2. Technical Information Processed</span>
            </h2>
            <p className="mb-3">
              To operate a low-latency WebRTC connection, certain ephemeral signals are processed during an active session:
            </p>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-white block mb-1">WebRTC Signalling Data (Session Description Protocol / ICE Candidates)</strong>
                Exchanged through our Socket.io signalling server purely to establish the direct connection between two browsers. This data is held in volatile server memory and discarded immediately once connection handshakes complete.
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-white block mb-1">Cryptographic IP Hash</strong>
                When connecting or submitting an abuse report, your raw IP address is converted into an irreversible SHA-256 hash combined with an internal cryptographic salt. The raw IP address is discarded. The resulting hash is used solely to enforce temporary rate limits and multi-report bans against bad actors.
              </div>
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5">
                <strong className="text-white block mb-1">Local Browser Storage</strong>
                We store a single boolean key (<code className="text-violet-400">vybe_age_consent</code>) in your browser&apos;s localStorage to remember that you have certified your age (18+), preventing redundant modal prompts on return visits. No tracking cookies are used.
              </div>
            </div>
          </section>

          {/* 3. Safety, Abuse Prevention, and Law Enforcement */}
          <section className="rounded-2xl border border-white/10 bg-[#12121A] p-6">
            <h2 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
              <Database className="h-5 w-5 text-violet-400" />
              <span>3. Moderation, Child Safety & Legal Compliance</span>
            </h2>
            <p className="mb-3">
              While audio and video are peer-to-peer and unrecorded, user-submitted incident reports (including selected report categories, target socket identifier, and reporter timestamp) are recorded to maintain community safety.
            </p>
            <p className="text-xs text-gray-400">
              In cases involving Child Sexual Abuse Material (CSAM) or minor safety threats, report metadata and hashed network records are retained to fulfill mandatory legal reporting obligations to the <strong>National Center for Missing & Exploited Children (NCMEC) CyberTipline</strong> and competent law enforcement agencies under applicable Indian and international law.
            </p>
          </section>

          {/* 4. Security & Encryption */}
          <section className="rounded-2xl border border-white/10 bg-[#12121A] p-6">
            <h2 className="text-lg font-bold text-white mb-3">
              4. Data Security & Encryption Standards
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              All web traffic is enforced over HTTPS with strict Transport Layer Security (TLS 1.3) and HSTS. Peer-to-peer media streams are protected end-to-end via DTLS (Datagram Transport Layer Security) and SRTP (Secure Real-Time Transport Protocol) inherent to the WebRTC protocol standard.
            </p>
          </section>

          {/* 5. Contact & Privacy Inquiries */}
          <section className="rounded-2xl border border-white/10 bg-[#12121A] p-6">
            <h2 className="text-lg font-bold text-white mb-3">
              5. Contacting the Safety Team
            </h2>
            <p className="text-xs text-gray-400">
              For legal inquiries, abuse notifications, or privacy questions, contact our compliance team directly via email or use the in-app reporting button available in every live session.
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
