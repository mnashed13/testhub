'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layouts/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Github, Plus, Trash2, Search as SearchIcon, FileCode2 } from 'lucide-react'
import { toast } from 'sonner'

interface Repo {
  id: string
  owner: string
  repo: string
  defaultBranch: string
}

export default function GithubReposPage() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [owner, setOwner] = useState('')
  const [repoName, setRepoName] = useState('')
  const [branch, setBranch] = useState('main')
  const [adding, setAdding] = useState(false)
  const [discoverResults, setDiscoverResults] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch('/api/github/repos').then((r) => r.json()).then((d) => setRepos(d ?? [])).finally(() => setLoading(false))
  }, [])

  async function addRepo() {
    if (!owner || !repoName) { toast.error('Owner and repo required'); return }
    setAdding(true)
    try {
      const res = await fetch('/api/github/repos', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo: repoName, defaultBranch: branch }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data?.error ?? 'Failed'); return }
      setRepos((prev) => [data, ...prev])
      toast.success('Repository added')
      setAddOpen(false)
      setOwner(''); setRepoName(''); setBranch('main')
    } catch { toast.error('Failed') }
    finally { setAdding(false) }
  }

  async function deleteRepo(id: string) {
    if (!confirm('Remove this repository?')) return
    await fetch(`/api/github/repos/${id}`, { method: 'DELETE' })
    setRepos((prev) => prev.filter((r) => r.id !== id))
    toast.success('Removed')
  }

  async function discover(id: string) {
    try {
      const res = await fetch(`/api/github/repos/${id}/discover`)
      const data = await res.json()
      if (!res.ok) { toast.error(data?.error ?? 'Failed'); return }
      setDiscoverResults((prev) => ({ ...prev, [id]: data?.count ?? 0 }))
      toast.success(`Found ${data?.count ?? 0} test files`)
    } catch { toast.error('Discovery failed') }
  }

  if (loading) {
    return <div className="p-8"><div className="h-8 w-48 bg-muted animate-pulse rounded" /></div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="GitHub Repositories"
        description="Connected repositories for automated test discovery"
        actions={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Repository</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add GitHub Repository</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Owner</Label>
                  <Input placeholder="github-username or org" value={owner} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOwner(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Repository</Label>
                  <Input placeholder="repo-name" value={repoName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRepoName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Default Branch</Label>
                  <Input value={branch} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBranch(e.target.value)} />
                </div>
                <Button onClick={addRepo} disabled={adding} className="w-full">{adding ? 'Adding...' : 'Add Repository'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {repos.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <Github className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
            <p className="font-medium text-muted-foreground">No repositories connected</p>
            <p className="text-sm text-muted-foreground mt-1">Add a GitHub repository to discover automated tests</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Repository</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Tests Found</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repos.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Github className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-sm">{r.owner}/{r.repo}</span>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{r.defaultBranch}</Badge></TableCell>
                    <TableCell>
                      {discoverResults[r.id] !== undefined ? (
                        <span className="font-mono text-sm">{discoverResults[r.id]} files</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="outline" size="sm" onClick={() => discover(r.id)}>
                          <FileCode2 className="h-4 w-4 mr-1" /> Discover
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteRepo(r.id)}>
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
    </div>
  )
}
