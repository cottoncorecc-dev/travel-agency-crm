'use client';

import React, { useState, useEffect } from 'react';
import {
  Building,
  Upload,
  Save,
  CheckCircle2,
  FileText,
  CreditCard,
  Phone,
  Mail,
  Globe,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { CompanySettings, Agent } from '@/types/crm';

interface CompanySettingsViewProps {
  currentUser: Agent;
  onSettingsUpdated?: (settings: CompanySettings) => void;
}

export default function CompanySettingsView({
  currentUser,
  onSettingsUpdated,
}: CompanySettingsViewProps) {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Active form section tab
  const [activeTab, setActiveTab] = useState<'profile' | 'contact' | 'bank' | 'terms'>('profile');

  // Load current company settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/company/settings?companyId=${currentUser.companyId || 'comp_default'}`);
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Failed to load company settings:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [currentUser.companyId]);

  const handleChange = (field: keyof CompanySettings, value: any) => {
    if (!settings) return;
    setSettings({
      ...settings,
      [field]: value,
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorMessage('Logo image file must be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        handleChange('logoUrl', base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await fetch('/api/company/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          companyId: currentUser.companyId || settings.companyId || 'comp_default',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save settings');
      }

      const updated = await res.json();
      setSettings(updated);
      setSuccessMessage('Company identity and branding settings saved successfully! Changes are now live on all invoices, receipts, and client signing portals.');
      if (onSettingsUpdated) {
        onSettingsUpdated(updated);
      }
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error saving company settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="p-12 text-center text-xs text-neutral-500 font-medium animate-pulse">
        Loading company configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
            System Administration & Identity
          </div>
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-600" />
            <span>Company Branding & Document Settings</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage agency logo, business address, bank escrow details, legal terms, and policies that automatically populate on client agreements, invoices, and payment receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold px-4 py-2 rounded-lg text-xs shadow-sm hover:shadow transition-all shrink-0 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? (
            <span>Saving Changes...</span>
          ) : (
            <>
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Save Company Settings</span>
            </>
          )}
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200 bg-neutral-50/70 p-1.5 rounded-xl">
        {[
          { id: 'profile', label: 'Company Profile & Logo', icon: Building },
          { id: 'contact', label: 'Contact & Regulatory', icon: Phone },
          { id: 'bank', label: 'Bank & Wire Escrow', icon: CreditCard },
          { id: 'terms', label: 'Terms & Document Footers', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                active
                  ? 'bg-white text-neutral-900 shadow-2xs border border-neutral-200/90 font-bold'
                  : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-emerald-600' : 'text-neutral-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* TAB 1: PROFILE & LOGO */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs space-y-6">
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <span>Agency Identity & Brand Assets</span>
              </h3>

              {/* Logo Upload & Preview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-4 rounded-xl bg-neutral-50/70 border border-neutral-200">
                <div className="md:col-span-1 flex flex-col items-center justify-center p-4 border border-dashed border-neutral-300 rounded-xl bg-white text-center">
                  {settings.logoUrl ? (
                    <div className="space-y-2">
                      <div className="w-24 h-24 mx-auto relative rounded-xl border border-neutral-200 overflow-hidden flex items-center justify-center bg-white p-2">
                        <img
                          src={settings.logoUrl}
                          alt="Company Logo Preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleChange('logoUrl', '')}
                        className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                      >
                        Remove Logo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-950 text-amber-400 flex items-center justify-center font-bold text-lg shadow-sm">
                        {(settings.companyName || 'CR').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="text-[11px] text-neutral-400">Default Wordmark</div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 space-y-3">
                  <label className="block text-xs font-bold text-neutral-800">
                    Upload Official Logo
                  </label>
                  <p className="text-[11px] text-neutral-500 leading-relaxed">
                    This logo appears at the top of client invoices, formal payment receipts, and the public electronic signing portal. PNG or SVG with transparent background recommended.
                  </p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 rounded-lg cursor-pointer shadow-2xs transition-colors">
                      <Upload className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Choose Image File</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-neutral-400">Max size 2MB</span>
                  </div>
                </div>
              </div>

              {/* Company Name & Tagline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Company / Agency Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={settings.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Brand Tagline / Specialty
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Premium Umrah, Hajj & Bespoke Global Logistics"
                    value={settings.tagline || ''}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CONTACT & REGULATORY */}
        {activeTab === 'contact' && (
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <span>Contact Coordinates & Licenses</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Official Client Email *
                </label>
                <input
                  type="email"
                  required
                  value={settings.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Customer Support Phone *
                </label>
                <input
                  type="text"
                  required
                  value={settings.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  WhatsApp Business Number
                </label>
                <input
                  type="text"
                  placeholder="+44 7700 900123"
                  value={settings.whatsapp || ''}
                  onChange={(e) => handleChange('whatsapp', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Corporate Physical Address
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Website URL
                </label>
                <input
                  type="text"
                  placeholder="https://youragency.com"
                  value={settings.website || ''}
                  onChange={(e) => handleChange('website', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Tax / VAT / ATOL / IATA Registration License
                </label>
                <input
                  type="text"
                  placeholder="e.g. GB 924 8192 44 | ATOL: 11849 | IATA: 91-2 4912"
                  value={settings.taxRegistrationNumber || ''}
                  onChange={(e) => handleChange('taxRegistrationNumber', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: BANK & WIRE DETAILS */}
        {activeTab === 'bank' && (
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <span>Client Escrow Bank Account</span>
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1">
                These banking instructions appear directly on official client invoices and the payment portal for wire transfers.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  required
                  value={settings.bankName}
                  onChange={(e) => handleChange('bankName', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Account Name / Beneficiary *
                </label>
                <input
                  type="text"
                  required
                  value={settings.accountName}
                  onChange={(e) => handleChange('accountName', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  required
                  value={settings.accountNumber}
                  onChange={(e) => handleChange('accountNumber', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Sort Code (UK)
                </label>
                <input
                  type="text"
                  placeholder="20-00-00"
                  value={settings.sortCode || ''}
                  onChange={(e) => handleChange('sortCode', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  IBAN (International)
                </label>
                <input
                  type="text"
                  placeholder="GB29BARC20000040918234"
                  value={settings.iban || ''}
                  onChange={(e) => handleChange('iban', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  SWIFT / BIC Code
                </label>
                <input
                  type="text"
                  placeholder="BARCGB22"
                  value={settings.swift || ''}
                  onChange={(e) => handleChange('swift', e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: TERMS & FOOTERS */}
        {activeTab === 'terms' && (
          <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <span>Legal Agreements, Terms & Document Footers</span>
              </h3>
              <p className="text-[11px] text-neutral-500 mt-1">
                Clients must read and electronically consent to these Terms & Conditions before signing agreements.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Terms & Conditions (Presented to Client at Signing)
                </label>
                <textarea
                  rows={8}
                  value={settings.termsAndConditions}
                  onChange={(e) => handleChange('termsAndConditions', e.target.value)}
                  className="w-full bg-slate-50 border border-neutral-300 rounded-lg p-3 text-xs text-neutral-900 font-mono leading-relaxed focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Invoice Footer Disclaimer Note
                  </label>
                  <input
                    type="text"
                    value={settings.invoiceFooterNote || ''}
                    onChange={(e) => handleChange('invoiceFooterNote', e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Official Payment Receipt Note
                  </label>
                  <input
                    type="text"
                    value={settings.receiptFooterNote || ''}
                    onChange={(e) => handleChange('receiptFooterNote', e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Save Action */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold px-5 py-2.5 rounded-lg text-xs shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <span>Saving Changes...</span>
            ) : (
              <>
                <Save className="w-4 h-4 stroke-[2.5]" />
                <span>Save Company Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
