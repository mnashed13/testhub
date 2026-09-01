import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { TestCasesClient } from './test-cases-client'

export const dynamic = 'force-dynamic'

export default async function TestCasesPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const testCases = await prisma.testCase.findMany({ orderBy: { updatedAt: 'desc' } })
  const folders = [...new Set((testCases ?? []).map((tc: any) => tc?.folder).filter(Boolean))] as string[]
  const allTags = [...new Set((testCases ?? []).flatMap((tc: any) => tc?.tags ?? []))]

  return (
    <TestCasesClient
      testCases={testCases.map((tc: any) => ({ ...tc, createdAt: tc.createdAt?.toISOString() ?? '', updatedAt: tc.updatedAt?.toISOString() ?? '' }))}
      folders={folders}
      allTags={allTags}
    />
  )
}
