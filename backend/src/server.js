import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth-routes.js";
import searchRoutes from "./routes/search-routes.js";

/* <=== ENVIRONMENT SETUP ===> */

/*
 * dotenv loads backend/.env values into process.env.
 * ACCESS_TOKEN_SECRET is needed to sign and verify JWT tokens.
 */
dotenv.config();

/* <=== EXPRESS APP SETUP ===> */

const app = express();
const PORT = process.env.PORT || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendBuildPath = path.resolve(__dirname, "../../frontend/dist");

/* <=== GLOBAL MIDDLEWARE ===> */

/*
 * CORS allows the Vite React frontend to call this backend during local development.
 * In production, Express serves the React build from the same Render service.
 */
if (process.env.NODE_ENV !== "production") {
  app.use(
    cors({
      origin: "http://localhost:5173",
    }),
  );
}

/*
 * express.json() lets Express read JSON request bodies.
 * This app mainly uses query strings, but JSON parsing keeps the API predictable if more routes are added.
 */
app.use(express.json());

/* <=== API ROUTES ===> */

/*
 * Task requirement:
 * Use JWT to authorise API requests and secure the API.
 *
 * The auth route issues the app-level JWT used by the frontend.
 */
app.use("/api/auth", authRoutes);

/*
 * Task requirement:
 * The backend must process API requests and communicate with the iTunes Search API.
 *
 * The search route is protected by JWT middleware before it reaches the controller.
 */
app.use("/api/search", searchRoutes);

/* <=== HEALTH CHECK ROUTE ===> */

app.get("/api/health", (req, res) => {
  /*
   * This small route makes it easy to confirm that the backend server is running.
   */
  return res.status(200).json({ message: "Backend is running." });
});

/* <=== PRODUCTION FRONTEND ===> */

if (process.env.NODE_ENV === "production") {
  /*
   * Render builds the React frontend into frontend/dist.
   * Express serves those static files in production.
   */
  app.use(express.static(frontendBuildPath));

  /*
   * Any non-API request should return React's index.html.
   * This allows the deployed frontend to load from the same Render service.
   */
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    return res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
}

/* <=== SERVER STARTUP ===> */

function startServer() {
  /*
   * Fail early if the JWT secret is missing.
   * Without this secret, the backend cannot safely sign or verify tokens.
   */
  if (!process.env.ACCESS_TOKEN_SECRET) {
    console.log("ACCESS_TOKEN_SECRET is missing from the backend .env file.");
    process.exit(1);
  }

  /*
   * app.listen starts the Express server.
   */
  app.listen(PORT, () => {
    console.log(`Server is running on PORT:${PORT}`);
  });
}

startServer();