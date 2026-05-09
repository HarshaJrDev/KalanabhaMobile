// components/ShipmentResultModal.tsx
import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { S } from '../utils/responsive';
import COLOR from '../utils/color';
import FONTS from '../utils/fonts';

type ShipmentResultModalProps = {
    visible: boolean;
    onClose: () => void;
    pickupLocation: string;
    destination: string;
    trucks: { type: string; price: string }[];
    onCreateShipment: () => void;
};

const ShipmentResultModal: React.FC<ShipmentResultModalProps> = ({
    visible,
    onClose,
    pickupLocation,
    destination,
    trucks,
    onCreateShipment,
}) => {
    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            {/* Overlay */}
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

            {/* Bottom Sheet */}
            <View style={styles.sheetContainer}>
                <View style={styles.headerBar} />
                <Text style={styles.title}>Shipment Summary</Text>

                <View style={styles.infoBox}>
                    <Text style={styles.label}>Pickup Location:</Text>
                    <Text style={styles.value}>{pickupLocation}</Text>

                    <Text style={styles.label}>Destination:</Text>
                    <Text style={styles.value}>{destination}</Text>
                </View>

                <Text style={styles.subTitle}>Available Trucks & Pricing</Text>

                <ScrollView style={{ maxHeight: S(200) }} showsVerticalScrollIndicator={false}>
                    {trucks.map((truck, index) => (
                        <View key={index} style={styles.truckItem}>
                            <Text style={styles.truckType}>{truck.type}</Text>
                            <Text style={styles.truckPrice}>{truck.price}</Text>
                        </View>
                    ))}
                </ScrollView>

                {/* Create Shipment Button */}
                <TouchableOpacity style={styles.createButton} onPress={onCreateShipment}>
                    <Text style={styles.createButtonText}>Create Shipment</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

export default ShipmentResultModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheetContainer: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        backgroundColor: '#fff',
        borderTopLeftRadius: S(20),
        borderTopRightRadius: S(20),
        padding: S(20),
        paddingBottom: S(30),
    },
    headerBar: {
        width: S(50),
        height: S(5),
        backgroundColor: '#ccc',
        borderRadius: 5,
        alignSelf: 'center',
        marginBottom: S(15),
    },
    title: {
        fontSize: 18,
        fontFamily: FONTS.BOLD_PRIMARY,
        textAlign: 'center',
        marginBottom: S(15),
    },
    infoBox: {
        marginBottom: S(20),
    },
    label: {
        fontSize: 14,
        fontFamily: FONTS.MEDIUM_PRIMARY,
        color: '#555',
    },
    value: {
        fontSize: 15,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#000',
        marginBottom: S(10),
    },
    subTitle: {
        fontSize: 16,
        fontFamily: FONTS.BOLD_PRIMARY,
        marginBottom: S(10),
    },
    truckItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: S(12),
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    truckType: {
        fontSize: 15,
        fontFamily: FONTS.PRIMARY,
    },
    truckPrice: {
        fontSize: 15,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: COLOR.PRIMARY,
    },
    createButton: {
        backgroundColor: COLOR.PRIMARY,
        borderRadius: S(10),
        paddingVertical: S(14),
        marginTop: S(15),
    },
    createButtonText: {
        textAlign: 'center',
        fontSize: 16,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#fff',
    },
});
