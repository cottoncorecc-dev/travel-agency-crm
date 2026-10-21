import { NextRequest, NextResponse } from 'next/server';
import { getPayments, recordPayment } from '@/lib/db';
import { UserRole } from '@/types/crm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = (searchParams.get('role') || 'super_admin') as UserRole;
    const agentId = searchParams.get('agentId') || 'agent_super_admin';
    const teamMembers = searchParams.get('teamMembers')?.split(',').filter(Boolean) || [];
    const companyId = searchParams.get('companyId') || undefined;

    const payments = await getPayments(role, agentId, teamMembers, companyId);
    return NextResponse.json(payments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.invoiceId || !body.bookingId || !body.amount) {
      return NextResponse.json({ error: 'Invoice ID, Booking ID, and Amount are required' }, { status: 400 });
    }
    const payment = await recordPayment(body);
    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to record payment' }, { status: 500 });
  }
}
