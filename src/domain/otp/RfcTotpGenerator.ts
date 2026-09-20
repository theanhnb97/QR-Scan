import { OtpAlgorithm } from '../models/AuthenticatorAccount';
import { decodeBase32 } from './Base32';

// Pure JS SHA-1 and HMAC implementation for 100% portable Hermes / React Native / Node compatibility without native module dependencies.

function sha1(message: Uint8Array): Uint8Array {
  // Pre-processing
  const msgLen = message.length;
  const bitLen = msgLen * 8;

  // Append '1' bit (0x80 byte) and pad with 0s until length == 56 mod 64
  const rem = (msgLen + 9) % 64;
  const padLen = rem === 0 ? 0 : 64 - rem;
  const totalLen = msgLen + 1 + padLen + 8;
  const buffer = new Uint8Array(totalLen);
  buffer.set(message);
  buffer[msgLen] = 0x80;

  // Append original bit length as 64-bit big endian integer
  const view = new DataView(buffer.buffer);
  view.setUint32(totalLen - 4, bitLen, false);

  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const w = new Uint32Array(80);

  for (let i = 0; i < totalLen; i += 64) {
    for (let j = 0; j < 16; j++) {
      w[j] = view.getUint32(i + j * 4, false);
    }
    for (let j = 16; j < 80; j++) {
      const val = w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16];
      w[j] = (val << 1) | (val >>> 31);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let j = 0; j < 80; j++) {
      let f = 0;
      let k = 0;
      if (j < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (j < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (j < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (((a << 5) | (a >>> 27)) + f + e + k + w[j]) | 0;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
  }

  const out = new Uint8Array(20);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, h0, false);
  outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false);
  outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false);
  return out;
}

function sha256(message: Uint8Array): Uint8Array {
  const constants = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];
  const rem = (message.length + 9) % 64;
  const padLen = rem === 0 ? 0 : 64 - rem;
  const totalLen = message.length + 1 + padLen + 8;
  const buffer = new Uint8Array(totalLen);
  buffer.set(message);
  buffer[message.length] = 0x80;
  const view = new DataView(buffer.buffer);
  const bitLength = message.length * 8;
  view.setUint32(totalLen - 4, bitLength >>> 0, false);
  view.setUint32(totalLen - 8, Math.floor(bitLength / 0x100000000), false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let offset = 0; offset < totalLen; offset += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(offset + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h0; let b = h1; let c = h2; let d = h3; let e = h4; let f = h5; let g = h6; let h = h7;
    for (let i = 0; i < 64; i++) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + constants[i] + w[i]) | 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;
      h = g; g = f; f = e; e = (d + temp1) | 0; d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }
  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  [h0, h1, h2, h3, h4, h5, h6, h7].forEach((value, index) => outView.setUint32(index * 4, value, false));
  return out;
}

type U64 = [number, number];
const u64 = (hi: number, lo: number): U64 => [hi >>> 0, lo >>> 0];
const add64 = (a: U64, b: U64): U64 => {
  const lo = (a[1] + b[1]) >>> 0;
  const carry = lo < a[1] ? 1 : 0;
  return u64((a[0] + b[0] + carry) >>> 0, lo);
};
const xor64 = (a: U64, b: U64): U64 => u64(a[0] ^ b[0], a[1] ^ b[1]);
const and64 = (a: U64, b: U64): U64 => u64(a[0] & b[0], a[1] & b[1]);
const not64 = (a: U64): U64 => u64(~a[0], ~a[1]);
const rotr64 = (x: U64, n: number): U64 => {
  if (n === 32) return u64(x[1], x[0]);
  if (n < 32) return u64((x[0] >>> n) | (x[1] << (32 - n)), (x[1] >>> n) | (x[0] << (32 - n)));
  const shift = n - 32;
  return u64((x[1] >>> shift) | (x[0] << (32 - shift)), (x[0] >>> shift) | (x[1] << (32 - shift)));
};
const shr64 = (x: U64, n: number): U64 => {
  if (n === 0) return x;
  if (n < 32) return u64(x[0] >>> n, (x[1] >>> n) | (x[0] << (32 - n)));
  if (n === 32) return u64(0, x[0]);
  return u64(0, x[0] >>> (n - 32));
};

function sha512(message: Uint8Array): Uint8Array {
  const constants: U64[] = [
    [0x428a2f98, 0xd728ae22], [0x71374491, 0x23ef65cd], [0xb5c0fbcf, 0xec4d3b2f], [0xe9b5dba5, 0x8189dbbc],
    [0x3956c25b, 0xf348b538], [0x59f111f1, 0xb605d019], [0x923f82a4, 0xaf194f9b], [0xab1c5ed5, 0xda6d8118],
    [0xd807aa98, 0xa3030242], [0x12835b01, 0x45706fbe], [0x243185be, 0x4ee4b28c], [0x550c7dc3, 0xd5ffb4e2],
    [0x72be5d74, 0xf27b896f], [0x80deb1fe, 0x3b1696b1], [0x9bdc06a7, 0x25c71235], [0xc19bf174, 0xcf692694],
    [0xe49b69c1, 0x9ef14ad2], [0xefbe4786, 0x384f25e3], [0x0fc19dc6, 0x8b8cd5b5], [0x240ca1cc, 0x77ac9c65],
    [0x2de92c6f, 0x592b0275], [0x4a7484aa, 0x6ea6e483], [0x5cb0a9dc, 0xbd41fbd4], [0x76f988da, 0x831153b5],
    [0x983e5152, 0xee66dfab], [0xa831c66d, 0x2db43210], [0xb00327c8, 0x98fb213f], [0xbf597fc7, 0xbeef0ee4],
    [0xc6e00bf3, 0x3da88fc2], [0xd5a79147, 0x930aa725], [0x06ca6351, 0xe003826f], [0x14292967, 0x0a0e6e70],
    [0x27b70a85, 0x46d22ffc], [0x2e1b2138, 0x5c26c926], [0x4d2c6dfc, 0x5ac42aed], [0x53380d13, 0x9d95b3df],
    [0x650a7354, 0x8baf63de], [0x766a0abb, 0x3c77b2a8], [0x81c2c92e, 0x47edaee6], [0x92722c85, 0x1482353b],
    [0xa2bfe8a1, 0x4cf10364], [0xa81a664b, 0xbc423001], [0xc24b8b70, 0xd0f89791], [0xc76c51a3, 0x0654be30],
    [0xd192e819, 0xd6ef5218], [0xd6990624, 0x5565a910], [0xf40e3585, 0x5771202a], [0x106aa070, 0x32bbd1b8],
    [0x19a4c116, 0xb8d2d0c8], [0x1e376c08, 0x5141ab53], [0x2748774c, 0xdf8eeb99], [0x34b0bcb5, 0xe19b48a8],
    [0x391c0cb3, 0xc5c95a63], [0x4ed8aa4a, 0xe3418acb], [0x5b9cca4f, 0x7763e373], [0x682e6ff3, 0xd6b2b8a3],
    [0x748f82ee, 0x5defb2fc], [0x78a5636f, 0x43172f60], [0x84c87814, 0xa1f0ab72], [0x8cc70208, 0x1a6439ec],
    [0x90befffa, 0x23631e28], [0xa4506ceb, 0xde82bde9], [0xbef9a3f7, 0xb2c67915], [0xc67178f2, 0xe372532b],
    [0xca273ece, 0xea26619c], [0xd186b8c7, 0x21c0c207], [0xeada7dd6, 0xcde0eb1e], [0xf57d4f7f, 0xee6ed178],
    [0x06f067aa, 0x72176fba], [0x0a637dc5, 0xa2c898a6], [0x113f9804, 0xbef90dae], [0x1b710b35, 0x131c471b],
    [0x28db77f5, 0x23047d84], [0x32caab7b, 0x40c72493], [0x3c9ebe0a, 0x15c9bebc], [0x431d67c4, 0x9c100d4c],
    [0x4cc5d4be, 0xcb3e42b6], [0x597f299c, 0xfc657e2a], [0x5fcb6fab, 0x3ad6faec], [0x6c44198c, 0x4a475817],
  ];
  const rem = (message.length + 17) % 128;
  const padLen = rem === 0 ? 0 : 128 - rem;
  const totalLen = message.length + 1 + padLen + 16;
  const buffer = new Uint8Array(totalLen);
  buffer.set(message);
  buffer[message.length] = 0x80;
  const view = new DataView(buffer.buffer);
  const bitLength = message.length * 8;
  view.setUint32(totalLen - 4, bitLength >>> 0, false);
  view.setUint32(totalLen - 8, Math.floor(bitLength / 0x100000000), false);
  const state: U64[] = [
    u64(0x6a09e667, 0xf3bcc908), u64(0xbb67ae85, 0x84caa73b), u64(0x3c6ef372, 0xfe94f82b), u64(0xa54ff53a, 0x5f1d36f1),
    u64(0x510e527f, 0xade682d1), u64(0x9b05688c, 0x2b3e6c1f), u64(0x1f83d9ab, 0xfb41bd6b), u64(0x5be0cd19, 0x137e2179),
  ];
  const w: U64[] = Array.from({ length: 80 }, () => u64(0, 0));
  for (let offset = 0; offset < totalLen; offset += 128) {
    for (let i = 0; i < 16; i++) w[i] = u64(view.getUint32(offset + i * 8, false), view.getUint32(offset + i * 8 + 4, false));
    for (let i = 16; i < 80; i++) {
      const x = w[i - 15]; const y = w[i - 2];
      const s0 = xor64(xor64(rotr64(x, 1), rotr64(x, 8)), shr64(x, 7));
      const s1 = xor64(xor64(rotr64(y, 19), rotr64(y, 61)), shr64(y, 6));
      w[i] = add64(add64(add64(w[i - 16], s0), w[i - 7]), s1);
    }
    let [a, b, c, d, e, f, g, h] = state.map((item) => [...item] as U64);
    for (let i = 0; i < 80; i++) {
      const s1 = xor64(xor64(rotr64(e, 14), rotr64(e, 18)), rotr64(e, 41));
      const ch = xor64(and64(e, f), and64(not64(e), g));
      const temp1 = add64(add64(add64(add64(h, s1), ch), constants[i]), w[i]);
      const s0 = xor64(xor64(rotr64(a, 28), rotr64(a, 34)), rotr64(a, 39));
      const maj = xor64(xor64(and64(a, b), and64(a, c)), and64(b, c));
      const temp2 = add64(s0, maj);
      h = g; g = f; f = e; e = add64(d, temp1); d = c; c = b; b = a; a = add64(temp1, temp2);
    }
    const round = [a, b, c, d, e, f, g, h];
    for (let i = 0; i < 8; i++) state[i] = add64(state[i], round[i]);
  }
  const out = new Uint8Array(64);
  const outView = new DataView(out.buffer);
  state.forEach((item, index) => { outView.setUint32(index * 8, item[0], false); outView.setUint32(index * 8 + 4, item[1], false); });
  return out;
}

type HashFunction = (message: Uint8Array) => Uint8Array;

function hmac(key: Uint8Array, message: Uint8Array, hash: HashFunction, blockSize: number): Uint8Array {
  let keyBlock = new Uint8Array(blockSize);

  if (key.length > blockSize) {
    const hashed = hash(key);
    keyBlock.set(hashed);
  } else {
    keyBlock.set(key);
  }

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);

  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = keyBlock[i] ^ 0x5c;
    iKeyPad[i] = keyBlock[i] ^ 0x36;
  }

  const innerMsg = new Uint8Array(iKeyPad.length + message.length);
  innerMsg.set(iKeyPad);
  innerMsg.set(message, iKeyPad.length);
  const innerHash = hash(innerMsg);

  const outerMsg = new Uint8Array(oKeyPad.length + innerHash.length);
  outerMsg.set(oKeyPad);
  outerMsg.set(innerHash, oKeyPad.length);
  return hash(outerMsg);
}

export class RfcTotpGenerator {
  /**
   * Generates HOTP code as defined in RFC 4226
   */
  static generateHotp(
    secretBase32: string,
    counter: number,
    digits = 6,
    algorithm: OtpAlgorithm = 'SHA1'
  ): string {
    const key = decodeBase32(secretBase32);

    // Counter as 8-byte big-endian integer
    const counterBytes = new Uint8Array(8);
    const view = new DataView(counterBytes.buffer);
    // Javascript numbers are 53-bit integers safe up to Number.MAX_SAFE_INTEGER
    const high = Math.floor(counter / 0x100000000);
    const low = counter >>> 0;
    view.setUint32(0, high, false);
    view.setUint32(4, low, false);

    const hash = algorithm === 'SHA256' ? sha256 : algorithm === 'SHA512' ? sha512 : sha1;
    const hmacResult = hmac(key, counterBytes, hash, algorithm === 'SHA512' ? 128 : 64);

    // Dynamic truncation
    const offset = hmacResult[hmacResult.length - 1] & 0x0f;
    const binary =
      ((hmacResult[offset] & 0x7f) << 24) |
      ((hmacResult[offset + 1] & 0xff) << 16) |
      ((hmacResult[offset + 2] & 0xff) << 8) |
      (hmacResult[offset + 3] & 0xff);

    const otp = binary % Math.pow(10, digits);
    return otp.toString().padStart(digits, '0');
  }

  /**
   * Generates TOTP code as defined in RFC 6238
   */
  static generateTotp(
    secretBase32: string,
    timestampMs = Date.now(),
    period = 30,
    digits = 6,
    algorithm: OtpAlgorithm = 'SHA1'
  ): string {
    const counter = Math.floor(timestampMs / 1000 / period);
    return RfcTotpGenerator.generateHotp(secretBase32, counter, digits, algorithm);
  }

  /**
   * Calculate remaining seconds in current period based on epoch time
   */
  static getRemainingSeconds(timestampMs = Date.now(), period = 30): number {
    const elapsed = Math.floor(timestampMs / 1000) % period;
    return period - elapsed;
  }
}
