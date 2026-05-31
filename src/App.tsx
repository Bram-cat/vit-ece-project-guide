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

type TabConfig = {
  id: TabId
  label: string
  tag: string
  purpose: string
  status: string
  emptyTitle: string
  emptyBody: string
  placeholder: string
  options: string[]
  Icon: ComponentType<{ className?: string }>
}

const tabs: TabConfig[] = [
  {
    id: 'pick',
    label: 'Pick Project',
    tag: '01',
    purpose: 'Understand what you want, then search parts and papers before showing 3 project choices.',
    status: 'Asking constraints',
    emptyTitle: 'Start with your rough idea',
    emptyBody: 'You prompt first. The AI asks one question at a time, then checks the web for components, prices, papers, and feasibility.',
    placeholder: 'Example: I want an IoT project under ₹3000...',
    options: ['Low cost', 'Impressive demo', 'Research heavy', 'I am not sure'],
    Icon: SparklesIcon,
  },
  {
    id: 'build',
    label: 'Build Project',
    tag: '02',
    purpose: 'Guide one build stage at a time: buying, wiring, coding, testing, or debugging.',
    status: 'Waiting for build stage',
    emptyTitle: 'Use after choosing a project',
    emptyBody: 'Tell the AI where you are stuck. It should not dump the full build. It should guide the next practical step.',
    placeholder: 'Example: I have the ESP32 and sensors, help me wire them...',
    options: ['Buy parts', 'Wiring help', 'Code help', 'Debug an error'],
    Icon: WrenchIcon,
  },
  {
    id: 'record',
    label: 'Record & Papers',
    tag: '03',
    purpose: 'Create only the section you ask for, using VIT format and paper-backed references.',
    status: 'Choosing record output',
    emptyTitle: 'Ask for one record task',
    emptyBody: 'The AI should generate sections step by step: abstract, literature survey, diagram text, references, or export plan.',
    placeholder: 'Example: Make the abstract and aim for my transformer monitor...',
    options: ['Abstract only', 'Literature survey', 'Block diagram', 'IEEE references'],
    Icon: DocumentIcon,
  },
]

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

  async function sendText(rawText: string) {
    const text = rawText.trim()
    if (!text || loading) return

    const next: Message[] = [...messages, { role: 'user', content: text }]
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

  function send(e: FormEvent) {
    e.preventDefault()
    void sendText(input)
  }

  return (
    <main className="chat">
      <header className="chat-bar">
        <div>
          <p className="chat-meta">FIELD / {tab.tag} — VIT CHENNAI ECE</p>
          <h1>{tab.label}</h1>
          <p className="tab-purpose">{tab.purpose}</p>
        </div>
        <span className="status-chip">{loading ? 'Thinking' : tab.status}</span>
      </header>

      <div className="messages" ref={listRef} aria-live="polite">
        {messages.length === 0 && (
          <div className="empty" role="status">
            <tab.Icon className="empty-icon" />
            <h2>{tab.emptyTitle}</h2>
            <p>{tab.emptyBody}</p>
            <div className="quick-options" aria-label="Suggested starting points">
              {tab.options.map((option) => (
                <button key={option} type="button" onClick={() => void sendText(option)}>
                  {option}
                </button>
              ))}
            </div>
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
          placeholder={tab.placeholder}
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
