import type { StoredFile } from '../types/storedFile'
import { downloadFile } from '../utils/downloadFile'
import { formatBytes } from '../utils/formatBytes'
import './FileList.css'

type FileListProps = {
  files: StoredFile[]
  onRemove: (id: string) => void
  onDownloadAll: () => void
  onClearAll: () => void
}

function formatDate(date: Date): string {
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function FileList({
  files,
  onRemove,
  onDownloadAll,
  onClearAll,
}: FileListProps) {
  if (files.length === 0) {
    return (
      <div className="file-list file-list--empty">
        <p>업로드된 파일이 없습니다.</p>
      </div>
    )
  }

  const totalSize = files.reduce((sum, item) => sum + item.file.size, 0)

  return (
    <section className="file-list" aria-label="업로드된 파일 목록">
      <header className="file-list__header">
        <div>
          <h2>파일 목록</h2>
          <p className="file-list__summary">
            {files.length}개 · 총 {formatBytes(totalSize)}
          </p>
        </div>
        <div className="file-list__actions">
          <button type="button" className="btn btn--secondary" onClick={onDownloadAll}>
            전체 다운로드
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClearAll}>
            전체 삭제
          </button>
        </div>
      </header>

      <ul className="file-list__items">
        {files.map((item) => (
          <li key={item.id} className="file-list__item">
            <div className="file-list__meta">
              <span className="file-list__name" title={item.file.name}>
                {item.file.name}
              </span>
              <span className="file-list__details">
                {formatBytes(item.file.size)} · {formatDate(item.uploadedAt)}
              </span>
            </div>
            <div className="file-list__item-actions">
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={() => downloadFile(item.file)}
              >
                다운로드
              </button>
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                onClick={() => onRemove(item.id)}
                aria-label={`${item.file.name} 삭제`}
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
