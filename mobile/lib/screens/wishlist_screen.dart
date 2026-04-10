import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../models/product.dart';
import 'login_screen.dart';
import 'product_detail_screen.dart';

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

class WishlistScreen extends StatefulWidget {
  const WishlistScreen({super.key});

  @override
  State<WishlistScreen> createState() => _WishlistScreenState();
}

class _WishlistScreenState extends State<WishlistScreen> {
  List<Map<String, dynamic>> wishlist = [];
  bool loading = true;

  @override
  void initState() {
    super.initState();
    fetchWishlist();
  }

  Future<void> fetchWishlist() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) {
      setState(() => loading = false);
      return;
    }

    setState(() => loading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token != null) {
        final items = await ApiService.getWishlist(token);
        setState(() {
          wishlist = items;
          loading = false;
        });
      }
    } catch (e) {
      setState(() => loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gabim: $e',
                style: GoogleFonts.nunito(color: Colors.white)),
            backgroundColor: const Color(0xFFDC2626),
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    }
  }

  Future<void> removeFromWishlist(String productId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token != null) {
        await ApiService.removeFromWishlist(productId, token);
        setState(() {
          wishlist.removeWhere(
              (item) => item['product']['id'] == productId);
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Produkti u hoq nga lista e dëshirave',
                  style: GoogleFonts.nunito(color: Colors.white)),
              backgroundColor: forestMid,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Gabim: $e',
                style: GoogleFonts.nunito(color: Colors.white)),
            backgroundColor: const Color(0xFFDC2626),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    }
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
          title: Text('Lista e Dëshirave',
              style: GoogleFonts.playfairDisplay(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w600)),
          backgroundColor: forestMid,
          elevation: 0,
          centerTitle: true,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('❤️', style: TextStyle(fontSize: 64)),
                const SizedBox(height: 20),
                Text(
                  'Kyçu për listën',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: textDark,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Duhet të kyçeni për të parë listën e dëshirave',
                  style: GoogleFonts.nunito(fontSize: 14, color: textMuted),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 28),
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                          builder: (_) => const LoginScreen()),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: forestMid,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(50)),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 32, vertical: 16),
                  ),
                  child: Text('Kyçu',
                      style:
                          GoogleFonts.nunito(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (loading) {
      return Scaffold(
        backgroundColor: creamBg,
        appBar: AppBar(
          title: Text('Lista e Dëshirave',
              style: GoogleFonts.playfairDisplay(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w600)),
          backgroundColor: forestMid,
          elevation: 0,
          centerTitle: true,
        ),
        body: const Center(child: CircularProgressIndicator(color: forestMid)),
      );
    }

    if (wishlist.isEmpty) {
      return Scaffold(
        backgroundColor: creamBg,
        appBar: AppBar(
          title: Text('Lista e Dëshirave',
              style: GoogleFonts.playfairDisplay(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w600)),
          backgroundColor: forestMid,
          elevation: 0,
          centerTitle: true,
        ),
        body: RefreshIndicator(
          onRefresh: fetchWishlist,
          color: forestMid,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: SizedBox(
              height: MediaQuery.of(context).size.height - 200,
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Text('❤️', style: TextStyle(fontSize: 72)),
                      const SizedBox(height: 20),
                      Text(
                        'Lista është bosh',
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: textDark,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Ruaj produktet e preferuara këtu për t\'i gjetur lehtë',
                        style: GoogleFonts.nunito(
                            fontSize: 14, color: textMuted),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 28),
                      ElevatedButton.icon(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: const Icon(Icons.explore_outlined),
                        label: Text('Shiko Produktet',
                            style: GoogleFonts.nunito(
                                fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: forestMid,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(50)),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 14),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: creamBg,
      appBar: AppBar(
        title: Text('Lista e Dëshirave',
            style: GoogleFonts.playfairDisplay(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w600)),
        backgroundColor: forestMid,
        elevation: 0,
        centerTitle: true,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: Icon(Icons.favorite, color: Colors.white.withOpacity(0.8)),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: fetchWishlist,
        color: forestMid,
        child: GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 14,
            mainAxisSpacing: 14,
            childAspectRatio: 0.72,
          ),
          itemCount: wishlist.length,
          itemBuilder: (context, index) {
            final item = wishlist[index];
            final productData = item['product'] as Map<String, dynamic>;
            final product = Product(
              id: productData['id'],
              name: productData['name'],
              slug: productData['slug'] ?? '',
              description: productData['description'] ?? '',
              price: (productData['price'] as num).toDouble(),
              unit: productData['unit'],
              stockQuantity: productData['stock_quantity'] ?? 0,
              imageUrls:
                  List<String>.from(productData['image_urls'] ?? []),
              isBio: productData['is_bio'] ?? true,
            );

            return _buildWishlistCard(product);
          },
        ),
      ),
    );
  }

  Widget _buildWishlistCard(Product product) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
              builder: (_) => ProductDetailScreen(productId: product.id)),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: forestMid.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product image
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(20)),
                  child: Container(
                    height: 140,
                    width: double.infinity,
                    color: forestGhost,
                    child: product.imageUrls.isNotEmpty
                        ? Image.network(
                            product.imageUrls[0],
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => const Center(
                              child: Icon(Icons.eco_outlined,
                                  size: 48, color: forestMid),
                            ),
                          )
                        : const Center(
                            child: Icon(Icons.eco_outlined,
                                size: 48, color: forestMid),
                          ),
                  ),
                ),
                // Product info
                Padding(
                  padding: const EdgeInsets.all(10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (product.isBio)
                        Container(
                          margin: const EdgeInsets.only(bottom: 4),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: forestGhost,
                            borderRadius: BorderRadius.circular(50),
                          ),
                          child: const Text('🌱 BIO',
                              style: TextStyle(
                                  color: forestMid,
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold)),
                        ),
                      Text(
                        product.name,
                        style: GoogleFonts.nunito(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                          color: textDark,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${product.price.toStringAsFixed(2)} L / ${product.unit}',
                        style: GoogleFonts.playfairDisplay(
                          color: forestMid,
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            // Remove heart button
            Positioned(
              top: 8,
              right: 8,
              child: GestureDetector(
                onTap: () => removeFromWishlist(product.id),
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: const Icon(Icons.favorite,
                      color: honeyDark, size: 18),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
