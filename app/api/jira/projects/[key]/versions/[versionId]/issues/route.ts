export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSettings, getJiraHeaders } from '@/lib/settings'

export async function GET(_req: Request, { params }: { params: Promise<{ key: string; versionId: string }> }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key, versionId } = await params
  const settings = await getSettings()
  if (!settings?.jiraBaseUrl || !settings?.jiraEmail || !settings?.jiraApiToken) {
    return NextResponse.json({ error: 'Jira not configured' }, { status: 400 })
  }

  try {
    const jql = `project=${key} AND fixVersion=${versionId}`
    const res = await fetch(
      `${settings.jiraBaseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=100&fields=summary,status,issuetype,priority`,
      { headers: getJiraHeaders(settings.jiraEmail, settings.jiraApiToken) }
    )
    if (!res.ok) {
      return NextResponse.json({ error: `Jira API error: ${res.status}` }, { status: res.status })
    }
    const data = await res.json()
    return NextResponse.json(data?.issues ?? [])
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 })
  }
}
