import React from 'react';
import { View } from 'react-native';
import ChatBody from '../../../components/ChatBody';


const ChatScreen: React.FC = () => {
    const initialMessages = [
        { id: '1', text: 'Hey! How are you?', sender: 'other', time: '10:30 AM' },
        { id: '2', text: 'I’m good, how about you?', sender: 'me', time: '10:32 AM' },
    ];

    const handleSend = (msg: any) => {
        console.log('Sent message:', msg);
    };

    return (
        <View style={{ flex: 1 }}>
            <ChatBody messages={initialMessages} onSend={handleSend} />
        </View>
    );
};

export default ChatScreen;
