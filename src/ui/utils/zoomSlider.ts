export const MIN_ZOOM = 1;
export const MAX_ZOOM = 5;

export function clampZoom(value: number): number {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, value));
}

export function zoomFromTrackPosition(position: number, trackWidth: number): number {
  if (!Number.isFinite(trackWidth) || trackWidth <= 0) return MIN_ZOOM;
  const ratio = Math.max(0, Math.min(1, position / trackWidth));
  return Number((MIN_ZOOM + ratio * (MAX_ZOOM - MIN_ZOOM)).toFixed(1));
}

/** Use gesture delta from a stable starting value so re-renders cannot move the thumb. */
export function zoomFromGesture(startZoom: number, deltaX: number, trackWidth: number): number {
  if (!Number.isFinite(trackWidth) || trackWidth <= 0) return clampZoom(startZoom);
  return Number(clampZoom(startZoom + (deltaX / trackWidth) * (MAX_ZOOM - MIN_ZOOM)).toFixed(1));
}
