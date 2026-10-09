import type { VehicleConfig } from '@features/settings/types';

export type AddOrderPrefill = {
  category?: 'PARCEL' | 'HOUSE_SHIFTING';
  pickup?: string;
  drop?: string;
  vehicleType?: string;
};

export type RootStackParamList = {
  Splash: undefined;
  LanguageSelect: undefined;
  OnBoarding: undefined;
  LocationPinPicker: {
    initial?: { lat: number; lng: number };
    initialAddress?: string;
    onConfirm: (point: { lat: number; lng: number; address: string }) => void;
  };
  WebView: { url: string; title: string };
  SelectAccount: undefined;
  Login: { isDriver: boolean };
  Signup: undefined;
  ForgotPassword: undefined;

  Home: undefined;
  DriverTabs: undefined;

  Orders: undefined;
  AddOrder: { prefill?: AddOrderPrefill } | undefined;
  addOrder: { prefill?: AddOrderPrefill } | undefined;
  Notification: undefined;
  Profile: undefined;

  Search: undefined;
  CheckRate: undefined;
  VehicleDetails: {
    vehicleId: string;
    vehicles: VehicleConfig[];
    onConfirm?: (vehicle: VehicleConfig) => void;
    popCount?: number;
  };
  AllVehicles: {
    vehicles: VehicleConfig[];
    selectedName?: string;
    onConfirm: (vehicle: VehicleConfig) => void;
  };
  ShipmentHistory: { initialStatus?: string } | undefined;
  QRScan: undefined;
  Inbox: undefined;
  Settings: undefined;
  Transactions: undefined;
  SupportTickets: undefined;
  SavedAddresses: undefined;
  NewTicket: { prefillCategory?: string; prefillSubject?: string; prefillDescription?: string } | undefined;
  TicketDetail: { id: string };

  Shipment: undefined;
  shipment: undefined;
  ShipmentDetailsScreen: { id: string };
  ShipmentChat: { shipmentId: string };
  Receipt: { id: string };
  Referral: undefined;
  Rating: { shipmentId: string };
  Sender: undefined;

  DriverSettings: undefined;
  DriverTrips: undefined;
  DriverEarnings: undefined;
  FuelStations: undefined;
  DriverDocuments: undefined;
};
