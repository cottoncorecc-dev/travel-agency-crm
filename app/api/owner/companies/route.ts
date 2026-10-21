import { NextRequest, NextResponse } from 'next/server';
import {
  getCompanies,
  getAgents,
  getBookings,
  approveCompany,
  rejectCompany,
  suspendCompany,
  reactivateCompany,
  deleteCompany,
} from '@/lib/db';
import { verifyOwnerAuth, sanitizeInputString } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyOwnerAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized. CRM Owner access required.' }, { status: 401 });
    }

    const companies = await getCompanies();
    const agents = await getAgents();
    const allBookings = await getBookings('owner', 'platform_owner', []);

    // Enrich each company with agent count, booking count, total sales
    const enriched = companies.map((c) => {
      const companyAgents = agents.filter((a) => a.companyId === c.id);
      const companyBookings = allBookings.filter((b) => b.companyId === c.id);
      const totalSales = companyBookings.reduce((sum, b) => sum + (b.costing?.totalAmount || 0), 0);
      const superAdmin = companyAgents.find((a) => a.role === 'super_admin');

      return {
        ...c,
        totalAgents: companyAgents.length,
        totalBookings: companyBookings.length,
        totalSales,
        superAdminStatus: superAdmin?.status || (c.status === 'approved' ? 'active' : c.status),
      };
    });

    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error('Owner getCompanies error:', error);
    return NextResponse.json({ error: 'Failed to fetch companies.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyOwnerAuth(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error || 'Unauthorized. CRM Owner access required.' }, { status: 401 });
    }

    const body = await req.json();
    const action = sanitizeInputString(body?.action, 30);
    const companyId = sanitizeInputString(body?.companyId, 60);
    const notes = body?.notes ? sanitizeInputString(body.notes, 500) : undefined;

    if (!companyId || !action) {
      return NextResponse.json({ error: 'companyId and action are required.' }, { status: 400 });
    }

    if (action === 'approve') {
      const res = await approveCompany(companyId, notes);
      return NextResponse.json(res);
    }

    if (action === 'reject') {
      const res = await rejectCompany(companyId, notes);
      return NextResponse.json(res);
    }

    if (action === 'suspend') {
      const res = await suspendCompany(companyId);
      return NextResponse.json(res);
    }

    if (action === 'reactivate') {
      const res = await reactivateCompany(companyId);
      return NextResponse.json(res);
    }

    if (action === 'delete') {
      const res = await deleteCompany(companyId);
      return NextResponse.json(res);
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Owner company action error:', error);
    return NextResponse.json({ error: 'Failed to execute company action.' }, { status: 500 });
  }
}

