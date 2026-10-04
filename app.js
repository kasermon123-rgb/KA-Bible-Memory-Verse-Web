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

const LOCAL_LIBRARY_KEY = "scriptureMemoryLocal"

function localId(prefix) {
  return prefix + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8)
}

function readLocalLibrary() {
  try {
    const data = JSON.parse(localStorage.getItem(LOCAL_LIBRARY_KEY) || "{}")
    return {
      verses: Array.isArray(data.verses) ? data.verses : [],
      collections: Array.isArray(data.collections) ? data.collections : [],
      groups: Array.isArray(data.groups) ? data.groups : []
    }
  } catch (error) {
    return { verses: [], collections: [], groups: [] }
  }
}

function saveLocalLibrary() {
  localStorage.setItem(LOCAL_LIBRARY_KEY, JSON.stringify({
    verses,
    collections,
    groups
  }))
}

function applyLocalLibrary() {
  const local = readLocalLibrary()
  verses = local.verses
  collections = local.collections
  groups = local.groups
}

function setSaveFoot() {
  const foot = document.getElementById("saveFoot")
  if (!foot) return
  foot.textContent = currentUser
    ? "Saved in your account."
    : "Not signed in. Verses stay in this browser until you clear site data."
}


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
let refPuzzleHidden = []
let refPuzzleSlots = []
let versePuzzleHidden = []
let versePuzzleSlots = []
let titleBankItems = []
let refBankItems = []
let verseBankItems = []
let selectedTitleBankWord = ""
let selectedRefBankWord = ""
let selectedVerseBankWord = ""

let titleWords = []
let refWords = []
let verseWords = []

let verses = []
let words = []
let hiddenIndexes = []

let selectedVerseId = ""
let typeReading = true
let hintUsed = false
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
const pageToday = document.getElementById("pageToday")
const tabToday = document.getElementById("tabToday")
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
const refAnswerRow = document.getElementById("refAnswerRow")
const refAnswer = document.getElementById("refAnswer")
const practiceVersion = document.getElementById("practiceVersion")

const titleDragSection = document.getElementById("titleDragSection")
const titleBlankLine = document.getElementById("titleBlankLine")
const titleWordBank = document.getElementById("titleWordBank")
const refDragSection = document.getElementById("refDragSection")
const refBlankLine = document.getElementById("refBlankLine")
const refWordBank = document.getElementById("refWordBank")

const titleLettersSection = document.getElementById("titleLettersSection")
const titleLettersGame = document.getElementById("titleLettersGame")
const refLettersSection = document.getElementById("refLettersSection")
const refLettersGame = document.getElementById("refLettersGame")
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
    setSaveFoot()
  } else {
    authMsg.textContent = "Not signed in. Verses are saved in this browser only."
    btnLogin.classList.remove("isHidden")
    btnLogout.classList.add("isHidden")

    applyTheme(getSavedTheme())
    if (settingsMsg) settingsMsg.textContent = "Theme saved in this browser."
    setSaveFoot()

    selectedVerseId = ""
    titleWords = []
    refWords = []
    verseWords = []
    answer.value = ""
    if (titleAnswer) titleAnswer.value = ""
    if (refAnswer) refAnswer.value = ""
    result.textContent = ""
    result.className = "result"

    await loadVersesFromCloud()
  }
})

async function loadVersesFromCloud() {
  if (!currentUser) {
    applyLocalLibrary()
    renderCollectionOptions()
    updateGroupState()
    renderGroupOptions()
    renderLibrary()
    renderTodayPlan(verses)

    if (verses.length > 0) {
      loadVerse(verses[0].id)
      setPracticeEnabled(true)
    } else {
      setPracticeEnabled(false)
      practiceVerseTitle.textContent = "No verses yet"
      verseText.textContent = "Go to Library to add one. It stays in this browser until you clear site data."
      setTypingEnabled(false)
    }
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
    renderTodayPlan(verses)

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

  if (refAnswer) {
    refAnswer.disabled = !enabled
    refAnswer.placeholder = enabled ? "Example: John 3:16" : "Hide words first to type."
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


const PROGRESS_KEY = "scriptureMemoryProgress"
let reminderTimer = null

function todayKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return y + "-" + m + "-" + d
}

function readProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}")
    return {
      days: data.days && typeof data.days === "object" ? data.days : {},
      reminderTime: data.reminderTime || "20:00",
      remindersOn: Boolean(data.remindersOn),
      lastNotifiedDate: data.lastNotifiedDate || ""
    }
  } catch (error) {
    return { days: {}, reminderTime: "20:00", remindersOn: false, lastNotifiedDate: "" }
  }
}

function saveProgress(progress) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress))
  if (currentUser) {
    setDoc(doc(db, "users", currentUser.uid, "meta", "progress"), progress).catch(error => {
      console.error("Save progress failed:", error)
    })
  }
}

function computeStreak(days) {
  const cursor = new Date()
  if (!days[todayKey(cursor)] || !days[todayKey(cursor)].sessions) {
    cursor.setDate(cursor.getDate() - 1)
  }
  let streak = 0
  while (days[todayKey(cursor)] && days[todayKey(cursor)].sessions > 0) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function recordPractice(mastered) {
  const progress = readProgress()
  const key = todayKey()
  const day = progress.days[key] || { sessions: 0, mastered: 0 }
  day.sessions += 1
  if (mastered) day.mastered += 1
  progress.days[key] = day
  saveProgress(progress)
  renderProgress()
}

function renderProgress() {
  const progress = readProgress()
  const streakEl = document.getElementById("streakCount")
  const todayEl = document.getElementById("todayCount")
  const weekEl = document.getElementById("weekRow")
  const summaryEl = document.getElementById("weekSummary")
  if (!streakEl || !weekEl) return

  const today = progress.days[todayKey()] || { sessions: 0, mastered: 0 }
  streakEl.textContent = String(computeStreak(progress.days))
  todayEl.textContent = "Today: " + today.sessions + " practiced"

  weekEl.innerHTML = ""
  let weekDays = 0
  for (let offset = 6; offset >= 0; offset--) {
    const date = new Date()
    date.setDate(date.getDate() - offset)
    const key = todayKey(date)
    const done = progress.days[key] && progress.days[key].sessions > 0
    if (done) weekDays += 1
    const cell = document.createElement("div")
    cell.className = "weekDay"
    const dot = document.createElement("span")
    dot.className = "weekDot" + (done ? " done" : "") + (offset === 0 ? " today" : "")
    const label = document.createElement("span")
    label.textContent = date.toLocaleDateString(undefined, { weekday: "narrow" })
    cell.appendChild(dot)
    cell.appendChild(label)
    weekEl.appendChild(cell)
  }
  summaryEl.textContent = "This week: " + weekDays + " day" + (weekDays === 1 ? "" : "s")
}

async function enableReminders() {
  const reminderMsg = document.getElementById("reminderMsg")
  const reminderTime = document.getElementById("reminderTime")
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    if (reminderMsg) reminderMsg.textContent = "This browser cannot show reminders."
    return
  }
  const permission = await Notification.requestPermission()
  if (permission !== "granted") {
    if (reminderMsg) reminderMsg.textContent = "Reminders stay off until notification permission is allowed."
    return
  }
  const progress = readProgress()
  progress.remindersOn = true
  progress.reminderTime = reminderTime && reminderTime.value ? reminderTime.value : "20:00"
  saveProgress(progress)
  await registerReminderWorker()
  scheduleReminder()
  if (reminderMsg) reminderMsg.textContent = "Reminder set for " + progress.reminderTime + ". Keep this site installed for the most reliable alert."
}

async function registerReminderWorker() {
  if (!("serviceWorker" in navigator)) return null
  const registration = await navigator.serviceWorker.register("./sw.js")
  if (registration.periodicSync) {
    try {
      await registration.periodicSync.register("scripture-reminder", { minInterval: 12 * 60 * 60 * 1000 })
    } catch (error) {
      console.warn("Periodic reminder not available:", error)
    }
  }
  return registration
}

async function maybeNotify() {
  const progress = readProgress()
  if (!progress.remindersOn || Notification.permission !== "granted") return
  if (progress.lastNotifiedDate === todayKey()) return
  const today = progress.days[todayKey()]
  if (today && today.sessions > 0) return
  const [hour, minute] = progress.reminderTime.split(":").map(Number)
  const now = new Date()
  if (now.getHours() < hour || (now.getHours() === hour && now.getMinutes() < minute)) return

  const registration = await navigator.serviceWorker.ready
  await registration.showNotification("Scripture Memory", {
    body: "Time to review a verse and keep your streak.",
    tag: "scripture-reminder"
  })
  progress.lastNotifiedDate = todayKey()
  saveProgress(progress)
}

function scheduleReminder() {
  if (reminderTimer) clearTimeout(reminderTimer)
  const progress = readProgress()
  if (!progress.remindersOn) return
  const [hour, minute] = (progress.reminderTime || "20:00").split(":").map(Number)
  const target = new Date()
  target.setHours(hour, minute, 0, 0)
  if (target <= new Date()) target.setDate(target.getDate() + 1)
  reminderTimer = setTimeout(async () => {
    await maybeNotify()
    scheduleReminder()
  }, target - new Date())
  maybeNotify()
}

function initTheme() {
  applyTheme(getSavedTheme())
}

function loadVerse(id) {
  const verse = verses.find(v => v.id === id)
  if (!verse) return

  selectedVerseId = id

  titleWords = verse.title ? verse.title.split(/\s+/) : []
  refWords = verse.ref ? verse.ref.split(/\s+/).filter(Boolean) : []
  verseWords = verse.text.split(/\s+/)

  if (practiceVersion) {
    practiceVersion.textContent = verse.version ? "Version: " + verse.version : ""
  }

  renderReferenceDisplay(false)

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

  if (refAnswer) {
    refAnswer.value = ""
  }

  if (refAnswerRow) {
    refAnswerRow.classList.toggle("isHidden", refWords.length === 0)
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
  renderReferenceDisplay(false)
  setTypingEnabled(true)
  if (refAnswer) refAnswer.focus()
  else answer.focus()
}

function revealAllWords() {
  hiddenIndexes = []
  renderVerse()
  renderReferenceDisplay(true)
  answer.focus()
}

function showTypeRead() {
  typeReading = true
  hiddenIndexes = []
  renderVerse()
  renderReferenceDisplay(true)
  if (practiceTitle && titleWords.length) practiceTitle.classList.remove("isHidden")
  verseText.classList.remove("isHidden")
  answerRow.classList.add("isHidden")
  if (titleAnswerRow) titleAnswerRow.classList.add("isHidden")
  if (refAnswerRow) refAnswerRow.classList.add("isHidden")
  btnHideAll.textContent = "Hide and start"
  btnHideAll.classList.remove("isHidden")
  btnCheck.classList.add("isHidden")
  btnReset.classList.add("isHidden")
  btnGiveHint.classList.add("isHidden")
  setTypingEnabled(false)
  result.textContent = "Read it, then hide it and try."
  result.className = "result"
}

function showTypeTest() {
  typeReading = false
  hiddenIndexes = words.map((word, index) => index)
  renderVerse()
  renderReferenceDisplay(false)
  if (practiceTitle) practiceTitle.classList.add("isHidden")
  verseText.classList.add("isHidden")
  answerRow.classList.remove("isHidden")
  if (titleAnswerRow) titleAnswerRow.classList.toggle("isHidden", titleWords.length === 0)
  if (refAnswerRow) refAnswerRow.classList.toggle("isHidden", refWords.length === 0)
  btnHideAll.textContent = "Show the verse"
  btnCheck.classList.remove("isHidden")
  btnReset.classList.remove("isHidden")
  btnGiveHint.classList.add("isHidden")
  setTypingEnabled(true)
  answer.value = ""
  if (titleAnswer) titleAnswer.value = ""
  if (refAnswer) refAnswer.value = ""
  result.textContent = ""
  result.className = "result"
  if (refAnswer) refAnswer.focus()
  else answer.focus()
}

function endTypeAttempt() {
  hintUsed = true
  typeReading = true
  hiddenIndexes = []
  renderVerse()
  renderReferenceDisplay(true)
  if (practiceTitle && titleWords.length) practiceTitle.classList.remove("isHidden")
  verseText.classList.remove("isHidden")
  setTypingEnabled(false)
  btnHideAll.textContent = "Hide and start"
  btnCheck.classList.add("isHidden")
  result.textContent = "The verse is shown. This try does not count as memorized."
  result.className = "result"
}

function toggleHideAll() {
  if (currentMode === "type") {
    if (typeReading) showTypeTest()
    else endTypeAttempt()
    return
  }

  if (hiddenIndexes.length === words.length) {
    revealAllWords()
    btnHideAll.textContent = "Hide All"
  } else {
    hideAllWords()
    btnHideAll.textContent = "Reveal All"
  }
}

function renderReferenceDisplay(revealed) {
  if (!practiceVerseTitle) return

  if (refWords.length === 0) {
    practiceVerseTitle.textContent = "No reference"
    practiceVerseTitle.classList.remove("isHidden")
    return
  }

  practiceVerseTitle.textContent = revealed
    ? refWords.join(" ")
    : refWords.map(() => "____").join(" ")
  practiceVerseTitle.classList.remove("isHidden")
}

function resetTypeMode() {
  if (currentMode === "type") {
    showTypeTest()
    return
  }
  hiddenIndexes = words.map((word, index) => index)
  renderVerse()
  renderReferenceDisplay(false)
  setTypingEnabled(true)
  answer.value = ""
  if (titleAnswer) titleAnswer.value = ""
  if (refAnswer) refAnswer.value = ""
  result.textContent = ""
  result.className = "result"

  if (refAnswerRow && !refAnswerRow.classList.contains("isHidden") && refAnswer) {
    refAnswer.focus()
  } else if (titleAnswerRow && !titleAnswerRow.classList.contains("isHidden")) {
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


function blankHideCount(length, ratio) {
  if (!length) return 0
  if (length === 1) return 1
  const plan = {
    easy: { ratio: 0.25, cap: 3 },
    medium: { ratio: 0.4, cap: 5 },
    hard: { ratio: 0.55, cap: 7 }
  }
  const item = plan[tapDifficulty] || plan.easy
  const hide = Math.max(1, Math.round(length * item.ratio))
  return Math.min(length - 1, item.cap, hide)
}

function optionCountForDifficulty() {
  if (tapDifficulty === "hard") return 6
  if (tapDifficulty === "medium") return 5
  return 4
}

function visibleBankItems(bankItems, slots, limit = optionCountForDifficulty()) {
  const available = bankItems.filter(item => item.placedIn === null)
  if (available.length <= limit) return available.sort(() => Math.random() - 0.5)

  const nextSlot = slots.find(slot => !slot.filled)
  const correct = nextSlot
    ? available.find(item => item.homeIndex === nextSlot.index)
    : null
  const others = available.filter(item => item !== correct).sort(() => Math.random() - 0.5)
  const picked = []
  if (correct) picked.push(correct)
  while (picked.length < limit && others.length > 0) picked.push(others.shift())
  return picked.sort(() => Math.random() - 0.5)
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

  const verseHideCount = blankHideCount(verseWords.length, ratio)
  const titleHideCount = blankHideCount(titleWords.length, ratio)

  titlePuzzleHidden = []
  titlePuzzleSlots = []
  refPuzzleHidden = []
  refPuzzleSlots = []
  versePuzzleHidden = []
  versePuzzleSlots = []
  titleBankItems = []
  refBankItems = []
  verseBankItems = []

  selectedTitleBankWord = ""
  selectedRefBankWord = ""
  selectedVerseBankWord = ""

  refPuzzleHidden = refWords.map((word, index) => index)
  refPuzzleSlots = refPuzzleHidden.map(index => ({
    index,
    expected: refWords[index],
    filled: "",
    itemId: ""
  }))
  refBankItems = makeBankItems(refPuzzleHidden, refWords, "ref")

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

  if (refDragSection) {
    refDragSection.classList.toggle("isHidden", refWords.length === 0)
  }

  if (refBlankLine) refBlankLine.innerHTML = ""
  if (refWordBank) refWordBank.innerHTML = ""

  if (refWords.length > 0 && refBlankLine && refWordBank) {
    const refHiddenSet = new Set(refPuzzleHidden)

    for (let i = 0; i < refWords.length; i++) {
      if (refHiddenSet.has(i)) {
        const blank = document.createElement("span")
        const slot = refPuzzleSlots.find(s => s.index === i)

        const isNextEmpty = slot && !slot.filled && !refPuzzleSlots.some(other => other.index < i && !other.filled)
        blank.textContent = slot && slot.filled ? slot.filled : "_____"
        blank.className = slot && slot.filled ? "blank filled" : (isNextEmpty ? "blank active" : "blank")

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

    const refAvailableBankItems = visibleBankItems(refBankItems, refPuzzleSlots)

    refAvailableBankItems.forEach(item => {
      const pill = document.createElement("span")
      pill.className = "pill"
      pill.textContent = item.text
      if (selectedRefBankWord === item.id) {
        pill.classList.add("active")
      }

      pill.addEventListener("click", () => {
        selectedRefBankWord = item.id
        refWordBank.querySelectorAll(".pill").forEach(p => p.classList.remove("active"))
        pill.classList.add("active")
      })

      refWordBank.appendChild(pill)
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

        const isNextEmpty = slot && !slot.filled && !titlePuzzleSlots.some(other => other.index < i && !other.filled)
        blank.textContent = slot && slot.filled ? slot.filled : "_____"
        blank.className = slot && slot.filled ? "blank filled" : (isNextEmpty ? "blank active" : "blank")

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

    const titleAvailableBankItems = visibleBankItems(titleBankItems, titlePuzzleSlots)

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

      const isNextEmpty = slot && !slot.filled && !versePuzzleSlots.some(other => other.index < i && !other.filled)
      blank.textContent = slot && slot.filled ? slot.filled : "_____"
      blank.className = slot && slot.filled ? "blank filled" : (isNextEmpty ? "blank active" : "blank")

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

  const verseAvailableBankItems = visibleBankItems(verseBankItems, versePuzzleSlots)

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
  if (refLettersSection) {
    refLettersSection.classList.toggle("isHidden", refWords.length === 0)
  }

  if (titleLettersSection) {
    titleLettersSection.classList.toggle("isHidden", titleWords.length === 0)
  }

  if (refLettersGame) {
    refLettersGame.innerHTML = ""
  }

  if (titleLettersGame) {
    titleLettersGame.innerHTML = ""
  }

  if (verseLettersGame) {
    verseLettersGame.innerHTML = ""
  }

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

function countMatchingWords(expectedWords, userWords) {
  let correct = 0
  for (let i = 0; i < expectedWords.length; i++) {
    if ((userWords[i] || "") === expectedWords[i]) correct += 1
  }
  return correct
}


const VERSE_PROGRESS_KEY = "scriptureMemoryVerseProgress"

function readVerseProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(VERSE_PROGRESS_KEY) || "{}")
    if (data.date !== todayKey()) return { date: todayKey(), verses: {} }
    return { date: data.date, verses: data.verses || {} }
  } catch (error) {
    return { date: todayKey(), verses: {} }
  }
}

function verseTodayPercent(id) {
  const progress = readVerseProgress()
  return Math.max(0, Math.min(100, Number(progress.verses[id] || 0)))
}

function addVerseTodayPercent(id, gain, fill) {
  const progress = readVerseProgress()
  const current = Number(progress.verses[id] || 0)
  progress.verses[id] = fill ? 100 : Math.min(100, current + gain)
  localStorage.setItem(VERSE_PROGRESS_KEY, JSON.stringify(progress))
  renderLibrary()
}

function showPracticeScore(parts) {
  const shown = parts.filter(part => part.total > 0)
  const total = shown.reduce((sum, part) => sum + part.total, 0)
  const correct = shown.reduce((sum, part) => sum + part.correct, 0)
  const percent = total === 0 ? 0 : Math.round((correct / total) * 100)
  const detail = shown.map(part => part.label + ": " + part.correct + "/" + part.total).join(". ")

  result.textContent = (detail ? detail + ". " : "") + "Total: " + correct + "/" + total + ". " + percent + "%."
  result.className = percent === 100 ? "result good" : "result bad"

  if (percent === 100) {
    renderReferenceDisplay(true)
    saveScore()
  }

  recordPractice(percent === 100)
  if (percent === 100 && !hintUsed && selectedVerseId) {
    if (currentMode === "type") addVerseTodayPercent(selectedVerseId, 0, true)
    if (currentMode === "letters") addVerseTodayPercent(selectedVerseId, 20, false)
    if (currentMode === "drag") {
      const gain = tapDifficulty === "hard" ? 10 : tapDifficulty === "medium" ? 5 : 2
      addVerseTodayPercent(selectedVerseId, gain, false)
    }
  } else if (hintUsed) {
    result.textContent += " Hint was used, so today's bar did not move."
  }
}

function checkTypeMode() {
  const expectedRefWords = refWords.map(word => normalize(word)).filter(Boolean)
  const expectedTitleWords = titleWords.map(word => normalize(word)).filter(Boolean)
  const expectedVerseWords = verseWords.map(word => normalize(word.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ""))).filter(Boolean)

  const userRefWords = normalize(refAnswer ? refAnswer.value : "").split(" ").filter(Boolean)
  const userTitleWords = normalize(titleAnswer ? titleAnswer.value : "").split(" ").filter(Boolean)
  const userVerseWords = normalize(answer.value).split(" ").filter(Boolean)

  showPracticeScore([
    { label: "Reference", correct: countMatchingWords(expectedRefWords, userRefWords), total: expectedRefWords.length },
    { label: "Title", correct: countMatchingWords(expectedTitleWords, userTitleWords), total: expectedTitleWords.length },
    { label: "Verse", correct: countMatchingWords(expectedVerseWords, userVerseWords), total: expectedVerseWords.length }
  ])
}

function countFilledSlots(slots) {
  let correct = 0
  slots.forEach(slot => {
    if (normalize(slot.filled || "") === normalize(slot.expected || "")) correct += 1
  })
  return correct
}

function checkDragMode() {
  showPracticeScore([
    { label: "Reference", correct: countFilledSlots(refPuzzleSlots), total: refPuzzleSlots.length },
    { label: "Title", correct: countFilledSlots(titlePuzzleSlots), total: titlePuzzleSlots.length },
    { label: "Verse", correct: countFilledSlots(versePuzzleSlots), total: versePuzzleSlots.length }
  ])
}

function scoreLetterSection(container, sourceWords) {
  let correct = 0
  let total = 0
  if (!container) return { correct, total }

  container.querySelectorAll(".letterWord").forEach(wrapper => {
    const input = wrapper.querySelector(".letterBox")
    const fullWord = wrapper.querySelector(".fullWord")
    if (!input || !fullWord) return

    total += 1

    if (!fullWord.classList.contains("isHidden")) {
      correct += 1
      return
    }

    const index = Number(input.dataset.index)
    const cleanWord = sourceWords[index].replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "")
    const expected = cleanWord.charAt(0).toLowerCase()
    const user = input.value.trim().toLowerCase()

    if (user === expected) {
      correct += 1
      input.classList.add("isHidden")
      fullWord.classList.remove("isHidden")
      input.classList.remove("wrong")
    } else if (user) {
      input.classList.add("wrong")
    }
  })

  return { correct, total }
}

function checkLettersGame() {
  const refScore = scoreLetterSection(refLettersGame, refWords)
  const titleScore = scoreLetterSection(titleLettersGame, titleWords)
  const verseScore = scoreLetterSection(verseLettersGame, verseWords)

  showPracticeScore([
    { label: "Reference", correct: refScore.correct, total: refScore.total },
    { label: "Title", correct: titleScore.correct, total: titleScore.total },
    { label: "Verse", correct: verseScore.correct, total: verseScore.total }
  ])
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
  const emptyRef = refPuzzleSlots.filter(slot => !slot.filled)
  const emptyTitle = titlePuzzleSlots.filter(slot => !slot.filled)
  const emptyVerse = versePuzzleSlots.filter(slot => !slot.filled)

  if (emptyRef.length > 0) {
    const pick = emptyRef[Math.floor(Math.random() * emptyRef.length)]
    const item = refBankItems.find(bankItem => bankItem.homeIndex === pick.index && bankItem.placedIn === null)
    if (item) {
      placeBankItemInSlot(refPuzzleSlots, refBankItems, pick.index, item.id)
    }
    selectedRefBankWord = ""
    renderDragPuzzle()
    return
  }

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
  const refUnfinished = refLettersGame
    ? Array.from(refLettersGame.querySelectorAll(".letterWord")).filter(wrapper => {
      const input = wrapper.querySelector(".letterBox")
      const fullWord = wrapper.querySelector(".fullWord")
      return input && fullWord && fullWord.classList.contains("isHidden")
    })
    : []

  if (refUnfinished.length > 0) {
    const pick = refUnfinished[Math.floor(Math.random() * refUnfinished.length)]
    const input = pick.querySelector(".letterBox")
    const fullWord = pick.querySelector(".fullWord")

    input.classList.add("isHidden")
    fullWord.classList.remove("isHidden")
    input.classList.remove("wrong")
    moveToNextLetterBox()
    return
  }

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
  hintUsed = true
  if (currentMode === "drag") {
    revealOneBlank()
    return
  }

  if (currentMode === "letters") {
    revealOneLetterBox()
    return
  }

  const typedRef = normalize(refAnswer ? refAnswer.value : "").split(" ").filter(Boolean)
  const expectedRef = refWords.map(word => normalize(word)).filter(Boolean)
  const nextMissing = expectedRef.findIndex((word, index) => typedRef[index] !== word)

  if (nextMissing !== -1 && refAnswer) {
    typedRef[nextMissing] = refWords[nextMissing]
    refAnswer.value = typedRef.filter(Boolean).join(" ")
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

  if (refAnswerRow) {
    refAnswerRow.classList.toggle("isHidden", isDrag || isLetters || refWords.length === 0)
  }
}

function applyModeUI() {
  updatePracticeUI()
  btnHideAll.textContent = "Hide All"
  result.textContent = ""
  result.className = "result"

  if (currentMode === "type") {
    showTypeRead()
    return
  }
  btnCheck.classList.remove("isHidden")
  btnReset.classList.remove("isHidden")
  btnGiveHint.classList.remove("isHidden")

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
  if (pageToday) pageToday.classList.add("isHidden")
  pageAddCollection.classList.add("isHidden")
  pageAddGroup.classList.add("isHidden")
  pageGame.classList.add("isHidden")
  pageSettings.classList.add("isHidden")

  tabLibrary.classList.remove("active")
  if (tabToday) tabToday.classList.remove("active")
  tabSettings.classList.remove("active")

  if (name === "practice") {
    pagePractice.classList.remove("isHidden")
    refreshVerses()
    setPracticeEnabled(verses.length > 0)
    return
  }

  if (name === "today") {
    if (pageToday) pageToday.classList.remove("isHidden")
    if (tabToday) tabToday.classList.add("active")
    renderTodayPlan(verses)
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

  const todayPercent = verseTodayPercent(verse.id)
  const gameProgressBar = document.getElementById("gameProgressBar")
  const gameProgressText = document.getElementById("gameProgressText")
  if (gameProgressBar) gameProgressBar.style.width = todayPercent + "%"
  if (gameProgressText) {
    gameProgressText.textContent = todayPercent + "%"
    gameProgressText.className = "verseProgressText" + (todayPercent === 100 ? " good" : todayPercent >= 50 ? " mid" : " low")
  }

  showPage("game")
}

function startSelectedGame(mode) {
  currentMode = mode
  hintUsed = false
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


const PLAN_KEY = "scriptureMemoryPlan"
let planViewOffset = 0

function readPlan() {
  try {
    const data = JSON.parse(localStorage.getItem(PLAN_KEY) || "{}")
    const perDay = Math.max(1, Math.min(20, Number(data.perDay) || 3))
    return { perDay, days: data.days && typeof data.days === "object" ? data.days : {} }
  } catch (error) {
    return { perDay: 3, days: {} }
  }
}

function savePlan(plan) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan))
}

function dayKeyFromOffset(offset) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return todayKey(date)
}

function ensureWeekPlan() {
  const plan = readPlan()
  for (let offset = 0; offset < 7; offset++) {
    const key = dayKeyFromOffset(offset)
    plan.days[key] = Array.isArray(plan.days[key]) ? plan.days[key] : []
  }
  savePlan(plan)
  return plan
}

function addVerseToPlan(id) {
  const plan = readPlan()
  const key = dayKeyFromOffset(planViewOffset)
  const list = plan.days[key] || []
  if (!list.includes(id)) list.push(id)
  plan.days[key] = list
  savePlan(plan)
  showPage("today")
}

function renderTodayPlan(pool) {
  const planBox = document.getElementById("todayPlan")
  const week = document.getElementById("planWeek")
  const list = document.getElementById("planList")
  const note = document.getElementById("planNote")
  const count = document.getElementById("planCount")
  const title = document.getElementById("planTitle")
  if (!planBox || !week || !list) return
  const plan = ensureWeekPlan()
  if (count) count.textContent = String(plan.perDay)
  const viewKey = dayKeyFromOffset(planViewOffset)
  if (title) title.textContent = planViewOffset === 0 ? "Today" : viewKey

  week.innerHTML = ""
  for (let offset = 0; offset < 7; offset++) {
    const date = new Date()
    date.setDate(date.getDate() + offset)
    const button = document.createElement("button")
    button.type = "button"
    button.className = "weekDay planDay" + (offset === planViewOffset ? " active" : "")
    button.textContent = date.toLocaleDateString(undefined, { weekday: "narrow" })
    button.addEventListener("click", () => {
      planViewOffset = offset
      renderLibrary()
    })
    week.appendChild(button)
  }

  list.innerHTML = ""
  const chosen = plan.days[viewKey] || []
  chosen.forEach(id => {
    const verse = verses.find(item => item.id === id)
    if (!verse) return
    const row = document.createElement("div")
    row.className = "planRow"
    const name = document.createElement("div")
    name.textContent = (verse.title || verse.ref || "Untitled") + " · " + verseTodayPercent(verse.id) + "%"
    const actions = document.createElement("div")
    actions.className = "controls"
    const play = document.createElement("button")
    play.type = "button"
    play.textContent = "Play"
    play.addEventListener("click", () => openGamePicker(verse.id))
    const later = document.createElement("button")
    later.type = "button"
    later.textContent = "Later"
    later.addEventListener("click", () => movePlanVerseLater(verse.id, viewKey))
    actions.appendChild(play)
    actions.appendChild(later)
    row.appendChild(name)
    row.appendChild(actions)
    list.appendChild(row)
  })
  if (!chosen.length) list.innerHTML = `<div class="result">No verses left for this day.</div>`
  if (note) note.textContent = chosen.length ? "Only verses you added are here. Later moves one to the next day." : "Nothing for this day. Choose verses from Library."
}

function movePlanVerseLater(id, key) {
  const plan = readPlan()
  plan.days[key] = (plan.days[key] || []).filter(item => item !== id)
  const nextKey = dayKeyFromOffset(planViewOffset + 1)
  const next = plan.days[nextKey] || []
  if (!next.includes(id)) next.push(id)
  plan.days[nextKey] = next
  savePlan(plan)
  renderTodayPlan(verses)
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

    const meta = document.createElement("div")
    meta.className = "meta"

    const title = document.createElement("div")
    title.className = "verseTitle"
    title.textContent = verse.title || verse.ref || "Untitled"

    const small = document.createElement("small")
    small.textContent =
      (verse.ref || "") +
      (verse.version ? " (" + verse.version + ")" : "") +
      (verse.group ? " · " + verse.group : "")

    const todayPercent = verseTodayPercent(verse.id)
    const progressWrap = document.createElement("div")
    progressWrap.className = "verseProgress"
    const progressBar = document.createElement("div")
    progressBar.className = "verseProgressBar"
    progressBar.style.width = todayPercent + "%"
    const progressText = document.createElement("div")
    progressText.className = "verseProgressText" + (todayPercent === 100 ? " good" : todayPercent >= 50 ? " mid" : " low")
    progressText.textContent = todayPercent + "%"
    progressWrap.appendChild(progressBar)
    progressWrap.appendChild(progressText)

    meta.appendChild(title)
    meta.appendChild(small)
    meta.appendChild(progressWrap)

    const actions = document.createElement("div")
    actions.className = "cardActions"

    const reorder = document.createElement("div")
    reorder.className = "reorderBtns"

    if (selectedSortMode === "custom") {
      const up = document.createElement("button")
      up.type = "button"
      up.className = "reorderBtn"
      up.textContent = "↑"
      up.title = "Move up"
      up.addEventListener("click", (event) => {
        event.preventDefault()
        event.stopPropagation()
        moveVisibleVerse(verse.id, -1)
      })

      const down = document.createElement("button")
      down.type = "button"
      down.className = "reorderBtn"
      down.textContent = "↓"
      down.title = "Move down"
      down.addEventListener("click", (event) => {
        event.preventDefault()
        event.stopPropagation()
        moveVisibleVerse(verse.id, 1)
      })

      reorder.appendChild(up)
      reorder.appendChild(down)

      const handle = document.createElement("span")
      handle.className = "dragHandle"
      handle.textContent = "☰"
      handle.title = "Drag to reorder"
      handle.draggable = true

      handle.addEventListener("dragstart", (event) => {
        draggedVerseId = verse.id
        row.classList.add("dragging")
        event.dataTransfer.effectAllowed = "move"
        event.dataTransfer.setData("text/plain", verse.id)
      })

      handle.addEventListener("dragend", () => {
        row.classList.remove("dragging")
        draggedVerseId = null
      })

      row.addEventListener("dragover", (event) => {
        if (!draggedVerseId) return
        event.preventDefault()
        event.dataTransfer.dropEffect = "move"
      })

      row.addEventListener("drop", async (event) => {
        event.preventDefault()
        row.classList.remove("dragging")
        if (!draggedVerseId || draggedVerseId === verse.id) return

        const fromIndex = verses.findIndex(item => item.id === draggedVerseId)
        const toIndex = verses.findIndex(item => item.id === verse.id)
        if (fromIndex === -1 || toIndex === -1) return

        const [movedVerse] = verses.splice(fromIndex, 1)
        verses.splice(toIndex, 0, movedVerse)
        verses.forEach((item, index) => { item.order = index })
        draggedVerseId = null
        renderLibrary()
        await saveVersesOrderToCloud()
      })

      reorder.appendChild(handle)
    }

    const actionBtns = document.createElement("div")
    actionBtns.className = "controls"

    const playBtn = document.createElement("button")
    playBtn.type = "button"
    playBtn.textContent = "Play"
    playBtn.addEventListener("click", () => {
      openGamePicker(verse.id)
    })

    const addBtn = document.createElement("button")
    addBtn.type = "button"
    addBtn.textContent = "Add"
    addBtn.addEventListener("click", () => addVerseToPlan(verse.id))

    const moveBtn = document.createElement("button")
    moveBtn.type = "button"
    moveBtn.textContent = "Move"
    moveBtn.addEventListener("click", () => {
      openMoveVerseModal(verse)
    })

    const deleteBtn = document.createElement("button")
    deleteBtn.type = "button"
    deleteBtn.className = "danger"
    deleteBtn.textContent = "Delete"
    deleteBtn.addEventListener("click", () => {
      confirmDelete(verse.id, row)
    })

    actionBtns.appendChild(addBtn)
    actionBtns.appendChild(playBtn)
    actionBtns.appendChild(moveBtn)
    actionBtns.appendChild(deleteBtn)
    actions.appendChild(reorder)
    actions.appendChild(actionBtns)

    row.appendChild(meta)
    row.appendChild(actions)

    libraryGrid.appendChild(row)

  })
}



async function moveVisibleVerse(id, direction) {
  const ids = Array.from(libraryGrid.querySelectorAll(".customItem")).map(item => item.dataset.id)
  const index = ids.indexOf(id)
  const next = index + direction
  if (index < 0 || next < 0 || next >= ids.length) return
  const [moved] = ids.splice(index, 1)
  ids.splice(next, 0, moved)
  applyVisibleVerseOrder(ids)
  renderLibrary()
  await saveVersesOrderToCloud()
}

function applyVisibleVerseOrder(ids) {
  const idSet = new Set(ids)
  const ordered = ids.map(id => verses.find(v => v.id === id)).filter(Boolean)
  const positions = []
  verses.forEach((verse, index) => {
    if (idSet.has(verse.id)) positions.push(index)
  })
  if (positions.length !== ordered.length) return
  positions.forEach((pos, index) => {
    verses[pos] = ordered[index]
  })
  verses.forEach((verse, index) => { verse.order = index })
}

async function saveVersesOrderToCloud() {
  if (!currentUser) {
    saveLocalLibrary()
    return
  }
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
  small.textContent = currentUser ? "This removes it from your account." : "This removes it from this browser."

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

  if (!ref || !text) {
    manageMsg.textContent = "Please fill in reference and verse text."
    return
  }

  if (!currentUser) {
    verses.push({
      id: localId("verse"),
      title,
      ref,
      version,
      text,
      collection: collectionValue,
      group: groupValue,
      order: verses.length
    })
    saveLocalLibrary()
    manageMsg.textContent = "Saved in this browser."
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
    verses = verses.filter(verse => verse.id !== id)
    saveLocalLibrary()
    await loadVersesFromCloud()
    manageMsg.textContent = "Removed from this browser."
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
    collections = readLocalLibrary().collections
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
    groups = readLocalLibrary().groups
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

  if (!name) {
    collectionMsg.textContent = "Please enter a collection name."
    return
  }

  if (!currentUser) {
    if (!collections.some(item => item.name === name)) {
      collections.push({ id: name, name })
      collections.sort((a, b) => a.name.localeCompare(b.name))
      saveLocalLibrary()
    }
    renderCollectionOptions(name)
    collectionMsg.textContent = "Saved in this browser."
    showPage("library")
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

  if (!parentCollection || parentCollection === "__add_new__") {
    groupMsg.textContent = "Please select a collection first."
    return
  }

  if (!name) {
    groupMsg.textContent = "Please enter a group name."
    return
  }

  if (!currentUser) {
    const docId = parentCollection + "__" + name
    if (!groups.some(item => item.id === docId)) {
      groups.push({ id: docId, name, collection: parentCollection })
      groups.sort((a, b) => a.name.localeCompare(b.name))
      saveLocalLibrary()
    }
    groupSelect.value = name
    groupMsg.textContent = "Saved in this browser."
    showPage("library")
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

  if (!oldName || oldName === "None") {
    manageMsg.textContent = "Please select a collection first."
    return
  }

  if (!currentUser) {
    if (!newName) {
      manageMsg.textContent = "Please enter a new collection name."
      return
    }
    collections = collections.map(item => item.name === oldName ? { id: newName, name: newName } : item)
    groups = groups.map(item => item.collection === oldName ? { ...item, id: newName + "__" + item.name, collection: newName } : item)
    verses = verses.map(item => item.collection === oldName ? { ...item, collection: newName } : item)
    selectedCollectionFilter = newName
    selectedGroupFilter = ""
    saveLocalLibrary()
    hideAllModals()
    await loadVersesFromCloud()
    manageMsg.textContent = "Collection renamed in this browser."
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
    groups = groups.map(item => item.collection === collectionName && item.name === oldName
      ? { id: collectionName + "__" + newName, name: newName, collection: collectionName }
      : item)
    verses = verses.map(item => item.collection === collectionName && item.group === oldName
      ? { ...item, group: newName }
      : item)
    selectedGroupFilter = newName
    saveLocalLibrary()
    hideAllModals()
    await loadVersesFromCloud()
    manageMsg.textContent = "Group renamed in this browser."
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
    if (!collectionName || collectionName === "None") {
      manageMsg.textContent = "Please select a collection first."
      return
    }
    collections = collections.filter(item => item.name !== collectionName)
    groups = groups.filter(item => item.collection !== collectionName)
    verses = verses.map(item => item.collection === collectionName ? { ...item, collection: "None", group: "" } : item)
    selectedCollectionFilter = "None"
    selectedGroupFilter = ""
    saveLocalLibrary()
    hideAllModals()
    await loadVersesFromCloud()
    manageMsg.textContent = "Collection removed from this browser."
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
    if (!collectionName || collectionName === "None") {
      manageMsg.textContent = "Please select a collection first."
      return
    }
    if (!groupName) {
      manageMsg.textContent = "Please select a group first."
      return
    }
    groups = groups.filter(item => !(item.collection === collectionName && item.name === groupName))
    verses = verses.map(item => item.collection === collectionName && item.group === groupName ? { ...item, group: "" } : item)
    selectedGroupFilter = ""
    saveLocalLibrary()
    hideAllModals()
    await loadVersesFromCloud()
    manageMsg.textContent = "Group removed from this browser."
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
  if (!moveVerseId) {
    manageMsg.textContent = "No verse selected."
    return
  }

  const newCollection = moveVerseCollectionSelect.value || "None"
  const newGroup = newCollection === "None" ? "" : (moveVerseGroupSelect.value || "")

  if (!currentUser) {
    verses = verses.map(item => item.id === moveVerseId ? { ...item, collection: newCollection, group: newGroup } : item)
    moveVerseId = ""
    saveLocalLibrary()
    hideAllModals()
    await loadVersesFromCloud()
    manageMsg.textContent = "Verse moved in this browser."
    return
  }

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

function stripBom(text) {
  return String(text || "").replace(/^\uFEFF/, "")
}

function normalizeHeader(header) {
  return stripBom(header)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function headerField(header) {
  const key = normalizeHeader(header)
  if (["ref", "reference", "verse reference", "scripture reference", "citation", "verse ref"].includes(key)) return "ref"
  if (["text", "verse", "verse text", "scripture", "scripture text", "passage", "content", "verse content"].includes(key)) return "text"
  if (["version", "translation", "ver", "bible version"].includes(key)) return "version"
  if (["title", "name", "topic", "memory title"].includes(key)) return "title"
  return ""
}

function detectDelimiter(text) {
  const sample = text.split("\n").slice(0, 8).join("\n")
  const counts = { ",": 0, ";": 0, "\t": 0 }
  let inQuotes = false

  for (let i = 0; i < sample.length; i++) {
    const char = sample[i]
    const next = sample[i + 1]
    if (char === '"') {
      if (inQuotes && next === '"') i += 1
      else inQuotes = !inQuotes
      continue
    }
    if (!inQuotes && counts[char] !== undefined) counts[char] += 1
  }

  if (counts["\t"] > counts[","] && counts["\t"] >= counts[";"]) return "\t"
  if (counts[";"] > counts[","]) return ";"
  return ","
}

function parseCsvRecords(csvText) {
  const text = stripBom(csvText).replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  if (!text.trim()) return []

  const delimiter = detectDelimiter(text)
  const records = []
  let row = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (!inQuotes && char === delimiter) {
      row.push(current.trim())
      current = ""
      continue
    }

    if (!inQuotes && char === "\n") {
      row.push(current.trim())
      if (row.some(cell => cell !== "")) records.push(row)
      row = []
      current = ""
      continue
    }

    current += char
  }

  row.push(current.trim())
  if (row.some(cell => cell !== "")) records.push(row)
  return records
}

function looksLikeReference(value) {
  return /\d+\s*:\s*\d+/.test(String(value || ""))
}

function parseCsvText(csvText) {
  const records = parseCsvRecords(csvText)
  if (records.length === 0) return []

  const mappedHeaders = records[0].map(headerField)
  const hasHeader = mappedHeaders.includes("ref") && mappedHeaders.includes("text")
  const dataRecords = hasHeader ? records.slice(1) : records

  return dataRecords.map(values => {
    const row = { ref: "", version: "", text: "", title: "" }

    if (hasHeader) {
      mappedHeaders.forEach((field, index) => {
        if (field) row[field] = values[index] || ""
      })
      return row
    }

    // No recognized header: ref, version, text, title by position.
    // If column 2 looks like the verse, treat the file as ref, text, title.
    if (values.length >= 3 && !looksLikeReference(values[1]) && looksLikeReference(values[0]) && values[2] && values[1] && values[1].length > 40) {
      row.ref = values[0] || ""
      row.text = values[1] || ""
      row.title = values[2] || ""
      return row
    }

    row.ref = values[0] || ""
    row.version = values[1] || ""
    row.text = values[2] || ""
    row.title = values[3] || ""
    return row
  }).filter(row => row.ref || row.text || row.version || row.title)
}

async function importCsvFile() {
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
      importCsvMsg.textContent = "No valid CSV rows found. Use columns ref, version, text, title."
      return
    }

    const versesToAdd = []

    rows.forEach(row => {
      const ref = (row.ref || "").trim()
      const version = (row.version || "").trim()
      const text = (row.text || "").trim()
      const title = (row.title || "").trim()
      if (!ref || !text) return
      versesToAdd.push({ ref, version, text, title })
    })

    if (versesToAdd.length === 0) {
      importCsvMsg.textContent = "No rows with a reference and verse text were found. Headers can be ref/reference and text/verse."
      return
    }

    if (!currentUser) {
      versesToAdd.forEach((item, idx) => {
        verses.push({
          id: localId("verse"),
          ref: item.ref,
          version: item.version,
          text: item.text,
          title: item.title,
          collection: collectionValue,
          group: groupValue,
          order: verses.length + idx
        })
      })
      saveLocalLibrary()
      await loadVersesFromCloud()
      importCsvMsg.textContent = versesToAdd.length + " verse(s) saved in this browser."
      csvFileInput.value = ""
      return
    }

    const BATCH_LIMIT = 450
    let pending = 0
    let batch = writeBatch(db)

    for (let idx = 0; idx < versesToAdd.length; idx++) {
      const item = versesToAdd[idx]
      const verseRef = doc(collection(db, "users", currentUser.uid, "verses"))

      batch.set(verseRef, {
        ref: item.ref,
        version: item.version,
        text: item.text,
        title: item.title,
        collection: collectionValue,
        group: groupValue,
        order: verses.length + idx,
        createdAt: serverTimestamp()
      })

      pending += 1
      if (pending >= BATCH_LIMIT) {
        await batch.commit()
        batch = writeBatch(db)
        pending = 0
      }
    }

    if (pending > 0) await batch.commit()
    await loadVersesFromCloud()

    importCsvMsg.textContent = versesToAdd.length + " verse(s) imported."
    csvFileInput.value = ""
  } catch (error) {
    console.error("CSV import failed:", error)
    importCsvMsg.textContent = "Failed to import CSV. " + (error && error.message ? error.message : "Check the file and try again.")
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
  showPage("today")
  setTimeout(() => {
    window.scrollTo(0, libraryScrollY)
  }, 0)
})

btnLogin.addEventListener("click", loginWithGoogle)
btnLogout.addEventListener("click", logoutUser)

tabLibrary.addEventListener("click", () => showPage("library"))
if (tabToday) tabToday.addEventListener("click", () => showPage("today"))
const btnOpenLibrary = document.getElementById("btnOpenLibrary")
if (btnOpenLibrary) btnOpenLibrary.addEventListener("click", () => showPage("library"))
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
renderProgress()
showPage("today")
refreshVerses()
loadStats()
loadVersesFromCloud()
registerReminderWorker().then(() => scheduleReminder()).catch(error => console.warn(error))

const reminderTimeInput = document.getElementById("reminderTime")
const btnEnableReminder = document.getElementById("btnEnableReminder")
if (reminderTimeInput) {
  reminderTimeInput.value = readProgress().reminderTime || "20:00"
  reminderTimeInput.addEventListener("change", () => {
    const progress = readProgress()
    progress.reminderTime = reminderTimeInput.value || "20:00"
    saveProgress(progress)
    scheduleReminder()
  })
}
if (btnEnableReminder) btnEnableReminder.addEventListener("click", enableReminders)
