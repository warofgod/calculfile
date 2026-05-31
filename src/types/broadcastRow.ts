export interface BroadcastRow {
  id: string
  sourceFileId: string
  sourceFileName: string
  sourceSheetName: string
  dateKey: string
  dateLabel: string
  program: string
  timeLabel: string
  timeSort: number
  advertisement: string
}

export interface DateGroup {
  dateKey: string
  dateLabel: string
  rows: BroadcastRow[]
}
