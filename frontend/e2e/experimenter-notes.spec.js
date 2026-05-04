const { test, expect, helpers } = require('./fixtures');

test.describe('Experimenter Notes', () => {
  test.beforeEach(async ({ request }) => {
    await helpers.resetGameState(request);
  });

  test('renders notes textarea', async ({ experimenterPage }) => {
    const textarea = experimenterPage.locator('#experimenter-notes');
    await expect(textarea).toBeVisible({ timeout: 5000 });
  });

  test('persists to localStorage with debounce', async ({ experimenterPage }) => {
    const textarea = experimenterPage.locator('#experimenter-notes');
    await expect(textarea).toBeVisible({ timeout: 5000 });

    await textarea.fill('Test note content');

    // Wait for debounce (500ms) plus buffer
    await experimenterPage.waitForTimeout(700);

    const stored = await experimenterPage.evaluate(() =>
      localStorage.getItem('experimenter_notes')
    );
    expect(stored).toContain('Test note content');
  });

  test('auto-inserts block/problem markers', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;

    // Check that notes textarea exists (feature flag)
    const textarea = experimenterPage.locator('#experimenter-notes');
    if (!(await textarea.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Set up a game
    await helpers.setParticipantName(participantPage, 'NotesTest');
    await helpers.configureAndStartGame(experimenterPage, {
      maxTime: 5,
      points: 7,
    });
    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);

    // Resolve current problem and advance to next
    await helpers.resolveGame(experimenterPage, 'ap', 'Answer');
    await helpers.waitForGameResolved(participantPage);
    await helpers.nextProblem(experimenterPage);

    // Check textarea value for block/problem marker
    const value = await textarea.inputValue();
    expect(value).toMatch(/Block.*Problem/);
  });

  test('auto-inserts resolution markers', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;

    const textarea = experimenterPage.locator('#experimenter-notes');
    if (!(await textarea.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    // Set up a game
    await helpers.setParticipantName(participantPage, 'NotesResTest');
    await helpers.configureAndStartGame(experimenterPage, {
      maxTime: 5,
      points: 7,
    });
    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);

    // Resolve the game
    await helpers.resolveGame(experimenterPage, 'ap', 'Triangle');
    await helpers.waitForGameResolved(participantPage);

    // Check textarea value for resolution marker
    const value = await textarea.inputValue();
    expect(value).toContain('Resolution:');
  });

  test('clears on End Session', async ({ experimenterPage }) => {
    const textarea = experimenterPage.locator('#experimenter-notes');
    await expect(textarea).toBeVisible({ timeout: 5000 });

    // Type some notes
    await textarea.fill('Notes to be cleared');
    await experimenterPage.waitForTimeout(700);

    // Verify notes are saved
    const storedBefore = await experimenterPage.evaluate(() =>
      localStorage.getItem('experimenter_notes')
    );
    expect(storedBefore).toContain('Notes to be cleared');

    // Handle confirm dialog
    experimenterPage.on('dialog', dialog => dialog.accept());

    // Click End Session
    await experimenterPage.locator('[data-testid="end-session-btn"]').click();
    await experimenterPage.waitForTimeout(500);

    // Check localStorage is cleared
    const storedAfter = await experimenterPage.evaluate(() =>
      localStorage.getItem('experimenter_notes')
    );
    expect(storedAfter).toBeNull();
  });
});
