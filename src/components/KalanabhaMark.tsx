import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

// The real Kalanabha logomark — a K monogram built from two route
// strokes meeting a vertical spine, with a solid dot at the upper tip
// standing in for a delivery pin/destination marker. Same shape as the
// app icon (android/ios) and the website/admin favicon — glyph only, no
// background square, so it drops into whatever colored badge/box a
// screen already renders it inside (Splash's orange box, Login's
// translucent glass badge).
export const KalanabhaMark = ({ size = 30, color = '#fff' }: { size?: number; color?: string }) => (
    <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d="M 34 22 L 34 78" stroke={color} strokeWidth={14} strokeLinecap="round" fill="none" />
        <Path d="M 34 50 L 66 22" stroke={color} strokeWidth={14} strokeLinecap="round" fill="none" />
        <Path d="M 34 52 L 68 80" stroke={color} strokeWidth={14} strokeLinecap="round" fill="none" />
        <Circle cx={66} cy={22} r={9} fill={color} />
    </Svg>
);
