export function downloadFile(file: File, filename?: string): void {
  const url = URL.createObjectURL(file)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename ?? file.name
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function downloadAllFiles(files: File[]): Promise<void> {
  for (const file of files) {
    downloadFile(file)
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
}
