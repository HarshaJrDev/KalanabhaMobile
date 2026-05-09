/**
 * AdminDashboard.tsx  ─  React Web (Firebase JS SDK v9+)
 *
 * Enhanced Features:
 *  • Real-time Firestore (orders, drivers, revenue)
 *  • Logistics Requirements Manager (vehicles, weight, dimensions, special conditions)
 *  • Pricing rules per vehicle/service type
 *  • Mobile-responsive with bottom nav & collapsible sidebar
 *  • Improved chat with timestamps
 *  • Order timeline / status tracker
 *  • Search across orders & drivers
 *  • Notification bell with unread count
 *  • Settings tab for logistics config
 *  • Driver documents & rating display
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore, collection, onSnapshot, doc, updateDoc, setDoc,
  serverTimestamp, query, orderBy, where, addDoc, deleteDoc,
} from 'firebase/firestore';
import {
  getAuth, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, onAuthStateChanged, signOut,
} from 'firebase/auth';

import firebaseConfig from '../config/firebaseConfig'

// ── Firebase Config ──────────────────────────────────────────────────────────


const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ── Types ────────────────────────────────────────────────────────────────────
type Status = 'searching' | 'accepted' | 'in_transit' | 'delivered' | 'cancelled';
type Tab = 'overview' | 'orders' | 'drivers' | 'analytics' | 'logistics' | 'settings';

interface Shipment {
  id: string; trackingId: string; status: Status;
  from: string; to: string; price: number; vehicleType: string;
  serviceType: string; createdAt: any; sender: any; receiver: any;
  package: any; dispatch?: any; expiresAt?: any;
}
interface Driver {
  id: string; displayName: string; email: string;
  isOnline: boolean; role: string; fcmToken?: string;
  createdAt?: any; phone?: string; vehicleType?: string;
  rating?: number; totalDeliveries?: number; documentsVerified?: boolean;
}
interface ChatMessage {
  id: string; text: string; senderId: string;
  senderName: string; createdAt: any;
}
interface VehicleConfig {
  id: string; name: string; icon: string;
  maxWeight: number; maxLength: number; maxWidth: number; maxHeight: number;
  maxVolume: number; baseRate: number; ratePerKm: number;
  specialConditions: string[]; active: boolean; color: string;
}


// ── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:        #0A0B0F;
    --bg2:       #111318;
    --bg3:       #181B22;
    --bg4:       #1E2230;
    --border:    rgba(255,255,255,0.07);
    --border2:   rgba(255,255,255,0.12);
    --card:      #13151C;
    --surface:   #1A1D26;
    --text:      #F0F2F7;
    --text2:     #9BA3B8;
    --text3:     #5C6480;
    --blue:      #4F8EF7;
    --blue2:     #3B6FD4;
    --purple:    #8B65F0;
    --green:     #34D399;
    --amber:     #FBBF24;
    --red:       #F87171;
    --cyan:      #22D3EE;
    --pink:      #F472B6;
    --sidebar-w: 240px;
    --topbar-h:  58px;
    --radius:    12px;
    --radius-lg: 18px;
    --shadow:    0 4px 24px rgba(0,0,0,0.4);
    --shadow-lg: 0 8px 48px rgba(0,0,0,0.6);
    --font-ui:   'Space Grotesk', sans-serif;
    --font-serif:'Instrument Serif', serif;
    --font-mono: 'JetBrains Mono', monospace;
    --transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
  }

  html, body { height: 100%; overflow: hidden; }
  body { background: var(--bg); font-family: var(--font-ui); color: var(--text); }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }

  /* ── Layout ── */
  .root { display: flex; height: 100vh; overflow: hidden; position: relative; }

  /* ── Sidebar ── */
  .sidebar {
    width: var(--sidebar-w); background: var(--bg2);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    flex-shrink: 0; overflow: hidden;
    transition: var(--transition);
    z-index: 100;
  }

  .sidebar-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
    z-index: 90;
  }

  .logo-area {
    padding: 20px 18px 16px;
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
  }
  .logo-mark {
    width: 34px; height: 34px; border-radius: 9px; flex-shrink: 0;
    background: linear-gradient(135deg, var(--blue), var(--purple));
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 16px; color: #fff;
    box-shadow: 0 0 20px rgba(79,142,247,0.3);
  }
  .logo-text-wrap { flex: 1; min-width: 0; }
  .logo-name { font-size: 14px; font-weight: 700; color: var(--text); letter-spacing: -0.3px; }
  .logo-tag { font-size: 10px; color: var(--text3); margin-top: 1px; font-family: var(--font-mono); }
  .sidebar-close {
    display: none; background: none; border: none; color: var(--text3);
    cursor: pointer; padding: 4px; font-size: 18px; line-height: 1;
  }

  .nav-scroll { flex: 1; overflow-y: auto; padding: 12px 10px; }
  .nav-section-label {
    font-size: 9px; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--text3); padding: 10px 8px 6px;
  }
  .nav-btn {
    display: flex; align-items: center; gap: 9px;
    width: 100%; padding: 9px 10px; border-radius: 9px;
    border: none; background: none; color: var(--text2);
    font-size: 13px; font-weight: 500; font-family: var(--font-ui);
    cursor: pointer; transition: var(--transition); margin-bottom: 1px;
    text-align: left; position: relative;
  }
  .nav-btn:hover { background: var(--bg3); color: var(--text); }
  .nav-btn.active { background: rgba(79,142,247,0.12); color: var(--blue); font-weight: 600; }
  .nav-btn.active::before {
    content:''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
    width: 2.5px; height: 55%; background: var(--blue); border-radius: 0 2px 2px 0;
  }
  .nav-icon { width: 18px; text-align: center; font-size: 15px; flex-shrink: 0; }
  .nav-badge {
    margin-left: auto; background: var(--blue); color: #fff;
    font-size: 9px; font-weight: 700; border-radius: 99px;
    padding: 2px 6px; min-width: 18px; text-align: center; font-family: var(--font-mono);
  }
  .nav-badge.amber { background: var(--amber); color: #000; }
  .nav-badge.green { background: var(--green); color: #000; }

  .sidebar-footer {
    padding: 12px 10px; border-top: 1px solid var(--border);
  }
  .user-chip {
    display: flex; align-items: center; gap: 9px;
    padding: 9px 10px; border-radius: 9px;
    background: var(--bg3);
  }
  .user-avatar {
    width: 28px; height: 28px; border-radius: 7px; flex-shrink: 0;
    background: linear-gradient(135deg, var(--purple), var(--blue));
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; color: #fff;
  }
  .user-name { font-size: 12px; font-weight: 600; color: var(--text); }
  .user-email { font-size: 10px; color: var(--text3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
  .signout-btn {
    margin-left: auto; background: none; border: none; cursor: pointer;
    color: var(--text3); padding: 4px; font-size: 13px; transition: var(--transition); flex-shrink: 0;
  }
  .signout-btn:hover { color: var(--red); }

  /* ── Main ── */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

  .topbar {
    height: var(--topbar-h); background: var(--bg2);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 14px;
    padding: 0 20px; flex-shrink: 0;
  }
  .menu-btn {
    display: none; background: none; border: none; cursor: pointer;
    color: var(--text2); padding: 6px; border-radius: 7px;
    font-size: 18px; transition: var(--transition);
  }
  .menu-btn:hover { background: var(--bg3); color: var(--text); }
  .topbar-title { font-size: 16px; font-weight: 700; letter-spacing: -0.3px; }
  .topbar-sub { font-size: 10px; color: var(--text3); margin-top: 1px; font-family: var(--font-mono); }
  .topbar-right { margin-left: auto; display: flex; align-items: center; gap: 10px; }

  .search-wrap {
    display: flex; align-items: center; gap: 7px;
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: 8px; padding: 6px 11px; width: 220px;
    transition: var(--transition);
  }
  .search-wrap:focus-within { border-color: var(--blue); background: var(--bg4); width: 260px; }
  .search-input { background: none; border: none; outline: none; color: var(--text); font-size: 12px; font-family: var(--font-ui); flex: 1; }
  .search-icon { color: var(--text3); font-size: 13px; }

  .notif-btn {
    position: relative; background: var(--bg3); border: 1px solid var(--border);
    border-radius: 8px; padding: 7px 9px; cursor: pointer;
    color: var(--text2); font-size: 15px; transition: var(--transition);
  }
  .notif-btn:hover { border-color: var(--blue); color: var(--blue); }
  .notif-dot {
    position: absolute; top: 5px; right: 5px; width: 7px; height: 7px;
    background: var(--red); border-radius: 50%; border: 1.5px solid var(--bg2);
  }

  .live-chip {
    display: flex; align-items: center; gap: 6px;
    background: rgba(52,211,153,0.08); border: 1px solid rgba(52,211,153,0.2);
    border-radius: 7px; padding: 5px 10px; font-size: 11px;
    font-weight: 600; color: var(--green);
  }
  .live-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: livePulse 2s infinite; }
  @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.8)} }

  .content { flex: 1; overflow-y: auto; padding: 20px; }

  /* ── KPI Grid ── */
  .kpi-grid { display: grid; grid-template-columns: repeat(6,1fr); gap: 12px; margin-bottom: 20px; }

  .kpi-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 16px 14px;
    position: relative; overflow: hidden;
    transition: var(--transition); cursor: default;
  }
  .kpi-card:hover { border-color: var(--border2); transform: translateY(-1px); box-shadow: var(--shadow); }
  .kpi-glow {
    position: absolute; top: -20px; right: -20px;
    width: 80px; height: 80px; border-radius: 50%; opacity: 0.08;
    filter: blur(20px);
  }
  .kpi-label { font-size: 10px; font-weight: 500; color: var(--text3); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }
  .kpi-val { font-size: 26px; font-weight: 700; line-height: 1; letter-spacing: -1px; margin-bottom: 5px; font-family: var(--font-mono); }
  .kpi-meta { font-size: 10px; color: var(--text3); }

  /* ── Cards ── */
  .card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-lg); overflow: hidden;
  }
  .card-head {
    padding: 14px 18px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
  }
  .card-title { font-size: 13px; font-weight: 700; letter-spacing: -0.2px; }
  .card-sub { font-size: 10px; color: var(--text3); margin-top: 2px; font-family: var(--font-mono); }
  .card-body { padding: 16px 18px; }

  /* ── Grid ── */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  .three-col { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; margin-bottom: 14px; }

  /* ── Status pills ── */
  .pill {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 99px;
    font-family: var(--font-mono); letter-spacing: 0.2px; white-space: nowrap;
  }
  .pill::before { content:''; width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .pill-searching,.pill-pending { background: rgba(251,191,36,0.12); color: var(--amber); }
  .pill-searching::before,.pill-pending::before { background: var(--amber); }
  .pill-accepted { background: rgba(79,142,247,0.12); color: var(--blue); }
  .pill-accepted::before { background: var(--blue); }
  .pill-in_transit { background: rgba(139,101,240,0.12); color: var(--purple); }
  .pill-in_transit::before { background: var(--purple); }
  .pill-delivered { background: rgba(52,211,153,0.12); color: var(--green); }
  .pill-delivered::before { background: var(--green); }
  .pill-cancelled { background: rgba(248,113,113,0.12); color: var(--red); }
  .pill-cancelled::before { background: var(--red); }
  .pill-online { background: rgba(52,211,153,0.12); color: var(--green); }
  .pill-online::before { background: var(--green); }
  .pill-offline { background: rgba(92,100,128,0.15); color: var(--text3); }
  .pill-offline::before { background: var(--text3); }
  .pill-tag { background: rgba(79,142,247,0.08); color: var(--blue); padding: 2px 7px; font-size: 9px; border: none; }
  .pill-tag::before { display: none; }

  /* ── Table ── */
  .tbl-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th {
    text-align: left; padding: 9px 14px;
    font-size: 9px; font-weight: 600; letter-spacing: 1px;
    color: var(--text3); text-transform: uppercase;
    background: var(--bg2); border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }
  td { padding: 11px 14px; border-bottom: 1px solid var(--border); vertical-align: middle; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(255,255,255,0.02); }
  .td-id { font-family: var(--font-mono); font-size: 11px; font-weight: 600; color: var(--blue); }
  .td-bold { font-weight: 600; font-size: 13px; }
  .td-dim { color: var(--text3); font-size: 11px; }
  .td-price { font-family: var(--font-mono); font-weight: 700; color: var(--green); }
  .cb { width: 14px; height: 14px; accent-color: var(--blue); cursor: pointer; }

  /* ── Buttons ── */
  .btn {
    border: none; border-radius: 8px; cursor: pointer;
    font-family: var(--font-ui); font-weight: 600;
    transition: var(--transition); display: inline-flex;
    align-items: center; gap: 5px; white-space: nowrap;
  }
  .btn-xs  { padding: 4px 10px; font-size: 11px; border-radius: 6px; }
  .btn-sm  { padding: 6px 12px; font-size: 12px; }
  .btn-md  { padding: 9px 16px; font-size: 13px; }
  .btn-lg  { padding: 12px 20px; font-size: 14px; width: 100%; justify-content: center; }
  .btn-primary { background: var(--blue); color: #fff; }
  .btn-primary:hover { background: var(--blue2); }
  .btn-danger  { background: rgba(248,113,113,0.12); color: var(--red); border: 1px solid rgba(248,113,113,0.2); }
  .btn-danger:hover { background: rgba(248,113,113,0.2); }
  .btn-ghost   { background: var(--bg3); color: var(--text2); border: 1px solid var(--border); }
  .btn-ghost:hover { background: var(--bg4); color: var(--text); border-color: var(--border2); }
  .btn-success { background: rgba(52,211,153,0.12); color: var(--green); border: 1px solid rgba(52,211,153,0.2); }
  .btn-success:hover { background: rgba(52,211,153,0.2); }
  .btn-amber   { background: rgba(251,191,36,0.1); color: var(--amber); border: 1px solid rgba(251,191,36,0.2); }
  .btn-amber:hover { background: rgba(251,191,36,0.18); }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Form elements ── */
  .form-group { margin-bottom: 14px; }
  .form-label { font-size: 10px; font-weight: 600; color: var(--text3); margin-bottom: 5px; display: block; letter-spacing: 0.5px; text-transform: uppercase; }
  .form-input {
    width: 100%; background: var(--bg3); border: 1px solid var(--border);
    border-radius: 8px; padding: 9px 12px; font-size: 13px;
    font-family: var(--font-ui); color: var(--text); outline: none;
    transition: var(--transition);
  }
  .form-input:focus { border-color: var(--blue); background: var(--bg4); }
  .form-input::placeholder { color: var(--text3); }
  .form-select {
    width: 100%; background: var(--bg3); border: 1px solid var(--border);
    border-radius: 8px; padding: 9px 12px; font-size: 13px;
    font-family: var(--font-ui); color: var(--text); outline: none; cursor: pointer;
    transition: var(--transition);
  }
  .form-select:focus { border-color: var(--blue); }
  .form-select option { background: var(--bg3); }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
  .form-hint { font-size: 10px; color: var(--text3); margin-top: 4px; }
  .form-checkbox-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text2); cursor: pointer; }

  /* ── Modal ── */
  .modal-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 200; backdrop-filter: blur(6px);
    animation: fadeIn 0.15s ease; padding: 16px;
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal {
    background: var(--bg2); border: 1px solid var(--border2);
    border-radius: 20px; padding: 24px; width: 480px; max-width: 100%;
    max-height: 90vh; overflow-y: auto;
    box-shadow: var(--shadow-lg);
    animation: slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1);
  }
  .modal-wide { width: 620px; }
  @keyframes slideUp { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
  .modal-hd { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
  .modal-title { font-size: 18px; font-weight: 700; letter-spacing: -0.4px; }
  .modal-sub { font-size: 11px; color: var(--text3); margin-top: 3px; font-family: var(--font-mono); }
  .modal-close { background: var(--bg3); border: 1px solid var(--border); border-radius: 7px; padding: 4px 9px; cursor: pointer; color: var(--text3); font-size: 15px; transition: var(--transition); }
  .modal-close:hover { color: var(--text); border-color: var(--border2); }
  .modal-footer { display: flex; gap: 10px; margin-top: 20px; }

  /* ── Alert ── */
  .alert { padding: 10px 14px; border-radius: 9px; font-size: 12px; font-weight: 500; margin-bottom: 14px; }
  .alert-success { background: rgba(52,211,153,0.1); color: var(--green); border: 1px solid rgba(52,211,153,0.2); }
  .alert-error   { background: rgba(248,113,113,0.1); color: var(--red); border: 1px solid rgba(248,113,113,0.2); }
  .alert-info    { background: rgba(79,142,247,0.1); color: var(--blue); border: 1px solid rgba(79,142,247,0.2); }

  /* ── Empty ── */
  .empty { text-align: center; padding: 48px 24px; color: var(--text3); }
  .empty-emoji { font-size: 32px; margin-bottom: 10px; filter: grayscale(0.3); }
  .empty-text { font-size: 13px; color: var(--text3); }

  /* ── Charts ── */
  .donut-wrap { display: flex; align-items: center; gap: 20px; }
  .donut-legend { flex: 1; display: flex; flex-direction: column; gap: 7px; }
  .legend-row { display: flex; align-items: center; gap: 7px; font-size: 11px; }
  .legend-dot { width: 8px; height: 8px; border-radius: 3px; flex-shrink: 0; }
  .legend-lbl { flex: 1; color: var(--text3); }
  .legend-n { font-weight: 700; font-family: var(--font-mono); font-size: 12px; }

  /* ── Order list ── */
  .order-list { overflow-y: auto; flex: 1; }
  .order-item {
    padding: 12px 16px; border-bottom: 1px solid var(--border);
    cursor: pointer; transition: var(--transition); display: flex; gap: 10px;
  }
  .order-item:hover { background: rgba(255,255,255,0.02); }
  .order-item.sel { background: rgba(79,142,247,0.06); border-left: 2px solid var(--blue); }
  .order-id-text { font-family: var(--font-mono); font-weight: 600; font-size: 11px; color: var(--blue); margin-bottom: 3px; }
  .order-route-text { font-size: 10px; color: var(--text3); line-height: 1.6; }
  .order-price-text { font-family: var(--font-mono); font-weight: 700; font-size: 12px; color: var(--green); margin-top: 4px; }

  /* ── Chat ── */
  .chat-area { flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 7px; background: var(--bg); }
  .bubble { max-width: 72%; }
  .bubble-admin { align-self: flex-end; }
  .bubble-other { align-self: flex-start; }
  .bubble-content { padding: 8px 11px; border-radius: 12px; font-size: 12px; line-height: 1.5; }
  .bubble-admin .bubble-content { background: var(--blue); color: #fff; border-bottom-right-radius: 4px; }
  .bubble-other .bubble-content { background: var(--bg3); color: var(--text); border: 1px solid var(--border); border-bottom-left-radius: 4px; }
  .bubble-meta { font-size: 9px; color: var(--text3); margin-top: 3px; font-family: var(--font-mono); }
  .bubble-admin .bubble-meta { text-align: right; }
  .chat-bar { display: flex; gap: 8px; padding: 10px 14px; border-top: 1px solid var(--border); background: var(--card); }
  .chat-inp { flex: 1; background: var(--bg3); border: 1px solid var(--border); border-radius: 8px; padding: 8px 12px; font-size: 12px; font-family: var(--font-ui); color: var(--text); outline: none; transition: var(--transition); }
  .chat-inp:focus { border-color: var(--blue); }
  .chat-inp::placeholder { color: var(--text3); }

  /* ── Timeline ── */
  .timeline { display: flex; flex-direction: column; gap: 0; }
  .tl-step { display: flex; gap: 12px; padding-bottom: 14px; position: relative; }
  .tl-step:last-child { padding-bottom: 0; }
  .tl-step:last-child .tl-line { display: none; }
  .tl-dot-wrap { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; width: 20px; }
  .tl-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid; flex-shrink: 0; }
  .tl-line { width: 1.5px; flex: 1; margin-top: 4px; background: var(--border); min-height: 14px; }
  .tl-text { flex: 1; }
  .tl-label { font-size: 11px; font-weight: 600; }
  .tl-time { font-size: 9px; color: var(--text3); margin-top: 2px; font-family: var(--font-mono); }

  /* ── Driver cards ── */
  .driver-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px,1fr)); gap: 12px; }
  .driver-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 16px;
    transition: var(--transition);
  }
  .driver-card:hover { border-color: var(--border2); box-shadow: var(--shadow); }
  .driver-avatar-lg {
    width: 42px; height: 42px; border-radius: 11px;
    background: linear-gradient(135deg, var(--blue), var(--purple));
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700; color: #fff;
  }
  .driver-name { font-size: 14px; font-weight: 700; letter-spacing: -0.3px; }
  .driver-email { font-size: 11px; color: var(--text3); margin-top: 2px; }
  .star-row { display: flex; gap: 2px; font-size: 11px; }
  .star-filled { color: var(--amber); }
  .star-empty { color: var(--bg4); }

  /* ── Logistics cards ── */
  .vehicle-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 14px; }
  .vehicle-card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: var(--radius-lg); padding: 18px; transition: var(--transition);
    position: relative; overflow: hidden;
  }
  .vehicle-card:hover { border-color: var(--border2); box-shadow: var(--shadow); }
  .vehicle-card.inactive { opacity: 0.5; }
  .vehicle-accent { position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .vehicle-icon { font-size: 28px; margin-bottom: 10px; }
  .vehicle-name { font-size: 16px; font-weight: 700; letter-spacing: -0.3px; margin-bottom: 4px; }
  .vehicle-specs { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin: 12px 0; }
  .spec-item { background: var(--bg3); border-radius: 7px; padding: 7px 10px; }
  .spec-label { font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
  .spec-val { font-size: 13px; font-weight: 700; font-family: var(--font-mono); }
  .conditions-wrap { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px; }
  .condition-tag { font-size: 9px; padding: 2px 7px; border-radius: 99px; background: rgba(79,142,247,0.1); color: var(--blue); border: 1px solid rgba(79,142,247,0.15); font-family: var(--font-mono); }

  /* ── Pricing table ── */
  .pricing-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 10px; }
  .pricing-card {
    background: var(--bg3); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 14px; transition: var(--transition);
  }
  .pricing-card:hover { border-color: var(--border2); }
  .pricing-label { font-size: 10px; color: var(--text3); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .pricing-value { font-size: 20px; font-weight: 700; font-family: var(--font-mono); }
  .pricing-meta { font-size: 10px; color: var(--text3); margin-top: 4px; }

  /* ── Filter chips ── */
  .chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .chip {
    padding: 5px 12px; border-radius: 99px; font-size: 11px; font-weight: 600;
    cursor: pointer; border: 1px solid var(--border); background: var(--bg3); color: var(--text3);
    transition: var(--transition); font-family: var(--font-mono);
  }
  .chip:hover:not(.chip-active) { border-color: var(--blue); color: var(--blue); }
  .chip-active { background: rgba(79,142,247,0.12); border-color: rgba(79,142,247,0.3); color: var(--blue); }

  /* ── Settings ── */
  .settings-section { margin-bottom: 28px; }
  .settings-title { font-size: 14px; font-weight: 700; margin-bottom: 14px; letter-spacing: -0.3px; }
  .setting-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; background: var(--bg3); border-radius: var(--radius);
    border: 1px solid var(--border); margin-bottom: 8px;
  }
  .setting-label { font-size: 13px; font-weight: 500; }
  .setting-desc { font-size: 10px; color: var(--text3); margin-top: 2px; }
  .toggle { position: relative; display: inline-block; width: 36px; height: 20px; cursor: pointer; }
  .toggle input { opacity: 0; width: 0; height: 0; }
  .toggle-slider {
    position: absolute; inset: 0; border-radius: 20px;
    background: var(--bg4); border: 1px solid var(--border); transition: var(--transition);
  }
  .toggle-slider::before {
    content:''; position: absolute; height: 14px; width: 14px; left: 2px; bottom: 2px;
    background: var(--text3); border-radius: 50%; transition: var(--transition);
  }
  .toggle input:checked + .toggle-slider { background: rgba(79,142,247,0.2); border-color: var(--blue); }
  .toggle input:checked + .toggle-slider::before { transform: translateX(16px); background: var(--blue); }

  /* ── Assign modal ── */
  .assign-list { display: flex; flex-direction: column; gap: 6px; max-height: 240px; overflow-y: auto; }
  .assign-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 12px; background: var(--bg3); border-radius: 9px; border: 1px solid var(--border);
    gap: 10px;
  }
  .assign-name { font-size: 12px; font-weight: 600; }
  .assign-meta { font-size: 10px; color: var(--text3); margin-top: 2px; font-family: var(--font-mono); }

  /* ── Login ── */
  .login-root {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: var(--bg);
    background-image:
      radial-gradient(ellipse at 15% 50%, rgba(79,142,247,0.12) 0%, transparent 50%),
      radial-gradient(ellipse at 85% 20%, rgba(139,101,240,0.10) 0%, transparent 50%);
  }
  .login-card {
    background: var(--card); border: 1px solid var(--border2);
    border-radius: 22px; padding: 32px; width: 360px; max-width: 95vw;
    box-shadow: var(--shadow-lg);
  }
  .login-logo { display: flex; align-items: center; gap: 10px; margin-bottom: 26px; }

  /* ── Notif panel ── */
  .notif-panel {
    position: absolute; right: 12px; top: calc(var(--topbar-h) + 8px);
    width: 300px; background: var(--bg2); border: 1px solid var(--border2);
    border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); z-index: 300;
    overflow: hidden; animation: slideUp 0.18s ease;
  }
  .notif-item { padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer; transition: var(--transition); }
  .notif-item:last-child { border-bottom: none; }
  .notif-item:hover { background: rgba(255,255,255,0.03); }
  .notif-item.unread { background: rgba(79,142,247,0.04); }
  .notif-title { font-size: 12px; font-weight: 600; }
  .notif-body { font-size: 11px; color: var(--text3); margin-top: 2px; }
  .notif-time { font-size: 9px; color: var(--text3); margin-top: 4px; font-family: var(--font-mono); }

  /* ── Bottom nav (mobile) ── */
  .bottom-nav {
    display: none; position: fixed; bottom: 0; left: 0; right: 0; z-index: 80;
    background: var(--bg2); border-top: 1px solid var(--border);
    padding: 8px 0 env(safe-area-inset-bottom,8px);
    justify-content: space-around; align-items: center;
  }
  .bnav-btn {
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    background: none; border: none; cursor: pointer;
    color: var(--text3); font-size: 18px; padding: 4px 12px;
    transition: var(--transition); position: relative;
  }
  .bnav-btn.active { color: var(--blue); }
  .bnav-label { font-size: 9px; font-weight: 600; font-family: var(--font-mono); }
  .bnav-dot {
    position: absolute; top: 2px; right: 8px;
    width: 6px; height: 6px; background: var(--red); border-radius: 50%;
    border: 1.5px solid var(--bg2);
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    :root { --sidebar-w: 260px; }
    .sidebar { position: fixed; left: 0; top: 0; bottom: 0; transform: translateX(-100%); }
    .sidebar.open { transform: translateX(0); box-shadow: var(--shadow-lg); }
    .sidebar-overlay.show { display: block; }
    .sidebar-close { display: block; }
    .menu-btn { display: flex; }
    .bottom-nav { display: flex; }
    .main { padding-bottom: 60px; }
    .kpi-grid { grid-template-columns: repeat(2,1fr) !important; }
    .two-col, .three-col { grid-template-columns: 1fr !important; }
    .form-row, .form-row-3 { grid-template-columns: 1fr !important; }
    .search-wrap { display: none; }
    .topbar { padding: 0 14px; }
    .content { padding: 14px; }
    .orders-layout { grid-template-columns: 1fr !important; }
    .order-detail { display: none !important; }
    .order-detail.show { display: flex !important; position: fixed; inset: 0; z-index: 150; background: var(--bg2); border-radius: 0; }
  }
  @media (max-width: 500px) {
    .kpi-grid { grid-template-columns: 1fr 1fr !important; gap: 9px !important; }
    .driver-grid { grid-template-columns: 1fr 1fr !important; }
    .vehicle-grid { grid-template-columns: 1fr !important; }
    .modal { padding: 18px; }
  }
`;

// ── Helpers ──────────────────────────────────────────────────────────────────
const fmtINR = (n: number) => `₹${(n || 0).toLocaleString('en-IN')}`;
const fmtDate = (ts: any) => {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};
const fmtTime = (ts: any) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};
const initials = (name: string) => (name || 'U').split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
const Stars = ({ rating }: { rating?: number }) => {
  const r = Math.round(rating || 0);
  return <div className="star-row">{[1, 2, 3, 4, 5].map(i => <span key={i} className={i <= r ? 'star-filled' : 'star-empty'}>★</span>)}</div>;
};

// ── Default vehicle configs ───────────────────────────────────────────────────
const DEFAULT_VEHICLES: Omit<VehicleConfig, 'id'>[] = [
  { name: 'Bike', icon: '🏍️', maxWeight: 20, maxLength: 60, maxWidth: 40, maxHeight: 40, maxVolume: 30, baseRate: 49, ratePerKm: 5, specialConditions: ['fragile', 'documents'], active: true, color: '#4F8EF7' },
  { name: 'Van', icon: '🚐', maxWeight: 500, maxLength: 200, maxWidth: 150, maxHeight: 150, maxVolume: 4500, baseRate: 299, ratePerKm: 12, specialConditions: ['fragile', 'refrigerated', 'bulk'], active: true, color: '#34D399' },
  { name: 'Truck', icon: '🚛', maxWeight: 5000, maxLength: 400, maxWidth: 240, maxHeight: 240, maxVolume: 40000, baseRate: 999, ratePerKm: 20, specialConditions: ['heavy', 'oversized', 'industrial', 'refrigerated'], active: true, color: '#FBBF24' },
];

// ── Donut Chart ───────────────────────────────────────────────────────────────
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cum = 0;
  const r = 50, cx = 60, cy = 60, sw = 16, circ = 2 * Math.PI * r;
  const segs = data.map(d => {
    const pct = d.value / total;
    const offset = circ * (1 - pct);
    const rot = cum * 360;
    cum += pct;
    return { ...d, pct, offset, rot };
  });
  return (
    <div className="donut-wrap">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={sw} />
        {segs.map((seg, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none"
            stroke={seg.color} strokeWidth={sw}
            strokeDasharray={circ} strokeDashoffset={seg.offset}
            transform={`rotate(${seg.rot - 90} ${cx} ${cy})`}
            style={{ transition: 'stroke-dashoffset 0.6s' }}
          />
        ))}
        <text x={cx} y={cy - 5} textAnchor="middle" fontSize="18" fontWeight="700" fill="#F0F2F7" fontFamily="JetBrains Mono,monospace">{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#5C6480" fontFamily="Space Grotesk,sans-serif">total</text>
      </svg>
      <div className="donut-legend">
        {segs.map((seg, i) => (
          <div key={i} className="legend-row">
            <div className="legend-dot" style={{ background: seg.color }} />
            <span className="legend-lbl">{seg.label}</span>
            <span className="legend-n">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data, color = '#4F8EF7' }: { data: { label: string; value: number }[]; color?: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  const W = 560, H = 130, pb = 28, pt = 18;
  const bw = Math.max(20, (W - 20) / data.length - 8);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', overflow: 'visible' }}>
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.9" />
          <stop offset="100%" stopColor={color} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      {data.map((d, i) => {
        const bh = Math.max(2, ((d.value / max) * (H - pt - pb)));
        const bx = 10 + i * ((W - 20) / data.length) + ((W - 20) / data.length - bw) / 2;
        const by = H - pb - bh;
        return (
          <g key={i}>
            <rect x={bx} y={by} width={bw} height={bh} rx="5" fill="url(#barGrad)" style={{ transition: 'height 0.5s, y 0.5s' }} />
            <text x={bx + bw / 2} y={H - 8} textAnchor="middle" fontSize="9" fill="#5C6480" fontFamily="JetBrains Mono,monospace">{d.label}</text>
            {d.value > 0 && <text x={bx + bw / 2} y={by - 5} textAnchor="middle" fontSize="9" fill="#9BA3B8" fontFamily="JetBrains Mono,monospace">{fmtINR(d.value)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

// ── Status Timeline ───────────────────────────────────────────────────────────
function OrderTimeline({ status }: { status: Status }) {
  const steps: { key: Status | 'created'; label: string; color: string }[] = [
    { key: 'created', label: 'Order created', color: '#9BA3B8' },
    { key: 'searching', label: 'Finding driver', color: '#FBBF24' },
    { key: 'accepted', label: 'Driver accepted', color: '#4F8EF7' },
    { key: 'in_transit', label: 'In transit', color: '#8B65F0' },
    { key: 'delivered', label: 'Delivered', color: '#34D399' },
  ];
  const statusOrder = ['created', 'searching', 'accepted', 'in_transit', 'delivered'];
  const currentIdx = statusOrder.indexOf(status === 'cancelled' ? 'searching' : status);
  return (
    <div className="timeline">
      {steps.map((step, i) => {
        const done = i <= currentIdx;
        const cancelled = status === 'cancelled' && step.key === 'searching';
        return (
          <div key={step.key} className="tl-step">
            <div className="tl-dot-wrap">
              <div className="tl-dot" style={{
                borderColor: cancelled ? '#F87171' : done ? step.color : 'rgba(255,255,255,0.1)',
                background: cancelled ? '#F87171' : done ? step.color : 'transparent',
              }} />
              {i < steps.length - 1 && <div className="tl-line" style={{ background: done ? step.color : undefined, opacity: done ? 0.3 : 1 }} />}
            </div>
            <div className="tl-text">
              <div className="tl-label" style={{ color: done ? step.color : '#5C6480' }}>
                {cancelled && step.key === 'searching' ? 'Cancelled' : step.label}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Admin Login ───────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  const handle = async () => {
    if (!email || !pw) { setErr('Email and password are required'); return; }
    setLoading(true); setErr('');
    try { await signInWithEmailAndPassword(auth, email, pw); onLogin(); }
    catch (e: any) { setErr(e.message || 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#0A0B0F', padding: '1rem',
      backgroundImage: 'radial-gradient(ellipse at 15% 50%, rgba(79,142,247,0.10) 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, rgba(139,101,240,0.08) 0%, transparent 55%)',
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: '#13151C', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 8px 48px rgba(0,0,0,0.6)',
      }}>

        {/* Header */}
        <div style={{ padding: '2rem 2rem 1.5rem' }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: 'linear-gradient(135deg, #4F8EF7, #8B65F0)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 700, color: '#fff',
              boxShadow: '0 0 16px rgba(79,142,247,0.25)',
            }}>K</div>
            <div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 15, color: '#F0F2F7' }}>Kalanabha</div>
              <div style={{ fontSize: 10, color: '#5C6480', fontFamily: 'JetBrains Mono,monospace', marginTop: 1 }}>admin portal</div>
            </div>
          </div>

          {/* Heading */}
          <div style={{ marginBottom: '1.75rem' }}>
            <h1 style={{ margin: '0 0 5px', fontFamily: "'Space Grotesk',sans-serif", fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px', color: '#F0F2F7' }}>
              Welcome back
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: '#5C6480' }}>Sign in to manage your logistics</p>
          </div>

          {/* Error */}
          {err && (
            <div style={{
              padding: '10px 14px', borderRadius: 9, fontSize: 12, fontWeight: 500,
              marginBottom: 16, background: 'rgba(248,113,113,0.10)',
              color: '#F87171', border: '1px solid rgba(248,113,113,0.20)',
            }}>{err}</div>
          )}

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#9BA3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@kalanabha.com"
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#1A1D26', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 9, padding: '10px 13px', fontSize: 13,
                  fontFamily: "'Space Grotesk',sans-serif", color: '#F0F2F7',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#4F8EF7'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: '#9BA3B8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Password
                </label>
                <a href="#" style={{ fontSize: 12, color: '#4F8EF7', textDecoration: 'none' }}
                  onClick={e => e.preventDefault()}>
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handle()}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: '#1A1D26', border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: 9, padding: '10px 13px', fontSize: 13,
                  fontFamily: "'Space Grotesk',sans-serif", color: '#F0F2F7',
                  outline: 'none', transition: 'border-color 0.2s',
                }}
                onFocus={e => e.target.style.borderColor = '#4F8EF7'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
              />
            </div>

            {/* Remember me */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
                style={{ width: 15, height: 15, accentColor: '#4F8EF7', margin: 0, flexShrink: 0 }}
              />
              <span style={{ fontSize: 13, color: '#9BA3B8' }}>Remember me for 30 days</span>
            </label>

          </div>
        </div>

        {/* CTA */}
        <div style={{ padding: '0 2rem 2rem' }}>
          <button
            onClick={handle}
            disabled={loading}
            style={{
              width: '100%', padding: '11px 16px', borderRadius: 9, border: 'none',
              background: loading ? '#2C3147' : '#4F8EF7', color: '#fff',
              fontSize: 14, fontWeight: 600, fontFamily: "'Space Grotesk',sans-serif",
              cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#3B6FD4'; }}
            onMouseLeave={e => { if (!loading) (e.target as HTMLButtonElement).style.background = '#4F8EF7'; }}
          >
            {loading ? (
              <>
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                Signing in…
              </>
            ) : 'Sign in →'}
          </button>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          padding: '1rem 2rem', textAlign: 'center',
          background: '#0F1118',
        }}>
          <p style={{ margin: 0, fontSize: 12, color: '#5C6480' }}>
            Need access?{' '}
            <a href="#" style={{ color: '#4F8EF7', textDecoration: 'none', fontWeight: 600 }}
              onClick={e => e.preventDefault()}>
              Contact your administrator
            </a>
          </p>
        </div>

      </div>

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
// ── Create Driver Modal ───────────────────────────────────────────────────────
function CreateDriverModal({ vehicles, onClose, onCreated }: { vehicles: VehicleConfig[]; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', vehicle: 'bike', license: '', rating: '5' });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handle = async () => {
    if (!form.name || !form.email || !form.password) { setAlert({ type: 'error', msg: 'Name, email, password required.' }); return; }
    if (form.password.length < 6) { setAlert({ type: 'error', msg: 'Password min 6 chars.' }); return; }
    setLoading(true); setAlert(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await addDoc(collection(db, 'users'), {
        uid: cred.user.uid, displayName: form.name, email: form.email,
        phone: form.phone, vehicleType: form.vehicle, licenseNumber: form.license,
        role: 'driver', isOnline: false, rating: parseFloat(form.rating) || 5,
        totalDeliveries: 0, documentsVerified: false,
        createdAt: serverTimestamp(), createdByAdmin: true,
      });
      setAlert({ type: 'success', msg: `Driver ${form.name} created! Login: ${form.email}` });
      setTimeout(() => { onCreated(); onClose(); }, 1800);
    } catch (e: any) { setAlert({ type: 'error', msg: e.message || 'Failed' }); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hd">
          <div><div className="modal-title">Create driver account</div><div className="modal-sub">credentials sent to driver app</div></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {alert && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}
        <div className="form-row">
          <div className="form-group"><label className="form-label">Full name *</label><input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ravi Kumar" /></div>
          <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" /></div>
        </div>
        <div className="form-group"><label className="form-label">Email *</label><input className="form-input" value={form.email} onChange={e => set('email', e.target.value)} type="email" placeholder="ravi@kalanabha.com" /></div>
        <div className="form-row">
          <div className="form-group"><label className="form-label">Password *</label><input className="form-input" value={form.password} onChange={e => set('password', e.target.value)} type="password" placeholder="Min 6 chars" /></div>
          <div className="form-group"><label className="form-label">License No.</label><input className="form-input" value={form.license} onChange={e => set('license', e.target.value)} placeholder="MH12 20230001234" /></div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Vehicle type</label>
            <select className="form-select" value={form.vehicle} onChange={e => set('vehicle', e.target.value)}>
              {vehicles.filter(v => v.active).map(v => <option key={v.id} value={v.name.toLowerCase()}>{v.icon} {v.name}</option>)}
              <option value="bike">🏍️ Bike</option>
              <option value="van">🚐 Van</option>
              <option value="truck">🚛 Truck</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Initial rating (1-5)</label>
            <input className="form-input" value={form.rating} onChange={e => set('rating', e.target.value)} type="number" min="1" max="5" step="0.1" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost btn-md" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary btn-md" onClick={handle} disabled={loading} style={{ flex: 2 }}>
            {loading ? 'Creating…' : 'Create driver →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Assign Modal ──────────────────────────────────────────────────────────────
function AssignModal({ shipment, drivers, onClose }: { shipment: Shipment; drivers: Driver[]; onClose: () => void }) {
  const online = drivers.filter(d => d.isOnline);
  const assign = async (d: Driver) => {
    await updateDoc(doc(db, 'shipments', shipment.id), {
      status: 'accepted',
      dispatch: { driverId: d.id, driverName: d.displayName, assignedByAdmin: true, assignedAt: serverTimestamp() },
      updatedAt: serverTimestamp(),
    });
    await addDoc(collection(db, 'notifications'), {
      userId: d.id, type: 'ORDER_ASSIGNED', shipmentId: shipment.id,
      title: 'New Delivery Assigned', body: `Order ${shipment.trackingId} assigned to you`,
      read: false, createdAt: serverTimestamp(),
    });
    onClose();
  };
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-hd">
          <div><div className="modal-title">Assign driver</div><div className="modal-sub">{shipment.trackingId} · {online.length} online</div></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {online.length === 0 ? (
          <div className="empty"><div className="empty-emoji">😴</div><div className="empty-text">No drivers online right now</div></div>
        ) : (
          <div className="assign-list">
            {online.map(d => (
              <div key={d.id} className="assign-row">
                <div className="driver-avatar-lg" style={{ width: 34, height: 34, borderRadius: 8, fontSize: 12 }}>{initials(d.displayName)}</div>
                <div style={{ flex: 1 }}>
                  <div className="assign-name">{d.displayName}</div>
                  <div className="assign-meta">{d.vehicleType ?? 'any'} · {d.totalDeliveries ?? 0} deliveries</div>
                </div>
                <Stars rating={d.rating} />
                <button className="btn btn-primary btn-xs" onClick={() => assign(d)}>Assign</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Vehicle Config Modal ──────────────────────────────────────────────────────
function VehicleModal({ initial, onClose, onSave }: {
  initial?: Partial<VehicleConfig>;
  onClose: () => void;
  onSave: (v: Omit<VehicleConfig, 'id'>) => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name ?? '', icon: initial?.icon ?? '🚗',
    maxWeight: String(initial?.maxWeight ?? 100),
    maxLength: String(initial?.maxLength ?? 100),
    maxWidth: String(initial?.maxWidth ?? 80),
    maxHeight: String(initial?.maxHeight ?? 80),
    maxVolume: String(initial?.maxVolume ?? 500),
    baseRate: String(initial?.baseRate ?? 99),
    ratePerKm: String(initial?.ratePerKm ?? 8),
    conditions: (initial?.specialConditions ?? []).join(', '),
    active: initial?.active ?? true,
    color: initial?.color ?? '#4F8EF7',
  });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const ICONS = ['🏍️', '🚗', '🚐', '🚚', '🚛', '🏗️', '🚁', '⛵'];

  const handle = () => {
    if (!form.name) return;
    onSave({
      name: form.name, icon: form.icon,
      maxWeight: Number(form.maxWeight), maxLength: Number(form.maxLength),
      maxWidth: Number(form.maxWidth), maxHeight: Number(form.maxHeight),
      maxVolume: Number(form.maxVolume), baseRate: Number(form.baseRate),
      ratePerKm: Number(form.ratePerKm),
      specialConditions: form.conditions.split(',').map(s => s.trim()).filter(Boolean),
      active: form.active, color: form.color,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal modal-wide" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-hd">
          <div><div className="modal-title">{initial?.name ? 'Edit vehicle' : 'Add vehicle type'}</div><div className="modal-sub">logistics configuration</div></div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Vehicle name *</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Refrigerated Van" />
          </div>
          <div className="form-group">
            <label className="form-label">Icon</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ICONS.map(ic => (
                <button key={ic} onClick={() => set('icon', ic)} style={{
                  background: form.icon === ic ? 'rgba(79,142,247,0.15)' : 'var(--bg3)',
                  border: `1px solid ${form.icon === ic ? 'var(--blue)' : 'var(--border)'}`,
                  borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 18,
                }}>{ic}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Weight & Dimensions</div>
          <div className="form-row-3">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Max weight (kg)</label>
              <input className="form-input" type="number" value={form.maxWeight} onChange={e => set('maxWeight', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Max length (cm)</label>
              <input className="form-input" type="number" value={form.maxLength} onChange={e => set('maxLength', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Max width (cm)</label>
              <input className="form-input" type="number" value={form.maxWidth} onChange={e => set('maxWidth', e.target.value)} />
            </div>
          </div>
          <div className="form-row" style={{ marginTop: 10 }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Max height (cm)</label>
              <input className="form-input" type="number" value={form.maxHeight} onChange={e => set('maxHeight', e.target.value)} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Max volume (L)</label>
              <input className="form-input" type="number" value={form.maxVolume} onChange={e => set('maxVolume', e.target.value)} />
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pricing</div>
          <div className="form-row">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Base rate (₹)</label>
              <input className="form-input" type="number" value={form.baseRate} onChange={e => set('baseRate', e.target.value)} />
              <div className="form-hint">Flat minimum charge</div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Rate per km (₹)</label>
              <input className="form-input" type="number" value={form.ratePerKm} onChange={e => set('ratePerKm', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Special conditions (comma-separated)</label>
          <input className="form-input" value={form.conditions} onChange={e => set('conditions', e.target.value)} placeholder="fragile, refrigerated, hazmat, oversized" />
          <div className="form-hint">Tags shown to customers when booking</div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Accent color</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={form.color} onChange={e => set('color', e.target.value)} style={{ width: 40, height: 36, borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', background: 'none', padding: 2 }} />
              <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'JetBrains Mono,monospace' }}>{form.color}</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <label className="form-checkbox-row" style={{ marginTop: 9 }}>
              <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} style={{ accentColor: 'var(--blue)', width: 16, height: 16 }} />
              Active — available for bookings
            </label>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost btn-md" onClick={onClose} style={{ flex: 1 }}>Cancel</button>
          <button className="btn btn-primary btn-md" onClick={handle} style={{ flex: 2 }}>
            {initial?.name ? 'Save changes' : 'Add vehicle type'} →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [adminUser, setAdminUser] = useState<any>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<VehicleConfig[]>([]);
  const [selected, setSelected] = useState<Shipment | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [showCreateDriver, setShowCreateDriver] = useState(false);
  const [assignShipment, setAssignShipment] = useState<Shipment | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<VehicleConfig | null>(null);
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auth
  useEffect(() => { return onAuthStateChanged(auth, u => { setAdminUser(u); setAuthChecked(true); }); }, []);

  // Shipments
  useEffect(() => {
    if (!adminUser) return;
    const q = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => setShipments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Shipment))));
  }, [adminUser]);

  // Drivers
  useEffect(() => {
    if (!adminUser) return;
    const q = query(collection(db, 'users'), where('role', '==', 'driver'));
    return onSnapshot(q, snap => setDrivers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Driver))));
  }, [adminUser]);

  // Vehicle configs
  useEffect(() => {
    if (!adminUser) return;
    const q = collection(db, 'vehicleConfigs');
    return onSnapshot(q, async snap => {
      if (snap.empty) {
        // Seed defaults
        for (const v of DEFAULT_VEHICLES) {
          await addDoc(collection(db, 'vehicleConfigs'), v);
        }
      } else {
        setVehicles(snap.docs.map(d => ({ id: d.id, ...d.data() } as VehicleConfig)));
      }
    });
  }, [adminUser]);

  // Notifications
  useEffect(() => {
    if (!adminUser) return;
    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, snap => setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [adminUser]);

  // Chat
  useEffect(() => {
    if (!selected) return;
    const q = query(collection(db, 'shipments', selected.id, 'messages'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    });
  }, [selected]);

  const sendMsg = useCallback(async () => {
    if (!chatInput.trim() || !selected || !adminUser) return;
    const text = chatInput.trim();
    setChatInput('');
    await addDoc(collection(db, 'shipments', selected.id, 'messages'), {
      text, senderId: adminUser.uid, senderName: 'Admin', createdAt: serverTimestamp(),
    });
  }, [chatInput, selected, adminUser]);

  const cancelOrder = async (id: string) => {
    if (!window.confirm('Cancel this order?')) return;
    await updateDoc(doc(db, 'shipments', id), { status: 'cancelled', updatedAt: serverTimestamp() });
  };

  const saveVehicle = async (data: Omit<VehicleConfig, 'id'>) => {
    if (editVehicle) {
      await setDoc(doc(db, 'vehicleConfigs', editVehicle.id), data);
    } else {
      await addDoc(collection(db, 'vehicleConfigs'), data);
    }
    setEditVehicle(null);
  };

  const deleteVehicle = async (id: string) => {
    if (!window.confirm('Delete this vehicle type?')) return;
    await deleteDoc(doc(db, 'vehicleConfigs', id));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      await updateDoc(doc(db, 'notifications', n.id), { read: true });
    }
  };

  // Stats
  const stats = {
    total: shipments.length,
    searching: shipments.filter(s => s.status === 'searching').length,
    active: shipments.filter(s => s.status === 'accepted' || s.status === 'in_transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    cancelled: shipments.filter(s => s.status === 'cancelled').length,
    revenue: shipments.filter(s => s.status === 'delivered').reduce((a, s) => a + (s.price || 0), 0),
    onlineDrivers: drivers.filter(d => d.isOnline).length,
    unreadNotif: notifications.filter(n => !n.read).length,
  };

  const donutData = [
    { label: 'Searching', value: stats.searching, color: '#FBBF24' },
    { label: 'Active', value: stats.active, color: '#4F8EF7' },
    { label: 'Delivered', value: stats.delivered, color: '#34D399' },
    { label: 'Cancelled', value: stats.cancelled, color: '#F87171' },
  ];

  const revByService = ['standard', 'express', 'same-day'].map(st => ({
    label: st === 'same-day' ? 'Same day' : st.charAt(0).toUpperCase() + st.slice(1),
    value: shipments.filter(s => s.serviceType === st && s.status === 'delivered').reduce((a, s) => a + s.price, 0),
  }));

  const revByVehicle = ['bike', 'van', 'truck'].map(vt => ({
    label: vt.charAt(0).toUpperCase() + vt.slice(1),
    value: shipments.filter(s => s.vehicleType === vt && s.status === 'delivered').reduce((a, s) => a + s.price, 0),
  }));

  const filtered = shipments
    .filter(s => filterStatus === 'all' || s.status === filterStatus)
    .filter(s => !search || s.trackingId?.toLowerCase().includes(search.toLowerCase()) || s.from?.toLowerCase().includes(search.toLowerCase()) || s.to?.toLowerCase().includes(search.toLowerCase()));

  const filteredDrivers = drivers.filter(d => !search || d.displayName?.toLowerCase().includes(search.toLowerCase()) || d.email?.toLowerCase().includes(search.toLowerCase()));

  const NAV: { key: Tab; label: string; icon: string; badge?: number | null }[] = [
    { key: 'overview', label: 'Overview', icon: '◈' },
    { key: 'orders', label: 'Orders', icon: '◫', badge: stats.searching || null },
    { key: 'drivers', label: 'Drivers', icon: '◉', badge: null },
    { key: 'logistics', label: 'Logistics', icon: '◧', badge: null },
    { key: 'analytics', label: 'Analytics', icon: '◕', badge: null },
    { key: 'settings', label: 'Settings', icon: '◌', badge: null },
  ];

  const navigate = (t: Tab) => { setTab(t); setSidebarOpen(false); };

  if (!authChecked) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0A0B0F', color: '#5C6480', fontFamily: 'Space Grotesk,sans-serif', fontSize: 14 }}>Loading…</div>;
  if (!adminUser) return <AdminLogin onLogin={() => { }} />;

  return (
    <>
      <style>{CSS}</style>
      <div className="root">

        {/* Sidebar overlay */}
        <div className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`} onClick={() => setSidebarOpen(false)} />

        {/* ── Sidebar ── */}
        <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="logo-area">
            <div className="logo-mark">K</div>
            <div className="logo-text-wrap">
              <div className="logo-name">Kalanabha</div>
              <div className="logo-tag">admin · v2.0</div>
            </div>
            <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>

          <div className="nav-scroll">
            <div className="nav-section-label">Menu</div>
            {NAV.map(n => (
              <button key={n.key} className={`nav-btn ${tab === n.key ? 'active' : ''}`} onClick={() => navigate(n.key)}>
                <span className="nav-icon">{n.icon}</span>
                {n.label}
                {n.badge ? <span className="nav-badge amber">{n.badge}</span> : null}
              </button>
            ))}
            <div className="nav-section-label" style={{ marginTop: 12 }}>Quick actions</div>
            <button className="nav-btn" onClick={() => setShowCreateDriver(true)}>
              <span className="nav-icon">＋</span> Create driver
            </button>
            <button className="nav-btn" onClick={() => { setShowVehicleModal(true); setEditVehicle(null); }}>
              <span className="nav-icon">◧</span> Add vehicle type
            </button>
          </div>

          <div className="sidebar-footer">
            <div className="user-chip">
              <div className="user-avatar">{initials(adminUser.email ?? 'A')}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="user-name">Admin</div>
                <div className="user-email">{adminUser.email}</div>
              </div>
              <button className="signout-btn" onClick={() => signOut(auth)} title="Sign out">⏻</button>
            </div>
          </div>
        </div>

        {/* ── Main ── */}
        <div className="main">
          {/* Topbar */}
          <div className="topbar">
            <button className="menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
            <div>
              <div className="topbar-title">{NAV.find(n => n.key === tab)?.label}</div>
              <div className="topbar-sub">{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
            <div className="topbar-right">
              <div className="search-wrap">
                <span className="search-icon">⌕</span>
                <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search orders, drivers…" />
              </div>
              <div style={{ position: 'relative' }}>
                <button className="notif-btn" onClick={() => { setShowNotif(v => !v); if (!showNotif) markAllRead(); }}>
                  🔔
                  {stats.unreadNotif > 0 && <div className="notif-dot" />}
                </button>
                {showNotif && (
                  <div className="notif-panel">
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>Notifications</div>
                      <button className="btn btn-ghost btn-xs" onClick={markAllRead}>Mark all read</button>
                    </div>
                    {notifications.slice(0, 8).map(n => (
                      <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-body">{n.body}</div>
                        <div className="notif-time">{fmtTime(n.createdAt)}</div>
                      </div>
                    ))}
                    {notifications.length === 0 && <div className="empty" style={{ padding: 24 }}><div className="empty-text">No notifications</div></div>}
                  </div>
                )}
              </div>
              <div className="live-chip">
                <div className="live-dot" />
                Live
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="content" onClick={() => showNotif && setShowNotif(false)}>

            {/* ─── OVERVIEW ─── */}
            {tab === 'overview' && (
              <>
                <div className="kpi-grid">
                  {[
                    { label: 'Total orders', value: stats.total, color: '#4F8EF7', meta: 'all time' },
                    { label: 'Searching', value: stats.searching, color: '#FBBF24', meta: 'needs driver' },
                    { label: 'Active', value: stats.active, color: '#8B65F0', meta: 'in progress' },
                    { label: 'Delivered', value: stats.delivered, color: '#34D399', meta: 'completed' },
                    { label: 'Revenue', value: fmtINR(stats.revenue), color: '#34D399', meta: 'delivered only' },
                    { label: 'Online drivers', value: stats.onlineDrivers, color: '#22D3EE', meta: `of ${drivers.length} total` },
                  ].map(k => (
                    <div key={k.label} className="kpi-card">
                      <div className="kpi-glow" style={{ background: k.color }} />
                      <div className="kpi-label">{k.label}</div>
                      <div className="kpi-val" style={{ color: k.color }}>{k.value}</div>
                      <div className="kpi-meta">{k.meta}</div>
                    </div>
                  ))}
                </div>

                <div className="two-col">
                  <div className="card">
                    <div className="card-head"><div><div className="card-title">Order status</div><div className="card-sub">distribution</div></div></div>
                    <div className="card-body"><DonutChart data={donutData} /></div>
                  </div>
                  <div className="card">
                    <div className="card-head"><div><div className="card-title">Revenue by service</div><div className="card-sub">delivered orders</div></div></div>
                    <div className="card-body"><BarChart data={revByService} /></div>
                  </div>
                </div>

                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="card-head">
                    <div><div className="card-title">Recent orders</div><div className="card-sub">last 10</div></div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setTab('orders')}>View all →</button>
                  </div>
                  <div className="tbl-wrap">
                    <table>
                      <thead><tr><th>Tracking ID</th><th>Route</th><th>Service</th><th>Vehicle</th><th>Price</th><th>Status</th><th>Time</th><th></th></tr></thead>
                      <tbody>
                        {shipments.slice(0, 10).map(s => (
                          <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => { setSelected(s); setTab('orders'); setShowDetail(true); }}>
                            <td className="td-id">{s.trackingId}</td>
                            <td><div className="td-dim">{s.from}</div><div className="td-dim">→ {s.to}</div></td>
                            <td><span className="pill pill-tag">{s.serviceType}</span></td>
                            <td><span className="pill pill-tag">{s.vehicleType}</span></td>
                            <td className="td-price">{fmtINR(s.price ?? 0)}</td>
                            <td><span className={`pill pill-${s.status}`}>{s.status}</span></td>
                            <td className="td-dim">{fmtDate(s.createdAt)}</td>
                            <td>
                              {(s.status === 'searching') && (
                                <button className="btn btn-amber btn-xs" onClick={e => { e.stopPropagation(); setAssignShipment(s); }}>Assign</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {/* ─── ORDERS ─── */}
            {tab === 'orders' && (
              <div className="orders-layout" style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 14, height: 'calc(100vh - 98px)' }}>
                {/* Order list */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <div className="card-head" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <div><div className="card-title">Orders</div><div className="card-sub">{filtered.length} shown</div></div>
                    </div>
                    <div className="chips">
                      {['all', 'searching', 'accepted', 'in_transit', 'delivered', 'cancelled'].map(s => (
                        <div key={s} className={`chip ${filterStatus === s ? 'chip-active' : ''}`} onClick={() => setFilterStatus(s)}>{s}</div>
                      ))}
                    </div>
                  </div>
                  <div className="order-list">
                    {filtered.map(s => (
                      <div key={s.id} className={`order-item ${selected?.id === s.id ? 'sel' : ''}`}
                        onClick={() => { setSelected(s); setShowDetail(true); }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                            <div className="order-id-text">{s.trackingId}</div>
                            <span className={`pill pill-${s.status}`}>{s.status}</span>
                          </div>
                          <div className="order-route-text">
                            <span style={{ color: '#34D399' }}>↑</span> {s.from}<br />
                            <span style={{ color: '#F87171' }}>↓</span> {s.to}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                            <div className="order-price-text">{fmtINR(s.price ?? 0)}</div>
                            <div style={{ fontSize: 9, color: 'var(--text3)', fontFamily: 'JetBrains Mono,monospace' }}>{fmtDate(s.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {filtered.length === 0 && <div className="empty"><div className="empty-emoji">📭</div><div className="empty-text">No orders found</div></div>}
                  </div>
                </div>

                {/* Order detail */}
                {selected ? (
                  <div className={`card order-detail ${showDetail ? 'show' : ''}`} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div className="card-head">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button className="btn btn-ghost btn-xs" style={{ display: 'none' }} onClick={() => setShowDetail(false)}>← Back</button>
                        <div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div className="card-title" style={{ fontFamily: 'JetBrains Mono,monospace' }}>{selected.trackingId}</div>
                            <span className={`pill pill-${selected.status}`}>{selected.status}</span>
                          </div>
                          <div className="card-sub">{fmtDate(selected.createdAt)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 7 }}>
                        <button className="btn btn-ghost btn-xs" style={{ display: 'block' }} onClick={() => setShowDetail(false)}>← Back</button>
                        {(selected.status === 'searching') && (
                          <button className="btn btn-amber btn-sm" onClick={() => setAssignShipment(selected)}>Assign driver</button>
                        )}
                        {selected.status !== 'cancelled' && selected.status !== 'delivered' && (
                          <button className="btn btn-danger btn-sm" onClick={() => cancelOrder(selected.id)}>Cancel</button>
                        )}
                      </div>
                    </div>

                    <div style={{ flex: 1, overflow: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Route card */}
                      <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14, display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 10, alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: 9, color: '#34D399', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>Pickup</div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{selected.sender?.name || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{selected.sender?.phone}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{selected.from}</div>
                        </div>
                        <div style={{ fontSize: 22, color: 'var(--text3)' }}>→</div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 9, color: '#F87171', fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 5 }}>Drop</div>
                          <div style={{ fontWeight: 700, fontSize: 13 }}>{selected.receiver?.name || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{selected.receiver?.phone}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>{selected.to}</div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                        {[
                          { label: 'Category', value: selected.package?.category ?? '—' },
                          { label: 'Weight', value: `${selected.package?.weight ?? 0} kg` },
                          { label: 'Qty', value: selected.package?.quantity ?? 1 },
                          { label: 'Vehicle', value: selected.vehicleType },
                          { label: 'Service', value: selected.serviceType },
                          { label: 'Payment', value: selected.dispatch?.paymentMode ?? '—' },
                        ].map(item => (
                          <div key={item.label} className="spec-item">
                            <div className="spec-label">{item.label}</div>
                            <div className="spec-val" style={{ fontSize: 12 }}>{item.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Driver */}
                      {selected.dispatch?.driverName && (
                        <div style={{ background: 'rgba(79,142,247,0.08)', border: '1px solid rgba(79,142,247,0.15)', borderRadius: 10, padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div className="driver-avatar-lg" style={{ width: 36, height: 36, borderRadius: 9, fontSize: 13 }}>{initials(selected.dispatch.driverName)}</div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 13 }}>{selected.dispatch.driverName}</div>
                            <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 2 }}>{selected.dispatch.assignedByAdmin ? 'Assigned by admin' : 'Self-accepted'}</div>
                          </div>
                        </div>
                      )}

                      {/* Timeline */}
                      <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: 14 }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>Order progress</div>
                        <OrderTimeline status={selected.status} />
                      </div>

                      {/* Chat */}
                      <div style={{ border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', flex: 1, minHeight: 200, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '9px 14px', fontSize: 12, fontWeight: 700, borderBottom: '1px solid var(--border)', background: 'var(--bg3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>💬</span> Order chat
                          <span style={{ fontSize: 10, color: 'var(--text3)', marginLeft: 'auto', fontFamily: 'JetBrains Mono,monospace' }}>{messages.length} messages</span>
                        </div>
                        <div className="chat-area">
                          {messages.length === 0 && <div className="empty" style={{ padding: 20 }}><div className="empty-emoji" style={{ fontSize: 22 }}>💬</div><div className="empty-text">No messages yet</div></div>}
                          {messages.map(m => (
                            <div key={m.id} className={`bubble ${m.senderName === 'Admin' ? 'bubble-admin' : 'bubble-other'}`}>
                              <div className="bubble-content">{m.text}</div>
                              <div className="bubble-meta">{m.senderName} · {fmtTime(m.createdAt)}</div>
                            </div>
                          ))}
                          <div ref={chatEndRef} />
                        </div>
                        <div className="chat-bar">
                          <input className="chat-inp" value={chatInput} onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMsg()} placeholder="Type a message…" />
                          <button className="btn btn-primary btn-sm" onClick={sendMsg}>Send</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="card order-detail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="empty"><div className="empty-emoji">👈</div><div className="empty-text">Select an order to view details</div></div>
                  </div>
                )}
              </div>
            )}

            {/* ─── DRIVERS ─── */}
            {tab === 'drivers' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.4px' }}>Drivers</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'JetBrains Mono,monospace' }}>{drivers.length} total · {stats.onlineDrivers} online</div>
                  </div>
                  <button className="btn btn-primary btn-md" onClick={() => setShowCreateDriver(true)}>＋ Create driver</button>
                </div>
                <div className="driver-grid">
                  {filteredDrivers.map(d => (
                    <div key={d.id} className="driver-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div className="driver-avatar-lg">{initials(d.displayName || 'D')}</div>
                        <span className={`pill ${d.isOnline ? 'pill-online' : 'pill-offline'}`}>{d.isOnline ? 'Online' : 'Offline'}</span>
                      </div>
                      <div className="driver-name">{d.displayName || 'Unnamed'}</div>
                      <div className="driver-email">{d.email}</div>
                      {d.phone && <div className="driver-email">{d.phone}</div>}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <Stars rating={d.rating} />
                        <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'JetBrains Mono,monospace' }}>{d.totalDeliveries ?? 0} trips</span>
                      </div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                        {d.vehicleType && <span className="pill pill-tag">{d.vehicleType}</span>}
                        {d.documentsVerified ? <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: 'rgba(52,211,153,0.1)', color: 'var(--green)', border: '1px solid rgba(52,211,153,0.2)' }}>✓ verified</span> : <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 99, background: 'rgba(251,191,36,0.1)', color: 'var(--amber)', border: '1px solid rgba(251,191,36,0.2)' }}>pending docs</span>}
                        {d.createdAt && <span className="pill pill-tag">admin</span>}
                      </div>
                      <button className="btn btn-ghost btn-xs" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} onClick={async () => {
                        await updateDoc(doc(db, 'users', d.id), { documentsVerified: !d.documentsVerified });
                      }}>
                        {d.documentsVerified ? 'Revoke docs' : 'Verify docs'}
                      </button>
                    </div>
                  ))}
                  {filteredDrivers.length === 0 && (
                    <div className="empty" style={{ gridColumn: '1/-1', padding: 60 }}>
                      <div className="empty-emoji">🚗</div>
                      <div className="empty-text">No drivers found</div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ─── LOGISTICS ─── */}
            {tab === 'logistics' && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.4px' }}>Logistics Configuration</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'JetBrains Mono,monospace' }}>vehicle types · weight limits · pricing rules</div>
                  </div>
                  <button className="btn btn-primary btn-md" onClick={() => { setEditVehicle(null); setShowVehicleModal(true); }}>＋ Add vehicle type</button>
                </div>

                <div className="alert alert-info" style={{ marginBottom: 16 }}>
                  These configurations are applied to the customer app when selecting vehicle type and calculating prices.
                </div>

                <div className="vehicle-grid">
                  {vehicles.map(v => (
                    <div key={v.id} className={`vehicle-card ${!v.active ? 'inactive' : ''}`}>
                      <div className="vehicle-accent" style={{ background: v.color }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="vehicle-icon">{v.icon}</div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <span className={`pill ${v.active ? 'pill-delivered' : 'pill-offline'}`}>{v.active ? 'active' : 'inactive'}</span>
                        </div>
                      </div>
                      <div className="vehicle-name" style={{ color: v.color }}>{v.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text3)' }}>Base ₹{v.baseRate} + ₹{v.ratePerKm}/km</div>

                      <div className="vehicle-specs">
                        <div className="spec-item">
                          <div className="spec-label">Max weight</div>
                          <div className="spec-val">{v.maxWeight} kg</div>
                        </div>
                        <div className="spec-item">
                          <div className="spec-label">Volume</div>
                          <div className="spec-val">{v.maxVolume} L</div>
                        </div>
                        <div className="spec-item">
                          <div className="spec-label">L × W (cm)</div>
                          <div className="spec-val">{v.maxLength}×{v.maxWidth}</div>
                        </div>
                        <div className="spec-item">
                          <div className="spec-label">Height (cm)</div>
                          <div className="spec-val">{v.maxHeight}</div>
                        </div>
                      </div>

                      {v.specialConditions?.length > 0 && (
                        <div className="conditions-wrap">
                          {v.specialConditions.map(c => <span key={c} className="condition-tag">{c}</span>)}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
                        <button className="btn btn-ghost btn-xs" style={{ flex: 1 }} onClick={() => { setEditVehicle(v); setShowVehicleModal(true); }}>Edit</button>
                        <button className="btn btn-success btn-xs" style={{ flex: 1 }} onClick={() => updateDoc(doc(db, 'vehicleConfigs', v.id), { active: !v.active })}>
                          {v.active ? 'Disable' : 'Enable'}
                        </button>
                        <button className="btn btn-danger btn-xs" onClick={() => deleteVehicle(v.id)}>Del</button>
                      </div>
                    </div>
                  ))}
                  {vehicles.length === 0 && (
                    <div className="empty" style={{ gridColumn: '1/-1', padding: 60 }}>
                      <div className="empty-emoji">🚚</div>
                      <div className="empty-text">No vehicle types configured yet</div>
                    </div>
                  )}
                </div>

                {/* Pricing summary */}
                <div className="card" style={{ marginTop: 20 }}>
                  <div className="card-head"><div><div className="card-title">Pricing summary</div><div className="card-sub">active vehicle rates</div></div></div>
                  <div className="card-body">
                    <div className="tbl-wrap">
                      <table>
                        <thead><tr><th>Vehicle</th><th>Base rate</th><th>Per km</th><th>Max weight</th><th>Max volume</th><th>Conditions</th><th>Status</th></tr></thead>
                        <tbody>
                          {vehicles.map(v => (
                            <tr key={v.id}>
                              <td><span style={{ fontSize: 16 }}>{v.icon}</span> <span className="td-bold">{v.name}</span></td>
                              <td className="td-price">{fmtINR(v.baseRate)}</td>
                              <td className="td-dim">{fmtINR(v.ratePerKm)}/km</td>
                              <td className="td-dim">{v.maxWeight} kg</td>
                              <td className="td-dim">{v.maxVolume} L</td>
                              <td><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{v.specialConditions?.map(c => <span key={c} className="condition-tag">{c}</span>)}</div></td>
                              <td><span className={`pill ${v.active ? 'pill-delivered' : 'pill-offline'}`}>{v.active ? 'active' : 'inactive'}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ─── ANALYTICS ─── */}
            {tab === 'analytics' && (
              <>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.4px' }}>Analytics</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'JetBrains Mono,monospace' }}>all-time performance</div>
                </div>
                <div className="kpi-grid" style={{ marginBottom: 18 }}>
                  {[
                    { label: 'Delivery rate', value: stats.total ? `${Math.round((stats.delivered / stats.total) * 100)}%` : '0%', color: '#34D399' },
                    { label: 'Avg order value', value: stats.delivered ? fmtINR(Math.round(stats.revenue / stats.delivered)) : '₹0', color: '#4F8EF7' },
                    { label: 'Cancel rate', value: stats.total ? `${Math.round((stats.cancelled / stats.total) * 100)}%` : '0%', color: '#F87171' },
                    { label: 'Driver util.', value: drivers.length ? `${Math.round((stats.onlineDrivers / drivers.length) * 100)}%` : '0%', color: '#8B65F0' },
                    { label: 'Pending dispatch', value: stats.searching, color: '#FBBF24' },
                    { label: 'Gross revenue', value: fmtINR(shipments.reduce((a, s) => a + (s.price || 0), 0)), color: '#34D399' },
                  ].map(k => (
                    <div key={k.label} className="kpi-card">
                      <div className="kpi-glow" style={{ background: k.color }} />
                      <div className="kpi-label">{k.label}</div>
                      <div className="kpi-val" style={{ color: k.color, fontSize: 22 }}>{k.value}</div>
                    </div>
                  ))}
                </div>
                <div className="two-col">
                  <div className="card">
                    <div className="card-head"><div><div className="card-title">Revenue by vehicle</div><div className="card-sub">delivered only</div></div></div>
                    <div className="card-body"><BarChart data={revByVehicle} color="#8B65F0" /></div>
                  </div>
                  <div className="card">
                    <div className="card-head"><div><div className="card-title">Order distribution</div></div></div>
                    <div className="card-body"><DonutChart data={donutData} /></div>
                  </div>
                </div>
                <div className="card" style={{ marginBottom: 14 }}>
                  <div className="card-head"><div><div className="card-title">Revenue by service type</div></div></div>
                  <div className="card-body"><BarChart data={revByService} color="#34D399" /></div>
                </div>
              </>
            )}

            {/* ─── SETTINGS ─── */}
            {tab === 'settings' && (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.4px' }}>Settings</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'JetBrains Mono,monospace' }}>platform configuration</div>
                </div>

                <div style={{ maxWidth: 640 }}>
                  <div className="settings-section">
                    <div className="settings-title">Dispatch settings</div>
                    {[
                      { label: 'Auto-assign drivers', desc: 'Automatically assign nearest available driver to new orders', val: false },
                      { label: 'Surge pricing', desc: 'Enable dynamic surge pricing during peak demand', val: false },
                      { label: 'Driver notifications', desc: 'Send FCM push notifications to drivers on assignment', val: true },
                      { label: 'Customer SMS alerts', desc: 'Send SMS when order status changes', val: false },
                    ].map(s => (
                      <div key={s.label} className="setting-row">
                        <div>
                          <div className="setting-label">{s.label}</div>
                          <div className="setting-desc">{s.desc}</div>
                        </div>
                        <label className="toggle">
                          <input type="checkbox" defaultChecked={s.val} />
                          <span className="toggle-slider" />
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="settings-section">
                    <div className="settings-title">Order settings</div>
                    {[
                      { label: 'Order expiry', desc: 'Auto-cancel orders with no driver found after X minutes', val: true },
                      { label: 'Cash on delivery', desc: 'Allow COD payment method for customers', val: true },
                      { label: 'Multi-stop orders', desc: 'Allow customers to add multiple delivery stops', val: false },
                    ].map(s => (
                      <div key={s.label} className="setting-row">
                        <div>
                          <div className="setting-label">{s.label}</div>
                          <div className="setting-desc">{s.desc}</div>
                        </div>
                        <label className="toggle">
                          <input type="checkbox" defaultChecked={s.val} />
                          <span className="toggle-slider" />
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="settings-section">
                    <div className="settings-title">Platform info</div>
                    <div className="card">
                      <div className="card-body">
                        {[
                          { label: 'Total orders', value: stats.total },
                          { label: 'Total drivers', value: drivers.length },
                          { label: 'Vehicle types', value: vehicles.length },
                          { label: 'Firebase project', value: 'kalanabhamobile-262c3' },
                          { label: 'Admin UID', value: adminUser?.uid?.slice(0, 16) + '…' },
                        ].map(r => (
                          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                            <span style={{ color: 'var(--text3)' }}>{r.label}</span>
                            <span style={{ fontFamily: 'JetBrains Mono,monospace', color: 'var(--text)' }}>{r.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

          </div>
        </div>

        {/* ── Bottom nav (mobile) ── */}
        <div className="bottom-nav">
          {[
            { key: 'overview', icon: '◈', label: 'Home' },
            { key: 'orders', icon: '◫', label: 'Orders', badge: stats.searching > 0 },
            { key: 'drivers', icon: '◉', label: 'Drivers' },
            { key: 'logistics', icon: '◧', label: 'Fleet' },
            { key: 'analytics', icon: '◕', label: 'Stats' },
          ].map(n => (
            <button key={n.key} className={`bnav-btn ${tab === n.key ? 'active' : ''}`} onClick={() => navigate(n.key as Tab)}>
              {n.badge && <div className="bnav-dot" />}
              <span>{n.icon}</span>
              <span className="bnav-label">{n.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showCreateDriver && <CreateDriverModal vehicles={vehicles} onClose={() => setShowCreateDriver(false)} onCreated={() => { }} />}
      {assignShipment && <AssignModal shipment={assignShipment} drivers={drivers} onClose={() => setAssignShipment(null)} />}
      {showVehicleModal && (
        <VehicleModal
          initial={editVehicle ?? undefined}
          onClose={() => { setShowVehicleModal(false); setEditVehicle(null); }}
          onSave={saveVehicle}
        />
      )}
    </>
  );
}