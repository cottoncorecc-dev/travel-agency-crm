'use client';

import React, { useState } from 'react';
import {
  UserCheck,
  Search,
  Phone,
  Mail,
  MessageSquare,
  UserPlus,
  Hash,
  Sparkles,
} from 'lucide-react';
import { Client, Agent, Booking } from '@/types/crm';
import { formatCount, formatCurrency } from '@/lib/utils';
import CreateCustomerModal from '@/components/CreateCustomerModal';

interface ClientsViewProps {
  clients: Client[];
  agents: Agent[];
  bookings?: Booking[];
  currentUser: Agent;
  onOpenBookingByRef?: (ref: string) => void;
  onOpenCreateCustomer?: () => void;
  onClientCreated?: (client: Client) => void;
}

export default function ClientsView({
  clients = [],
  agents = [],
  currentUser,
  onOpenCreateCustomer,
  onClientCreated,
}: ClientsViewProps) {
  const [search, setSearch] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [isInternalCreateOpen, setIsInternalCreateOpen] = useState(false);

  const isSuperAdmin = currentUser.role === 'super_admin';
  const isManager = currentUser.role === 'senior_agent';

  const handleOpenModal = () => {
    if (onOpenCreateCustomer) {
      onOpenCreateCustomer();
    } else {
      setIsInternalCreateOpen(true);
    }
  };

  const handleCreated = (newClient: Client) => {
    if (onClientCreated) {
      onClientCreated(newClient);
    }
    setIsInternalCreateOpen(false);
  };

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      (c.name || '').toLowerCase().includes(q) ||
      (c.profileNumber || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.passportNumber || '').toLowerCase().includes(q);

    const matchAgent = selectedAgent === 'all' || c.assignedAgentId === selectedAgent;

    return matchSearch && matchAgent;
  });

  return (
    <div className="space-y-5 pb-12">
      {/* Header with Title and Create Customer Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>Client Portfolio & Traveler Accounts</span>
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Client profiles, unique account reference numbers, passport records, and transaction ledgers.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Create Customer</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-neutral-200/90 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3 shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search clients by profile #, name, phone, email, or passport..."
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
                <th className="py-3 px-4">Profile #</th>
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
                  <td colSpan={9} className="py-12 text-center text-neutral-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-400 mx-auto flex items-center justify-center">
                        <UserCheck className="w-5 h-5" />
                      </div>
                      <p className="text-xs text-neutral-500">
                        {search ? 'No clients match your search query.' : 'No customer records found in the database.'}
                      </p>
                      <button
                        type="button"
                        onClick={handleOpenModal}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Add Customer Profile</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((client) => {
                  const displayProfileNo =
                    client.profileNumber || `PRF-${client.id.replace(/^cl_/, '').slice(0, 5).toUpperCase()}`;

                  return (
                    <tr key={client.id} className="hover:bg-neutral-50/60 transition-colors">
                      {/* Profile Number */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-md border border-emerald-200/90 shadow-2xs">
                          <Hash className="w-3 h-3 text-emerald-600 shrink-0" />
                          {displayProfileNo}
                        </span>
                      </td>

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
                        <div className="text-neutral-500">{client.email || '—'}</div>
                      </td>

                      {/* Passport */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-neutral-800">{client.passportNumber || '—'}</div>
                        <div className="text-[10px] text-neutral-400">{client.nationality || 'British'}</div>
                      </td>

                      {/* Agent */}
                      {(isSuperAdmin || isManager) && (
                        <td className="py-3.5 px-4">
                          <div className="text-neutral-900 font-medium">{client.assignedAgentName || 'Unassigned'}</div>
                        </td>
                      )}

                      {/* Bookings Count */}
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-neutral-800 font-bold">
                        {formatCount(client.totalBookings || 0)}
                      </td>

                      {/* Total Spent */}
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold text-neutral-900">
                        {formatCurrency(client.totalSpent || 0)}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Internal Create Customer Modal (Fallback if triggered directly) */}
      {isInternalCreateOpen && (
        <CreateCustomerModal
          isOpen={isInternalCreateOpen}
          onClose={() => setIsInternalCreateOpen(false)}
          onClientCreated={handleCreated}
          currentUser={currentUser}
        />
      )}
    </div>
  );
}
