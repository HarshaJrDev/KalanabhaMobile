import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import COLOR from '../../utils/color';
import { H, S } from '../../utils/responsive';
import CustomInput from '../../components/CustomInput';
import { LocateFixedIcon, ArrowLeft } from 'lucide-react-native';
import CustomLabel from '../../components/CustomLabel';
import Button from '../../components/Button';
import ModalSelectInput from '../../components/BottomSheetSelectInput';
import ShipmentResultModal from '../../components/ShipmentResultModal';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import FONTS from '../../utils/fonts';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'CheckRate'>;

const CheckRate = () => {
    const navigation = useNavigation<NavigationProp>();
    const [modalVisible, setModalVisible] = useState(false);

    const trucksData = [
        { type: 'Mini Truck', price: 'Rs.120' },
        { type: 'Medium Truck', price: 'Rs.220' },
        { type: 'Heavy Trailer', price: 'Rs.500' },
    ];

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color="#fff" size={24} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Check Rate</Text>
            </View>

            <ScrollView
                style={styles.formWrapper}
                contentContainerStyle={styles.formContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Pickup & Destination Inputs */}
                <View style={styles.inputGroup}>
                    <CustomInput
                        placeholder="Pick up Location"
                        rightIcon={LocateFixedIcon}
                    />
                    <CustomInput
                        placeholder="Package Destination"
                        rightIcon={LocateFixedIcon}
                    />
                </View>

                <ModalSelectInput
                    label="Shipment Type"
                    placeholder="Select shipment type"
                    options={['Air Freight', 'Sea Freight', 'Road Logistics']}
                    onSelect={(value) => console.log('Selected:', value)}
                    required
                />

                {/* Item Weight */}
                <CustomLabel label="Item Weight" required />
                <CustomInput placeholder="Enter Item Weight" keyboardType="numeric" />

                {/* Result Modal */}
                <ShipmentResultModal
                    visible={modalVisible}
                    onClose={() => setModalVisible(false)}
                    pickupLocation="Bangalore"
                    destination="Delhi"
                    trucks={trucksData}
                    onCreateShipment={() => {
                        setModalVisible(false);
                        console.log('Navigate to Create Shipment screen');
                    }}
                />

                {/* Button */}
                <View style={styles.buttonWrapper}>
                    <Button title="Check" onPress={() => setModalVisible(true)} />
                </View>
            </ScrollView>
        </View>
    );
};

export default CheckRate;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fb',
    },
    header: {
        backgroundColor: COLOR.PRIMARY,
        height: H(140),
        borderBottomLeftRadius: S(15),
        borderBottomRightRadius: S(15),
        paddingHorizontal: S(15),
        paddingTop: S(40),
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        padding: S(5),
        marginRight: S(10),
    },
    headerTitle: {
        fontSize: 20,
        color: '#fff',
        fontFamily: FONTS.PRIMARY
    },
    formWrapper: {
        flex: 1,
        marginTop: -S(30), // overlap effect
    },
    formContent: {
        paddingHorizontal: S(15),
        paddingTop: S(25),
        paddingBottom: S(40),
        rowGap: S(20),
        backgroundColor: '#fff',
        borderTopLeftRadius: S(20),
        borderTopRightRadius: S(20),
        minHeight: '100%',
    },
    inputGroup: {
        rowGap: S(15),
    },
    buttonWrapper: {
        marginTop: S(10),
    },
});
