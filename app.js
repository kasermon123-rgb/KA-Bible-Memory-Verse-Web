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

  if (!snap.exists()) {
    await setDoc(userRef, {
      email: user.email || "",
      name: user.displayName || "",
      createdAt: serverTimestamp(),
      welcomeEmailSent: false
    })
  }
}

const DEFAULT_VERSES = []

let refPuzzleHidden = []
let refPuzzleSlots = []
let refBankItems = []
let selectedRefBankWord = ""

let titlePuzzleHidden = []
let titlePuzzleSlots = []
let versePuzzleHidden = []
let versePuzzleSlots = []
let titleBankItems = []
let verseBankItems = []
let selectedTitleBankWord = ""
let selectedVerseBankWord = ""

let refWords = []
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
const practiceVersionLabel = document.getElementById("practiceVersionLabel")
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

const refAnswerRow = document.getElementById("refAnswerRow")
const refAnswer = document.getElementById("refAnswer")

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

const titleAnswerRow = document.getElementById("titleAnswerRow")
const titleAnswer = document.getElementById("titleAnswer")

const refDragSection = document.getElementById("refDragSection")
const refBlankLine = document.getElementById("refBlankLine")
const refWordBank = document.getElementById("refWordBank")

const titleDragSection = document.getElementById("titleDragSection")
const titleBlankLine = document.getElementById("titleBlankLine")
const titleWordBank = document.getElementById("titleWordBank")

const refLettersGame = document.getElementById("refLettersGame")
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
  try {
    await signInWithPopup(auth, provider)
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
    verses = []
    selectedVerseId = ""
    refWords = []
    titleWords = []
    verseWords = []
    collections = []
    groups = []
    renderCollectionOptions()
    updateGroupState()
    renderGroupOptions()

    if (refAnswer) refAnswer.value = ""
    if (titleAnswer) titleAnswer.value = ""
    answer.value = ""
    result.textContent = ""
    result.className = "result"

    renderLibrary()
    setPracticeEnabled(false)
    practiceVersionLabel.textContent = "No verses yet"
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
      practiceVersionLabel.textContent = "No verses yet"
      setTypingEnabled(false)
    }
  } catch (error) {
    console.error("Load verses failed:", error)
    manageMsg.textContent = "Failed to load cloud verses."
  }
}

function refreshVerses() {
  if (!Array.isArray(verses)) verses = []
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
  if (titleAnswer) titleAnswer.disabled = !enabled
  if (refAnswer) refAnswer.disabled = !enabled
}

function setPracticeEnabled(enabled) {
  btnHideAll.disabled = !enabled
  btnReset.disabled = !enabled
  btnCheck.disabled = !enabled
  btnGiveHint.disabled = !enabled

  if (!enabled) {
    answer.value = ""
    if (refAnswer) refAnswer.value = ""
    if (titleAnswer) titleAnswer.value = ""
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
  if (!currentUser) return
  if (!window.confirm("Delete your account and all your data?")) return
  if (!window.confirm("This cannot be undone. Are you sure?")) return

  try {
    if (settingsMsg) settingsMsg.textContent = "Deleting account..."
    await deleteCurrentAccountAfterReauth()
  } catch (error) {
    if (error.code === "auth/requires-recent-login") {
      try {
        await reauthenticateWithPopup(currentUser, provider)
        await deleteCurrentAccountAfterReauth()
      } catch (reauthError) {
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
  const localTheme = getSavedTheme()
  applyTheme(localTheme)
}

function saveTheme(theme) {
  localStorage.setItem("memoryTheme", theme)
  applyTheme(theme)
}

function initTheme() {
  applyTheme(getSavedTheme())
}

function loadVerse(id) {
  const verse = verses.find(v => v.id === id)
  if (!verse) return

  selectedVerseId = id

  const fullRefText = verse.version ? verse.ref + " (" + verse.version + ")" : verse.ref
  practiceVersionLabel.textContent = fullRefText

  refWords = verse.ref ? verse.ref.split(/\s+/) : []
  titleWords = verse.title ? verse.title.split(/\s+/) : []
  verseWords = verse.text.split(/\s+/)

  if (refAnswerRow) refAnswerRow.classList.toggle("isHidden", refWords.length === 0)
  if (refAnswer) refAnswer.value = ""

  if (titleAnswerRow) titleAnswerRow.classList.toggle("isHidden", titleWords.length === 0)
  if (titleAnswer) titleAnswer.value = ""

  words = [...verseWords]
  hiddenIndexes = []

  answer.value = ""
  result.textContent = ""
  result.className = "result"
}

function clearSlot(slots, bankItems, slotIndex) {
  const slot = slots.find(s => s.index === slotIndex)
  if (!slot || !slot.itemId) {
    if (slot) slot.filled = ""
    return
  }
  const item = bankItems.find(bankItem => bankItem.id === slot.itemId)
  if (item) item.placedIn = null
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

  const refHideCount = refWords.length > 0 ? Math.max(1, Math.floor(refWords.length * ratio)) : 0
  const verseHideCount = Math.max(1, Math.floor(verseWords.length * ratio))
  const titleHideCount = titleWords.length > 0 ? Math.max(1, Math.floor(titleWords.length * ratio)) : 0

  refPuzzleHidden = []
  refPuzzleSlots = []
  refBankItems = []
  selectedRefBankWord = ""

  titlePuzzleHidden = []
  titlePuzzleSlots = []
  versePuzzleHidden = []
  versePuzzleSlots = []
  titleBankItems = []
  verseBankItems = []
  selectedTitleBankWord = ""
  selectedVerseBankWord = ""

  const refIndexes = refWords.map((word, index) => index)
  while (refPuzzleHidden.length < refHideCount && refIndexes.length > 0) {
    const randomPos = Math.floor(Math.random() * refIndexes.length)
    refPuzzleHidden.push(refIndexes.splice(randomPos, 1)[0])
  }
  refPuzzleHidden.sort((a, b) => a - b)
  refPuzzleSlots = refPuzzleHidden.map(index => ({ index, expected: refWords[index], filled: "", itemId: "" }))
  refBankItems = makeBankItems(refPuzzleHidden, refWords, "ref")

  const titleIndexes = titleWords.map((word, index) => index)
  while (titlePuzzleHidden.length < titleHideCount && titleIndexes.length > 0) {
    const randomPos = Math.floor(Math.random() * titleIndexes.length)
    titlePuzzleHidden.push(titleIndexes.splice(randomPos, 1)[0])
  }
  titlePuzzleHidden.sort((a, b) => a - b)
  titlePuzzleSlots = titlePuzzleHidden.map(index => ({ index, expected: titleWords[index], filled: "", itemId: "" }))
  titleBankItems = makeBankItems(titlePuzzleHidden, titleWords, "title")

  const verseIndexes = verseWords.map((word, index) => index)
  while (versePuzzleHidden.length < verseHideCount && verseIndexes.length > 0) {
    const randomPos = Math.floor(Math.random() * verseIndexes.length)
    versePuzzleHidden.push(verseIndexes.splice(randomPos, 1)[0])
  }
  versePuzzleHidden.sort((a, b) => a - b)
  versePuzzleSlots = versePuzzleHidden.map(index => ({ index, expected: verseWords[index], filled: "", itemId: "" }))
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

function renderSegmentedWordBank(bankItems, selectedWordId, containerElem, onSelectCb) {
  containerElem.innerHTML = ""
  const availableItems = bankItems.filter(item => item.placedIn === null)
  if (availableItems.length === 0) return

  // Limit shown choices to maximum 4 random items to prevent long overwhelming lists!
  const displayItems = [...availableItems].sort(() => Math.random() - 0.5).slice(0, 4)

  displayItems.forEach(item => {
    const pill = document.createElement("span")
    pill.className = "pill"
    pill.textContent = item.text
    if (selectedWordId === item.id) pill.classList.add("active")

    pill.addEventListener("click", () => {
      onSelectCb(item.id)
      renderDragPuzzle()
    })
    containerElem.appendChild(pill)
  })
}

function renderDragPuzzle() {
  if (refBlankLine) refBlankLine.innerHTML = ""
  if (refWordBank) refWordBank.innerHTML = ""

  if (refDragSection) {
    refDragSection.classList.toggle("isHidden", refWords.length === 0)
  }

  if (refWords.length > 0 && refBlankLine && refWordBank) {
    const refHiddenSet = new Set(refPuzzleHidden)
    for (let i = 0; i < refWords.length; i++) {
      if (refHiddenSet.has(i)) {
        const blank = document.createElement("span")
        const slot = refPuzzleSlots.find(s => s.index === i)
        blank.textContent = slot && slot.filled ? slot.filled : "_____"
        blank.className = slot && slot.filled ? "blank filled" : "blank"

        blank.addEventListener("click", () => {
          const currentSlot = refPuzzleSlots.find(s => s.index === i)
          if (!currentSlot) return
          if (selectedRefBankWord) {
            placeBankItemInSlot(refPuzzleSlots, refBankItems, i, selectedRefBankWord)
            selectedRefBankWord = ""
            renderDragPuzzle()
            return
          }
          if (currentSlot.filled) {
            clearSlot(refPuzzleSlots, refBankItems, i)
            renderDragPuzzle()
          }
        })
        refBlankLine.appendChild(blank)
      } else {
        const span = document.createElement("span")
        span.textContent = refWords[i]
        refBlankLine.appendChild(span)
      }
      refBlankLine.appendChild(document.createTextNode(" "))
    }

    renderSegmentedWordBank(refBankItems, selectedRefBankWord, refWordBank, (id) => {
      selectedRefBankWord = selectedRefBankWord === id ? "" : id
    })
  }

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

    renderSegmentedWordBank(titleBankItems, selectedTitleBankWord, titleWordBank, (id) => {
      selectedTitleBankWord = selectedTitleBankWord === id ? "" : id
    })
  }

  if (blankLine) blankLine.innerHTML = ""
  if (wordBank) wordBank.innerHTML = ""

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

  renderSegmentedWordBank(verseBankItems, selectedVerseBankWord, wordBank, (id) => {
    selectedVerseBankWord = selectedVerseBankWord === id ? "" : id
  })
}

function renderLettersGame() {
  if (refLettersGame) refLettersGame.innerHTML = ""
  if (titleLettersSection) titleLettersSection.classList.toggle("isHidden", titleWords.length === 0)
  if (titleLettersGame) titleLettersGame.innerHTML = ""
  if (verseLettersGame) verseLettersGame.innerHTML = ""

  if (refWords.length > 0 && refLettersGame) {
    renderLetterSection(refWords, refLettersGame, "ref")
  }
  if (titleWords.length > 0 && titleLettersGame) {
    renderLetterSection(titleWords, titleLettersGame, "title")
  }
  if (verseLettersGame) {
    renderLetterSection(verseWords, verseLettersGame, "verse")
  }

  const firstBox =
    document.querySelector('#refLettersGame .letterBox:not(.isHidden)') ||
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
    document.querySelector('#refLettersGame .letterBox:not(.isHidden)') ||
    document.querySelector('#titleLettersGame .letterBox:not(.isHidden)') ||
    document.querySelector('#verseLettersGame .letterBox:not(.isHidden)')

  if (next) next.focus()
}

function checkTypeMode() {
  const expectedRefWords = refWords.map(word => normalize(word)).filter(Boolean)
  const expectedTitleWords = titleWords.map(word => normalize(word)).filter(Boolean)
  const expectedVerseWords = verseWords.map(word => normalize(word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ""))).filter(Boolean)

  const userRefWords = normalize(refAnswer ? refAnswer.value : "").split(" ").filter(Boolean)
  const userTitleWords = normalize(titleAnswer ? titleAnswer.value : "").split(" ").filter(Boolean)
  const userVerseWords = normalize(answer.value).split(" ").filter(Boolean)

  let correctRef = 0
  let correctTitle = 0
  let correctVerse = 0

  for (let i = 0; i < expectedRefWords.length; i++) {
    if ((userRefWords[i] || "") === expectedRefWords[i]) correctRef += 1
  }
  for (let i = 0; i < expectedTitleWords.length; i++) {
    if ((userTitleWords[i] || "") === expectedTitleWords[i]) correctTitle += 1
  }
  for (let i = 0; i < expectedVerseWords.length; i++) {
    if ((userVerseWords[i] || "") === expectedVerseWords[i]) correctVerse += 1
  }

  const total = expectedRefWords.length + expectedTitleWords.length + expectedVerseWords.length
  const correct = correctRef + correctTitle + correctVerse
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100)

  result.textContent =
    (expectedRefWords.length > 0 ? "Ref: " + correctRef + "/" + expectedRefWords.length + ". " : "") +
    (expectedTitleWords.length > 0 ? "Title: " + correctTitle + "/" + expectedTitleWords.length + ". " : "") +
    "Verse: " + correctVerse + "/" + expectedVerseWords.length +
    ". Total: " + correct + "/" + total + ". " + percent + "%."

  result.className = percent === 100 ? "result good" : "result bad"
  if (percent === 100) saveScore()
}

function checkDragMode() {
  let refCorrect = 0, refTotal = refPuzzleSlots.length
  refPuzzleSlots.forEach(slot => {
    if (normalize(slot.filled || "") === normalize(slot.expected || "")) refCorrect += 1
  })

  let titleCorrect = 0, titleTotal = titlePuzzleSlots.length
  titlePuzzleSlots.forEach(slot => {
    if (normalize(slot.filled || "") === normalize(slot.expected || "")) titleCorrect += 1
  })

  let verseCorrect = 0, verseTotal = versePuzzleSlots.length
  versePuzzleSlots.forEach(slot => {
    if (normalize(slot.filled || "") === normalize(slot.expected || "")) verseCorrect += 1
  })

  const total = refTotal + titleTotal + verseTotal
  const correct = refCorrect + titleCorrect + verseCorrect
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100)

  result.textContent =
    (refTotal > 0 ? "Ref: " + refCorrect + "/" + refTotal + ". " : "") +
    (titleTotal > 0 ? "Title: " + titleCorrect + "/" + titleTotal + ". " : "") +
    "Verse: " + verseCorrect + "/" + verseTotal +
    ". Total: " + correct + "/" + total + ". " + percent + "%."

  result.className = percent === 100 ? "result good" : "result bad"
  if (percent === 100) saveScore()
}

function checkLettersGame() {
  let refCorrect = 0, refTotal = 0
  let titleCorrect = 0, titleTotal = 0
  let verseCorrect = 0, verseTotal = 0

  if (refLettersGame) {
    refLettersGame.querySelectorAll(".letterWord").forEach(wrapper => {
      const input = wrapper.querySelector(".letterBox")
      const fullWord = wrapper.querySelector(".fullWord")
      if (!input || !fullWord) return
      refTotal += 1
      if (!fullWord.classList.contains("isHidden")) { refCorrect += 1; return; }
      const index = Number(input.dataset.index)
      const cleanWord = refWords[index].replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
      if (input.value.trim().toLowerCase() === cleanWord.charAt(0).toLowerCase()) {
        refCorrect += 1
        input.classList.add("isHidden")
        fullWord.classList.remove("isHidden")
      } else if (input.value.trim()) {
        input.classList.add("wrong")
      }
    })
  }

  if (titleLettersGame) {
    titleLettersGame.querySelectorAll(".letterWord").forEach(wrapper => {
      const input = wrapper.querySelector(".letterBox")
      const fullWord = wrapper.querySelector(".fullWord")
      if (!input || !fullWord) return
      titleTotal += 1
      if (!fullWord.classList.contains("isHidden")) { titleCorrect += 1; return; }
      const index = Number(input.dataset.index)
      const cleanWord = titleWords[index].replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
      if (input.value.trim().toLowerCase() === cleanWord.charAt(0).toLowerCase()) {
        titleCorrect += 1
        input.classList.add("isHidden")
        fullWord.classList.remove("isHidden")
      } else if (input.value.trim()) {
        input.classList.add("wrong")
      }
    })
  }

  if (verseLettersGame) {
    verseLettersGame.querySelectorAll(".letterWord").forEach(wrapper => {
      const input = wrapper.querySelector(".letterBox")
      const fullWord = wrapper.querySelector(".fullWord")
      if (!input || !fullWord) return
      verseTotal += 1
      if (!fullWord.classList.contains("isHidden")) { verseCorrect += 1; return; }
      const index = Number(input.dataset.index)
      const cleanWord = verseWords[index].replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
      if (input.value.trim().toLowerCase() === cleanWord.charAt(0).toLowerCase()) {
        verseCorrect += 1
        input.classList.add("isHidden")
        fullWord.classList.remove("isHidden")
      } else if (input.value.trim()) {
        input.classList.add("wrong")
      }
    })
  }

  const total = refTotal + titleTotal + verseTotal
  const correct = refCorrect + titleCorrect + verseCorrect
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100)

  result.textContent =
    (refTotal > 0 ? "Ref: " + refCorrect + "/" + refTotal + ". " : "") +
    (titleTotal > 0 ? "Title: " + titleCorrect + "/" + titleTotal + ". " : "") +
    "Verse: " + verseCorrect + "/" + verseTotal +
    ". Total: " + correct + "/" + total + ". " + percent + "%."

  result.className = percent === 100 ? "result good" : "result bad"
  if (percent === 100) saveScore()
}

function checkCurrentMode() {
  if (currentMode === "drag") { checkDragMode(); return; }
  if (currentMode === "letters") { checkLettersGame(); return; }
  checkTypeMode()
}

function giveHint() {
  if (currentMode === "drag") {
    const emptyRef = refPuzzleSlots.filter(s => !s.filled)
    const emptyTitle = titlePuzzleSlots.filter(s => !s.filled)
    const emptyVerse = versePuzzleSlots.filter(s => !s.filled)

    if (emptyRef.length > 0) {
      const pick = emptyRef[Math.floor(Math.random() * emptyRef.length)]
      const item = refBankItems.find(i => i.homeIndex === pick.index && i.placedIn === null)
      if (item) placeBankItemInSlot(refPuzzleSlots, refBankItems, pick.index, item.id)
    } else if (emptyTitle.length > 0) {
      const pick = emptyTitle[Math.floor(Math.random() * emptyTitle.length)]
      const item = titleBankItems.find(i => i.homeIndex === pick.index && i.placedIn === null)
      if (item) placeBankItemInSlot(titlePuzzleSlots, titleBankItems, pick.index, item.id)
    } else if (emptyVerse.length > 0) {
      const pick = emptyVerse[Math.floor(Math.random() * emptyVerse.length)]
      const item = verseBankItems.find(i => i.homeIndex === pick.index && i.placedIn === null)
      if (item) placeBankItemInSlot(versePuzzleSlots, verseBankItems, pick.index, item.id)
    }
    renderDragPuzzle()
    return
  }
  if (currentMode === "letters") {
    const nextUnfinished =
      document.querySelector('#refLettersGame .letterWord .fullWord.isHidden') ||
      document.querySelector('#titleLettersGame .letterWord .fullWord.isHidden') ||
      document.querySelector('#verseLettersGame .letterWord .fullWord.isHidden')
    if (nextUnfinished) {
      const wrapper = nextUnfinished.closest(".letterWord")
      wrapper.querySelector(".letterBox").classList.add("isHidden")
      wrapper.querySelector(".fullWord").classList.remove("isHidden")
      moveToNextLetterBox()
    }
    return
  }
  revealOneWord()
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
  if (refAnswer) refAnswer.value = ""
  if (titleAnswer) titleAnswer.value = ""
  answer.value = ""
  result.textContent = ""
  result.className = "result"
  if (refAnswerRow && !refAnswerRow.classList.contains("isHidden")) refAnswer.focus()
  else answer.focus()
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

  if (refAnswerRow) refAnswerRow.classList.toggle("isHidden", isDrag || isLetters || refWords.length === 0)
  if (titleAnswerRow) titleAnswerRow.classList.toggle("isHidden", isDrag || isLetters || titleWords.length === 0)
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
    setTimeout(() => { window.scrollTo(0, libraryScrollY) }, 0)
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
    filteredVerses = filteredVerses.filter(v => (v.collection || "None") === selectedCollectionFilter)
  }
  if (selectedGroupFilter) {
    filteredVerses = filteredVerses.filter(v => v.group === selectedGroupFilter)
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

    title.appendChild(document.createTextNode(verse.title || verse.ref || "Untitled"))

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
    playBtn.addEventListener("click", () => openGamePicker(verse.id))

    const moveBtn = document.createElement("button")
    moveBtn.type = "button"
    moveBtn.textContent = "Move 📁"
    moveBtn.addEventListener("click", () => openMoveVerseModal(verse))

    const deleteBtn = document.createElement("button")
    deleteBtn.type = "button"
    deleteBtn.className = "danger"
    deleteBtn.textContent = "Delete 🗑️"
    deleteBtn.addEventListener("click", () => confirmDelete(verse.id, row))

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
  meta.appendChild(document.createElement("div")).textContent = "Delete this verse?"

  const yes = document.createElement("button")
  yes.type = "button"
  yes.className = "danger"
  yes.textContent = "Delete"
  yes.addEventListener("click", (e) => { e.stopPropagation(); deleteCustomVerse(id); })

  const no = document.createElement("button")
  no.type = "button"
  no.className = "ghost"
  no.textContent = "Cancel"
  no.addEventListener("click", (e) => { e.stopPropagation(); showPage("library"); })

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

  if (!currentUser) { manageMsg.textContent = "Please log in first."; return; }
  if (!ref || !text) { manageMsg.textContent = "Please fill in reference and verse text."; return; }

  try {
    const versesRef = collection(db, "users", currentUser.uid, "verses")
    await addDoc(versesRef, {
      title, ref, version, text,
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
    await loadVersesFromCloud()
  } catch (error) {
    manageMsg.textContent = "Failed to save verse."
  }
}

function clearVerseForm() {
  pasteBox.value = ""
  newTitle.value = ""
  newRef.value = ""
  newVersion.value = ""
  newText.value = ""
  collectionSelect.value = ""
  groupSelect.value = ""
  updateGroupState()
  manageMsg.textContent = "Cleared."
}

async function deleteCustomVerse(id) {
  if (!currentUser) return
  try {
    await deleteDoc(doc(db, "users", currentUser.uid, "verses", id))
    await loadVersesFromCloud()
    if (verses.length === 0) {
      setPracticeEnabled(false)
      practiceVersionLabel.textContent = "No verses yet"
      setTypingEnabled(false)
    }
    showPage("library")
  } catch (error) {
    manageMsg.textContent = "Failed to delete verse."
  }
}

function autoFillFromPastedText() {
  const raw = (pasteBox.value || "").trim()
  if (!raw) return

  const cleanInvisibleChars = text => String(text || "").replace(/[\u200E\u200F\u202A-\u202E]/g, "").trim()
  const lines = raw.split(/\r?\n/).map(l => cleanInvisibleChars(l)).filter(Boolean)
  if (lines.length === 0) return

  const urlPattern = /^https?:\/\/\S+$/i
  const urlLine = lines.find(l => urlPattern.test(l)) || ""
  const contentLines = lines.filter(l => !urlPattern.test(l))

  let version = ""
  if (urlLine) {
    const match = urlLine.match(/\.([A-Z0-9]{2,8})$/i)
    if (match) version = match[1].toUpperCase()
  }

  let referenceLine = ""
  let verseParts = []
  const referencePattern = /^((?:[1-3]\s*)?[A-Za-z]+(?:\s+[A-Za-z]+)*\s+\d+:\d+(?:-\d+)?)(?:\s+([A-Z]{2,8}))?$/i

  contentLines.forEach(line => {
    const fullMatch = line.match(referencePattern)
    if (fullMatch && !referenceLine) {
      referenceLine = fullMatch[1].trim()
      if (fullMatch[2]) version = fullMatch[2].toUpperCase()
      return
    }
    verseParts.push(line)
  })

  let combinedText = verseParts.join(" ").trim()
  newRef.value = referenceLine
  newVersion.value = version
  newText.value = combinedText
  manageMsg.textContent = "Auto filled."
}

if (difficultyEasy) {
  difficultyEasy.addEventListener("click", () => {
    tapDifficulty = "easy"
    if (currentMode === "drag") { buildDragPuzzle(); result.textContent = ""; result.className = "result"; }
    else updateDifficultyButtons()
  })
}
if (difficultyMedium) {
  difficultyMedium.addEventListener("click", () => {
    tapDifficulty = "medium"
    if (currentMode === "drag") { buildDragPuzzle(); result.textContent = ""; result.className = "result"; }
    else updateDifficultyButtons()
  })
}
if (difficultyHard) {
  difficultyHard.addEventListener("click", () => {
    tapDifficulty = "hard"
    if (currentMode === "drag") { buildDragPuzzle(); result.textContent = ""; result.className = "result"; }
    else updateDifficultyButtons()
  })
}

function renderCollectionOptions(selectedValue = "") {
  if (!collectionSelect) return
  collectionSelect.innerHTML = `
    <option value="">Select collection</option>
    ${collections.map(item => `<option value="${item.name}">${item.name}</option>`).join("")}
    <option value="__add_new__">+ Add new collection</option>
  `
  collectionSelect.value = selectedValue && collections.some(i => i.name === selectedValue) ? selectedValue : ""
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
  groupSelect.value = selectedValue && filteredGroups.some(i => i.name === selectedValue) ? selectedValue : ""
}

async function loadCollectionsFromCloud() {
  if (!currentUser) return
  try {
    const snap = await getDocs(collection(db, "users", currentUser.uid, "collections"))
    collections = []
    snap.forEach(docSnap => {
      collections.push({ id: docSnap.id, name: docSnap.data().name || docSnap.id })
    })
    collections.sort((a, b) => a.name.localeCompare(b.name))
    renderCollectionOptions()
  } catch (error) {}
}

async function loadGroupsFromCloud() {
  if (!currentUser) return
  try {
    const snap = await getDocs(collection(db, "users", currentUser.uid, "groups"))
    groups = []
    snap.forEach(docSnap => {
      const data = docSnap.data()
      groups.push({ id: docSnap.id, name: data.name || "", collection: data.collection || "None" })
    })
    groups.sort((a, b) => a.name.localeCompare(b.name))
    renderGroupOptions()
  } catch (error) {}
}

async function saveCollection() {
  const name = (newCollectionName.value || "").trim()
  if (!name) return
  try {
    await setDoc(doc(db, "users", currentUser.uid, "collections", name), { name, createdAt: serverTimestamp() })
    await loadCollectionsFromCloud()
    renderCollectionOptions(name)
    showPage("library")
  } catch (error) {}
}

async function saveGroup() {
  const name = (newGroupName.value || "").trim()
  const parentCollection = collectionSelect.value.trim()
  if (!name || !parentCollection) return
  try {
    await setDoc(doc(db, "users", currentUser.uid, "groups", parentCollection + "__" + name), {
      name, collection: parentCollection, createdAt: serverTimestamp()
    })
    await loadGroupsFromCloud()
    groupSelect.value = name
    showPage("library")
  } catch (error) {}
}

collectionSelect.addEventListener("change", () => {
  if (collectionSelect.value === "__add_new__") { collectionSelect.value = ""; showPage("addCollection"); return; }
  groupSelect.value = ""
  updateGroupState()
})

groupSelect.addEventListener("change", () => {
  if (groupSelect.value === "__add_new__") {
    if (!collectionSelect.value) { groupSelect.value = ""; return; }
    groupSelect.value = ""
    showPage("addGroup")
  }
})

function updateGroupState() {
  const hasCollection = !!collectionSelect.value && collectionSelect.value !== "__add_new__"
  groupSelect.disabled = !hasCollection
  if (!hasCollection) groupSelect.innerHTML = `<option value="">Select collection first</option>`
  else renderGroupOptions()
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
  if (!selectedCollectionFilter || selectedCollectionFilter === "None") return
  renameCollectionInput.value = selectedCollectionFilter
  showModal(renameCollectionModal)
}

function openRenameGroupModal() {
  if (!selectedCollectionFilter || !selectedGroupFilter) return
  renameGroupInput.value = selectedGroupFilter
  showModal(renameGroupModal)
}

function openDeleteCollectionModal() {
  if (!selectedCollectionFilter || selectedCollectionFilter === "None") return
  showModal(deleteCollectionModal)
}

function openDeleteGroupModal() {
  if (!selectedCollectionFilter || !selectedGroupFilter) return
  showModal(deleteGroupModal)
}

async function renameCollection() {
  const oldName = selectedCollectionFilter
  const newName = (renameCollectionInput.value || "").trim()
  if (!newName || newName === oldName) { hideAllModals(); return; }

  try {
    const batch = writeBatch(db)
    batch.set(doc(db, "users", currentUser.uid, "collections", newName), { name: newName, createdAt: serverTimestamp() })
    batch.delete(doc(db, "users", currentUser.uid, "collections", oldName))

    const groupsSnap = await getDocs(query(collection(db, "users", currentUser.uid, "groups"), where("collection", "==", oldName)))
    groupsSnap.forEach(docSnap => {
      const data = docSnap.data()
      batch.set(doc(db, "users", currentUser.uid, "groups", newName + "__" + data.name), { name: data.name, collection: newName })
      batch.delete(doc(db, "users", currentUser.uid, "groups", docSnap.id))
    })

    const versesSnap = await getDocs(query(collection(db, "users", currentUser.uid, "verses"), where("collection", "==", oldName)))
    versesSnap.forEach(docSnap => {
      batch.update(doc(db, "users", currentUser.uid, "verses", docSnap.id), { collection: newName })
    })

    await batch.commit()
    selectedCollectionFilter = newName
    selectedGroupFilter = ""
    await loadCollectionsFromCloud()
    await loadGroupsFromCloud()
    await loadVersesFromCloud()
    hideAllModals()
  } catch (error) {}
}

async function renameGroup() {
  const collectionName = selectedCollectionFilter
  const oldName = selectedGroupFilter
  const newName = (renameGroupInput.value || "").trim()
  if (!newName || newName === oldName) { hideAllModals(); return; }

  try {
    const batch = writeBatch(db)
    batch.set(doc(db, "users", currentUser.uid, "groups", collectionName + "__" + newName), { name: newName, collection: collectionName })
    batch.delete(doc(db, "users", currentUser.uid, "groups", collectionName + "__" + oldName))

    const versesSnap = await getDocs(query(collection(db, "users", currentUser.uid, "verses"), where("collection", "==", collectionName), where("group", "==", oldName)))
    versesSnap.forEach(docSnap => {
      batch.update(doc(db, "users", currentUser.uid, "verses", docSnap.id), { group: newName })
    })

    await batch.commit()
    selectedGroupFilter = newName
    await loadGroupsFromCloud()
    await loadVersesFromCloud()
    hideAllModals()
  } catch (error) {}
}

async function deleteSelectedCollection() {
  const collectionName = selectedCollectionFilter
  if (!collectionName || collectionName === "None") return
  try {
    const batch = writeBatch(db)
    batch.delete(doc(db, "users", currentUser.uid, "collections", collectionName))
    const groupsSnap = await getDocs(query(collection(db, "users", currentUser.uid, "groups"), where("collection", "==", collectionName)))
    groupsSnap.forEach(docSnap => batch.delete(doc(db, "users", currentUser.uid, "groups", docSnap.id)))
    const versesSnap = await getDocs(query(collection(db, "users", currentUser.uid, "verses"), where("collection", "==", collectionName)))
    versesSnap.forEach(docSnap => batch.update(doc(db, "users", currentUser.uid, "verses", docSnap.id), { collection: "None", group: "" }))
    await batch.commit()
    selectedCollectionFilter = "None"
    selectedGroupFilter = ""
    await loadCollectionsFromCloud()
    await loadGroupsFromCloud()
    await loadVersesFromCloud()
    hideAllModals()
  } catch (error) {}
}

async function deleteSelectedGroup() {
  const collectionName = selectedCollectionFilter
  const groupName = selectedGroupFilter
  if (!groupName) return
  try {
    const batch = writeBatch(db)
    batch.delete(doc(db, "users", currentUser.uid, "groups", collectionName + "__" + groupName))
    const versesSnap = await getDocs(query(collection(db, "users", currentUser.uid, "verses"), where("collection", "==", collectionName), where("group", "==", groupName)))
    versesSnap.forEach(docSnap => batch.update(doc(db, "users", currentUser.uid, "verses", docSnap.id), { group: "" }))
    await batch.commit()
    selectedGroupFilter = ""
    await loadGroupsFromCloud()
    await loadVersesFromCloud()
    hideAllModals()
  } catch (error) {}
}

function renderMoveVerseCollectionOptions(selectedValue = "None") {
  if (!moveVerseCollectionSelect) return
  const collectionNames = ["None", ...collections.map(item => item.name).filter(name => name !== "None")]
  moveVerseCollectionSelect.innerHTML = collectionNames.map(name => `<option value="${name}">${name}</option>`).join("")
  moveVerseCollectionSelect.value = collectionNames.includes(selectedValue) ? selectedValue : "None"
}

function renderMoveVerseGroupOptions(collectionName, selectedValue = "") {
  if (!moveVerseGroupSelect) return
  if (!collectionName || collectionName === "None") {
    moveVerseGroupSelect.innerHTML = `<option value="">No group</option>`
    return
  }
  const filteredGroups = groups.filter(item => item.collection === collectionName)
  moveVerseGroupSelect.innerHTML = `
    <option value="">No group</option>
    ${filteredGroups.map(item => `<option value="${item.name}">${item.name}</option>`).join("")}
  `
  moveVerseGroupSelect.value = selectedValue && filteredGroups.some(item => item.name === selectedValue) ? selectedValue : ""
}

function openMoveVerseModal(verse) {
  moveVerseId = verse.id
  renderMoveVerseCollectionOptions(verse.collection || "None")
  renderMoveVerseGroupOptions(verse.collection || "None", verse.group || "")
  showModal(moveVerseModal)
}

async function saveMoveVerse() {
  if (!moveVerseId) return
  const newCollection = moveVerseCollectionSelect.value || "None"
  const newGroup = newCollection === "None" ? "" : (moveVerseGroupSelect.value || "")
  try {
    await updateDoc(doc(db, "users", currentUser.uid, "verses", moveVerseId), { collection: newCollection, group: newGroup })
    moveVerseId = ""
    hideAllModals()
    await loadVersesFromCloud()
  } catch (error) {}
}

function renderImportCollectionOptions(selectedValue = "None") {
  if (!importCollectionSelect) return
  const collectionNames = ["None", ...collections.map(item => item.name).filter(name => name !== "None")]
  importCollectionSelect.innerHTML = collectionNames.map(name => `<option value="${name}">${name}</option>`).join("")
  importCollectionSelect.value = collectionNames.includes(selectedValue) ? selectedValue : "None"
}

function renderImportGroupOptions(collectionName, selectedValue = "") {
  if (!importGroupSelect) return
  if (!collectionName || collectionName === "None") {
    importGroupSelect.innerHTML = `<option value="">No group</option>`
    importGroupSelect.disabled = true
    return
  }
  const filteredGroups = groups.filter(item => item.collection === collectionName)
  importGroupSelect.innerHTML = `
    <option value="">No group</option>
    ${filteredGroups.map(item => `<option value="${item.name}">${item.name}</option>`).join("")}
  `
  importGroupSelect.value = selectedValue && filteredGroups.some(item => item.name === selectedValue) ? selectedValue : ""
  importGroupSelect.disabled = false
}

function parseCsvText(csvText) {
  const rows = []
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "")
  if (lines.length < 2) return rows

  const parseLine = line => {
    const result = []
    let current = "", inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const char = line[i], next = line[i + 1]
      if (char === '"') {
        if (inQuotes && next === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes
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
    headers.forEach((header, index) => { row[header] = values[index] || ""; })
    rows.push(row)
  }
  return rows
}

async function importCsvFile() {
  if (!currentUser) return
  const file = csvFileInput.files && csvFileInput.files[0]
  if (!file) { importCsvMsg.textContent = "Please choose a CSV file."; return; }

  const collectionValue = importCollectionSelect.value || "None"
  const groupValue = collectionValue === "None" ? "" : (importGroupSelect.value || "")

  try {
    const csvText = await file.text()
    const rows = parseCsvText(csvText)
    if (rows.length === 0) { importCsvMsg.textContent = "No valid rows found."; return; }

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
        ref, version, text, title,
        collection: collectionValue,
        group: groupValue,
        order: verses.length + idx,
        createdAt: serverTimestamp()
      })
      addedCount++
    })

    if (addedCount === 0) { importCsvMsg.textContent = "No valid ref and text found."; return; }
    await batch.commit()
    await loadVersesFromCloud()
    importCsvMsg.textContent = addedCount + " verse(s) imported."
    csvFileInput.value = ""
  } catch (error) {
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
  renderMoveVerseGroupOptions(moveVerseCollectionSelect.value || "None", "")
})

btnAddCollectionInline.addEventListener("click", () => showPage("addCollection"))
btnAddGroupInline.addEventListener("click", () => {
  if (!selectedCollectionFilter || selectedCollectionFilter === "None") return
  collectionSelect.value = selectedCollectionFilter
  renderGroupOptions()
  showPage("addGroup")
})

collectionFilters.addEventListener("click", event => {
  const btn = event.target.closest("button[data-collection]")
  if (!btn || window._filterBusy) return
  const name = btn.dataset.collection
  if (!name || selectedCollectionFilter === name) return

  window._filterBusy = true
  selectedCollectionFilter = name
  selectedGroupFilter = ""
  renderGroupFilters()
  renderLibrary()
  setTimeout(() => { window._filterBusy = false }, 200)
})

groupFilters.addEventListener("click", event => {
  const btn = event.target.closest("button[data-group]")
  if (!btn || window._filterBusy) return
  const name = btn.dataset.group
  if (!name) return

  window._filterBusy = true
  selectedGroupFilter = selectedGroupFilter === name ? "" : name
  renderLibrary()
  setTimeout(() => { window._filterBusy = false }, 200)
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

modalOverlay.addEventListener("click", event => {
  if (event.target === modalOverlay) hideAllModals()
})

btnSaveCollection.addEventListener("click", saveCollection)
btnCancelCollection.addEventListener("click", () => showPage("library"))
btnSaveGroup.addEventListener("click", saveGroup)
btnCancelGroup.addEventListener("click", () => showPage("library"))

btnBackToGame.addEventListener("click", () => openGamePicker(selectedVerseId))
btnHideAll.addEventListener("click", toggleHideAll)
btnReset.addEventListener("click", resetCurrentGame)
btnGiveHint.addEventListener("click", giveHint)
btnCheck.addEventListener("click", checkCurrentMode)

btnAutoFill.addEventListener("click", autoFillFromPastedText)
btnSaveVerse.addEventListener("click", saveNewVerse)
btnClearVerse.addEventListener("click", clearVerseForm)
btnBackToLibrary.addEventListener("click", () => {
  showPage("library")
  setTimeout(() => window.scrollTo(0, libraryScrollY), 0)
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

pasteBox.addEventListener("paste", () => setTimeout(autoFillFromPastedText, 0))
themeSelect.addEventListener("change", event => saveTheme(event.target.value))
if (btnDeleteAccount) btnDeleteAccount.addEventListener("click", deleteCurrentAccount)

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
  getUser: () => currentUser
}

window.addEventListener("scroll", () => {
  if (!pageLibrary.classList.contains("isHidden")) libraryScrollY = window.scrollY
})

initTheme()
showPage("library")
refreshVerses()
loadStats()
loadVersesFromCloud()