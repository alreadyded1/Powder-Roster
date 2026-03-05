import api from './client'

export const usersApi = {
  list: () => api.get('/users').then((r) => r.data),
  update: (id, data) => api.patch(`/users/${id}`, data).then((r) => r.data),
  deactivate: (id) => api.delete(`/users/${id}`),
  reactivate: (id) => api.patch(`/users/${id}`, { is_active: true }).then((r) => r.data),
}

export const invitesApi = {
  create: (data) => api.post('/invites', data).then((r) => r.data),
  get: (token) => api.get(`/invites/${token}`).then((r) => r.data),
  accept: (token, data) => api.post(`/invites/${token}/accept`, data).then((r) => r.data),
}
