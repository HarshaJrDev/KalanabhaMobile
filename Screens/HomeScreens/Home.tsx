import React from "react";
import { View, Text, TouchableNativeFeedback, ScrollView, StyleSheet } from "react-native";
import COLOR from "../../utils/color";
import { H, S } from "../../utils/responsive";
import { MapPin, ChevronDown, BellDotIcon } from "lucide-react-native";
import FONTS from "../../utils/fonts";
import LogisticsActionCard from "../../components/LogisticsActionCard";
import Slider from "../../components/Slider";
import ShipmentCard from "../../components/ShipmentCard";
import { RootStackParamList } from "../navigation/types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";

type HomeScreenProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const ICONS = {
    checkRate: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
    pickup: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    dropOff: "https://cdn-icons-png.flaticon.com/512/684/684908.png",
    transition: "https://cdn-icons-png.flaticon.com/512/2910/2910761.png",
    addLocation: "https://cdn-icons-png.flaticon.com/512/1828/1828817.png",
};

const actions = [
    { title: "Check Rate", icon: ICONS.checkRate, onPress: () => console.log("Check Rate pressed") },
    { title: "Pickup", icon: ICONS.pickup, onPress: () => console.log("Pickup pressed") },
    { title: "DropOff", icon: ICONS.dropOff, onPress: () => console.log("DropOff pressed") },
    { title: "Transition", icon: ICONS.transition, onPress: () => console.log("Transition pressed") },
];

const Home = () => {

    const navigation = useNavigation<HomeScreenProp>()


    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.locationRow}>
                    {/* Pin */}
                    <TouchableNativeFeedback onPress={() => console.log("Pin pressed")}>
                        <View style={styles.pinContainer}>
                            <MapPin color={COLOR.TEXT_PRIMARY} width={25} height={25} />
                        </View>
                    </TouchableNativeFeedback>

                    {/* Location Text */}
                    <View style={styles.locationTextContainer}>
                        <View style={styles.currentLocationRow}>
                            <Text style={styles.currentLocationText} numberOfLines={1} ellipsizeMode="tail">
                                Current Location
                            </Text>
                            <ChevronDown color="#fff" />
                        </View>
                        <Text style={styles.cityText} numberOfLines={1} ellipsizeMode="tail">
                            Bangalore, India
                        </Text>
                    </View>
                </View>

                {/* Notification */}
                <TouchableNativeFeedback onPress={() => navigation.navigate('Notification')}>
                    <View style={styles.notificationContainer}>
                        <BellDotIcon width={20} height={20} color={COLOR.PRIMARY} />
                    </View>
                </TouchableNativeFeedback>
            </View>

            {/* Logistics Action Cards */}
            <View style={styles.cardsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: S(10) }}>
                    {actions.map((action) => (
                        <LogisticsActionCard key={action.title} title={action.title} icon={action.icon} onPress={action.onPress} />
                    ))}

                    {/* Add Location */}
                    <LogisticsActionCard title="Add Location" icon={ICONS.addLocation} onPress={() => console.log("Add Location pressed")} />
                </ScrollView>
            </View>

            <Slider
                data={[
                    { image: 'https://picsum.photos/800/400?random=1' },
                    { image: 'https://picsum.photos/800/400?random=2' },
                    { image: 'https://picsum.photos/800/400?random=3' },
                ]}
                autoPlayInterval={4000}
            />




            <View style={{ marginVertical: 20 }} >


                <View style={{ flexDirection: "row", justifyContent: "space-between", marginHorizontal: 20 }} >
                    <Text style={{ fontFamily: FONTS.BOLD_PRIMARY }} >
                        Active Shipment
                    </Text>

                    <Text style={{ fontFamily: FONTS.PRIMARY, color: COLOR.PRIMARY }} >
                        View All
                    </Text>

                </View>





                <ShipmentCard
                    from="123 Main St, Cityville"
                    to="456 Market St, Townsville"
                    shipmentType="truck"

                    status="s"
                    label="Order #12345"
                    date="Oct 26, 2025"
                    onPress={() => console.log("Shipment clicked")}
                />


            </View>




        </View>
    );
};

export default Home;

const styles = StyleSheet.create({
    container: {
        flex: 1,

    },
    header: {
        backgroundColor: COLOR.PRIMARY,
        paddingHorizontal: S(15),
        paddingTop: S(35),
        paddingBottom: S(15),
        flexDirection: "row",
        alignItems: "center",

    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",

    },
    pinContainer: {
        backgroundColor: "#fff",
        padding: S(10),
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        opacity: 0.3,
    },
    locationTextContainer: {
        flexDirection: "column",
        marginLeft: S(15),
        flex: 1,
    },
    currentLocationRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: S(2),
    },
    currentLocationText: {
        color: "#fff",
        fontSize: 15,
        fontFamily: FONTS.PRIMARY,
        marginRight: S(6),
    },
    cityText: {
        color: "#fff",
        fontSize: 15,
        fontFamily: FONTS.MEDIUM_PRIMARY,
    },
    notificationContainer: {
        width: S(32),
        height: S(32),

        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: -S(30),
        padding: S(10),
        borderRadius: 20,
    },
    cardsContainer: {
        marginTop: S(15),
    },
});
