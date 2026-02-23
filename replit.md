# ARIF-BABU Bot

## Overview
This is a Facebook Messenger bot project that includes a web dashboard for uptime monitoring. The bot uses the `fca-priyansh` library to connect to Facebook Messenger.

## Project Structure
- `index.js` - Main entry point that starts both the web server (dashboard) and the bot
- `ARIF-BABU.js` - Main bot logic
- `ARIF-BABU.json` - Facebook appstate cookies (credentials)
- `config.json` - Bot configuration settings
- `includes/` - Bot modules (listen.js, controllers, database, handle)
- `models/` - Commands and events
- `languages/` - Language files (en.lang)
- `utils/` - Utility functions (logging)

## Running the Project
The application runs on port 5000 and serves:
1. A web dashboard (index.html) for uptime/status monitoring
2. The Facebook Messenger bot in the background

## Configuration
The bot requires valid Facebook cookies in `ARIF-BABU.json`. If cookies expire, you need to:
1. Login to Facebook in an incognito browser
2. Get fresh cookies using a cookie extension
3. Replace the appstate file with new cookies

## Tech Stack
- Node.js 20.x
- Express (web server)
- SQLite (local database)
- fca-priyansh (Facebook Chat API)

## Recent Changes
- 2026-01-17: Fixed gradient-string import for compatibility with latest version
