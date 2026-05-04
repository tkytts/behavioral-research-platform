const { test, expect, helpers } = require('./fixtures');

test.describe('SignalR Data Flow', () => {
  test.beforeEach(async ({ request }) => {
    await helpers.resetGameState(request);
  });

  /**
   * Helper to set up a game with both pages ready.
   */
  async function setupGame(participantPage, experimenterPage, opts = {}) {
    await helpers.setParticipantName(participantPage, 'SignalRTest');
    await helpers.configureAndStartGame(experimenterPage, {
      maxTime: 5,
      points: 7,
      ...opts,
    });
    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);
  }

  test('SetParticipantName reflects on experimenter', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;

    await helpers.setParticipantName(participantPage, 'PlayerAlpha');
    await participantPage.waitForTimeout(500);

    // Reload experimenter page to trigger fetchCurrentUser with the updated name
    await experimenterPage.reload();
    await experimenterPage.waitForTimeout(2000);

    // The experimenter page should show the participant name
    await expect(experimenterPage.locator('text=PlayerAlpha')).toBeVisible({ timeout: 10000 });
  });

  test('SetConfederate triggers NewConfederate on participant', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;

    await helpers.setParticipantName(participantPage, 'SignalRTest');

    // Configure game - this sets the confederate
    await helpers.configureAndStartGame(experimenterPage, { maxTime: 5 });

    // Participant should see the confederate modal with a confederate name
    await helpers.waitForConfederateModal(participantPage);
    const confederateModal = participantPage.locator('[data-testid="confederate-modal"]');
    const modalText = await confederateModal.textContent();
    expect(modalText.length).toBeGreaterThan(0);
  });

  test('SetAnswer displays on participant GameBox', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage);

    await helpers.resolveGame(experimenterPage, 'ap', 'Triangle');
    await helpers.waitForGameResolved(participantPage);

    const resultAnswer = participantPage.locator('[data-testid="result-answer"]');
    await expect(resultAnswer).toHaveCSS('visibility', 'visible', { timeout: 15000 });
    await expect(resultAnswer).toContainText('Triangle');
  });

  test('ClearAnswer on next problem', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage);

    await helpers.resolveGame(experimenterPage, 'ap', 'Triangle');
    await helpers.waitForGameResolved(participantPage);

    const resultAnswer = participantPage.locator('[data-testid="result-answer"]');
    await expect(resultAnswer).toContainText('Triangle', { timeout: 15000 });

    // Click next problem
    await helpers.nextProblem(experimenterPage);
    await participantPage.waitForTimeout(1000);

    // Answer should be cleared (hidden or empty)
    await expect(resultAnswer).not.toHaveCSS('visibility', 'visible', { timeout: 5000 });
  });

  test('ProblemUpdate on problem change', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage);

    // Get initial problem image src
    const pImage = participantPage.locator('[data-testid="problem-image"]');
    const eImage = experimenterPage.locator('[data-testid="problem-image"]');
    const initialSrc = await pImage.getAttribute('src');

    // Resolve and go to next problem
    await helpers.resolveGame(experimenterPage, 'ap', 'Answer');
    await helpers.waitForGameResolved(participantPage);
    await helpers.nextProblem(experimenterPage);
    await participantPage.waitForTimeout(1000);

    // Problem image src should change on both pages
    const newPSrc = await pImage.getAttribute('src');
    const newESrc = await eImage.getAttribute('src');

    expect(newPSrc).not.toBe(initialSrc);
    expect(newESrc).not.toBe(initialSrc);
  });

  test('GameResolved payload has correct scoring data', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage);

    await helpers.resolveGame(experimenterPage, 'ap', 'Triangle');
    await helpers.waitForGameResolved(participantPage);

    const resultPoints = participantPage.locator('[data-testid="result-points"]');
    await expect(resultPoints).toHaveCSS('visibility', 'visible', { timeout: 15000 });
    await expect(resultPoints).toContainText('7');
  });

  test('ShowEndModal on gameEnded', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage);

    // Handle confirm dialog
    experimenterPage.on('dialog', async dialog => {
      await dialog.accept();
    });

    // Click End Collection
    await experimenterPage.locator('[data-testid="end-session-btn"]').click();

    // End modal should appear on participant
    const endModal = participantPage.locator('[data-testid="end-modal"]');
    await expect(endModal).toBeVisible({ timeout: 10000 });
  });

  test('ChimesUpdated reaches participant', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;

    // Track console errors
    const errors = [];
    participantPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await helpers.setParticipantName(participantPage, 'SignalRTest');
    await helpers.configureAndStartGame(experimenterPage, { maxTime: 5 });
    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);

    // Wait for chimes config to propagate
    await participantPage.waitForTimeout(2000);

    // Filter out non-critical errors
    const criticalErrors = errors.filter(err =>
      !err.includes('SignalR') &&
      !err.includes('WebSocket') &&
      !err.includes('favicon')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('TimerUpdate events broadcast every second', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage, { maxTime: 30 });

    const timerDisplay = participantPage.locator('[data-testid="timer-display"]');

    // Collect timer values over ~4 seconds
    const values = [];
    for (let i = 0; i < 4; i++) {
      const text = await timerDisplay.textContent();
      const numericValue = parseInt(text, 10);
      if (!isNaN(numericValue)) {
        values.push(numericValue);
      }
      await participantPage.waitForTimeout(1000);
    }

    // Should have collected decreasing values
    expect(values.length).toBeGreaterThanOrEqual(3);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
    }
  });
});
