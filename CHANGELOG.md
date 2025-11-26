# Changelog - FshatiBio

## [1.1.0] - 2025-11-25

### ✨ Added
- **Address Management Page** (`/addresses`)
  - Lista e adresave të ruajtura
  - Shtim/Edito/Fshirje adresash
  - Vendosje adresë si default
  - Shënime për dorëzim

- **User Profile Page** (`/profile`)
  - Shikimi i informacioneve personale
  - Link të shpejtë për porositë, adresat, shportën
  - Logout functionality

- **Coupon System**
  - Backend API për validim dhe aplikim kuponash
  - Frontend integration në checkout
  - Admin panel për menaxhimin e kuponave
  - Support për percentage dhe fixed discounts
  - Min order amount dhe max discount limits
  - Usage limits

- **Supplier Management** (Admin)
  - CRUD i plotë për furnizuesit
  - Lista e të gjitha furnizuesve
  - Menaxhim kontaktet dhe informacionet

- **Coupon Management** (Admin)
  - Krijo/Edito kuponat
  - Menaxhim validiteti dhe limits
  - Tracking i përdorimeve

### 🔄 Updated
- **Checkout Page**
  - Shtuar suport për kuponat
  - Llogaritje e saktë e totalit me zbritje
  - UI më i mirë për aplikimin e kuponave

- **Navigation**
  - Shtuar link për Profile dhe Orders
  - Conditional rendering bazuar në authentication

### 🐛 Fixed
- Improved error handling në checkout
- Better validation për kuponat

---

## [1.0.0] - 2025-11-25

### ✨ Initial Release
- Backend API me të gjitha endpoints
- Web Platform me të gjitha faqet kryesore
- Admin Panel për menaxhimin e produkteve dhe porosive
- Mobile App structure (Flutter)
- Database schema dhe migrations
- Authentication system (JWT)
- Cart dhe Checkout flow
- Orders management

