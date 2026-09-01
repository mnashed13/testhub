'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export function FadeIn({
  children,
  className,
}: {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}) {
  return <div className={cn('animate-in fade-in duration-300', className)}>{children}</div>
}

export function ScaleIn({
  children,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  return <div className={cn('animate-in zoom-in-95 duration-300', className)}>{children}</div>
}

export function SlideIn({
  children,
  from = 'bottom',
  className,
}: {
  children: React.ReactNode
  from?: 'bottom' | 'top' | 'left' | 'right'
  delay?: number
  className?: string
}) {
  const directionClasses = {
    bottom: 'slide-in-from-bottom-2',
    top: 'slide-in-from-top-2',
    left: 'slide-in-from-left-2',
    right: 'slide-in-from-right-2',
  }
  return (
    <div className={cn('animate-in duration-300', directionClasses[from] || 'slide-in-from-bottom-2', className)}>
      {children}
    </div>
  )
}

export function Stagger({
  children,
  className,
}: {
  children: React.ReactNode
  staggerDelay?: number
  className?: string
}) {
  return <div className={cn('space-y-4', className)}>{children}</div>
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn('animate-in fade-in duration-300', className)}>{children}</div>
}

export function HoverLift({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('transition-transform duration-150 hover:-translate-y-0.5', className)}>
      {children}
    </div>
  )
}

export function PressScale({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('transition-transform duration-100 active:scale-[0.98]', className)}>
      {children}
    </div>
  )
}

export function SkeletonPulse({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} />
}
