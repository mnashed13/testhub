'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Download, FileText } from 'lucide-react'
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { toast } from 'sonner'

interface ReportData {
  runName: string
  releaseName: string
  projectName: string
  environment: string | null
  total: number
  passed: number
  failed: number
  blocked: number
  skipped: number
  notRun: number
  manual: number
  automated: number
  passRate: number
  distribution: Array<{ name: string; value: number; color: string }>
  originBreakdown: Array<{ name: string; value: number; color: string }>
  failedItems: Array<{ id: string; title: string; origin: string; notes: string | null }>
}

export default function ReportCharts({ data }: { data: ReportData }) {
  if (!data) return null

  function exportMarkdown() {
    const md = `# Test Run Report: ${data.runName}

**Project:** ${data.projectName}
**Release:** ${data.releaseName}
**Environment:** ${data.environment ?? 'N/A'}

## Summary
| Metric | Value |
|--------|-------|
| Total Items | ${data.total} |
| Passed | ${data.passed} |
| Failed | ${data.failed} |
| Blocked | ${data.blocked} |
| Skipped | ${data.skipped} |
| Not Run | ${data.notRun} |
| Pass Rate | ${data.passRate}% |
| Manual | ${data.manual} |
| Automated | ${data.automated} |

## Failed Items
${(data?.failedItems ?? []).map((i) => `- **${i.title}** (${i.origin})${i.notes ? `: ${i.notes}` : ''}`).join('\n')}
`
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.runName.replace(/\s+/g, '_')}_report.md`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Report downloaded')
  }

  const filteredDist = (data?.distribution ?? []).filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={exportMarkdown}>
          <Download className="h-4 w-4 mr-1" /> Export Report
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={filteredDist}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }: any) => `${name}: ${value}`}
                  >
                    {filteredDist.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Manual vs Automated</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.originBreakdown ?? []} margin={{ bottom: 20 }}>
                  <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 10 }} />
                  <YAxis tickLine={false} tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {(data?.originBreakdown ?? []).map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Failed Items ({data?.failedItems?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(data?.failedItems?.length ?? 0) === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">No failed items!</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.failedItems ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{item.origin}</Badge></TableCell>
                    <TableCell className="text-muted-foreground text-sm">{item.notes ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Pass Rate</p>
              <p className={`font-display text-2xl font-bold ${data.passRate >= 80 ? 'text-emerald-600' : data.passRate >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{data.passRate}%</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Total / Passed / Failed</p>
              <p className="font-display text-2xl font-bold">{data.total} / <span className="text-emerald-600">{data.passed}</span> / <span className="text-red-600">{data.failed}</span></p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Manual / Automated</p>
              <p className="font-display text-2xl font-bold">{data.manual} / {data.automated}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
