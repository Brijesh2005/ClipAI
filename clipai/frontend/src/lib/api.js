import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const checkHealth = () => api.get('/health')
export const createJob = (data) => api.post('/jobs', data)
export const getJob = (jobId) => api.get(`/jobs/${jobId}`)
export const listJobs = () => api.get('/jobs')
export const deleteJob = (jobId) => api.delete(`/jobs/${jobId}`)
export const listClips = (jobId) => api.get(`/clips/${jobId}`)

export default api
