import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ViewStyle,
    TextStyle,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { LucideIcon } from "lucide-react-native";
import FONTS from "../utils/fonts";
import COLOR from "../utils/color";
import { S } from "../utils/responsive";

export interface TabItem {
    key: string;
    label: string;
    icon?: LucideIcon;
    route?: string; // optional route name for navigation
}

interface StatusTabsProps {
    tabs: TabItem[];
    activeKey?: string;
    onChange?: (key: string) => void;
    containerStyle?: ViewStyle;
    tabTextStyle?: TextStyle;
    activeColor?: string;
    inactiveColor?: string;
}

export const StatusTabs: React.FC<StatusTabsProps> = ({
    tabs,
    activeKey,
    onChange,
    containerStyle,
    tabTextStyle,
    activeColor = COLOR.PRIMARY,
    inactiveColor = "#6B7280",
}) => {
    const navigation = useNavigation<any>();
    const [internalActive, setInternalActive] = useState(activeKey || tabs[0].key);
    const currentActive = activeKey ?? internalActive;

    const handlePress = (tab: TabItem) => {
        setInternalActive(tab.key);
        onChange?.(tab.key);
        if (tab.route) {
            navigation.navigate(tab.route);
        }
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {tabs.map((tab) => {
                const isActive = tab.key === currentActive;
                const color = isActive ? "#fff" : inactiveColor;
                const Icon = tab.icon;

                return (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tabButton,
                            { backgroundColor: isActive ? activeColor : "#F3F4F6" },
                        ]}
                        onPress={() => handlePress(tab)}
                        activeOpacity={0.8}
                    >

                        <Text style={[styles.tabText, tabTextStyle, { color }]}>{tab.label}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingVertical: S(10),
        marginVertical: S(20),
        marginHorizontal: S(15)

    },
    tabButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: S(20),
        paddingVertical: S(8),
        paddingHorizontal: S(16),
    },
    tabText: {
        fontSize: 14,
        marginLeft: S(6),
        fontFamily: FONTS.MEDIUM_PRIMARY,
    },
});
