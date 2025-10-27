import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Truck, Box } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import FONTS from '../../utils/fonts';


import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type SplashScreenProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;
const WORDS = ['Kalanabha', 'Logistics', 'Transport', 'Supply Chain'];
const LETTER_DELAY = 170;
const WORD_DELAY = 1000;

const Splash = () => {
    const navigation = useNavigation<SplashScreenProp>();
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');

    const opacityAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        let timeoutIds: NodeJS.Timeout[] = [];

        const animateWord = (word: string) => {
            setDisplayedText('');

            word.split('').forEach((char, index) => {
                const timeout = setTimeout(() => {
                    setDisplayedText((prev) => prev + char);

                    opacityAnim.setValue(0);
                    translateYAnim.setValue(10);

                    Animated.parallel([
                        Animated.timing(opacityAnim, {
                            toValue: 1,
                            duration: 250,
                            useNativeDriver: true,
                        }),
                        Animated.timing(translateYAnim, {
                            toValue: 0,
                            duration: 250,
                            useNativeDriver: true,
                        }),
                    ]).start();

                    // Last letter logic
                    if (index === word.length - 1) {
                        const nextWordTimeout = setTimeout(() => {
                            if (currentWordIndex === WORDS.length - 1) {
                                // Finished all words → navigate
                                navigation.replace('SelectAccount');
                            } else {
                                setCurrentWordIndex((prev) => prev + 1);
                            }
                        }, WORD_DELAY);
                        timeoutIds.push(nextWordTimeout);
                    }
                }, index * LETTER_DELAY);

                timeoutIds.push(timeout);
            });
        };

        animateWord(WORDS[currentWordIndex]);

        return () => {
            timeoutIds.forEach(clearTimeout);
        };
    }, [currentWordIndex]);

    const renderIcon = () => {
        const word = WORDS[currentWordIndex].toLowerCase();
        if (word.includes('logistics')) return <Truck color="#fff" width={36} height={36} />;
        if (word.includes('transport')) return <Truck color="#fff" width={36} height={36} />;
        if (word.includes('supply')) return <Box color="#fff" width={36} height={36} />;
        return null;
    };

    return (
        <View style={styles.container}>
            {renderIcon()}
            <Animated.Text
                style={[
                    styles.text,
                    { opacity: opacityAnim, transform: [{ translateY: translateYAnim }] },
                ]}
            >
                {displayedText}
            </Animated.Text>
        </View>
    );
};

export default Splash;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F25912',
        gap: 16,
    },
    text: {
        fontFamily: FONTS.BOLD_PRIMARY,
        fontSize: 40,
        letterSpacing: 2,
        color: '#fff',
    },
});
