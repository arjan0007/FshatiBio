class AppUser {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? phone;

  AppUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.phone,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      id: json['id'],
      email: json['email'],
      firstName: json['first_name'],
      lastName: json['last_name'],
      phone: json['phone'],
    );
  }

  String get fullName => '$firstName $lastName';
}

