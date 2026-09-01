import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TestRunsClient } from './test-runs-client'

export const dynamic = 'force-dynamic'

export default async function TestRunsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const runs = await prisma.testRun.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      release: { include: { project: true } },
      items: { select: { status: true } },
    },
  })

  const releases = await prisma.release.findMany({
    include: { project: true },
    orderBy: { createdAt: 'desc' },
  })

  const runsData = runs.map((r: any) => {
    const items = r?.items ?? []
    const total = items.length
    const passed = items.filter((i: any) => i?.status === 'passed').length
    const executed = items.filter((i: any) => i?.status !== 'not_run').length
    return {
      id: r.id, name: r.name, status: r.status, environment: r.environment,
      releaseName: r?.release?.name ?? '', projectName: r?.release?.project?.name ?? '',
      createdAt: r.createdAt?.toISOString() ?? '', totalItems: total,
      completion: total > 0 ? Math.round((executed / total) * 100) : 0,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    }
  })

  const releasesData = releases.map((r: any) => ({
    id: r.id, name: `${r?.project?.name ?? ''} - ${r.name}`,
  }))

  return <TestRunsClient runs={runsData} releases={releasesData} />
}
