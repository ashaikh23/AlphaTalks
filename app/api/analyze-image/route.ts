import { NextRequest, NextResponse } from 'next/server';
import { generationContexts, GenerationType } from '@/lib/generation-contexts';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const generation = formData.get('generation') as string;

    if (!file || !generation) {
      return NextResponse.json(
        { error: 'Image and generation are required' },
        { status: 400 }
      );
    }

    if (!(generation in generationContexts)) {
      return NextResponse.json(
        { error: 'Invalid generation type' },
        { status: 400 }
      );
    }

    const openaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const openaiKey = process.env.AZURE_OPENAI_KEY;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

    if (!openaiEndpoint || !openaiKey || !deployment) {
      return NextResponse.json(
        { error: 'Azure OpenAI configuration missing' },
        { status: 500 }
      );
    }

    // Convert image to base64
    const bytes = await file.arrayBuffer();
    const base64Image = Buffer.from(bytes).toString('base64');
    const mimeType = file.type;

    const generationContext = generationContexts[generation as GenerationType];
    
    const prompt = `${generationContext}

Please analyze this image and:
1. Extract ALL text content from the image
2. Translate the extracted content to match the communication style of this generation
3. Maintain the core marketing message while adapting the language, tone, and cultural references appropriately

Format your response as:
**Original Text:**
[extracted text here]

**Translated Text:**
[translated text here]`;

    const url = `${openaiEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=2025-01-01-preview`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': openaiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_completion_tokens: 2048,
        temperature: 1,
        model: deployment
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure OpenAI Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to analyze image' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ result });
  } catch (error) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}