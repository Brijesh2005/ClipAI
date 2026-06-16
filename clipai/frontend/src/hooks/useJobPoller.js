import { useState, useEffect, useRef } from 'react'
import { getJob } from '../lib/api'

export function useJobPoller(jobId, intervalMs = 2000) {
  const [job, setJob] = useState(null)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)

  useEffect(() => {
    if (!jobId) return
    const poll = async () => {
      try {
        const res = await getJob(jobId)
        setJob(res.data)
        if (res.data.status === 'done' || res.data.status === 'error') {
          clearInterval(timerRef.current)
        }
      } catch (e) {
        setError(e.message)
        clearInterval(timerRef.current)
      }
    }
    poll()
    timerRef.current = setInterval(poll, intervalMs)
    return () => clearInterval(timerRef.current)
  }, [jobId, intervalMs])

  return { job, error }
}
