'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  Building,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Calendar,
  Plane,
  Car,
  Clock,
  Printer,
  AlertCircle,
  PenTool,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Invoice, CompanySettings, Booking } from '@/types/crm';
import { formatCurrency } from '@/lib/utils';

export default function ClientSignPage() {
  const params = useParams();
  const token = (params?.token as string) || '';

  const [isLoading, setIsLoading] = useState(true);
  const [agreementData, setAgreementData] = useState<{
    invoice: Invoice;
    companySettings: CompanySettings;
    booking?: Booking;
  } | null>(null);
  const [loadError, setLoadError] = useState('');

  // Signature Form State
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signatureType, setSignatureType] = useState<'typed' | 'drawn'>('typed');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Canvas for drawn signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (!token) return;

    const fetchAgreement = async () => {
      try {
        setIsLoading(true);
        setLoadError('');
        const res = await fetch(`/api/invoices/sign?token=${encodeURIComponent(token)}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Invoice agreement not found or link has expired.');
        }

        const data = await res.json();
        setAgreementData(data);
        setSignerName(data.invoice?.clientName || '');
        setSignerEmail(data.invoice?.clientEmail || '');
      } catch (err: any) {
        setLoadError(err.message || 'Failed to load booking agreement.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgreement();
  }, [token]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signerName.trim()) {
      setSubmitError('Please enter your full legal name.');
      return;
    }
    if (!agreedToTerms) {
      setSubmitError('You must review and check the box agreeing to the Terms & Conditions.');
      return;
    }

    let signatureData: string | undefined = undefined;
    if (signatureType === 'drawn') {
      if (!hasDrawn || !canvasRef.current) {
        setSubmitError('Please draw your digital signature on the pad provided.');
        return;
      }
      signatureData = canvasRef.current.toDataURL('image/png');
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await fetch('/api/invoices/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          signerName: signerName.trim(),
          signerEmail: signerEmail.trim(),
          agreedToTerms: true,
          signatureType,
          signatureData,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Failed to submit digital signature.');
      }

      setSubmitSuccess(true);
      if (agreementData) {
        setAgreementData({
          ...agreementData,
          invoice: result.invoice,
        });
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Error processing agreement signature.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Loading your travel agreement & invoice...</p>
        </div>
      </div>
    );
  }

  if (loadError || !agreementData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Agreement Not Found</h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {loadError || 'This booking agreement link may have expired or was incorrectly formatted.'}
            </p>
          </div>
          <p className="text-[11px] text-slate-400">
            Please contact your travel concierge if you need a new agreement link.
          </p>
        </div>
      </div>
    );
  }

  const { invoice, companySettings, booking } = agreementData;
  const isAlreadySigned = Boolean(invoice.signature?.signed);

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Floating Action Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xs shadow-xs">
              {(companySettings.companyName || 'TR').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">{companySettings.companyName}</div>
              <div className="text-[10px] text-slate-500">Travel Itinerary & Booking Agreement</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Signed Status Banner if Already Completed */}
        {isAlreadySigned && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 shadow-xs space-y-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <h2 className="text-sm font-bold text-emerald-950">
                Agreement Verified & Signed
              </h2>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              This booking agreement was electronically executed by{' '}
              <strong>{invoice.signature?.signerName}</strong> on{' '}
              {new Date(invoice.signature?.signedAt || '').toLocaleString('en-GB')}.
              {invoice.signature?.ipAddress && ` (IP: ${invoice.signature.ipAddress})`}.
            </p>
          </div>
        )}

        {/* Main Agreement Paper */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-slate-100 pb-6">
            <div className="space-y-2">
              {companySettings.logoUrl ? (
                <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden flex items-center justify-center bg-white p-1">
                  <img src={companySettings.logoUrl} alt={companySettings.companyName} className="max-w-full max-h-full object-contain" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-base shadow-xs">
                  {companySettings.companyName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-950">{companySettings.companyName}</h1>
                <p className="text-xs text-amber-700 font-medium">{companySettings.tagline}</p>
                <div className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  {companySettings.address}<br />
                  {companySettings.email} · {companySettings.phone}
                  {companySettings.taxRegistrationNumber && (
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Registration: {companySettings.taxRegistrationNumber}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-800 text-[10px] font-bold tracking-wider uppercase">
                OFFICIAL INVOICE & AGREEMENT
              </span>
              <div className="text-base font-bold font-mono text-slate-900">{invoice.invoiceRef}</div>
              <div className="text-xs text-slate-500 font-mono">Booking Ref: {invoice.bookingRef}</div>
              <div className="text-xs text-slate-500">Issue Date: {invoice.issueDate}</div>
              <div className="text-xs text-slate-500">Due Date: {invoice.dueDate}</div>
            </div>
          </div>

          {/* Client & Itinerary Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Passenger Party Lead
              </div>
              <div className="font-bold text-sm text-slate-900">{invoice.clientName}</div>
              <div className="text-slate-600">{invoice.clientEmail}</div>
              <div className="text-slate-600 font-mono">{invoice.clientPhone}</div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Itinerary Destination
              </div>
              <div className="font-bold text-sm text-slate-900">{booking?.destination || 'Custom Umrah / Tour Package'}</div>
              <div className="text-slate-600 font-mono">
                {booking?.departureDate || '—'} → {booking?.returnDate || '—'}
              </div>
              <div className="text-slate-600">Total Party: {booking?.paxCount || 1} Passengers</div>
            </div>
          </div>

          {/* Detailed Itinerary Cards (Flights, Hotels, Transport, Visas) */}
          {booking && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Included Itinerary & Services
              </h3>

              <div className="grid grid-cols-1 gap-3 text-xs">
                {/* Flight Route */}
                {booking.flight?.airline && (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center shrink-0">
                      <Plane className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="font-bold text-slate-900">
                        {booking.flight.airline} · {booking.flight.textOrRoute || 'Roundtrip Schedule'}
                      </div>
                      <div className="text-slate-600 text-[11px] font-mono">
                        PNR: <strong>{booking.flight.pnr || 'Issued Upon Deposit'}</strong> · Baggage: {booking.flight.luggageDetails}
                      </div>
                    </div>
                  </div>
                )}

                {/* Hotels */}
                {booking.hotels && booking.hotels.map((h, i) => (
                  <div key={h.id || i} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                      <Building className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="font-bold text-slate-900">
                        {h.hotelName} ({h.city})
                      </div>
                      <div className="text-slate-600 text-[11px]">
                        {h.rooms}x {h.roomType} · {h.meals} · {h.nights} Nights ({h.checkIn} → {h.checkOut})
                      </div>
                    </div>
                  </div>
                ))}

                {/* Ground Transfers */}
                {booking.transport && booking.transport.length > 0 && (
                  <div className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                      <Car className="w-4 h-4" />
                    </div>
                    <div className="flex-1 space-y-0.5">
                      <div className="font-bold text-slate-900">Ground Transfers & Chauffeur Services</div>
                      <div className="text-slate-600 text-[11px]">
                        {booking.transport.map((t) => `${t.pickUp} → ${t.dropOff} (${t.vehicleType})`).join(' | ')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Itemized Pricing */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Itemized Quotation & Billing
            </h3>
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <th className="py-2.5 px-4">Item & Description</th>
                    <th className="py-2.5 px-4 text-center">Qty</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.description}</td>
                      <td className="py-3 px-4 text-center font-mono text-slate-600">{item.quantity}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-slate-950">
                        £{Math.round(item.total).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Totals */}
            <div className="flex justify-end pt-2">
              <div className="w-72 space-y-1.5 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex justify-between text-slate-600">
                  <span>Total Package Value</span>
                  <span className="font-mono font-bold text-slate-950 tabular-nums">
                    £{invoice.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-medium border-t border-slate-200 pt-1">
                  <span>Amount Paid</span>
                  <span className="font-mono font-bold tabular-nums">
                    -£{invoice.paidAmount.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-950 border-t border-slate-300 pt-1.5">
                  <span>Remaining Due</span>
                  <span className="font-mono text-rose-600 tabular-nums">
                    £{invoice.remainingAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Escrow Bank Transfer Information */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Official Escrow Bank Transfer Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono text-slate-700">
              <div>Bank: <strong>{companySettings.bankName}</strong></div>
              <div>Account: <strong>{companySettings.accountName}</strong></div>
              <div>Account No: <strong>{companySettings.accountNumber}</strong></div>
              <div>Sort Code: <strong>{companySettings.sortCode || '20-00-00'}</strong></div>
              <div className="sm:col-span-2">
                IBAN: <strong>{companySettings.iban || '—'}</strong> · SWIFT: <strong>{companySettings.swift || '—'}</strong>
              </div>
            </div>
          </div>

          {/* Terms & Conditions Section with Checkbox */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Terms & Conditions Agreement</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Please carefully review the full terms governing booking deposits, cancellation, passport requirements, and amendments.
              </p>
            </div>

            <div className="max-h-56 overflow-y-auto p-4 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 leading-relaxed whitespace-pre-line select-text">
              {companySettings.termsAndConditions}
            </div>

            {/* Terms Agreement Checkbox */}
            {!isAlreadySigned && (
              <label className="flex items-start gap-3 p-4 rounded-xl border border-emerald-300 bg-emerald-50/50 cursor-pointer hover:bg-emerald-50 transition-colors">
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-emerald-950 leading-relaxed">
                  I confirm that I have read, understood, and accept all the Terms & Conditions and Booking Policies above on behalf of all passengers traveling.
                </span>
              </label>
            )}
          </div>

          {/* Digital Signature Execution Section */}
          {!isAlreadySigned ? (
            <form onSubmit={handleSignSubmit} className="space-y-6 pt-4 border-t border-slate-200">
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <PenTool className="w-4 h-4 text-emerald-600" />
                  <span>Electronic Legal Signature</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  By submitting this form, you create an legally binding digital agreement with {companySettings.companyName}.
                </p>
              </div>

              {submitError && (
                <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                  {submitError}
                </div>
              )}

              {/* Signer Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Signer Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full name as appears on passport"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Signer Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="For signed copy delivery"
                    value={signerEmail}
                    onChange={(e) => setSignerEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Signature Mode Selector */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setSignatureType('typed')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                      signatureType === 'typed'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Type Legal Signature
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureType('drawn')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
                      signatureType === 'drawn'
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Draw Signature Pad
                  </button>
                </div>

                {signatureType === 'typed' ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] text-slate-400 font-mono uppercase mb-1">
                      Digital Signature Preview:
                    </div>
                    <div className="text-2xl font-serif italic text-slate-900 tracking-wide">
                      {signerName || 'Your Signature Here'}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white relative">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={140}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-36 touch-none cursor-crosshair bg-white"
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">Draw signature with finger or mouse</span>
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="text-slate-500 hover:text-rose-600 font-semibold cursor-pointer"
                      >
                        Clear Pad
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !agreedToTerms}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl text-sm shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span>Verifying & Recording Agreement...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Accept Terms & Sign Agreement</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Signed Signature Certificate */
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Recorded Digital Signature
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="text-2xl font-serif italic text-slate-900">
                    {invoice.signature?.signerName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Signer: {invoice.signature?.signerEmail || invoice.clientEmail}
                  </div>
                </div>

                <div className="text-right text-xs font-mono text-slate-500 space-y-0.5">
                  <div className="text-emerald-700 font-bold">Verified Digital Signature</div>
                  <div>Timestamp: {new Date(invoice.signature?.signedAt || '').toISOString()}</div>
                  {invoice.signature?.ipAddress && <div>IP: {invoice.signature.ipAddress}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Document Footer */}
          <div className="pt-6 border-t border-slate-100 text-center text-[11px] text-slate-400 leading-relaxed">
            {companySettings.invoiceFooterNote || 'Thank you for placing your trust in us for your blessed journey.'}
            <div className="mt-1 text-[10px] text-slate-300">
              Secured & Managed by devntom CRM Solutions
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
