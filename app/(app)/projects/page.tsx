import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { ProjectsClient } from './projects-client'

export const dynamic = 'force-dynamic'

export default async function ProjectsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const projects = await prisma.project.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { releases: true } } },
  })

  return <ProjectsClient projects={projects.map((p: any) => ({ ...p, createdAt: p.createdAt?.toISOString() ?? '', releaseCount: p?._count?.releases ?? 0 }))} />
}
