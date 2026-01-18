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
    ├── controllers/
    │   ├── products.controller.js
    │   ├── customers.controller.js
    │   ├── carts.controller.js
    │   └── orders.controller.js
    ├── models/
    │   ├── Product.js
    │   ├── Customer.js
    │   ├── Cart.js
    │   └── Order.js
    └── utils/
    ├── asyncHandler.js
    ├── validateObjectId.js
    ├── normalizeEmail.js
    └── calculateCartTotal.js
```
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
app.use("/api", routes);
```

Mounted resources:
- `/api/products`
- `/api/customers`
- `/api/carts`
- `/api/orders`

Each resource has its own router file to keep concerns isolated and scalable.

---

## Controllers & Business Logic

Controllers are responsible for handling request logic and communicating with the database through Mongoose models. Routes remain thin and simply delegate work to controllers.

Implemented controllers:
- **Products** — full CRUD with filtering, sorting, and optional pagination
- **Customers** — full CRUD with unique email enforcement and search
- **Carts** — add, update, remove, and clear cart items with total calculation
- **Orders** — place orders from carts, snapshot pricing, decrement stock, and manage order status

This separation ensures clean, testable, and scalable code.

---

## Models

Mongoose models define the core domain entities:

- **Product**
  - name, description, price, category, stock, images
  - supports filtering and sorting

- **Customer**
  - name, email (unique), address, phone

- **Cart**
  - one cart per customer
  - items reference products with quantities

- **Order**
  - snapshot of purchased items
  - total price calculation
  - status workflow: pending → shipped → delivered / cancelled

---

## Utilities (Shared Helpers)

As the application grew, repeated logic was **normalized into reusable utility modules** to keep controllers thin and consistent.

Utilities live in `src/utils/` and contain **pure helper functions** that are framework-agnostic and reusable across controllers.

### Implemented Utilities

- **`asyncHandler.js`**  
  Wraps async controller functions and forwards errors to the global error handler, eliminating repetitive try/catch blocks.

- **`validateObjectId.js`**  
  Centralized MongoDB ObjectId validation used across Products, Customers, Carts, and Orders controllers.

- **`normalizeEmail.js`**  
  Ensures consistent lowercase and trimmed email values when creating or updating customers.

- **`calculateCartTotal.js`**  
  Computes cart totals based on populated product prices and quantities, keeping cart logic consistent.

This normalization step improved maintainability, reduced duplication, and clarified controller responsibilities.

---

## Example: Customers Routes

`src/routes/customers.routes.js` exposes:
- `GET /api/customers`
- `GET /api/customers/:id`
- `POST /api/customers`
- `PATCH /api/customers/:id`
- `DELETE /api/customers/:id`

This confirms:
- Correct route stacking
- Controller-based logic
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
- Major milestones committed:
  - Express app wiring and MongoDB connection
  - Modular routing and centralized error handling
  - Domain models and CRUD controllers
  - **Utility normalization to reduce duplicated logic**

---

## Health & Error Handling

---

## API Usage Examples

### Products
- `GET /api/products`
- `POST /api/products`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`

Supports filtering and sorting:
```
/api/products?category=tech&minPrice=100&maxPrice=600&sort=-price
```

---

### Customers
- `GET /api/customers`
- `POST /api/customers`
- `PATCH /api/customers/:id`
- `DELETE /api/customers/:id`

---

### Carts
- `GET /api/carts/:customerId`
- `POST /api/carts/:customerId/items`
- `PATCH /api/carts/:customerId/items/:productId`
- `DELETE /api/carts/:customerId/items/:productId`
- `DELETE /api/carts/:customerId/clear`

---

### Orders
- `POST /api/orders/from-cart/:customerId`
- `GET /api/orders`
- `GET /api/orders/:id`
- `PATCH /api/orders/:id/status`

---

## Status
**Core domain implemented** — models, controllers, and routes for Products, Customers, Carts, and Orders are fully functional.

The API now supports complete e-commerce workflows end-to-end.

**Foundation complete** — server, routing, and error handling are stable and production-aligned.

Further features will be layered on top of this foundation.

