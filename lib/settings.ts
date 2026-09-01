import { prisma } from '@/lib/prisma'

export async function getSettings() {
  let settings = await prisma.settings.findUnique({ where: { id: 'singleton' } })
  if (!settings) {
    settings = await prisma.settings.create({
      data: {
        id: 'singleton',
        webhookSecret: process.env.WEBHOOK_SECRET ?? null,
      },
    })
  }
  return settings
}

export function getJiraHeaders(email: string, token: string) {
  const encoded = Buffer.from(`${email}:${token}`).toString('base64')
  return {
    Authorization: `Basic ${encoded}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

export function getGithubHeaders(pat: string) {
  return {
    Authorization: `Bearer ${pat}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}
