import * as XLSX from 'xlsx'
import type { BroadcastRow } from '../types/broadcastRow'
import { parseSheetPeriod } from './parseSheetPeriod'
import {
  buildDateFromParts,
  cellToString,
  isExcludedProgram,
  isMatrixHeaderRow,
  isStartHeaderCell,
  parseScheduleCount,
  parseTimeCell,
} from './parseExcelValue'

export type ParseExcelResult = {
  rows: BroadcastRow[]
  sheetCount: number
}

/** A=프로그램, B=시작, C=끝, D=시급, E=초수, F=CM, G=월횟수, H~=일(1,2,3…) */
const DEFAULT_COL = {
  PROGRAM: 0,
  START: 1,
  END: 2,
  HOURLY_WAGE: 3,
  SECONDS: 4,
  CM: 5,
  MONTHLY_COUNT: 6,
  FIRST_DATE: 7,
}

type ColumnLayout = {
  PROGRAM: number
  START: number
  END: number
  HOURLY_WAGE: number
  SECONDS: number
  CM: number
  MONTHLY_COUNT: number
  FIRST_DATE: number
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
  const raw = cell.v
  if (typeof raw === 'number' && raw !== 0) return raw
  if (typeof raw === 'boolean') return raw
  const formatted = cell.w != null ? String(cell.w).trim() : ''
  if (formatted !== '') return formatted
  if (raw instanceof Date) return raw
  if (typeof raw === 'string' && raw.trim() !== '') return raw.trim()
  if (raw != null && raw !== '') return raw
  return ''
}

function readMarkerCell(cell: XLSX.CellObject | undefined): unknown {
  if (!cell) return null
  const raw = cell.v
  if (raw != null && raw !== '') return raw
  if (cell.w != null && String(cell.w).trim() !== '') return String(cell.w).trim()
  return null
}

function readCell(
  sheet: XLSX.WorkSheet,
  rowIndex: number,
  colIndex: number,
  cols: ColumnLayout,
): unknown {
  const address = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex })
  const cell = sheet[address]
  if (colIndex === cols.START || colIndex === cols.END) return getTimeCellValue(cell)
  if (colIndex >= cols.FIRST_DATE) return readMarkerCell(cell)
  return getCellValue(cell)
}

function resolveDayNumber(
  colIndex: number,
  headerCell: unknown,
  firstDateCol: number,
): number {
  const fromHeader = Number(cellToString(headerCell))
  if (!Number.isNaN(fromHeader) && fromHeader >= 1 && fromHeader <= 31) {
    return fromHeader
  }
  return colIndex - firstDateCol + 1
}

/** 헤더 행에서 H열(일자 1,2,3…) 시작 열 찾기 */
function detectFirstDateColumn(
  sheet: XLSX.WorkSheet,
  headerRow: number,
  maxCol: number,
): number {
  for (let col = 0; col <= maxCol - 1; col++) {
    const v1 = Number(cellToString(readCell(sheet, headerRow, col, DEFAULT_COL)))
    const v2 = Number(cellToString(readCell(sheet, headerRow, col + 1, DEFAULT_COL)))
    if (v1 === 1 && v2 === 2) return col
  }
  return DEFAULT_COL.FIRST_DATE
}

function rowHasDaySequence(
  sheet: XLSX.WorkSheet,
  rowIndex: number,
  maxCol: number,
): boolean {
  const firstDate = detectFirstDateColumn(sheet, rowIndex, maxCol)
  if (firstDate > maxCol - 1) return false
  const v1 = Number(cellToString(readCell(sheet, rowIndex, firstDate, DEFAULT_COL)))
  const v2 = Number(
    cellToString(readCell(sheet, rowIndex, firstDate + 1, DEFAULT_COL)),
  )
  return v1 === 1 && v2 === 2
}

function findHeaderRowIndex(sheet: XLSX.WorkSheet, maxRow: number, maxCol: number): number {
  for (let r = 0; r <= Math.min(maxRow, 30); r++) {
    const programCol = readCell(sheet, r, DEFAULT_COL.PROGRAM, DEFAULT_COL)
    const startCol = readCell(sheet, r, DEFAULT_COL.START, DEFAULT_COL)

    if (isMatrixHeaderRow(programCol)) return r
    if (isStartHeaderCell(startCol)) return r
    if (rowHasDaySequence(sheet, r, maxCol)) return r
  }

  return 0
}

function isLikelyDataHeaderRow(
  sheet: XLSX.WorkSheet,
  rowIndex: number,
  cols: ColumnLayout,
): boolean {
  const program = cellToString(readCell(sheet, rowIndex, cols.PROGRAM, cols))
  if (isMatrixHeaderRow(program) || isStartHeaderCell(program)) return true
  const start = cellToString(readCell(sheet, rowIndex, cols.START, cols))
  return isStartHeaderCell(start)
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
  const headerRowIndex = findHeaderRowIndex(sheet, range.e.r, range.e.c)
  const firstDateCol = detectFirstDateColumn(sheet, headerRowIndex, range.e.c)

  const cols: ColumnLayout = {
    ...DEFAULT_COL,
    FIRST_DATE: firstDateCol,
  }

  const { year, month } = parseSheetPeriod(
    source.sourceSheetName,
    source.sourceFileName,
  )

  const dayByColumn = new Map<number, number>()
  for (let col = cols.FIRST_DATE; col <= range.e.c; col++) {
    const headerVal = readCell(sheet, headerRowIndex, col, cols)
    dayByColumn.set(col, resolveDayNumber(col, headerVal, cols.FIRST_DATE))
  }

  const rows: BroadcastRow[] = []
  const channel = source.sourceSheetName.trim() || '-'
  const dataStartRow = headerRowIndex + 1

  for (let rowIndex = dataStartRow; rowIndex <= range.e.r; rowIndex++) {
    if (isLikelyDataHeaderRow(sheet, rowIndex, cols)) continue

    const programName = cellToString(readCell(sheet, rowIndex, cols.PROGRAM, cols))
    const start = parseTimeCell(readCell(sheet, rowIndex, cols.START, cols))
    const end = parseTimeCell(readCell(sheet, rowIndex, cols.END, cols))
    const hourlyWage = cellToString(readCell(sheet, rowIndex, cols.HOURLY_WAGE, cols))
    const seconds = cellToString(readCell(sheet, rowIndex, cols.SECONDS, cols))
    const cmPosition = cellToString(readCell(sheet, rowIndex, cols.CM, cols))
    const monthlyCount = cellToString(readCell(sheet, rowIndex, cols.MONTHLY_COUNT, cols))

    if (!programName) continue
    if (isMatrixHeaderRow(programName) || isStartHeaderCell(programName)) continue
    if (isExcludedProgram(programName)) continue

    for (let col = cols.FIRST_DATE; col <= range.e.c; col++) {
      const address = XLSX.utils.encode_cell({ r: rowIndex, c: col })
      const marker = readMarkerCell(sheet[address])
      const dayCount = parseScheduleCount(marker)
      if (dayCount == null) continue

      const day = dayByColumn.get(col) ?? col - cols.FIRST_DATE + 1
      if (day < 1 || day > 31) continue

      const date = buildDateFromParts(year, month, day)

      rows.push({
        id: crypto.randomUUID(),
        sourceFileId: source.sourceFileId,
        sourceFileName: source.sourceFileName,
        sourceSheetName: source.sourceSheetName,
        dateKey: date.dateKey,
        dateLabel: date.dateLabel,
        channel,
        programName,
        startLabel: start?.timeLabel ?? '-',
        startSort: start?.timeSort ?? Number.MAX_SAFE_INTEGER,
        endLabel: end?.timeLabel ?? '-',
        endSort: end?.timeSort ?? Number.MAX_SAFE_INTEGER,
        cmPosition: cmPosition || '-',
        dayCount,
        monthlyCount: monthlyCount || '-',
        hourlyWage: hourlyWage || '-',
        seconds: seconds || '-',
      })
    }
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
