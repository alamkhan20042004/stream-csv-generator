import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // 🌟 Multiple images aur custom prompt receive kar rahe hain
    const { imagesBase64, customDate, customPrompt } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is missing' }, { status: 500 });
    }

    if (!imagesBase64 || imagesBase64.length === 0) {
      return NextResponse.json({ success: false, error: 'No images provided' }, { status: 400 });
    }

    // 1️⃣ CHECK AVAILABLE MODELS
    const modelsRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const modelsData = await modelsRes.json();
    
    if (!modelsData.models) {
      return NextResponse.json({ success: false, error: 'API Key is invalid or restricted.' }, { status: 500 });
    }

    const availableNames = modelsData.models.map((m: any) => m.name);
    let selectedModel = '';

    if (availableNames.includes('models/gemini-1.5-flash')) {
      selectedModel = 'gemini-1.5-flash';
    } else if (availableNames.includes('models/gemini-1.5-pro')) {
      selectedModel = 'gemini-1.5-pro';
    } else {
      const backup = availableNames.find((m: any) => m.includes('flash') || (m.includes('pro') && !m.includes('vision')));
      selectedModel = backup ? backup.replace('models/', '') : 'gemini-1.5-flash';
    }

    // 2️⃣ DYNAMIC INSTRUCTIONS
    const dateInstruction = customDate && customDate.trim() !== '' 
        ? `Explicitly use this exact date and time for all matches: "${customDate}".` 
        : `If a date like '+1 day' or 'Tomorrow' is shown, assume today is ${new Date().toISOString().split('T')[0]} and calculate it.`;

    const userSpecificInstruction = customPrompt && customPrompt.trim() !== ''
        ? `USER SPECIFIC INSTRUCTION (MUST FOLLOW): ${customPrompt}`
        : '';

    // 3️⃣ PROMPT FOR DASHBOARD
    const prompt = `You are an expert sports data extractor. Look at ALL the provided images containing sports fixtures. Combine scattered data if necessary.
    ${dateInstruction}
    ${userSpecificInstruction}
    
    Extract the schedule into a STRICT JSON array of objects.
    DO NOT return markdown formatting, backticks, or any conversational text. ONLY return the raw JSON array.
    
    Required format for EACH object in the array:
    {
      "channelId": "Team A vs Team B",
      "overrideTime": "YYYY-MM-DDTHH:mm",
      "targetServer": "None",
      "quality": "Original (1080p Max)",
      "duration": "3h"
    }`;

    // 4️⃣ PREPARE MULTIPLE IMAGES FOR GEMINI
    const imageParts = imagesBase64.map((base64: string) => ({
      inline_data: { mime_type: "image/png", data: base64.split(',')[1] }
    }));

    // 5️⃣ DIRECT REST API CALL
    const generateRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            ...imageParts // 🌟 All images injected here
          ]
        }]
      })
    });

    const generateData = await generateRes.json();

    if (generateData.error) {
      return NextResponse.json({ success: false, error: generateData.error.message }, { status: 500 });
    }

    const responseText = generateData.candidates[0].content.parts[0].text;
    
    // 6️⃣ BULLETPROOF JSON CLEANER
    const cleanedText = responseText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    const startIndex = cleanedText.indexOf('[');
    const endIndex = cleanedText.lastIndexOf(']');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error("No JSON array found in response. Ensure the image has clear text.");
    }
    
    const matchesArray = JSON.parse(cleanedText.substring(startIndex, endIndex + 1));

    return NextResponse.json({ success: true, data: matchesArray, usedModel: selectedModel });
    
  } catch (error: any) {
    console.error("Custom AI Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}