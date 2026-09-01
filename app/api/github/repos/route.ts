export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const repos = await prisma.githubRepo.findMany({ orderBy: { addedAt: 'desc' } })
  return NextResponse.json(repos)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { owner, repo, defaultBranch } = body ?? {}
  if (!owner || !repo) {
    return NextResponse.json({ error: 'owner and repo are required' }, { status: 400 })
  }

  const existing = await prisma.githubRepo.findUnique({ where: { owner_repo: { owner, repo } } })
  if (existing) {
    return NextResponse.json({ error: 'Repository already added' }, { status: 409 })
  }

  const created = await prisma.githubRepo.create({
    data: { owner, repo, defaultBranch: defaultBranch ?? 'main' },
  })
  return NextResponse.json(created, { status: 201 })
}
