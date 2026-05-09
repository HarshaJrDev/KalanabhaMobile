import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import CustomInput from '../../components/CustomInput'
import { QrCode, Search } from 'lucide-react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const SearchScreen = () => {
    return (
        <SafeAreaView>
            <CustomInput

                isEnable={true}
                placeholder="Search Tracking ID"
                leftIcon={Search}
                onRightIconPress={() => console.log("Open QR Scanner")}
                autoCapitalize="none"
                returnKeyType="search"
                onSubmitEditing={(e) => console.log("Search: ", e.nativeEvent.text)}
            />
        </SafeAreaView>
    )
}

export default SearchScreen

const styles = StyleSheet.create({})