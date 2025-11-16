// script.js
(() => {
  const overlay = document.getElementById('pin-overlay');
  const keypad = document.getElementById('keypad');
  const displayDots = [...document.querySelectorAll('.pin-display .dot')];
  const submitBtn = document.getElementById('submit-pin');
  const msg = document.getElementById('pin-msg');
  const lockCard = document.querySelector('.lock-card');
  const protectedArea = document.getElementById('protected-area');

  // UI state
  let pin = '';

  // update dots UI
  function updateDots() {
    displayDots.forEach((d, i) => {
      d.classList.toggle('filled', i < pin.length);
    });
  }

  // key input handling
  keypad.addEventListener('click', async (e) => {
    const t = e.target;
    if (!t.classList.contains('key')) return;
    const k = t.dataset.key;
    if (k !== undefined) {
      if (pin.length >= 6) return; // limit length
      pin += String(k);
    }
    updateDots();
    clearMsg();
  });

  // clear/back
  document.getElementById('clear').addEventListener('click', () => {
    pin = '';
    updateDots();
    clearMsg();
  });
  document.getElementById('back').addEventListener('click', () => {
    pin = pin.slice(0, -1);
    updateDots();
    clearMsg();
  });

  // clear msg
  function clearMsg() {
    msg.textContent = '';
    lockCard.classList.remove('shake');
  }

  // submit
  submitBtn.addEventListener('click', async () => {
    if (pin.length < 4) {
      msg.textContent = 'PIN must be at least 4 digits';
      shake();
      return;
    }
    // call vercel API (/api/check-pin)
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Checking...';

      const resp = await fetch('/api/check-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await resp.json();
      if (resp.ok && data.ok) {
        // success: hide overlay
        overlay.classList.remove('active');
        overlay.setAttribute('aria-hidden', 'true');
        protectedArea.focus();
        // small success glow
        protectedArea.animate([{ filter: 'brightness(0.9)' }, { filter: 'brightness(1.15)' }, { filter: 'brightness(1)' }], { duration: 600 });
      } else {
        msg.textContent = data?.message || 'Wrong PIN';
        shake();
        pin = '';
        updateDots();
      }

    } catch(err) {
      msg.textContent = 'Network error';
      shake();
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Unlock';
    }
  });

  function shake() {
    lockCard.classList.remove('shake');
    // reflow to restart animation
    void lockCard.offsetWidth;
    lockCard.classList.add('shake');
  }

  // optional: allow Enter key when user types using mobile keyboard (not recommended for real keypad UI)
  document.addEventListener('keydown', (ev) => {
    if (!overlay.classList.contains('active')) return;
    if (/^\d$/.test(ev.key) && pin.length < 6) {
      pin += ev.key;
      updateDots();
    } else if (ev.key === 'Backspace') {
      pin = pin.slice(0, -1);
      updateDots();
    } else if (ev.key === 'Enter') {
      submitBtn.click();
    }
  });

  // Prevent navigation of buttons while locked (defense-in-depth)
  document.querySelectorAll('.neon-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      if (overlay.classList.contains('active')) {
        e.preventDefault();
        shake();
      }
    });
  });

})();
