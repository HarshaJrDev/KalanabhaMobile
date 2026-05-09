import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import Header from '../../components/Header'
import ChatList from './Message/ChatList';

const message = () => {
    const chatData = [
        {
            name: 'John Doe',
            message: 'Hey, are you free today?',
            image: 'https://randomuser.me/api/portraits/men/32.jpg',
            seen: false,
        },
        {
            name: 'Jane Smith',
            message: 'Let’s catch up tomorrow!',
            image: 'https://randomuser.me/api/portraits/women/44.jpg',
            seen: true,
        },
    ];
    return (
        <View>
            <Header />
            <ChatList

                data={chatData}
                onPressItem={(item) => console.log('Tapped:', item.name)}
            />

        </View>
    )
}

export default message

const styles = StyleSheet.create({})