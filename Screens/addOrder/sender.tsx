import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    Switch,
} from 'react-native';
import CustomInput from '../../components/CustomInput';
import CustomLabel from '../../components/CustomLabel';
import FONTS from '../../utils/fonts';
import { ChevronDown } from 'lucide-react-native';
import Button from '../../components/Button';

interface SenderProps {
    onNext?: () => void; // ✅ add this prop
}

const Sender: React.FC<SenderProps> = ({ onNext }) => {
    const [isBusiness, setIsBusiness] = useState(false);
    const [pickupType, setPickupType] = useState('Home');
    const [packageType, setPackageType] = useState('Documents');

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* 🧍 Sender Details */}
            <Text style={styles.sectionTitle}>Sender Details</Text>

            <CustomLabel label="Full Name" />
            <CustomInput placeholder="Enter sender name" />

            <CustomLabel label="Mobile Number" />
            <CustomInput placeholder="Enter mobile number" keyboardType="phone-pad" />

            <CustomLabel label="Email Address" />
            <CustomInput placeholder="Enter email" keyboardType="email-address" />

            <View style={styles.switchRow}>
                <Text style={styles.switchText}>Is this a business sender?</Text>
                <Switch
                    value={isBusiness}
                    onValueChange={setIsBusiness}
                    thumbColor={isBusiness ? '#25D366' : '#f4f3f4'}
                    trackColor={{ false: '#ccc', true: '#b2f5c5' }}
                />
            </View>

            {isBusiness && (
                <>
                    <CustomLabel label="Company Name" />
                    <CustomInput placeholder="Enter company name" />
                </>
            )}

            {/* 📍 Pickup Address */}
            <Text style={styles.sectionTitle}>Pickup Address</Text>

            <CustomLabel label="Address Line 1" />
            <CustomInput placeholder="Flat / Building / Street" />

            <CustomLabel label="Address Line 2" />
            <CustomInput placeholder="Landmark / Area (optional)" />

            <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                    <CustomLabel label="City" />
                    <CustomInput placeholder="Enter city" />
                </View>
                <View style={{ flex: 1 }}>
                    <CustomLabel label="Pincode" />
                    <CustomInput placeholder="Enter pincode" keyboardType="numeric" />
                </View>
            </View>

            <CustomLabel label="Pickup Type" />
            <TouchableOpacity style={styles.optionBox}>
                <Text style={styles.optionText}>{pickupType}</Text>
                <ChevronDown size={18} color="#333" />
            </TouchableOpacity>

            {/* 📦 Package Details */}
            <Text style={styles.sectionTitle}>Package Details</Text>

            <CustomLabel label="Package Type" />
            <TouchableOpacity style={styles.optionBox}>
                <Text style={styles.optionText}>{packageType}</Text>
                <ChevronDown size={18} color="#333" />
            </TouchableOpacity>

            <CustomLabel label="Weight (kg)" />
            <CustomInput placeholder="Enter weight" keyboardType="numeric" />

            <CustomLabel label="Remarks (optional)" />
            <CustomInput placeholder="Any special instructions" multiline />

            {/* ✅ Submit Button */}
            <Button title="Save Sender Details" onPress={onNext} />
        </ScrollView>
    );
};

export default Sender;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 16,
        display: 'flex',
        width: '100%'
    },
    sectionTitle: {
        fontSize: 18,
        fontFamily: FONTS.BOLD_PRIMARY,
        color: '#222',
        marginBottom: 10,
        marginTop: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    switchText: {
        fontSize: 14,
        color: '#333',
        fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    optionBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 10,
    },
    optionText: {
        fontSize: 15,
        color: '#444',
    },
    submitBtn: {
        marginTop: 20,
        backgroundColor: '#25D366',
        borderRadius: 30,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    submitText: {
        color: '#fff',
        fontSize: 16,
        fontFamily: FONTS.BOLD_PRIMARY,
    },
});
