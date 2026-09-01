export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const tc = await prisma.testCase.findUnique({ where: { id } })
  if (!tc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(tc)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const tc = await prisma.testCase.update({
    where: { id },
    data: {
      title: body.title,
      preconditions: body.preconditions ?? null,
      steps: body.steps ?? [],
      expectedResult: body.expectedResult ?? null,
      tags: body.tags ?? [],
      folder: body.folder ?? null,
      linkedIssueKey: body.linkedIssueKey ?? null,
      priority: body.priority ?? 'medium',
      owner: body.owner ?? null,
    },
  })
  return NextResponse.json(tc)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.testCase.delete({ where: { id } }).catch(() => null)
  return NextResponse.json({ success: true })
}
