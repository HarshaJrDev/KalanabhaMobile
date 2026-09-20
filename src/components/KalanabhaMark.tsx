import React, { useRef } from 'react';
import Svg, { Defs, LinearGradient, Stop, Path, Circle } from 'react-native-svg';

// The real Kalanabha logomark — a K monogram with a road/route lane-line
// running through the lower stroke and a map pin at the upper tip. Same
// shape as the app icon (android/ios) and the website/admin favicon —
// glyph only, no background square, so it drops into whatever colored
// badge/box a screen already renders it inside (Splash's orange box,
// Login's translucent glass badge). `color` renders a flat single-color
// version (used on already-colored badges); omit it to get the real
// gradient + pin treatment.
let uidSeq = 0;

export const KalanabhaMark = ({ size = 30, color }: { size?: number; color?: string }) => {
    const id = useRef(`km-${uidSeq++}`).current;
    const flat = !!color;
    const strokeColor = flat ? color : `url(#${id}-k)`;
    const pinFill = flat ? color : `url(#${id}-pin)`;
    const pinCore = flat ? '#0B0B0D' : '#fff';

    return (
        <Svg width={size} height={size} viewBox="0 0 100 100">
            {!flat && (
                <Defs>
                    <LinearGradient id={`${id}-k`} gradientUnits="userSpaceOnUse" x1="16" y1="10" x2="80" y2="90">
                        <Stop offset="0%" stopColor="#FF9A4D" />
                        <Stop offset="100%" stopColor="#E9600A" />
                    </LinearGradient>
                    <LinearGradient id={`${id}-pin`} gradientUnits="userSpaceOnUse" x1="76" y1="6" x2="76" y2="40">
                        <Stop offset="0%" stopColor="#FF9A4D" />
                        <Stop offset="100%" stopColor="#E9600A" />
                    </LinearGradient>
                </Defs>
            )}
            <Path d="M 30 16 L 30 84" stroke={strokeColor} strokeWidth={13} strokeLinecap="round" fill="none" />
            <Path d="M 30 50 L 64 16" stroke={strokeColor} strokeWidth={13} strokeLinecap="round" fill="none" />
            <Path d="M 30 52 L 66 84" stroke={strokeColor} strokeWidth={13} strokeLinecap="round" fill="none" />
            {!flat && (
                <Path d="M 34 56 L 62 82" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeDasharray="6 6.5" opacity={0.92} fill="none" />
            )}
            <Path
                d="M 76 6 C 84 6 90 12 90 20 C 90 29 76 40 76 40 C 76 40 62 29 62 20 C 62 12 68 6 76 6 Z"
                fill={pinFill}
            />
            <Circle cx={76} cy={19} r={5} fill={pinCore} />
        </Svg>
    );
};
