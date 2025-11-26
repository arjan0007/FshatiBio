import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/api_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _isLoading = true;
  int _unreadCount = 0;

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

      // Fetch notifications
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

      // Fetch unread count
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Njoftimet'),
        actions: [
          if (_unreadCount > 0)
            TextButton(
              onPressed: _markAllAsRead,
              child: const Text('Shëno të gjitha si të lexuara'),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _notifications.isEmpty
              ? const Center(
                  child: Text('Nuk ka njoftime'),
                )
              : RefreshIndicator(
                  onRefresh: _loadNotifications,
                  child: ListView.builder(
                    itemCount: _notifications.length,
                    itemBuilder: (context, index) {
                      final notification = _notifications[index];
                      final isRead = notification['is_read'] == true;
                      
                      return Dismissible(
                        key: Key(notification['id']),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.only(right: 20),
                          color: Colors.red,
                          child: const Icon(Icons.delete, color: Colors.white),
                        ),
                        onDismissed: (direction) {
                          if (!isRead) {
                            _markAsRead(notification['id']);
                          }
                        },
                        child: Card(
                          color: isRead ? null : Colors.blue.shade50,
                          child: ListTile(
                            leading: Icon(
                              _getNotificationIcon(notification['type']),
                              color: isRead ? Colors.grey : Colors.blue,
                            ),
                            title: Text(
                              notification['title'],
                              style: TextStyle(
                                fontWeight: isRead ? FontWeight.normal : FontWeight.bold,
                              ),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const SizedBox(height: 4),
                                Text(notification['message']),
                                const SizedBox(height: 4),
                                Text(
                                  _formatDate(notification['created_at']),
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Colors.grey.shade600,
                                  ),
                                ),
                              ],
                            ),
                            trailing: isRead
                                ? null
                                : const Icon(Icons.circle, size: 8, color: Colors.blue),
                            onTap: () {
                              if (!isRead) {
                                _markAsRead(notification['id']);
                              }
                              // Navigate to link_url if available
                              if (notification['link_url'] != null) {
                                // Handle navigation based on link_url
                              }
                            },
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'order_status':
        return Icons.shopping_bag;
      case 'promotion':
        return Icons.local_offer;
      default:
        return Icons.notifications;
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
}

