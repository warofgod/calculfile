import { useEffect, useState } from 'react'
import type { StoredFile } from '../types/storedFile'
import type { DateGroup } from '../types/broadcastRow'
import { organizeBroadcastRows } from '../utils/organizeBroadcastRows'
import { parseExcelFile } from '../utils/parseExcelFile'

export type ParseError = {
  fileName: string
  message: string
}

export function useOrganizedBroadcast(files: StoredFile[]) {
  const [groups, setGroups] = useState<DateGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<ParseError[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [totalSheets, setTotalSheets] = useState(0)

  useEffect(() => {
    if (files.length === 0) {
      setGroups([])
      setErrors([])
      setTotalRows(0)
      setTotalSheets(0)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    void (async () => {
      const allRows = []
      const parseErrors: ParseError[] = []
      let sheets = 0

      for (const stored of files) {
        try {
          const result = await parseExcelFile(stored.file, stored.id)
          allRows.push(...result.rows)
          sheets += result.sheetCount
        } catch (error) {
          parseErrors.push({
            fileName: stored.file.name,
            message:
              error instanceof Error ? error.message : '파일을 읽을 수 없습니다.',
          })
        }
      }

      if (cancelled) return

      setGroups(organizeBroadcastRows(allRows))
      setErrors(parseErrors)
      setTotalRows(allRows.length)
      setTotalSheets(sheets)
      setLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [files])

  return { groups, loading, errors, totalRows, totalSheets }
}
