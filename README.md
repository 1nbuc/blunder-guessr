# Blunder-Guessr

Ein Tampermonkey-Script für GeoGuessr, das schwache Runden automatisch erfasst und direkt zu deiner GeoGuessr-Karte hinzufügt.

## Funktionen

-   Erkennung von Runden mit niedrigen Punktzahlen (konfigurierbar)
-   Automatisches Hinzufügen der Koordinaten zu einer GeoGuessr-Karte
-   Unterstützung für reguläre Spiele und Duelle
-   Lokale Speicherung als Fallback
-   Export der erfassten Daten im JSON-Format (kompatibel mit GeoGuessr-Maps)
-   Benutzerfreundliche Oberfläche mit Einstellungsmöglichkeiten

## Installation

1. Installiere die [Tampermonkey](https://www.tampermonkey.net/)-Erweiterung für deinen Browser
2. Klicke [hier](blunder-guessr.user.js), um das Skript zu installieren, oder öffne das Tampermonkey-Dashboard und erstelle ein neues Skript
3. Kopiere den Inhalt von `blunder-guessr.user.js` in das Skript-Fenster
4. Speichere das Skript (Strg+S oder Datei → Speichern)

## Einrichtung

1. Erstelle eine neue Karte in GeoGuessr über den [Map Maker](https://www.geoguessr.com/map-maker)
2. Kopiere die Map-ID aus der URL (z.B. `https://www.geoguessr.com/map-maker/12345abcde` → Die ID ist `12345abcde`)
3. Öffne die Einstellungen des Blunder-Guessr Scripts und füge die Map-ID ein
4. Speichere die Einstellungen

## Verwendung

1. Öffne GeoGuessr und spiele wie gewohnt
2. Das Skript erfasst automatisch Runden mit einer Punktzahl unter dem konfigurierten Schwellenwert
3. Erkannte schlechte Runden werden automatisch zu deiner konfigurierten GeoGuessr-Karte hinzugefügt
4. Falls die Karte nicht konfiguriert ist oder ein Fehler auftritt, werden die Runden lokal gespeichert
5. Lokal gespeicherte Runden kannst du über die Benutzeroberfläche exportieren

## Konfiguration

Du kannst folgende Einstellungen über das Einstellungsmenü anpassen:

-   **Punkteschwellenwert**: Runden mit einer Punktzahl unter diesem Wert werden gespeichert (Standard: 2000)
-   **Speicherung aktivieren**: Aktiviert oder deaktiviert die Speicherung von Daten
-   **GeoGuessr Map ID**: Die ID deiner Karte, zu der die schlechten Runden hinzugefügt werden sollen
-   **UI anzeigen**: Zeigt oder versteckt die Benutzeroberfläche
-   **Start minimiert**: Startet die Benutzeroberfläche im minimierten Zustand
-   **Benachrichtigungen**: Aktiviert oder deaktiviert Benachrichtigungen

## Vorteile der direkten Kartenintegration

-   Kein manueller Export/Import nötig
-   Deine Blunder-Map wird automatisch aktualisiert
-   Du kannst jederzeit direkt mit deinen schwierigen Standorten üben
-   Die Karte kann mit anderen Spielern geteilt werden

## Daten-Format

Die exportierten Daten (für lokal gespeicherte Runden) sind im folgenden Format:

```json
{
	"name": "blunders",
	"customCoordinates": [
		{
			"lat": 51.76695864044504,
			"lng": 16.798964561199682,
			"heading": 111.26121,
			"pitch": 0,
			"zoom": 0,
			"panoId": "IzQQBvooTdaYnxGicq4B_A",
			"countryCode": null,
			"stateCode": null,
			"extra": {
				"tags": [],
				"score": 1234,
				"gameId": "abcd1234",
				"mapName": "World",
				"date": "2023-03-20T14:30:00.000Z"
			}
		}
	],
	"extra": {
		"tags": {}
	}
}
```

Dieses Format ist kompatibel mit GeoGuessr-Karten, sodass du deine "Blunder" als eigene Map importieren kannst.

## Hinweise

-   Für Duelle werden Daten erst am Ende des Spiels gespeichert, um das Risiko einer Sperrung zu minimieren
-   Die Karte, zu der die Standorte hinzugefügt werden, muss im Entwurfsmodus sein
-   Falls keine Karte konfiguriert ist oder ein Fehler auftritt, werden die Daten lokal gespeichert
-   Bei Problemen mit der Karten-API kann ein Neuladen der Seite oder eine neue Anmeldung bei GeoGuessr helfen

## Unterstützte Browser

-   Chrome
-   Firefox
-   Edge
-   Safari (mit Tampermonkey)

## Abhängigkeiten

-   [GeoGuessr Event Framework](https://miraclewhips.dev/geoguessr-event-framework/geoguessr-event-framework.min.js)

## Lizenz

MIT
