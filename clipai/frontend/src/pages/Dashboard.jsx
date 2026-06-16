import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Film, TrendingUp, Clock, ArrowRight } from 'lucide-react'
import { listJobs, checkHealth } from '../lib/api'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const [jobs, setJobs] = useState([])
  const [health, setHealth] = useState(null)

  useEffect(() => {
    listJobs().then(r => setJobs(r.data.filter(j => j.status !== 'deleted'))).catch(() => {})
    checkHealth().then(r => setHealth(r.data)).catch(() => {})
  }, [])

  const done = jobs.filter(j => j.status === 'done')
  const totalClips = done.reduce((a, j) => a + (j.clips?.length || 0), 0)
  const topScore = done.flatMap(j => j.clips || []).reduce((max, c) => Math.max(max, c.viral_score || 0), 0)
  const recent = [...jobs].reverse().slice(0, 5)

  const hasKeys = !!(localStorage.getItem('clipai_openai_key') && localStorage.getItem('clipai_anthropic_key'))

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.heading}>Dashboard</h1>
          <p className={styles.sub}>AI-powered viral shorts generator</p>
        </div>
        <Link to="/new" className={styles.newBtn}><Zap size={15}/> Generate Clips</Link>
      </div>

      {!hasKeys && (
        <div className={styles.setupBanner}>
          <strong>Setup required:</strong> Add your OpenAI and Anthropic API keys to start generating clips.
          <Link to="/settings" className={styles.setupLink}>Add keys →</Link>
        </div>
      )}

      {health && (
        <div className={styles.healthRow}>
          {Object.entries(health.tools).map(([tool, ok]) => (
            <div key={tool} className={styles.healthChip} style={{color: ok ? 'var(--accent3)' : 'var(--accent2)'}}>
              <span className={styles.healthDot} style={{background: ok ? 'var(--accent3)' : 'var(--accent2)'}} />
              {tool}
            </div>
          ))}
        </div>
      )}

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <Film size={18} color="var(--muted)"/>
          <div className={styles.statVal}>{jobs.length}</div>
          <div className={styles.statLabel}>Total Projects</div>
        </div>
        <div className={styles.statCard}>
          <Zap size={18} color="var(--accent)"/>
          <div className={styles.statVal} style={{color:'var(--accent)'}}>{totalClips}</div>
          <div className={styles.statLabel}>Clips Generated</div>
        </div>
        <div className={styles.statCard}>
          <TrendingUp size={18} color="var(--accent3)"/>
          <div className={styles.statVal} style={{color:'var(--accent3)'}}>{topScore || '—'}</div>
          <div className={styles.statLabel}>Top Viral Score</div>
        </div>
        <div className={styles.statCard}>
          <Clock size={18} color="var(--muted)"/>
          <div className={styles.statVal}>{done.length}</div>
          <div className={styles.statLabel}>Completed</div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <span>Recent Projects</span>
          <Link to="/projects" className={styles.seeAll}>See all <ArrowRight size={13}/></Link>
        </div>
        {recent.length === 0 && (
          <div className={styles.emptyCard}>
            <Film size={32} style={{opacity:0.15}} />
            <p>No projects yet.</p>
            <Link to="/new" className={styles.cta}>Create your first project →</Link>
          </div>
        )}
        {recent.map(j => (
          <Link key={j.id} to={`/projects/${j.id}`} className={styles.jobRow}>
            <div className={styles.jobTitle}>{j.video_info?.title || j.youtube_url?.slice(0,60)}</div>
            <div className={styles.jobRight}>
              <span className={styles.clipsCount}>{j.clips?.length || 0} clips</span>
              <span className={styles.statusBadge} style={{
                color: j.status === 'done' ? 'var(--accent3)' : j.status === 'error' ? 'var(--accent2)' : 'var(--accent)'
              }}>{j.status}</span>
              <ArrowRight size={14} style={{color:'var(--muted)'}} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
