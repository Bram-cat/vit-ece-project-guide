// Vercel Serverless Function: POST /api/chat
// Holds the API key server-side and proxies to OpenCode Zen.

type ChatTab = 'pick' | 'build' | 'record'

type IncomingMessage = {
  role: 'user' | 'assistant'
  content: string
}

const sharedRules = `
You are inside a simple VIT Chennai ECE project helper web app.
Never dump everything you know.
Ask exactly one question at a time until you and the student share enough understanding.
When asking a question, give 3 to 5 numbered options.
Keep replies under 120 words unless the user asks for detail.
Prefer intuitive suggestions over lectures.
If enough constraints are known, say what you will check next instead of asking redundant questions.
Do not claim you purchased anything.
`.
  trim()

const systemPrompts: Record<ChatTab, string> = {
  pick: `${sharedRules}
Purpose of this tab: help the student pick one buildable, professor-friendly ECE project.
Flow: understand goal one question at a time, then search/validate components, prices, vendor links, papers, and examples before suggesting projects.
Only after enough constraints, return exactly 3 compact project options with title, cost range, suitability, professor likeability, key part sources, paper availability, and one upgrade.
Good questions: budget, timeline, preferred ECE area, skill level, professor goal.`,
  build: `${sharedRules}
Purpose of this tab: guide the selected project through buying, wiring, code, testing, and debugging.
If no selected project is clear, ask the student to name or paste the chosen project first.
Ask what stage they are in: buying parts, wiring, coding, testing, or stuck with an error.
Give only the next practical step, with safety warnings for low-voltage demo work.`,
  record: `${sharedRules}
Purpose of this tab: create VIT-format record work and paper support for the selected project.
If no selected project is clear, ask the student to name or paste the chosen project first.
Ask which output they need: abstract, aim, literature survey, diagram explanation, references, or export plan.
Generate one section at a time and map papers to record sections in IEEE style.`,
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
      tab: ChatTab
      messages: IncomingMessage[]
    }

    const upstream = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        temperature: 0.35,
        messages: [
          { role: 'system', content: systemPrompts[tab] ?? systemPrompts.pick },
          ...messages,
        ],
      }),
    })

    if (!upstream.ok) {
      return Response.json({ error: `Upstream error ${upstream.status}` }, { status: upstream.status })
    }

    const data = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>
    }
    const msg = data.choices?.[0]?.message
    const reply = (msg?.content?.trim() || msg?.reasoning_content?.trim()) ?? 'No response.'
    return Response.json({ reply })
  } catch {
    return Response.json({ error: 'Request failed' }, { status: 500 })
  }
}

export const config = { runtime: 'edge' }
