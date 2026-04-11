import 'dart:math' as math;
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

// ── Design tokens ─────────────────────────────────────────────────────────────
const Color forestDark  = Color(0xFF1B4332);
const Color forestMid   = Color(0xFF2D6A4F);
const Color forestLight = Color(0xFF40916C);
const Color forestPale  = Color(0xFF52B788);
const Color forestGhost = Color(0xFFD8F3DC);
const Color honeyDark   = Color(0xFFE76F51);
const Color honeyMid    = Color(0xFFF4A261);
const Color honeyLight  = Color(0xFFFCA03A);
const Color creamBg     = Color(0xFFFEFAE0);
const Color creamCard   = Color(0xFFFDF3C0);
const Color earthLight  = Color(0xFFE8D5C4);
const Color earthMid    = Color(0xFFD4B896);
const Color textDark    = Color(0xFF1B2F1E);
const Color textMuted   = Color(0xFF6B7C73);

// Category emoji map
const Map<String, String> _catEmoji = {
  'qumesht':     '🥛',
  'djathe':      '🧀',
  'veze':        '🥚',
  'zogj-fshati': '🐔',
  'mish-vici':   '🥩',
  'mish-qengji': '🍖',
  'gjaltpe-kos': '🧈',
};

const List<Color> _catColors = [
  Color(0xFF2D6A4F), Color(0xFFE76F51), Color(0xFF457B9D),
  Color(0xFF6A4C93), Color(0xFF1B7A4A), Color(0xFFB5451B),
  Color(0xFF8B5E3C),
];

// ─────────────────────────────────────────────────────────────────────────────

class DashboardScreen extends StatefulWidget {
  final VoidCallback? onGoToProducts;
  const DashboardScreen({super.key, this.onGoToProducts});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with TickerProviderStateMixin {
  List<Category> _categories = [];
  List<Product>  _featured   = [];
  List<Product>  _fresh      = [];
  bool           _loading    = true;

  late AnimationController _heroCtrl;
  late AnimationController _pulseCtrl;
  late Animation<double>   _heroFade;
  late Animation<double>   _heroSlide;
  late Animation<double>   _pulse;

  @override
  void initState() {
    super.initState();

    _heroCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900));
    _pulseCtrl = AnimationController(
        vsync: this, duration: const Duration(seconds: 2))
      ..repeat(reverse: true);

    _heroFade  = CurvedAnimation(parent: _heroCtrl, curve: Curves.easeOut);
    _heroSlide = Tween<double>(begin: 30, end: 0).animate(
        CurvedAnimation(parent: _heroCtrl, curve: Curves.easeOutCubic));
    _pulse     = Tween<double>(begin: 1.0, end: 1.06).animate(
        CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeInOut));

    _loadData();
  }

  @override
  void dispose() {
    _heroCtrl.dispose();
    _pulseCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      final results = await Future.wait([
        ApiService.getCategories(),
        ApiService.getProducts(sort: 'rating_desc', inStock: true),
        ApiService.getProducts(isBio: true, inStock: true),
      ]);
      if (!mounted) return;
      setState(() {
        _categories = results[0] as List<Category>;
        final all = results[1] as List<Product>;
        _featured = all.take(5).toList();
        final bio = results[2] as List<Product>;
        _fresh = bio.take(6).toList();
        _loading = false;
      });
      _heroCtrl.forward();
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
      _heroCtrl.forward();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final cart = context.watch<CartProvider>();
    final size = MediaQuery.of(context).size;
    final firstName = auth.user?.firstName ?? '';

    return Scaffold(
      backgroundColor: creamBg,
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: forestMid))
          : RefreshIndicator(
              color: forestMid,
              onRefresh: _loadData,
              child: CustomScrollView(
                physics: const BouncingScrollPhysics(),
                slivers: [
                  // ── Hero Header ──────────────────────────────────────
                  SliverToBoxAdapter(
                    child: _HeroHeader(
                      firstName: firstName,
                      isLoggedIn: auth.isAuthenticated,
                      cartCount: cart.itemCount,
                      heroFade: _heroFade,
                      heroSlide: _heroSlide,
                      pulse: _pulse,
                      screenWidth: size.width,
                      onSearch: widget.onGoToProducts,
                    ),
                  ),

                  // ── Seasonal badge row ───────────────────────────────
                  SliverToBoxAdapter(
                    child: FadeTransition(
                      opacity: _heroFade,
                      child: _SeasonRow(),
                    ),
                  ),

                  // ── Category stories ─────────────────────────────────
                  if (_categories.isNotEmpty)
                    SliverToBoxAdapter(
                      child: FadeTransition(
                        opacity: _heroFade,
                        child: _CategoryStories(
                          categories: _categories,
                          onTap: widget.onGoToProducts,
                        ),
                      ),
                    ),

                  // ── "Zgjedhja jonë" featured strip ───────────────────
                  if (_featured.isNotEmpty) ...[
                    SliverToBoxAdapter(
                      child: _SectionHeader(
                        title: '⭐ Zgjedhja jonë',
                        subtitle: 'Produktet më të shitura',
                        onMore: widget.onGoToProducts,
                      ),
                    ),
                    SliverToBoxAdapter(
                      child: _FeaturedStrip(products: _featured),
                    ),
                  ],

                  // ── "Freskë sot" big cards ───────────────────────────
                  if (_fresh.isNotEmpty) ...[
                    SliverToBoxAdapter(
                      child: _SectionHeader(
                        title: '🌿 Bio të freskëta',
                        subtitle: 'Direkt nga fermë, pa kimikate',
                        onMore: widget.onGoToProducts,
                      ),
                    ),
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      sliver: SliverGrid(
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.72,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        delegate: SliverChildBuilderDelegate(
                          (ctx, i) => _BioCard(product: _fresh[i]),
                          childCount: _fresh.length,
                        ),
                      ),
                    ),
                  ],

                  // ── Why us banner ────────────────────────────────────
                  SliverToBoxAdapter(child: _WhyUsBanner()),

                  const SliverToBoxAdapter(child: SizedBox(height: 100)),
                ],
              ),
            ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HERO HEADER
// ─────────────────────────────────────────────────────────────────────────────

class _HeroHeader extends StatelessWidget {
  final String firstName;
  final bool isLoggedIn;
  final int cartCount;
  final Animation<double> heroFade;
  final Animation<double> heroSlide;
  final Animation<double> pulse;
  final double screenWidth;
  final VoidCallback? onSearch;

  const _HeroHeader({
    required this.firstName,
    required this.isLoggedIn,
    required this.cartCount,
    required this.heroFade,
    required this.heroSlide,
    required this.pulse,
    required this.screenWidth,
    this.onSearch,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1B4332), Color(0xFF2D6A4F), Color(0xFF40916C)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        children: [
          // Decorative circles
          Positioned(top: -40, right: -40,
            child: Container(
              width: 180, height: 180,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.05),
              ),
            ),
          ),
          Positioned(top: 40, right: 40,
            child: Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withOpacity(0.07),
              ),
            ),
          ),
          Positioned(bottom: -20, left: -20,
            child: Container(
              width: 120, height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: honeyMid.withOpacity(0.15),
              ),
            ),
          ),

          // Content
          SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Top row
                  Row(
                    children: [
                      // Logo badge
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: Colors.white.withOpacity(0.2)),
                        ),
                        child: const Text('🌿',
                            style: TextStyle(fontSize: 20)),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'FshatiBio',
                        style: GoogleFonts.playfairDisplay(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const Spacer(),
                      // Cart button
                      Stack(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.15),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                  color: Colors.white.withOpacity(0.2)),
                            ),
                            child: const Icon(
                              Icons.shopping_basket_rounded,
                              color: Colors.white, size: 22,
                            ),
                          ),
                          if (cartCount > 0)
                            Positioned(
                              right: 0, top: 0,
                              child: Container(
                                width: 18, height: 18,
                                decoration: const BoxDecoration(
                                  color: honeyDark,
                                  shape: BoxShape.circle,
                                ),
                                child: Center(
                                  child: Text(
                                    '$cartCount',
                                    style: GoogleFonts.nunito(
                                      color: Colors.white,
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Greeting + headline
                  AnimatedBuilder(
                    animation: heroSlide,
                    builder: (ctx, child) => Transform.translate(
                      offset: Offset(0, heroSlide.value),
                      child: FadeTransition(opacity: heroFade, child: child),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (isLoggedIn && firstName.isNotEmpty) ...[
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: honeyMid.withOpacity(0.3),
                                  borderRadius: BorderRadius.circular(20),
                                ),
                                child: Row(
                                  children: [
                                    const Text('👋',
                                        style: TextStyle(fontSize: 13)),
                                    const SizedBox(width: 4),
                                    Text(
                                      'Mirë se vjen, $firstName!',
                                      style: GoogleFonts.nunito(
                                        color: Colors.white,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                        ],
                        Text(
                          'Natyra në\ntavolinën tënde.',
                          style: GoogleFonts.playfairDisplay(
                            color: Colors.white,
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                            height: 1.15,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Produkte bio 100% shqiptare',
                          style: GoogleFonts.nunito(
                            color: Colors.white.withOpacity(0.75),
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 22),

                  // Search bar
                  AnimatedBuilder(
                    animation: heroFade,
                    builder: (ctx, child) =>
                        FadeTransition(opacity: heroFade, child: child),
                    child: GestureDetector(
                      onTap: onSearch,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 18, vertical: 14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(18),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 20,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: forestGhost,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.search_rounded,
                                  color: forestMid, size: 18),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Kërko produkte bio...',
                              style: GoogleFonts.nunito(
                                color: textMuted,
                                fontSize: 15,
                              ),
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: forestGhost,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.tune_rounded,
                                      color: forestMid, size: 14),
                                  const SizedBox(width: 4),
                                  Text(
                                    'Filter',
                                    style: GoogleFonts.nunito(
                                      color: forestMid,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SEASON ROW
// ─────────────────────────────────────────────────────────────────────────────

class _SeasonRow extends StatelessWidget {
  final List<Map<String, String>> _badges = const [
    {'icon': '☀️', 'text': 'Sezoni i Verës'},
    {'icon': '🌱', 'text': '100% Organike'},
    {'icon': '🚚', 'text': 'Dorëzim i shpejtë'},
    {'icon': '⭐', 'text': 'Cilësi e garantuar'},
    {'icon': '🇦🇱', 'text': 'Prodhim Shqiptar'},
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          children: _badges.map((b) {
            return Container(
              margin: const EdgeInsets.only(right: 10),
              padding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: creamBg,
                borderRadius: BorderRadius.circular(30),
                border: Border.all(color: earthLight),
              ),
              child: Row(
                children: [
                  Text(b['icon']!, style: const TextStyle(fontSize: 14)),
                  const SizedBox(width: 6),
                  Text(
                    b['text']!,
                    style: GoogleFonts.nunito(
                      color: textDark,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY STORIES
// ─────────────────────────────────────────────────────────────────────────────

class _CategoryStories extends StatelessWidget {
  final List<Category> categories;
  final VoidCallback? onTap;

  const _CategoryStories(
      {required this.categories, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 14),
          child: Row(
            children: [
              Text(
                'Kategoritë',
                style: GoogleFonts.playfairDisplay(
                  color: textDark,
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Spacer(),
              GestureDetector(
                onTap: onTap,
                child: Row(
                  children: [
                    Text(
                      'Të gjitha',
                      style: GoogleFonts.nunito(
                        color: forestMid,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(width: 4),
                    const Icon(Icons.arrow_forward_ios_rounded,
                        color: forestMid, size: 12),
                  ],
                ),
              ),
            ],
          ),
        ),
        SizedBox(
          height: 108,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: categories.length,
            itemBuilder: (ctx, i) {
              final cat = categories[i];
              final color = _catColors[i % _catColors.length];
              final emoji =
                  _catEmoji[cat.id] ?? _catEmoji[cat.name.toLowerCase()] ?? '🌿';
              return GestureDetector(
                onTap: onTap,
                child: Container(
                  width: 80,
                  margin: const EdgeInsets.only(right: 12),
                  child: Column(
                    children: [
                      // Story ring
                      Container(
                        width: 68,
                        height: 68,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: LinearGradient(
                            colors: [
                              color.withOpacity(0.9),
                              color.withOpacity(0.6),
                            ],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: color.withOpacity(0.3),
                              blurRadius: 12,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: cat.imageUrl != null
                            ? ClipOval(
                                child: CachedNetworkImage(
                                  imageUrl: cat.imageUrl!,
                                  fit: BoxFit.cover,
                                  errorWidget: (_, __, ___) => Center(
                                    child: Text(
                                      _catEmoji.entries
                                              .firstWhere(
                                                (e) => cat.name
                                                    .toLowerCase()
                                                    .contains(e.key
                                                        .split('-')
                                                        .first),
                                                orElse: () =>
                                                    const MapEntry('', '🌿'),
                                              )
                                              .value,
                                      style:
                                          const TextStyle(fontSize: 28),
                                    ),
                                  ),
                                ),
                              )
                            : Center(
                                child: Text(
                                  _catEmoji.entries
                                      .firstWhere(
                                        (e) => cat.name
                                            .toLowerCase()
                                            .contains(
                                                e.key.split('-').first),
                                        orElse: () =>
                                            const MapEntry('', '🌿'),
                                      )
                                      .value,
                                  style: const TextStyle(fontSize: 28),
                                ),
                              ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        cat.name,
                        style: GoogleFonts.nunito(
                          color: textDark,
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  final VoidCallback? onMore;

  const _SectionHeader(
      {required this.title, required this.subtitle, this.onMore});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 28, 20, 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.playfairDisplay(
                    color: textDark,
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: GoogleFonts.nunito(
                    color: textMuted,
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          GestureDetector(
            onTap: onMore,
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: forestGhost,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Row(
                children: [
                  Text(
                    'Të gjitha',
                    style: GoogleFonts.nunito(
                      color: forestMid,
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(width: 3),
                  const Icon(Icons.arrow_forward_ios_rounded,
                      color: forestMid, size: 10),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// FEATURED STRIP  (large horizontal cards)
// ─────────────────────────────────────────────────────────────────────────────

class _FeaturedStrip extends StatelessWidget {
  final List<Product> products;
  const _FeaturedStrip({required this.products});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 220,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 16),
        itemCount: products.length,
        itemBuilder: (ctx, i) {
          final p = products[i];
          return GestureDetector(
            onTap: () => Navigator.push(
              ctx,
              MaterialPageRoute(
                  builder: (_) =>
                      ProductDetailScreen(productId: p.id)),
            ),
            child: Container(
              width: 180,
              margin: const EdgeInsets.only(right: 14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: forestMid.withOpacity(0.12),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Image
                    p.imageUrls.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: p.imageUrls.first,
                            fit: BoxFit.cover,
                            placeholder: (_, __) =>
                                Container(color: forestGhost),
                            errorWidget: (_, __, ___) => Container(
                              color: forestGhost,
                              child: const Center(
                                  child: Text('🌿',
                                      style: TextStyle(fontSize: 48))),
                            ),
                          )
                        : Container(
                            color: forestGhost,
                            child: const Center(
                                child: Text('🌿',
                                    style: TextStyle(fontSize: 48))),
                          ),

                    // Gradient overlay
                    DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.transparent,
                            Colors.black.withOpacity(0.65),
                          ],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),

                    // Bio badge
                    if (p.isBio)
                      Positioned(
                        top: 12, left: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: forestMid,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '🌿 Bio',
                            style: GoogleFonts.nunito(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ),

                    // Price tag
                    Positioned(
                      top: 12, right: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: honeyMid,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '${p.price.toStringAsFixed(0)} L',
                          style: GoogleFonts.nunito(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),

                    // Bottom info
                    Positioned(
                      bottom: 0, left: 0, right: 0,
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              p.name,
                              style: GoogleFonts.playfairDisplay(
                                color: Colors.white,
                                fontSize: 15,
                                fontWeight: FontWeight.w700,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                    color: Colors.white.withOpacity(0.3)),
                              ),
                              child: Text(
                                'Shiko detajet →',
                                style: GoogleFonts.nunito(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// BIO GRID CARD
// ─────────────────────────────────────────────────────────────────────────────

class _BioCard extends StatelessWidget {
  final Product product;
  const _BioCard({required this.product});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => Navigator.push(
        context,
        MaterialPageRoute(
            builder: (_) =>
                ProductDetailScreen(productId: product.id)),
      ),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: forestMid.withOpacity(0.08),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            Expanded(
              flex: 3,
              child: ClipRRect(
                borderRadius:
                    const BorderRadius.vertical(top: Radius.circular(22)),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    product.imageUrls.isNotEmpty
                        ? CachedNetworkImage(
                            imageUrl: product.imageUrls.first,
                            fit: BoxFit.cover,
                            placeholder: (_, __) =>
                                Container(color: forestGhost),
                            errorWidget: (_, __, ___) => Container(
                              color: forestGhost,
                              child: const Center(
                                  child: Text('🌿',
                                      style: TextStyle(fontSize: 36))),
                            ),
                          )
                        : Container(
                            color: forestGhost,
                            child: const Center(
                                child: Text('🌿',
                                    style: TextStyle(fontSize: 36))),
                          ),
                    // Subtle overlay
                    DecoratedBox(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            Colors.transparent,
                            Colors.black.withOpacity(0.08),
                          ],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Info
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      product.name,
                      style: GoogleFonts.nunito(
                        color: textDark,
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '${product.price.toStringAsFixed(0)} L',
                              style: GoogleFonts.nunito(
                                color: forestMid,
                                fontSize: 15,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            Text(
                              '/${product.unit == 'piece' ? 'copë' : product.unit}',
                              style: GoogleFonts.nunito(
                                color: textMuted,
                                fontSize: 10,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          width: 32, height: 32,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [forestLight, forestMid],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: [
                              BoxShadow(
                                color: forestMid.withOpacity(0.3),
                                blurRadius: 8,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: const Icon(Icons.add_rounded,
                              color: Colors.white, size: 18),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WHY US BANNER
// ─────────────────────────────────────────────────────────────────────────────

class _WhyUsBanner extends StatelessWidget {
  final List<Map<String, String>> _perks = const [
    {'icon': '🌱', 'title': '100% Bio', 'sub': 'Pa kimikate'},
    {'icon': '🚚', 'title': 'Dërgesa shpejt', 'sub': 'Brenda 24h'},
    {'icon': '🤝', 'title': 'Fermerë vendas', 'sub': 'Produkt shqiptar'},
    {'icon': '💚', 'title': 'Garanci cilësie', 'sub': 'Ose kthejmë paratë'},
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 28, 16, 0),
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF1B4332), Color(0xFF2D6A4F)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: forestDark.withOpacity(0.25),
              blurRadius: 24,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Pse FshatiBio?',
              style: GoogleFonts.playfairDisplay(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Çfarë na bën të veçantë',
              style: GoogleFonts.nunito(
                color: Colors.white.withOpacity(0.7),
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 20),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 2.4,
              children: _perks.map((p) {
                return Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                        color: Colors.white.withOpacity(0.15)),
                  ),
                  child: Row(
                    children: [
                      Text(p['icon']!,
                          style: const TextStyle(fontSize: 18)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              p['title']!,
                              style: GoogleFonts.nunito(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            Text(
                              p['sub']!,
                              style: GoogleFonts.nunito(
                                color: Colors.white.withOpacity(0.6),
                                fontSize: 10,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }
}
