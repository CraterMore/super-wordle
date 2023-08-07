var dictionary

const WORD_LENGTH = 5
const FLIP_ANIMATION_DURATION = 500
const DANCE_ANIMATION_DURATION = 500
const keyboard = document.querySelector("[data-keyboard]")
const alertContainer = document.querySelector("[data-alert-container]")
const guessGrid = document.querySelector("[data-guess-grid]")
const submissionTitle = document.querySelector("[data-game-header]")
const statsWindow = document.getElementById("stats-subwindow")
const loadWindow = document.getElementById("load-subwindow")
const aboutWindow = document.getElementById("about-subwindow")
const scoreOne = document.getElementById("bar1")
const statContainer = document.getElementById("stat-container")
const gamesStat = document.getElementById("games-played")
var targetWord = ""
var openedStats = false
// Date initialization
var dateAPI = new Date()
var dateStart = new Date("06/19/2021")
var today =
  dateAPI.getFullYear() + '-' +
  String(dateAPI.getMonth() + 1).padStart(2, '0') + '-' +
  String(dateAPI.getDate()).padStart(2, '0')
var tomorrow = new Date(dateAPI)
tomorrow.setDate(tomorrow.getDate() + 1)
var tomorrowString =
  tomorrow.getFullYear() + '-' +
  String(tomorrow.getMonth() + 1).padStart(2, '0') + '-' +
  String(tomorrow.getDate()).padStart(2, '0')
var tomorrow2 = new Date(dateAPI)
tomorrow2.setDate(tomorrow2.getDate() + 2)
var tomorrow2String =
  tomorrow2.getFullYear() + '-' +
  String(tomorrow2.getMonth() + 1).padStart(2, '0') + '-' +
  String(tomorrow2.getDate()).padStart(2, '0')
var tomorrow3 = new Date(dateAPI)
tomorrow3.setDate(tomorrow3.getDate() + 3)
var tomorrow3String =
  tomorrow3.getFullYear() + '-' +
  String(tomorrow3.getMonth() + 1).padStart(2, '0') + '-' +
  String(tomorrow3.getDate()).padStart(2, '0')
var daysSince = Math.floor((dateAPI.getTime() - dateStart.getTime()) / (1000 * 3600 * 24))
var author = null;
var dbInfo = {
    "1": [],
    "2": [
        "2023-07-06",
        "2023-08-03"
    ],
    "3": [
        "2023-05-30",
        "2023-06-02",
        "2023-06-12",
        "2023-06-14",
        "2023-06-18",
        "2023-06-20",
        "2023-07-03",
        "2023-07-07",
        "2023-07-15",
        "2023-07-31",
        "2023-08-05"
    ],
    "4": [
        "2023-06-08",
        "2023-06-09",
        "2023-06-11",
        "2023-06-13",
        "2023-06-17",
        "2023-06-19",
        "2023-06-22",
        "2023-06-27",
        "2023-06-29",
        "2023-06-30",
        "2023-07-02",
        "2023-07-04",
        "2023-07-19",
        "2023-07-20",
        "2023-07-24",
        "2023-07-30",
        "2023-08-02",
        "2023-08-07"
    ],
    "5": [
        "2023-06-01",
        "2023-06-04",
        "2023-06-07",
        "2023-06-10",
        "2023-06-16",
        "2023-06-21",
        "2023-06-24",
        "2023-06-28",
        "2023-08-04",
        "2023-08-06"
    ],
    "6": [
        "2023-06-03",
        "2023-06-15",
        "2023-06-23",
        "2023-07-01",
        "2023-07-05",
        "2023-07-16"
    ],
    "gamesPlayed": 51,
    "lastPlay": [
        "2023-08-07",
        "could",
        "sport",
        "broke",
        "brook"
    ]
}
score = "";

loadGame()

// Setup game progress on board
function setupBoard(dbInfo) {
  updateStats(dbInfo)
  startInteraction()
  
  loadWindow.close()
}

// Get dictionary, player info, set target word
async function loadGame() {
  loadWindow.showModal()
  setTimeout(() => {
    loadWindow.lastElementChild.style.visibility = "visible";
  }, "4000")
  //var userInfo = await getUserInfo()
  //var ID = userInfo.id
  dictRes = await fetch("/api/dictionary", {method: "GET"})
  dictionary = await dictRes.json()
  await getTargetWord()
  setupBoard()
}

// Updates statistics panel
async function updateStats() {
  var maxLength = 0;
  for (let i = 1; i <= 6; i++) {
    var currentLen = dbInfo[i.toString()].length
    if (currentLen > maxLength) {
      maxLength = currentLen;
    }
  }
  if (maxLength == 0) {
    maxLength = 1;
  }

  if (!statsWindow.open) {
    statsWindow.showModal()
  }
  var statFontSize = ((scoreOne.offsetHeight * 0.9).toString()) + "px"
  for (const child of statContainer.children) {
    child.lastElementChild.lastElementChild.style["font-size"] = statFontSize
    child.firstElementChild.style["font-size"] = statFontSize
  }
  
  var cleanWidth = scoreOne.offsetWidth
  var graphMinPercent = cleanWidth / scoreOne.parentElement.offsetWidth * 100;
  if (!openedStats) {
    statsWindow.close()
  }
  var score = 1
  for (const child of statContainer.children) {
    if (dbInfo[score.toString()].includes(today)) {
      child.lastElementChild.lastElementChild.style["background-color"] = "hsl(115, 29%, 43%)";
    }
    child.lastElementChild.lastElementChild.innerHTML = dbInfo[score.toString()].length.toString()
    child.lastElementChild.lastElementChild.style.width = (graphMinPercent + ((dbInfo[score.toString()].length / maxLength) * (100 - graphMinPercent))).toString() + "%";
    score++;
  }
  gamesStat.innerHTML = "Games Played: " + dbInfo["gamesPlayed"]
  return
}

// Sets game header text
function setSubmitterTitle(author) {
  const title = document.createElement("div")
  title.innerHTML = "Today's word is from <b>" + author + "</b>"
  title.classList.add("submitter")
  if (author != "the New York Times") {
    title.style["background-image"] = "var(--gradient)"
    //title.style["background-size"] = "300%"
    //title.style["background-position"] = "left"
    //title.style.animation = "animateAuthor 3s infinite"
  }
  submissionTitle.prepend(title)
}

// Set target word
async function getTargetWord() {
  const submitted = Math.random() < 0.5

  if (!submitted) {
    const res = await fetch("/api/solution?today=" + today)
    const body = await res.json();

    targetWord = body.solution
    setSubmitterTitle("the New York Times")
  } else {
    targetWord = "acorn"
    author = "Jane"
    setSubmitterTitle(author)
  }
    
  setTimeout(() => {
    showAlert("Have a word in mind? There are no words submitted for the next three days!", 6000)
  }, "10000")
  setTimeout(() => {
    showAlert("You're playing a demo of Your Wordle. Your data will not be saved!", 5000)
  }, "2000")
  return
}

// Input managers
// -------------------------
function startInteraction() {
  document.addEventListener("click", handleMouseClick)
  document.addEventListener("keydown", handleKeyPress)
}

function stopInteraction() {
  document.removeEventListener("click", handleMouseClick)
  document.removeEventListener("keydown", handleKeyPress)
}

function handleMouseClick(e) {
  if (e.target.matches("[data-key]")) {
    pressKey(e.target.dataset.key)
    return
  }

  if (e.target.matches("[data-enter]")) {
    submitGuess()
    return
  }

  if (e.target.matches("[data-delete]")) {
    deleteKey()
    return
  }
}

function handleKeyPress(e) {
  if (e.key === "Enter") {
    submitGuess()
    return
  }

  if (e.key === "Backspace" || e.key === "Delete") {
    deleteKey()
    return
  }

  if (e.key.match(/^[a-z]$/)) {
    pressKey(e.key)
    return
  }
}

// Key Press Actions
// -------------------------
function pressKey(key) {
  const activeTiles = getActiveTiles()
  if (activeTiles.length >= WORD_LENGTH) return
  const nextTile = guessGrid.querySelector(":not([data-letter])")
  nextTile.dataset.letter = key.toLowerCase()
  nextTile.textContent = key
  nextTile.dataset.state = "active"
  return;
}

function deleteKey() {
  const activeTiles = getActiveTiles()
  const lastTile = activeTiles[activeTiles.length - 1]
  if (lastTile == null) return
  lastTile.textContent = ""
  delete lastTile.dataset.state
  delete lastTile.dataset.letter
}

// Functionality for submitting guess, and results
function submitGuess() {
  const activeTiles = [...getActiveTiles()]
  if (activeTiles.length !== WORD_LENGTH) {
    showAlert("Not enough letters")
    shakeTiles(activeTiles)
    return
  }

  const guess = activeTiles.reduce((word, tile) => {
    return word + tile.dataset.letter
  }, "")

  if (!dictionary.includes(guess)) {
    showAlert("Not in word list")
    shakeTiles(activeTiles)
    return
  }

  stopInteraction()
  activeTiles.forEach((...params) => flipTile(...params, guess))
  return
}

// Guess analysis
function assignGuessTiles(index, letter, tile, key, guess) {
  if (targetWord[index] === letter) {
    tile.dataset.state = "correct"
    key.classList.add("correct")
  } else if (targetWord.includes(letter)) {
    var wrong_loc = true
    for (let i = 0; i < 5; i++) {
      if ((targetWord[i] === guess[i]) && (guess[i] === letter)) {
        wrong_loc = false
      } else if (targetWord[i] === letter) {
        wrong_loc = true
        break
      }
    }
    if (wrong_loc) {
      tile.dataset.state = "wrong-location"
      key.classList.add("wrong-location")
    } else {
      tile.dataset.state = "wrong"
      key.classList.add("wrong")
    }
  } else {
    tile.dataset.state = "wrong"
    key.classList.add("wrong")
  }
}

// Continuation of submit guess, flip tiles accordingly
function flipTile(tile, index, array, guess) {
  const letter = tile.dataset.letter
  const key = keyboard.querySelector(`[data-key="${letter}"i]`)
  setTimeout(() => {
    tile.classList.add("flip")
  }, (index * FLIP_ANIMATION_DURATION) / 2)

  tile.addEventListener(
    "transitionend",
    () => {
      tile.classList.remove("flip")
      assignGuessTiles(index, letter, tile, key, guess)

      if (index === array.length - 1) {
        tile.addEventListener(
          "transitionend",
          () => {
            startInteraction()
            checkWinLose(guess, array)
            //console.log("Checking win loss")
          },
          { once: true }
        )
      }
    },
    { once: true }
  )
  //console.log("Finished running flip tiles")
  return
}

// Returns int of how many letters are in the guess box so far
function getActiveTiles() {
  return guessGrid.querySelectorAll('[data-state="active"]')
}

// Open stats window, display data
function openStats() {
  openedStats = true
  stopInteraction()
  if (score != "") {
    statsWindow.querySelector("#share").style.visibility = "visible";
  }
  statsWindow.showModal()
}

// Close stats window, restore interaction
function closeStats() {
  openedStats = false
  statsWindow.close()
  if (score == "") {
    startInteraction()
  }
}

// Open about window
function openAbout() {
  stopInteraction()
  aboutWindow.showModal()
}

// Close about window
function closeAbout() {
  aboutWindow.close()
}

// Generate sharable score and copy to clipboard
function generateScore(win, tilesLeft) {
  var output = "";
  // Get puzzle number
  output = output + "Wordle " + daysSince + " "
  // Get score out of 6
  if (win == false) {
    output = output + "X/6\n"
  } else {
    const score = 6 - (tilesLeft.length / 5)
    output = output + score + "/6\n"
  }
  // Get author if applicable
  if (author) {
    output = output + "Author: " + author + "\n";
  }
  output = output + "\n"
  // Get tile colors
  const tiles = guessGrid.children
  for (let i = 0; i < tiles.length; i++) {
    if (i % 5 == 0 && i != 0) {
      output = output + '\n'
    }
    if (tiles[i].dataset.state == "wrong") {
      output = output + "⬛️";
    }
    else if (tiles[i].dataset.state == "wrong-location") {
      output = output + "🟨"
    }
    else if (tiles[i].dataset.state == "correct") {
      output = output + "🟩"
    } else {
      break;
    }
  }
  score = output.trimEnd()
}

function copyScore() {
  if (!navigator.canShare) {
    //navigator.permissions.query({name:'clipboard'})
    navigator.clipboard.writeText(score)
  } else if (navigator.canShare({ text: score }) == true) {
    navigator.share({ text: score})
  } else {
    //navigator.permissions.query({name:'clipboard'})
    navigator.clipboard.writeText(score)
  }
  showAlert("Score Copied to Clipboard", 5000)
}

// Displays alert panel with customizable message
function showAlert(message, duration = 1000) {
  const alert = document.createElement("div")
  alert.textContent = message
  alert.classList.add("alert")
  alertContainer.prepend(alert)
  if (duration == null) return

  setTimeout(() => {
    alert.classList.add("hide")
    alert.addEventListener("transitionend", () => {
      alert.remove()
    })
  }, duration)
}

// Incorrect shake animation
function shakeTiles(tiles) {
  tiles.forEach(tile => {
    tile.classList.add("shake")
    tile.addEventListener(
      "animationend",
      () => {
        tile.classList.remove("shake")
      },
      { once: true }
    )
  })
}

// Game end functionality
function checkWinLose(guess, tiles) {
  const remainingTiles = guessGrid.querySelectorAll(":not([data-letter])")
  if (guess === targetWord) {
    showAlert("You Win", 5000)
    danceTiles(tiles)
    stopInteraction()
    generateScore(true, remainingTiles)
    updateStats()
    openStats()
    return
  }

  if (remainingTiles.length === 0) {
    showAlert(targetWord.toUpperCase(), 10000)
    stopInteraction()
    generateScore(false, remainingTiles)
    updateStats()
    openStats()
  }
}

// Word reveal animation
function danceTiles(tiles) {
  tiles.forEach((tile, index) => {
    setTimeout(() => {
      tile.classList.add("dance")
      tile.addEventListener(
        "animationend",
        () => {
          tile.classList.remove("dance")
        },
        { once: true }
      )
    }, (index * DANCE_ANIMATION_DURATION) / 5)
  })
}