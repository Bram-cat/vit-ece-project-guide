import type { Plugin, Connect } from 'vite'

// System prompts per workspace tab (keeps each chat in role).
const systemPrompts: Record<string, string> = {
  pick: 'You are a senior VIT Chennai ECE student helping a junior pick a buildable, professor-friendly electronics project. Be concise. Suggest ideas with rough budget (INR), a suitability and professor-likeability sense, and one upgrade. Guide purchases from Indian vendors; never claim to buy.',
  build: 'You are a senior VIT Chennai ECE student guiding assembly, wiring, code, and debugging of an electronics project. Be concise and practical. Build in stages, test parts separately, and stress low-voltage demo safety.',
  record: 'You are a senior VIT Chennai ECE student helping write a VIT-format lab record and find supporting research papers. Be concise. Use the VIT section order and map papers to the right sections in IEEE style.',
}

const BASE_URL = 'https://opencode.ai/zen/v1'
const MODEL = 'deepseek-v4-flash-free'

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

// Vite dev plugin: server-side /api/chat proxy. The API key stays on the
// server and is never bundled into the client.
export function chatApi(): Plugin {
  return {
    name: 'opencode-chat-api',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end('Method Not Allowed')
        }

        const apiKey = process.env.OPENCODE_AI_API_KEY
        if (!apiKey) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          return res.end(JSON.stringify({ error: 'OPENCODE_AI_API_KEY is not set' }))
        }

        try {
          const { tab, messages } = JSON.parse(await readBody(req)) as {
            tab: string
            messages: Array<{ role: 'user' | 'assistant'; content: string }>
          }

          const upstream = await fetch(`${BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: MODEL,
              max_tokens: 3000,
              messages: [
                { role: 'system', content: systemPrompts[tab] ?? systemPrompts.pick },
                ...messages,
              ],
            }),
          })

          if (!upstream.ok) {
            res.statusCode = upstream.status
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({ error: `Upstream error ${upstream.status}` }))
          }

          const data = (await upstream.json()) as {
            choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>
          }
          const msg = data.choices?.[0]?.message
          const reply = (msg?.content?.trim() || msg?.reasoning_content?.trim()) ?? 'No response.'

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ reply }))
        } catch {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Request failed' }))
        }
      })
    },
  }
}
