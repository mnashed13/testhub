export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSettings, getJiraHeaders } from '@/lib/settings'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await getSettings()
  if (!settings?.jiraBaseUrl || !settings?.jiraEmail || !settings?.jiraApiToken) {
    return NextResponse.json({ error: 'Jira not configured. Go to Settings to configure.' }, { status: 400 })
  }

  try {
    const res = await fetch(`${settings.jiraBaseUrl}/rest/api/3/project`, {
      headers: getJiraHeaders(settings.jiraEmail, settings.jiraApiToken),
    })
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Jira API error: ${res.status} - ${text}` }, { status: res.status })
    }
    const projects = await res.json()
    // Upsert each project
    for (const p of (projects ?? [])) {
      await prisma.project.upsert({
        where: { jiraProjectKey: p.key },
        update: { name: p.name },
        create: { jiraProjectKey: p.key, name: p.name },
      })
    }
    const dbProjects = await prisma.project.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(dbProjects)
  } catch (error: any) {
    console.error('Jira projects error:', error)
    return NextResponse.json({ error: error?.message ?? 'Failed to fetch Jira projects' }, { status: 500 })
  }
}
