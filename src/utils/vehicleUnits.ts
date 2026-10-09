// VehicleConfig.maxLength/maxWidth/maxHeight are admin-entered in
// centimeters (e.g. "14ft Truck" has maxLength=427, and 427cm ≈ 14.01ft —
// confirmed against every seeded row), and maxVolume is cm³/100 (same
// 14ft Truck: 427×198×198cm = 16,740,108cm³ / 100 ≈ 167400, its stored
// value). Display code was showing these raw, so a 14ft truck rendered as
// "427 ft". These convert to feet for display; nothing about storage or
// the pricing/capacity logic elsewhere changes.
const CM_PER_FT = 30.48;
const CM3_PER_FT3 = 28316.846;

export const cmToFt = (cm: number): number => cm / CM_PER_FT;

export const volumeUnitsToFt3 = (volumeUnits: number): number => (volumeUnits * 100) / CM3_PER_FT3;

export const formatFt = (cm: number): string => {
    const ft = cmToFt(cm);
    return `${ft % 1 === 0 ? ft.toFixed(0) : ft.toFixed(1)} ft`;
};

export const formatFt3 = (volumeUnits: number): string => `~${Math.round(volumeUnitsToFt3(volumeUnits))} ft³`;
