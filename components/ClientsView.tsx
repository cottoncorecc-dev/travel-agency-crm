'use client';

import React, { useState } from 'react';
import { UserCheck, Search, Phone, Mail, MessageSquare, Calendar, CreditCard } from 'lucide-react';
import { Client, Agent, Booking } from '@/types/crm';
import { formatCount, formatCurrency } from '@/lib/utils';

interface ClientsViewProps {
  clients: Client[];
  agents: Agent[];
  bookings: Booking[];
  currentUser: Agent;
  onOpenBookingByRef?: (ref: string) => void;
}

export default function ClientsView({
  clients = [],
  agents = [],
  bookings = [],
  currentUser,
}: ClientsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('all');

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isManager = currentUser.role === 'senior_agent';

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      (c.name || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.passportNumber || '').toLowerCase().includes(q);

    const matchAgent = selectedAgent === 'all' || c.assignedAgentId === selectedAgent;

    return matchSearch && matchAgent;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-600" />
          <span>Client Portfolio & Traveler Accounts</span>
        </h2>
        <p className="text-xs text-neutral-500">
          Client booking records, passport profiles, and payment ledger across all travel agents.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search clients by name, phone, email, or passport..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-neutral-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
          />
        </div>

        {(isSuperAdmin || isManager) && (
          <div className="w-full md:w-auto">
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full bg-slate-50 border border-neutral-200 rounded-lg px-3 py-1.5 text-xs text-neutral-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-2xs"
            >
              <option value="all">All Assigned Agents</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.username})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Clients Table */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50/70 text-[10px] text-neutral-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Contact Details</th>
                <th className="py-3 px-4">Passport / Nationality</th>
                {(isSuperAdmin || isManager) && <th className="py-3 px-4">Assigned Agent</th>}
                <th className="py-3 px-4 text-right">Bookings</th>
                <th className="py-3 px-4 text-right">Total Spent</th>
                <th className="py-3 px-4 text-right">Outstanding</th>
                <th className="py-3 px-4 text-right">Quick Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 font-medium text-neutral-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-neutral-400">
                    No client records found in database.
                  </td>
                </tr>
              ) : (
                filtered.map((client) => (
                  <tr key={client.id} className="hover:bg-neutral-50/60 transition-colors">
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-neutral-900">{client.name}</div>
                      <div className="text-[10px] text-neutral-400">
                        Client since {new Date(client.createdAt).toLocaleDateString()}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="text-neutral-900">{client.phone}</div>
                      <div className="text-neutral-500">{client.email}</div>
                    </td>

                    {/* Passport */}
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-neutral-800">{client.passportNumber || '—'}</div>
                      <div className="text-[10px] text-neutral-400">{client.nationality}</div>
                    </td>

                    {/* Agent */}
                    {(isSuperAdmin || isManager) && (
                      <td className="py-3.5 px-4">
                        <div className="text-neutral-900 font-medium">{client.assignedAgentName}</div>
                      </td>
                    )}

                    {/* Bookings Count */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-800 font-bold">
                      {formatCount(client.totalBookings)}
                    </td>

                    {/* Total Spent */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-neutral-900">
                      {formatCurrency(client.totalSpent)}
                    </td>

                    {/* Outstanding */}
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums">
                      {(client.outstandingBalance ?? 0) > 0 ? (
                        <span className="text-rose-600 font-bold">
                          {formatCurrency(client.outstandingBalance)}
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          £00
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {client.whatsapp && (
                          <a
                            href={`https://wa.me/${client.whatsapp.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            title="Chat on WhatsApp"
                            className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {client.phone && (
                          <a
                            href={`tel:${client.phone}`}
                            title="Call Phone"
                            className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-200 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
