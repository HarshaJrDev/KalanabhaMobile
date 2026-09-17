import type { Shipment } from '@shipment/types';

const PAYMENT_MODE_LABEL: Record<string, string> = {
    prepaid: 'Online / UPI',
    cod: 'Cash on Delivery',
    credit: 'Credit Account',
};

const PAYMENT_STATUS_COLOR: Record<string, string> = {
    PAID: '#16A34A',
    REFUNDED: '#D97706',
    FAILED: '#DC2626',
    PENDING: '#6B7280',
};

const row = (label: string, value: string, valueColor?: string) => `
    <tr>
        <td style="padding:9px 0;color:#6B6B70;font-size:13px;">${label}</td>
        <td style="padding:9px 0;color:${valueColor ?? '#0B0B0D'};font-size:13px;font-weight:600;text-align:right;">${value}</td>
    </tr>`;

// Renders the same fields ReceiptScreen already shows, as a standalone
// branded HTML document — react-native-html-to-pdf converts this to a
// real file the user can save/share, instead of the previous plain-text
// share sheet (which produced no file at all).
export const buildReceiptHtml = (shipment: Shipment): string => {
    const paymentModeLabel = PAYMENT_MODE_LABEL[shipment.paymentMode] ?? shipment.paymentMode;
    const paymentStatusColor = PAYMENT_STATUS_COLOR[shipment.paymentStatus] ?? '#6B7280';
    const date = new Date(shipment.createdAt).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    const rows = [
        row('Date', date),
        row('Route', `${shipment.from} &rarr; ${shipment.to}`),
        row('Vehicle', shipment.vehicleType),
        row('Distance', `${shipment.distanceKm} km`),
        row('Payment mode', paymentModeLabel),
        row('Payment status', shipment.paymentStatus, paymentStatusColor),
        shipment.promoCode
            ? row('Promo applied', `${shipment.promoCode} (&minus;&#8377;${shipment.promoDiscount ?? 0})`, '#16A34A')
            : '',
    ].join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, Roboto, sans-serif; background: #FAFAF8; padding: 32px; }
  .card { background: #fff; border-radius: 20px; padding: 36px; max-width: 480px; margin: 0 auto; border: 1px solid #E7E5E0; }
  .brandBar { height: 6px; background: #FF7518; border-radius: 4px; margin-bottom: 24px; }
  .brand { font-size: 20px; font-weight: 800; color: #FF7518; text-align: center; letter-spacing: -0.3px; }
  .tracking { font-size: 12.5px; color: #6B6B70; text-align: center; margin-top: 4px; letter-spacing: 0.5px; }
  .divider { height: 1px; background: #E7E5E0; margin: 20px 0; }
  table { width: 100%; border-collapse: collapse; }
  .totalRow { display: flex; justify-content: space-between; align-items: center; }
  .totalLabel { font-size: 15px; font-weight: 700; color: #0B0B0D; }
  .totalValue { font-size: 22px; font-weight: 800; color: #FF7518; }
  .footer { text-align: center; font-size: 11px; color: #9a9a9e; margin-top: 28px; }
</style>
</head>
<body>
  <div class="card">
    <div class="brandBar"></div>
    <div class="brand">Kalanabha</div>
    <div class="tracking">${shipment.trackingId}</div>
    <div class="divider"></div>
    <table>${rows}</table>
    <div class="divider"></div>
    <div class="totalRow">
      <span class="totalLabel">Total</span>
      <span class="totalValue">&#8377;${shipment.price}</span>
    </div>
    <div class="footer">This is a computer-generated receipt from Kalanabha.</div>
  </div>
</body>
</html>`;
};
