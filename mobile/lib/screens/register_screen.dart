import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';

// Design system colors
const Color forestDark = Color(0xFF1B4332);
const Color forestMid = Color(0xFF2D6A4F);
const Color forestLight = Color(0xFF40916C);
const Color forestPale = Color(0xFF52B788);
const Color forestGhost = Color(0xFFD8F3DC);
const Color honeyDark = Color(0xFFE76F51);
const Color honeyMid = Color(0xFFF4A261);
const Color creamBg = Color(0xFFFEFAE0);
const Color earthLight = Color(0xFFE8D5C4);
const Color textDark = Color(0xFF1B2F1E);
const Color textMuted = Color(0xFF6B7C73);

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isLoading = false;
  String? _error;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() => _error = 'Fjalëkalimet nuk përputhen');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    final auth = context.read<AuthProvider>();
    final cart = context.read<CartProvider>();

    try {
      await auth.register(
        _emailController.text.trim(),
        _passwordController.text.trim(),
        _firstNameController.text.trim(),
        _lastNameController.text.trim(),
        _phoneController.text.trim(),
      );
      cart.updateAuthToken(auth.token);
      if (mounted) {
        Navigator.of(context).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: forestMid,
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
            behavior: SnackBarBehavior.floating,
            content: Text(
              'Regjistrimi u krye me sukses!',
              style: GoogleFonts.nunito(color: Colors.white),
            ),
          ),
        );
      }
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  InputDecoration _fieldDecoration({
    required String label,
    required IconData prefixIcon,
    Widget? suffix,
  }) {
    return InputDecoration(
      labelText: label,
      labelStyle: GoogleFonts.nunito(color: textMuted),
      prefixIcon: Icon(prefixIcon, color: forestMid),
      suffixIcon: suffix,
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
        borderSide: const BorderSide(color: honeyDark),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: honeyDark, width: 2),
      ),
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: creamBg,
      body: CustomScrollView(
        slivers: [
          // ── Hero SliverAppBar ──────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 180,
            pinned: true,
            backgroundColor: forestMid,
            foregroundColor: Colors.white,
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.18),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back_ios_new,
                    color: Colors.white, size: 16),
              ),
              onPressed: () => Navigator.of(context).pop(),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [forestDark, forestMid, forestLight],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 32),
                      Container(
                        width: 56,
                        height: 56,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.16),
                          shape: BoxShape.circle,
                          border: Border.all(
                              color: Colors.white.withOpacity(0.30), width: 2),
                        ),
                        child: const Center(
                          child: Text('🌱', style: TextStyle(fontSize: 26)),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Krijo Llogari',
                        style: GoogleFonts.playfairDisplay(
                          color: Colors.white,
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Bashkohu me komunitetin BIO',
                        style: GoogleFonts.nunito(
                          color: Colors.white.withOpacity(0.82),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              title: Text(
                'Regjistrohu',
                style: GoogleFonts.playfairDisplay(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                ),
              ),
              centerTitle: true,
            ),
          ),

          // ── Form body ─────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              decoration: const BoxDecoration(
                color: creamBg,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(32),
                  topRight: Radius.circular(32),
                ),
              ),
              padding: const EdgeInsets.fromLTRB(24, 28, 24, 40),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // ── Personal details section ───────────────────────
                    _SectionLabel(label: 'Të dhënat personale'),
                    const SizedBox(height: 14),

                    // First name
                    TextFormField(
                      controller: _firstNameController,
                      decoration: _fieldDecoration(
                        label: 'Emri',
                        prefixIcon: Icons.person_outline,
                      ),
                      textCapitalization: TextCapitalization.words,
                      style: GoogleFonts.nunito(color: textDark),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Ju lutem shkruani emrin';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),

                    // Last name
                    TextFormField(
                      controller: _lastNameController,
                      decoration: _fieldDecoration(
                        label: 'Mbiemri',
                        prefixIcon: Icons.badge_outlined,
                      ),
                      textCapitalization: TextCapitalization.words,
                      style: GoogleFonts.nunito(color: textDark),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Ju lutem shkruani mbiemrin';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),

                    // Phone
                    TextFormField(
                      controller: _phoneController,
                      decoration: _fieldDecoration(
                        label: 'Telefon',
                        prefixIcon: Icons.phone_outlined,
                      ),
                      keyboardType: TextInputType.phone,
                      style: GoogleFonts.nunito(color: textDark),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Ju lutem shkruani telefonin';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),

                    // ── Account section divider ────────────────────────
                    Row(
                      children: [
                        const Expanded(
                            child: Divider(color: earthLight, thickness: 1)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text(
                            'Llogaria',
                            style: GoogleFonts.playfairDisplay(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: textDark,
                            ),
                          ),
                        ),
                        const Expanded(
                            child: Divider(color: earthLight, thickness: 1)),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Email
                    TextFormField(
                      controller: _emailController,
                      decoration: _fieldDecoration(
                        label: 'Email',
                        prefixIcon: Icons.email_outlined,
                      ),
                      keyboardType: TextInputType.emailAddress,
                      autocorrect: false,
                      style: GoogleFonts.nunito(color: textDark),
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Ju lutem shkruani email-in';
                        }
                        if (!value.contains('@')) {
                          return 'Email i pavlefshëm';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),

                    // Password
                    TextFormField(
                      controller: _passwordController,
                      decoration: _fieldDecoration(
                        label: 'Fjalëkalimi',
                        prefixIcon: Icons.lock_outline,
                        suffix: IconButton(
                          icon: Icon(
                            _obscurePassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            color: textMuted,
                          ),
                          onPressed: () => setState(
                              () => _obscurePassword = !_obscurePassword),
                        ),
                      ),
                      obscureText: _obscurePassword,
                      style: GoogleFonts.nunito(color: textDark),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Ju lutem shkruani fjalëkalimin';
                        }
                        if (value.length < 6) {
                          return 'Fjalëkalimi duhet të jetë së paku 6 karaktere';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),

                    // Confirm password
                    TextFormField(
                      controller: _confirmPasswordController,
                      decoration: _fieldDecoration(
                        label: 'Konfirmo Fjalëkalimin',
                        prefixIcon: Icons.lock_person_outlined,
                        suffix: IconButton(
                          icon: Icon(
                            _obscureConfirmPassword
                                ? Icons.visibility_outlined
                                : Icons.visibility_off_outlined,
                            color: textMuted,
                          ),
                          onPressed: () => setState(
                              () => _obscureConfirmPassword =
                                  !_obscureConfirmPassword),
                        ),
                      ),
                      obscureText: _obscureConfirmPassword,
                      style: GoogleFonts.nunito(color: textDark),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Ju lutem konfirmoni fjalëkalimin';
                        }
                        if (value != _passwordController.text) {
                          return 'Fjalëkalimet nuk përputhen';
                        }
                        return null;
                      },
                    ),

                    // ── Error banner ───────────────────────────────────
                    if (_error != null) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEE2E2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                              color: honeyDark.withOpacity(0.30)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.error_outline,
                                color: honeyDark, size: 18),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _error!,
                                style: GoogleFonts.nunito(
                                    color: const Color(0xFF991B1B),
                                    fontSize: 13),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],

                    const SizedBox(height: 28),

                    // ── Register button ────────────────────────────────
                    ElevatedButton(
                      onPressed: _isLoading ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: forestMid,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(50)),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        elevation: 2,
                        disabledBackgroundColor: forestMid.withOpacity(0.6),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                  color: Colors.white, strokeWidth: 2),
                            )
                          : Text(
                              'Regjistrohu',
                              style: GoogleFonts.nunito(
                                  fontSize: 16, fontWeight: FontWeight.w700),
                            ),
                    ),
                    const SizedBox(height: 16),

                    // ── Back to login ──────────────────────────────────
                    Center(
                      child: TextButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: RichText(
                          text: TextSpan(
                            style: GoogleFonts.nunito(
                                fontSize: 14, color: textMuted),
                            children: [
                              const TextSpan(text: 'Tashmë keni llogari? '),
                              TextSpan(
                                text: 'Kyçuni',
                                style: GoogleFonts.nunito(
                                  fontSize: 14,
                                  color: forestMid,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Small Playfair Display section label
class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: GoogleFonts.playfairDisplay(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        color: textDark,
      ),
    );
  }
}
