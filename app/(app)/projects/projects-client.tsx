'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layouts/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stagger, StaggerItem } from '@/components/ui/animate'
import { FolderKanban, RefreshCw, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

interface ProjectRow {
  id: string
  jiraProjectKey: string
  name: string
  createdAt: string
  releaseCount: number
}

export function ProjectsClient({ projects: initial }: { projects: ProjectRow[] }) {
  const [projects, setProjects] = useState(initial)
  const [syncing, setSyncing] = useState(false)

  async function syncFromJira() {
    setSyncing(true)
    try {
      const res = await fetch('/api/jira/projects')
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error ?? 'Failed to sync projects')
        return
      }
      setProjects(data.map((p: any) => ({ ...p, createdAt: p.createdAt ?? '', releaseCount: p?._count?.releases ?? 0 })))
      toast.success(`Synced ${data.length} projects from Jira`)
    } catch {
      toast.error('Failed to sync from Jira')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Jira projects synced with TestHub"
        actions={
          <Button onClick={syncFromJira} disabled={syncing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync from Jira'}
          </Button>
        }
      />

      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="font-medium text-muted-foreground">No projects synced yet</p>
            <p className="text-sm text-muted-foreground mt-1">Configure Jira in Settings, then click &quot;Sync from Jira&quot;</p>
          </CardContent>
        </Card>
      ) : (
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" staggerDelay={0.05}>
          {projects.map((p) => (
            <StaggerItem key={p.id}>
              <Link href={`/projects/${p.jiraProjectKey}/releases`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-mono text-xs text-muted-foreground">{p.jiraProjectKey}</p>
                        <p className="font-display text-lg font-semibold mt-1">{p.name}</p>
                        <p className="text-sm text-muted-foreground mt-2">{p.releaseCount} release{p.releaseCount !== 1 ? 's' : ''}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </div>
  )
}
