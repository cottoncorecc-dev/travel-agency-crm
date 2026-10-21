import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseStatus } from '@/lib/db';
import { testAndSetMongoUri, getActiveMongoUri } from '@/lib/mongodb';

export async function GET() {
  try {
    const status = await getDatabaseStatus();
    return NextResponse.json({
      ...status,
      activeUri: getActiveMongoUri() ? 'Configured (Active)' : 'Not Set (Using Document Store)',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Database status error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uri } = body;

    const result = await testAndSetMongoUri(uri);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    const updatedStatus = await getDatabaseStatus();
    return NextResponse.json({
      success: true,
      status: updatedStatus,
      message: 'MongoDB connection established successfully and synced.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error updating MongoDB URI' }, { status: 500 });
  }
}
