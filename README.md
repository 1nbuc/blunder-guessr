# Blunder-Guessr

A Tampermonkey script for GeoGuessr that automatically collects weak rounds and adds them directly to your GeoGuessr map.

## Features

-   Automatically detect low score rounds (configurable threshold)
-   Add weak rounds directly to your GeoGuessr map
-   Fallback to local storage when map is not configured
-   Special handling for Duel mode (saves only after match completion)
-   Export locally stored rounds to JSON
-   Clean and simple UI

## Installation (End Users)

1. Install Tampermonkey browser extension
2. [Click here](https://github.com/1nbuc/blunder-guessr/releases/download/prod/blunder-guessr.user.js)
3. Create a new geoguessr map [here](https://www.geoguessr.com/me/maps) Use handpicked locations!
4. Copy the map ID you can find in the URL. Format https://www.geoguessr.com/map-maker/<map-id>
5. Open Settings of the extension in the right corner and enter the Map ID


## Usage

### Single Player
Just play, it will automatically add rounds to your map

### Duels
After each Duels match press the Breakdown button. The script will then autmatically add the locations to your map
Make sure Enable on Duels is checked in settings

## Settings
`Score threashold`: Threashold on which the guesses should be saved. E.g. 2000 configured. Every location guessd with a score lower then 2000 will be added to the map.


