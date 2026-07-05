import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('should show safety disclaimer on login page', async ({ page }) => {
    await page.goto('/app/login');

    // Check for safety disclaimer
    await expect(page.getByText(/ParentScript is parenting support/i)).toBeVisible();
    await expect(page.getByText(/not therapy/i)).toBeVisible();
    await expect(page.getByText(/crisis/i)).toBeVisible();

    // Check crisis resources
    await expect(page.getByText(/988/)).toBeVisible();
    await expect(page.getByText(/741741/)).toBeVisible();
  });

  test('should navigate to therapist auth', async ({ page }) => {
    await page.goto('/app/login');

    // Click therapist login link
    await page.click('text=Therapist Login');

    // Should be on therapist auth page
    await expect(page).toHaveURL(/\/app\/therapist\/auth/);
    await expect(page.getByRole('heading', { name: /therapist/i })).toBeVisible();
  });

  test('should navigate to parent signup', async ({ page }) => {
    await page.goto('/app/login');

    // Click parent signup link
    await page.click('text=Sign up');

    // Should be on parent signup page
    await expect(page).toHaveURL(/\/app\/parent\/signup/);
    await expect(page.getByText(/invitation code/i)).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/app/therapist/auth');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should show validation errors
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test('should toggle between login and signup modes', async ({ page }) => {
    await page.goto('/app/therapist/auth');

    // Start in login mode
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Click "Create account"
    await page.click('text=Create account');

    // Now in signup mode
    await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();

    // Click "Already have an account"
    await page.click('text=Already have an account');

    // Back to login mode
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });
});

test.describe('Password Reset', () => {
  test('should navigate to password reset page', async ({ page }) => {
    await page.goto('/app/login');

    await page.click('text=Forgot password');

    await expect(page).toHaveURL(/\/app\/reset-password/);
    await expect(page.getByText(/reset.*password/i)).toBeVisible();
  });

  test('should show success message after reset request', async ({ page }) => {
    await page.goto('/app/reset-password');

    // Fill in email
    await page.fill('input[type="email"]', 'test@example.com');

    // Submit
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.getByText(/check.*email/i)).toBeVisible();
  });
});
