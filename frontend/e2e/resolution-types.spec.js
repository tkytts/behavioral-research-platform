const { test, expect, helpers } = require('./fixtures');

test.describe('Resolution Types', () => {
  test.beforeEach(async ({ request }) => {
    await helpers.resetGameState(request);
  });

  /**
   * Helper to set up a game with both pages ready.
   */
  async function setupGame(participantPage, experimenterPage) {
    await helpers.setParticipantName(participantPage, 'ResolutionTest');
    await helpers.configureAndStartGame(experimenterPage, {
      maxTime: 5,
      points: 7,
    });
    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);
  }

  test('AP - correct answer, points awarded', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage);

    await helpers.resolveGame(experimenterPage, 'ap', 'Triangle');
    await helpers.waitForGameResolved(participantPage);

    const resultAnswer = participantPage.locator('[data-testid="result-answer"]');
    await expect(resultAnswer).toHaveCSS('visibility', 'visible', { timeout: 15000 });

    const resultCorrect = participantPage.locator('[data-testid="result-correct"]');
    await expect(resultCorrect).toHaveCSS('visibility', 'visible', { timeout: 15000 });
    await expect(resultCorrect).toContainText(/correct/i);

    const resultPoints = participantPage.locator('[data-testid="result-points"]');
    await expect(resultPoints).toHaveCSS('visibility', 'visible', { timeout: 15000 });
  });

  test('ANP - incorrect answer, no points', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage);

    await helpers.resolveGame(experimenterPage, 'anp', 'Triangle');
    await helpers.waitForGameResolved(participantPage);

    const resultCorrect = participantPage.locator('[data-testid="result-correct"]');
    await expect(resultCorrect).toHaveCSS('visibility', 'visible', { timeout: 15000 });
    await expect(resultCorrect).toContainText(/incorrect/i);

    const resultPoints = participantPage.locator('[data-testid="result-points"]');
    await expect(resultPoints).toHaveCSS('visibility', 'visible', { timeout: 15000 });
    await expect(resultPoints).toContainText('0');
  });

  test('DP - correct answer, points awarded', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage);

    await helpers.resolveGame(experimenterPage, 'dp', 'Triangle');
    await helpers.waitForGameResolved(participantPage);

    const resultCorrect = participantPage.locator('[data-testid="result-correct"]');
    await expect(resultCorrect).toHaveCSS('visibility', 'visible', { timeout: 15000 });
    await expect(resultCorrect).toContainText(/correct/i);
  });

  test('DNP - incorrect answer, no points', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage);

    await helpers.resolveGame(experimenterPage, 'dnp', 'Triangle');
    await helpers.waitForGameResolved(participantPage);

    const resultCorrect = participantPage.locator('[data-testid="result-correct"]');
    await expect(resultCorrect).toHaveCSS('visibility', 'visible', { timeout: 15000 });
    await expect(resultCorrect).toContainText(/incorrect/i);
  });

  test('TNP - no answer required, no points', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage);

    await helpers.resolveGame(experimenterPage, 'tnp', '');
    await helpers.waitForGameResolved(participantPage);

    const resultAnswer = participantPage.locator('[data-testid="result-answer"]');
    await expect(resultAnswer).toHaveCSS('visibility', 'visible', { timeout: 15000 });

    // Ensure no validation error is visible
    const validationError = experimenterPage.locator('.invalid-feedback');
    await expect(validationError).not.toBeVisible();
  });

  test('AP/ANP/DP/DNP require teamAnswer - validation error', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage);

    // Open resolution modal
    await experimenterPage.locator('[data-testid="resolve-game-btn"]').click();
    await expect(experimenterPage.locator('[data-testid="team-answer-input"]')).toBeVisible({ timeout: 5000 });

    // Click AP without entering an answer
    await experimenterPage.locator('[data-testid="btn-ap"]').click();

    // Validation error should be visible
    const validationError = experimenterPage.locator('.invalid-feedback');
    await expect(validationError).toBeVisible({ timeout: 5000 });
  });
});
