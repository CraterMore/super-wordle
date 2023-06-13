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

// Try Submitting
// -------------------------
function submitWord() {
  console.log("Attempted submission from button press")
  submitButton.disabled = true
  var word = word_box.value
  var rawDate = $("#date-box").datepicker("getDate")
  const puzzleDate = rawDate.toISOString().substring(0,10)
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

// Submit Words
// -------------------------
function writeSubmission (date, word, author) {
  
  var sub = {}
  sub.date = date
  sub.word_name = [word.toLowerCase(), author]

  fetch("/writePuzzle", {
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