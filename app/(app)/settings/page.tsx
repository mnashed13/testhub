'use client'

import { useState, useEffect } from 'react'
import { PageHeader } from '@/components/layouts/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Settings as SettingsIcon, Globe, Github, Webhook, Save, CheckCircle2, Copy, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [jiraBaseUrl, setJiraBaseUrl] = useState('')
  const [jiraEmail, setJiraEmail] = useState('')
  const [jiraApiToken, setJiraApiToken] = useState('')
  const [githubPat, setGithubPat] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingJira, setTestingJira] = useState(false)
  const [testingGithub, setTestingGithub] = useState(false)
  const [showJiraToken, setShowJiraToken] = useState(false)
  const [showGithubPat, setShowGithubPat] = useState(false)

  useEffect(() => {
    fetch('/api/settings').then((r) => r.json()).then((data) => {
      setJiraBaseUrl(data?.jiraBaseUrl ?? '')
      setJiraEmail(data?.jiraEmail ?? '')
      setJiraApiToken(data?.jiraApiToken ?? '')
      setGithubPat(data?.githubPat ?? '')
      setWebhookSecret(data?.webhookSecret ?? '')
    }).finally(() => setLoading(false))
  }, [])

  async function saveSettings() {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jiraBaseUrl, jiraEmail, jiraApiToken, githubPat, webhookSecret }),
      })
      if (res.ok) toast.success('Settings saved')
      else toast.error('Failed to save')
    } catch { toast.error('Failed') }
    finally { setSaving(false) }
  }

  async function testJira() {
    setTestingJira(true)
    try {
      await saveSettings()
      const res = await fetch('/api/jira/projects')
      if (res.ok) toast.success('Jira connection successful!')
      else {
        const data = await res.json()
        toast.error(data?.error ?? 'Connection failed')
      }
    } catch { toast.error('Connection failed') }
    finally { setTestingJira(false) }
  }

  async function testGithub() {
    setTestingGithub(true)
    try {
      await saveSettings()
      const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${githubPat}`, Accept: 'application/vnd.github+json' },
      })
      if (res.ok) {
        const user = await res.json()
        toast.success(`Connected as ${user?.login ?? 'unknown'}`)
      } else {
        toast.error('Invalid PAT or connection failed')
      }
    } catch { toast.error('Connection failed') }
    finally { setTestingGithub(false) }
  }

  function copyWebhookUrl() {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/ci` : ''
    navigator.clipboard?.writeText(url)
    toast.success('Webhook URL copied')
  }

  if (loading) {
    return <div className="p-8"><div className="h-8 w-48 bg-muted animate-pulse rounded" /></div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure integrations and connections"
        actions={
          <Button onClick={saveSettings} disabled={saving}>
            <Save className="h-4 w-4 mr-2" /> {saving ? 'Saving...' : 'Save All'}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-5 w-5 text-blue-500" /> Jira Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Base URL</Label>
            <Input placeholder="https://your-org.atlassian.net" value={jiraBaseUrl} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJiraBaseUrl(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input placeholder="your@email.com" value={jiraEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJiraEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>API Token</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type={showJiraToken ? 'text' : 'password'}
                  placeholder="Jira API token"
                  value={jiraApiToken}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJiraApiToken(e.target.value)}
                />
                <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowJiraToken(!showJiraToken)}>
                  {showJiraToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={testJira} disabled={testingJira}>
            <CheckCircle2 className="h-4 w-4 mr-2" /> {testingJira ? 'Testing...' : 'Test Connection'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Github className="h-5 w-5" /> GitHub Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Personal Access Token</Label>
            <div className="relative">
              <Input
                type={showGithubPat ? 'text' : 'password'}
                placeholder="ghp_..."
                value={githubPat}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGithubPat(e.target.value)}
              />
              <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowGithubPat(!showGithubPat)}>
                {showGithubPat ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button variant="outline" onClick={testGithub} disabled={testingGithub}>
            <CheckCircle2 className="h-4 w-4 mr-2" /> {testingGithub ? 'Testing...' : 'Test Connection'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Webhook className="h-5 w-5 text-purple-500" /> CI Webhook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex gap-2">
              <Input readOnly value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/ci` : '/api/webhooks/ci'} className="font-mono text-sm" />
              <Button variant="outline" size="icon" onClick={copyWebhookUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Webhook Secret</Label>
            <Input readOnly value={webhookSecret} className="font-mono text-sm" />
          </div>
          <Separator />
          <div className="space-y-2">
            <Label className="text-base font-semibold">GitHub Actions Setup</Label>
            <div className="bg-muted p-4 rounded-lg">
              <pre className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">{`# Add this step to your GitHub Actions workflow:

- name: Post test results to TestHub
  if: always()
  run: |
    curl -X POST \\\n      -H "Content-Type: application/xml" \\\n      -H "x-hub-signature-256: sha256=$(echo -n \"$(cat test-results.xml)\" | openssl dgst -sha256 -hmac \"\$WEBHOOK_SECRET\" | awk '{print \$2}')" \\\n      -d @test-results.xml \\\n      \$TESTHUB_URL/api/webhooks/ci
  env:
    WEBHOOK_SECRET: \${{ secrets.TESTHUB_WEBHOOK_SECRET }}
    TESTHUB_URL: \${{ secrets.TESTHUB_URL }}`}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
