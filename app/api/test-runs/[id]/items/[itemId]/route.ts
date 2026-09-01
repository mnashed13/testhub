export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId } = await params
  const body = await req.json()
  const data: any = {}
  if (body.status !== undefined) data.status = body.status
  if (body.notes !== undefined) data.notes = body.notes
  if (body.evidenceUrl !== undefined) data.evidenceUrl = body.evidenceUrl
  if (body.status && body.status !== 'not_run') data.lastResultAt = new Date()

  const item = await prisma.testRunItem.update({ where: { id: itemId }, data })
  return NextResponse.json(item)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string; itemId: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { itemId } = await params
  await prisma.testRunItem.delete({ where: { id: itemId } }).catch(() => null)
  return NextResponse.json({ success: true })
}
