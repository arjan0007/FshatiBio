import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../services/api_service.dart';

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

class OrderDetailScreen extends StatefulWidget {
  final String orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  Map<String, dynamic>? _order;
  bool _loading = true;
  bool _cancelling = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadOrderDetails();
  }

  Future<void> _loadOrderDetails() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated || auth.token == null) return;

    setState(() => _loading = true);
    try {
      final order = await ApiService.getOrderDetails(widget.orderId, auth.token!);
      setState(() {
        _order = order;
        _loading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
      });
    }
  }

  Future<void> _cancelOrder() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFEE2E2),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.warning_amber_rounded,
                  color: Color(0xFFDC2626), size: 24),
            ),
            const SizedBox(width: 12),
            Text('Anulo Porosi',
                style: GoogleFonts.playfairDisplay(
                    fontWeight: FontWeight.bold, color: textDark)),
          ],
        ),
        content: Text(
          'Jeni të sigurt që dëshironi të anuloni këtë porosi? Kjo veprim nuk mund të zhbëhet.',
          style: GoogleFonts.nunito(color: textMuted),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: Text('Jo',
                style: GoogleFonts.nunito(
                    color: textMuted, fontWeight: FontWeight.bold)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFDC2626),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(50)),
            ),
            child: Text('Anulo Porosinë',
                style: GoogleFonts.nunito(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated || auth.token == null) return;

    setState(() => _cancelling = true);
    try {
      await ApiService.cancelOrder(widget.orderId, auth.token!);
      _loadOrderDetails();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 8),
                Text('Porosia u anulua me sukses',
                    style: GoogleFonts.nunito(color: Colors.white)),
              ],
            ),
            backgroundColor: forestMid,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error, color: Colors.white),
                const SizedBox(width: 8),
                Expanded(
                    child: Text('Gabim: $e',
                        style: GoogleFonts.nunito(color: Colors.white))),
              ],
            ),
            backgroundColor: const Color(0xFFDC2626),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _cancelling = false);
    }
  }

  String _formatDateTime(String dateTimeString) {
    try {
      final dateTime = DateTime.parse(dateTimeString).toLocal();
      return '${dateTime.day}/${dateTime.month}/${dateTime.year}, ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return dateTimeString;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'pending':
        return const Color(0xFFF59E0B);
      case 'confirmed':
        return const Color(0xFF3B82F6);
      case 'preparing':
        return const Color(0xFFF97316);
      case 'on_delivery':
        return const Color(0xFF8B5CF6);
      case 'delivered':
        return forestMid;
      case 'cancelled':
        return const Color(0xFFDC2626);
      default:
        return textMuted;
    }
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'pending':
        return Icons.pending_outlined;
      case 'confirmed':
        return Icons.check_circle_outline;
      case 'preparing':
        return Icons.restaurant_outlined;
      case 'on_delivery':
        return Icons.local_shipping_outlined;
      case 'delivered':
        return Icons.check_circle;
      case 'cancelled':
        return Icons.cancel_outlined;
      default:
        return Icons.info_outline;
    }
  }

  String _statusText(String status) {
    switch (status) {
      case 'pending':
        return 'Në Pritje';
      case 'confirmed':
        return 'E Konfirmuar';
      case 'preparing':
        return 'Duke Përgatitur';
      case 'on_delivery':
        return 'Në Dërgesë';
      case 'delivered':
        return 'Dorëzuar';
      case 'cancelled':
        return 'E Anuluar';
      default:
        return status;
    }
  }

  Widget _statusChip(String status, String label) {
    final map = {
      'pending':     [const Color(0xFFFEF3C7), const Color(0xFF92400E)],
      'confirmed':   [const Color(0xFFDBEAFE), const Color(0xFF1E40AF)],
      'preparing':   [const Color(0xFFFFEDD5), const Color(0xFF9A3412)],
      'on_delivery': [const Color(0xFFF3E8FF), const Color(0xFF6B21A8)],
      'delivered':   [const Color(0xFFD8F3DC), const Color(0xFF1B4332)],
      'cancelled':   [const Color(0xFFFEE2E2), const Color(0xFF991B1B)],
    };
    final colors = map[status] ?? [const Color(0xFFF3F4F6), const Color(0xFF374151)];
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
          color: colors[0],
          borderRadius: BorderRadius.circular(50)),
      child: Text(label,
          style: TextStyle(
              color: colors[1], fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: creamBg,
      appBar: AppBar(
        title: Text(
          'Porosia #${_order?['order_number'] ?? ''}',
          style: GoogleFonts.playfairDisplay(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: forestMid,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: forestMid))
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline,
                            size: 56, color: Color(0xFFDC2626)),
                        const SizedBox(height: 16),
                        Text(_error!,
                            textAlign: TextAlign.center,
                            style: GoogleFonts.nunito(color: textMuted)),
                        const SizedBox(height: 24),
                        ElevatedButton.icon(
                          onPressed: _loadOrderDetails,
                          icon: const Icon(Icons.refresh),
                          label: Text('Provo përsëri',
                              style: GoogleFonts.nunito(
                                  fontWeight: FontWeight.bold)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: forestMid,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(50)),
                          ),
                        ),
                      ],
                    ),
                  ),
                )
              : _order == null
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.inbox_outlined,
                              size: 56, color: textMuted),
                          const SizedBox(height: 16),
                          Text('Porosia nuk u gjet',
                              style: GoogleFonts.nunito(color: textMuted)),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadOrderDetails,
                      color: forestMid,
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildStatusCard(),
                            const SizedBox(height: 16),
                            _buildOrderInfoCard(),
                            const SizedBox(height: 16),
                            _buildProductsSection(),
                            const SizedBox(height: 16),
                            _buildAddressSection(),
                            const SizedBox(height: 16),
                            _buildSummarySection(),
                            if (_order!['notes'] != null &&
                                _order!['notes'].toString().isNotEmpty) ...[
                              const SizedBox(height: 16),
                              _buildNotesSection(),
                            ],
                            if (_order!['status'] == 'pending' ||
                                _order!['status'] == 'confirmed') ...[
                              const SizedBox(height: 20),
                              _buildCancelButton(),
                            ],
                            const SizedBox(height: 32),
                          ],
                        ),
                      ),
                    ),
    );
  }

  Widget _buildStatusCard() {
    final status = _order!['status'];
    final statusColor = _statusColor(status);

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
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(_statusIcon(status), color: statusColor, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Statusi i Porosisë',
                  style: GoogleFonts.nunito(
                      fontSize: 12, color: textMuted, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 4),
                Text(
                  _statusText(status),
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: statusColor,
                  ),
                ),
                if (_order!['created_at'] != null) ...[
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.access_time_outlined,
                          size: 13, color: textMuted),
                      const SizedBox(width: 4),
                      Text(
                        _formatDateTime(_order!['created_at']),
                        style:
                            GoogleFonts.nunito(fontSize: 12, color: textMuted),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
          _statusChip(status, _statusText(status)),
        ],
      ),
    );
  }

  Widget _buildOrderInfoCard() {
    return _warmCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionLabel('Informacione të Porosisë'),
          const SizedBox(height: 14),
          _infoRow('Numri i Porosisë', '#${_order!['order_number']}'),
          if (_order!['payment_method'] != null)
            _infoRow('Metoda e Pagesës',
                _order!['payment_method'] == 'cod' ? 'Cash on Delivery' : 'Online'),
          if (_order!['delivery_date'] != null)
            _infoRow('Data e Dorëzimit', _order!['delivery_date']),
          if (_order!['delivery_time_slot'] != null)
            _infoRow('Orari i Dorëzimit', _order!['delivery_time_slot']),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: GoogleFonts.nunito(color: textMuted, fontSize: 13)),
          Text(value,
              style: GoogleFonts.nunito(
                  fontWeight: FontWeight.w600, fontSize: 13, color: textDark)),
        ],
      ),
    );
  }

  Widget _buildProductsSection() {
    final items = (_order!['items'] as List?) ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            _sectionLabel('Produktet'),
            const Spacer(),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: forestGhost,
                borderRadius: BorderRadius.circular(50),
              ),
              child: Text(
                '${items.length} produkte',
                style: GoogleFonts.nunito(
                    color: forestMid,
                    fontWeight: FontWeight.bold,
                    fontSize: 12),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...items.map((item) => _buildItemCard(item)),
      ],
    );
  }

  Widget _buildItemCard(Map<String, dynamic> item) {
    final product = item['product'] ?? {};
    final imageUrls = product['image_urls'] as List?;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: forestMid.withOpacity(0.06),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: imageUrls?.isNotEmpty == true
                ? Image.network(
                    imageUrls![0],
                    width: 62,
                    height: 62,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => _imagePlaceholder(),
                  )
                : _imagePlaceholder(),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product['name'] ?? 'Produkt',
                  style: GoogleFonts.nunito(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: textDark),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  '${item['quantity']} x ${item['unit_price']} L / ${product['unit'] ?? ''}',
                  style: GoogleFonts.nunito(color: textMuted, fontSize: 12),
                ),
              ],
            ),
          ),
          Text(
            '${item['total_price']} L',
            style: GoogleFonts.playfairDisplay(
              fontWeight: FontWeight.bold,
              fontSize: 15,
              color: forestMid,
            ),
          ),
        ],
      ),
    );
  }

  Widget _imagePlaceholder() {
    return Container(
      width: 62,
      height: 62,
      decoration: BoxDecoration(
          color: forestGhost, borderRadius: BorderRadius.circular(10)),
      child: const Icon(Icons.eco_outlined, color: forestMid, size: 28),
    );
  }

  Widget _buildAddressSection() {
    return _warmCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionLabel('Adresa e Dorëzimit'),
          const SizedBox(height: 14),
          if (_order!['address'] != null) ...[
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: forestGhost,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.home_outlined,
                      size: 18, color: forestMid),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _order!['address']['street'] ?? '',
                        style: GoogleFonts.nunito(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                            color: textDark),
                      ),
                      Text(
                        '${_order!['address']['city'] ?? ''}${_order!['address']['postal_code'] != null ? ', ${_order!['address']['postal_code']}' : ''}',
                        style:
                            GoogleFonts.nunito(color: textMuted, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ],
          if (_order!['delivery_date'] != null ||
              _order!['delivery_time_slot'] != null) ...[
            const SizedBox(height: 12),
            Divider(color: earthLight, thickness: 1, height: 1),
            const SizedBox(height: 12),
            if (_order!['delivery_date'] != null)
              _infoRow('Data', _order!['delivery_date']),
            if (_order!['delivery_time_slot'] != null)
              _infoRow('Orari', _order!['delivery_time_slot']),
          ],
        ],
      ),
    );
  }

  Widget _buildSummarySection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: forestGhost,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionLabel('Përmbledhja Financiare'),
          const SizedBox(height: 14),
          _summaryRow('Nëntotali', _order!['subtotal']?.toDouble() ?? 0.0),
          _summaryRow('Dërgesa', _order!['delivery_fee']?.toDouble() ?? 0.0),
          if ((_order!['discount_amount']?.toDouble() ?? 0.0) > 0)
            _summaryRowColored(
                'Zbritje', -(_order!['discount_amount']?.toDouble() ?? 0.0)),
          Divider(color: forestPale, thickness: 1, height: 20),
          _summaryRow('Totali', _order!['total']?.toDouble() ?? 0.0, bold: true),
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
                    fontSize: 20, fontWeight: FontWeight.bold, color: forestMid)
                : GoogleFonts.nunito(
                    fontSize: 14, fontWeight: FontWeight.w600, color: textDark),
          ),
        ],
      ),
    );
  }

  Widget _summaryRowColored(String label, double value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              const Icon(Icons.local_offer_outlined,
                  size: 14, color: forestLight),
              const SizedBox(width: 6),
              Text(label,
                  style: GoogleFonts.nunito(
                      fontSize: 14,
                      color: forestLight,
                      fontWeight: FontWeight.w600)),
            ],
          ),
          Text(
            '${value >= 0 ? '' : '-'}${value.abs().toStringAsFixed(2)} L',
            style: GoogleFonts.nunito(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: forestLight),
          ),
        ],
      ),
    );
  }

  Widget _buildNotesSection() {
    return _warmCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionLabel('Shënime'),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: creamBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: earthLight),
            ),
            child: Text(
              _order!['notes'],
              style: GoogleFonts.nunito(color: textDark, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCancelButton() {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        onPressed: _cancelling ? null : _cancelOrder,
        icon: _cancelling
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor:
                      AlwaysStoppedAnimation<Color>(Color(0xFFDC2626)),
                ),
              )
            : const Icon(Icons.cancel_outlined),
        label: Text(_cancelling ? 'Duke anuluar...' : 'Anulo Porosinë',
            style: GoogleFonts.nunito(fontWeight: FontWeight.bold, fontSize: 15)),
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFFDC2626),
          side: const BorderSide(color: Color(0xFFDC2626), width: 1.5),
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(50)),
        ),
      ),
    );
  }

  Widget _warmCard({required Widget child}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
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
      child: child,
    );
  }

  Widget _sectionLabel(String text) {
    return Text(
      text,
      style: GoogleFonts.playfairDisplay(
          fontSize: 16, fontWeight: FontWeight.bold, color: textDark),
    );
  }
}
