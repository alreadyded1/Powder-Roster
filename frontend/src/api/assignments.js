import api from './client'

export const assignmentsApi = {
  // Manager
  list: (shiftId) =>
    api.get('/assignments/', { params: { shift_id: shiftId } }).then((r) => r.data),
  assign: (data) => api.post('/assignments/', data).then((r) => r.data),
  updateStatus: (id, status) =>
    api.patch(`/assignments/${id}`, { status }).then((r) => r.data),
  unassign: (id) => api.delete(`/assignments/${id}`),

  // Volunteer
  myAssignments: (seasonId) =>
    api.get('/assignments/my', { params: { season_id: seasonId } }).then((r) => r.data),
  signup: (shiftId) => api.post(`/assignments/signup/${shiftId}`).then((r) => r.data),
  withdraw: (shiftId) => api.delete(`/assignments/signup/${shiftId}`),
}
