import { useState, useEffect } from 'react'
import { Save, Eye, EyeOff, CheckCircle, Cpu, Cloud } from 'lucide-react'
import styles from './Settings.module.css'

export default function Settings() {
  const [keys, setKeys] = useState({ openai: '', anthropic: '' })
  const [show, setShow] = useState({ openai: false, anthropic: false })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setKeys({
      openai: localStorage.getItem('clipai_openai_key') || '',
      anthropic: localStorage.getItem('clipai_anthropic_key') || '',
    })
  }, [])

  const save = () => {
    localStorage.setItem('clipai_openai_key', keys.openai)
    localStorage.setItem('clipai_anthropic_key', keys.anthropic)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>API Keys</h1>
      <p className={styles.sub}>
        Required only for <strong>Cloud mode</strong>. If you're using <strong>Local mode</strong> (faster-whisper + Ollama), you don't need any API keys.
      </p>

      <div className={styles.modeCards}>
        <div className={`${styles.modeCard} ${styles.modeCloud}`}>
          <Cloud size={18} color="var(--accent)" />
          <div>
            <div className={styles.modeTitle}>Cloud Mode</div>
            <div className={styles.modeSub}>OpenAI Whisper + Anthropic Claude. Fast, accurate, costs ~$0.10–0.50 per video. Requires API keys below.</div>
          </div>
        </div>
        <div className={`${styles.modeCard} ${styles.modeLocal}`}>
          <Cpu size={18} color="var(--accent3)" />
          <div>
            <div className={styles.modeTitle}>Local Mode</div>
            <div className={styles.modeSub}>faster-whisper + Ollama. 100% free, runs on your machine. No API keys needed. Select in New Project.</div>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.field}>
          <label className={styles.label}>
            OpenAI API Key
            <span className={styles.badge}>Whisper · Cloud only</span>
          </label>
          <div className={styles.inputRow}>
            <input
              type={show.openai ? 'text' : 'password'}
              value={keys.openai}
              onChange={e => setKeys(k => ({ ...k, openai: e.target.value }))}
              placeholder="sk-..."
              className={styles.input}
            />
            <button className={styles.eyeBtn} onClick={() => setShow(s => ({ ...s, openai: !s.openai }))}>
              {show.openai ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className={styles.link}>
            Get your OpenAI API key →
          </a>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>
            Anthropic API Key
            <span className={styles.badge}>Claude · Cloud only</span>
          </label>
          <div className={styles.inputRow}>
            <input
              type={show.anthropic ? 'text' : 'password'}
              value={keys.anthropic}
              onChange={e => setKeys(k => ({ ...k, anthropic: e.target.value }))}
              placeholder="sk-ant-..."
              className={styles.input}
            />
            <button className={styles.eyeBtn} onClick={() => setShow(s => ({ ...s, anthropic: !s.anthropic }))}>
              {show.anthropic ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <a href="https://console.anthropic.com/keys" target="_blank" rel="noreferrer" className={styles.link}>
            Get your Anthropic API key →
          </a>
        </div>

        <button className={styles.saveBtn} onClick={save}>
          {saved ? <><CheckCircle size={15} /> Saved!</> : <><Save size={15} /> Save Keys</>}
        </button>
      </div>

      <div className={styles.infoCard}>
        <strong>Privacy:</strong> Keys are stored only in your browser's localStorage. They are sent directly
        to OpenAI and Anthropic when processing — this app's backend never logs or stores them.
      </div>

      <div className={styles.localGuide}>
        <h2 className={styles.subheading}>Local Mode Setup</h2>

        <div className={styles.guideStep}>
          <span className={styles.stepNum}>1</span>
          <div>
            <div className={styles.stepTitle}>Install faster-whisper (transcription)</div>
            <code className={styles.code}>pip install faster-whisper</code>
            <div className={styles.stepNote}>
              Models download automatically on first use. Recommended: <code>base</code> (fast) or <code>small</code> (better accuracy).
            </div>
          </div>
        </div>

        <div className={styles.guideStep}>
          <span className={styles.stepNum}>2</span>
          <div>
            <div className={styles.stepTitle}>Install Ollama (viral detection)</div>
            <a href="https://ollama.com/download" target="_blank" rel="noreferrer" className={styles.link}>
              Download Ollama → ollama.com/download
            </a>
          </div>
        </div>

        <div className={styles.guideStep}>
          <span className={styles.stepNum}>3</span>
          <div>
            <div className={styles.stepTitle}>Pull a model and start Ollama</div>
            <code className={styles.code}>ollama pull llama3.1</code>
            <code className={styles.code}>ollama serve</code>
            <div className={styles.stepNote}>
              Good models for this task: <code>llama3.1</code> (best), <code>mistral</code>, <code>gemma2</code>.
              Larger models give better viral detection but need more RAM.
            </div>
          </div>
        </div>

        <div className={styles.guideStep}>
          <span className={styles.stepNum}>4</span>
          <div>
            <div className={styles.stepTitle}>Select "Local" in New Project</div>
            <div className={styles.stepNote}>
              Go to New Project, switch to Local mode, choose your Whisper model size and Ollama model.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
