# AGENTS.md - Sports Complex Manager

This document provides instructions for agents working on this codebase.

## 1. Build/Lint/Test Commands

### Frontend (React + Vite + Tailwind)

- **Run Development Server:**
  ```bash
  cd frontend
  npm run dev
  ```

- **Build for Production:**
  ```bash
  cd frontend
  npm run build
  ```

- **Lint Code:**
  ```bash
  cd frontend
  npm run lint
  ```

- **Preview Build:**
  ```bash
  cd frontend
  npm run preview
  ```

- **Single Test:** (There are currently no automated tests set up, but `vite` is used for dev server).

### Backend (Express + Node.js)

- **Run Development Server:**
  ```bash
  cd backend
  npm run dev
  ```

- **Run Production Server:**
  ```bash
  cd backend
  npm start
  ```

- **Linting:** No explicit linting script is defined in `package.json`. However, the project uses standard JavaScript.
- **Testing:** No tests are currently configured.

## 2. Code Style Guidelines

### General

- **Language:** English for code and comments. Spanish is used in some user-facing strings (e.g., 'API del Complejo Deportivo funcionando'), maintain consistency with existing strings.
- **Architecture:**
  - **Backend:** MVC pattern (Routes -> Controllers -> Models). Database interaction via `pg` library.
  - **Frontend:** Component-based architecture using React functional components and Hooks.

### Backend (Node.js/Express)

- **Imports:** Use `require()` (CommonJS) as per the existing codebase.
  ```javascript
  const express = require('express');
  const authMiddleware = require('./middleware/authMiddleware');
  ```
- **Formatting:** Use standard indentation (2 or 4 spaces). The existing code uses 4 spaces in some files, but 2 in others. Aim for consistency within a file.
- **Error Handling:** Use the global error handler middleware at the end of `app.js`:
  ```javascript
  app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).send('Algo salió mal!');
  });
  ```
  Prefer synchronous error handling in controllers.
- **Database:** Use `pg` Pool. Configuration in `src/config/db.js`.
- **Security:** Use `bcryptjs` for password hashing and `jsonwebtoken` for auth. All sensitive routes must use `authMiddleware`.

### Frontend (React)

- **Imports:** Use ES6 import/export syntax.
  ```javascript
  import React from 'react';
  import axios from 'axios';
  ```
- **Styling:** Tailwind CSS is used. Use utility classes for styling.
  ```jsx
  <div className="bg-white p-6 rounded-lg shadow-sm">
  ```
- **State Management:** React Context (`AuthContext`) is used for global state (authentication).
- **Routing:** `react-router-dom` is used.
- **HTTP Client:** `axios` is used for API calls.
- **Naming:**
  - Components: PascalCase (e.g., `CanchaList`, `TurnoForm`)
  - Files: PascalCase for components, camelCase for utilities/hooks.
- **Linting:** Follow the ESLint rules defined in `package.json`. Run `npm run lint` before committing.

## 3. Project Structure

- **Root**
  - `backend/`: Express API.
    - `src/app.js`: Entry point.
    - `src/routes/`: API route definitions.
    - `src/controllers/`: Request logic.
    - `src/models/`: Database queries (SQL).
    - `src/middleware/`: Auth middleware.
  - `frontend/`: React application.
    - `src/components/`: UI components.
    - `src/context/`: React Contexts.
    - `src/services/`: API services.
    - `src/utils/`: Helper functions.

## 4. Important Notes

- **Environment Variables:** Backend uses `.env` file (not tracked in git) for DB credentials and JWT secret.
- **Database:** PostgreSQL is used. Migrations or setup scripts are in the root/backend directories (e.g., `esquema.sql`).
- **No Tests:** The project currently lacks automated tests. Be cautious when modifying logic.
