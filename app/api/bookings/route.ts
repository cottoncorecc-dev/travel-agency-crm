import { NextRequest, NextResponse } from 'next/server';
import { getBookings, createBooking, updateBooking, deleteBooking } from '@/lib/db';
import { UserRole } from '@/types/crm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = (searchParams.get('role') || 'super_admin') as UserRole;
    const agentId = searchParams.get('agentId') || 'agent_super_admin';
    const teamMembers = searchParams.get('teamMembers')?.split(',').filter(Boolean) || [];
    const companyId = searchParams.get('companyId') || undefined;

    const bookings = await getBookings(role, agentId, teamMembers, companyId);
    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.customerName || !body.destination) {
      return NextResponse.json({ error: 'Customer Name and Destination are required' }, { status: 400 });
    }
    const result = await createBooking(body);
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create booking' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }
    const updated = await updateBooking(body.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }
    const success = await deleteBooking(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete booking' }, { status: 500 });
  }
}
