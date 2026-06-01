import * as XLSX from 'xlsx'
import type { DateGroup } from '../types/broadcastRow'

function buildExportFilename(): string {
  const stamp = new Date().toISOString().slice(0, 10)
  return `CalculFile_통합정리_${stamp}.xlsx`
}

export function downloadOrganizedExcel(groups: DateGroup[]): void {
  const rows: (string | number)[][] = [
    ['날짜', '시작', '끝', '채널', '프로그램', 'CM위치', '1일횟수', '시급', '초수'],
  ]

  for (const group of groups) {
    for (const row of group.rows) {
      rows.push([
        row.dateKey,
        row.startLabel,
        row.endLabel,
        row.channel,
        row.programName,
        row.cmPosition,
        row.dayCount,
        row.hourlyWage,
        row.seconds,
      ])
    }
  }

  const sheet = XLSX.utils.aoa_to_sheet(rows)
  sheet['!cols'] = [
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 28 },
    { wch: 10 },
    { wch: 8 },
    { wch: 10 },
    { wch: 8 },
  ]

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, '통합정리')
  XLSX.writeFile(workbook, buildExportFilename())
}
