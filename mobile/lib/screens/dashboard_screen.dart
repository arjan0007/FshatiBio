import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../models/category.dart';
import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import 'product_detail_screen.dart';
import 'products_screen.dart';

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

class DashboardScreen extends StatefulWidget {
  final VoidCallback? onGoToProducts;

  const DashboardScreen({super.key, this.onGoToProducts});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Category> _categories = [];
  List<Product> _featured = [];
  List<Product> _bioProducts = [];
  bool _loading = true;
  final _searchCtrl = TextEditingController();
  int _bannerIndex = 0;
  final PageController _bannerCtrl = PageController();

  final List<Map<String, dynamic>> _banners = [
    {
      'title': 'Prodhime 100% Bio',
      'subtitle': 'Direkt nga fermerët shqiptarë',
      'gradient': [Color(0xFF1B4332), Color(0xFF40916C)],
      'emoji': '🌿',
    },
    {
      'title': 'Mjalte & Blini',
      'subtitle': 'Sezoni i verës — oferta speciale',
      'gradient': [Color(0xFFE76F51), Color(0xFFF4A261)],
      'emoji': '🍯',
    },
    {
      'title': 'Perime Organike',
      'subtitle': 'Pa pesticide, pa kimikate',
      'gradient': [Color(0xFF40916C), Color(0xFF52B788)],
      'emoji': '🥦',
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
    _startBannerTimer();
  }

  @override
  void dispose() {
    _bannerCtrl.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  void _startBannerTimer() {
    Future.delayed(const Duration(seconds: 4), () {
      if (!mounted) return;
      final next = (_bannerIndex + 1) % _banners.length;
      _bannerCtrl.animateToPage(
        next,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
      _startBannerTimer();
    });
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        ApiService.getCategories(),
        ApiService.getProducts(sort: 'rating', inStock: true),
        ApiService.getProducts(isBio: true, inStock: true),
      ]);
      if (!mounted) return;
      setState(() {
        _categories = results[0] as List<Category>;
        final allFeatured = results[1] as List<Product>;
        _featured = allFeatured.take(6).toList();
        final allBio = results[2] as List<Product>;
        _bioProducts = allBio.take(4).toList();
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final cart = context.watch<CartProvider>();
    final firstName = auth.user?.firstName.split(' ').first ?? 'Mik';

    return Scaffold(
      backgroundColor: creamBg,
      body: RefreshIndicator(
        color: forestMid,
        onRefresh: _loadData,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // ── App Bar ──────────────────────────────────────────────
            SliverAppBar(
              expandedHeight: 0,
              floating: true,
              snap: true,
              backgroundColor: forestMid,
              elevation: 0,
              automaticallyImplyLeading: false,
              title: Row(
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Center(
                      child: Text('🌿', style: TextStyle(fontSize: 18)),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'FshatiBio',
                        style: GoogleFonts.playfairDisplay(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        'Natyrë e pastër',
                        style: GoogleFonts.nunito(
                          color: Colors.white.withOpacity(0.8),
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              actions: [
                Stack(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.shopping_basket_outlined,
                          color: Colors.white, size: 26),
                      onPressed: () {},
                    ),
                    if (cart.itemCount > 0)
                      Positioned(
                        right: 8,
                        top: 8,
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(
                            color: honeyDark,
                            shape: BoxShape.circle,
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 16,
                            minHeight: 16,
                          ),
                          child: Text(
                            '${cart.itemCount}',
                            style: GoogleFonts.nunito(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 4),
              ],
            ),

            SliverToBoxAdapter(
              child: _loading
                  ? const SizedBox(
                      height: 400,
                      child: Center(
                        child: CircularProgressIndicator(color: forestMid),
                      ),
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // ── Greeting + Search ──────────────────────────
                        Container(
                          color: forestMid,
                          padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                auth.isAuthenticated
                                    ? 'Mirë se vjen, $firstName! 👋'
                                    : 'Mirë se vjen! 👋',
                                style: GoogleFonts.nunito(
                                  color: Colors.white.withOpacity(0.9),
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Çfarë do të blesh sot?',
                                style: GoogleFonts.playfairDisplay(
                                  color: Colors.white,
                                  fontSize: 22,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 16),
                              // Search bar
                              GestureDetector(
                                onTap: widget.onGoToProducts,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 16, vertical: 14),
                                  decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.search,
                                          color: textMuted, size: 20),
                                      const SizedBox(width: 10),
                                      Text(
                                        'Kërko produkte bio...',
                                        style: GoogleFonts.nunito(
                                          color: textMuted,
                                          fontSize: 15,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // ── Banner Carousel ───────────────────────────
                        const SizedBox(height: 20),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(20),
                            child: SizedBox(
                              height: 160,
                              child: PageView.builder(
                                controller: _bannerCtrl,
                                itemCount: _banners.length,
                                onPageChanged: (i) =>
                                    setState(() => _bannerIndex = i),
                                itemBuilder: (ctx, i) {
                                  final b = _banners[i];
                                  return Container(
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: b['gradient'] as List<Color>,
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                    ),
                                    padding: const EdgeInsets.all(24),
                                    child: Row(
                                      children: [
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            mainAxisAlignment:
                                                MainAxisAlignment.center,
                                            children: [
                                              Text(
                                                b['title'] as String,
                                                style:
                                                    GoogleFonts.playfairDisplay(
                                                  color: Colors.white,
                                                  fontSize: 22,
                                                  fontWeight: FontWeight.w700,
                                                ),
                                              ),
                                              const SizedBox(height: 6),
                                              Text(
                                                b['subtitle'] as String,
                                                style: GoogleFonts.nunito(
                                                  color: Colors.white
                                                      .withOpacity(0.85),
                                                  fontSize: 14,
                                                ),
                                              ),
                                              const SizedBox(height: 14),
                                              GestureDetector(
                                                onTap: widget.onGoToProducts,
                                                child: Container(
                                                  padding:
                                                      const EdgeInsets.symmetric(
                                                          horizontal: 16,
                                                          vertical: 8),
                                                  decoration: BoxDecoration(
                                                    color: Colors.white
                                                        .withOpacity(0.25),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            20),
                                                    border: Border.all(
                                                      color: Colors.white
                                                          .withOpacity(0.5),
                                                    ),
                                                  ),
                                                  child: Text(
                                                    'Shiko produktet',
                                                    style: GoogleFonts.nunito(
                                                      color: Colors.white,
                                                      fontSize: 13,
                                                      fontWeight:
                                                          FontWeight.w700,
                                                    ),
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Text(
                                          b['emoji'] as String,
                                          style:
                                              const TextStyle(fontSize: 72),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                            ),
                          ),
                        ),
                        // Banner dots
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: List.generate(_banners.length, (i) {
                            return AnimatedContainer(
                              duration: const Duration(milliseconds: 250),
                              margin:
                                  const EdgeInsets.symmetric(horizontal: 3),
                              width: _bannerIndex == i ? 20 : 6,
                              height: 6,
                              decoration: BoxDecoration(
                                color: _bannerIndex == i
                                    ? forestMid
                                    : earthLight,
                                borderRadius: BorderRadius.circular(3),
                              ),
                            );
                          }),
                        ),

                        // ── Quick Stats ───────────────────────────────
                        const SizedBox(height: 24),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Row(
                            children: [
                              _StatChip(
                                icon: '🌱',
                                label: '100% Bio',
                                color: forestGhost,
                                textColor: forestDark,
                              ),
                              const SizedBox(width: 10),
                              _StatChip(
                                icon: '🚚',
                                label: 'Dërgesa shpejt',
                                color: creamCard,
                                textColor: textDark,
                              ),
                              const SizedBox(width: 10),
                              _StatChip(
                                icon: '⭐',
                                label: 'Cilësi e lartë',
                                color: Color(0xFFFFF3CD),
                                textColor: Color(0xFF856404),
                              ),
                            ],
                          ),
                        ),

                        // ── Categories ────────────────────────────────
                        if (_categories.isNotEmpty) ...[
                          const SizedBox(height: 28),
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 20),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Kategoritë',
                                  style: GoogleFonts.playfairDisplay(
                                    color: textDark,
                                    fontSize: 20,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                GestureDetector(
                                  onTap: widget.onGoToProducts,
                                  child: Text(
                                    'Të gjitha',
                                    style: GoogleFonts.nunito(
                                      color: forestMid,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 14),
                          SizedBox(
                            height: 100,
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16),
                              scrollDirection: Axis.horizontal,
                              itemCount: _categories.length,
                              physics: const BouncingScrollPhysics(),
                              itemBuilder: (ctx, i) {
                                final cat = _categories[i];
                                return _CategoryChip(
                                  category: cat,
                                  onTap: widget.onGoToProducts,
                                );
                              },
                            ),
                          ),
                        ],

                        // ── Featured Products ─────────────────────────
                        if (_featured.isNotEmpty) ...[
                          const SizedBox(height: 28),
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 20),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Produkte të Rekomanduara',
                                  style: GoogleFonts.playfairDisplay(
                                    color: textDark,
                                    fontSize: 20,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                GestureDetector(
                                  onTap: widget.onGoToProducts,
                                  child: Text(
                                    'Shiko të gjitha',
                                    style: GoogleFonts.nunito(
                                      color: forestMid,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 14),
                          SizedBox(
                            height: 240,
                            child: ListView.builder(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16),
                              scrollDirection: Axis.horizontal,
                              physics: const BouncingScrollPhysics(),
                              itemCount: _featured.length,
                              itemBuilder: (ctx, i) {
                                return _FeaturedCard(
                                    product: _featured[i]);
                              },
                            ),
                          ),
                        ],

                        // ── Bio Products Grid ─────────────────────────
                        if (_bioProducts.isNotEmpty) ...[
                          const SizedBox(height: 28),
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 20),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '🌿 100% Organike',
                                      style: GoogleFonts.playfairDisplay(
                                        color: textDark,
                                        fontSize: 20,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    Text(
                                      'Pa kimikate, direkt nga ferma',
                                      style: GoogleFonts.nunito(
                                        color: textMuted,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 14),
                          Padding(
                            padding:
                                const EdgeInsets.symmetric(horizontal: 16),
                            child: GridView.builder(
                              shrinkWrap: true,
                              physics:
                                  const NeverScrollableScrollPhysics(),
                              gridDelegate:
                                  const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.75,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                              ),
                              itemCount: _bioProducts.length,
                              itemBuilder: (ctx, i) {
                                return _ProductGridCard(
                                    product: _bioProducts[i]);
                              },
                            ),
                          ),
                        ],

                        // ── Bottom promo ──────────────────────────────
                        const SizedBox(height: 28),
                        Padding(
                          padding:
                              const EdgeInsets.symmetric(horizontal: 20),
                          child: Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF1B4332), Color(0xFF2D6A4F)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Ferma Shqiptare',
                                        style: GoogleFonts.playfairDisplay(
                                          color: Colors.white,
                                          fontSize: 18,
                                          fontWeight: FontWeight.w700,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        'Mbështes fermerët lokalë me çdo blerje',
                                        style: GoogleFonts.nunito(
                                          color: Colors.white.withOpacity(0.8),
                                          fontSize: 13,
                                        ),
                                      ),
                                      const SizedBox(height: 14),
                                      GestureDetector(
                                        onTap: widget.onGoToProducts,
                                        child: Container(
                                          padding: const EdgeInsets.symmetric(
                                              horizontal: 16, vertical: 8),
                                          decoration: BoxDecoration(
                                            color: honeyMid,
                                            borderRadius:
                                                BorderRadius.circular(20),
                                          ),
                                          child: Text(
                                            'Bli tani',
                                            style: GoogleFonts.nunito(
                                              color: Colors.white,
                                              fontSize: 13,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const Text('🏡',
                                    style: TextStyle(fontSize: 56)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 100),
                      ],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Helper Widgets ────────────────────────────────────────────────────────────

class _StatChip extends StatelessWidget {
  final String icon;
  final String label;
  final Color color;
  final Color textColor;

  const _StatChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(14),
        ),
        child: Column(
          children: [
            Text(icon, style: const TextStyle(fontSize: 20)),
            const SizedBox(height: 4),
            Text(
              label,
              style: GoogleFonts.nunito(
                color: textColor,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final Category category;
  final VoidCallback? onTap;

  const _CategoryChip({required this.category, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 80,
        margin: const EdgeInsets.symmetric(horizontal: 4),
        child: Column(
          children: [
            Container(
              width: 64,
              height: 64,
              decoration: BoxDecoration(
                color: forestGhost,
                borderRadius: BorderRadius.circular(18),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(18),
                child: category.imageUrl != null
                    ? CachedNetworkImage(
                        imageUrl: category.imageUrl!,
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => const Center(
                          child: Text('🌿', style: TextStyle(fontSize: 28)),
                        ),
                      )
                    : const Center(
                        child: Text('🌿', style: TextStyle(fontSize: 28)),
                      ),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              category.name,
              style: GoogleFonts.nunito(
                color: textDark,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

class _FeaturedCard extends StatelessWidget {
  final Product product;

  const _FeaturedCard({required this.product});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) => ProductDetailScreen(productId: product.id)),
      ),
      child: Container(
        width: 160,
        margin: const EdgeInsets.symmetric(horizontal: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: forestMid.withOpacity(0.08),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(20)),
              child: SizedBox(
                height: 130,
                width: double.infinity,
                child: product.imageUrls.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: product.imageUrls.first,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => Container(color: forestGhost),
                        errorWidget: (_, __, ___) => Container(
                          color: forestGhost,
                          child: const Center(
                            child: Text('🌿', style: TextStyle(fontSize: 40)),
                          ),
                        ),
                      )
                    : Container(
                        color: forestGhost,
                        child: const Center(
                          child: Text('🌿', style: TextStyle(fontSize: 40)),
                        ),
                      ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
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
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        '🌿 Bio',
                        style: GoogleFonts.nunito(
                          color: forestMid,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  Text(
                    product.name,
                    style: GoogleFonts.nunito(
                      color: textDark,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${product.price.toStringAsFixed(0)} L',
                        style: GoogleFonts.nunito(
                          color: forestMid,
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(
                          color: forestGhost,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.add,
                            color: forestMid, size: 14),
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
}

class _ProductGridCard extends StatelessWidget {
  final Product product;

  const _ProductGridCard({required this.product});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) => ProductDetailScreen(productId: product.id)),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: forestMid.withOpacity(0.08),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Expanded(
              child: ClipRRect(
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(20)),
                child: SizedBox(
                  width: double.infinity,
                  child: product.imageUrls.isNotEmpty
                      ? CachedNetworkImage(
                          imageUrl: product.imageUrls.first,
                          fit: BoxFit.cover,
                          placeholder: (_, __) =>
                              Container(color: forestGhost),
                          errorWidget: (_, __, ___) => Container(
                            color: forestGhost,
                            child: const Center(
                              child:
                                  Text('🌿', style: TextStyle(fontSize: 36)),
                            ),
                          ),
                        )
                      : Container(
                          color: forestGhost,
                          child: const Center(
                            child: Text('🌿', style: TextStyle(fontSize: 36)),
                          ),
                        ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: GoogleFonts.nunito(
                      color: textDark,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${product.price.toStringAsFixed(0)} L',
                        style: GoogleFonts.nunito(
                          color: forestMid,
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(
                          color: forestMid,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.add,
                            color: Colors.white, size: 14),
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
}
