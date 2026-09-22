// Spatial and Keyboard Navigation Utility for all forms

export function focusFirstInputOfVisiblePage() {
  setTimeout(() => {
    const activeContainer =
      document.querySelector('.vitals-card-container:not([style*="display: none"]), .paper-card:not([style*="display: none"]), .paper-consent-wrapper:not([style*="display: none"]), .vitals-chart-page-wrapper, main.app-main-content') ||
      document.body;

    const selector = 'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([disabled]), textarea:not([disabled]), select:not([disabled])';
    const rawList = Array.from(activeContainer.querySelectorAll(selector));

    const visibleInputs = rawList.filter(el => {
      const style = window.getComputedStyle(el);
      return (
        el.offsetWidth > 0 &&
        el.offsetHeight > 0 &&
        style.visibility !== 'hidden' &&
        style.display !== 'none' &&
        !el.closest('.hide-on-screen') &&
        !el.closest('[style*="display: none"]')
      );
    });

    if (visibleInputs.length > 0) {
      focusElement(visibleInputs[0]);
    }
  }, 80);
}

export function initKeyboardNavigation() {
  const handleKeyDown = (e) => {
    // Keys handled: ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Enter
    const key = e.key;
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(key)) {
      return;
    }

    const activeEl = document.activeElement;
    if (!activeEl || activeEl === document.body) return;

    const tagName = activeEl.tagName ? activeEl.tagName.toLowerCase() : '';
    const isInput = tagName === 'input';
    const isTextarea = tagName === 'textarea';
    const isSelect = tagName === 'select';
    const isButton = tagName === 'button';

    if (!isInput && !isTextarea && !isSelect && !isButton && activeEl.getAttribute('tabindex') !== '0') {
      return;
    }

    // Ignore if holding Command/Windows key
    if (e.metaKey) return;

    // Check textarea caret position safeguards
    if (isTextarea) {
      const val = activeEl.value || '';
      const start = activeEl.selectionStart;
      const end = activeEl.selectionEnd;

      if (key === 'ArrowUp') {
        const textBefore = val.substring(0, start);
        // If caret is on first line of textarea, navigate spatially Up
        if (textBefore.includes('\n')) {
          return; // Let native textarea move cursor up lines
        }
      } else if (key === 'ArrowDown') {
        const textAfter = val.substring(end);
        // If caret is on last line of textarea, navigate spatially Down
        if (textAfter.includes('\n')) {
          return; // Let native textarea move cursor down lines
        }
      } else if (key === 'ArrowLeft') {
        if (start > 0 || end > 0) return; // Allow normal caret movement
      } else if (key === 'ArrowRight') {
        if (start < val.length || end < val.length) return; // Allow normal caret movement
      } else if (key === 'Enter') {
        // Allow standard newline in textareas unless Shift/Ctrl is used
        if (!e.ctrlKey && !e.altKey) {
          return;
        }
      }
    }

    // Check input caret position safeguards for Left / Right Arrow
    if (isInput) {
      const inputType = (activeEl.type || 'text').toLowerCase();
      const isTextLike = ['text', 'email', 'tel', 'url', 'number', 'search', 'password'].includes(inputType);

      if (isTextLike && typeof activeEl.selectionStart === 'number') {
        const start = activeEl.selectionStart;
        const end = activeEl.selectionEnd;
        const valLen = (activeEl.value || '').length;

        if (key === 'ArrowLeft' && (start > 0 || end > 0)) {
          return; // Allow caret to move left inside text
        }
        if (key === 'ArrowRight' && (start < valLen || end < valLen)) {
          return; // Allow caret to move right inside text
        }
      }
    }

    // Select element specific navigation
    if (isSelect) {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        return; // Allow native option navigation inside the dropdown
      }
      if (key === 'Enter') {
        e.preventDefault();
        if (activeEl.dataset.isOpen === 'true') {
          // Second Enter: confirm highlighted option and move to next field
          delete activeEl.dataset.isOpen;
          moveToNextElement(activeEl);
        } else {
          // First Enter: open the dropdown picker
          activeEl.dataset.isOpen = 'true';
          if (typeof activeEl.showPicker === 'function') {
            try {
              activeEl.showPicker();
            } catch (err) {}
          }
          const handleClose = () => {
            delete activeEl.dataset.isOpen;
            activeEl.removeEventListener('blur', handleClose);
            activeEl.removeEventListener('change', handleClose);
          };
          activeEl.addEventListener('blur', handleClose, { once: true });
          activeEl.addEventListener('change', handleClose, { once: true });
        }
        return;
      }
    }

    // Enter key behavior: confirm value and move to next field
    if (key === 'Enter') {
      if (isButton) {
        const btnText = (activeEl.textContent || '').trim().toLowerCase();
        if (btnText.includes('next') || btnText.includes('previous') || btnText.includes('page') || activeEl.classList.contains('btn-secondary')) {
          focusFirstInputOfVisiblePage();
        }
        return; // Let button click proceed normally
      }
      e.preventDefault();
      if (isInput && (activeEl.type === 'radio' || activeEl.type === 'checkbox')) {
        activeEl.click();
      }
      moveToNextElement(activeEl);
      return;
    }

    // Spatial Navigation for Arrow Keys
    e.preventDefault();
    moveSpatially(activeEl, key);
  };

  const handleGlobalClick = (e) => {
    const btn = e.target.closest('button');
    if (btn) {
      const btnText = (btn.textContent || '').trim().toLowerCase();
      if (btnText.includes('next') || btnText.includes('previous') || btnText.includes('page')) {
        focusFirstInputOfVisiblePage();
      }
    }
  };

  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('click', handleGlobalClick, true);

  return () => {
    window.removeEventListener('keydown', handleKeyDown, true);
    window.removeEventListener('click', handleGlobalClick, true);
  };
}

function getFocusableElements() {
  const activeContainer =
    document.querySelector('.vitals-card-container:not([style*="display: none"]), .paper-card:not([style*="display: none"]), .vitals-chart-page-wrapper, main.app-main-content') ||
    document.body;

  const selector = 'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex="0"]';
  const rawList = Array.from(activeContainer.querySelectorAll(selector));

  return rawList.filter(el => {
    const style = window.getComputedStyle(el);
    return (
      el.offsetWidth > 0 &&
      el.offsetHeight > 0 &&
      style.visibility !== 'hidden' &&
      style.display !== 'none'
    );
  });
}

function moveToNextElement(currEl) {
  const list = getFocusableElements();
  const idx = list.indexOf(currEl);
  if (idx !== -1 && idx < list.length - 1) {
    focusElement(list[idx + 1]);
  } else if (list.length > 0) {
    focusElement(list[0]);
  }
}

function moveSpatially(currEl, direction) {
  const list = getFocusableElements();
  if (list.length <= 1) return;

  const currRect = currEl.getBoundingClientRect();
  const currMidX = currRect.left + currRect.width / 2;
  const currMidY = currRect.top + currRect.height / 2;

  let bestCandidate = null;
  let minScore = Infinity;

  list.forEach(candidate => {
    if (candidate === currEl) return;
    const candRect = candidate.getBoundingClientRect();
    const candMidX = candRect.left + candRect.width / 2;
    const candMidY = candRect.top + candRect.height / 2;

    let isDir = false;
    let primaryDist = 0;
    let secondaryDist = 0;

    if (direction === 'ArrowRight') {
      if (candRect.left >= currRect.right - 10 || candMidX > currMidX + 15) {
        isDir = true;
        primaryDist = Math.max(0, candRect.left - currRect.right);
        secondaryDist = Math.abs(candMidY - currMidY);
      }
    } else if (direction === 'ArrowLeft') {
      if (candRect.right <= currRect.left + 10 || candMidX < currMidX - 15) {
        isDir = true;
        primaryDist = Math.max(0, currRect.left - candRect.right);
        secondaryDist = Math.abs(candMidY - currMidY);
      }
    } else if (direction === 'ArrowDown') {
      if (candRect.top >= currRect.bottom - 10 || candMidY > currMidY + 15) {
        isDir = true;
        primaryDist = Math.max(0, candRect.top - currRect.bottom);
        secondaryDist = Math.abs(candMidX - currMidX);
      }
    } else if (direction === 'ArrowUp') {
      if (candRect.bottom <= currRect.top + 10 || candMidY < currMidY - 15) {
        isDir = true;
        primaryDist = Math.max(0, currRect.top - candRect.bottom);
        secondaryDist = Math.abs(candMidX - currMidX);
      }
    }

    if (isDir) {
      const score = primaryDist + secondaryDist * 2.0;
      if (score < minScore) {
        minScore = score;
        bestCandidate = candidate;
      }
    }
  });

  if (bestCandidate) {
    focusElement(bestCandidate);
  } else {
    // Fallback to DOM order
    const idx = list.indexOf(currEl);
    if (direction === 'ArrowRight' || direction === 'ArrowDown') {
      if (idx !== -1 && idx < list.length - 1) focusElement(list[idx + 1]);
    } else if (direction === 'ArrowLeft' || direction === 'ArrowUp') {
      if (idx > 0) focusElement(list[idx - 1]);
    }
  }
}

function focusElement(el) {
  if (!el) return;
  el.focus();
  if (typeof el.select === 'function' && ['text', 'email', 'tel', 'number', 'search'].includes(el.type)) {
    try {
      el.select();
    } catch (err) {}
  }
  try {
    el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  } catch (err) {}
}
