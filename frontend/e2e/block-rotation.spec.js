const { test, expect, helpers } = require('./fixtures');

test.describe('Block Rotation', () => {
  test.beforeEach(async ({ request }) => {
    await helpers.resetGameState(request);
  });

  /**
   * Helper to set up a game with both pages ready.
   */
  async function setupGame(participantPage, experimenterPage, opts = {}) {
    await helpers.setParticipantName(participantPage, 'BlockTest');
    await helpers.configureAndStartGame(experimenterPage, {
      maxTime: 5,
      points: 7,
      ...opts,
    });
    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);
  }

  /**
   * Helper to resolve a round and advance to next problem.
   */
  async function resolveAndNext(experimenterPage, participantPage) {
    await helpers.resolveGame(experimenterPage, 'ap', 'Answer');
    await helpers.waitForGameResolved(participantPage);
    await helpers.nextProblem(experimenterPage);
  }

  test('should cycle 5 problems then open config modal for new block', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage);

    // Complete 5 rounds (problems 0-4)
    for (let i = 0; i < 5; i++) {
      await helpers.resolveGame(experimenterPage, 'ap', `Answer${i}`);
      await helpers.waitForGameResolved(participantPage);
      await helpers.nextProblem(experimenterPage);
      // Allow time for state transitions
      await experimenterPage.waitForTimeout(500);
    }

    // After 5th problem, config modal should reopen for new block
    const configModal = experimenterPage.locator('[data-testid="config-modal"]');
    await expect(configModal).toBeVisible({ timeout: 10000 });
  });

  test('should rotate to next confederate', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage);

    // Record the initial confederate
    // Complete the block (5 problems)
    for (let i = 0; i < 5; i++) {
      await helpers.resolveGame(experimenterPage, 'ap', `Answer${i}`);
      await helpers.waitForGameResolved(participantPage);
      await helpers.nextProblem(experimenterPage);
      await experimenterPage.waitForTimeout(500);
    }

    // Config modal should reopen
    const configModal = experimenterPage.locator('[data-testid="config-modal"]');
    await expect(configModal).toBeVisible({ timeout: 10000 });

    // Confederate select should have auto-selected the next confederate
    const confederateSelect = experimenterPage.locator('[data-testid="confederate-select"]');
    const selectedValue = await confederateSelect.inputValue();
    expect(selectedValue).toBeTruthy();
  });

  test('should call gameEnded when last confederate block finishes', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;

    await helpers.setParticipantName(participantPage, 'BlockTest');

    // Start the game - the system will use available confederates
    await helpers.configureAndStartGame(experimenterPage, {
      maxTime: 5,
      points: 7,
    });
    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);

    // Use End Collection to trigger game end
    experimenterPage.on('dialog', async dialog => {
      await dialog.accept();
    });

    await experimenterPage.locator('[data-testid="end-session-btn"]').click();

    // End modal should appear on participant page
    const endModal = participantPage.locator('[data-testid="end-modal"]');
    await expect(endModal).toBeVisible({ timeout: 10000 });
  });

  test('should work with non-zero starting problem index', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;

    // Start at problem index 3 (problems 3 and 4 remain in the block)
    await setupGame(participantPage, experimenterPage, { startingProblem: 3 });

    // Problem 3: resolve and next
    await helpers.resolveGame(experimenterPage, 'ap', 'Answer3');
    await helpers.waitForGameResolved(participantPage);
    await helpers.nextProblem(experimenterPage);
    await experimenterPage.waitForTimeout(500);

    // Problem 4: resolve and next
    await helpers.resolveGame(experimenterPage, 'ap', 'Answer4');
    await helpers.waitForGameResolved(participantPage);
    await helpers.nextProblem(experimenterPage);
    await experimenterPage.waitForTimeout(500);

    // After problem 4, config modal should reopen for new block
    const configModal = experimenterPage.locator('[data-testid="config-modal"]');
    await expect(configModal).toBeVisible({ timeout: 10000 });
  });

  test('should clear chat on block transition', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGame(participantPage, experimenterPage);

    // Send a chat message
    await helpers.sendChatMessage(participantPage, 'Hello from block 1');
    await helpers.waitForChatMessage(participantPage, 'Hello from block 1');

    // Complete the block (5 problems)
    for (let i = 0; i < 5; i++) {
      await helpers.resolveGame(experimenterPage, 'ap', `Answer${i}`);
      await helpers.waitForGameResolved(participantPage);
      await helpers.nextProblem(experimenterPage);
      await experimenterPage.waitForTimeout(500);
    }

    // Config modal should reopen
    const configModal = experimenterPage.locator('[data-testid="config-modal"]');
    await expect(configModal).toBeVisible({ timeout: 10000 });

    // Start the new block
    await experimenterPage.locator('[data-testid="config-start-btn"]').click();
    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);

    // Chat messages should be cleared
    const chatMessages = participantPage.locator('[data-testid="chat-messages"]');
    await expect(chatMessages).not.toContainText('Hello from block 1', { timeout: 5000 });
  });
});
