import { Linking, NativeModules, Platform } from 'react-native';
import { ScannedContent } from '../../domain/models/ScannedContent';

interface NativeSmartActionsApi {
  openWifiSettings(): Promise<boolean>;
  addContact(name: string, phone?: string, email?: string, organization?: string): Promise<boolean>;
  addCalendarEvent(title: string, startDate?: string, endDate?: string, location?: string, description?: string): Promise<boolean>;
}

const nativeActions = NativeModules.NativeSmartActions as NativeSmartActionsApi | undefined;

/** Keeps platform-specific action handoffs out of scan result UI. */
export class NativeActionService {
  async openWifiSettings(): Promise<boolean> {
    if (nativeActions?.openWifiSettings) return nativeActions.openWifiSettings();
    await Linking.openSettings();
    return true;
  }

  async addContact(content: Extract<ScannedContent, { type: 'contact' }>): Promise<boolean> {
    if (nativeActions?.addContact) {
      return nativeActions.addContact(content.name, content.phone, content.email, content.organization);
    }
    return false;
  }

  async addCalendarEvent(content: Extract<ScannedContent, { type: 'calendar_event' }>): Promise<boolean> {
    if (nativeActions?.addCalendarEvent) {
      return nativeActions.addCalendarEvent(content.title, content.startDate, content.endDate, content.location, content.description);
    }
    return false;
  }

  async openLocation(latitude: number, longitude: number): Promise<boolean> {
    const url = Platform.OS === 'ios' ? `https://maps.apple.com/?ll=${latitude},${longitude}` : `geo:${latitude},${longitude}`;
    await Linking.openURL(url);
    return true;
  }
}

export const nativeActionService = new NativeActionService();
