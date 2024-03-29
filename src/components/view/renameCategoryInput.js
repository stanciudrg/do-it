import * as focusTrap from "focus-trap";
import PubSub from "pubsub-js";
import { createInput } from "./creator";
import {
  find,
  disableInput,
  enableInput,
  replace,
  updateInputValue,
  applyFocus,
} from "./viewHelpers";
import { DOMCache } from "./DOMCache";

// Factory function for creating RenameInputs
// callLocation = the button that triggered this function / the button that opened the context menu from which
// a button was clicked and this function was triggered
// categoryID = the id of the category that is being renamed by RenameInput.
// elementToReplace = the element that the RenameInput DOM representation is supposed to replace
// currentName = the current name of the category that is supposed to be renamed by RenameInput
function RenameInput(callLocation, categoryID, elementToReplace, currentName) {
  const renameInput = {};
  renameInput.field = createInput(
    "New category name",
    "name",
    "category-edit-field",
    "text",
  );
  renameInput.input = find(renameInput.field, "input");
  renameInput.elementToReplace = null;
  // Trap TAB focusing within the renameInput.field element
  renameInput.trap = focusTrap.createFocusTrap(renameInput.field, {
    allowOutsideClick: () => true,
    escapeDeactivates: () => false,
    setReturnFocus: () => callLocation,
  });

  renameInput.focusOnInput = function focusOnInput() {
    disableInput(DOMCache.body);
    enableInput(renameInput.input);
  };

  // Prevents the discardChanges function from firing when user
  // clicks the text input
  renameInput.preventPropagation = function preventPropagation(e) {
    e.stopImmediatePropagation();
  };

  renameInput.handleClickActions = function handleClickActions() {
        // Discard changes if user tries to submit an empty field
    if (renameInput.input.value.trim().length === 0) {
      renameInput.discardChanges();

      return;
    }

    renameInput.applyChanges();
  };

  renameInput.handleKeyboardActions = function handleKeyboardActions(e) {
    // Discard changes if user tries to submit an empty field
    if (e.key === "Enter") {
      if (renameInput.input.value.trim().length === 0) {
        renameInput.discardChanges();

        return;
      }

      renameInput.applyChanges();
    }

    if (e.key === "Escape") renameInput.discardChanges();
  };

  renameInput.removeEvents = function removeEvents() {
    renameInput.input.removeEventListener("focus", renameInput.focusOnInput);
    renameInput.input.removeEventListener(
      "mousedown",
      renameInput.preventPropagation,
    );
    document.removeEventListener("mousedown", renameInput.handleClickActions);
    document.removeEventListener("keydown", renameInput.handleKeyboardActions);
  };

  renameInput.discardChanges = function discardChanges() {
    renameInput.trap.deactivate();
    renameInput.removeEvents();
    enableInput(DOMCache.body);
    replace(elementToReplace, renameInput.field);
  };

  renameInput.applyChanges = function applyChanges() {
    renameInput.discardChanges();
    const newName = renameInput.input.value.trim();
    PubSub.publish("RENAME_CATEGORY_REQUEST", { categoryID, newName });
  };

  renameInput.initRenameInput = function initRenameInput() {
    replace(renameInput.field, elementToReplace);
    updateInputValue(renameInput.input, currentName);
    applyFocus(renameInput.input);
    renameInput.input.addEventListener("focus", renameInput.focusOnInput);
    renameInput.input.addEventListener(
      "mousedown",
      renameInput.preventPropagation,
    );
    document.addEventListener("mousedown", renameInput.handleClickActions);
    document.addEventListener("keydown", renameInput.handleKeyboardActions);
    renameInput.trap.activate();
  };

  return renameInput;
}

// Renders the RenameInput at the specified location
function renderRenameInput(callLocation, categoryID) {
  // Find the relative location of callLocation to decide what element needs
  // to be replaced with the rename input
  const isLocatedInsideContent = callLocation.closest('.content-header-container');
  const elementToReplace = isLocatedInsideContent ? DOMCache.contentTitle : find(
    find(DOMCache.userNavbarList, `[data-id="${categoryID}"]`),
    ".button-name",
  );
  const renameInput = RenameInput(
    callLocation,
    categoryID,
    elementToReplace,
    elementToReplace.textContent,
  );
  renameInput.initRenameInput();
}

PubSub.subscribe("RENDER_RENAME_INPUT_REQUEST", (msg, args) => {
  const { callLocation, categoryID } = args;
  renderRenameInput(callLocation, categoryID);
});