import * as XLSX from 'xlsx'

const DATE_HEADER = /^(날짜|date|일자|방송일)$/i
const START_HEADER = /^(시작|start)$/i

export function isHeaderRow(cells: unknown[]): boolean {
  const dateCol = String(cells[0] ?? '').trim()
  if (DATE_HEADER.test(dateCol)) return true
  const startCol = String(cells[2] ?? '').trim()
  return START_HEADER.test(startCol)
}

export function cellToString(value: unknown): string {
  if (value == null || value === '') return ''
  if (value instanceof Date) {
    const y = value.getUTCFullYear()
    const m = String(value.getUTCMonth() + 1).padStart(2, '0')
    const d = String(value.getUTCDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  return String(value).trim()
}

export function parseDateCell(value: unknown): { dateKey: string; dateLabel: string } | null {
  if (value == null || value === '') return null

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateParts(
      value.getUTCFullYear(),
      value.getUTCMonth() + 1,
      value.getUTCDate(),
    )
  }

  if (typeof value === 'number' && value > 0) {
    const parts = excelSerialToParts(value)
    if (parts) return formatDateParts(parts.year, parts.month, parts.day)
  }

  const text = String(value).trim()
  if (!text) return null

  const fromText = parseDateText(text)
  if (fromText) return formatDateParts(fromText.year, fromText.month, fromText.day)

  const asNumber = Number(text.replace(/,/g, ''))
  if (!Number.isNaN(asNumber) && asNumber > 0 && /^\d+(\.\d+)?$/.test(text.replace(/,/g, ''))) {
    const parts = excelSerialToParts(asNumber)
    if (parts) return formatDateParts(parts.year, parts.month, parts.day)
  }

  return null
}

export function parseTimeCell(value: unknown): { timeLabel: string; timeSort: number } | null {
  if (value == null || value === '') return null

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return {
      timeLabel: formatTime(value.getUTCHours(), value.getUTCMinutes()),
      timeSort: value.getUTCHours() * 60 + value.getUTCMinutes(),
    }
  }

  if (typeof value === 'number' && value >= 0 && value < 1) {
    const totalMinutes = Math.round(value * 24 * 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return {
      timeLabel: formatTime(hours, minutes),
      timeSort: totalMinutes,
    }
  }

  if (typeof value === 'number' && value >= 1) {
    const fraction = value % 1
    if (fraction > 0) {
      const totalMinutes = Math.round(fraction * 24 * 60)
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60
      return {
        timeLabel: formatTime(hours, minutes),
        timeSort: totalMinutes,
      }
    }
  }

  const text = String(value).trim()
  const numericTime = Number(text)
  if (!Number.isNaN(numericTime) && numericTime >= 0 && numericTime < 1) {
    const totalMinutes = Math.round(numericTime * 24 * 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return {
      timeLabel: formatTime(hours, minutes),
      timeSort: totalMinutes,
    }
  }

  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (match) {
    const hours = Number(match[1])
    const minutes = Number(match[2])
    return {
      timeLabel: formatTime(hours, minutes),
      timeSort: hours * 60 + minutes,
    }
  }

  return { timeLabel: text, timeSort: Number.MAX_SAFE_INTEGER }
}

/** 문자열에서 연·월·일만 추출 (Date 생성 없이, 타임존 영향 없음) */
export function parseDateText(
  text: string,
): { year: number; month: number; day: number } | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const iso = trimmed.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/)
  if (iso) {
    return { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) }
  }

  const compact = trimmed.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (compact) {
    return {
      year: Number(compact[1]),
      month: Number(compact[2]),
      day: Number(compact[3]),
    }
  }

  const korean = trimmed.match(/(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/)
  if (korean) {
    return {
      year: Number(korean[1]),
      month: Number(korean[2]),
      day: Number(korean[3]),
    }
  }

  const mdy = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (mdy) {
    return {
      year: Number(mdy[3]),
      month: Number(mdy[1]),
      day: Number(mdy[2]),
    }
  }

  const dotted = trimmed.match(/^(\d{2,4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?\s*$/)
  if (dotted) {
    return {
      year: normalizeYear(Number(dotted[1])),
      month: Number(dotted[2]),
      day: Number(dotted[3]),
    }
  }

  const shortYmd = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{2})$/)
  if (shortYmd) {
    return {
      year: normalizeYear(Number(shortYmd[1])),
      month: Number(shortYmd[2]),
      day: Number(shortYmd[3]),
    }
  }

  const mdyShort = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2})$/)
  if (mdyShort) {
    return {
      year: normalizeYear(Number(mdyShort[3])),
      month: Number(mdyShort[1]),
      day: Number(mdyShort[2]),
    }
  }

  const koreanShort = trimmed.match(/(\d{1,2})\s*월\s*(\d{1,2})\s*일/)
  if (koreanShort) {
    const yearMatch = trimmed.match(/(\d{4})\s*년/)
    const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear()
    return {
      year,
      month: Number(koreanShort[1]),
      day: Number(koreanShort[2]),
    }
  }

  return null
}

function normalizeYear(year: number): number {
  if (year >= 100) return year
  return year >= 50 ? 1900 + year : 2000 + year
}

function formatDateParts(year: number, month: number, day: number) {
  const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const date = new Date(year, month - 1, day)
  const dateLabel = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  })
  return { dateKey, dateLabel }
}

function formatTime(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function excelSerialToParts(
  serial: number,
): { year: number; month: number; day: number } | null {
  const wholeDays = Math.floor(serial)
  if (wholeDays < 1) return null

  const parsed = XLSX.SSF.parse_date_code(wholeDays)
  if (parsed) {
    return { year: parsed.y, month: parsed.m, day: parsed.d }
  }

  const ms = (wholeDays - 25569) * 86400000
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return null

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  }
}
