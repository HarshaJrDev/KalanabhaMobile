import React, { FC, memo } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';

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
// Default color comes from useAppTheme() so an un-colored icon still flips
// correctly in dark mode instead of staying pinned to the light palette.
const DEFAULT_SIZE = 20;

const AppIcon: FC<AppIconProps> = ({ icon: Icon, size = DEFAULT_SIZE, color, strokeWidth }) => {
    const { colors } = useAppTheme();
    return <Icon size={size} color={color ?? colors.TEXT_SECONDARY} strokeWidth={strokeWidth} />;
};

export default memo(AppIcon);
