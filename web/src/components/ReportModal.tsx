'use client';

import React, { useState } from 'react';
import { Flag, X, CheckCircle2 } from 'lucide-react';
import { ReportReason } from '@/lib/types';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportAndSkip: (reason: ReportReason, notes?: string) => void;
}

const REPORT_REASONS: { id: ReportReason; label: string; desc: string; highPriority?: boolean }[] = [
  {
    id: 'csam_underage',
    label: 'Underage User / Child Safety Concern',
    desc: 'Zero tolerance. Immediate alert to safety team & NCMEC tipline.',
    highPriority: true,
  },
  {
    id: 'unwanted_nudity',
    label: 'Inappropriate or Non-Consensual Nudity',
    desc: 'Flashing, explicit solicitations without consent.',
  },
  {
    id: 'harassment_bullying',
    label: 'Harassment, Abuse, or Hate Speech',
    desc: 'Verbal aggression, slurs, targeted bullying, or stalking behavior.',
  },
  {
    id: 'spam_bot',
    label: 'Spam, Automated Bot, or Promo',
    desc: 'Pre-recorded loop, commercial selling, or automated script.',
  },
  {
    id: 'violence_threats',
    label: 'Violence, Self-Harm, or Physical Threats',
    desc: 'Dangerous acts, weapon display, or threats of harm.',
  },
];

export default function ReportModal({ isOpen, onClose, onReportAndSkip }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason>('unwanted_nudity');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      onReportAndSkip(selectedReason, notes);
      setSubmitted(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md rounded-3xl border border-red-500/20 bg-[#14141E] p-6 shadow-2xl text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center space-x-2 text-red-400">
            <Flag className="h-5 w-5 fill-red-400/20" />
            <h3 className="font-bold text-base text-white">Report Stranger</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
            <p className="font-bold text-lg text-white">Report Submitted</p>
            <p className="text-xs text-gray-400">
              User flagged. Disconnecting and matching you with a new Vyber...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <p className="text-xs text-gray-400">
              Help keep Vybe safe. Select the reason that best describes what occurred:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {REPORT_REASONS.map((reason) => {
                const isSelected = selectedReason === reason.id;
                return (
                  <label
                    key={reason.id}
                    className={`flex items-start space-x-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? reason.highPriority
                          ? 'border-red-500 bg-red-950/30'
                          : 'border-violet-500 bg-violet-950/30'
                        : 'border-white/5 bg-white/5 hover:border-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason.id}
                      checked={isSelected}
                      onChange={() => setSelectedReason(reason.id)}
                      className="mt-1 text-red-500 focus:ring-0 accent-red-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-semibold text-white">{reason.label}</span>
                        {reason.highPriority && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.2 rounded font-mono font-bold">
                            CRITICAL
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">{reason.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            <div>
              <textarea
                placeholder="Optional details (e.g. what they said or did)..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={300}
                rows={2}
                className="w-full rounded-xl bg-black/40 border border-white/10 p-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 resize-none"
              />
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-gray-300 text-xs font-semibold hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/30 active:scale-[0.98]"
              >
                Report & Skip
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
