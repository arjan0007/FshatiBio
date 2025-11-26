# 📦 Komandat për Git Push - FshatiBio

## Hapi 1: Shto të gjitha files në staging
```bash
git add .
```

## Hapi 2: Bëj commit me mesazh
```bash
git commit -m "Initial commit: FshatiBio E-commerce Platform v1.0"
```

Ose me mesazh më të detajuar:
```bash
git commit -m "Initial commit: FshatiBio E-commerce Platform

- Backend API me Node.js/Express
- Web Platform me Next.js
- Admin Panel me Next.js
- Mobile App me Flutter
- Database PostgreSQL
- Features: Products, Cart, Orders, Chat, Notifications, etc."
```

## Hapi 3: Konfiguro remote repository (nëse nuk e ke bërë tashmë)

### Për GitHub:
```bash
git remote add origin https://github.com/TU_USERNAME/FshatiBio.git
```

### Për GitLab:
```bash
git remote add origin https://gitlab.com/TU_USERNAME/FshatiBio.git
```

### Për të kontrolluar nëse ka remote:
```bash
git remote -v
```

## Hapi 4: Bëj push në remote repository

### Për branch master/main:
```bash
git branch -M main
git push -u origin main
```

Ose nëse branch-i është master:
```bash
git push -u origin master
```

---

## 📝 Komandat e Plota (Copy & Paste)

```bash
# 1. Shto të gjitha files
git add .

# 2. Bëj commit
git commit -m "Initial commit: FshatiBio E-commerce Platform v1.0"

# 3. Konfiguro remote (zëvendëso me URL-në tënde)
git remote add origin https://github.com/TU_USERNAME/FshatiBio.git

# 4. Push në main branch
git branch -M main
git push -u origin main
```

---

## ⚠️ Shënime të Rëndësishme

1. **Para se të bësh push**, sigurohu që:
   - Ke krijuar repository në GitHub/GitLab
   - Ke URL-në e saktë të repository-t
   - Nuk ke `.env` files me credentials (ato janë në `.gitignore`)

2. **Nëse ke ndryshime të reja pas commit-it të parë:**
   ```bash
   git add .
   git commit -m "Update: përshkrimi i ndryshimeve"
   git push
   ```

3. **Nëse ke konflikt:**
   ```bash
   git pull origin main --rebase
   # Zgjidh konfliktet
   git push
   ```

4. **Për të parë statusin:**
   ```bash
   git status
   ```

5. **Për të parë historikun e commit-ave:**
   ```bash
   git log --oneline
   ```

---

## 🔐 Authentication

Nëse përdor GitHub:
- **HTTPS**: Do të kërkojë username dhe Personal Access Token
- **SSH**: Duhet të konfigurosh SSH keys

Për të krijuar Personal Access Token në GitHub:
1. Shko te Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token
3. Zgjidh permissions: `repo` (full control)
4. Copy token dhe përdore si password kur të kërkojë

---

**Status**: Gati për push! 🚀

