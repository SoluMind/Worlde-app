// Select all letter elements and the loading div from the DOM
const letters = document.querySelectorAll(".scoreboard-letter");
const loadingDiv = document.querySelector(".info-bar");

// Constants for the game
const ANSWER_LENGTH = 5; // Number of letters in the word
const ROUNDS = 6; // Number of allowed guesses

// Global variables to track game state
let currentGuess = ""; // Stores the current guess being typed
let currentRow = 0; // Tracks the current row being used
let isLoading = true; // Tracks if the game is in a loading state
let done = false; // Tracks if the game is over
let word = ""; // Stores the target word
let wordParts = []; // Stores the target word as an array of letters

// Function to add a letter to the current guess
function addLetter(letter) {
  if (currentGuess.length < ANSWER_LENGTH) {
    currentGuess += letter; // Add the letter to the current guess
    // Update the corresponding letter element in the DOM
    letters[ANSWER_LENGTH * currentRow + currentGuess.length - 1].innerText = letter;
  }
}

// Function to validate and process the current guess
async function commit() {
  try {
    // If the current guess is not complete, do nothing
    if (currentGuess.length !== ANSWER_LENGTH) return;

    // Set loading state to true and show the loading spinner
    isLoading = true;
    setLoading(true);

    // Validate the word using the API
    const res = await fetch("https://words.dev-apis.com/validate-word", {
      method: "POST",
      body: JSON.stringify({ word: currentGuess }),
    });
    const resFromApiValidWord = await res.json();
    const validWord = resFromApiValidWord.validWord; // Check if the word is valid

    // Hide the loading spinner and set isLoading to false
    isLoading = false;
    setLoading(false);
    // If the word is invalid, mark it as invalid and return
    if (!validWord) {
      markInvalidWord();
      return;
    }

    // Split the current guess into an array of letters
    const guessParts = currentGuess.split("");
    // Create a frequency map of letters in the target word
    const map = makeMap(wordParts);

    // First pass: Mark correct letters
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      if (guessParts[i] === wordParts[i]) {
        // Add the "correct" class to the letter
        letters[currentRow * ANSWER_LENGTH + i].classList.add("correct");
        map[guessParts[i]]--; // Decrement the count in the frequency map
      }
    }

    // Second pass: Mark close or wrong letters
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      if (guessParts[i] === wordParts[i]) {
        continue; // Skip if the letter is already marked as correct
      }
      if (map[guessParts[i]] > 0) {
        // Add the "close" class if the letter is in the word but in the wrong position
        letters[currentRow * ANSWER_LENGTH + i].classList.add("close");
        map[guessParts[i]]--; // Decrement the count in the frequency map
      } else {
        // Add the "wrong" class if the letter is not in the word
        letters[currentRow * ANSWER_LENGTH + i].classList.add("wrong");
      }
    }

    // Move to the next row
    currentRow++;

    // Check if the player has won or lost
    if (currentGuess === word) {
      showResultModal("You win!"); // Show win message
      document.querySelector(".brand").classList.add("winner"); // Add winner class to the brand
      done = true; // End the game
      return;
    } else if (currentRow === ROUNDS) {
      showResultModal(`You lose! The word was ${word}`); // Show lose message
      done = true; // End the game
    }



    // Reset the current guess for the next round
    currentGuess = "";
  } catch (error) {
    // Handle any errors that occur during the commit process
    console.error("Error in commit function:", error);
    setLoading(false); // Ensure loading spinner is hidden
    showResultModal("An error occurred. Please try again."); // Show error message to the user
  }
}

// Function to handle backspace (remove the last letter)
function backspace() {
  try {
    if (currentGuess.length > 0) {
      currentGuess = currentGuess.substring(0, currentGuess.length - 1); // Remove the last letter
      // Clear the corresponding letter element in the DOM
      letters[ANSWER_LENGTH * currentRow + currentGuess.length].innerText = "";
    }
  } catch (error) {
    console.error("Error in backspace function:", error);
  }
}

// Function to mark the current guess as invalid
function markInvalidWord() {
  try {
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      // Remove the "invalid" class (if it exists) and trigger reflow to restart the animation
      letters[currentRow * ANSWER_LENGTH + i].classList.remove("invalid");
      void letters[currentRow * ANSWER_LENGTH + i].offsetWidth; // Trigger reflow
      // Add the "invalid" class to show the animation
      letters[currentRow * ANSWER_LENGTH + i].classList.add("invalid");
    }
  } catch (error) {
    console.error("Error in markInvalidWord function:", error);
  }
}

// Function to show a result modal with a message
function showResultModal(message) {
  // Create the modal container
  const modal = document.createElement("div");
  modal.classList.add("modal");

  // Create the modal content
  modal.innerHTML = `
    <div class="modal-content">
      <h2>🎉 ${message} 🎉</h2>
      <p>You did an amazing job!</p>
      <button onclick="location.reload()">Play Again</button>
    </div>
  `;

  // Append the modal to the body
  document.body.appendChild(modal);

  // Add confetti effect if the player wins
  if (message.includes("win")) {
    confetti({
      particleCount: 100, // Number of confetti particles
      spread: 70, // How far the particles spread
      origin: { y: 0.6 }, // Start from the middle of the screen
    });
  }

  // Close modal when clicking outside the modal content
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.remove();
    }
  });
}

// Function to check if a character is a valid letter
function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

// Function to show or hide the loading spinner
function setLoading(isLoading) {
  try {
    loadingDiv.classList.toggle("hidden", !isLoading); // Toggle the hidden class
    loadingDiv.innerHTML = isLoading
      ? '<div class="spinner"></div> Loading...' // Show loading spinner
      : ""; // Clear the loading message
  } catch (error) {
    console.error("Error in setLoading function:", error);
  }
}

// Function to create a frequency map of letters in an array
function makeMap(array) {
  const obj = {};
  for (let i = 0; i < array.length; i++) {
    const letter = array[i];
    if (obj[letter]) {
      obj[letter]++; // Increment the count if the letter exists
    } else {
      obj[letter] = 1; // Initialize the count if the letter is new
    }
  }
  return obj;
}

// Handle virtual keyboard input
const virtualKeyboard = document.querySelector(".virtual-keyboard");
virtualKeyboard.addEventListener("click", (event) => {
  try {
    if (event.target.tagName === "BUTTON") {
      const key = event.target.getAttribute("data-key");
      if (key === "ENTER") {
        commit();
      } else if (key === "BACKSPACE") {
        backspace();
      } else if (isLetter(key)) {
        addLetter(key);
      }
    }
  } catch (error) {
    console.error("Error in virtual keyboard event listener:", error);
  }
});

// Initialize the game
async function init() {
  try {
    // Fetch the word of the day from the API
    const res = await fetch("https://words.dev-apis.com/word-of-the-day?random=1");
    const resObject = await res.json();
    word = resObject.word.toUpperCase(); // Convert the word to uppercase
    console.log("The word is:", word); // Log the word here
    wordParts = word.split(""); // Split the word into an array of letters
    setLoading(false); // Hide the loading spinner
    isLoading = false; // Set loading state to false

    // Handle physical keyboard input
    document.addEventListener("keydown", function handleKeyPress(event) {
      try {
        if (done || isLoading) return;

        const action = event.key;
        if (action === "Enter") {
          commit();
        } else if (action === "Backspace") {
          backspace();
        } else if (isLetter(action)) {
          addLetter(action.toUpperCase());
        }
      } catch (error) {
        console.error("Error in keydown event listener:", error);
      }
    });
  } catch (error) {
    console.error("Error in init function:", error);
    showResultModal("Failed to load the game. Please try again."); // Show error message to the user
  }
}

// Start the game
init();