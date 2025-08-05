# Movie Database Backend - Node.js

A RESTful API backend for the Movie Database application built with Node.js, Express, and SQLite.

## Features

- JWT-based authentication
- CRUD operations for movies
- File upload for movie posters
- SQLite database with automatic initialization
- Input validation and error handling
- CORS enabled for frontend integration

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. For production:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Movies
- `GET /api/movies` - Get all movies (with pagination)
- `GET /api/movies/:id` - Get single movie
- `POST /api/movies` - Create new movie
- `PATCH /api/movies/:id` - Update movie
- `DELETE /api/movies/:id` - Delete movie

### Health Check
- `GET /api/health` - API health status

## Default Credentials

- Email: `admin@example.com`
- Password: `password123`

## Environment Variables

Create a `.env` file with:
```
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
DB_PATH=./database.sqlite
UPLOAD_PATH=./uploads
```

## Database

The application uses SQLite with automatic table creation and default user setup.

## File Uploads

Movie posters are uploaded to the `/uploads` directory and served statically.

