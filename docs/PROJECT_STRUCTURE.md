# Struktura e Projektit FshatiBio

## 📂 Struktura e Direktorive

```
FshatiBio/
├── backend/
│   ├── src/
│   │   ├── controllers/     # Controllers për routes
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Auth, validation, etc.
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Helper functions
│   │   └── config/          # Configuration files
│   ├── migrations/          # Database migrations
│   ├── seeds/              # Database seeds
│   ├── tests/              # Backend tests
│   ├── package.json
│   └── .env.example
│
├── mobile/
│   ├── lib/
│   │   ├── screens/         # Flutter screens
│   │   ├── widgets/         # Reusable widgets
│   │   ├── models/          # Data models
│   │   ├── services/        # API services
│   │   ├── providers/       # State management
│   │   └── utils/           # Utilities
│   ├── assets/              # Images, fonts, etc.
│   ├── pubspec.yaml
│   └── README.md
│
├── web/
│   ├── src/
│   │   ├── pages/           # Next.js pages
│   │   ├── components/      # React components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   ├── store/           # State management
│   │   └── utils/           # Utilities
│   ├── public/              # Static files
│   ├── package.json
│   └── next.config.js
│
├── admin/
│   ├── src/
│   │   ├── pages/           # Admin pages
│   │   ├── components/      # Admin components
│   │   ├── hooks/           # Custom hooks
│   │   ├── services/        # API services
│   │   └── utils/           # Utilities
│   ├── package.json
│   └── next.config.js
│
├── docs/                    # Dokumentacioni
│   ├── API.md
│   ├── DATABASE.md
│   ├── USER_STORIES.md
│   └── DEVELOPMENT.md
│
└── README.md
```

## 🔗 Lidhjet ndërmjet Komponentëve

- **Backend API** → Shërben të gjitha komponentët (mobile, web, admin)
- **Mobile App** → Komunikon me Backend API
- **Web Platform** → Komunikon me Backend API
- **Admin Panel** → Komunikon me Backend API (me privilegje të shtuara)

## 🔐 Autentifikimi

- JWT tokens për të gjitha klientët
- Role-based access control (Customer, Admin, Courier)
- Refresh tokens për siguri më të mirë

## 📊 Database

- PostgreSQL si database kryesor
- Migrations për version control të schema
- Seeds për të dhëna fillestare

