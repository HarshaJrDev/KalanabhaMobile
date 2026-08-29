import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Send } from 'lucide-react-native';
import { useChatMessages, useChatSocket, useSendMessage } from '@features/chat/hooks';
import { useAuthStore } from '@features/store/authStore';
import { AsyncState } from '@components/AsyncState';
import type { RootStackParamList } from '../navigation/types';

// Screen -> useChatMessages/useSendMessage/useChatSocket -> chat.api ->
// GET/POST /shipments/:id/messages (+ live via ChatGateway) -> UI.
// "Chat Support" on ShipmentDetailsScreen opens this — the same shipment
// chat backend LogisticsCardList's inline driver panel already uses.
const ShipmentChatScreen = () => {
    const navigation = useNavigation();
    const route = useRoute<RouteProp<RootStackParamList, 'ShipmentChat'>>();
    const shipmentId = route.params?.shipmentId;
    const currentUserId = useAuthStore((s) => s.user?.id);

    const { data: messages, isLoading, error, refetch } = useChatMessages(shipmentId);
    useChatSocket(shipmentId);
    const { mutate: sendMessage, isPending: sending } = useSendMessage(shipmentId ?? '');

    const [text, setText] = useState('');

    const handleSend = () => {
        const trimmed = text.trim();
        if (!trimmed || !shipmentId) return;
        sendMessage(trimmed);
        setText('');
    };

    return (
        <KeyboardAvoidingView style={styles.container} behavior={Platform.select({ ios: 'padding' })}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={10}>
                    <ArrowLeft color="#111827" size={22} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Shipment Chat</Text>
                <View style={{ width: 22 }} />
            </View>

            <AsyncState
                isLoading={isLoading}
                error={error}
                onRetry={refetch}
                isEmpty={!messages?.length}
                emptyTitle="No messages yet"
                emptyMessage="Send a message to the driver or admin about this shipment."
            >
                <FlatList
                    data={messages ?? []}
                    keyExtractor={(m) => m.id}
                    contentContainerStyle={styles.list}
                    renderItem={({ item }) => {
                        const mine = item.senderId === currentUserId;
                        return (
                            <View style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
                                    {!mine && <Text style={styles.senderName}>{item.senderName}</Text>}
                                    <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.text}</Text>
                                </View>
                            </View>
                        );
                    }}
                />
            </AsyncState>

            <View style={styles.inputRow}>
                <TextInput
                    style={styles.input}
                    value={text}
                    onChangeText={setText}
                    placeholder="Type a message…"
                    placeholderTextColor="#9CA3AF"
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                />
                <TouchableOpacity
                    style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
                    onPress={handleSend}
                    disabled={!text.trim() || sending}
                >
                    <Send color="#fff" size={18} />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

export default ShipmentChatScreen;

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F9FA' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: '#fff',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#E5E7EB',
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
    list: { padding: 16, gap: 8 },
    bubbleRow: { flexDirection: 'row' },
    bubbleRowMine: { justifyContent: 'flex-end' },
    bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
    bubbleOther: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
    bubbleMine: { backgroundColor: '#2563EB' },
    senderName: { fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 2 },
    bubbleText: { fontSize: 14, color: '#111827' },
    bubbleTextMine: { color: '#fff' },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        backgroundColor: '#fff',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#E5E7EB',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 20,
        paddingHorizontal: 16,
        height: 40,
        fontSize: 14,
        color: '#111827',
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2563EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendBtnDisabled: { opacity: 0.5 },
});
