export interface BroadcastRow {
  id: string
  sourceFileId: string
  sourceFileName: string
  sourceSheetName: string
  dateKey: string
  dateLabel: string
  /** 시트명 → 채널 */
  channel: string
  /** A열 프로그램 */
  programName: string
  startLabel: string
  startSort: number
  endLabel: string
  endSort: number
  /** F열 CM위치 */
  cmPosition: string
  /** H열 이후 해당 일자 셀 숫자 (1일횟수, 보통 1·2 등) */
  dayCount: number
  /** G열 월횟수 (원본) */
  monthlyCount: string
  /** D열 시급 */
  hourlyWage: string
  /** E열 초수 */
  seconds: string
}

export interface DateGroup {
  dateKey: string
  dateLabel: string
  rows: BroadcastRow[]
}
