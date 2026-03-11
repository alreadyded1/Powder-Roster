import api from './client'

export const shiftsApi = {
  list: (seasonId) => api.get('/shifts/', { params: { season_id: seasonId } }).then((r) => r.data),
  get: (id) => api.get(`/shifts/${id}`).then((r) => r.data),
  create: (data) => api.post('/shifts/', data).then((r) => r.data),
  update: (id, data) => api.patch(`/shifts/${id}`, data).then((r) => r.data),
  delete: (id) => api.delete(`/shifts/${id}`),
  bulkCreate: (data) => api.post('/shifts/bulk', data).then((r) => r.data),
}
