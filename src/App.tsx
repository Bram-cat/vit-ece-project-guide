import { useState } from 'react'
import './App.css'

type TabId = 'pick' | 'build' | 'record'

type Message = {
  role: 'student' | 'ai'
  body: string
}

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'pick', label: 'Project Decider', icon: '◎' },
  { id: 'build', label: 'Build', icon: '⚙' },
  { id: 'record', label: 'Record & Papers', icon: '✎' },
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
  pick: 'Describe your budget, timeline, and interests...',
  build: 'Ask for wiring, code, or debugging help...',
  record: 'Ask for record sections or paper references...',
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('pick')
  const [open, setOpen] = useState(true)

  return (
    <div className={open ? 'app shell' : 'app shell collapsed'}>
      <ChatPanel tabId={activeTab} />

      <aside className="sidebar" aria-label="Tabs">
        <button
          className="toggle"
          type="button"
          aria-label={open ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? '›' : '‹'}
        </button>
        <nav role="tablist" aria-label="Workspace areas">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'nav-item active' : 'nav-item'}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              title={tab.label}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon" aria-hidden="true">{tab.icon}</span>
              <span className="nav-label">{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </div>
  )
}

function ChatPanel({ tabId }: { tabId: TabId }) {
  const messages = starterMessages[tabId]
  const title = tabs.find((tab) => tab.id === tabId)?.label

  return (
    <main className="chat">
      <header className="chat-bar">
        <h1>{title}</h1>
      </header>

      <div className="messages" aria-live="polite">
        {messages.map((message, index) => (
          <div className={`message ${message.role}`} key={`${tabId}-${index}`}>
            <p>{message.body}</p>
          </div>
        ))}
      </div>

      <form className="composer" onSubmit={(e) => e.preventDefault()}>
        <input aria-label="Chat message" placeholder={placeholders[tabId]} />
        <button type="submit" aria-label="Send">↑</button>
      </form>
    </main>
  )
}

export default App
