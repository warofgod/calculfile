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

/** A=날짜, B=프로그램(채널명), C=시작, D=끝, E=광고 */
const COL = {
  DATE: 0,
  PROGRAM: 1,
  START: 2,
  END: 3,
  AD: 4,
} as const

const DATA_COLUMNS = [
  COL.DATE,
  COL.PROGRAM,
  COL.START,
  COL.END,
  COL.AD,
] as const

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

function readCell(sheet: XLSX.WorkSheet, rowIndex: number, colIndex: number): unknown {
  const address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })
  const cell = sheet[address]
  if (colIndex === COL.DATE) return getDateCellValue(cell)
  if (colIndex === COL.START || colIndex === COL.END) return getTimeCellValue(cell)
  return getCellValue(cell)
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
    const cells = DATA_COLUMNS.map((colIndex) => readCell(sheet, rowIndex, colIndex))

    if (cells.every((cell) => cellToString(cell) === '')) continue

    if (!skippedHeader && isHeaderRow(cells)) {
      skippedHeader = true
      continue
    }

    const date = parseDateCell(cells[COL.DATE])
    const programName = cellToString(cells[COL.PROGRAM])
    const start = parseTimeCell(cells[COL.START])
    const end = parseTimeCell(cells[COL.END])
    const advertisement = cellToString(cells[COL.AD])

    if (!date && !programName && !start && !end && !advertisement) continue
    if (!date) continue

    const program = programName || '-'

    rows.push({
      id: crypto.randomUUID(),
      sourceFileId: source.sourceFileId,
      sourceFileName: source.sourceFileName,
      sourceSheetName: source.sourceSheetName,
      dateKey: date.dateKey,
      dateLabel: date.dateLabel,
      channel: source.sourceSheetName.trim() || '-',
      programName: program,
      startLabel: start?.timeLabel ?? '-',
      startSort: start?.timeSort ?? Number.MAX_SAFE_INTEGER,
      endLabel: end?.timeLabel ?? '-',
      endSort: end?.timeSort ?? Number.MAX_SAFE_INTEGER,
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
