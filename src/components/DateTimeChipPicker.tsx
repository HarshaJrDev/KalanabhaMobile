// DateTimeChipPicker.tsx
//
// Custom, themed date/time picker — deliberately not the native
// @react-native-community/datetimepicker (Android's system dialog can't
// be restyled to match the app's own colors, and pulled in a native
// module that needed a full rebuild for no visual benefit). Plain chip
// rows in whatever colors the caller passes, same interaction pattern
// everywhere it's used: addOrders.tsx's "Schedule for later" step and
// ShipmentDetailsScreen's "Change pickup time".
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Clock } from 'lucide-react-native';

export const scheduleDateOptions = (t: (key: string, opts?: Record<string, unknown>) => string) => {
    const options: { date: Date; label: string }[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        date.setHours(0, 0, 0, 0);
        const label = i === 0
            ? t('addOrder.scheduleToday')
            : i === 1
                ? t('addOrder.scheduleTomorrow')
                : date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
        options.push({ date, label });
    }
    return options;
};

export const SCHEDULE_TIME_OPTIONS: { hour: number; minute: number }[] = Array.from({ length: 27 }, (_, i) => {
    const totalMinutes = 7 * 60 + i * 30; // 7:00 AM through 8:00 PM, 30-min steps
    return { hour: Math.floor(totalMinutes / 60), minute: totalMinutes % 60 };
});

export const formatScheduleTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
};

interface DateTimeChipPickerColors {
    primary: string;
    primaryLight: string;
    text: string;
    textSecondary: string;
    border: string;
    surface: string;
}

interface DateTimeChipPickerProps {
    colors: DateTimeChipPickerColors;
    value: string; // ISO datetime, or '' if unset
    onChange: (iso: string) => void;
    t: (key: string, opts?: Record<string, unknown>) => string;
}

export const DateTimeChipPicker: React.FC<DateTimeChipPickerProps> = ({ colors, value, onChange, t }) => {
    const styles = useMemo(() => makeStyles(colors), [colors]);
    const dateOptions = useMemo(() => scheduleDateOptions(t), [t]);
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const base = value ? new Date(value) : dateOptions[0].date;
        return new Date(base.getFullYear(), base.getMonth(), base.getDate());
    });

    return (
        <>
            <Text style={styles.subLabel}>{t('addOrder.scheduleDateLabel')}</Text>
            <View style={styles.chipGrid}>
                {dateOptions.map((opt) => {
                    const isSelected = opt.date.toDateString() === selectedDate.toDateString();
                    return (
                        <TouchableOpacity
                            key={opt.date.toISOString()}
                            onPress={() => {
                                setSelectedDate(opt.date);
                                const current = value ? new Date(value) : opt.date;
                                const merged = new Date(opt.date);
                                merged.setHours(current.getHours(), current.getMinutes(), 0, 0);
                                onChange(merged.toISOString());
                            }}
                            style={[styles.chip, isSelected && styles.chipActive]}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{opt.label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <Text style={styles.subLabel}>{t('addOrder.scheduleTimeLabel')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeScroll}>
                {SCHEDULE_TIME_OPTIONS.map(({ hour, minute }) => {
                    const label = formatScheduleTime(hour, minute);
                    const current = value ? new Date(value) : null;
                    const isSelected = !!current && current.getHours() === hour && current.getMinutes() === minute;
                    return (
                        <TouchableOpacity
                            key={label}
                            onPress={() => {
                                const merged = new Date(selectedDate);
                                merged.setHours(hour, minute, 0, 0);
                                onChange(merged.toISOString());
                            }}
                            style={[styles.chip, { marginRight: 8 }, isSelected && styles.chipActive]}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{label}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {!!value && (
                <View style={styles.summaryRow}>
                    <Clock color={colors.primary} size={14} />
                    <Text style={styles.summaryText}>
                        {new Date(value).toLocaleString(undefined, {
                            weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
                        })}
                    </Text>
                </View>
            )}
        </>
    );
};

const makeStyles = (colors: DateTimeChipPickerColors) => StyleSheet.create({
    subLabel: { fontSize: 12, color: colors.textSecondary, fontFamily: 'System', marginBottom: 8, marginTop: 4, fontWeight: '600' },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    chip: {
        paddingHorizontal: 14, paddingVertical: 9,
        borderRadius: 12, borderWidth: 1.5, borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    chipText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
    chipTextActive: { color: colors.primary, fontWeight: '700' },
    timeScroll: { marginBottom: 12 },
    summaryRow: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: colors.primaryLight, borderRadius: 12,
        paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16, alignSelf: 'flex-start',
    },
    summaryText: { fontSize: 12, color: colors.primary, fontWeight: '700' },
});
