export type UserRole = 'owner' | 'super_admin' | 'senior_agent' | 'agent';

export interface Company {
  id: string;
  name: string;
  superAdminId: string;
  superAdminName: string;
  superAdminUsername: string;
  superAdminEmail: string;
  superAdminPhone: string;
  status: 'pending_approval' | 'approved' | 'rejected' | 'suspended';
  createdAt: string;
  approvedAt?: string;
  notes?: string;
}

export interface OtpRecord {
  id: string;
  identifier: string; // email or username
  code: string;
  expiresAt: number;
  createdAt: string;
}

export interface AgentPermissions {
  canEditBookings: boolean;
  canDeleteBookings: boolean;
  canViewCosting: boolean;
  canRecordPayments: boolean;
  canExportReports: boolean;
}

export interface Agent {
  id: string;
  companyId?: string;
  companyName?: string;
  name: string;
  username: string; // Agent ID / Username
  email: string;
  phone: string;
  password?: string;
  status: 'active' | 'inactive' | 'pending_approval' | 'rejected';
  role: UserRole;
  teamMembers?: string[]; // Agent IDs managed by Senior Agent
  permissions: AgentPermissions;
  avatar?: string;
  createdAt: string;
  lastActive: string;
}

export type PassengerCategory = 'Adult' | 'Youth' | 'Child' | 'Infant';

export interface Passenger {
  id: string;
  name: string;
  passportNo: string;
  category: PassengerCategory;
}

export interface HotelDetail {
  id: string;
  city: string;
  hotelName: string;
  rooms: number;
  roomType: string;
  meals: string;
  checkIn: string;
  checkOut: string;
  nights: number;
}

export interface FlightDetails {
  textOrRoute: string;
  airline: string;
  pnr: string;
  departureDate: string;
  returnDate: string;
  luggageDetails: string; // agent use
  handCarry: string; // agent use
  attachmentName?: string;
}

export interface VisaDetails {
  count: number;
  visaType: string;
  nationality: string;
  status: 'Pending' | 'Issued' | 'Under Review' | 'Rejected';
}

export interface TransportLeg {
  id: string;
  pickUp: string;
  dropOff: string;
  dateTime: string;
  vehicleType: string;
  otherDetails: string;
}

export interface PaxPriceBreakdown {
  adultPax: number;
  adultPrice: number;
  adultCost: number;
  youthPax: number;
  youthPrice: number;
  youthCost: number;
  childPax: number;
  childPrice: number;
  childCost: number;
  infantPax: number;
  infantPrice: number;
  infantCost: number;
  totalSelling: number;
  totalCost: number;
}

export interface PackageCosting {
  flights: PaxPriceBreakdown;
  visas: PaxPriceBreakdown;
  makkahHotel: PaxPriceBreakdown;
  madinahHotel: PaxPriceBreakdown;
  otherHotel: PaxPriceBreakdown;
  transport: PaxPriceBreakdown;
  otherServices: PaxPriceBreakdown;
  totalSellingCost: number;
  totalPurchasingCost: number;
  profitMargin: number;
  profitMarginPercent: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

export type BookingStatus = 'Confirmed' | 'Pending' | 'Departed' | 'Completed' | 'Cancelled';
export type PaymentStatus = 'Paid' | 'Partial' | 'Unpaid';

export interface Booking {
  id: string;
  companyId?: string;
  companyName?: string;
  bookingRef: string;
  profileNumber: string; // e.g. PRF-2026-089
  amtNo: string; // e.g. AMT-7842
  agentId: string;
  agentName: string;
  customerName: string; // Lead Passenger
  contactNumber: string;
  whatsapp: string;
  email: string;
  passportInfo: string;
  paxCount: number;
  destination: string;
  departureDate: string;
  returnDate: string;
  passengers: Passenger[];
  flight: FlightDetails;
  hotels: HotelDetail[];
  visa: VisaDetails;
  transport: TransportLeg[];
  otherServicesText?: string;
  costing: PackageCosting;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  invoiceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanySettings {
  id?: string;
  companyId: string;
  companyName: string;
  tagline?: string;
  logoUrl?: string;
  email: string;
  phone: string;
  whatsapp?: string;
  address: string;
  website?: string;
  taxRegistrationNumber?: string; // VAT / ATOL / IATA Registration
  bankName: string;
  accountName: string;
  accountNumber: string;
  sortCode?: string;
  iban?: string;
  swift?: string;
  termsAndConditions: string;
  invoiceFooterNote?: string;
  receiptFooterNote?: string;
  updatedAt?: string;
}

export type InvoiceProgressStatus = 'Draft' | 'Sent for Signing' | 'Signed & Confirmed' | 'Partially Paid' | 'Paid';

export interface InvoiceSignature {
  signed: boolean;
  signerName?: string;
  signerEmail?: string;
  signedAt?: string;
  agreedToTerms?: boolean;
  signatureType?: 'drawn' | 'typed';
  signatureData?: string;
  ipAddress?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban: string;
  swift: string;
}

export interface Invoice {
  id: string;
  companyId?: string;
  companyName?: string;
  invoiceRef: string;
  bookingId: string;
  bookingRef: string;
  agentId: string;
  agentName: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'Paid' | 'Partial' | 'Unpaid' | 'Overdue';
  progressStatus?: InvoiceProgressStatus;
  signingToken?: string;
  signature?: InvoiceSignature;
  items: InvoiceItem[];
  notes?: string;
  bankDetails: BankDetails;
  createdAt: string;
}

export interface Payment {
  id: string;
  companyId?: string;

  paymentRef: string;
  invoiceId: string;
  bookingId: string;
  bookingRef: string;
  agentId: string;
  agentName: string;
  clientName: string;
  amount: number;
  method: 'Bank Transfer' | 'Credit Card' | 'Cash' | 'Cheque';
  transactionRef: string;
  date: string;
  receiptNotes?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  companyId?: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  passportNumber: string;
  nationality: string;
  assignedAgentId: string;
  assignedAgentName: string;
  totalBookings: number;
  totalSpent: number;
  outstandingBalance: number;
  lastBookingDate: string;
  createdAt: string;
}

export interface AgentActivity {
  id: string;
  companyId?: string;
  agentId: string;
  agentName: string;
  action: string;
  entityType: 'booking' | 'invoice' | 'payment' | 'client';
  entityRef: string;
  details: string;
  timestamp: string;
}

export interface SystemStats {
  totalBookings: number;
  totalAgents: number;
  totalClients: number;
  totalInvoices: number;
  totalSales: number;
  paymentsReceived: number;
  outstandingBalances: number;
  upcomingDepartures: number;
  pendingVisas: number;
  cancelledBookings: number;
  totalProfit: number;
}

export interface UserSession {
  token: string;
  agent: Agent;
  expiresAt: string;
}

export interface DbStatusInfo {
  type: 'mongodb' | 'embedded_document_store';
  connected: boolean;
  databaseName: string;
  collections: {
    agents: number;
    bookings: number;
    invoices: number;
    payments: number;
    clients: number;
    sessions: number;
  };
  uriConfigured: boolean;
  message: string;
}

