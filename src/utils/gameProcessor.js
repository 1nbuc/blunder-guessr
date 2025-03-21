import { CONFIG, debug } from "./config";
import { updateMap } from "../api/geoguessrApi";
import { showNotification } from "./notifications";
import { duelData } from "./storage";

// Function to save a bad round
export async function saveBadRound(gameData, roundIndex) {
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

		if (success && CONFIG.showNotification) {
			showNotification(`Weak round (${score} points) added to map!`);
		}

		debug("Bad round saved", badRound);
	} catch (error) {
		console.error("[Blunder-Guessr] Error saving round:", error);
	}
}

// Process round end event
export function processRoundEnd(gameData) {
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
}

// Process game end event
export function processGameEnd(gameData) {
	const isDuelMode = window.location.pathname.includes("/duels/");

	debug("Game ended", isDuelMode ? "(Duel-Mode)" : "(normal game)");

	if (isDuelMode && duelData.inProgress) {
		// Now we can safely save data for duels
		duelData.badRounds.forEach((roundIndex) => {
			saveBadRound(gameData, roundIndex);
		});

		// Reset duel data
		duelData.inProgress = false;
		duelData.badRounds = [];
	}
}
