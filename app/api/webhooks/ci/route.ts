export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSettings } from '@/lib/settings'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const settings = await getSettings()
    const secret = settings?.webhookSecret ?? process.env.WEBHOOK_SECRET ?? ''

    // Verify HMAC signature
    const signature = req.headers.get('x-hub-signature-256') ?? req.headers.get('x-webhook-signature') ?? ''
    const rawBody = await req.text()

    if (secret && signature) {
      const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
      if (signature !== expected) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const contentType = req.headers.get('content-type') ?? ''
    let results: Array<{ name: string; status: string; duration?: number; errorMessage?: string }> = []
    let provider = 'github-actions'
    let externalRunId: string | undefined

    if (contentType.includes('application/json')) {
      // Cucumber JSON or custom JSON
      const json = JSON.parse(rawBody)
      if (Array.isArray(json)) {
        // Cucumber JSON format
        for (const feature of json) {
          for (const scenario of (feature?.elements ?? [])) {
            const steps = scenario?.steps ?? []
            const allPassed = steps.every((s: any) => s?.result?.status === 'passed')
            const anyFailed = steps.some((s: any) => s?.result?.status === 'failed')
            results.push({
              name: scenario?.name ?? 'Unknown',
              status: anyFailed ? 'failed' : allPassed ? 'passed' : 'skipped',
              duration: steps.reduce((acc: number, s: any) => acc + ((s?.result?.duration ?? 0) / 1000000), 0),
              errorMessage: anyFailed ? steps.find((s: any) => s?.result?.status === 'failed')?.result?.error_message : undefined,
            })
          }
        }
      } else if (json?.results) {
        // Custom format: { testRunId, results: [{name, status, duration?, errorMessage?}] }
        results = json.results
        externalRunId = json.externalRunId
      }
    } else if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      // Basic JUnit XML parsing
      const testcaseRegex = /<testcase[^>]*name="([^"]*?)"[^>]*(?:time="([^"]*?)")?[^>]*>(.*?)<\/testcase>|<testcase[^>]*name="([^"]*?)"[^>]*(?:time="([^"]*?)")?[^>]*\/>/gs
      let match
      while ((match = testcaseRegex.exec(rawBody)) !== null) {
        const name = match[1] ?? match[4] ?? 'Unknown'
        const time = match[2] ?? match[5]
        const inner = match[3] ?? ''
        let status = 'passed'
        let errorMessage: string | undefined
        if (inner.includes('<failure')) {
          status = 'failed'
          const msgMatch = inner.match(/message="([^"]*?)"/) 
          errorMessage = msgMatch?.[1]
        } else if (inner.includes('<skipped')) {
          status = 'skipped'
        } else if (inner.includes('<error')) {
          status = 'error'
          const msgMatch = inner.match(/message="([^"]*?)"/) 
          errorMessage = msgMatch?.[1]
        }
        results.push({
          name,
          status,
          duration: time ? Math.round(parseFloat(time) * 1000) : undefined,
          errorMessage,
        })
      }
    }

    if (results.length === 0) {
      return NextResponse.json({ message: 'No test results found in payload', matched: 0 })
    }

    // Match results to TestRunItems by title
    let matched = 0
    for (const result of results) {
      const items = await prisma.testRunItem.findMany({
        where: {
          OR: [
            { title: { contains: result.name } },
            { filePath: { contains: result.name } },
          ],
        },
      })

      for (const item of items) {
        await prisma.cIResult.create({
          data: {
            testRunItemId: item.id,
            provider,
            externalRunId: externalRunId ?? null,
            status: result.status,
            duration: result.duration ? Math.round(result.duration) : null,
            errorMessage: result.errorMessage ?? null,
            rawPayload: result as any,
          },
        })
        await prisma.testRunItem.update({
          where: { id: item.id },
          data: { status: result.status, lastResultAt: new Date() },
        })
        matched++
      }
    }

    return NextResponse.json({ message: `Processed ${results.length} results, matched ${matched} items` })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error?.message ?? 'Internal server error' }, { status: 500 })
  }
}
