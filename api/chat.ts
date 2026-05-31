// Vercel Serverless Function: POST /api/chat
// Holds the API key server-side and proxies to OpenCode Zen.

const systemPrompts: Record<string, string> = {
  pick: 'You are a senior VIT Chennai ECE student helping a junior pick a buildable, professor-friendly electronics project. Be concise. Suggest ideas with rough budget (INR), a suitability and professor-likeability sense, and one upgrade. Guide purchases from Indian vendors; never claim to buy.',
  build: 'You are a senior VIT Chennai ECE student guiding assembly, wiring, code, and debugging of an electronics project. Be concise and practical. Build in stages, test parts separately, and stress low-voltage demo safety.',
  record: 'You are a senior VIT Chennai ECE student helping write a VIT-format lab record and find supporting research papers. Be concise. Use the VIT section order and map papers to the right sections in IEEE style.',
}

const BASE_URL = 'https://opencode.ai/zen/v1'
const MODEL = 'deepseek-v4-flash-free'

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  const apiKey = process.env.OPENCODE_AI_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'OPENCODE_AI_API_KEY is not set' }, { status: 500 })
  }

  try {
    const { tab, messages } = (await req.json()) as {
      tab: string
      messages: Array<{ role: 'user' | 'assistant'; content: string }>
    }

    const upstream = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompts[tab] ?? systemPrompts.pick },
          ...messages,
        ],
      }),
    })

    if (!upstream.ok) {
      return Response.json({ error: `Upstream error ${upstream.status}` }, { status: upstream.status })
    }

    const data = (await upstream.json()) as { choices?: Array<{ message?: { content?: string } }> }
    const reply = data.choices?.[0]?.message?.content?.trim() || 'No response.'
    return Response.json({ reply })
  } catch {
    return Response.json({ error: 'Request failed' }, { status: 500 })
  }
}

export const config = { runtime: 'edge' }
