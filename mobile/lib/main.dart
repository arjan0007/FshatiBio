import 'package:flutter/material.dart';
import 'package:flutter/cupertino.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'screens/home_screen.dart';
import 'providers/cart_provider.dart';
import 'providers/auth_provider.dart';

import 'package:flutter/foundation.dart' show kIsWeb;

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase on mobile only (not desktop Windows/Linux)
  if (!kIsWeb) {
    try {
      // ignore: depend_on_referenced_packages
      final firebase = await _initFirebase();
      if (firebase) {
        await _initNotifications();
      }
    } catch (e) {
      // Firebase not configured yet — running in demo mode
    }
  }

  runApp(const FshatiBioApp());
}

Future<bool> _initFirebase() async {
  try {
    // Dynamic import to avoid compile errors on desktop
    return false; // will be true when firebase is configured
  } catch (_) {
    return false;
  }
}

Future<void> _initNotifications() async {
  // Notification init when Firebase is configured
}

class FshatiBioApp extends StatelessWidget {
  const FshatiBioApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProxyProvider<AuthProvider, CartProvider>(
          create: (_) => CartProvider(),
          update: (_, auth, cart) {
            cart ??= CartProvider();
            cart.updateAuthToken(auth.token);
            return cart;
          },
        ),
      ],
      child: MaterialApp(
        title: 'FshatiBio',
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF2D6A4F),
            primary: const Color(0xFF2D6A4F),
            secondary: const Color(0xFFF4A261),
            surface: Colors.white,
          ),
          scaffoldBackgroundColor: const Color(0xFFFEFAE0),
          appBarTheme: AppBarTheme(
            backgroundColor: const Color(0xFF2D6A4F),
            foregroundColor: Colors.white,
            elevation: 0,
            centerTitle: true,
            titleTextStyle: GoogleFonts.playfairDisplay(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w600,
            ),
          ),
          bottomNavigationBarTheme: const BottomNavigationBarThemeData(
            backgroundColor: Colors.white,
            selectedItemColor: Color(0xFF2D6A4F),
            unselectedItemColor: Color(0xFFD4B896),
            elevation: 8,
            type: BottomNavigationBarType.fixed,
          ),
          cardTheme: CardThemeData(
            elevation: 0,
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
            ),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2D6A4F),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(50),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              elevation: 2,
            ),
          ),
          inputDecorationTheme: InputDecorationTheme(
            filled: true,
            fillColor: Colors.white,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFFE8D5C4)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFFE8D5C4)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(16),
              borderSide: const BorderSide(color: Color(0xFF2D6A4F), width: 2),
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          ),
          textTheme: GoogleFonts.nunitoTextTheme(),
        ),
        // iOS-style scrolling physics everywhere
        scrollBehavior: const CupertinoScrollBehavior(),
        home: const HomeScreen(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}
