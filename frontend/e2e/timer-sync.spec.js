const { test, expect, helpers } = require('./fixtures');

test.describe('Timer Synchronization', () => {
  test.beforeEach(async ({ request }) => {
    await helpers.resetGameState(request);
  });

  /**
   * Helper to set up a game with both pages ready.
   */
  async function setupGame(participantPage, experimenterPage, opts = {}) {
    await helpers.setParticipantName(participantPage, 'TimerTest');
    await helpers.configureAndStartGame(experimenterPage, { maxTime: 5, ...opts });
    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);
  }

  test('should broadcast countdown to both pages simultaneously', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage, { maxTime: 30 });

    // Wait a moment for timer to start counting
    await participantPage.waitForTimeout(1000);

    // Read timer values from both pages
    const pTimer = participantPage.locator('[data-testid="timer-display"]');
    const eTimer = experimenterPage.locator('[data-testid="timer-display"]');

    const pText = await pTimer.textContent();
    const eText = await eTimer.textContent();

    const pValue = parseInt(pText, 10);
    const eValue = parseInt(eText, 10);

    // Both should be counting down and within 1 second of each other
    expect(Math.abs(pValue - eValue)).toBeLessThanOrEqual(1);
    expect(pValue).toBeLessThanOrEqual(30);
    expect(pValue).toBeGreaterThanOrEqual(0);
  });

  test('should stop timer on experimenter command', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage, { maxTime: 30 });

    // Wait for timer to count down a bit
    await participantPage.waitForTimeout(1000);

    // Click pause timer button on experimenter
    const stopButton = experimenterPage.locator('button', { hasText: /pause.*timer/i });
    await stopButton.click();
    await participantPage.waitForTimeout(500);

    // Record timer value
    const pTimer = participantPage.locator('[data-testid="timer-display"]');
    const firstValue = await pTimer.textContent();

    // Wait and check it hasn't changed
    await participantPage.waitForTimeout(1500);
    const secondValue = await pTimer.textContent();

    expect(firstValue).toBe(secondValue);
  });

  test('should reset timer to maxTime', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage, { maxTime: 30 });

    // Wait for timer to count down
    await participantPage.waitForTimeout(2000);

    // Stop the timer first so reset value stays stable
    const stopButton = experimenterPage.locator('button', { hasText: /pause.*timer/i });
    await stopButton.click();
    await participantPage.waitForTimeout(300);

    // Click reset timer button on experimenter
    const resetButton = experimenterPage.locator('button', { hasText: /reset.*timer/i });
    await resetButton.click();
    await participantPage.waitForTimeout(500);

    // Both pages should show maxTime (30)
    const pTimer = participantPage.locator('[data-testid="timer-display"]');
    const eTimer = experimenterPage.locator('[data-testid="timer-display"]');

    await expect(pTimer).toContainText('30', { timeout: 5000 });
    await expect(eTimer).toContainText('30', { timeout: 5000 });
  });

  test('should fire GameResolved when timer reaches zero', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage);

    // Resolve the game
    await helpers.resolveGame(experimenterPage, 'ap', 'Triangle');

    // Wait for timer to reach 0 and result to become visible
    await helpers.waitForGameResolved(participantPage);

    const resultAnswer = participantPage.locator('[data-testid="result-answer"]');
    await expect(resultAnswer).toHaveCSS('visibility', 'visible', { timeout: 15000 });
  });

  test('should show time-is-up text when timer expires', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage);

    // Wait for timer to expire (maxTime=5, so wait up to 15s)
    await helpers.waitForTimerText(participantPage, 'Time is up');
  });
});
