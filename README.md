# MegaMart Backend API

## Project Overview
MegaMart is a backend-only RESTful API built with **Node.js**, **Express**, and **MongoDB (Mongoose)**. The goal of this project is to design a clean, modular backend that models a simplified e-commerce platform while demonstrating real-world backend best practices.

At this stage, the focus is **infrastructure, routing, and error handling** — ensuring the server boots cleanly, routes are wired correctly, and errors are handled in a centralized, predictable way.

---

## Tech Stack
- Node.js
- Express
- MongoDB + Mongoose
- Morgan (HTTP request logging)
- dotenv (environment variables)
- Nodemon (development server)

---

## Project Structure

```
megmart-api-project/
├── server.js
├── package.json
├── .env              # NOT committed
├── .gitignore
├── README.md
└── src/
    ├── config/
    │   ├── app.js
    │   └── env.js
    ├── db/
    │   └── connectToMongoDB.js
    ├── middleware/
    │   ├── errorHandler.js
    │   └── notFound.js
    ├── routes/
    │   ├── index.js
    │   ├── products.routes.js
    │   ├── customers.routes.js
    │   ├── carts.routes.js
    │   └── orders.routes.js
    ├── controllers/   # (to be implemented)
    ├── models/        # (to be implemented)
    └── utils/
```

---

## Application Boot Sequence

### 1. Server Entry Point (`server.js`)
- Loads environment variables
- Connects to MongoDB
- Starts the Express server **only after** a successful DB connection

This guarantees the API never starts in a half-broken state.

---

### 2. Express App Configuration (`src/config/app.js`)

Responsibilities:
- Initialize Express
- Register global middleware
- Mount API routes
- Register 404 and error-handling middleware

Key middleware:
- `express.json()` — parse JSON bodies
- `morgan("dev")` — request logging

Routes are mounted under:
```
/api
```

---

## Routing Architecture

### Central Router (`src/routes/index.js`)
All feature routes are mounted through a single router:

```js
/app.use("/api", routes)
```

Mounted resources:
- `/api/products`
- `/api/customers`
- `/api/carts`
- `/api/orders`

Each resource has its own router file to keep concerns isolated and scalable.

---

### Example: Customers Routes

`src/routes/customers.routes.js`:
- `GET /api/customers` → sanity check route
- `GET /api/customers/boom` → intentional error route (used to verify error handling)

This confirmed:
- Correct route stacking
- Proper use of `next(err)`
- Centralized error handling works as expected

---

## Health & Error Handling

### API Health Check
A health endpoint verifies API + database state:

```
GET /api/health
```

Returns:
- API status
- MongoDB connection state

---

### 404 Handling (`notFound.js`)
- Catches all unknown `/api/*` routes
- Returns a clean JSON response

---

### Central Error Handler (`errorHandler.js`)

Features:
- Handles all thrown or forwarded errors
- Respects custom status codes
- Logs stack traces in development
- Returns safe JSON responses to clients

This was verified using the `/api/customers/boom` route.

---

## Development Workflow

### Start the Server
```bash
nodemon server.js
```

Expected output:
- MongoDB connected
- Server running on configured port

---

## Git & Version Control

- `.env` is excluded via `.gitignore`
- Project uses incremental, meaningful commits
- Current commit milestone includes:
  - Express app wiring
  - MongoDB connection
  - Modular routing
  - Centralized error handling

---

## Next Steps
Planned implementation:
- Mongoose models (Products, Customers, Carts, Orders)
- Controllers to separate business logic from routes
- Filtering, sorting, and pagination
- Order creation workflow
- Stock management logic

---

## Status
🚧 **Foundation complete** — server, routing, and error handling are stable and production-aligned.

Further features will be layered on top of this foundation.

