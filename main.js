const keys = document.querySelectorAll(".key");
const displayInput = document.querySelector(".display .input");
const displayOutput = document.querySelector(".display .output");
const warningFlag = document.getElementById("warningFlag");
const successflag = document.getElementById("successFlag");
let historyIsOpen = false;

const historyContainer = document.querySelector(".history-container");
const historyList = document.getElementById("historyList");
const historyToggle = document.getElementById("historyToggle");
let history = JSON.parse(localStorage.getItem("calcHistory")) || [];

function displayHistory() {
  historyList.innerHTML = history
	.map((entry) => `<li>${entry}</li>`)
	.join("");
}

document.getElementById("clearHistory").addEventListener("click", () => {
  history = [];
  localStorage.removeItem("calcHistory");
  historyList.innerHTML = "";
  successflag.innerText = "History cleared!";
  successflag.classList.add("show");

  setTimeout(() => {
	successflag.classList.remove("show");
  }, 2000);
});

function saveToHistory(entry) {
  history.push(entry);
  localStorage.setItem("calcHistory", JSON.stringify(history));
  displayHistory();
}

historyToggle.addEventListener("click", () => {
  historyIsOpen = !historyIsOpen;
  historyContainer.classList.toggle("show", historyIsOpen);
  if (historyIsOpen) {
	displayHistory();
  }
});

let input = "";
let lastResult = null;

function handleInput(value) {
  switch (value) {
	case "clear":
	  input = "";
	  lastResult = null;
	  displayInput.innerHTML = "";
	  displayOutput.innerHTML = "";
	  break;
	case "backspace":
	  input = input.slice(0, -1);
	  displayInput.innerHTML = cleanInput(input);
	  adjustFontSize(displayInput, input);
	  if (input.length == 0) {
		displayOutput.innerHTML = "";
	  }
	  break;
	case "=":
	  showLoadingSpinner();
	  disableButtons();
	  setTimeout(() => {
		let result = evaluateExpression(input);
		if (result !== "") {
		  lastResult = result;
		  const cleanedResult = cleanOutput(result);
		  const fontSize =
			cleanedResult.length > 28
			  ? "0.75rem"
			  : cleanedResult.length > 20
			  ? "1rem"
			  : cleanedResult.length > 15
			  ? "1.5rem"
			  : "2rem";

		  displayOutput.innerHTML = `
			<hr class="separator">
			<div class="outputline">
			  <p class="equal-sign">=</p>
			  <p class="result fade-in" style="font-size: ${fontSize};">${cleanedResult}</p>
			</div>
		  `;
		  saveToHistory(`${input} = ${cleanedResult}`);
		}
		enableButtons();
	  }, 300);
	  break;
	case "brackets":
	  handleBrackets();
	  break;
	default:
	  if (validateInput(value)) {
		if (lastResult !== null && input === "") {
		  input = lastResult.toString();
		  lastResult = null;
		}
		input += value;
		displayInput.innerHTML = cleanInput(input);
		adjustFontSize(displayInput, input);
		displayOutput.innerHTML = "";
		displayOutput.classList.remove("fade-in");
	  }
  }
}

for (let key of keys) {
  const value = key.dataset.key;
  key.addEventListener("click", () => handleInput(value));
}

document.addEventListener("keydown", (event) => {
  const key = event.key;
  let mappedKey;

  if (!isNaN(key) || key === ".") mappedKey = key;
  else if (key === "Enter") mappedKey = "=";
  else if (key === "Backspace") mappedKey = "backspace";
  else if (key === "Escape") mappedKey = "clear";
  else if (["+", "-", "*", "/", "%"].includes(key)) mappedKey = key;
  else if (["(", ")"].includes(key)) mappedKey = "brackets";

  if (mappedKey) handleInput(mappedKey);
  event.preventDefault();
});

function adjustFontSize(element, text) {
  const fontSize =
	text.length > 28
	  ? "0.75rem"
	  : text.length > 20
	  ? "1rem"
	  : text.length > 15
	  ? "1.5rem"
	  : "2rem";
  element.style.fontSize = fontSize;
}

function showLoadingSpinner() {
  displayOutput.innerHTML = `
	<hr class="separator">
	<div class="outputline">
	  <p class="equal-sign">=</p>
	  <div class="spinner"></div>
	</div>
  `;
}

function disableButtons() {
  keys.forEach((key) => key.classList.add("disabled"));
}

function enableButtons() {
  keys.forEach((key) => key.classList.remove("disabled"));
}

function evaluateExpression(input) {
  try {
	input = prepareInput(input);
	return eval(input);
  } catch {
	showWarning("Invalid input! Please check your expression.");
	return "";
  }
}

function cleanInput(input) {
  return input.replace(/\*/g, `x`).replace(/\//g, `÷`);
}

function cleanOutput(output) {
  if (typeof output !== "number") return "";
  return output.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function prepareInput(input) {
  return input.replace(/(\d+(\.\d+)?)%/g, (match, p1) => `${p1} * 0.01`);
}

function validateInput(value) {
  const lastInput = input.slice(-1);
  const operators = ["+", "-", "*", "/"];

  if (value === "." && lastInput === ".") {
	showWarning("Invalid decimal point placement.");
	return false;
  }

  if (operators.includes(value) && operators.includes(lastInput)) {
	showWarning("Cannot place two operators consecutively.");
	return false;
  }

  return true;
}

function handleBrackets() {
  const openBrackets = (input.match(/\(/g) || []).length;
  const closeBrackets = (input.match(/\)/g) || []).length;
  input += openBrackets > closeBrackets ? ")" : "(";
  displayInput.innerHTML = cleanInput(input);
}

function showWarning(message) {
  displayOutput.innerHTML = "";
  warningFlag.innerText = message;
  warningFlag.classList.add("show");

  setTimeout(() => {
	warningFlag.classList.remove("show");
  }, 2000);
}