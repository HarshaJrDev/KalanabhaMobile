









export const Images = {
  logo: {
    icon: require('../../assets/images/home/logo-icon.png'),
    splashLockup: require('../../assets/images/home/splash-lockup.jpg'),
  },

  vehicles: {
    bike: require('../../assets/images/home/Bike.png'),
    lorry: require('../../assets/images/home/Lurry.png'),
    truck: require('../../assets/images/home/truck.png'),
    van: require('../../assets/images/home/ven.png'),
    deliveryTruckHero: require('../../assets/images/home/delivery-truck-hero.png'),
  },

  categories: {
    houseShifting: require('../../assets/images/home/category-house-shifting.png'),
    package: require('../../assets/images/home/category-package.png'),
  },

  people: {
    customer: require('../../assets/images/home/ImaCustomer.png'),
    driver: require('../../assets/images/home/ImaDriver.png'),
  },

  banners: {
    process: require('../../assets/images/home/process-banner.jpg'),
    promo: require('../../assets/images/home/promo-banner.jpg'),
  },

  
  
  
  
  onboardingSlides: {
    slide1: require('../../assets/images/home/onboarding-1.png'),
    slide1Delivery: require('../../assets/images/home/onboarding-1-delivery.png'),
    customer: require('../../assets/images/home/ImaCustomer.png'),
    slide2Tracking: require('../../assets/images/home/onboarding-2-tracking.png'),
    slide2: require('../../assets/images/home/onboarding-2.png'),
    slide3Trust: require('../../assets/images/home/onboarding-3-trust.png'),
    driver: require('../../assets/images/home/ImaDriver.png'),
    slide3: require('../../assets/images/home/onboarding-3.png'),
  },

  
  
  
  
  
  illustrations: {
    loginHero: require('../../assets/images/illustrations/login-hero.png'),
    signupHero: require('../../assets/images/illustrations/signup-hero.png'),
    forgotPassword: require('../../assets/images/illustrations/forgot-password.png'),
    otpVerification: require('../../assets/images/illustrations/otp-verification.png'),

    onboardingFastBooking: require('../../assets/images/illustrations/onboarding-fast-booking.png'),
    onboardingLiveTracking: require('../../assets/images/illustrations/onboarding-live-tracking.png'),
    onboardingTrustSafety: require('../../assets/images/illustrations/onboarding-trust-safety.png'),

    emptyNotifications: require('../../assets/images/illustrations/empty-notifications.png'),
    emptyRatings: require('../../assets/images/illustrations/empty-ratings.png'),
    emptyClaimsDisputes: require('../../assets/images/illustrations/empty-claims-disputes.png'),
    emptyFleetVehicles: require('../../assets/images/illustrations/empty-fleet-vehicles.png'),

    successOrderPlaced: require('../../assets/images/illustrations/success-order-placed.png'),
    successClaimFiled: require('../../assets/images/illustrations/success-claim-filed.png'),
    successPayment: require('../../assets/images/illustrations/success-payment.png'),

    driverNoDeliveries: require('../../assets/images/illustrations/driver-no-deliveries.png'),
    sosEmergency: require('../../assets/images/illustrations/sos-emergency.png'),
  },
} as const;

export type IllustrationKey = keyof typeof Images.illustrations;
