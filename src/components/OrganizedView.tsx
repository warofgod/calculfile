import { useEffect, useMemo, useState } from 'react'
import type { DateGroup } from '../types/broadcastRow'
import type { ParseError } from '../hooks/useOrganizedBroadcast'
import { downloadOrganizedExcel } from '../utils/exportOrganizedExcel'
import {
  collectChannels,
  countRowsInGroups,
  filterGroupsByChannel,
  sumDayCountInGroups,
  sumDayCountInRows,
} from '../utils/filterGroupsByChannel'
import './OrganizedView.css'

type OrganizedViewProps = {
  groups: DateGroup[]
  loading: boolean
  errors: ParseError[]
  totalRows: number
  totalSheets: number
  fileCount: number
}

const ALL_CHANNELS = ''

export function OrganizedView({
  groups,
  loading,
  errors,
  totalRows,
  totalSheets,
  fileCount,
}: OrganizedViewProps) {
  const [selectedChannel, setSelectedChannel] = useState(ALL_CHANNELS)

  const channels = useMemo(() => collectChannels(groups), [groups])

  const filteredGroups = useMemo(
    () => filterGroupsByChannel(groups, selectedChannel),
    [groups, selectedChannel],
  )

  const filteredRowCount = useMemo(
    () => countRowsInGroups(filteredGroups),
    [filteredGroups],
  )

  const totalDayCountSum = useMemo(() => sumDayCountInGroups(groups), [groups])

  const filteredDayCountSum = useMemo(
    () => sumDayCountInGroups(filteredGroups),
    [filteredGroups],
  )

  const dayCountSumByChannel = useMemo(() => {
    const map = new Map<string, number>()
    for (const channel of channels) {
      const channelGroups = filterGroupsByChannel(groups, channel)
      map.set(channel, sumDayCountInGroups(channelGroups))
    }
    return map
  }, [groups, channels])

  useEffect(() => {
    setSelectedChannel(ALL_CHANNELS)
  }, [fileCount])

  useEffect(() => {
    if (selectedChannel && !channels.includes(selectedChannel)) {
      setSelectedChannel(ALL_CHANNELS)
    }
  }, [channels, selectedChannel])

  const canDownload = !loading && filteredRowCount > 0

  const handleDownload = () => {
    if (!canDownload) return
    downloadOrganizedExcel(filteredGroups)
  }

  const summaryText = () => {
    if (fileCount === 0) {
      return '엑셀의 모든 시트를 합쳐 날짜·시간별로 정리합니다'
    }
    if (loading) return '모든 시트를 불러오는 중…'

    if (selectedChannel) {
      return `${selectedChannel} ${filteredDayCountSum}회 · 전체 ${totalDayCountSum}회 · ${filteredGroups.length}일`
    }
    return `총 ${totalDayCountSum}회 · ${totalSheets}개 시트 · ${groups.length}일`
  }

  return (
    <aside className="organized-view" aria-label="파일 정리 및 보기">
      <header className="organized-view__header">
        <div className="organized-view__header-text">
          <h2>파일 정리 및 보기</h2>
          <p className="organized-view__summary">{summaryText()}</p>
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

      {channels.length > 0 && !loading && (
        <div className="organized-view__filter">
          <label className="organized-view__filter-label" htmlFor="channel-filter">
            채널
          </label>
          <select
            id="channel-filter"
            className="organized-view__select"
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
          >
            <option value={ALL_CHANNELS}>전체 ({totalDayCountSum}회)</option>
            {channels.map((channel) => {
              const count = dayCountSumByChannel.get(channel) ?? 0
              return (
                <option key={channel} value={channel}>
                  {channel} ({count}회)
                </option>
              )
            })}
          </select>
        </div>
      )}

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
            A~G열: 프로그램·시작·끝·시급·초수·CM·월횟수, H열부터 일자별로
            1일횟수(1, 2 …)가 표기된 형식입니다. 채널은 시트명을 사용합니다.
          </p>
        )}

        {fileCount > 0 && !loading && totalRows === 0 && errors.length === 0 && (
          <p className="organized-view__empty">
            읽을 수 있는 데이터가 없습니다. 첫 행에 프로그램·시작 등 헤더와 H열
            이후 일자(1,2,3…)가 있는지 확인해 주세요.
          </p>
        )}

        {fileCount > 0 &&
          !loading &&
          totalRows > 0 &&
          selectedChannel &&
          filteredRowCount === 0 && (
            <p className="organized-view__empty">선택한 채널에 해당하는 데이터가 없습니다.</p>
          )}

        {filteredGroups.map((group) => (
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
                    <th scope="col">CM</th>
                    <th scope="col">1일횟수</th>
                    <th scope="col">시급</th>
                    <th scope="col">초수</th>
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
                      <td>{row.cmPosition}</td>
                      <td>{row.dayCount}</td>
                      <td className="organized-view__meta">{row.hourlyWage}</td>
                      <td className="organized-view__meta">{row.seconds}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="organized-view__day-count">
              1일횟수 합 {sumDayCountInRows(group.rows)}회
            </p>
          </section>
        ))}
      </div>
    </aside>
  )
}
