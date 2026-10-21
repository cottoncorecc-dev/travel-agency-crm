import { NextRequest, NextResponse } from 'next/server';
import { getAgents, createAgent, updateAgent, deleteAgent } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get('companyId') || undefined;
    const agents = await getAgents(companyId);
    return NextResponse.json(agents);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch agents' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.username || !body.email) {
      return NextResponse.json({ error: 'Name, Username, and Email are required' }, { status: 400 });
    }
    const newAgent = await createAgent(body);
    return NextResponse.json(newAgent, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create agent' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }
    const updated = await updateAgent(body.id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update agent' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Agent ID required' }, { status: 400 });
    }
    const success = await deleteAgent(id);
    return NextResponse.json({ success });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete agent' }, { status: 500 });
  }
}
