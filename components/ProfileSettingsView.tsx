'use client';

import React, { useState } from 'react';
import {
  User,
  Shield,
  Phone,
  Mail,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Building,
} from 'lucide-react';
import { Agent } from '@/types/crm';

interface ProfileSettingsViewProps {
  currentUser: Agent;
  onProfileUpdated?: (agent: Agent) => void;
}

export default function ProfileSettingsView({
  currentUser,
  onProfileUpdated,
}: ProfileSettingsViewProps) {
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser.id,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password: newPassword || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      setSuccessMsg('Your profile credentials and contact information have been updated.');
      setNewPassword('');
      setConfirmPassword('');
      if (onProfileUpdated) {
        onProfileUpdated(data);
      }
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating profile.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <div className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
          Account & Security
        </div>
        <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          <span>Super Admin & User Profile Settings</span>
        </h2>
        <p className="text-xs text-neutral-500 mt-0.5">
          Manage your personal account credentials, assigned company permissions, and security password.
        </p>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Account Overview Card */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-neutral-950 text-amber-400 flex items-center justify-center font-bold text-xl shadow-xs">
              {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-950">{currentUser.name}</h3>
              <div className="text-xs text-neutral-500 font-mono">@{currentUser.username}</div>
              <div className="flex items-center gap-2 mt-1.5 text-[11px]">
                <span className="px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {currentUser.role === 'super_admin' ? 'Super Administrator' : currentUser.role.replace('_', ' ')}
                </span>
                <span className="text-neutral-400">·</span>
                <span className="text-neutral-600 font-medium">
                  {currentUser.companyName || 'Enterprise Travel CRM'}
                </span>
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-neutral-500 font-mono">
            <div>User ID: <strong>{currentUser.id}</strong></div>
            <div className="text-[11px] text-neutral-400 mt-0.5">
              Member since {new Date(currentUser.createdAt).toLocaleDateString('en-GB')}
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
              Profile Contact Information
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Agent ID / Username (Immutable)
                </label>
                <input
                  type="text"
                  readOnly
                  disabled
                  value={currentUser.username}
                  className="w-full bg-neutral-100 border border-neutral-200 rounded-lg px-3 py-2 text-xs text-neutral-600 font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Official Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Contact Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Password Security */}
          <div className="space-y-4 pt-6 border-t border-neutral-100">
            <div>
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-neutral-600" />
                <span>Change Account Password</span>
              </h4>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Leave blank if you do not wish to update your login password.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-end pt-4 border-t border-neutral-100">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold px-4 py-2 rounded-lg text-xs shadow-sm hover:shadow transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <span>Updating Profile...</span>
              ) : (
                <>
                  <Save className="w-4 h-4 stroke-[2.5]" />
                  <span>Update Profile Settings</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
