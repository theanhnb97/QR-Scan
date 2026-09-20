function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function hexToRgb(color: string): [number, number, number] {
  const normalized = color.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((channel) => channel + channel).join('')
    : normalized;
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function rgbToHex([red, green, blue]: [number, number, number]): string {
  return `#${[red, green, blue].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;
}

/** Turn the OTP accent red only during the final 40% of its period. */
export function getOtpCountdownColor(remaining: number, period: number, baseColor: string, dangerColor: string): string {
  const remainingRatio = clamp(remaining / Math.max(1, period), 0, 1);
  const urgency = clamp((0.4 - remainingRatio) / 0.4, 0, 1);
  const base = hexToRgb(baseColor);
  const danger = hexToRgb(dangerColor);
  return rgbToHex([
    base[0] + (danger[0] - base[0]) * urgency,
    base[1] + (danger[1] - base[1]) * urgency,
    base[2] + (danger[2] - base[2]) * urgency,
  ]);
}
