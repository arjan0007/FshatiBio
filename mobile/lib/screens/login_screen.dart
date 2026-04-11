import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import 'register_screen.dart';

const Color _green   = Color(0xFF2D6A4F);
const Color _greenDk = Color(0xFF1B4332);
const Color _ghost   = Color(0xFFD8F3DC);
const Color _honey   = Color(0xFFF4A261);
const Color _cream   = Color(0xFFFEFAE0);
const Color _earth   = Color(0xFFE8D5C4);
const Color _txt     = Color(0xFF1B2F1E);
const Color _muted   = Color(0xFF6B7C73);

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey        = GlobalKey<FormState>();
  final _emailCtrl      = TextEditingController();
  final _passwordCtrl   = TextEditingController();
  bool  _loading        = false;
  bool  _hidePass       = true;
  String? _error;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _error = null; });

    final auth = context.read<AuthProvider>();
    final cart = context.read<CartProvider>();
    try {
      await auth.login(_emailCtrl.text.trim(), _passwordCtrl.text.trim());
      cart.updateAuthToken(auth.token);
      if (mounted) Navigator.of(context).pop();
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _cream,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: _greenDk),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 8),

                // ── Logo + brand ──────────────────────────────────────────
                Center(
                  child: Column(
                    children: [
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF2D6A4F), Color(0xFF52B788)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(22),
                          boxShadow: [
                            BoxShadow(
                              color: _green.withOpacity(0.30),
                              blurRadius: 16,
                              offset: const Offset(0, 6),
                            )
                          ],
                        ),
                        child: const Center(
                          child: Text('🌿', style: TextStyle(fontSize: 34)),
                        ),
                      ),
                      const SizedBox(height: 14),
                      Text('FshatiBio',
                          style: GoogleFonts.playfairDisplay(
                              fontSize: 26,
                              fontWeight: FontWeight.bold,
                              color: _greenDk)),
                    ],
                  ),
                ),

                const SizedBox(height: 36),

                // ── Title ─────────────────────────────────────────────────
                Text('Kyçu',
                    style: GoogleFonts.playfairDisplay(
                        fontSize: 30,
                        fontWeight: FontWeight.bold,
                        color: _txt)),
                const SizedBox(height: 6),
                Text('Mirë se erdhe! Vendos të dhënat tua.',
                    style: GoogleFonts.nunito(
                        fontSize: 14, color: _muted)),

                const SizedBox(height: 28),

                // ── Error banner ──────────────────────────────────────────
                if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFEBEB),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                          color: const Color(0xFFDC2626).withOpacity(0.3)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline,
                            color: Color(0xFFDC2626), size: 18),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(_error!,
                              style: GoogleFonts.nunito(
                                  color: const Color(0xFFDC2626),
                                  fontSize: 13)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // ── Email ─────────────────────────────────────────────────
                TextFormField(
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  style: GoogleFonts.nunito(color: _txt),
                  decoration: _inputDecoration(
                    label: 'Email',
                    icon: Icons.email_outlined,
                  ),
                  validator: (v) =>
                      (v == null || v.isEmpty) ? 'Shkruani email-in' : null,
                ),

                const SizedBox(height: 16),

                // ── Password ──────────────────────────────────────────────
                TextFormField(
                  controller: _passwordCtrl,
                  obscureText: _hidePass,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  style: GoogleFonts.nunito(color: _txt),
                  decoration: _inputDecoration(
                    label: 'Fjalëkalimi',
                    icon: Icons.lock_outline,
                    suffix: IconButton(
                      icon: Icon(
                        _hidePass
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                        color: _muted,
                        size: 20,
                      ),
                      onPressed: () =>
                          setState(() => _hidePass = !_hidePass),
                    ),
                  ),
                  validator: (v) =>
                      (v == null || v.length < 6)
                          ? 'Minimumi 6 karaktere'
                          : null,
                ),

                const SizedBox(height: 28),

                // ── Login button ──────────────────────────────────────────
                SizedBox(
                  width: double.infinity,
                  height: 54,
                  child: ElevatedButton(
                    onPressed: _loading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: _green,
                      disabledBackgroundColor: _green.withOpacity(0.6),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16)),
                      elevation: 2,
                    ),
                    child: _loading
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2.5),
                          )
                        : Text('Kyçu',
                            style: GoogleFonts.nunito(
                                fontSize: 17,
                                fontWeight: FontWeight.bold)),
                  ),
                ),

                const SizedBox(height: 24),

                // ── Register link ─────────────────────────────────────────
                Center(
                  child: GestureDetector(
                    onTap: () {
                      Navigator.of(context).pushReplacement(
                        MaterialPageRoute(
                            builder: (_) => const RegisterScreen()),
                      );
                    },
                    child: RichText(
                      text: TextSpan(
                        style: GoogleFonts.nunito(
                            fontSize: 14, color: _muted),
                        children: [
                          const TextSpan(text: 'Nuk ke llogari? '),
                          TextSpan(
                            text: 'Regjistrohu',
                            style: GoogleFonts.nunito(
                              color: _green,
                              fontWeight: FontWeight.bold,
                              decoration: TextDecoration.underline,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration({
    required String label,
    required IconData icon,
    Widget? suffix,
  }) {
    return InputDecoration(
      labelText: label,
      labelStyle: GoogleFonts.nunito(color: _muted, fontSize: 14),
      prefixIcon: Icon(icon, color: _green, size: 20),
      suffixIcon: suffix,
      filled: true,
      fillColor: Colors.white,
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: _earth),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: _earth),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide: const BorderSide(color: _green, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(16),
        borderSide:
            const BorderSide(color: Color(0xFFDC2626)),
      ),
    );
  }
}
