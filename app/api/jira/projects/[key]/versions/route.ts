export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSettings, getJiraHeaders } from '@/lib/settings'

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await params
  const settings = await getSettings()
  if (!settings?.jiraBaseUrl || !settings?.jiraEmail || !settings?.jiraApiToken) {
    return NextResponse.json({ error: 'Jira not configured' }, { status: 400 })
  }

  try {
    const project = await prisma.project.findUnique({ where: { jiraProjectKey: key } })
    if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

    const res = await fetch(`${settings.jiraBaseUrl}/rest/api/3/project/${key}/versions`, {
      headers: getJiraHeaders(settings.jiraEmail, settings.jiraApiToken),
    })
    if (!res.ok) {
      return NextResponse.json({ error: `Jira API error: ${res.status}` }, { status: res.status })
    }
    const versions = await res.json()
    for (const v of (versions ?? [])) {
      await prisma.release.upsert({
        where: { jiraVersionId: String(v.id) },
        update: {
          name: v.name,
          status: v.released ? 'released' : v.archived ? 'archived' : 'unreleased',
          releaseDate: v.releaseDate ? new Date(v.releaseDate) : null,
        },
        create: {
          jiraVersionId: String(v.id),
          projectId: project.id,
          name: v.name,
          status: v.released ? 'released' : v.archived ? 'archived' : 'unreleased',
          releaseDate: v.releaseDate ? new Date(v.releaseDate) : null,
        },
      })
    }
    const dbReleases = await prisma.release.findMany({
      where: { projectId: project.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(dbReleases)
  } catch (error: any) {
    console.error('Jira versions error:', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch versions' }, { status: 500 })
  }
}
