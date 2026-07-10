import React from "react";
import { EmailLog } from "../types";
import { Mail, Check, X, FileText, Compass, ExternalLink, Calendar } from "lucide-react";

interface EmailHistoryListProps {
  logs: EmailLog[];
  isOpen: boolean;
  onClose: () => void;
}

export default function EmailHistoryList({ logs, isOpen, onClose }: EmailHistoryListProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-96 bg-slate-900 border-r border-slate-800 text-slate-100 z-40 shadow-2xl flex flex-col" id="email_history_drawer">
      {/* Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="font-sans font-bold text-sm text-slate-200">Dispatch Outbox Log</h3>
            <p className="text-4xs text-slate-500 font-mono">Confidential Board Logs (UTC)</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Outbox Items Scroller */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {logs.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center text-slate-500 font-mono text-xs">
            <Mail className="w-8 h-8 mb-2 text-slate-700" />
            No briefings dispatched in this session. Click "Share" to send a brief.
          </div>
        ) : (
          logs.map((log) => {
            const isGmail = log.provider === "gmail";
            const providerColor = isGmail ? "text-red-400 bg-red-500/10" : "text-blue-400 bg-blue-500/10";
            
            return (
              <div
                key={log.id}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800/60 hover:border-slate-700/80 transition space-y-3"
                id={`email_log_item_${log.id}`}
              >
                {/* Header indicators */}
                <div className="flex items-center justify-between">
                  <span className={`text-4xs font-mono font-bold uppercase px-2 py-0.5 rounded-md ${providerColor}`}>
                    {log.provider.toUpperCase()} ENGINE
                  </span>
                  <span className="text-4xs text-slate-500 font-mono flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {log.timestamp}
                  </span>
                </div>

                {/* Recipient Details */}
                <div className="space-y-1">
                  <p className="text-3xs text-slate-500 uppercase font-mono tracking-wider">Recipient(s):</p>
                  <p className="text-xs font-bold text-slate-200 truncate">{log.recipient}</p>
                </div>

                {/* Subject Details */}
                <div className="space-y-0.5">
                  <p className="text-3xs text-slate-500 uppercase font-mono tracking-wider">Subject Brief:</p>
                  <p className="text-xs text-slate-300 font-medium italic truncate">"{log.subject}"</p>
                </div>

                {/* Shared Sections Badges */}
                <div className="space-y-1 pt-1.5 border-t border-slate-900">
                  <p className="text-3xs text-slate-500 uppercase font-mono tracking-wider">Shared Sections:</p>
                  <div className="flex flex-wrap gap-1">
                    {log.sectionsShared.summary && (
                      <span className="text-4xs bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded font-mono">Summary</span>
                    )}
                    {log.sectionsShared.notes && (
                      <span className="text-4xs bg-emerald-500/10 text-emerald-300 px-1.5 py-0.5 rounded font-mono">Notes</span>
                    )}
                    {log.sectionsShared.risks && (
                      <span className="text-4xs bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded font-mono">Risks</span>
                    )}
                    {log.sectionsShared.dependencies && (
                      <span className="text-4xs bg-cyan-500/10 text-cyan-300 px-1.5 py-0.5 rounded font-mono">Dependencies</span>
                    )}
                  </div>
                </div>

                {/* Delivery status */}
                <div className="pt-2 flex items-center justify-between text-3xs font-mono text-emerald-400">
                  <span className="flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    DISPATCHED & SECURED
                  </span>
                  <span className="text-slate-500">256-bit AES</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer disclaimer */}
      <div className="p-4 bg-slate-950 border-t border-slate-800 text-center text-4xs font-mono text-slate-500 uppercase tracking-widest">
        Audit Log Verified
      </div>
    </div>
  );
}
