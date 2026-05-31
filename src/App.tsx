import { useMemo, useState } from 'react'
import './App.css'

type TabId = 'pick' | 'build' | 'record'

type Message = {
  role: 'student' | 'ai'
  body: string
}

type Project = {
  title: string
  domain: string
  budget: string
  suitability: number
  likeability: number
  upgrades: string[]
  parts: Array<{ name: string; source: string; note: string }>
  papers: Array<{ title: string; use: string }>
}

const tabs: Array<{ id: TabId; label: string; eyebrow: string }> = [
  { id: 'pick', label: 'Pick Project', eyebrow: 'ideas + scores + buy links' },
  { id: 'build', label: 'Build Project', eyebrow: 'assembly + code + debug' },
  { id: 'record', label: 'Record & Papers', eyebrow: 'VIT format + citations' },
]

const workspace: Project = {
  title: 'Smart Transformer Health Monitor',
  domain: 'IoT + Embedded Systems + Power Electronics',
  budget: '₹2,400 to ₹3,800 prototype range',
  suitability: 88,
  likeability: 91,
  upgrades: [
    'Add ESP32 cloud logging so the demo shows live voltage, current, and temperature trends.',
    'Use threshold alerts plus a simple anomaly explanation to make the idea feel less like a sensor demo.',
    'Include one IEEE-backed transformer monitoring paper in the literature survey.',
  ],
  parts: [
    { name: 'ESP32 DevKit', source: 'Robu.in / Amazon India', note: 'Check 30-pin board and USB cable type before buying.' },
    { name: 'ACS712 current sensor', source: 'ElectronicsComp / Robu.in', note: 'Pick current range based on demo load.' },
    { name: 'DS18B20 temperature probe', source: 'QuartzComponents / Amazon India', note: 'Waterproof probe is easier to mount safely.' },
    { name: 'Breadboard, jumpers, resistors', source: 'Blinkit / local Chennai electronics shop', note: 'Good for urgent basics, verify quantity.' },
  ],
  papers: [
    { title: 'IoT based transformer health monitoring system', use: 'Supports introduction, methodology, and future scope.' },
    { title: 'Condition monitoring techniques for power transformers', use: 'Supports literature survey and theory section.' },
  ],
}

const starterMessages: Record<TabId, Message[]> = {
  pick: [
    { role: 'student', body: 'I need an ECE project that is not too costly but my professor should like it.' },
    { role: 'ai', body: 'Start with IoT + embedded monitoring. It is buildable, has clear ECE theory, and supports a strong record. I recommend Smart Transformer Health Monitor with ESP32.' },
    { role: 'ai', body: 'Suitability: 88. Professor Likeability: 91. Main upgrade: show live graphs and fault alerts instead of only sensor readings.' },
  ],
  build: [
    { role: 'student', body: 'How do I assemble this without getting confused?' },
    { role: 'ai', body: 'Build in stages: first read temperature, then current, then voltage, then connect ESP32 Wi-Fi logging. Test each sensor separately before combining.' },
    { role: 'ai', body: 'Safety note: use low-voltage demo inputs for college prototype testing. Do not connect directly to mains transformer lines.' },
  ],
  record: [
    { role: 'student', body: 'Make this fit VIT record format and add papers.' },
    { role: 'ai', body: 'Record pack sections: Aim, Abstract, Components, Block Diagram, Circuit Explanation, Theory, Methodology, Algorithm, Code Explanation, Results, Applications, Future Scope, References.' },
    { role: 'ai', body: 'I found papers for literature survey and methodology. Each reference will include title, link/DOI when available, summary, and where it belongs in the record.' },
  ],
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('pick')
  const activeMessages = useMemo(() => starterMessages[activeTab], [activeTab])

  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="page-title">
        <div className="hero-copy">
          <p className="kicker">VIT Chennai ECE project companion</p>
          <h1 id="page-title">Pick a project, build it, finish the record.</h1>
          <p className="hero-text">
            A chat-first workspace for finding professor-friendly ECE projects, buying the right parts,
            assembling safely, and writing VIT-format records with research papers.
          </p>
        </div>
        <div className="workspace-card" aria-label="Current project workspace">
          <span className="workspace-label">Active Project Workspace</span>
          <h2>{workspace.title}</h2>
          <p>{workspace.domain}</p>
          <div className="score-grid">
            <Score label="Suitability" value={workspace.suitability} />
            <Score label="Professor likeability" value={workspace.likeability} />
          </div>
        </div>
      </section>

      <section className="tabs-panel" aria-label="Project workflow tabs">
        <div className="tab-list" role="tablist" aria-label="Workspace areas">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? 'tab active' : 'tab'}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
              <small>{tab.eyebrow}</small>
            </button>
          ))}
        </div>

        <div className="workspace-layout">
          <ChatPanel tabId={activeTab} messages={activeMessages} />
          <InsightPanel tabId={activeTab} project={workspace} />
        </div>
      </section>
    </main>
  )
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="score">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  )
}

function ChatPanel({ tabId, messages }: { tabId: TabId; messages: Message[] }) {
  const placeholder = {
    pick: 'Ask: I have 4 weeks and ₹3000, suggest a VIT ECE project...',
    build: 'Ask: explain wiring step by step for ESP32 and sensors...',
    record: 'Ask: draft aim, abstract, and literature survey in VIT format...',
  }[tabId]

  return (
    <article className="chat-panel">
      <div className="chat-heading">
        <p className="kicker">chat mode</p>
        <h2>{tabs.find((tab) => tab.id === tabId)?.label}</h2>
      </div>
      <div className="messages" aria-live="polite">
        {messages.map((message, index) => (
          <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
            <span>{message.role === 'ai' ? 'AI senior' : 'Student'}</span>
            <p>{message.body}</p>
          </div>
        ))}
      </div>
      <form className="composer">
        <input aria-label="Chat message" placeholder={placeholder} />
        <button type="button">Send</button>
      </form>
    </article>
  )
}

function InsightPanel({ tabId, project }: { tabId: TabId; project: Project }) {
  if (tabId === 'build') {
    return (
      <aside className="insight-panel">
        <PanelHeader title="Assembly plan" />
        <ol className="steps">
          <li>Test ESP32 upload and serial monitor.</li>
          <li>Read each sensor separately with sample code.</li>
          <li>Combine sensor readings and calibrate thresholds.</li>
          <li>Add dashboard logging and final demo script.</li>
        </ol>
      </aside>
    )
  }

  if (tabId === 'record') {
    return (
      <aside className="insight-panel">
        <PanelHeader title="Papers mapped to record" />
        <div className="paper-list">
          {project.papers.map((paper) => (
            <div className="paper" key={paper.title}>
              <strong>{paper.title}</strong>
              <p>{paper.use}</p>
            </div>
          ))}
        </div>
      </aside>
    )
  }

  return (
    <aside className="insight-panel">
      <PanelHeader title="Buy links preview" />
      <div className="part-list">
        {project.parts.map((part) => (
          <div className="part" key={part.name}>
            <div>
              <strong>{part.name}</strong>
              <p>{part.note}</p>
            </div>
            <span>{part.source}</span>
          </div>
        ))}
      </div>
      <div className="upgrade-box">
        <strong>Upgrade suggestion</strong>
        <p>{project.upgrades[0]}</p>
      </div>
    </aside>
  )
}

function PanelHeader({ title }: { title: string }) {
  return (
    <div className="panel-heading">
      <p className="kicker">workspace intelligence</p>
      <h2>{title}</h2>
    </div>
  )
}

export default App
