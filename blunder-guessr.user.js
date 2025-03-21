// ==UserScript==
// @name         Blunder-Guessr - GeoGuessr Schwache Runden Sammler
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Sammelt und speichert GeoGuessr-Runden mit niedriger Punktzahl
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

// Standard-Konfiguration
const DEFAULT_CONFIG = {
	// Punkteschwellenwert, unter dem eine Runde als "schlecht" gilt
	scoreThreshold: 2000,

	// Speicherung der Runden in Datei aktivieren/deaktivieren
	enableSaving: true,

	// UI anzeigen
	showUI: true,

	// UI minimiert starten
	startMinimized: false,

	// Automatische Erinnerung beim Runden-Ende
	showNotification: true,

	// GeoGuessr Map ID zum Hinzufügen der Blunder
	mapId: "",

	debug: true,
};

// Konfiguration laden
let CONFIG = GM_getValue("config", DEFAULT_CONFIG);

// Sicherstellen, dass alle Konfigurationen vorhanden sind
Object.keys(DEFAULT_CONFIG).forEach((key) => {
	if (CONFIG[key] === undefined) {
		CONFIG[key] = DEFAULT_CONFIG[key];
	}
});

// Speicherung für Duelle - wir speichern Daten während des Spiels und schreiben sie erst am Ende
let duelData = {
	inProgress: false,
	badRounds: [],
};

// Temporärer Speicher für Blunder
let blunders = GM_getValue("blunders", []);

// UI-Elemente
let uiElements = {
	container: null,
	status: null,
	content: null,
	minimizeBtn: null,
};

// Hilfsfunktion für Debug-Logs
function debug(...args) {
	if (true) {
		console.log("[Blunder-Guessr]", ...args);
	}
}

// Funktion zum Speichern der Konfiguration
function saveConfig() {
	GM_setValue("config", CONFIG);
	debug("Konfiguration gespeichert", CONFIG);
}

// Funktion zum Abrufen der aktuellen Kartendaten
async function fetchMapData() {
	if (!CONFIG.mapId) {
		showNotification(
			"Keine Map-ID konfiguriert. Bitte in den Einstellungen festlegen.",
			5000
		);
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
			throw new Error(
				`Fehler beim Abrufen der Kartendaten: ${response.status}`
			);
		}

		const data = await response.json();
		debug("Kartendaten abgerufen", data);
		return data;
	} catch (error) {
		console.error(
			"[Blunder-Guessr] Fehler beim Abrufen der Kartendaten:",
			error
		);
		showNotification(
			`Fehler beim Abrufen der Kartendaten: ${error.message}`,
			5000
		);
		return null;
	}
}

// Funktion zum Aktualisieren der Karte mit neuen Standorten
async function updateMap(newLocation) {
	if (!CONFIG.mapId) {
		showNotification(
			"Keine Map-ID konfiguriert. Die Runde wurde lokal gespeichert.",
			3000
		);
		// Lokale Speicherung als Fallback
		blunders.push(newLocation);
		GM_setValue("blunders", blunders);
		return false;
	}

	try {
		// Aktuelle Kartendaten abrufen
		const mapData = await fetchMapData();
		if (!mapData) return false;

		// Neuen Standort hinzufügen
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

		// Karte aktualisieren
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
			throw new Error(
				`Fehler beim Aktualisieren der Karte: ${updateResponse.status}`
			);
		}

		debug("Karte erfolgreich aktualisiert");
		return true;
	} catch (error) {
		console.error(
			"[Blunder-Guessr] Fehler beim Aktualisieren der Karte:",
			error
		);
		showNotification(
			`Fehler beim Aktualisieren der Karte: ${error.message}. Die Runde wurde lokal gespeichert.`,
			5000
		);

		// Lokale Speicherung als Fallback
		blunders.push(newLocation);
		GM_setValue("blunders", blunders);
		return false;
	}
}

// Funktion zum Speichern einer schlechten Runde
async function saveBadRound(gameData, roundIndex) {
	if (!CONFIG.enableSaving) return;

	try {
		const round = gameData.rounds[roundIndex];
		if (!round || !round.location) {
			debug("Ungültige Rundendaten", round);
			return;
		}

		// Punktzahl prüfen
		const score = round.score?.amount || 0;
		if (score > CONFIG.scoreThreshold) {
			debug(
				"Punktzahl über Schwellenwert",
				score,
				">",
				CONFIG.scoreThreshold
			);
			return;
		}

		// Stelle sicher, dass die Lokation vollständig ist
		if (!round.location.lat || !round.location.lng) {
			debug("Unvollständige Lokationsdaten", round.location);
			return;
		}

		// Format für die Speicherung erstellen
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

		// Zur Karte hinzufügen
		const success = await updateMap(badRound);

		if (success) {
			showNotification(
				`Schwache Runde (${score} Punkte) zur Karte hinzugefügt!`
			);
		}

		debug("Schlechte Runde gespeichert", badRound);
	} catch (error) {
		console.error(
			"[Blunder-Guessr] Fehler beim Speichern der Runde:",
			error
		);
	}
}

// Zeige eine Benachrichtigung an
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

	// Füge eine CSS-Animation hinzu
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

// Funktion zum Exportieren der lokal gespeicherten Daten
function exportToJSON() {
	try {
		if (!blunders.length) {
			showNotification(
				"Keine lokal gespeicherten Runden zum Exportieren vorhanden.",
				5000
			);
			return;
		}

		const jsonData = {
			name: "blunders",
			customCoordinates: blunders,
			extra: {
				tags: {},
			},
		};

		// Erstelle einen Download für die JSON-Datei
		const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "blunder-guessr.json";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);

		debug("Daten exportiert", jsonData);
		showNotification(`${blunders.length} Runden erfolgreich exportiert!`);
	} catch (error) {
		console.error("[Blunder-Guessr] Fehler beim Exportieren:", error);
		showNotification("Fehler beim Exportieren der Daten.", 5000);
	}
}

// Funktion zum Löschen aller gesammelten Daten
function clearAllData() {
	if (
		confirm(
			"Möchtest du wirklich alle lokal gespeicherten Blunder-Runden löschen?"
		)
	) {
		GM_setValue("blunders", []);
		blunders = [];
		updateUI();
		showNotification(
			"Alle lokal gespeicherten Daten wurden gelöscht!",
			5000
		);
	}
}

// Funktion zum Aktualisieren der UI
function updateUI() {
	if (!uiElements.status) return;

	const count = blunders.length;
	const mapConfigured = CONFIG.mapId
		? "Karte konfiguriert"
		: "Keine Karte konfiguriert";
	uiElements.status.textContent = `${count} Runden lokal gespeichert | ${mapConfigured}`;
}

// Minimiere/Maximiere die UI
function toggleMinimize() {
	if (!uiElements.content || !uiElements.minimizeBtn) return;

	const isMinimized = uiElements.content.style.display === "none";
	uiElements.content.style.display = isMinimized ? "flex" : "none";
	uiElements.minimizeBtn.textContent = isMinimized ? "−" : "+";

	// Speichere den Status
	CONFIG.startMinimized = !isMinimized;
	saveConfig();
}

// Funktion zum Erstellen eines Einstellungs-Elements
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

// Einstellungsmenü anzeigen
function showSettings() {
	// Erstelle das Menü
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

	// Überschrift
	const title = document.createElement("h2");
	title.textContent = "Blunder-Guessr Einstellungen";
	title.style.textAlign = "center";
	title.style.marginTop = "0";

	// Einstellungen Container
	const settingsContent = document.createElement("div");
	settingsContent.style.cssText =
		"display: flex; flex-direction: column; margin: 15px 0;";

	// Punkteschwellenwert
	settingsContent.appendChild(
		createSettingElement(
			"Punkteschwellenwert:",
			"number",
			CONFIG.scoreThreshold,
			(value) => {
				CONFIG.scoreThreshold = value;
			}
		)
	);

	// Speicherung aktivieren
	settingsContent.appendChild(
		createSettingElement(
			"Speicherung aktivieren:",
			"checkbox",
			CONFIG.enableSaving,
			(checked) => {
				CONFIG.enableSaving = checked;
			}
		)
	);

	// UI anzeigen
	settingsContent.appendChild(
		createSettingElement(
			"UI anzeigen:",
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

	// Start minimiert
	settingsContent.appendChild(
		createSettingElement(
			"Start minimiert:",
			"checkbox",
			CONFIG.startMinimized,
			(checked) => {
				CONFIG.startMinimized = checked;
			}
		)
	);

	// Benachrichtigungen anzeigen
	settingsContent.appendChild(
		createSettingElement(
			"Benachrichtigungen:",
			"checkbox",
			CONFIG.showNotification,
			(checked) => {
				CONFIG.showNotification = checked;
			}
		)
	);

	// Map ID Einstellung
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

	// Map ID Hilfe
	const mapIdHelp = document.createElement("p");
	mapIdHelp.style.cssText = "font-size: 12px; margin-top: 0; color: #ccc;";
	mapIdHelp.innerHTML =
		"Die Map ID findest du in der URL deiner Karte:<br>https://www.geoguessr.com/map-maker/<b>deine-map-id</b>";
	settingsContent.appendChild(mapIdHelp);

	// Buttons Container
	const buttons = document.createElement("div");
	buttons.style.cssText =
		"display: flex; justify-content: space-between; margin-top: 20px;";

	// Speichern-Button
	const saveButton = document.createElement("button");
	saveButton.textContent = "Speichern";
	saveButton.style.cssText =
		"cursor: pointer; background-color: #4CAF50; color: white; border: none; padding: 8px 15px; border-radius: 3px;";
	saveButton.onclick = () => {
		saveConfig();
		document.body.removeChild(settingsContainer);
		document.body.removeChild(overlay);
		showNotification("Einstellungen gespeichert!");
		updateUI();
	};

	// Abbrechen-Button
	const cancelButton = document.createElement("button");
	cancelButton.textContent = "Abbrechen";
	cancelButton.style.cssText =
		"cursor: pointer; background-color: #f44336; color: white; border: none; padding: 8px 15px; border-radius: 3px;";
	cancelButton.onclick = () => {
		document.body.removeChild(settingsContainer);
		document.body.removeChild(overlay);
	};

	buttons.appendChild(cancelButton);
	buttons.appendChild(saveButton);

	// Alle Elemente zusammenfügen
	settingsContainer.appendChild(title);
	settingsContainer.appendChild(settingsContent);
	settingsContainer.appendChild(buttons);

	// Hintergrund-Overlay
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

	// Zur Seite hinzufügen
	document.body.appendChild(overlay);
	document.body.appendChild(settingsContainer);
}

// Funktion zum Hinzufügen der UI
function addUI() {
	// Warte, bis die Seite geladen ist
	if (!document.body) {
		setTimeout(addUI, 100);
		return;
	}

	// Falls UI deaktiviert ist, nichts tun
	if (!CONFIG.showUI) {
		debug("UI ist deaktiviert");
		return;
	}

	// UI-Container erstellen
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

	// Header mit Titel und Minimieren-Button
	const header = document.createElement("div");
	header.style.cssText =
		"display: flex; justify-content: space-between; align-items: center;";

	// Titel
	const title = document.createElement("div");
	title.textContent = "Blunder-Guessr";
	title.style.fontWeight = "bold";

	// Minimieren-Button
	const minimizeBtn = document.createElement("button");
	minimizeBtn.textContent = CONFIG.startMinimized ? "+" : "−";
	minimizeBtn.style.cssText =
		"border: none; background: none; color: white; cursor: pointer; font-size: 16px; padding: 0 5px;";
	minimizeBtn.onclick = toggleMinimize;

	header.appendChild(title);
	header.appendChild(minimizeBtn);

	// Content-Bereich
	const content = document.createElement("div");
	content.style.cssText = "display: flex; flex-direction: column; gap: 5px;";
	content.style.display = CONFIG.startMinimized ? "none" : "flex";

	// Status-Anzeige
	const status = document.createElement("div");
	const mapConfigured = CONFIG.mapId
		? "Karte konfiguriert"
		: "Keine Karte konfiguriert";
	status.textContent = `${blunders.length} Runden lokal gespeichert | ${mapConfigured}`;
	status.id = "blunder-status";

	// Button-Container
	const buttonContainer = document.createElement("div");
	buttonContainer.style.cssText = "display: flex; gap: 5px;";

	// Export-Button
	const exportBtn = document.createElement("button");
	exportBtn.textContent = "Exportieren";
	exportBtn.onclick = exportToJSON;
	exportBtn.style.cssText =
		"cursor: pointer; background-color: #4CAF50; color: white; border: none; padding: 5px 10px; border-radius: 3px;";

	// Einstellungs-Button
	const settingsBtn = document.createElement("button");
	settingsBtn.textContent = "Einstellungen";
	settingsBtn.onclick = showSettings;
	settingsBtn.style.cssText =
		"cursor: pointer; background-color: #2196F3; color: white; border: none; padding: 5px 10px; border-radius: 3px;";

	// Löschen-Button
	const clearBtn = document.createElement("button");
	clearBtn.textContent = "Lokal löschen";
	clearBtn.onclick = clearAllData;
	clearBtn.style.cssText =
		"cursor: pointer; background-color: #f44336; color: white; border: none; padding: 5px 10px; border-radius: 3px;";

	// Buttons hinzufügen
	buttonContainer.appendChild(exportBtn);
	buttonContainer.appendChild(settingsBtn);
	buttonContainer.appendChild(clearBtn);

	// Elemente zum Content hinzufügen
	content.appendChild(status);
	content.appendChild(buttonContainer);

	// Alle Elemente zum Container hinzufügen
	container.appendChild(header);
	container.appendChild(content);

	// Container zur Seite hinzufügen
	document.body.appendChild(container);

	// UI-Elemente speichern
	uiElements = {
		container,
		status,
		content,
		minimizeBtn,
	};

	debug("UI hinzugefügt");
}

// Hauptfunktion zur Initialisierung des Frameworks
function initBlunderGuessr() {
	debug("Initialisiere Blunder-Guessr...");

	// GeoGuessr Event Framework initialisieren
	GeoGuessrEventFramework.init()
		.then((GEF) => {
			debug("Event Framework initialisiert");

			// Event-Listener für normale Spiele (nicht Duelle)
			GEF.events.addEventListener("round_end", (event) => {
				const gameData = event.detail;
				const currentRound = gameData.current_round - 1; // Index ist 0-basiert

				// Ist dies ein normales Spiel? (nicht Duel-Mode)
				const isDuelMode = window.location.pathname.includes("/duels/");

				if (!isDuelMode) {
					debug("Runde beendet (normales Spiel)", currentRound);
					saveBadRound(gameData, currentRound);
				} else {
					// Für Duelle speichern wir temporär, schreiben aber erst am Ende
					debug("Runde beendet (Duel-Mode)", currentRound);
					duelData.inProgress = true;

					// Punktzahl prüfen
					const round = gameData.rounds[currentRound];
					const score = round?.score?.amount || 0;

					if (score <= CONFIG.scoreThreshold) {
						duelData.badRounds.push(currentRound);
					}
				}
			});

			// Event-Listener für Spielende
			GEF.events.addEventListener("game_end", (event) => {
				const gameData = event.detail;
				const isDuelMode = window.location.pathname.includes("/duels/");

				debug(
					"Spiel beendet",
					isDuelMode ? "(Duel-Mode)" : "(normales Spiel)"
				);

				if (isDuelMode && duelData.inProgress) {
					// Jetzt können wir die Daten für Duelle sicher speichern
					duelData.badRounds.forEach((roundIndex) => {
						saveBadRound(gameData, roundIndex);
					});

					// Duel-Daten zurücksetzen
					duelData.inProgress = false;
					duelData.badRounds = [];
				}

				// UI aktualisieren
				updateUI();
			});

			// UI hinzufügen
			setTimeout(addUI, 2000);
		})
		.catch((error) => {
			console.error(
				"[Blunder-Guessr] Fehler beim Initialisieren des Frameworks:",
				error
			);
		});
}

// Script starten
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", async () => {
		initBlunderGuessr();
	});
} else {
	initBlunderGuessr();
}
