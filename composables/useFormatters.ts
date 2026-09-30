export const useFormatters = () => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const monthsLong = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  const formatDateIndonesian = (dateStr: string, full = false) => {
    if (!dateStr) return '-'
    const [y, m, d] = dateStr.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    const dayName = days[dt.getUTCDay()]
    const monthName = full ? monthsLong[m - 1] : monthsShort[m - 1]
    return `${dayName}, ${d} ${monthName} ${y}`
  }

  const getDayName = (dateStr: string) => {
    if (!dateStr) return ''
    const [y, m, d] = dateStr.split('-').map(Number)
    const dt = new Date(Date.UTC(y, m - 1, d))
    return days[dt.getUTCDay()]
  }

  return {
    formatDateIndonesian,
    getDayName
  }
}
