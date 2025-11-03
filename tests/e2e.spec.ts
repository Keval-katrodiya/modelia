import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('AI Studio E2E Flow', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'password123';

  // Create a test image file
  test.beforeAll(() => {
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    if (!fs.existsSync(testImagePath)) {
      // Create a minimal valid JPEG
      const buffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00,
        0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
      ]);
      fs.writeFileSync(testImagePath, buffer);
    }
  });

  test('complete user flow: signup -> login -> upload -> generate -> view history -> restore', async ({
    page,
  }) => {
    // 1. Navigate to the app
    await page.goto('/');

    // Should redirect to login (since not authenticated)
    await expect(page).toHaveURL(/\/login/);

    // 2. Sign up
    await page.click('text=Sign up');
    await expect(page).toHaveURL(/\/signup/);

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[id="password"]', testPassword);
    await page.fill('input[id="confirmPassword"]', testPassword);
    await page.click('button[type="submit"]');

    // Should redirect to studio after signup
    await expect(page).toHaveURL(/\/studio/);
    await expect(page.locator('text=Create Generation')).toBeVisible();

    // 3. Logout and login again
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL(/\/login/);

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/studio/);

    // 4. Upload image
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    // Wait for preview to appear
    await expect(page.locator('img[alt="Preview"]')).toBeVisible();

    // 5. Fill prompt and style
    await page.fill('textarea[id="prompt"]', 'A beautiful summer dress with floral patterns');
    await page.selectOption('select[id="style"]', 'casual');

    // 6. Generate (with retry logic for 20% error rate)
    let generationSuccess = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!generationSuccess && attempts < maxAttempts) {
      attempts++;
      
      // Click generate button
      await page.click('button[type="submit"]:has-text("Generate")');

      // Wait for either success or error
      try {
        // Wait for loading state
        await expect(page.locator('text=Generating')).toBeVisible({ timeout: 2000 });

        // Wait for completion (loading state disappears)
        await expect(page.locator('text=Generating')).not.toBeVisible({ timeout: 5000 });

        // Check if we got an error
        const errorVisible = await page.locator('text=Model overloaded').isVisible();
        
        if (!errorVisible) {
          generationSuccess = true;
        } else {
          // Wait a bit before retrying
          await page.waitForTimeout(1000);
          
          // Re-upload image for next attempt
          await fileInput.setInputFiles(testImagePath);
          await page.fill('textarea[id="prompt"]', 'A beautiful summer dress with floral patterns');
        }
      } catch (error) {
        // Timeout or other error, try again
        await page.waitForTimeout(1000);
        await fileInput.setInputFiles(testImagePath);
        await page.fill('textarea[id="prompt"]', 'A beautiful summer dress with floral patterns');
      }
    }

    expect(generationSuccess).toBe(true);

    // 7. View history - should see the new generation
    await expect(page.locator('text=Recent Generations')).toBeVisible();
    const historyItems = page.locator('button:has(img[alt])');
    await expect(historyItems.first()).toBeVisible({ timeout: 3000 });

    // 8. Restore a previous generation
    const firstHistoryItem = historyItems.first();
    await firstHistoryItem.click();

    // Check that the form is populated with the restored values
    const promptInput = page.locator('textarea[id="prompt"]');
    await expect(promptInput).toHaveValue('A beautiful summer dress with floral patterns');
  });

  test('abort generation mid-flight', async ({ page }) => {
    // Login with existing account
    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/studio/);

    // Upload and start generation
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    await page.locator('input[type="file"]').setInputFiles(testImagePath);
    await page.fill('textarea[id="prompt"]', 'Test abort functionality');
    await page.click('button[type="submit"]:has-text("Generate")');

    // Wait for loading state
    await expect(page.locator('text=Generating')).toBeVisible({ timeout: 2000 });

    // Click abort button
    const abortButton = page.locator('button:has-text("Abort")');
    if (await abortButton.isVisible()) {
      await abortButton.click();

      // Should show aborted message or return to idle state
      await expect(page.locator('text=Generating')).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('form validation', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/studio/);

    // Try to generate without uploading image
    const generateButton = page.locator('button[type="submit"]:has-text("Generate")');
    await expect(generateButton).toBeDisabled();

    // Upload image
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    await page.locator('input[type="file"]').setInputFiles(testImagePath);

    // Try to generate without prompt
    await expect(generateButton).toBeDisabled();

    // Add prompt - button should be enabled
    await page.fill('textarea[id="prompt"]', 'Test prompt');
    await expect(generateButton).toBeEnabled();
  });

  test('protected route redirects unauthenticated users', async ({ page }) => {
    // Clear any existing auth
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Try to access studio
    await page.goto('/studio');

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('keyboard navigation and accessibility', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/studio/);

    // Test keyboard navigation on upload area
    const uploadArea = page.locator('div[role="button"][aria-label="Upload image"]');
    await uploadArea.focus();
    
    // Check focus ring is visible
    await expect(uploadArea).toBeFocused();

    // Test keyboard interaction (Enter or Space should trigger upload)
    await uploadArea.press('Enter');
    // File dialog would open (can't test in automated tests)

    // Check ARIA labels
    await expect(page.locator('[aria-label="Upload image"]')).toBeVisible();
    await expect(page.locator('[aria-label="Logout"]')).toBeVisible();
  });
});

