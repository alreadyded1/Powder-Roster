import api from './client'

export const rosterApi = {
  list: (seasonId) =>
    api.get('/roster', { params: { season_id: seasonId } }).then((r) => r.data),

  summary: (seasonId) =>
    api.get('/roster/summary', { params: { season_id: seasonId } }).then((r) => r.data),

  exportCsv: async (seasonId, seasonName) => {
    const response = await api.get('/roster/export', {
      params: { season_id: seasonId },
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `roster-${seasonName.replace(/\s+/g, '-').toLowerCase()}.csv`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}
