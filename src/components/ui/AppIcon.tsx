import React, { FC, memo } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { colors } from '@config/theme';

export interface AppIconProps {
    icon: LucideIcon;
    size?: number;
    color?: string;
    strokeWidth?: number;
}

// Every screen currently imports lucide icons directly and repeats the same
// `size={..} color={..}` pair inline. This doesn't replace those imports
// (that would mean touching every screen) — it gives new/migrating code one
// place to get the app's default icon size/color from, instead of guessing.
const DEFAULT_SIZE = 20;

const AppIcon: FC<AppIconProps> = ({ icon: Icon, size = DEFAULT_SIZE, color = colors.TEXT_SECONDARY, strokeWidth }) => (
    <Icon size={size} color={color} strokeWidth={strokeWidth} />
);

export default memo(AppIcon);
