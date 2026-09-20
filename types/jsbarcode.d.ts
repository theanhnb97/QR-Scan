declare module 'jsbarcode/bin/barcodes/CODE128/CODE128B' {
  export default class Code128B {
    constructor(value: string, options?: { text?: string; ean128?: boolean });
    encode(): { data: string; text: string };
  }
}

declare module 'react-native-view-shot/lib/index.js' {
  export function captureRef(target: unknown, options?: { format?: string; quality?: number; result?: string }): Promise<string>;
}
