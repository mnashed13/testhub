'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/layouts/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, Plus, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { SafeDate } from '@/components/safe-format'
import { useRouter } from 'next/navigation'

interface ReleaseRow {
  id: string
  jiraVersionId: string
  name: string
  status: string
  releaseDate: string | null
  testRunCount: number
}

export function ReleasesClient({
  projectKey,
  projectName,
  releases: initial,
}: {
  projectKey: string
  projectName: string
  releases: ReleaseRow[]
}) {
  const [releases, setReleases] = useState(initial)
  const [syncing, setSyncing] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [selectedRelease, setSelectedRelease] = useState('')
  const [runName, setRunName] = useState('')
  const [environment, setEnvironment] = useState('')
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  async function syncVersions() {
    setSyncing(true)
    try {
      const res = await fetch(`/api/jira/projects/${projectKey}/versions`)
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error ?? 'Failed to sync')
        return
      }
      setReleases(data.map((r: any) => ({
        id: r.id, jiraVersionId: r.jiraVersionId, name: r.name, status: r.status,
        releaseDate: r.releaseDate ?? null, testRunCount: 0
      })))
      toast.success('Releases synced')
    } catch {
      toast.error('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  async function createTestRun() {
    if (!selectedRelease || !runName) {
      toast.error('Name and release are required')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/test-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: runName, releaseId: selectedRelease, environment }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error ?? 'Failed to create')
        return
      }
      toast.success('Test run created')
      setCreateOpen(false)
      router.push(`/test-runs/${data.id}`)
    } catch {
      toast.error('Failed to create test run')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${projectName} — Releases`}
        description={`Fix versions from Jira project ${projectKey}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={syncVersions} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" /> Create Test Run</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Test Run</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Run Name</Label>
                    <Input placeholder="e.g. v2.1 Regression" value={runName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRunName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Release</Label>
                    <Select value={selectedRelease} onValueChange={setSelectedRelease}>
                      <SelectTrigger><SelectValue placeholder="Select release" /></SelectTrigger>
                      <SelectContent>
                        {releases.map((r) => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Environment (optional)</Label>
                    <Input placeholder="e.g. staging, production" value={environment} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnvironment(e.target.value)} />
                  </div>
                  <Button onClick={createTestRun} disabled={creating} className="w-full">
                    {creating ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {releases.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="font-medium text-muted-foreground">No releases found</p>
            <p className="text-sm text-muted-foreground mt-1">Sync fix versions from Jira</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead>Test Runs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {releases.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-muted-foreground">
                      {r.releaseDate ? <SafeDate date={r.releaseDate} options={{ dateStyle: 'medium' }} /> : '—'}
                    </TableCell>
                    <TableCell>{r.testRunCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
