import { useRef, useState, type DragEvent } from 'react'
import { EXCEL_ACCEPT, filterExcelFiles } from '../utils/excelFile'
import './FileUploader.css'

type FileUploaderProps = {
  onFilesSelected: (files: FileList | File[]) => void
  disabled?: boolean
}

export function FileUploader({ onFilesSelected, disabled }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0 || disabled) return

    const { accepted, rejected } = filterExcelFiles(fileList)

    if (rejected.length > 0) {
      const names = rejected.map((f) => f.name).join(', ')
      setError(
        rejected.length === 1
          ? `엑셀 파일만 업로드할 수 있습니다. (${names})`
          : `엑셀 파일만 업로드할 수 있습니다. 제외된 파일: ${names}`,
      )
    } else {
      setError(null)
    }

    if (accepted.length > 0) onFilesSelected(accepted)
  }

  const onDragEnter = (e: DragEvent) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
  }

  const onDragLeave = (e: DragEvent) => {
    e.preventDefault()
    if (e.currentTarget === e.target) setIsDragging(false)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  return (
    <div
      className={`file-uploader${isDragging ? ' file-uploader--dragging' : ''}${disabled ? ' file-uploader--disabled' : ''}`}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label="파일 업로드 영역"
      aria-disabled={disabled}
    >
      <input
        ref={inputRef}
        type="file"
        accept={EXCEL_ACCEPT}
        multiple
        hidden
        disabled={disabled}
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <div className="file-uploader__icon" aria-hidden="true">
        ↑
      </div>
      <p className="file-uploader__title">엑셀 파일을 여기에 놓거나 클릭하세요</p>
      <p className="file-uploader__hint">
        .xlsx, .xls, .xlsm, .xlsb 형식만 업로드할 수 있습니다
      </p>
      {error && (
        <p className="file-uploader__error" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
