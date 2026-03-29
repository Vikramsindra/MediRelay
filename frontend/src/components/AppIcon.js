import React from 'react';
import Svg, { Path, Circle, Line } from 'react-native-svg';

export function AppIcon({ name, size = 18, color = '#111827', strokeWidth = 2 }) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill: 'none',
  };

  switch (name) {
    case 'back':
    case 'chevron-left':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M15 18l-6-6 6-6" {...common} />
        </Svg>
      );
    case 'chevron-right':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M9 18l6-6-6-6" {...common} />
        </Svg>
      );
    case 'chevron-up':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M6 15l6-6 6 6" {...common} />
        </Svg>
      );
    case 'chevron-down':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M6 9l6 6 6-6" {...common} />
        </Svg>
      );
    case 'close':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Line x1="18" y1="6" x2="6" y2="18" {...common} />
          <Line x1="6" y1="6" x2="18" y2="18" {...common} />
        </Svg>
      );
    case 'warning':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" {...common} />
          <Line x1="12" y1="9" x2="12" y2="13" {...common} />
          <Circle cx="12" cy="17" r="1" fill={color} stroke="none" />
        </Svg>
      );
    case 'check':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M20 6L9 17l-5-5" {...common} />
        </Svg>
      );
    case 'mic':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3z" {...common} />
          <Path d="M19 11a7 7 0 0 1-14 0" {...common} />
          <Path d="M12 18v3" {...common} />
          <Path d="M8 21h8" {...common} />
        </Svg>
      );
    case 'plus':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M12 5v14" {...common} />
          <Path d="M5 12h14" {...common} />
        </Svg>
      );
    case 'home':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M3 10.5L12 3l9 7.5" {...common} />
          <Path d="M5 10v10h14V10" {...common} />
        </Svg>
      );
    case 'users':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="9" cy="8" r="3" {...common} />
          <Path d="M3.5 19a5.5 5.5 0 0 1 11 0" {...common} />
          <Circle cx="17" cy="9" r="2.5" {...common} />
          <Path d="M14.5 19a4.5 4.5 0 0 1 6 0" {...common} />
        </Svg>
      );
    case 'clock':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="12" r="9" {...common} />
          <Path d="M12 7v6l4 2" {...common} />
        </Svg>
      );
    case 'profile':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Circle cx="12" cy="8" r="4" {...common} />
          <Path d="M4 20a8 8 0 0 1 16 0" {...common} />
        </Svg>
      );
    case 'camera':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M4 7h4l1.5-2h5L16 7h4a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1z" {...common} />
          <Circle cx="12" cy="13" r="4" {...common} />
        </Svg>
      );
    case 'link':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M10 14l4-4" {...common} />
          <Path d="M8.5 8.5l-2 2a3 3 0 0 0 4.2 4.2l2-2" {...common} />
          <Path d="M15.5 15.5l2-2a3 3 0 1 0-4.2-4.2l-2 2" {...common} />
        </Svg>
      );
    case 'clipboard':
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <Path d="M9 4h6" {...common} />
          <Path d="M9 4a2 2 0 0 0-2 2v0h10v0a2 2 0 0 0-2-2" {...common} />
          <Path d="M7 6H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1" {...common} />
        </Svg>
      );
    default:
      return null;
  }
}
