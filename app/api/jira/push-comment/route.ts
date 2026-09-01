export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSettings, getJiraHeaders } from '@/lib/settings'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { issueKey, comment } = body ?? {}
  if (!issueKey || !comment) {
    return NextResponse.json({ error: 'issueKey and comment are required' }, { status: 400 })
  }

  const settings = await getSettings()
  if (!settings?.jiraBaseUrl || !settings?.jiraEmail || !settings?.jiraApiToken) {
    return NextResponse.json({ error: 'Jira not configured' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `${settings.jiraBaseUrl}/rest/api/3/issue/${issueKey}/comment`,
      {
        method: 'POST',
        headers: getJiraHeaders(settings.jiraEmail, settings.jiraApiToken),
        body: JSON.stringify({
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: comment }],
              },
            ],
          },
        }),
      }
    )
    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ error: `Jira error: ${text}` }, { status: res.status })
    }
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message ?? 'Failed' }, { status: 500 })
  }
}
