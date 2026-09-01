export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const items = body?.items as any[] | undefined
  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'items array is required' }, { status: 400 })
  }

  const created = []
  for (const item of items) {
    const record = await prisma.testRunItem.create({
      data: {
        testRunId: id,
        testCaseId: item.testCaseId ?? null,
        origin: item.origin ?? 'manual',
        title: item.title ?? 'Untitled',
        filePath: item.filePath ?? null,
        repoOwner: item.repoOwner ?? null,
        repoName: item.repoName ?? null,
        branch: item.branch ?? null,
        tags: item.tags ?? [],
      },
    })
    created.push(record)
  }

  return NextResponse.json(created, { status: 201 })
}
