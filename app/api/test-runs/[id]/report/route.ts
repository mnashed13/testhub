export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const run = await prisma.testRun.findUnique({
    where: { id },
    include: {
      release: { include: { project: true } },
      items: true,
    },
  })
  if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const items = run?.items ?? []
  const total = items.length
  const passed = items.filter((i: any) => i?.status === 'passed').length
  const failed = items.filter((i: any) => i?.status === 'failed').length
  const blocked = items.filter((i: any) => i?.status === 'blocked').length
  const skipped = items.filter((i: any) => i?.status === 'skipped').length
  const notRun = items.filter((i: any) => i?.status === 'not_run').length
  const manual = items.filter((i: any) => i?.origin === 'manual').length
  const automated = items.filter((i: any) => i?.origin === 'automated').length

  const failedItems = items.filter((i: any) => i?.status === 'failed').map((i: any) => ({
    id: i.id,
    title: i.title,
    origin: i.origin,
    notes: i.notes,
  }))

  return NextResponse.json({
    runName: run.name,
    releaseName: run?.release?.name ?? '',
    projectName: run?.release?.project?.name ?? '',
    environment: run.environment,
    status: run.status,
    total,
    passed,
    failed,
    blocked,
    skipped,
    notRun,
    manual,
    automated,
    passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    failedItems,
    distribution: [
      { name: 'Passed', value: passed, color: '#22c55e' },
      { name: 'Failed', value: failed, color: '#ef4444' },
      { name: 'Blocked', value: blocked, color: '#f59e0b' },
      { name: 'Skipped', value: skipped, color: '#3b82f6' },
      { name: 'Not Run', value: notRun, color: '#9ca3af' },
    ],
    originBreakdown: [
      { name: 'Manual', value: manual, color: '#0ea5e9' },
      { name: 'Automated', value: automated, color: '#8b5cf6' },
    ],
  })
}
