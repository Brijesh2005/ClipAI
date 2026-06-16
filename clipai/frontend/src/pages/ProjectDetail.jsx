import { useParams, Link } from 'react-router-dom'
import { useJobPoller } from '../hooks/useJobPoller'
import ClipCard from '../components/ClipCard'
import { ArrowLeft, Download, ExternalLink } from 'lucide-react'
import styles from './ProjectDetail.module.css'

export default function ProjectDetail() {
  const { jobId } = useParams()
  const { job } = useJobPoller(jobId, 3000)

  if (!job) return <div className={styles.page}><p style={{color:'var(--muted)'}}>Loading...</p></div>

  const clips = job.clips || []

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <Link to="/projects" className={styles.back}><ArrowLeft size={16}/> Projects</Link>
        {job.video_info?.title && (
          <a href={job.youtube_url} target="_blank" rel="noreferrer" className={styles.videoLink}>
            <ExternalLink size={13}/> {job.video_info.title}
          </a>
        )}
      </div>

      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{clips.length}</div>
          <div className={styles.statLabel}>Clips Generated</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal} style={{color:'var(--accent)'}}>
            {clips.length > 0 ? Math.max(...clips.map(c => c.viral_score)) : '—'}
          </div>
          <div className={styles.statLabel}>Top Viral Score</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal}>
            {clips.length > 0 ? Math.round(clips.reduce((a,c) => a + c.duration, 0)) + 's' : '—'}
          </div>
          <div className={styles.statLabel}>Total Duration</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statVal}>{job.status}</div>
          <div className={styles.statLabel}>Status</div>
        </div>
      </div>

      {job.status === 'error' && (
        <div className={styles.errorBox}>{job.error}</div>
      )}

      {clips.length === 0 && job.status !== 'error' && (
        <div className={styles.empty}>Processing... clips will appear here.</div>
      )}

      <div className={styles.clipsGrid}>
        {clips.map(clip => (
          <ClipCard key={clip.id} clip={clip} jobId={jobId} />
        ))}
      </div>
    </div>
  )
}
