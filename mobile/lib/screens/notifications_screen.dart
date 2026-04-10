import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
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

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  int _unreadCount = 0;
  String _filter = 'all'; // 'all' | 'unread'

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      if (token == null) {
        setState(() => _isLoading = false);
        return;
      }

      final response = await http.get(
        Uri.parse('${ApiService.baseUrl}/notifications'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true) {
          setState(() {
            _notifications = data['data']['notifications'];
            _isLoading = false;
          });
        }
      }

      final countResponse = await http.get(
        Uri.parse('${ApiService.baseUrl}/notifications/unread-count'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (countResponse.statusCode == 200) {
        final countData = jsonDecode(countResponse.body);
        if (countData['success'] == true) {
          setState(() {
            _unreadCount = countData['data']['unread_count'];
          });
        }
      }
    } catch (e) {
      print('Error loading notifications: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _markAsRead(String notificationId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      if (token == null) return;

      await http.put(
        Uri.parse('${ApiService.baseUrl}/notifications/$notificationId/read'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      _loadNotifications();
    } catch (e) {
      print('Error marking notification as read: $e');
    }
  }

  Future<void> _markAllAsRead() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');

      if (token == null) return;

      await http.put(
        Uri.parse('${ApiService.baseUrl}/notifications/read-all'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      _loadNotifications();
    } catch (e) {
      print('Error marking all as read: $e');
    }
  }

  Color _notifIconBg(String type) {
    switch (type) {
      case 'order_status':
        return forestGhost;
      case 'promotion':
        return honeyMid.withOpacity(0.15);
      default:
        return const Color(0xFFDBEAFE);
    }
  }

  Color _notifIconColor(String type) {
    switch (type) {
      case 'order_status':
        return forestMid;
      case 'promotion':
        return honeyDark;
      default:
        return const Color(0xFF1E40AF);
    }
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'order_status':
        return Icons.shopping_bag_outlined;
      case 'promotion':
        return Icons.local_offer_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  String _formatDate(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inDays == 0) {
        if (difference.inHours == 0) {
          return '${difference.inMinutes} min më parë';
        }
        return '${difference.inHours} orë më parë';
      } else if (difference.inDays == 1) {
        return 'Dje';
      } else if (difference.inDays < 7) {
        return '${difference.inDays} ditë më parë';
      } else {
        return '${date.day}/${date.month}/${date.year}';
      }
    } catch (e) {
      return dateString;
    }
  }

  List<dynamic> get _filteredNotifications {
    if (_filter == 'unread') {
      return _notifications.where((n) => n['is_read'] != true).toList();
    }
    return _notifications;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: creamBg,
      appBar: AppBar(
        title: Text(
          'Njoftimet',
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
        actions: [
          if (_unreadCount > 0)
            TextButton(
              onPressed: _markAllAsRead,
              child: Text(
                'Lexo të gjitha',
                style: GoogleFonts.nunito(
                    color: Colors.white70,
                    fontSize: 12,
                    fontWeight: FontWeight.bold),
              ),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: forestMid))
          : Column(
              children: [
                // Filter chips
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 14, 16, 8),
                  child: Row(
                    children: [
                      _filterChip('all', 'Të gjitha'),
                      const SizedBox(width: 10),
                      _filterChip('unread', 'Të palexuara',
                          badge: _unreadCount),
                    ],
                  ),
                ),
                Expanded(
                  child: _notifications.isEmpty
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(32),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text('🔔',
                                    style: TextStyle(fontSize: 64)),
                                const SizedBox(height: 20),
                                Text(
                                  'Nuk ka njoftime',
                                  style: GoogleFonts.playfairDisplay(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: textDark,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  'Njoftimet e tua do të shfaqen këtu',
                                  style: GoogleFonts.nunito(
                                      fontSize: 14, color: textMuted),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _loadNotifications,
                          color: forestMid,
                          child: _filteredNotifications.isEmpty
                              ? Center(
                                  child: Text(
                                    'Nuk ka njoftime të palexuara',
                                    style: GoogleFonts.nunito(
                                        color: textMuted),
                                  ),
                                )
                              : ListView.separated(
                                  padding: const EdgeInsets.fromLTRB(
                                      16, 8, 16, 32),
                                  itemCount:
                                      _filteredNotifications.length,
                                  separatorBuilder: (_, __) =>
                                      const SizedBox(height: 10),
                                  itemBuilder: (context, index) {
                                    final notification =
                                        _filteredNotifications[index];
                                    final isRead =
                                        notification['is_read'] == true;
                                    final type =
                                        notification['type'] ?? 'system';

                                    return Dismissible(
                                      key: Key(notification['id']),
                                      direction:
                                          DismissDirection.endToStart,
                                      background: Container(
                                        alignment:
                                            Alignment.centerRight,
                                        padding: const EdgeInsets.only(
                                            right: 20),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFDC2626)
                                              .withOpacity(0.1),
                                          borderRadius:
                                              BorderRadius.circular(
                                                  16),
                                        ),
                                        child: const Icon(
                                            Icons.delete_outline,
                                            color: Color(0xFFDC2626)),
                                      ),
                                      onDismissed: (direction) {
                                        if (!isRead) {
                                          _markAsRead(
                                              notification['id']);
                                        }
                                      },
                                      child: _buildNotifCard(
                                          notification, isRead, type),
                                    );
                                  },
                                ),
                        ),
                ),
              ],
            ),
    );
  }

  Widget _filterChip(String value, String label, {int badge = 0}) {
    final isSelected = _filter == value;
    return GestureDetector(
      onTap: () => setState(() => _filter = value),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? forestMid : Colors.white,
          borderRadius: BorderRadius.circular(50),
          border: Border.all(
            color: isSelected ? forestMid : earthLight,
            width: 1.5,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: GoogleFonts.nunito(
                color: isSelected ? Colors.white : textMuted,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
            if (badge > 0) ...[
              const SizedBox(width: 6),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: isSelected
                      ? Colors.white.withOpacity(0.3)
                      : const Color(0xFFDC2626),
                  borderRadius: BorderRadius.circular(50),
                ),
                child: Text(
                  '$badge',
                  style: TextStyle(
                    color: isSelected ? Colors.white : Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildNotifCard(
      Map<String, dynamic> notification, bool isRead, String type) {
    return GestureDetector(
      onTap: () {
        if (!isRead) {
          _markAsRead(notification['id']);
        }
        if (notification['link_url'] != null) {
          // Handle navigation based on link_url
        }
      },
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isRead ? Colors.white : forestGhost,
          borderRadius: BorderRadius.circular(16),
          border: isRead
              ? null
              : const Border(
                  left: BorderSide(color: forestMid, width: 3),
                ),
          boxShadow: [
            BoxShadow(
              color: forestMid.withOpacity(isRead ? 0.05 : 0.08),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: _notifIconBg(type),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                _getNotificationIcon(type),
                color: _notifIconColor(type),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notification['title'],
                    style: GoogleFonts.nunito(
                      fontWeight:
                          isRead ? FontWeight.w600 : FontWeight.bold,
                      fontSize: 14,
                      color: textDark,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    notification['message'],
                    style: GoogleFonts.nunito(
                        fontSize: 13, color: textMuted),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _formatDate(notification['created_at']),
                    style: GoogleFonts.nunito(
                        fontSize: 11, color: textMuted),
                  ),
                ],
              ),
            ),
            if (!isRead)
              Container(
                width: 8,
                height: 8,
                margin: const EdgeInsets.only(top: 4),
                decoration: const BoxDecoration(
                  color: forestMid,
                  shape: BoxShape.circle,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
