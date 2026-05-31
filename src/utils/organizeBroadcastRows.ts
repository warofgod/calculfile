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
      if (a.startSort !== b.startSort) return a.startSort - b.startSort
      if (a.endSort !== b.endSort) return a.endSort - b.endSort
      const byChannel = a.channel.localeCompare(b.channel, 'ko')
      if (byChannel !== 0) return byChannel
      return a.programName.localeCompare(b.programName, 'ko')
    })
  }

  groups.sort((a, b) => a.dateKey.localeCompare(b.dateKey))

  return groups
}
