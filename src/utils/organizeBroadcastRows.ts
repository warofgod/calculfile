import type { BroadcastRow, DateGroup } from '../types/broadcastRow'

export function organizeBroadcastRows(rows: BroadcastRow[]): DateGroup[] {
  const byDate = new Map<string, DateGroup>()

  for (const row of rows) {
    let group = byDate.get(row.dateKey)
    if (!group) {
      group = {
        dateKey: row.dateKey,
        dateLabel: row.dateLabel,
        rows: [],
      }
      byDate.set(row.dateKey, group)
    }
    group.rows.push(row)
  }

  const groups = Array.from(byDate.values())

  for (const group of groups) {
    group.rows.sort((a, b) => {
      if (a.timeSort !== b.timeSort) return a.timeSort - b.timeSort
      return a.program.localeCompare(b.program, 'ko')
    })
  }

  groups.sort((a, b) => a.dateKey.localeCompare(b.dateKey))

  return groups
}
