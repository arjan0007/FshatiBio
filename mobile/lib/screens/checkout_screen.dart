import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../models/cart_summary.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../services/api_service.dart';
import 'address_management_screen.dart';
import 'order_detail_screen.dart';

const Color forestDark  = Color(0xFF1B4332);
const Color forestMid   = Color(0xFF2D6A4F);
const Color forestLight = Color(0xFF40916C);
const Color forestPale  = Color(0xFF52B788);
const Color forestGhost = Color(0xFFD8F3DC);
const Color honeyDark   = Color(0xFFE76F51);
const Color honeyMid    = Color(0xFFF4A261);
const Color creamBg     = Color(0xFFFEFAE0);
const Color earthLight  = Color(0xFFE8D5C4);
const Color textDark    = Color(0xFF1B2F1E);
const Color textMuted   = Color(0xFF6B7C73);

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
          orElse: () => addresses.isNotEmpty ? addresses.first : <String, dynamic>{},
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
            backgroundColor: forestMid,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
            backgroundColor: forestMid,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
      backgroundColor: creamBg,
      appBar: AppBar(
        title: Text(
          'Porosi e Re',
          style: GoogleFonts.playfairDisplay(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: forestMid,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Section 1: Address
              _buildSectionCard(
                number: '1',
                title: 'Adresa e Dorëzimit',
                icon: Icons.location_on_outlined,
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
                  icon: const Icon(Icons.add, size: 16, color: forestMid),
                  label: Text('Shto', style: GoogleFonts.nunito(color: forestMid, fontWeight: FontWeight.bold)),
                ),
                child: _loadingAddresses
                    ? const Center(child: Padding(
                        padding: EdgeInsets.all(16),
                        child: CircularProgressIndicator(color: forestMid),
                      ))
                    : _addresses.isEmpty
                        ? _buildEmptyAddressCard()
                        : Column(
                            children: _addresses.map((addr) => _buildAddressCard(addr)).toList(),
                          ),
              ),
              const SizedBox(height: 16),

              // Section 2: Coupon
              _buildSectionCard(
                number: '2',
                title: 'Kupon Zbritjeje',
                icon: Icons.local_offer_outlined,
                child: _buildCouponSection(),
              ),
              const SizedBox(height: 16),

              // Section 3: Delivery Date & Time
              _buildSectionCard(
                number: '3',
                title: 'Data & Ora e Dorëzimit',
                icon: Icons.calendar_today_outlined,
                child: _buildDeliverySection(),
              ),
              const SizedBox(height: 16),

              // Section 4: Notes
              _buildSectionCard(
                number: '4',
                title: 'Shënime',
                icon: Icons.note_outlined,
                child: TextFormField(
                  controller: _notesController,
                  decoration: InputDecoration(
                    hintText: 'Shënime për dorëzimin...',
                    hintStyle: GoogleFonts.nunito(color: textMuted, fontSize: 14),
                    filled: true,
                    fillColor: Colors.white,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: earthLight),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: earthLight),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(16),
                      borderSide: const BorderSide(color: forestMid, width: 2),
                    ),
                    contentPadding: const EdgeInsets.all(16),
                  ),
                  maxLines: 3,
                  style: GoogleFonts.nunito(color: textDark),
                ),
              ),

              if (_error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFFCA5A5)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: Color(0xFFDC2626), size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _error!,
                          style: GoogleFonts.nunito(color: const Color(0xFFDC2626), fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ],

              const SizedBox(height: 20),

              // Order Summary
              _buildSummarySection(),

              const SizedBox(height: 20),

              // Submit Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submitting || _selectedAddress == null ? null : _submit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: honeyMid,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: earthLight,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(50),
                    ),
                    elevation: 2,
                  ),
                  child: _submitting
                      ? Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text('Duke krijuar porosinë...',
                                style: GoogleFonts.nunito(fontWeight: FontWeight.bold, fontSize: 16)),
                          ],
                        )
                      : Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.eco_outlined, size: 20),
                            const SizedBox(width: 8),
                            Text('Porosit Tani',
                                style: GoogleFonts.nunito(fontWeight: FontWeight.bold, fontSize: 16)),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String number,
    required String title,
    required IconData icon,
    required Widget child,
    Widget? action,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: forestMid.withOpacity(0.08),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: const BoxDecoration(
                  color: forestMid,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    number,
                    style: GoogleFonts.nunito(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Icon(icon, color: forestMid, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: textDark,
                  ),
                ),
              ),
              if (action != null) action,
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }

  Widget _buildEmptyAddressCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: forestGhost,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Icon(Icons.location_off_outlined, size: 40, color: forestMid),
          const SizedBox(height: 12),
          Text(
            'Nuk keni adresa të ruajtura',
            style: GoogleFonts.nunito(fontWeight: FontWeight.w600, color: textDark),
          ),
          const SizedBox(height: 12),
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
            icon: const Icon(Icons.add, size: 18),
            label: Text('Shto Adresë të Re',
                style: GoogleFonts.nunito(fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: forestMid,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(50)),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressCard(Map<String, dynamic> address) {
    final isSelected = _selectedAddress?['id'] == address['id'];
    final isDefault = address['is_default'] == true;

    return GestureDetector(
      onTap: () => setState(() => _selectedAddress = address),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? forestGhost : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? forestMid : earthLight,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isSelected ? forestMid : earthLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                Icons.home_outlined,
                color: isSelected ? Colors.white : textMuted,
                size: 20,
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
                          style: GoogleFonts.nunito(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: isSelected ? forestDark : textDark,
                          ),
                        ),
                      ),
                      if (isDefault)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: forestMid,
                            borderRadius: BorderRadius.circular(50),
                          ),
                          child: Text(
                            'Default',
                            style: GoogleFonts.nunito(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${address['city'] ?? ''}${address['postal_code'] != null ? ', ${address['postal_code']}' : ''}',
                    style: GoogleFonts.nunito(color: textMuted, fontSize: 12),
                  ),
                ],
              ),
            ),
            Radio<Map<String, dynamic>>(
              value: address,
              groupValue: _selectedAddress,
              onChanged: (value) => setState(() => _selectedAddress = value),
              activeColor: forestMid,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCouponSection() {
    if (_appliedCoupon != null) {
      return Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: forestGhost,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: forestMid, width: 1),
        ),
        child: Row(
          children: [
            const Icon(Icons.check_circle, color: forestMid, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Kupon: ${_appliedCoupon!['coupon']?['code']}',
                    style: GoogleFonts.nunito(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: textDark,
                    ),
                  ),
                  Text(
                    'Zbritje: ${_discount.toStringAsFixed(2)} L',
                    style: GoogleFonts.nunito(color: forestMid, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.close, color: Color(0xFFDC2626)),
              onPressed: _removeCoupon,
            ),
          ],
        ),
      );
    }

    return Row(
      children: [
        Expanded(
          child: TextFormField(
            controller: _couponController,
            decoration: InputDecoration(
              hintText: 'Kodi i kuponit',
              hintStyle: GoogleFonts.nunito(color: textMuted, fontSize: 14),
              prefixIcon: const Icon(Icons.local_offer_outlined, color: forestMid),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: earthLight),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: earthLight),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: const BorderSide(color: forestMid, width: 2),
              ),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            ),
            textCapitalization: TextCapitalization.characters,
            onFieldSubmitted: (_) => _applyCoupon(),
            style: GoogleFonts.nunito(color: textDark),
          ),
        ),
        const SizedBox(width: 10),
        ElevatedButton(
          onPressed: _applyingCoupon ? null : _applyCoupon,
          style: ElevatedButton.styleFrom(
            backgroundColor: forestMid,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
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
              : Text('Apliko', style: GoogleFonts.nunito(fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }

  Widget _buildDeliverySection() {
    final timeSlots = ['10:00-14:00', '14:00-18:00', '18:00-22:00'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Date Picker
        GestureDetector(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: _selectedDate,
              firstDate: DateTime.now().add(const Duration(days: 1)),
              lastDate: DateTime.now().add(const Duration(days: 30)),
              builder: (context, child) {
                return Theme(
                  data: Theme.of(context).copyWith(
                    colorScheme: const ColorScheme.light(primary: forestMid),
                  ),
                  child: child!,
                );
              },
            );
            if (picked != null) setState(() => _selectedDate = picked);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: earthLight),
            ),
            child: Row(
              children: [
                const Icon(Icons.calendar_today_outlined, color: forestMid, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Data e Dorëzimit',
                          style: GoogleFonts.nunito(color: textMuted, fontSize: 12)),
                      Text(
                        '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                        style: GoogleFonts.nunito(
                          fontWeight: FontWeight.bold,
                          color: textDark,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: textMuted),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Text('Orari i Dorëzimit',
            style: GoogleFonts.nunito(color: textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: timeSlots.map((slot) {
            final isSelected = _timeSlot == slot;
            return GestureDetector(
              onTap: () => setState(() => _timeSlot = slot),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: isSelected ? forestMid : Colors.white,
                  borderRadius: BorderRadius.circular(50),
                  border: Border.all(
                    color: isSelected ? forestMid : earthLight,
                    width: isSelected ? 2 : 1,
                  ),
                ),
                child: Text(
                  slot,
                  style: GoogleFonts.nunito(
                    color: isSelected ? Colors.white : textDark,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildSummarySection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: forestGhost,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.receipt_long_outlined, color: forestMid, size: 20),
              const SizedBox(width: 8),
              Text(
                'Përmbledhja e Porosisë',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: textDark,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _summaryRow('Nëntotali', widget.cart.subtotal),
          _summaryRow('Dërgesa', widget.cart.deliveryFee),
          if (_discount > 0)
            _summaryRowColored('Zbritje', -_discount, const Color(0xFF16A34A)),
          Divider(color: forestPale, thickness: 1, height: 20),
          _summaryRow('Totali', _finalTotal, bold: true),
        ],
      ),
    );
  }

  Widget _summaryRow(String label, double value, {bool bold = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.nunito(
              fontSize: bold ? 16 : 14,
              color: bold ? textDark : textMuted,
              fontWeight: bold ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            '${value.toStringAsFixed(2)} L',
            style: bold
                ? GoogleFonts.playfairDisplay(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: forestMid)
                : GoogleFonts.nunito(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: textDark),
          ),
        ],
      ),
    );
  }

  Widget _summaryRowColored(String label, double value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Icon(Icons.local_offer_outlined, size: 14, color: color),
              const SizedBox(width: 6),
              Text(label, style: GoogleFonts.nunito(fontSize: 14, color: color, fontWeight: FontWeight.w600)),
            ],
          ),
          Text(
            '${value >= 0 ? '' : '-'}${value.abs().toStringAsFixed(2)} L',
            style: GoogleFonts.nunito(fontSize: 14, fontWeight: FontWeight.bold, color: color),
          ),
        ],
      ),
    );
  }
}
