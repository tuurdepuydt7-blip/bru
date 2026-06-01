const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const SEGMENT_COUNT = 4;
const SEGMENT_LENGTH = 4;
const RETRY_INTERVAL_MS = 700;
const AUTO_START_PATH = '/redeem';
let bruteForceInterval = null;

console.log('[BruteForce] content script geladen op', window.location.href);

function randomCodeSegment() {
  let segment = '';
  for (let i = 0; i < SEGMENT_LENGTH; i += 1) {
    segment += LETTERS[Math.floor(Math.random() * LETTERS.length)];
  }
  return segment;
}

function generateRandomCode() {
  const segments = [];
  for (let i = 0; i < SEGMENT_COUNT; i += 1) {
    segments.push(randomCodeSegment());
  }
  return segments.join('-');
}

function dispatchInputEvents(element) {
  ['input', 'change'].forEach((eventName) => {
    const event = new Event(eventName, { bubbles: true, cancelable: true });
    element.dispatchEvent(event);
  });
}

function setNativeValue(element, value) {
  const prototype = Object.getPrototypeOf(element);
  const valueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
  if (valueSetter) {
    valueSetter.call(element, value);
  } else {
    element.value = value;
  }
}

function findInputField() {
  const byId = document.getElementById('input-code');
  if (byId) {
    console.log('[BruteForce] input gevonden met id input-code');
    return byId;
  }

  const wrapperSelector = '.foundation-web-input.flex.items-center.width-full.stroke-standard.bg-none.height-1200.radius-medium.padding-x-medium.gap-x-small.stroke-contrast-alpha';
  const wrapper = document.querySelector(wrapperSelector);
  if (wrapper) {
    const nested = wrapper.querySelector('input, textarea, [contenteditable="true"], [contenteditable]:not([contenteditable="false"])');
    console.log('[BruteForce] wrapper gevonden voor custom field', wrapper, 'nested:', nested);
    return nested || wrapper;
  }

  const candidates = Array.from(document.querySelectorAll(
    'input.foundation-web-input, textarea.foundation-web-input, [class*="foundation-web-input"] input, [class*="foundation-web-input"] textarea, [class*="foundation-web-input"] [contenteditable="true"], [class*="foundation-web-input"] [contenteditable]:not([contenteditable="false"])'
  ));
  if (candidates.length) {
    console.log('[BruteForce] inputkandidaten gevonden:', candidates);
  }
  return candidates[0] || null;
}

function findButton() {
  const button = document.querySelector('.redeem-btn, [class*="redeem-btn"]');
  if (button) {
    return button;
  }

  const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], a')).filter((el) => {
    const text = (el.innerText || el.value || '').trim();
    return /redeem|submit|exchange|claim/i.test(text);
  });
  if (buttons.length) {
    console.log('[BruteForce] mogelijke buttons:', buttons);
  }
  return buttons[0] || null;
}

function setFieldValue(element, value) {
  if (!element) return;
  if (element.isContentEditable) {
    element.innerText = value;
  } else {
    setNativeValue(element, value);
  }
}

function tryRedeemRandomCode() {
  const input = findInputField();
  const button = findButton();

  if (!input || !button) {
    console.log('[BruteForce] input of button niet gevonden. input=', input, 'button=', button);
    return;
  }

  const code = generateRandomCode();
  setFieldValue(input, code);
  dispatchInputEvents(input);

  console.log('[BruteForce] Vul code in:', code, 'naar element:', input, 'en klik button:', button);
  button.click();
}

function startBruteForce() {
  if (bruteForceInterval) {
    console.log('[BruteForce] Al bezig met brute force.');
    return;
  }
  console.log('[BruteForce] Start brute force...');
  bruteForceInterval = window.setInterval(tryRedeemRandomCode, RETRY_INTERVAL_MS);
}

function stopBruteForce() {
  if (bruteForceInterval) {
    window.clearInterval(bruteForceInterval);
    bruteForceInterval = null;
    console.log('[BruteForce] Brute force gestopt.');
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[BruteForce] bericht ontvangen:', message);
  if (message && message.action === 'startHack') {
    startBruteForce();
    sendResponse({ status: 'started' });
  }
});

window.addEventListener('load', () => {
  console.log('[BruteForce] pagina geladen op', window.location.href);
  if (window.location.pathname.includes(AUTO_START_PATH)) {
    console.log('[BruteForce] auto-start op redeem-pagina');
    startBruteForce();
  }
});

window.addEventListener('beforeunload', stopBruteForce);
