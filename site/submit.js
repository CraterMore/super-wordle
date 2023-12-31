const date_selector = document.getElementById('date-box')
const word_box = document.getElementById('word-box')
const submitButton = document.getElementById('submit-button')
const author_box = document.getElementById('author-box')
const alertContainer = document.querySelector("[data-alert-container]")

/*var dateAPI = new Date()
var minSubmit =
  dateAPI.getFullYear() + '-' +
  String(dateAPI.getMonth() + 1).padStart(2, '0') + '-' +
  String(dateAPI.getDate() + 1).padStart(2, '0')
var maxSubmit =
  dateAPI.getFullYear() + '-' +
  String(dateAPI.getMonth() + 1).padStart(2, '0') + '-' +
  String(dateAPI.getDate() + 8).padStart(2, '0')*/

//checkAuth()

// Check if user is authenticated, else redirect home
/*async function checkAuth() {
  try {
    var dbInfo;
    const dbRes = await fetch("/api/db", {
      method: "POST"
    })
    dbInfo = await dbRes.json()
  } catch {
    window.location.replace("https://wordle-family.cartermoore4.repl.co");
  }
}*/

// Try Submitting
// -------------------------
function submitWord() {
  submitButton.disabled = true
  var word = word_box.value
  var rawDate
  var puzzleDate
  try {
    rawDate = $("#date-box").datepicker("getDate")
    puzzleDate = rawDate.toISOString().substring(0,10)
  } catch {
    alert("You must choose a date to continue.")
    submitButton.disabled = false
    return
  }
  var author = author_box.value

  if (word.length != 5) {
    alert("Word must be 5 letters in length.")
  } else if (author.length <= 2) {
    alert("Name must be 3 characters or more.")
  } else if (author.length > 30) {
    alert("Name must be less than 30 characters.")
  } else {
    writeSubmission(puzzleDate, word, author)
  }
  submitButton.disabled = false
}

async function checkIfTarget(word) {
  var res = await fetch("/api/targetWords", {
    method: 'GET',})
  var data = await res.json()
  
  if (!(data.includes(word.toLowerCase()))) {
    if (confirm("The word you're trying to submit is either the plural form of a word, profane, or otherwise uncommon. Are you sure you want to submit?") == false) {
      return false;
    } else {
      return true;
    }
  } else {
    return true;
  }
}

// Submit Words
// -------------------------
async function writeSubmission (date, word, author) {
  isTarget = await checkIfTarget(word)
  if (!isTarget) {return}
  
  var sub = {}
  sub.date = date
  sub.word_name = [word.toLowerCase(), author]

  await fetch("/writePuzzle", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(sub)
  }).then(response => response.json())
  .then(data => alert(data))
  return
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
  return
}