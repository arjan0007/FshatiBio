import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../models/cart_item.dart';
import '../models/cart_summary.dart';
import 'checkout_screen.dart';
import 'login_screen.dart';

const Color forestDark  = Color(0xFF1B4332);
const Color forestMid   = Color(0xFF2D6A4F);
const Color forestLight = Color(0xFF40916C);
const Color forestPale  = Color(0xFF52B788);
const Color forestGhost = Color(0xFFD8F3DC);
const Color honeyDark   = Color(0xFFE76F51);
const Color honeyMid    = Color(0xFFF4A261);
const Color creamBg     = Color(0xFFFEFAE0);
const Color earthLight  = Color(0xFFE8D5C4);
const Color textDark    = Color(0xFF1B2F1E);
const Color textMuted   = Color(0xFF6B7C73);

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
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
        backgroundColor: creamBg,
        body: Center(child: CircularProgressIndicator(color: forestMid)),
      );
    }

    if (!auth.isAuthenticated) {
      return Scaffold(
        backgroundColor: creamBg,
        appBar: AppBar(
          title: Text('Shporta ime',
              style: GoogleFonts.playfairDisplay(
                  color: Colors.white, fontSize: 20, fontWeight: FontWeight.w600)),
          backgroundColor: forestMid,
          elevation: 0,
          centerTitle: true,
        ),
        body: _buildGuestState(context),
      );
    }

    return Consumer<CartProvider>(
      builder: (context, cartProvider, _) {
        if (cartProvider.isLoading) {
          return const Scaffold(
            backgroundColor: creamBg,
            body: Center(child: CircularProgressIndicator(color: forestMid)),
          );
        }

        final cart = cartProvider.cart;
        if (cart.items.isEmpty) {
          return Scaffold(
            backgroundColor: creamBg,
            appBar: AppBar(
              title: Text('Shporta ime',
                  style: GoogleFonts.playfairDisplay(
                      color: Colors.white, fontSize: 20, fontWeight: FontWeight.w600)),
              backgroundColor: forestMid,
              elevation: 0,
              centerTitle: true,
            ),
            body: _buildEmptyState(context),
          );
        }

        return Scaffold(
          backgroundColor: creamBg,
          appBar: _buildCartAppBar(cart),
          body: Column(
            children: [
              Expanded(
                child: RefreshIndicator(
                  onRefresh: cartProvider.refreshCart,
                  color: forestMid,
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
                              backgroundColor: forestMid,
                              behavior: SnackBarBehavior.floating,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12)),
                              content: Text(
                                '${item.product.name} u hoq nga shporta',
                                style: GoogleFonts.nunito(color: Colors.white),
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

  PreferredSizeWidget _buildCartAppBar(CartSummary cart) {
    return AppBar(
      title: Column(
        children: [
          Text('Shporta ime',
              style: GoogleFonts.playfairDisplay(
                  color: Colors.white, fontSize: 20, fontWeight: FontWeight.w600)),
          Text('${cart.items.length} produkte',
              style: GoogleFonts.nunito(color: Colors.white70, fontSize: 12)),
        ],
      ),
      backgroundColor: forestMid,
      elevation: 0,
      centerTitle: true,
    );
  }

  Widget _buildCartItemCard(CartItem item, CartProvider cartProvider) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
              color: forestMid.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, 4))
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(14),
              child: item.product.imageUrls.isNotEmpty
                  ? Image.network(
                      item.product.imageUrls.first,
                      width: 82,
                      height: 82,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          _buildImagePlaceholder(),
                    )
                  : _buildImagePlaceholder(),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.product.name,
                          style: GoogleFonts.playfairDisplay(
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: textDark),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      if (item.product.isBio)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                              color: forestGhost,
                              borderRadius: BorderRadius.circular(50)),
                          child: const Text('🌱 BIO',
                              style: TextStyle(
                                  color: forestMid,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold)),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${item.unitPrice.toStringAsFixed(2)} L / ${item.product.unit}',
                    style: GoogleFonts.nunito(color: textMuted, fontSize: 13),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      _buildQuantityControl(item, cartProvider),
                      const Spacer(),
                      Text(
                        '${item.totalPrice.toStringAsFixed(2)} L',
                        style: GoogleFonts.playfairDisplay(
                            fontWeight: FontWeight.bold,
                            fontSize: 17,
                            color: forestMid),
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
    return Row(
      children: [
        GestureDetector(
          onTap: () {
            if (item.quantity > 1) {
              cartProvider.updateItem(item.id, item.quantity - 1);
            } else {
              cartProvider.removeItem(item.id);
            }
          },
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
                color: forestGhost,
                borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.remove, size: 18, color: forestMid),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text(
            '${item.quantity}',
            style: GoogleFonts.nunito(
                fontWeight: FontWeight.bold, fontSize: 16, color: textDark),
          ),
        ),
        GestureDetector(
          onTap: () => cartProvider.updateItem(item.id, item.quantity + 1),
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
                color: forestMid, borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.add, size: 18, color: Colors.white),
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryCard(CartSummary cart, BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
              color: Color(0x14000000),
              blurRadius: 20,
              offset: Offset(0, -6))
        ],
      ),
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: SafeArea(
        top: false,
        child: Column(
          children: [
            Row(
              children: [
                const Icon(Icons.eco_outlined, color: forestMid, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    cart.subtotal >= 5000
                        ? '🎉 Nëntotali i lartë! Kontakto suportin për oferta speciale.'
                        : 'Shto edhe ${(5000 - cart.subtotal).clamp(0, double.infinity).toStringAsFixed(2)} L për oferta speciale.',
                    style: GoogleFonts.nunito(color: textMuted, fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            _summaryRow('Nëntotali', cart.subtotal),
            _summaryRow('Dërgesa', cart.deliveryFee),
            Divider(color: earthLight, thickness: 1, height: 20),
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
                icon: const Icon(Icons.lock_outline, size: 18),
                label: Text('Vazhdo te Checkout',
                    style: GoogleFonts.nunito(
                        fontWeight: FontWeight.bold, fontSize: 16)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: honeyMid,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(50)),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 24, vertical: 16),
                ),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(String label, double value, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: GoogleFonts.nunito(
                  fontSize: bold ? 16 : 14,
                  color: bold ? textDark : textMuted,
                  fontWeight:
                      bold ? FontWeight.bold : FontWeight.normal)),
          Text(
            '${value.toStringAsFixed(2)} L',
            style: bold
                ? GoogleFonts.playfairDisplay(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: forestMid)
                : GoogleFonts.nunito(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: textDark),
          ),
        ],
      ),
    );
  }

  Widget _buildDismissibleBackground() {
    return Container(
      decoration: BoxDecoration(
          color: const Color(0xFFDC2626).withOpacity(0.1),
          borderRadius: BorderRadius.circular(20)),
      alignment: Alignment.centerRight,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: const Icon(Icons.delete_outline, color: Color(0xFFDC2626)),
    );
  }

  Widget _buildImagePlaceholder() {
    return Container(
      width: 82,
      height: 82,
      decoration: BoxDecoration(
          color: forestGhost, borderRadius: BorderRadius.circular(14)),
      child: const Icon(Icons.eco_outlined, color: forestMid, size: 32),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('🛒', style: TextStyle(fontSize: 72)),
            const SizedBox(height: 20),
            Text('Shporta është bosh',
                style: GoogleFonts.playfairDisplay(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: textDark)),
            const SizedBox(height: 10),
            Text(
              'Shto produkte të freskëta organike për të vazhduar blerjet',
              style: GoogleFonts.nunito(fontSize: 14, color: textMuted),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            ElevatedButton.icon(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.explore_outlined),
              label: Text('Eksploro Produktet',
                  style: GoogleFonts.nunito(fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                backgroundColor: forestMid,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(50)),
                padding: const EdgeInsets.symmetric(
                    horizontal: 24, vertical: 16),
                elevation: 2,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGuestState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                  color: forestGhost, shape: BoxShape.circle),
              child: const Icon(Icons.lock_outline,
                  size: 56, color: forestMid),
            ),
            const SizedBox(height: 20),
            Text('Kyçu për të parë shportën',
                style: GoogleFonts.playfairDisplay(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: textDark)),
            const SizedBox(height: 10),
            Text(
              'Bëj login për të vazhduar me porositë e tua',
              style: GoogleFonts.nunito(fontSize: 14, color: textMuted),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 28),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: forestMid,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(50)),
                padding: const EdgeInsets.symmetric(
                    horizontal: 32, vertical: 16),
                elevation: 2,
              ),
              child: Text('Kyçu',
                  style:
                      GoogleFonts.nunito(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
