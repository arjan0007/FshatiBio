import '../models/product.dart';

class OrderItem {
  final Product product;
  final int quantity;
  final double unitPrice;
  final double totalPrice;

  OrderItem({
    required this.product,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      product: Product.fromJson(json['product']),
      quantity: json['quantity'],
      unitPrice: double.parse(json['unit_price'].toString()),
      totalPrice: double.parse(json['total_price'].toString()),
    );
  }
}

class OrderSummary {
  final String id;
  final String orderNumber;
  final String status;
  final double total;
  final DateTime createdAt;
  final DateTime deliveryDate;
  final List<OrderItem> items;

  OrderSummary({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.total,
    required this.createdAt,
    required this.deliveryDate,
    required this.items,
  });

  factory OrderSummary.fromJson(Map<String, dynamic> json) {
    return OrderSummary(
      id: json['id'],
      orderNumber: json['order_number'],
      status: json['status'],
      total: double.parse(json['total'].toString()),
      createdAt: DateTime.parse(json['created_at']),
      deliveryDate: DateTime.parse(json['delivery_date']),
      items: (json['items'] as List? ?? [])
          .map((item) => OrderItem.fromJson(item))
          .toList(),
    );
  }
}

