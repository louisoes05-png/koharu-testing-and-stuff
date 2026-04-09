'use client'

import { fileOpen, directoryOpen } from 'browser-fs-access'

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp']

export const filterImageFiles = (files: Iterable<File>): File[] =>
  Array.from(files).filter((file) =>
    IMAGE_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)),
  )

export const pickImageFiles = async (): Promise<File[] | null> => {
  try {
    const files = await fileOpen({
      mimeTypes: ['image/*'],
      extensions: IMAGE_EXTENSIONS,
      multiple: true,
      description: 'Select images',
    })
    const result = filterImageFiles(Array.isArray(files) ? files : [files])
    return result.length > 0 ? result : null
  } catch {
    return null // user cancelled
  }
}

export const pickImageFolderFiles = async (): Promise<File[] | null> => {
  try {
    const files = await directoryOpen({ recursive: true })
    const images = filterImageFiles(files)
    return images.length > 0 ? images : null
  } catch {
    return null // user cancelled
  }
}
