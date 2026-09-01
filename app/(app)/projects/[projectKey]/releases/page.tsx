import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ReleasesClient } from './releases-client'

export const dynamic = 'force-dynamic'

export default async function ReleasesPage({ params }: { params: Promise<{ projectKey: string }> }) {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const { projectKey } = await params
  const project = await prisma.project.findUnique({
    where: { jiraProjectKey: projectKey },
    include: {
      releases: {
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { testRuns: true } } },
      },
    },
  })

  if (!project) {
    return <div className="p-8 text-muted-foreground">Project not found</div>
  }

  const releases = (project?.releases ?? []).map((r: any) => ({
    id: r.id,
    jiraVersionId: r.jiraVersionId,
    name: r.name,
    status: r.status,
    releaseDate: r.releaseDate?.toISOString() ?? null,
    testRunCount: r?._count?.testRuns ?? 0,
  }))

  return <ReleasesClient projectKey={projectKey} projectName={project.name} releases={releases} />
}
