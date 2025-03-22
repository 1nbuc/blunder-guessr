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
	// Check if we are on a Duels summary page
	const duelsRegex =
		/^https:\/\/www\.geoguessr\.com\/duels\/([a-zA-Z0-9-]+)\/summary$/;
	const match = window.location.href.match(duelsRegex);

	if (!match) {
		debug("Not on a Duels summary page");
		return;
	}

	// Extract the Duels game ID from the URL
	const gameId = match[1];
	debug("Duels summary page detected. Game ID:", gameId);

	// Wait until the page is fully loaded
	setTimeout(async () => {
		debug("Processing Duels summary data...");

		// Process the Duels summary page
		const badRoundsFound = await processDuelsSummary(gameId);

		if (badRoundsFound > 0) {
			// Update UI
			updateUI();
		}
	}, 3000); // Wait until the page is fully loaded
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
