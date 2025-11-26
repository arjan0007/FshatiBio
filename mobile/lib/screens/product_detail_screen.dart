import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../models/product.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import 'login_screen.dart';

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
        final inList = await ApiService.checkWishlist(widget.productId, token);
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
              const SnackBar(content: Text('Produkti u hoq nga lista e dëshirave')),
            );
          }
        } else {
          await ApiService.addToWishlist(widget.productId, token);
          setState(() => inWishlist = true);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Produkti u shtua në listën e dëshirave')),
            );
          }
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gabim: $e')),
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
          SnackBar(content: Text('Gabim: $e')),
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
        const SnackBar(content: Text('Komenti duhet të jetë të paktën 10 karaktere')),
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
          const SnackBar(content: Text('Vlerësimi u shtua me sukses!')),
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
          SnackBar(content: Text(data['error']?['message'] ?? 'Gabim')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Gabim: $e')),
      );
    }
  }

  Widget _buildStars(int rating, {bool interactive = false, Function(int)? onRatingChange}) {
    return Row(
      children: List.generate(5, (index) {
        final starRating = index + 1;
        return GestureDetector(
          onTap: interactive && onRatingChange != null
              ? () => onRatingChange(starRating)
              : null,
          child: Icon(
            starRating <= rating ? Icons.star : Icons.star_border,
            color: starRating <= rating ? Colors.amber : Colors.grey,
            size: 24,
          ),
        );
      }),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (product == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Produkti')),
        body: const Center(child: Text('Produkti nuk u gjet')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Detajet e Produktit'),
        backgroundColor: const Color(0xFF16a34a),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: Icon(
              inWishlist ? Icons.favorite : Icons.favorite_border,
              color: inWishlist ? Colors.red : Colors.white,
            ),
            onPressed: checkingWishlist ? null : toggleWishlist,
            tooltip: inWishlist ? 'Hiq nga lista e dëshirave' : 'Shto në listën e dëshirave',
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Product Image
            if (product!.imageUrls.isNotEmpty)
              SizedBox(
                height: 300,
                width: double.infinity,
                child: Image.network(
                  product!.imageUrls[0],
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      color: Colors.grey[200],
                      child: const Icon(Icons.image, size: 64),
                    );
                  },
                ),
              )
            else
              Container(
                height: 300,
                width: double.infinity,
                color: Colors.grey[200],
                child: const Icon(Icons.image, size: 64),
              ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Product Name & Bio Badge
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          product!.name,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      if (product!.isBio)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.green[100],
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Text(
                            '✓ BIO',
                            style: TextStyle(
                              color: Colors.green,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                    ],
                  ),

                  const SizedBox(height: 16),

                  // Price
                  Text(
                    '${product!.price} L / ${product!.unit}',
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF16a34a),
                    ),
                  ),

                  const SizedBox(height: 8),

                  // Stock
                  Text(
                    product!.stockQuantity > 0
                        ? 'Në stok: ${product!.stockQuantity} ${product!.unit}'
                        : 'Nuk ka në stok',
                    style: TextStyle(
                      color: product!.stockQuantity > 0
                          ? Colors.green
                          : Colors.red,
                      fontWeight: FontWeight.w500,
                    ),
                  ),

                  const SizedBox(height: 16),

                  // Description
                  if (product!.description.isNotEmpty) ...[
                    const Text(
                      'Përshkrimi',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      product!.description,
                      style: const TextStyle(fontSize: 16),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Add to Cart
                  Consumer<AuthProvider>(
                    builder: (context, auth, _) {
                      return Column(
                        children: [
                          Row(
                            children: [
                              const Text('Sasia: '),
                              IconButton(
                                icon: const Icon(Icons.remove_circle_outline),
                                onPressed: () {
                                  setState(() {
                                    quantity = (quantity > 1) ? quantity - 1 : 1;
                                  });
                                },
                              ),
                              Text(
                                '$quantity',
                                style: const TextStyle(fontSize: 18),
                              ),
                              IconButton(
                                icon: const Icon(Icons.add_circle_outline),
                                onPressed: () {
                                  setState(() {
                                    quantity = (quantity < product!.stockQuantity)
                                        ? quantity + 1
                                        : quantity;
                                  });
                                },
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: product!.stockQuantity > 0
                                  ? () async {
                                      if (!auth.isAuthenticated) {
                                        Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (_) => const LoginScreen(),
                                          ),
                                        );
                                        return;
                                      }
                                      try {
                                        for (int i = 0; i < quantity; i++) {
                                          await context
                                              .read<CartProvider>()
                                              .addItem(product!.id);
                                        }
                                        if (mounted) {
                                          ScaffoldMessenger.of(context)
                                              .showSnackBar(
                                            SnackBar(
                                              content: Text(
                                                '${product!.name} u shtua në shportë',
                                              ),
                                            ),
                                          );
                                        }
                                      } catch (e) {
                                        if (mounted) {
                                          ScaffoldMessenger.of(context)
                                              .showSnackBar(
                                            SnackBar(content: Text('$e')),
                                          );
                                        }
                                      }
                                    }
                                  : null,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF16a34a),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                              ),
                              child: Text(
                                product!.stockQuantity > 0
                                    ? 'Shto në Shportë'
                                    : 'Nuk ka në stok',
                              ),
                            ),
                          ),
                        ],
                      );
                    },
                  ),

                  const SizedBox(height: 32),

                  // Reviews Section
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Vlerësimet',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Consumer<AuthProvider>(
                        builder: (context, auth, _) {
                          return TextButton(
                            onPressed: () {
                              if (!auth.isAuthenticated) {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => const LoginScreen(),
                                  ),
                                );
                                return;
                              }
                              setState(() {
                                showReviewForm = !showReviewForm;
                              });
                            },
                            child: Text(showReviewForm ? 'Anulo' : 'Shkruaj Vlerësim'),
                          );
                        },
                      ),
                    ],
                  ),

                  // Review Stats
                  if (reviewStats != null) ...[
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Column(
                          children: [
                            Text(
                              reviewStats!['average_rating']
                                  .toStringAsFixed(1),
                              style: const TextStyle(
                                fontSize: 48,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF16a34a),
                              ),
                            ),
                            _buildStars(
                              reviewStats!['average_rating'].round(),
                            ),
                            Text(
                              '${reviewStats!['total']} ${reviewStats!['total'] == 1 ? 'vlerësim' : 'vlerësime'}',
                              style: const TextStyle(color: Colors.grey),
                            ),
                          ],
                        ),
                        const SizedBox(width: 32),
                        Expanded(
                          child: Column(
                            children: [5, 4, 3, 2, 1].map((rating) {
                              final count = reviewStats!['rating_distribution']
                                  [rating.toString()] ?? 0;
                              final total = reviewStats!['total'] as int;
                              final percentage =
                                  total > 0 ? (count / total) * 100 : 0.0;
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 4),
                                child: Row(
                                  children: [
                                    Text('$rating ★'),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: LinearProgressIndicator(
                                        value: percentage / 100,
                                        backgroundColor: Colors.grey[200],
                                        valueColor:
                                            AlwaysStoppedAnimation<Color>(
                                          Colors.amber,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text('$count'),
                                  ],
                                ),
                              );
                            }).toList(),
                          ),
                        ),
                      ],
                    ),
                  ],

                  // Review Form
                  if (showReviewForm) ...[
                    const SizedBox(height: 24),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Vlerësimi Yt',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 16),
                            _buildStars(
                              reviewRating,
                              interactive: true,
                              onRatingChange: (rating) {
                                setState(() {
                                  reviewRating = rating;
                                });
                              },
                            ),
                            const SizedBox(height: 16),
                            TextField(
                              controller: reviewTitleController,
                              decoration: const InputDecoration(
                                labelText: 'Titulli (opsionale)',
                                border: OutlineInputBorder(),
                              ),
                            ),
                            const SizedBox(height: 16),
                            TextField(
                              controller: reviewCommentController,
                              decoration: const InputDecoration(
                                labelText: 'Komenti *',
                                hintText: 'Shkruaj komentin tënd (min 10 karaktere)',
                                border: OutlineInputBorder(),
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
                                  backgroundColor: const Color(0xFF16a34a),
                                  foregroundColor: Colors.white,
                                ),
                                child: const Text('Dërgo Vlerësimin'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],

                  // Reviews List
                  const SizedBox(height: 24),
                  if (reviews.isEmpty)
                    const Center(
                      child: Padding(
                        padding: EdgeInsets.all(32),
                        child: Text(
                          'Nuk ka vlerësime ende.\nBëhu i pari që vlerëson!',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey),
                        ),
                      ),
                    )
                  else
                    ...reviews.map((review) {
                      return Card(
                        margin: const EdgeInsets.only(bottom: 16),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          review['user_name'],
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Row(
                                          children: [
                                            _buildStars(review['rating']),
                                            if (review['is_verified_purchase'])
                                              Container(
                                                margin:
                                                    const EdgeInsets.only(
                                                  left: 8,
                                                ),
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                  horizontal: 6,
                                                  vertical: 2,
                                                ),
                                                decoration: BoxDecoration(
                                                  color: Colors.green[100],
                                                  borderRadius:
                                                      BorderRadius.circular(4),
                                                ),
                                                child: const Text(
                                                  '✓ Verifikuar',
                                                  style: TextStyle(
                                                    fontSize: 10,
                                                    color: Colors.green,
                                                  ),
                                                ),
                                              ),
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
                                    style: const TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey,
                                    ),
                                  ),
                                ],
                              ),
                              if (review['title'] != null) ...[
                                const SizedBox(height: 8),
                                Text(
                                  review['title'],
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                              if (review['comment'] != null) ...[
                                const SizedBox(height: 8),
                                Text(review['comment']),
                              ],
                              if (review['helpful_count'] > 0) ...[
                                const SizedBox(height: 8),
                                Text(
                                  '${review['helpful_count']} ${review['helpful_count'] == 1 ? 'person' : 'persona'} e gjetën të dobishme',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey,
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

