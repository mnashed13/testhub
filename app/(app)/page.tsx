import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { DashboardClient } from './dashboard-client'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const [totalRuns, activeRuns, recentRuns] = await Promise.all([
    prisma.testRun.count(),
    prisma.testRun.count({ where: { status: 'in_progress' } }),
    prisma.testRun.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        release: { include: { project: true } },
        items: { select: { status: true } },
      },
    }),
  ])

  const allItems = recentRuns.flatMap((r: any) => r?.items ?? [])
  const totalItems = allItems?.length ?? 0
  const passedItems = allItems.filter((i: any) => i?.status === 'passed')?.length ?? 0
  const overallPassRate = totalItems > 0 ? Math.round((passedItems / totalItems) * 100) : 0

  const runs = recentRuns.map((r: any) => {
    const items = r?.items ?? []
    const total = items?.length ?? 0
    const passed = items.filter((i: any) => i?.status === 'passed')?.length ?? 0
    const failed = items.filter((i: any) => i?.status === 'failed')?.length ?? 0
    const completion = total > 0
      ? Math.round(((items.filter((i: any) => i?.status !== 'not_run')?.length ?? 0) / total) * 100)
      : 0
    return {
      id: r.id,
      name: r.name,
      status: r.status,
      environment: r.environment,
      releaseName: r?.release?.name ?? 'Unknown',
      projectName: r?.release?.project?.name ?? 'Unknown',
      createdAt: r.createdAt?.toISOString() ?? '',
      totalItems: total,
      passed,
      failed,
      completion,
    }
  })

  return (
    <DashboardClient
      totalRuns={totalRuns}
      activeRuns={activeRuns}
      overallPassRate={overallPassRate}
      recentRuns={runs}
    />
  )
}
