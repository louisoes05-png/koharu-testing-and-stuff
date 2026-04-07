'use client'

import { AppDropzone } from '@/components/AppDropzone'
import { MenuBar } from '@/components/MenuBar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='bg-background relative flex h-screen w-screen flex-col overflow-hidden'>
      <MenuBar />
      {children}
      <AppDropzone />
    </div>
  )
}
