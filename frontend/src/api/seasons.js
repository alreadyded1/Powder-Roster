import api from './client'

export const seasonsApi = {
  list: () => api.get('/seasons/').then((r) => r.data),
  get: (id) => api.get(`/seasons/${id}`).then((r) => r.data),
  create: (data) => api.post('/seasons/', data).then((r) => r.data),
  update: (id, data) => api.patch(`/seasons/${id}`, data).then((r) => r.data),
  activate: (id) => api.post(`/seasons/${id}/activate`).then((r) => r.data),
  deactivate: (id) => api.post(`/seasons/${id}/deactivate`).then((r) => r.data),
}
