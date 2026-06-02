# Inventory & Order Management System

Production-ready full-stack assessment project with a React frontend, FastAPI backend, PostgreSQL database, and Docker Compose orchestration.

## Tech Stack

- Frontend: React, Vite, JavaScript
- Backend: Python, FastAPI, SQLAlchemy
- Database: PostgreSQL
- Containers: Docker, Docker Compose

## Features

- Product CRUD with unique SKU validation
- Customer create/list/detail/delete with unique email validation
- Order create/list/detail/delete
- Inventory checks before order placement
- Automatic stock reduction when an order is created
- Automatic stock restoration when an order is deleted
- Backend-calculated order totals
- User register/login endpoints with hashed passwords
- Navbar user display with logout
- Responsive dashboard with total products, customers, orders, and low-stock products
- Clear API error responses and frontend success/error messages

## API Endpoints

### Products

- `POST /products`
- `GET /products`
- `GET /products/{id}`
- `PUT /products/{id}`
- `DELETE /products/{id}`

### Customers

- `POST /customers`
- `GET /customers`
- `GET /customers/{id}`
- `DELETE /customers/{id}`

### Orders

- `POST /orders`
- `GET /orders`
- `GET /orders/{id}`
- `DELETE /orders/{id}`

### Utility

- `POST /auth/register`
- `POST /auth/login`
- `GET /dashboard`
- `GET /health`
- FastAPI docs: `/docs`

## Local Development With Docker Compose

Docker Compose uses the root `.env` file for frontend, backend, and database settings.

1. Copy the root environment defaults:

```bash
cp .env.example .env
```

2. Start the full system:

```bash
docker compose up --build
```

3. Open the app:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

PostgreSQL data is persisted in the named Docker volume `postgres_data`.

## Local Development Without Docker

Backend:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql+psycopg://inventory:change-me@localhost:5432/inventory_db
export CORS_ORIGINS=http://localhost:5173,http://localhost:3000
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
export VITE_API_BASE_URL=http://localhost:8000
npm install
npm run dev
```

## Environment Variables

Use one root `.env` file when running the full stack with Docker Compose.
When running services directly outside Docker, set the same variables in your shell or create local uncommitted `.env` files manually.

Backend:

- `DATABASE_URL`: PostgreSQL SQLAlchemy URL
- `CORS_ORIGINS`: Comma-separated frontend origins

Frontend:

- `VITE_API_BASE_URL`: Public backend URL

Database:

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

## Deployment Guide

### Backend on Render

1. Create a PostgreSQL database on Render.
2. Create a Web Service from this repository.
3. Set the root directory to `backend`.
4. Use Docker deployment with `backend/Dockerfile`.
5. Set `DATABASE_URL` to the Render PostgreSQL external/internal connection string.
6. Set `CORS_ORIGINS` to the deployed frontend URL.
7. After deployment, confirm `https://your-backend.onrender.com/health` returns `{"status":"ok"}`.

### Backend Image on Docker Hub

```bash
docker build -t your-dockerhub-user/inventory-backend:latest ./backend
docker push your-dockerhub-user/inventory-backend:latest
```

### Frontend on Vercel

1. Import the repository into Vercel.
2. Set the root directory to `frontend`.
3. Add `VITE_API_BASE_URL=https://your-backend.onrender.com`.
4. Deploy.

## Submission Checklist

- GitHub repository link: `TODO`
- Docker Hub backend image link: `TODO`
- Live frontend deployment URL: `TODO`
- Live backend API URL: `TODO`
