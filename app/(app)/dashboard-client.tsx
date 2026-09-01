'use client'

import Link from 'next/link'
import { PageHeader } from '@/components/layouts/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { LayoutDashboard, PlayCircle, Activity, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import { SafeDate } from '@/components/safe-format'
import { useEffect, useState, useRef } from 'react'

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let start = 0
    const duration = 800
    const startTime = performance.now()
    function animate(time: number) {
      const elapsed = time - startTime
      const progress = Math.min(elapsed / duration, 1)
      const current = Math.round(progress * value)
      setDisplay(current)
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [value])

  return <span ref={ref}>{display}</span>
}

interface RunRow {
  id: string
  name: string
  status: string
  environment: string | null
  releaseName: string
  projectName: string
  createdAt: string
  totalItems: number
  passed: number
  failed: number
  completion: number
}

export function DashboardClient({
  totalRuns,
  activeRuns,
  overallPassRate,
  recentRuns,
}: {
  totalRuns: number
  activeRuns: number
  overallPassRate: number
  recentRuns: RunRow[]
}) {
  const stats = [
    { label: 'Total Test Runs', value: totalRuns, icon: PlayCircle, color: 'text-primary' },
    { label: 'Active Runs', value: activeRuns, icon: Activity, color: 'text-blue-500' },
    { label: 'Overall Pass Rate', value: overallPassRate, icon: TrendingUp, color: 'text-emerald-500', suffix: '%' },
  ]

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Overview of your test management activities"
        actions={
          <Link href="/test-runs">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Test Run
            </Button>
          </Link>
        }
      />

      <Stagger className="grid gap-4 sm:grid-cols-3" staggerDelay={0.1}>
        {stats.map((s) => (
          <StaggerItem key={s.label}>
            <Card>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-lg bg-muted p-3 ${s.color}`}>
                  <s.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="font-display text-2xl font-bold tracking-tight">
                    <AnimatedNumber value={s.value} />{s.suffix ?? ''}
                  </p>
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>

      <FadeIn>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-display text-lg">Recent Test Runs</CardTitle>
            <Link href="/test-runs">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {(recentRuns?.length ?? 0) === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-40" />
                <p className="font-medium">No test runs yet</p>
                <p className="text-sm mt-1">Create your first test run to get started</p>
                <Link href="/test-runs" className="mt-4 inline-block">
                  <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Create Test Run</Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Release</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRuns.map((run: RunRow) => (
                    <TableRow key={run.id}>
                      <TableCell>
                        <Link href={`/test-runs/${run.id}`} className="font-medium text-primary hover:underline">
                          {run.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{run.projectName}</TableCell>
                      <TableCell>{run.releaseName}</TableCell>
                      <TableCell><StatusBadge status={run.status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${run.completion}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{run.completion}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <SafeDate date={run.createdAt} options={{ dateStyle: 'medium' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
