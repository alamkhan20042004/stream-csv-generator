import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function POST(req: Request) {
  try {
    const { action, syncKey, data } = await req.json();
    
    if (!syncKey || syncKey.trim() === '') {
      return NextResponse.json({ success: false, error: 'Sync Key is required' }, { status: 400 });
    }

    const dbKey = `stream_config_${syncKey}`;

    if (action === 'save') {
      await kv.set(dbKey, data);
      return NextResponse.json({ success: true, message: 'Saved to Vercel Cloud!' });
    } 
    
    if (action === 'load') {
      const savedData = await kv.get(dbKey);
      return NextResponse.json({ success: true, data: savedData || [] });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}