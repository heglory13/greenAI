import * as XLSX from 'xlsx'

export function exportToCSV(data: any[], filename: string, columns: { key: string; label: string }[]) {
  // Build rows with STT + formatted values
  const rows = data.map((row, idx) => {
    const obj: Record<string, any> = { 'STT': idx + 1 }
    columns.forEach(c => {
      let val = row[c.key] ?? ''

      if (c.key.includes('.')) {
        val = c.key.split('.').reduce((o: any, k: string) => o?.[k], row) ?? ''
      }

      val = String(val)

      // Format ISO dates
      if (/^\d{4}-\d{2}-\d{2}T/.test(val)) {
        const d = new Date(val)
        val = d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      }

      // Format roles
      if (c.key === 'role') {
        const roleMap: Record<string, string> = { tenant: 'Người thuê', landlord: 'Chủ trọ', admin: 'Admin' }
        val = roleMap[val] || val
      }

      obj[c.label] = val
    })
    return obj
  })

  // Create worksheet
  const ws = XLSX.utils.json_to_sheet(rows)

  // Auto-fit column widths
  const colWidths = [{ wch: 5 }] // STT column
  columns.forEach(c => {
    const maxLen = Math.max(
      c.label.length,
      ...data.map(row => {
        let val = row[c.key] ?? ''
        if (c.key.includes('.')) val = c.key.split('.').reduce((o: any, k: string) => o?.[k], row) ?? ''
        return String(val).length
      })
    )
    colWidths.push({ wch: Math.min(maxLen + 4, 40) })
  })
  ws['!cols'] = colWidths

  // Create workbook and export
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Data')
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`)
}
