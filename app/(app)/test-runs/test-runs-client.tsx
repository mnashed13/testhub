'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layouts/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/status-badge'
import { FadeIn } from '@/components/ui/animate'
import { Plus, PlayCircle } from 'lucide-react'
import { SafeDate } from '@/components/safe-format'
import { toast } from 'sonner'

interface RunRow {
  id: string
  name: string
  status: string
  environment: string | null
  releaseName: string
  projectName: string
  createdAt: string
  totalItems: number
  completion: number
  passRate: number
}

export function TestRunsClient({ runs, releases }: { runs: RunRow[]; releases: { id: string; name: string }[] }) {
  const [createOpen, setCreateOpen] = useState(false)
  const [runName, setRunName] = useState('')
  const [releaseId, setReleaseId] = useState('')
  const [environment, setEnvironment] = useState('')
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  async function handleCreate() {
    if (!runName || !releaseId) {
      toast.error('Name and release are required')
      return
    }
    setCreating(true)
    try {
      const res = await fetch('/api/test-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: runName, releaseId, environment }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error ?? 'Failed')
        return
      }
      toast.success('Test run created')
      setCreateOpen(false)
      router.push(`/test-runs/${data.id}`)
    } catch {
      toast.error('Failed')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Runs"
        description="All test execution runs across releases"
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> New Test Run</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Test Run</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Run Name</Label>
                  <Input placeholder="e.g. Sprint 5 Regression" value={runName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRunName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Release</Label>
                  <Select value={releaseId} onValueChange={setReleaseId}>
                    <SelectTrigger><SelectValue placeholder="Select release" /></SelectTrigger>
                    <SelectContent>
                      {releases.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Environment (optional)</Label>
                  <Input placeholder="staging, production" value={environment} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEnvironment(e.target.value)} />
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full">{creating ? 'Creating...' : 'Create'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <FadeIn>
        {runs.length === 0 ? (
          <Card>
            <CardContent className="text-center py-16">
              <PlayCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
              <p className="font-medium text-muted-foreground">No test runs yet</p>
              <p className="text-sm text-muted-foreground mt-1">Create your first test run to start tracking</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Release</TableHead>
                    <TableHead>Env</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Pass Rate</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {runs.map((run) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        <Link href={`/test-runs/${run.id}`} className="font-medium text-primary hover:underline">{run.name}</Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{run.projectName}</TableCell>
                      <TableCell>{run.releaseName}</TableCell>
                      <TableCell className="text-muted-foreground">{run.environment ?? '—'}</TableCell>
                      <TableCell><StatusBadge status={run.status} /></TableCell>
                      <TableCell>{run.totalItems}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${run.completion}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{run.completion}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-mono text-sm ${run.passRate >= 80 ? 'text-emerald-600' : run.passRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {run.passRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground"><SafeDate date={run.createdAt} options={{ dateStyle: 'short' }} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </FadeIn>
    </div>
  )
}
