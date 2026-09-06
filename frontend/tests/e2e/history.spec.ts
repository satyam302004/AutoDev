import { createProject, deleteProject, expect, test, uniqueIdea } from './helpers'

test.describe('history', () => {
  test('renders artifact tabs, markdown and working exports for a completed project', async ({
    page,
    request,
    errors,
  }) => {
    const idea = uniqueIdea('history app')
    const id = await createProject(request, idea)
    await page.goto('/')
    await page.getByRole('button', { name: 'Projects', exact: true }).click()

    await page.getByText(new RegExp(idea)).click()
    await expect(page.getByRole('heading', { name: 'Artifacts' })).toBeVisible()
    for (const tab of ['Requirements', 'Architecture', 'Plan', 'API', 'UI', 'QA', 'README', 'Report']) {
      await expect(page.getByRole('button', { name: tab, exact: true })).toBeVisible()
    }

    await expect(page.getByRole('heading', { name: 'Requirements', exact: true }).first()).toBeVisible()
    await expect(
      page.getByText('This artifact has not been generated for this project.'),
    ).toHaveCount(0)

    await page.getByRole('button', { name: 'Report', exact: true }).click()
    await expect(
      page.getByText('This artifact has not been generated for this project.'),
    ).toHaveCount(0)
    const reportText = await page.locator('.prose').first().innerText()
    expect(reportText.length).toBeGreaterThan(100)

    await expect(page.getByRole('button', { name: 'PDF' })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'DOCX' })).toBeEnabled()
    await expect(page.getByRole('button', { name: 'JSON' })).toBeEnabled()

    const pdfDownload = page.waitForEvent('download')
    await page.getByRole('button', { name: 'PDF' }).click()
    expect((await pdfDownload).suggestedFilename()).toMatch(/autodev-.*\.pdf/)

    const docxDownload = page.waitForEvent('download')
    await page.getByRole('button', { name: 'DOCX' }).click()
    expect((await docxDownload).suggestedFilename()).toMatch(/autodev-.*\.docx/)

    const jsonDownload = page.waitForEvent('download')
    await page.getByRole('button', { name: 'JSON' }).click()
    expect((await jsonDownload).suggestedFilename()).toMatch(/autodev-.*\.json/)

    await deleteProject(request, id)
    expect(errors()).toEqual([])
  })

  test('disables exports and shows empty artifacts for a failed project without a report', async ({
    page,
    errors,
  }) => {
    const failed = {
      id: 'deadbeef-fail',
      title: 'Failed project fixture',
      status: 'failed',
      quality: null,
      cost: null,
      created_at: '2026-01-01T00:00:00',
      updated_at: '2026-01-01T00:00:00',
    }
    await page.route('**/api/projects', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([failed]) }),
    )
    await page.route('**/api/projects/deadbeef-fail', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...failed,
          execution: null,
          agent_runs: [],
          artifacts: [],
        }),
      }),
    )
    await page.route('**/api/projects/deadbeef-fail/report', (route) =>
      route.fulfill({ status: 404, contentType: 'application/json', body: '{"detail":"not found"}' }),
    )

    await page.goto('/')
    await page.getByRole('button', { name: 'Projects', exact: true }).click()
    await page.getByText('Failed project fixture').click()

    await expect(page.getByRole('button', { name: 'PDF' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'DOCX' })).toBeDisabled()
    await expect(page.getByRole('button', { name: 'JSON' })).toBeEnabled()
    await expect(
      page.getByText('This artifact has not been generated for this project.'),
    ).toBeVisible()

    expect(errors()).toEqual([])
  })
})
