import { FileList } from './components/FileList'
import { FileUploader } from './components/FileUploader'
import { OrganizedView } from './components/OrganizedView'
import { useOrganizedBroadcast } from './hooks/useOrganizedBroadcast'
import { useStoredFiles } from './hooks/useStoredFiles'
import { downloadAllFiles } from './utils/downloadFile'
import './App.css'

function App() {
  const { files, addFiles, removeFile, clearAll } = useStoredFiles()
  const { groups, loading, errors, totalRows, totalSheets } =
    useOrganizedBroadcast(files)

  const handleDownloadAll = () => {
    void downloadAllFiles(files.map((item) => item.file))
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>CalculFile</h1>
        <p className="app__subtitle">
          엑셀 파일을 업로드하면 날짜·시간별로 정리해 보여줍니다
        </p>
      </header>

      <div className="app__body">
        <div className="app__left">
          <FileUploader onFilesSelected={addFiles} />
          <FileList
            files={files}
            onRemove={removeFile}
            onDownloadAll={handleDownloadAll}
            onClearAll={clearAll}
          />
        </div>

        <OrganizedView
          groups={groups}
          loading={loading}
          errors={errors}
          totalRows={totalRows}
          totalSheets={totalSheets}
          fileCount={files.length}
        />
      </div>
    </div>
  )
}

export default App
