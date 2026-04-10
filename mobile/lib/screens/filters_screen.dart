import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

const Color forestDark  = Color(0xFF1B4332);
const Color forestMid   = Color(0xFF2D6A4F);
const Color forestLight = Color(0xFF40916C);
const Color forestPale  = Color(0xFF52B788);
const Color forestGhost = Color(0xFFD8F3DC);
const Color honeyMid    = Color(0xFFF4A261);
const Color creamBg     = Color(0xFFFEFAE0);
const Color earthLight  = Color(0xFFE8D5C4);
const Color textDark    = Color(0xFF1B2F1E);
const Color textMuted   = Color(0xFF6B7C73);

class FiltersScreen extends StatefulWidget {
  final Map<String, dynamic> initialFilters;

  const FiltersScreen({super.key, required this.initialFilters});

  @override
  State<FiltersScreen> createState() => _FiltersScreenState();
}

class _FiltersScreenState extends State<FiltersScreen> {
  late Map<String, dynamic> filters;

  @override
  void initState() {
    super.initState();
    filters = Map<String, dynamic>.from(widget.initialFilters);
  }

  /// Returns a styled section card wrapping [child] with a given [title].
  Widget _sectionCard({required String title, required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: forestDark.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
          BoxShadow(
            color: earthLight.withOpacity(0.40),
            blurRadius: 6,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.playfairDisplay(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: textDark,
            ),
          ),
          const SizedBox(height: 14),
          child,
        ],
      ),
    );
  }

  /// Shared decoration for the dropdown containers.
  InputDecoration _dropdownDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: TextStyle(color: textMuted, fontSize: 14),
      filled: true,
      fillColor: forestGhost.withOpacity(0.35),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: earthLight, width: 1.2),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: earthLight, width: 1.2),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: forestMid, width: 1.6),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: creamBg,
      appBar: AppBar(
        backgroundColor: forestMid,
        elevation: 0,
        title: Text(
          'Filtro Produktet',
          style: GoogleFonts.playfairDisplay(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: OutlinedButton(
              onPressed: () {
                setState(() {
                  filters = {
                    'sort': 'newest',
                    'min_price': null,
                    'max_price': null,
                    'is_bio': null,
                    'in_stock': null,
                    'min_rating': null,
                  };
                });
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Colors.white70, width: 1.2),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(50),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
              ),
              child: Text(
                'Pastro',
                style: GoogleFonts.lato(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
        children: [
          // ── Sort ──────────────────────────────────────────────────────────
          _sectionCard(
            title: 'Rendit sipas',
            child: DropdownButtonFormField<String>(
              value: filters['sort'] ?? 'newest',
              decoration: _dropdownDecoration('Zgjidh renditjen'),
              dropdownColor: Colors.white,
              style: GoogleFonts.lato(fontSize: 14, color: textDark),
              icon: Icon(Icons.keyboard_arrow_down_rounded, color: forestMid),
              items: [
                DropdownMenuItem(
                  value: 'newest',
                  child: Text('Më të rejat',
                      style: GoogleFonts.lato(color: textDark)),
                ),
                DropdownMenuItem(
                  value: 'oldest',
                  child: Text('Më të vjetrat',
                      style: GoogleFonts.lato(color: textDark)),
                ),
                DropdownMenuItem(
                  value: 'price_asc',
                  child: Text('Çmimi: Nga më i ulët',
                      style: GoogleFonts.lato(color: textDark)),
                ),
                DropdownMenuItem(
                  value: 'price_desc',
                  child: Text('Çmimi: Nga më i lartë',
                      style: GoogleFonts.lato(color: textDark)),
                ),
                DropdownMenuItem(
                  value: 'name_asc',
                  child: Text('Emri: A-Z',
                      style: GoogleFonts.lato(color: textDark)),
                ),
                DropdownMenuItem(
                  value: 'name_desc',
                  child: Text('Emri: Z-A',
                      style: GoogleFonts.lato(color: textDark)),
                ),
                DropdownMenuItem(
                  value: 'rating_desc',
                  child: Text('Vlerësimi më i lartë',
                      style: GoogleFonts.lato(color: textDark)),
                ),
              ],
              onChanged: (value) {
                setState(() {
                  filters['sort'] = value;
                });
              },
            ),
          ),

          const SizedBox(height: 16),

          // ── Price Range ───────────────────────────────────────────────────
          _sectionCard(
            title: 'Çmimi (Lekë)',
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    decoration: _dropdownDecoration('').copyWith(
                      labelText: 'Min',
                      labelStyle: TextStyle(color: textMuted, fontSize: 13),
                    ),
                    keyboardType: TextInputType.number,
                    style: GoogleFonts.lato(fontSize: 14, color: textDark),
                    controller: TextEditingController(
                      text: filters['min_price']?.toString() ?? '',
                    ),
                    onChanged: (value) {
                      filters['min_price'] =
                          value.isEmpty ? null : double.tryParse(value);
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Text(
                    '—',
                    style: TextStyle(
                        color: textMuted,
                        fontSize: 18,
                        fontWeight: FontWeight.w300),
                  ),
                ),
                Expanded(
                  child: TextField(
                    decoration: _dropdownDecoration('').copyWith(
                      labelText: 'Max',
                      labelStyle: TextStyle(color: textMuted, fontSize: 13),
                    ),
                    keyboardType: TextInputType.number,
                    style: GoogleFonts.lato(fontSize: 14, color: textDark),
                    controller: TextEditingController(
                      text: filters['max_price']?.toString() ?? '',
                    ),
                    onChanged: (value) {
                      filters['max_price'] =
                          value.isEmpty ? null : double.tryParse(value);
                    },
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // ── Bio Type ──────────────────────────────────────────────────────
          _sectionCard(
            title: 'Lloji',
            child: DropdownButtonFormField<String?>(
              value: filters['is_bio'],
              decoration: _dropdownDecoration('Zgjidh llojin'),
              dropdownColor: Colors.white,
              style: GoogleFonts.lato(fontSize: 14, color: textDark),
              icon: Icon(Icons.keyboard_arrow_down_rounded, color: forestMid),
              items: [
                DropdownMenuItem(
                  value: null,
                  child: Text('Të gjitha',
                      style: GoogleFonts.lato(color: textDark)),
                ),
                DropdownMenuItem(
                  value: 'true',
                  child: Row(
                    children: [
                      Icon(Icons.eco_rounded,
                          size: 16, color: forestPale),
                      const SizedBox(width: 6),
                      Text('Vetëm BIO',
                          style: GoogleFonts.lato(color: textDark)),
                    ],
                  ),
                ),
                DropdownMenuItem(
                  value: 'false',
                  child: Text('Jo BIO',
                      style: GoogleFonts.lato(color: textDark)),
                ),
              ],
              onChanged: (value) {
                setState(() {
                  filters['is_bio'] = value;
                });
              },
            ),
          ),

          const SizedBox(height: 16),

          // ── Stock ─────────────────────────────────────────────────────────
          _sectionCard(
            title: 'Stoku',
            child: DropdownButtonFormField<String?>(
              value: filters['in_stock'],
              decoration: _dropdownDecoration('Zgjidh disponueshmërinë'),
              dropdownColor: Colors.white,
              style: GoogleFonts.lato(fontSize: 14, color: textDark),
              icon: Icon(Icons.keyboard_arrow_down_rounded, color: forestMid),
              items: [
                DropdownMenuItem(
                  value: null,
                  child: Text('Të gjitha',
                      style: GoogleFonts.lato(color: textDark)),
                ),
                DropdownMenuItem(
                  value: 'true',
                  child: Row(
                    children: [
                      Icon(Icons.check_circle_outline_rounded,
                          size: 16, color: forestPale),
                      const SizedBox(width: 6),
                      Text('Në stok',
                          style: GoogleFonts.lato(color: textDark)),
                    ],
                  ),
                ),
                DropdownMenuItem(
                  value: 'false',
                  child: Text('Jashtë stokut',
                      style: GoogleFonts.lato(color: textDark)),
                ),
              ],
              onChanged: (value) {
                setState(() {
                  filters['in_stock'] = value;
                });
              },
            ),
          ),

          const SizedBox(height: 16),

          // ── Rating ────────────────────────────────────────────────────────
          _sectionCard(
            title: 'Vlerësimi minimal',
            child: DropdownButtonFormField<double?>(
              value: filters['min_rating'],
              decoration: _dropdownDecoration('Zgjidh vlerësimin'),
              dropdownColor: Colors.white,
              style: GoogleFonts.lato(fontSize: 14, color: textDark),
              icon: Icon(Icons.keyboard_arrow_down_rounded, color: forestMid),
              items: [
                DropdownMenuItem(
                  value: null,
                  child: Text('Të gjitha',
                      style: GoogleFonts.lato(color: textDark)),
                ),
                DropdownMenuItem(
                  value: 4.0,
                  child: Row(
                    children: [
                      Icon(Icons.star_rounded, size: 16, color: honeyMid),
                      const SizedBox(width: 4),
                      Text('4+ ★',
                          style: GoogleFonts.lato(color: textDark)),
                    ],
                  ),
                ),
                DropdownMenuItem(
                  value: 3.0,
                  child: Row(
                    children: [
                      Icon(Icons.star_rounded, size: 16, color: honeyMid),
                      const SizedBox(width: 4),
                      Text('3+ ★',
                          style: GoogleFonts.lato(color: textDark)),
                    ],
                  ),
                ),
                DropdownMenuItem(
                  value: 2.0,
                  child: Row(
                    children: [
                      Icon(Icons.star_rounded, size: 16, color: honeyMid),
                      const SizedBox(width: 4),
                      Text('2+ ★',
                          style: GoogleFonts.lato(color: textDark)),
                    ],
                  ),
                ),
                DropdownMenuItem(
                  value: 1.0,
                  child: Row(
                    children: [
                      Icon(Icons.star_rounded, size: 16, color: honeyMid),
                      const SizedBox(width: 4),
                      Text('1+ ★',
                          style: GoogleFonts.lato(color: textDark)),
                    ],
                  ),
                ),
              ],
              onChanged: (value) {
                setState(() {
                  filters['min_rating'] = value;
                });
              },
            ),
          ),

          const SizedBox(height: 32),

          // ── Apply Button ──────────────────────────────────────────────────
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop(filters);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: honeyMid,
                foregroundColor: Colors.white,
                elevation: 4,
                shadowColor: honeyMid.withOpacity(0.45),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(50),
                ),
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: Text(
                'Zbato Filtrat',
                style: GoogleFonts.playfairDisplay(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  letterSpacing: 0.4,
                ),
              ),
            ),
          ),

          const SizedBox(height: 12),

          // ── Reset Button (secondary) ──────────────────────────────────────
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () {
                setState(() {
                  filters = {
                    'sort': 'newest',
                    'min_price': null,
                    'max_price': null,
                    'is_bio': null,
                    'in_stock': null,
                    'min_rating': null,
                  };
                });
              },
              style: OutlinedButton.styleFrom(
                foregroundColor: forestMid,
                side: BorderSide(color: forestMid, width: 1.4),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(50),
                ),
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: Text(
                'Pastro Filtrat',
                style: GoogleFonts.lato(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: forestMid,
                  letterSpacing: 0.3,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
