const INTERACTIVE_TAGS = new Set(["BUTTON", "A", "INPUT", "TEXTAREA", "SELECT"]);

export const shouldIgnoreSequentialCheckGlobalKeydown = (event: KeyboardEvent): boolean => {
  if (event.defaultPrevented || event.repeat || event.isComposing) {
    return true;
  }

  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }

  if (
    (event.key === "ArrowLeft" || event.key === "ArrowRight") &&
    target.closest('[role="radiogroup"]')
  ) {
    return true;
  }

  if (INTERACTIVE_TAGS.has(target.tagName)) {
    return true;
  }

  const role = target.getAttribute("role");
  if (role === "radio" || role === "button") {
    return true;
  }

  if (target.closest("[contenteditable=true]")) {
    return true;
  }

  return false;
};
