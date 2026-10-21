import { NextRequest, NextResponse } from 'next/server';
import { getClients, createClient, updateClient, deleteClient } from '@/lib/db';
import { UserRole } from '@/types/crm';
import { sanitizeInputString, isValidEmail } from '@/lib/security';

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

    const clients = await getClients(role, agentId, teamMembers, companyId);
    return NextResponse.json(clients);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch clients' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = sanitizeInputString(body?.name, 100);
    const phone = sanitizeInputString(body?.phone, 30);
    const whatsapp = sanitizeInputString(body?.whatsapp || body?.phone, 30);
    const email = sanitizeInputString(body?.email, 120);
    const passportNumber = sanitizeInputString(body?.passportNumber, 50);
    const nationality = sanitizeInputString(body?.nationality || 'British', 50);
    const companyId = body?.companyId ? sanitizeInputString(body.companyId, 60) : undefined;
    const assignedAgentId = body?.assignedAgentId ? sanitizeInputString(body.assignedAgentId, 60) : undefined;
    const assignedAgentName = body?.assignedAgentName ? sanitizeInputString(body.assignedAgentName, 100) : undefined;
    const notes = body?.notes ? sanitizeInputString(body.notes, 500) : undefined;

    if (!name || !phone) {
      return NextResponse.json({ error: 'Client Name and Contact Phone are required.' }, { status: 400 });
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
    }

    const newClient = await createClient({
      name,
      phone,
      whatsapp,
      email,
      passportNumber,
      nationality,
      companyId,
      assignedAgentId,
      assignedAgentName,
      notes,
    });

    return NextResponse.json(newClient, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = sanitizeInputString(body?.id, 60);
    if (!id) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
    }

    const updated = await updateClient(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update client' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get('id');
    const id = rawId ? sanitizeInputString(rawId, 60) : null;
    if (!id) {
      return NextResponse.json({ error: 'Client ID required' }, { status: 400 });
    }
    const success = await deleteClient(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete client' }, { status: 500 });
  }
}


