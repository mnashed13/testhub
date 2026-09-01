export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSettings, getGithubHeaders } from '@/lib/settings'

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const settings = await getSettings()
  if (!settings?.githubPat) {
    return NextResponse.json({ error: 'GitHub PAT not configured' }, { status: 400 })
  }

  const items = await prisma.testRunItem.findMany({
    where: { testRunId: id, origin: 'automated' },
  })

  if (items.length === 0) {
    return NextResponse.json({ message: 'No automated items to sync' })
  }

  // Group items by repo
  const repoMap = new Map<string, typeof items>()
  for (const item of items) {
    const key = `${item.repoOwner}/${item.repoName}`
    if (!repoMap.has(key)) repoMap.set(key, [])
    repoMap.get(key)?.push(item)
  }

  let synced = 0
  for (const [repoKey, repoItems] of repoMap) {
    const [owner, repo] = repoKey.split('/')
    if (!owner || !repo) continue

    try {
      // Get latest workflow runs
      const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=5&status=completed`
      const res = await fetch(url, { headers: getGithubHeaders(settings.githubPat) })
      if (!res.ok) continue

      const data = await res.json()
      const latestRun = (data?.workflow_runs ?? [])?.[0]
      if (!latestRun) continue

      // Mark items based on workflow conclusion
      const workflowStatus = latestRun.conclusion === 'success' ? 'passed' : 'failed'
      for (const item of repoItems) {
        await prisma.testRunItem.update({
          where: { id: item.id },
          data: { status: workflowStatus, lastResultAt: new Date() },
        })
        await prisma.cIResult.create({
          data: {
            testRunItemId: item.id,
            provider: 'github-actions',
            externalRunId: String(latestRun.id),
            status: workflowStatus,
            reportedAt: new Date(),
          },
        })
        synced++
      }
    } catch (e) {
      console.error(`Failed to sync CI for ${repoKey}:`, e)
    }
  }

  return NextResponse.json({ message: `Synced ${synced} items` })
}
