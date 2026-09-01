export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const runs = await prisma.testRun.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      release: { include: { project: true } },
      items: { select: { status: true } },
    },
  })

  const result = runs.map((r: any) => {
    const items = r?.items ?? []
    const total = items?.length ?? 0
    const passed = items.filter((i: any) => i?.status === 'passed')?.length ?? 0
    const executed = items.filter((i: any) => i?.status !== 'not_run')?.length ?? 0
    return {
      id: r.id,
      name: r.name,
      status: r.status,
      environment: r.environment,
      releaseName: r?.release?.name ?? '',
      projectName: r?.release?.project?.name ?? '',
      projectKey: r?.release?.project?.jiraProjectKey ?? '',
      createdAt: r.createdAt?.toISOString() ?? '',
      totalItems: total,
      passed,
      completion: total > 0 ? Math.round((executed / total) * 100) : 0,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
    }
  })

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body?.name || !body?.releaseId) {
    return NextResponse.json({ error: 'name and releaseId are required' }, { status: 400 })
  }

  const run = await prisma.testRun.create({
    data: {
      name: body.name,
      releaseId: body.releaseId,
      environment: body.environment ?? null,
      status: 'in_progress',
      startDate: new Date(),
      createdById: session.user.id,
    },
  })
  return NextResponse.json(run, { status: 201 })
}
