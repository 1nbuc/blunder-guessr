import { CONFIG, debug } from "./config";
import { updateMap } from "../api/geoguessrApi";
import { showNotification } from "./notifications";

// Process Duels summary page
export async function processDuelsSummary(gameId) {
	debug("Processing Duels summary for Game ID:", gameId);

	if (!CONFIG.enableOnDuels) {
		debug("Duels mode is disabled in settings");
		return;
	}

	try {
		if (unsafeWindow.__NEXT_DATA__.props.pageProps.game.rounds) {
			const gameData = unsafeWindow.__NEXT_DATA__.props.pageProps.game;

			if (!gameData) {
				debug("No game data found for this Game ID");
				return;
			}

			debug("Duels game data found:", gameData);

			const badRounds = [];

			gameData.rounds.forEach((round, index) => {
				const result = gameData.teams[0].roundResults[index];

				const score = result.score;

				if (score <= CONFIG.scoreThreshold) {
					debug(
						`Weak round found in Duels (Round ${index + 1}):`,
						score
					);
					badRounds.push({
						index,
						round,
						score,
					});
				}
			});

			debug(`${badRounds.length} weak rounds found`);

			// Save each weak round
			for (const badRound of badRounds) {
				const { lat, lng, panoId, heading } = badRound.round.panorama;
				await saveBadRound(gameData.gameId, badRounds.score, lat, lng, heading, panoId);
			}

			if (badRounds.length > 0 && CONFIG.showNotification) {
				showNotification(
					`${badRounds.length} weak rounds saved from Duels match!`
				);
			}

			return badRounds.length;
		} else {
			debug("No INITIAL_STATE or Duels data found");
		}
	} catch (error) {
		console.error("[Blunder-Guessr] Error processing Duels data:", error);
	}

	return 0;
}

// Save a weak round from Duels mode
async function saveBadRound(gameId, score, lat, lng, heading, panoId) {
	if (!CONFIG.enableSaving) return false;

	try {

		// Create format for storage
		const badRound = {
			lat: lat,
			lng: lng,
			heading: heading || 0,
			pitch: location.pitch || 0,
			zoom: location.zoom || 0,
			panoId: location.panoId || null,
			countryCode: null,
			stateCode: null,
			extra: {
				tags: ["duels"],
				score,
				gameId,
				mapName: "Duels-Match",
				date: new Date().toISOString(),
				panoId
			},
		};

		// Add to map
		const success = await updateMap(badRound);

		debug("Weak round from Duels saved", badRound);
		return success;
	} catch (error) {
		console.error("[Blunder-Guessr] Error saving Duels round:", error);
		return false;
	}
}
