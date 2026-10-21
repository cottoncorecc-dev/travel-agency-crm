'use client';

import React, { useRef } from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  CheckCircle,
  Clock,
  Building,
  CreditCard,
  Send,
  FileText,
  Mail,
  Phone,
} from 'lucide-react';
import { Booking, Invoice, CompanySettings } from '@/types/crm';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking?: Booking | null;
  invoice?: Invoice | null;
  onRecordPaymentClick?: (booking: Booking) => void;
  companySettings?: CompanySettings | null;
}

export default function InvoiceModal({
  isOpen,
  onClose,
  booking,
  invoice,
  onRecordPaymentClick,
  companySettings,
}: InvoiceModalProps) {
  if (!isOpen) return null;

  const invoiceRef = invoice?.invoiceRef || `INV-2026-${booking?.bookingRef ? booking.bookingRef.split('-')[2] : '001'}`;
  const clientName = invoice?.clientName || booking?.customerName || 'Valued Client';
  const clientEmail = invoice?.clientEmail || booking?.email || 'client@example.com';
  const clientPhone = invoice?.clientPhone || booking?.contactNumber || '—';
  const totalAmount = invoice?.totalAmount ?? booking?.costing?.totalAmount ?? 0;
  const paidAmount = invoice?.paidAmount ?? booking?.costing?.paidAmount ?? 0;
  const remainingAmount = invoice?.remainingAmount ?? booking?.costing?.remainingAmount ?? 0;
  const issueDate = invoice?.issueDate || new Date().toISOString().split('T')[0];
  const dueDate = invoice?.dueDate || '2026-10-15';
  const isPaid = remainingAmount === 0;
  const companyName = companySettings?.companyName || invoice?.companyName || booking?.companyName || 'Travel & Umrah Services';
  const logoUrl = companySettings?.logoUrl;
  const isSigned = Boolean(invoice?.signature?.signed);

  // Build clean client-facing line items (HIDES internal purchasing cost & agent profit margin!)
  const items = invoice?.items || [
    {
      id: 'item_1',
      description: `Flight Reservation Package (${booking?.flight?.airline || 'Scheduled Flight'}) · ${booking?.paxCount || 1} Passengers`,
      quantity: booking?.paxCount || 1,
      unitPrice: (booking?.costing?.flights?.totalSelling || 0) / (booking?.paxCount || 1),
      total: booking?.costing?.flights?.totalSelling || 0,
    },
    {
      id: 'item_2',
      description: `Hotel Accommodations (${booking?.hotels?.map((h) => h.hotelName).join(' & ') || 'Package Accommodations'})`,
      quantity: 1,
      unitPrice:
        (booking?.costing?.makkahHotel?.totalSelling || 0) +
        (booking?.costing?.madinahHotel?.totalSelling || 0) +
        (booking?.costing?.otherHotel?.totalSelling || 0),
      total:
        (booking?.costing?.makkahHotel?.totalSelling || 0) +
        (booking?.costing?.madinahHotel?.totalSelling || 0) +
        (booking?.costing?.otherHotel?.totalSelling || 0),
    },
    ...(booking?.costing?.visas?.totalSelling
      ? [
          {
            id: 'item_3',
            description: `Visa Processing & Documentation (${booking?.visa?.visaType || 'Tourist/Umrah eVisa'})`,
            quantity: booking?.visa?.count || 1,
            unitPrice: (booking?.costing?.visas?.totalSelling || 0) / (booking?.visa?.count || 1),
            total: booking?.costing?.visas?.totalSelling || 0,
          },
        ]
      : []),
    ...(booking?.costing?.transport?.totalSelling
      ? [
          {
            id: 'item_4',
            description: `VIP Private Ground Transfers & Chauffeur Services`,
            quantity: 1,
            unitPrice: booking?.costing?.transport?.totalSelling || 0,
            total: booking?.costing?.transport?.totalSelling || 0,
          },
        ]
      : []),
    ...(booking?.costing?.otherServices?.totalSelling
      ? [
          {
            id: 'item_5',
            description: `VIP Concierge & Guided Ziyarat Tours`,
            quantity: 1,
            unitPrice: booking?.costing?.otherServices?.totalSelling || 0,
            total: booking?.costing?.otherServices?.totalSelling || 0,
          },
        ]
      : []),
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${clientName},\n\nHere is your ${companyName} travel invoice (${invoiceRef}) for ${booking?.destination || 'your itinerary'}.\n\nTotal Amount: £${totalAmount.toLocaleString()}\nAmount Paid: £${paidAmount.toLocaleString()}\nRemaining Balance: £${remainingAmount.toLocaleString()}\n\nThank you for choosing ${companyName}.`
    );
    const phoneClean = clientPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phoneClean}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-3xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in zoom-in-95 duration-150">
        {/* Top Control Bar */}
        <div className="px-6 py-3.5 border-b border-neutral-200 bg-neutral-50/70 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-amber-700">{invoiceRef}</span>
            <span className="text-neutral-300">·</span>
            <span className="text-xs text-neutral-600 font-medium">Client-Facing Official Invoice</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-800 bg-white hover:bg-neutral-100 border border-neutral-200 rounded-lg transition-colors cursor-pointer shadow-2xs"
            >
              <Printer className="w-3.5 h-3.5 text-neutral-600" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            {booking && onRecordPaymentClick && remainingAmount > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onRecordPaymentClick(booking);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-neutral-950 bg-emerald-500 hover:bg-emerald-600 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Record Payment</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700 ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet Container */}
        <div className="flex-1 overflow-y-auto p-8 bg-white text-neutral-900 print:p-0">
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Header Lockup */}
            <div className="flex items-start justify-between border-b border-neutral-200 pb-6">
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
                    <h1 className="text-xl font-bold tracking-tight text-neutral-950">{companyName}</h1>
                    <div className="text-[11px] text-amber-700 font-medium">
                      {companySettings?.tagline || 'Bespoke Luxury Travel & Pilgrimage Logistics'}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-neutral-500 mt-2.5 leading-relaxed">
                  {companySettings?.address || '25 Berkeley Square, Mayfair, London W1J 6HN, UK'}<br />
                  {companySettings?.email || 'operations@devntom.com'} · {companySettings?.phone || '+44 20 7946 0912'}
                  {companySettings?.taxRegistrationNumber && (
                    <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                      Lic / VAT: {companySettings.taxRegistrationNumber}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-right">
                <div
                  className={`inline-block px-3 py-1 rounded text-xs font-bold tracking-wider uppercase mb-2 ${
                    isPaid ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-800'
                  }`}
                >
                  {isPaid ? 'PAID IN FULL' : 'TAX INVOICE'}
                </div>
                <div className="text-lg font-bold font-mono text-neutral-900">{invoiceRef}</div>
                <div className="text-xs text-neutral-500 font-mono mt-1">Booking Ref: {booking?.bookingRef || '—'}</div>
                <div className="text-xs text-neutral-500 mt-1">Issue Date: {issueDate}</div>
                <div className="text-xs text-neutral-500">Due Date: {dueDate}</div>
              </div>
            </div>

            {/* Signed Verification Banner */}
            {isSigned && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Agreement Signed by <strong>{invoice?.signature?.signerName}</strong> on{' '}
                    {invoice?.signature?.signedAt ? new Date(invoice.signature.signedAt).toLocaleDateString('en-GB') : 'Verified'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 uppercase font-bold tracking-wider">
                  Verified Electronic Agreement
                </span>
              </div>
            )}

            {/* Bill To & Itinerary Summary */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              <div className="p-3.5 rounded-xl bg-neutral-50/80 border border-neutral-200/80 space-y-1">
                <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Billed To (Lead Passenger)
                </div>
                <div className="font-bold text-sm text-neutral-950">{clientName}</div>
                <div className="text-neutral-600">{clientEmail}</div>
                <div className="text-neutral-600 font-mono">{clientPhone}</div>
                {booking?.passportInfo && (
                  <div className="text-neutral-500 text-[11px] font-mono">Passport: {booking.passportInfo}</div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-50/80 border border-neutral-200/80 space-y-1">
                <div className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Itinerary & Booking Overview
                </div>
                <div className="font-bold text-neutral-900">{booking?.destination || 'Custom Tour Package'}</div>
                <div className="text-neutral-600 font-mono">
                  {booking?.departureDate || '—'} → {booking?.returnDate || '—'}
                </div>
                <div className="text-neutral-600">Total Party: {booking?.paxCount || 1} Passengers</div>
                <div className="text-[11px] text-neutral-500">Agent: {booking?.agentName || 'Concierge'}</div>
              </div>
            </div>

            {/* Passenger Manifest Note if group */}
            {booking?.passengers && booking.passengers.length > 1 && (
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs">
                <div className="font-bold text-neutral-700 mb-1">Passenger Manifest:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-neutral-600">
                  {booking.passengers.map((p, idx) => (
                    <div key={p.id}>
                      {idx + 1}. {p.name || 'Passenger'} ({p.category})
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Line Items Table */}
            <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-500 font-bold uppercase text-[10px] tracking-wider border-b border-neutral-200">
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-medium text-neutral-800">
                  {items.map((it) => (
                    <tr key={it.id}>
                      <td className="py-3 px-4">
                        <div className="font-bold text-neutral-900">{it.description}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-neutral-600">{it.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-neutral-700">
                        £{Math.round(it.unitPrice).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-neutral-950">
                        £{Math.round(it.total).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="flex justify-end pt-2">
              <div className="w-72 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-neutral-200 text-neutral-600">
                  <span>Package Total</span>
                  <span className="font-mono font-bold text-neutral-900 tabular-nums">
                    £{totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-200 text-emerald-700 font-medium">
                  <span>Amount Paid</span>
                  <span className="font-mono font-bold tabular-nums">
                    -£{paidAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b-2 border-neutral-950 text-sm font-bold text-neutral-950">
                  <span>Balance Due</span>
                  <span className="font-mono tabular-nums text-rose-600">
                    £{remainingAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Wire Details & Notes */}
            <div className="pt-4 border-t border-neutral-200 text-xs text-neutral-600 space-y-3">
              <div className="p-3.5 rounded-xl bg-neutral-50/80 border border-neutral-200">
                <div className="font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-neutral-700" />
                  <span>Official Bank Wire Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-neutral-700">
                  <div>Bank: <strong>{companySettings?.bankName || 'Barclays Bank UK PLC'}</strong></div>
                  <div>Account: <strong>{companySettings?.accountName || `${companyName} Escrow Account`}</strong></div>
                  <div>Account No: <strong>{companySettings?.accountNumber || '40918234'}</strong></div>
                  <div>Sort Code: <strong>{companySettings?.sortCode || '20-00-00'}</strong></div>
                  <div className="sm:col-span-2">
                    IBAN: <strong>{companySettings?.iban || 'GB29BARC20000040918234'}</strong> · SWIFT: <strong>{companySettings?.swift || 'BARCGB22'}</strong>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-neutral-500 leading-relaxed">
                {companySettings?.invoiceFooterNote || (
                  <span>
                    <strong>Terms & Conditions:</strong> Please include invoice reference <strong>{invoiceRef}</strong> in all bank transfer descriptions. Remaining balance must be settled in full prior to ticketing and voucher release.
                  </span>
                )}
              </div>

              <div className="text-[10px] text-neutral-400 font-medium text-center pt-2 border-t border-neutral-100">
                Developed by Devntom Solutions
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
