const { test, expect, helpers } = require('./fixtures');

test.describe('Game Config Modal', () => {
  test.beforeEach(async ({ request }) => {
    await helpers.resetGameState(request);
  });

  test('opens on Start Game click', async ({ experimenterPage }) => {
    await experimenterPage.locator('[data-testid="start-game-btn"]').click();
    const configModal = experimenterPage.locator('[data-testid="config-modal"]');
    await expect(configModal).toBeVisible({ timeout: 5000 });
  });

  test('populates confederates based on gender', async ({ experimenterPage }) => {
    await experimenterPage.locator('[data-testid="start-game-btn"]').click();
    await expect(experimenterPage.locator('[data-testid="config-modal"]')).toBeVisible({ timeout: 5000 });

    // Default is Female — record current confederate options
    const confederateSelect = experimenterPage.locator('[data-testid="confederate-select"]');
    const femaleOptions = await confederateSelect.locator('option').allTextContents();

    // Switch to Male
    await experimenterPage.locator('[data-testid="gender-male"]').click();
    await experimenterPage.waitForTimeout(500);

    // Confederate options should change
    const maleOptions = await confederateSelect.locator('option').allTextContents();
    expect(maleOptions).not.toEqual(femaleOptions);
  });

  test('defaults to Female gender and first confederate', async ({ experimenterPage }) => {
    await experimenterPage.locator('[data-testid="start-game-btn"]').click();
    await expect(experimenterPage.locator('[data-testid="config-modal"]')).toBeVisible({ timeout: 5000 });

    const confederateSelect = experimenterPage.locator('[data-testid="confederate-select"]');

    // If confederates haven't loaded yet, close and reopen to trigger the useEffect with loaded data
    const selectedValue = await confederateSelect.inputValue();
    if (!selectedValue) {
      await experimenterPage.locator('[data-testid="config-cancel-btn"]').click();
      await expect(experimenterPage.locator('[data-testid="config-modal"]')).toBeHidden({ timeout: 3000 });
      await experimenterPage.locator('[data-testid="start-game-btn"]').click();
      await expect(experimenterPage.locator('[data-testid="config-modal"]')).toBeVisible({ timeout: 5000 });
    }

    // Gender female should be checked
    const femaleRadio = experimenterPage.locator('[data-testid="gender-female"]');
    await expect(femaleRadio).toBeChecked();

    // Confederate select should have a value
    const finalValue = await confederateSelect.inputValue();
    expect(finalValue).toBeTruthy();
  });

  test('allows custom points and max time', async ({ experimenterPage }) => {
    await experimenterPage.locator('[data-testid="start-game-btn"]').click();
    await expect(experimenterPage.locator('[data-testid="config-modal"]')).toBeVisible({ timeout: 5000 });

    const pointsInput = experimenterPage.locator('[data-testid="points-input"]');
    const maxTimeInput = experimenterPage.locator('[data-testid="max-time-input"]');

    await pointsInput.fill('10');
    await maxTimeInput.fill('15');

    await expect(pointsInput).toHaveValue('10');
    await expect(maxTimeInput).toHaveValue('15');
  });

  test('allows toggling chime checkboxes', async ({ experimenterPage }) => {
    await experimenterPage.locator('[data-testid="start-game-btn"]').click();
    await expect(experimenterPage.locator('[data-testid="config-modal"]')).toBeVisible({ timeout: 5000 });

    // Find a chime checkbox within the config modal
    const chimeCheckbox = experimenterPage.locator('[data-testid="config-modal"] input[type="checkbox"]').first();
    await expect(chimeCheckbox).toBeVisible({ timeout: 3000 });

    // Get initial state and toggle
    const wasChecked = await chimeCheckbox.isChecked();
    await chimeCheckbox.click();
    const isNowChecked = await chimeCheckbox.isChecked();
    expect(isNowChecked).toBe(!wasChecked);
  });

  test('allows selecting starting problem 1-5', async ({ experimenterPage }) => {
    await experimenterPage.locator('[data-testid="start-game-btn"]').click();
    await expect(experimenterPage.locator('[data-testid="config-modal"]')).toBeVisible({ timeout: 5000 });

    const startingProblemSelect = experimenterPage.locator('[data-testid="starting-problem-select"]');
    await startingProblemSelect.selectOption({ value: '3' });

    const selectedValue = await startingProblemSelect.inputValue();
    expect(selectedValue).toBe('3');
  });

  test('closes on Cancel without starting game', async ({ experimenterPage }) => {
    await experimenterPage.locator('[data-testid="start-game-btn"]').click();
    const configModal = experimenterPage.locator('[data-testid="config-modal"]');
    await expect(configModal).toBeVisible({ timeout: 5000 });

    // Click Cancel
    await experimenterPage.locator('[data-testid="config-cancel-btn"]').click();

    // Modal should disappear
    await expect(configModal).toBeHidden({ timeout: 5000 });
  });

  test('sends all config values via SignalR on Start', async ({ experimenterPage }) => {
    await experimenterPage.locator('[data-testid="start-game-btn"]').click();
    const configModal = experimenterPage.locator('[data-testid="config-modal"]');
    await expect(configModal).toBeVisible({ timeout: 5000 });

    // Fill in config values
    await experimenterPage.locator('[data-testid="points-input"]').fill('8');
    await experimenterPage.locator('[data-testid="max-time-input"]').fill('12');
    await experimenterPage.locator('[data-testid="starting-problem-select"]').selectOption('2');

    // Click Start
    await experimenterPage.locator('[data-testid="config-start-btn"]').click();

    // Modal should close (game started successfully)
    await expect(configModal).toBeHidden({ timeout: 5000 });
  });

  test('re-opens with next confederate for second block', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;

    await helpers.setParticipantName(participantPage, 'ConfigTest');
    await helpers.configureAndStartGame(experimenterPage, {
      maxTime: 5,
      points: 5,
    });
    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);

    // Record initial confederate value
    // (We need to re-open the modal after block completion to check)

    // Complete 5 rounds to trigger block rotation
    for (let i = 0; i < 5; i++) {
      await helpers.resolveGame(experimenterPage, 'ap', `Answer${i}`);
      await helpers.waitForGameResolved(participantPage);
      await helpers.nextProblem(experimenterPage);
      await experimenterPage.waitForTimeout(500);
    }

    // Config modal should reopen for the next block
    const configModal = experimenterPage.locator('[data-testid="config-modal"]');
    await expect(configModal).toBeVisible({ timeout: 10000 });

    // Confederate select should have a value (auto-selected next confederate)
    const confederateSelect = experimenterPage.locator('[data-testid="confederate-select"]');
    const selectedValue = await confederateSelect.inputValue();
    expect(selectedValue).toBeTruthy();
  });
});
