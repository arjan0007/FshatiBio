import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/notification_service.dart';
import 'login_screen.dart';
import 'wishlist_screen.dart';
import 'notifications_screen.dart';
import 'profile_edit_screen.dart';
import 'change_password_screen.dart';
import 'address_management_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  int _unreadNotificationCount = 0;

  @override
  void initState() {
    super.initState();
    _loadUnreadCount();
    // Refresh count every 30 seconds
    Future.delayed(const Duration(seconds: 30), () {
      if (mounted) {
        _loadUnreadCount();
      }
    });
  }

  Future<void> _loadUnreadCount() async {
    final count = await NotificationService.getUnreadCount();
    if (mounted) {
      setState(() {
        _unreadNotificationCount = count;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (auth.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (!auth.isAuthenticated) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.lock_outline, size: 64, color: Colors.grey),
            const SizedBox(height: 16),
            const Text('Duhet të kyçeni për të parë profilin'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              child: const Text('Kyçu'),
            ),
          ],
        ),
      );
    }

    final user = auth.user!;

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Text(
            'Përshëndetje, ${user.firstName}!',
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 30),
          Card(
            child: ListTile(
              leading: const Icon(Icons.email),
              title: Text(user.email),
              subtitle: const Text('Email'),
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.phone),
              title: Text(user.phone ?? '-'),
              subtitle: const Text('Telefon'),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('Ndrysho Profil'),
              subtitle: const Text('Ndrysho të dhënat personale'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const ProfileEditScreen(),
                  ),
                );
              },
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.lock),
              title: const Text('Ndrysho Fjalëkalimin'),
              subtitle: const Text('Ndrysho fjalëkalimin e llogarisë'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const ChangePasswordScreen(),
                  ),
                );
              },
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.location_on),
              title: const Text('Adresat e Mia'),
              subtitle: const Text('Menaxho adresat e dorëzimit'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const AddressManagementScreen(),
                  ),
                );
              },
            ),
          ),
          Card(
            child: ListTile(
              leading: Stack(
                children: [
                  const Icon(Icons.notifications),
                  if (_unreadNotificationCount > 0)
                    Positioned(
                      right: 0,
                      top: 0,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          _unreadNotificationCount > 99 ? '99+' : '$_unreadNotificationCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              ),
              title: Row(
                children: [
                  const Text('Njoftimet'),
                  if (_unreadNotificationCount > 0)
                    Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _unreadNotificationCount > 99 ? '99+' : '$_unreadNotificationCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
              subtitle: Text(
                _unreadNotificationCount > 0
                    ? '$_unreadNotificationCount njoftime të palexuara'
                    : 'Shiko njoftimet e tua',
              ),
              trailing: const Icon(Icons.chevron_right),
              onTap: () async {
                await Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const NotificationsScreen(),
                  ),
                );
                // Refresh count after returning from notifications screen
                _loadUnreadCount();
              },
            ),
          ),
          Card(
            child: ListTile(
              leading: const Icon(Icons.favorite, color: Colors.red),
              title: const Text('Lista e Dëshirave'),
              subtitle: const Text('Produktet që ke ruajtur'),
              trailing: const Icon(Icons.chevron_right),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const WishlistScreen(),
                  ),
                );
              },
            ),
          ),
          const Spacer(),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () async {
                await auth.logout();
                context.read<CartProvider>().updateAuthToken(null);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: const Text('Dil'),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

