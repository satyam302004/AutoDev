import { createProject, deleteProject, expect, makeStatus, mockStatusFlow, repeatedRunning, runningFlow, test, uniqueIdea } from './helpers'

test.describe('dashboard', () => {
  test('shows the empty state when no projects exist', async ({ page, errors }) => {
    await page.route('**/api/projects', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    )
    await page.goto('/')
    await expect(page.getByText('NO PROJECTS YET')).toBeVisible()
    await expect(page.getByText('NO PROJECT SELECTED')).toBeVisible()
    expect(errors()).toEqual([])
  })

  test('blocks ideas shorter than 10 characters without calling the API', async ({ page, errors }) => {
    let posts = 0
    await page.route('**/api/projects', (route) => {
      if (route.request().method() === 'POST') posts += 1
      return route.continue()
    })
    await page.goto('/')
    await page.getByPlaceholder(/Describe your project idea/).fill('too short')
    await page.getByRole('button', { name: 'GENERATE' }).click()
    await page.waitForTimeout(500)
    expect(posts).toBe(0)
    expect(errors()).toEqual([])
  })

  test('generates a project through the full real flow', async ({ page, request, errors }) => {
    const idea = uniqueIdea('happy path app')
    await page.goto('/')
    await page.getByPlaceholder(/Describe your project idea/).fill(idea)
    await page.getByRole('button', { name: 'GENERATE' }).click()

    await expect(page.getByText('Project kicked off — agents are working')).toBeVisible()
    await expect(page.getByText('All steps completed')).toBeVisible()
    await expect(page.getByText('Report generated successfully')).toBeVisible()
    await expect(page.getByText('100%').first()).toBeVisible()

    const list = (await (await request.get('/api/projects')).json()) as { id: string; title: string }[]
    const matches = list.filter((p) => p.title.startsWith('E2E happy path'))
    expect(matches.length).toBeGreaterThan(0)
    for (const project of matches) await deleteProject(request, project.id)
    expect(errors()).toEqual([])
  })

  test('renders the pipeline live through every step and completes', async ({ page, request, errors }) => {
    const idea = uniqueIdea('live flow app')
    const id = await createProject(request, idea)
    await page.goto('/')
    await mockStatusFlow(page, id, runningFlow(10))
    await page.getByText(new RegExp(idea)).click()

    await expect(page.getByText('thinking').first()).toBeVisible()
    await expect(page.getByText('working').first()).toBeVisible()
    await expect(page.getByText('50%').first()).toBeVisible()
    await expect(page.getByText('All steps completed')).toBeVisible()
    await expect(page.getByText('Report generated successfully')).toBeVisible()

    await deleteProject(request, id)
    expect(errors()).toEqual([])
  })

  test('renders a pending project with a gray pipeline', async ({ page, request, errors }) => {
    const idea = uniqueIdea('pending app')
    const id = await createProject(request, idea)
    await page.goto('/')
    await mockStatusFlow(page, id, [makeStatus({ status: 'pending', completed: 0, progress: 0 })])
    await page.getByText(new RegExp(idea)).click()

    await expect(page.getByText('Waiting for a project')).toBeVisible()
    await expect(page.getByText('0%').first()).toBeVisible()
    await expect(page.getByText('executing')).toHaveCount(0)

    await deleteProject(request, id)
    expect(errors()).toEqual([])
  })

  test('shows the failed step, error banner and failure toast', async ({ page, request, errors }) => {
    const idea = uniqueIdea('fail flow app')
    const id = await createProject(request, idea)
    await page.goto('/')
    await mockStatusFlow(page, id, [
      makeStatus({ status: 'running', completed: 1, progress: 0.1 }),
      makeStatus({
        status: 'failed',
        completed: 1,
        current_agent: 'backend',
        progress: 0.1,
        error: 'Simulated backend agent crash',
      }),
    ])
    await page.getByText(new RegExp(idea)).click()

    await expect(page.getByText('Simulated backend agent crash')).toBeVisible()
    await expect(page.getByText('Execution failed')).toBeVisible()
    await expect(page.getByText('FAILED', { exact: true })).toBeVisible()

    await deleteProject(request, id)
    expect(errors()).toEqual([])
  })

  test('deletes a project after a double-click confirm', async ({ page, request, errors }) => {
    const idea = uniqueIdea('delete me app')
    await createProject(request, idea)
    await page.goto('/')
    await page.getByText(new RegExp(idea)).click()

    const deleteButton = page.locator('button:has-text("DELETE")').first()
    await deleteButton.click()
    await page.locator('button:has-text("DELETE")').first().click()

    await expect(page.getByText(new RegExp(idea))).toHaveCount(0)
    await expect(page.getByText('Project deleted')).toBeVisible()
    await expect(
      page.getByText('Select a project to see agent activity.'),
    ).toBeVisible()

    expect(errors()).toEqual([])
  })

  test('refresh button picks up newly created projects', async ({ page, request, errors }) => {
    const idea = uniqueIdea('refresh me app')
    await page.goto('/')
    await expect(page.getByText(new RegExp(idea))).toHaveCount(0)

    const id = await createProject(request, idea)
    await page.getByRole('button', { name: 'REFRESH' }).click()
    await expect(page.getByText(new RegExp(idea))).toBeVisible()

    await deleteProject(request, id)
    expect(errors()).toEqual([])
  })

  test('switching projects re-targets the live view', async ({ page, request, errors }) => {
    const ideaA = uniqueIdea('switch A app')
    const ideaB = uniqueIdea('switch B app')
    const idA = await createProject(request, ideaA)
    const idB = await createProject(request, ideaB)
    await page.goto('/')

    await mockStatusFlow(page, idA, [
      ...repeatedRunning(2, 30, 0.2),
      makeStatus({ status: 'completed', completed: 10, progress: 1 }),
    ])
    await mockStatusFlow(page, idB, [
      makeStatus({ status: 'completed', completed: 10, progress: 1 }),
    ])

    await page.getByText(new RegExp(ideaA)).click()
    await expect(page.getByText('working').first()).toBeVisible()

    await page.getByText(new RegExp(ideaB)).click()
    await expect(page.getByText('All steps completed')).toBeVisible()

    await page.getByText(new RegExp(ideaA)).click()
    await expect(page.getByText('working').first()).toBeVisible()

    await deleteProject(request, idA)
    await deleteProject(request, idB)
    expect(errors()).toEqual([])
  })

  test('reload during a run re-syncs with the pipeline', async ({ page, request, errors }) => {
    const idea = uniqueIdea('reload app')
    const id = await createProject(request, idea)
    await page.goto('/')
    await mockStatusFlow(page, id, [
      ...repeatedRunning(4, 14, 0.4),
      makeStatus({ status: 'completed', completed: 10, progress: 1 }),
    ])

    await page.getByText(new RegExp(idea)).click()
    await expect(page.getByText('working').first()).toBeVisible()

    await page.reload()
    await page.getByText(new RegExp(idea)).click()
    await expect(page.getByText('working').first()).toBeVisible()
    await expect(page.getByText('Report generated successfully')).toBeVisible()

    await deleteProject(request, id)
    expect(errors()).toEqual([])
  })
})
