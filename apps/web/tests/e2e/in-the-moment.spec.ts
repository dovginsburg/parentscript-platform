import { test, expect } from '@playwright/test';

test.describe('In-the-Moment Coach', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated parent
    await page.addInitScript(() => {
      localStorage.setItem(
        'supabase.auth.token',
        JSON.stringify({
          access_token: 'mock-token',
          user: {
            id: 'mock-parent-id',
            email: 'parent@example.com',
            app_metadata: { role: 'parent' },
          },
        })
      );
    });
  });

  test('should show safety disclaimer before use', async ({ page }) => {
    await page.goto('/app/parent/in-the-moment');

    // Should show disclosure
    await expect(page.getByText(/not.*crisis service/i)).toBeVisible();
    await expect(page.getByText(/988/)).toBeVisible();
  });

  test('should require situation input', async ({ page }) => {
    await page.goto('/app/parent/in-the-moment');

    // Try to submit empty
    await page.click('button:has-text("Get Coaching")');

    // Should show validation
    await expect(page.getByText(/describe.*situation/i)).toBeVisible();
  });

  test('should show character count', async ({ page }) => {
    await page.goto('/app/parent/in-the-moment');

    const textarea = page.locator('textarea');
    await textarea.fill('My child is having a tantrum');

    // Should show character count
    await expect(page.getByText(/[0-9]+.*characters?/i)).toBeVisible();
  });

  test('should disable submit while loading', async ({ page }) => {
    await page.goto('/app/parent/in-the-moment');

    // Mock slow API response
    await page.route('**/api/coach', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      route.fulfill({ status: 200, body: '{}' });
    });

    const textarea = page.locator('textarea');
    await textarea.fill('My child is having a tantrum');

    const submitButton = page.getByRole('button', { name: /get coaching/i });
    await submitButton.click();

    // Button should be disabled
    await expect(submitButton).toBeDisabled();
    await expect(page.getByText(/thinking/i)).toBeVisible();
  });

  test('should show coaching response', async ({ page }) => {
    await page.goto('/app/parent/in-the-moment');

    // Mock API response
    await page.route('**/api/coach', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          empathy: "Tantrums are tough. You're doing the right thing by reaching out.",
          steps: ['Stay calm', 'Get to their level', 'Use labeled praise when they calm'],
          safetyNote: null,
          crisisResponsePayload: null,
        }),
      });
    });

    const textarea = page.locator('textarea');
    await textarea.fill('My child is having a tantrum');

    await page.click('button:has-text("Get Coaching")');

    // Should show response
    await expect(page.getByText(/tantrums are tough/i)).toBeVisible();
    await expect(page.getByText(/stay calm/i)).toBeVisible();
    await expect(page.getByText(/get to their level/i)).toBeVisible();
  });

  test('should show crisis response if triggered', async ({ page }) => {
    await page.goto('/app/parent/in-the-moment');

    // Mock crisis response
    await page.route('**/api/coach', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          crisisResponsePayload: {
            trigger: 'SUICIDAL_CHILD',
            response: 'This sounds like a crisis. Please call 988 immediately.',
            resources: ['988', '741741', '911'],
          },
        }),
      });
    });

    const textarea = page.locator('textarea');
    await textarea.fill('My child said they want to die');

    await page.click('button:has-text("Get Coaching")');

    // Should show crisis response prominently
    await expect(page.locator('[data-testid="crisis-alert"]')).toBeVisible();
    await expect(page.getByText(/crisis/i)).toBeVisible();
    await expect(page.getByText(/988/)).toBeVisible();
    await expect(page.locator('a[href*="988"]')).toBeVisible();
  });

  test('should allow new question after response', async ({ page }) => {
    await page.goto('/app/parent/in-the-moment');

    // Get coaching once
    await page.route('**/api/coach', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          empathy: 'Test response',
          steps: ['Step 1'],
        }),
      });
    });

    await page.fill('textarea', 'First question');
    await page.click('button:has-text("Get Coaching")');

    await expect(page.getByText(/test response/i)).toBeVisible();

    // Should have "Ask Another Question" button
    await page.click('button:has-text("Ask Another")');

    // Textarea should be cleared
    await expect(page.locator('textarea')).toHaveValue('');
  });
});
