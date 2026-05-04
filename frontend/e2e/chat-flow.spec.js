const { test, expect, helpers } = require('./fixtures');

test.describe('Chat Flow', () => {
  test.beforeEach(async ({ request }) => {
    await helpers.resetGameState(request);
  });

  /**
   * Helper to set up a running game with chat available.
   */
  async function setupGameWithChat(participantPage, experimenterPage) {
    await helpers.setParticipantName(participantPage, 'ChatUser');
    await helpers.configureAndStartGame(experimenterPage, {
      maxTime: 30,
      points: 5,
    });
    await helpers.waitForConfederateModal(participantPage);
    await helpers.clickReady(participantPage);
  }

  test('participant message appears on experimenter', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGameWithChat(participantPage, experimenterPage);

    // Participant sends a message
    await participantPage.locator('[data-testid="chat-input"]').fill('Hello from participant');
    await participantPage.locator('[data-testid="send-button"]').click();

    // Message should appear on experimenter side
    await helpers.waitForChatMessage(experimenterPage, 'Hello from participant');
  });

  test('experimenter message appears on participant', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGameWithChat(participantPage, experimenterPage);

    // Experimenter sends a message
    await helpers.sendChatMessage(experimenterPage, 'Hello from experimenter');

    // Message should appear on participant side
    await helpers.waitForChatMessage(participantPage, 'Hello from experimenter');
  });

  test('typing indicator shows and hides', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGameWithChat(participantPage, experimenterPage);

    // Type individual characters to trigger the typing indicator
    const chatInput = participantPage.locator('[data-testid="chat-input"]');
    await chatInput.press('H');

    // Typing indicator should appear on experimenter side
    const typingIndicator = experimenterPage.locator('[data-testid="typing-indicator"]');
    await expect(typingIndicator).toBeVisible({ timeout: 3000 });

    // Stop typing and wait for indicator to auto-hide (~1s idle)
    await experimenterPage.waitForTimeout(2000);
    await expect(typingIndicator).toBeHidden({ timeout: 5000 });
  });

  test('clear chat removes all messages', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGameWithChat(participantPage, experimenterPage);

    // Send 3 messages
    await helpers.sendChatMessage(participantPage, 'Message one');
    await helpers.waitForChatMessage(experimenterPage, 'Message one');

    await helpers.sendChatMessage(participantPage, 'Message two');
    await helpers.waitForChatMessage(experimenterPage, 'Message two');

    await helpers.sendChatMessage(participantPage, 'Message three');
    await helpers.waitForChatMessage(experimenterPage, 'Message three');

    // Click clear chat button on experimenter
    const clearButton = experimenterPage.locator('[data-testid="clear-chat-btn"]');
    await clearButton.click();

    // Chat messages should be empty on both sides
    const experimenterMessages = experimenterPage.locator('[data-testid="chat-messages"]');
    await expect(experimenterMessages).not.toContainText('Message one', { timeout: 5000 });
    await expect(experimenterMessages).not.toContainText('Message two');
    await expect(experimenterMessages).not.toContainText('Message three');

    const participantMessages = participantPage.locator('[data-testid="chat-messages"]');
    await expect(participantMessages).not.toContainText('Message one', { timeout: 5000 });
    await expect(participantMessages).not.toContainText('Message two');
    await expect(participantMessages).not.toContainText('Message three');
  });

  test('messages arrive in correct order', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGameWithChat(participantPage, experimenterPage);

    // Send 3 messages rapidly from participant
    await helpers.sendChatMessage(participantPage, 'First');
    await helpers.sendChatMessage(participantPage, 'Second');
    await helpers.sendChatMessage(participantPage, 'Third');

    // Wait for all messages to arrive on experimenter
    await helpers.waitForChatMessage(experimenterPage, 'Third');

    // Verify ordering by checking text content of chat-messages container
    const chatText = await experimenterPage.locator('[data-testid="chat-messages"]').textContent();
    const firstIndex = chatText.indexOf('First');
    const secondIndex = chatText.indexOf('Second');
    const thirdIndex = chatText.indexOf('Third');

    expect(firstIndex).toBeLessThan(secondIndex);
    expect(secondIndex).toBeLessThan(thirdIndex);
  });

  test('special characters preserved', async ({ dualPage }) => {
    const { participantPage, experimenterPage } = dualPage;
    await setupGameWithChat(participantPage, experimenterPage);

    const specialMessage = 'Olá, como está?';
    await helpers.sendChatMessage(participantPage, specialMessage);

    // Verify the message renders correctly on experimenter side
    await helpers.waitForChatMessage(experimenterPage, specialMessage);
  });
});
