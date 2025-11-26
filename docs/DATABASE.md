# Database Schema - FshatiBio

## 📊 Diagrami i Entiteteve

### Tabelat Kryesore

#### 1. Users (Përdoruesit)
```sql
- id (UUID, Primary Key)
- email (String, Unique)
- password_hash (String)
- first_name (String)
- last_name (String)
- phone (String)
- role (Enum: 'customer', 'admin', 'courier')
- is_active (Boolean)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### 2. Addresses (Adresat)
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → Users)
- street (String)
- city (String)
- postal_code (String)
- country (String, default: 'Albania')
- is_default (Boolean)
- delivery_notes (Text, optional)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### 3. Categories (Kategoritë)
```sql
- id (UUID, Primary Key)
- name (String, Unique)
- slug (String, Unique)
- description (Text, optional)
- image_url (String, optional)
- display_order (Integer)
- is_active (Boolean)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### 4. Products (Produktet)
```sql
- id (UUID, Primary Key)
- name (String)
- slug (String, Unique)
- description (Text)
- category_id (UUID, Foreign Key → Categories)
- price (Decimal)
- unit (Enum: 'kg', 'liter', 'piece')
- stock_quantity (Integer)
- min_order_quantity (Integer, default: 1)
- image_urls (Array of Strings)
- origin (String, optional) - zona/fermeri
- freshness_period (Integer) - ditë
- is_bio (Boolean, default: true)
- is_active (Boolean)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### 5. Suppliers (Furnizuesit/Fermerët)
```sql
- id (UUID, Primary Key)
- name (String)
- contact_person (String)
- phone (String)
- email (String)
- address (String)
- region (String)
- is_active (Boolean)
- notes (Text, optional)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### 6. Supplier_Products (Lidhja Furnizues-Produkt)
```sql
- id (UUID, Primary Key)
- supplier_id (UUID, Foreign Key → Suppliers)
- product_id (UUID, Foreign Key → Products)
- wholesale_price (Decimal)
- is_active (Boolean)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### 7. Orders (Porositë)
```sql
- id (UUID, Primary Key)
- order_number (String, Unique)
- user_id (UUID, Foreign Key → Users)
- address_id (UUID, Foreign Key → Addresses)
- status (Enum: 'pending', 'confirmed', 'preparing', 'on_delivery', 'delivered', 'cancelled')
- payment_method (Enum: 'cod', 'online')
- payment_status (Enum: 'pending', 'paid', 'failed', 'refunded')
- subtotal (Decimal)
- delivery_fee (Decimal)
- discount_amount (Decimal)
- total (Decimal)
- delivery_date (Date)
- delivery_time_slot (String)
- notes (Text, optional)
- courier_id (UUID, Foreign Key → Users, optional)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### 8. Order_Items (Artikujt e Porosisë)
```sql
- id (UUID, Primary Key)
- order_id (UUID, Foreign Key → Orders)
- product_id (UUID, Foreign Key → Products)
- quantity (Integer)
- unit_price (Decimal) - çmimi në momentin e porosisë
- total_price (Decimal)
- created_at (Timestamp)
```

#### 9. Coupons (Kuponat)
```sql
- id (UUID, Primary Key)
- code (String, Unique)
- type (Enum: 'percentage', 'fixed')
- value (Decimal)
- min_order_amount (Decimal, optional)
- max_discount (Decimal, optional)
- usage_limit (Integer, optional)
- used_count (Integer, default: 0)
- valid_from (Timestamp)
- valid_until (Timestamp)
- is_active (Boolean)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### 10. User_Coupons (Kuponat e Përdorura)
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → Users)
- coupon_id (UUID, Foreign Key → Coupons)
- order_id (UUID, Foreign Key → Orders)
- used_at (Timestamp)
```

#### 11. Cart (Shporta - Session-based ose User-based)
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → Users, nullable)
- session_id (String, nullable) - për guest users
- product_id (UUID, Foreign Key → Products)
- quantity (Integer)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### 12. Banners (Bannerat Promocional)
```sql
- id (UUID, Primary Key)
- title (String)
- image_url (String)
- link_url (String, optional)
- display_order (Integer)
- is_active (Boolean)
- valid_from (Timestamp)
- valid_until (Timestamp)
- created_at (Timestamp)
- updated_at (Timestamp)
```

#### 13. Notifications (Notifikimet)
```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → Users)
- type (Enum: 'order_status', 'promotion', 'system')
- title (String)
- message (Text)
- is_read (Boolean, default: false)
- link_url (String, optional)
- created_at (Timestamp)
```

## 🔗 Relationships

- User → Addresses (One-to-Many)
- User → Orders (One-to-Many)
- Category → Products (One-to-Many)
- Product → Order_Items (One-to-Many)
- Order → Order_Items (One-to-Many)
- Supplier → Supplier_Products (One-to-Many)
- Product → Supplier_Products (One-to-Many)
- User → Cart (One-to-Many)
- User → Notifications (One-to-Many)
- Coupon → User_Coupons (One-to-Many)

## 📝 Indexes

- `users.email` (Unique Index)
- `products.slug` (Unique Index)
- `orders.order_number` (Unique Index)
- `coupons.code` (Unique Index)
- `orders.user_id` (Index)
- `orders.status` (Index)
- `products.category_id` (Index)
- `products.is_active` (Index)

