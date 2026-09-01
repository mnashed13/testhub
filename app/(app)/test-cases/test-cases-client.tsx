'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layouts/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PriorityBadge } from '@/components/status-badge'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, FolderOpen, Trash2, TestTubeDiagonal } from 'lucide-react'
import { toast } from 'sonner'
import { SafeDate } from '@/components/safe-format'

interface TC {
  id: string
  title: string
  folder: string | null
  priority: string
  tags: string[]
  linkedIssueKey: string | null
  updatedAt: string
}

export function TestCasesClient({ testCases: initial, folders, allTags }: {
  testCases: TC[]
  folders: string[]
  allTags: string[]
}) {
  const [testCases, setTestCases] = useState(initial)
  const [search, setSearch] = useState('')
  const [folderFilter, setFolderFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [tagFilter, setTagFilter] = useState('all')
  const router = useRouter()

  const filtered = useMemo(() => {
    return (testCases ?? []).filter((tc) => {
      if (search && !(tc?.title ?? '').toLowerCase().includes(search.toLowerCase())) return false
      if (folderFilter !== 'all' && tc?.folder !== folderFilter) return false
      if (priorityFilter !== 'all' && tc?.priority !== priorityFilter) return false
      if (tagFilter !== 'all' && !(tc?.tags ?? []).includes(tagFilter)) return false
      return true
    })
  }, [testCases, search, folderFilter, priorityFilter, tagFilter])

  async function deleteTC(id: string) {
    if (!confirm('Delete this test case?')) return
    const res = await fetch(`/api/test-cases/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setTestCases((prev) => prev.filter((tc) => tc.id !== id))
      toast.success('Test case deleted')
    } else {
      toast.error('Failed to delete')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Test Cases"
        description="Native repository of manual test cases"
        actions={
          <Link href="/test-cases/new">
            <Button><Plus className="h-4 w-4 mr-2" /> New Test Case</Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search test cases..." value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={folderFilter} onValueChange={setFolderFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Folder" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Folders</SelectItem>
            {folders.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tag" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tags</SelectItem>
            {allTags.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <TestTubeDiagonal className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="font-medium text-muted-foreground">No test cases found</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first test case to get started</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Folder</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Jira Issue</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((tc) => (
                  <TableRow key={tc.id}>
                    <TableCell>
                      <Link href={`/test-cases/${tc.id}`} className="font-medium text-primary hover:underline">{tc.title}</Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {tc.folder ? <span className="flex items-center gap-1"><FolderOpen className="h-3 w-3" />{tc.folder}</span> : '—'}
                    </TableCell>
                    <TableCell><PriorityBadge priority={tc.priority} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(tc?.tags ?? []).slice(0, 3).map((t: string) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                        {(tc?.tags?.length ?? 0) > 3 && <Badge variant="secondary" className="text-xs">+{(tc?.tags?.length ?? 0) - 3}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{tc.linkedIssueKey ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground"><SafeDate date={tc.updatedAt} options={{ dateStyle: 'short' }} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => deleteTC(tc.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </TableCell>
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
