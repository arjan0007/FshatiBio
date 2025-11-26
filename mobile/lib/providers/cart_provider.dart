import 'package:flutter/foundation.dart';

import '../models/cart_summary.dart';
import '../services/api_service.dart';

class CartProvider with ChangeNotifier {
  String? _token;
  CartSummary _cart = CartSummary.empty();
  bool _isLoading = false;

  CartSummary get cart => _cart;
  bool get isLoading => _isLoading;
  int get itemCount =>
      _cart.items.fold(0, (sum, item) => sum + item.quantity);

  void updateAuthToken(String? token) {
    if (_token == token) return;
    _token = token;
    if (_token == null) {
      _cart = CartSummary.empty();
      notifyListeners();
    } else {
      refreshCart();
    }
  }

  Future<void> refreshCart() async {
    if (_token == null) return;
    _isLoading = true;
    notifyListeners();
    try {
      _cart = await ApiService.getCart(_token!);
    } catch (_) {
      _cart = CartSummary.empty();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> addItem(String productId) async {
    if (_token == null) throw Exception('Ju lutem kyçuni');
    await ApiService.addToCart(_token!, productId, 1);
    await refreshCart();
  }

  Future<void> updateItem(String itemId, int quantity) async {
    if (_token == null) throw Exception('Ju lutem kyçuni');
    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }
    await ApiService.updateCartItem(_token!, itemId, quantity);
    await refreshCart();
  }

  Future<void> removeItem(String itemId) async {
    if (_token == null) throw Exception('Ju lutem kyçuni');
    await ApiService.removeCartItem(_token!, itemId);
    await refreshCart();
  }
}
