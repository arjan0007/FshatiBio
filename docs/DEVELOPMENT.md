# Development Guide - FshatiBio

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- Flutter 3.0+
- Git

### Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env me të dhënat e tua
npm run migrate
npm run seed
npm run dev
```

### Setup Mobile App

```bash
cd mobile
flutter pub get
flutter run
```

### Setup Web Platform

```bash
cd web
npm install
cp .env.example .env
npm run dev
```

### Setup Admin Panel

```bash
cd admin
npm install
cp .env.example .env
npm run dev
```

## 📝 Coding Standards

### Backend (Node.js/Express)
- Use ES6+ syntax
- Follow RESTful API conventions
- Use async/await for async operations
- Validate all inputs
- Handle errors properly
- Use JWT for authentication
- Write unit tests for services
- Write integration tests for API endpoints

### Frontend (React/Next.js)
- Use functional components with hooks
- Follow React best practices
- Use TypeScript where possible
- Component-based architecture
- Responsive design (mobile-first)
- Error boundaries
- Loading states

### Mobile (Flutter)
- Follow Flutter best practices
- Use Provider/Riverpod for state management
- Responsive design
- Handle offline state
- Error handling
- Loading indicators

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test              # Unit tests
npm run test:integration  # Integration tests
npm run test:coverage # Coverage report
```

### Frontend Tests
```bash
cd web
npm test
npm run test:e2e
```

## 🔄 Git Workflow

1. Create feature branch: `git checkout -b feature/feature-name`
2. Make changes and commit
3. Push to remote: `git push origin feature/feature-name`
4. Create Pull Request
5. Code review
6. Merge to main

### Branch Naming
- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates

## 📦 Deployment

### Backend
- Deploy to AWS/DigitalOcean
- Use PM2 or Docker for process management
- Set up environment variables
- Run migrations before deployment

### Mobile
- Build for iOS: `flutter build ios`
- Build for Android: `flutter build apk` or `flutter build appbundle`
- Submit to App Store / Play Store

### Web & Admin
- Build: `npm run build`
- Deploy to Vercel/Netlify or custom server

## 🔐 Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/fshatibio
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=fshatibio-images
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_APP_NAME=FshatiBio
```

## 🐛 Debugging

### Backend
- Use `console.log` for development
- Use proper logging library (Winston) for production
- Check database queries
- Monitor API response times

### Frontend
- Use React DevTools
- Check Network tab in browser
- Use Flutter DevTools for mobile

## 📚 Resources

- [Express.js Documentation](https://expressjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Flutter Documentation](https://flutter.dev/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

