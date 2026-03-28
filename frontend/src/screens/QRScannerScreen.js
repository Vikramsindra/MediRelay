import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../theme';
import { LabeledInput } from '../components/Inputs';
import { PrimaryButton } from '../components/Buttons';

export default function QRScannerScreen({ navigation, route }) {
  const mode = route?.params?.mode; // 'paste' or undefined (camera)
  const [pasteValue, setPasteValue] = useState('');
  const [scanning, setScanning] = useState(mode !== 'paste');
  const [mockScanned, setMockScanned] = useState(false);

  // Simulate QR scan after 2 seconds (replace with camera library in production)
  useEffect(() => {
    if (!scanning) return;
    const t = setTimeout(() => {
      setMockScanned(true);
    }, 2500);
    return () => clearTimeout(t);
  }, [scanning]);

  useEffect(() => {
    if (mockScanned) {
      // Mock detected transfer ID
      navigation.navigate('RecordViewer', { transferId: 'TR-4819' });
    }
  }, [mockScanned]);

  const handlePasteNavigate = () => {
    const match = pasteValue.match(/TR-[\w]+/);
    const id = match ? match[0] : 'TR-4819';
    navigation.navigate('RecordViewer', { transferId: id });
  };

  return (
    <SafeAreaView style={[styles.safe, scanning && styles.safeScanning]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[typography.titleMd, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[typography.titleMd, { color: colors.onSurface }]}>Receive Transfer</Text>
        <TouchableOpacity onPress={() => setScanning(!scanning)}>
          <Text style={[typography.labelMd, { color: colors.primary }]}>
            {scanning ? 'Paste Link' : 'Scan QR'}
          </Text>
        </TouchableOpacity>
      </View>

      {scanning ? (
        /* Camera viewfinder simulation */
        <View style={styles.viewfinder}>
          <View style={styles.scanFrame}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
            {/* Scan line animation placeholder */}
            <View style={styles.scanLine} />
          </View>
          <Text style={[typography.bodyMd, { color: colors.white, marginTop: spacing[6], textAlign: 'center' }]}>
            Point camera at MediRelay QR code
          </Text>
          <Text style={[typography.bodySm, { color: 'rgba(255,255,255,0.6)', marginTop: spacing[2], textAlign: 'center' }]}>
            Scanning instantly on detect…
          </Text>
          {mockScanned && (
            <Text style={[typography.titleMd, { color: '#7effc5', marginTop: spacing[4] }]}>
              ✓ QR Detected — Opening record…
            </Text>
          )}
        </View>
      ) : (
        /* Paste link mode */
        <View style={styles.pasteContainer}>
          <Text style={styles.pasteIcon}>🔗</Text>
          <Text style={[typography.headlineSm, { color: colors.onSurface, marginBottom: spacing[5] }]}>
            Enter transfer link
          </Text>
          <LabeledInput
            label="Transfer Link or Code"
            value={pasteValue}
            onChangeText={setPasteValue}
            placeholder="medirelay.app/r/TR-…"
            autoFocus
          />
          <PrimaryButton
            label="Open Record →"
            onPress={handlePasteNavigate}
            disabled={pasteValue.length < 5}
          />
          <TouchableOpacity onPress={() => setScanning(true)} style={styles.switchBtn}>
            <Text style={[typography.bodyMd, { color: colors.primary, textAlign: 'center' }]}>
              Scan QR code instead
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const CORNER_SIZE = 28;
const CORNER_THICKNESS = 4;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  safeScanning: { backgroundColor: '#000' },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[3],
    backgroundColor: colors.background,
  },
  viewfinder: {
    flex: 1, backgroundColor: '#111',
    alignItems: 'center', justifyContent: 'center',
  },
  scanFrame: {
    width: 240, height: 240,
    position: 'relative',
    alignItems: 'center', justifyContent: 'center',
  },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: '#7effc5',
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 4 },
  scanLine: {
    position: 'absolute',
    width: '80%', height: 2,
    backgroundColor: 'rgba(126,255,197,0.6)',
    top: '40%',
  },
  pasteContainer: {
    flex: 1, padding: spacing[6], justifyContent: 'center',
    backgroundColor: colors.background,
  },
  pasteIcon: { fontSize: 48, textAlign: 'center', marginBottom: spacing[4] },
  switchBtn: { paddingVertical: spacing[4] },
});
