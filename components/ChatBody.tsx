import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Image,
} from 'react-native';
import { Send, Phone } from 'lucide-react-native';
import COLOR from '../utils/color';

interface Message {
    id: string;
    text: string;
    sender: 'me' | 'other';
    time: string;
}

interface ChatBodyProps {
    name: string;
    image: string;
    messages?: Message[];
    onSend?: (message: Message) => void;
    onCallPress?: () => void;
}

const ChatBody: React.FC<ChatBodyProps> = ({
    name,
    image,
    messages = [],
    onSend,
    onCallPress,
}) => {
    const [chatMessages, setChatMessages] = useState<Message[]>(messages);
    const [inputText, setInputText] = useState('');
    const flatListRef = useRef<FlatList>(null);

    const handleSend = () => {
        if (!inputText.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'me',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setChatMessages((prev) => [...prev, newMessage]);
        setInputText('');
        onSend?.(newMessage);

        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    };

    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.sender === 'me';
        return (
            <View
                style={[
                    styles.messageWrapper,
                    isMe ? styles.myMessageWrapper : styles.theirMessageWrapper,
                ]}
            >
                <View
                    style={[
                        styles.messageBubble,
                        isMe ? styles.myBubble : styles.theirBubble,
                    ]}
                >
                    <Text style={[styles.messageText, isMe && styles.myText]}>
                        {item.text}
                    </Text>
                    <Text style={[styles.messageTime, isMe && styles.myTime]}>
                        {item.time}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={80}
        >
            {/* 🧠 HEADER */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Image source={{ uri: image }} style={styles.avatar} />
                    <Text style={styles.headerName}>{name}</Text>
                </View>
                <TouchableOpacity style={styles.callButton} onPress={onCallPress}>
                    <Phone size={22} color={COLOR.PRIMARY} />
                </TouchableOpacity>
            </View>

            {/* 💬 MESSAGES */}
            <FlatList
                ref={flatListRef}
                data={chatMessages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.chatContainer}
            />

            {/* ✏️ INPUT AREA */}
            <View style={styles.inputArea}>
                <View style={styles.inputBox}>
                    <TextInput
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Message..."
                        placeholderTextColor="#999"
                        style={styles.input}
                        multiline
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        style={[
                            styles.sendButton,
                            { opacity: inputText.trim() ? 1 : 0.5 },
                        ]}
                        disabled={!inputText.trim()}
                    >
                        <Send size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ChatBody;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f2f3f7',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
        borderColor: '#ddd',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 3,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerName: {
        fontSize: 17,
        fontWeight: '600',
        marginLeft: 10,
        color: '#222',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    callButton: {
        padding: 6,
    },
    chatContainer: {
        padding: 12,
        paddingBottom: 90,
    },
    messageWrapper: {
        marginVertical: 6,
        flexDirection: 'row',
    },
    myMessageWrapper: {
        justifyContent: 'flex-end',
    },
    theirMessageWrapper: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    myBubble: {
        backgroundColor: COLOR.PRIMARY,
        alignSelf: 'flex-end',
        borderBottomRightRadius: 4,
    },
    theirBubble: {
        backgroundColor: '#fff',
        alignSelf: 'flex-start',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        color: '#222',
    },
    myText: {
        color: '#fff',
    },
    messageTime: {
        fontSize: 11,
        color: '#999',
        textAlign: 'right',
        marginTop: 4,
    },
    myTime: {
        color: '#e5ffe7',
    },
    inputArea: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: '#f9f9f9',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderTopWidth: 0.5,
        borderColor: '#ddd',
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#fff',
        borderRadius: 30,
        paddingHorizontal: 12,
        paddingVertical: 4,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#000',
        maxHeight: 120,
    },
    sendButton: {
        backgroundColor: '#25D366',
        borderRadius: 25,
        padding: 10,
        marginLeft: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
