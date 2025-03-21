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
2. Open Tampermonkey dashboard
3. Create a new script
4. Copy the contents of the `dist/blunder-guessr.user.js` file
5. Save the script

## Usage

1. Start playing GeoGuessr
2. Configure your Map ID in the settings (if needed)
3. Low-scoring rounds will automatically be detected and saved


### Getting Started

1. Clone the repository
2. Install dependencies:
    ```
    npm install
    ```
3. Start the development server:
    ```
    npm run dev
    ```
4. Build for production:
    ```
    npm run build
    ```


## License

ISC
