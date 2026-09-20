import { getOtpCountdownColor } from '../src/ui/utils/otpVisuals';
import { zoomFromGesture, zoomFromTrackPosition } from '../src/ui/utils/zoomSlider';

describe('scanner and authenticator UI helpers', () => {
  it('keeps zoom gesture calculations stable when the slider re-renders', () => {
    expect(zoomFromTrackPosition(50, 100)).toBe(3);
    expect(zoomFromGesture(3, 25, 100)).toBe(4);
    expect(zoomFromGesture(3, -100, 100)).toBe(1);
    expect(zoomFromGesture(3, 300, 100)).toBe(5);
  });

  it('keeps the normal OTP accent until the final part of the period', () => {
    expect(getOtpCountdownColor(30, 30, '#4F6BFF', '#F06A6A')).toBe('#4f6bff');
    expect(getOtpCountdownColor(0, 30, '#4F6BFF', '#F06A6A')).toBe('#f06a6a');
  });
});
