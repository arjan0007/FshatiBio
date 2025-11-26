import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/category.dart';
import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
import 'product_detail_screen.dart';
import 'filters_screen.dart';

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
      setState(() {
        categories = fetchedCategories;
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
    if (!auth.isAuthenticated) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            action: SnackBarAction(
              label: 'Kyçu',
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
            ),
            content: const Text('Duhet të kyçeni për të shtuar në shportë'),
          ),
        );
      }
      return;
    }

    try {
      await context.read<CartProvider>().addItem(product.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${product.name} u shtua në shportë')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString())),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Categories and Filters
        Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 60,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  children: [
                    FilterChip(
                      label: const Text('Të gjitha'),
                      selected: selectedCategory == null,
                      onSelected: (_) => _filterByCategory(null),
                    ),
                    ...categories.map(
                      (cat) => Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: FilterChip(
                          label: Text(cat.name),
                          selected: selectedCategory == cat.id,
                          onSelected: (_) => _filterByCategory(cat.id),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.tune),
              onPressed: _openFilters,
              tooltip: 'Filtra',
            ),
          ],
        ),
        Expanded(
          child: loading
              ? const Center(child: CircularProgressIndicator())
              : products.isEmpty
                  ? const Center(child: Text('Nuk ka produkte të disponueshme'))
                  : RefreshIndicator(
                      onRefresh: _applyFilters,
                  child: GridView.builder(
                    padding: const EdgeInsets.all(16),
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 0.75,
                    ),
                    itemCount: products.length,
                    itemBuilder: (context, index) {
                      final product = products[index];
                      return Card(
                        elevation: 2,
                        child: InkWell(
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (_) => ProductDetailScreen(
                                  productId: product.id,
                                ),
                              ),
                            );
                          },
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Container(
                                  width: double.infinity,
                                  decoration: BoxDecoration(
                                    color: Colors.grey[200],
                                    borderRadius: const BorderRadius.vertical(
                                      top: Radius.circular(4),
                                    ),
                                  ),
                                  child: product.imageUrls.isNotEmpty
                                      ? Image.network(
                                          product.imageUrls[0],
                                          fit: BoxFit.cover,
                                          errorBuilder: (context, error, stackTrace) {
                                            return const Icon(Icons.image, size: 64);
                                          },
                                        )
                                      : const Icon(Icons.image, size: 64),
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.all(8.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      product.name,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                      ),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${product.price} L / ${product.unit}',
                                      style: const TextStyle(
                                        color: Color(0xFF16a34a),
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    SizedBox(
                                      width: double.infinity,
                                      child: ElevatedButton(
                                        onPressed: () => _addToCart(product),
                                        style: ElevatedButton.styleFrom(
                                          backgroundColor: const Color(0xFF16a34a),
                                          foregroundColor: Colors.white,
                                        ),
                                        child: const Text('Shto në Shportë'),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
        ),
      ],
    );
  }
}

