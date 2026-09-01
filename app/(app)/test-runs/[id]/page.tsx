import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { TestRunDetailClient } from './test-run-detail-client'

export const dynamic = 'force-dynamic'

export default async function TestRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { id } = await params
  return <TestRunDetailClient runId={id} />
}
