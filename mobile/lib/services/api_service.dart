import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../models/cart_summary.dart';
import '../models/category.dart' as models;
import '../models/order.dart';
import '../models/product.dart';
import '../models/user.dart';

class ApiService {
  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:3000/api';
    if (Platform.isAndroid) return 'http://10.0.2.2:3000/api';
    return 'http://localhost:3000/api';
  }

  static Map<String, String> _headers({String? token}) {
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> login(
      String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: _headers(),
      body: jsonEncode({'email': email, 'password': password}),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data['data'];
    }
    throw Exception(data['error']?['message'] ?? 'Login dështoi');
  }

  static Future<Map<String, dynamic>> register(Map<String, dynamic> payload) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/register'),
      headers: _headers(),
      body: jsonEncode(payload),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 || response.statusCode == 201) {
      if (data['success'] == true) {
        return data['data'];
      }
    }
    throw Exception(data['error']?['message'] ?? 'Regjistrimi dështoi');
  }

  static Future<AppUser> getProfile(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/auth/me'),
      headers: _headers(token: token),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return AppUser.fromJson(data['data']['user']);
    }
    throw Exception('Nuk u mor profili');
  }

  static Future<List<models.Category>> getCategories() async {
    final response = await http.get(Uri.parse('$baseUrl/categories'));
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data['success'] == true) {
      return (data['data']['categories'] as List)
          .map((json) => models.Category.fromJson(json))
          .toList();
      }
    }
    throw Exception('Nuk u morën kategoritë');
  }

  static Future<List<Product>> getProducts({
    String? categoryId,
    String? search,
    double? minPrice,
    double? maxPrice,
    bool? isBio,
    bool? inStock,
    double? minRating,
    String? sort,
  }) async {
    final params = <String, String>{};
    if (categoryId != null) params['category'] = categoryId;
    if (search != null && search.isNotEmpty) params['search'] = search;
    if (minPrice != null) params['min_price'] = minPrice.toString();
    if (maxPrice != null) params['max_price'] = maxPrice.toString();
    if (isBio != null) params['is_bio'] = isBio.toString();
    if (inStock != null) params['in_stock'] = inStock.toString();
    if (minRating != null) params['min_rating'] = minRating.toString();
    if (sort != null) params['sort'] = sort;

    final query = params.isEmpty
        ? ''
        : '?${params.entries.map((e) => '${Uri.encodeComponent(e.key)}=${Uri.encodeComponent(e.value)}').join('&')}';
    final response = await http.get(Uri.parse('$baseUrl/products$query'));

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data['success'] == true) {
        final products = (data['data']['products'] as List)
            .map((json) => Product.fromJson(json))
            .toList();
        return products;
      }
    }
    throw Exception('Failed to load products');
  }

  static Future<CartSummary> getCart(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/cart'),
      headers: _headers(token: token),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return CartSummary.fromJson(data['data']);
    }
    throw Exception(data['error']?['message'] ?? 'Nuk u mor shporta');
  }

  static Future<void> addToCart(String token, String productId, int quantity) async {
    final response = await http.post(
      Uri.parse('$baseUrl/cart/add'),
      headers: _headers(token: token),
      body: jsonEncode({'product_id': productId, 'quantity': quantity}),
    );

    if (response.statusCode != 200) {
      final data = jsonDecode(response.body);
      throw Exception(data['error']?['message'] ?? 'Shtimi në shportë dështoi');
    }
  }

  static Future<void> updateCartItem(
      String token, String itemId, int quantity) async {
    final response = await http.put(
      Uri.parse('$baseUrl/cart/update/$itemId'),
      headers: _headers(token: token),
      body: jsonEncode({'quantity': quantity}),
    );

    if (response.statusCode != 200) {
      final data = jsonDecode(response.body);
      throw Exception(data['error']?['message'] ?? 'Përditësimi dështoi');
    }
  }

  static Future<void> removeCartItem(String token, String itemId) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/cart/remove/$itemId'),
      headers: _headers(token: token),
    );

    if (response.statusCode != 200) {
      final data = jsonDecode(response.body);
      throw Exception(data['error']?['message'] ?? 'Heqja dështoi');
    }
  }

  static Future<List<OrderSummary>> getOrders(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/orders'),
      headers: _headers(token: token),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return (data['data']['orders'] as List)
          .map((json) => OrderSummary.fromJson(json))
          .toList();
    }
    throw Exception(data['error']?['message'] ?? 'Nuk u morën porositë');
  }

  static Future<List<Map<String, dynamic>>> getAddresses(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/addresses'),
      headers: _headers(token: token),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return List<Map<String, dynamic>>.from(data['data']['addresses']);
    }
    throw Exception(data['error']?['message'] ?? 'Nuk u morën adresat');
  }

  static Future<String> createAddress(String token, Map<String, dynamic> address) async {
    final response = await http.post(
      Uri.parse('$baseUrl/addresses'),
      headers: _headers(token: token),
      body: jsonEncode(address),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 200 || response.statusCode == 201) {
      if (data['success'] == true) {
        return data['data']['address']['id'];
      }
    }
    throw Exception(data['error']?['message'] ?? 'Nuk u ruajt adresa');
  }

  static Future<String> createOrder(
    String token, {
    required String addressId,
    required String deliveryDate,
    required String timeSlot,
    String? notes,
    String? couponId,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/orders'),
      headers: _headers(token: token),
      body: jsonEncode({
        'address_id': addressId,
        'payment_method': 'cod',
        'delivery_date': deliveryDate,
        'delivery_time_slot': timeSlot,
        'notes': notes,
        if (couponId != null) 'coupon_id': couponId,
      }),
    );

    final data = jsonDecode(response.body);
    if ((response.statusCode == 200 || response.statusCode == 201) &&
        data['success'] == true) {
      return data['data']['order']['id'].toString();
    }
    throw Exception(data['error']?['message'] ?? 'Porosia dështoi');
  }

  static Future<Map<String, dynamic>> applyCoupon(String code, double subtotal, String token) async {
    final response = await http.post(
      Uri.parse('$baseUrl/coupons/apply'),
      headers: _headers(token: token),
      body: jsonEncode({
        'code': code,
        'subtotal': subtotal,
      }),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data['data'];
    }
    throw Exception(data['error']?['message'] ?? 'Kupon i pavlefshëm');
  }

  static Future<Map<String, dynamic>> getOrderDetails(String orderId, String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/orders/$orderId'),
      headers: _headers(token: token),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data['data']['order'];
    }
    throw Exception(data['error']?['message'] ?? 'Nuk u morën detajet e porosisë');
  }

  static Future<void> cancelOrder(String orderId, String token) async {
    final response = await http.put(
      Uri.parse('$baseUrl/orders/$orderId/cancel'),
      headers: _headers(token: token),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode != 200 || data['success'] != true) {
      throw Exception(data['error']?['message'] ?? 'Anulimi i porosisë dështoi');
    }
  }

  static Future<String> updateAddress(String addressId, Map<String, dynamic> address, String token) async {
    final response = await http.put(
      Uri.parse('$baseUrl/addresses/$addressId'),
      headers: _headers(token: token),
      body: jsonEncode(address),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return data['data']['address']['id'];
    }
    throw Exception(data['error']?['message'] ?? 'Përditësimi i adresës dështoi');
  }

  static Future<void> deleteAddress(String addressId, String token) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/addresses/$addressId'),
      headers: _headers(token: token),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode != 200 || data['success'] != true) {
      throw Exception(data['error']?['message'] ?? 'Fshirja e adresës dështoi');
    }
  }

  static Future<void> updateProfile(Map<String, dynamic> profile, String token) async {
    final response = await http.put(
      Uri.parse('$baseUrl/auth/me'),
      headers: _headers(token: token),
      body: jsonEncode(profile),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode != 200 || data['success'] != true) {
      throw Exception(data['error']?['message'] ?? 'Përditësimi i profilit dështoi');
    }
  }

  static Future<void> changePassword(String oldPassword, String newPassword, String token) async {
    final response = await http.put(
      Uri.parse('$baseUrl/auth/change-password'),
      headers: _headers(token: token),
      body: jsonEncode({
        'old_password': oldPassword,
        'new_password': newPassword,
      }),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode != 200 || data['success'] != true) {
      throw Exception(data['error']?['message'] ?? 'Ndryshimi i fjalëkalimit dështoi');
    }
  }

  static Future<void> registerFCMToken(String fcmToken, String authToken) async {
    final response = await http.post(
      Uri.parse('$baseUrl/notifications/register-token'),
      headers: _headers(token: authToken),
      body: jsonEncode({'fcm_token': fcmToken}),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode != 200 || data['success'] != true) {
      throw Exception(data['error']?['message'] ?? 'Regjistrimi i token dështoi');
    }
  }

  // Wishlist methods
  static Future<List<Map<String, dynamic>>> getWishlist(String token) async {
    final response = await http.get(
      Uri.parse('$baseUrl/wishlist'),
      headers: _headers(token: token),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['success'] == true) {
      return List<Map<String, dynamic>>.from(data['data']['wishlist']);
    }
    throw Exception(data['error']?['message'] ?? 'Nuk u mor wishlist');
  }

  static Future<void> addToWishlist(String productId, String token) async {
    final response = await http.post(
      Uri.parse('$baseUrl/wishlist'),
      headers: _headers(token: token),
      body: jsonEncode({'product_id': productId}),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode != 201 || data['success'] != true) {
      throw Exception(data['error']?['message'] ?? 'Shtimi në wishlist dështoi');
    }
  }

  static Future<void> removeFromWishlist(String productId, String token) async {
    final response = await http.delete(
      Uri.parse('$baseUrl/wishlist/$productId'),
      headers: _headers(token: token),
    );

    final data = jsonDecode(response.body);
    if (response.statusCode != 200 || data['success'] != true) {
      throw Exception(data['error']?['message'] ?? 'Heqja nga wishlist dështoi');
    }
  }

  static Future<bool> checkWishlist(String productId, String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/wishlist/check/$productId'),
        headers: _headers(token: token),
      );

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        return data['data']['in_wishlist'] == true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  static Future<int> getUnreadNotificationCount(String authToken) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/notifications/unread-count'),
        headers: _headers(token: authToken),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          return data['data']['unread_count'] ?? 0;
        }
      }
      return 0;
    } catch (e) {
      print('Error getting unread count: $e');
      return 0;
    }
  }
}
