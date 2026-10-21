'use client';

import React from 'react';
import {
  X,
  Printer,
  Share2,
  CheckCircle2,
  Building,
  CreditCard,
  Calendar,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Payment, Invoice, Booking, CompanySettings } from '@/types/crm';
import { formatCurrency } from '@/lib/utils';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  invoice?: Invoice | null;
  booking?: Booking | null;
  allInvoicePayments?: Payment[];
  companySettings?: CompanySettings | null;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  payment,
  invoice,
  booking,
  allInvoicePayments = [],
  companySettings,
}: ReceiptModalProps) {
  if (!isOpen || !payment) return null;

  const companyName = companySettings?.companyName || invoice?.companyName || payment.companyId || 'Devntom Travel';
  const logoUrl = companySettings?.logoUrl;
  const clientName = payment.clientName || invoice?.clientName || booking?.customerName || 'Valued Client';
  const clientPhone = invoice?.clientPhone || booking?.contactNumber || '—';
  const clientEmail = invoice?.clientEmail || booking?.email || '—';

  const receiptRef = payment.paymentRef || `RCP-${Date.now().toString().slice(-6)}`;
  const invoiceRef = payment.invoiceId ? (invoice?.invoiceRef || payment.invoiceId) : '—';
  const bookingRef = payment.bookingRef || invoice?.bookingRef || booking?.bookingRef || '—';

  // Gather all payments related to this invoice for the complete history
  const historyPayments = allInvoicePayments.length > 0
    ? allInvoicePayments
    : [payment];

  // Sort chronological
  const sortedPayments = [...historyPayments].sort(
    (a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime()
  );

  const totalInvoiceAmount = invoice?.totalAmount ?? booking?.costing?.totalAmount ?? payment.amount;
  const cumulativePaid = sortedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remainingDue = Math.max(0, totalInvoiceAmount - cumulativePaid);

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Official Payment Receipt from ${companyName}\n\nReceipt No: ${receiptRef}\nClient: ${clientName}\nBooking Ref: ${bookingRef}\nAmount Received: £${payment.amount.toLocaleString()}\nPayment Method: ${payment.method} (${payment.transactionRef})\nDate: ${payment.date}\n\nTotal Paid to Date: £${cumulativePaid.toLocaleString()}\nRemaining Balance: £${remainingDue.toLocaleString()}\n\nThank you for choosing ${companyName}.`
    );
    const phoneClean = clientPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phoneClean}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-2xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Modal Top Control Bar */}
        <div className="px-6 py-3.5 border-b border-neutral-200 bg-neutral-50/80 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-emerald-700">{receiptRef}</span>
            <span className="text-neutral-300">·</span>
            <span className="text-xs text-neutral-600 font-medium">Official Payment Receipt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-600" />
              <span>Print Receipt</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Send WhatsApp</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-white text-neutral-900 print:p-0">
          <div className="max-w-xl mx-auto space-y-6">
            {/* Header: Company & Receipt Details */}
            <div className="flex items-start justify-between border-b border-neutral-200 pb-5">
              <div>
                <div className="flex items-center gap-2.5">
                  {logoUrl ? (
                    <div className="w-10 h-10 rounded-xl border border-neutral-200 overflow-hidden flex items-center justify-center bg-white p-1">
                      <img src={logoUrl} alt={companyName} className="max-w-full max-h-full object-contain" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-neutral-950 text-amber-400 flex items-center justify-center font-bold text-sm shadow-xs">
                      {companyName.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h1 className="text-lg font-bold tracking-tight text-neutral-950">{companyName}</h1>
                    <div className="text-[11px] text-amber-700 font-medium">
                      {companySettings?.tagline || 'Bespoke Travel & Pilgrimage Management'}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-500 mt-2.5 leading-relaxed">
                  {companySettings?.address || '45-47 Merchant Gate, City Centre, London, EC1A 4JQ'}<br />
                  {companySettings?.email || 'operations@devntom.com'} · {companySettings?.phone || '+44 20 7946 0912'}
                  {companySettings?.taxRegistrationNumber && (
                    <div className="text-[10px] font-mono text-neutral-400 mt-0.5">
                      Lic / VAT: {companySettings.taxRegistrationNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 text-[11px] font-bold tracking-wider uppercase mb-1 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>PAYMENT RECEIVED</span>
                </div>
                <div className="text-base font-bold font-mono text-neutral-950">{receiptRef}</div>
                <div className="text-xs text-neutral-500 font-mono mt-1">Date: {payment.date}</div>
                <div className="text-xs text-neutral-500 font-mono">Invoice: {invoiceRef}</div>
                <div className="text-xs text-neutral-500 font-mono">Booking: {bookingRef}</div>
              </div>
            </div>

            {/* Received From & Payment Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-neutral-50/80 border border-neutral-200/80 space-y-1">
                <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Received From (Client)
                </div>
                <div className="font-bold text-sm text-neutral-950">{clientName}</div>
                <div className="text-neutral-600 font-mono">{clientPhone}</div>
                <div className="text-neutral-600">{clientEmail}</div>
                <div className="text-[11px] text-neutral-500">Agent: {payment.agentName}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 space-y-1">
                <div className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                  Current Transaction Details
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
                  {formatCurrency(payment.amount)}
                </div>
                <div className="text-neutral-700 font-medium">
                  Method: <strong>{payment.method}</strong>
                </div>
                <div className="text-neutral-600 font-mono text-[11px]">
                  Ref: {payment.transactionRef}
                </div>
              </div>
            </div>

            {/* Complete Payment History Ledger */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Invoice Payment History</span>
                </h3>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {sortedPayments.length} installment{sortedPayments.length > 1 ? 's' : ''} logged
                </span>
              </div>

              <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Receipt Ref</th>
                      <th className="py-2 px-3">Method & Trans Ref</th>
                      <th className="py-2 px-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
                    {sortedPayments.map((p, idx) => {
                      const isCurrent = p.id === payment.id;
                      return (
                        <tr
                          key={p.id}
                          className={isCurrent ? 'bg-emerald-50/30 font-bold text-neutral-950' : ''}
                        >
                          <td className="py-2.5 px-3 font-mono text-neutral-500">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono">{p.date}</td>
                          <td className="py-2.5 px-3 font-mono text-amber-700">{p.paymentRef}</td>
                          <td className="py-2.5 px-3 text-neutral-700">
                            <div>{p.method}</div>
                            <div className="text-[10px] text-neutral-400 font-mono">{p.transactionRef}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums text-emerald-700 font-bold">
                            +£{p.amount.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Ledger Balance Totals */}
            <div className="flex justify-end pt-1">
              <div className="w-72 space-y-1.5 text-xs bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-200">
                <div className="flex justify-between text-neutral-600">
                  <span>Total Invoice Value</span>
                  <span className="font-mono font-bold text-neutral-900 tabular-nums">
                    £{totalInvoiceAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium border-t border-neutral-200 pt-1">
                  <span>Total Paid to Date</span>
                  <span className="font-mono font-bold tabular-nums">
                    £{cumulativePaid.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-neutral-950 border-t border-neutral-300 pt-1">
                  <span>Remaining Balance Due</span>
                  <span className={`font-mono tabular-nums ${remainingDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    £{remainingDue.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer & Accreditations */}
            <div className="pt-4 border-t border-neutral-200 text-xs text-neutral-600 space-y-3">
              {payment.receiptNotes && (
                <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-700">
                  <strong>Notes:</strong> {payment.receiptNotes}
                </div>
              )}

              <div className="text-[11px] text-neutral-500 leading-relaxed text-center">
                {companySettings?.receiptFooterNote || 'Official Payment Receipt. Please retain this document as verified proof of payment.'}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-[10px] text-neutral-400">
                <div className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Authorized Accounting Ledger Record · devntom CRM</span>
                </div>
                <div>Developed by Devntom Solutions</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
