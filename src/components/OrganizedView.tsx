import type { DateGroup } from '../types/broadcastRow'
import type { ParseError } from '../hooks/useOrganizedBroadcast'
import { downloadOrganizedExcel } from '../utils/exportOrganizedExcel'
import './OrganizedView.css'

type OrganizedViewProps = {
  groups: DateGroup[]
  loading: boolean
  errors: ParseError[]
  totalRows: number
  totalSheets: number
  fileCount: number
}

export function OrganizedView({
  groups,
  loading,
  errors,
  totalRows,
  totalSheets,
  fileCount,
}: OrganizedViewProps) {
  const canDownload = !loading && totalRows > 0

  const handleDownload = () => {
    if (!canDownload) return
    downloadOrganizedExcel(groups)
  }

  return (
    <aside className="organized-view" aria-label="파일 정리 및 보기">
      <header className="organized-view__header">
        <div className="organized-view__header-text">
          <h2>파일 정리 및 보기</h2>
          <p className="organized-view__summary">
            {fileCount === 0
              ? '엑셀의 모든 시트를 합쳐 날짜·시간별로 정리합니다'
              : loading
                ? '모든 시트를 불러오는 중…'
                : `총 ${totalRows}건 · ${totalSheets}개 시트 · ${groups.length}일`}
          </p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleDownload}
          disabled={!canDownload}
          aria-label="통합 정리 목록 엑셀 다운로드"
        >
          다운로드
        </button>
      </header>

      {errors.length > 0 && (
        <ul className="organized-view__errors" role="alert">
          {errors.map((err) => (
            <li key={err.fileName}>
              <strong>{err.fileName}</strong>: {err.message}
            </li>
          ))}
        </ul>
      )}

      <div className="organized-view__body">
        {fileCount === 0 && (
          <p className="organized-view__empty">
            A열 날짜, B열 프로그램, C열 시작, D열 끝, E열 광고 형식입니다. 채널은
            시트명, 프로그램은 B열 내용으로 표시합니다.
          </p>
        )}

        {fileCount > 0 && !loading && totalRows === 0 && errors.length === 0 && (
          <p className="organized-view__empty">
            읽을 수 있는 데이터 행이 없습니다. 열 구성을 확인해 주세요.
          </p>
        )}

        {groups.map((group) => (
          <section key={group.dateKey} className="organized-view__day">
            <h3 className="organized-view__day-title">{group.dateLabel}</h3>
            <div className="organized-view__table-wrap">
              <table className="organized-view__table">
                <thead>
                  <tr>
                    <th scope="col">날짜</th>
                    <th scope="col">시작</th>
                    <th scope="col">끝</th>
                    <th scope="col">채널</th>
                    <th scope="col">프로그램</th>
                    <th scope="col">광고</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((row) => (
                    <tr key={row.id}>
                      <td className="organized-view__date">{row.dateKey}</td>
                      <td className="organized-view__time">{row.startLabel}</td>
                      <td className="organized-view__time">{row.endLabel}</td>
                      <td>{row.channel}</td>
                      <td>{row.programName}</td>
                      <td>{row.advertisement}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="organized-view__day-count">{group.rows.length}건</p>
          </section>
        ))}
      </div>
    </aside>
  )
}
