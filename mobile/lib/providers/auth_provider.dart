import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/user.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  String? _token;
  AppUser? _user;
  bool _isLoading = true;

  String? get token => _token;
  AppUser? get user => _user;
  bool get isAuthenticated => _token != null;
  bool get isLoading => _isLoading;

  AuthProvider() {
    _loadSession();
  }

  Future<void> _loadSession() async {
    final prefs = await SharedPreferences.getInstance();
    final storedToken = prefs.getString('auth_token');
    if (storedToken != null) {
      _token = storedToken;
      try {
        _user = await ApiService.getProfile(_token!);
      } catch (_) {
        await logout();
      }
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    final data = await ApiService.login(email, password);
    _token = data['token'];
    _user = AppUser.fromJson(data['user']);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', _token!);

    notifyListeners();
    return true;
  }

  Future<bool> register(
    String email,
    String password,
    String firstName,
    String lastName,
    String phone,
  ) async {
    final data = await ApiService.register({
      'email': email,
      'password': password,
      'first_name': firstName,
      'last_name': lastName,
      'phone': phone,
    });
    _token = data['token'];
    _user = AppUser.fromJson(data['user']);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', _token!);

    notifyListeners();
    return true;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    _token = null;
    _user = null;
    notifyListeners();
  }

  Future<void> refreshProfile() async {
    if (_token != null) {
      try {
        _user = await ApiService.getProfile(_token!);
        notifyListeners();
      } catch (_) {
        // Ignore errors
      }
    }
  }
}
