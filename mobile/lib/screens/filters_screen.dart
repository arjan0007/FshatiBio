import 'package:flutter/material.dart';

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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Filtra'),
        backgroundColor: const Color(0xFF16a34a),
        foregroundColor: Colors.white,
        actions: [
          TextButton(
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
            child: const Text(
              'Pastro',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Sort
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Rendit sipas',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButton<String>(
                    value: filters['sort'] ?? 'newest',
                    isExpanded: true,
                    items: const [
                      DropdownMenuItem(value: 'newest', child: Text('Më të rejat')),
                      DropdownMenuItem(value: 'oldest', child: Text('Më të vjetrat')),
                      DropdownMenuItem(value: 'price_asc', child: Text('Çmimi: Nga më i ulët')),
                      DropdownMenuItem(value: 'price_desc', child: Text('Çmimi: Nga më i lartë')),
                      DropdownMenuItem(value: 'name_asc', child: Text('Emri: A-Z')),
                      DropdownMenuItem(value: 'name_desc', child: Text('Emri: Z-A')),
                      DropdownMenuItem(value: 'rating_desc', child: Text('Vlerësimi më i lartë')),
                    ],
                    onChanged: (value) {
                      setState(() {
                        filters['sort'] = value;
                      });
                    },
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Price Range
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Çmimi (Lekë)',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          decoration: const InputDecoration(
                            labelText: 'Min',
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
                          controller: TextEditingController(
                            text: filters['min_price']?.toString() ?? '',
                          ),
                          onChanged: (value) {
                            filters['min_price'] =
                                value.isEmpty ? null : double.tryParse(value);
                          },
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextField(
                          decoration: const InputDecoration(
                            labelText: 'Max',
                            border: OutlineInputBorder(),
                          ),
                          keyboardType: TextInputType.number,
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
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Bio Filter
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Lloji',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButton<String?>(
                    value: filters['is_bio'],
                    isExpanded: true,
                    items: const [
                      DropdownMenuItem(value: null, child: Text('Të gjitha')),
                      DropdownMenuItem(value: 'true', child: Text('Vetëm BIO')),
                      DropdownMenuItem(value: 'false', child: Text('Jo BIO')),
                    ],
                    onChanged: (value) {
                      setState(() {
                        filters['is_bio'] = value;
                      });
                    },
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Stock Filter
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Stoku',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButton<String?>(
                    value: filters['in_stock'],
                    isExpanded: true,
                    items: const [
                      DropdownMenuItem(value: null, child: Text('Të gjitha')),
                      DropdownMenuItem(value: 'true', child: Text('Në stok')),
                      DropdownMenuItem(value: 'false', child: Text('Jashtë stokut')),
                    ],
                    onChanged: (value) {
                      setState(() {
                        filters['in_stock'] = value;
                      });
                    },
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Rating Filter
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Vlerësimi minimal',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButton<double?>(
                    value: filters['min_rating'],
                    isExpanded: true,
                    items: const [
                      DropdownMenuItem(value: null, child: Text('Të gjitha')),
                      DropdownMenuItem(value: 4.0, child: Text('4+ ★')),
                      DropdownMenuItem(value: 3.0, child: Text('3+ ★')),
                      DropdownMenuItem(value: 2.0, child: Text('2+ ★')),
                      DropdownMenuItem(value: 1.0, child: Text('1+ ★')),
                    ],
                    onChanged: (value) {
                      setState(() {
                        filters['min_rating'] = value;
                      });
                    },
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 32),

          // Apply Button
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop(filters);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16a34a),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text('Apliko Filtra'),
            ),
          ),
        ],
      ),
    );
  }
}

