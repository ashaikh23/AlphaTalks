import { NextRequest, NextResponse } from 'next/server';
import { generationContexts, GenerationType } from '@/lib/generation-contexts';

export async function POST(request: NextRequest) {
  try {
    const { text, generation } = await request.json();

    if (!text || !generation) {
      return NextResponse.json(
        { error: 'Text and generation are required' },
        { status: 400 }
      );
    }

    if (!(generation in generationContexts)) {
      return NextResponse.json(
        { error: 'Invalid generation type' },
        { status: 400 }
      );
    }

    const apiKey = process.env.AZURE_API_KEY;
    const endpoint = process.env.AZURE_ENDPOINT;

    if (!apiKey || !endpoint) {
      return NextResponse.json(
        { error: 'Azure API configuration missing' },
        { status: 500 }
      );
    }

    const generationContext = generationContexts[generation as GenerationType];
    
    const prompt = `${generationContext}

Please translate the following marketing content to match the communication style of this generation. Maintain the core message while adapting the language, tone, and cultural references appropriately:

Original content: "${text}"

Translated content:`;

    const response = await fetch(endpoint + '?api-version=2024-05-01-preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 2048,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        model: 'grok-3'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Azure API Error:', errorText);
      return NextResponse.json(
        { error: 'Failed to translate content' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content || '';

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}