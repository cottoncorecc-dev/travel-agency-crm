import { NextRequest, NextResponse } from 'next/server';
import { getStats, getActivities } from '@/lib/db';
import { UserRole } from '@/types/crm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const role = (searchParams.get('role') || 'super_admin') as UserRole;
    const agentId = searchParams.get('agentId') || 'agent_super_admin';
    const teamMembers = searchParams.get('teamMembers')?.split(',').filter(Boolean) || [];
    const companyId = searchParams.get('companyId') || undefined;

    const stats = await getStats(role, agentId, teamMembers, companyId);
    const activities = await getActivities(role, agentId, teamMembers, companyId);

    return NextResponse.json({ stats, activities });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch stats' }, { status: 500 });
  }
}
