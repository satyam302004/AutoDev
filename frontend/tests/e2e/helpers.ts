import { test as base, expect, type APIRequestContext, type Page } from '@playwright/test'
import type { JobStatus } from '../../src/types'

export const test = base.extend<{ errors: () => string[] }>({
  errors: async ({ page }, done) => {
    const collected: string[] = []
    page.on('pageerror', (error) => collected.push(`pageerror: ${error.message}`))
    page.on('console', (message) => {
      if (message.type() === 'error') collected.push(`console: ${message.text()}`)
    })
    await done(() => collected)
  },
})

export { expect }

const STATUS_BASE: JobStatus = {
  job_id: 'job-1',
  project_id: 'project',
  status: 'pending',
  current_agent: null,
  completed: 0,
  total: 10,
  progress: 0,
  error: null,
}

export function makeStatus(overrides: Partial<JobStatus>): JobStatus {
  return { ...STATUS_BASE, ...overrides }
}

export function runningFlow(totalSteps = 10): JobStatus[] {
  return [
    ...Array.from({ length: totalSteps }, (_, k) =>
      makeStatus({ status: 'running', completed: k, progress: k / totalSteps }),
    ),
    makeStatus({ status: 'completed', current_agent: 'report', completed: totalSteps, progress: 1 }),
  ]
}

export function repeatedRunning(completed: number, count: number, progress: number): JobStatus[] {
  return Array.from(
    { length: count },
    () => makeStatus({ status: 'running', completed, progress }),
  )
}

export function mockStatusFlow(page: Page, projectId: string, items: JobStatus[]) {
  let index = 0
  return page.route(`**/api/projects/${projectId}/status`, async (route) => {
    const item = items[Math.min(index, items.length - 1)]
    index += 1
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ...item, project_id: projectId }),
    })
  })
}

export async function createProject(request: APIRequestContext, idea: string): Promise<string> {
  const response = await request.post('/api/projects', { data: { idea } })
  expect(response.status()).toBe(202)
  const body = (await response.json()) as { project_id: string }
  return body.project_id
}

export async function deleteProject(request: APIRequestContext, projectId: string) {
  await request.delete(`/api/projects/${projectId}`)
}

export function uniqueIdea(label: string): string {
  return `E2E ${label} ${Date.now().toString(36)}`
}
