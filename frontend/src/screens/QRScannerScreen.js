import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { colors, typography, spacing, radius } from '../theme';
import { LabeledInput } from '../components/Inputs';
import { PrimaryButton } from '../components/Buttons';
import { AppIcon } from '../components/AppIcon';

export default function QRScannerScreen({ navigation, route }) {
  const mode = route?.params?.mode; // 'paste' or undefined (camera)
  const [pasteValue, setPasteValue] = useState('');
  const [scanning, setScanning] = useState(mode !== 'paste');
  const [permission, requestPermission] = useCameraPermissions();
  const [lastScannedData, setLastScannedData] = useState('');
  const scannedRef = useRef(false);

  // Auto-navigate when QR is scanned
  useEffect(() => {
    if (!lastScannedData || scannedRef.current) return;
    scannedRef.current = true;
    
    try {
      // Extract shareId from QR data
      // Expected format: "MR1:<compressed_json>" or direct URL/shareId
      let shareId = lastScannedData;
      
      if (lastScannedData.startsWith('MR1:')) {
        // For now, just extract the portion after MR1: as shareId
        shareId = lastScannedData.substring(4);
      } else if (lastScannedData.includes('/share/')) {
        // If it's a full URL like "http://localhost:8080/api/v1/transfers/share/ABC123"
        const match = lastScannedData.match(/\/share\/([^\/\?]+)/);
        shareId = match ? match[1] : lastScannedData;
      }
      
      // Navigate to RecordViewerScreen with shareId
      navigation.navigate('RecordViewer', { shareId, qrData: lastScannedData });
    } catch (error) {
      Alert.alert('Error', 'Could not parse QR code. Please try again.');
      scannedRef.current = false;
      setLastScannedData('');
    }
  }, [lastScannedData, navigation]);

  const handlePasteNavigate = () => {
    const match = pasteValue.match(/share\/([^\/?]+)/);
    const shareId = match ? match[1] : pasteValue;
    navigation.navigate('RecordViewer', { shareId, qrData: pasteValue });
  };

  return (
    <SafeAreaView style={[styles.safe, scanning && styles.safeScanning]}>
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <AppIcon name="back" size={18} color={colors.primary} />
          <Text style={[typography.titleMd, { color: colors.primary, marginLeft: spacing[1.5] }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[typography.titleMd, { color: colors.onSurface }]}>Receive Transfer</Text>
        <TouchableOpacity onPress={() => setScanning(!scanning)}>
          <Text style={[typography.labelMd, { color: colors.primary }]}>
            {scanning ? 'Paste Link' : 'Scan QR'}
          </Text>
        </TouchableOpacity>
      </View>

      {scanning ? (
        /* Real camera preview scaffold */
        <View style={styles.viewfinder}>
          {permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{
                barcodeTypes: ['qr'],
              }}
              onBarcodeScanned={({ data }) => {
                if (!scannedRef.current) {
                  setLastScannedData(data);
                }
              }}
            />
          ) : (
            <View style={styles.permissionWrap}>
              <Text style={[typography.bodyMd, { color: colors.white, textAlign: 'center' }]}>Camera access is required to scan QR codes.</Text>
              <View style={{ height: spacing[4] }} />
              <PrimaryButton
                label="Allow Camera Access"
                onPress={requestPermission}
              />
            </View>
          )}

          <View style={styles.scanFrame}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <Text style={[typography.bodyMd, { color: colors.white, marginTop: spacing[6], textAlign: 'center' }]}>
            Point camera at MediRelay QR code
          </Text>
          <Text style={[typography.bodySm, { color: 'rgba(255,255,255,0.6)', marginTop: spacing[2], textAlign: 'center' }]}>
            Scan will automatically navigate to transfer record
          </Text>
          {lastScannedData ? (
            <View style={styles.detectedRow}>
              <AppIcon name="check" size={16} color="#7effc5" />
              <Text style={[typography.titleMd, { color: '#7effc5', marginLeft: spacing[1.5] }]}>QR detected</Text>
            </View>
          ) : null}
        </View>
      ) : (
        /* Paste link mode */
        <View style={styles.pasteContainer}>
          <View style={styles.pasteIconWrap}>
            <AppIcon name="chevron-right" size={36} color={colors.primary} />
          </View>
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
            label="Open Record"
            iconName="chevron-right"
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
  permissionWrap: {
    position: 'absolute',
    left: spacing[6],
    right: spacing[6],
    top: spacing[12],
    zIndex: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: radius.md,
    padding: spacing[4],
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
  pasteContainer: {
    flex: 1, padding: spacing[6], justifyContent: 'center',
    backgroundColor: colors.background,
  },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  detectedRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing[4] },
  pasteIconWrap: { alignItems: 'center', marginBottom: spacing[4] },
  switchBtn: { paddingVertical: spacing[4] },
});
