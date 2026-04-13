const STORAGE_KEY = "flashcards_data_v1";
const THEME_KEY = "flashcards_theme_v1";

const elements = {
  flashcard: document.getElementById("flashcard"),
  questionText: document.getElementById("questionText"),
  answerText: document.getElementById("answerText"),
  cardCounter: document.getElementById("cardCounter"),
  flipBtn: document.getElementById("flipBtn"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  addBtn: document.getElementById("addBtn"),
  importBtn: document.getElementById("importBtn"),
  editBtn: document.getElementById("editBtn"),
  deleteBtn: document.getElementById("deleteBtn"),
  shuffleBtn: document.getElementById("shuffleBtn"),
  toggleThemeBtn: document.getElementById("toggleThemeBtn"),
  cardModal: document.getElementById("cardModal"),
  modalTitle: document.getElementById("modalTitle"),
  cardForm: document.getElementById("cardForm"),
  questionInput: document.getElementById("questionInput"),
  answerInput: document.getElementById("answerInput"),
  cancelModalBtn: document.getElementById("cancelModalBtn"),
  importModal: document.getElementById("importModal"),
  importForm: document.getElementById("importForm"),
  jsonInput: document.getElementById("jsonInput"),
  jsonFileInput: document.getElementById("jsonFileInput"),
  cancelImportBtn: document.getElementById("cancelImportBtn")
};

const state = {
  cards: [],
  currentIndex: 0,
  isEditing: false
};

// Persist flashcards in browser storage.
function saveCards() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cards));
}

// Load flashcards from localStorage if available.
function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return false;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return false;
    }
    state.cards = sanitizeCards(parsed);
    return true;
  } catch (error) {
    console.error("Failed to parse localStorage flashcards:", error);
    return false;
  }
}

// Keep only valid flashcard objects with non-empty question/answer strings.
function sanitizeCards(rawCards) {
  if (!Array.isArray(rawCards)) {
    return [];
  }

  return rawCards
    .filter((item) => item && typeof item.question === "string" && typeof item.answer === "string")
    .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
    .filter((item) => item.question && item.answer);
}

// Initialize cards from localStorage first, then fallback to data.json or empty.
async function loadInitialCards() {
  const hasStorage = loadFromStorage();
  if (hasStorage) {
    render();
    return;
  }

  try {
    const response = await fetch("./data.json");
    if (!response.ok) {
      throw new Error("data.json not found");
    }
    const data = await response.json();
    if (Array.isArray(data)) {
      state.cards = sanitizeCards(data);
      saveCards();
    }
  } catch (_error) {
    state.cards = [];
  }

  render();
}

// Theme handling (bonus feature).
function applyTheme(theme) {
  const dark = theme === "dark";
  document.body.classList.toggle("dark", dark);
  elements.toggleThemeBtn.textContent = dark ? "Light Mode" : "Dark Mode";
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(savedTheme);
}

function toggleTheme() {
  const isDark = document.body.classList.contains("dark");
  const nextTheme = isDark ? "light" : "dark";
  localStorage.setItem(THEME_KEY, nextTheme);
  applyTheme(nextTheme);
}

// Utility accessors and rendering helpers.
function getCurrentCard() {
  return state.cards[state.currentIndex];
}

function setCardTexts(question, answer) {
  elements.questionText.textContent = question;
  elements.answerText.textContent = answer;
}

function setControlsDisabled(isDisabled) {
  elements.flipBtn.disabled = isDisabled;
  elements.prevBtn.disabled = isDisabled;
  elements.nextBtn.disabled = isDisabled;
  elements.editBtn.disabled = isDisabled;
  elements.deleteBtn.disabled = isDisabled;
  elements.shuffleBtn.disabled = isDisabled;
}

function resetFlip() {
  elements.flashcard.classList.remove("is-flipped");
}

// Keep the card UI in sync with current app state.
function render() {
  const total = state.cards.length;

  if (total === 0) {
    state.currentIndex = 0;
    setCardTexts("No flashcards yet. Add one to begin.", "Your answer will appear here.");
    elements.cardCounter.textContent = "0 / 0";
    setControlsDisabled(true);
    resetFlip();
    return;
  }

  if (state.currentIndex >= total) {
    state.currentIndex = total - 1;
  }
  if (state.currentIndex < 0) {
    state.currentIndex = 0;
  }

  const card = getCurrentCard();
  setCardTexts(card.question, card.answer);
  elements.cardCounter.textContent = `${state.currentIndex + 1} / ${total}`;
  setControlsDisabled(false);
  resetFlip();
}

// Modal controls for add/edit form.
function showModal(isEditing) {
  state.isEditing = isEditing;
  elements.modalTitle.textContent = isEditing ? "Edit Flashcard" : "Add Flashcard";

  if (isEditing) {
    const card = getCurrentCard();
    elements.questionInput.value = card.question;
    elements.answerInput.value = card.answer;
  } else {
    elements.questionInput.value = "";
    elements.answerInput.value = "";
  }

  elements.cardModal.classList.remove("hidden");
  elements.questionInput.focus();
}

function hideModal() {
  elements.cardModal.classList.add("hidden");
  elements.cardForm.reset();
}

function showImportModal() {
  elements.importModal.classList.remove("hidden");
  elements.jsonInput.focus();
}

function hideImportModal() {
  elements.importModal.classList.add("hidden");
  elements.importForm.reset();
}

// CRUD operations.
function addCard(question, answer) {
  state.cards.push({ question, answer });
  state.currentIndex = state.cards.length - 1;
  saveCards();
  render();
}

function editCard(question, answer) {
  if (!getCurrentCard()) {
    return;
  }
  state.cards[state.currentIndex] = { question, answer };
  saveCards();
  render();
}

function deleteCard() {
  if (!getCurrentCard()) {
    return;
  }
  state.cards.splice(state.currentIndex, 1);
  saveCards();
  render();
}

// Card interactions and navigation.
function nextCard() {
  if (state.cards.length === 0) {
    return;
  }
  state.currentIndex = (state.currentIndex + 1) % state.cards.length;
  render();
}

function prevCard() {
  if (state.cards.length === 0) {
    return;
  }
  state.currentIndex = (state.currentIndex - 1 + state.cards.length) % state.cards.length;
  render();
}

function flipCard() {
  if (state.cards.length === 0) {
    return;
  }
  elements.flashcard.classList.toggle("is-flipped");
}

function shuffleCards() {
  if (state.cards.length < 2) {
    return;
  }
  for (let i = state.cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = state.cards[i];
    state.cards[i] = state.cards[j];
    state.cards[j] = temp;
  }
  state.currentIndex = 0;
  saveCards();
  render();
}

function parseAndImportCards(jsonText) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (_error) {
    alert("JSON is invalid. Please check format and try again.");
    return;
  }

  const importedCards = sanitizeCards(parsed);
  if (importedCards.length === 0) {
    alert("No valid flashcards found. Required format: [{\"question\":\"...\",\"answer\":\"...\"}]");
    return;
  }

  state.cards = state.cards.concat(importedCards);
  saveCards();
  state.currentIndex = state.cards.length - importedCards.length;
  render();
  hideImportModal();
  alert(`Imported ${importedCards.length} flashcard(s) successfully.`);
}

// Form + keyboard event handlers.
function onFormSubmit(event) {
  event.preventDefault();
  const question = elements.questionInput.value.trim();
  const answer = elements.answerInput.value.trim();

  if (!question || !answer) {
    return;
  }

  if (state.isEditing) {
    editCard(question, answer);
  } else {
    addCard(question, answer);
  }
  hideModal();
}

function onImportSubmit(event) {
  event.preventDefault();
  const jsonText = elements.jsonInput.value.trim();
  if (!jsonText) {
    alert("Please paste JSON data or choose a JSON file first.");
    return;
  }
  parseAndImportCards(jsonText);
}

function onJsonFileChange(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    elements.jsonInput.value = String(reader.result || "");
  };
  reader.onerror = () => {
    alert("Cannot read this file. Please try another JSON file.");
  };
  reader.readAsText(file, "utf-8");
}

function handleKeyboardNavigation(event) {
  const isCardModalOpen = !elements.cardModal.classList.contains("hidden");
  const isImportModalOpen = !elements.importModal.classList.contains("hidden");
  const isModalOpen = isCardModalOpen || isImportModalOpen;

  if (isModalOpen) {
    if (event.key === "Escape") {
      if (isCardModalOpen) {
        hideModal();
      } else {
        hideImportModal();
      }
    }
    return;
  }

  if (event.key === "ArrowRight") {
    nextCard();
  } else if (event.key === "ArrowLeft") {
    prevCard();
  } else if (event.key === " ") {
    event.preventDefault();
    flipCard();
  }
}

// Wire all DOM events once on startup.
function bindEvents() {
  elements.flashcard.addEventListener("click", flipCard);
  elements.flipBtn.addEventListener("click", flipCard);
  elements.prevBtn.addEventListener("click", prevCard);
  elements.nextBtn.addEventListener("click", nextCard);
  elements.addBtn.addEventListener("click", () => showModal(false));
  elements.importBtn.addEventListener("click", showImportModal);
  elements.editBtn.addEventListener("click", () => showModal(true));
  elements.deleteBtn.addEventListener("click", deleteCard);
  elements.shuffleBtn.addEventListener("click", shuffleCards);
  elements.toggleThemeBtn.addEventListener("click", toggleTheme);
  elements.cancelModalBtn.addEventListener("click", hideModal);
  elements.cancelImportBtn.addEventListener("click", hideImportModal);
  elements.cardForm.addEventListener("submit", onFormSubmit);
  elements.importForm.addEventListener("submit", onImportSubmit);
  elements.jsonFileInput.addEventListener("change", onJsonFileChange);
  elements.cardModal.addEventListener("click", (event) => {
    if (event.target === elements.cardModal) {
      hideModal();
    }
  });
  elements.importModal.addEventListener("click", (event) => {
    if (event.target === elements.importModal) {
      hideImportModal();
    }
  });
  document.addEventListener("keydown", handleKeyboardNavigation);
}

function init() {
  loadTheme();
  bindEvents();
  loadInitialCards();
}

init();
