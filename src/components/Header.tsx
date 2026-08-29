import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import COLOR from '@utils/color';
import { H } from '@utils/responsive';
import { ArrowLeft } from 'lucide-react-native';
import FONTS from '@utils/fonts';



type RootStackParamList = {
    ShipmentDetailsScreen: { shipmentId?: number };
    HomeScreen: undefined;
    [key: string]: object | undefined; // fallback for dynamic routes
};

interface HeaderProps {
    title?: string;
    subtitle?: string;
    backgroundColor?: string;
    height?: number;
    showBack?: boolean;
    backScreen?: keyof RootStackParamList;
    params?: object;
    containerStyle?: ViewStyle;
}

const Header: React.FC<HeaderProps> = ({
    title = '',
    subtitle = '',
    backgroundColor = COLOR.PRIMARY,
    height = H(110),
    showBack = true,
    backScreen,
    params = {},
    containerStyle,
}) => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const lastPress = useRef<number>(0);

    const handleBackPress = () => {
        const now = Date.now();
        if (now - lastPress.current < 1000) return; // Prevent double navigation
        lastPress.current = now;

        if (backScreen) {
            navigation.navigate(backScreen, params);
        } else {
            navigation.goBack();
        }
    };

    return (
        <View style={[styles.container, { backgroundColor, height }, containerStyle]}>
            {showBack && (
                <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                    <ArrowLeft />
                </TouchableOpacity>
            )}

            <View style={styles.textContainer}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
        </View>
    );
};

export default Header;

const styles = StyleSheet.create({
    container: {
        width: '100%',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingBottom: 12,
        position: 'relative',
    },
    backButton: {
        position: 'absolute',
        top: 50,
        left: 16,
        padding: 8,
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        color: 'white',
        fontSize: 20,
        fontFamily: FONTS.BOLD_PRIMARY
    },
    subtitle: {
        color: 'white',
        fontSize: 14,
        marginTop: 4,
        fontFamily: FONTS.BOLD_PRIMARY
    },
});
