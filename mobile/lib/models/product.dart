class Product {
  final String id;
  final String name;
  final String slug;
  final String description;
  final double price;
  final String unit;
  final int stockQuantity;
  final List<String> imageUrls;
  final bool isBio;

  Product({
    required this.id,
    required this.name,
    required this.slug,
    required this.description,
    required this.price,
    required this.unit,
    required this.stockQuantity,
    required this.imageUrls,
    required this.isBio,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      name: json['name'],
      slug: json['slug'],
      description: json['description'] ?? '',
      price: (json['price'] as num).toDouble(),
      unit: json['unit'],
      stockQuantity: json['stock_quantity'],
      imageUrls: List<String>.from(json['image_urls'] ?? []),
      isBio: json['is_bio'] ?? true,
    );
  }
}

