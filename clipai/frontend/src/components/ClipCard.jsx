import { Download, Edit3, Play, Clock, Hash } from 'lucide-react'
import styles from './ClipCard.module.css'

function scoreColor(score) {
  if (score >= 90) return '#e8ff47'
  if (score >= 80) return '#5cffb8'
  return '#ff5c5c'
}

function scoreEmoji(score) {
  if (score >= 90) return '🔥'
  if (score >= 80) return '⚡'
  return '📈'
}

export default function ClipCard({ clip, jobId }) {
  const color = scoreColor(clip.viral_score)
  const downloadUrl = `/api/download/${jobId}/${clip.id}`

  return (
    <div className={styles.card}>
      <div className={styles.thumb}>
        {clip.thumbnail
          ? <img src={clip.thumbnail} alt={clip.title} className={styles.thumbImg} />
          : <div className={styles.thumbPlaceholder}><Play size={28} /></div>
        }
        <div className={styles.badge} style={{ background: color, color: color === '#e8ff47' ? '#0a0a0f' : '#0a0a0f' }}>
          {scoreEmoji(clip.viral_score)} {clip.viral_score}
        </div>
        <div className={styles.duration}>
          <Clock size={10} /> {clip.duration_fmt}
        </div>
      </div>

      <div className={styles.info}>
        <div className={styles.category}>{clip.category}</div>
        <div className={styles.title}>{clip.title}</div>

        {clip.hook && (
          <div className={styles.hook}>"{clip.hook}"</div>
        )}

        <div className={styles.scorebar}>
          <span className={styles.scoreLabel}>Viral Score</span>
          <div className={styles.bar}>
            <div className={styles.fill} style={{ width: clip.viral_score + '%', background: color }} />
          </div>
          <span className={styles.scoreNum} style={{ color }}>{clip.viral_score}</span>
        </div>

        {clip.hashtags?.length > 0 && (
          <div className={styles.tags}>
            {clip.hashtags.slice(0,4).map(t => (
              <span key={t} className={styles.tag}>{t}</span>
            ))}
          </div>
        )}

        {clip.why_viral && (
          <div className={styles.why}>{clip.why_viral}</div>
        )}

        <div className={styles.meta}>
          <span><Clock size={11} /> {clip.start_time?.toFixed(1)}s — {clip.end_time?.toFixed(1)}s</span>
          {clip.size_mb > 0 && <span>{clip.size_mb} MB</span>}
        </div>

        <div className={styles.actions}>
          <a href={downloadUrl} download className={`${styles.btn} ${styles.primary}`}>
            <Download size={13} /> Export
          </a>
          <button className={styles.btn} onClick={() => window.open(clip.file, '_blank')}>
            <Play size={13} /> Preview
          </button>
        </div>
      </div>
    </div>
  )
}
