'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isTauri } from '@/lib/backend'
import { useProcessing } from '@/lib/machines'

const hasFileDrag = (event: DragEvent) =>
  Array.from(event.dataTransfer?.types ?? []).includes('Files')

const DRAG_HIDE_DELAY_MS = 180
const dedupePaths = (paths: string[]) => Array.from(new Set(paths))

export function AppDropzone() {
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const dragDepth = useRef(0)
  const hideTimeout = useRef<number | null>(null)
  const { send, isProcessing } = useProcessing()
  const { t } = useTranslation()

  useEffect(() => {
    const clearHideTimeout = () => {
      if (hideTimeout.current != null) {
        window.clearTimeout(hideTimeout.current)
        hideTimeout.current = null
      }
    }

    const showDropIndicator = () => {
      clearHideTimeout()
      setIsDraggingFiles(true)
    }

    const hideDropIndicator = () => {
      clearHideTimeout()
      setIsDraggingFiles(false)
    }

    const scheduleHideDropIndicator = () => {
      clearHideTimeout()
      hideTimeout.current = window.setTimeout(() => {
        hideTimeout.current = null
        setIsDraggingFiles(false)
      }, DRAG_HIDE_DELAY_MS)
    }

    if (isTauri()) {
      let unlisten: (() => void) | undefined

      void import('@tauri-apps/api/window')
        .then(async ({ getCurrentWindow }) => {
          unlisten = await getCurrentWindow().onDragDropEvent((event) => {
            if (event.payload.type === 'over') {
              showDropIndicator()
              scheduleHideDropIndicator()
              return
            }

            if (event.payload.type === 'drop') {
              hideDropIndicator()
              if (isProcessing) return
              const paths = dedupePaths(event.payload.paths)
              if (paths.length === 0) return
              send({
                type: 'START_IMPORT_PATHS',
                mode: 'append',
                paths,
              })
              return
            }

            hideDropIndicator()
          })
        })
        .catch(() => {})

      return () => {
        hideDropIndicator()
        unlisten?.()
      }
    }

    const handleDragEnter = (event: DragEvent) => {
      if (!hasFileDrag(event)) return
      dragDepth.current += 1
      showDropIndicator()
    }

    const handleDragOver = (event: DragEvent) => {
      if (!hasFileDrag(event)) return
      event.preventDefault()
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy'
      }
      showDropIndicator()
    }

    const handleDragLeave = (event: DragEvent) => {
      if (!hasFileDrag(event)) return
      dragDepth.current = Math.max(0, dragDepth.current - 1)
      if (dragDepth.current === 0) {
        hideDropIndicator()
      }
    }

    const handleDrop = (event: DragEvent) => {
      if (!hasFileDrag(event)) return
      event.preventDefault()
      dragDepth.current = 0
      hideDropIndicator()

      if (isProcessing) return

      const files = Array.from(event.dataTransfer?.files ?? [])
      if (files.length === 0) return

      send({
        type: 'START_IMPORT_FILES',
        mode: 'append',
        files,
      })
    }

    const handleWindowBlur = () => {
      dragDepth.current = 0
      hideDropIndicator()
    }

    window.addEventListener('dragenter', handleDragEnter)
    window.addEventListener('dragover', handleDragOver)
    window.addEventListener('dragleave', handleDragLeave)
    window.addEventListener('drop', handleDrop)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      clearHideTimeout()
      window.removeEventListener('dragenter', handleDragEnter)
      window.removeEventListener('dragover', handleDragOver)
      window.removeEventListener('dragleave', handleDragLeave)
      window.removeEventListener('drop', handleDrop)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [isProcessing, send])

  if (!isDraggingFiles) return null

  return (
    <div className='pointer-events-none fixed top-12 right-5 z-[70]'>
      <div className='border-primary/60 bg-background/96 text-foreground flex max-w-sm flex-col gap-2 rounded-2xl border border-dashed px-4 py-3 text-left shadow-2xl'>
        <p className='text-sm leading-none font-semibold'>
          {t('workspace.dropFilesTitle', {
            defaultValue: 'Drop images or folders to add them',
          })}
        </p>
        <p className='text-muted-foreground text-xs leading-5'>
          {isProcessing
            ? t('workspace.dropFilesBusy', {
                defaultValue:
                  'Finish the current task before dropping new files.',
              })
            : t('workspace.dropFilesDescription', {
                defaultValue:
                  'Dropped folders are scanned recursively for PNG, JPG, JPEG, and WEBP images.',
              })}
        </p>
      </div>
    </div>
  )
}
