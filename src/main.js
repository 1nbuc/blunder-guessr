import { debug } from "./utils/config";
import { addUI, updateUI } from "./components/mainUI";
import {
	processRoundEnd,
	processGameEnd,
} from "./utils/gameProcessorSingleplayer";
import { CONFIG } from "./utils/config";
import { processDuelsSummary } from "./utils/gameProcessorDuels";



// Main function to initialize the framework
function initSingleplayerListener() {
	debug("Initializing Blunder-Guessr...");

	// Initialize GeoGuessr Event Framework
	GeoGuessrEventFramework.init()
		.then((GEF) => {
			debug("Event Framework initialized");

			// Event listener for normal games (not duels)
			GEF.events.addEventListener("round_end", (event) => {
				processRoundEnd(event.detail);
			});

			// Event listener for game end
			GEF.events.addEventListener("game_end", (event) => {
				processGameEnd(event.detail);

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

function initDuelsListener() {
	// Check if we are on a Duels summary page or multiplayer page
	const duelsRegex =
		/^https:\/\/www\.geoguessr\.com\/duels\/([a-zA-Z0-9-]+)\/summary$/;
	const multiplayerRegex = /^https:\/\/www\.geoguessr\.com\/multiplayer$/;

	const isDuelsSummary = duelsRegex.test(window.location.href);
	const isMultiplayer = multiplayerRegex.test(window.location.href);

	if (!isDuelsSummary && !isMultiplayer) {
		debug("Not on a supported page for Duels functionality");
		return;
	}

	let gameId = null;
	if (isDuelsSummary) {
		const match = window.location.href.match(duelsRegex);
		gameId = match[1];
		debug("Duels summary page detected. Game ID:", gameId);
	} else {
		debug("Multiplayer page detected");
	}

	// If on duels summary, process immediately
	if (isDuelsSummary) {
		setTimeout(async () => {
			debug("Processing Duels summary data...");

			// Process the Duels summary page
			const badRoundsFound = await processDuelsSummary(gameId);

			if (badRoundsFound > 0) {
				// Update UI
				updateUI();
			}
		}, 500);
		return;
	}

	// Set up observer to find and auto-click the breakdown button
	debug("Setting up observer for breakdown button");

	if(!CONFIG.enableOnDuels) {
		return;
	}

	const observer = new MutationObserver(() => {
		// Find the breakdown button

		const breakdownButton = findBreakdownButton();

		if (breakdownButton) {
			debug("Found breakdown button - auto-clicking");
			// Auto-click the button
			breakdownButton.click();
			// Process data after click
			setTimeout(initDuelsListener, 500);
		}
	});

	// Start observing for DOM changes
	observer.observe(document.body, {
		childList: true,
		subtree: true,
	});

	// Stop observing after 10 minutes to prevent memory leaks
	setTimeout(() => {
		debug("Disconnecting button observer");
		observer.disconnect();
	}, 600000);
}

// Function to find the breakdown button
function findBreakdownButton() {
	// Look for spans with "Breakdown" text
	const breakdownSpans = Array.from(document.querySelectorAll("span")).filter(
		(span) => span.textContent.trim() === "Breakdown"
	);

	for (const span of breakdownSpans) {
		const container = span.closest("div");
		if (container) {
			const button = container.querySelector("button");
			if (button) {
				return button;
			}
		}
	}

	return null;
}

// Start script
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", async () => {
		initSingleplayerListener();
		initDuelsListener(); // Also initialize Duels listener
	});
} else {
	initSingleplayerListener();
	initDuelsListener(); // Also initialize Duels listener
}

// Make global for debugging
window.BlunderGuessr = {
	updateUI,
};
