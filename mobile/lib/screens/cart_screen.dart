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

    return Consumer<CartProvider>(
      builder: (context, cartProvider, _) {
        // ── Authenticated user: show server cart ─────────────────────────
        if (auth.isAuthenticated) {
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
              appBar: _appBar(0),
              body: _buildEmptyState(context),
            );
          }
          return Scaffold(
            backgroundColor: creamBg,
            appBar: _appBar(cart.items.length),
            body: Column(
              children: [
                Expanded(child: _itemList(cart.items, cartProvider, auth.isAuthenticated)),
                _buildSummaryCard(
                  items: cart.items,
                  subtotal: cart.subtotal,
                  deliveryFee: cart.deliveryFee,
                  total: cart.total,
                  cartSummary: cart,
                  isGuest: false,
                  context: context,
                ),
              ],
            ),
          );
        }

        // ── Guest: show local cart ────────────────────────────────────────
        final guestItems = cartProvider.guestCart;
        if (guestItems.isEmpty) {
          return Scaffold(
            backgroundColor: creamBg,
            appBar: _appBar(0),
            body: _buildEmptyState(context),
          );
        }
        final guestSubtotal = cartProvider.guestSubtotal;
        const guestDelivery = 200.0;
        final guestTotal = guestSubtotal + guestDelivery;

        return Scaffold(
          backgroundColor: creamBg,
          appBar: _appBar(guestItems.length),
          body: Column(
            children: [
              Expanded(child: _itemList(guestItems, cartProvider, false)),
              _buildSummaryCard(
                items: guestItems,
                subtotal: guestSubtotal,
                deliveryFee: guestDelivery,
                total: guestTotal,
                cartSummary: null,
                isGuest: true,
                context: context,
              ),
            ],
          ),
        );
      },
    );
  }

  PreferredSizeWidget _appBar(int count) {
    return AppBar(
      title: Column(
        children: [
          Text('Shporta ime',
              style: GoogleFonts.playfairDisplay(
                  color: Colors.white, fontSize: 20, fontWeight: FontWeight.w600)),
          if (count > 0)
            Text('$count produkte',
                style: GoogleFonts.nunito(color: Colors.white70, fontSize: 12)),
        ],
      ),
      backgroundColor: forestMid,
      elevation: 0,
      centerTitle: true,
    );
  }

  Widget _itemList(List<CartItem> items, CartProvider cartProvider, bool isAuth) {
    return RefreshIndicator(
      onRefresh: isAuth ? cartProvider.refreshCart : () async {},
      color: forestMid,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 140),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final item = items[index];
          return Dismissible(
            key: ValueKey(item.id),
            direction: DismissDirection.endToStart,
            background: _dismissBg(),
            onDismissed: (_) {
              if (isAuth) {
                cartProvider.removeItem(item.id);
              } else {
                cartProvider.removeGuestItem(item.id);
              }
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                backgroundColor: forestMid,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                content: Text('${item.product.name} u hoq nga shporta',
                    style: GoogleFonts.nunito(color: Colors.white)),
              ));
            },
            child: _itemCard(item, cartProvider, isAuth),
          );
        },
      ),
    );
  }

  Widget _itemCard(CartItem item, CartProvider cartProvider, bool isAuth) {
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
                      errorBuilder: (_, __, ___) => _imgPlaceholder(),
                    )
                  : _imgPlaceholder(),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(item.product.name,
                            style: GoogleFonts.playfairDisplay(
                                fontWeight: FontWeight.bold,
                                fontSize: 15,
                                color: textDark),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis),
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
                  Text('${item.unitPrice.toStringAsFixed(2)} L / ${item.product.unit}',
                      style: GoogleFonts.nunito(color: textMuted, fontSize: 13)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      _qtyControl(item, cartProvider, isAuth),
                      const Spacer(),
                      Text('${item.totalPrice.toStringAsFixed(2)} L',
                          style: GoogleFonts.playfairDisplay(
                              fontWeight: FontWeight.bold,
                              fontSize: 17,
                              color: forestMid)),
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

  Widget _qtyControl(CartItem item, CartProvider cartProvider, bool isAuth) {
    return Row(
      children: [
        GestureDetector(
          onTap: () {
            if (isAuth) {
              if (item.quantity > 1) {
                cartProvider.updateItem(item.id, item.quantity - 1);
              } else {
                cartProvider.removeItem(item.id);
              }
            } else {
              cartProvider.updateGuestItem(item.id, item.quantity - 1);
            }
          },
          child: Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
                color: forestGhost, borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.remove, size: 18, color: forestMid),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Text('${item.quantity}',
              style: GoogleFonts.nunito(
                  fontWeight: FontWeight.bold, fontSize: 16, color: textDark)),
        ),
        GestureDetector(
          onTap: () {
            if (isAuth) {
              cartProvider.updateItem(item.id, item.quantity + 1);
            } else {
              cartProvider.updateGuestItem(item.id, item.quantity + 1);
            }
          },
          child: Container(
            width: 36, height: 36,
            decoration: BoxDecoration(
                color: forestMid, borderRadius: BorderRadius.circular(10)),
            child: const Icon(Icons.add, size: 18, color: Colors.white),
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryCard({
    required List<CartItem> items,
    required double subtotal,
    required double deliveryFee,
    required double total,
    CartSummary? cartSummary,
    required bool isGuest,
    required BuildContext context,
  }) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(color: Color(0x14000000), blurRadius: 20, offset: Offset(0, -6))
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
                    subtotal >= 5000
                        ? '🎉 Nëntotali i lartë! Kontakto suportin për oferta speciale.'
                        : 'Shto edhe ${(5000 - subtotal).clamp(0, double.infinity).toStringAsFixed(0)} L për oferta speciale.',
                    style: GoogleFonts.nunito(color: textMuted, fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            _summaryRow('Nëntotali', subtotal),
            _summaryRow('Dërgesa', deliveryFee),
            Divider(color: earthLight, thickness: 1, height: 20),
            _summaryRow('Totali', total, bold: true),
            const SizedBox(height: 16),

            // ── Guest: show "Kyçu për të blerë" ──────────────────────────
            if (isGuest) ...[
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 10),
                decoration: BoxDecoration(
                  color: forestGhost,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: forestMid, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Duhet të kyçeni për të përfunduar blerjen',
                        style: GoogleFonts.nunito(
                            color: forestDark, fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                  },
                  icon: const Icon(Icons.login, size: 18),
                  label: Text('Kyçu & Blerë',
                      style: GoogleFonts.nunito(
                          fontWeight: FontWeight.bold, fontSize: 16)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: forestMid,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(50)),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 24, vertical: 16),
                  ),
                ),
              ),
            ],

            // ── Authenticated: go to checkout ─────────────────────────────
            if (!isGuest && cartSummary != null)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => CheckoutScreen(cart: cartSummary),
                      ),
                    );
                  },
                  icon: const Icon(Icons.shopping_bag_outlined, size: 18),
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
                  fontWeight: bold ? FontWeight.bold : FontWeight.normal)),
          Text(
            '${value.toStringAsFixed(2)} L',
            style: bold
                ? GoogleFonts.playfairDisplay(
                    fontSize: 20, fontWeight: FontWeight.bold, color: forestMid)
                : GoogleFonts.nunito(
                    fontSize: 14, fontWeight: FontWeight.w600, color: textDark),
          ),
        ],
      ),
    );
  }

  Widget _dismissBg() {
    return Container(
      decoration: BoxDecoration(
          color: const Color(0xFFDC2626).withOpacity(0.1),
          borderRadius: BorderRadius.circular(20)),
      alignment: Alignment.centerRight,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: const Icon(Icons.delete_outline, color: Color(0xFFDC2626)),
    );
  }

  Widget _imgPlaceholder() {
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
                    fontSize: 24, fontWeight: FontWeight.bold, color: textDark)),
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
}
