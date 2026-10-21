import { NextRequest, NextResponse } from 'next/server';
import { getInvoices } from '@/lib/db';
import { UserRole } from '@/types/crm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = (searchParams.get('role') || 'super_admin') as UserRole;
    const agentId = searchParams.get('agentId') || 'agent_super_admin';
    const teamMembers = searchParams.get('teamMembers')?.split(',').filter(Boolean) || [];
    const companyId = searchParams.get('companyId') || undefined;

    const invoices = await getInvoices(role, agentId, teamMembers, companyId);
    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}
