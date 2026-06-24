import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/Sidebar'
import { BackupIndicator } from '@/features/backup/components/BackupIndicator'

export function Layout() {
  return (
    <div className="flex h-screen bg-c-bg">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-9 shrink-0 items-center justify-end border-b border-c-border bg-c-surface px-4">
          <BackupIndicator />
        </header>
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
