export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const search = url.searchParams.get('search') ?? ''
  const folder = url.searchParams.get('folder') ?? ''
  const tag = url.searchParams.get('tag') ?? ''
  const priority = url.searchParams.get('priority') ?? ''

  const where: any = {}
  if (search) where.title = { contains: search, mode: 'insensitive' }
  if (folder) where.folder = folder
  if (tag) where.tags = { has: tag }
  if (priority) where.priority = priority

  const testCases = await prisma.testCase.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(testCases)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body?.title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const tc = await prisma.testCase.create({
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
  return NextResponse.json(tc, { status: 201 })
}
