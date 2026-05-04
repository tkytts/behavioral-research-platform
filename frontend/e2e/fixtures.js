const { test: base, expect } = require('@playwright/test');

/**
 * Custom fixtures for behavioral research platform E2E tests
 *
 * These fixtures provide common utilities and setup for testing
 * the research platform's participant and experimenter workflows.
 *
 * Note: Fixtures wait for WebSocket connections rather than checking
 * window objects, as the app uses ES6 modules, not global state.
 */

// Extend base test with custom fixtures
const test = base.extend({
  /**
   * Navigate to participant page and wait for SignalR connection
   */
  participantPage: async ({ page }, use) => {
    // Track WebSocket connection
    let wsConnected = false;
    page.on('websocket', ws => {
      if (ws.url().includes('gamehub')) {
        wsConnected = true;
      }
    });

    await page.addInitScript(() => { localStorage.setItem('language', 'en'); });
    await page.goto('/participant');

    // Wait for WebSocket connection to establish
    await page.waitForTimeout(2000);

    // Log connection status
    if (!wsConnected) {
      console.log('Warning: WebSocket connection not detected for participant page');
    }

    await use(page);
  },

  /**
   * Navigate to experimenter page and wait for SignalR connection
   */
  experimenterPage: async ({ page }, use) => {
    // Track WebSocket connection
    let wsConnected = false;
    page.on('websocket', ws => {
      if (ws.url().includes('gamehub')) {
        wsConnected = true;
      }
    });

    await page.addInitScript(() => { localStorage.setItem('language', 'en'); });
    await page.goto('/experimenter');

    // Wait for WebSocket connection
    await page.waitForTimeout(2000);

    if (!wsConnected) {
      console.log('Warning: WebSocket connection not detected for experimenter page');
    }

    await use(page);
  },

  /**
   * Navigate to tutorial page
   */
  tutorialPage: async ({ page }, use) => {
    await page.addInitScript(() => { localStorage.setItem('language', 'en'); });
    await page.goto('/tutorial');
    await page.waitForTimeout(1000);
    await use(page);
  },

  /**
   * Dual page fixture: separate browser contexts for participant and experimenter
   */
  dualPage: async ({ browser }, use) => {
    const pCtx = await browser.newContext();
    const eCtx = await browser.newContext();
    const participantPage = await pCtx.newPage();
    const experimenterPage = await eCtx.newPage();

    // Track WS on both pages
    for (const pg of [participantPage, experimenterPage]) {
      pg.on('websocket', ws => {
        if (ws.url().includes('gamehub')) {
          pg._wsConnected = true;
        }
      });
    }

    await participantPage.addInitScript(() => { localStorage.setItem('language', 'en'); });
    await experimenterPage.addInitScript(() => { localStorage.setItem('language', 'en'); });
    await participantPage.goto('/participant');
    await experimenterPage.goto('/experimenter');

    // Wait for WebSocket connections to establish
    await Promise.all([
      participantPage.waitForFunction(() => true, null, { timeout: 5000 }).catch(() => {}),
      experimenterPage.waitForFunction(() => true, null, { timeout: 5000 }).catch(() => {}),
    ]);
    // Give SignalR time to connect
    await participantPage.waitForTimeout(2000);
    await experimenterPage.waitForTimeout(500);

    await use({ participantPage, experimenterPage });

    await pCtx.close();
    await eCtx.close();
  },
});

/**
 * Helper functions for common test operations
 */
const helpers = {
  /**
   * Reset game state via backend API (dev-only endpoint)
   */
  async resetGameState(request) {
    await request.post('/api/game/reset');
  },

  /**
   * Set participant name via UI
   */
  async setParticipantName(page, name) {
    const nameInput = page.locator('[data-testid="name-input"]');
    const submitButton = page.locator('[data-testid="name-submit"]');

    await nameInput.fill(name);
    await submitButton.click();

    // Wait for SignalR to process
    await page.waitForTimeout(500);
  },

  /**
   * Configure and start a game via the GameConfigModal
   * @param {import('@playwright/test').Page} page - The experimenter page
   * @param {Object} opts - Configuration options
   * @param {string} [opts.gender] - 'F' or 'M'
   * @param {string} [opts.confederateName] - Confederate name to select
   * @param {number} [opts.points] - Points awarded per correct answer
   * @param {number} [opts.maxTime] - Max time in seconds
   * @param {number} [opts.startingProblem] - Starting problem index (0-based)
   */
  async configureAndStartGame(page, opts = {}) {
    // Click Start Game to open the config modal
    await page.locator('[data-testid="start-game-btn"]').click();
    await expect(page.locator('[data-testid="config-modal"]')).toBeVisible({ timeout: 5000 });

    // Set gender if specified
    if (opts.gender === 'M') {
      await page.locator('[data-testid="gender-male"]').click();
      await page.waitForTimeout(300);
    } else if (opts.gender === 'F') {
      await page.locator('[data-testid="gender-female"]').click();
      await page.waitForTimeout(300);
    }

    // Select confederate if specified
    if (opts.confederateName) {
      await page.locator('[data-testid="confederate-select"]').selectOption(opts.confederateName);
    }

    // Set points if specified
    if (opts.points !== undefined) {
      const pointsInput = page.locator('[data-testid="points-input"]');
      await pointsInput.fill(String(opts.points));
    }

    // Set max time if specified
    if (opts.maxTime !== undefined) {
      const maxTimeInput = page.locator('[data-testid="max-time-input"]');
      await maxTimeInput.fill(String(opts.maxTime));
    }

    // Set starting problem if specified (use {value:} to match by value attribute, not display text)
    if (opts.startingProblem !== undefined) {
      await page.locator('[data-testid="starting-problem-select"]').selectOption({ value: String(opts.startingProblem) });
    }

    // Click Start
    await page.locator('[data-testid="config-start-btn"]').click();
    await page.waitForTimeout(500);
  },

  /**
   * Wait for the confederate assignment modal to appear on participant page
   */
  async waitForConfederateModal(page) {
    await expect(page.locator('[data-testid="confederate-modal"]')).toBeVisible({ timeout: 10000 });
  },

  /**
   * Click the Ready button on the participant page
   */
  async clickReady(page) {
    await page.locator('[data-testid="ready-button"]').click();
    await page.waitForTimeout(500);
  },

  /**
   * Resolve a game round via the ResolutionModal
   * @param {import('@playwright/test').Page} page - The experimenter page
   * @param {string} type - Resolution type: 'ap', 'anp', 'dp', 'dnp', 'tnp'
   * @param {string} [teamAnswer] - Team answer to enter
   */
  async resolveGame(page, type, teamAnswer) {
    await page.locator('[data-testid="resolve-game-btn"]').click();
    await expect(page.locator('[data-testid="team-answer-input"]')).toBeVisible({ timeout: 5000 });

    if (teamAnswer) {
      await page.locator('[data-testid="team-answer-input"]').fill(teamAnswer);
    }

    await page.locator(`[data-testid="btn-${type}"]`).click();
    await page.waitForTimeout(300);
  },

  /**
   * Wait for game resolved result to become visible (CSS visibility)
   */
  async waitForGameResolved(page) {
    await expect(page.locator('[data-testid="result-answer"]')).toHaveCSS('visibility', 'visible', { timeout: 15000 });
  },

  /**
   * Wait for timer display to contain specific text
   */
  async waitForTimerText(page, text) {
    await expect(page.locator('[data-testid="timer-display"]')).toContainText(text, { timeout: 15000 });
  },

  /**
   * Send a chat message via UI
   */
  async sendChatMessage(page, message) {
    const chatInput = page.locator('[data-testid="chat-input"]');
    await chatInput.fill(message);
    await chatInput.press('Enter');

    // Wait for message to be sent
    await page.waitForTimeout(300);
  },

  /**
   * Wait for a chat message to appear
   */
  async waitForChatMessage(page, messageText) {
    await expect(page.locator('[data-testid="chat-messages"]').locator('div', { hasText: messageText })).toBeVisible({ timeout: 5000 });
  },

  /**
   * Start the timer via experimenter controls
   */
  async startTimer(page) {
    const startButton = page.locator('button', { hasText: /start.*timer/i });
    await startButton.click();
    await page.waitForTimeout(300);
  },

  /**
   * Navigate to next problem via experimenter controls
   */
  async nextProblem(page) {
    await page.locator('[data-testid="next-problem-btn"]').click();
    await page.waitForTimeout(500);
  },

  /**
   * Check if SignalR is connected via console logs
   */
  async isSignalRConnected(page) {
    // Check for SignalR connection via console logs
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    await page.waitForTimeout(1000);

    return logs.some(log =>
      log.includes('SignalR connected') ||
      log.includes('Hub URL')
    );
  },

  /**
   * Wait for WebSocket connection to establish
   */
  async waitForWebSocket(page) {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(false), 5000);

      page.on('websocket', ws => {
        if (ws.url().includes('gamehub')) {
          clearTimeout(timeout);
          resolve(true);
        }
      });
    });
  },
};

module.exports = { test, expect, helpers };
