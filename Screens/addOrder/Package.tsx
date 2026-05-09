import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import CustomLabel from '../../components/CustomLabel'
import ShipmentCard from '../../components/ShipmentCard';
import TruckSelector from '../../components/TruckSelector';

interface PackageProps {
    onNext?: () => void; // ✅ add this prop
}


const Package: React.FC<PackageProps> = ({ onNext }) => {
    return (
        <View>
            <CustomLabel label='Package Details' />

            <ShipmentCard
                from="123 Main St, Cityville"
                to="456 Market St, Townsville"
                shipmentType="truck"
                status="Coming"
                ShipmentStatus="#12345"
                label="Order #12345"
                date="Oct 26, 2025"

            />

            {/* <View>
                <TruckSelector />

            </View> */}



        </View>
    )
}

export default Package

const styles = StyleSheet.create({})