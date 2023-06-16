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
// Date initialization
var dateAPI = new Date()
var dateStart = new Date("06/19/2021")
var today =
  dateAPI.getFullYear() + '-' +
  String(dateAPI.getMonth() + 1).padStart(2, '0') + '-' +
  String(dateAPI.getDate()).padStart(2, '0')
var daysSince = Math.floor((dateAPI.getTime() - dateStart.getTime()) / (1000 * 3600 * 24))
var author = null;
score = "";

loadGame()

// Setup game progress on board
function setupBoard(dbInfo) {
  if ((dbInfo.lastPlay.length == 0) || (dbInfo.lastPlay[0] != today)) {
    updateStats(dbInfo)
    startInteraction()
  } else {
    for (let i = 1; i < dbInfo.lastPlay.length; i++) {
      for (let a = 0; a < dbInfo.lastPlay[i].length; a++) {
        pressKey(dbInfo.lastPlay[i].charAt(a))
      }
      submitQuick()
    }
    // TODO -> Set statistics info
    if (score == "") {
      updateStats(dbInfo)
      startInteraction()
    }
  }
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
  var dbInfo;
  const dbRes = await fetch("/api/db", {
    method: "POST"
  })
  dbInfo = await dbRes.json()
  await getTargetWord(dbInfo)
  setupBoard(dbInfo)
}

// Updates statistics panel
async function updateStats(dbInfo) {
  if (!dbInfo) {
    dbInfo = await getUserInfo()
  }
  
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

  statsWindow.showModal()
  var statFontSize = ((scoreOne.offsetHeight * 0.9).toString()) + "px"
  for (const child of statContainer.children) {
    child.lastElementChild.lastElementChild.style["font-size"] = statFontSize
    child.firstElementChild.style["font-size"] = statFontSize
  }
  
  var cleanWidth = scoreOne.offsetWidth
  var graphMinPercent = cleanWidth / scoreOne.parentElement.offsetWidth * 100;
  statsWindow.close()
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
async function getTargetWord(dbInfo) {
  const res = await fetch("/api/solution?today=" + today)
  const body = await res.json();

  const subRes = await fetch("/api/submissions");
  const subBody = await subRes.json()

  if (subBody[today]) {
    var userRes = await fetch("/api/getID", {
      method: "POST"
    })
    var userID = await userRes.json()
    if (subBody[today][2] == userID.id) {
      targetWord = body.solution
      setSubmitterTitle("the New York Times")
      showAlert("You submitted today's word. Here is the normal daily word instead!", 6000)
      return
    } else {
      targetWord = subBody[today][0];
      author = subBody[today][1];
      setSubmitterTitle(subBody[today][1])
    }
  } else {
    targetWord = body.solution
    setSubmitterTitle("the New York Times")
  }
  return
}

// Get database info on user
async function getUserInfo() {
  var dbInfo;
  const dbRes = await fetch("/api/db", {
    method: "POST"
  })
  dbInfo = await dbRes.json()
  return dbInfo
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
  postGuess(guess)
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

// Quick submit for game loading
function submitQuick() {
  const activeTiles = [...getActiveTiles()]
  const guess = activeTiles.reduce((word, tile) => {
    return word + tile.dataset.letter
  }, "")
  activeTiles.forEach((...params) => flipQuick(...params, guess))
  return
}

// flipTile but quick for game loading
function flipQuick(tile, index, array, guess) {
  const letter = tile.dataset.letter
  const key = keyboard.querySelector(`[data-key="${letter}"i]`)

    assignGuessTiles(index, letter, tile, key, guess)

    if (index === array.length - 1) {
      checkWinLose(guess, array)
    }
  //console.log("Finished running flip tiles")
  return
}

// Returns int of how many letters are in the guess box so far
function getActiveTiles() {
  return guessGrid.querySelectorAll('[data-state="active"]')
}

// Open stats window, display data
function openStats() {
  stopInteraction()
  if (score != "") {
    statsWindow.querySelector("#share").style.visibility = "visible";
  }
  statsWindow.showModal()
}

// Close stats window, restore interaction
function closeStats() {
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

// Logout current user
function logoutUser() {
  fetch("/api/logout", {
    method: 'POST',
  })
  alert("Please refresh the page to continue.")
  return
}

// Update user db info to save game progress
function postGuess (guess) {
  fetch("/writeGameProgress", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({"word": guess, "target": targetWord, "date": today})
  })
  return
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
    updateStats(null)
    openStats()
    return
  }

  if (remainingTiles.length === 0) {
    showAlert(targetWord.toUpperCase(), 10000)
    stopInteraction()
    generateScore(false, remainingTiles)
    updateStats(null)
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