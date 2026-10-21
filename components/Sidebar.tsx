'use client';

import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  UserCheck,
  Receipt,
  BarChart3,
  PlaneTakeoff,
  CreditCard,
  ShieldCheck,
  LogOut,
  Database,
  Building,
} from 'lucide-react';
import { Agent, UserRole, CompanySettings } from '@/types/crm';
import { formatCount } from '@/lib/utils';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: Agent;
  onLogout: () => void;
  stats?: {
    totalBookings: number;
    totalClients?: number;
    outstandingBalances: number;
    upcomingDepartures: number;
    pendingVisas: number;
  };
  companySettings?: CompanySettings | null;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  currentUser,
  onLogout,
  stats,
  companySettings,
}: SidebarProps) {
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isManager = currentUser.role === 'senior_agent';

  // Navigation Items exactly ordered: dashboard, clients, bookings, invoices, payments, reports, agents, company settings, profile settings
  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'clients', label: 'Clients', icon: UserCheck, badge: null },
    { id: 'bookings', label: 'Bookings', icon: CalendarCheck, badge: formatCount(stats?.totalBookings) },
    { id: 'invoices', label: 'Invoices', icon: Receipt, badge: stats?.outstandingBalances ? '£' : null },
    { id: 'payments', label: 'Payments', icon: CreditCard, badge: null },
    { id: 'reports', label: 'Reports', icon: BarChart3, badge: null },
    { id: 'agents', label: 'Agents', icon: Users, badge: null },
    { id: 'company-settings', label: 'Company Settings', icon: Building, badge: null },
    { id: 'profile-settings', label: 'Profile Settings', icon: ShieldCheck, badge: null },
  ];

  const agentNav = [
    { id: 'my-dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'my-clients', label: 'Clients', icon: UserCheck, badge: null },
    { id: 'my-bookings', label: 'Bookings', icon: CalendarCheck, badge: formatCount(stats?.totalBookings) },
    { id: 'my-invoices', label: 'Invoices', icon: Receipt, badge: null },
    { id: 'my-payments', label: 'Payments', icon: CreditCard, badge: null },
    { id: 'upcoming-trips', label: 'Upcoming Trips', icon: PlaneTakeoff, badge: formatCount(stats?.upcomingDepartures) },
    { id: 'outstanding-payments', label: 'Outstanding Balances', icon: Receipt, badge: stats?.outstandingBalances ? 'Alert' : null },
    { id: 'profile-settings', label: 'Profile Settings', icon: ShieldCheck, badge: null },
  ];

  const navItems = isSuperAdmin ? adminNav : agentNav;

  const roleLabel =
    currentUser.role === 'super_admin'
      ? 'Super Admin'
      : currentUser.role === 'senior_agent'
      ? 'Manager / Senior Agent'
      : 'Agent';

  const companyDisplayName = companySettings?.companyName || currentUser.companyName || 'Enterprise CRM';
  const companyLogo = companySettings?.logoUrl;

  return (
    <aside className="w-68 bg-white border-r border-neutral-200/90 flex flex-col shrink-0 select-none text-neutral-700 shadow-xs">
      {/* Brand Header */}
      <div className="h-16 border-b border-neutral-100 flex items-center justify-between px-5 bg-white">
        <div className="flex items-center gap-3 overflow-hidden">
          {companyLogo ? (
            <div className="w-9 h-9 rounded-xl border border-neutral-200 overflow-hidden flex items-center justify-center bg-white p-0.5 shrink-0">
              <img
                src={companyLogo}
                alt={companyDisplayName}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-xl bg-neutral-950 flex items-center justify-center font-bold text-sm tracking-wider shadow-sm border border-neutral-800 shrink-0">
              <span className="text-amber-400">
                {companyDisplayName.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div className="overflow-hidden">
            <div className="font-bold text-neutral-900 text-sm tracking-tight leading-none truncate">
              {companyDisplayName}
            </div>
            <div className="text-[11px] text-amber-700 font-medium tracking-wide mt-1 truncate">
              {companySettings?.tagline || 'Travel & Umrah CRM'}
            </div>
          </div>
        </div>
      </div>

      {/* Authenticated User Session Card */}
      <div className="p-3.5 bg-neutral-50/80 border-b border-neutral-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-neutral-900 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0 shadow-xs">
              {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-neutral-900 truncate">{currentUser.name}</div>
              <div className="text-[10px] text-amber-700 font-mono truncate">@{currentUser.username}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Log Out of CRM"
            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[10px]">
          <span className="px-2 py-0.5 rounded-full bg-white text-neutral-800 font-semibold border border-neutral-200 shadow-2xs">
            {roleLabel}
          </span>
          <span className="text-[10px] font-mono text-neutral-400">
            Workspace Active
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-3 mb-2">
          {isSuperAdmin ? 'Admin Portal' : isManager ? 'Team Manager Portal' : 'Agent Portal'}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-300/80 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-950 hover:bg-neutral-100/70'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isActive ? 'text-emerald-600' : 'text-neutral-400'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== null && item.badge !== undefined && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer with logout action & credits */}
      <div className="p-3.5 border-t border-neutral-100 bg-white space-y-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-neutral-700 hover:text-rose-700 bg-neutral-100 hover:bg-rose-50 border border-neutral-200 hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>

        <div className="text-[10px] text-neutral-400 font-medium text-center pt-1">
          Developed by Devntom Solutions
        </div>
      </div>
    </aside>
  );
}
