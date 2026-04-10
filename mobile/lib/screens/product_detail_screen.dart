import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

// Design system colors
const Color forestDark = Color(0xFF1B4332);
const Color forestMid = Color(0xFF2D6A4F);
const Color forestLight = Color(0xFF40916C);
const Color forestPale = Color(0xFF52B788);
const Color forestGhost = Color(0xFFD8F3DC);
const Color honeyDark = Color(0xFFE76F51);
const Color honeyMid = Color(0xFFF4A261);
const Color creamBg = Color(0xFFFEFAE0);
const Color earthLight = Color(0xFFE8D5C4);
const Color textDark = Color(0xFF1B2F1E);
const Color textMuted = Color(0xFF6B7C73);

class ProductDetailScreen extends StatefulWidget {
  final String productId;

  const ProductDetailScreen({super.key, required this.productId});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  Product? product;
  bool loading = true;
  int quantity = 1;
  List<dynamic> reviews = [];
  Map<String, dynamic>? reviewStats;
  bool showReviewForm = false;
  int reviewRating = 5;
  final TextEditingController reviewTitleController = TextEditingController();
  final TextEditingController reviewCommentController = TextEditingController();
  bool inWishlist = false;
  bool checkingWishlist = false;

  @override
  void initState() {
    super.initState();
    fetchProduct();
    fetchReviews();
    checkWishlist();
  }

  Future<void> checkWishlist() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) return;

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token != null) {
        final inList =
            await ApiService.checkWishlist(widget.productId, token);
        setState(() {
          inWishlist = inList;
        });
      }
    } catch (e) {
      // Silent fail
    }
  }

  Future<void> toggleWishlist() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      return;
    }

    setState(() => checkingWishlist = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token != null) {
        if (inWishlist) {
          await ApiService.removeFromWishlist(widget.productId, token);
          setState(() => inWishlist = false);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                backgroundColor: forestMid,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                content: Text(
                  'Produkti u hoq nga lista e dëshirave',
                  style: GoogleFonts.nunito(color: Colors.white),
                ),
              ),
            );
          }
        } else {
          await ApiService.addToWishlist(widget.productId, token);
          setState(() => inWishlist = true);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                backgroundColor: forestMid,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
                content: Text(
                  'Produkti u shtua në listën e dëshirave',
                  style: GoogleFonts.nunito(color: Colors.white),
                ),
              ),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: honeyDark,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
            content: Text(
              'Gabim: $e',
              style: GoogleFonts.nunito(color: Colors.white),
            ),
          ),
        );
      }
    } finally {
      setState(() => checkingWishlist = false);
    }
  }

  @override
  void dispose() {
    reviewTitleController.dispose();
    reviewCommentController.dispose();
    super.dispose();
  }

  Future<void> fetchProduct() async {
    try {
      final products = await ApiService.getProducts();
      final found = products.firstWhere((p) => p.id == widget.productId);
      setState(() {
        product = found;
        loading = false;
      });
    } catch (e) {
      setState(() => loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: honeyDark,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
            content: Text(
              'Gabim: $e',
              style: GoogleFonts.nunito(color: Colors.white),
            ),
          ),
        );
      }
    }
  }

  Future<void> fetchReviews() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiService.baseUrl}/reviews/product/${widget.productId}'),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          setState(() {
            reviews = data['data']['reviews'];
            reviewStats = data['data']['stats'];
          });
        }
      }
    } catch (e) {
      print('Error fetching reviews: $e');
    }
  }

  Future<void> submitReview() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) {
      Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
      return;
    }

    if (reviewCommentController.text.length < 10) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: honeyDark,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          content: Text(
            'Komenti duhet të jetë të paktën 10 karaktere',
            style: GoogleFonts.nunito(color: Colors.white),
          ),
        ),
      );
      return;
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      final response = await http.post(
        Uri.parse('${ApiService.baseUrl}/reviews'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'product_id': widget.productId,
          'rating': reviewRating,
          'title': reviewTitleController.text,
          'comment': reviewCommentController.text,
        }),
      );

      if (response.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: forestMid,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
            content: Text(
              'Vlerësimi u shtua me sukses!',
              style: GoogleFonts.nunito(color: Colors.white),
            ),
          ),
        );
        setState(() {
          showReviewForm = false;
          reviewTitleController.clear();
          reviewCommentController.clear();
          reviewRating = 5;
        });
        fetchReviews();
      } else {
        final data = jsonDecode(response.body);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: honeyDark,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
            content: Text(
              data['error']?['message'] ?? 'Gabim',
              style: GoogleFonts.nunito(color: Colors.white),
            ),
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: honeyDark,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          content: Text(
            'Gabim: $e',
            style: GoogleFonts.nunito(color: Colors.white),
          ),
        ),
      );
    }
  }

  Widget _buildStars(int rating,
      {bool interactive = false, Function(int)? onRatingChange}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final starRating = index + 1;
        return GestureDetector(
          onTap: interactive && onRatingChange != null
              ? () => onRatingChange(starRating)
              : null,
          child: Icon(
            starRating <= rating ? Icons.star_rounded : Icons.star_outline_rounded,
            color: starRating <= rating ? honeyMid : earthLight,
            size: interactive ? 32 : 18,
          ),
        );
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(
        backgroundColor: creamBg,
        body: Center(
          child: CircularProgressIndicator(color: forestMid),
        ),
      );
    }

    if (product == null) {
      return Scaffold(
        backgroundColor: creamBg,
        appBar: AppBar(
          title: Text(
            'Produkti',
            style: GoogleFonts.playfairDisplay(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w600),
          ),
          backgroundColor: forestMid,
          foregroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
        ),
        body: Center(
          child: Text(
            'Produkti nuk u gjet',
            style: GoogleFonts.nunito(fontSize: 16, color: textMuted),
          ),
        ),
      );
    }

    final screenWidth = MediaQuery.of(context).size.width;
    final imageHeight = MediaQuery.of(context).size.height * 0.42;

    return Scaffold(
      backgroundColor: creamBg,
      body: CustomScrollView(
        slivers: [
          // ── Hero image SliverAppBar ──────────────────────────────────
          SliverAppBar(
            expandedHeight: imageHeight,
            pinned: true,
            backgroundColor: forestMid,
            foregroundColor: Colors.white,
            elevation: 0,
            leading: Padding(
              padding: const EdgeInsets.all(8),
              child: GestureDetector(
                onTap: () => Navigator.of(context).pop(),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.35),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.arrow_back_ios_new,
                      color: Colors.white, size: 18),
                ),
              ),
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.all(8),
                child: GestureDetector(
                  onTap: checkingWishlist ? null : toggleWishlist,
                  child: Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.35),
                      shape: BoxShape.circle,
                    ),
                    child: checkingWishlist
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2),
                          )
                        : Icon(
                            inWishlist
                                ? Icons.favorite_rounded
                                : Icons.favorite_border_rounded,
                            color:
                                inWishlist ? honeyDark : Colors.white,
                            size: 20,
                          ),
                  ),
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: product!.imageUrls.isNotEmpty
                  ? Image.network(
                      product!.imageUrls[0],
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) =>
                          _HeroPlaceholder(),
                    )
                  : _HeroPlaceholder(),
            ),
          ),

          // ── White bottom sheet content ─────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                color: creamBg,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(28),
                  topRight: Radius.circular(28),
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Drag handle
                    Center(
                      child: Container(
                        width: 40,
                        height: 4,
                        decoration: BoxDecoration(
                          color: earthLight,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ── Name row + bio badge ─────────────────────────
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            product!.name,
                            style: GoogleFonts.playfairDisplay(
                              fontSize: 26,
                              fontWeight: FontWeight.bold,
                              color: textDark,
                              height: 1.2,
                            ),
                          ),
                        ),
                        if (product!.isBio) ...[
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: forestGhost,
                              borderRadius: BorderRadius.circular(50),
                            ),
                            child: Text(
                              '🌱 BIO',
                              style: TextStyle(
                                color: forestMid,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    const SizedBox(height: 12),

                    // ── Price ────────────────────────────────────────
                    Text(
                      '${product!.price} L / ${product!.unit}',
                      style: GoogleFonts.playfairDisplay(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: forestMid,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // ── Stock badge ──────────────────────────────────
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: product!.stockQuantity > 0
                            ? forestGhost
                            : const Color(0xFFFEE2E2),
                        borderRadius: BorderRadius.circular(50),
                      ),
                      child: Text(
                        product!.stockQuantity > 0
                            ? '✓  Në stok: ${product!.stockQuantity} ${product!.unit}'
                            : '✗  Nuk ka në stok',
                        style: GoogleFonts.nunito(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                          color: product!.stockQuantity > 0
                              ? forestMid
                              : honeyDark,
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ── Description ──────────────────────────────────
                    if (product!.description.isNotEmpty) ...[
                      Text(
                        'Përshkrimi',
                        style: GoogleFonts.playfairDisplay(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: textDark,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        product!.description,
                        style: GoogleFonts.nunito(
                          fontSize: 14,
                          color: textMuted,
                          height: 1.6,
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],

                    // ── Quantity selector ────────────────────────────
                    Consumer<AuthProvider>(
                      builder: (context, auth, _) {
                        return Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Sasia',
                              style: GoogleFonts.playfairDisplay(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: textDark,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                // Decrement
                                _QuantityButton(
                                  icon: Icons.remove,
                                  onTap: () {
                                    if (quantity > 1) {
                                      setState(() => quantity--);
                                    }
                                  },
                                ),
                                const SizedBox(width: 4),
                                Container(
                                  width: 52,
                                  height: 44,
                                  alignment: Alignment.center,
                                  decoration: BoxDecoration(
                                    color: forestGhost,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    '$quantity',
                                    style: GoogleFonts.playfairDisplay(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                      color: textDark,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 4),
                                // Increment
                                _QuantityButton(
                                  icon: Icons.add,
                                  onTap: () {
                                    if (quantity <
                                        product!.stockQuantity) {
                                      setState(() => quantity++);
                                    }
                                  },
                                ),
                              ],
                            ),
                            const SizedBox(height: 20),

                            // ── Add to cart button ─────────────────
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: product!.stockQuantity > 0
                                    ? () async {
                                        if (!auth.isAuthenticated) {
                                          Navigator.of(context).push(
                                            MaterialPageRoute(
                                              builder: (_) =>
                                                  const LoginScreen(),
                                            ),
                                          );
                                          return;
                                        }
                                        try {
                                          for (int i = 0;
                                              i < quantity;
                                              i++) {
                                            await context
                                                .read<CartProvider>()
                                                .addItem(product!.id);
                                          }
                                          if (mounted) {
                                            ScaffoldMessenger.of(context)
                                                .showSnackBar(
                                              SnackBar(
                                                backgroundColor: forestMid,
                                                behavior:
                                                    SnackBarBehavior.floating,
                                                shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            12)),
                                                content: Text(
                                                  '${product!.name} u shtua në shportë',
                                                  style: GoogleFonts.nunito(
                                                      color: Colors.white),
                                                ),
                                              ),
                                            );
                                          }
                                        } catch (e) {
                                          if (mounted) {
                                            ScaffoldMessenger.of(context)
                                                .showSnackBar(
                                              SnackBar(
                                                backgroundColor: honeyDark,
                                                behavior:
                                                    SnackBarBehavior.floating,
                                                shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            12)),
                                                content: Text(
                                                  '$e',
                                                  style: GoogleFonts.nunito(
                                                      color: Colors.white),
                                                ),
                                              ),
                                            );
                                          }
                                        }
                                      }
                                    : null,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: honeyMid,
                                  foregroundColor: Colors.white,
                                  disabledBackgroundColor:
                                      earthLight,
                                  shape: RoundedRectangleBorder(
                                      borderRadius:
                                          BorderRadius.circular(50)),
                                  padding: const EdgeInsets.symmetric(
                                      vertical: 16),
                                  elevation: 2,
                                ),
                                child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.center,
                                  children: [
                                    const Icon(
                                        Icons.shopping_basket_outlined,
                                        size: 20),
                                    const SizedBox(width: 8),
                                    Text(
                                      product!.stockQuantity > 0
                                          ? 'Shto në Shportë'
                                          : 'Nuk ka në stok',
                                      style: GoogleFonts.nunito(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),

                    const SizedBox(height: 32),
                    _OrganicDivider(),
                    const SizedBox(height: 24),

                    // ── Reviews section header ───────────────────────
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Vlerësimet',
                          style: GoogleFonts.playfairDisplay(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: textDark,
                          ),
                        ),
                        Consumer<AuthProvider>(
                          builder: (context, auth, _) {
                            return TextButton(
                              onPressed: () {
                                if (!auth.isAuthenticated) {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                        builder: (_) =>
                                            const LoginScreen()),
                                  );
                                  return;
                                }
                                setState(() {
                                  showReviewForm = !showReviewForm;
                                });
                              },
                              style: TextButton.styleFrom(
                                  foregroundColor: forestMid),
                              child: Text(
                                showReviewForm ? 'Anulo' : 'Shkruaj',
                                style: GoogleFonts.nunito(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                  color: forestMid,
                                ),
                              ),
                            );
                          },
                        ),
                      ],
                    ),

                    // ── Review stats ─────────────────────────────────
                    if (reviewStats != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(16),
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
                        child: Row(
                          children: [
                            Column(
                              children: [
                                Text(
                                  reviewStats!['average_rating']
                                      .toStringAsFixed(1),
                                  style: GoogleFonts.playfairDisplay(
                                    fontSize: 44,
                                    fontWeight: FontWeight.bold,
                                    color: forestMid,
                                  ),
                                ),
                                _buildStars(
                                    reviewStats!['average_rating'].round()),
                                const SizedBox(height: 4),
                                Text(
                                  '${reviewStats!['total']} vlerësime',
                                  style: GoogleFonts.nunito(
                                      fontSize: 12, color: textMuted),
                                ),
                              ],
                            ),
                            const SizedBox(width: 20),
                            Expanded(
                              child: Column(
                                children: [5, 4, 3, 2, 1].map((rating) {
                                  final count = reviewStats![
                                              'rating_distribution']
                                          [rating.toString()] ??
                                      0;
                                  final total =
                                      reviewStats!['total'] as int;
                                  final percentage =
                                      total > 0 ? (count / total) : 0.0;
                                  return Padding(
                                    padding:
                                        const EdgeInsets.only(bottom: 6),
                                    child: Row(
                                      children: [
                                        Text(
                                          '$rating',
                                          style: GoogleFonts.nunito(
                                              fontSize: 12,
                                              color: textMuted),
                                        ),
                                        const SizedBox(width: 4),
                                        const Icon(Icons.star_rounded,
                                            color: honeyMid, size: 12),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: ClipRRect(
                                            borderRadius:
                                                BorderRadius.circular(4),
                                            child: LinearProgressIndicator(
                                              value: percentage.toDouble(),
                                              backgroundColor: earthLight,
                                              valueColor:
                                                  const AlwaysStoppedAnimation<
                                                          Color>(
                                                      honeyMid),
                                              minHeight: 6,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          '$count',
                                          style: GoogleFonts.nunito(
                                              fontSize: 12,
                                              color: textMuted),
                                        ),
                                      ],
                                    ),
                                  );
                                }).toList(),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    // ── Review form ──────────────────────────────────
                    if (showReviewForm) ...[
                      const SizedBox(height: 20),
                      Container(
                        padding: const EdgeInsets.all(20),
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
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Vlerësimi Yt',
                              style: GoogleFonts.playfairDisplay(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: textDark,
                              ),
                            ),
                            const SizedBox(height: 16),
                            Center(
                              child: _buildStars(
                                reviewRating,
                                interactive: true,
                                onRatingChange: (rating) {
                                  setState(() => reviewRating = rating);
                                },
                              ),
                            ),
                            const SizedBox(height: 16),
                            TextField(
                              controller: reviewTitleController,
                              style: GoogleFonts.nunito(color: textDark),
                              decoration: InputDecoration(
                                labelText: 'Titulli (opsionale)',
                                labelStyle:
                                    GoogleFonts.nunito(color: textMuted),
                                filled: true,
                                fillColor: creamBg,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  borderSide:
                                      const BorderSide(color: earthLight),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  borderSide:
                                      const BorderSide(color: earthLight),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  borderSide: const BorderSide(
                                      color: forestMid, width: 2),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 14),
                              ),
                            ),
                            const SizedBox(height: 14),
                            TextField(
                              controller: reviewCommentController,
                              style: GoogleFonts.nunito(color: textDark),
                              decoration: InputDecoration(
                                labelText: 'Komenti *',
                                hintText:
                                    'Shkruaj komentin tënd (min 10 karaktere)',
                                labelStyle:
                                    GoogleFonts.nunito(color: textMuted),
                                hintStyle:
                                    GoogleFonts.nunito(color: earthLight),
                                filled: true,
                                fillColor: creamBg,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  borderSide:
                                      const BorderSide(color: earthLight),
                                ),
                                enabledBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  borderSide:
                                      const BorderSide(color: earthLight),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(16),
                                  borderSide: const BorderSide(
                                      color: forestMid, width: 2),
                                ),
                                contentPadding: const EdgeInsets.symmetric(
                                    horizontal: 16, vertical: 14),
                              ),
                              maxLines: 4,
                              maxLength: 1000,
                            ),
                            const SizedBox(height: 16),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: submitReview,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: forestMid,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(
                                      borderRadius:
                                          BorderRadius.circular(50)),
                                  padding: const EdgeInsets.symmetric(
                                      vertical: 14),
                                  elevation: 2,
                                ),
                                child: Text(
                                  'Dërgo Vlerësimin',
                                  style: GoogleFonts.nunito(
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    // ── Reviews list ─────────────────────────────────
                    const SizedBox(height: 20),
                    if (reviews.isEmpty)
                      Center(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 24),
                          child: Column(
                            children: [
                              const Text('⭐',
                                  style: TextStyle(fontSize: 32)),
                              const SizedBox(height: 8),
                              Text(
                                'Nuk ka vlerësime ende.',
                                style: GoogleFonts.playfairDisplay(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w600,
                                  color: textDark,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Bëhu i pari që vlerëson!',
                                style: GoogleFonts.nunito(
                                    fontSize: 13, color: textMuted),
                              ),
                            ],
                          ),
                        ),
                      )
                    else
                      ...reviews.map((review) => _ReviewCard(
                            review: review,
                            buildStars: _buildStars,
                          )),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Quantity Button ───────────────────────────────────────────────────────────

class _QuantityButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;

  const _QuantityButton({required this.icon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        decoration: BoxDecoration(
          color: forestGhost,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Icon(icon, color: forestMid, size: 20),
      ),
    );
  }
}

// ── Hero Placeholder ──────────────────────────────────────────────────────────

class _HeroPlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [forestGhost, Color(0xFFB7E4C7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Center(
        child: Text('🌿', style: TextStyle(fontSize: 64)),
      ),
    );
  }
}

// ── Organic Divider ───────────────────────────────────────────────────────────

class _OrganicDivider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Expanded(child: Divider(color: earthLight, thickness: 1)),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: const Text('🌿', style: TextStyle(fontSize: 14)),
        ),
        const Expanded(child: Divider(color: earthLight, thickness: 1)),
      ],
    );
  }
}

// ── Review Card ───────────────────────────────────────────────────────────────

class _ReviewCard extends StatelessWidget {
  final Map<String, dynamic> review;
  final Widget Function(int rating,
      {bool interactive, Function(int)? onRatingChange}) buildStars;

  const _ReviewCard({required this.review, required this.buildStars});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: forestMid.withOpacity(0.07),
            blurRadius: 16,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review['user_name'] ?? '',
                      style: GoogleFonts.nunito(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        color: textDark,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        buildStars(review['rating']),
                        if (review['is_verified_purchase'] == true) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: forestGhost,
                              borderRadius: BorderRadius.circular(50),
                            ),
                            child: Text(
                              '✓ Verifikuar',
                              style: TextStyle(
                                fontSize: 10,
                                color: forestMid,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              Text(
                DateTime.parse(review['created_at'])
                    .toLocal()
                    .toString()
                    .split(' ')[0],
                style: GoogleFonts.nunito(fontSize: 12, color: textMuted),
              ),
            ],
          ),
          if (review['title'] != null) ...[
            const SizedBox(height: 8),
            Text(
              review['title'],
              style: GoogleFonts.nunito(
                fontWeight: FontWeight.w700,
                fontSize: 13,
                color: textDark,
              ),
            ),
          ],
          if (review['comment'] != null) ...[
            const SizedBox(height: 6),
            Text(
              review['comment'],
              style: GoogleFonts.nunito(
                  fontSize: 13, color: textMuted, height: 1.5),
            ),
          ],
          if (review['helpful_count'] != null &&
              review['helpful_count'] > 0) ...[
            const SizedBox(height: 8),
            Text(
              '${review['helpful_count']} persona e gjetën të dobishme',
              style: GoogleFonts.nunito(fontSize: 11, color: earthLight),
            ),
          ],
        ],
      ),
    );
  }
}
