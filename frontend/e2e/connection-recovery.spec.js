const { test, expect, helpers } = require('./fixtures');

test.describe('Connection Recovery', () => {
  test.beforeEach(async ({ request }) => {
    await helpers.resetGameState(request);
  });

  test('shows reconnecting alert on network loss', async ({ participantPage }) => {
    // Set participant name so we have an active connection
    await helpers.setParticipantName(participantPage, 'ConnTest');

    // Simulate network loss
    await participantPage.context().setOffline(true);

    // Should show a reconnecting alert (SignalR detects WebSocket close quickly)
    const alert = participantPage.locator('.alert-warning, [role="alert"]');
    await expect(alert).toBeVisible({ timeout: 30000 });
    const alertText = await alert.textContent();
    expect(alertText.toLowerCase()).toMatch(/reconnecting|connection/);

    // Restore network
    await participantPage.context().setOffline(false);
    await participantPage.waitForTimeout(3000);

    // Alert should disappear after reconnection
    await expect(alert).toBeHidden({ timeout: 30000 });
  });

  test('shows connection failed alert when server unreachable', async ({ participantPage }) => {
    await helpers.setParticipantName(participantPage, 'ConnTest');

    // Go offline to simulate server unreachable
    await participantPage.context().setOffline(true);
    await participantPage.waitForTimeout(5000);

    // Should show a warning alert about connection issues
    const alert = participantPage.locator('.alert-warning, [role="alert"]');
    await expect(alert).toBeVisible({ timeout: 30000 });

    // Restore network
    await participantPage.context().setOffline(false);
  });

  test('re-establishes WebSocket after page reload', async ({ participantPage }) => {
    await helpers.setParticipantName(participantPage, 'ReloadTest');
    await participantPage.waitForTimeout(1000);

    // Start counting WebSocket connections from after this point
    let wsAfterReload = 0;
    participantPage.on('websocket', ws => {
      if (ws.url().includes('gamehub')) {
        wsAfterReload++;
      }
    });

    // Reload the page
    await participantPage.reload();
    await participantPage.waitForTimeout(3000);

    // WebSocket should re-establish after reload
    expect(wsAfterReload).toBeGreaterThan(0);
  });

  test('participant can re-enter after reload during game', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;

    // Set up a running game
    await helpers.setParticipantName(participantPage, 'ReloadPlayer');
    await helpers.configureAndStartGame(experimenterPage, {
      maxTime: 30,
      points: 5,
    });
    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);

    // Verify game-box is visible before reload
    await expect(participantPage.locator('[data-testid="game-box"]')).toBeVisible({ timeout: 5000 });

    // Reload participant page
    await participantPage.reload();
    await participantPage.waitForTimeout(2000);

    // Re-enter participant name
    await helpers.setParticipantName(participantPage, 'ReloadPlayer');

    // Game box should become visible again (rejoin the active game)
    await expect(participantPage.locator('[data-testid="game-box"]')).toBeVisible({ timeout: 10000 });
  });
});
