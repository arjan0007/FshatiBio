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

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscureOldPassword = true;
  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;
  bool _changing = false;
  String? _error;

  @override
  void dispose() {
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _changePassword() async {
    if (!_formKey.currentState!.validate()) return;

    if (_newPasswordController.text != _confirmPasswordController.text) {
      setState(() => _error = 'Fjalëkalimet e reja nuk përputhen');
      return;
    }

    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated || auth.token == null) return;

    setState(() {
      _changing = true;
      _error = null;
    });

    try {
      await ApiService.changePassword(
        _oldPasswordController.text,
        _newPasswordController.text,
        auth.token!,
      );

      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.check_circle, color: Colors.white),
                const SizedBox(width: 8),
                Text('Fjalëkalimi u ndryshua me sukses',
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
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _changing = false);
    }
  }

  // Compute password strength 0-3
  int _passwordStrength(String password) {
    if (password.isEmpty) return 0;
    int score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (RegExp(r'[0-9]').hasMatch(password) &&
        RegExp(r'[A-Z]').hasMatch(password)) score++;
    return score;
  }

  Color _strengthColor(int strength) {
    if (strength == 0) return earthLight;
    if (strength == 1) return const Color(0xFFDC2626);
    if (strength == 2) return honeyMid;
    return forestMid;
  }

  String _strengthLabel(int strength) {
    if (strength == 0) return '';
    if (strength == 1) return 'E dobët';
    if (strength == 2) return 'E mesme';
    return 'E fortë';
  }

  @override
  Widget build(BuildContext context) {
    final newPassword = _newPasswordController.text;
    final strength = _passwordStrength(newPassword);

    return Scaffold(
      backgroundColor: creamBg,
      appBar: AppBar(
        title: Text(
          'Ndrysho Fjalëkalimin',
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
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 8),

              // Lock icon header
              Center(
                child: Container(
                  padding: const EdgeInsets.all(24),
                  decoration: const BoxDecoration(
                    color: forestGhost,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.lock_outline,
                      size: 48, color: forestMid),
                ),
              ),
              const SizedBox(height: 28),

              // Old password
              _buildPasswordField(
                controller: _oldPasswordController,
                label: 'Fjalëkalimi Aktual',
                hint: 'Shkruani fjalëkalimin aktual',
                obscure: _obscureOldPassword,
                onToggle: () =>
                    setState(() => _obscureOldPassword = !_obscureOldPassword),
                validator: (v) => v == null || v.isEmpty
                    ? 'Ju lutem shkruani fjalëkalimin aktual'
                    : null,
              ),
              const SizedBox(height: 16),

              // New password
              _buildPasswordField(
                controller: _newPasswordController,
                label: 'Fjalëkalimi i Ri',
                hint: 'Minimumi 6 karaktere',
                obscure: _obscureNewPassword,
                onToggle: () =>
                    setState(() => _obscureNewPassword = !_obscureNewPassword),
                validator: (v) {
                  if (v == null || v.isEmpty) {
                    return 'Ju lutem shkruani fjalëkalimin e ri';
                  }
                  if (v.length < 6) {
                    return 'Fjalëkalimi duhet të jetë së paku 6 karaktere';
                  }
                  return null;
                },
                onChanged: (_) => setState(() {}),
              ),

              // Password strength bar
              if (newPassword.isNotEmpty) ...[
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: strength / 3,
                          backgroundColor: earthLight,
                          valueColor: AlwaysStoppedAnimation<Color>(
                              _strengthColor(strength)),
                          minHeight: 6,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Text(
                      _strengthLabel(strength),
                      style: GoogleFonts.nunito(
                        color: _strengthColor(strength),
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 16),

              // Confirm password
              _buildPasswordField(
                controller: _confirmPasswordController,
                label: 'Konfirmo Fjalëkalimin e Ri',
                hint: 'Rishkruani fjalëkalimin e ri',
                obscure: _obscureConfirmPassword,
                onToggle: () => setState(() =>
                    _obscureConfirmPassword = !_obscureConfirmPassword),
                validator: (v) {
                  if (v == null || v.isEmpty) {
                    return 'Ju lutem konfirmoni fjalëkalimin';
                  }
                  if (v != _newPasswordController.text) {
                    return 'Fjalëkalimet nuk përputhen';
                  }
                  return null;
                },
              ),

              // Error
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
                      const Icon(Icons.error_outline,
                          color: Color(0xFFDC2626), size: 20),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _error!,
                          style: GoogleFonts.nunito(
                              color: const Color(0xFFDC2626), fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 28),

              // Save button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _changing ? null : _changePassword,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: forestMid,
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: earthLight,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(50)),
                    elevation: 2,
                  ),
                  child: _changing
                      ? Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                    Colors.white),
                              ),
                            ),
                            const SizedBox(width: 10),
                            Text('Duke ndryshuar...',
                                style: GoogleFonts.nunito(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 15)),
                          ],
                        )
                      : Text('Ndrysho Fjalëkalimin',
                          style: GoogleFonts.nunito(
                              fontWeight: FontWeight.bold, fontSize: 15)),
                ),
              ),
              const SizedBox(height: 20),

              // Security tips
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: forestGhost,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.shield_outlined,
                            color: forestMid, size: 18),
                        const SizedBox(width: 8),
                        Text(
                          'Këshilla Sigurie',
                          style: GoogleFonts.nunito(
                            fontWeight: FontWeight.bold,
                            color: forestDark,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Përdorni minimumi 6 karaktere, kombinoni shkronja të mëdha dhe numra për fjalëkalim të fortë.',
                      style: GoogleFonts.nunito(
                          color: forestDark, fontSize: 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPasswordField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required bool obscure,
    required VoidCallback onToggle,
    String? Function(String?)? validator,
    void Function(String)? onChanged,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: obscure,
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: GoogleFonts.nunito(color: textMuted, fontSize: 13),
        hintText: hint,
        hintStyle: GoogleFonts.nunito(
            color: textMuted.withOpacity(0.6), fontSize: 13),
        prefixIcon: const Icon(Icons.lock_outline, color: forestMid, size: 20),
        suffixIcon: IconButton(
          icon: Icon(
            obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined,
            color: textMuted,
            size: 20,
          ),
          onPressed: onToggle,
        ),
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
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: const BorderSide(color: Color(0xFFDC2626)),
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      style: GoogleFonts.nunito(color: textDark),
      validator: validator,
    );
  }
}
