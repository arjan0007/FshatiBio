import 'dart:async';
import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class NotificationService {
  static final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    // Request permission
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('✅ User granted notification permission');

      // Initialize local notifications
      const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosSettings = DarwinInitializationSettings(
        requestAlertPermission: true,
        requestBadgePermission: true,
        requestSoundPermission: true,
      );
      const initSettings = InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      );

      await _localNotifications.initialize(
        initSettings,
        onDidReceiveNotificationResponse: _onNotificationTapped,
      );

      // Get FCM token
      String? token = await _firebaseMessaging.getToken();
      if (token != null) {
        await _saveFCMToken(token);
        print('📱 FCM Token: $token');
      }

      // Listen for token refresh
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        _saveFCMToken(newToken);
        print('🔄 FCM Token refreshed: $newToken');
      });

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Handle background messages (when app is in background)
      FirebaseMessaging.onMessageOpenedApp.listen(_handleBackgroundMessage);
    } else {
      print('❌ User declined notification permission');
    }
  }

  static Future<void> _saveFCMToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    final savedToken = prefs.getString('fcm_token');
    
    // Only send to backend if token changed or user is logged in
    if (savedToken != token) {
      await prefs.setString('fcm_token', token);
      
      // Try to register token with backend if user is logged in
      try {
        final userToken = prefs.getString('auth_token');
        if (userToken != null) {
          await ApiService.registerFCMToken(token, userToken);
        }
      } catch (e) {
        print('⚠️ Could not register FCM token: $e');
      }
    }
  }

  static Future<void> registerTokenWithBackend(String? authToken) async {
    if (authToken == null) return;
    
    final prefs = await SharedPreferences.getInstance();
    final fcmToken = prefs.getString('fcm_token');
    
    if (fcmToken != null) {
      try {
        await ApiService.registerFCMToken(fcmToken, authToken);
        print('✅ FCM token registered with backend');
      } catch (e) {
        print('❌ Failed to register FCM token: $e');
      }
    }
  }

  static void _handleForegroundMessage(RemoteMessage message) {
    print('📬 Foreground message received: ${message.notification?.title}');
    
    // Show local notification
    _showLocalNotification(
      message.notification?.title ?? 'FshatiBio',
      message.notification?.body ?? '',
      message.data,
    );
  }

  static void _handleBackgroundMessage(RemoteMessage message) {
    print('📬 Background message opened: ${message.notification?.title}');
    // Handle navigation to specific screen based on message data
  }

  static void _onNotificationTapped(NotificationResponse response) {
    print('🔔 Notification tapped: ${response.payload}');
    // Handle navigation based on payload
    // This will be handled by the app's navigation system
  }

  // Get unread notification count
  static Future<int> getUnreadCount() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      
      if (token == null) return 0;

      final count = await ApiService.getUnreadNotificationCount(token);
      await updateBadgeCount(count);
      return count;
    } catch (e) {
      print('Error getting unread count: $e');
      return 0;
    }
  }

  // Update app badge count
  static Future<void> updateBadgeCount(int count) async {
    try {
      await _localNotifications.resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>()?.requestNotificationsPermission();
      
      // Set badge count (iOS)
      if (count > 0) {
        await _localNotifications.resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin>()?.requestPermissions(
          alert: true,
          badge: true,
          sound: true,
        );
      }
    } catch (e) {
      print('Error updating badge: $e');
    }
  }

  static Future<void> _showLocalNotification(
    String title,
    String body,
    Map<String, dynamic> data,
  ) async {
    // Get unread count and update badge
    final unreadCount = await getUnreadCount();

    const androidDetails = AndroidNotificationDetails(
      'fshatibio_channel',
      'FshatiBio Notifications',
      channelDescription: 'Notifications për porosi dhe promovime',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      enableVibration: true,
      playSound: true,
    );

    final iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
      badgeNumber: unreadCount,
    );

    final notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title,
      body,
      notificationDetails,
      payload: jsonEncode(data),
    );

    // Update badge count
    await updateBadgeCount(unreadCount);
  }

  // Background message handler (must be top-level function)
  static Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
    print('📬 Background message: ${message.notification?.title}');
  }
}

