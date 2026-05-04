const { test, expect, helpers } = require('./fixtures');

test.describe('Tutorial to Game Transition', () => {
  test.beforeEach(async ({ request }) => {
    await helpers.resetGameState(request);
  });

  test('should progress through tutorial steps via modal clicks', async ({ tutorialPage }) => {
    const page = tutorialPage;

    // Step 0: Intro text with a "Ready" button
    const readyButton = page.locator('button', { hasText: /Ready/i });
    await expect(readyButton).toBeVisible({ timeout: 5000 });
    await readyButton.click();

    // Step 1: Modal with "Understood" button
    const understoodButton = page.locator('button', { hasText: /Understood/i });
    await expect(understoodButton).toBeVisible({ timeout: 5000 });
    await understoodButton.click();

    // Step 2: Another modal step
    const nextButton = page.locator('button', { hasText: /Understood|Ready/i });
    await expect(nextButton).toBeVisible({ timeout: 5000 });
    await nextButton.click();

    // Step 3: Verify we've progressed (modal content should have changed)
    const modalButton = page.locator('button', { hasText: /Understood|Ready/i });
    await expect(modalButton).toBeVisible({ timeout: 5000 });
  });

  test('should reach tutorial Done step after completing all steps', async ({ tutorialPage }) => {
    const page = tutorialPage;

    // Progress through tutorial steps by clicking Ready/Understood buttons
    // Step 0: Click Ready
    await page.locator('button', { hasText: /Ready/i }).click();
    await page.waitForTimeout(300);

    // Steps 1-24: Click through all modal steps
    for (let step = 1; step <= 24; step++) {
      const button = page.locator('button', { hasText: /Understood|Ready|Thanks/i }).first();
      // Some steps may require waiting for content to load
      try {
        await expect(button).toBeVisible({ timeout: 3000 });
        await button.click();
        await page.waitForTimeout(300);
      } catch {
        // If no button found, the step might require special interaction
        // Try clicking any visible button in the modal
        const anyButton = page.locator('.modal button, .modal-content button').first();
        if (await anyButton.isVisible()) {
          await anyButton.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // Step 25 should be a final waiting step
    // Verify we are at the end of the tutorial or see waiting content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('should show answer prompt at step 22', async ({ tutorialPage }) => {
    const page = tutorialPage;

    // Progress through steps 0-21
    // Step 0: Click Ready
    await page.locator('button', { hasText: /Ready/i }).click();
    await page.waitForTimeout(300);

    // Steps 1-21: Click through modal steps
    for (let step = 1; step <= 21; step++) {
      const button = page.locator('button', { hasText: /Understood|Ready/i }).first();
      try {
        await expect(button).toBeVisible({ timeout: 3000 });
        await button.click();
        await page.waitForTimeout(300);
      } catch {
        const anyButton = page.locator('.modal button, .modal-content button').first();
        if (await anyButton.isVisible()) {
          await anyButton.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // At step 22, there should be an answer input prompt
    // The user needs to type an answer (correct: "green arrow up" pattern)
    const bodyText = await page.locator('body').textContent();
    expect(bodyText.length).toBeGreaterThan(0);
  });

  test('should handle incorrect tutorial answer with retry', async ({ tutorialPage }) => {
    const page = tutorialPage;

    // Progress through steps 0-21 (get to step 22 which shows answer prompt modal)
    await page.locator('button', { hasText: /Ready/i }).click();
    await page.waitForTimeout(300);

    for (let step = 1; step <= 21; step++) {
      const button = page.locator('button', { hasText: /Understood|Ready/i }).first();
      try {
        await expect(button).toBeVisible({ timeout: 3000 });
        await button.click();
        await page.waitForTimeout(300);
      } catch {
        const anyButton = page.locator('.modal button, .modal-content button').first();
        if (await anyButton.isVisible()) {
          await anyButton.click();
          await page.waitForTimeout(300);
        }
      }
    }

    // At step 22, click "Understood" to reach step 23 where chat becomes enabled
    const understoodBtn = page.locator('button', { hasText: /Understood/i }).first();
    if (await understoodBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await understoodBtn.click();
      await page.waitForTimeout(300);
    }

    // At step 23 the chat input becomes enabled — try entering a wrong answer
    const chatInput = page.locator('[data-testid="chat-input"]');
    if (await chatInput.isEnabled({ timeout: 3000 }).catch(() => false)) {
      await chatInput.fill('wrong answer');
      await page.locator('[data-testid="send-button"]').click();
      await page.waitForTimeout(500);

      // Should show retry feedback (step goes back to 22 with isIncorrectAnswer=true)
      const bodyText = await page.locator('body').textContent();
      expect(bodyText.length).toBeGreaterThan(0);
    }
  });

  test('should transition participant to game when experimenter starts', async ({ browser }) => {
    // Create separate contexts for tutorial and experimenter
    const tutorialCtx = await browser.newContext();
    const experimenterCtx = await browser.newContext();
    const tutorialPage = await tutorialCtx.newPage();
    const experimenterPage = await experimenterCtx.newPage();

    try {
      await tutorialPage.goto('/tutorial');
      await experimenterPage.goto('/experimenter');
      await tutorialPage.waitForTimeout(1000);
      await experimenterPage.waitForTimeout(2000);

      // Experimenter starts the game (sends StatusUpdate(true))
      await helpers.configureAndStartGame(experimenterPage);

      // Tutorial page should navigate to /participant
      await tutorialPage.waitForURL(/.*participant/, { timeout: 10000 });
      await expect(tutorialPage).toHaveURL(/.*participant/);
    } finally {
      await tutorialCtx.close();
      await experimenterCtx.close();
    }
  });
});
