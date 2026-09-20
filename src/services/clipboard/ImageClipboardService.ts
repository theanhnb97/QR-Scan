import { NativeModules, Platform } from 'react-native';

interface NativeImageClipboardModule {
  copyImage(path: string): Promise<boolean>;
}

const nativeClipboard = NativeModules.NativeImageClipboard as NativeImageClipboardModule | undefined;

export async function copyImageToClipboard(path: string): Promise<boolean> {
  if (!nativeClipboard?.copyImage) {
    if (Platform.OS === 'ios' || Platform.OS === 'android') return false;
    return false;
  }
  return nativeClipboard.copyImage(path);
}
