import { NextRequest, NextResponse } from 'next/server';
import { getAgents, createAgent, updateAgent, deleteAgent } from '@/lib/db';
import { sanitizeAgents, sanitizeAgent, sanitizeInputString, isValidEmail, isValidUsername } from '@/lib/security';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawCompanyId = searchParams.get('companyId');
    const companyId = rawCompanyId ? sanitizeInputString(rawCompanyId, 60) : undefined;
    const agents = await getAgents(companyId);

    // Strip passwords before returning agent list
    return NextResponse.json(sanitizeAgents(agents));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = sanitizeInputString(body?.name, 100);
    const username = sanitizeInputString(body?.username, 35);
    const email = sanitizeInputString(body?.email, 120);
    const phone = sanitizeInputString(body?.phone, 30);
    const role = sanitizeInputString(body?.role || 'agent', 20) as any;
    const companyId = body?.companyId ? sanitizeInputString(body.companyId, 60) : undefined;
    const companyName = body?.companyName ? sanitizeInputString(body.companyName, 120) : undefined;
    const password = typeof body?.password === 'string' && body.password.length >= 6 ? body.password : 'password123';

    if (!name || !username || !email) {
      return NextResponse.json({ error: 'Name, Username, and Email are required' }, { status: 400 });
    }

    if (!isValidUsername(username)) {
      return NextResponse.json(
        { error: 'Username must contain only letters, numbers, underscores, dashes, or dots.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Please enter a valid work email address.' }, { status: 400 });
    }

    const newAgent = await createAgent({
      ...body,
      name,
      username,
      email,
      phone,
      role,
      companyId,
      companyName,
      password,
    });

    return NextResponse.json(sanitizeAgent(newAgent), { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create agent' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const id = sanitizeInputString(body?.id, 60);
    if (!id) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }
    const updated = await updateAgent(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    return NextResponse.json(sanitizeAgent(updated));
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update agent' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawId = searchParams.get('id');
    const id = rawId ? sanitizeInputString(rawId, 60) : null;
    if (!id) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }
    const success = await deleteAgent(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete agent' }, { status: 500 });
  }
}

