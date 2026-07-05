import { test, expect } from '@playwright/test';

test.describe('Skill Library (Parent View)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated parent user
    await page.addInitScript(() => {
      localStorage.setItem(
        'supabase.auth.token',
        JSON.stringify({
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_at: Date.now() + 3600000,
          user: {
            id: 'mock-parent-id',
            email: 'parent@example.com',
            app_metadata: { role: 'parent' },
          },
        })
      );
    });
  });

  test('should display skill list', async ({ page }) => {
    await page.goto('/app/parent/skills');

    // Should see skill cards
    await expect(page.locator('[data-testid="skill-card"]').first()).toBeVisible();

    // Skills should show level badges
    await expect(page.getByText(/L[1-4]/)).toBeVisible();
  });

  test('should filter skills by level', async ({ page }) => {
    await page.goto('/app/parent/skills');

    // Click L1 filter
    await page.click('button:has-text("L1")');

    // Should only show L1 skills
    const skills = page.locator('[data-testid="skill-card"]');
    const count = await skills.count();

    for (let i = 0; i < count; i++) {
      await expect(skills.nth(i).getByText('L1')).toBeVisible();
    }
  });

  test('should search skills by keyword', async ({ page }) => {
    await page.goto('/app/parent/skills');

    // Type in search box
    await page.fill('input[placeholder*="Search"]', 'praise');

    // Should show filtered results
    const skills = page.locator('[data-testid="skill-card"]');
    await expect(skills.first()).toContainText(/praise/i);
  });

  test('should navigate to skill detail', async ({ page }) => {
    await page.goto('/app/parent/skills');

    // Click first skill
    await page.click('[data-testid="skill-card"]:first-child');

    // Should be on skill detail page
    await expect(page).toHaveURL(/\/app\/parent\/skill\//);

    // Should show skill sections
    await expect(page.getByText(/goal/i)).toBeVisible();
    await expect(page.getByText(/when to use/i)).toBeVisible();
    await expect(page.getByText(/say this/i)).toBeVisible();
  });

  test('should show locked skills grayed out', async ({ page }) => {
    await page.goto('/app/parent/skills');

    // Locked skills should have visual indicator
    const lockedSkill = page.locator('[data-testid="skill-card"][data-locked="true"]').first();
    await expect(lockedSkill).toHaveClass(/opacity-50|grayscale/);
    await expect(lockedSkill.getByText(/coming soon/i)).toBeVisible();
  });
});

test.describe('Skill Detail Page', () => {
  test('should show all skill components', async ({ page }) => {
    await page.goto('/app/parent/skill/labeled-praise');

    // Check for all sections
    await expect(page.getByRole('heading', { name: /goal/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /when to use/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /say this/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /don't say/i })).toBeVisible();

    // Check for age adaptations if present
    const ageAdaptations = page.getByText(/age [0-9]-[0-9]/i);
    if (await ageAdaptations.isVisible()) {
      await expect(ageAdaptations).toBeVisible();
    }
  });

  test('should allow logging practice from skill detail', async ({ page }) => {
    await page.goto('/app/parent/skill/labeled-praise');

    // Click "Log Practice"
    await page.click('button:has-text("Log Practice")');

    // Should open practice log modal
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/how.*go/i)).toBeVisible();
  });

  test('should show safety warning if present', async ({ page }) => {
    // Navigate to a skill with safety warning
    await page.goto('/app/parent/skill/ignoring');

    // Should show prominent warning
    const warning = page.locator('[data-testid="safety-warning"]');
    await expect(warning).toBeVisible();
    await expect(warning).toHaveClass(/bg-red|bg-yellow/);
  });
});
