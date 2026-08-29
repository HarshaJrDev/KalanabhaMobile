import React from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { LucideIcon } from 'lucide-react-native';

interface ProfileInfoItem {
    label: string;
    value: string;
    icon: keyof typeof import('lucide-react-native');
}

interface ProfileNavItem {
    label: string;
    icon: keyof typeof import('lucide-react-native');
    onPress?: () => void;
}

interface ProfileProps {
    name: string;
    bio?: string;
    avatarUrl?: string;
    info?: ProfileInfoItem[];
    navItems?: ProfileNavItem[];
}

const ProfileCom: React.FC<ProfileProps> = ({
    name,
    bio,
    avatarUrl,
    info = [],
    navItems = [],
}) => {
    const Icon = ({ name, size = 20, color = '#333' }: { name: string; size?: number; color?: string }) => {
        const LucideIconComponent = (require('lucide-react-native')[name] as LucideIcon) || null;
        if (!LucideIconComponent) return null;
        return <LucideIconComponent size={size} color={color} />;
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Image
                    source={
                        avatarUrl
                            ? { uri: avatarUrl }
                            : null
                    }
                    style={styles.avatar}
                />
                <View>
                    <Text style={styles.name}>{name}</Text>
                    {bio && <Text style={styles.bio}>{bio}</Text>}
                </View>
            </View>

            {/* Navigation */}
            <View style={styles.navContainer}>
                {navItems.map((item, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={styles.navButton}
                        onPress={item.onPress}
                        activeOpacity={0.7}
                    >
                        <Icon name={item.icon} size={20} color="#111" />
                        <Text style={styles.navLabel}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Info Section */}
            <View style={styles.infoContainer}>
                {info.map((item, idx) => (
                    <View key={idx} style={styles.infoRow}>
                        <Icon name={item.icon} size={22} color="#555" />
                        <View style={styles.infoText}>
                            <Text style={styles.infoLabel}>{item.label}</Text>
                            <Text style={styles.infoValue}>{item.value}</Text>
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
};

export default ProfileCom;

const styles = StyleSheet.create({
    container: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
    },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 35,
        marginRight: 16,
        backgroundColor: '#ddd',
    },
    name: {
        fontSize: 20,
        fontWeight: '600',
        color: '#111',
    },
    bio: {
        fontSize: 14,
        color: '#666',
    },
    navContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 16,
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f3f3',
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 10,
        marginBottom: 10,
    },
    navLabel: {
        marginLeft: 6,
        fontSize: 14,
        color: '#111',
    },
    infoContainer: {
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    infoText: {
        marginLeft: 10,
    },
    infoLabel: {
        fontSize: 13,
        color: '#777',
    },
    infoValue: {
        fontSize: 15,
        color: '#111',
    },
});
