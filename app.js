import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  deleteUser,
  reauthenticateWithPopup
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  writeBatch,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"

// Canonical order of Bible books
const BIBLE_BOOKS = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy", "Joshua", "Judges", "Ruth",
  "1 Samuel", "2 Samuel", "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalms", "Psalm", "Proverbs", "Ecclesiastes", "Song of Solomon",
  "Isaiah", "Jeremiah", "Lamentations", "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk", "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians", "2 Corinthians",
  "Galatians", "Ephesians", "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews", "James", "1 Peter", "2 Peter",
  "1 John", "2 John", "3 John", "Jude", "Revelation"
]

function getBibleBookIndex(ref) {
  if (!ref) return 999
  const cleanRef = ref.trim().toLowerCase()
  for (let i = 0; i < BIBLE_BOOKS.length; i++) {
    if (cleanRef.startsWith(BIBLE_BOOKS[i].toLowerCase())) {
      return i
    }
  }
  return 999
}

let selectedSortMode = "custom"
let draggedVerseId = null

const firebaseConfig = {
  apiKey: "AIzaSyC9ree98RpN5OlY5GnzKoLwT04WLxQm3sE",
  authDomain: "scripture-memory-c047d.firebaseapp.com",
  projectId: "scripture-memory-c047d",
  storageBucket: "scripture-memory-c047d.firebasestorage.app",
  messagingSenderId: "875411886063",
  appId: "1:875411886063:web:53f418ad0191b224c3b01a",
  measurementId: "G-ZN6DMGBSK4"
};

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const provider = new GoogleAuthProvider()

async function ensureUserDoc(user) {
  const userRef = doc(db, "users", user.uid)
  const snap = await getDoc(userRef)

  console.log("User logged in:", user.uid)

  if (!snap.exists()) {
    console.log("Creating NEW Firestore user")
    await setDoc(userRef, {
      email: user.email || "",
      name: user.displayName || "",
      createdAt: serverTimestamp(),
      welcomeEmailSent: false
    })
  } else {
    console.log("User already exists, skip create")
  }
}

const DEFAULT_VERSES = []

let titlePuzzleHidden = []
let titlePuzzleSlots = []
let versePuzzleHidden = []
let versePuzzleSlots = []
let titleBankItems = []
let verseBankItems = []
let selectedTitleBankWord = ""
let selectedVerseBankWord = ""

let titleWords = []
let verseWords = []

let verses = []
let words = []
let hiddenIndexes = []

let selectedVerseId = ""
let currentMode = "type"

let tapDifficulty = "easy"

let collections = []
let groups = []
let selectedCollectionFilter = ""
let selectedGroupFilter = ""
let moveVerseId = ""
let libraryScrollY = 0

const btnLogin = document.getElementById("btnLogin")
const btnLogout = document.getElementById("btnLogout")
const authMsg = document.getElementById("authMsg")

const newTitle = document.getElementById("newTitle")
const practiceTitle = document.getElementById("practiceTitle")
const gameMemoryTitle = document.getElementById("gameMemoryTitle")

const pagePractice = document.getElementById("pagePractice")
const pageLibrary = document.getElementById("pageLibrary")
const pageGame = document.getElementById("pageGame")
const pageSettings = document.getElementById("pageSettings")

const tabLibrary = document.getElementById("tabLibrary")
const tabSettings = document.getElementById("tabSettings")

const gameTitle = document.getElementById("gameTitle")
const gameRef = document.getElementById("gameRef")
const gameVerse = document.getElementById("gameVerse")

const modeType = document.getElementById("modeType")
const modeDrag = document.getElementById("modeDrag")
const modeLetters = document.getElementById("modeLetters")
const btnBackToLibrary = document.getElementById("btnBackToLibrary")

const verseText = document.getElementById("verseText")
const result = document.getElementById("result")
const stats = document.getElementById("stats")
const answer = document.getElementById("answer")
const answerRow = document.getElementById("answerRow")

const lettersGame = document.getElementById("lettersGame")
const dragGame = document.getElementById("dragGame")
const blankLine = document.getElementById("blankLine")
const wordBank = document.getElementById("wordBank")
const difficultyEasy = document.getElementById("difficultyEasy")
const difficultyMedium = document.getElementById("difficultyMedium")
const difficultyHard = document.getElementById("difficultyHard")

const btnHideAll = document.getElementById("btnHideAll")
const btnReset = document.getElementById("btnReset")
const btnGiveHint = document.getElementById("btnGiveHint")
const btnCheck = document.getElementById("btnCheck")

const pasteBox = document.getElementById("pasteBox")
const btnAutoFill = document.getElementById("btnAutoFill")

const newRef = document.getElementById("newRef")
const newText = document.getElementById("newText")
const manageMsg = document.getElementById("ManageMsg")
const btnSaveVerse = document.getElementById("btnSaveVerse")
const btnClearVerse = document.getElementById("btnClearVerse")
const libraryGrid = document.getElementById("libraryGrid")

const themeSelect = document.getElementById("themeSelect")
const settingsMsg = document.getElementById("settingsMsg")
const btnDeleteAccount = document.getElementById("btnDeleteAccount")
const newVersion = document.getElementById("newVersion")
const btnBackToGame = document.getElementById("btnBackToGame")
const practiceVerseTitle = document.getElementById("practiceVerseTitle")

const titleAnswerRow = document.getElementById("titleAnswerRow")
const titleAnswer = document.getElementById("titleAnswer")

const titleDragSection = document.getElementById("titleDragSection")
const titleBlankLine = document.getElementById("titleBlankLine")
const titleWordBank = document.getElementById("titleWordBank")

const titleLettersSection = document.getElementById("titleLettersSection")
const titleLettersGame = document.getElementById("titleLettersGame")
const verseLettersGame = document.getElementById("verseLettersGame")

const collectionSelect = document.getElementById("collectionSelect")
const groupSelect = document.getElementById("groupSelect")

const pageAddCollection = document.getElementById("pageAddCollection")
const pageAddGroup = document.getElementById("pageAddGroup")

const newCollectionName = document.getElementById("newCollectionName")
const newGroupName = document.getElementById("newGroupName")

const btnSaveCollection = document.getElementById("btnSaveCollection")
const btnCancelCollection = document.getElementById("btnCancelCollection")
const btnSaveGroup = document.getElementById("btnSaveGroup")
const btnCancelGroup = document.getElementById("btnCancelGroup")

const collectionMsg = document.getElementById("collectionMsg")
const groupMsg = document.getElementById("groupMsg")

const collectionFilters = document.getElementById("collectionFilters")
const groupFilters = document.getElementById("groupFilters")

const btnAddCollectionInline = document.getElementById("btnAddCollectionInline")
const btnRenameCollectionInline = document.getElementById("btnRenameCollectionInline")
const btnDeleteCollectionInline = document.getElementById("btnDeleteCollectionInline")

const btnAddGroupInline = document.getElementById("btnAddGroupInline")
const btnRenameGroupInline = document.getElementById("btnRenameGroupInline")
const btnDeleteGroupInline = document.getElementById("btnDeleteGroupInline")

const modalOverlay = document.getElementById("modalOverlay")

const renameCollectionModal = document.getElementById("renameCollectionModal")
const renameGroupModal = document.getElementById("renameGroupModal")
const deleteCollectionModal = document.getElementById("deleteCollectionModal")
const deleteGroupModal = document.getElementById("deleteGroupModal")

const renameCollectionInput = document.getElementById("renameCollectionInput")
const renameGroupInput = document.getElementById("renameGroupInput")

const btnSaveRenameCollection = document.getElementById("btnSaveRenameCollection")
const btnCancelRenameCollection = document.getElementById("btnCancelRenameCollection")
const btnSaveRenameGroup = document.getElementById("btnSaveRenameGroup")
const btnCancelRenameGroup = document.getElementById("btnCancelRenameGroup")

const btnConfirmDeleteCollection = document.getElementById("btnConfirmDeleteCollection")
const btnCancelDeleteCollection = document.getElementById("btnCancelDeleteCollection")
const btnConfirmDeleteGroup = document.getElementById("btnConfirmDeleteGroup")
const btnCancelDeleteGroup = document.getElementById("btnCancelDeleteGroup")

const moveVerseModal = document.getElementById("moveVerseModal")
const moveVerseCollectionSelect = document.getElementById("moveVerseCollectionSelect")
const moveVerseGroupSelect = document.getElementById("moveVerseGroupSelect")
const btnSaveMoveVerse = document.getElementById("btnSaveMoveVerse")
const btnCancelMoveVerse = document.getElementById("btnCancelMoveVerse")

const btnImportCsvPage = document.getElementById("btnImportCsvPage")
const pageImportCsv = document.getElementById("pageImportCsv")
const csvFileInput = document.getElementById("csvFileInput")
const importCollectionSelect = document.getElementById("importCollectionSelect")
const importGroupSelect = document.getElementById("importGroupSelect")
const btnImportCsv = document.getElementById("btnImportCsv")
const btnCancelImportCsv = document.getElementById("btnCancelImportCsv")
const importCsvMsg = document.getElementById("importCsvMsg")

const sortSelect = document.getElementById("sortSelect")

let currentUser = null

async function loginWithGoogle() {
  console.log("login button clicked")
  try {
    await signInWithPopup(auth, provider)
    console.log("popup opened or login succeeded")
  } catch (error) {
    console.error("Google login error:", error)
    authMsg.textContent = "Login failed."
  }
}

async function logoutUser() {
  try {
    await signOut(auth)
  } catch (error) {
    console.error(error)
    authMsg.textContent = "Logout failed."
  }
}

onAuthStateChanged(auth, async (user) => {
  currentUser = user || null

  if (currentUser) {
    authMsg.textContent = "Signed in as " + (currentUser.displayName || currentUser.email || "User")
    btnLogin.classList.add("isHidden")
    btnLogout.classList.remove("isHidden")

    await ensureUserDoc(currentUser)
    authMsg.textContent = "Signed in as " + (currentUser.displayName || currentUser.email || "User")

    await loadThemePreference()
    await loadCollectionsFromCloud()
    await loadGroupsFromCloud()
    updateGroupState()
    await loadVersesFromCloud()
  } else {
    authMsg.textContent = "Not signed in."
    btnLogin.classList.remove("isHidden")
    btnLogout.classList.add("isHidden")

    applyTheme(getSavedTheme())
    if (settingsMsg) settingsMsg.textContent = "Theme saved in browser."

    verses = []
    selectedVerseId = ""
    titleWords = []
    verseWords = []
    collections = []
    groups = []
    renderCollectionOptions()
    updateGroupState()
    renderGroupOptions()

    answer.value = ""
    if (titleAnswer) titleAnswer.value = ""
    result.textContent = ""
    result.className = "result"

    renderLibrary()
    setPracticeEnabled(false)
    practiceVerseTitle.textContent = "No verses yet"
    verseText.textContent = "Please log in to load your verses."
    setTypingEnabled(false)
  }
})

async function loadVersesFromCloud() {
  if (!currentUser) {
    verses = []
    renderLibrary()
    return
  }

  try {
    const versesRef = collection(db, "users", currentUser.uid, "verses")
    const snapshot = await getDocs(versesRef)

    const cloudVerses = []

    snapshot.forEach((docSnap) => {
      const data = docSnap.data()
      cloudVerses.push({
        id: docSnap.id,
        title: data.title || "",
        ref: data.ref || "",
        version: data.version || "",
        text: data.text || "",
        collection: data.collection || "None",
        group: data.group || "",
        order: typeof data.order === "number" ? data.order : 9999
      })
    })

    verses = DEFAULT_VERSES.concat(cloudVerses)
    renderLibrary()

    if (verses.length > 0) {
      loadVerse(verses[0].id)
      setPracticeEnabled(true)
    } else {
      setPracticeEnabled(false)
      practiceVerseTitle.textContent = "No verses yet"
      verseText.textContent = "Go to Library to add one."
      setTypingEnabled(false)
    }
  } catch (error) {
    console.error("Load verses failed:", error)
    manageMsg.textContent = "Failed to load cloud verses."
  }
}

function refreshVerses() {
  if (!Array.isArray(verses)) {
    verses = []
  }
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[.,!?;:"'’“”()[\]{}]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function setTypingEnabled(enabled) {
  answer.disabled = !enabled
  answer.placeholder = enabled ? "Start typing here." : "Hide words first to type."

  if (titleAnswer) {
    titleAnswer.disabled = !enabled
  }
}

function setPracticeEnabled(enabled) {
  btnHideAll.disabled = !enabled
  btnReset.disabled = !enabled
  btnCheck.disabled = !enabled
  btnGiveHint.disabled = !enabled

  if (!enabled) {
    answer.value = ""
    result.textContent = ""
    result.className = "result"
  }
}

function loadStats() {
  const count = localStorage.getItem("memoryScore") || "0"
  stats.textContent = "Verses memorized: " + count
}

function saveScore() {
  let count = Number(localStorage.getItem("memoryScore") || 0)
  count += 1
  localStorage.setItem("memoryScore", String(count))
  stats.textContent = "Verses memorized: " + count
}

function getSavedTheme() {
  return localStorage.getItem("memoryTheme") || "sepia"
}

async function deleteCollectionDocsByPath(pathSegments) {
  const snap = await getDocs(collection(db, ...pathSegments))
  const tasks = snap.docs.map(docSnap => deleteDoc(docSnap.ref))
  await Promise.all(tasks)
}

async function deleteCurrentAccountAfterReauth() {
  const uid = currentUser.uid

  await deleteCollectionDocsByPath(["users", uid, "verses"])
  await deleteCollectionDocsByPath(["users", uid, "groups"])
  await deleteCollectionDocsByPath(["users", uid, "collections"])

  await deleteDoc(doc(db, "users", uid))
  await deleteUser(currentUser)

  if (settingsMsg) settingsMsg.textContent = "Account deleted."
}

async function deleteCurrentAccount() {
  if (!currentUser) {
    if (settingsMsg) settingsMsg.textContent = "Please log in first."
    return
  }

  const firstConfirm = window.confirm("Delete your account and all your verses, groups, and collections?")
  if (!firstConfirm) return

  const secondConfirm = window.confirm("This cannot be undone. Are you sure?")
  if (!secondConfirm) return

  try {
    if (settingsMsg) settingsMsg.textContent = "Deleting account..."
    await deleteCurrentAccountAfterReauth()
  } catch (error) {
    console.error("Delete account failed:", error)

    if (error.code === "auth/requires-recent-login") {
      try {
        await reauthenticateWithPopup(currentUser, provider)
        await deleteCurrentAccountAfterReauth()
      } catch (reauthError) {
        console.error("Reauthentication failed:", reauthError)
        if (settingsMsg) settingsMsg.textContent = "Reauthentication failed."
      }
      return
    }

    if (settingsMsg) settingsMsg.textContent = "Failed to delete account."
  }
}

function applyTheme(theme) {
  const validThemes = ["sepia", "white", "warm", "night", "forest"]
  const safeTheme = validThemes.includes(theme) ? theme : "sepia"
  document.body.setAttribute("data-theme", safeTheme)
  if (themeSelect) themeSelect.value = safeTheme
}

async function loadThemePreference() {
  if (!currentUser) {
    const localTheme = getSavedTheme()
    applyTheme(localTheme)
    if (settingsMsg) settingsMsg.textContent = "Theme saved in this browser."
    return
  }

  const localTheme = getSavedTheme()
  applyTheme(localTheme)
  if (settingsMsg) settingsMsg.textContent = "Theme saved to your account."
}

function saveTheme(theme) {
  localStorage.setItem("memoryTheme", theme)
  applyTheme(theme)

  if (!currentUser) {
    if (settingsMsg) settingsMsg.textContent = "Theme saved in this browser."
    return
  }

  if (settingsMsg) settingsMsg.textContent = "Theme saved to your account."
}

function initTheme() {
  applyTheme(getSavedTheme())
}

function loadVerse(id) {
  const verse = verses.find(v => v.id === id)
  if (!verse) return

  selectedVerseId = id

  const fullRef = verse.version ? verse.ref + " (" + verse.version + ")" : verse.ref
  practiceVerseTitle.textContent = fullRef

  titleWords = verse.title ? verse.title.split(/\s+/) : []
  verseWords = verse.text.split(/\s+/)

  if (practiceTitle) {
    practiceTitle.textContent = ""
    practiceTitle.classList.add("isHidden")
  }

  if (titleAnswerRow) {
    titleAnswerRow.classList.toggle("isHidden", titleWords.length === 0)
  }

  if (titleAnswer) {
    titleAnswer.value = ""
  }

  words = [...verseWords]
  hiddenIndexes = []

  renderVerse()
  answer.value = ""
  result.textContent = ""
  result.className = "result"
}

function renderVerse() {
  verseText.innerHTML = ""

  words.forEach((word, index) => {
    const span = document.createElement("span")
    span.className = "token"

    if (hiddenIndexes.includes(index)) {
      span.classList.add("hidden")
      span.textContent = "__".repeat(Math.max(1, word.length))
    } else {
      span.textContent = word
    }

    verseText.appendChild(span)
    verseText.appendChild(document.createTextNode(" "))
  })
}

function revealOneWord() {
  if (hiddenIndexes.length === 0) return
  hiddenIndexes.pop()
  renderVerse()
}

function hideAllWords() {
  hiddenIndexes = words.map((word, index) => index)
  renderVerse()
  setTypingEnabled(true)
  answer.focus()
}

function revealAllWords() {
  hiddenIndexes = []
  renderVerse()
  answer.focus()
}

function toggleHideAll() {
  if (hiddenIndexes.length === words.length) {
    revealAllWords()
    btnHideAll.textContent = "Hide All"
  } else {
    hideAllWords()
    btnHideAll.textContent = "Reveal All"
  }
}

function resetTypeMode() {
  hiddenIndexes = words.map((word, index) => index)
  renderVerse()
  setTypingEnabled(true)
  answer.value = ""
  if (titleAnswer) titleAnswer.value = ""
  result.textContent = ""
  result.className = "result"

  if (titleAnswerRow && !titleAnswerRow.classList.contains("isHidden")) {
    titleAnswer.focus()
  } else {
    answer.focus()
  }
}

function clearSlot(slots, bankItems, slotIndex) {
  const slot = slots.find(s => s.index === slotIndex)
  if (!slot || !slot.itemId) {
    if (slot) slot.filled = ""
    return
  }

  const item = bankItems.find(bankItem => bankItem.id === slot.itemId)
  if (item) {
    item.placedIn = null
  }

  slot.filled = ""
  slot.itemId = ""
}

function placeBankItemInSlot(slots, bankItems, slotIndex, itemId) {
  const slot = slots.find(s => s.index === slotIndex)
  const item = bankItems.find(bankItem => bankItem.id === itemId)

  if (!slot || !item) return

  if (slot.itemId && slot.itemId !== itemId) {
    clearSlot(slots, bankItems, slotIndex)
  }

  if (item.placedIn !== null && item.placedIn !== undefined) {
    clearSlot(slots, bankItems, item.placedIn)
  }

  slot.filled = item.text
  slot.itemId = item.id
  item.placedIn = slotIndex
}

function makeBankItems(hiddenIndexes, sourceWords, prefix) {
  return hiddenIndexes.map((index, hiddenPosition) => ({
    id: `${prefix}-${index}-${hiddenPosition}`,
    text: sourceWords[index],
    homeIndex: index,
    placedIn: null
  }))
}

function buildDragPuzzle() {
  const ratio = getDifficultyRatio()

  const verseHideCount = Math.max(1, Math.floor(verseWords.length * ratio))
  const titleHideCount = titleWords.length > 0
    ? Math.max(1, Math.floor(titleWords.length * ratio))
    : 0

  titlePuzzleHidden = []
  titlePuzzleSlots = []
  versePuzzleHidden = []
  versePuzzleSlots = []
  titleBankItems = []
  verseBankItems = []

  selectedTitleBankWord = ""
  selectedVerseBankWord = ""

  const titleIndexes = titleWords.map((word, index) => index)
  while (titlePuzzleHidden.length < titleHideCount && titleIndexes.length > 0) {
    const randomPos = Math.floor(Math.random() * titleIndexes.length)
    titlePuzzleHidden.push(titleIndexes.splice(randomPos, 1)[0])
  }

  titlePuzzleHidden.sort((a, b) => a - b)

  titlePuzzleSlots = titlePuzzleHidden.map(index => ({
    index,
    expected: titleWords[index],
    filled: "",
    itemId: ""
  }))

  titleBankItems = makeBankItems(titlePuzzleHidden, titleWords, "title")

  const verseIndexes = verseWords.map((word, index) => index)
  while (versePuzzleHidden.length < verseHideCount && verseIndexes.length > 0) {
    const randomPos = Math.floor(Math.random() * verseIndexes.length)
    versePuzzleHidden.push(verseIndexes.splice(randomPos, 1)[0])
  }

  versePuzzleHidden.sort((a, b) => a - b)

  versePuzzleSlots = versePuzzleHidden.map(index => ({
    index,
    expected: verseWords[index],
    filled: "",
    itemId: ""
  }))

  verseBankItems = makeBankItems(versePuzzleHidden, verseWords, "verse")

  updateDifficultyButtons()
  renderDragPuzzle()
}

function getDifficultyRatio() {
  if (tapDifficulty === "medium") return 0.5
  if (tapDifficulty === "hard") return 0.75
  return 0.25
}

function updateDifficultyButtons() {
  if (!difficultyEasy || !difficultyMedium || !difficultyHard) return

  difficultyEasy.classList.toggle("active", tapDifficulty === "easy")
  difficultyMedium.classList.toggle("active", tapDifficulty === "medium")
  difficultyHard.classList.toggle("active", tapDifficulty === "hard")
}

function renderDragPuzzle() {
  blankLine.innerHTML = ""
  wordBank.innerHTML = ""

  if (titleDragSection) {
    titleDragSection.classList.toggle("isHidden", titleWords.length === 0)
  }

  if (titleBlankLine) titleBlankLine.innerHTML = ""
  if (titleWordBank) titleWordBank.innerHTML = ""

  if (titleWords.length > 0 && titleBlankLine && titleWordBank) {
    const titleHiddenSet = new Set(titlePuzzleHidden)

    for (let i = 0; i < titleWords.length; i++) {
      if (titleHiddenSet.has(i)) {
        const blank = document.createElement("span")
        const slot = titlePuzzleSlots.find(s => s.index === i)

        blank.textContent = slot && slot.filled ? slot.filled : "_____"
        blank.className = slot && slot.filled ? "blank filled" : "blank"

        blank.addEventListener("click", () => {
          const currentSlot = titlePuzzleSlots.find(s => s.index === i)
          if (!currentSlot) return

          if (selectedTitleBankWord) {
            placeBankItemInSlot(titlePuzzleSlots, titleBankItems, i, selectedTitleBankWord)
            selectedTitleBankWord = ""
            renderDragPuzzle()
            return
          }

          if (currentSlot.filled) {
            clearSlot(titlePuzzleSlots, titleBankItems, i)
            renderDragPuzzle()
          }
        })

        titleBlankLine.appendChild(blank)
      } else {
        const span = document.createElement("span")
        span.textContent = titleWords[i]
        titleBlankLine.appendChild(span)
      }

      titleBlankLine.appendChild(document.createTextNode(" "))
    }

    const titleAvailableBankItems = titleBankItems
      .filter(item => item.placedIn === null)
      .sort(() => Math.random() - 0.5)

    titleAvailableBankItems.forEach(item => {
      const pill = document.createElement("span")
      pill.className = "pill"
      pill.textContent = item.text
      if (selectedTitleBankWord === item.id) {
        pill.classList.add("active")
      }

      pill.addEventListener("click", () => {
        selectedTitleBankWord = item.id
        titleWordBank.querySelectorAll(".pill").forEach(p => p.classList.remove("active"))
        pill.classList.add("active")
      })

      titleWordBank.appendChild(pill)
    })
  }

  const verseHiddenSet = new Set(versePuzzleHidden)

  for (let i = 0; i < verseWords.length; i++) {
    if (verseHiddenSet.has(i)) {
      const blank = document.createElement("span")
      const slot = versePuzzleSlots.find(s => s.index === i)

      blank.textContent = slot && slot.filled ? slot.filled : "_____"
      blank.className = slot && slot.filled ? "blank filled" : "blank"

      blank.addEventListener("click", () => {
        const currentSlot = versePuzzleSlots.find(s => s.index === i)
        if (!currentSlot) return

        if (selectedVerseBankWord) {
          placeBankItemInSlot(versePuzzleSlots, verseBankItems, i, selectedVerseBankWord)
          selectedVerseBankWord = ""
          renderDragPuzzle()
          return
        }

        if (currentSlot.filled) {
          clearSlot(versePuzzleSlots, verseBankItems, i)
          renderDragPuzzle()
        }
      })

      blankLine.appendChild(blank)
    } else {
      const span = document.createElement("span")
      span.textContent = verseWords[i]
      blankLine.appendChild(span)
    }

    blankLine.appendChild(document.createTextNode(" "))
  }

  const verseAvailableBankItems = verseBankItems
    .filter(item => item.placedIn === null)
    .sort(() => Math.random() - 0.5)

  verseAvailableBankItems.forEach(item => {
    const pill = document.createElement("span")
    pill.className = "pill"
    pill.textContent = item.text
    if (selectedVerseBankWord === item.id) {
      pill.classList.add("active")
    }

    pill.addEventListener("click", () => {
      selectedVerseBankWord = item.id
      wordBank.querySelectorAll(".pill").forEach(p => p.classList.remove("active"))
      pill.classList.add("active")
    })

    wordBank.appendChild(pill)
  })
}

function renderLettersGame() {
  if (titleLettersSection) {
    titleLettersSection.classList.toggle("isHidden", titleWords.length === 0)
  }

  if (titleLettersGame) {
    titleLettersGame.innerHTML = ""
  }

  if (verseLettersGame) {
    verseLettersGame.innerHTML = ""
  }

  if (titleWords.length > 0 && titleLettersGame) {
    renderLetterSection(titleWords, titleLettersGame, "title")
  }

  if (verseLettersGame) {
    renderLetterSection(verseWords, verseLettersGame, "verse")
  }

  const firstBox =
    document.querySelector('#titleLettersGame .letterBox:not(.isHidden)') ||
    document.querySelector('#verseLettersGame .letterBox:not(.isHidden)')

  if (firstBox) firstBox.focus()
}

function renderLetterSection(sourceWords, container, sectionType) {
  sourceWords.forEach((word, index) => {
    const wrapper = document.createElement("span")
    wrapper.className = "letterWord"

    const cleanWord = word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
    const leading = (word.match(/^[^a-zA-Z0-9]+/) || [""])[0]
    const trailing = (word.match(/[^a-zA-Z0-9]+$/) || [""])[0]

    if (!cleanWord) {
      const plain = document.createElement("span")
      plain.className = "fullWord"
      plain.textContent = word
      wrapper.appendChild(plain)
      container.appendChild(wrapper)
      container.appendChild(document.createTextNode(" "))
      return
    }

    if (leading) {
      const leadSpan = document.createElement("span")
      leadSpan.className = "fullWord"
      leadSpan.textContent = leading
      wrapper.appendChild(leadSpan)
    }

    const input = document.createElement("input")
    input.type = "text"
    input.maxLength = 1
    input.className = "letterBox"
    input.dataset.index = String(index)
    input.dataset.section = sectionType
    input.placeholder = "_"

    const fullWord = document.createElement("span")
    fullWord.className = "fullWord isHidden"
    fullWord.textContent = cleanWord

    input.addEventListener("input", () => {
      const expected = cleanWord.charAt(0).toLowerCase()
      const user = input.value.trim().toLowerCase()

      input.classList.remove("wrong")

      if (!user) return

      if (user === expected) {
        input.classList.add("isHidden")
        fullWord.classList.remove("isHidden")
        moveToNextLetterBox()
      } else {
        input.classList.add("wrong")
      }
    })

    input.addEventListener("keydown", event => {
      if (event.key === "Backspace" && input.classList.contains("isHidden")) {
        event.preventDefault()
      }
    })

    wrapper.appendChild(input)
    wrapper.appendChild(fullWord)

    if (trailing) {
      const trailSpan = document.createElement("span")
      trailSpan.className = "fullWord"
      trailSpan.textContent = trailing
      wrapper.appendChild(trailSpan)
    }

    container.appendChild(wrapper)
    container.appendChild(document.createTextNode(" "))
  })
}

function moveToNextLetterBox() {
  const next =
    document.querySelector('#titleLettersGame .letterBox:not(.isHidden)') ||
    document.querySelector('#verseLettersGame .letterBox:not(.isHidden)')

  if (next) next.focus()
}

function checkTypeMode() {
  const expectedTitleWords = titleWords.map(word => normalize(word)).filter(Boolean)
  const expectedVerseWords = verseWords.map(word => normalize(word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ""))).filter(Boolean)

  const userTitleWords = normalize(titleAnswer ? titleAnswer.value : "").split(" ").filter(Boolean)
  const userVerseWords = normalize(answer.value).split(" ").filter(Boolean)

  let correctTitle = 0
  let correctVerse = 0

  for (let i = 0; i < expectedTitleWords.length; i++) {
    if ((userTitleWords[i] || "") === expectedTitleWords[i]) {
      correctTitle += 1
    }
  }

  for (let i = 0; i < expectedVerseWords.length; i++) {
    if ((userVerseWords[i] || "") === expectedVerseWords[i]) {
      correctVerse += 1
    }
  }

  const total = expectedTitleWords.length + expectedVerseWords.length
  const correct = correctTitle + correctVerse
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100)

  if (expectedTitleWords.length > 0) {
    result.textContent =
      "Title: " + correctTitle + "/" + expectedTitleWords.length +
      ". Verse: " + correctVerse + "/" + expectedVerseWords.length +
      ". Total: " + correct + "/" + total + ". " + percent + "%."
  } else {
    result.textContent =
      "Verse: " + correctVerse + "/" + expectedVerseWords.length +
      ". Total: " + correct + "/" + total + ". " + percent + "%."
  }

  result.className = percent === 100 ? "result good" : "result bad"

  if (percent === 100) {
    saveScore()
  }
}

function checkDragMode() {
  let titleCorrect = 0
  let titleFilled = 0
  let titleTotal = titlePuzzleSlots.length

  titlePuzzleSlots.forEach(slot => {
    if (slot.filled && slot.filled.trim() !== "") titleFilled += 1
    if (normalize(slot.filled || "") === normalize(slot.expected || "")) titleCorrect += 1
  })

  let verseCorrect = 0
  let verseFilled = 0
  let verseTotal = versePuzzleSlots.length

  versePuzzleSlots.forEach(slot => {
    if (slot.filled && slot.filled.trim() !== "") verseFilled += 1
    if (normalize(slot.filled || "") === normalize(slot.expected || "")) verseCorrect += 1
  })

  const total = titleTotal + verseTotal
  const correct = titleCorrect + verseCorrect
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100)

  if (titleTotal > 0) {
    result.textContent =
      "Title: " + titleCorrect + "/" + titleTotal +
      ". Verse: " + verseCorrect + "/" + verseTotal +
      ". Total: " + correct + "/" + total + ". " + percent + "%."
  } else {
    result.textContent =
      "Verse: " + verseCorrect + "/" + verseTotal +
      ". Total: " + correct + "/" + total + ". " + percent + "%."
  }

  result.className = percent === 100 ? "result good" : "result bad"

  if (percent === 100) {
    saveScore()
  }
}

function checkLettersGame() {
  let titleCorrect = 0
  let titleTotal = 0
  let verseCorrect = 0
  let verseTotal = 0

  if (titleLettersGame) {
    const titleWrappers = titleLettersGame.querySelectorAll(".letterWord")

    titleWrappers.forEach(wrapper => {
      const input = wrapper.querySelector(".letterBox")
      const fullWord = wrapper.querySelector(".fullWord")

      if (!input || !fullWord) return

      titleTotal += 1

      if (!fullWord.classList.contains("isHidden")) {
        titleCorrect += 1
        return
      }

      const index = Number(input.dataset.index)
      const cleanWord = titleWords[index].replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
      const expected = cleanWord.charAt(0).toLowerCase()
      const user = input.value.trim().toLowerCase()

      if (user === expected) {
        titleCorrect += 1
        input.classList.add("isHidden")
        fullWord.classList.remove("isHidden")
        input.classList.remove("wrong")
      } else if (user) {
        input.classList.add("wrong")
      }
    })
  }

  if (verseLettersGame) {
    const verseWrappers = verseLettersGame.querySelectorAll(".letterWord")

    verseWrappers.forEach(wrapper => {
      const input = wrapper.querySelector(".letterBox")
      const fullWord = wrapper.querySelector(".fullWord")

      if (!input || !fullWord) return

      verseTotal += 1

      if (!fullWord.classList.contains("isHidden")) {
        verseCorrect += 1
        return
      }

      const index = Number(input.dataset.index)
      const cleanWord = verseWords[index].replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
      const expected = cleanWord.charAt(0).toLowerCase()
      const user = input.value.trim().toLowerCase()

      if (user === expected) {
        verseCorrect += 1
        input.classList.add("isHidden")
        fullWord.classList.remove("isHidden")
        input.classList.remove("wrong")
      } else if (user) {
        input.classList.add("wrong")
      }
    })
  }

  const total = titleTotal + verseTotal
  const correct = titleCorrect + verseCorrect
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100)

  if (titleTotal > 0) {
    result.textContent =
      "Title: " + titleCorrect + "/" + titleTotal +
      ". Verse: " + verseCorrect + "/" + verseTotal +
      ". Total: " + correct + "/" + total + ". " + percent + "%."
  } else {
    result.textContent =
      "Verse: " + verseCorrect + "/" + verseTotal +
      ". Total: " + correct + "/" + total + ". " + percent + "%."
  }

  result.className = percent === 100 ? "result good" : "result bad"

  if (percent === 100) {
    saveScore()
  }
}

function checkCurrentMode() {
  if (currentMode === "drag") {
    checkDragMode()
    return
  }

  if (currentMode === "letters") {
    checkLettersGame()
    return
  }

  checkTypeMode()
}

function revealOneBlank() {
  const emptyTitle = titlePuzzleSlots.filter(slot => !slot.filled)
  const emptyVerse = versePuzzleSlots.filter(slot => !slot.filled)

  if (emptyTitle.length > 0) {
    const pick = emptyTitle[Math.floor(Math.random() * emptyTitle.length)]
    const item = titleBankItems.find(bankItem => bankItem.homeIndex === pick.index && bankItem.placedIn === null)
    if (item) {
      placeBankItemInSlot(titlePuzzleSlots, titleBankItems, pick.index, item.id)
    }
    selectedTitleBankWord = ""
    renderDragPuzzle()
    return
  }

  if (emptyVerse.length > 0) {
    const pick = emptyVerse[Math.floor(Math.random() * emptyVerse.length)]
    const item = verseBankItems.find(bankItem => bankItem.homeIndex === pick.index && bankItem.placedIn === null)
    if (item) {
      placeBankItemInSlot(versePuzzleSlots, verseBankItems, pick.index, item.id)
    }
    selectedVerseBankWord = ""
    renderDragPuzzle()
  }
}

function revealOneLetterBox() {
  const titleUnfinished = titleLettersGame
    ? Array.from(titleLettersGame.querySelectorAll(".letterWord")).filter(wrapper => {
      const input = wrapper.querySelector(".letterBox")
      const fullWord = wrapper.querySelector(".fullWord")
      return input && fullWord && fullWord.classList.contains("isHidden")
    })
    : []

  const verseUnfinished = verseLettersGame
    ? Array.from(verseLettersGame.querySelectorAll(".letterWord")).filter(wrapper => {
      const input = wrapper.querySelector(".letterBox")
      const fullWord = wrapper.querySelector(".fullWord")
      return input && fullWord && fullWord.classList.contains("isHidden")
    })
    : []

  if (titleUnfinished.length > 0) {
    const pick = titleUnfinished[Math.floor(Math.random() * titleUnfinished.length)]
    const input = pick.querySelector(".letterBox")
    const fullWord = pick.querySelector(".fullWord")

    input.classList.add("isHidden")
    fullWord.classList.remove("isHidden")
    input.classList.remove("wrong")
    moveToNextLetterBox()
    return
  }

  if (verseUnfinished.length > 0) {
    const pick = verseUnfinished[Math.floor(Math.random() * verseUnfinished.length)]
    const input = pick.querySelector(".letterBox")
    const fullWord = pick.querySelector(".fullWord")

    input.classList.add("isHidden")
    fullWord.classList.remove("isHidden")
    input.classList.remove("wrong")
    moveToNextLetterBox()
  }
}

function giveHint() {
  if (currentMode === "drag") {
    revealOneBlank()
    return
  }

  if (currentMode === "letters") {
    revealOneLetterBox()
    return
  }

  revealOneWord()
}

function resetCurrentGame() {
  if (currentMode === "drag") {
    buildDragPuzzle()
    result.textContent = ""
    result.className = "result"
    return
  }

  if (currentMode === "letters") {
    renderLettersGame()
    result.textContent = ""
    result.className = "result"
    return
  }

  resetTypeMode()
}

function updatePracticeUI() {
  const isDrag = currentMode === "drag"
  const isLetters = currentMode === "letters"

  verseText.classList.toggle("isHidden", isDrag || isLetters)
  dragGame.classList.toggle("isHidden", !isDrag)
  lettersGame.classList.toggle("isHidden", !isLetters)

  btnHideAll.classList.toggle("isHidden", isDrag || isLetters)
  answerRow.classList.toggle("isHidden", isDrag || isLetters)

  if (titleAnswerRow) {
    titleAnswerRow.classList.toggle("isHidden", isDrag || isLetters || titleWords.length === 0)
  }
}

function applyModeUI() {
  updatePracticeUI()
  btnHideAll.textContent = "Hide All"
  result.textContent = ""
  result.className = "result"

  if (currentMode === "type") {
    resetTypeMode()
    return
  }

  if (currentMode === "drag") {
    setTypingEnabled(false)
    buildDragPuzzle()
    return
  }

  if (currentMode === "letters") {
    setTypingEnabled(false)
    renderLettersGame()
  }
}

function showPage(name) {
  pageImportCsv.classList.add("isHidden")
  pagePractice.classList.add("isHidden")
  pageLibrary.classList.add("isHidden")
  pageAddCollection.classList.add("isHidden")
  pageAddGroup.classList.add("isHidden")
  pageGame.classList.add("isHidden")
  pageSettings.classList.add("isHidden")

  tabLibrary.classList.remove("active")
  tabSettings.classList.remove("active")

  if (name === "practice") {
    pagePractice.classList.remove("isHidden")
    refreshVerses()
    setPracticeEnabled(verses.length > 0)
    return
  }

  if (name === "library") {
    pageLibrary.classList.remove("isHidden")
    tabLibrary.classList.add("active")
    renderLibrary()

    setTimeout(() => {
      window.scrollTo(0, libraryScrollY)
    }, 0)

    return
  }

  if (name === "addCollection") {
    pageAddCollection.classList.remove("isHidden")
    newCollectionName.value = ""
    collectionMsg.textContent = ""
    newCollectionName.focus()
    return
  }

  if (name === "addGroup") {
    pageAddGroup.classList.remove("isHidden")
    newGroupName.value = ""
    groupMsg.textContent = ""
    newGroupName.focus()
    return
  }

  if (name === "importCsv") {
    pageImportCsv.classList.remove("isHidden")
    renderImportCollectionOptions()
    renderImportGroupOptions(importCollectionSelect.value || "None")
    importCsvMsg.textContent = ""
    csvFileInput.value = ""
    return
  }

  if (name === "game") {
    pageGame.classList.remove("isHidden")
    return
  }

  if (name === "settings") {
    pageSettings.classList.remove("isHidden")
    tabSettings.classList.add("active")
  }
}

function openGamePicker(verseId) {
  refreshVerses()
  const verse = verses.find(v => v.id === verseId)
  if (!verse) return

  selectedVerseId = verseId
  gameTitle.textContent = "Choose a game"
  gameRef.textContent = verse.version ? verse.ref + " (" + verse.version + ")" : verse.ref
  gameVerse.textContent = verse.text

  if (gameMemoryTitle) {
    gameMemoryTitle.textContent = verse.title ? verse.title : ""
    gameMemoryTitle.classList.toggle("isHidden", !verse.title)
  }

  showPage("game")
}

function startSelectedGame(mode) {
  currentMode = mode
  loadVerse(selectedVerseId)
  applyModeUI()
  showPage("practice")
}

function renderCollectionFilters() {
  if (!collectionFilters) return

  collectionFilters.innerHTML = ""

  const collectionNames = ["None", ...collections.map(c => c.name).filter(n => n !== "None")]
  const frag = document.createDocumentFragment()

  collectionNames.forEach(name => {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = name === selectedCollectionFilter ? "tab active" : "tab"
    btn.textContent = name
    btn.dataset.collection = name
    btn.style.touchAction = "manipulation"
    btn.style.userSelect = "none"

    frag.appendChild(btn)
  })

  collectionFilters.appendChild(frag)
}

function renderGroupFilters() {
  if (!groupFilters) return

  groupFilters.innerHTML = ""

  if (!selectedCollectionFilter || selectedCollectionFilter === "None") return

  const availableGroups = groups.filter(g => g.collection === selectedCollectionFilter)

  availableGroups.forEach(item => {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = selectedGroupFilter === item.name ? "tab active" : "tab"
    btn.textContent = item.name
    btn.dataset.group = item.name

    groupFilters.appendChild(btn)
  })
}

function renderLibrary() {
  if (window._libraryRenderPending) return

  window._libraryRenderPending = true

  requestAnimationFrame(() => {
    window._libraryRenderPending = false

    try {
      _renderLibraryNow()
    } catch (e) {
      console.error("renderLibrary error:", e)
    }
  })
}

function _renderLibraryNow() {
  if (!libraryGrid) return

  renderCollectionFilters()
  renderGroupFilters()

  libraryGrid.innerHTML = ""

  let filteredVerses = verses.slice()

  if (selectedCollectionFilter) {
    filteredVerses = filteredVerses.filter(
      verse => (verse.collection || "None") === selectedCollectionFilter
    )
  }

  if (selectedGroupFilter) {
    filteredVerses = filteredVerses.filter(
      verse => verse.group === selectedGroupFilter
    )
  }

  if (selectedSortMode === "titleAsc") {
    filteredVerses.sort((a, b) => (a.title || a.ref).localeCompare(b.title || b.ref))
  } else if (selectedSortMode === "titleDesc") {
    filteredVerses.sort((a, b) => (b.title || b.ref).localeCompare(a.title || a.ref))
  } else if (selectedSortMode === "bibleAsc") {
    filteredVerses.sort((a, b) => getBibleBookIndex(a.ref) - getBibleBookIndex(b.ref))
  } else if (selectedSortMode === "bibleDesc") {
    filteredVerses.sort((a, b) => getBibleBookIndex(b.ref) - getBibleBookIndex(a.ref))
  } else if (selectedSortMode === "custom") {
    filteredVerses.sort((a, b) => (a.order || 0) - (b.order || 0))
  }

  filteredVerses = filteredVerses.slice(0, 100)

  if (filteredVerses.length === 0) {
    libraryGrid.innerHTML = `<div class="result">No verses found.</div>`
    return
  }

  filteredVerses.forEach((verse) => {
    const row = document.createElement("div")
    row.className = "customItem"
    row.dataset.id = verse.id

    if (selectedSortMode === "custom") {
      row.draggable = true

      row.addEventListener("dragstart", (e) => {
        draggedVerseId = verse.id
        row.classList.add("dragging")
        e.dataTransfer.effectAllowed = "move"
      })

      row.addEventListener("dragend", () => {
        row.classList.remove("dragging")
        draggedVerseId = null
      })

      row.addEventListener("dragover", (e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = "move"
      })

      row.addEventListener("drop", async (e) => {
        e.preventDefault()
        if (!draggedVerseId || draggedVerseId === verse.id) return

        const fromIndex = verses.findIndex(v => v.id === draggedVerseId)
        const toIndex = verses.findIndex(v => v.id === verse.id)

        if (fromIndex !== -1 && toIndex !== -1) {
          const [movedVerse] = verses.splice(fromIndex, 1)
          verses.splice(toIndex, 0, movedVerse)

          verses.forEach((v, idx) => { v.order = idx })

          renderLibrary()
          await saveVersesOrderToCloud()
        }
      })
    }

    const meta = document.createElement("div")
    meta.className = "meta"

    const title = document.createElement("div")

    if (selectedSortMode === "custom") {
      const handle = document.createElement("span")
      handle.className = "dragHandle"
      handle.textContent = "☰ "
      title.appendChild(handle)
    }

    const titleText = document.createTextNode(verse.title || verse.ref || "Untitled")
    title.appendChild(titleText)

    const small = document.createElement("small")
    small.textContent =
      (verse.ref || "") +
      (verse.version ? " (" + verse.version + ")" : "") +
      (verse.group ? " • " + verse.group : "")

    meta.appendChild(title)
    meta.appendChild(small)

    const actions = document.createElement("div")
    actions.className = "controls"

    const playBtn = document.createElement("button")
    playBtn.type = "button"
    playBtn.textContent = "Play 📖"
    playBtn.addEventListener("click", () => {
      openGamePicker(verse.id)
    })

    const moveBtn = document.createElement("button")
    moveBtn.type = "button"
    moveBtn.textContent = "Move 📁"
    moveBtn.addEventListener("click", () => {
      openMoveVerseModal(verse)
    })

    const deleteBtn = document.createElement("button")
    deleteBtn.type = "button"
    deleteBtn.className = "danger"
    deleteBtn.textContent = "Delete 🗑️"
    deleteBtn.addEventListener("click", () => {
      confirmDelete(verse.id, row)
    })

    actions.appendChild(playBtn)
    actions.appendChild(moveBtn)
    actions.appendChild(deleteBtn)

    row.appendChild(meta)
    row.appendChild(actions)

    libraryGrid.appendChild(row)
  })
}

async function saveVersesOrderToCloud() {
  if (!currentUser) return
  try {
    const batch = writeBatch(db)
    verses.forEach((v, idx) => {
      const verseRef = doc(db, "users", currentUser.uid, "verses", v.id)
      batch.update(verseRef, { order: idx })
    })
    await batch.commit()
  } catch (err) {
    console.error("Failed to save reordered verses:", err)
  }
}

function confirmDelete(id, row) {
  row.innerHTML = ""

  const meta = document.createElement("div")
  meta.className = "meta"

  const title = document.createElement("div")
  title.textContent = "Delete this verse?"

  const small = document.createElement("small")
  small.textContent = "This removes it from your cloud only."

  meta.appendChild(title)
  meta.appendChild(small)

  const yes = document.createElement("button")
  yes.type = "button"
  yes.className = "danger"
  yes.textContent = "Delete"
  yes.addEventListener("click", (event) => {
    event.stopPropagation()
    deleteCustomVerse(id)
  })

  const no = document.createElement("button")
  no.type = "button"
  no.className = "ghost"
  no.textContent = "Cancel"
  no.addEventListener("click", (event) => {
    event.stopPropagation()
    showPage("library")
  })

  const actions = document.createElement("div")
  actions.className = "controls"
  actions.appendChild(yes)
  actions.appendChild(no)

  row.appendChild(meta)
  row.appendChild(actions)
}

async function saveNewVerse() {
  const collectionValue = collectionSelect.value.trim() || "None"
  const groupValue = groupSelect.value.trim()
  const title = newTitle.value.trim()
  const ref = newRef.value.trim()
  const version = newVersion.value.trim()
  const text = newText.value.trim()

  if (!currentUser) {
    manageMsg.textContent = "Please log in first."
    return
  }

  if (!ref || !text) {
    manageMsg.textContent = "Please fill in reference and verse text."
    return
  }

  try {
    const versesRef = collection(db, "users", currentUser.uid, "verses")

    await addDoc(versesRef, {
      title,
      ref,
      version,
      text,
      collection: collectionValue,
      group: groupValue,
      order: verses.length,
      createdAt: serverTimestamp()
    })

    manageMsg.textContent = "Saved."
    pasteBox.value = ""
    newTitle.value = ""
    newRef.value = ""
    newVersion.value = ""
    newText.value = ""
    collectionSelect.value = ""
    groupSelect.value = ""
    updateGroupState()
    pasteBox.focus()

    await loadVersesFromCloud()
  } catch (error) {
    console.error("Save verse failed:", error)
    manageMsg.textContent = "Failed to save verse."
  }
}

function clearVerseForm() {
  const hasContent =
    pasteBox.value.trim() ||
    newTitle.value.trim() ||
    newRef.value.trim() ||
    newVersion.value.trim() ||
    newText.value.trim()

  if (!hasContent) {
    manageMsg.textContent = "Nothing to clear."
    pasteBox.focus()
    return
  }

  const confirmed = window.confirm("Clear all verse fields?")
  if (!confirmed) return

  pasteBox.value = ""
  newTitle.value = ""
  newRef.value = ""
  newVersion.value = ""
  newText.value = ""
  collectionSelect.value = ""
  groupSelect.value = ""
  updateGroupState()
  manageMsg.textContent = "Cleared."
  pasteBox.focus()
}

async function deleteCustomVerse(id) {
  if (!currentUser) {
    manageMsg.textContent = "Please log in first."
    return
  }

  try {
    await deleteDoc(doc(db, "users", currentUser.uid, "verses", id))
    await loadVersesFromCloud()

    if (verses.length === 0) {
      setPracticeEnabled(false)
      practiceVerseTitle.textContent = "No verses yet"
      verseText.textContent = "Go to Library to add one."
      setTypingEnabled(false)
    }

    manageMsg.textContent = "Deleted."
    showPage("library")
  } catch (error) {
    console.error("Delete verse failed:", error)
    manageMsg.textContent = "Failed to delete verse."
  }
}

function autoFillFromPastedText() {
  const raw = (pasteBox.value || "").trim()

  if (!raw) {
    manageMsg.textContent = "Please paste the Bible text first."
    return
  }

  const cleanInvisibleChars = (text) => {
    return String(text || "")
      .replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, "")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .replace(/\s+/g, " ")
      .trim()
  }

  const lines = raw
    .split(/\r?\n/)
    .map(line => cleanInvisibleChars(line))
    .filter(line => line !== "")

  if (lines.length === 0) {
    manageMsg.textContent = "Nothing to parse."
    return
  }

  const urlPattern = /^https?:\/\/\S+$/i
  const urlLine = lines.find(line => urlPattern.test(line)) || ""
  const contentLines = lines.filter(line => !urlPattern.test(line))

  let version = ""

  if (urlLine) {
    const urlVersionMatch = urlLine.match(/\.([A-Z0-9]{2,8})$/i)
    if (urlVersionMatch) {
      version = urlVersionMatch[1].toUpperCase()
    }
  }

  let referenceLine = ""
  let verseParts = []

  const referencePattern = /^((?:[1-3]\s*)?[A-Za-z]+(?:\s+[A-Za-z]+)*\s+\d+:\d+(?:-\d+)?)(?:\s+([A-Z]{2,8}))?$/i

  contentLines.forEach(line => {
    const fullReferenceMatch = line.match(referencePattern)

    if (fullReferenceMatch && !referenceLine) {
      referenceLine = fullReferenceMatch[1].trim()

      if (fullReferenceMatch[2]) {
        version = fullReferenceMatch[2].toUpperCase()
      }

      return
    }

    verseParts.push(line)
  })

  let combinedText = verseParts.join(" ").replace(/\s+/g, " ").trim()

  if (!referenceLine) {
    const inlineReferencePattern = /((?:[1-3]\s*)?[A-Za-z]+(?:\s+[A-Za-z]+)*\s+\d+:\d+(?:-\d+)?)(?:\s+([A-Z]{2,8}))?/i
    const inlineMatch = combinedText.match(inlineReferencePattern)

    if (inlineMatch) {
      referenceLine = inlineMatch[1].trim()

      if (inlineMatch[2]) {
        version = inlineMatch[2].toUpperCase()
      }

      combinedText = combinedText.replace(inlineMatch[0], "").trim()
    }
  }

  combinedText = combinedText
    .replace(/^\[\d+\]\s*/, "")
    .replace(/^\s*['"]+/, "")
    .replace(/['"]+\s*$/, "")
    .replace(/\[\d+\]/g, "")
    .replace(/\s+/g, " ")
    .trim()

  newRef.value = referenceLine
  newVersion.value = version
  newText.value = combinedText

  if (referenceLine || combinedText) {
    manageMsg.textContent = "Auto filled."
  } else {
    manageMsg.textContent = "Could not detect verse text and reference."
  }
}

if (difficultyEasy) {
  difficultyEasy.addEventListener("click", () => {
    tapDifficulty = "easy"
    if (currentMode === "drag") {
      buildDragPuzzle()
      result.textContent = ""
      result.className = "result"
    } else {
      updateDifficultyButtons()
    }
  })
}

if (difficultyMedium) {
  difficultyMedium.addEventListener("click", () => {
    tapDifficulty = "medium"
    if (currentMode === "drag") {
      buildDragPuzzle()
      result.textContent = ""
      result.className = "result"
    } else {
      updateDifficultyButtons()
    }
  })
}

if (difficultyHard) {
  difficultyHard.addEventListener("click", () => {
    tapDifficulty = "hard"
    if (currentMode === "drag") {
      buildDragPuzzle()
      result.textContent = ""
      result.className = "result"
    } else {
      updateDifficultyButtons()
    }
  })
}

function renderCollectionOptions(selectedValue = "") {
  if (!collectionSelect) return

  collectionSelect.innerHTML = `
    <option value="">Select collection</option>
    ${collections.map(item => `<option value="${item.name}">${item.name}</option>`).join("")}
    <option value="__add_new__">+ Add new collection</option>
  `

  collectionSelect.value = selectedValue && collections.some(item => item.name === selectedValue)
    ? selectedValue
    : ""
}

function renderGroupOptions(selectedValue = "") {
  if (!groupSelect) return

  const selectedCollection = collectionSelect.value || "None"
  let filteredGroups = groups.filter(item => item.collection === selectedCollection)

  groupSelect.innerHTML = `
    <option value="">Select group</option>
    ${filteredGroups.map(item => `<option value="${item.name}">${item.name}</option>`).join("")}
    <option value="__add_new__">+ Add new group</option>
  `

  groupSelect.value = selectedValue && filteredGroups.some(item => item.name === selectedValue)
    ? selectedValue
    : ""
}

async function loadCollectionsFromCloud() {
  if (!currentUser) {
    collections = []
    renderCollectionOptions()
    return
  }

  try {
    const snap = await getDocs(collection(db, "users", currentUser.uid, "collections"))
    collections = []

    snap.forEach(docSnap => {
      const data = docSnap.data()
      collections.push({
        id: docSnap.id,
        name: data.name || docSnap.id
      })
    })

    collections.sort((a, b) => a.name.localeCompare(b.name))
    renderCollectionOptions()
  } catch (error) {
    console.error("Load collections failed:", error)
  }
}

async function loadGroupsFromCloud() {
  if (!currentUser) {
    groups = []
    renderGroupOptions()
    return
  }

  try {
    const snap = await getDocs(collection(db, "users", currentUser.uid, "groups"))
    groups = []

    snap.forEach(docSnap => {
      const data = docSnap.data()
      groups.push({
        id: docSnap.id,
        name: data.name || "",
        collection: data.collection || "None"
      })
    })

    groups.sort((a, b) => a.name.localeCompare(b.name))
    renderGroupOptions()
  } catch (error) {
    console.error("Load groups failed:", error)
  }
}

async function saveCollection() {
  const name = (newCollectionName.value || "").trim()

  if (!currentUser) {
    collectionMsg.textContent = "Please log in first."
    return
  }

  if (!name) {
    collectionMsg.textContent = "Please enter a collection name."
    return
  }

  try {
    await setDoc(doc(db, "users", currentUser.uid, "collections", name), {
      name,
      createdAt: serverTimestamp()
    })

    await loadCollectionsFromCloud()
    renderCollectionOptions(name)
    collectionMsg.textContent = "Saved."
    showPage("library")
  } catch (error) {
    console.error("Save collection failed:", error)
    collectionMsg.textContent = "Failed to save collection."
  }
}

async function saveGroup() {
  const name = (newGroupName.value || "").trim()
  const parentCollection = collectionSelect.value.trim()

  if (!currentUser) {
    groupMsg.textContent = "Please log in first."
    return
  }

  if (!parentCollection || parentCollection === "__add_new__") {
    groupMsg.textContent = "Please select a collection first."
    return
  }

  if (!name) {
    groupMsg.textContent = "Please enter a group name."
    return
  }

  try {
    const docId = parentCollection + "__" + name

    await setDoc(doc(db, "users", currentUser.uid, "groups", docId), {
      name,
      collection: parentCollection,
      createdAt: serverTimestamp()
    })

    await loadGroupsFromCloud()
    groupSelect.value = name
    groupMsg.textContent = "Saved."
    showPage("library")
  } catch (error) {
    console.error("Save group failed:", error)
    groupMsg.textContent = "Failed to save group."
  }
}

collectionSelect.addEventListener("change", () => {
  if (collectionSelect.value === "__add_new__") {
    collectionSelect.value = ""
    showPage("addCollection")
    return
  }

  groupSelect.value = ""
  updateGroupState()
})

groupSelect.addEventListener("change", () => {
  if (groupSelect.value === "__add_new__") {
    if (!collectionSelect.value) {
      manageMsg.textContent = "Please select a collection first."
      groupSelect.value = ""
      return
    }

    groupSelect.value = ""
    showPage("addGroup")
  }
})

function updateGroupState() {
  const hasCollection = !!collectionSelect.value && collectionSelect.value !== "__add_new__"
  groupSelect.disabled = !hasCollection

  if (!hasCollection) {
    groupSelect.innerHTML = `
      <option value="">Select collection first</option>
    `
  } else {
    renderGroupOptions()
  }
}

function hideAllModals() {
  modalOverlay.classList.add("isHidden")
  renameCollectionModal.classList.add("isHidden")
  renameGroupModal.classList.add("isHidden")
  deleteCollectionModal.classList.add("isHidden")
  deleteGroupModal.classList.add("isHidden")
  moveVerseModal.classList.add("isHidden")
}

function showModal(modal) {
  hideAllModals()
  modalOverlay.classList.remove("isHidden")
  modal.classList.remove("isHidden")
}

function openRenameCollectionModal() {
  if (!selectedCollectionFilter || selectedCollectionFilter === "None") {
    manageMsg.textContent = "Please select a collection first."
    return
  }

  renameCollectionInput.value = selectedCollectionFilter
  showModal(renameCollectionModal)
  renameCollectionInput.focus()
}

function openRenameGroupModal() {
  if (!selectedCollectionFilter || selectedCollectionFilter === "None") {
    manageMsg.textContent = "Please select a collection first."
    return
  }

  if (!selectedGroupFilter) {
    manageMsg.textContent = "Please select a group first."
    return
  }

  renameGroupInput.value = selectedGroupFilter
  showModal(renameGroupModal)
  renameGroupInput.focus()
}

function openDeleteCollectionModal() {
  if (!selectedCollectionFilter || selectedCollectionFilter === "None") {
    manageMsg.textContent = "Please select a collection first."
    return
  }

  showModal(deleteCollectionModal)
}

function openDeleteGroupModal() {
  if (!selectedCollectionFilter || selectedCollectionFilter === "None") {
    manageMsg.textContent = "Please select a collection first."
    return
  }

  if (!selectedGroupFilter) {
    manageMsg.textContent = "Please select a group first."
    return
  }

  showModal(deleteGroupModal)
}

async function renameCollection() {
  const oldName = selectedCollectionFilter
  const newName = (renameCollectionInput.value || "").trim()

  if (!currentUser) {
    manageMsg.textContent = "Please log in first."
    return
  }

  if (!oldName || oldName === "None") {
    manageMsg.textContent = "Please select a collection first."
    return
  }

  if (!newName) {
    manageMsg.textContent = "Please enter a new collection name."
    return
  }

  if (newName === oldName) {
    hideAllModals()
    return
  }

  try {
    const batch = writeBatch(db)

    const oldCollectionRef = doc(db, "users", currentUser.uid, "collections", oldName)
    const newCollectionRef = doc(db, "users", currentUser.uid, "collections", newName)

    batch.set(newCollectionRef, {
      name: newName,
      createdAt: serverTimestamp()
    })
    batch.delete(oldCollectionRef)

    const groupsSnap = await getDocs(query(
      collection(db, "users", currentUser.uid, "groups"),
      where("collection", "==", oldName)
    ))

    groupsSnap.forEach(docSnap => {
      const data = docSnap.data()
      const newDocId = newName + "__" + data.name

      batch.set(doc(db, "users", currentUser.uid, "groups", newDocId), {
        name: data.name,
        collection: newName,
        createdAt: data.createdAt || serverTimestamp()
      })

      batch.delete(doc(db, "users", currentUser.uid, "groups", docSnap.id))
    })

    const versesSnap = await getDocs(query(
      collection(db, "users", currentUser.uid, "verses"),
      where("collection", "==", oldName)
    ))

    versesSnap.forEach(docSnap => {
      batch.update(doc(db, "users", currentUser.uid, "verses", docSnap.id), {
        collection: newName
      })
    })

    await batch.commit()

    selectedCollectionFilter = newName
    selectedGroupFilter = ""

    await loadCollectionsFromCloud()
    await loadGroupsFromCloud()
    updateGroupState()
    await loadVersesFromCloud()

    hideAllModals()
    manageMsg.textContent = "Collection renamed."
  } catch (error) {
    console.error("Rename collection failed:", error)
    manageMsg.textContent = "Failed to rename collection."
  }
}

async function renameGroup() {
  const collectionName = selectedCollectionFilter
  const oldName = selectedGroupFilter
  const newName = (renameGroupInput.value || "").trim()

  if (!currentUser) {
    manageMsg.textContent = "Please log in first."
    return
  }

  if (!collectionName || collectionName === "None") {
    manageMsg.textContent = "Please select a collection first."
    return
  }

  if (!oldName) {
    manageMsg.textContent = "Please select a group first."
    return
  }

  if (!newName) {
    manageMsg.textContent = "Please enter a new group name."
    return
  }

  if (newName === oldName) {
    hideAllModals()
    return
  }

  try {
    const batch = writeBatch(db)

    const oldDocId = collectionName + "__" + oldName
    const newDocId = collectionName + "__" + newName

    batch.set(doc(db, "users", currentUser.uid, "groups", newDocId), {
      name: newName,
      collection: collectionName,
      createdAt: serverTimestamp()
    })

    batch.delete(doc(db, "users", currentUser.uid, "groups", oldDocId))

    const versesSnap = await getDocs(query(
      collection(db, "users", currentUser.uid, "verses"),
      where("collection", "==", collectionName),
      where("group", "==", oldName)
    ))

    versesSnap.forEach(docSnap => {
      batch.update(doc(db, "users", currentUser.uid, "verses", docSnap.id), {
        group: newName
      })
    })

    await batch.commit()

    selectedGroupFilter = newName

    await loadGroupsFromCloud()
    await loadVersesFromCloud()

    hideAllModals()
    manageMsg.textContent = "Group renamed."
  } catch (error) {
    console.error("Rename group failed:", error)
    manageMsg.textContent = "Failed to rename group."
  }
}

async function deleteSelectedCollection() {
  const collectionName = selectedCollectionFilter

  if (!currentUser) {
    manageMsg.textContent = "Please log in first."
    return
  }

  if (!collectionName || collectionName === "None") {
    manageMsg.textContent = "Please select a collection first."
    return
  }

  try {
    const batch = writeBatch(db)

    batch.delete(doc(db, "users", currentUser.uid, "collections", collectionName))

    const groupsSnap = await getDocs(query(
      collection(db, "users", currentUser.uid, "groups"),
      where("collection", "==", collectionName)
    ))

    groupsSnap.forEach(docSnap => {
      batch.delete(doc(db, "users", currentUser.uid, "groups", docSnap.id))
    })

    const versesSnap = await getDocs(query(
      collection(db, "users", currentUser.uid, "verses"),
      where("collection", "==", collectionName)
    ))

    versesSnap.forEach(docSnap => {
      batch.update(doc(db, "users", currentUser.uid, "verses", docSnap.id), {
        collection: "None",
        group: ""
      })
    })

    await batch.commit()

    selectedCollectionFilter = "None"
    selectedGroupFilter = ""

    await loadCollectionsFromCloud()
    await loadGroupsFromCloud()
    updateGroupState()
    await loadVersesFromCloud()

    hideAllModals()
    manageMsg.textContent = "Collection deleted."
  } catch (error) {
    console.error("Delete collection failed:", error)
    manageMsg.textContent = "Failed to delete collection."
  }
}

async function deleteSelectedGroup() {
  const collectionName = selectedCollectionFilter
  const groupName = selectedGroupFilter

  if (!currentUser) {
    manageMsg.textContent = "Please log in first."
    return
  }

  if (!collectionName || collectionName === "None") {
    manageMsg.textContent = "Please select a collection first."
    return
  }

  if (!groupName) {
    manageMsg.textContent = "Please select a group first."
    return
  }

  try {
    const batch = writeBatch(db)

    const docId = collectionName + "__" + groupName
    batch.delete(doc(db, "users", currentUser.uid, "groups", docId))

    const versesSnap = await getDocs(query(
      collection(db, "users", currentUser.uid, "verses"),
      where("collection", "==", collectionName),
      where("group", "==", groupName)
    ))

    versesSnap.forEach(docSnap => {
      batch.update(doc(db, "users", currentUser.uid, "verses", docSnap.id), {
        group: ""
      })
    })

    await batch.commit()

    selectedGroupFilter = ""

    await loadGroupsFromCloud()
    await loadVersesFromCloud()

    hideAllModals()
    manageMsg.textContent = "Group deleted."
  } catch (error) {
    console.error("Delete group failed:", error)
    manageMsg.textContent = "Failed to delete group."
  }
}

function renderMoveVerseCollectionOptions(selectedValue = "None") {
  if (!moveVerseCollectionSelect) return

  const collectionNames = ["None", ...collections.map(item => item.name).filter(name => name !== "None")]

  moveVerseCollectionSelect.innerHTML = collectionNames
    .map(name => `<option value="${name}">${name}</option>`)
    .join("")

  moveVerseCollectionSelect.value = collectionNames.includes(selectedValue) ? selectedValue : "None"
}

function renderMoveVerseGroupOptions(collectionName, selectedValue = "") {
  if (!moveVerseGroupSelect) return

  if (!collectionName || collectionName === "None") {
    moveVerseGroupSelect.innerHTML = `<option value="">No group</option>`
    moveVerseGroupSelect.value = ""
    return
  }

  const filteredGroups = groups.filter(item => item.collection === collectionName)

  moveVerseGroupSelect.innerHTML = `
    <option value="">No group</option>
    ${filteredGroups.map(item => `<option value="${item.name}">${item.name}</option>`).join("")}
  `

  moveVerseGroupSelect.value =
    selectedValue && filteredGroups.some(item => item.name === selectedValue)
      ? selectedValue
      : ""
}

function openMoveVerseModal(verse) {
  moveVerseId = verse.id

  const currentCollection = verse.collection || "None"
  const currentGroup = verse.group || ""

  renderMoveVerseCollectionOptions(currentCollection)
  renderMoveVerseGroupOptions(currentCollection, currentGroup)

  showModal(moveVerseModal)
}

async function saveMoveVerse() {
  if (!currentUser) {
    manageMsg.textContent = "Please log in first."
    return
  }

  if (!moveVerseId) {
    manageMsg.textContent = "No verse selected."
    return
  }

  const newCollection = moveVerseCollectionSelect.value || "None"
  const newGroup = newCollection === "None" ? "" : (moveVerseGroupSelect.value || "")

  try {
    await updateDoc(doc(db, "users", currentUser.uid, "verses", moveVerseId), {
      collection: newCollection,
      group: newGroup
    })

    moveVerseId = ""
    hideAllModals()
    await loadVersesFromCloud()
    manageMsg.textContent = "Verse moved."
  } catch (error) {
    console.error("Move verse failed:", error)
    manageMsg.textContent = "Failed to move verse."
  }
}

function renderImportCollectionOptions(selectedValue = "None") {
  if (!importCollectionSelect) return

  const collectionNames = ["None", ...collections.map(item => item.name).filter(name => name !== "None")]

  importCollectionSelect.innerHTML = collectionNames
    .map(name => `<option value="${name}">${name}</option>`)
    .join("")

  importCollectionSelect.value = collectionNames.includes(selectedValue) ? selectedValue : "None"
}

function renderImportGroupOptions(collectionName, selectedValue = "") {
  if (!importGroupSelect) return

  if (!collectionName || collectionName === "None") {
    importGroupSelect.innerHTML = `<option value="">No group</option>`
    importGroupSelect.value = ""
    importGroupSelect.disabled = true
    return
  }

  const filteredGroups = groups.filter(item => item.collection === collectionName)

  importGroupSelect.innerHTML = `
    <option value="">No group</option>
    ${filteredGroups.map(item => `<option value="${item.name}">${item.name}</option>`).join("")}
  `

  importGroupSelect.value =
    selectedValue && filteredGroups.some(item => item.name === selectedValue)
      ? selectedValue
      : ""

  importGroupSelect.disabled = false
}

function parseCsvText(csvText) {
  const rows = []
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "")

  if (lines.length < 2) return rows

  const parseLine = (line) => {
    const result = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      const next = line[i + 1]

      if (char === '"') {
        if (inQuotes && next === '"') {
          current += '"'
          i += 1
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        result.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }

    result.push(current.trim())
    return result
  }

  const headers = parseLine(lines[0]).map(h => h.toLowerCase())

  for (let i = 1; i < lines.length; i++) {
    const values = parseLine(lines[i])
    const row = {}

    headers.forEach((header, index) => {
      row[header] = values[index] || ""
    })

    rows.push(row)
  }

  return rows
}

async function importCsvFile() {
  if (!currentUser) {
    importCsvMsg.textContent = "Please log in first."
    return
  }

  const file = csvFileInput.files && csvFileInput.files[0]
  if (!file) {
    importCsvMsg.textContent = "Please choose a CSV file."
    return
  }

  const collectionValue = importCollectionSelect.value || "None"
  const groupValue = collectionValue === "None" ? "" : (importGroupSelect.value || "")

  try {
    const csvText = await file.text()
    const rows = parseCsvText(csvText)

    if (rows.length === 0) {
      importCsvMsg.textContent = "No valid CSV rows found."
      return
    }

    const batch = writeBatch(db)
    let addedCount = 0

    rows.forEach((row, idx) => {
      const ref = (row.ref || "").trim()
      const version = (row.version || "").trim()
      const text = (row.text || "").trim()
      const title = (row.title || "").trim()

      if (!ref || !text) return

      const verseRef = doc(collection(db, "users", currentUser.uid, "verses"))

      batch.set(verseRef, {
        ref,
        version,
        text,
        title,
        collection: collectionValue,
        group: groupValue,
        order: verses.length + idx,
        createdAt: serverTimestamp()
      })

      addedCount += 1
    })

    if (addedCount === 0) {
      importCsvMsg.textContent = "No rows with ref and text were found."
      return
    }

    await batch.commit()
    await loadVersesFromCloud()

    importCsvMsg.textContent = addedCount + " verse(s) imported."
    csvFileInput.value = ""
  } catch (error) {
    console.error("CSV import failed:", error)
    importCsvMsg.textContent = "Failed to import CSV."
  }
}

if (sortSelect) {
  sortSelect.addEventListener("change", (e) => {
    selectedSortMode = e.target.value
    renderLibrary()
  })
}

moveVerseCollectionSelect.addEventListener("change", () => {
  const selectedCollection = moveVerseCollectionSelect.value || "None"
  renderMoveVerseGroupOptions(selectedCollection, "")
})

btnAddCollectionInline.addEventListener("click", () => showPage("addCollection"))
btnAddGroupInline.addEventListener("click", () => {
  if (!selectedCollectionFilter || selectedCollectionFilter === "None") {
    manageMsg.textContent = "Please select a collection first."
    return
  }

  collectionSelect.value = selectedCollectionFilter
  renderGroupOptions()
  showPage("addGroup")
})

collectionFilters.addEventListener("click", event => {
  const btn = event.target.closest("button[data-collection]")
  if (!btn) return
  if (window._filterBusy) return

  const name = btn.dataset.collection
  if (!name) return
  if (selectedCollectionFilter === name) return

  window._filterBusy = true

  selectedCollectionFilter = name
  selectedGroupFilter = ""

  renderGroupFilters()
  renderLibrary()

  setTimeout(() => {
    window._filterBusy = false
  }, 200)
})

groupFilters.addEventListener("click", event => {
  const btn = event.target.closest("button[data-group]")
  if (!btn) return
  if (window._filterBusy) return

  const name = btn.dataset.group
  if (!name) return

  window._filterBusy = true

  selectedGroupFilter = selectedGroupFilter === name ? "" : name

  renderLibrary()

  setTimeout(() => {
    window._filterBusy = false
  }, 200)
})

btnRenameCollectionInline.addEventListener("click", openRenameCollectionModal)
btnRenameGroupInline.addEventListener("click", openRenameGroupModal)

btnDeleteCollectionInline.addEventListener("click", openDeleteCollectionModal)
btnDeleteGroupInline.addEventListener("click", openDeleteGroupModal)

btnSaveRenameCollection.addEventListener("click", renameCollection)
btnCancelRenameCollection.addEventListener("click", hideAllModals)

btnSaveRenameGroup.addEventListener("click", renameGroup)
btnCancelRenameGroup.addEventListener("click", hideAllModals)

btnConfirmDeleteCollection.addEventListener("click", deleteSelectedCollection)
btnCancelDeleteCollection.addEventListener("click", hideAllModals)

btnConfirmDeleteGroup.addEventListener("click", deleteSelectedGroup)
btnCancelDeleteGroup.addEventListener("click", hideAllModals)

modalOverlay.addEventListener("click", (event) => {
  if (event.target === modalOverlay) {
    hideAllModals()
  }
})

btnSaveCollection.addEventListener("click", saveCollection)
btnCancelCollection.addEventListener("click", () => showPage("library"))

btnSaveGroup.addEventListener("click", saveGroup)
btnCancelGroup.addEventListener("click", () => showPage("library"))

btnBackToGame.addEventListener("click", () => {
  openGamePicker(selectedVerseId)
})

btnHideAll.addEventListener("click", toggleHideAll)
btnReset.addEventListener("click", resetCurrentGame)
btnGiveHint.addEventListener("click", giveHint)
btnCheck.addEventListener("click", checkCurrentMode)

btnAutoFill.addEventListener("click", autoFillFromPastedText)

btnSaveVerse.addEventListener("click", saveNewVerse)
btnClearVerse.addEventListener("click", clearVerseForm)
btnBackToLibrary.addEventListener("click", () => {
  showPage("library")
  setTimeout(() => {
    window.scrollTo(0, libraryScrollY)
  }, 0)
})

btnLogin.addEventListener("click", loginWithGoogle)
btnLogout.addEventListener("click", logoutUser)

tabLibrary.addEventListener("click", () => showPage("library"))
tabSettings.addEventListener("click", () => showPage("settings"))

modeType.addEventListener("click", () => startSelectedGame("type"))
modeDrag.addEventListener("click", () => startSelectedGame("drag"))
modeLetters.addEventListener("click", () => startSelectedGame("letters"))

btnSaveMoveVerse.addEventListener("click", saveMoveVerse)
btnCancelMoveVerse.addEventListener("click", hideAllModals)

pasteBox.addEventListener("paste", () => {
  setTimeout(autoFillFromPastedText, 0)
})

themeSelect.addEventListener("change", event => {
  saveTheme(event.target.value)
})

if (btnDeleteAccount) {
  btnDeleteAccount.addEventListener("click", deleteCurrentAccount)
}

btnImportCsvPage.addEventListener("click", () => showPage("importCsv"))
btnCancelImportCsv.addEventListener("click", () => showPage("library"))
btnImportCsv.addEventListener("click", importCsvFile)

importCollectionSelect.addEventListener("change", () => {
  renderImportGroupOptions(importCollectionSelect.value || "None", "")
})

window.debugApp = {
  getVerses: () => verses,
  getCollections: () => collections,
  getGroups: () => groups,
  getUser: () => currentUser,
  getFilters: () => ({
    selectedCollectionFilter,
    selectedGroupFilter
  })
}

window.addEventListener("scroll", () => {
  if (!pageLibrary.classList.contains("isHidden")) {
    libraryScrollY = window.scrollY
  }
})

initTheme()
showPage("library")
refreshVerses()
loadStats()
loadVersesFromCloud()