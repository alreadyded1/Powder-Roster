import api from './client'

export const profileApi = {
  update: (data) => api.patch('/auth/profile', data).then((r) => r.data),
  changePassword: (data) => api.post('/auth/password', data),
}
