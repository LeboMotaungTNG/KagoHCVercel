/**
 * EmployeeProfile – rich profile view for a single employee.
 *
 * Fetches and presents personal details, employment info and
 * related records in a manager-friendly layout via `SharedLayout`.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SharedLayout from "./SharedLayout";

// --- Types (previously from admin/employee-profile.types) --------------------

interface ApiEmployee {
  id: string;
  employee_code: string;
  full_name: string;
  fullName: string;
  department: string;
  position: string;
  email: string;
  phone: string;
  profile_image: string;
  status: string;
  personal_info?: {
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    date_of_birth?: string;
    gender?: string;
    nationality?: string;
    id_number?: string;
  };
  employment_details?: {
    employee_code?: string;
    department?: string;
    position?: string;
    hire_date?: string;
    employment_status?: string;
    employment_type?: string;
    work_location?: string;
  };
  contact_info?: {
    personal_email?: string;
    work_email?: string;
    personal_phone?: string;
    work_phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relation?: string;
  };
  banking_details?: {
    bank_name?: string;
    account_number?: string;
    account_holder_name?: string;
    bank_branch?: string;
    tax_id?: string;
  };
}

interface ApiResponse<T> {
  status: "success" | "error";
  data?: T;
  message?: string;
}

// --- Inline SVG Icons (used by page content) ---

const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);


const IconPerson: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    {...props}
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconPersonBadge = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><path d="M15 10l2 2 4-4" />
  </svg>
);

const IconFolder = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const IconCalendarCheck = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><path d="M9 16l2 2 4-4" />
  </svg>
);

const IconCash = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M16 4H2v12h14V4z" /><path d="M22 8h-4v8H6v4h16V8z" /><circle cx="9" cy="13" r="2" /><circle cx="16" cy="11" r="2" />
  </svg>
);

const IconClipboard = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const IconPC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
  </svg>
);

const IconFileGraph = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconPersonX = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><line x1="18" y1="8" x2="23" y2="13" /><line x1="23" y1="8" x2="18" y2="13" />
  </svg>
);

const IconCamera = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" />
  </svg>
);

const IconFileText = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
  </svg>
);

const IconCompass = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const IconArrowLeft = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M15.8332 10H4.1665M4.1665 10L9.1665 15M4.1665 10L9.1665 5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M16.6668 5L7.50016 14.1667L3.3335 10" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconExclamation = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="10" r="9" /><line x1="10" y1="6" x2="10" y2="10" /><circle cx="10" cy="14" r="0.5" fill="currentColor" />
  </svg>
);

const IconInfo = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="10" r="9" /><line x1="10" y1="6" x2="10" y2="10" /><line x1="10" y1="14" x2="10.01" y2="14" />
  </svg>
);

const IconDownload = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M15 12v3H5v-3M10 2v9m-3-3l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconEnvelope = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="2" y="4" width="16" height="12" rx="2" /><path d="M2 6l8 5 8-5" />
  </svg>
);

const IconPause = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="10" cy="10" r="9" /><line x1="8" y1="7" x2="8" y2="13" /><line x1="12" y1="7" x2="12" y2="13" />
  </svg>
);

const IconRefresh = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M17.5 10.8333C17.5 14.975 14.1417 18.3333 10 18.3333C5.85833 18.3333 2.5 14.975 2.5 10.8333C2.5 6.69167 5.85833 3.33333 10 3.33333C12.75 3.33333 15.1167 4.91667 16.25 7.29167M17.5 3.33333V7.5H13.3333" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconPlus = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="10" y1="4" x2="10" y2="16" /><line x1="4" y1="10" x2="16" y2="10" />
  </svg>
);

const IconThreeDots = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <circle cx="10" cy="10" r="2" /><circle cx="16" cy="10" r="2" /><circle cx="4" cy="10" r="2" />
  </svg>
);

const IconLinkedIn = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M5 3h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v10h10V5H5zm1 2h2v6H6V7zm1-1a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 4v3h2v-3a1 1 0 0 0-2 0z" />
  </svg>
);

const IconTwitter = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M18.3332 4.9999C17.7815 5.24707 17.1832 5.41423 16.5573 5.49507C17.1948 5.11423 17.6848 4.52257 17.9148 3.81157C17.3123 4.1649 16.6448 4.4199 15.9323 4.55907C15.3648 3.9524 14.5748 3.59157 13.7065 3.59157C12.0323 3.59157 10.674 4.9499 10.674 6.6249C10.674 6.86824 10.7015 7.10324 10.7523 7.3249C8.23817 7.19907 6.00233 5.98907 4.47817 4.14824C4.20817 4.62407 4.054 5.1774 4.054 5.76824C4.054 6.88657 4.624 7.88157 5.4965 8.4474C4.974 8.4324 4.47817 8.28657 4.05233 8.04507V8.0824C4.05233 9.5599 5.099 10.7824 6.49567 11.0666C6.234 11.1407 5.954 11.1782 5.6665 11.1782C5.46567 11.1782 5.2715 11.1599 5.0815 11.1207C5.4765 12.3216 6.59733 13.2016 7.9315 13.2249C6.894 14.0332 5.59233 14.5282 4.17733 14.5282C3.92483 14.5282 3.6765 14.5149 3.431 14.4866C4.77317 15.3499 6.36067 15.8566 8.064 15.8566C13.6998 15.8566 16.7598 11.1707 16.7598 7.10407C16.7598 6.96657 16.7565 6.82907 16.7498 6.69324C17.3615 6.2499 17.8915 5.69157 18.3315 5.04324L18.3332 4.9999z" />
  </svg>
);

const IconFacebook = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M18.3332 10C18.3332 5.39746 14.6024 1.66663 9.99984 1.66663C5.3973 1.66663 1.6665 5.39746 1.6665 9.99996C1.6665 13.9908 4.58317 17.2916 8.33317 18.1241V12.9166H6.6665V9.99996H8.33317V7.70829C8.33317 6.08913 9.614 4.79163 11.2498 4.79163H13.3332V7.70829H11.6665C11.2065 7.70829 10.8332 8.08163 10.8332 8.54163V9.99996H13.3332V12.9166H10.8332V18.2083C14.8748 17.6458 18.3332 14.2125 18.3332 10Z" />
  </svg>
);

const IconInstagram = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 3.1785C12.2 3.1785 12.4665 3.186 13.304 3.2225C14.0925 3.257 15.189 3.4505 15.87 4.1315C16.551 4.8125 16.7425 5.909 16.779 6.6975C16.8155 7.535 16.823 7.8015 16.823 10.0015C16.823 12.2015 16.8155 12.468 16.779 13.3055C16.7425 14.094 16.551 15.1905 15.87 15.8715C15.189 16.5525 14.0925 16.744 13.304 16.7805C12.4675 16.817 12.201 16.8245 10 16.8245C7.8 16.8245 7.5335 16.817 6.696 16.7805C5.9075 16.744 4.811 16.5525 4.13 15.8715C3.449 15.1905 3.2575 14.094 3.221 13.3055C3.1845 12.467 3.177 12.2005 3.177 10.0005C3.177 7.8005 3.1845 7.534 3.221 6.6965C3.2575 5.908 3.449 4.8115 4.13 4.1305C4.811 3.4495 5.9075 3.258 6.696 3.2215C7.534 3.185 7.8 3.1775 10 3.1775V3.1785ZM10 1.66663C7.752 1.66663 7.457 1.67663 6.605 1.71313C5.755 1.74963 4.163 1.95296 2.996 3.11996C1.829 4.28696 1.6275 5.87896 1.589 6.72896C1.5525 7.58096 1.5425 7.87596 1.5425 10.1241C1.5425 12.3721 1.5525 12.6671 1.589 13.5191C1.62667 14.3691 1.83 15.9611 2.996 17.1271C4.162 18.2931 5.755 18.4956 6.605 18.5341C7.4575 18.5706 7.7515 18.5806 10 18.5806C12.2485 18.5806 12.543 18.5706 13.395 18.5341C14.245 18.4965 15.8375 18.2931 17.004 17.1271C18.171 15.9611 18.373 14.3691 18.411 13.5191C18.4475 12.6671 18.4575 12.3721 18.4575 10.1241C18.4575 7.87613 18.4475 7.58113 18.411 6.72913C18.373 5.87913 18.171 4.28713 17.004 3.12013C15.8375 1.95313 14.244 1.75163 13.395 1.71313C12.543 1.67663 12.2485 1.66663 10 1.66663Z" />
    <path d="M10 4.83984C7.15 4.83984 4.83984 7.15001 4.83984 10C4.83984 12.85 7.15 15.1602 10 15.1602C12.85 15.1602 15.1602 12.85 15.1602 10C15.1602 7.15001 12.85 4.83984 10 4.83984ZM10 13.3332C8.16 13.3332 6.66667 11.84 6.66667 10C6.66667 8.16001 8.16 6.66668 10 6.66668C11.84 6.66668 13.3333 8.16001 13.3333 10C13.3333 11.84 11.84 13.3332 10 13.3332Z" />
    <circle cx="15.2304" cy="4.78621" r="0.9" />
  </svg>
);

// --- Employee Profile Content ---

// UI-facing employee shape used by this React component.
// It is derived from the API Employee type defined in employee-profile.types.ts.
interface Employee {
  id: string;
  employeeId?: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  idNumber: string;
  gender: string;
  nationality: string;
  taxNumber: string;
  bio: string;
  position: string;
  department: string;
  employmentType: string;
  status: string;
  startDate: string;
  workLocation: string;
  bankName: string;
  bankAccountNumber: string;
  branchCode: string;
  linkedin: string;
  twitter: string;
  facebook: string;
  instagram: string;
  profilePicture: string | null;
  streetName?: string;
  suburb?: string;
  city?: string;
  postalCode?: string;
}

interface EditForm {
  fullName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  bio: string;
  dateOfBirth: string;
  gender: string;
  nationality: string;
  employmentType: string;
  startDate: string;
  workLocation: string;
  taxNumber: string;
  bankName: string;
  bankAccountNumber: string;
  branchCode: string;
  idNumber: string;
  streetName?: string;
  suburb?: string;
  city?: string;
  postalCode?: string;
}

interface Alert {
  show: boolean;
  type: 'success' | 'error' | 'info';
  message: string;
}

const MOCK_API_EMPLOYEE: ApiEmployee = {
  id: "EMP001",
  employee_code: "EMP001",
  full_name: "Jane Doe",
  fullName: "Jane Doe",
  department: "Engineering",
  position: "Software Engineer",
  email: "jane.doe@example.com",
  phone: "+27 71 000 0000",
  profile_image: "",
  status: "active",
  personal_info: {
    first_name: "Jane",
    last_name: "Doe",
    date_of_birth: "1992-05-10",
    gender: "female",
    nationality: "South African",
    id_number: "9205101234088",
  },
  employment_details: {
    employee_code: "EMP001",
    department: "Engineering",
    position: "Software Engineer",
    hire_date: "2022-01-15",
    employment_status: "permanent",
    work_location: "Johannesburg Office",
  },
  contact_info: {
    personal_email: "jane.doe@example.com",
    work_email: "jane.doe@kagohc.com",
    personal_phone: "+27 71 000 0000",
    work_phone: "+27 10 555 0000",
    address: "123 Main Road",
    city: "Johannesburg",
    state: "Gauteng",
    postal_code: "2000",
    country: "South Africa",
    emergency_contact_name: "John Doe",
    emergency_contact_phone: "+27 72 000 0000",
    emergency_contact_relation: "Spouse",
  },
  banking_details: {
    bank_name: "Standard Bank",
    account_number: "1234567890",
    account_holder_name: "Jane Doe",
    tax_id: "TX1234567",
  },
};

const mapApiEmployeeToEmployee = (d: ApiEmployee): Employee => ({
  id: d.id,
  employeeId: d.employee_code,
  fullName: d.fullName || d.full_name,
  email: d.email || d.contact_info?.personal_email || "",
  phone: d.phone || d.contact_info?.personal_phone || "",
  dateOfBirth: d.personal_info?.date_of_birth || "",
  idNumber: d.personal_info?.id_number || "",
  gender: d.personal_info?.gender || "",
  nationality: d.personal_info?.nationality || "",
  taxNumber: d.banking_details?.tax_id || "",
  bio: d.personal_info?.middle_name || "",
  position: d.employment_details?.position || d.position || "",
  department: d.employment_details?.department || d.department,
  employmentType: d.employment_details?.employment_type || "",
  status: d.status,
  startDate: d.employment_details?.hire_date || "",
  workLocation: d.employment_details?.work_location || "",
  bankName: d.banking_details?.bank_name || "",
  bankAccountNumber: d.banking_details?.account_number || "",
  branchCode: d.banking_details?.bank_branch || "",
  linkedin: "",
  twitter: "",
  facebook: "",
  instagram: "",
  profilePicture: d.profile_image || null,
  streetName: d.contact_info?.address,
  suburb: undefined,
  city: d.contact_info?.city,
  postalCode: d.contact_info?.postal_code,
});

function EmployeeProfileContent() {
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

  const [employee, setEmployee] = useState<Employee>(mapApiEmployeeToEmployee(MOCK_API_EMPLOYEE));
  const [allEmployees, setAllEmployees] = useState<{ id: string; code: string; fullName: string; department: string }[]>([
    {
      id: MOCK_API_EMPLOYEE.id,
      code: MOCK_API_EMPLOYEE.employee_code,
      fullName: MOCK_API_EMPLOYEE.fullName || MOCK_API_EMPLOYEE.full_name,
      department: MOCK_API_EMPLOYEE.department,
    },
  ]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeesLoadError, setEmployeesLoadError] = useState('');
  const [pendingBankingRequest, setPendingBankingRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [alert, setAlert] = useState<Alert>({ show: false, type: 'info', message: '' });
  const [activeTab, setActiveTab] = useState('personal-info');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    fullName: '', email: '', phone: '', position: '', department: '',
    bio: '', dateOfBirth: '', gender: '', nationality: '',
    employmentType: '', startDate: '', workLocation: '',
    taxNumber: '', bankName: '', bankAccountNumber: '', branchCode: '', idNumber: '',
    streetName: '', suburb: '', city: '', postalCode: ''
  });

  const getInitials = (name: string) => {
    if (!name) return '??';
    return name.split(' ').map(p => p[0]).join('').toUpperCase().substring(0, 2);
  };

  const getProfileImageUrl = (path: string | null) => {
    if (!path) return '';
    const p = String(path).trim();
    if (p.startsWith('http') || p.startsWith('data:')) return p;
    if (p.startsWith('/')) return p;
    const rel = p.startsWith('../') ? p.slice(3) : p;
    return '../../' + rel;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatIDNumber = (idNumber: string) => {
    if (!idNumber) return 'Not provided';
    if (idNumber.length < 13) return idNumber;
    return `${idNumber.substring(0, 6)} ${idNumber.substring(6, 10)} ${idNumber.substring(10, 13)}`;
  };

  const formatStatus = (status: string) => {
    const m: Record<string, string> = { 
      'active': 'Active', 
      'inactive': 'Inactive', 
      'on_leave': 'On Leave', 
      'terminated': 'Terminated', 
      'suspended': 'Suspended' 
    };
    return m[status] || status;
  };

  const formatEmploymentType = (type: string) => {
    const m: Record<string, string> = { 
      'full-time': 'Full Time', 
      'full_time': 'Full Time', 
      'part-time': 'Part Time', 
      'part_time': 'Part Time', 
      'contract': 'Contract', 
      'intern': 'Intern', 
      'internship': 'Internship' 
    };
    return m[type] || type;
  };

  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlert({ show: true, type, message });
    setTimeout(() => { setAlert(prev => ({ ...prev, show: false })); }, 5000);
  };

  const loadAllEmployees = async () => {
    setEmployeesLoadError('');
    const token = localStorage.getItem('token');
    if (!token) { setEmployeesLoadError('Not authenticated.'); return; }
    try {
      const response = await fetch('https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1/employees', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      let arr: any[] = [];
      if (Array.isArray(data?.data?.data)) arr = data.data.data;
      else if (Array.isArray(data?.data)) arr = data.data;
      if (arr.length > 0) {
        setAllEmployees(arr.map((emp: any) => ({
          id: emp._id || emp.id,
          code: emp.employeeId || emp.employee_code || '',
          fullName: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.fullName || emp.full_name || '',
          department: emp.department?.name || emp.departmentName || emp.department || 'Unassigned',
        })));
      } else {
        setEmployeesLoadError('No employees found.');
      }
    } catch (error) {
      setEmployeesLoadError('Failed to load employees.');
    }
  };

  const loadEmployeeProfile = async (employeeId: string, openEdit = false) => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) { setIsLoading(false); return; }
    try {
      const response = await fetch(`https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1/employees/${employeeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      // API: { success, message, data: employee, timestamp }
      const raw = data.data || data;
      if (raw && (raw._id || raw.id)) {
        const mapped: Employee = {
          id: raw._id || raw.id,
          employeeId: raw.employeeId || raw.employee_code,
          fullName: `${raw.firstName || ''} ${raw.lastName || ''}`.trim() || raw.fullName || raw.full_name || '',
          email: raw.email || '',
          phone: raw.phone || '',
          dateOfBirth: raw.dateOfBirth || raw.date_of_birth || '',
          idNumber: raw.idNumber || raw.id_number || '',
          gender: raw.gender || '',
          nationality: raw.nationality || '',
          taxNumber: raw.taxNumber || raw.tax_id || '',
          bio: raw.bio || '',
          position: raw.position || '',
          department: raw.department?.name || raw.departmentName || raw.department || '',
          employmentType: raw.employmentType || raw.employment_type || '',
          status: raw.status || 'active',
          startDate: raw.startDate ? new Date(raw.startDate).toISOString().split('T')[0] : '',
          workLocation: raw.workLocation || raw.work_location || '',
          bankName: raw.bankName || '',
          bankAccountNumber: raw.bankAccountNumber || raw.account_number || '',
          branchCode: raw.branchCode || raw.branch_code || '',
          linkedin: raw.linkedin || '',
          twitter: raw.twitter || '',
          facebook: raw.facebook || '',
          instagram: raw.instagram || '',
          profilePicture: raw.profilePicture || raw.profile_image || null,
          streetName: raw.address?.street || raw.streetName || '',
          suburb: raw.suburb || '',
          city: raw.address?.city || raw.city || '',
          postalCode: raw.address?.zipCode || raw.postalCode || '',
        };
        setEmployee(mapped);
        setSelectedEmployeeId(employeeId);
        if (openEdit) setTimeout(() => openEditModal('info'), 100);
      } else {
        showAlert('Employee not found', 'error');
      }
    } catch (error) {
      showAlert('Failed to load employee profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPendingBankingRequest = async (employeeId: string) => {
    if (!employeeId) { setPendingBankingRequest(null); return; }
    try {
      const r = await fetch(`../../Php/Profile/employee_profile.php?action=get_pending_banking_requests&employee_id=${employeeId}`, { credentials: 'include' });
      const d = await r.json();
      setPendingBankingRequest((d.status === 'success' && d.data && d.data.length) ? d.data[0] : null);
    } catch (e) { setPendingBankingRequest(null); }
  };

  const approveBankingRequest = async () => {
    if (!pendingBankingRequest) return;
    try {
      const r = await fetch('../../Php/Profile/employee_profile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'approve_banking_request', request_id: pendingBankingRequest.id })
      });
      const d = await r.json();
      if (d.status === 'success') {
        showAlert(d.message || 'Approved. Employee can now edit banking details.', 'success');
        setPendingBankingRequest(null);
        loadEmployeeProfile(selectedEmployeeId);
      } else showAlert(d.message || 'Failed', 'error');
    } catch (e) { showAlert('Request failed', 'error'); }
  };

  const declineBankingRequest = async () => {
    if (!pendingBankingRequest) return;
    try {
      const r = await fetch('../../Php/Profile/employee_profile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'decline_banking_request', request_id: pendingBankingRequest.id })
      });
      const d = await r.json();
      if (d.status === 'success') {
        showAlert(d.message || 'Request declined.', 'success');
        setPendingBankingRequest(null);
      } else showAlert(d.message || 'Failed', 'error');
    } catch (e) { showAlert('Request failed', 'error'); }
  };

  const switchEmployee = (employeeId: string) => {
    if (!employeeId) return;
    loadEmployeeProfile(employeeId);
  };

  const showTab = (tabName: string) => {
    setActiveTab(tabName);
  };

  const openEditModal = (type: string) => {
    if (type === 'info') {
      setEditForm({
        fullName: employee.fullName || '',
        email: employee.email || '',
        phone: employee.phone || '',
        position: employee.position || '',
        department: employee.department || '',
        bio: employee.bio || '',
        dateOfBirth: employee.dateOfBirth || '',
        gender: employee.gender || '',
        nationality: employee.nationality || '',
        employmentType: employee.employmentType || '',
        startDate: employee.startDate || '',
        workLocation: employee.workLocation || '',
        taxNumber: employee.taxNumber || '',
        bankName: employee.bankName || '',
        bankAccountNumber: employee.bankAccountNumber || '',
        branchCode: employee.branchCode || '',
        idNumber: employee.idNumber || '',
        streetName: employee.streetName || '',
        suburb: employee.suburb || '',
        city: employee.city || '',
        postalCode: employee.postalCode || ''
      });
      setIsEditMode(true);
    }
  };

  const saveProfile = async () => {
    setIsSaving(true);
    const token = localStorage.getItem('token');
    if (!token) { setIsSaving(false); return; }
    try {
      const response = await fetch(`https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          firstName: editForm.fullName.split(' ')[0],
          lastName: editForm.fullName.split(' ').slice(1).join(' ') || editForm.fullName.split(' ')[0],
          email: editForm.email,
          phone: editForm.phone,
          position: editForm.position,
          gender: editForm.gender,
          nationality: editForm.nationality,
          employmentType: editForm.employmentType,
          workLocation: editForm.workLocation,
          idNumber: editForm.idNumber,
          taxNumber: editForm.taxNumber,
          bankName: editForm.bankName,
          bankAccountNumber: editForm.bankAccountNumber,
          branchCode: editForm.branchCode,
          address: {
            street: editForm.streetName || '',
            city: editForm.city || '',
            state: editForm.suburb || '',
            zipCode: editForm.postalCode || '',
            country: 'South Africa'
          }
        })
      });
      const data = await response.json();
      if (response.ok) {
        setEmployee(prev => ({ ...prev, ...editForm }));
        setIsEditMode(false);
        showAlert('Profile updated successfully', 'success');
      } else {
        showAlert(data.message || 'Failed to save profile', 'error');
      }
    } catch (error) {
      showAlert('Failed to save profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadEmployeeProfile = () => {
    document.body.classList.add('printing-profile');
    showAlert('Preparing profile for download...', 'info');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-profile');
    }, 300);
  };

  const sendEmailToEmployee = () => {
    if (employee.email) {
      window.location.href = `mailto:${employee.email}?subject=Regarding your employment at Kago HC`;
    } else {
      showAlert('No email address available', 'error');
    }
  };

  const changeEmployeeStatus = async (newStatus: string) => {
    const statusLabels: Record<string, string> = { active: 'activate', inactive: 'deactivate', suspended: 'suspend', on_leave: 'mark as on leave' };
    const label = statusLabels[newStatus] || newStatus;
    if (!window.confirm(`Are you sure you want to ${label} ${employee.fullName}?`)) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const response = await fetch(`https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1/employees/${employee.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setEmployee(prev => ({ ...prev, status: newStatus }));
        showAlert(`Employee ${label}d successfully`, 'success');
      } else {
        showAlert('Failed to update status', 'error');
      }
    } catch {
      showAlert('Failed to update status', 'error');
    }
  };

  const terminateEmployee = () => {
    const empId = employee.employeeId || employee.id;
    const empName = employee.fullName;
    window.location.href = `../Termination/Termination.html?id=${empId}&name=${encodeURIComponent(empName)}`;
  };

  const { id: paramId } = useParams<{ id?: string }>();

  useEffect(() => {
    loadAllEmployees();
    // Support both /manager/profile/:id (React Router) and /manager/profile?id=xxx (query string)
    const searchId = new URLSearchParams(window.location.search).get('id');
    const mode     = new URLSearchParams(window.location.search).get('mode');
    const employeeId = paramId || searchId;
    if (employeeId) {
      loadEmployeeProfile(employeeId, mode === 'edit');
    }
  }, [paramId]);

  const getStatusBadgeStyle = (status: string): React.CSSProperties => {
    switch(status) {
      case 'active':
        return { background: '#ecfdf3', color: '#027a48' };
      case 'on_leave':
        return { background: '#fffaeb', color: '#b54708' };
      case 'suspended':
        return { background: '#fef3f2', color: '#b42318' };
      case 'terminated':
        return { background: '#fef3f2', color: '#b42318' };
      default:
        return { background: '#f2f4f7', color: '#344054' };
    }
  };

  return (
    <>
      <main style={{ flex: 1, padding: 24, background: "#f9fafb", overflowY: "auto" }}>
        <div style={{ maxWidth: 1536, margin: "0 auto" }}>
            {/* Breadcrumb */}
            <div style={{ marginBottom: 24, display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1d2939", margin: 0 }}>
                Employee Profile Management
              </h2>
              <nav>
                <ol style={{ display: "flex", alignItems: "center", gap: 6, listStyle: "none", padding: 0, margin: 0 }}>
                  <li>
                    <a href="/admin" style={{ color: "#667085", fontSize: 14, textDecoration: "none" }}>
                      Home
                      <i className="bi-chevron-right" style={{ marginLeft: 4, fontSize: 12 }}></i>
                    </a>
                  </li>
                  <li style={{ color: "#1d2939", fontSize: 14 }}>Employee Profile</li>
                </ol>
              </nav>
            </div>

            {/* Alert Messages */}
            {alert.show && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  borderRadius: 8, border: "1px solid",
                  padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
                  ...(alert.type === 'success' ? { borderColor: '#d1fae5', background: '#ecfdf3', color: '#065f46' } : {}),
                  ...(alert.type === 'error' ? { borderColor: '#fee2e2', background: '#fef2f2', color: '#991b1b' } : {}),
                  ...(alert.type === 'info' ? { borderColor: '#dbeafe', background: '#eff6ff', color: '#1e40af' } : {})
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {alert.type === 'success' && <IconCheck />}
                    {alert.type === 'error' && <IconExclamation />}
                    {alert.type === 'info' && <IconInfo />}
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{alert.message}</span>
                  </div>
                  <button onClick={() => setAlert(prev => ({ ...prev, show: false }))} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit" }}>
                    <IconClose />
                  </button>
                </div>
              </div>
            )}

            {/* Employee Selector */}
            <div style={{
              marginBottom: 24, borderRadius: 12, border: "1px solid #e4e7ec",
              background: "#fff", padding: 20
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ marginBottom: 12, fontSize: 18, fontWeight: 600, color: "#1d2939" }}>
                    Select Employee Profile
                  </h3>
                  <div style={{ position: "relative" }}>
                    <select
                      value={selectedEmployeeId}
                      onChange={(e) => e.target.value && switchEmployee(e.target.value)}
                      style={{
                        width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                        background: "#fff", padding: "10px 16px", fontSize: 14,
                        color: "#1d2939", outline: "none"
                      }}
                    >
                      <option value="">Select Employee</option>
                      {allEmployees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.fullName} - {emp.department}
                        </option>
                      ))}
                    </select>
                  </div>
                  {allEmployees.length === 0 && !employeesLoadError && (
                    <p style={{ marginTop: 8, fontSize: 14, color: "#667085" }}>Loading employees...</p>
                  )}
                  {employeesLoadError && (
                    <p style={{ marginTop: 8, fontSize: 14, color: "#ef4444" }}>{employeesLoadError}</p>
                  )}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <button
                    onClick={() => window.location.reload()}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, borderRadius: 8,
                      border: "1px solid #d0d5dd", background: "#fff", padding: "10px 16px",
                      fontSize: 14, fontWeight: 500, color: "#344054", cursor: "pointer"
                    }}
                  >
                    <IconRefresh /> Refresh
                  </button>
                  <a
                    href="/manager/manage-employees"
                    style={{
                      display: "flex", alignItems: "center", gap: 8, borderRadius: 8,
                      background: "#E6A79E", padding: "10px 16px", fontSize: 14,
                      fontWeight: 500, color: "#fff", textDecoration: "none"
                    }}
                  >
                    <IconPlus /> Add New
                  </a>
                </div>
              </div>
            </div>

            {/* Loading Overlay */}
            {isLoading && (
              <div style={{ marginBottom: 24, textAlign: "center", padding: "32px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    border: "2px solid #E6A79E", borderTopColor: "transparent",
                    animation: "spin 1s linear infinite"
                  }}></div>
                  <span style={{ marginLeft: 8, fontSize: 14, color: "#667085" }}>
                    Loading employee profile...
                  </span>
                </div>
              </div>
            )}

            {/* Edit Mode Form */}
            {!isLoading && employee.id && isEditMode ? (
              <div style={{ borderRadius: 12, border: "1px solid #e4e7ec", background: "#fff" }}>
                <div style={{
                  borderBottom: "1px solid #e4e7ec", background: "linear-gradient(135deg, #E6A79E 0%, #d88574 100%)",
                  padding: "16px 24px", borderTopLeftRadius: 12, borderTopRightRadius: 12
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 600, color: "#fff", margin: 0 }}>Edit Employee Profile</h3>
                      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.9)", marginTop: 4 }}>{employee.fullName}</p>
                    </div>
                    <button
                      onClick={() => setIsEditMode(false)}
                      style={{
                        borderRadius: 8, background: "rgba(255,255,255,0.2)", border: "none",
                        padding: "8px 16px", fontSize: 14, fontWeight: 500, color: "#fff",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 8
                      }}
                    >
                      <IconArrowLeft /> Back to Profile
                    </button>
                  </div>
                </div>

                <div style={{ padding: 24 }}>
                  <form onSubmit={(e) => { e.preventDefault(); saveProfile(); }}>
                    {/* Personal Information */}
                    <div style={{ marginBottom: 32 }}>
                      <h4 style={{
                        marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid #e4e7ec",
                        fontSize: 16, fontWeight: 600, color: "#1d2939", display: "flex", alignItems: "center", gap: 8
                      }}>
                        <IconPerson /> Personal Information
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Full Name *
                          </label>
                          <input
                            type="text"
                            value={editForm.fullName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                            required
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Email *
                          </label>
                          <input
                            type="email"
                            value={editForm.email}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            required
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={editForm.phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            ID Number
                          </label>
                          <input
                            type="text"
                            value={editForm.idNumber}
                            onChange={(e) => setEditForm(prev => ({ ...prev, idNumber: e.target.value }))}
                            maxLength={13}
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Date of Birth
                          </label>
                          <input
                            type="date"
                            value={editForm.dateOfBirth}
                            onChange={(e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Gender
                          </label>
                          <select
                            value={editForm.gender}
                            onChange={(e) => setEditForm(prev => ({ ...prev, gender: e.target.value }))}
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          >
                            <option value="">Select</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Nationality
                          </label>
                          <input
                            type="text"
                            value={editForm.nationality}
                            onChange={(e) => setEditForm(prev => ({ ...prev, nationality: e.target.value }))}
                            placeholder="e.g. South African"
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Employment Information */}
                    <div style={{ marginBottom: 32 }}>
                      <h4 style={{
                        marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid #e4e7ec",
                        fontSize: 16, fontWeight: 600, color: "#1d2939", display: "flex", alignItems: "center", gap: 8
                      }}>
                        <IconClipboard /> Employment Information
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Position
                          </label>
                          <input
                            type="text"
                            value={editForm.position}
                            onChange={(e) => setEditForm(prev => ({ ...prev, position: e.target.value }))}
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Department
                          </label>
                          <input
                            type="text"
                            value={editForm.department}
                            onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Employment Type
                          </label>
                          <select
                            value={editForm.employmentType}
                            onChange={(e) => setEditForm(prev => ({ ...prev, employmentType: e.target.value }))}
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          >
                            <option value="full-time">Full Time</option>
                            <option value="part-time">Part Time</option>
                            <option value="contract">Contract</option>
                            <option value="intern">Intern</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={editForm.startDate}
                            onChange={(e) => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Work Location
                          </label>
                          <input
                            type="text"
                            value={editForm.workLocation}
                            onChange={(e) => setEditForm(prev => ({ ...prev, workLocation: e.target.value }))}
                            placeholder="e.g. Johannesburg Office"
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Address Information */}
                    <div style={{ marginBottom: 32 }}>
                      <h4 style={{
                        marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid #e4e7ec",
                        fontSize: 16, fontWeight: 600, color: "#1d2939", display: "flex", alignItems: "center", gap: 8
                      }}>
                        <IconCompass /> Address Information
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                        <div style={{ gridColumn: "span 2" }}>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Street Address
                          </label>
                          <input
                            type="text"
                            value={editForm.streetName || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, streetName: e.target.value }))}
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Suburb
                          </label>
                          <input
                            type="text"
                            value={editForm.suburb || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, suburb: e.target.value }))}
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            City
                          </label>
                          <input
                            type="text"
                            value={editForm.city || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Postal Code
                          </label>
                          <input
                            type="text"
                            value={editForm.postalCode || ''}
                            onChange={(e) => setEditForm(prev => ({ ...prev, postalCode: e.target.value }))}
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Financial & Banking */}
                    <div style={{ marginBottom: 32 }}>
                      <h4 style={{
                        marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid #e4e7ec",
                        fontSize: 16, fontWeight: 600, color: "#1d2939", display: "flex", alignItems: "center", gap: 8
                      }}>
                        <IconCash /> Financial & Banking
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Tax Number
                          </label>
                          <input
                            type="text"
                            value={editForm.taxNumber}
                            onChange={(e) => setEditForm(prev => ({ ...prev, taxNumber: e.target.value }))}
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Bank Name
                          </label>
                          <input
                            type="text"
                            value={editForm.bankName}
                            onChange={(e) => setEditForm(prev => ({ ...prev, bankName: e.target.value }))}
                            placeholder="e.g. FNB, Standard Bank"
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Account Number
                          </label>
                          <input
                            type="text"
                            value={editForm.bankAccountNumber}
                            onChange={(e) => setEditForm(prev => ({ ...prev, bankAccountNumber: e.target.value }))}
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: "block", marginBottom: 6, fontSize: 14, fontWeight: 500, color: "#344054" }}>
                            Branch Code
                          </label>
                          <input
                            type="text"
                            value={editForm.branchCode}
                            onChange={(e) => setEditForm(prev => ({ ...prev, branchCode: e.target.value }))}
                            style={{
                              width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                              padding: "10px 12px", fontSize: 14, outline: "none"
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bio */}
                    <div style={{ marginBottom: 32 }}>
                      <h4 style={{
                        marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid #e4e7ec",
                        fontSize: 16, fontWeight: 600, color: "#1d2939", display: "flex", alignItems: "center", gap: 8
                      }}>
                        <IconFileText /> Bio & Description
                      </h4>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                        rows={4}
                        placeholder="Brief description about the employee..."
                        style={{
                          width: "100%", borderRadius: 8, border: "1px solid #d0d5dd",
                          padding: "12px", fontSize: 14, outline: "none", resize: "vertical"
                        }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #e4e7ec", paddingTop: 20 }}>
                      <button
                        type="button"
                        onClick={() => setIsEditMode(false)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, borderRadius: 8,
                          border: "1px solid #d0d5dd", background: "#fff", padding: "10px 20px",
                          fontSize: 14, fontWeight: 500, color: "#344054", cursor: "pointer"
                        }}
                      >
                        <IconClose /> Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, borderRadius: 8,
                          background: "#E6A79E", border: "none", padding: "10px 24px",
                          fontSize: 14, fontWeight: 500, color: "#fff", cursor: isSaving ? "not-allowed" : "pointer",
                          opacity: isSaving ? 0.6 : 1
                        }}
                      >
                        {isSaving ? (
                          <>
                            <div style={{
                              width: 16, height: 16, borderRadius: "50%",
                              border: "2px solid #fff", borderTopColor: "transparent",
                              animation: "spin 1s linear infinite"
                            }}></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <IconCheck /> Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : !isLoading && employee.id && !isEditMode ? (
              <div style={{ borderRadius: 12, border: "1px solid #e4e7ec", background: "#fff" }}>
                <div style={{ padding: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1d2939", margin: "0 0 16px 0" }}>
                    Employee Profile
                  </h3>

                  {/* Profile Header */}
                  <div style={{
                    marginBottom: 24, borderRadius: 12, border: "1px solid #e4e7ec",
                    padding: 20, background: "#fff"
                  }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
                        <div style={{
                          width: 96, height: 96, borderRadius: "50%", overflow: "hidden",
                          background: "#f2f4f7", display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0
                        }}>
                          {employee.profilePicture ? (
                            <img
                              src={getProfileImageUrl(employee.profilePicture)}
                              alt={employee.fullName}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <span style={{ fontSize: 32, fontWeight: 600, color: "#667085" }}>
                              {getInitials(employee.fullName)}
                            </span>
                          )}
                        </div>

                        <div style={{ textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center", marginBottom: 8 }}>
                            <h4 style={{ fontSize: 20, fontWeight: 600, color: "#1d2939", margin: 0 }}>
                              {employee.fullName}
                            </h4>
                            <span style={{
                              display: "inline-block", padding: "4px 10px", borderRadius: 20,
                              fontSize: 12, fontWeight: 500, ...getStatusBadgeStyle(employee.status)
                            }}>
                              {formatStatus(employee.status)}
                            </span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            <p style={{ fontSize: 14, color: "#667085", margin: 0 }}>
                              {employee.position} : {employee.department}
                            </p>
                            <p style={{ fontSize: 14, color: "#667085", margin: 0 }}>
                              Employee ID: <span style={{ fontWeight: 500, color: "#1d2939" }}>{employee.id}</span>
                            </p>
                          </div>
                        </div>

                        {/* Social Media Links */}
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          {employee.linkedin && (
                            <a href={employee.linkedin} target="_blank" rel="noopener noreferrer" style={{
                              width: 40, height: 40, borderRadius: "50%", border: "1px solid #e4e7ec",
                              background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                              color: "#344054", textDecoration: "none"
                            }}>
                              <IconLinkedIn />
                            </a>
                          )}
                          {employee.twitter && (
                            <a href={employee.twitter} target="_blank" rel="noopener noreferrer" style={{
                              width: 40, height: 40, borderRadius: "50%", border: "1px solid #e4e7ec",
                              background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                              color: "#344054", textDecoration: "none"
                            }}>
                              <IconTwitter />
                            </a>
                          )}
                          {employee.facebook && (
                            <a href={employee.facebook} target="_blank" rel="noopener noreferrer" style={{
                              width: 40, height: 40, borderRadius: "50%", border: "1px solid #e4e7ec",
                              background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                              color: "#344054", textDecoration: "none"
                            }}>
                              <IconFacebook />
                            </a>
                          )}
                          {employee.instagram && (
                            <a href={employee.instagram} target="_blank" rel="noopener noreferrer" style={{
                              width: 40, height: 40, borderRadius: "50%", border: "1px solid #e4e7ec",
                              background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                              color: "#344054", textDecoration: "none"
                            }}>
                              <IconInstagram />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                        <button
                          onClick={() => openEditModal('info')}
                          style={{
                            display: "flex", alignItems: "center", gap: 8, borderRadius: 8,
                            border: "1px solid #d0d5dd", background: "#fff", padding: "10px 16px",
                            fontSize: 14, fontWeight: 500, color: "#344054", cursor: "pointer"
                          }}
                        >
                          <IconPerson /> Edit Profile
                        </button>
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={() => {}} // Add dropdown logic if needed
                            style={{
                              display: "flex", alignItems: "center", gap: 8, borderRadius: 8,
                              border: "1px solid #d0d5dd", background: "#fff", padding: "10px 16px",
                              fontSize: 14, fontWeight: 500, color: "#344054", cursor: "pointer"
                            }}
                          >
                            <IconThreeDots /> Actions
                          </button>
                          {/* Dropdown menu would go here */}
                        </div>
                      </div>

                      {/* Pending Banking Request */}
                      {pendingBankingRequest && (
                        <div style={{
                          borderRadius: 8, border: "1px solid #fed7aa", background: "#fffbeb",
                          padding: 16, marginTop: 16
                        }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: "#b45309", marginBottom: 12 }}>
                            <IconInfo /> This employee requested to update their banking details.
                          </p>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              onClick={approveBankingRequest}
                              style={{
                                borderRadius: 6, background: "#10b981", border: "none",
                                padding: "8px 16px", fontSize: 14, fontWeight: 500, color: "#fff",
                                cursor: "pointer"
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={declineBankingRequest}
                              style={{
                                borderRadius: 6, background: "#ef4444", border: "none",
                                padding: "8px 16px", fontSize: 14, fontWeight: 500, color: "#fff",
                                cursor: "pointer"
                              }}
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ borderBottom: "1px solid #e4e7ec" }}>
                      <nav style={{ display: "flex", gap: 8 }}>
                        {['personal-info', 'employment-info', 'contact-info', 'financial-info'].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => showTab(tab)}
                            style={{
                              padding: "12px 16px", background: "none", border: "none",
                              borderBottom: activeTab === tab ? "2px solid #E6A79E" : "2px solid transparent",
                              fontSize: 14, fontWeight: 500, color: activeTab === tab ? "#E6A79E" : "#667085",
                              cursor: "pointer"
                            }}
                          >
                            {tab === 'personal-info' && 'Personal Info'}
                            {tab === 'employment-info' && 'Employment'}
                            {tab === 'contact-info' && 'Contact & Address'}
                            {tab === 'financial-info' && 'Financial & Banking'}
                          </button>
                        ))}
                      </nav>
                    </div>

                    {/* Tab Content */}
                    <div style={{ padding: "24px 0" }}>
                      {/* Personal Info Tab */}
                      {activeTab === 'personal-info' && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                          <div>
                            <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", marginBottom: 16 }}>
                              Basic Information
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Full Name</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>{employee.fullName}</p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Email</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>{employee.email}</p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Phone</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>{employee.phone || 'Not provided'}</p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Date of Birth</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>{formatDate(employee.dateOfBirth)}</p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Gender</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0, textTransform: "capitalize" }}>
                                  {employee.gender || 'Not specified'}
                                </p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Nationality</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>
                                  {employee.nationality || 'Not specified'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", marginBottom: 16 }}>
                              Identification
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>South African ID</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>
                                  {formatIDNumber(employee.idNumber)}
                                </p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Tax Number</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>
                                  {employee.taxNumber || 'Not provided'}
                                </p>
                              </div>
                            </div>

                            <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", margin: "24px 0 16px" }}>
                              Bio & Description
                            </h4>
                            <div style={{
                              borderRadius: 8, border: "1px solid #e4e7ec",
                              background: "#f9fafb", padding: 16
                            }}>
                              <p style={{ fontSize: 14, color: "#344054", margin: 0 }}>
                                {employee.bio || 'No bio provided'}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Employment Info Tab */}
                      {activeTab === 'employment-info' && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                          <div>
                            <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", marginBottom: 16 }}>
                              Employment Details
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Employee ID</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>{employee.id}</p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Position</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>{employee.position}</p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Department</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>{employee.department}</p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Employment Type</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>
                                  {formatEmploymentType(employee.employmentType)}
                                </p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Status</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>
                                  {formatStatus(employee.status)}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", marginBottom: 16 }}>
                              Dates & Location
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Start Date</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>
                                  {formatDate(employee.startDate)}
                                </p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Work Location</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>
                                  {employee.workLocation || 'Not specified'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Contact Info Tab */}
                      {activeTab === 'contact-info' && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                          <div>
                            <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", marginBottom: 16 }}>
                              Contact Information
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Email</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>{employee.email}</p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Phone</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>
                                  {employee.phone || 'Not provided'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", marginBottom: 16 }}>
                              Address
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Street</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>
                                  {employee.streetName || 'Not provided'}
                                </p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Suburb / City</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>
                                  {employee.suburb ? employee.suburb + ', ' : ''}{employee.city || 'Not provided'}
                                </p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Postal Code</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>
                                  {employee.postalCode || 'Not provided'}
                                </p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Work Location</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>
                                  {employee.workLocation || 'Not provided'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Financial Info Tab */}
                      {activeTab === 'financial-info' && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 24 }}>
                          <div>
                            <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", marginBottom: 16 }}>
                              Tax Information
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Tax Number</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>
                                  {employee.taxNumber || 'Not provided'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 style={{ fontSize: 16, fontWeight: 600, color: "#1d2939", marginBottom: 16 }}>
                              Banking Details
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Bank Name</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>
                                  {employee.bankName || 'Not provided'}
                                </p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Account Number</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>
                                  {employee.bankAccountNumber ? '****' + employee.bankAccountNumber.slice(-4) : 'Not provided'}
                                </p>
                              </div>
                              <div>
                                <label style={{ fontSize: 13, color: "#667085", display: "block", marginBottom: 4 }}>Branch Code</label>
                                <p style={{ fontSize: 14, fontWeight: 500, color: "#1d2939", margin: 0 }}>
                                  {employee.branchCode || 'Not provided'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : !isLoading && !employee.id ? (
              <div style={{
                borderRadius: 12, border: "1px solid #e4e7ec", background: "#fff",
                padding: 48, textAlign: "center"
              }}>
                <div style={{ maxWidth: 400, margin: "0 auto" }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: "50%", background: "#f2f4f7",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 16px"
                  }}>
                    <IconPerson style={{ width: 40, height: 40, color: "#98a2b3" }} />
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1d2939", marginBottom: 8 }}>
                    No Employee Selected
                  </h3>
                  <p style={{ fontSize: 14, color: "#667085", marginBottom: 24 }}>
                    Select an employee from the dropdown above to view their profile details.
                  </p>
                  <a
                    href="/manager/manage-employees"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8, borderRadius: 8,
                      background: "#E6A79E", padding: "10px 16px", fontSize: 14,
                      fontWeight: 500, color: "#fff", textDecoration: "none"
                    }}
                  >
                    <IconPlus /> Add New Employee
                  </a>
                </div>
              </div>
            ) : null}
        </div>
      </main>

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          .rotate-180 {
            transform: rotate(180deg);
          }
          @media print {
            body.printing-profile .sidebar,
            body.printing-profile header,
            body.printing-profile .employee-selector,
            body.printing-profile button,
            body.printing-profile a[href],
            body.printing-profile [class*="bi-"] {
              display: none !important;
            }
          }
        `}
      </style>
    </>
  );
}


const EmployeeProfile: React.FC = () => (
  <SharedLayout title="Employee Profile">
    <EmployeeProfileContent />
  </SharedLayout>
);

export default EmployeeProfile;
