import { useJobPoller } from '../hooks/useJobPoller'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'
import styles from './ProgressModal.module.css'

const STEPS = [
  'Fetching video info',
  'Downloading video',
  'Extracting audio',
  'Transcribing with Whisper AI',
  'Detecting viral moments with Claude AI',
  'Editing clips',
  'Complete',
]

function stepIndex(stepName) {
  const idx = STEPS.findIndex(s => stepName?.toLowerCase().includes(s.toLowerCase().split(' ')[0]))
  return idx >= 0 ? idx : 0
}

export default function ProgressModal({ jobId, onDone, onError }) {
  const { job, error } = useJobPoller(jobId, 1500)

  if (!job && !error) return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <Loader size={32} className={styles.spin} />
        <p>Connecting...</p>
      </div>
    </div>
  )

  if (job?.status === 'done') {
    setTimeout(() => onDone(job), 800)
  }
  if (job?.status === 'error') {
    setTimeout(() => onError(job.error), 500)
  }

  const currentStep = job?.step || ''
  const progress = job?.progress || 0
  const curIdx = stepIndex(currentStep)

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.iconWrap}>
          {job?.status === 'error'
            ? <AlertCircle size={32} color="var(--accent2)" />
            : <Loader size={32} className={styles.spin} color="var(--accent)" />
          }
        </div>
        <div className={styles.title}>
          {job?.status === 'error' ? 'Processing Failed' : 'Generating Viral Clips'}
        </div>
        {job?.video_info?.title && (
          <div className={styles.videoTitle}>"{job.video_info.title}"</div>
        )}

        <div className={styles.stepsList}>
          {STEPS.slice(0, -1).map((s, i) => {
            const done = i < curIdx
            const active = i === curIdx
            return (
              <div key={s} className={`${styles.stepItem} ${done ? styles.done : ''} ${active ? styles.active : ''}`}>
                <div className={styles.dot}>
                  {done ? <CheckCircle size={14} color="var(--accent3)" /> : null}
                </div>
                <span>{s}</span>
              </div>
            )
          })}
        </div>

        <div className={styles.progressWrap}>
          <div className={styles.bar}>
            <div className={styles.fill} style={{ width: progress + '%' }} />
          </div>
          <div className={styles.progressLabels}>
            <span>{currentStep}</span>
            <span>{progress}%</span>
          </div>
        </div>

        {job?.status === 'error' && (
          <div className={styles.errorMsg}>{job.error}</div>
        )}
      </div>
    </div>
  )
}
