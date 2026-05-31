const EXCEL_EXTENSIONS = ['.xlsx', '.xls', '.xlsm', '.xlsb'] as const

export const EXCEL_ACCEPT =
  '.xlsx,.xls,.xlsm,.xlsb,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/vnd.ms-excel.sheet.macroEnabled.12,application/vnd.ms-excel.sheet.binary.macroEnabled.12'

export function isExcelFile(file: File): boolean {
  const name = file.name.toLowerCase()
  if (EXCEL_EXTENSIONS.some((ext) => name.endsWith(ext))) return true

  const mime = file.type.toLowerCase()
  return (
    mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mime === 'application/vnd.ms-excel' ||
    mime === 'application/vnd.ms-excel.sheet.macroenabled.12' ||
    mime === 'application/vnd.ms-excel.sheet.binary.macroenabled.12'
  )
}

export function filterExcelFiles(files: FileList | File[]): {
  accepted: File[]
  rejected: File[]
} {
  const list = Array.from(files)
  const accepted: File[] = []
  const rejected: File[] = []

  for (const file of list) {
    if (isExcelFile(file)) accepted.push(file)
    else rejected.push(file)
  }

  return { accepted, rejected }
}
