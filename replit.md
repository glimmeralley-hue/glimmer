# Glimmer

A React-based social commerce platform combining social media features with a digital/physical asset marketplace.

## Project Overview

- **Social Feed:** Users can post "Spills" (thoughts/posts) with images and embedded music (Spotify, YouTube, Apple Music).
- **Marketplace:** Users can register "Assets" to a "Global Ledger," view hottest assets, and initiate purchases.
- **Payments:** Integrated M-Pesa (mobile money) STK Push payment flow with real-time polling.
- **Auth:** Sign in / Sign up backed by an external Flask API.

## Architecture

- **Frontend:** React 19 (Create React App), Bootstrap 5, React Router DOM v7
- **Backend:** External Python/Flask API hosted at `https://glimmer.alwaysdata.net` (no local backend)
- **Package Manager:** npm
- **Build Tool:** react-scripts (Create React App)

## Project Structure

```
src/
  components/
    Landing.jsx      - Entry/home page
    Signin.jsx       - Sign in view
    Signup.jsx       - Sign up view
    Dashboard.jsx    - Main user dashboard with marketplace and M-Pesa payments
    Feed.jsx         - Social stream (Spills & Clap Backs)
    Addproduct.jsx   - Register new assets
    Navbar.jsx       - Navigation bar
    Profile.jsx      - User profile
    Loader.jsx       - Loading spinner
  css/               - Component-specific stylesheets
  App.js             - Main app with routing
  index.js           - Entry point
public/              - Static assets (index.html, icons, manifest)
```

## Running Locally

The app runs on port 5000 via `npm start`. Environment variables:
- `PORT=5000`
- `HOST=0.0.0.0`
- `DANGEROUSLY_DISABLE_HOST_CHECK=true`

## Deployment

Configured as a **static** deployment:
- Build command: `npm run build`
- Public directory: `build`
