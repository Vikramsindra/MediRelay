import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { colors, typography, spacing, radius } from '../theme';
import { LabeledInput } from '../components/Inputs';
import { PrimaryButton } from '../components/Buttons';
import { AppIcon } from '../components/AppIcon';
import { mapTransferFromApi, parseTransferQrPayload } from '../api/transfers';

export default function QRScannerScreen({ navigation, route }) {
  const mode = route?.params?.mode; // 'paste' or undefined (camera)
  const [pasteValue, setPasteValue] = useState('');
  const [scanning, setScanning] = useState(mode !== 'paste');
  const [permission, requestPermission] = useCameraPermissions();
  const [lastScannedData, setLastScannedData] = useState('');
  const [scanError, setScanError] = useState('');

  const handleUploadQrFromDevice = async () => {
    try {
      setScanError('');

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setScanError('Media library permission is required to pick a QR image.');
        return;
      }

      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 1,
      });

      if (picked.canceled || !picked.assets?.[0]?.uri) {
        return;
      }

      let scanResults = [];
      try {
        scanResults = await Camera.scanFromURLAsync(picked.assets[0].uri, ['qr']);
      } catch (_error) {
        scanResults = await Camera.scanFromURLAsync(picked.assets[0].uri, { barcodeTypes: ['qr'] });
      }

      const decodedValue = String(scanResults?.[0]?.data || '').trim();
      if (!decodedValue) {
        setScanError('No QR code found in selected image.');
        return;
      }

      setLastScannedData(decodedValue);
      const opened = openScannedPayload(decodedValue);
      if (!opened) setLastScannedData('');
    } catch (_error) {
      setScanError('Could not read QR from image. Please try a clearer image.');
    }
  };

  const openScannedPayload = (rawValue) => {
    const scannedText = String(rawValue || '').trim();
    if (!scannedText) {
      setScanError('Invalid QR payload.');
      return false;
    }

    const transferFromQr = parseTransferQrPayload(scannedText);
    if (transferFromQr) {
      const looksLikeApiTransfer = Boolean(
        transferFromQr?._id
        || transferFromQr?.patient
        || transferFromQr?.activeMedications
        || transferFromQr?.pendingInvestigations,
      );
      const mappedTransfer = looksLikeApiTransfer
        ? mapTransferFromApi(transferFromQr)
        : transferFromQr;

      if (__DEV__) {
        console.log('[QRScanner] Decoded transfer payload', {
          transferId: mappedTransfer?.id,
          shareId: mappedTransfer?.shareId,
          vitals: mappedTransfer?.vitals,
        });
      }

      navigation.navigate('RecordViewer', {
        transferId: mappedTransfer?.id || undefined,
        transferShareId: mappedTransfer.shareId || undefined,
        transferPayload: {
          ...mappedTransfer,
          direction: 'received',
        },
        transferDirection: 'received',
      });
      return true;
    }

    const shareIdMatch = scannedText.match(/\/share\/([\w-]+)/i)
      || scannedText.match(/\/r\/([\w-]+)/i);
    if (shareIdMatch?.[1]) {
      navigation.navigate('RecordViewer', {
        transferShareId: shareIdMatch[1],
        transferDirection: 'received',
      });
      return true;
    }

    const objectIdMatch = scannedText.match(/\b([a-fA-F0-9]{24})\b/);
    if (objectIdMatch?.[1]) {
      navigation.navigate('RecordViewer', {
        transferId: objectIdMatch[1],
        transferDirection: 'received',
      });
      return true;
    }

    setScanError('Unsupported QR content. Use a MediRelay transfer QR.');
    return false;
  };

  const handlePasteNavigate = () => {
    openScannedPayload(pasteValue);
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
                if (lastScannedData) return;
                setLastScannedData(data);
                setScanError('');
                setTimeout(() => {
                  const opened = openScannedPayload(data);
                  if (!opened) setLastScannedData('');
                }, 120);
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
            Scanner is live. Opens transfer automatically after decode.
          </Text>
          <TouchableOpacity style={styles.uploadQrBtn} onPress={handleUploadQrFromDevice} activeOpacity={0.8}>
            <Text style={[typography.labelMd, { color: '#7effc5' }]}>Upload QR from device</Text>
          </TouchableOpacity>
          {lastScannedData ? (
            <View style={styles.detectedRow}>
              <AppIcon name="check" size={16} color="#7effc5" />
              <Text style={[typography.titleMd, { color: '#7effc5', marginLeft: spacing[1.5] }]}>QR detected</Text>
            </View>
          ) : null}
          {scanError ? (
            <Text style={[typography.bodySm, { color: '#ffb3b3', marginTop: spacing[3], textAlign: 'center' }]}>
              {scanError}
            </Text>
          ) : null}
        </View>
      ) : (
        /* Paste link mode */
        <View style={styles.pasteContainer}>
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
          {scanError ? (
            <Text style={[typography.bodySm, { color: colors.error, marginTop: spacing[2] }]}>
              {scanError}
            </Text>
          ) : null}
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
  uploadQrBtn: {
    marginTop: spacing[5],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    borderWidth: 1,
    borderColor: '#7effc5',
    borderRadius: radius.full,
    backgroundColor: 'rgba(126,255,197,0.08)',
  },
  switchBtn: { paddingVertical: spacing[4] },
});
