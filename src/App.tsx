import { useRef, useState, type ComponentType, type FormEvent } from 'react'
import './App.css'
import {
  SparklesIcon,
  WrenchIcon,
  DocumentIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SendIcon,
} from './icons'

type TabId = 'pick' | 'build' | 'record'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

const tabs: Array<{ id: TabId; label: string; tag: string; Icon: ComponentType<{ className?: string }> }> = [
  { id: 'pick', label: 'Project Decider', tag: '01', Icon: SparklesIcon },
  { id: 'build', label: 'Build', tag: '02', Icon: WrenchIcon },
  { id: 'record', label: 'Record & Papers', tag: '03', Icon: DocumentIcon },
]

const intro: Record<TabId, string> = {
  pick: 'Tell me your budget, timeline, and interests — I will suggest a buildable, professor-friendly ECE project.',
  build: 'Ask me about wiring, code, or debugging and I will guide the build stage by stage.',
  record: 'Ask for VIT-format record sections or research papers and I will map them out.',
}

const placeholders: Record<TabId, string> = {
  pick: 'Describe your budget, timeline, and interests…',
  build: 'Ask for wiring, code, or debugging help…',
  record: 'Ask for record sections or paper references…',
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('pick')
  const [open, setOpen] = useState(true)

  return (
    <div className={open ? 'app shell' : 'app shell collapsed'}>
      <aside className="sidebar" aria-label="Tabs">
        <div className="brand">
          <img className="brand-mark" src="/logo.png" alt="" width={34} height={34} />
          <span className="brand-name">ECE Studio</span>
        </div>

        <nav role="tablist" aria-label="Workspace areas">
          {tabs.map(({ id, label, tag, Icon }) => (
            <button
              key={id}
              className={activeTab === id ? 'nav-item active' : 'nav-item'}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              title={label}
              onClick={() => setActiveTab(id)}
            >
              <Icon className="nav-icon" />
              <span className="nav-label">{label}</span>
              <span className="nav-tag">{tag}</span>
            </button>
          ))}
        </nav>

        <button
          className="toggle"
          type="button"
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <ChevronLeftIcon className="toggle-icon" /> : <ChevronRightIcon className="toggle-icon" />}
          <span className="nav-label">Collapse</span>
        </button>
      </aside>

      {/* key forces fresh chat state per tab */}
      <ChatPanel key={activeTab} tabId={activeTab} />
    </div>
  )
}

function ChatPanel({ tabId }: { tabId: TabId }) {
  const tab = tabs.find((t) => t.id === tabId)!
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  async function send(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const next = [...messages, { role: 'user', content: text } as Message]
    setMessages(next)
    setInput('')
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tab: tabId, messages: next }),
      })
      if (!res.ok) throw new Error()
      const data = (await res.json()) as { reply?: string }
      setMessages((m) => [...m, { role: 'assistant', content: data.reply ?? 'No response.' }])
    } catch {
      setError('Could not reach the assistant. Check the server and try again.')
    } finally {
      setLoading(false)
      requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight }))
    }
  }

  return (
    <main className="chat">
      <header className="chat-bar">
        <p className="chat-meta">FIELD / {tab.tag} — VIT CHENNAI ECE</p>
        <h1>{tab.label}</h1>
      </header>

      <div className="messages" ref={listRef} aria-live="polite">
        {messages.length === 0 && (
          <div className="empty" role="status">
            <tab.Icon className="empty-icon" />
            <p>{intro[tabId]}</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div className={`message ${message.role}`} key={`${tabId}-${index}`}>
            <span className="message-who">{message.role === 'assistant' ? 'senior' : 'you'}</span>
            <p>{message.content}</p>
          </div>
        ))}

        {loading && (
          <div className="message assistant" aria-live="polite">
            <span className="message-who">senior</span>
            <p className="typing"><span /><span /><span /></p>
          </div>
        )}

        {error && <p className="chat-error" role="alert">{error}</p>}
      </div>

      <form className="composer" onSubmit={send}>
        <input
          aria-label="Chat message"
          placeholder={placeholders[tabId]}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
        />
        <button type="submit" aria-label="Send" disabled={loading || !input.trim()}>
          <SendIcon className="send-icon" />
        </button>
      </form>
    </main>
  )
}

export default App
