# Firebase Cloud Messaging Setup

Ky dokument përshkruan si të konfigurohet Firebase Cloud Messaging (FCM) për push notifications në FshatiBio.

## 1. Krijimi i Firebase Project

1. Shko në [Firebase Console](https://console.firebase.google.com/)
2. Kliko "Add project" ose përdor një projekt ekzistues
3. Plotëso emrin e projektit (p.sh. "FshatiBio")
4. Aktivizo Google Analytics (opsionale)

## 2. Konfigurimi i Android App

1. Në Firebase Console, kliko "Add app" dhe zgjidh Android
2. Plotëso:
   - **Package name**: `com.fshatibio.mobile` (ose package name i aplikacionit tënd)
   - **App nickname**: FshatiBio Mobile
   - **Debug signing certificate SHA-1**: (opsionale për tani)
3. Shkarko `google-services.json`
4. Vendos `google-services.json` në `mobile/android/app/`
5. Shto në `mobile/android/build.gradle`:
   ```gradle
   dependencies {
       classpath 'com.google.gms:google-services:4.4.0'
   }
   ```
6. Shto në `mobile/android/app/build.gradle`:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

## 3. Konfigurimi i iOS App

1. Në Firebase Console, kliko "Add app" dhe zgjidh iOS
2. Plotëso:
   - **Bundle ID**: `com.fshatibio.mobile` (ose bundle ID i aplikacionit tënd)
   - **App nickname**: FshatiBio Mobile
3. Shkarko `GoogleService-Info.plist`
4. Vendos `GoogleService-Info.plist` në `mobile/ios/Runner/`
5. Hap `mobile/ios/Runner.xcodeproj` në Xcode
6. Shto `GoogleService-Info.plist` në projektin Xcode

## 4. Konfigurimi i Backend

1. Në Firebase Console, shko te **Project Settings** > **Service Accounts**
2. Kliko "Generate new private key"
3. Shkarko JSON file-in
4. Hap JSON file-in dhe merr:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (me escape characters)
5. Shto në `backend/.env`:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"
   ```

## 5. Testimi

### Test nga Backend:
```bash
# Në admin panel, mund të dërgosh një promotional notification
# Ose kur admin ndryshon statusin e porosisë, automatikisht dërgohet notification
```

### Test nga Mobile App:
1. Hap aplikacionin mobile
2. Kyçu si përdorues
3. FCM token do të regjistrohet automatikisht
4. Kur admin ndryshon statusin e porosisë, do të merrësh notification

## 6. Troubleshooting

### Problem: Notifications nuk dërgohen
- Verifiko që Firebase credentials janë të sakta në `backend/.env`
- Verifiko që `google-services.json` dhe `GoogleService-Info.plist` janë në vendet e duhura
- Verifiko që FCM token është regjistruar në database (tabela `users`, kolona `fcm_token`)

### Problem: Android notifications nuk shfaqen
- Verifiko që `google-services.json` është në `mobile/android/app/`
- Verifiko që Google Services plugin është shtuar në `build.gradle`
- Rebuild aplikacionin: `flutter clean && flutter pub get && flutter run`

### Problem: iOS notifications nuk shfaqen
- Verifiko që `GoogleService-Info.plist` është në `mobile/ios/Runner/`
- Verifiko që Push Notifications capability është aktivizuar në Xcode
- Verifiko që APNs certificates janë konfiguruar në Firebase Console

## 7. API Endpoints

### Register FCM Token
```
POST /api/notifications/register-token
Headers: Authorization: Bearer <token>
Body: { "fcm_token": "..." }
```

### Get Notifications
```
GET /api/notifications
Headers: Authorization: Bearer <token>
Query: ?page=1&limit=20&unread_only=false
```

### Mark as Read
```
PUT /api/notifications/:id/read
Headers: Authorization: Bearer <token>
```

### Mark All as Read
```
PUT /api/notifications/read-all
Headers: Authorization: Bearer <token>
```

### Get Unread Count
```
GET /api/notifications/unread-count
Headers: Authorization: Bearer <token>
```

### Send Promotional (Admin only)
```
POST /api/notifications/send-promotional
Headers: Authorization: Bearer <admin_token>
Body: {
  "title": "...",
  "message": "...",
  "link_url": "..." (optional)
}
```

## 8. Notifikimet Automatike

Sistemet dërgojnë automatikisht notifications për:
- **Order Status Changes**: Kur admin ndryshon statusin e porosisë (confirmed, preparing, on_delivery, delivered, cancelled)
- **Promotional**: Kur admin dërgon promotional notification për të gjithë përdoruesit

## 9. Next Steps

- [ ] Shto notification preferences (përdoruesit mund të aktivizojnë/deaktivizojnë lloje të ndryshme notifications)
- [ ] Shto rich notifications (me images dhe actions)
- [ ] Shto notification scheduling (dërgo në kohë të caktuar)
- [ ] Shto notification analytics (track opens, clicks, etc.)

