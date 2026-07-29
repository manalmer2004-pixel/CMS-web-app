# Community Service Management Web App

A full-stack volunteer management dashboard built with React, Vite, Express, and Firebase Firestore. It supports volunteer sign-up, event creation, hours logging, coordinator review, community announcements, and feedback. If Firebase credentials are not available, the app automatically falls back to a local JSON database stored in data/db.json.

## Features

- Volunteer and coordinator authentication with JWT
- Event browsing, signup/leave, and organizer creation flow
- Hours logging with coordinator approval and volunteer level tracking
- Announcements and community feedback
- Firestore-backed persistence with a local JSON fallback

## Prerequisites

- Node.js 18+ installed
- A Google Cloud/Firebase service account with Firestore access, or a valid application default credentials setup
- Optional: the app will still run locally using the JSON fallback if no Firebase credentials are provided

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with the values you want to override:
   ```env
   PORT=3000
   JWT_SECRET=your_jwt_secret_here
   FIREBASE_PROJECT_ID=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
   ```

   - The app uses Firebase Firestore when a valid Google credentials file is available.
   - If `GOOGLE_APPLICATION_CREDENTIALS` is missing or invalid, it falls back to the local JSON database at `data/db.json`.
   - `JWT_SECRET` is optional; a default value is used if not provided.

3. If you are using Firebase, place your service account JSON file in the project root and point `GOOGLE_APPLICATION_CREDENTIALS` to it.

## Run Locally

Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

## Build and Start Production

```bash
npm run build
npm start
```

## Seeded Demo Users

The app includes seeded users when the local JSON database is created:

- Volunteer: `manalmer2004@gmail.com` / `password123`
- Coordinator: `marcus.director@community.org` / `password123`

## Notes

- The server uses Express and Vite middleware in development.
- Authentication is handled with JWT tokens stored in localStorage.
- Primary persistence is Firebase Firestore; the local fallback database is stored at `data/db.json`.

## Useful Scripts

- `npm run dev` — start the development server
- `npm run build` — build the client and bundle the server
- `npm start` — start the production server
- `npm run clean` — remove build artifacts
- `npm run lint` — type-check with TypeScript
