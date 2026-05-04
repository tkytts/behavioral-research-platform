const { test, expect, helpers } = require('./fixtures');

test.describe('Edge Cases', () => {
  test.beforeEach(async ({ request }) => {
    await helpers.resetGameState(request);
  });

  test('rejects empty participant name', async ({ participantPage }) => {
    const nameInput = participantPage.locator('[data-testid="name-input"]');
    const submitBtn = participantPage.locator('[data-testid="name-submit"]');

    // Clear input and click submit with empty value
    await nameInput.fill('');
    await submitBtn.click();
    await participantPage.waitForTimeout(500);

    // Should still be on participant page with name form visible
    await expect(participantPage).toHaveURL(/.*participant/);
    await expect(nameInput).toBeVisible();
  });

  test('rejects whitespace-only name', async ({ participantPage }) => {
    const nameInput = participantPage.locator('[data-testid="name-input"]');
    const submitBtn = participantPage.locator('[data-testid="name-submit"]');

    await nameInput.fill('   ');
    await submitBtn.click();
    await participantPage.waitForTimeout(500);

    // Name form should still be visible (submission rejected)
    await expect(nameInput).toBeVisible();
  });

  test('handles rapid Next Problem clicks', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;

    // Set up game
    await helpers.setParticipantName(participantPage, 'RapidTest');
    await helpers.configureAndStartGame(experimenterPage, {
      maxTime: 5,
      points: 7,
    });
    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);

    // Resolve first problem
    await helpers.resolveGame(experimenterPage, 'ap', 'Answer');
    await helpers.waitForGameResolved(participantPage);

    // Track console errors
    const errors = [];
    experimenterPage.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Click next-problem-btn 3 times rapidly
    const nextBtn = experimenterPage.locator('[data-testid="next-problem-btn"]');
    await nextBtn.click();
    await nextBtn.click();
    await nextBtn.click();
    await experimenterPage.waitForTimeout(1000);

    // Filter out known acceptable errors (SignalR, WebSocket, favicon)
    const criticalErrors = errors.filter(err =>
      !err.includes('SignalR') &&
      !err.includes('WebSocket') &&
      !err.includes('favicon') &&
      !err.includes('net::')
    );

    expect(criticalErrors.length).toBe(0);

    // Page should still be functional
    await expect(experimenterPage.locator('body')).toBeVisible();
  });

  test('resets ResolutionModal fields on re-open', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;

    // Set up game
    await helpers.setParticipantName(participantPage, 'ResetModalTest');
    await helpers.configureAndStartGame(experimenterPage, {
      maxTime: 30,
      points: 7,
    });
    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);

    // Open resolution modal and type something
    await experimenterPage.locator('[data-testid="resolve-game-btn"]').click();
    const teamAnswerInput = experimenterPage.locator('[data-testid="team-answer-input"]');
    await expect(teamAnswerInput).toBeVisible({ timeout: 5000 });
    await teamAnswerInput.fill('SomeAnswer');

    // Close the modal via the Close button
    await experimenterPage.locator('.modal-content .btn-narrow').click();
    await experimenterPage.waitForTimeout(300);

    // Re-open the resolution modal
    await experimenterPage.locator('[data-testid="resolve-game-btn"]').click();
    await expect(teamAnswerInput).toBeVisible({ timeout: 5000 });

    // team-answer-input should be empty (useEffect clears it asynchronously)
    await expect(teamAnswerInput).toHaveValue('', { timeout: 2000 });
  });

  test('handles End Session with no active game', async ({ experimenterPage }) => {
    // Handle confirm dialog
    experimenterPage.on('dialog', dialog => dialog.accept());

    // Click End Session without any active game
    const endBtn = experimenterPage.locator('[data-testid="end-session-btn"]');
    if (await endBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await endBtn.click();
      await experimenterPage.waitForTimeout(500);
    }

    // Page should still be functional (no crash)
    await expect(experimenterPage.locator('body')).toBeVisible();
  });

  test('shows network warning after failed polls', async ({ participantPage }) => {
    await helpers.setParticipantName(participantPage, 'NetworkTest');

    // Go offline to trigger poll failures and SignalR disconnect
    await participantPage.context().setOffline(true);

    // Wait for either the poll-based network warning or SignalR reconnecting alert
    // Poll-based: appears after 5 failures × 3s = 15s
    // SignalR-based: appears within seconds of disconnect
    const alertWarning = participantPage.locator('.alert-warning');
    await expect(alertWarning).toBeVisible({ timeout: 30000 });

    // Restore network
    await participantPage.context().setOffline(false);
  });
});
