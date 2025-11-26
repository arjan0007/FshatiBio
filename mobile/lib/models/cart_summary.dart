import 'cart_item.dart';

class CartSummary {
  final List<CartItem> items;
  final double subtotal;
  final double deliveryFee;
  final double total;

  CartSummary({
    required this.items,
    required this.subtotal,
    required this.deliveryFee,
    required this.total,
  });

  factory CartSummary.fromJson(Map<String, dynamic> json) {
    return CartSummary(
      items: (json['items'] as List)
          .map((item) => CartItem.fromJson(item))
          .toList(),
      subtotal: double.parse(json['subtotal'].toString()),
      deliveryFee: double.parse(json['delivery_fee'].toString()),
      total: double.parse(json['total'].toString()),
    );
  }

  factory CartSummary.empty() {
    return CartSummary(
      items: const [],
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
    );
  }
}

