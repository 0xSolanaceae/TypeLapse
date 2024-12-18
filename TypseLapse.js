// ==UserScript==
// @name         TypeLapse
// @namespace    https://solanaceae.xyz/
// @version      1.1
// @description  Simulates slow, natural typing to automatically generate content in Google Docs over time
// @author       Solanaceae
// @match        https://docs.google.com/*
// @icon         https://raw.githubusercontent.com/0xSolanaceae/TypeLapse/refs/heads/main/assets/favicon/favicon.svg
// ==/UserScript==

if (window.location.href.includes("docs.google.com/document/d") || window.location.href.includes("docs.google.com/presentation/d")) {
  console.log("Document opened and viewed.");

  const TypeLapseButton = createButton("TypeLapse", "type-lapse-button");
  const stopButton = createButton("Stop", "stop-button", "red");
  stopButton.style.display = "none";

  const helpMenu = document.getElementById("docs-help-menu");
  helpMenu.parentNode.insertBefore(TypeLapseButton, helpMenu);
  TypeLapseButton.parentNode.insertBefore(stopButton, TypeLapseButton.nextSibling);

  let cancelTyping = false;
  let typingInProgress = false;
  let lowerBoundValue = 60;
  let upperBoundValue = 80;

  TypeLapseButton.addEventListener("click", async () => {
      if (typingInProgress) {
          console.log("Typing in progress, please wait...");
          return;
      }

      cancelTyping = false;
      stopButton.style.display = "none";

      const { userInput } = await showOverlay();

      if (userInput !== "") {
          const input = document.querySelector(".docs-texteventtarget-iframe").contentDocument.activeElement;
          typeStringWithRandomDelay(input, userInput);
      }
  });

  stopButton.addEventListener("click", () => {
      cancelTyping = true;
      stopButton.style.display = "none";
      console.log("Typing cancelled");
  });

  function createButton(text, id, color = "black") {
      const button = document.createElement("div");
      button.textContent = text;
      button.classList.add("menu-button", "goog-control", "goog-inline-block");
      button.style.userSelect = "none";
      button.style.color = color;
      button.style.cursor = "pointer";
      button.style.transition = "color 0.3s";
      button.id = id;
      return button;
  }

  async function showOverlay() {
    const existingOverlay = document.getElementById("type-lapse-overlay");
    if (existingOverlay) {
        document.body.removeChild(existingOverlay);
        return;
    }

    const overlay = document.createElement("div");
    overlay.id = "type-lapse-overlay";
    overlay.style = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgb(255, 255, 255);
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 320px;
    `;

    let isDragging = false;
    let offsetX, offsetY;

    overlay.addEventListener("mousedown", (e) => {
        if (e.target === overlay) {
            isDragging = true;
            offsetX = e.clientX - overlay.getBoundingClientRect().left;
            offsetY = e.clientY - overlay.getBoundingClientRect().top;
        }
    });

    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            overlay.style.left = `${e.clientX - offsetX}px`;
            overlay.style.top = `${e.clientY - offsetY}px`;
            overlay.style.transform = "none";
        }
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
    });

    const closeButton = document.createElement("button");
    closeButton.textContent = "X";
    closeButton.style = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
    `;
    closeButton.addEventListener("click", () => {
        document.body.removeChild(overlay);
    });

    const heading = document.createElement("h2");
    heading.textContent = "TypeLapse";
    heading.style = `
        margin-bottom: 15px;
        font-size: 24px;
        color: #333;
    `;

    const textField = document.createElement("textarea");
    textField.rows = "5";
    textField.cols = "40";
    textField.placeholder = "Enter your text...";
    textField.style = `
        margin-bottom: 10px;
        width: 100%;
        padding: 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        resize: vertical;
    `;

    const description = document.createElement("p");
    description.textContent = "Keep this tab open; otherwise, the script will pause and resume when you return. Each character has a random typing delay between the lower (min) and upper (max) bounds in milliseconds. Lower values are faster.";
    description.style = `
        font-size: 14px;
        margin-bottom: 15px;
    `;

    const randomDelayLabel = document.createElement("div");
    randomDelayLabel.style.marginBottom = "5px";

    const lowerBoundLabel = createLabel("Lower Bound (ms): ", lowerBoundValue);
    const upperBoundLabel = createLabel("Upper Bound (ms): ", upperBoundValue);

    const confirmButton = document.createElement("button");
    confirmButton.textContent = "Cancel";
    confirmButton.style = `
        padding: 8px 16px;
        background-color: #4d82f4;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: background-color 0.3s;
    `;

    overlay.append(closeButton, heading, description, textField, randomDelayLabel, lowerBoundLabel, upperBoundLabel, document.createElement("br"), confirmButton);
    document.body.appendChild(overlay);

    return new Promise((resolve) => {
        const updateRandomDelayLabel = () => {
            const charCount = textField.value.length;
            const etaLowerBound = Math.ceil((charCount * parseInt(lowerBoundLabel.querySelector("input").value)) / 60000);
            const etaUpperBound = Math.ceil((charCount * parseInt(upperBoundLabel.querySelector("input").value)) / 60000);
            randomDelayLabel.textContent = `ETA: ${etaLowerBound} - ${etaUpperBound} minutes`;
        };

        confirmButton.addEventListener("click", () => {
            const userInput = textField.value.trim();
            lowerBoundValue = parseInt(lowerBoundLabel.querySelector("input").value);
            upperBoundValue = parseInt(upperBoundLabel.querySelector("input").value);

            if (userInput === "") {
                document.body.removeChild(overlay);
                return;
            }

            if (isNaN(lowerBoundValue) || isNaN(upperBoundValue) || lowerBoundValue < 0 || upperBoundValue < lowerBoundValue) return;

            typingInProgress = true;
            stopButton.style.display = "inline";
            document.body.removeChild(overlay);
            resolve({ userInput });
        });

        textField.addEventListener("input", () => {
            confirmButton.textContent = textField.value.trim() === "" ? "Cancel" : "Confirm";
            updateRandomDelayLabel();
        });

        lowerBoundLabel.querySelector("input").addEventListener("input", updateRandomDelayLabel);
        upperBoundLabel.querySelector("input").addEventListener("input", updateRandomDelayLabel);
    });
  }

  function createLabel(text, value) {
      const label = document.createElement("label");
      label.textContent = text;
      const input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.value = value;
      input.style = `
          margin-right: 10px;
          padding: 6px;
          border: 1px solid #ccc;
          border-radius: 4px;
      `;
      label.appendChild(input);
      return label;
  }

  async function typeStringWithRandomDelay(inputElement, string) {
      for (let i = 0; i < string.length; i++) {
          const char = string[i];
          const randomDelay = Math.floor(Math.random() * (upperBoundValue - lowerBoundValue + 1)) + lowerBoundValue;
          await simulateTyping(inputElement, char, randomDelay);
      }

      typingInProgress = false;
      stopButton.style.display = "none";
  }

  function simulateTyping(inputElement, char, delay) {
      return new Promise((resolve) => {
          if (cancelTyping) {
              stopButton.style.display = "none";
              console.log("Typing cancelled");
              resolve();
              return;
          }

          setTimeout(() => {
              let eventObj;
              if (char === "\n") {
                  eventObj = new KeyboardEvent("keydown", {
                      bubbles: true,
                      key: "Enter",
                      code: "Enter",
                      keyCode: 13,
                      which: 13,
                      charCode: 13,
                  });
              } else {
                  eventObj = new KeyboardEvent("keypress", {
                      bubbles: true,
                      key: char,
                      charCode: char.charCodeAt(0),
                      keyCode: char.charCodeAt(0),
                      which: char.charCodeAt(0),
                  });
              }

              inputElement.dispatchEvent(eventObj);
              console.log(`Typed: ${char}, Delay: ${delay}ms`);
              resolve();
          }, delay);
      });
  }
} else {
  console.log("Document not open, TypeLapse not available.");
}