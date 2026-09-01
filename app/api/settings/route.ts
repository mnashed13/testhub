export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } })
  if (!settings) {
    return NextResponse.json({
      jiraBaseUrl: '',
      jiraEmail: '',
      jiraApiToken: '',
      githubPat: '',
      webhookSecret: process.env.WEBHOOK_SECRET ?? '',
    })
  }
  return NextResponse.json({
    jiraBaseUrl: settings.jiraBaseUrl ?? '',
    jiraEmail: settings.jiraEmail ?? '',
    jiraApiToken: settings.jiraApiToken ? '••••••••' : '',
    githubPat: settings.githubPat ? '••••••••' : '',
    webhookSecret: settings.webhookSecret ?? process.env.WEBHOOK_SECRET ?? '',
  })
}

export async function PUT(req: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const data: any = {}

  if (body.jiraBaseUrl !== undefined) data.jiraBaseUrl = body.jiraBaseUrl || null
  if (body.jiraEmail !== undefined) data.jiraEmail = body.jiraEmail || null
  if (body.jiraApiToken !== undefined && body.jiraApiToken !== '••••••••') data.jiraApiToken = body.jiraApiToken || null
  if (body.githubPat !== undefined && body.githubPat !== '••••••••') data.githubPat = body.githubPat || null
  if (body.webhookSecret !== undefined) data.webhookSecret = body.webhookSecret || null

  const settings = await prisma.settings.upsert({
    where: { id: 'singleton' },
    update: data,
    create: { id: 'singleton', ...data },
  })

  return NextResponse.json({ success: true })
}
