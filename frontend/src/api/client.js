import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// DSS endpoints
export const diagnoseQuestionnaire = (answers, lang = 'en') =>
  client.post(`/questionnaire?lang=${lang}`, answers)

export const diagnoseHybrid = (answers, lang = 'en') =>
  client.post(`/hybrid?lang=${lang}`, answers)

export const predictImage = (formData, lang = 'en') =>
  client.post(`/predict-image?lang=${lang}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const hybridImage = (formData, lang = 'en') =>
  client.post(`/hybrid-image?lang=${lang}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const predictImages = (formData, lang = 'en') =>
  client.post(`/predict-images?lang=${lang}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const hybridImages = (formData, lang = 'en') =>
  client.post(`/hybrid-images?lang=${lang}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const explainScores = (answers, lang = 'en') =>
  client.post(`/explain?lang=${lang}`, answers)

// Content endpoints (public)
export const getResources  = (lang = 'en') => client.get(`/resources?lang=${lang}`)
export const getResource   = (id, lang = 'en') => client.get(`/resources/${id}?lang=${lang}`)
export const getProfiles   = () => client.get('/profiles')
export const getCategories = () => client.get('/categories')

export default client
