import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../providers/cart_provider.dart';
import 'cart_screen.dart';
import 'orders_screen.dart';
import 'products_screen.dart';
import 'profile_screen.dart';

// Design system colors
const Color forestDark = Color(0xFF1B4332);
const Color forestMid = Color(0xFF2D6A4F);
const Color forestLight = Color(0xFF40916C);
const Color forestPale = Color(0xFF52B788);
const Color forestGhost = Color(0xFFD8F3DC);
const Color honeyDark = Color(0xFFE76F51);
const Color honeyMid = Color(0xFFF4A261);
const Color honeyLight = Color(0xFFFCA03A);
const Color creamBg = Color(0xFFFEFAE0);
const Color creamCard = Color(0xFFFDF3C0);
const Color earthLight = Color(0xFFE8D5C4);
const Color earthMid = Color(0xFFD4B896);
const Color textDark = Color(0xFF1B2F1E);
const Color textMuted = Color(0xFF6B7C73);

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    ProductsScreen(),
    CartScreen(),
    OrdersScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: creamBg,
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: forestMid.withOpacity(0.10),
              blurRadius: 24,
              offset: const Offset(0, -6),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: BottomNavigationBar(
              currentIndex: _currentIndex,
              onTap: (index) {
                setState(() {
                  _currentIndex = index;
                });
              },
              backgroundColor: Colors.white,
              selectedItemColor: forestMid,
              unselectedItemColor: earthMid,
              type: BottomNavigationBarType.fixed,
              elevation: 0,
              selectedLabelStyle: GoogleFonts.nunito(
                fontWeight: FontWeight.w700,
                fontSize: 11,
              ),
              unselectedLabelStyle: GoogleFonts.nunito(
                fontWeight: FontWeight.w500,
                fontSize: 11,
              ),
              items: [
                BottomNavigationBarItem(
                  icon: _NavIcon(
                    icon: Icons.storefront_outlined,
                    activeIcon: Icons.storefront,
                    isSelected: _currentIndex == 0,
                  ),
                  label: 'Produktet',
                ),
                BottomNavigationBarItem(
                  icon: Consumer<CartProvider>(
                    builder: (context, cart, child) {
                      return Stack(
                        clipBehavior: Clip.none,
                        children: [
                          _NavIcon(
                            icon: Icons.shopping_basket_outlined,
                            activeIcon: Icons.shopping_basket,
                            isSelected: _currentIndex == 1,
                          ),
                          if (cart.itemCount > 0)
                            Positioned(
                              right: -4,
                              top: -2,
                              child: Container(
                                padding: const EdgeInsets.all(3),
                                decoration: const BoxDecoration(
                                  color: honeyDark,
                                  shape: BoxShape.circle,
                                ),
                                constraints: const BoxConstraints(
                                  minWidth: 17,
                                  minHeight: 17,
                                ),
                                child: Text(
                                  '${cart.itemCount}',
                                  style: GoogleFonts.nunito(
                                    color: Colors.white,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ),
                            ),
                        ],
                      );
                    },
                  ),
                  label: 'Shporta',
                ),
                BottomNavigationBarItem(
                  icon: _NavIcon(
                    icon: Icons.receipt_long_outlined,
                    activeIcon: Icons.receipt_long,
                    isSelected: _currentIndex == 2,
                  ),
                  label: 'Porositë',
                ),
                BottomNavigationBarItem(
                  icon: _NavIcon(
                    icon: Icons.person_outline,
                    activeIcon: Icons.person,
                    isSelected: _currentIndex == 3,
                  ),
                  label: 'Profili',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavIcon extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final bool isSelected;

  const _NavIcon({
    required this.icon,
    required this.activeIcon,
    required this.isSelected,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeInOut,
      padding: EdgeInsets.symmetric(
        horizontal: isSelected ? 14 : 10,
        vertical: 5,
      ),
      decoration: BoxDecoration(
        color: isSelected ? forestGhost : Colors.transparent,
        borderRadius: BorderRadius.circular(22),
      ),
      child: Icon(
        isSelected ? activeIcon : icon,
        size: 22,
        color: isSelected ? forestMid : earthMid,
      ),
    );
  }
}
