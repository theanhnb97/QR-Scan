import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Geometry mirrors assets/source-v2/icons/icon-manifest.json and its SVG sources.
export type AppIconName =
  | 'scan'
  | 'history'
  | 'authenticator'
  | 'create'
  | 'settings'
  | 'flash'
  | 'gallery'
  | 'share'
  | 'copy'
  | 'favorite'
  | 'delete'
  | 'edit'
  | 'plus'
  | 'close'
  | 'back'
  | 'chevronRight'
  | 'more';

export const APP_ICON_SIZES = {
  tab: 23,
  header: 21,
  action: 20,
  compact: 18,
} as const;

interface AppIconProps {
  name: AppIconName;
  color: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

const strokeProps = {
  fill: 'none' as const,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  strokeWidth: 1.8,
};

export const AppIcon: React.FC<AppIconProps> = ({ name, color, size = 22, style }) => {
  const common = { stroke: color, ...strokeProps };
  let content: React.ReactNode;

  switch (name) {
    case 'scan':
      content = <><Path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3" {...common} /><Rect x="8" y="8" width="3" height="3" rx="0.3" {...common} /><Rect x="13" y="8" width="3" height="3" rx="0.3" {...common} /><Rect x="8" y="13" width="3" height="3" rx="0.3" {...common} /><Path d="M14 14h2v2h-2z" {...common} /></>;
      break;
    case 'history':
      content = <><Path d="M4.5 7.5A8 8 0 1 1 4 14" {...common} /><Path d="M4 4v4h4M12 8v4l3 2" {...common} /></>;
      break;
    case 'authenticator':
      content = <><Path d="M12 3l7 3v5c0 4.6-2.8 8.2-7 10-4.2-1.8-7-5.4-7-10V6z" {...common} /><Circle cx="12" cy="11" r="2" {...common} /><Path d="M12 13v3" {...common} /></>;
      break;
    case 'create':
      content = <><Path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M4 15v3a2 2 0 0 0 2 2h3M16 17h5M18.5 14.5v5" {...common} /><Rect x="8" y="8" width="3" height="3" {...common} /><Rect x="13" y="8" width="3" height="3" {...common} /><Rect x="8" y="13" width="3" height="3" {...common} /></>;
      break;
    case 'settings':
      content = <><Circle cx="12" cy="12" r="3" {...common} /><Path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 3.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H2V9.6h.1A1.7 1.7 0 0 0 3.6 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8 3.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V2h4v.1A1.7 1.7 0 0 0 15 3.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 8c.2.38.5.73.9 1 .3.2.7.35 1.1.4h.1v4h-.1c-.4.05-.8.2-1.1.4-.4.27-.7.62-.9 1.2z" {...common} /></>;
      break;
    case 'flash':
      content = <Path d="M13 2L5 13h6l-1 9 8-12h-6z" {...common} />;
      break;
    case 'gallery':
      content = <><Rect x="3" y="4" width="18" height="16" rx="2" {...common} /><Circle cx="8" cy="9" r="1.5" {...common} /><Path d="M21 15l-5-5-8 8" {...common} /></>;
      break;
    case 'share':
      content = <><Circle cx="18" cy="5" r="2" {...common} /><Circle cx="6" cy="12" r="2" {...common} /><Circle cx="18" cy="19" r="2" {...common} /><Path d="M8 11l8-5M8 13l8 5" {...common} /></>;
      break;
    case 'copy':
      content = <><Rect x="8" y="8" width="11" height="11" rx="2" {...common} /><Path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" {...common} /></>;
      break;
    case 'favorite':
      content = <Path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z" {...common} />;
      break;
    case 'delete':
      content = <Path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" {...common} />;
      break;
    case 'edit':
      content = <Path d="M4 20h4l11-11-4-4L4 16zM13.5 6.5l4 4" {...common} />;
      break;
    case 'plus':
      content = <Path d="M12 5v14M5 12h14" {...common} />;
      break;
    case 'close':
      content = <Path d="M6 6l12 12M18 6L6 18" {...common} />;
      break;
    case 'back':
      content = <Path d="M15 18l-6-6 6-6" {...common} />;
      break;
    case 'chevronRight':
      content = <Path d="M9 18l6-6-6-6" {...common} />;
      break;
    case 'more':
      content = <><Circle cx="5" cy="12" r="1.2" fill={color} /><Circle cx="12" cy="12" r="1.2" fill={color} /><Circle cx="19" cy="12" r="1.2" fill={color} /></>;
      break;
  }

  return <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>{content}</Svg>;
};
