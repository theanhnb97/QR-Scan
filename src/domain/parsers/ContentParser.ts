import {
  ScannedContent,
  TextScannedContent,
  UrlScannedContent,
  WifiScannedContent,
  EmailScannedContent,
  PhoneScannedContent,
  SmsScannedContent,
  ContactScannedContent,
  LocationScannedContent,
  CalendarScannedContent,
  TotpProvisioningTransientContent,
  HotpProvisioningTransientContent,
  TotpMigrationTransientContent,
} from '../models/ScannedContent';
import { ContentParser } from '../interfaces';
import { parseGoogleAuthenticatorMigration } from '../otp/GoogleAuthenticatorMigration';

export class DefaultContentParser implements ContentParser {
  parse(rawPayload: string): ScannedContent {
    if (!rawPayload || typeof rawPayload !== 'string') {
      return {
        type: 'text',
        rawPayload: '',
        text: '',
      };
    }

    const trimmed = rawPayload.trim();

    // Google Authenticator exports multiple accounts as a protobuf migration URI.
    if (trimmed.toLowerCase().startsWith('otpauth-migration://')) {
      const accounts = parseGoogleAuthenticatorMigration(trimmed);
      if (accounts) {
        const migration: TotpMigrationTransientContent = { type: 'totp_migration', rawPayload: trimmed, accounts };
        return migration;
      }
    }

    // 1. Check OTP Auth URI (RFC 6238 / RFC 4226)
    if (trimmed.toLowerCase().startsWith('otpauth://')) {
      const otpParsed = this.parseOtpAuthUri(trimmed);
      if (otpParsed) {
        return otpParsed;
      }
    }

    // 2. Check Wi-Fi QR (WIFI:T:WPA;S:MyNetwork;P:MyPassword;H:false;;)
    if (trimmed.toUpperCase().startsWith('WIFI:')) {
      const wifiParsed = this.parseWifi(trimmed);
      if (wifiParsed) {
        return wifiParsed;
      }
    }

    // 3. Check Mailto / MATMSG
    if (trimmed.toLowerCase().startsWith('mailto:') || trimmed.toUpperCase().startsWith('MATMSG:')) {
      const emailParsed = this.parseEmail(trimmed);
      if (emailParsed) {
        return emailParsed;
      }
    }

    // 4. Check Telephone
    if (trimmed.toLowerCase().startsWith('tel:') || trimmed.toLowerCase().startsWith('telprompt:')) {
      const phoneParsed = this.parsePhone(trimmed);
      if (phoneParsed) {
        return phoneParsed;
      }
    }

    // 5. Check SMS
    if (trimmed.toLowerCase().startsWith('sms:') || trimmed.toLowerCase().startsWith('smsto:')) {
      const smsParsed = this.parseSms(trimmed);
      if (smsParsed) {
        return smsParsed;
      }
    }

    // 6. Check vCard / MECARD (Contact)
    if (trimmed.toUpperCase().startsWith('BEGIN:VCARD') || trimmed.toUpperCase().startsWith('MECARD:')) {
      const contactParsed = this.parseContact(trimmed);
      if (contactParsed) {
        return contactParsed;
      }
    }

    // 7. Check Geo location
    if (trimmed.toLowerCase().startsWith('geo:')) {
      const geoParsed = this.parseGeo(trimmed);
      if (geoParsed) {
        return geoParsed;
      }
    }

    // 8. Check Calendar event
    if (trimmed.toUpperCase().startsWith('BEGIN:VEVENT')) {
      const calParsed = this.parseCalendar(trimmed);
      if (calParsed) {
        return calParsed;
      }
    }

    // 9. Check Web URL
    if (/^https?:\/\//i.test(trimmed)) {
      const urlParsed = this.parseUrl(trimmed);
      if (urlParsed) {
        return urlParsed;
      }
    }

    // Default: Plain Text
    const textContent: TextScannedContent = {
      type: 'text',
      rawPayload,
      text: rawPayload,
    };
    return textContent;
  }

  private parseOtpAuthUri(
    uri: string
  ): TotpProvisioningTransientContent | HotpProvisioningTransientContent | null {
    try {
      // otpauth://totp/Label?parameters or otpauth://hotp/Label?parameters
      const prefixMatch = uri.match(/^otpauth:\/\/([a-zA-Z0-9]+)\/(.*)$/i);
      if (!prefixMatch) return null;

      const otpType = prefixMatch[1].toLowerCase();
      const rest = prefixMatch[2];
      const qIndex = rest.indexOf('?');

      const rawLabel = qIndex !== -1 ? rest.substring(0, qIndex) : rest;
      const queryString = qIndex !== -1 ? rest.substring(qIndex + 1) : '';

      const decodedLabel = decodeURIComponent(rawLabel);
      let issuer = '';
      let accountName = decodedLabel;

      if (decodedLabel.includes(':')) {
        const parts = decodedLabel.split(':');
        issuer = parts[0].trim();
        accountName = parts.slice(1).join(':').trim();
      }

      const params = new URLSearchParams(queryString);
      const secret = (params.get('secret') || '').replace(/\s+/g, '').toUpperCase();
      if (!secret) return null;

      const paramIssuer = params.get('issuer');
      if (paramIssuer) {
        issuer = paramIssuer.trim();
      }

      const digits = parseInt(params.get('digits') || '6', 10);
      const algoStr = (params.get('algorithm') || 'SHA1').toUpperCase();
      const algorithm = (['SHA1', 'SHA256', 'SHA512'].includes(algoStr) ? algoStr : 'SHA1') as
        | 'SHA1'
        | 'SHA256'
        | 'SHA512';

      if (otpType === 'totp') {
        const period = parseInt(params.get('period') || '30', 10);
        return {
          type: 'totp_provisioning',
          rawPayload: uri,
          issuer: issuer || 'Unknown',
          accountName: accountName || 'Account',
          secret,
          algorithm,
          digits: isNaN(digits) ? 6 : digits,
          period: isNaN(period) ? 30 : period,
        };
      } else if (otpType === 'hotp') {
        const counter = parseInt(params.get('counter') || '0', 10);
        return {
          type: 'hotp_provisioning',
          rawPayload: uri,
          issuer: issuer || 'Unknown',
          accountName: accountName || 'Account',
          secret,
          algorithm,
          digits: isNaN(digits) ? 6 : digits,
          counter: isNaN(counter) ? 0 : counter,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  private parseWifi(payload: string): WifiScannedContent | null {
    // WIFI:T:WPA;S:MyNetwork;P:MyPassword;H:false;;
    const content = payload.slice(5);
    const parts = splitWifiFields(content);
    let ssid = '';
    let encryption = 'nopass';
    let password: string | undefined;
    let hidden = false;

    for (const part of parts) {
      if (part.startsWith('S:')) {
        ssid = unescapeWifi(part.slice(2));
      } else if (part.startsWith('T:')) {
        encryption = part.slice(2) || 'nopass';
      } else if (part.startsWith('P:')) {
        password = unescapeWifi(part.slice(2));
      } else if (part.startsWith('H:')) {
        hidden = part.slice(2).toLowerCase() === 'true';
      }
    }

    if (!ssid) return null;

    return {
      type: 'wifi',
      rawPayload: payload,
      ssid,
      encryption,
      password,
      hidden,
    };
  }

  private parseUrl(urlStr: string): UrlScannedContent | null {
    try {
      const parsed = new URL(urlStr);
      return {
        type: 'url',
        rawPayload: urlStr,
        url: urlStr,
        domain: parsed.hostname || urlStr,
      };
    } catch {
      const match = urlStr.match(/^https?:\/\/([^\/]+)/i);
      const domain = match ? match[1] : urlStr;
      return {
        type: 'url',
        rawPayload: urlStr,
        url: urlStr,
        domain,
      };
    }
  }

  private parseEmail(payload: string): EmailScannedContent | null {
    if (payload.toLowerCase().startsWith('mailto:')) {
      try {
        const withoutPrefix = payload.slice(7);
        const [recipient, query] = withoutPrefix.split('?');
        const params = new URLSearchParams(query || '');
        return {
          type: 'email',
          rawPayload: payload,
          recipient: decodeURIComponent(recipient || ''),
          subject: params.get('subject') || undefined,
          body: params.get('body') || undefined,
        };
      } catch {
        return null;
      }
    }

    if (payload.toUpperCase().startsWith('MATMSG:')) {
      const matchTo = payload.match(/TO:([^;]*)/i);
      const matchSub = payload.match(/SUB:([^;]*)/i);
      const matchBody = payload.match(/BODY:([^;]*)/i);
      if (matchTo && matchTo[1]) {
        return {
          type: 'email',
          rawPayload: payload,
          recipient: matchTo[1].trim(),
          subject: matchSub ? matchSub[1].trim() : undefined,
          body: matchBody ? matchBody[1].trim() : undefined,
        };
      }
    }
    return null;
  }

  private parsePhone(payload: string): PhoneScannedContent | null {
    const phoneNumber = payload.replace(/^(tel|telprompt):/i, '').trim();
    if (!phoneNumber) return null;
    return {
      type: 'phone',
      rawPayload: payload,
      phoneNumber,
    };
  }

  private parseSms(payload: string): SmsScannedContent | null {
    if (payload.toLowerCase().startsWith('smsto:')) {
      const withoutPrefix = payload.slice(6);
      const parts = withoutPrefix.split(':');
      const phoneNumber = parts[0];
      const message = parts.slice(1).join(':') || undefined;
      return {
        type: 'sms',
        rawPayload: payload,
        phoneNumber: decodeURIComponent(phoneNumber || ''),
        message: message ? decodeURIComponent(message) : undefined,
      };
    }

    const withoutPrefix = payload.replace(/^sms:/i, '');
    const [phoneNumber, query] = withoutPrefix.split('?');
    const params = new URLSearchParams(query || '');
    const message = params.get('body') || undefined;

    return {
      type: 'sms',
      rawPayload: payload,
      phoneNumber: decodeURIComponent(phoneNumber || ''),
      message,
    };
  }

  private parseContact(payload: string): ContactScannedContent | null {
    if (payload.toUpperCase().startsWith('BEGIN:VCARD')) {
      const lines = payload.split(/\r?\n/);
      let name = 'Unknown Contact';
      let phone: string | undefined;
      let email: string | undefined;
      let org: string | undefined;

      for (const line of lines) {
        const trimmed = line.trim();
        if (/^FN:/i.test(trimmed)) {
          name = trimmed.slice(3).trim();
        } else if (/^TEL(;[^:]*)?:/i.test(trimmed)) {
          const colonIdx = trimmed.indexOf(':');
          phone = trimmed.slice(colonIdx + 1).trim();
        } else if (/^EMAIL(;[^:]*)?:/i.test(trimmed)) {
          const colonIdx = trimmed.indexOf(':');
          email = trimmed.slice(colonIdx + 1).trim();
        } else if (/^ORG:/i.test(trimmed)) {
          org = trimmed.slice(4).trim();
        }
      }

      return {
        type: 'contact',
        rawPayload: payload,
        name,
        phone,
        email,
        organization: org,
      };
    }

    if (payload.toUpperCase().startsWith('MECARD:')) {
      const matchName = payload.match(/N:([^;]*)/i);
      const matchTel = payload.match(/TEL:([^;]*)/i);
      const matchEmail = payload.match(/EMAIL:([^;]*)/i);
      const matchOrg = payload.match(/ORG:([^;]*)/i);

      const name = matchName ? matchName[1].replace(',', ' ').trim() : 'Unknown Contact';
      return {
        type: 'contact',
        rawPayload: payload,
        name,
        phone: matchTel ? matchTel[1].trim() : undefined,
        email: matchEmail ? matchEmail[1].trim() : undefined,
        organization: matchOrg ? matchOrg[1].trim() : undefined,
      };
    }

    return null;
  }

  private parseGeo(payload: string): LocationScannedContent | null {
    const match = payload.match(/^geo:([-+]?\d*\.?\d+),([-+]?\d*\.?\d+)/i);
    if (!match) return null;

    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (isNaN(lat) || isNaN(lng)) return null;

    return {
      type: 'location',
      rawPayload: payload,
      latitude: lat,
      longitude: lng,
    };
  }

  private parseCalendar(payload: string): CalendarScannedContent | null {
    const lines = payload.split(/\r?\n/);
    let title = 'Calendar Event';
    let startDate: string | undefined;
    let endDate: string | undefined;
    let location: string | undefined;
    let description: string | undefined;

    for (const line of lines) {
      const trimmed = line.trim();
      if (/^SUMMARY:/i.test(trimmed)) {
        title = trimmed.slice(8).trim();
      } else if (/^DTSTART:/i.test(trimmed)) {
        startDate = trimmed.slice(8).trim();
      } else if (/^DTEND:/i.test(trimmed)) {
        endDate = trimmed.slice(6).trim();
      } else if (/^LOCATION:/i.test(trimmed)) {
        location = trimmed.slice(9).trim();
      } else if (/^DESCRIPTION:/i.test(trimmed)) {
        description = trimmed.slice(12).trim();
      }
    }

    return {
      type: 'calendar_event',
      rawPayload: payload,
      title,
      startDate,
      endDate,
      location,
      description,
    };
  }
}

function unescapeWifi(value: string): string {
  return value.replace(/\\([\\;,:\"])/g, '$1');
}

function splitWifiFields(value: string): string[] {
  const fields: string[] = [];
  let current = '';
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '\\' && index + 1 < value.length) {
      current += character + value[index + 1];
      index += 1;
    } else if (character === ';') {
      fields.push(current);
      current = '';
    } else {
      current += character;
    }
  }
  fields.push(current);
  return fields;
}
