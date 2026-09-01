'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@/components/layouts/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, GripVertical, Save, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface Step {
  step: string
  expectedResult: string
}

interface TCData {
  id: string
  title: string
  preconditions: string | null
  steps: any
  expectedResult: string | null
  tags: string[]
  folder: string | null
  linkedIssueKey: string | null
  priority: string
  owner: string | null
  createdAt: string
  updatedAt: string
}

export function TestCaseDetailClient({ testCase }: { testCase: TCData }) {
  const router = useRouter()
  const [title, setTitle] = useState(testCase.title)
  const [preconditions, setPreconditions] = useState(testCase.preconditions ?? '')
  const [expectedResult, setExpectedResult] = useState(testCase.expectedResult ?? '')
  const [priority, setPriority] = useState(testCase.priority)
  const [folder, setFolder] = useState(testCase.folder ?? '')
  const [linkedIssueKey, setLinkedIssueKey] = useState(testCase.linkedIssueKey ?? '')
  const [tagsInput, setTagsInput] = useState((testCase?.tags ?? []).join(', '))
  const [steps, setSteps] = useState<Step[]>(
    Array.isArray(testCase.steps) && testCase.steps.length > 0
      ? testCase.steps
      : [{ step: '', expectedResult: '' }]
  )
  const [saving, setSaving] = useState(false)

  function addStep() {
    setSteps((prev) => [...prev, { step: '', expectedResult: '' }])
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  function updateStep(index: number, field: keyof Step, value: string) {
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  async function handleSave() {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    setSaving(true)
    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean)
      const res = await fetch(`/api/test-cases/${testCase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, preconditions, expectedResult, priority,
          folder: folder || null, linkedIssueKey: linkedIssueKey || null,
          tags, steps: steps.filter((s) => s.step.trim()),
        }),
      })
      if (!res.ok) {
        toast.error('Failed to save')
        return
      }
      toast.success('Test case saved')
      router.refresh()
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Test Case"
        description={`ID: ${testCase.id}`}
        actions={
          <div className="flex gap-2">
            <Link href="/test-cases">
              <Button variant="outline"><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
            </Link>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Preconditions</Label>
                <Textarea value={preconditions} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPreconditions(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Expected Result (overall)</Label>
                <Textarea value={expectedResult} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExpectedResult(e.target.value)} rows={2} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">Steps</Label>
                <Button variant="outline" size="sm" onClick={addStep}>
                  <Plus className="h-4 w-4 mr-1" /> Add Step
                </Button>
              </div>
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 rounded-lg bg-muted/50">
                    <div className="text-muted-foreground mt-2"><GripVertical className="h-4 w-4" /></div>
                    <span className="font-mono text-sm text-muted-foreground mt-2 min-w-[24px]">{i + 1}.</span>
                    <div className="flex-1 space-y-2">
                      <Input placeholder="Step description" value={step.step} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStep(i, 'step', e.target.value)} />
                      <Input placeholder="Expected result" value={step.expectedResult} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateStep(i, 'expectedResult', e.target.value)} />
                    </div>
                    {steps.length > 1 && (
                      <Button variant="ghost" size="icon" onClick={() => removeStep(i)} className="mt-1">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Folder</Label>
                <Input value={folder} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFolder(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Linked Jira Issue</Label>
                <Input value={linkedIssueKey} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkedIssueKey(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input value={tagsInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagsInput(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
