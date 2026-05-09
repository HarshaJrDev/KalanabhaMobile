import firestore from '@react-native-firebase/firestore';

export const acceptShipment = async ({
    shipmentId,
    driver,
}: {
    shipmentId: string;
    driver: {
        id: string;
        name: string;
        phone?: string;
        rating?: number;
    };
}): Promise<void> => {
    const ref = firestore().collection('shipments').doc(shipmentId);

    await firestore().runTransaction(async (tx) => {
        const doc = await tx.get(ref);

        if (!doc.exists) {
            throw new Error('Shipment not found');
        }

        const data = doc.data();

        if (data?.status !== 'searching') {
            throw new Error('Already taken');
        }

        tx.update(ref, {
            status: 'accepted',
            dispatch: {
                driverId: driver.id,
                driverName: driver.name,
                driverPhone: driver.phone,
                driverRating: driver.rating,
            },
            updatedAt: firestore.FieldValue.serverTimestamp(),
        });
    });
};