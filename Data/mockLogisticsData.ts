// mockLogisticsData.ts

import { LogisticsItem } from "../components/LogisticsCardList";



export const mockLogisticsData: LogisticsItem[] = [
    {
        id: '1',
        goodsType: 'Electronics',
        weightKg: 5,
        pickup: {
            address: 'Madhapur, Hyderabad',
            lat: 17.4483,
            lng: 78.3915,
        },
        drop: {
            address: 'Gachibowli, Hyderabad',
            lat: 17.4401,
            lng: 78.3489,
        },
        price: 180,
        distanceKm: 6.2,
        status: 'pending',
        createdAt: new Date().toISOString(),
    },
    {
        id: '2',
        goodsType: 'Furniture',
        weightKg: 45,
        pickup: {
            address: 'Kukatpally, Hyderabad',
            lat: 17.4948,
            lng: 78.3996,
        },
        drop: {
            address: 'Banjara Hills, Hyderabad',
            lat: 17.4126,
            lng: 78.4482,
        },
        price: 520,
        distanceKm: 12.5,
        status: 'accepted',
        createdAt: new Date().toISOString(),
    },
    {
        id: '3',
        goodsType: 'Groceries',
        weightKg: 8,
        pickup: {
            address: 'Ameerpet, Hyderabad',
            lat: 17.4375,
            lng: 78.4483,
        },
        drop: {
            address: 'Begumpet, Hyderabad',
            lat: 17.4448,
            lng: 78.4666,
        },
        price: 120,
        distanceKm: 4.1,
        status: 'in_transit',
        createdAt: new Date().toISOString(),
    },
    {
        id: '4',
        goodsType: 'Clothing',
        pickup: {
            address: 'Charminar, Hyderabad',
            lat: 17.3616,
            lng: 78.4747,
        },
        drop: {
            address: 'Secunderabad',
            lat: 17.4399,
            lng: 78.4983,
        },
        price: 210,
        distanceKm: 9.3,
        status: 'delivered',
        createdAt: new Date().toISOString(),
    },
    {
        id: '5',
        goodsType: 'Medicines',
        weightKg: 2,
        pickup: {
            address: 'Hitech City',
            lat: 17.4435,
            lng: 78.3772,
        },
        drop: {
            address: 'Manikonda',
            lat: 17.4023,
            lng: 78.4021,
        },
        price: 95,
        distanceKm: 5.6,
        status: 'cancelled',
        createdAt: new Date().toISOString(),
    },
    {
        id: '6',
        goodsType: 'Documents',
        pickup: {
            address: 'Financial District',
            lat: 17.4173,
            lng: 78.3441,
        },
        drop: {
            address: 'Jubilee Hills',
            lat: 17.4239,
            lng: 78.4738,
        },
        price: 140,
        distanceKm: 8.7,
        status: 'pending',
        createdAt: new Date().toISOString(),
    },
];