export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSettings, getGithubHeaders } from '@/lib/settings'

interface TreeItem {
  path?: string
  type?: string
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const repo = await prisma.githubRepo.findUnique({ where: { id } })
  if (!repo) return NextResponse.json({ error: 'Repo not found' }, { status: 404 })

  const settings = await getSettings()
  if (!settings?.githubPat) {
    return NextResponse.json({ error: 'GitHub PAT not configured. Go to Settings.' }, { status: 400 })
  }

  try {
    const url = `https://api.github.com/repos/${repo.owner}/${repo.repo}/git/trees/${repo.defaultBranch}?recursive=1`
    const res = await fetch(url, { headers: getGithubHeaders(settings.githubPat) })
    if (!res.ok) {
      return NextResponse.json({ error: `GitHub API error: ${res.status}` }, { status: res.status })
    }
    const data = await res.json()
    const tree: TreeItem[] = data?.tree ?? []
    const testFiles = tree.filter((item: TreeItem) => {
      const p = item?.path ?? ''
      if (item?.type !== 'blob') return false
      return (
        p.endsWith('.feature') ||
        p.endsWith('.spec.ts') ||
        p.endsWith('.spec.js') ||
        p.endsWith('.test.ts') ||
        p.endsWith('.test.js') ||
        p.endsWith('.spec.tsx') ||
        p.endsWith('.test.tsx') ||
        p.includes('e2e/') ||
        p.includes('tests/') ||
        p.includes('__tests__/')
      )
    }).map((item: TreeItem) => ({
      path: item?.path ?? '',
      tags: extractTags(item?.path ?? ''),
    }))

    return NextResponse.json({ repoId: id, owner: repo.owner, repo: repo.repo, branch: repo.defaultBranch, files: testFiles, count: testFiles.length })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed to discover tests' }, { status: 500 })
  }
}

function extractTags(path: string): string[] {
  const tags: string[] = []
  if (path.endsWith('.feature')) tags.push('cucumber')
  if (path.includes('.spec.')) tags.push('playwright')
  if (path.includes('.test.')) tags.push('jest')
  if (path.includes('e2e/')) tags.push('e2e')
  if (path.includes('integration/')) tags.push('integration')
  if (path.includes('unit/')) tags.push('unit')
  return tags
}
