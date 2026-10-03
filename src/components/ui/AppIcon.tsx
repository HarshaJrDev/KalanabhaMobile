import React, { FC, memo } from 'react';
import type { LucideIcon } from 'lucide-react-native';
import { useAppTheme } from '@theme/ThemeContext';

export interface AppIconProps {
    icon: LucideIcon;
    size?: number;
    color?: string;
    strokeWidth?: number;
}







const DEFAULT_SIZE = 20;

const AppIcon: FC<AppIconProps> = ({ icon: Icon, size = DEFAULT_SIZE, color, strokeWidth }) => {
    const { colors } = useAppTheme();
    return <Icon size={size} color={color ?? colors.TEXT_SECONDARY} strokeWidth={strokeWidth} />;
};

export default memo(AppIcon);
