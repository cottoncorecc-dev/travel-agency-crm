'use client';

import React, { useState } from 'react';
import { PlaneTakeoff, Calendar, MapPin, Users, Hotel, Clock, ArrowRight } from 'lucide-react';
import { Booking, Agent } from '@/types/crm';
import { formatCount } from '@/lib/utils';

interface UpcomingTripsViewProps {
  bookings: Booking[];
  currentUser: Agent;
  onOpenBooking: (b: Booking) => void;
  onOpenInvoice: (b: Booking) => void;
}

export default function UpcomingTripsView({
  bookings = [],
  currentUser,
  onOpenBooking,
  onOpenInvoice,
}: UpcomingTripsViewProps) {
  const [filter, setFilter] = useState<'all' | 'next7' | 'next30' | 'next60'>('all');

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const trips = bookings
    .filter((b) => (b.departureDate || '') >= todayStr && b.bookingStatus !== 'Cancelled')
    .map((b) => {
      const dep = new Date(b.departureDate);
      const diffDays = Math.ceil((dep.getTime() - today.getTime()) / (1000 * 3600 * 24));
      return { ...b, daysUntilDeparture: diffDays };
    })
    .sort((a, b) => a.daysUntilDeparture - b.daysUntilDeparture);

  const filteredTrips = trips.filter((t) => {
    if (filter === 'next7') return t.daysUntilDeparture <= 7;
    if (filter === 'next30') return t.daysUntilDeparture <= 30;
    if (filter === 'next60') return t.daysUntilDeparture <= 60;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
            <PlaneTakeoff className="w-5 h-5 text-emerald-600" />
            <span>Upcoming Trip Departures</span>
          </h2>
          <p className="text-xs text-neutral-500">
            Real-time schedule of client departures, hotel check-ins, and flight operations.
          </p>
        </div>

        {/* Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-white border border-neutral-200 rounded-xl shadow-2xs">
          {[
            { id: 'all', label: 'All Upcoming' },
            { id: 'next7', label: 'Next 7 Days' },
            { id: 'next30', label: 'Next 30 Days' },
            { id: 'next60', label: 'Next 60 Days' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                filter === f.id
                  ? 'bg-emerald-500 text-neutral-950 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTrips.length === 0 ? (
          <div className="col-span-full py-12 text-center text-neutral-400 bg-white border border-neutral-200/90 rounded-2xl shadow-xs">
            No upcoming departures scheduled for this timeframe.
          </div>
        ) : (
          filteredTrips.map((trip) => (
            <div
              key={trip.id}
              className="bg-white border border-neutral-200/90 hover:border-emerald-300 rounded-2xl p-5 space-y-4 transition-all hover:shadow-md flex flex-col justify-between shadow-xs"
            >
              <div>
                {/* Top Badge: Countdown Days */}
                <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="font-bold text-amber-700">{trip.bookingRef}</span>
                    <span className="text-neutral-300">·</span>
                    <span className="text-neutral-500 font-sans font-medium">{formatCount(trip.paxCount)} Pax</span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      trip.daysUntilDeparture <= 7
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : trip.daysUntilDeparture <= 30
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    In {trip.daysUntilDeparture} Days
                  </span>
                </div>

                {/* Lead Passenger & Destination */}
                <div className="pt-2">
                  <div className="font-bold text-sm text-neutral-900">{trip.customerName}</div>
                  <div className="text-xs text-amber-800 font-semibold mt-0.5">{trip.destination}</div>
                  <div className="text-[11px] text-neutral-400 font-mono mt-1">
                    {trip.contactNumber}
                  </div>
                </div>

                {/* Dates & Logistics Snippets */}
                <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-neutral-200/70 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-neutral-700">
                    <Calendar className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="font-mono text-[11px] font-medium">
                      {trip.departureDate} → {trip.returnDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-neutral-700">
                    <PlaneTakeoff className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span className="truncate">{trip.flight?.airline || 'Scheduled Flight'} ({trip.flight?.pnr || 'PNR'})</span>
                  </div>

                  {(trip.hotels?.length ?? 0) > 0 && (
                    <div className="flex items-center gap-2 text-neutral-700">
                      <Hotel className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{trip.hotels[0].hotelName} ({trip.hotels[0].city})</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer: Financial status & Actions */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                <div>
                  <div className="text-[10px] text-neutral-400 font-bold uppercase">Payment</div>
                  <div
                    className={`font-bold font-mono text-xs ${
                      (trip.costing?.remainingAmount ?? 0) === 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {(trip.costing?.remainingAmount ?? 0) === 0
                      ? 'Paid in Full'
                      : `Due: £${trip.costing.remainingAmount.toLocaleString()}`}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenInvoice(trip)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                  >
                    Invoice
                  </button>
                  <button
                    onClick={() => onOpenBooking(trip)}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-200 transition-colors cursor-pointer"
                  >
                    Manage
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
