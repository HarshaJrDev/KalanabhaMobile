import React from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    StyleSheet,
    ImageSourcePropType,
} from 'react-native';
import { CheckCheck, Circle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Define your navigation types
type RootStackParamList = {
    ChatScreen: {
        name: string;
        image: string | ImageSourcePropType;
    };
    // Add other screens if needed
};

export interface ChatListItemProps {
    image: string | ImageSourcePropType;
    name: string;
    message: string;
    seen?: boolean;
}

const ChatListItem: React.FC<ChatListItemProps> = ({
    image,
    name,
    message,
    seen = false,
}) => {
    const navigation =
        useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const handlePress = () => {
        navigation.navigate('ChatScreen', {
            name,
            image,
        });
    };

    return (
        <TouchableOpacity style={styles.container} onPress={handlePress}>
            <Image
                source={typeof image === 'string' ? { uri: image } : image}
                style={styles.avatar}
            />

            <View style={styles.textContainer}>
                <Text style={styles.name}>{name}</Text>
                <Text
                    style={[styles.message, !seen && styles.unseenMessage]}
                    numberOfLines={1}
                >
                    {message}
                </Text>
            </View>

            <View style={styles.statusIcon}>
                {seen ? (
                    <CheckCheck size={18} color="#4CAF50" />
                ) : (
                    <Circle size={12} color="#1E88E5" fill="#1E88E5" />
                )}
            </View>
        </TouchableOpacity>
    );
};

export default ChatListItem;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 16,
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottomWidth: 0.5,
        borderColor: '#ddd',
    },
    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: '600',
        color: '#222',
    },
    message: {
        fontSize: 14,
        color: '#555',
        marginTop: 2,
    },
    unseenMessage: {
        fontWeight: '600',
        color: '#000',
    },
    statusIcon: {
        marginLeft: 10,
    },
});
