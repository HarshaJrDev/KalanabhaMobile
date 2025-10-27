import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import COLOR from '../../utils/color';
import { H, S } from '../../utils/responsive';
import FONTS from '../../utils/fonts';
import InputField from '../../components/InputField';
import Button from '../../components/Button';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type LoginScreenProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const SOCIAL_LOGINS = [
    {
        name: 'Google',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg',
        color: '#DB4437',
    },
    {
        name: 'Facebook',
        logo: 'https://upload.wikimedia.org/wikipedia/commons/0/05/Facebook_Logo_%282019%29.png',
        color: '#4267B2',
    },
];

const Login = () => {
    const navigation = useNavigation<LoginScreenProp>();
    const [rememberMe, setRememberMe] = useState(false);

    const handleSocialLogin = (provider: string) => {
        console.log('Login with', provider);
        // Integrate social login SDKs here
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>Sign in</Text>
                <Text style={styles.subtitle}>Welcome back! Please enter your details.</Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
                <InputField label="Email" placeholder="Enter your email" />
                <InputField label="Password" placeholder="Enter your password" secure />

                {/* Remember me + forgot password */}
                <View style={styles.row}>
                    <TouchableOpacity
                        style={styles.rememberContainer}
                        onPress={() => setRememberMe(!rememberMe)}
                    >
                        <View
                            style={[
                                styles.checkbox,
                                {
                                    backgroundColor: rememberMe ? COLOR.TEXT_SECONDARY : 'transparent',
                                    borderColor: rememberMe ? COLOR.PRIMARY : COLOR.PRIMARY,
                                },
                            ]}
                        />
                        <Text style={styles.rememberText}>Remember me</Text>
                    </TouchableOpacity>

                    <TouchableOpacity>
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>
                </View>

                {/* Login button */}
                <Button title="Login" onPress={() => navigation.navigate('Home')} />

                {/* Social logins */}
                <Text style={styles.socialTitle}>Or login with</Text>
                <View style={styles.socialContainer}>
                    {SOCIAL_LOGINS.map((social) => (
                        <TouchableOpacity
                            key={social.name}
                            style={[styles.socialButton, { backgroundColor: social.color }]}
                            onPress={() => handleSocialLogin(social.name)}
                        >
                            <Image
                                source={{ uri: social.logo }}
                                style={styles.socialLogo}
                                resizeMode="contain"
                            />
                            <Text style={styles.socialText}>{social.name}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Sign Up */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    Don't have an account?{' '}
                    <Text
                        style={styles.signUp}
                        onPress={() => navigation.navigate('SelectAccount')}
                    >
                        Sign Up
                    </Text>
                </Text>
            </View>
        </View>
    );
};

export default Login;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLOR.TEXT_PRIMARY,
        alignItems: 'center',
    },
    header: {
        width: '100%',
        backgroundColor: COLOR.PRIMARY,
        justifyContent: 'center',
        height: H(150),
        borderRadius: 10,
        paddingHorizontal: S(10),
        paddingTop: S(20),
    },
    title: {
        color: COLOR.TEXT_PRIMARY,
        fontSize: 20,
        fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    subtitle: {
        color: COLOR.TEXT_PRIMARY,
        fontSize: 14,
        fontFamily: FONTS.MEDIUM_PRIMARY,
        marginTop: S(5),
    },
    form: {
        width: '90%',
        borderRadius: 10,
        paddingHorizontal: S(10),
        paddingVertical: S(20),

    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: S(10),
    },
    rememberContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 20,
        height: 20,
        borderWidth: 1,
        borderRadius: 4,
        marginRight: 8,
    },
    rememberText: {
        color: COLOR.BACKGROUND,
        fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    forgotText: {
        color: COLOR.PRIMARY,
        fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    socialTitle: {
        textAlign: 'center',
        fontFamily: FONTS.MEDIUM_PRIMARY,
        fontSize: 14,
        color: COLOR.TEXT_PRIMARY,
        marginTop: H(20),
    },
    socialContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: H(10),
    },
    socialButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: S(10),
        paddingVertical: S(8),
        borderRadius: 6,
    },
    socialLogo: {
        width: 20,
        height: 20,
        marginRight: S(8),
    },
    socialText: {
        color: COLOR.TEXT_PRIMARY,
        fontFamily: FONTS.MEDIUM_PRIMARY,
        fontSize: 14,
    },
    footer: {
        marginTop: H(20),
    },
    footerText: {
        color: COLOR.TEXT_SECONDARY,
        fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    signUp: {
        color: COLOR.PRIMARY,
        fontFamily: FONTS.BOLD_PRIMARY,
    },
});
