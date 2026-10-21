import { NextRequest, NextResponse } from 'next/server';
import { getBookings, createBooking, updateBooking, deleteBooking } from '@/lib/db';
import { UserRole } from '@/types/crm';
import { sanitizeInputString } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawRole = searchParams.get('role');
    const rawAgentId = searchParams.get('agentId');
    const rawTeamMembers = searchParams.get('teamMembers');
    const rawCompanyId = searchParams.get('companyId');

    const role = (rawRole ? sanitizeInputString(rawRole, 30) : 'super_admin') as UserRole;
    const agentId = rawAgentId ? sanitizeInputString(rawAgentId, 60) : 'agent_super_admin';
    const teamMembers = rawTeamMembers
      ? rawTeamMembers
          .split(',')
          .map((m) => sanitizeInputString(m, 60))
          .filter(Boolean)
      : [];
    const companyId = rawCompanyId ? sanitizeInputString(rawCompanyId, 60) : undefined;

    const bookings = await getBookings(role, agentId, teamMembers, companyId);
    return NextResponse.json(bookings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch bookings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body?.customerName || !body?.destination) {
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
    const id = sanitizeInputString(body?.id, 60);
    if (!id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }
    const updated = await updateBooking(id, body);
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
    const rawId = searchParams.get('id');
    const id = rawId ? sanitizeInputString(rawId, 60) : null;
    if (!id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
    }
    const success = await deleteBooking(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete booking' }, { status: 500 });
  }
}

