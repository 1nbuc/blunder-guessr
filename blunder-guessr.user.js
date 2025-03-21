// ==UserScript==
// @name         Blunder-Guessr - GeoGuessr Weak Rounds Collector
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Collects and saves GeoGuessr rounds with low scores
// @author       1nbuc
// @match        *://*.geoguessr.com/*
// @run-at       document-start
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_info
// @grant        GM_xmlhttpRequest
// @grant        unsafeWindow
// @require      https://miraclewhips.dev/geoguessr-event-framework/geoguessr-event-framework.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=geoguessr.com
// ==/UserScript==

// Default configuration
const DEFAULT_CONFIG = {
	// Score threshold below which a round is considered "bad"
	scoreThreshold: 2000,

	// Enable/disable saving rounds to file
	enableSaving: true,

	// Show UI
	showUI: true,

	// Start minimized
	startMinimized: false,

	// Automatic reminder at the end of round
	showNotification: true,

	// GeoGuessr Map ID to add blunders to
	mapId: "",

	debug: true,
};

// Load configuration
let CONFIG = GM_getValue("config", DEFAULT_CONFIG);

// Ensure all configurations are present
Object.keys(DEFAULT_CONFIG).forEach((key) => {
	if (CONFIG[key] === undefined) {
		CONFIG[key] = DEFAULT_CONFIG[key];
	}
});

// Storage for duels - we save data during the game and write only at the end
let duelData = {
	inProgress: false,
	badRounds: [],
};

// Temporary storage for blunders
let blunders = GM_getValue("blunders", []);

// UI elements
let uiElements = {
	container: null,
	status: null,
	content: null,
	minimizeBtn: null,
};

// Helper function for debug logs
function debug(...args) {
	if (true) {
		console.log("[Blunder-Guessr]", ...args);
	}
}

// Function to save configuration
function saveConfig() {
	GM_setValue("config", CONFIG);
	debug("Configuration saved", CONFIG);
}

// Function to fetch current map data
async function fetchMapData() {
	if (!CONFIG.mapId) {
		showNotification("No Map ID configured. Please set in settings.", 5000);
		return null;
	}

	try {
		const response = await fetch(
			`https://www.geoguessr.com/api/v4/user-maps/drafts/${CONFIG.mapId}`,
			{
				headers: {
					accept: "application/json",
					"content-type": "application/json",
					"x-client": "web",
				},
				method: "GET",
				credentials: "include",
			}
		);

		if (!response.ok) {
			throw new Error(`Error fetching map data: ${response.status}`);
		}

		const data = await response.json();
		debug("Map data retrieved", data);
		return data;
	} catch (error) {
		console.error("[Blunder-Guessr] Error fetching map data:", error);
		showNotification(`Error fetching map data: ${error.message}`, 5000);
		return null;
	}
}

// Function to update the map with new locations
async function updateMap(newLocation) {
	if (!CONFIG.mapId) {
		showNotification(
			"No Map ID configured. The round was saved locally.",
			3000
		);
		// Local storage as fallback
		blunders.push(newLocation);
		GM_setValue("blunders", blunders);
		return false;
	}

	try {
		// Fetch current map data
		const mapData = await fetchMapData();
		if (!mapData) return false;

		// Add new location
		const existingCoordinates = mapData.coordinates || [];
		const newCoordinates = [
			...existingCoordinates,
			{
				lat: newLocation.lat,
				lng: newLocation.lng,
				heading: newLocation.heading,
				pitch: newLocation.pitch,
				zoom: newLocation.zoom || 0,
				panoId: newLocation.panoId,
				countryCode: newLocation.countryCode,
				stateCode: newLocation.stateCode,
			},
		];

		// Update map
		const updateResponse = await fetch(
			`https://www.geoguessr.com/api/v4/user-maps/drafts/${CONFIG.mapId}`,
			{
				headers: {
					accept: "application/json",
					"content-type": "application/json",
					"x-client": "web",
				},
				method: "PUT",
				body: JSON.stringify({ customCoordinates: newCoordinates }),
				credentials: "include",
			}
		);

		if (!updateResponse.ok) {
			throw new Error(`Error updating map: ${updateResponse.status}`);
		}

		debug("Map successfully updated");
		return true;
	} catch (error) {
		console.error("[Blunder-Guessr] Error updating map:", error);
		showNotification(
			`Error updating map: ${error.message}. The round was saved locally.`,
			5000
		);

		// Local storage as fallback
		blunders.push(newLocation);
		GM_setValue("blunders", blunders);
		return false;
	}
}

// Function to save a bad round
async function saveBadRound(gameData, roundIndex) {
	if (!CONFIG.enableSaving) return;

	try {
		const round = gameData.rounds[roundIndex];
		if (!round || !round.location) {
			debug("Invalid round data", round);
			return;
		}

		// Check score
		const score = round.score?.amount || 0;
		if (score > CONFIG.scoreThreshold) {
			debug("Score above threshold", score, ">", CONFIG.scoreThreshold);
			return;
		}

		// Ensure location is complete
		if (!round.location.lat || !round.location.lng) {
			debug("Incomplete location data", round.location);
			return;
		}

		// Create format for storage
		const badRound = {
			lat: round.location.lat,
			lng: round.location.lng,
			heading: round.location.heading || 0,
			pitch: round.location.pitch || 0,
			zoom: round.location.zoom || 0,
			panoId: round.location.panoId || null,
			countryCode: null,
			stateCode: null,
			extra: {
				tags: [],
				score: score,
				gameId: gameData.current_game_id,
				mapName: gameData.map?.name || "Unknown Map",
				date: new Date().toISOString(),
				panoId: round.location.panoId || null,
			},
		};

		// Add to map
		const success = await updateMap(badRound);

		if (success) {
			showNotification(`Weak round (${score} points) added to map!`);
		}

		debug("Bad round saved", badRound);
	} catch (error) {
		console.error("[Blunder-Guessr] Error saving round:", error);
	}
}

// Show a notification
function showNotification(message, duration = 3000) {
	const notification = document.createElement("div");
	notification.style.cssText = `
			position: fixed;
			top: 20px;
			right: 20px;
			background-color: rgba(0, 0, 0, 0.7);
			color: white;
			padding: 10px 15px;
			border-radius: 5px;
			z-index: 10000;
			font-family: Arial, sans-serif;
			font-size: 14px;
			animation: fadeIn 0.3s, fadeOut 0.3s ${duration / 1000 - 0.3}s forwards;
		`;

	// Add CSS animation
	const style = document.createElement("style");
	style.textContent = `
			@keyframes fadeIn {
				from { opacity: 0; transform: translateY(-20px); }
				to { opacity: 1; transform: translateY(0); }
			}
			@keyframes fadeOut {
				from { opacity: 1; transform: translateY(0); }
				to { opacity: 0; transform: translateY(-20px); }
			}
		`;
	document.head.appendChild(style);

	notification.textContent = message;
	document.body.appendChild(notification);

	setTimeout(() => {
		document.body.removeChild(notification);
	}, duration);
}



// Function to update the UI
function updateUI() {
	if (!uiElements.status) return;

	const count = blunders.length;
	const mapConfigured = CONFIG.mapId ? "Map configured" : "No map configured";
	uiElements.status.textContent = `${count} rounds locally stored | ${mapConfigured}`;
}

// Minimize/Maximize the UI
function toggleMinimize() {
	if (!uiElements.content || !uiElements.minimizeBtn) return;

	const isMinimized = uiElements.content.style.display === "none";
	uiElements.content.style.display = isMinimized ? "flex" : "none";
	uiElements.minimizeBtn.textContent = isMinimized ? "−" : "+";

	// Save status
	CONFIG.startMinimized = !isMinimized;
	saveConfig();
}

// Function to create a settings element
function createSettingElement(label, type, value, onChange) {
	const container = document.createElement("div");
	container.style.cssText =
		"display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;";

	const labelElement = document.createElement("label");
	labelElement.textContent = label;
	labelElement.style.marginRight = "10px";

	let inputElement;

	if (type === "checkbox") {
		inputElement = document.createElement("input");
		inputElement.type = "checkbox";
		inputElement.checked = value;
		inputElement.addEventListener("change", () =>
			onChange(inputElement.checked)
		);
	} else if (type === "number") {
		inputElement = document.createElement("input");
		inputElement.type = "number";
		inputElement.value = value;
		inputElement.style.width = "70px";
		inputElement.addEventListener("change", () =>
			onChange(parseInt(inputElement.value, 10))
		);
	} else if (type === "text") {
		inputElement = document.createElement("input");
		inputElement.type = "text";
		inputElement.value = value;
		inputElement.style.width = "200px";
		inputElement.addEventListener("change", () =>
			onChange(inputElement.value)
		);
	}

	container.appendChild(labelElement);
	container.appendChild(inputElement);

	return container;
}

// Show settings menu
function showSettings() {
	// Create menu
	const settingsContainer = document.createElement("div");
	settingsContainer.style.cssText = `
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background-color: rgba(20, 20, 20, 0.9);
		color: white;
		padding: 20px;
		border-radius: 8px;
		z-index: 10001;
		font-family: Arial, sans-serif;
		min-width: 300px;
		box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
	`;

	// Heading
	const title = document.createElement("h2");
	title.textContent = "Blunder-Guessr Settings";
	title.style.textAlign = "center";
	title.style.marginTop = "0";

	// Settings container
	const settingsContent = document.createElement("div");
	settingsContent.style.cssText =
		"display: flex; flex-direction: column; margin: 15px 0;";

	// Score threshold
	settingsContent.appendChild(
		createSettingElement(
			"Score threshold:",
			"number",
			CONFIG.scoreThreshold,
			(value) => {
				CONFIG.scoreThreshold = value;
			}
		)
	);

	// Enable saving
	settingsContent.appendChild(
		createSettingElement(
			"Enable saving:",
			"checkbox",
			CONFIG.enableSaving,
			(checked) => {
				CONFIG.enableSaving = checked;
			}
		)
	);

	// Show UI
	settingsContent.appendChild(
		createSettingElement(
			"Show UI:",
			"checkbox",
			CONFIG.showUI,
			(checked) => {
				CONFIG.showUI = checked;

				// Update UI visibility
				if (uiElements.container) {
					uiElements.container.style.display = checked
						? "flex"
						: "none";
				}
			}
		)
	);

	// Start minimized
	settingsContent.appendChild(
		createSettingElement(
			"Start minimized:",
			"checkbox",
			CONFIG.startMinimized,
			(checked) => {
				CONFIG.startMinimized = checked;
			}
		)
	);

	// Show notifications
	settingsContent.appendChild(
		createSettingElement(
			"Notifications:",
			"checkbox",
			CONFIG.showNotification,
			(checked) => {
				CONFIG.showNotification = checked;
			}
		)
	);

	// Map ID Setting
	settingsContent.appendChild(
		createSettingElement(
			"GeoGuessr Map ID:",
			"text",
			CONFIG.mapId,
			(value) => {
				CONFIG.mapId = value;
			}
		)
	);

	// Map ID Help
	const mapIdHelp = document.createElement("p");
	mapIdHelp.style.cssText = "font-size: 12px; margin-top: 0; color: #ccc;";
	mapIdHelp.innerHTML =
		"You can find the Map ID in your map's URL:<br>https://www.geoguessr.com/map-maker/<b>your-map-id</b>";
	settingsContent.appendChild(mapIdHelp);

	// Buttons Container
	const buttons = document.createElement("div");
	buttons.style.cssText =
		"display: flex; justify-content: space-between; margin-top: 20px;";

	// Save Button
	const saveButton = document.createElement("button");
	saveButton.textContent = "Save";
	saveButton.style.cssText =
		"cursor: pointer; background-color: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 3px;";
	saveButton.onclick = () => {
		saveConfig();
		document.body.removeChild(settingsContainer);
		document.body.removeChild(overlay);
		showNotification("Settings saved!");
		updateUI();
	};

	// Cancel Button
	const cancelButton = document.createElement("button");
	cancelButton.textContent = "Cancel";
	cancelButton.style.cssText =
		"cursor: pointer; background-color: #f44336; color: white; border: none; padding: 8px 15px; border-radius: 3px;";
	cancelButton.onclick = () => {
		document.body.removeChild(settingsContainer);
		document.body.removeChild(overlay);
	};

	buttons.appendChild(cancelButton);
	buttons.appendChild(saveButton);

	// Combine all elements
	settingsContainer.appendChild(title);
	settingsContainer.appendChild(settingsContent);
	settingsContainer.appendChild(buttons);

	// Background overlay
	const overlay = document.createElement("div");
	overlay.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		z-index: 10000;
	`;
	overlay.onclick = () => {
		document.body.removeChild(settingsContainer);
		document.body.removeChild(overlay);
	};

	// Add to page
	document.body.appendChild(overlay);
	document.body.appendChild(settingsContainer);
}

// Function to add the UI
function addUI() {
	// Wait until page is loaded
	if (!document.body) {
		setTimeout(addUI, 100);
		return;
	}

	// If UI is disabled, do nothing
	if (!CONFIG.showUI) {
		debug("UI is disabled");
		return;
	}

	// Create UI container
	const container = document.createElement("div");
	container.style.cssText = `
		position: fixed;
		bottom: 10px;
		right: 10px;
		background-color: rgba(0, 0, 0, 0.7);
		color: white;
		padding: 10px;
		border-radius: 5px;
		z-index: 9999;
		font-family: Arial, sans-serif;
		font-size: 14px;
		display: flex;
		flex-direction: column;
		gap: 5px;
	`;

	// Header with title and minimize button
	const header = document.createElement("div");
	header.style.cssText =
		"display: flex; justify-content: space-between; align-items: center;";

	// Title
	const title = document.createElement("div");
	title.textContent = "Blunder-Guessr";
	title.style.fontWeight = "bold";

	// Minimize button
	const minimizeBtn = document.createElement("button");
	minimizeBtn.textContent = CONFIG.startMinimized ? "+" : "−";
	minimizeBtn.style.cssText =
		"border: none; background: none; color: white; cursor: pointer; font-size: 16px; padding: 0 5px;";
	minimizeBtn.onclick = toggleMinimize;

	header.appendChild(title);
	header.appendChild(minimizeBtn);

	// Content area
	const content = document.createElement("div");
	content.style.cssText = "display: flex; flex-direction: column; gap: 5px;";
	content.style.display = CONFIG.startMinimized ? "none" : "flex";

	// Status display
	const status = document.createElement("div");
	const mapConfigured = CONFIG.mapId ? "Map configured" : "No map configured";
	status.textContent = `${blunders.length} rounds locally stored | ${mapConfigured}`;
	status.id = "blunder-status";

	// Button container
	const buttonContainer = document.createElement("div");
	buttonContainer.style.cssText = "display: flex; gap: 5px;";


	// Settings button
	const settingsBtn = document.createElement("button");
	settingsBtn.textContent = "Settings";
	settingsBtn.onclick = showSettings;
	settingsBtn.style.cssText =
		"cursor: pointer; background-color: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 3px;";


	// Add buttons
	buttonContainer.appendChild(settingsBtn);


	// Add elements to content
	content.appendChild(status);
	content.appendChild(buttonContainer);

	// Add all elements to container
	container.appendChild(header);
	container.appendChild(content);

	// Add container to page
	document.body.appendChild(container);

	// Save UI elements
	uiElements = {
		container,
		status,
		content,
		minimizeBtn,
	};

	debug("UI added");
}

// Main function to initialize the framework
function initBlunderGuessr() {
	debug("Initializing Blunder-Guessr...");

	// Initialize GeoGuessr Event Framework
	GeoGuessrEventFramework.init()
		.then((GEF) => {
			debug("Event Framework initialized");

			// Event listener for normal games (not duels)
			GEF.events.addEventListener("round_end", (event) => {
				const gameData = event.detail;
				const currentRound = gameData.current_round - 1; // Index is 0-based

				// Is this a normal game? (not Duel-Mode)
				const isDuelMode = window.location.pathname.includes("/duels/");

				if (!isDuelMode) {
					debug("Round ended (normal game)", currentRound);
					saveBadRound(gameData, currentRound);
				} else {
					// For duels we save temporarily, but write only at the end
					debug("Round ended (Duel-Mode)", currentRound);
					duelData.inProgress = true;

					// Check score
					const round = gameData.rounds[currentRound];
					const score = round?.score?.amount || 0;

					if (score <= CONFIG.scoreThreshold) {
						duelData.badRounds.push(currentRound);
					}
				}
			});

			// Event listener for game end
			GEF.events.addEventListener("game_end", (event) => {
				const gameData = event.detail;
				const isDuelMode = window.location.pathname.includes("/duels/");

				debug(
					"Game ended",
					isDuelMode ? "(Duel-Mode)" : "(normal game)"
				);

				if (isDuelMode && duelData.inProgress) {
					// Now we can safely save data for duels
					duelData.badRounds.forEach((roundIndex) => {
						saveBadRound(gameData, roundIndex);
					});

					// Reset duel data
					duelData.inProgress = false;
					duelData.badRounds = [];
				}

				// Update UI
				updateUI();
			});

			// Add UI
			setTimeout(addUI, 2000);
		})
		.catch((error) => {
			console.error(
				"[Blunder-Guessr] Error initializing framework:",
				error
			);
		});
}

// Start script
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", async () => {
		initBlunderGuessr();
	});
} else {
	initBlunderGuessr();
}
