import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../models/cart_item.dart';
import '../models/cart_summary.dart';
import 'checkout_screen.dart';
import 'login_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  static const _primaryColor = Color(0xFF16a34a);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final auth = context.read<AuthProvider>();
      if (auth.isAuthenticated) {
        context.read<CartProvider>().refreshCart();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (auth.isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (!auth.isAuthenticated) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Shporta'),
          backgroundColor: _primaryColor,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        body: _buildGuestState(context),
      );
    }

    return Consumer<CartProvider>(
      builder: (context, cartProvider, _) {
        if (cartProvider.isLoading) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final cart = cartProvider.cart;
        if (cart.items.isEmpty) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('Shporta'),
              backgroundColor: _primaryColor,
              foregroundColor: Colors.white,
              elevation: 0,
            ),
            body: _buildEmptyState(context),
          );
        }

        return Scaffold(
          appBar: _buildCartAppBar(cart),
          backgroundColor: const Color(0xFFF6F8FB),
          body: Column(
            children: [
              Expanded(
                child: RefreshIndicator(
                  onRefresh: cartProvider.refreshCart,
                  color: _primaryColor,
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 140),
                    itemCount: cart.items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = cart.items[index];
                      return Dismissible(
                        key: ValueKey(item.id),
                        direction: DismissDirection.endToStart,
                        background: _buildDismissibleBackground(),
                        onDismissed: (_) {
                          cartProvider.removeItem(item.id);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Row(
                                children: [
                                  const Icon(Icons.check_circle, color: Colors.white),
                                  const SizedBox(width: 8),
                                  Text('${item.product.name} u hoq nga shporta'),
                                ],
                              ),
                              backgroundColor: Colors.redAccent,
                              behavior: SnackBarBehavior.floating,
                              margin: const EdgeInsets.all(16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          );
                        },
                        child: _buildCartItemCard(item, cartProvider),
                      );
                    },
                  ),
                ),
              ),
              _buildSummaryCard(cart, context),
            ],
          ),
        );
      },
    );
  }

  Widget _summaryRow(String label, double value, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label),
          Text(
            '${value.toStringAsFixed(2)} L',
            style: TextStyle(fontWeight: bold ? FontWeight.bold : FontWeight.normal),
          ),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildCartAppBar(CartSummary cart) {
    return AppBar(
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Shporta'),
          Text(
            '${cart.items.length} produkte',
            style: const TextStyle(fontSize: 12),
          ),
        ],
      ),
      backgroundColor: _primaryColor,
      foregroundColor: Colors.white,
      elevation: 0,
    );
  }

  Widget _buildCartItemCard(CartItem item, CartProvider cartProvider) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.shade200,
            blurRadius: 10,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: item.product.imageUrls.isNotEmpty
                  ? Image.network(
                      item.product.imageUrls.first,
                      width: 80,
                      height: 80,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => _buildImagePlaceholder(),
                    )
                  : _buildImagePlaceholder(),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.product.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${item.unitPrice.toStringAsFixed(2)} L / ${item.product.unit}',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      _buildQuantityControl(item, cartProvider),
                      const Spacer(),
                      Text(
                        '${item.totalPrice.toStringAsFixed(2)} L',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                          color: _primaryColor,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuantityControl(CartItem item, CartProvider cartProvider) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          _quantityButton(
            icon: Icons.remove,
            onTap: () {
              if (item.quantity > 1) {
                cartProvider.updateItem(item.id, item.quantity - 1);
              } else {
                cartProvider.removeItem(item.id);
              }
            },
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            child: Text(
              '${item.quantity}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          _quantityButton(
            icon: Icons.add,
            onTap: () => cartProvider.updateItem(item.id, item.quantity + 1),
          ),
        ],
      ),
    );
  }

  Widget _quantityButton({required IconData icon, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.all(6),
        child: Icon(icon, size: 18, color: _primaryColor),
      ),
    );
  }

  Widget _buildSummaryCard(CartSummary cart, BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Color(0x11000000),
            blurRadius: 10,
            offset: Offset(0, -4),
          ),
        ],
      ),
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            Row(
              children: [
                const Icon(Icons.loyalty, color: _primaryColor),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    cart.subtotal >= 5000
                        ? '🎉 Nëntotali i lartë! Kontakto suportin për oferta speciale.'
                        : 'Shto edhe ${ (5000 - cart.subtotal).clamp(0, double.infinity).toStringAsFixed(2) } L për të marrë oferta speciale.',
                    style: TextStyle(
                      color: Colors.grey.shade700,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _summaryRow('Nëntotali', cart.subtotal),
            _summaryRow('Dërgesa', cart.deliveryFee),
            const Divider(),
            _summaryRow('Totali', cart.total, bold: true),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => CheckoutScreen(cart: cart),
                    ),
                  );
                },
                icon: const Icon(Icons.lock),
                label: const Text('Vazhdo te Checkout'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: _primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDismissibleBackground() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.redAccent.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
      ),
      alignment: Alignment.centerRight,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: const Icon(Icons.delete, color: Colors.redAccent),
    );
  }

  Widget _buildImagePlaceholder() {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Icon(Icons.image, color: Colors.grey),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Container(
      decoration: _emptyStateBackground(),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.grey.shade200,
                    blurRadius: 10,
                  ),
                ],
              ),
              child: const Icon(Icons.shopping_bag_outlined, size: 60, color: _primaryColor),
            ),
            const SizedBox(height: 20),
            const Text(
              'Shporta është bosh',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Shto produkte të freskëta për të vazhduar blerjet',
              style: TextStyle(color: Colors.grey),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.explore),
              label: const Text('Eksploro Produktet'),
              style: ElevatedButton.styleFrom(
                backgroundColor: _primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  BoxDecoration _emptyStateBackground() {
    return const BoxDecoration(
      gradient: LinearGradient(
        colors: [
          Color(0xFFE8F5E9),
          Color(0xFFF6F8FB),
        ],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ),
    );
  }

  Widget _buildGuestState(BuildContext context) {
    return Container(
      decoration: _emptyStateBackground(),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.lock_outline, size: 64, color: _primaryColor),
            const SizedBox(height: 16),
            const Text(
              'Kyçu për të parë shportën',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'Bëj login për të vazhduar me porositë e tua',
              style: TextStyle(color: Colors.grey),
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: _primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              child: const Text('Kyçu'),
            ),
          ],
        ),
      ),
    );
  }
}

