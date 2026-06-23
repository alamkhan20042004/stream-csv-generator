import { NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function POST(req: Request) {
  try {
    const { action, syncKey, data } = await req.json();
    
    if (!syncKey || syncKey.trim() === '') {
      return NextResponse.json({ success: false, error: 'Sync Key is required' }, { status: 400 });
    }

    // 🌟 Vercel ki nayi KV_REDIS_URL chabi istemal kar rahe hain
    const redis = createClient({
      url: process.env.KV_REDIS_URL
    });

    redis.on('error', (err) => console.error('Redis Client Error', err));
    
    // Connection open karein
    await redis.connect();

    const dbKey = `stream_config_${syncKey}`;

    if (action === 'save') {
      // Data ko string bana kar save karna parta hai naye Redis mein
      await redis.set(dbKey, JSON.stringify(data));
      await redis.disconnect(); // Kaam khatam hone par connection close
      return NextResponse.json({ success: true, message: 'Saved securely to Official Redis Cloud!' });
    } 
    
    if (action === 'load') {
      const savedData = await redis.get(dbKey);
      await redis.disconnect();
      return NextResponse.json({ 
        success: true, 
        data: savedData ? JSON.parse(savedData) : null 
      });
    }

    await redis.disconnect();
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error("Cloud Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}


















// =================


// import { NextResponse } from 'next/server';
// import { kv } from '@vercel/kv';

// export async function POST(req: Request) {
//   try {
//     const { action, syncKey, data } = await req.json();
    
//     if (!syncKey || syncKey.trim() === '') {
//       return NextResponse.json({ success: false, error: 'Sync Key is required' }, { status: 400 });
//     }

//     const dbKey = `stream_config_${syncKey}`;

//     if (action === 'save') {
//       await kv.set(dbKey, data);
//       return NextResponse.json({ success: true, message: 'Saved to Vercel Cloud!' });
//     } 
    
//     if (action === 'load') {
//       const savedData = await kv.get(dbKey);
//       return NextResponse.json({ success: true, data: savedData || [] });
//     }

//     return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
//   } catch (error: any) {
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }