export interface BroadcastRow {
  id: string
  sourceFileId: string
  sourceFileName: string
  sourceSheetName: string
  dateKey: string
  dateLabel: string
  /** 시트명 → 채널 (예: mbc) */
  channel: string
  /** B열 → 프로그램명 (예: 우리아이가 변했어요) */
  programName: string
  startLabel: string
  startSort: number
  endLabel: string
  endSort: number
  advertisement: string
}

export interface DateGroup {
  dateKey: string
  dateLabel: string
  rows: BroadcastRow[]
}
