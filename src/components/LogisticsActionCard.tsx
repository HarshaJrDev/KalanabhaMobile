// LogisticsActionCard.tsx
import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { S } from "@utils/responsive";
import FONTS from "@utils/fonts";
import COLOR from "@utils/color";

type Props = {
    title: string;
    icon: string;
    onPress: () => void;
};

const LogisticsActionCard: React.FC<Props> = ({ title, icon, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image source={{ uri: icon }} style={styles.icon} resizeMode="contain" />
            <Text style={styles.cardText}>{title}</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        width: S(90),
        height: S(100),
        borderRadius: S(10),
        marginRight: S(5),
        alignItems: "center",
        justifyContent: "center",
    },
    icon: {
        width: S(25),
        height: S(25),
        marginBottom: S(8),
    },
    cardText: {
        fontSize: 13,
        fontFamily: FONTS.PRIMARY,
        textAlign: "center",
        color: COLOR.TEXT_SECONDARY,
    },
});

export default LogisticsActionCard;
