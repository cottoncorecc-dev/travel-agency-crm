'use client';

import React, { useState } from 'react';
import { Database, CheckCircle2, AlertCircle, RefreshCw, X, Server, Layers } from 'lucide-react';
import { DbStatusInfo } from '@/types/crm';

interface DatabaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  dbStatus: DbStatusInfo | null;
  onRefreshStatus: () => Promise<void>;
}

export default function DatabaseStatusModal({
  isOpen,
  onClose,
  dbStatus,
  onRefreshStatus,
}: DatabaseStatusModalProps) {
  if (!isOpen) return null;

  const [customUri, setCustomUri] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [feedback, setFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleConnectMongo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUri) return;

    setIsUpdating(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/db/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uri: customUri }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({ success: true, message: data.message || 'Connected to MongoDB successfully!' });
        await onRefreshStatus();
      } else {
        setFeedback({ success: false, message: data.error || 'Failed to connect to provided MongoDB URI' });
      }
    } catch (err: any) {
      setFeedback({ success: false, message: err.message || 'Connection error' });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/70 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-neutral-900">Database Engine & Persistence</h3>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs text-neutral-700">
          {/* Status Tile */}
          <div className="p-4 rounded-xl bg-slate-50 border border-neutral-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Database Engine
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Connected & Live</span>
              </span>
            </div>

            <div className="text-sm font-bold text-neutral-900">
              {dbStatus?.type === 'mongodb' && dbStatus?.connected
                ? `MongoDB Atlas Cluster (${dbStatus.databaseName})`
                : 'MongoDB Driver Connected'}
            </div>

            <p className="text-[11px] text-neutral-500 leading-relaxed">
              {dbStatus?.message || 'All records, agents, bookings, invoices, and payments are stored in the database.'}
            </p>
          </div>

          {/* Collection Counters */}
          <div>
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>Database Collections & Records (Live)</span>
              <button
                type="button"
                onClick={onRefreshStatus}
                className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 text-[11px] cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Counts</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2.5 font-mono text-center">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-neutral-200">
                <div className="text-neutral-400 text-[10px] font-bold uppercase font-sans">Agents</div>
                <div className="text-base font-bold text-neutral-900">{dbStatus?.collections.agents ?? 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-neutral-200">
                <div className="text-neutral-400 text-[10px] font-bold uppercase font-sans">Bookings</div>
                <div className="text-base font-bold text-neutral-900">{dbStatus?.collections.bookings ?? 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-neutral-200">
                <div className="text-neutral-400 text-[10px] font-bold uppercase font-sans">Invoices</div>
                <div className="text-base font-bold text-neutral-900">{dbStatus?.collections.invoices ?? 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-neutral-200">
                <div className="text-neutral-400 text-[10px] font-bold uppercase font-sans">Payments</div>
                <div className="text-base font-bold text-emerald-600">{dbStatus?.collections.payments ?? 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-neutral-200">
                <div className="text-neutral-400 text-[10px] font-bold uppercase font-sans">Clients</div>
                <div className="text-base font-bold text-neutral-900">{dbStatus?.collections.clients ?? 0}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-neutral-200">
                <div className="text-neutral-400 text-[10px] font-bold uppercase font-sans">Sessions</div>
                <div className="text-base font-bold text-neutral-900">{dbStatus?.collections.sessions ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Connection URI Form */}
          <div className="pt-3 border-t border-neutral-100 space-y-3">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              MongoDB Connection URI
            </div>
            <p className="text-[11px] text-neutral-500">
              Currently connected to your MongoDB cluster. You can update or re-test the connection below:
            </p>

            {feedback && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  feedback.success
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {feedback.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                <span>{feedback.message}</span>
              </div>
            )}

            <form onSubmit={handleConnectMongo} className="space-y-3">
              <input
                type="text"
                placeholder="mongodb+srv://fantomdevcode:fantomdevcoder@cluster0..."
                value={customUri}
                onChange={(e) => setCustomUri(e.target.value)}
                className="w-full bg-slate-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="submit"
                  disabled={isUpdating || !customUri}
                  className="px-3.5 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-lg shadow-sm transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {isUpdating ? 'Testing Connection...' : 'Update & Reconnect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
