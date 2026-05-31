import * as XLSX from 'xlsx'
import type { DateGroup } from '../types/broadcastRow'

function buildExportFilename(): string {
  const stamp = new Date().toISOString().slice(0, 10)
  return `CalculFile_통합정리_${stamp}.xlsx`
}

export function downloadOrganizedExcel(groups: DateGroup[]): void {
  const rows: (string | number)[][] = [['날짜', '프로그램', '시간', '광고']]

  for (const group of groups) {
    for (const row of group.rows) {
      rows.push([row.dateKey, row.program, row.timeLabel, row.advertisement])
    }
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet['!cols'] = [{ wch: 22 }, { wch: 24 }, { wch: 10 }, { wch: 20 }]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, '통합정리')
  XLSX.writeFile(workbook, buildExportFilename())
}
