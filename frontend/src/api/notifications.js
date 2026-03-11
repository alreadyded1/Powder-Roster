import api from './client'

export const notificationsApi = {
  list: (limit = 50) => api.get('/notifications/', { params: { limit } }).then((r) => r.data),
  count: () => api.get('/notifications/count').then((r) => r.data.count),
  markRead: (id) => api.post(`/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.post('/notifications/read-all'),
  clear: () => api.delete('/notifications/clear'),
  alerts: (seasonId, daysAhead = 7) =>
    api.get('/notifications/alerts', { params: { season_id: seasonId, days_ahead: daysAhead } }).then((r) => r.data),
}
