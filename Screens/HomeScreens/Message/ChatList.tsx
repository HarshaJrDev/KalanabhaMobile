import React from 'react';
import { FlatList, View } from 'react-native';
import ChatListItem, { ChatListItemProps } from './ChatListItem';

export interface ChatListProps {
    data: ChatListItemProps[];
    onPressItem?: (item: ChatListItemProps) => void;
}

const ChatList: React.FC<ChatListProps> = ({ data, onPressItem }) => {
    const renderItem = ({ item }: { item: ChatListItemProps }) => (
        <ChatListItem
            {...item}
            onPress={() => onPressItem?.(item)}
        />
    );

    return (
        <View>
            <FlatList
                data={data}
                renderItem={renderItem}
                keyExtractor={(_, index) => index.toString()}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
};

export default ChatList;
