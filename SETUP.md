# 🚀 Setup Guide - FshatiBio

## Prerequisites

Para se të filloni, sigurohuni që keni instaluar:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://www.postgresql.org/download/))
- **Flutter** 3.0+ ([Download](https://flutter.dev/docs/get-started/install))
- **Git** ([Download](https://git-scm.com/downloads))

## 📦 Setup Backend

1. **Instalo dependencies:**
```bash
cd backend
npm install
```

2. **Krijo database:**
```bash
# Hap PostgreSQL dhe krijoni database
createdb fshatibio
# Ose përmes psql:
psql -U postgres
CREATE DATABASE fshatibio;
```

3. **Konfiguro environment variables:**
```bash
cp .env.example .env
# Edito .env dhe vendos të dhënat e database
```

4. **Run migrations:**
```bash
npm run migrate
```

5. **Seed database:**
```bash
npm run seed
```

6. **Start server:**
```bash
npm run dev
```

Backend do të jetë në `http://localhost:3000`

**Default Admin Credentials:**
- Email: `admin@fshatibio.com`
- Password: `admin123`

⚠️ **Ndrysho password-in e admin pas login-it të parë!**

---

## 🌐 Setup Web Platform

1. **Instalo dependencies:**
```bash
cd web
npm install
```

2. **Konfiguro environment:**
```bash
cp .env.example .env.local
# Edito .env.local nëse është e nevojshme
```

3. **Start development server:**
```bash
npm run dev
```

Web platform do të jetë në `http://localhost:3001`

---

## 🛠️ Setup Admin Panel

1. **Instalo dependencies:**
```bash
cd admin
npm install
```

2. **Start development server:**
```bash
npm run dev
```

Admin panel do të jetë në `http://localhost:3002`

---

## 📱 Setup Mobile App

1. **Instalo dependencies:**
```bash
cd mobile
flutter pub get
```

2. **Run app:**
```bash
# Për Android
flutter run

# Për iOS (vetëm në macOS)
flutter run -d ios
```

**Shënim:** Për të testuar në emulator/device real, sigurohuni që backend-i është running dhe që IP address është i konfiguruar në `lib/services/api_service.dart`.

---

## 🧪 Testimi

### Backend API
```bash
cd backend
npm test
```

### Test manual i API
Mund të përdorni Postman ose curl:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test products
curl http://localhost:3000/api/products
```

---

## 📝 Next Steps

1. ✅ Setup-i i plotë i backend
2. ✅ Database schema dhe seed data
3. ✅ Web platform bazë
4. ✅ Admin panel bazë
5. ✅ Mobile app bazë
6. ⏳ Integrimi i plotë i frontend me backend
7. ⏳ Pagesa online (Faza 2)
8. ⏳ Push notifications
9. ⏳ App për kurierët (Faza 3)

---

## 🐛 Troubleshooting

### Backend nuk starton
- Kontrollo që PostgreSQL është running
- Verifiko credentials në `.env`
- Kontrollo që porti 3000 nuk është i zënë

### Database errors
- Sigurohu që migrations janë run
- Kontrollo që database ekziston
- Verifiko connection string në `.env`

### Mobile app nuk lidhet me backend
- Kontrollo që backend është running
- Ndrysho `baseUrl` në `api_service.dart` me IP address të saktë
- Për Android emulator, përdor `10.0.2.2` në vend të `localhost`

---

## 📚 Dokumentacioni

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [User Stories](./docs/USER_STORIES.md)
- [Development Guide](./docs/DEVELOPMENT.md)

---

## 💡 Tips

- Përdor `npm run dev` për development (me hot reload)
- Përdor `npm start` për production
- Për Flutter, përdor `flutter run --hot` për hot reload
- Përdor `.env.example` si template për environment variables

---

**Gëzuar coding! 🎉**

