import React, { FC, memo, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Modal,
    FlatList,
} from 'react-native';


export type UserType = 'HOME' | 'ELECTRIC' | 'SHOP';

interface Props {
    value: UserType;
    onChange: (v: UserType) => void;
}

type Option = {
    label: string;
    value: UserType;
    icon: string;
    description: string;
};

const OPTIONS: Option[] = [
    {
        value: 'HOME',
        label: 'Home',
        icon: '🏠',
        description: 'Personal deliveries',
    },
    {
        value: 'ELECTRIC',
        label: 'Electric',
        icon: '⚡',
        description: 'EV-based logistics',
    },
    {
        value: 'SHOP',
        label: 'Shop',
        icon: '🛍️',
        description: 'Business shipments',
    },
];

const UserTypeSelector: FC<Props> = ({ value, onChange }) => {
    const [visible, setVisible] = useState(false);

    const selected = OPTIONS.find(o => o.value === value);

    const open = useCallback(() => setVisible(true), []);
    const close = useCallback(() => setVisible(false), []);

    const handleSelect = useCallback(
        (v: UserType) => {
            onChange(v);
            close();
        },
        [onChange, close]
    );

    const renderItem = ({ item }: { item: Option }) => {
        const active = item.value === value;

        return (
            <Pressable
                onPress={() => handleSelect(item.value)}
                style={({ pressed }) => [
                    styles.option,
                    active && styles.optionActive,
                    pressed && styles.pressed,
                ]}
            >
                <Text style={styles.icon}>{item.icon}</Text>

                <View style={styles.textWrap}>
                    <Text style={styles.label}>{item.label}</Text>
                    <Text style={styles.desc}>{item.description}</Text>
                </View>

                {active && <Text style={styles.check}>✓</Text>}
            </Pressable>
        );
    };

    return (
        <>
            {/* Trigger */}
            <Pressable onPress={open} style={styles.trigger}>
                <Text style={styles.triggerLabel}>Account Type</Text>

                <View style={styles.triggerContent}>
                    <Text style={styles.icon}>{selected?.icon}</Text>
                    <Text style={styles.triggerText}>{selected?.label}</Text>
                </View>
            </Pressable>

            {/* Modal */}
            <Modal

                visible={visible}
                animationType="slide"
                transparent
                onRequestClose={close}
            >
                <Pressable style={styles.overlay} onPress={close} />

                <View style={styles.sheet}>
                    <View style={styles.handle} />

                    <Text style={styles.title}>Select Account Type</Text>

                    <FlatList
                        data={OPTIONS}
                        keyExtractor={i => i.value}
                        renderItem={renderItem}
                        contentContainerStyle={styles.list}
                    />
                </View>
            </Modal>
        </>
    );
};

export default memo(UserTypeSelector);


const styles = StyleSheet.create({
    trigger: {
        backgroundColor: '#fff',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },

    triggerLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 6,
    },

    triggerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },

    triggerText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },

    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.35)',
    },

    sheet: {
        backgroundColor: '#fff',
        paddingTop: 12,
        paddingBottom: 24,
        paddingHorizontal: 16,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
    },

    handle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#D1D5DB',
        alignSelf: 'center',
        marginBottom: 12,
    },

    title: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 10,
        color: '#111827',
    },

    list: {
        gap: 10,
    },

    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
        backgroundColor: '#F9FAFB',
    },

    optionActive: {
        backgroundColor: '#EEF2FF',
        borderWidth: 1,
        borderColor: '#2B3FD4',
    },

    pressed: {
        opacity: 0.7,
    },

    icon: {
        fontSize: 20,
        marginRight: 12,
    },

    textWrap: {
        flex: 1,
    },

    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#111827',
    },

    desc: {
        fontSize: 12,
        color: '#6B7280',
    },

    check: {
        fontSize: 16,
        color: '#2B3FD4',
        fontWeight: '700',
    },
});