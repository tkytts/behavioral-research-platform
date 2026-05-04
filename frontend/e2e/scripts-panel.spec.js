const { test, expect, helpers } = require('./fixtures');

test.describe('Scripts Panel', () => {
  test.beforeEach(async ({ request }) => {
    await helpers.resetGameState(request);
  });

  /**
   * Helper to set up a game with a confederate assigned.
   */
  async function setupGameWithConfederate(participantPage, experimenterPage) {
    await helpers.setParticipantName(participantPage, 'ScriptsTest');
    await helpers.configureAndStartGame(experimenterPage, {
      maxTime: 5,
      points: 7,
    });
    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);
  }

  test('displays when confederate is assigned', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGameWithConfederate(participantPage, experimenterPage);

    // ScriptsPanel should be visible on experimenter page
    const scriptsPanel = experimenterPage.locator('.scripts-modal');
    await expect(scriptsPanel).toBeVisible({ timeout: 5000 });

    const header = experimenterPage.locator('.scripts-modal-header');
    await expect(header).toBeVisible({ timeout: 5000 });
  });

  test('toggles expand/collapse all', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGameWithConfederate(participantPage, experimenterPage);

    const scriptsPanel = experimenterPage.locator('.scripts-modal');
    if (!(await scriptsPanel.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Find the expand/collapse all button (lives in scripts-modal-header, not scripts-modal)
    const toggleBtn = experimenterPage.locator('.scripts-modal-header button.btn-sm.btn-outline-secondary');
    await expect(toggleBtn).toBeVisible({ timeout: 5000 });

    // Click to expand all
    await toggleBtn.click();
    await experimenterPage.waitForTimeout(300);

    const openDetails = await scriptsPanel.locator('details[open]').count();
    expect(openDetails).toBeGreaterThan(0);

    // Click again to collapse all
    await toggleBtn.click();
    await experimenterPage.waitForTimeout(300);

    const openDetailsAfter = await scriptsPanel.locator('details[open]').count();
    expect(openDetailsAfter).toBe(0);
  });

  test('collapses all on confederate change', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGameWithConfederate(participantPage, experimenterPage);

    const scriptsPanel = experimenterPage.locator('.scripts-modal');
    if (!(await scriptsPanel.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Expand all details (toggle button lives in scripts-modal-header, not scripts-modal)
    const toggleBtn = experimenterPage.locator('.scripts-modal-header button.btn-sm.btn-outline-secondary');
    await toggleBtn.click();
    await experimenterPage.waitForTimeout(300);

    // Verify some are open
    const openBefore = await scriptsPanel.locator('details[open]').count();
    expect(openBefore).toBeGreaterThan(0);

    // Complete 5 rounds to trigger a block change (new confederate)
    for (let i = 0; i < 5; i++) {
      await helpers.resolveGame(experimenterPage, 'ap', `Answer${i}`);
      await helpers.waitForGameResolved(participantPage);
      await helpers.nextProblem(experimenterPage);
    }

    // After confederate change, all details should be collapsed
    await experimenterPage.waitForTimeout(500);
    const openAfter = await scriptsPanel.locator('details[open]').count();
    expect(openAfter).toBe(0);
  });

  test('simulates typing on script message click', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGameWithConfederate(participantPage, experimenterPage);

    const scriptsPanel = experimenterPage.locator('.scripts-modal');
    if (!(await scriptsPanel.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Expand a details section to reveal script buttons
    const firstDetails = scriptsPanel.locator('details').first();
    await firstDetails.locator('summary').click();
    await experimenterPage.waitForTimeout(300);

    // Click a script message button inside the expanded details
    const scriptBtn = firstDetails.locator('button').first();
    await expect(scriptBtn).toBeVisible({ timeout: 3000 });
    await scriptBtn.click();

    // Wait for typing simulation to fill the chat input
    await experimenterPage.waitForTimeout(1500);

    const chatInput = experimenterPage.locator('[data-testid="chat-input"]');
    const chatValue = await chatInput.inputValue();
    expect(chatValue.length).toBeGreaterThan(0);
  });
});
