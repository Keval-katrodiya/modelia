# Modelia AI Studio

A full-stack web application for simulating fashion image generation. Built with React, TypeScript, Express, and SQLite.

## Features

### User Authentication
- Secure signup and login with JWT
- Password hashing with bcrypt
- Session persistence with localStorage
- Protected routes

### Image Generation Studio
- Upload images (JPEG/PNG, max 10MB)
- Live image preview
- Text prompt input (max 500 characters)
- Style selection (Casual, Formal, Sporty, Elegant)
- Real-time generation with loading states
- 20% simulated "Model overloaded" errors
- Automatic retry with exponential backoff (up to 3 attempts)
- Abort generation mid-flight

### Generation History
- View last 5 generations
- Preview thumbnails with timestamps
- Click to restore previous generation settings
- Auto-refresh after new generations

### UI/UX
- Responsive design (mobile & desktop)
- Keyboard navigation support
- ARIA labels for accessibility
- Focus states for all interactive elements
- Clear error messages
- Loading indicators

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- Vitest + React Testing Library

### Backend
- Node.js + Express
- TypeScript (strict mode)
- SQLite database with better-sqlite3
- JWT authentication
- Multer for file uploads
- Zod for validation
- Jest + Supertest for testing

### DevOps
- Docker + Docker Compose
- GitHub Actions CI/CD
- ESLint + Prettier
- Coverage reports
- E2E tests with Playwright

## Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- Docker (optional, for containerized deployment)

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

### 2. Setup Environment Variables

Backend `.env` file (create as `backend/.env`):

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
DATABASE_PATH=./database.sqlite
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
```

Frontend `.env` file (create as `frontend/.env`):

```env
VITE_API_URL=/api
```

### 3. Run Development Servers

```bash
# Start both frontend and backend concurrently
npm run dev

# Or start separately:
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Backend Health Check: http://localhost:3001/health

## Project Structure

```
modelia/
├── backend/
│   ├── src/
│   │   ├── controllers/       # Request handlers
│   │   ├── db/               # Database setup
│   │   ├── middleware/       # Auth, upload, etc.
│   │   ├── models/           # Data models
│   │   ├── routes/           # API routes
│   │   ├── services/         # Business logic
│   │   ├── validators/       # Input validation
│   │   └── index.ts          # Entry point
│   ├── tests/                # Backend tests
│   ├── openapi.yaml          # API specification
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── contexts/         # React contexts
│   │   ├── hooks/            # Custom hooks
│   │   ├── pages/            # Page components
│   │   ├── utils/            # Utilities & API
│   │   ├── App.tsx           # Main app component
│   │   └── main.tsx          # Entry point
│   ├── tests/                # Frontend tests
│   └── package.json
│
├── tests/                    # E2E tests
├── .github/workflows/        # CI/CD
├── docker-compose.yml        # Docker setup
├── EVAL.md                   # Feature checklist
└── README.md                 # This file
```

## Testing

### Run All Tests

```bash
# Backend tests with coverage
cd backend
npm test

# Frontend tests with coverage
cd frontend
npm test

# E2E tests
npm run test:e2e
```

### Backend Tests

```bash
cd backend
npm test                # Run tests with coverage
npm run test:watch      # Watch mode
```

Tests include:
- Authentication (signup/login)
- Generations (create/list)
- Input validation
- Error handling
- 20% error simulation

### Frontend Tests

```bash
cd frontend
npm test                # Run tests with coverage
npm run test:watch      # Watch mode
```

Tests include:
- Component rendering
- User interactions
- Form validation
- API integration
- Error states
- Abort functionality

### E2E Tests

```bash
npm run test:e2e
```

Tests include:
- Complete user flow (signup → login → generate → history)
- Abort generation
- Form validation
- Protected routes
- Keyboard navigation

## Linting & Formatting

```bash
# Lint all code
npm run lint

# Format all code
npm run format

# Lint & fix backend
cd backend
npm run lint:fix

# Lint & fix frontend
cd frontend
npm run lint:fix
```

## Building for Production

### Manual Build

```bash
# Build backend
cd backend
npm run build
npm start

# Build frontend
cd frontend
npm run build
npm run preview
```

### Docker Build

```bash
# Build and start all services
docker-compose up --build

# Access the application:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
```

The Docker setup includes:
- Multi-stage builds for optimization
- PostgreSQL database (production)
- Nginx for frontend serving
- Volume persistence

## API Documentation

See `backend/openapi.yaml` for the complete OpenAPI 3.0 specification.

### Key Endpoints

#### Authentication

```
POST /auth/signup
POST /auth/login
```

#### Generations (Protected)

```
POST /generations           # Create generation
GET  /generations?limit=5   # Get recent generations
```

### Example API Usage

```bash
# Signup
curl -X POST http://localhost:3001/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Create Generation (with token)
curl -X POST http://localhost:3001/generations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "prompt=A beautiful summer dress" \
  -F "style=casual"

# Get Recent Generations
curl http://localhost:3001/generations?limit=5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## CI/CD

The project uses GitHub Actions for continuous integration:

- **Backend Tests**: Jest with coverage
- **Frontend Tests**: Vitest with coverage  
- **E2E Tests**: Playwright
- **Build Check**: Verify production builds
- **Coverage Reports**: Artifact uploads

See `.github/workflows/ci.yml` for configuration.

## Configuration

### TypeScript

Both frontend and backend use TypeScript with strict mode enabled:
- No implicit any
- Strict null checks
- No unused locals/parameters
- No implicit returns

### ESLint

Configured with:
- TypeScript ESLint rules
- React hooks rules (frontend)
- Recommended rulesets
- Custom rules for code quality

### Prettier

Consistent formatting across the project:
- 2 spaces indentation
- Single quotes
- Semicolons
- 100 character line width

## Troubleshooting

### Database Issues

```bash
# Delete and recreate database
rm backend/database.sqlite
# Restart backend - database will be recreated
```

### Port Conflicts

If ports 3000 or 3001 are in use:
- Backend: Change `PORT` in `backend/.env`
- Frontend: Change `server.port` in `frontend/vite.config.ts`

### Image Upload Issues

Ensure the uploads directory exists:
```bash
mkdir -p backend/uploads
```

### Module Not Found Errors

```bash
# Clean install all dependencies
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

## Development Tips

### Hot Reload

Both frontend and backend support hot reload during development:
- Frontend: Vite HMR
- Backend: tsx watch mode

### Database Inspection

```bash
# Install sqlite3 CLI
npm install -g sqlite3

# Open database
sqlite3 backend/database.sqlite

# Useful queries
SELECT * FROM users;
SELECT * FROM generations;
```

### API Testing

Use the included OpenAPI spec with tools like:
- Swagger UI
- Postman
- Insomnia

## Performance Considerations

- Image files are stored locally (consider CDN for production)
- SQLite is suitable for development (use PostgreSQL for production)
- Frontend uses code splitting for optimal loading
- Backend implements request timeouts
- File upload size limited to 10MB

## Security Notes

- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire after 7 days
- CORS configured for local development
- File upload validation (type, size)
- SQL injection prevention with parameterized queries
- XSS protection with React's built-in escaping

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run linting and tests
6. Submit a pull request

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- Check the troubleshooting section
- Review EVAL.md for feature locations
- Check the OpenAPI spec for API details
- Review test files for usage examples

## Future Enhancements

Potential improvements:
- Real AI model integration
- Image resizing/optimization
- Dark mode toggle
- WebSocket for real-time updates
- User profile management
- Generation sharing
- Rate limiting
- Redis caching
- S3 or CDN for images
- Email verification
- Password reset
- Social authentication

