'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import TopNavbar from '@/components/TopNavbar';
import LoginPage from '@/components/LoginPage';
import AdminDashboard from '@/components/AdminDashboard';
import AgentDashboard from '@/components/AgentDashboard';
import AgentsManagement from '@/components/AgentsManagement';
import BookingsView from '@/components/BookingsView';
import ClientsView from '@/components/ClientsView';
import InvoicesPaymentsView from '@/components/InvoicesPaymentsView';
import ReportsView from '@/components/ReportsView';
import UpcomingTripsView from '@/components/UpcomingTripsView';
import OutstandingView from '@/components/OutstandingView';
import BookingModal from '@/components/BookingModal';
import InvoiceModal from '@/components/InvoiceModal';
import CreateCustomerModal from '@/components/CreateCustomerModal';
import CompanySettingsView from '@/components/CompanySettingsView';
import {
  Agent,
  Booking,
  Client,
  Invoice,
  Payment,
  SystemStats,
  AgentActivity,
  CompanySettings,
} from '@/types/crm';

export default function HomePage() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<Agent | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data states (All retrieved directly from database)
  const [availableUsers, setAvailableUsers] = useState<Agent[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [stats, setStats] = useState<SystemStats>({
    totalBookings: 0,
    totalAgents: 0,
    totalClients: 0,
    totalInvoices: 0,
    totalSales: 0,
    paymentsReceived: 0,
    outstandingBalances: 0,
    upcomingDepartures: 0,
    pendingVisas: 0,
    cancelledBookings: 0,
    totalProfit: 0,
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Modals state
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);

  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const [isCreateCustomerModalOpen, setIsCreateCustomerModalOpen] = useState(false);

  // Session verification on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const savedToken = typeof window !== 'undefined' ? localStorage.getItem('devntom_token') : null;
        const savedUserStr = typeof window !== 'undefined' ? localStorage.getItem('devntom_user') : null;

        if (savedToken) {
          const res = await fetch('/api/auth/session', {
            headers: { Authorization: `Bearer ${savedToken}` },
          });

          if (res.ok) {
            const data = await res.json();
            if (data.authenticated && data.agent) {
              setCurrentUser(data.agent);
              setSessionToken(savedToken);
              setCurrentTab(data.agent.role === 'super_admin' ? 'dashboard' : 'my-dashboard');
              return;
            }
          }
        }

        // If local user was cached but session expired/cleared
        if (savedUserStr && !savedToken) {
          localStorage.removeItem('devntom_user');
        }
      } catch (err) {
        console.warn('Session verification notice:', err);
      }
    };

    initAuth();
  }, []);

  // Primitive dependencies to prevent infinite re-render loops
  const currentUserId = currentUser?.id;
  const currentUserRole = currentUser?.role;
  const currentCompanyId = currentUser?.companyId || '';
  const teamMembersKey = currentUser?.teamMembers?.join(',') || '';

  // Fetch all CRM data from Database (scoped to logged-in user and company)
  const fetchData = useCallback(async () => {
    if (!currentUserId || !currentUserRole) return;

    setIsLoading(true);
    try {
      const queryParams = `?role=${currentUserRole}&agentId=${currentUserId}&teamMembers=${teamMembersKey}&companyId=${currentCompanyId}`;

      const [agentsRes, bookingsRes, invoicesRes, paymentsRes, clientsRes, statsRes, settingsRes] =
        await Promise.all([
          fetch(`/api/agents?companyId=${currentCompanyId}`),
          fetch(`/api/bookings${queryParams}`),
          fetch(`/api/invoices${queryParams}`),
          fetch(`/api/payments${queryParams}`),
          fetch(`/api/clients${queryParams}`),
          fetch(`/api/stats${queryParams}`),
          fetch(`/api/company/settings?companyId=${currentCompanyId || 'comp_default'}`),
        ]);

      if (agentsRes.ok) {
        const agts = await agentsRes.json();
        setAvailableUsers(agts);
      }

      if (bookingsRes.ok) {
        const bks = await bookingsRes.json();
        setBookings(bks);
      }

      if (invoicesRes.ok) {
        const invs = await invoicesRes.json();
        setInvoices(invs);
      }

      if (paymentsRes.ok) {
        const pays = await paymentsRes.json();
        setPayments(pays);
      }

      if (clientsRes.ok) {
        const cls = await clientsRes.json();
        setClients(cls);
      }

      if (statsRes.ok) {
        const st = await statsRes.json();
        setStats(st.stats);
        setActivities(st.activities || []);
      }

      if (settingsRes.ok) {
        const sett = await settingsRes.json();
        setCompanySettings(sett);
      }
    } catch (err) {
      console.error('Failed to fetch CRM data from database:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, currentUserRole, teamMembersKey, currentCompanyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Login Handler
  const handleLoginSuccess = (agent: Agent, token: string) => {
    setCurrentUser(agent);
    setSessionToken(token);
    setCurrentTab(agent.role === 'super_admin' ? 'dashboard' : 'my-dashboard');
  };

  // Logout Handler (Destroys database session and returns to login page)
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {},
      });
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('devntom_token');
        localStorage.removeItem('devntom_user');
      }
      setCurrentUser(null);
      setSessionToken(null);
      setBookings([]);
      setInvoices([]);
      setPayments([]);
      setClients([]);
    }
  };

  // Actions: Booking (Database API)
  const handleOpenCreateBooking = () => {
    setEditingBooking(null);
    setIsBookingModalOpen(true);
  };

  const handleOpenEditBooking = (b: Booking) => {
    setEditingBooking(b);
    setIsBookingModalOpen(true);
  };

  const handleSaveBooking = async (bookingData: any, generateInvoice: boolean) => {
    try {
      if (bookingData.id) {
        // Update in database
        const res = await fetch('/api/bookings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingData),
        });
        if (res.ok) {
          const updated = await res.json();
          if (generateInvoice) {
            handleOpenInvoiceForBooking(updated);
          }
        }
      } else {
        // Create in database
        const res = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...bookingData,
            companyId: currentUser?.companyId,
            companyName: currentUser?.companyName,
          }),
        });
        if (res.ok) {
          const createdResult = await res.json();
          if (generateInvoice && createdResult.booking) {
            handleOpenInvoiceForBooking(createdResult.booking, createdResult.invoice);
          }
        }
      }
      await fetchData();
    } catch (e) {
      console.error('Error saving booking in database:', e);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error('Error deleting booking from database:', e);
    }
  };

  // Actions: Invoices
  const handleOpenInvoiceForBooking = (b: Booking, inv?: Invoice) => {
    setSelectedInvoiceBooking(b);
    if (inv) {
      setSelectedInvoice(inv);
    } else {
      const matchingInv = invoices.find((i) => i.bookingId === b.id || i.bookingRef === b.bookingRef);
      setSelectedInvoice(matchingInv || null);
    }
    setIsInvoiceModalOpen(true);
  };

  const handleOpenInvoiceModalDirect = (inv: Invoice) => {
    setSelectedInvoice(inv);
    const matchingBk = bookings.find((b) => b.id === inv.bookingId || b.bookingRef === inv.bookingRef);
    setSelectedInvoiceBooking(matchingBk || null);
    setIsInvoiceModalOpen(true);
  };

  // Actions: Payments (Saved directly to database)
  const handleRecordPayment = async (paymentData: any) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentData,
          companyId: currentUser?.companyId,
        }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error('Error recording payment in database:', e);
    }
  };

  // Actions: Agent Management (Saved directly to database)
  const handleCreateAgent = async (agentData: any) => {
    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...agentData,
          companyId: currentUser?.companyId,
          companyName: currentUser?.companyName,
        }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error('Error creating agent in database:', e);
    }
  };

  const handleUpdateAgent = async (id: string, updates: Partial<Agent>) => {
    try {
      const res = await fetch('/api/agents', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error('Error updating agent in database:', e);
    }
  };

  const handleDeleteAgent = async (id: string) => {
    try {
      const res = await fetch(`/api/agents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
      }
    } catch (e) {
      console.error('Error deleting agent from database:', e);
    }
  };

  // Render Login Screen if not logged in
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 4. Render Authenticated CRM Views
  const renderTabContent = () => {
    switch (currentTab) {
      // Super Admin Portal Tabs
      case 'dashboard':
        return (
          <AdminDashboard
            stats={stats}
            bookings={bookings}
            agents={availableUsers}
            activities={activities}
            currentUser={currentUser}
            onNavigateTab={setCurrentTab}
            onOpenBooking={handleOpenEditBooking}
            onOpenCreateBooking={handleOpenCreateBooking}
          />
        );

      case 'agents':
        return (
          <AgentsManagement
            agents={availableUsers}
            bookings={bookings}
            invoices={invoices}
            payments={payments}
            activities={activities}
            onCreateAgent={handleCreateAgent}
            onUpdateAgent={handleUpdateAgent}
            onDeleteAgent={handleDeleteAgent}
            onOpenBooking={handleOpenEditBooking}
            onOpenInvoice={handleOpenInvoiceForBooking}
          />
        );

      case 'bookings':
        return (
          <BookingsView
            bookings={bookings}
            agents={availableUsers}
            currentUser={currentUser}
            onOpenCreateBooking={handleOpenCreateBooking}
            onOpenBooking={handleOpenEditBooking}
            onDeleteBooking={handleDeleteBooking}
            onOpenInvoice={handleOpenInvoiceForBooking}
            onOpenRecordPayment={(b) => {
              const inv = invoices.find((i) => i.bookingId === b.id || i.bookingRef === b.bookingRef);
              if (inv) handleOpenInvoiceModalDirect(inv);
            }}
            title="All Master Bookings (Super Admin)"
            isAgentScoped={false}
          />
        );

      case 'clients':
        return (
          <ClientsView
            clients={clients}
            agents={availableUsers}
            bookings={bookings}
            currentUser={currentUser}
          />
        );

      case 'invoices':
        return (
          <InvoicesPaymentsView
            invoices={invoices}
            payments={payments}
            bookings={bookings}
            currentUser={currentUser}
            onRecordPayment={handleRecordPayment}
            onOpenInvoiceModal={handleOpenInvoiceModalDirect}
            companySettings={companySettings}
          />
        );

      case 'reports':
        return (
          <ReportsView
            bookings={bookings}
            agents={availableUsers}
            currentUser={currentUser}
          />
        );

      case 'company-settings':
        return (
          <CompanySettingsView
            currentUser={currentUser}
            onSettingsUpdated={(updated) => setCompanySettings(updated)}
          />
        );

      // Agent & Manager Portal Tabs
      case 'my-dashboard':
        return (
          <AgentDashboard
            currentUser={currentUser}
            bookings={bookings}
            onOpenCreateBooking={handleOpenCreateBooking}
            onOpenBooking={handleOpenEditBooking}
            onNavigateTab={setCurrentTab}
            onOpenInvoice={handleOpenInvoiceForBooking}
          />
        );

      case 'my-bookings':
        return (
          <BookingsView
            bookings={bookings}
            agents={availableUsers}
            currentUser={currentUser}
            onOpenCreateBooking={handleOpenCreateBooking}
            onOpenBooking={handleOpenEditBooking}
            onDeleteBooking={handleDeleteBooking}
            onOpenInvoice={handleOpenInvoiceForBooking}
            onOpenRecordPayment={(b) => {
              const inv = invoices.find((i) => i.bookingId === b.id || i.bookingRef === b.bookingRef);
              if (inv) handleOpenInvoiceModalDirect(inv);
            }}
            title={currentUser.role === 'senior_agent' ? 'Team Bookings' : 'My Bookings'}
            isAgentScoped={true}
          />
        );

      case 'my-clients':
        return (
          <ClientsView
            clients={clients}
            agents={availableUsers}
            bookings={bookings}
            currentUser={currentUser}
          />
        );

      case 'my-invoices':
        return (
          <InvoicesPaymentsView
            invoices={invoices}
            payments={payments}
            bookings={bookings}
            currentUser={currentUser}
            onRecordPayment={handleRecordPayment}
            onOpenInvoiceModal={handleOpenInvoiceModalDirect}
            activeSubTab="invoices"
            companySettings={companySettings}
          />
        );

      case 'my-payments':
        return (
          <InvoicesPaymentsView
            invoices={invoices}
            payments={payments}
            bookings={bookings}
            currentUser={currentUser}
            onRecordPayment={handleRecordPayment}
            onOpenInvoiceModal={handleOpenInvoiceModalDirect}
            activeSubTab="payments"
            companySettings={companySettings}
          />
        );

      case 'upcoming-trips':
        return (
          <UpcomingTripsView
            bookings={bookings}
            currentUser={currentUser}
            onOpenBooking={handleOpenEditBooking}
            onOpenInvoice={handleOpenInvoiceForBooking}
          />
        );

      case 'outstanding-payments':
        return (
          <OutstandingView
            bookings={bookings}
            currentUser={currentUser}
            onOpenRecordPayment={(b) => {
              const inv = invoices.find((i) => i.bookingId === b.id || i.bookingRef === b.bookingRef);
              if (inv) handleOpenInvoiceModalDirect(inv);
            }}
            onOpenBooking={handleOpenEditBooking}
            onOpenInvoice={handleOpenInvoiceForBooking}
          />
        );

      default:
        return (
          <AdminDashboard
            stats={stats}
            bookings={bookings}
            agents={availableUsers}
            activities={activities}
            onNavigateTab={setCurrentTab}
            onOpenBooking={handleOpenEditBooking}
            onOpenCreateBooking={handleOpenCreateBooking}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans text-neutral-900">
      {/* Role-Based Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        stats={{
          totalBookings: stats.totalBookings,
          outstandingBalances: stats.outstandingBalances,
          upcomingDepartures: stats.upcomingDepartures,
          pendingVisas: stats.pendingVisas,
        }}
        companySettings={companySettings}
      />

      {/* Main View Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Navigation Bar */}
        <TopNavbar
          currentTab={currentTab}
          currentUser={currentUser}
          onOpenCreateBooking={handleOpenCreateBooking}
          onOpenCreateCustomer={() => setIsCreateCustomerModalOpen(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onRefreshData={fetchData}
          isLoading={isLoading}
          onLogout={handleLogout}
        />

        {/* Scrollable Workspace */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="max-w-7xl mx-auto">{renderTabContent()}</div>
        </main>

        {/* Developed by Devntom Solutions Footer */}
        <footer className="py-2.5 px-6 text-center text-xs text-neutral-400 border-t border-neutral-200/80 bg-white/70 shrink-0">
          Developed by Devntom Solutions
        </footer>
      </div>

      {/* Booking Record Modal (Create / Edit) */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        booking={editingBooking}
        currentUser={currentUser}
        onSaveBooking={handleSaveBooking}
        availableClients={clients}
        onOpenAddCustomer={() => setIsCreateCustomerModalOpen(true)}
      />

      {/* Client-Facing Invoice Modal (Hides internal costs/margin) */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        booking={selectedInvoiceBooking}
        invoice={selectedInvoice}
        companySettings={companySettings}
        onRecordPaymentClick={(b) => {
          setIsInvoiceModalOpen(false);
          const inv = invoices.find((i) => i.bookingId === b.id || i.bookingRef === b.bookingRef);
          if (inv) handleOpenInvoiceModalDirect(inv);
        }}
      />

      {/* Quick Customer Profile Creation Modal */}
      <CreateCustomerModal
        isOpen={isCreateCustomerModalOpen}
        onClose={() => setIsCreateCustomerModalOpen(false)}
        currentUser={currentUser}
        onClientCreated={(newClient) => {
          setClients((prev) => [newClient, ...prev]);
          fetchData();
        }}
      />
    </div>
  );
}
