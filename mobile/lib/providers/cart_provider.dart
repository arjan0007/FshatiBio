import 'package:flutter/foundation.dart';

import '../models/cart_item.dart';
import '../models/cart_summary.dart';
import '../models/product.dart';
import '../services/api_service.dart';

class CartProvider with ChangeNotifier {
  String? _token;
  CartSummary _cart = CartSummary.empty();
  bool _isLoading = false;

  // Local guest cart (used when not logged in)
  final List<CartItem> _guestCart = [];

  CartSummary get cart => _cart;
  bool get isLoading => _isLoading;
  List<CartItem> get guestCart => List.unmodifiable(_guestCart);

  int get itemCount {
    if (_token != null) {
      return _cart.items.fold(0, (sum, item) => sum + item.quantity);
    }
    return _guestCart.fold(0, (sum, item) => sum + item.quantity);
  }

  // ── Guest cart ops ───────────────────────────────────────────────────────────

  void addGuestItem(Product product) {
    final idx = _guestCart.indexWhere((i) => i.product.id == product.id);
    if (idx != -1) {
      final existing = _guestCart[idx];
      _guestCart[idx] = CartItem(
        id: existing.id,
        product: product,
        quantity: existing.quantity + 1,
        unitPrice: product.price,
        totalPrice: product.price * (existing.quantity + 1),
      );
    } else {
      _guestCart.add(CartItem(
        id: 'guest_${product.id}',
        product: product,
        quantity: 1,
        unitPrice: product.price,
        totalPrice: product.price,
      ));
    }
    notifyListeners();
  }

  void removeGuestItem(String itemId) {
    _guestCart.removeWhere((i) => i.id == itemId);
    notifyListeners();
  }

  void updateGuestItem(String itemId, int quantity) {
    if (quantity <= 0) {
      removeGuestItem(itemId);
      return;
    }
    final idx = _guestCart.indexWhere((i) => i.id == itemId);
    if (idx != -1) {
      final item = _guestCart[idx];
      _guestCart[idx] = CartItem(
        id: item.id,
        product: item.product,
        quantity: quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * quantity,
      );
      notifyListeners();
    }
  }

  double get guestSubtotal =>
      _guestCart.fold(0, (sum, i) => sum + i.totalPrice);

  // ── Auth token / server cart ─────────────────────────────────────────────────

  void updateAuthToken(String? token) {
    if (_token == token) return;
    _token = token;
    if (_token == null) {
      _cart = CartSummary.empty();
      notifyListeners();
    } else {
      _syncGuestCartThenRefresh();
    }
  }

  /// On login: sync any guest items to the server, then refresh.
  Future<void> _syncGuestCartThenRefresh() async {
    for (final item in List<CartItem>.from(_guestCart)) {
      try {
        await ApiService.addToCart(_token!, item.product.id, item.quantity);
      } catch (_) {}
    }
    _guestCart.clear();
    await refreshCart();
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
