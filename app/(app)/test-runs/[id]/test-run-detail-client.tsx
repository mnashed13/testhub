'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layouts/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { StatusBadge, OriginBadge } from '@/components/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SafeDate } from '@/components/safe-format'
import {
  ArrowLeft, RefreshCw, Plus, Play, CheckCircle2, XCircle,
  Ban, MinusCircle, Search, Download, FileText, Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const ReportCharts = dynamic(() => import('./report-charts'), { ssr: false, loading: () => <Skeleton className="h-64 w-full" /> })

interface CIResult {
  id: string
  status: string
  duration: number | null
  errorMessage: string | null
  reportedAt: string
}

interface RunItem {
  id: string
  title: string
  origin: string
  status: string
  tags: string[]
  notes: string | null
  evidenceUrl: string | null
  filePath: string | null
  lastResultAt: string | null
  updatedAt: string
  ciResults: CIResult[]
}

interface RunData {
  id: string
  name: string
  status: string
  environment: string | null
  startDate: string | null
  endDate: string | null
  createdAt: string
  release: { name: string; project: { name: string; jiraProjectKey: string } }
  createdBy: { name: string | null; email: string } | null
  items: RunItem[]
}

export function TestRunDetailClient({ runId }: { runId: string }) {
  const [run, setRun] = useState<RunData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('items')
  const [statusFilter, setStatusFilter] = useState('all')
  const [originFilter, setOriginFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [executeItem, setExecuteItem] = useState<RunItem | null>(null)
  const [execStatus, setExecStatus] = useState('not_run')
  const [execNotes, setExecNotes] = useState('')
  const [execEvidence, setExecEvidence] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [addManualOpen, setAddManualOpen] = useState(false)
  const [addAutoOpen, setAddAutoOpen] = useState(false)
  const [testCases, setTestCases] = useState<any[]>([])
  const [tcSearch, setTcSearch] = useState('')
  const [selectedTCs, setSelectedTCs] = useState<Set<string>>(new Set())
  const [repos, setRepos] = useState<any[]>([])
  const [selectedRepo, setSelectedRepo] = useState('')
  const [discoveredFiles, setDiscoveredFiles] = useState<any[]>([])
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [discovering, setDiscovering] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const router = useRouter()

  const fetchRun = useCallback(async () => {
    try {
      const res = await fetch(`/api/test-runs/${runId}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setRun(data)
    } catch {
      toast.error('Failed to load test run')
    } finally {
      setLoading(false)
    }
  }, [runId])

  useEffect(() => { fetchRun() }, [fetchRun])

  useEffect(() => {
    if (activeTab === 'report') {
      fetch(`/api/test-runs/${runId}/report`).then((r) => r.json()).then(setReportData).catch(() => null)
    }
  }, [activeTab, runId])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <div className="grid gap-4 sm:grid-cols-4">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (!run) return <div className="p-8 text-muted-foreground">Test run not found</div>

  const items = run?.items ?? []
  const total = items.length
  const passed = items.filter((i) => i.status === 'passed').length
  const failed = items.filter((i) => i.status === 'failed').length
  const executed = items.filter((i) => i.status !== 'not_run').length
  const completion = total > 0 ? Math.round((executed / total) * 100) : 0
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0

  const filteredItems = items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false
    if (originFilter !== 'all' && item.origin !== originFilter) return false
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  async function updateItemStatus(itemId: string, status: string, notes?: string, evidenceUrl?: string) {
    try {
      const res = await fetch(`/api/test-runs/${runId}/items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes, evidenceUrl }),
      })
      if (res.ok) {
        toast.success('Status updated')
        fetchRun()
      }
    } catch {
      toast.error('Failed to update')
    }
  }

  function openExecute(item: RunItem) {
    setExecuteItem(item)
    setExecStatus(item.status)
    setExecNotes(item.notes ?? '')
    setExecEvidence(item.evidenceUrl ?? '')
  }

  async function saveExecution() {
    if (!executeItem) return
    await updateItemStatus(executeItem.id, execStatus, execNotes, execEvidence)
    setExecuteItem(null)
  }

  async function syncCI() {
    setSyncing(true)
    try {
      const res = await fetch(`/api/test-runs/${runId}/sync-ci`, { method: 'POST' })
      const data = await res.json()
      toast.success(data?.message ?? 'Synced')
      fetchRun()
    } catch {
      toast.error('Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  async function completeRun() {
    try {
      await fetch(`/api/test-runs/${runId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      toast.success('Test run completed')
      fetchRun()
    } catch {
      toast.error('Failed')
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm('Remove this item?')) return
    await fetch(`/api/test-runs/${runId}/items/${itemId}`, { method: 'DELETE' })
    toast.success('Removed')
    fetchRun()
  }

  async function openAddManual() {
    setAddManualOpen(true)
    const res = await fetch('/api/test-cases')
    const data = await res.json()
    setTestCases(data ?? [])
  }

  async function addManualTests() {
    if (selectedTCs.size === 0) { toast.error('Select at least one test case'); return }
    const itemsToAdd = [...selectedTCs].map((tcId) => {
      const tc = testCases.find((t: any) => t.id === tcId)
      return { testCaseId: tcId, origin: 'manual', title: tc?.title ?? 'Unknown', tags: tc?.tags ?? [] }
    })
    const res = await fetch(`/api/test-runs/${runId}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: itemsToAdd }),
    })
    if (res.ok) {
      toast.success(`Added ${itemsToAdd.length} tests`)
      setAddManualOpen(false)
      setSelectedTCs(new Set())
      fetchRun()
    }
  }

  async function openAddAuto() {
    setAddAutoOpen(true)
    const res = await fetch('/api/github/repos')
    setRepos((await res.json()) ?? [])
  }

  async function discoverTests() {
    if (!selectedRepo) return
    setDiscovering(true)
    try {
      const res = await fetch(`/api/github/repos/${selectedRepo}/discover`)
      const data = await res.json()
      setDiscoveredFiles(data?.files ?? [])
    } catch { toast.error('Discovery failed') }
    finally { setDiscovering(false) }
  }

  async function addAutoTests() {
    if (selectedFiles.size === 0) { toast.error('Select files'); return }
    const repoInfo = repos.find((r: any) => r.id === selectedRepo)
    const itemsToAdd = [...selectedFiles].map((path) => {
      const file = discoveredFiles.find((f: any) => f.path === path)
      return {
        origin: 'automated', title: path.split('/').pop() ?? path,
        filePath: path, repoOwner: repoInfo?.owner, repoName: repoInfo?.repo,
        branch: repoInfo?.defaultBranch, tags: file?.tags ?? [],
      }
    })
    const res = await fetch(`/api/test-runs/${runId}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: itemsToAdd }),
    })
    if (res.ok) {
      toast.success(`Added ${itemsToAdd.length} automated tests`)
      setAddAutoOpen(false)
      setSelectedFiles(new Set())
      setDiscoveredFiles([])
      fetchRun()
    }
  }

  const statusIcons: Record<string, React.ReactNode> = {
    passed: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />,
    blocked: <Ban className="h-4 w-4 text-amber-500" />,
    skipped: <MinusCircle className="h-4 w-4 text-blue-500" />,
    not_run: <MinusCircle className="h-4 w-4 text-gray-400" />,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={run.name}
        description={`${run?.release?.project?.name ?? ''} — ${run?.release?.name ?? ''} ${run.environment ? `(${run.environment})` : ''}`}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Link href="/test-runs"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button></Link>
            <Button variant="outline" size="sm" onClick={syncCI} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-1 ${syncing ? 'animate-spin' : ''}`} /> Sync CI
            </Button>
            {run.status === 'in_progress' && (
              <Button variant="outline" size="sm" onClick={completeRun}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Complete Run
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Items', value: total },
          { label: 'Completion', value: `${completion}%` },
          { label: 'Pass Rate', value: `${passRate}%` },
          { label: 'Failed', value: failed },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="font-display text-xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="items">Test Items</TabsTrigger>
          <TabsTrigger value="report">Summary / Report</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search items..." value={searchQuery} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="not_run">Not Run</SelectItem>
                <SelectItem value="passed">Passed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>
            <Select value={originFilter} onValueChange={setOriginFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Origin" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Origins</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automated">Automated</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={openAddManual}><Plus className="h-4 w-4 mr-1" /> Manual Tests</Button>
            <Button variant="outline" onClick={openAddAuto}><Plus className="h-4 w-4 mr-1" /> Auto Tests</Button>
          </div>

          {filteredItems.length === 0 ? (
            <Card><CardContent className="text-center py-12 text-muted-foreground">No items match your filters</CardContent></Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]"></TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Origin</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Updated</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{statusIcons[item.status] ?? statusIcons.not_run}</TableCell>
                        <TableCell className="font-medium">{item.title}</TableCell>
                        <TableCell><OriginBadge origin={item.origin} /></TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {(item?.tags ?? []).slice(0, 2).map((t: string) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {item.lastResultAt ? <SafeDate date={item.lastResultAt} options={{ dateStyle: 'short' }} /> : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {item.origin === 'manual' ? (
                              <Button variant="outline" size="sm" onClick={() => openExecute(item)}>
                                <Play className="h-3 w-3 mr-1" /> Execute
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => openExecute(item)}>
                                Override
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => deleteItem(item.id)}>
                              <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="report" className="mt-4 space-y-6">
          {reportData ? <ReportCharts data={reportData} /> : <Skeleton className="h-64" />}
        </TabsContent>
      </Tabs>

      {/* Execute/Override Sheet */}
      <Sheet open={!!executeItem} onOpenChange={(open) => { if (!open) setExecuteItem(null) }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{executeItem?.origin === 'manual' ? 'Execute Test' : 'Override Status'}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div>
              <p className="font-medium">{executeItem?.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{executeItem?.filePath ?? ''}</p>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={execStatus} onValueChange={setExecStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_run">Not Run</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea rows={4} value={execNotes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExecNotes(e.target.value)} placeholder="Observations, defects found..." />
            </div>
            <div className="space-y-2">
              <Label>Evidence URL</Label>
              <Input placeholder="Link to screenshot, video..." value={execEvidence} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExecEvidence(e.target.value)} />
            </div>
            <Button onClick={saveExecution} className="w-full">Save</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Manual Tests Dialog */}
      <Dialog open={addManualOpen} onOpenChange={setAddManualOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Manual Test Cases</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Search test cases..." value={tcSearch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTcSearch(e.target.value)} />
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {testCases.filter((tc: any) => !tcSearch || (tc?.title ?? '').toLowerCase().includes(tcSearch.toLowerCase())).map((tc: any) => (
                <label key={tc.id} className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer">
                  <input type="checkbox" checked={selectedTCs.has(tc.id)} onChange={() => {
                    const next = new Set(selectedTCs)
                    if (next.has(tc.id)) next.delete(tc.id); else next.add(tc.id)
                    setSelectedTCs(next)
                  }} className="rounded" />
                  <div>
                    <p className="text-sm font-medium">{tc.title}</p>
                    <p className="text-xs text-muted-foreground">{tc.folder ?? 'No folder'} · {tc.priority}</p>
                  </div>
                </label>
              ))}
            </div>
            <Button onClick={addManualTests} className="w-full">Add {selectedTCs.size} Test{selectedTCs.size !== 1 ? 's' : ''}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Automated Tests Dialog */}
      <Dialog open={addAutoOpen} onOpenChange={setAddAutoOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Automated Tests from GitHub</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                <SelectTrigger className="flex-1"><SelectValue placeholder="Select repo" /></SelectTrigger>
                <SelectContent>
                  {repos.map((r: any) => <SelectItem key={r.id} value={r.id}>{r.owner}/{r.repo}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button onClick={discoverTests} disabled={discovering || !selectedRepo}>
                {discovering ? 'Scanning...' : 'Discover'}
              </Button>
            </div>
            {discoveredFiles.length > 0 && (
              <>
                <p className="text-sm text-muted-foreground">{discoveredFiles.length} test files found</p>
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {discoveredFiles.map((f: any) => (
                    <label key={f.path} className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer">
                      <input type="checkbox" checked={selectedFiles.has(f.path)} onChange={() => {
                        const next = new Set(selectedFiles)
                        if (next.has(f.path)) next.delete(f.path); else next.add(f.path)
                        setSelectedFiles(next)
                      }} className="rounded" />
                      <div>
                        <p className="text-sm font-mono">{f.path}</p>
                        <div className="flex gap-1 mt-1">
                          {(f?.tags ?? []).map((t: string) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
                <Button onClick={addAutoTests} className="w-full">Add {selectedFiles.size} File{selectedFiles.size !== 1 ? 's' : ''}</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
