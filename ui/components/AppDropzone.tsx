'use client'

import { useEffect, useRef, useState } from 'react'
import { isTauri } from '@/lib/backend'
import { filterImageFiles } from '@/lib/filePicker'
import { useProcessing } from '@/lib/machines'

export function AppDropzone() {
  const { send, isProcessing } = useProcessing()
  const [isDragging, setIsDragging] = useState(false)
  const dragCounterRef = useRef(0)

  useEffect(() => {
    if (!isTauri()) return

    let unlisten: (() => void) | undefined

    const setup = async () => {
      const { getCurrentWindow } = await import('@tauri-apps/api/window')
      const win = getCurrentWindow()

      unlisten = await win.onDragDropEvent((event) => {
        if (event.payload.type === 'over') {
          setIsDragging(true)
        } else if (event.payload.type === 'leave') {
          setIsDragging(false)
        } else if (event.payload.type === 'drop') {
          setIsDragging(false)
          const paths = event.payload.paths
          if (paths && paths.length > 0 && !isProcessing) {
            send({ type: 'START_IMPORT_PATHS', mode: 'append', paths })
          }
        }
      })
    }

    setup().catch(() => {})

    return () => {
      unlisten?.()
    }
  }, [send, isProcessing])

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
    if (dragCounterRef.current === 1) setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current === 0) setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDragging(false)

    if (isProcessing) return

    if (isTauri()) return // handled by Tauri event listener above

    const files = filterImageFiles(Array.from(e.dataTransfer.files))
    if (files.length > 0) {
      send({ type: 'START_IMPORT_FILES', mode: 'append', files })
    }
  }

  if (isTauri()) {
    return isDragging ? (
      <div className='pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/40'>
        <div className='border-primary rounded-lg border-2 border-dashed px-8 py-6 text-white'>
          Drop images to import
        </div>
      </div>
    ) : null
  }

  return (
    <div
      className='absolute inset-0 z-50'
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{ pointerEvents: isDragging ? 'auto' : 'none' }}
    >
      {isDragging && (
        <div className='flex h-full w-full items-center justify-center bg-black/40'>
          <div className='border-primary rounded-lg border-2 border-dashed px-8 py-6 text-white'>
            Drop images to import
          </div>
        </div>
      )}
    </div>
  )
}
