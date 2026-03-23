import 'package:flutter/material.dart';
import 'screens/digital_card_screen.dart';

void main() {
  runApp(const AciavSaudeApp());
}

class AciavSaudeApp extends StatelessWidget {
  const AciavSaudeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ACIAV Saúde',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const DigitalCardScreen(),
    );
  }
}
