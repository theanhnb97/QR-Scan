import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Camera, CameraType, type CodeFormat } from 'react-native-camera-kit';
import BarcodeScanning from '@react-native-ml-kit/barcode-scanning';
import {
  check,
  PERMISSIONS,
  request,
  RESULTS,
  type Permission,
  type PermissionStatus,
} from 'react-native-permissions';
import type { ImageCodeDecoder, ScanDetection } from '../../domain/interfaces';

export interface CameraPermissionState {
  status: PermissionStatus;
  hasPermission: boolean;
  canRequestPermission: boolean;
  requestPermission: () => Promise<boolean>;
}

export function useCameraAccess(): CameraPermissionState {
  const permission = Platform.select<Permission>({
    ios: PERMISSIONS.IOS.CAMERA,
    android: PERMISSIONS.ANDROID.CAMERA,
  });
  const [status, setStatus] = useState<PermissionStatus>(RESULTS.DENIED);

  const refresh = useCallback(async () => {
    if (!permission) return;
    setStatus(await check(permission));
  }, [permission]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestPermission = useCallback(async () => {
    if (!permission) return false;
    let nextStatus = await request(permission);

    // CameraKit's Android view requests access when mounted; this fallback keeps
    // the JS permission state accurate after that native request completes.
    if (Platform.OS === 'android' && nextStatus === RESULTS.DENIED) {
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 250));
      nextStatus = await check(permission);
    }
    setStatus(nextStatus);
    return nextStatus === RESULTS.GRANTED;
  }, [permission]);

  return {
    status,
    hasPermission: status === RESULTS.GRANTED,
    canRequestPermission: status === RESULTS.DENIED || status === RESULTS.LIMITED,
    requestPermission,
  };
}

export interface CameraKitScannerProps {
  isActive: boolean;
  torchMode?: 'on' | 'off';
  zoom?: number;
  onDetected: (detection: ScanDetection) => void;
  onError?: (error: Error) => void;
}

export const CameraKitScanner: React.FC<CameraKitScannerProps> = ({ isActive, torchMode = 'off', zoom = 1, onDetected, onError }) => {
  const handleCode = useCallback(
    (event: { nativeEvent: { codeStringValue?: string; codeFormat?: CodeFormat } }) => {
      const value = event.nativeEvent.codeStringValue?.trim();
      if (!value) return;
      const rawFormat = String(event.nativeEvent.codeFormat || 'unknown').toLowerCase();
      onDetected({ value, format: rawFormat === 'qr-code' ? 'qr' : rawFormat });
    },
    [onDetected],
  );

  return (
    <Camera
      style={StyleSheet.absoluteFill}
      cameraType={CameraType.Back}
      focusMode="on"
      torchMode={torchMode}
      zoomMode="off"
      zoom={zoom}
      maxZoom={5}
      scanBarcode={isActive}
      scanThrottleDelay={900}
      // Let ML Kit emit every Android format; CameraKit's native allow-list can
      // discard a valid QR before the JS callback when the device reports a
      // format variant that is not in the JS list.
      allowedBarcodeTypes={Platform.OS === 'android' ? [] : IOS_CODE_FORMATS}
      onReadCode={handleCode}
      onError={(event) => onError?.(new Error(event.nativeEvent.errorMessage))}
    />
  );
};

const IOS_CODE_FORMATS: CodeFormat[] = [
  'qr',
  'code-128',
  'code-39',
  'code-93',
  'codabar',
  'ean-13',
  'ean-8',
  'itf-14',
  'itf',
  'upc-a',
  'upc-e',
  'pdf-417',
  'aztec',
  'data-matrix',
  'code-39-mod-43',
  'interleaved-2of5',
];

export class CameraKitImageDecoder implements ImageCodeDecoder {
  async decode(uri: string): Promise<ScanDetection[]> {
    const barcodes = await BarcodeScanning.scan(uri);
    return barcodes
      .map((barcode) => ({ value: barcode.value || '', format: String(barcode.format) }))
      .filter((barcode) => barcode.value.length > 0);
  }
}
