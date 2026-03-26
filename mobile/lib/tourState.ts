let _pending = false;

export const tourState = {
  trigger() { _pending = true; },
  consume() { const v = _pending; _pending = false; return v; },
};
