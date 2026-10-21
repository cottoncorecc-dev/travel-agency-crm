'use client';

import React, { useState } from 'react';
import {
  Receipt,
  CreditCard,
  AlertCircle,
  Plus,
  Search,
  CheckCircle,
  CheckCircle2,
  X,
  Building,
  Printer,
  Calendar,
  Send,
  Copy,
  ExternalLink,
  Share2,
  FileCheck2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Invoice, Payment, Booking, Agent, CompanySettings } from '@/types/crm';
import { formatCount, formatCurrency } from '@/lib/utils';
import ReceiptModal from '@/components/ReceiptModal';

interface InvoicesPaymentsViewProps {
  invoices: Invoice[];
  payments: Payment[];
  bookings: Booking[];
  currentUser: Agent;
  onRecordPayment: (paymentData: any) => Promise<void>;
  onOpenInvoiceModal: (invoice: Invoice) => void;
  activeSubTab?: 'invoices' | 'payments' | 'outstanding';
  companySettings?: CompanySettings | null;
}

export default function InvoicesPaymentsView({
  invoices = [],
  payments = [],
  bookings = [],
  currentUser,
  onRecordPayment,
  onOpenInvoiceModal,
  activeSubTab = 'invoices',
  companySettings,
}: InvoicesPaymentsViewProps) {
  const [subTab, setSubTab] = useState<'invoices' | 'payments' | 'outstanding'>(activeSubTab);
  const [search, setSearch] = useState('');

  // Payment Recording Modal State
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Credit Card' | 'Cash' | 'Cheque'>('Bank Transfer');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptNotes, setReceiptNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sharing Signing Link Modal State
  const [shareSigningInvoice, setShareSigningInvoice] = useState<Invoice | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Receipt Modal State
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);

  // Invoices with outstanding balances
  const outstandingInvoices = invoices.filter((i) => (i.remainingAmount ?? 0) > 0);

  const totalInvoiced = invoices.reduce((s, i) => s + (i.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((s, i) => s + (i.paidAmount || 0), 0);
  const totalOutstanding = invoices.reduce((s, i) => s + (i.remainingAmount || 0), 0);

  const openPaymentModalForInvoice = (inv: Invoice) => {
    setSelectedInvoiceId(inv.id);
    setPaymentAmount(inv.remainingAmount ?? 0);
    setTransactionRef(`TRF-${Math.floor(1000 + Math.random() * 9000)}`);
    setIsRecordOpen(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const inv = invoices.find((i) => i.id === selectedInvoiceId);
    if (!inv || !paymentAmount) return;

    setIsSubmitting(true);
    try {
      const recorded = {
        invoiceId: inv.id,
        bookingId: inv.bookingId,
        bookingRef: inv.bookingRef,
        agentId: inv.agentId,
        agentName: inv.agentName,
        clientName: inv.clientName,
        amount: paymentAmount,
        method: paymentMethod,
        transactionRef: transactionRef || `PAY-${Date.now().toString().slice(-6)}`,
        date: paymentDate,
        receiptNotes,
      };

      await onRecordPayment(recorded);
      setIsRecordOpen(false);
      setSelectedInvoiceId('');
      setPaymentAmount(0);
      setReceiptNotes('');

      // Open receipt modal for the new payment
      const paymentObj: Payment = {
        id: `pay_${Date.now()}`,
        paymentRef: `PAY-2026-${Math.floor(100 + Math.random() * 900)}`,
        createdAt: new Date().toISOString(),
        ...recorded,
      };
      setReceiptPayment(paymentObj);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSigningUrl = (inv: Invoice) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const token = inv.signingToken || inv.id;
    return `${origin}/sign/${token}`;
  };

  const handleCopySigningLink = (inv: Invoice) => {
    const url = getSigningUrl(inv);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleSendWhatsApp = (inv: Invoice) => {
    const url = getSigningUrl(inv);
    const text = encodeURIComponent(
      `Hello ${inv.clientName},\n\nPlease review your travel itinerary and electronically sign your booking agreement for ${inv.bookingRef}:\n\n${url}\n\nInvoice Total: £${(inv.totalAmount || 0).toLocaleString()}\nThank you for choosing ${inv.companyName || companySettings?.companyName || 'our agency'}.`
    );
    const phone = (inv.clientPhone || '').replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  // Filtered lists with safe optional chaining
  const searchLower = search.toLowerCase();

  const filteredInvoices = invoices.filter(
    (i) =>
      (i.invoiceRef || '').toLowerCase().includes(searchLower) ||
      (i.clientName || '').toLowerCase().includes(searchLower) ||
      (i.bookingRef || '').toLowerCase().includes(searchLower)
  );

  const filteredPayments = payments.filter(
    (p) =>
      (p.paymentRef || '').toLowerCase().includes(searchLower) ||
      (p.clientName || '').toLowerCase().includes(searchLower) ||
      (p.transactionRef || '').toLowerCase().includes(searchLower) ||
      (p.bookingRef || '').toLowerCase().includes(searchLower)
  );

  const filteredOutstanding = outstandingInvoices.filter(
    (i) =>
      (i.invoiceRef || '').toLowerCase().includes(searchLower) ||
      (i.clientName || '').toLowerCase().includes(searchLower) ||
      (i.bookingRef || '').toLowerCase().includes(searchLower)
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header with KPI cards */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-600" />
            <span>Invoices, Agreements & Payment Receipts</span>
          </h2>
          <p className="text-xs text-neutral-500">
            Generate client invoices, track electronic terms signatures, log payments, and print official receipts with full payment history.
          </p>
        </div>
        <button
          onClick={() => {
            if (outstandingInvoices.length > 0) {
              openPaymentModalForInvoice(outstandingInvoices[0]);
            } else {
              setIsRecordOpen(true);
            }
          }}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold px-4 py-2 rounded-lg text-xs tracking-wide shadow-sm hover:shadow transition-all shrink-0 cursor-pointer"
        >
          <CreditCard className="w-4 h-4 stroke-[2.5]" />
          <span>Record Payment & Receipt</span>
        </button>
      </div>

      {/* KPI Summary Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Invoiced */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Total Invoiced
          </div>
          <div className="text-2xl font-bold text-neutral-900 font-mono tabular-nums mt-1">
            {formatCurrency(totalInvoiced)}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            {formatCount(invoices.length)} Invoices generated
          </div>
        </div>

        {/* Collected Receipts */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Payments Received
          </div>
          <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-[11px] text-emerald-800 font-semibold mt-1">
            {formatCount(payments.length)} Official receipts recorded
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 shadow-xs">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Outstanding Balances
          </div>
          <div className="text-2xl font-bold text-rose-600 font-mono tabular-nums mt-1">
            {formatCurrency(totalOutstanding)}
          </div>
          <div className="text-[11px] text-rose-700 font-semibold mt-1">
            {formatCount(outstandingInvoices.length)} Invoices pending settlement
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'invoices', label: 'All Invoices & Agreements', count: invoices.length },
            { id: 'payments', label: 'Payment Receipts Ledger', count: payments.length },
            { id: 'outstanding', label: 'Pending Receivables', count: outstandingInvoices.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                subTab === tab.id
                  ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-300 shadow-2xs'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
          />
        </div>
      </div>

      {/* VIEW 1: INVOICES TABLE WITH AGREEMENT STATUS TRACKING */}
      {subTab === 'invoices' && (
        <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice / Booking</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Agreement Status</th>
                  <th className="py-3 px-4">Agent</th>
                  <th className="py-3 px-4">Dates</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance Due</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-neutral-400">
                      No invoices found in database.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const isSigned = Boolean(inv.signature?.signed);
                    return (
                      <tr key={inv.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-mono">
                          <div
                            onClick={() => onOpenInvoiceModal(inv)}
                            className="font-bold text-amber-700 hover:text-amber-800 cursor-pointer"
                          >
                            {inv.invoiceRef}
                          </div>
                          <div className="text-[10px] text-neutral-400">{inv.bookingRef}</div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-bold text-neutral-900">{inv.clientName}</div>
                          <div className="text-[10px] text-neutral-500 font-mono">{inv.clientPhone}</div>
                        </td>

                        {/* Agreement Tracking */}
                        <td className="py-3.5 px-4">
                          {isSigned ? (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Signed & Confirmed</span>
                              </span>
                              <div className="text-[10px] text-neutral-500">
                                by {inv.signature?.signerName}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>Pending Signature</span>
                              </span>
                              <button
                                onClick={() => setShareSigningInvoice(inv)}
                                className="block text-[10px] text-emerald-700 font-semibold hover:underline cursor-pointer"
                              >
                                Send Signing Link →
                              </button>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-neutral-800 font-medium">{inv.agentName}</td>

                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <div>{inv.issueDate}</div>
                          <div className="text-neutral-400 text-[10px]">Due: {inv.dueDate}</div>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-neutral-900">
                          £{(inv.totalAmount ?? 0).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-600 font-bold">
                          £{(inv.paidAmount ?? 0).toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                          {(inv.remainingAmount ?? 0) > 0 ? (
                            <span className="text-rose-600 font-bold">
                              £{inv.remainingAmount.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Paid
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setShareSigningInvoice(inv)}
                              title="Send client electronic signing link"
                              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onOpenInvoiceModal(inv)}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors cursor-pointer"
                            >
                              View
                            </button>
                            {(inv.remainingAmount ?? 0) > 0 && (
                              <button
                                onClick={() => openPaymentModalForInvoice(inv)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-neutral-950 shadow-2xs transition-colors cursor-pointer"
                              >
                                Pay & Receipt
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: PAYMENTS TABLE WITH RECEIPT GENERATION & HISTORY */}
      {subTab === 'payments' && (
        <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Receipt Ref</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Method & Trans Ref</th>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Agent</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Amount Received</th>
                  <th className="py-3 px-4 text-right">Official Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-400">
                      No payments recorded in database yet.
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">{p.paymentRef}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-neutral-900">{p.clientName}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-neutral-900 font-medium">{p.method}</div>
                        <div className="text-[10px] font-mono text-neutral-400">{p.transactionRef}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-amber-700 font-bold">{p.bookingRef}</td>
                      <td className="py-3.5 px-4 text-neutral-800">{p.agentName}</td>
                      <td className="py-3.5 px-4 font-mono text-neutral-500">{p.date}</td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-emerald-600 text-sm">
                        +£{(p.amount ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setReceiptPayment(p)}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg transition-colors cursor-pointer ml-auto"
                        >
                          <Printer className="w-3.5 h-3.5 text-emerald-700" />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: OUTSTANDING BALANCES TABLE */}
      {subTab === 'outstanding' && (
        <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice / Booking</th>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Outstanding Balance</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
                {filteredOutstanding.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-emerald-700 font-bold">
                      ✓ All invoices are completely settled. No outstanding balances!
                    </td>
                  </tr>
                ) : (
                  filteredOutstanding.map((inv) => (
                    <tr key={inv.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-amber-700">{inv.invoiceRef}</div>
                        <div className="text-[10px] text-neutral-400">{inv.bookingRef}</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-neutral-900">{inv.clientName}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-neutral-600">
                        {inv.clientPhone}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-neutral-500">{inv.dueDate}</td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-800 font-semibold">
                        £{(inv.totalAmount ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-emerald-600 font-bold">
                        £{(inv.paidAmount ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-rose-600 text-sm">
                        £{(inv.remainingAmount ?? 0).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => openPaymentModalForInvoice(inv)}
                          className="px-3 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-lg shadow-sm transition-colors cursor-pointer"
                        >
                          Record Payment
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: SHARE SIGNING LINK TO CLIENT */}
      {shareSigningInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-900">Send Agreement Link to Client</h3>
              </div>
              <button
                onClick={() => setShareSigningInvoice(null)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-1">
                <div className="text-neutral-500 text-[10px] uppercase font-bold">Client Recipient</div>
                <div className="font-bold text-sm text-neutral-900">{shareSigningInvoice.clientName}</div>
                <div className="text-neutral-600 font-mono">{shareSigningInvoice.clientPhone} · {shareSigningInvoice.clientEmail}</div>
                <div className="text-[11px] text-amber-700 font-mono">Invoice: {shareSigningInvoice.invoiceRef} ({shareSigningInvoice.bookingRef})</div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  Electronic Agreement & Signing Portal URL
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getSigningUrl(shareSigningInvoice)}
                    className="flex-1 bg-slate-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 font-mono select-all focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopySigningLink(shareSigningInvoice)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => handleSendWhatsApp(shareSigningInvoice)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </button>

                <a
                  href={`/sign/${shareSigningInvoice.signingToken || shareSigningInvoice.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold rounded-xl text-xs border border-neutral-300 transition-colors text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Preview Client View</span>
                </a>
              </div>

              <div className="text-[11px] text-neutral-500 leading-relaxed bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                <strong>Client Signing Flow:</strong> The client clicks the link, views the full itinerary with company branding, reviews the Terms & Conditions, checks the agreement box, draws or types their signature, and confirms. Once completed, this invoice updates to <strong>Signed & Confirmed</strong>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD PAYMENT */}
      {isRecordOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-neutral-100 bg-neutral-50/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-neutral-900">Record Client Payment & Generate Receipt</h3>
              </div>
              <button
                onClick={() => setIsRecordOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Select Invoice / Client *
                </label>
                <select
                  required
                  value={selectedInvoiceId}
                  onChange={(e) => {
                    setSelectedInvoiceId(e.target.value);
                    const inv = invoices.find((i) => i.id === e.target.value);
                    if (inv) setPaymentAmount(inv.remainingAmount ?? 0);
                  }}
                  className="w-full bg-slate-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                >
                  <option value="">-- Choose an Invoice --</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceRef} - {inv.clientName} (Bal: £{(inv.remainingAmount ?? 0).toLocaleString()})
                      {inv.signature?.signed ? ' [SIGNED]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Amount Received (£) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 font-mono font-bold text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full bg-slate-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  >
                    <option value="Bank Transfer">Bank Transfer (Faster Payments/Wire)</option>
                    <option value="Credit Card">Credit / Debit Card</option>
                    <option value="Cash">Cash (Office)</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Transaction / Bank Ref
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. BARC-TRF-8812"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full bg-slate-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Date Received *
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Receipt Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes for client receipt or accounts record..."
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-neutral-200 rounded-lg p-2.5 text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsRecordOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-neutral-950 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm & Generate Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: OFFICIAL PAYMENT RECEIPT WITH FULL PAYMENT HISTORY */}
      {receiptPayment && (
        <ReceiptModal
          isOpen={Boolean(receiptPayment)}
          onClose={() => setReceiptPayment(null)}
          payment={receiptPayment}
          invoice={invoices.find((i) => i.id === receiptPayment.invoiceId)}
          booking={bookings.find((b) => b.id === receiptPayment.bookingId || b.bookingRef === receiptPayment.bookingRef)}
          allInvoicePayments={payments.filter((p) => p.invoiceId === receiptPayment.invoiceId)}
          companySettings={companySettings}
        />
      )}
    </div>
  );
}
