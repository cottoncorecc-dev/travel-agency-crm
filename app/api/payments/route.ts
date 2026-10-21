import { NextRequest, NextResponse } from 'next/server';
import { getPayments, recordPayment } from '@/lib/db';
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

    const payments = await getPayments(role, agentId, teamMembers, companyId);
    return NextResponse.json(payments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch payments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const invoiceId = sanitizeInputString(body?.invoiceId, 60);
    const bookingId = sanitizeInputString(body?.bookingId, 60);
    const amount = Number(body?.amount);

    if (!invoiceId || !bookingId || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'Valid Invoice ID, Booking ID, and Amount are required' }, { status: 400 });
    }

    const payment = await recordPayment({
      ...body,
      invoiceId,
      bookingId,
      amount,
    });
    return NextResponse.json(payment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to record payment' }, { status: 500 });
  }
}

