import { NextRequest, NextResponse } from 'next/server';
import { authenticateOwner } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passcode, username, password } = body;

    const credential = passcode || password || '';
    if (!credential) {
      return NextResponse.json(
        { error: 'Please enter CRM Owner access credentials.' },
        { status: 400 }
      );
    }

    const result = await authenticateOwner(credential);

    if (!result.success || !result.session) {
      return NextResponse.json(
        { error: result.error || 'Invalid CRM Owner credentials.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      token: result.session.token,
      agent: result.session.agent,
    });
  } catch (error: any) {
    console.error('Owner login error:', error);
    return NextResponse.json({ error: 'Authentication failed.' }, { status: 500 });
  }
}
