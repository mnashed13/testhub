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
import { Plus, Trash2, GripVertical, Save } from 'lucide-react'
import { toast } from 'sonner'

interface Step {
  step: string
  expectedResult: string
}

export default function NewTestCasePage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [preconditions, setPreconditions] = useState('')
  const [expectedResult, setExpectedResult] = useState('')
  const [priority, setPriority] = useState('medium')
  const [folder, setFolder] = useState('')
  const [linkedIssueKey, setLinkedIssueKey] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [steps, setSteps] = useState<Step[]>([{ step: '', expectedResult: '' }])
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
      const res = await fetch('/api/test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, preconditions, expectedResult, priority,
          folder: folder || null, linkedIssueKey: linkedIssueKey || null,
          tags, steps: steps.filter((s) => s.step.trim()),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error ?? 'Failed to create')
        return
      }
      toast.success('Test case created')
      router.push(`/test-cases/${data.id}`)
    } catch {
      toast.error('Failed to create test case')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Test Case"
        description="Create a new manual test case"
        actions={
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input placeholder="Test case title" value={title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Preconditions</Label>
                <Textarea placeholder="Preconditions for this test..." value={preconditions} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPreconditions(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Expected Result (overall)</Label>
                <Textarea placeholder="Expected outcome..." value={expectedResult} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setExpectedResult(e.target.value)} rows={2} />
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
                    <div className="text-muted-foreground mt-2">
                      <GripVertical className="h-4 w-4" />
                    </div>
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
                <Input placeholder="e.g. Login, Checkout" value={folder} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFolder(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Linked Jira Issue</Label>
                <Input placeholder="e.g. PROJ-123" value={linkedIssueKey} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLinkedIssueKey(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tags (comma-separated)</Label>
                <Input placeholder="e.g. smoke, regression" value={tagsInput} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagsInput(e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
