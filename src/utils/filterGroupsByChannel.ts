import type { BroadcastRow, DateGroup } from '../types/broadcastRow'

/** 1일횟수(H열 이후 숫자) 합계 */
export function sumDayCountInRows(rows: BroadcastRow[]): number {
  return rows.reduce((sum, row) => sum + row.dayCount, 0)
}

export function sumDayCountInGroups(groups: DateGroup[]): number {
  return groups.reduce((sum, group) => sum + sumDayCountInRows(group.rows), 0)
}

export function collectChannels(groups: DateGroup[]): string[] {
  const set = new Set<string>()
  for (const group of groups) {
    for (const row of group.rows) {
      if (row.channel && row.channel !== '-') set.add(row.channel)
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'ko'))
}

export function filterGroupsByChannel(
  groups: DateGroup[],
  channel: string,
): DateGroup[] {
  if (!channel) return groups

  return groups
    .map((group) => ({
      ...group,
      rows: group.rows.filter((row) => row.channel === channel),
    }))
    .filter((group) => group.rows.length > 0)
}

export function countRowsInGroups(groups: DateGroup[]): number {
  return groups.reduce((sum, group) => sum + group.rows.length, 0)
}
