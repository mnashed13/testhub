import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layouts/app-shell'
import { SidebarNav } from '@/components/sidebar-nav'

export const dynamic = 'force-dynamic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <AppShell sidebar={<SidebarNav />}>
      {children}
    </AppShell>
  )
}
