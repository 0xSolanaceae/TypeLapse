// ==UserScript==
// @name         TypeLapse
// @namespace    https://solanaceae.xyz/
// @version      1.0
// @description  Simulates slow, natural typing to automatically generate content in Google Docs over time
// @author       Solanaceae
// @match        https://docs.google.com/*
// @icon         
// ==/UserScript==

if (window.location.href.includes("docs.google.com/document/d") || window.location.href.includes("docs.google.com/presentation/d")) {
	console.log("Document opened and viewed.");

	// "TypeLapse" button
	const TypeLapseButton = document.createElement("div");
	TypeLapseButton.textContent = "TypeLapse";
	TypeLapseButton.classList.add("menu-button", "goog-control", "goog-inline-block");
	TypeLapseButton.style.userSelect = "none";
	TypeLapseButton.setAttribute("aria-haspopup", "true");
	TypeLapseButton.setAttribute("aria-expanded", "false");
	TypeLapseButton.setAttribute("aria-disabled", "false");
	TypeLapseButton.setAttribute("role", "menuitem");
	TypeLapseButton.id = "type-lapse-button";
	TypeLapseButton.style.transition = "color 0.3s";

	// "Stop" button
	const stopButton = document.createElement("div");
	stopButton.textContent = "Stop";
	stopButton.classList.add("menu-button", "goog-control", "goog-inline-block");
	stopButton.style.userSelect = "none";
	stopButton.style.color = "red";
	stopButton.style.cursor = "pointer";
	stopButton.style.transition = "color 0.3s";
	stopButton.id = "stop-button";
	stopButton.style.display = "none";

	// Insert buttons into page
	const helpMenu = document.getElementById("docs-help-menu");
	helpMenu.parentNode.insertBefore(TypeLapseButton, helpMenu);
	TypeLapseButton.parentNode.insertBefore(stopButton, TypeLapseButton.nextSibling);

	let cancelTyping = false;
	let typingInProgress = false;
	let lowerBoundValue = 60; // Default lower bound value
	let upperBoundValue = 80; // Default upper bound value

	// Create and show the overlay
	function showOverlay() {
		const overlay = document.createElement("div");
		overlay.style.position = "fixed";
		overlay.style.top = "50%";
		overlay.style.left = "50%";
		overlay.style.transform = "translate(-50%, -50%)";
		overlay.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
		overlay.style.padding = "20px";
		overlay.style.borderRadius = "8px";
		overlay.style.boxShadow = "0px 2px 10px rgba(0, 0, 0, 0.1)";
		overlay.style.zIndex = "9999";
		overlay.style.display = "flex";
		overlay.style.flexDirection = "column";
		overlay.style.alignItems = "center";
		overlay.style.width = "320px";

		const textField = document.createElement("textarea");
		textField.rows = "5";
		textField.cols = "40";
		textField.placeholder = "Enter text here...";
		textField.style.marginBottom = "10px";
		textField.style.width = "100%";
		textField.style.padding = "8px";
		textField.style.border = "1px solid #ccc";
		textField.style.borderRadius = "4px";
		textField.style.resize = "vertical";

		const description = document.createElement("p");
		description.textContent = "Keep this tab open; otherwise, the script will pause and resume when you return. Each character has a random typing delay between the lower (min) and upper (max) bounds in milliseconds. Lower values are faster.";
		description.style.fontSize = "14px";
		description.style.marginBottom = "15px";

		const randomDelayLabel = document.createElement("div");
		randomDelayLabel.style.marginBottom = "5px";

		const lowerBoundLabel = document.createElement("label");
		lowerBoundLabel.textContent = "Lower Bound (ms): ";
		const lowerBoundInput = document.createElement("input");
		lowerBoundInput.type = "number";
		lowerBoundInput.min = "0";
		lowerBoundInput.value = lowerBoundValue;
		lowerBoundInput.style.marginRight = "10px";
		lowerBoundInput.style.padding = "6px";
		lowerBoundInput.style.border = "1px solid #ccc";
		lowerBoundInput.style.borderRadius = "4px";

		const upperBoundLabel = document.createElement("label");
		upperBoundLabel.textContent = "Upper Bound (ms): ";
		const upperBoundInput = document.createElement("input");
		upperBoundInput.type = "number";
		upperBoundInput.min = "0";
		upperBoundInput.value = upperBoundValue;
		upperBoundInput.style.marginRight = "10px";
		upperBoundInput.style.padding = "6px";
		upperBoundInput.style.border = "1px solid #ccc";
		upperBoundInput.style.borderRadius = "4px";

		const confirmButton = document.createElement("button");
		confirmButton.textContent = textField.value.trim() === "" ? "Cancel" : "Confirm";
		confirmButton.style.padding = "8px 16px";
		confirmButton.style.backgroundColor = "#1a73e8";
		confirmButton.style.color = "white";
		confirmButton.style.border = "none";
		confirmButton.style.borderRadius = "4px";
		confirmButton.style.cursor = "pointer";
		confirmButton.style.transition = "background-color 0.3s";

		overlay.appendChild(description);
		overlay.appendChild(textField);
		overlay.appendChild(randomDelayLabel);
		overlay.appendChild(lowerBoundLabel);
		overlay.appendChild(lowerBoundInput);
		overlay.appendChild(upperBoundLabel);
		overlay.appendChild(upperBoundInput);
		overlay.appendChild(document.createElement("br"));
		overlay.appendChild(confirmButton);
		document.body.appendChild(overlay);

		return new Promise((resolve) => {
			const updateRandomDelayLabel = () => {
				const charCount = textField.value.length;
				const etaLowerBound = Math.ceil((charCount * parseInt(lowerBoundInput.value)) / 60000);
				const etaUpperBound = Math.ceil((charCount * parseInt(upperBoundInput.value)) / 60000);
				randomDelayLabel.textContent = `ETA: ${etaLowerBound} - ${etaUpperBound} minutes`;
			};

			const handleCancelClick = () => {
				cancelTyping = true;
				stopButton.style.display = "none";
			};

			confirmButton.addEventListener("click", () => {
				const userInput = textField.value.trim();
				lowerBoundValue = parseInt(lowerBoundInput.value);
				upperBoundValue = parseInt(upperBoundInput.value);

				if (userInput === "") {
					document.body.removeChild(overlay);
					return;
				}

				if (isNaN(lowerBoundValue) || isNaN(upperBoundValue) || lowerBoundValue < 0 || upperBoundValue < lowerBoundValue) return;

				typingInProgress = true;
				stopButton.style.display = "inline";
				document.body.removeChild(overlay);
				resolve({
					userInput
				});
			});

			textField.addEventListener("input", () => {
				confirmButton.textContent = textField.value.trim() === "" ? "Cancel" : "Confirm";
				updateRandomDelayLabel();
			});

			lowerBoundInput.addEventListener("input", updateRandomDelayLabel);
			upperBoundInput.addEventListener("input", updateRandomDelayLabel);

			stopButton.addEventListener("click", handleCancelClick);
		});
	}

	TypeLapseButton.addEventListener("mouseenter", () => {
		TypeLapseButton.classList.add("goog-control-hover");
	});

	TypeLapseButton.addEventListener("mouseleave", () => {
		TypeLapseButton.classList.remove("goog-control-hover");
	});

	stopButton.addEventListener("mouseenter", () => {
		stopButton.classList.add("goog-control-hover");
	});

	stopButton.addEventListener("mouseleave", () => {
		stopButton.classList.remove("goog-control-hover");
	});

	TypeLapseButton.addEventListener("click", async () => {
		if (typingInProgress) {
			console.log("Typing in progress, please wait...");
			return;
		}

		cancelTyping = false;
		stopButton.style.display = "none";

		const {
			userInput
		} = await showOverlay();

		if (userInput !== "") {
			const input = document.querySelector(".docs-texteventtarget-iframe").contentDocument.activeElement;

			async function simulateTyping(inputElement, char, delay) {
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

			async function typeStringWithRandomDelay(inputElement, string) {
				for (let i = 0; i < string.length; i++) {
					const char = string[i];
					const randomDelay = Math.floor(Math.random() * (upperBoundValue - lowerBoundValue + 1)) + lowerBoundValue;
					await simulateTyping(inputElement, char, randomDelay);
				}

				typingInProgress = false;
				stopButton.style.display = "none";
			}

			typeStringWithRandomDelay(input, userInput);
		}
	});
} else {
	console.log("Document not open, TypeLapse not available.");
}