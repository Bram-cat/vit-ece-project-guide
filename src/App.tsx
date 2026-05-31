import { useState, type ComponentType } from 'react'
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
  role: 'student' | 'ai'
  body: string
}

const tabs: Array<{ id: TabId; label: string; tag: string; Icon: ComponentType<{ className?: string }> }> = [
  { id: 'pick', label: 'Project Decider', tag: '01', Icon: SparklesIcon },
  { id: 'build', label: 'Build', tag: '02', Icon: WrenchIcon },
  { id: 'record', label: 'Record & Papers', tag: '03', Icon: DocumentIcon },
]

const starterMessages: Record<TabId, Message[]> = {
  pick: [
    { role: 'student', body: 'I need an ECE project that is cheap but professor-friendly.' },
    { role: 'ai', body: 'Try a Smart Transformer Health Monitor with ESP32. Suitability 88, likeability 91. Add live graphs and fault alerts to stand out.' },
  ],
  build: [
    { role: 'student', body: 'How do I assemble it without getting confused?' },
    { role: 'ai', body: 'Build in stages: temperature, then current, then voltage, then ESP32 Wi-Fi logging. Test each sensor alone first. Use low-voltage demo inputs only.' },
  ],
  record: [
    { role: 'student', body: 'Fit this to VIT record format and add papers.' },
    { role: 'ai', body: 'Sections: Aim, Abstract, Components, Block Diagram, Theory, Methodology, Algorithm, Results, Applications, Future Scope, References. I will map two IEEE papers to the right sections.' },
  ],
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
          <span className="brand-mark">VIT</span>
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

      <ChatPanel tabId={activeTab} />
    </div>
  )
}

function ChatPanel({ tabId }: { tabId: TabId }) {
  const messages = starterMessages[tabId]
  const tab = tabs.find((t) => t.id === tabId)!

  return (
    <main className="chat">
      <header className="chat-bar">
        <p className="chat-meta">FIELD / {tab.tag} — VIT CHENNAI ECE</p>
        <h1>{tab.label}</h1>
      </header>

      <div className="messages" aria-live="polite">
        {messages.map((message, index) => (
          <div className={`message ${message.role}`} key={`${tabId}-${index}`}>
            <span className="message-who">{message.role === 'ai' ? 'senior' : 'you'}</span>
            <p>{message.body}</p>
          </div>
        ))}
      </div>

      <form className="composer" onSubmit={(e) => e.preventDefault()}>
        <input aria-label="Chat message" placeholder={placeholders[tabId]} />
        <button type="submit" aria-label="Send">
          <SendIcon className="send-icon" />
        </button>
      </form>
    </main>
  )
}

export default App
