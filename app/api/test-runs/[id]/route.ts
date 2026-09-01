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
      createdBy: { select: { name: true, email: true } },
      items: {
        include: {
          testCase: true,
          ciResults: { orderBy: { reportedAt: 'desc' }, take: 1 },
        },
        orderBy: { updatedAt: 'desc' },
      },
    },
  })
  if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({
    ...run,
    createdAt: run.createdAt?.toISOString() ?? '',
    updatedAt: run.updatedAt?.toISOString() ?? '',
    startDate: run.startDate?.toISOString() ?? null,
    endDate: run.endDate?.toISOString() ?? null,
    items: (run?.items ?? []).map((item: any) => ({
      ...item,
      lastResultAt: item.lastResultAt?.toISOString() ?? null,
      updatedAt: item.updatedAt?.toISOString() ?? '',
      ciResults: (item?.ciResults ?? []).map((cr: any) => ({
        ...cr,
        reportedAt: cr.reportedAt?.toISOString() ?? '',
      })),
    })),
  })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const data: any = {}
  if (body.name !== undefined) data.name = body.name
  if (body.status !== undefined) {
    data.status = body.status
    if (body.status === 'completed') data.endDate = new Date()
  }
  if (body.environment !== undefined) data.environment = body.environment

  const run = await prisma.testRun.update({ where: { id }, data })
  return NextResponse.json(run)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.testRun.delete({ where: { id } }).catch(() => null)
  return NextResponse.json({ success: true })
}
