import { FileList } from './components/FileList'
import { FileUploader } from './components/FileUploader'
import { useStoredFiles } from './hooks/useStoredFiles'
import { downloadAllFiles } from './utils/downloadFile'
import './App.css'

function App() {
  const { files, addFiles, removeFile, clearAll } = useStoredFiles()

  const handleDownloadAll = () => {
    void downloadAllFiles(files.map((item) => item.file))
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>CalculFile</h1>
        <p className="app__subtitle">엑셀 파일을 업로드하고 다운로드할 수 있습니다</p>
      </header>

      <main className="app__main">
        <FileUploader onFilesSelected={addFiles} />
        <FileList
          files={files}
          onRemove={removeFile}
          onDownloadAll={handleDownloadAll}
          onClearAll={clearAll}
        />
      </main>
    </div>
  )
}

export default App
