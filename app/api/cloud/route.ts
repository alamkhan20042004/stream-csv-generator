import { NextResponse } from 'next/server';
import { createClient } from 'redis';

export async function POST(req: Request) {
  try {
    const { action, syncKey, data } = await req.json();
    
    // List action ke liye key ki zaroorat nahi
    if (action !== 'list' && (!syncKey || syncKey.trim() === '')) {
      return NextResponse.json({ success: false, error: 'Sync Key is required' }, { status: 400 });
    }

    const redis = createClient({
      url: process.env.KV_REDIS_URL
    });

    redis.on('error', (err) => console.error('Redis Client Error', err));
    await redis.connect();

    // 🌟 NAYA FEATURE: Saari profiles ki list lana (Baghair key show kiye)
    if (action === 'list') {
      const keys = await redis.keys('stream_config_*');
      const profiles = [];
      
      for (const k of keys) {
         const savedDataStr = await redis.get(k);
         if (savedDataStr) {
             const parsed = JSON.parse(savedDataStr);
             profiles.push({
                 actualKey: k.replace('stream_config_', ''),
                 rowsCount: parsed.rows?.length || 0,
                 urlsCount: parsed.masterUrls?.length || 0
             });
         }
      }
      await redis.disconnect();
      return NextResponse.json({ success: true, data: profiles });
    }

    const dbKey = `stream_config_${syncKey}`;

    if (action === 'save') {
      await redis.set(dbKey, JSON.stringify(data));
      await redis.disconnect();
      return NextResponse.json({ success: true, message: 'Saved securely to Official Redis Cloud!' });
    } 
    
    if (action === 'load') {
      const savedData = await redis.get(dbKey);
      await redis.disconnect();
      return NextResponse.json({ success: true, data: savedData ? JSON.parse(savedData) : null });
    }

    if (action === 'delete') {
      await redis.del(dbKey);
      await redis.disconnect();
      return NextResponse.json({ success: true, message: 'Deleted from Cloud successfully!' });
    }

    await redis.disconnect();
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error("Cloud Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}






// 2

// import { NextResponse } from 'next/server';
// import { createClient } from 'redis';

// export async function POST(req: Request) {
//   try {
//     const { action, syncKey, data } = await req.json();
    
//     if (!syncKey || syncKey.trim() === '') {
//       return NextResponse.json({ success: false, error: 'Sync Key is required' }, { status: 400 });
//     }

//     const redis = createClient({
//       url: process.env.KV_REDIS_URL
//     });

//     redis.on('error', (err) => console.error('Redis Client Error', err));
//     await redis.connect();

//     const dbKey = `stream_config_${syncKey}`;

//     if (action === 'save') {
//       await redis.set(dbKey, JSON.stringify(data));
//       await redis.disconnect();
//       return NextResponse.json({ success: true, message: 'Saved securely to Official Redis Cloud!' });
//     } 
    
//     if (action === 'load') {
//       const savedData = await redis.get(dbKey);
//       await redis.disconnect();
//       return NextResponse.json({ 
//         success: true, 
//         data: savedData ? JSON.parse(savedData) : null 
//       });
//     }

//     // 🌟 NAYA FEATURE: Cloud se permanently delete karna
//     if (action === 'delete') {
//       await redis.del(dbKey);
//       await redis.disconnect();
//       return NextResponse.json({ success: true, message: 'Deleted from Cloud successfully!' });
//     }

//     await redis.disconnect();
//     return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

//   } catch (error: any) {
//     console.error("Cloud Error:", error);
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }

























// ================= done ===================


// import { NextResponse } from 'next/server';
// import { createClient } from 'redis';

// export async function POST(req: Request) {
//   try {
//     const { action, syncKey, data } = await req.json();
    
//     if (!syncKey || syncKey.trim() === '') {
//       return NextResponse.json({ success: false, error: 'Sync Key is required' }, { status: 400 });
//     }

//     // 🌟 Vercel ki nayi KV_REDIS_URL chabi istemal kar rahe hain
//     const redis = createClient({
//       url: process.env.KV_REDIS_URL
//     });

//     redis.on('error', (err) => console.error('Redis Client Error', err));
    
//     // Connection open karein
//     await redis.connect();

//     const dbKey = `stream_config_${syncKey}`;

//     if (action === 'save') {
//       // Data ko string bana kar save karna parta hai naye Redis mein
//       await redis.set(dbKey, JSON.stringify(data));
//       await redis.disconnect(); // Kaam khatam hone par connection close
//       return NextResponse.json({ success: true, message: 'Saved securely to Official Redis Cloud!' });
//     } 
    
//     if (action === 'load') {
//       const savedData = await redis.get(dbKey);
//       await redis.disconnect();
//       return NextResponse.json({ 
//         success: true, 
//         data: savedData ? JSON.parse(savedData) : null 
//       });
//     }

//     await redis.disconnect();
//     return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });

//   } catch (error: any) {
//     console.error("Cloud Error:", error);
//     return NextResponse.json({ success: false, error: error.message }, { status: 500 });
//   }
// }










