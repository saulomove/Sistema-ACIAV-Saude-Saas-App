import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:dart_jsonwebtoken/dart_jsonwebtoken.dart';
import '../widgets/glass_card.dart';
import 'dart:async';

class DigitalCardScreen extends StatefulWidget {
  const DigitalCardScreen({Key? key}) : super(key: key);

  @override
  State<DigitalCardScreen> createState() => _DigitalCardScreenState();
}

class _DigitalCardScreenState extends State<DigitalCardScreen> {
  String _qrData = '';
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _generateToken();
    // Rotate token every 30 seconds for offline validity
    _timer = Timer.periodic(const Duration(seconds: 30), (timer) {
      _generateToken();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _generateToken() {
    // Generates an offline JWT payload simulating what a Backend would do initially
    // The clinic validating this QR Code needs the same Secret Key
    final jwt = JWT({
      'cpf': '123.456.789-00',
      'unit_id': 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    });

    final token = jwt.sign(SecretKey('ACIAV_SUPER_SECRET_KEY'), expiresIn: const Duration(seconds: 30));

    setState(() {
      _qrData = token;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F172A), // Dark modern background
      appBar: AppBar(
        title: const Text('Carteirinha Digital', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              GlassCard(
                height: 400,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.start,
                  children: [
                    const Text(
                      'ACIAV Saúde',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Saulo Machado',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 18,
                      ),
                    ),
                    const SizedBox(height: 5),
                    const Text(
                      'Karikal',
                      style: TextStyle(
                        color: Colors.white54,
                        fontSize: 14,
                      ),
                    ),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: QrImageView(
                        data: _qrData,
                        version: QrVersions.auto,
                        size: 180.0,
                        backgroundColor: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'QR Code dinâmico offline (Expira em 30s)',
                      style: TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
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
}
