import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TestCaseDetailClient } from './test-case-detail-client'

export const dynamic = 'force-dynamic'

export default async function TestCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params
  const tc = await prisma.testCase.findUnique({ where: { id } })
  if (!tc) {
    return <div className="p-8 text-muted-foreground">Test case not found</div>
  }

  return (
    <TestCaseDetailClient
      testCase={{
        ...tc,
        createdAt: tc.createdAt?.toISOString() ?? '',
        updatedAt: tc.updatedAt?.toISOString() ?? '',
      }}
    />
  )
}
