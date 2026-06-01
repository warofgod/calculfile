/** 시트명·파일명에서 연·월 추출 (없으면 현재 연·월) */
export function parseSheetPeriod(
  sheetName: string,
  fileName: string,
): { year: number; month: number } {
  const text = `${sheetName} ${fileName}`

  const full = text.match(/(20\d{2})[.\-_년\s]*(\d{1,2})\s*월?/)
  if (full) {
    return { year: Number(full[1]), month: Number(full[2]) }
  }

  const compact = text.match(/(20\d{2})(\d{2})/)
  if (compact) {
    return { year: Number(compact[1]), month: Number(compact[2]) }
  }

  const monthOnly = text.match(/(\d{1,2})\s*월/)
  if (monthOnly) {
    return { year: new Date().getFullYear(), month: Number(monthOnly[1]) }
  }

  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}
