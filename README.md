# Community Service Management Web App

A full-stack volunteer management dashboard built with React, Vite, Express, and MongoDB fallback storage. It supports volunteer sign-up, event creation, hours logging, coordinator review, community announcements, and feedback.

## Features

- Volunteer and coordinator authentication with JWT
- Event browsing, signup/leave, and organizer creation flow
- Hours logging with coordinator approval and volunteer level tracking
- Announcements and event feedback
- Local JSON fallback database when `MONGODB_URI` is not configured

## Prerequisites

- Node.js 18+ installed
- Optional: MongoDB instance if you want real database persistence

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the project root with any of these values:
   ```env
   PORT=3000
   JWT_SECRET=your_jwt_secret_here
   MONGODB_URI=mongodb+srv://username:password@cluster.example.com/dbname
   ```

   - If `MONGODB_URI` is omitted or invalid, the app will use `data/db.json` for local persistence.
   - `JWT_SECRET` is optional; a default value is used if not provided.

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

- The server uses Express and Vite middleware in development
- Authentication is handled with JWT tokens stored in localStorage
- The fallback JSON database is stored at `data/db.json`

## Useful Scripts

- `npm run dev` — start development server
- `npm run build` — build the client and bundle server
- `npm start` — start the production server
- `npm run clean` — remove build artifacts
- `npm run lint` — type-check with TypeScript
