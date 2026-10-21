'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Plane,
  Building,
  FileCheck2,
  Car,
  Calculator,
  Save,
  Receipt,
  Upload,
  User,
  Info,
  DollarSign,
  ChevronDown,
  ArrowRight,
  ArrowLeft,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import {
  Booking,
  Agent,
  Passenger,
  PassengerCategory,
  HotelDetail,
  TransportLeg,
  PackageCosting,
  PaxPriceBreakdown,
  Client,
} from '@/types/crm';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking?: Booking | null;
  currentUser: Agent;
  onSaveBooking: (bookingData: any, generateInvoice: boolean) => Promise<void>;
  availableClients?: Client[];
  onOpenAddCustomer?: () => void;
}

const emptyPaxBreakdown = (): PaxPriceBreakdown => ({
  adultPax: 0,
  adultPrice: 0,
  adultCost: 0,
  youthPax: 0,
  youthPrice: 0,
  youthCost: 0,
  childPax: 0,
  childPrice: 0,
  childCost: 0,
  infantPax: 0,
  infantPrice: 0,
  infantCost: 0,
  totalSelling: 0,
  totalCost: 0,
});

export default function BookingModal({
  isOpen,
  onClose,
  booking,
  currentUser,
  onSaveBooking,
  availableClients = [],
  onOpenAddCustomer,
}: BookingModalProps) {
  if (!isOpen) return null;

  const isEditing = Boolean(booking);

  // Client Selection Mode
  const [clientEntryMode, setClientEntryMode] = useState<'registered' | 'direct'>('registered');
  const [selectedClientId, setSelectedClientId] = useState<string>('');

  // 1. Header Information
  const [profileNumber, setProfileNumber] = useState(
    booking?.profileNumber || `PRF-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [amtNo, setAmtNo] = useState(
    booking?.amtNo || `AMT-${Math.floor(1000 + Math.random() * 9000)}`
  );
  const [leadPassengerName, setLeadPassengerName] = useState(booking?.customerName || '');
  const [contactNumber, setContactNumber] = useState(booking?.contactNumber || '');
  const [whatsapp, setWhatsapp] = useState(booking?.whatsapp || '');
  const [email, setEmail] = useState(booking?.email || '');
  const [destination, setDestination] = useState(booking?.destination || 'Makkah & Madinah Umrah Package');
  const [departureDate, setDepartureDate] = useState(booking?.departureDate || '');
  const [returnDate, setReturnDate] = useState(booking?.returnDate || '');
  const [bookingStatus, setBookingStatus] = useState<any>(booking?.bookingStatus || 'Confirmed');

  // 2. Other Passengers
  const [passengers, setPassengers] = useState<Passenger[]>(
    booking?.passengers && booking.passengers.length > 0
      ? booking.passengers
      : [{ id: `pax_${Date.now()}`, name: '', passportNo: '', category: 'Adult' }]
  );

  // 3. Flight Details
  const [flightRoute, setFlightRoute] = useState(booking?.flight?.textOrRoute || '');
  const [airline, setAirline] = useState(booking?.flight?.airline || '');
  const [pnr, setPnr] = useState(booking?.flight?.pnr || '');
  const [flightDepDate, setFlightDepDate] = useState(booking?.flight?.departureDate || '');
  const [flightRetDate, setFlightRetDate] = useState(booking?.flight?.returnDate || '');
  const [luggageDetails, setLuggageDetails] = useState(booking?.flight?.luggageDetails || '2 x 23kg Check-in');
  const [handCarry, setHandCarry] = useState(booking?.flight?.handCarry || '7kg Cabin allowance');
  const [attachmentName, setAttachmentName] = useState(booking?.flight?.attachmentName || '');

  // 4. Hotel Details (Repeatable)
  const [hotels, setHotels] = useState<HotelDetail[]>(
    booking?.hotels && booking.hotels.length > 0
      ? booking.hotels
      : [
          {
            id: `htl_${Date.now()}_1`,
            city: 'Makkah',
            hotelName: 'Pullman Zamzam Makkah',
            rooms: 1,
            roomType: 'Quad Haram View',
            meals: 'Bed & Breakfast',
            checkIn: '2026-10-15',
            checkOut: '2026-10-21',
            nights: 6,
          },
        ]
  );

  // 5. Visa Details
  const [visaCount, setVisaCount] = useState<number>(booking?.visa?.count || 1);
  const [visaType, setVisaType] = useState(booking?.visa?.visaType || 'Tourist / Umrah eVisa (Multi Entry 1yr)');
  const [visaNationality, setVisaNationality] = useState(booking?.visa?.nationality || 'British');
  const [visaStatus, setVisaStatus] = useState<any>(booking?.visa?.status || 'Pending');

  // 6. Transport Legs (Repeatable)
  const [transportLegs, setTransportLegs] = useState<TransportLeg[]>(
    booking?.transport && booking.transport.length > 0
      ? booking.transport
      : [
          {
            id: `tr_${Date.now()}_1`,
            pickUp: 'Jeddah International Airport (JED)',
            dropOff: 'Makkah Hotel',
            dateTime: '',
            vehicleType: 'GMC Yukon 2025',
            otherDetails: 'Meet & greet with passenger name board',
          },
        ]
  );

  // 7. Package Costing Matrix (7 Sections)
  const [costing, setCosting] = useState<PackageCosting>(
    booking?.costing || {
      flights: { adultPax: 1, adultPrice: 700, adultCost: 580, youthPax: 0, youthPrice: 0, youthCost: 0, childPax: 0, childPrice: 0, childCost: 0, infantPax: 0, infantPrice: 0, infantCost: 0, totalSelling: 700, totalCost: 580 },
      visas: { adultPax: 1, adultPrice: 160, adultCost: 125, youthPax: 0, youthPrice: 0, youthCost: 0, childPax: 0, childPrice: 0, childCost: 0, infantPax: 0, infantPrice: 0, infantCost: 0, totalSelling: 160, totalCost: 125 },
      makkahHotel: { adultPax: 1, adultPrice: 1200, adultCost: 950, youthPax: 0, youthPrice: 0, youthCost: 0, childPax: 0, childPrice: 0, childCost: 0, infantPax: 0, infantPrice: 0, infantCost: 0, totalSelling: 1200, totalCost: 950 },
      madinahHotel: emptyPaxBreakdown(),
      otherHotel: emptyPaxBreakdown(),
      transport: { adultPax: 1, adultPrice: 250, adultCost: 180, youthPax: 0, youthPrice: 0, youthCost: 0, childPax: 0, childPrice: 0, childCost: 0, infantPax: 0, infantPrice: 0, infantCost: 0, totalSelling: 250, totalCost: 180 },
      otherServices: emptyPaxBreakdown(),
      totalSellingCost: 2310,
      totalPurchasingCost: 1835,
      profitMargin: 475,
      profitMarginPercent: 20.5,
      totalAmount: 2310,
      paidAmount: booking?.costing?.paidAmount || 0,
      remainingAmount: 2310 - (booking?.costing?.paidAmount || 0),
    }
  );

  const [paidAmountInput, setPaidAmountInput] = useState<number>(booking?.costing?.paidAmount || 0);
  const [activeSection, setActiveSection] = useState<'info' | 'flight' | 'hotels' | 'visa' | 'transport' | 'costing'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const SECTIONS: Array<{ id: 'info' | 'flight' | 'hotels' | 'visa' | 'transport' | 'costing'; label: string; stepNumber: number }> = [
    { id: 'info', label: 'Client & Passengers', stepNumber: 1 },
    { id: 'flight', label: 'Flights & Luggage', stepNumber: 2 },
    { id: 'hotels', label: 'Hotels & Rooms', stepNumber: 3 },
    { id: 'visa', label: 'Visa Processing', stepNumber: 4 },
    { id: 'transport', label: 'Ground Transport', stepNumber: 5 },
    { id: 'costing', label: 'Package Costing & Review', stepNumber: 6 },
  ];

  const currentSectionIndex = SECTIONS.findIndex((s) => s.id === activeSection);
  const nextSection = SECTIONS[currentSectionIndex + 1];
  const prevSection = SECTIONS[currentSectionIndex - 1];

  const handleNextStep = () => {
    if (activeSection === 'info' && !leadPassengerName.trim()) {
      alert('Please enter or select a Lead Passenger Name before proceeding.');
      return;
    }
    if (nextSection) {
      setActiveSection(nextSection.id);
    }
  };

  const handlePrevStep = () => {
    if (prevSection) {
      setActiveSection(prevSection.id);
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    const found = availableClients.find((c) => c.id === clientId);
    if (found) {
      setLeadPassengerName(found.name);
      setContactNumber(found.phone);
      setWhatsapp(found.whatsapp || found.phone);
      setEmail(found.email || '');
      if (found.passportNumber) {
        setPassengers((prev) => {
          const copy = [...prev];
          if (copy[0]) {
            copy[0] = { ...copy[0], name: found.name, passportNo: found.passportNumber };
          }
          return copy;
        });
      }
      if (found.nationality) {
        setVisaNationality(found.nationality);
      }
    }
  };

  // Sync lead passenger name into passengers[0] if needed
  useEffect(() => {
    if (leadPassengerName && passengers.length > 0 && !passengers[0].name) {
      const updated = [...passengers];
      updated[0].name = leadPassengerName;
      setPassengers(updated);
    }
  }, [leadPassengerName]);

  // Recalculate nights when hotel checkIn/checkOut change
  const updateHotel = (index: number, field: keyof HotelDetail, value: any) => {
    const updated = [...hotels];
    const hotel = { ...updated[index], [field]: value };
    if (field === 'checkIn' || field === 'checkOut') {
      if (hotel.checkIn && hotel.checkOut) {
        const d1 = new Date(hotel.checkIn);
        const d2 = new Date(hotel.checkOut);
        const diff = Math.max(1, Math.round((d2.getTime() - d1.getTime()) / (1000 * 3600 * 24)));
        hotel.nights = isNaN(diff) ? 1 : diff;
      }
    }
    updated[index] = hotel;
    setHotels(updated);
  };

  const addHotel = () => {
    setHotels([
      ...hotels,
      {
        id: `htl_${Date.now()}`,
        city: 'Madinah',
        hotelName: 'The Oberoi Madinah',
        rooms: 1,
        roomType: 'Deluxe Haram View',
        meals: 'Bed & Breakfast',
        checkIn: '',
        checkOut: '',
        nights: 4,
      },
    ]);
  };

  const removeHotel = (index: number) => {
    if (hotels.length <= 1) return;
    setHotels(hotels.filter((_, i) => i !== index));
  };

  const addPassenger = () => {
    setPassengers([
      ...passengers,
      { id: `pax_${Date.now()}`, name: '', passportNo: '', category: 'Adult' },
    ]);
  };

  const removePassenger = (index: number) => {
    if (passengers.length <= 1) return;
    setPassengers(passengers.filter((_, i) => i !== index));
  };

  const addTransportLeg = () => {
    setTransportLegs([
      ...transportLegs,
      {
        id: `tr_${Date.now()}`,
        pickUp: '',
        dropOff: '',
        dateTime: '',
        vehicleType: 'GMC Yukon 2025',
        otherDetails: '',
      },
    ]);
  };

  const removeTransportLeg = (index: number) => {
    setTransportLegs(transportLegs.filter((_, i) => i !== index));
  };

  // Helper for costing breakdown updates
  const updateCostingCategory = (
    category: keyof Omit<
      PackageCosting,
      | 'totalSellingCost'
      | 'totalPurchasingCost'
      | 'profitMargin'
      | 'profitMarginPercent'
      | 'totalAmount'
      | 'paidAmount'
      | 'remainingAmount'
    >,
    field: keyof PaxPriceBreakdown,
    val: number
  ) => {
    setCosting((prev) => {
      const cat = { ...prev[category], [field]: Number(val) || 0 };
      // auto calculate total selling and total cost
      cat.totalSelling =
        cat.adultPax * cat.adultPrice +
        cat.youthPax * cat.youthPrice +
        cat.childPax * cat.childPrice +
        cat.infantPax * cat.infantPrice;
      cat.totalCost =
        cat.adultPax * cat.adultCost +
        cat.youthPax * cat.youthCost +
        cat.childPax * cat.childCost +
        cat.infantPax * cat.infantCost;

      const newCosting = { ...prev, [category]: cat };

      // Calculate overarching totals
      const cats: (keyof typeof prev)[] = [
        'flights',
        'visas',
        'makkahHotel',
        'madinahHotel',
        'otherHotel',
        'transport',
        'otherServices',
      ];

      let grandSelling = 0;
      let grandCost = 0;
      cats.forEach((c) => {
        const item = newCosting[c] as PaxPriceBreakdown;
        if (item) {
          grandSelling += item.totalSelling || 0;
          grandCost += item.totalCost || 0;
        }
      });

      const profitMargin = grandSelling - grandCost;
      const profitMarginPercent = grandSelling > 0 ? Number(((profitMargin / grandSelling) * 100).toFixed(1)) : 0;
      const remainingAmount = Math.max(0, grandSelling - paidAmountInput);

      return {
        ...newCosting,
        totalSellingCost: grandSelling,
        totalPurchasingCost: grandCost,
        profitMargin,
        profitMarginPercent,
        totalAmount: grandSelling,
        paidAmount: paidAmountInput,
        remainingAmount,
      };
    });
  };

  // Update paid amount recalculation
  const handlePaidAmountChange = (amt: number) => {
    setPaidAmountInput(amt);
    setCosting((prev) => ({
      ...prev,
      paidAmount: amt,
      remainingAmount: Math.max(0, prev.totalAmount - amt),
    }));
  };

  const handleSave = async (generateInvoice: boolean) => {
    if (!leadPassengerName) {
      alert('Please enter Lead Passenger Name');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<Booking> = {
        profileNumber,
        amtNo,
        customerName: leadPassengerName,
        contactNumber,
        whatsapp: whatsapp || contactNumber,
        email,
        passportInfo: passengers[0]?.passportNo || '',
        paxCount: passengers.length,
        destination,
        departureDate: departureDate || (hotels[0]?.checkIn ?? '2026-10-15'),
        returnDate: returnDate || (hotels[hotels.length - 1]?.checkOut ?? '2026-10-25'),
        passengers,
        flight: {
          textOrRoute: flightRoute,
          airline,
          pnr,
          departureDate: flightDepDate || departureDate,
          returnDate: flightRetDate || returnDate,
          luggageDetails,
          handCarry,
          attachmentName,
        },
        hotels,
        visa: {
          count: visaCount,
          visaType,
          nationality: visaNationality,
          status: visaStatus,
        },
        transport: transportLegs,
        costing: {
          ...costing,
          paidAmount: paidAmountInput,
          remainingAmount: Math.max(0, costing.totalAmount - paidAmountInput),
        },
        bookingStatus,
        paymentStatus:
          paidAmountInput >= costing.totalAmount
            ? 'Paid'
            : paidAmountInput > 0
            ? 'Partial'
            : 'Unpaid',
        agentId: booking?.agentId || currentUser.id,
        agentName: booking?.agentName || currentUser.name,
      };

      if (isEditing && booking) {
        payload.id = booking.id;
        payload.bookingRef = booking.bookingRef;
      }

      await onSaveBooking(payload, generateInvoice);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-neutral-50/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-neutral-200/90 rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Sticky Header */}
        <div className="px-6 py-4 border-b border-neutral-100 bg-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-amber-700 font-bold text-xs uppercase tracking-wider">
                devntom solutions CRM
              </span>
              <span className="text-neutral-500">·</span>
              <span className="text-xs text-neutral-500">
                Created By: <strong className="text-neutral-800">Agent {booking?.agentName || currentUser.name}</strong>
              </span>
            </div>
            <h2 className="text-lg font-bold text-neutral-900 mt-0.5">
              {isEditing ? `Booking Record · ${booking?.bookingRef}` : 'New Booking & Client Record'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-1 px-6 pt-2 border-b border-neutral-200 bg-neutral-50/80 text-xs font-semibold overflow-x-auto shrink-0">
          {[
            { id: 'info', label: '1. Client & Passengers', icon: User },
            { id: 'flight', label: '2. Flights & Luggage', icon: Plane },
            { id: 'hotels', label: '3. Hotels & Rooms', icon: Building },
            { id: 'visa', label: '4. Visa Processing', icon: FileCheck2 },
            { id: 'transport', label: '5. Ground Transport', icon: Car },
            { id: 'costing', label: '6. Package Pricing & Costing', icon: Calculator },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
                  active
                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-neutral-700 bg-slate-50/40">
          {/* ------------------------------------------------------------- */}
          {/* TAB 1: CLIENT & PASSENGERS */}
          {/* ------------------------------------------------------------- */}
          {activeSection === 'info' && (
            <div className="space-y-6">
              {/* Record Header Fields */}
              <div className="p-4 bg-white border border-neutral-200/90 shadow-2xs rounded-xl space-y-4">
                <h3 className="font-semibold text-neutral-900 uppercase tracking-wider text-[11px] flex items-center justify-between">
                  <span>File Header Identification</span>
                  <span className="text-[10px] text-amber-400 font-mono">Agent ID: {currentUser.username}</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                      Profile Number *
                    </label>
                    <input
                      type="text"
                      value={profileNumber}
                      onChange={(e) => setProfileNumber(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                      AMT No. *
                    </label>
                    <input
                      type="text"
                      value={amtNo}
                      onChange={(e) => setAmtNo(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 font-mono focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                      Departure Date
                    </label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                      Return Date
                    </label>
                    <input
                      type="date"
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                      Lead Passenger Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Tariq Al-Mansoor"
                      value={leadPassengerName}
                      onChange={(e) => setLeadPassengerName(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                      Contact Number *
                    </label>
                    <input
                      type="text"
                      placeholder="+44 7700 900123"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      placeholder="+44 7700 900123"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="client@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                      Destination / Package Title
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Makkah & Madinah Deluxe"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Other Passengers List (Repeatable) */}
              <div className="p-4 bg-white border border-neutral-200/90 shadow-2xs rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-neutral-900 uppercase tracking-wider text-[11px]">
                      Passenger Manifest & Age Categories
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Total Passengers: <span className="font-mono text-neutral-800">{passengers.length} Pax</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addPassenger}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-semibold rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Passenger</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {passengers.map((pax, index) => (
                    <div
                      key={pax.id}
                      className="grid grid-cols-12 gap-3 items-center p-3 rounded-lg border border-neutral-200 bg-neutral-50/70"
                    >
                      <div className="col-span-1 text-center font-mono text-[11px] text-neutral-500 font-bold">
                        #{index + 1}
                      </div>
                      <div className="col-span-5">
                        <label className="block text-[9px] uppercase text-neutral-500 mb-0.5">Passenger Name</label>
                        <input
                          type="text"
                          placeholder="Full Name as on Passport"
                          value={pax.name}
                          onChange={(e) => {
                            const updated = [...passengers];
                            updated[index].name = e.target.value;
                            setPassengers(updated);
                          }}
                          className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded px-2.5 py-1.5 text-neutral-900 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[9px] uppercase text-neutral-500 mb-0.5">Passport Number</label>
                        <input
                          type="text"
                          placeholder="e.g. GB12345678"
                          value={pax.passportNo}
                          onChange={(e) => {
                            const updated = [...passengers];
                            updated[index].passportNo = e.target.value;
                            setPassengers(updated);
                          }}
                          className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded px-2.5 py-1.5 text-neutral-900 font-mono text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] uppercase text-neutral-500 mb-0.5">Category</label>
                        <select
                          value={pax.category}
                          onChange={(e) => {
                            const updated = [...passengers];
                            updated[index].category = e.target.value as PassengerCategory;
                            setPassengers(updated);
                          }}
                          className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded px-2 py-1.5 text-neutral-900 text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                        >
                          <option value="Adult">Adult</option>
                          <option value="Youth">Youth</option>
                          <option value="Child">Child</option>
                          <option value="Infant">Infant</option>
                        </select>
                      </div>
                      <div className="col-span-1 text-right">
                        {passengers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePassenger(index)}
                            className="p-1.5 text-neutral-500 hover:text-rose-400 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 2: FLIGHT DETAILS & LUGGAGE */}
          {/* ------------------------------------------------------------- */}
          {activeSection === 'flight' && (
            <div className="space-y-6">
              <div className="p-4 bg-white border border-neutral-200/90 shadow-2xs rounded-xl space-y-4">
                <h3 className="font-semibold text-neutral-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <Plane className="w-4 h-4 text-amber-400" />
                  <span>Flight Routing & PNR Confirmation</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                      Airline Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Saudia / British Airways"
                      value={airline}
                      onChange={(e) => setAirline(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                      PNR / Booking Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SVD892"
                      value={pnr}
                      onChange={(e) => setPnr(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                      Ticket File Attachment (Agent)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Attach eTicket.pdf"
                        value={attachmentName}
                        onChange={(e) => setAttachmentName(e.target.value)}
                        className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-neutral-900"
                      />
                      <label className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-400 rounded-lg cursor-pointer shrink-0">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) setAttachmentName(e.target.files[0].name);
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                    Flight Itinerary Text / Paste GDS Confirmation
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Paste GDS segment text, flight times, layovers, or route codes..."
                    value={flightRoute}
                    onChange={(e) => setFlightRoute(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg p-3 text-neutral-900 font-mono text-xs focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>

                {/* Luggage Details (Agent Use) */}
                <div className="p-3.5 bg-neutral-50/80 border border-neutral-200 rounded-xl space-y-3">
                  <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <Info className="w-3.5 h-3.5" />
                    <span>Agent Use Only: Luggage & Hand Carry Specifications</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                        Luggage Details (Checked-in)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2 x 23kg Check-in per adult, 10kg return allowance"
                        value={luggageDetails}
                        onChange={(e) => setLuggageDetails(e.target.value)}
                        className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded-lg px-3 py-2 text-neutral-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                        Hand Carry Details (Cabin)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 7kg Cabin baggage + 1 personal laptop bag"
                        value={handCarry}
                        onChange={(e) => setHandCarry(e.target.value)}
                        className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded-lg px-3 py-2 text-neutral-900"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 3: HOTEL DETAILS (Repeatable + Auto-calc nights) */}
          {/* ------------------------------------------------------------- */}
          {activeSection === 'hotels' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <Building className="w-4 h-4 text-amber-400" />
                    <span>Hotel Itinerary & Room Allocations</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Nights are calculated automatically from check-in and check-out dates.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addHotel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-semibold rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Other Hotel</span>
                </button>
              </div>

              <div className="space-y-4">
                {hotels.map((hotel, index) => (
                  <div
                    key={hotel.id}
                    className="p-4 bg-white border border-neutral-200/90 shadow-2xs rounded-xl space-y-4 relative"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-amber-400/10 text-amber-400 font-bold text-[11px] flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-semibold text-neutral-800">
                          {hotel.city ? `${hotel.city} Stay` : `Hotel #${index + 1}`}
                        </span>
                      </div>
                      {hotels.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeHotel(index)}
                          className="text-neutral-500 hover:text-rose-400 p-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                      <div>
                        <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Makkah / Madinah / London"
                          value={hotel.city}
                          onChange={(e) => updateHotel(index, 'city', e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-neutral-900"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                          Hotel Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Pullman Zamzam / Oberoi"
                          value={hotel.hotelName}
                          onChange={(e) => updateHotel(index, 'hotelName', e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-neutral-900 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                          No. of Rooms
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={hotel.rooms}
                          onChange={(e) => updateHotel(index, 'rooms', Number(e.target.value))}
                          className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-neutral-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
                      <div className="md:col-span-2">
                        <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                          Room Type
                        </label>
                        <input
                          type="text"
                          placeholder="Double / Triple / Quad / Suite"
                          value={hotel.roomType}
                          onChange={(e) => updateHotel(index, 'roomType', e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                          Meals Plan
                        </label>
                        <select
                          value={hotel.meals}
                          onChange={(e) => updateHotel(index, 'meals', e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded px-2 py-1.5 text-neutral-900"
                        >
                          <option value="Room Only">Room Only</option>
                          <option value="Bed & Breakfast">Bed & Breakfast</option>
                          <option value="Half Board">Half Board</option>
                          <option value="Full Board">Full Board</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                          Check-in Date
                        </label>
                        <input
                          type="date"
                          value={hotel.checkIn}
                          onChange={(e) => updateHotel(index, 'checkIn', e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded px-2 py-1.5 text-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1 flex items-center justify-between">
                          <span>Check-out</span>
                          <span className="text-amber-400 font-bold font-mono">
                            {hotel.nights} {hotel.nights === 1 ? 'Night' : 'Nights'}
                          </span>
                        </label>
                        <input
                          type="date"
                          value={hotel.checkOut}
                          onChange={(e) => updateHotel(index, 'checkOut', e.target.value)}
                          className="w-full bg-white border border-neutral-300 rounded px-2 py-1.5 text-neutral-900"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 4: VISA DETAILS */}
          {/* ------------------------------------------------------------- */}
          {activeSection === 'visa' && (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-neutral-200/90 shadow-2xs rounded-xl space-y-4">
                <h3 className="font-semibold text-neutral-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-amber-400" />
                  <span>Visa Documentation & Processing</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                      No. of Visas
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={visaCount}
                      onChange={(e) => setVisaCount(Number(e.target.value))}
                      className="w-full bg-white border border-neutral-300 rounded px-3 py-2 text-neutral-900 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                      Visa Type
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Umrah eVisa / Tourist Visa / Transit"
                      value={visaType}
                      onChange={(e) => setVisaType(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded px-3 py-2 text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                      Passenger Nationality
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. British / American / Pakistani"
                      value={visaNationality}
                      onChange={(e) => setVisaNationality(e.target.value)}
                      className="w-full bg-white border border-neutral-300 rounded px-3 py-2 text-neutral-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                      Processing Status
                    </label>
                    <select
                      value={visaStatus}
                      onChange={(e) => setVisaStatus(e.target.value as any)}
                      className="w-full bg-white border border-neutral-300 rounded px-3 py-2 text-neutral-900"
                    >
                      <option value="Pending">Pending Documents</option>
                      <option value="Under Review">Under Review</option>
                      <option value="Issued">Issued & Verified</option>
                      <option value="Rejected">Rejected</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 5: GROUND TRANSPORTATION (Repeatable) */}
          {/* ------------------------------------------------------------- */}
          {activeSection === 'transport' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <Car className="w-4 h-4 text-amber-400" />
                    <span>Ground Transport Logistics & Chauffeur Services</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Add airport transfers, intercity transfers, and VIP Haramain train connections.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addTransportLeg}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-amber-400 font-semibold rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Transport Leg</span>
                </button>
              </div>

              <div className="space-y-3">
                {transportLegs.map((leg, index) => (
                  <div
                    key={leg.id}
                    className="p-4 bg-white border border-neutral-200/90 shadow-2xs rounded-xl space-y-3 relative"
                  >
                    <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                      <span className="font-semibold text-neutral-800">
                        Leg #{index + 1}: {leg.pickUp || 'Pickup'} → {leg.dropOff || 'Dropoff'}
                      </span>
                      {transportLegs.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTransportLeg(index)}
                          className="text-neutral-500 hover:text-rose-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                          Pick Up Location
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Jeddah Airport JED"
                          value={leg.pickUp}
                          onChange={(e) => {
                            const updated = [...transportLegs];
                            updated[index].pickUp = e.target.value;
                            setTransportLegs(updated);
                          }}
                          className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                          Drop Off Location
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Pullman Makkah"
                          value={leg.dropOff}
                          onChange={(e) => {
                            const updated = [...transportLegs];
                            updated[index].dropOff = e.target.value;
                            setTransportLegs(updated);
                          }}
                          className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                          Date & Time
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 2026-10-15 19:30"
                          value={leg.dateTime}
                          onChange={(e) => {
                            const updated = [...transportLegs];
                            updated[index].dateTime = e.target.value;
                            setTransportLegs(updated);
                          }}
                          className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-neutral-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                          Vehicle Type
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. GMC Yukon / HiAce / Coaster"
                          value={leg.vehicleType}
                          onChange={(e) => {
                            const updated = [...transportLegs];
                            updated[index].vehicleType = e.target.value;
                            setTransportLegs(updated);
                          }}
                          className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-neutral-900"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase text-neutral-500 font-semibold mb-1">
                        Driver Notes & Other Details
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Flight SV 118 meetup, trailer luggage van, child seat requested"
                        value={leg.otherDetails}
                        onChange={(e) => {
                          const updated = [...transportLegs];
                          updated[index].otherDetails = e.target.value;
                          setTransportLegs(updated);
                        }}
                        className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1.5 text-neutral-900 text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 6: PACKAGE PRICING & COSTING SYSTEM (7 SECTIONS) */}
          {/* ------------------------------------------------------------- */}
          {activeSection === 'costing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900 uppercase tracking-wider text-[11px] flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-amber-400" />
                    <span>Package Pricing, Costing & Margin Engine</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Each section breaks down into Adult, Youth, Child, and Infant with auto-calculated selling prices and supplier costs.
                  </p>
                </div>
              </div>

              {/* Matrix of 7 Costing Sections */}
              <div className="space-y-4">
                {[
                  { key: 'flights', title: '1. Flights Costing' },
                  { key: 'visas', title: '2. Visas Costing' },
                  { key: 'makkahHotel', title: '3. Makkah Hotel Costing' },
                  { key: 'madinahHotel', title: '4. Madinah Hotel Costing' },
                  { key: 'otherHotel', title: '5. Other Hotel Costing' },
                  { key: 'transport', title: '6. Transport Costing' },
                  { key: 'otherServices', title: '7. Other Services Costing' },
                ].map((sec) => {
                  const data = costing[sec.key as keyof PackageCosting] as PaxPriceBreakdown;
                  return (
                    <div
                      key={sec.key}
                      className="p-4 bg-white border border-neutral-200/90 shadow-2xs rounded-xl space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-neutral-200 pb-2">
                        <span className="font-bold text-xs text-neutral-800">{sec.title}</span>
                        <div className="flex items-center gap-4 font-mono text-[11px]">
                          <span>
                            Cost: <strong className="text-neutral-500">£{data.totalCost || 0}</strong>
                          </span>
                          <span>
                            Selling: <strong className="text-amber-400">£{data.totalSelling || 0}</strong>
                          </span>
                          <span>
                            Margin:{' '}
                            <strong className="text-emerald-400">
                              £{(data.totalSelling || 0) - (data.totalCost || 0)}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* 4 Passenger Categories Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                        {/* Adult */}
                        <div className="p-2.5 bg-white border border-neutral-300/80 rounded-lg space-y-2">
                          <div className="font-semibold text-neutral-800 text-[11px] flex items-center justify-between">
                            <span>Adult</span>
                            <span className="font-mono text-neutral-500">
                              £{data.adultPax * data.adultPrice}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                            <div>
                              <span className="text-neutral-500">Pax</span>
                              <input
                                type="number"
                                min={0}
                                value={data.adultPax}
                                onChange={(e) =>
                                  updateCostingCategory(sec.key as any, 'adultPax', Number(e.target.value))
                                }
                                className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded px-1.5 py-1 text-neutral-900 font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-neutral-500">Price/Pax</span>
                              <input
                                type="number"
                                min={0}
                                value={data.adultPrice}
                                onChange={(e) =>
                                  updateCostingCategory(sec.key as any, 'adultPrice', Number(e.target.value))
                                }
                                className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded px-1.5 py-1 text-amber-300 font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-neutral-500">Cost/Pax</span>
                              <input
                                type="number"
                                min={0}
                                value={data.adultCost}
                                onChange={(e) =>
                                  updateCostingCategory(sec.key as any, 'adultCost', Number(e.target.value))
                                }
                                className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded px-1.5 py-1 text-neutral-500 font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Youth */}
                        <div className="p-2.5 bg-white border border-neutral-300/80 rounded-lg space-y-2">
                          <div className="font-semibold text-neutral-800 text-[11px] flex items-center justify-between">
                            <span>Youth</span>
                            <span className="font-mono text-neutral-500">
                              £{data.youthPax * data.youthPrice}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                            <div>
                              <span className="text-neutral-500">Pax</span>
                              <input
                                type="number"
                                min={0}
                                value={data.youthPax}
                                onChange={(e) =>
                                  updateCostingCategory(sec.key as any, 'youthPax', Number(e.target.value))
                                }
                                className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded px-1.5 py-1 text-neutral-900 font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-neutral-500">Price/Pax</span>
                              <input
                                type="number"
                                min={0}
                                value={data.youthPrice}
                                onChange={(e) =>
                                  updateCostingCategory(sec.key as any, 'youthPrice', Number(e.target.value))
                                }
                                className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded px-1.5 py-1 text-amber-300 font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-neutral-500">Cost/Pax</span>
                              <input
                                type="number"
                                min={0}
                                value={data.youthCost}
                                onChange={(e) =>
                                  updateCostingCategory(sec.key as any, 'youthCost', Number(e.target.value))
                                }
                                className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded px-1.5 py-1 text-neutral-500 font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Child */}
                        <div className="p-2.5 bg-white border border-neutral-300/80 rounded-lg space-y-2">
                          <div className="font-semibold text-neutral-800 text-[11px] flex items-center justify-between">
                            <span>Child</span>
                            <span className="font-mono text-neutral-500">
                              £{data.childPax * data.childPrice}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                            <div>
                              <span className="text-neutral-500">Pax</span>
                              <input
                                type="number"
                                min={0}
                                value={data.childPax}
                                onChange={(e) =>
                                  updateCostingCategory(sec.key as any, 'childPax', Number(e.target.value))
                                }
                                className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded px-1.5 py-1 text-neutral-900 font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-neutral-500">Price/Pax</span>
                              <input
                                type="number"
                                min={0}
                                value={data.childPrice}
                                onChange={(e) =>
                                  updateCostingCategory(sec.key as any, 'childPrice', Number(e.target.value))
                                }
                                className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded px-1.5 py-1 text-amber-300 font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-neutral-500">Cost/Pax</span>
                              <input
                                type="number"
                                min={0}
                                value={data.childCost}
                                onChange={(e) =>
                                  updateCostingCategory(sec.key as any, 'childCost', Number(e.target.value))
                                }
                                className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded px-1.5 py-1 text-neutral-500 font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Infant */}
                        <div className="p-2.5 bg-white border border-neutral-300/80 rounded-lg space-y-2">
                          <div className="font-semibold text-neutral-800 text-[11px] flex items-center justify-between">
                            <span>Infant</span>
                            <span className="font-mono text-neutral-500">
                              £{data.infantPax * data.infantPrice}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                            <div>
                              <span className="text-neutral-500">Pax</span>
                              <input
                                type="number"
                                min={0}
                                value={data.infantPax}
                                onChange={(e) =>
                                  updateCostingCategory(sec.key as any, 'infantPax', Number(e.target.value))
                                }
                                className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded px-1.5 py-1 text-neutral-900 font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-neutral-500">Price/Pax</span>
                              <input
                                type="number"
                                min={0}
                                value={data.infantPrice}
                                onChange={(e) =>
                                  updateCostingCategory(sec.key as any, 'infantPrice', Number(e.target.value))
                                }
                                className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded px-1.5 py-1 text-amber-300 font-mono"
                              />
                            </div>
                            <div>
                              <span className="text-neutral-500">Cost/Pax</span>
                              <input
                                type="number"
                                min={0}
                                value={data.infantCost}
                                onChange={(e) =>
                                  updateCostingCategory(sec.key as any, 'infantCost', Number(e.target.value))
                                }
                                className="w-full bg-white border border-neutral-200/90 shadow-2xs rounded px-1.5 py-1 text-neutral-500 font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TOTALS & ACTIONS STICKY FOOTER */}
        {/* ------------------------------------------------------------- */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          {/* Financial Calculation Totals Bar */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-xs font-mono">
            <div>
              <div className="text-[10px] text-neutral-500 uppercase">Selling Cost</div>
              <div className="font-bold text-neutral-900 text-sm">
                £{costing.totalSellingCost.toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-neutral-500 uppercase">Subtotal / Cost</div>
              <div className="font-bold text-neutral-500 text-sm">
                £{costing.totalPurchasingCost.toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-neutral-500 uppercase">Profit Margin</div>
              <div className="font-bold text-emerald-400 text-sm">
                £{costing.profitMargin.toLocaleString()} ({costing.profitMarginPercent}%)
              </div>
            </div>

            <div>
              <div className="text-[10px] text-neutral-500 uppercase">Total Amount</div>
              <div className="font-bold text-amber-400 text-sm">
                £{costing.totalAmount.toLocaleString()}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-neutral-500 uppercase">Paid Amount</div>
              <input
                type="number"
                min={0}
                max={costing.totalAmount}
                value={paidAmountInput}
                onChange={(e) => handlePaidAmountChange(Number(e.target.value) || 0)}
                className="w-24 bg-white border border-neutral-700 rounded px-2 py-0.5 text-emerald-400 font-bold text-xs"
              />
            </div>

            <div>
              <div className="text-[10px] text-neutral-500 uppercase">Remaining Due</div>
              <div className="font-bold text-rose-400 text-sm">
                £{(costing.totalAmount - paidAmountInput).toLocaleString()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-800"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(false)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-800 rounded-lg border border-neutral-700 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Only</span>
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-bold shadow-sm rounded-lg shadow-sm transition-colors"
            >
              <Receipt className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Save and Generate Invoice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
