import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/cart_summary.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import 'address_management_screen.dart';
import 'order_detail_screen.dart';

class CheckoutScreen extends StatefulWidget {
  final CartSummary cart;

  const CheckoutScreen({super.key, required this.cart});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _notesController = TextEditingController();
  final _couponController = TextEditingController();
  
  List<Map<String, dynamic>> _addresses = [];
  Map<String, dynamic>? _selectedAddress;
  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  String _timeSlot = '10:00-14:00';
  bool _submitting = false;
  bool _loadingAddresses = true;
  bool _applyingCoupon = false;
  String? _error;
  Map<String, dynamic>? _appliedCoupon;
  double _discount = 0.0;
  double _finalTotal = 0.0;

  @override
  void initState() {
    super.initState();
    _finalTotal = widget.cart.total;
    _loadAddresses();
  }

  @override
  void dispose() {
    _notesController.dispose();
    _couponController.dispose();
    super.dispose();
  }

  Future<void> _loadAddresses() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated || auth.token == null) return;

    setState(() => _loadingAddresses = true);
    try {
      final addresses = await ApiService.getAddresses(auth.token!);
      setState(() {
        _addresses = addresses;
        _selectedAddress = addresses.firstWhere(
          (addr) => addr['is_default'] == true,
          orElse: () => addresses.isNotEmpty ? addresses.first : null,
        );
        _loadingAddresses = false;
      });
    } catch (e) {
      setState(() {
        _loadingAddresses = false;
        _error = 'Gabim në ngarkimin e adresave: $e';
      });
    }
  }

  Future<void> _applyCoupon() async {
    if (_couponController.text.trim().isEmpty) {
      setState(() => _error = 'Ju lutem shkruani një kod kupon');
      return;
    }

    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated || auth.token == null) return;

    setState(() {
      _applyingCoupon = true;
      _error = null;
    });

    try {
      final result = await ApiService.applyCoupon(
        _couponController.text.trim().toUpperCase(),
        widget.cart.subtotal,
        auth.token!,
      );
      setState(() {
        _appliedCoupon = result;
        _discount = result['discount']?.toDouble() ?? 0.0;
        _finalTotal = widget.cart.total - _discount;
        _applyingCoupon = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 8),
                Text('Kupon u aplikua! Zbritje: ${_discount.toStringAsFixed(2)} L'),
              ],
            ),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
        _appliedCoupon = null;
        _discount = 0.0;
        _finalTotal = widget.cart.total;
        _applyingCoupon = false;
      });
    }
  }

  void _removeCoupon() {
    setState(() {
      _appliedCoupon = null;
      _discount = 0.0;
      _finalTotal = widget.cart.total;
      _couponController.clear();
    });
  }

  Future<void> _submit() async {
    if (_selectedAddress == null) {
      setState(() => _error = 'Ju lutem zgjidhni një adresë');
      return;
    }

    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated || auth.token == null) {
      setState(() => _error = 'Duhet të kyçeni');
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final orderId = await ApiService.createOrder(
        auth.token!,
        addressId: _selectedAddress!['id'],
        deliveryDate: _selectedDate.toIso8601String().split('T').first,
        timeSlot: _timeSlot,
        notes: _notesController.text.trim().isEmpty ? null : _notesController.text.trim(),
        couponId: _appliedCoupon?['coupon']?['id'],
      );

      if (mounted) {
        context.read<CartProvider>().refreshCart();
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (_) => OrderDetailScreen(orderId: orderId),
          ),
        );
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 8),
                Text('Porosia u krijua me sukses!'),
              ],
            ),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          ),
        );
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Checkout'),
        backgroundColor: const Color(0xFF16a34a),
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Address Selection Section
              _buildSectionHeader(
                'Adresa e Dorëzimit',
                Icons.location_on,
                action: TextButton.icon(
                  onPressed: () async {
                    final result = await Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => const AddressManagementScreen(),
                      ),
                    );
                    if (result == true) {
                      _loadAddresses();
                    }
                  },
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Shto'),
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF16a34a),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              if (_loadingAddresses)
                const Center(child: CircularProgressIndicator())
              else if (_addresses.isEmpty)
                _buildEmptyAddressCard()
              else
                ..._addresses.map((address) => _buildAddressCard(address)),

              const SizedBox(height: 24),

              // Coupon Section
              _buildSectionHeader('Kupon Zbritjeje', Icons.local_offer),
              const SizedBox(height: 12),
              _buildCouponSection(),

              const SizedBox(height: 24),

              // Delivery Section
              _buildSectionHeader('Dorëzimi', Icons.delivery_dining),
              const SizedBox(height: 12),
              _buildDeliverySection(),

              if (_error != null) ...[
                const SizedBox(height: 16),
                _buildErrorCard(_error!),
              ],

              const SizedBox(height: 24),

              // Summary Section
              _buildSummarySection(),

              const SizedBox(height: 24),

              // Submit Button
              _buildSubmitButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, {Widget? action}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Icon(icon, color: const Color(0xFF16a34a), size: 24),
            const SizedBox(width: 8),
            Text(
              title,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
        if (action != null) action,
      ],
    );
  }

  Widget _buildEmptyAddressCard() {
    return Card(
      color: Colors.orange.shade50,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            const Icon(Icons.location_off, size: 48, color: Colors.orange),
            const SizedBox(height: 12),
            const Text(
              'Nuk keni adresa të ruajtura',
              style: TextStyle(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            ElevatedButton.icon(
              onPressed: () async {
                final result = await Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => const AddressManagementScreen(),
                  ),
                );
                if (result == true) {
                  _loadAddresses();
                }
              },
              icon: const Icon(Icons.add),
              label: const Text('Shto Adresë të Re'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16a34a),
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddressCard(Map<String, dynamic> address) {
    final isSelected = _selectedAddress?['id'] == address['id'];
    final isDefault = address['is_default'] == true;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: isSelected ? 4 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: isSelected ? const Color(0xFF16a34a) : Colors.transparent,
          width: 2,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () {
          setState(() => _selectedAddress = address);
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFF16a34a).withOpacity(0.1)
                      : Colors.grey[200],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  Icons.home,
                  color: isSelected ? const Color(0xFF16a34a) : Colors.grey[600],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            address['street'] ?? '',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: isSelected ? const Color(0xFF16a34a) : null,
                            ),
                          ),
                        ),
                        if (isDefault)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.green,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              'DEFAULT',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${address['city'] ?? ''}${address['postal_code'] != null ? ', ${address['postal_code']}' : ''}',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              Radio<Map<String, dynamic>>(
                value: address,
                groupValue: _selectedAddress,
                onChanged: (value) {
                  setState(() => _selectedAddress = value);
                },
                activeColor: const Color(0xFF16a34a),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCouponSection() {
    if (_appliedCoupon != null) {
      return Card(
        color: Colors.green.shade50,
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.check_circle, color: Colors.green, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Kupon: ${_appliedCoupon!['coupon']?['code']}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Zbritje: ${_discount.toStringAsFixed(2)} L',
                      style: const TextStyle(
                        color: Colors.green,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: _removeCoupon,
                color: Colors.red,
              ),
            ],
          ),
        ),
      );
    }

    return Row(
      children: [
        Expanded(
          child: TextFormField(
            controller: _couponController,
            decoration: InputDecoration(
              labelText: 'Kodi i kuponit',
              hintText: 'Shkruani kodin',
              prefixIcon: const Icon(Icons.local_offer),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              filled: true,
              fillColor: Colors.grey[50],
            ),
            textCapitalization: TextCapitalization.characters,
            onFieldSubmitted: (_) => _applyCoupon(),
          ),
        ),
        const SizedBox(width: 8),
        ElevatedButton(
          onPressed: _applyingCoupon ? null : _applyCoupon,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF16a34a),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          child: _applyingCoupon
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : const Text('Apliko'),
        ),
      ],
    );
  }

  Widget _buildDeliverySection() {
    return Column(
      children: [
        // Date Picker
        Card(
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: ListTile(
            leading: const Icon(Icons.calendar_today, color: Color(0xFF16a34a)),
            title: const Text('Data e Dorëzimit'),
            subtitle: Text(
              '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
            trailing: const Icon(Icons.chevron_right),
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: _selectedDate,
                firstDate: DateTime.now().add(const Duration(days: 1)),
                lastDate: DateTime.now().add(const Duration(days: 30)),
                builder: (context, child) {
                  return Theme(
                    data: Theme.of(context).copyWith(
                      colorScheme: const ColorScheme.light(
                        primary: Color(0xFF16a34a),
                      ),
                    ),
                    child: child!,
                  );
                },
              );
              if (picked != null) {
                setState(() => _selectedDate = picked);
              }
            },
          ),
        ),
        const SizedBox(height: 12),
        // Time Slot
        Card(
          elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: DropdownButtonFormField<String>(
              initialValue: _timeSlot,
              decoration: const InputDecoration(
                border: InputBorder.none,
                labelText: 'Orari i Dorëzimit',
                prefixIcon: Icon(Icons.access_time, color: Color(0xFF16a34a)),
              ),
              items: const [
                DropdownMenuItem(
                  value: '10:00-14:00',
                  child: Row(
                    children: [
                      Icon(Icons.wb_sunny, size: 18),
                      SizedBox(width: 8),
                      Text('10:00 - 14:00'),
                    ],
                  ),
                ),
                DropdownMenuItem(
                  value: '14:00-18:00',
                  child: Row(
                    children: [
                      Icon(Icons.wb_twilight, size: 18),
                      SizedBox(width: 8),
                      Text('14:00 - 18:00'),
                    ],
                  ),
                ),
                DropdownMenuItem(
                  value: '18:00-22:00',
                  child: Row(
                    children: [
                      Icon(Icons.nightlight, size: 18),
                      SizedBox(width: 8),
                      Text('18:00 - 22:00'),
                    ],
                  ),
                ),
              ],
              onChanged: (value) => setState(() => _timeSlot = value!),
            ),
          ),
        ),
        const SizedBox(height: 12),
        // Notes
        TextFormField(
          controller: _notesController,
          decoration: InputDecoration(
            labelText: 'Shënime (opsionale)',
            hintText: 'Shënime për dorëzimin...',
            prefixIcon: const Icon(Icons.note),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            filled: true,
            fillColor: Colors.grey[50],
          ),
          maxLines: 3,
        ),
      ],
    );
  }

  Widget _buildErrorCard(String error) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.shade50,
        border: Border.all(color: Colors.red.shade300),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(Icons.error_outline, color: Colors.red.shade700),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              error,
              style: TextStyle(color: Colors.red.shade700),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummarySection() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.receipt, color: Color(0xFF16a34a)),
                const SizedBox(width: 8),
                const Text(
                  'Përmbledhje',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            _summaryRow('Nëntotali', widget.cart.subtotal),
            _summaryRow('Dërgesa', widget.cart.deliveryFee),
            if (_discount > 0)
              _summaryRow('Zbritje', -_discount, color: Colors.green, icon: Icons.local_offer),
            const Divider(height: 24),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF16a34a).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: _summaryRow('Totali', _finalTotal, bold: true),
            ),
          ],
        ),
      ),
    );
  }

  Widget _summaryRow(String label, double value, {bool bold = false, Color? color, IconData? icon}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18, color: color ?? Colors.grey[600]),
                const SizedBox(width: 8),
              ],
              Text(
                label,
                style: TextStyle(
                  fontWeight: bold ? FontWeight.bold : FontWeight.normal,
                  fontSize: bold ? 16 : 14,
                  color: color ?? Colors.grey[700],
                ),
              ),
            ],
          ),
          Text(
            '${value >= 0 ? '' : '-'}${value.abs().toStringAsFixed(2)} L',
            style: TextStyle(
              fontWeight: bold ? FontWeight.bold : FontWeight.w600,
              fontSize: bold ? 20 : 14,
              color: color ?? (bold ? const Color(0xFF16a34a) : Colors.black87),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubmitButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: _submitting || _selectedAddress == null ? null : _submit,
        icon: _submitting
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : const Icon(Icons.check_circle),
        label: Text(_submitting ? 'Duke krijuar porosinë...' : 'Konfirmo Porosinë'),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF16a34a),
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 2,
        ),
      ),
    );
  }
}
