// NotificationCard.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bell, CheckCircle, AlertTriangle, Info } from 'lucide-react-native';
import FONTS from '../utils/fonts';
import { S } from '../utils/responsive';
import COLOR from '../utils/color';

export type NotificationType = 'info' | 'success' | 'warning';

export interface NotificationCardProps {
    title: string;
    message: string;
    date?: string;
    type?: NotificationType;
    onPress?: () => void;
}

const ICONS: Record<NotificationType, React.FC<{ color: string; width: number; height: number }>> = {
    info: Info,
    success: CheckCircle,
    warning: AlertTriangle,
};

const NotificationCard: React.FC<NotificationCardProps> = ({
    title,
    message,
    date,
    type = 'info',
    onPress,
}) => {
    const IconComponent = ICONS[type];

    const getTypeColor = () => {
        switch (type) {
            case 'success':
                return COLOR.SUCCESS;
            case 'warning':
                return COLOR.WARNING;
            case 'info':
            default:
                return COLOR.PRIMARY;
        }
    };

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
            <View style={styles.row}>
                <IconComponent color={getTypeColor()} width={24} height={24} />
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                </View>
                {date && <Text style={styles.date}>{date}</Text>}
            </View>
        </TouchableOpacity>
    );
};

export default NotificationCard;

const styles = StyleSheet.create({
    card: {
        padding: S(16),
        borderRadius: S(12),
        marginVertical: S(8),
        marginHorizontal: S(12),
        borderWidth: 0.5,
        borderColor: COLOR.GRAY,
        backgroundColor: COLOR.BACKGROUND,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    textContainer: {
        flex: 1,
        marginLeft: S(12),
    },
    title: {
        fontFamily: FONTS.MEDIUM_PRIMARY,
        fontSize: 14,
        color: COLOR.TEXT_PRIMARY,
        marginBottom: S(4),
    },
    message: {
        fontFamily: FONTS.PRIMARY,
        fontSize: 13,
        color: COLOR.TEXT_SECONDARY,
    },
    date: {
        fontSize: 12,
        fontFamily: FONTS.PRIMARY,
        color: COLOR.GRAY,
        marginLeft: S(8),
    },
});
