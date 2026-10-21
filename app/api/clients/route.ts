import { NextRequest, NextResponse } from 'next/server';
import { getClients } from '@/lib/db';
import { UserRole } from '@/types/crm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = (searchParams.get('role') || 'super_admin') as UserRole;
    const agentId = searchParams.get('agentId') || 'agent_super_admin';
    const teamMembers = searchParams.get('teamMembers')?.split(',').filter(Boolean) || [];
    const companyId = searchParams.get('companyId') || undefined;

    const clients = await getClients(role, agentId, teamMembers, companyId);
    return NextResponse.json(clients);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch clients' }, { status: 500 });
  }
}
