
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import COLOR from '@utils/color';
import { S } from '@utils/responsive';
import FONTS from '@utils/fonts';

interface AppHeaderProps {
    title: string;
    showBackButton?: boolean;
}

const AppHeader: React.FC<AppHeaderProps> = ({ title, showBackButton = true }) => {
    const navigation = useNavigation();

    return (
        <View style={styles.container}>
            {showBackButton && (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft color="#000" size={24} />
                </TouchableOpacity>
            )}
            <Text style={styles.title}>{title}</Text>
        </View>
    );
};

export default AppHeader;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: S(15),
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backBtn: {
        marginRight: S(15),
    },
    title: {
        fontSize: 18,
        fontFamily: FONTS.MEDIUM_PRIMARY,
        color: COLOR.TEXT_SECONDARY,
    },
});
