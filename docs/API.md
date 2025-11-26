# API Documentation - FshatiBio

## 🔗 Base URL
```
Development: http://localhost:3000/api
Production: https://api.fshatibio.com/api
```

## 🔐 Autentifikimi

Të gjitha request-et që kërkojnë autentifikim duhet të përfshijnë header:
```
Authorization: Bearer <JWT_TOKEN>
```

## 📋 Endpoints

### Auth Endpoints

#### POST /auth/register
Regjistrim i klientit të ri

**Request Body:**
```json
{
  "email": "klient@example.com",
  "password": "password123",
  "first_name": "Emri",
  "last_name": "Mbiemri",
  "phone": "+355691234567"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "klient@example.com",
      "first_name": "Emri",
      "last_name": "Mbiemri"
    },
    "token": "jwt_token_here"
  }
}
```

#### POST /auth/login
Login për përdoruesit ekzistues

**Request Body:**
```json
{
  "email": "klient@example.com",
  "password": "password123"
}
```

#### POST /auth/refresh
Refresh token

---

### Products Endpoints

#### GET /products
Merr listën e produkteve

**Query Parameters:**
- `category` (optional) - ID e kategorisë
- `search` (optional) - Kërkim me tekst
- `page` (optional) - Numri i faqes
- `limit` (optional) - Numri i produkteve për faqe

**Response:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": "uuid",
        "name": "Qumësht i freskët",
        "slug": "qumesht-i-fresket",
        "description": "Qumësht BIO i freskët...",
        "category": {
          "id": "uuid",
          "name": "Qumësht"
        },
        "price": 150,
        "unit": "liter",
        "stock_quantity": 50,
        "image_urls": ["url1", "url2"],
        "is_bio": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

#### GET /products/:id
Merr detajet e një produkti

#### GET /categories
Merr listën e kategorive

---

### Cart Endpoints

#### GET /cart
Merr shportën e përdoruesit

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "product": {
          "id": "uuid",
          "name": "Qumësht i freskët",
          "price": 150,
          "unit": "liter",
          "image_urls": ["url1"]
        },
        "quantity": 2,
        "total_price": 300
      }
    ],
    "subtotal": 300,
    "delivery_fee": 200,
    "total": 500
  }
}
```

#### POST /cart/add
Shto produkt në shportë

**Request Body:**
```json
{
  "product_id": "uuid",
  "quantity": 2
}
```

#### PUT /cart/update/:item_id
Përditëso sasinë e artikullit

**Request Body:**
```json
{
  "quantity": 3
}
```

#### DELETE /cart/remove/:item_id
Hiq artikull nga shporta

#### POST /cart/apply-coupon
Apliko kupon zbritjeje

**Request Body:**
```json
{
  "code": "DISCOUNT10"
}
```

---

### Orders Endpoints

#### POST /orders
Krijo porosi të re

**Request Body:**
```json
{
  "address_id": "uuid",
  "payment_method": "cod",
  "delivery_date": "2025-12-01",
  "delivery_time_slot": "10:00-14:00",
  "notes": "Lëni në derë"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "order_number": "FSB-2025-001",
      "status": "pending",
      "total": 500,
      "delivery_date": "2025-12-01"
    }
  }
}
```

#### GET /orders
Merr listën e porosive të përdoruesit

#### GET /orders/:id
Merr detajet e një porosie

#### PUT /orders/:id/cancel
Anulo porosi (vetëm nëse statusi është 'pending')

---

### Addresses Endpoints

#### GET /addresses
Merr adresat e përdoruesit

#### POST /addresses
Shto adresë të re

**Request Body:**
```json
{
  "street": "Rruga Dëshmorët",
  "city": "Tiranë",
  "postal_code": "1001",
  "is_default": true,
  "delivery_notes": "Kati 3, Apartamenti 5"
}
```

#### PUT /addresses/:id
Përditëso adresë

#### DELETE /addresses/:id
Fshi adresë

---

### Admin Endpoints

#### GET /admin/dashboard
Statistikat e dashboard-it

**Response:**
```json
{
  "success": true,
  "data": {
    "total_orders": 150,
    "pending_orders": 12,
    "today_sales": 45000,
    "weekly_sales": 250000,
    "monthly_sales": 1000000
  }
}
```

#### GET /admin/orders
Merr të gjitha porositë (me filtra)

#### PUT /admin/orders/:id/status
Përditëso statusin e porosisë

**Request Body:**
```json
{
  "status": "confirmed",
  "courier_id": "uuid" // optional
}
```

#### GET /admin/products
Merr të gjitha produktet (admin view)

#### POST /admin/products
Krijo produkt të ri

#### PUT /admin/products/:id
Përditëso produkt

#### DELETE /admin/products/:id
Fshi produkt (soft delete)

#### GET /admin/suppliers
Merr listën e furnizuesve

#### POST /admin/suppliers
Krijo furnizues të ri

#### GET /admin/coupons
Merr listën e kuponave

#### POST /admin/coupons
Krijo kupon të ri

---

### Banner Endpoints

#### GET /banners
Merr bannerat aktive

---

## 🚨 Error Responses

Të gjitha gabimet kthehen në format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mesazh i gabimit",
    "details": {} // optional
  }
}
```

**Status Codes:**
- 200 - Success
- 201 - Created
- 400 - Bad Request
- 401 - Unauthorized
- 403 - Forbidden
- 404 - Not Found
- 500 - Internal Server Error

