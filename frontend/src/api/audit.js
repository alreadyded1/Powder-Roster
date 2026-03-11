import api from './client'

export const auditApi = {
  list: (params = {}) => api.get('/audit/', { params }).then((r) => r.data),
  actions: () => api.get('/audit/actions').then((r) => r.data),
}
