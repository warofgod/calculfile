import * as XLSX from 'xlsx'
import type { BroadcastRow } from '../types/broadcastRow'
import {
  cellToString,
  isHeaderRow,
  parseDateCell,
  parseDateText,
  parseTimeCell,
} from './parseExcelValue'

export type ParseExcelResult = {
  rows: BroadcastRow[]
  sheetCount: number
}

function getDateCellValue(cell: XLSX.CellObject | undefined): unknown {
  if (!cell) return ''

  const formatted = cell.w != null ? String(cell.w).trim() : ''
  const raw = cell.v

  if (formatted && parseDateText(formatted)) return formatted
  if (typeof raw === 'number') return raw
  if (raw instanceof Date) return raw
  if (formatted) return formatted
  if (typeof raw === 'string') return raw.trim()

  return ''
}

function getTimeCellValue(cell: XLSX.CellObject | undefined): unknown {
  if (!cell) return ''

  const raw = cell.v
  if (typeof raw === 'number') return raw

  const formatted = cell.w != null ? String(cell.w).trim() : ''
  if (formatted !== '') return formatted

  if (raw instanceof Date) return raw
  if (typeof raw === 'string') return raw.trim()

  return ''
}

function getCellValue(cell: XLSX.CellObject | undefined): unknown {
  if (!cell) return ''

  const formatted = cell.w != null ? String(cell.w).trim() : ''
  if (formatted !== '') return formatted

  const raw = cell.v
  if (raw instanceof Date) return raw
  if (typeof raw === 'number') return raw
  if (typeof raw === 'string') return raw.trim()

  return ''
}

function parseSheetRows(
  sheet: XLSX.WorkSheet,
  source: {
    sourceFileId: string
    sourceFileName: string
    sourceSheetName: string
  },
): BroadcastRow[] {
  const ref = sheet['!ref']
  if (!ref) return []

  const range = XLSX.utils.decode_range(ref)
  const rows: BroadcastRow[] = []
  let skippedHeader = false

  for (let rowIndex = range.s.r; rowIndex <= range.e.r; rowIndex++) {
    const cells = [0, 1, 2, 3].map((colIndex) => {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })
      const cell = sheet[address]
      if (colIndex === 0) return getDateCellValue(cell)
      if (colIndex === 2) return getTimeCellValue(cell)
      return getCellValue(cell)
    })

    if (cells.every((cell) => cellToString(cell) === '')) continue

    if (!skippedHeader && isHeaderRow(cells)) {
      skippedHeader = true
      continue
    }

    const date = parseDateCell(cells[0])
    const program = cellToString(cells[1])
    const time = parseTimeCell(cells[2])
    const advertisement = cellToString(cells[3])

    if (!date && !program && !time && !advertisement) continue
    if (!date) continue

    rows.push({
      id: crypto.randomUUID(),
      sourceFileId: source.sourceFileId,
      sourceFileName: source.sourceFileName,
      sourceSheetName: source.sourceSheetName,
      dateKey: date.dateKey,
      dateLabel: date.dateLabel,
      program: program || '-',
      timeLabel: time?.timeLabel ?? '-',
      timeSort: time?.timeSort ?? Number.MAX_SAFE_INTEGER,
      advertisement: advertisement || '-',
    })
  }

  return rows
}

export async function parseExcelFile(
  file: File,
  sourceFileId: string,
): Promise<ParseExcelResult> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellDates: true,
    cellNF: true,
  })
  const sheetNames = workbook.SheetNames

  if (sheetNames.length === 0) {
    return { rows: [], sheetCount: 0 }
  }

  const rows: BroadcastRow[] = []

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue

    rows.push(
      ...parseSheetRows(sheet, {
        sourceFileId,
        sourceFileName: file.name,
        sourceSheetName: sheetName,
      }),
    )
  }

  return { rows, sheetCount: sheetNames.length }
}
