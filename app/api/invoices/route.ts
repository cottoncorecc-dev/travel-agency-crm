import { NextRequest, NextResponse } from 'next/server';
import { getInvoices } from '@/lib/db';
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

    const invoices = await getInvoices(role, agentId, teamMembers, companyId);
    return NextResponse.json(invoices);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}

