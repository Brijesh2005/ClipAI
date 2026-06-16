import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Youtube, Settings2, AlertCircle, Cloud, Cpu, ChevronDown, ChevronUp, Info } from 'lucide-react'
import { createJob, checkHealth } from '../lib/api'
import ProgressModal from '../components/ProgressModal'
import styles from './NewProject.module.css'

const WHISPER_MODELS = [
  { value: 'tiny',     label: 'Tiny',     note: '~1 GB RAM · fastest' },
  { value: 'base',     label: 'Base',     note: '~1 GB RAM · recommended' },
  { value: 'small',    label: 'Small',    note: '~2 GB RAM · better accuracy' },
  { value: 'medium',   label: 'Medium',   note: '~5 GB RAM · high accuracy' },
  { value: 'large-v3', label: 'Large v3', note: '~10 GB RAM · best (GPU recommended)' },
]

const OLLAMA_MODELS = [
  { value: 'llama3.1',  label: 'Llama 3.1 8B',   note: 'Recommended · good JSON output' },
  { value: 'mistral',   label: 'Mistral 7B',       note: 'Fast · decent quality' },
  { value: 'gemma2',    label: 'Gemma 2 9B',       note: 'Good at structured output' },
  { value: 'llama3.1:70b', label: 'Llama 3.1 70B', note: 'Best quality · needs 48 GB RAM' },
]

export default function NewProject() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [mode, setMode] = useState('cloud')          // 'cloud' | 'local'
  const [clipDuration, setClipDuration] = useState(45)
  const [numClips, setNumClips] = useState(5)
  const [addCaptions, setAddCaptions] = useState(true)
  const [whisperModel, setWhisperModel] = useState('base')
  const [ollamaModel, setOllamaModel] = useState('llama3.1')
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [jobId, setJobId] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    checkHealth()
      .then(r => setHealth(r.data))
      .catch(() => {})
  }, [])

  const getKeys = () => ({
    openai: localStorage.getItem('clipai_openai_key') || '',
    anthropic: localStorage.getItem('clipai_anthropic_key') || '',
  })

  const submit = async () => {
    setError('')
    if (!url.trim()) return setError('Please enter a YouTube URL.')

    if (mode === 'cloud') {
      const { openai, anthropic } = getKeys()
      if (!openai) return setError('OpenAI API key missing. Go to API Keys settings.')
      if (!anthropic) return setError('Anthropic API key missing. Go to API Keys settings.')
    }

    setLoading(true)
    try {
      const { openai, anthropic } = getKeys()
      const res = await createJob({
        youtube_url: url.trim(),
        clip_duration: clipDuration,
        num_clips: numClips,
        add_captions: addCaptions,
        mode,
        openai_api_key: openai,
        anthropic_api_key: anthropic,
        local_whisper_model: whisperModel,
        ollama_model: ollamaModel,
        ollama_url: ollamaUrl,
      })
      setJobId(res.data.job_id)
    } catch (e) {
      setError(e.response?.data?.detail || e.message)
      setLoading(false)
    }
  }

  const handleDone = (job) => navigate(`/projects/${job.id}`)
  const handleError = (msg) => { setJobId(null); setLoading(false); setError(`Processing failed: ${msg}`) }

  const localOk = health?.local?.faster_whisper_installed && health?.local?.ollama?.running
  const ollamaModels = health?.local?.ollama?.models || []

  const durations = [15, 30, 45, 60, 90]
  const counts = [3, 5, 10]

  return (
    <div className={styles.page}>
      {jobId && <ProgressModal jobId={jobId} onDone={handleDone} onError={handleError} />}

      <h1 className={styles.heading}>New Project</h1>
      <p className={styles.sub}>Paste a YouTube URL and ClipAI will extract the most viral moments.</p>

      <div className={styles.card}>

        {/* URL INPUT */}
        <div className={styles.urlSection}>
          <Youtube size={20} color="#ff4444" />
          <input
            className={styles.urlInput}
            type="text"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            onKeyDown={e => e.key === 'Enter' && submit()}
          />
        </div>

        <div className={styles.divider} />

        {/* MODE TOGGLE */}
        <div className={styles.modeRow}>
          <button
            className={`${styles.modeBtn} ${mode === 'cloud' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('cloud')}
          >
            <Cloud size={15} />
            <div>
              <div className={styles.modeBtnTitle}>Cloud Mode</div>
              <div className={styles.modeBtnSub}>OpenAI Whisper + Claude API</div>
            </div>
            {mode === 'cloud' && <div className={styles.modeDot} />}
          </button>

          <button
            className={`${styles.modeBtn} ${mode === 'local' ? styles.modeBtnActive : ''}`}
            onClick={() => setMode('local')}
          >
            <Cpu size={15} />
            <div>
              <div className={styles.modeBtnTitle}>Local Mode</div>
              <div className={styles.modeBtnSub}>faster-whisper + Ollama · no API keys</div>
            </div>
            {mode === 'local' && <div className={styles.modeDot} />}
          </button>
        </div>

        {/* CLOUD INFO */}
        {mode === 'cloud' && (
          <div className={styles.infoBox}>
            <Info size={13} />
            Uses your OpenAI key for Whisper transcription and Anthropic key for Claude viral detection.
            Add keys in <a href="/settings" className={styles.infoLink}>API Keys →</a>
          </div>
        )}

        {/* LOCAL STATUS */}
        {mode === 'local' && (
          <div className={styles.localStatus}>
            <div className={styles.localCheck}>
              <span className={`${styles.dot} ${health?.local?.faster_whisper_installed ? styles.dotGreen : styles.dotRed}`} />
              <span>faster-whisper</span>
              {!health?.local?.faster_whisper_installed && (
                <code className={styles.installCmd}>pip install faster-whisper</code>
              )}
            </div>
            <div className={styles.localCheck}>
              <span className={`${styles.dot} ${health?.local?.ollama?.running ? styles.dotGreen : styles.dotRed}`} />
              <span>Ollama</span>
              {!health?.local?.ollama?.running && (
                <a href="https://ollama.com" target="_blank" rel="noreferrer" className={styles.infoLink}>
                  Install Ollama →
                </a>
              )}
              {health?.local?.ollama?.running && ollamaModels.length === 0 && (
                <code className={styles.installCmd}>ollama pull llama3.1</code>
              )}
            </div>
            {health?.local?.ollama?.running && ollamaModels.length > 0 && (
              <div className={styles.pulledModels}>
                Pulled models: {ollamaModels.map(m => (
                  <span key={m} className={styles.modelTag}>{m}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.divider} />

        {/* CLIP SETTINGS */}
        <div className={styles.settingsGrid}>
          <div className={styles.settingGroup}>
            <div className={styles.settingLabel}><Settings2 size={13}/> Clip Length</div>
            <div className={styles.chips}>
              {durations.map(d => (
                <button key={d}
                  className={`${styles.chip} ${clipDuration === d ? styles.chipActive : ''}`}
                  onClick={() => setClipDuration(d)}>{d}s</button>
              ))}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <div className={styles.settingLabel}><Zap size={13}/> Number of Clips</div>
            <div className={styles.chips}>
              {counts.map(n => (
                <button key={n}
                  className={`${styles.chip} ${numClips === n ? styles.chipActive : ''}`}
                  onClick={() => setNumClips(n)}>{n} clips</button>
              ))}
            </div>
          </div>

          <div className={styles.settingGroup}>
            <div className={styles.settingLabel}>Captions</div>
            <div className={styles.chips}>
              <button className={`${styles.chip} ${addCaptions ? styles.chipActive : ''}`}
                onClick={() => setAddCaptions(true)}>Burn-in captions</button>
              <button className={`${styles.chip} ${!addCaptions ? styles.chipActive : ''}`}
                onClick={() => setAddCaptions(false)}>No captions</button>
            </div>
          </div>
        </div>

        {/* LOCAL ADVANCED OPTIONS */}
        {mode === 'local' && (
          <>
            <button className={styles.advancedToggle} onClick={() => setShowAdvanced(v => !v)}>
              <Settings2 size={13} /> Local Model Settings
              {showAdvanced ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
            </button>

            {showAdvanced && (
              <div className={styles.advancedPanel}>
                <div className={styles.settingGroup}>
                  <div className={styles.settingLabel}>Whisper Model Size</div>
                  <div className={styles.modelList}>
                    {WHISPER_MODELS.map(m => (
                      <button key={m.value}
                        className={`${styles.modelOption} ${whisperModel === m.value ? styles.modelOptionActive : ''}`}
                        onClick={() => setWhisperModel(m.value)}>
                        <span className={styles.modelName}>{m.label}</span>
                        <span className={styles.modelNote}>{m.note}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className={styles.settingGroup}>
                  <div className={styles.settingLabel}>Ollama Model</div>
                  <div className={styles.modelList}>
                    {OLLAMA_MODELS.map(m => (
                      <button key={m.value}
                        className={`${styles.modelOption} ${ollamaModel === m.value ? styles.modelOptionActive : ''}`}
                        onClick={() => setOllamaModel(m.value)}>
                        <span className={styles.modelName}>{m.label}</span>
                        <span className={styles.modelNote}>{m.note}</span>
                      </button>
                    ))}
                  </div>
                  <div className={styles.pullHint}>
                    To use a model: <code>ollama pull {ollamaModel}</code>
                  </div>
                </div>

                <div className={styles.settingGroup}>
                  <div className={styles.settingLabel}>Ollama URL</div>
                  <input
                    className={styles.textInput}
                    value={ollamaUrl}
                    onChange={e => setOllamaUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                  />
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={14}/> {error}
          </div>
        )}

        <button className={styles.submitBtn} onClick={submit} disabled={loading}>
          <Zap size={16} /> Generate Viral Clips
          {mode === 'local' && <span className={styles.localBadge}>LOCAL</span>}
        </button>
      </div>

      {/* HOW IT WORKS */}
      <div className={styles.howIt}>
        <div className={styles.step}><span>1</span> Paste YouTube URL</div>
        <div className={styles.arrow}>→</div>
        <div className={styles.step}>
          <span>2</span>
          {mode === 'local' ? 'faster-whisper (local)' : 'OpenAI Whisper'}
        </div>
        <div className={styles.arrow}>→</div>
        <div className={styles.step}>
          <span>3</span>
          {mode === 'local' ? `Ollama ${ollamaModel}` : 'Claude AI'}
        </div>
        <div className={styles.arrow}>→</div>
        <div className={styles.step}><span>4</span> FFmpeg edits clips</div>
      </div>
    </div>
  )
}
