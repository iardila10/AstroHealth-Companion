# AstroHealth Companion

**AstroHealth Companion** is a health-monitoring web app designed to support astronaut well-being during space missions. It helps crew members record key health indicators, review changes over time, and identify when a measurement may need attention.

## What it does

The app tracks heart rate, blood pressure, body temperature, sleep, glucose, and fatigue. It evaluates measurements using configurable thresholds for different mission environments, including spacecraft and lunar bases, and presents an overall status with alerts and prioritized recommendations.

Its dashboard helps users review health trends and indicators at a glance. Measurements can be entered without specialized hardware, and the app can save data locally when offline and sync it when connectivity returns.

## Why it matters

Space missions can make health monitoring and access to support more challenging. AstroHealth Companion aims to make personal health information easier to record, understand, and act on—helping astronauts stay aware of their well-being while exploring beyond Earth.

## Technology

- **Frontend:** React, TypeScript, and Vite
- **Backend:** Python and FastAPI
- **Data storage:** SQLite locally; PostgreSQL is configured for deployment
- **Offline support:** Browser storage for queued measurements and cached data

## Important note

AstroHealth Companion is a project prototype intended to support health awareness. It is not a medical device and does not replace professional medical advice, diagnosis, or treatment.
