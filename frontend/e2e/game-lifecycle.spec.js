const { test, expect, helpers } = require('./fixtures');

test.describe('Game Lifecycle', () => {
  test.beforeEach(async ({ request }) => {
    await helpers.resetGameState(request);
  });

  test('should complete a full game round with AP resolution and points', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;

    // Participant sets name
    await helpers.setParticipantName(participantPage, 'TestPlayer');

    // Experimenter configures and starts the game
    await helpers.configureAndStartGame(experimenterPage, {
      maxTime: 5,
      points: 7,
    });

    // Participant sees confederate modal and clicks Ready
    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);

    // Experimenter resolves with AP and answer "Triangle"
    await helpers.resolveGame(experimenterPage, 'ap', 'Triangle');

    // Wait for timer to expire or results to appear
    await helpers.waitForGameResolved(participantPage);

    // Verify staggered results on participant page
    const resultAnswer = participantPage.locator('[data-testid="result-answer"]');
    await expect(resultAnswer).toHaveCSS('visibility', 'visible', { timeout: 15000 });

    const resultCorrect = participantPage.locator('[data-testid="result-correct"]');
    await expect(resultCorrect).toHaveCSS('visibility', 'visible', { timeout: 15000 });

    const resultPoints = participantPage.locator('[data-testid="result-points"]');
    await expect(resultPoints).toHaveCSS('visibility', 'visible', { timeout: 15000 });

    // Verify answer text contains "Triangle"
    await expect(resultAnswer).toContainText('Triangle');
  });

  test('should start game with custom config values', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;

    await helpers.setParticipantName(participantPage, 'TestPlayer');

    await helpers.configureAndStartGame(experimenterPage, {
      gender: 'M',
      points: 10,
      maxTime: 30,
      startingProblem: 3,
    });

    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);

    // Verify problem image is visible
    const problemImage = participantPage.locator('[data-testid="problem-image"]');
    await expect(problemImage).toBeVisible({ timeout: 5000 });

    // Verify timer starts near 30
    const timerDisplay = participantPage.locator('[data-testid="timer-display"]');
    const timerText = await timerDisplay.textContent();
    const timerValue = parseInt(timerText, 10);
    expect(timerValue).toBeGreaterThanOrEqual(28);
    expect(timerValue).toBeLessThanOrEqual(30);
  });

  test('should accumulate score across multiple resolutions', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;

    await helpers.setParticipantName(participantPage, 'TestPlayer');

    await helpers.configureAndStartGame(experimenterPage, {
      maxTime: 5,
      points: 7,
    });

    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);

    // Round 1: AP resolution → +7 points
    await helpers.resolveGame(experimenterPage, 'ap', 'Answer1');
    await helpers.waitForGameResolved(participantPage);

    const resultPoints = participantPage.locator('[data-testid="result-points"]');
    await expect(resultPoints).toHaveCSS('visibility', 'visible', { timeout: 15000 });
    await expect(resultPoints).toContainText('7');

    // Move to next problem
    await helpers.nextProblem(experimenterPage);

    // Round 2: ANP resolution → +0 points (total still 7)
    await helpers.resolveGame(experimenterPage, 'anp', 'Answer2');
    await helpers.waitForGameResolved(participantPage);
    await expect(resultPoints).toHaveCSS('visibility', 'visible', { timeout: 15000 });

    await helpers.nextProblem(experimenterPage);

    // Round 3: DP resolution → +7 points (total 14)
    await helpers.resolveGame(experimenterPage, 'dp', 'Answer3');
    await helpers.waitForGameResolved(participantPage);
    await expect(resultPoints).toHaveCSS('visibility', 'visible', { timeout: 15000 });

    // Verify cumulative score is 14
    const scoreDisplay = participantPage.locator('[data-testid="score-display"]');
    await expect(scoreDisplay).toContainText('14', { timeout: 15000 });
  });
});
