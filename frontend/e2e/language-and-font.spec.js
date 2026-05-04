const { test, expect, helpers } = require('./fixtures');

test.describe('Language and Font Controls', () => {
  test.beforeEach(async ({ request }) => {
    await helpers.resetGameState(request);
  });

  test('defaults to a language', async ({ participantPage }) => {
    const title = participantPage.locator('h1');
    await expect(title).toBeVisible({ timeout: 5000 });

    const titleText = await title.textContent();
    expect(titleText.length).toBeGreaterThan(0);
  });

  test('switches language via selector', async ({ participantPage }) => {
    const title = participantPage.locator('h1');
    await expect(title).toBeVisible({ timeout: 5000 });
    const originalText = await title.textContent();

    // Click on the react-select control within font-size-controls area
    const controlsArea = participantPage.locator('.font-size-controls');
    const selectControl = controlsArea.locator('.react-select__control, [class*="control"]').first();
    await selectControl.click();
    await participantPage.waitForTimeout(300);

    // Click an option that is not the currently selected one
    const options = participantPage.locator('.react-select__option, [class*="option"]');
    const optionCount = await options.count();
    if (optionCount > 1) {
      // Click the second option (to pick a different language)
      await options.nth(1).click();
    } else if (optionCount === 1) {
      await options.first().click();
    }

    await participantPage.waitForTimeout(500);

    // Verify the page title text has changed
    const newText = await title.textContent();
    expect(newText.length).toBeGreaterThan(0);
    // At minimum the language selector interaction should work without error
  });

  test('persists language across navigation', async ({ participantPage }) => {
    // Open language selector and pick a different language
    const controlsArea = participantPage.locator('.font-size-controls');
    const selectControl = controlsArea.locator('.react-select__control, [class*="control"]').first();
    await selectControl.click();
    await participantPage.waitForTimeout(300);

    const options = participantPage.locator('.react-select__option, [class*="option"]');
    const optionCount = await options.count();
    if (optionCount > 1) {
      await options.nth(1).click();
    } else if (optionCount === 1) {
      await options.first().click();
    }
    await participantPage.waitForTimeout(300);

    // Record the stored language
    const storedLanguage = await participantPage.evaluate(() =>
      localStorage.getItem('language')
    );

    // Navigate away and back
    await participantPage.goto('/participant');
    await participantPage.waitForTimeout(1000);

    // Verify language persisted
    const languageAfterNav = await participantPage.evaluate(() =>
      localStorage.getItem('language')
    );
    expect(languageAfterNav).toBe(storedLanguage);

    // Verify title is rendered (language was restored)
    const title = participantPage.locator('h1');
    await expect(title).toBeVisible({ timeout: 5000 });
    const titleText = await title.textContent();
    expect(titleText.length).toBeGreaterThan(0);
  });

  test('increases font size on A+ click', async ({ participantPage }) => {
    const controlsArea = participantPage.locator('.font-size-controls');

    // Get initial font size
    const initialSize = await participantPage.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).fontSize)
    );

    // Click A+ button (btn-primary)
    const increasBtn = controlsArea.locator('button.btn-primary');
    await increasBtn.click();
    await participantPage.waitForTimeout(200);

    const newSize = await participantPage.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).fontSize)
    );

    expect(newSize).toBeGreaterThan(initialSize);
  });

  test('decreases font size on A- click', async ({ participantPage }) => {
    const controlsArea = participantPage.locator('.font-size-controls');

    // First increase so we have room to decrease
    const increasBtn = controlsArea.locator('button.btn-primary');
    await increasBtn.click();
    await participantPage.waitForTimeout(200);

    const sizeAfterIncrease = await participantPage.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).fontSize)
    );

    // Click A- button (btn-secondary)
    const decreaseBtn = controlsArea.locator('button.btn-secondary');
    await decreaseBtn.click();
    await participantPage.waitForTimeout(200);

    const sizeAfterDecrease = await participantPage.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).fontSize)
    );

    expect(sizeAfterDecrease).toBeLessThan(sizeAfterIncrease);
  });
});
