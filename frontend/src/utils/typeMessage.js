/**
 * Simulates typing a message character by character.
 * @param {string} message
 * @param {object} options
 * @param {number} options.delay - ms between keystrokes (default 100)
 * @param {function} options.onCharacter - called with (partialText) after each keystroke
 * @param {function} options.onComplete - called with (fullText) when done
 * @returns {number} interval ID so callers can register it for cleanup
 */
export function typeMessage(message, { delay = 100, onCharacter, onComplete } = {}) {
  let built = "";
  const characters = message.split("");
  let index = 0;

  const intervalId = setInterval(() => {
    built += characters[index];
    onCharacter?.(built);
    index++;
    if (index >= characters.length) {
      clearInterval(intervalId);
      onComplete?.(message);
    }
  }, delay);

  return intervalId;
}
