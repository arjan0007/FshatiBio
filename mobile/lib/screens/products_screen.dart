import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../models/category.dart';
import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'product_detail_screen.dart';
import 'filters_screen.dart';

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

class ProductsScreen extends StatefulWidget {
  const ProductsScreen({super.key});

  @override
  State<ProductsScreen> createState() => _ProductsScreenState();
}

class _ProductsScreenState extends State<ProductsScreen> {
  List<Product> products = [];
  List<Category> categories = [];
  bool loading = true;
  String? selectedCategory;
  Map<String, dynamic> filters = {
    'sort': 'newest',
    'min_price': null,
    'max_price': null,
    'is_bio': null,
    'in_stock': null,
    'min_rating': null,
  };

  @override
  void initState() {
    super.initState();
    fetchInitialData();
  }

  Future<void> fetchInitialData() async {
    try {
      final results = await Future.wait([
        ApiService.getCategories(),
        _fetchProducts(),
      ]);
      final fetchedCategories = results[0] as List<Category>;
      final fetchedProducts = results[1] as List<Product>;
      setState(() {
        categories = fetchedCategories;
        products = fetchedProducts;
        loading = false;
      });
    } catch (e) {
      setState(() => loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gabim: $e')),
        );
      }
    }
  }

  Future<List<Product>> _fetchProducts() async {
    final fetched = await ApiService.getProducts(
      categoryId: selectedCategory,
      minPrice: filters['min_price'],
      maxPrice: filters['max_price'],
      isBio: filters['is_bio'] == 'true'
          ? true
          : filters['is_bio'] == 'false'
              ? false
              : null,
      inStock: filters['in_stock'] == 'true'
          ? true
          : filters['in_stock'] == 'false'
              ? false
              : null,
      minRating: filters['min_rating'],
      sort: filters['sort'],
    );
    return fetched;
  }

  Future<void> _applyFilters() async {
    setState(() => loading = true);
    try {
      final fetched = await _fetchProducts();
      setState(() {
        products = fetched;
        loading = false;
      });
    } catch (e) {
      setState(() => loading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gabim: $e')),
        );
      }
    }
  }

  Future<void> _filterByCategory(String? categoryId) async {
    setState(() {
      loading = true;
      selectedCategory = categoryId;
    });
    await _applyFilters();
  }

  Future<void> _openFilters() async {
    final result = await Navigator.of(context).push<Map<String, dynamic>>(
      MaterialPageRoute(
        builder: (_) => FiltersScreen(initialFilters: filters),
      ),
    );

    if (result != null) {
      setState(() {
        filters = result;
      });
      await _applyFilters();
    }
  }

  Future<void> _addToCart(Product product) async {
    final auth = context.read<AuthProvider>();
    final cart = context.read<CartProvider>();

    if (!auth.isAuthenticated) {
      // Guest: add to local cart, no login required
      cart.addGuestItem(product);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: forestMid,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
            content: Text(
              '${product.name} u shtua në shportë',
              style: GoogleFonts.nunito(color: Colors.white),
            ),
          ),
        );
      }
      return;
    }

    try {
      await cart.addItem(product.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: forestMid,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
            content: Text(
              '${product.name} u shtua në shportë',
              style: GoogleFonts.nunito(color: Colors.white),
            ),
          ),
        );
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
              e.toString(),
              style: GoogleFonts.nunito(color: Colors.white),
            ),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: creamBg,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          // ── Forest AppBar ──────────────────────────────────────────────
          SliverAppBar(
            floating: true,
            snap: true,
            backgroundColor: forestMid,
            foregroundColor: Colors.white,
            centerTitle: true,
            elevation: 0,
            title: Text(
              'Produktet',
              style: GoogleFonts.playfairDisplay(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w600,
              ),
            ),
            actions: [
              // Filter button with active indicator
              Stack(
                clipBehavior: Clip.none,
                children: [
                  IconButton(
                    icon: const Icon(Icons.tune_rounded, color: Colors.white),
                    onPressed: _openFilters,
                    tooltip: 'Filtra',
                  ),
                  if (_hasActiveFilters())
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: honeyMid,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),

          // ── Category chips row ─────────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              color: forestMid,
              child: Container(
                decoration: const BoxDecoration(
                  color: creamBg,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(24),
                    topRight: Radius.circular(24),
                  ),
                ),
                padding: const EdgeInsets.only(top: 14, bottom: 4),
                child: SizedBox(
                  height: 44,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      _CategoryChip(
                        label: 'Të gjitha',
                        isSelected: selectedCategory == null,
                        onTap: () => _filterByCategory(null),
                      ),
                      ...categories.map(
                        (cat) => Padding(
                          padding: const EdgeInsets.only(left: 8),
                          child: _CategoryChip(
                            label: cat.name,
                            isSelected: selectedCategory == cat.id,
                            onTap: () => _filterByCategory(cat.id),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
        body: loading
            ? const Center(
                child: CircularProgressIndicator(color: forestMid),
              )
            : products.isEmpty
                ? _EmptyState()
                : RefreshIndicator(
                    color: forestMid,
                    backgroundColor: Colors.white,
                    onRefresh: _applyFilters,
                    child: GridView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        crossAxisSpacing: 14,
                        mainAxisSpacing: 14,
                        childAspectRatio: 0.72,
                      ),
                      itemCount: products.length,
                      itemBuilder: (context, index) {
                        final product = products[index];
                        return _ProductCard(
                          product: product,
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) =>
                                    ProductDetailScreen(productId: product.id),
                              ),
                            );
                          },
                          onAddToCart: () => _addToCart(product),
                        );
                      },
                    ),
                  ),
      ),
    );
  }

  bool _hasActiveFilters() {
    return filters['min_price'] != null ||
        filters['max_price'] != null ||
        filters['is_bio'] != null ||
        filters['in_stock'] != null ||
        filters['min_rating'] != null ||
        filters['sort'] != 'newest';
  }
}

// ── Category Chip ─────────────────────────────────────────────────────────────

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _CategoryChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? forestMid : Colors.white,
          borderRadius: BorderRadius.circular(50),
          border: Border.all(
            color: isSelected ? forestMid : earthLight,
            width: 1.5,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: forestMid.withOpacity(0.22),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  )
                ]
              : [],
        ),
        child: Text(
          label,
          style: GoogleFonts.nunito(
            fontSize: 13,
            fontWeight: FontWeight.w600,
            color: isSelected ? Colors.white : textMuted,
          ),
        ),
      ),
    );
  }
}

// ── Product Card ──────────────────────────────────────────────────────────────

class _ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback onTap;
  final VoidCallback onAddToCart;

  const _ProductCard({
    required this.product,
    required this.onTap,
    required this.onAddToCart,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Product image with bio badge overlay ─────────────────
            Expanded(
              child: Stack(
                children: [
                  // Image container
                  ClipRRect(
                    borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(20)),
                    child: SizedBox(
                      width: double.infinity,
                      height: double.infinity,
                      child: product.imageUrls.isNotEmpty
                          ? Image.network(
                              product.imageUrls[0],
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) =>
                                  _ImagePlaceholder(),
                            )
                          : _ImagePlaceholder(),
                    ),
                  ),
                  // Bio badge
                  if (product.isBio)
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Container(
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
                    ),
                ],
              ),
            ),

            // ── Product info ─────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(10, 10, 10, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: GoogleFonts.nunito(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: textDark,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${product.price} L / ${product.unit}',
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: forestMid,
                    ),
                  ),
                  const SizedBox(height: 8),
                  // "Shto" honey button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: onAddToCart,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: honeyMid,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(50)),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        elevation: 0,
                        minimumSize: const Size(0, 34),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: Text(
                        'Shto',
                        style: GoogleFonts.nunito(
                          fontSize: 12,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Image Placeholder ─────────────────────────────────────────────────────────

class _ImagePlaceholder extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      color: forestGhost,
      child: const Center(
        child: Icon(Icons.eco_outlined, size: 48, color: forestPale),
      ),
    );
  }
}

// ── Empty State ───────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: forestGhost,
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Text('🌿', style: TextStyle(fontSize: 36)),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Nuk ka produkte',
              style: GoogleFonts.playfairDisplay(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: textDark,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Provoni të ndryshoni filtrat ose kategorinë',
              textAlign: TextAlign.center,
              style: GoogleFonts.nunito(fontSize: 14, color: textMuted),
            ),
          ],
        ),
      ),
    );
  }
}
