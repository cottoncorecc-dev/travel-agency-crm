'use client';

import React, { useState } from 'react';
import {
  Plus,
  Search,
  Shield,
  User,
  UserPlus,
  Calendar,
  RefreshCw,
  LogOut,
  Database,
  CheckCircle,
} from 'lucide-react';
import { Agent } from '@/types/crm';

interface TopNavbarProps {
  currentTab: string;
  currentUser: Agent;
  onOpenCreateBooking: () => void;
  onOpenCreateCustomer?: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onRefreshData?: () => void;
  isLoading?: boolean;
  onLogout: () => void;
}

export default function TopNavbar({
  currentTab,
  currentUser,
  onOpenCreateBooking,
  onOpenCreateCustomer,
  searchQuery,
  setSearchQuery,
  onRefreshData,
  isLoading,
  onLogout,
}: TopNavbarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Executive Overview';
      case 'clients':
        return 'Client Portfolio';
      case 'bookings':
        return 'Master Bookings Register';
      case 'invoices':
        return 'Invoices & Financial Billing';
      case 'payments':
        return 'Payments Ledger & Receipts';
      case 'reports':
        return 'Agent Performance Analytics';
      case 'agents':
        return 'Agent & Role Management';
      case 'company-settings':
        return 'Company Settings & Legal Branding';
      case 'profile-settings':
        return 'Profile & Account Security';
      case 'my-dashboard':
        return 'Agent Workspace';
      case 'my-clients':
        return 'My Client Accounts';
      case 'my-bookings':
        return 'My Assigned Bookings';
      case 'my-invoices':
        return 'My Invoices';
      case 'my-payments':
        return 'Recorded Payments';
      case 'upcoming-trips':
        return 'Upcoming Trip Departures';
      case 'outstanding-payments':
        return 'Pending Receivables';
      default:
        return 'Workspace';
    }
  };

  const todayStr = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-neutral-200/80 px-6 flex items-center justify-between z-20 shrink-0 shadow-2xs">
      {/* Left: Breadcrumbs & View Title */}
      <div className="flex items-center gap-3">
        <div>
          <div className="text-[10px] font-bold text-neutral-400 tracking-wider uppercase">
            {currentUser.role === 'super_admin'
              ? 'Super Admin Portal'
              : currentUser.role === 'senior_agent'
              ? 'Manager / Senior Portal'
              : 'Agent Workspace'}
          </div>
          <h1 className="text-base font-bold text-neutral-900 tracking-tight leading-tight">
            {getTabTitle(currentTab)}
          </h1>
        </div>
      </div>

      {/* Middle: Live Search Bar */}
      <div className="flex-1 max-w-md mx-6">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search bookings, client name, passport, destination..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-neutral-200 rounded-lg pl-9 pr-4 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[10px] text-neutral-500 hover:text-neutral-800 bg-neutral-200/80 px-1.5 py-0.5 rounded cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right: Date, Refresh & Primary CTA */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-neutral-500 font-medium px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-neutral-50/60">
          <Calendar className="w-3.5 h-3.5 text-neutral-400" />
          <span>{todayStr}</span>
        </div>

        {onRefreshData && (
          <button
            onClick={onRefreshData}
            disabled={isLoading}
            title="Refresh CRM records"
            className="p-2 text-neutral-600 hover:text-neutral-900 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        )}

        {onOpenCreateCustomer && (
          <button
            onClick={onOpenCreateCustomer}
            className="flex items-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-semibold px-3 py-2 rounded-lg text-xs border border-neutral-300 transition-all cursor-pointer shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5 text-neutral-600" />
            <span className="hidden sm:inline">Add Customer</span>
            <span className="sm:hidden">Customer</span>
          </button>
        )}

        {/* Primary CTA in Bright Green & Black */}
        <button
          onClick={onOpenCreateBooking}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold px-3.5 py-2 rounded-lg text-xs tracking-wide shadow-sm hover:shadow transition-all active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Booking</span>
        </button>

        {/* User Profile / Logout Dropdown */}
        <div className="relative ml-1">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center font-bold text-xs text-amber-400 hover:ring-2 hover:ring-emerald-400 transition-all cursor-pointer shadow-xs"
          >
            {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
          </button>

          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 rounded-xl shadow-xl p-2 z-50 text-xs animate-in fade-in">
              <div className="px-3 py-2 border-b border-neutral-100">
                <div className="font-bold text-neutral-900 truncate">{currentUser.name}</div>
                <div className="text-[11px] text-neutral-500 truncate font-mono">@{currentUser.username}</div>
                <div className="text-[10px] text-amber-700 mt-1 uppercase font-bold">
                  {currentUser.role.replace('_', ' ')}
                </div>
              </div>

              <div className="pt-1">
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left cursor-pointer font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
