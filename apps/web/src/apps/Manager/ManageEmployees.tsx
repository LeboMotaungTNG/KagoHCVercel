/**
 * ManageEmployees – end‑to‑end employee management for managers.
 *
 * Provides creation, editing, bulk upload and queueing of employees,
 * while reusing the common Manager layout from `SharedLayout`.
 */
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import SharedLayout from "./SharedLayout";

function generateRandomEmployeeCode(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `EMP${year}${seq}`;
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateSAIdNumber(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false;
  let sum = 0;
  for (let i = 0; i < 13; i++) {
    let digit = parseInt(id[i], 10);
    if (i % 2 !== 0) digit *= 2;
    sum += digit > 9 ? digit - 9 : digit;
  }
  return sum % 10 === 0;
}

// ==================== TYPES ====================
interface Employee {
  id?: string;
  full_name: string;
  email: string;
  phone: string;
  id_number: string;
  passport_number: string;
  address_street: string;
  address_city: string;
  address_province: string;
  address_postal_code: string;
  employee_code: string;
  position: string;
  department: string;
  employment_type: string;
  start_date: string;
  work_location: string;
  password: string;
  confirm_password?: string;
  create_account: boolean;
  send_email: boolean;
}

interface QueueItem extends Employee {
  tempId: string;
}

type Mode = 'form' | 'table' | 'upload';
type Step = 1 | 2 | 3;

// ==================== ICONS ====================
const IconGrid = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const IconUsers = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const IconCalendar = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const IconTrash = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconInbox = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M22 12h-6l-2 3h-4l-2-3H2" /><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);

const IconSave = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
);

const IconEdit = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  </svg>
);

const IconUpload = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconRefresh = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const IconCopy = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const IconLightbulb = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-6 6c0 3 2 5 2 5h8s2-2 2-5a6 6 0 0 0-6-6z" />
  </svg>
);

const IconSliders = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

const IconInfo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const IconZap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

const IconBriefcase = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
  </svg>
);

const IconMail = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);

const IconPhone = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 16.92v3a1.999 1.999 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8 10a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const IconCreditCard = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

const IconBook = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const IconMapPin = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);

const IconMap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const IconFlag = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
  </svg>
);

const IconHash = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const IconArrowLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconLock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconLayers = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" />
  </svg>
);

const IconClock = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const IconPlusCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
  </svg>
);

const IconRepeat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);

const IconCheckCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconCheckSquare = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

// ==================== TABLE ROW COMPONENT ====================
interface TableRowProps {
  index: number;
  onRemove: () => void;
  onChange: (field: keyof Employee, value: string) => void;
  data: Partial<Employee>;
}

function TableRow({ index, onRemove, onChange, data }: TableRowProps) {
  return (
    <tr>
      <td style={{ textAlign: "center", padding: "8px 12px" }}>{index}</td>
      <td style={{ padding: "8px 12px" }}>
        <input
          type="text"
          className="table-input"
          placeholder="John Smith"
          value={data.full_name || ''}
          onChange={(e) => onChange('full_name', e.target.value)}
          style={{ minWidth: '160px', width: '100%' }}
          required
        />
      </td>
      <td style={{ padding: "8px 12px" }}>
        <input
          type="email"
          className="table-input"
          placeholder="john@company.com"
          value={data.email || ''}
          onChange={(e) => onChange('email', e.target.value)}
          style={{ minWidth: '180px', width: '100%' }}
          required
        />
      </td>
      <td style={{ padding: "8px 12px" }}>
        <input
          type="text"
          className="table-input"
          placeholder="8501015009087"
          value={data.id_number || ''}
          onChange={(e) => onChange('id_number', e.target.value)}
          maxLength={13}
          style={{ minWidth: '130px', width: '100%' }}
          required
        />
      </td>
      <td style={{ padding: "8px 12px" }}>
        <input
          type="tel"
          className="table-input"
          placeholder="+27 11 123 4567"
          value={data.phone || ''}
          onChange={(e) => onChange('phone', e.target.value)}
          style={{ minWidth: '130px', width: '100%' }}
        />
      </td>
      <td style={{ padding: "8px 12px" }}>
        <input
          type="text"
          className="table-input"
          placeholder="M12345678"
          value={data.passport_number || ''}
          onChange={(e) => onChange('passport_number', e.target.value)}
          style={{ minWidth: '120px', width: '100%' }}
        />
      </td>
      <td style={{ padding: "8px 12px" }}>
        <input
          type="text"
          className="table-input"
          placeholder="123 Main Street"
          value={data.address_street || ''}
          onChange={(e) => onChange('address_street', e.target.value)}
          style={{ minWidth: '180px', width: '100%' }}
          required
        />
      </td>
      <td style={{ padding: "8px 12px" }}>
        <input
          type="text"
          className="table-input"
          placeholder="Johannesburg"
          value={data.address_city || ''}
          onChange={(e) => onChange('address_city', e.target.value)}
          style={{ minWidth: '120px', width: '100%' }}
          required
        />
      </td>
      <td style={{ padding: "8px 12px" }}>
        <select
          className="table-input"
          value={data.address_province || ''}
          onChange={(e) => onChange('address_province', e.target.value)}
          style={{ minWidth: '120px', width: '100%' }}
          required
        >
          <option value="">Select</option>
          <option value="Gauteng">Gauteng</option>
          <option value="Western Cape">W. Cape</option>
          <option value="KwaZulu-Natal">KZN</option>
          <option value="Eastern Cape">E. Cape</option>
          <option value="Free State">Free State</option>
          <option value="Limpopo">Limpopo</option>
          <option value="Mpumalanga">Mpumalanga</option>
          <option value="Northern Cape">N. Cape</option>
          <option value="North West">N. West</option>
        </select>
      </td>
      <td style={{ padding: "8px 12px" }}>
        <input
          type="text"
          className="table-input"
          placeholder="2000"
          value={data.address_postal_code || ''}
          onChange={(e) => onChange('address_postal_code', e.target.value)}
          maxLength={4}
          style={{ minWidth: '90px', width: '100%' }}
          required
        />
      </td>
      <td style={{ padding: "8px 12px" }}>
        <select
          className="table-input"
          value={data.department || ''}
          onChange={(e) => onChange('department', e.target.value)}
          style={{ minWidth: '120px', width: '100%' }}
          required
        >
          <option value="">Select</option>
          <option value="Sales">Sales</option>
          <option value="IT">IT</option>
          <option value="HR">HR</option>
          <option value="Finance">Finance</option>
          <option value="Operations">Operations</option>
          <option value="Marketing">Marketing</option>
        </select>
      </td>
      <td style={{ padding: "8px 12px" }}>
        <input
          type="text"
          className="table-input"
          placeholder="Developer"
          value={data.position || ''}
          onChange={(e) => onChange('position', e.target.value)}
          style={{ minWidth: '140px', width: '100%' }}
          required
        />
      </td>
      <td style={{ padding: "8px 12px" }}>
        <input
          type="date"
          className="table-input"
          value={data.start_date || ''}
          onChange={(e) => onChange('start_date', e.target.value)}
          style={{ minWidth: '130px', width: '100%' }}
          required
        />
      </td>
      <td style={{ padding: "8px 12px", textAlign: "center" }}>
        <button
          type="button"
          className="btn-sm btn-danger"
          onClick={onRemove}
          style={{ padding: '6px 10px', background: '#f04438', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}
        >
          <IconTrash />
        </button>
      </td>
    </tr>
  );
}

// ==================== QUEUE ITEM COMPONENT ====================
interface QueueItemProps {
  item: QueueItem;
  index: number;
  onRemove: (id: string) => void;
}

function QueueItemComponent({ item, index, onRemove }: QueueItemProps) {
  return (
    <div style={{
      background: "#f9fafb", padding: 16, borderRadius: 12, marginBottom: 12,
      borderLeft: "3px solid #E6A79E", border: "1px solid #e4e7ec", transition: "all 0.2s ease"
    }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontWeight: 600, color: "#1d2939", fontSize: 14 }}>{item.full_name || 'New Employee'}</span>
        <span style={{ background: "#1d2939", color: "#fff", padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
          #{index + 1}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#667085", marginBottom: 12, lineHeight: 1.6 }}>
        {item.email || 'No email'}<br />
        {item.department || 'No department'} - {item.position || 'No position'}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => onRemove(item.tempId)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px",
            background: "#f04438", color: "white", border: "none", borderRadius: 6,
            fontSize: 12, cursor: "pointer"
          }}
        >
          <IconTrash /> Remove
        </button>
      </div>
    </div>
  );
}

// ==================== MAIN CONTENT ====================
function ManageEmployeesContent() {
  const navigate = useNavigate();

  // Authentication check
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      console.log('No authentication found, redirecting to login');
      navigate('/');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      console.log('Authenticated user:', user);
    } catch (error) {
      console.error('Invalid user data in localStorage:', error);
      navigate('/');
      return;
    }
  }, [navigate]);

  const [mode, setMode] = useState<Mode>('form');
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [tableRows, setTableRows] = useState<Partial<Employee>[]>([]);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [bulkDepartment, setBulkDepartment] = useState('');
  const [bulkStartDate, setBulkStartDate] = useState('');
  
  // Form state
  const [formData, setFormData] = useState<Employee>({
    full_name: '',
    email: '',
    phone: '',
    id_number: '',
    passport_number: '',
    address_street: '',
    address_city: '',
    address_province: '',
    address_postal_code: '',
    employee_code: '',
    position: '',
    department: '',
    employment_type: 'Full Time',
    start_date: new Date().toISOString().split('T')[0],
    work_location: '',
    password: '',
    confirm_password: '',
    create_account: true,
    send_email: true,
  });

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem('employeeDraft');
    if (draft) {
      try {
        const data = JSON.parse(draft);
        if (data.queue && data.queue.length > 0) {
          if (window.confirm(`Found a draft from ${new Date(data.timestamp).toLocaleString()}. Load it?`)) {
            setQueue(data.queue);
            localStorage.removeItem('employeeDraft');
          }
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    }
  }, []);

  const generateEmployeeCode = () => {
    setFormData(prev => ({ ...prev, employee_code: generateRandomEmployeeCode() }));
  };

  // Clear form
  const clearForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      id_number: '',
      passport_number: '',
      address_street: '',
      address_city: '',
      address_province: '',
      address_postal_code: '',
      employee_code: '',
      position: '',
      department: '',
      employment_type: 'Full Time',
      start_date: new Date().toISOString().split('T')[0],
      work_location: '',
      password: '',
      confirm_password: '',
      create_account: true,
      send_email: true,
    });
    generateEmployeeCode();
  };

  const validateForm = (data: Partial<Employee>): string | null => {
    if (!data.full_name) return 'Full name is required';
    if (!data.email) return 'Email is required';
    if (data.email && !validateEmail(data.email)) return 'Valid email is required';
    if (!data.id_number) return 'ID number is required';
    if (data.id_number && !validateSAIdNumber(data.id_number)) return 'Invalid SA ID number (must be 13 digits, Luhn-valid)';
    if (!data.address_street) return 'Address is required';
    if (!data.address_city) return 'City is required';
    if (!data.address_province) return 'Province is required';
    if (!data.address_postal_code) return 'Postal code is required';
    if (!data.department) return 'Department is required';
    if (!data.position) return 'Position is required';
    if (!data.start_date) return 'Start date is required';
    if (data.create_account && !data.password) return 'Password is required when creating account';
    if (data.password && data.password !== data.confirm_password) return 'Passwords do not match';
    if (data.password && data.password.length < 6) return 'Password must be at least 6 characters';
    return null;
  };

  // Add to queue
  const addToQueue = (continueAdding = false, processImmediately = false) => {
    const validationError = validateForm(formData);
    if (validationError) {
      alert(validationError);
      return;
    }

    const newItem: QueueItem = {
      ...formData,
      tempId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };

    const updatedQueue = [...queue, newItem];
    setQueue(updatedQueue);

    if (continueAdding) {
      clearForm();
      setCurrentStep(1);
    }

    if (processImmediately) {
      processQueue(updatedQueue);
    }

    setShowSuccess(`Employee added to queue! Total: ${updatedQueue.length}`);
    setTimeout(() => setShowSuccess(null), 3000);
  };

  // Remove from queue
  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(item => item.tempId !== id));
  };

  // Clear queue
  const clearQueue = () => {
    if (window.confirm('Are you sure you want to clear all employees from the queue?')) {
      setQueue([]);
    }
  };

  const processQueue = async (itemsToProcess?: QueueItem[]) => {
    const token = localStorage.getItem('token');
    console.log('TOKEN BEING SENT:', token ? token.substring(0, 30) + '...' : 'NULL/UNDEFINED');
    
    if (!token) {
      console.error('No token found! Please login again.');
      alert('Session expired. Please login again.');
      return;
    }

    const employees = itemsToProcess ?? queue;

    if (employees.length === 0) {
      alert('No employees in queue to process');
      return;
    }

    // Map queue items to only the fields the backend expects
    const cleanEmployees = employees.map(emp => ({
      full_name: emp.full_name,
      email: emp.email,
      department: emp.department,
      position: emp.position,
      start_date: emp.start_date,
      password: emp.password,
      // Optional fields that backend accepts
      phone: emp.phone || '',
      role: 'user'
    }));

    console.log('Sending clean employees:', cleanEmployees);

    if (!window.confirm(`Process ${employees.length} employee(s)? This will add them to the database.`)) {
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";
      const res = await fetch(`${API_URL}/onboarding/process-bulk`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ employees: cleanEmployees }),
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          alert('Session expired. Please login again.');
          localStorage.removeItem('token');
          window.location.href = '/login';
          return;
        }
        throw new Error(`HTTP ${res.status}`);
      }
      
      const data = await res.json();

      if (data.success) {
        setShowSuccess(`Success! ${data.data.successCount ?? employees.length} employee(s) added to the database.`);
        setQueue([]);
        clearForm();
      } else {
        alert(data.message ?? 'Error processing employees');
      }
    } catch (error) {
      console.error('Error processing queue:', error);
      alert('Error processing employees. Please try again.');
    }

    if (!showSuccess?.includes('Network error')) {
      setTimeout(() => setShowSuccess(null), 5000);
    }
  };

  const saveDraft = async () => {
    if (queue.length === 0) {
      alert('No employees in queue to save');
      return;
    }
    const draftName = prompt('Enter a name for this draft:') || 'Untitled Draft';
    const draftData = { name: draftName, queue, timestamp: new Date().toISOString() };

    try {
      const DRAFT_API = 'https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1/onboarding/save-draft';
      const token = localStorage.getItem('token');
      const res = await fetch(DRAFT_API, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: draftData }),
      });
      const data = await res.json();
      if (data.success) {
        setShowSuccess('Draft saved successfully!');
      } else {
        throw new Error('API save failed');
      }
    } catch {
      localStorage.setItem('employeeDraft', JSON.stringify(draftData));
      setShowSuccess('Draft saved locally!');
    }
    setTimeout(() => setShowSuccess(null), 3000);
  };

  // Close window
  const closeWindow = () => {
    if (queue.length > 0) {
      if (window.confirm('You have items in the queue. Are you sure you want to leave?')) {
        window.history.back();
      }
    } else {
      window.history.back();
    }
  };

  // Table mode functions
  const addTableRow = () => {
    setTableRows(prev => [...prev, {}]);
  };

  const removeTableRow = (index: number) => {
    setTableRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateTableRow = (index: number, field: keyof Employee, value: string) => {
    setTableRows(prev => prev.map((row, i) => 
      i === index ? { ...row, [field]: value } : row
    ));
  };

  const validateTable = (): boolean => {
    let isValid = true;
    const errors: string[] = [];

    tableRows.forEach((row, index) => {
      const validationError = validateForm(row);
      if (validationError) {
        isValid = false;
        errors.push(`Row ${index + 1}: ${validationError}`);
      }
    });

    if (!isValid) {
      alert(errors.join('\n'));
    } else {
      alert('All rows are valid!');
    }

    return isValid;
  };

  const addTableToQueue = () => {
    if (!validateTable()) return;

    const newItems: QueueItem[] = tableRows.map(row => ({
      full_name: row.full_name || '',
      email: row.email || '',
      phone: row.phone || '',
      id_number: row.id_number || '',
      passport_number: row.passport_number || '',
      address_street: row.address_street || '',
      address_city: row.address_city || '',
      address_province: row.address_province || '',
      address_postal_code: row.address_postal_code || '',
      employee_code: row.employee_code || generateRandomEmployeeCode(),
      position: row.position || '',
      department: row.department || '',
      employment_type: row.employment_type || 'Full Time',
      start_date: row.start_date || '',
      work_location: row.work_location || '',
      password: row.password || `Temp${Math.random().toString(36).substring(2, 10)}!`,
      confirm_password: row.password || `Temp${Math.random().toString(36).substring(2, 10)}!`,
      create_account: true,
      send_email: false,
      tempId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    }));

    setQueue(prev => [...prev, ...newItems]);
    setTableRows([]);
    setShowSuccess(`${newItems.length} employee(s) added to queue!`);
    setTimeout(() => setShowSuccess(null), 3000);
  };

  const applyBulkValues = () => {
    setTableRows(prev => prev.map(row => ({
      ...row,
      department: row.department || bulkDepartment,
      start_date: row.start_date || bulkStartDate,
    })));
    alert('Bulk values applied to empty cells!');
  };

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const EXTRACT_API = 'https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1/onboarding/extract-document';
      const token = localStorage.getItem('token');
      const formPayload = new FormData();
      formPayload.append('document', file);
      const res = await fetch(EXTRACT_API, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formPayload });
      const data = await res.json();

      if (data.success && data.employees?.length) {
        const extracted: QueueItem[] = data.employees.map((emp: Partial<Employee>) => ({
          full_name: emp.full_name || '',
          email: emp.email || '',
          phone: emp.phone || '',
          id_number: emp.id_number || '',
          passport_number: emp.passport_number || '',
          address_street: emp.address_street || '',
          address_city: emp.address_city || '',
          address_province: emp.address_province || '',
          address_postal_code: emp.address_postal_code || '',
          employee_code: generateRandomEmployeeCode(),
          position: emp.position || '',
          department: emp.department || '',
          employment_type: emp.employment_type || 'Full Time',
          start_date: emp.start_date || '',
          work_location: emp.work_location || '',
          password: 'Welcome123',
          create_account: true,
          send_email: true,
          tempId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        }));
        setQueue(prev => [...prev, ...extracted]);
        setShowSuccess(`${extracted.length} employee(s) extracted and added to queue!`);
        setMode('form');
      } else {
        alert(data.message || 'No employee data could be extracted from this file.');
      }
    } catch {
      alert('Error uploading file. The extraction API is not available — use Form or Table mode.');
    } finally {
      setUploading(false);
      setTimeout(() => setShowSuccess(null), 3000);
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.full_name || !formData.email || !formData.id_number) {
        alert('Please fill in all required fields');
        return;
      }
      if (!validateEmail(formData.email)) {
        alert('Please enter a valid email address');
        return;
      }
      if (formData.id_number && !validateSAIdNumber(formData.id_number)) {
        alert('SA ID number must be 13 digits and Luhn-valid');
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.position || !formData.department) {
        alert('Please fill in all required fields');
        return;
      }
      if (!formData.employee_code) {
        generateEmployeeCode();
      }
    }

    if (currentStep < 3) {
      setCurrentStep(prev => (prev + 1) as Step);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as Step);
    }
  };

  useEffect(() => {
    generateEmployeeCode();
  }, []);

  return (
    <div style={{ padding: 24, background: "#f9f7f5", minHeight: "100vh" }}>
      {/* Success Message */}
      {showSuccess && (
        <div style={{
          position: 'fixed', top: 80, right: 20, zIndex: 99999,
          padding: '16px 24px', background: '#10b981', color: 'white',
          borderRadius: 8, boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          display: 'flex', alignItems: 'center', gap: 12
        }}>
          <IconCheckCircle />
          {showSuccess}
        </div>
      )}

      {/* Header */}
      <div style={{
        background: "#fff", padding: "24px 32px", borderRadius: 16,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        marginBottom: 24, boxShadow: "0 1px 3px 0 rgba(16,24,40,0.1), 0 1px 2px 0 rgba(16,24,40,0.06)",
        border: "1px solid #e4e7ec"
      }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1d2939", marginBottom: 4 }}>
            Employee Onboarding
          </h1>
          <p style={{ color: "#667085", fontSize: 14 }}>Add multiple employees efficiently</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={saveDraft}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 16px", borderRadius: 8,
              fontSize: 14, fontWeight: 500, cursor: "pointer",
              background: "#fff", color: "#344054", border: "1px solid #d0d5dd"
            }}
          >
            <IconSave /> Save Draft
          </button>
          <button
            onClick={closeWindow}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "10px 16px", borderRadius: 8,
              fontSize: 14, fontWeight: 500, cursor: "pointer",
              background: "#fff", color: "#344054", border: "1px solid #d0d5dd"
            }}
          >
            <IconClose />
          </button>
        </div>
      </div>

      {/* Mode Selector */}
      <div style={{
        background: "#fff", padding: "20px 24px", borderRadius: 16,
        marginBottom: 24, boxShadow: "0 1px 3px 0 rgba(16,24,40,0.1), 0 1px 2px 0 rgba(16,24,40,0.06)",
        border: "1px solid #e4e7ec"
      }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12
        }}>
          {(['form', 'table', 'upload'] as Mode[]).map((m) => (
              <label
              key={m}
              onClick={() => setMode(m)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 8, padding: 16, border: `1px solid ${mode === m ? '#E6A79E' : '#d0d5dd'}`,
                  borderRadius: 8, cursor: "pointer", background: "#fff",
                  transition: "all 0.2s ease",
                  boxShadow: mode === m ? '0 0 0 4px rgba(230,167,158,0.25)' : 'none'
                }}
            >
              <span style={{ color: mode === m ? '#E6A79E' : '#667085' }}>
                {m === 'form' && <IconEdit />}
                {m === 'table' && <IconGrid />}
                {m === 'upload' && <IconUpload />}
              </span>
              <span style={{
                fontSize: 14, fontWeight: 500,
                color: mode === m ? '#E6A79E' : '#344054'
              }}>
                {m === 'form' && 'Form Mode'}
                {m === 'table' && 'Table Mode'}
                {m === 'upload' && 'Upload Document'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Main Container */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 350px", gap: 24,
        marginBottom: 24
      }}>
        {/* Left Panel */}
        <div style={{
          background: "#fff", borderRadius: 16,
          boxShadow: "0 1px 3px 0 rgba(16,24,40,0.1), 0 1px 2px 0 rgba(16,24,40,0.06)",
          border: "1px solid #e4e7ec", overflow: "hidden"
        }}>
          {/* FORM MODE */}
          {mode === 'form' && (
            <div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "20px 24px",
                borderBottom: "1px solid #f2f4f7"
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939" }}>Form Mode</h3>
                <span style={{
                  background: "#f2f4f7", color: "#344054",
                  padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600
                }}>Step-by-step entry</span>
              </div>

              {/* Progress Bar */}
              <div style={{
                display: "flex", alignItems: "center",
                margin: "32px 24px", position: "relative"
              }}>
                {[1, 2, 3].map((step) => (
                  <React.Fragment key={step}>
                    <div style={{
                      display: "flex", flexDirection: "column",
                      alignItems: "center", gap: 8, zIndex: 1, flex: 1
                    }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%",
                        background: currentStep >= step ? "#E6A79E" : "#f2f4f7",
                        color: currentStep >= step ? "#fff" : "#98a2b3",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, fontSize: 16,
                        border: currentStep >= step ? "none" : "2px solid #e4e7ec",
                        boxShadow: currentStep === step ? "0 0 0 4px rgba(230,167,158,0.3)" : "none"
                      }}>
                        {step}
                      </div>
                      <span style={{
                        fontSize: 12, color: currentStep >= step ? "#E6A79E" : "#667085",
                        fontWeight: currentStep >= step ? 600 : 500
                      }}>
                        {step === 1 && 'Personal'}
                        {step === 2 && 'Employment'}
                        {step === 3 && 'Account'}
                      </span>
                    </div>
                    {step < 3 && (
                      <div style={{
                        height: 2, background: "#e4e7ec", flex: 1,
                        margin: "0 8px", position: "relative", top: -12
                      }} />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Step 1: Personal Information */}
              {currentStep === 1 && (
                <div style={{ padding: "0 24px 24px" }}>
                  <h4 style={{
                    fontSize: 18, fontWeight: 600, color: "#1d2939",
                    marginBottom: 20, paddingBottom: 12,
                    borderBottom: "1px solid #f2f4f7"
                  }}>Personal Information</h4>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      Full Name <span style={{ color: "#f04438" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }}>
                        <IconUser />
                      </span>
                      <input
                        type="text"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="John Smith"
                        style={{
                          width: "100%", padding: "10px 12px 10px 40px",
                          border: "1px solid #d0d5dd", borderRadius: 8,
                          fontSize: 14, outline: "none"
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      Email Address <span style={{ color: "#f04438" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }}>
                        <IconMail />
                      </span>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john.smith@company.com"
                        style={{
                          width: "100%", padding: "10px 12px 10px 40px",
                          border: "1px solid #d0d5dd", borderRadius: 8,
                          fontSize: 14, outline: "none"
                        }}
                        required
                      />
                    </div>
                    <small style={{ display: "block", marginTop: 6, fontSize: 12, color: "#667085" }}>
                      Company email will be created
                    </small>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      Phone Number
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }}>
                        <IconPhone />
                      </span>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+27 11 123 4567"
                        style={{
                          width: "100%", padding: "10px 12px 10px 40px",
                          border: "1px solid #d0d5dd", borderRadius: 8,
                          fontSize: 14, outline: "none"
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      South African ID Number <span style={{ color: "#f04438" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }}>
                        <IconCreditCard />
                      </span>
                      <input
                        type="text"
                        value={formData.id_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, id_number: e.target.value }))}
                        placeholder="8501015009087"
                        maxLength={13}
                        style={{
                          width: "100%", padding: "10px 12px 10px 40px",
                          border: "1px solid #d0d5dd", borderRadius: 8,
                          fontSize: 14, outline: "none"
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      Passport Number
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }}>
                        <IconBook />
                      </span>
                      <input
                        type="text"
                        value={formData.passport_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, passport_number: e.target.value }))}
                        placeholder="M12345678"
                        style={{
                          width: "100%", padding: "10px 12px 10px 40px",
                          border: "1px solid #d0d5dd", borderRadius: 8,
                          fontSize: 14, outline: "none"
                        }}
                      />
                    </div>
                    <small style={{ display: "block", marginTop: 6, fontSize: 12, color: "#667085" }}>
                      Optional - For international employees or work permits
                    </small>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      Residential Address <span style={{ color: "#f04438" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }}>
                        <IconMapPin />
                      </span>
                      <input
                        type="text"
                        value={formData.address_street}
                        onChange={(e) => setFormData(prev => ({ ...prev, address_street: e.target.value }))}
                        placeholder="123 Main Street"
                        style={{
                          width: "100%", padding: "10px 12px 10px 40px",
                          border: "1px solid #d0d5dd", borderRadius: 8,
                          fontSize: 14, outline: "none"
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      City <span style={{ color: "#f04438" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }}>
                        <IconMap />
                      </span>
                      <input
                        type="text"
                        value={formData.address_city}
                        onChange={(e) => setFormData(prev => ({ ...prev, address_city: e.target.value }))}
                        placeholder="Johannesburg"
                        style={{
                          width: "100%", padding: "10px 12px 10px 40px",
                          border: "1px solid #d0d5dd", borderRadius: 8,
                          fontSize: 14, outline: "none"
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      Province / State <span style={{ color: "#f04438" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }}>
                        <IconFlag />
                      </span>
                      <select
                        value={formData.address_province}
                        onChange={(e) => setFormData(prev => ({ ...prev, address_province: e.target.value }))}
                        style={{
                          width: "100%", padding: "10px 12px 10px 40px",
                          border: "1px solid #d0d5dd", borderRadius: 8,
                          fontSize: 14, outline: "none", background: "#fff"
                        }}
                        required
                      >
                        <option value="">Select Province</option>
                        <option value="Gauteng">Gauteng</option>
                        <option value="Western Cape">Western Cape</option>
                        <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                        <option value="Eastern Cape">Eastern Cape</option>
                        <option value="Free State">Free State</option>
                        <option value="Limpopo">Limpopo</option>
                        <option value="Mpumalanga">Mpumalanga</option>
                        <option value="Northern Cape">Northern Cape</option>
                        <option value="North West">North West</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      Postal Code <span style={{ color: "#f04438" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }}>
                        <IconHash />
                      </span>
                      <input
                        type="text"
                        value={formData.address_postal_code}
                        onChange={(e) => setFormData(prev => ({ ...prev, address_postal_code: e.target.value }))}
                        placeholder="2000"
                        maxLength={4}
                        style={{
                          width: "100%", padding: "10px 12px 10px 40px",
                          border: "1px solid #d0d5dd", borderRadius: 8,
                          fontSize: 14, outline: "none"
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{
                    display: "flex", gap: 12, marginTop: 32,
                    paddingTop: 20, borderTop: "1px solid #f2f4f7"
                  }}>
                    <button
                      onClick={clearForm}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "10px 16px", borderRadius: 8,
                        fontSize: 14, fontWeight: 500, cursor: "pointer",
                        background: "#fff", color: "#344054", border: "1px solid #d0d5dd"
                      }}
                    >
                      <IconClose /> Cancel
                    </button>
                    <button
                      onClick={nextStep}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "10px 16px", border: "none", borderRadius: 8,
                        fontSize: 14, fontWeight: 500, cursor: "pointer",
                        background: "#E6A79E", color: "#fff"
                      }}
                    >
                      Next: Employment Info <IconArrowRight />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Employment Details */}
              {currentStep === 2 && (
                <div style={{ padding: "0 24px 24px" }}>
                  <h4 style={{
                    fontSize: 18, fontWeight: 600, color: "#1d2939",
                    marginBottom: 20, paddingBottom: 12,
                    borderBottom: "1px solid #f2f4f7"
                  }}>Employment Details</h4>

                  <div style={{
                    background: "#f9fafb", padding: "12px 16px",
                    borderRadius: 8, marginBottom: 20,
                    display: "flex", alignItems: "center", gap: 12,
                    border: "1px solid #e4e7ec"
                  }}>
                    <span style={{ fontWeight: 600, color: "#344054", display: "flex", alignItems: "center", gap: 6 }}>
                      <IconZap /> Quick Fill:
                    </span>
                    <button
                      onClick={() => generateEmployeeCode()}
                      style={{
                        padding: "8px 14px", fontSize: 13,
                        background: "#fff", color: "#344054",
                        border: "1px solid #d0d5dd", borderRadius: 6,
                        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6
                      }}
                    >
                      <IconRefresh /> Generate Code
                    </button>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      Employee Code (Auto-generated)
                    </label>
                    <div style={{ display: "flex" }}>
                      <input
                        type="text"
                        value={formData.employee_code}
                        readOnly
                        placeholder="EMP2024001"
                        style={{
                          flex: 1, padding: "10px 12px",
                          border: "1px solid #d0d5dd", borderRadius: "8px 0 0 8px",
                          fontSize: 14, outline: "none", background: "#f9fafb"
                        }}
                      />
                      <button
                        onClick={generateEmployeeCode}
                        style={{
                          padding: "10px", border: "1px solid #d0d5dd",
                          borderLeft: "none", background: "#fff",
                          borderRadius: "0 8px 8px 0", cursor: "pointer"
                        }}
                      >
                        <IconRefresh />
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      Position <span style={{ color: "#f04438" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }}>
                        <IconBriefcase />
                      </span>
                      <input
                        type="text"
                        value={formData.position}
                        onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                        placeholder="Sales Representative"
                        list="positionsList"
                        style={{
                          width: "100%", padding: "10px 12px 10px 40px",
                          border: "1px solid #d0d5dd", borderRadius: 8,
                          fontSize: 14, outline: "none"
                        }}
                        required
                      />
                      <datalist id="positionsList">
                        <option value="Sales Representative" />
                        <option value="Developer" />
                        <option value="Manager" />
                        <option value="Analyst" />
                        <option value="Coordinator" />
                      </datalist>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      Department <span style={{ color: "#f04438" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }}>
                        <IconLayers />
                      </span>
                      <select
                        value={formData.department}
                        onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                        style={{
                          width: "100%", padding: "10px 12px 10px 40px",
                          border: "1px solid #d0d5dd", borderRadius: 8,
                          fontSize: 14, outline: "none", background: "#fff"
                        }}
                        required
                      >
                        <option value="">Select Department</option>
                        <option value="Sales">Sales</option>
                        <option value="IT">IT</option>
                        <option value="HR">HR</option>
                        <option value="Finance">Finance</option>
                        <option value="Operations">Operations</option>
                        <option value="Marketing">Marketing</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      Employment Type <span style={{ color: "#f04438" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }}>
                        <IconClock />
                      </span>
                      <select
                        value={formData.employment_type}
                        onChange={(e) => setFormData(prev => ({ ...prev, employment_type: e.target.value }))}
                        style={{
                          width: "100%", padding: "10px 12px 10px 40px",
                          border: "1px solid #d0d5dd", borderRadius: 8,
                          fontSize: 14, outline: "none", background: "#fff"
                        }}
                        required
                      >
                        <option value="Full Time">Full Time</option>
                        <option value="Part Time">Part Time</option>
                        <option value="Contract">Contract</option>
                        <option value="Intern">Intern</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      Start Date <span style={{ color: "#f04438" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }}>
                        <IconCalendar />
                      </span>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        style={{
                          width: "100%", padding: "10px 12px 10px 40px",
                          border: "1px solid #d0d5dd", borderRadius: 8,
                          fontSize: 14, outline: "none"
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      Work Location
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }}>
                        <IconMapPin />
                      </span>
                      <select
                        value={formData.work_location}
                        onChange={(e) => setFormData(prev => ({ ...prev, work_location: e.target.value }))}
                        style={{
                          width: "100%", padding: "10px 12px 10px 40px",
                          border: "1px solid #d0d5dd", borderRadius: 8,
                          fontSize: 14, outline: "none", background: "#fff"
                        }}
                      >
                        <option value="">Select Location</option>
                        <option value="Johannesburg Office">Johannesburg Office</option>
                        <option value="Cape Town Office">Cape Town Office</option>
                        <option value="Durban Office">Durban Office</option>
                        <option value="Remote">Remote</option>
                      </select>
                    </div>
                  </div>

                  <div style={{
                    display: "flex", gap: 12, marginTop: 32,
                    paddingTop: 20, borderTop: "1px solid #f2f4f7"
                  }}>
                    <button
                      onClick={prevStep}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "10px 16px", borderRadius: 8,
                        fontSize: 14, fontWeight: 500, cursor: "pointer",
                        background: "#fff", color: "#344054", border: "1px solid #d0d5dd"
                      }}
                    >
                      <IconArrowLeft /> Back
                    </button>
                    <button
                      onClick={nextStep}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 8,
                        padding: "10px 16px", border: "none", borderRadius: 8,
                        fontSize: 14, fontWeight: 500, cursor: "pointer",
                        background: "#E6A79E", color: "#fff"
                      }}
                    >
                      Next: Account Setup <IconArrowRight />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Account Setup */}
              {currentStep === 3 && (
                <div style={{ padding: "0 24px 24px" }}>
                  <h4 style={{
                    fontSize: 18, fontWeight: 600, color: "#1d2939",
                    marginBottom: 20, paddingBottom: 12,
                    borderBottom: "1px solid #f2f4f7"
                  }}>Account Setup</h4>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      Password <span style={{ color: "#f04438" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }}>
                        <IconLock />
                      </span>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        placeholder="Min. 6 characters"
                        style={{
                          width: "100%", padding: "10px 12px 10px 40px",
                          border: "1px solid #d0d5dd", borderRadius: 8,
                          fontSize: 14, outline: "none"
                        }}
                        required={formData.create_account}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{ display: "block", marginBottom: 6, color: "#344054", fontWeight: 500, fontSize: 14 }}>
                      Confirm Password <span style={{ color: "#f04438" }}>*</span>
                    </label>
                    <div style={{ position: "relative" }}>
                      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#98a2b3" }}>
                        <IconLock />
                      </span>
                      <input
                        type="password"
                        value={formData.confirm_password}
                        onChange={(e) => setFormData(prev => ({ ...prev, confirm_password: e.target.value }))}
                        placeholder="Re-enter password"
                        style={{
                          width: "100%", padding: "10px 12px 10px 40px",
                          border: "1px solid #d0d5dd", borderRadius: 8,
                          fontSize: 14, outline: "none"
                        }}
                        required={formData.create_account}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{
                      display: "flex", alignItems: "center", gap: 12,
                      cursor: "pointer", position: "relative", paddingLeft: 28
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.send_email}
                        onChange={(e) => setFormData(prev => ({ ...prev, send_email: e.target.checked }))}
                        style={{ position: "absolute", opacity: 0 }}
                      />
                      <span style={{
                        position: "absolute", left: 0, height: 20, width: 20,
                        backgroundColor: "#fff", border: "1.5px solid #d0d5dd",
                        borderRadius: 6, transition: "all 0.2s ease"
                      }} />
                      <span style={{ fontSize: 14, color: "#344054", fontWeight: 500 }}>
                        Send welcome email
                      </span>
                    </label>
                  </div>

                  <div style={{ marginBottom: 20 }}>
                    <label style={{
                      display: "flex", alignItems: "center", gap: 12,
                      cursor: "pointer", position: "relative", paddingLeft: 28
                    }}>
                      <input
                        type="checkbox"
                        checked={formData.create_account}
                        onChange={(e) => setFormData(prev => ({ ...prev, create_account: e.target.checked }))}
                        style={{ position: "absolute", opacity: 0 }}
                      />
                      <span style={{
                        position: "absolute", left: 0, height: 20, width: 20,
                        backgroundColor: formData.create_account ? "#E6A79E" : "#fff",
                        border: `1.5px solid ${formData.create_account ? '#E6A79E' : '#d0d5dd'}`,
                        borderRadius: 6, transition: "all 0.2s ease"
                      }} />
                      <span style={{ fontSize: 14, color: "#344054", fontWeight: 500 }}>
                        Create system account
                      </span>
                    </label>
                    <small style={{ display: "block", marginTop: 6, fontSize: 12, color: "#667085" }}>
                      When checked, the employee can log in to the employee portal with their email and this password.
                    </small>
                  </div>

                  <div style={{ height: 1, background: "#f2f4f7", margin: "24px 0" }} />

                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <h5 style={{ fontSize: 14, fontWeight: 600, color: "#344054", marginBottom: 8 }}>What next?</h5>
                    <button
                      onClick={prevStep}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, width: "100%",
                        padding: "10px 16px", borderRadius: 8,
                        fontSize: 14, fontWeight: 500, cursor: "pointer",
                        background: "#fff", color: "#344054", border: "1px solid #d0d5dd"
                      }}
                    >
                      <IconArrowLeft /> Back
                    </button>
                    <button
                      onClick={() => addToQueue(false, false)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, width: "100%",
                        padding: "10px 16px", border: "none", borderRadius: 8,
                        fontSize: 14, fontWeight: 500, cursor: "pointer",
                        background: "#E6A79E", color: "#fff"
                      }}
                    >
                      <IconPlusCircle /> Add to Queue
                    </button>
                    <button
                      onClick={() => addToQueue(true, false)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, width: "100%",
                        padding: "10px 16px", border: "none", borderRadius: 8,
                        fontSize: 14, fontWeight: 500, cursor: "pointer",
                        background: "#E6A79E", color: "#fff"
                      }}
                    >
                      <IconRepeat /> Add to Queue & Continue
                    </button>
                    <button
                      onClick={() => addToQueue(false, true)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8, width: "100%",
                        padding: "10px 16px", border: "none", borderRadius: 8,
                        fontSize: 14, fontWeight: 500, cursor: "pointer",
                        background: "#12b76a", color: "#fff"
                      }}
                    >
                      <IconCheckCircle /> Add & Process All
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TABLE MODE */}
          {mode === 'table' && (
            <div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "20px 24px",
                borderBottom: "1px solid #f2f4f7"
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939" }}>Table Mode</h3>
                <button
                  onClick={addTableRow}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "8px 14px", border: "none", borderRadius: 6,
                    fontSize: 13, fontWeight: 500, cursor: "pointer",
                    background: "#E6A79E", color: "#fff"
                  }}
                >
                  <IconPlus /> Add Row
                </button>
              </div>

              <div style={{
                background: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
                border: "1px solid #2196f3", color: "#1565c0",
                padding: "12px 16px", margin: "20px 24px",
                borderRadius: 8, display: "flex", alignItems: "center", gap: 8,
                fontSize: 13
              }}>
                <IconInfo />
                <span><strong>Wide Table Mode:</strong> This table has 14 columns. <strong style={{ color: "#d32f2f" }}>Scroll right</strong> to see and fill all fields.</span>
              </div>

              <div style={{
                overflowX: "auto", margin: "0 24px 20px 24px",
                borderRadius: 8, boxShadow: "inset 0 0 0 1px #e4e7ec",
                maxWidth: "calc(100vw - 400px)", position: "relative"
              }}>
                <div style={{
                  position: "sticky", right: 0, top: 0, float: "right",
                  background: "linear-gradient(to left, rgba(70,95,255,0.9), transparent)",
                  color: "#fff", padding: "8px 16px", fontSize: 12,
                  fontWeight: "bold", borderRadius: "0 0 0 8px",
                  zIndex: 10, pointerEvents: "none"
                }}>
                  Scroll to see more columns
                </div>
                <table style={{
                  width: "auto", minWidth: "2200px",
                  borderCollapse: "collapse", fontSize: 14
                }}>
                  <thead style={{ background: "#f9fafb", borderBottom: "1px solid #e4e7ec" }}>
                    <tr>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#667085", width: 40 }}>#</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#667085", minWidth: 180 }}>Full Name *</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#667085", minWidth: 200 }}>Email Address *</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#667085", minWidth: 140 }}>ID Number</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#667085", minWidth: 140 }}>Phone Number</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#667085", minWidth: 130 }}>Passport</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#667085", minWidth: 200 }}>Address *</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#667085", minWidth: 130 }}>City *</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#667085", minWidth: 130 }}>Province *</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#667085", minWidth: 100 }}>Postal *</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#667085", minWidth: 130 }}>Department *</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#667085", minWidth: 160 }}>Position *</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#667085", minWidth: 140 }}>Start Date *</th>
                      <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 600, fontSize: 12, color: "#667085", width: 80 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="tableBody">
                    {tableRows.map((row, index) => (
                      <TableRow
                        key={`item-${index}`}
                        index={index + 1}
                        data={row}
                        onChange={(field, value) => updateTableRow(index, field, value)}
                        onRemove={() => removeTableRow(index)}
                      />
                    ))}
                    {tableRows.length === 0 && (
                      <tr>
                        <td colSpan={14} style={{ padding: "40px", textAlign: "center", color: "#98a2b3" }}>
                          <IconInbox style={{ width: 48, height: 48, margin: "0 auto 16px", color: "#d0d5dd" }} />
                          <p>No rows added yet. Click "Add Row" to start.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{
                background: "#f9fafb", padding: "16px 24px",
                margin: "0 24px 20px 24px", borderRadius: 8,
                border: "1px solid #e4e7ec"
              }}>
                <h5 style={{
                  display: "flex", alignItems: "center", gap: 8,
                  marginBottom: 12, color: "#1d2939",
                  fontWeight: 600, fontSize: 14
                }}>
                  <IconSliders /> Bulk Actions
                </h5>
                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 500, color: "#344054", fontSize: 14 }}>Set for all rows:</span>
                  <select
                    value={bulkDepartment}
                    onChange={(e) => setBulkDepartment(e.target.value)}
                    style={{
                      padding: "8px 12px", border: "1px solid #d0d5dd",
                      borderRadius: 6, fontSize: 13, background: "#fff"
                    }}
                  >
                    <option value="">Department</option>
                    <option value="Sales">Sales</option>
                    <option value="IT">IT</option>
                    <option value="HR">HR</option>
                    <option value="Finance">Finance</option>
                    <option value="Operations">Operations</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                  <input
                    type="date"
                    value={bulkStartDate}
                    onChange={(e) => setBulkStartDate(e.target.value)}
                    style={{
                      padding: "8px 12px", border: "1px solid #d0d5dd",
                      borderRadius: 6, fontSize: 13
                    }}
                  />
                  <button
                    onClick={applyBulkValues}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "8px 14px", border: "none", borderRadius: 6,
                      fontSize: 13, fontWeight: 500, cursor: "pointer",
                      background: "#E6A79E", color: "#fff"
                    }}
                  >
                    <IconCheck /> Apply to Empty Cells
                  </button>
                </div>
              </div>

              <div style={{
                display: "flex", gap: 12, margin: "0 24px 24px",
                paddingTop: 20, borderTop: "1px solid #f2f4f7"
              }}>
                <button
                  onClick={validateTable}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "10px 16px", borderRadius: 8,
                    fontSize: 14, fontWeight: 500, cursor: "pointer",
                    background: "#fff", color: "#344054", border: "1px solid #d0d5dd"
                  }}
                >
                  <IconCheckSquare /> Validate All
                </button>
                <button
                  onClick={addTableToQueue}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "10px 16px", border: "none", borderRadius: 8,
                    fontSize: 14, fontWeight: 500, cursor: "pointer",
                    background: "#E6A79E", color: "#fff"
                  }}
                >
                  Add All to Queue <IconArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* UPLOAD MODE */}
          {mode === 'upload' && (
            <div>
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "center", padding: "20px 24px",
                borderBottom: "1px solid #f2f4f7"
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939" }}>Upload Document</h3>
                <span style={{
                  background: "#f2f4f7", color: "#344054",
                  padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600
                }}>Auto extract data</span>
              </div>

              <div style={{
                margin: "24px", border: "2px dashed #d0d5dd",
                borderRadius: 12, padding: "60px 20px", textAlign: "center",
                cursor: "pointer", transition: "all 0.3s ease",
                background: "#f9fafb"
              }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileUpload({ target: { files: [file] } } as any);
                }}
                onClick={() => document.getElementById('fileInput')?.click()}
              >
                <div style={{ color: "#98a2b3", marginBottom: 20 }}>
                  <IconUpload style={{ width: 64, height: 64 }} />
                </div>
                <h4 style={{ color: "#1d2939", marginBottom: 8, fontSize: 18, fontWeight: 600 }}>
                  {uploading ? 'Processing Document...' : 'Upload Employee Document'}
                </h4>
                <p style={{ color: "#667085", marginBottom: 4, fontSize: 14 }}>
                  {uploading ? 'Extracting employee data...' : 'Drag & drop or click to upload'}
                </p>
                <p style={{ fontSize: 12, color: "#98a2b3", marginBottom: 20 }}>
                  Supports: PDF, Excel (.xlsx, .xls), CSV, Word (.docx)
                </p>
                <input
                  id="fileInput"
                  type="file"
                  accept=".pdf,.xlsx,.xls,.csv,.docx"
                  onChange={handleFileUpload}
                  style={{ display: "none" }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    document.getElementById('fileInput')?.click();
                  }}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "10px 16px", border: "none", borderRadius: 8,
                    fontSize: 14, fontWeight: 500, cursor: "pointer",
                    background: "#E6A79E", color: "#fff"
                  }}
                >
                  <IconUpload /> Choose File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Queue */}
        <div style={{
          background: "#fff", borderRadius: 16,
          boxShadow: "0 1px 3px 0 rgba(16,24,40,0.1), 0 1px 2px 0 rgba(16,24,40,0.06)",
          border: "1px solid #e4e7ec", overflow: "hidden",
          position: "sticky", top: 24, maxHeight: "calc(100vh - 48px)",
          display: "flex", flexDirection: "column"
        }}>
          <div style={{
            display: "flex", justifyContent: "space-between",
            alignItems: "center", padding: "20px 24px",
            borderBottom: "1px solid #f2f4f7"
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939" }}>Queue</h3>
            <span style={{
              background: "#E6A79E", color: "#fff",
              padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: 600
            }}>{queue.length}</span>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #E6A79E, #d88574)",
            padding: "16px 24px", margin: "0 24px 20px 24px",
            borderRadius: 12, color: "#fff", display: "flex",
            alignItems: "center", gap: 16, boxShadow: "0 4px 8px -2px rgba(16,24,40,0.1)"
          }}>
            <IconUsers style={{ width: 32, height: 32, opacity: 0.9 }} />
            <div>
              <p style={{ fontSize: 12, opacity: 0.9, marginBottom: 4 }}>Employees Ready</p>
              <p style={{ fontSize: 24, fontWeight: 700 }}>{queue.length}</p>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "0 24px 20px 24px" }}>
            {queue.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#667085" }}>
                <IconInbox style={{ width: 48, height: 48, color: "#d0d5dd", margin: "0 auto 16px" }} />
                <p style={{ marginBottom: 8, fontWeight: 600, fontSize: 14, color: "#344054" }}>No employees in queue</p>
                <small style={{ fontSize: 12, color: "#98a2b3" }}>Add employees using the form or table mode</small>
              </div>
            ) : (
              queue.map((item, index) => (
                <QueueItemComponent
                  key={item.tempId}
                  item={item}
                  index={index}
                  onRemove={removeFromQueue}
                />
              ))
            )}
          </div>

          <div style={{ padding: "20px 24px", borderTop: "1px solid #f2f4f7" }}>
            <button
              onClick={clearQueue}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "10px 16px", borderRadius: 8,
                fontSize: 14, fontWeight: 500, cursor: "pointer",
                background: "#fff", color: "#344054", border: "1px solid #d0d5dd",
                marginBottom: 12
              }}
            >
              <IconTrash /> Clear All
            </button>
            <button
              onClick={() => processQueue()}
              disabled={queue.length === 0}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "10px 16px", border: "none", borderRadius: 8,
                fontSize: 14, fontWeight: 500, cursor: queue.length === 0 ? "not-allowed" : "pointer",
                background: queue.length === 0 ? "#d0d5dd" : "#12b76a",
                color: "#fff", opacity: queue.length === 0 ? 0.5 : 1
              }}
            >
              Process All Employees <IconArrowRight />
            </button>
          </div>
        </div>
      </div>

      {/* Tip Footer */}
      <div style={{
        background: "linear-gradient(135deg, #ecf3ff, #dde9ff)",
        padding: "16px 24px", borderRadius: 12, textAlign: "center",
        color: "#3641f5", fontSize: 14, fontWeight: 500,
        border: "1px solid #9cb9ff", display: "flex",
        alignItems: "center", justifyContent: "center", gap: 8
      }}>
        <IconLightbulb />
        <span>Tip: Add employees in your preferred mode, review queue, then process all at once</span>
      </div>
    </div>
  );
}

// ==================== MAIN EXPORT ====================
const ManageEmployees: React.FC = () => (
  <SharedLayout title="Manage Employees">
    <ManageEmployeesContent />
  </SharedLayout>
);

export default ManageEmployees;
