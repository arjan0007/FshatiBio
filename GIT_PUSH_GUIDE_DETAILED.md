# 📚 Udhëzues i Detajuar: Si të Bësh Push në GitHub

## ✅ Hapi 1: Krijo Repository në GitHub

1. **Hap GitHub në shfletues:**
   - Shko te: https://github.com
   - Bëj login me llogarinë tënde (`arjan0007`)

2. **Kliko butonin "+" në këndin e sipërm djathtas:**
   - Zgjidh "New repository"

3. **Plotëso formularin:**
   - **Repository name**: Shkruaj emrin (p.sh. `FshatiBio` ose `fshatibio-platform`)
   - **Description** (opsionale): "E-commerce platform për produkte organike"
   - **Visibility**: Zgjidh "Public" ose "Private"
   - **MOS** zgjidh "Add README" (ne kemi tashmë files)
   - **MOS** zgjidh "Add .gitignore" (ne kemi tashmë `.gitignore`)
   - **MOS** zgjidh "Add license"

4. **Kliko "Create repository"**

5. **Kopjo URL-në e repository-t:**
   - Do të shohësh diçka si: `https://github.com/arjan0007/FshatiBio.git`
   - **Kopjo këtë URL** - do ta përdorësh më vonë

---

## ✅ Hapi 2: Krijo Personal Access Token (Për Authentication)

GitHub nuk lejon më password për push, duhet Personal Access Token.

### 2.1. Hap Settings në GitHub:
1. Kliko në **fotografinë tënde** (këndi i sipërm djathtas)
2. Zgjidh **"Settings"**

### 2.2. Shko te Developer Settings:
1. Në sidebar, scroll poshtë dhe kliko **"Developer settings"**
2. Në sidebar, kliko **"Personal access tokens"**
3. Zgjidh **"Tokens (classic)"**

### 2.3. Krijo Token të ri:
1. Kliko **"Generate new token"**
2. Zgjidh **"Generate new token (classic)"**

### 2.4. Konfiguro Token:
1. **Note**: Shkruaj diçka si "FshatiBio Project" (për të mbajtur mend)
2. **Expiration**: Zgjidh kohën (p.sh. "90 days" ose "No expiration")
3. **Select scopes**: Zgjidh **`repo`** (ky jep akses të plotë për repositories)
   - Nën `repo`, do të shohësh:
     - ✅ repo (full control of private repositories)
     - ✅ repo:status
     - ✅ repo_deployment
     - ✅ public_repo
     - ✅ repo:invite
     - ✅ security_events
4. Scroll poshtë dhe kliko **"Generate token"**

### 2.5. Kopjo Token:
1. **IMPORTANTE**: Kopjo token-in që shfaqet
2. **Ruaje në një vend të sigurt** - nuk do ta shohësh më pas!
3. Token do të duket diçka si: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

## ✅ Hapi 3: Konfiguro Git në Terminal

### 3.1. Hap Terminal në Cursor:
- Shtyp `Ctrl + `` (backtick) ose shko te **View → Terminal**

### 3.2. Sigurohu që je në directory-n e saktë:
```powershell
cd "C:\Users\User\Desktop\FshatiBio 1.0"
```

### 3.3. Konfiguro Git (nëse nuk e ke bërë tashmë):
```bash
git config --global user.name "arjan0007"
git config --global user.email "email-i-ynd@example.com"
```
**Zëvendëso me email-in tënd të GitHub!**

---

## ✅ Hapi 4: Shto Remote Repository

### 4.1. Shto remote origin:
```bash
git remote add origin https://github.com/arjan0007/EMRI_I_REPOSITORY_TEND.git
```

**Zëvendëso `EMRI_I_REPOSITORY_TEND` me emrin që ke vendosur në Hapi 1!**

**Shembull:**
```bash
git remote add origin https://github.com/arjan0007/FshatiBio.git
```

### 4.2. Verifiko që remote u shtua:
```bash
git remote -v
```

Duhet të shohësh:
```
origin  https://github.com/arjan0007/EMRI_I_REPOSITORY_TEND.git (fetch)
origin  https://github.com/arjan0007/EMRI_I_REPOSITORY_TEND.git (push)
```

---

## ✅ Hapi 5: Ndrysho Branch në "main" (nëse është "master")

```bash
git branch -M main
```

---

## ✅ Hapi 6: Bëj Push në GitHub

### 6.1. Ekzekuto push:
```bash
git push -u origin main
```

### 6.2. Do të kërkojë authentication:
- **Username**: Shkruaj `arjan0007`
- **Password**: **MOS shkruaj password-in tënd!** Shkruaj **Personal Access Token** që krijuat në Hapi 2!

### 6.3. Nëse shfaqet gabim:
- Nëse thotë "Authentication failed", kontrollo:
  - Username është i saktë
  - Token është i kopjuar plotësisht (pa hapësira)
  - Token ka permission `repo`

---

## ✅ Hapi 7: Verifiko Push-in

1. **Shko në GitHub:**
   - Hap repository-n që krijove: `https://github.com/arjan0007/EMRI_I_REPOSITORY_TEND`

2. **Duhet të shohësh:**
   - Të gjitha files e projektit
   - Commit message: "Initial commit: FshatiBio E-commerce Platform v1.0"
   - 153 files

---

## 🔄 Për Push-et e Ardhshëm (Pas Ndryshimeve)

Kur të bësh ndryshime në projekt dhe dëshiron t'i push-osh:

```bash
# 1. Shiko çfarë ka ndryshuar
git status

# 2. Shto files që dëshiron të commit-osh
git add .

# Ose shto file specifik:
git add emri_i_file.js

# 3. Bëj commit
git commit -m "Përshkrimi i ndryshimeve"

# 4. Push në GitHub
git push
```

**Shënim**: Pas push-it të parë, nuk duhet më `-u origin main`, vetëm `git push`.

---

## ❌ Zgjidhja e Problemeve

### Problemi 1: "remote origin already exists"
**Zgjidhje:**
```bash
git remote remove origin
git remote add origin https://github.com/arjan0007/EMRI_I_REPOSITORY_TEND.git
```

### Problemi 2: "Authentication failed"
**Zgjidhje:**
- Kontrollo që ke përdorur **Token**, jo password
- Krijo token të ri nëse ka skaduar
- Sigurohu që token ka permission `repo`

### Problemi 3: "Repository not found"
**Zgjidhje:**
- Kontrollo që URL-ja është e saktë
- Kontrollo që repository ekziston në GitHub
- Kontrollo që ke akses në repository

### Problemi 4: "Updates were rejected"
**Zgjidhje:**
Nëse në GitHub ke shtuar README ose .gitignore:
```bash
git pull origin main --allow-unrelated-histories
# Zgjidh konfliktet nëse ka
git push -u origin main
```

---

## 📝 Komandat e Plota (Copy & Paste)

**Zëvendëso `EMRI_I_REPOSITORY_TEND` me emrin e repository-t tënd!**

```bash
# 1. Konfiguro remote
git remote add origin https://github.com/arjan0007/EMRI_I_REPOSITORY_TEND.git

# 2. Ndrysho branch në main
git branch -M main

# 3. Push
git push -u origin main
```

---

## ✅ Checklist

Para se të fillosh:
- [ ] Ke krijuar repository në GitHub
- [ ] Ke kopjuar URL-në e repository-t
- [ ] Ke krijuar Personal Access Token
- [ ] Ke kopjuar token-in dhe e ke ruajtur në një vend të sigurt
- [ ] Je në directory-n e saktë në terminal
- [ ] Ke bërë commit (tashmë është bërë ✅)

Gati për push:
- [ ] Ke ekzekutuar `git remote add origin ...`
- [ ] Ke ekzekutuar `git branch -M main`
- [ ] Ke ekzekutuar `git push -u origin main`
- [ ] Ke shkruar username dhe token kur të kërkojë
- [ ] Ke verifikuar që files u push-uan në GitHub

---

**Status**: Gati për push! 🚀


