import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Film, Clock, Scissors, ChevronRight, Trash2 } from 'lucide-react'
import { listJobs, deleteJob } from '../lib/api'
import styles from './Projects.module.css'

function statusColor(s) {
  if (s === 'done') return 'var(--accent3)'
  if (s === 'error') return 'var(--accent2)'
  return 'var(--accent)'
}

export default function Projects() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await listJobs()
      setJobs(res.data.filter(j => j.status !== 'deleted').reverse())
    } catch (e) {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (e, jobId) => {
    e.preventDefault()
    if (!confirm('Delete this project and all its clips?')) return
    await deleteJob(jobId)
    load()
  }

  if (loading) return <div className={styles.page}><p style={{color:'var(--muted)'}}>Loading...</p></div>

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Projects</h1>
      {jobs.length === 0 && (
        <div className={styles.empty}>
          <Film size={40} style={{opacity:0.2}} />
          <p>No projects yet. <Link to="/new" style={{color:'var(--accent)'}}>Create one →</Link></p>
        </div>
      )}
      <div className={styles.list}>
        {jobs.map(job => (
          <Link key={job.id} to={`/projects/${job.id}`} className={styles.jobRow}>
            <div className={styles.jobIcon}><Film size={18}/></div>
            <div className={styles.jobInfo}>
              <div className={styles.jobTitle}>{job.video_info?.title || job.youtube_url}</div>
              <div className={styles.jobMeta}>
                <span><Clock size={11}/> {new Date(job.created_at).toLocaleString()}</span>
                <span><Scissors size={11}/> {job.clips?.length || 0} clips</span>
              </div>
            </div>
            <div className={styles.jobStatus} style={{color: statusColor(job.status)}}>
              {job.status}
            </div>
            {job.progress < 100 && job.status === 'processing' && (
              <div className={styles.miniBar}>
                <div className={styles.miniBarFill} style={{width: job.progress + '%'}} />
              </div>
            )}
            <button className={styles.deleteBtn} onClick={e => handleDelete(e, job.id)}><Trash2 size={14}/></button>
            <ChevronRight size={16} style={{color:'var(--muted)', flexShrink:0}} />
          </Link>
        ))}
      </div>
    </div>
  )
}
