import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../models/order.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import 'login_screen.dart';
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

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  bool _isLoading = true;
  List<OrderSummary> _orders = [];
  String? _error;
  String _filterStatus = 'all';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadOrders();
    });
  }

  Future<void> _loadOrders() async {
    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated || auth.token == null) {
      setState(() {
        _error = 'Duhet të kyçeni';
        _isLoading = false;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final orders = await ApiService.getOrders(auth.token!);
      setState(() {
        _orders = orders;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Color _statusBorderColor(String status) {
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

  Widget _statusChip(String status) {
    final map = {
      'pending':     [const Color(0xFFFEF3C7), const Color(0xFF92400E), 'Në Pritje'],
      'confirmed':   [const Color(0xFFDBEAFE), const Color(0xFF1E40AF), 'E Konfirmuar'],
      'preparing':   [const Color(0xFFFFEDD5), const Color(0xFF9A3412), 'Duke Përgatitur'],
      'on_delivery': [const Color(0xFFF3E8FF), const Color(0xFF6B21A8), 'Në Dërgesë'],
      'delivered':   [const Color(0xFFD8F3DC), const Color(0xFF1B4332), 'Dorëzuar'],
      'cancelled':   [const Color(0xFFFEE2E2), const Color(0xFF991B1B), 'E Anuluar'],
    };
    final colors = map[status] ?? [const Color(0xFFF3F4F6), const Color(0xFF374151), status];
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: colors[0] as Color,
        borderRadius: BorderRadius.circular(50),
      ),
      child: Text(
        colors[2] as String,
        style: TextStyle(
          color: colors[1] as Color,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  List<OrderSummary> get _filteredOrders {
    if (_filterStatus == 'all') return _orders;
    return _orders.where((o) => o.status == _filterStatus).toList();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (auth.isLoading) {
      return const Scaffold(
        backgroundColor: creamBg,
        body: Center(child: CircularProgressIndicator(color: forestMid)),
      );
    }

    if (!auth.isAuthenticated) {
      return Scaffold(
        backgroundColor: creamBg,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('📦', style: TextStyle(fontSize: 64)),
                const SizedBox(height: 20),
                Text(
                  'Kyçu për historikun',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: textDark,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Shiko historikun e porosive të tua',
                  style: GoogleFonts.nunito(fontSize: 14, color: textMuted),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 28),
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: forestMid,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(50)),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 32, vertical: 16),
                  ),
                  child: Text('Kyçu',
                      style: GoogleFonts.nunito(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_isLoading) {
      return const Scaffold(
        backgroundColor: creamBg,
        body: Center(child: CircularProgressIndicator(color: forestMid)),
      );
    }

    if (_error != null) {
      return Scaffold(
        backgroundColor: creamBg,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.error_outline, size: 56, color: Color(0xFFDC2626)),
                const SizedBox(height: 16),
                Text(_error!,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.nunito(color: textMuted)),
                const SizedBox(height: 20),
                ElevatedButton(
                  onPressed: _loadOrders,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: forestMid,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(50)),
                  ),
                  child: Text('Provo përsëri',
                      style: GoogleFonts.nunito(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_orders.isEmpty) {
      return Scaffold(
        backgroundColor: creamBg,
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('🛍️', style: TextStyle(fontSize: 72)),
                const SizedBox(height: 20),
                Text(
                  'Nuk keni porosi ende',
                  style: GoogleFonts.playfairDisplay(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: textDark,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  'Bëni porosinë tuaj të parë dhe shihni historikun këtu',
                  style: GoogleFonts.nunito(fontSize: 14, color: textMuted),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    final filtered = _filteredOrders;

    return Scaffold(
      backgroundColor: creamBg,
      body: RefreshIndicator(
        onRefresh: _loadOrders,
        color: forestMid,
        child: CustomScrollView(
          slivers: [
            // Filter chips row
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _filterChip('all', 'Të gjitha'),
                      const SizedBox(width: 8),
                      _filterChip('pending', 'Në Pritje'),
                      const SizedBox(width: 8),
                      _filterChip('delivered', 'Dorëzuar'),
                      const SizedBox(width: 8),
                      _filterChip('cancelled', 'Anuluar'),
                    ],
                  ),
                ),
              ),
            ),
            if (filtered.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Text(
                    'Nuk ka porosi me këtë status',
                    style: GoogleFonts.nunito(color: textMuted),
                  ),
                ),
              )
            else
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final order = filtered[index];
                      return _buildOrderCard(order);
                    },
                    childCount: filtered.length,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _filterChip(String status, String label) {
    final isSelected = _filterStatus == status;
    return GestureDetector(
      onTap: () => setState(() => _filterStatus = status),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? forestMid : Colors.white,
          borderRadius: BorderRadius.circular(50),
          border: Border.all(
            color: isSelected ? forestMid : earthLight,
            width: 1.5,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: forestMid.withOpacity(0.2),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  )
                ]
              : [],
        ),
        child: Text(
          label,
          style: GoogleFonts.nunito(
            color: isSelected ? Colors.white : textMuted,
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  Widget _buildOrderCard(OrderSummary order) {
    final borderColor = _statusBorderColor(order.status);
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => OrderDetailScreen(orderId: order.id),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border(
            left: BorderSide(color: borderColor, width: 4),
          ),
          boxShadow: [
            BoxShadow(
              color: forestMid.withOpacity(0.08),
              blurRadius: 20,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(
                      'Porosia #${order.orderNumber}',
                      style: GoogleFonts.playfairDisplay(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: textDark,
                      ),
                    ),
                  ),
                  _statusChip(order.status),
                ],
              ),
              const SizedBox(height: 10),
              Divider(color: earthLight, thickness: 1, height: 1),
              const SizedBox(height: 10),
              Row(
                children: [
                  Icon(Icons.calendar_today_outlined,
                      size: 14, color: textMuted),
                  const SizedBox(width: 6),
                  Text(
                    '${order.deliveryDate.day}/${order.deliveryDate.month}/${order.deliveryDate.year}',
                    style: GoogleFonts.nunito(color: textMuted, fontSize: 12),
                  ),
                  const Spacer(),
                  Text(
                    '${order.total.toStringAsFixed(2)} L',
                    style: GoogleFonts.playfairDisplay(
                      fontWeight: FontWeight.bold,
                      fontSize: 17,
                      color: forestMid,
                    ),
                  ),
                  const SizedBox(width: 6),
                  const Icon(Icons.chevron_right, color: textMuted, size: 20),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
