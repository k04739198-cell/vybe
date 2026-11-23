'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck, Zap, Sparkles, UserCheck } from 'lucide-react';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  icon: React.ReactNode;
}

export const FAQ_DATA: FaqItem[] = [
  {
    id: 'how-it-works',
    question: 'How does Vybe work?',
    answer:
      'Vybe connects you to real people across South Asia through instant 1-on-1 live video chat. Simply tap "Start Scrolling" to enter the matchmaking queue. Our lightning-fast peer-to-peer WebRTC network pairs you with a random stranger in seconds. If you want to meet someone new, just swipe up to skip to the next person—just like scrolling through Reels or TikTok.',
    icon: <Zap className="h-4 w-4 text-violet-400" />,
  },
  {
    id: 'is-it-free',
    question: 'Is Vybe free?',
    answer:
      'Yes, Vybe is 100% free to use. There are no subscriptions, paywalls, or hidden charges. You can hop on, video chat with real people, and meet strangers whenever you want without ever entering credit card details.',
    icon: <Sparkles className="h-4 w-4 text-fuchsia-400" />,
  },
  {
    id: 'do-i-need-to-sign-up',
    question: 'Do I need to sign up for Vybe?',
    answer:
      'No. You do not need to create an account, register, or sign in to use Vybe. We believe in total spontaneity and zero friction—just grant camera and microphone permission in your browser, and you are ready to start vybing instantly.',
    icon: <UserCheck className="h-4 w-4 text-pink-400" />,
  },
  {
    id: 'is-it-safe',
    question: 'Is Vybe safe?',
    answer:
      'Safety is our top priority. All video calls are transmitted directly peer-to-peer using encrypted WebRTC connections, meaning your live video is never stored on our servers. We enforce a strict 18+ age gate, automated PhotoDNA content scanning, proactive NCMEC CyberTipline escalation, zero personal data (PII) retention, and 1-tap instant user reporting with automatic ban enforcement.',
    icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
  },
];

export default function FaqSection() {
  const [openIds, setOpenIds] = useState<string[]>(['how-it-works']);

  const toggleFaq = (id: string) => {
    setOpenIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <section className="w-full max-w-xl mx-auto mt-12 mb-8 px-2 text-left" aria-label="Frequently Asked Questions">
      <div className="flex items-center space-x-2 mb-4 justify-center md:justify-start">
        <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-black tracking-tight text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-gray-400">Everything you need to know before you start vybing</p>
        </div>
      </div>

      <div className="space-y-3">
        {FAQ_DATA.map((item) => {
          const isOpen = openIds.includes(item.id);
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-white/10 bg-[#12121B]/80 backdrop-blur-md overflow-hidden transition-colors hover:border-violet-500/30"
            >
              <button
                type="button"
                onClick={() => toggleFaq(item.id)}
                className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-gray-200 hover:text-white transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex items-center space-x-3 pr-2">
                  <span className="p-1.5 rounded-lg bg-white/5">{item.icon}</span>
                  <h3 className="text-sm font-bold tracking-tight text-white">{item.question}</h3>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? 'rotate-180 text-violet-400' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 pt-1 text-xs md:text-sm text-gray-400 leading-relaxed border-t border-white/5 animate-in fade-in duration-200">
                  <p>{item.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
