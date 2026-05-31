import { useCallback, useState } from 'react'
import type { StoredFile } from '../types/storedFile'

function toStoredFile(file: File): StoredFile {
  return {
    id: crypto.randomUUID(),
    file,
    uploadedAt: new Date(),
  }
}

export function useStoredFiles() {
  const [files, setFiles] = useState<StoredFile[]>([])

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const list = Array.from(incoming)
    if (list.length === 0) return
    setFiles((prev) => [...prev, ...list.map(toStoredFile)])
  }, [])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setFiles([])
  }, [])

  return { files, addFiles, removeFile, clearAll }
}
