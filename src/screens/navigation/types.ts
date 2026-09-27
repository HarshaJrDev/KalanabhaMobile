export type AddOrderPrefill = {
  category?: 'PARCEL' | 'HOUSE_SHIFTING';
  pickup?: string;
  drop?: string;
  vehicleType?: string;
};

export type RootStackParamList = {
  Splash: undefined;
  OnBoarding: undefined;
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
  QRScan: undefined;
  Inbox: undefined;
  Settings: undefined;
  Transactions: undefined;
  SupportTickets: undefined;
  SavedAddresses: undefined;
  NewTicket: undefined;
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
