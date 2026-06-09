// OnboardingPage.tsx — Enhanced with ALL Company Settings fields in Step 2
// After saving onboarding, Company Settings tab auto-populates from the same API endpoint

import React, { useState, useEffect } from "react";
import {
  Row, Col, Card, CardBody, Button, Input, Label, FormGroup,
  Progress, Modal, ModalHeader, ModalBody, ModalFooter, Spinner
} from "reactstrap";
import {
  FaBuilding, FaUserShield, FaGlobeAfrica, FaPlus, FaChevronRight,
  FaCheckCircle, FaUpload, FaUserTie, FaTrash, FaUniversity,
  FaIdCard, FaMapMarkerAlt, FaCalendarAlt, FaUsers
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

// ─── Constants ────────────────────────────────────────────────────────────────

const SADC_COUNTRIES = [
  "Angola","Botswana","Comoros","Democratic Republic of Congo","Eswatini",
  "Lesotho","Madagascar","Malawi","Mauritius","Mozambique","Namibia",
  "Seychelles","South Africa","Tanzania","Zambia","Zimbabwe"
];

const COMPANY_TYPES = [
  "Pty Ltd","Ltd","Incorporated","Partnership","Sole Proprietorship",
  "Non-Profit Organisation","Public Company","State-Owned Entity","Co-operative"
];

const SECTORS = [
  "Technology","Finance","Healthcare","Manufacturing","Retail","Education",
  "Construction","Transportation","Hospitality","Agriculture","Mining",
  "Energy","Telecommunications","Media","Real Estate","Legal Services",
  "Consulting","Human Capital & Recruitment","Other"
];

const PHONE_CODES = [
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+1", country: "USA/Canada", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+966", country: "Saudi Arabia", flag: "🇸🇦" },
  { code: "+358", country: "Finland", flag: "🇫🇮" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+31", country: "Netherlands", flag: "🇳🇱" },
  { code: "+32", country: "Belgium", flag: "🇧🇪" },
  { code: "+43", country: "Austria", flag: "🇦🇹" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+30", country: "Greece", flag: "🇬🇷" },
  { code: "+48", country: "Poland", flag: "🇵🇱" },
  { code: "+351", country: "Portugal", flag: "🇵🇹" },
];

const BANKS = [
  "First National Bank","Standard Bank","Absa","Nedbank","Capitec",
  "Discovery Bank","Investec","African Bank"
];

const ACCOUNT_TYPES = ["Business Cheque","Business Savings","Business Current","Transmission Account"];

const TIMEZONES = [
  "Africa/Johannesburg","Africa/Cape_Town","Africa/Lagos","Africa/Cairo","Africa/Nairobi",
  "America/New_York","America/Los_Angeles","America/Chicago","America/Toronto","America/Vancouver",
  "America/Mexico_City","America/Buenos_Aires","America/Sao_Paulo",
  "Europe/London","Europe/Paris","Europe/Berlin","Europe/Madrid","Europe/Amsterdam",
  "Europe/Rome","Europe/Vienna","Europe/Prague","Europe/Warsaw","Europe/Moscow",
  "Europe/Istanbul","Europe/Athens","Europe/Helsinki","Europe/Dublin",
  "Asia/Bangkok","Asia/Singapore","Asia/Hong_Kong","Asia/Shanghai",
  "Asia/Tokyo","Asia/Seoul","Asia/Dubai","Asia/Kolkata","Asia/Manila",
  "Australia/Sydney","Australia/Melbourne","Australia/Brisbane","Australia/Perth",
  "Pacific/Auckland","Pacific/Fiji","UTC","Other"
];

const SA_PROVINCES = [
  "Gauteng","Western Cape","KwaZulu-Natal","Eastern Cape","Limpopo",
  "Mpumalanga","North West","Free State","Northern Cape"
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CompanyFullData {
  // Basic
  name: string; size: string; sector: string; email: string; phone: string;
  alternativePhone: string; website: string; fax: string; language: string;
  timezone: string; dateFormat: string; status: string;
  // Registration
  registrationNumber: string; companyType: string; companyStatus: string;
  registrationDate: string; taxId: string; vatNumber: string;
  uifReference: string; sdlReference: string; workInjuryFundRef: string;
  incomeTaxNumber: string; payeReference: string; sarsBranch: string;
  provisionalTaxpayer: boolean; taxComplianceStatus: string;
  // Banking
  bank: {
    bankName: string; accountName: string; accountNumber: string;
    branchCode: string; accountType: string; swiftCode: string;
  };
  // Contacts
  contacts: {
    ceo: { name: string; email: string; phone: string };
    finance: { name: string; email: string; phone: string };
    payroll: { name: string; email: string; phone: string };
  };
  // Address
  address: {
    street: string; city: string; state: string; country: string;
    postalCode: string; physicalAddress: string; postalAddress: string;
  };
  // Fiscal
  fiscalYearStart: string; fiscalYearEnd: string;
  lastAuditDate: string; yearsInOperation: string;
  industry: string; businessType: string;
}

interface Owner {
  id?: string; firstName: string; lastName: string;
  email: string; phone: string; password: string;
}

// ─── Default empty company ────────────────────────────────────────────────────
const EMPTY_COMPANY: CompanyFullData = {
  name:"",size:"",sector:"",email:"",phone:"",alternativePhone:"",website:"",
  fax:"",language:"English",timezone:"Africa/Johannesburg",dateFormat:"DD/MM/YYYY",
  status:"Active",registrationNumber:"",companyType:"",companyStatus:"Active",
  registrationDate:"",taxId:"",vatNumber:"",uifReference:"",sdlReference:"",
  workInjuryFundRef:"",incomeTaxNumber:"",payeReference:"",sarsBranch:"",
  provisionalTaxpayer:false,taxComplianceStatus:"Compliant",
  bank:{ bankName:"",accountName:"",accountNumber:"",branchCode:"",accountType:"",swiftCode:"" },
  contacts:{
    ceo:{ name:"",email:"",phone:"" },
    finance:{ name:"",email:"",phone:"" },
    payroll:{ name:"",email:"",phone:"" },
  },
  address:{ street:"",city:"",state:"",country:"South Africa",postalCode:"",physicalAddress:"",postalAddress:"" },
  fiscalYearStart:"",fiscalYearEnd:"",lastAuditDate:"",yearsInOperation:"",
  industry:"",businessType:"",
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: "success"|"error"; onClose: ()=>void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position:"fixed",top:20,right:20,zIndex:9999,
      backgroundColor: type==="success"?"#48BB78":"#FC8181",
      color:"#fff",padding:"12px 24px",borderRadius:"8px",
      boxShadow:"0 4px 12px rgba(0,0,0,0.15)",maxWidth:360,fontSize:14,fontWeight:500 }}>
      {message}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display:"flex",alignItems:"center",gap:"10px",marginBottom:"20px",
      marginTop:"28px",paddingBottom:"10px",borderBottom:"2px solid #EBF8FF" }}>
      <div style={{ color:"#33A6CD",fontSize:"18px" }}>{icon}</div>
      <h5 style={{ margin:0,fontWeight:700,color:"#33A6CD",fontSize:"16px" }}>{title}</h5>
    </div>
  );
}

// ─── Field Components ─────────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = { fontSize:"13px",color:"#718096",fontWeight:600,marginBottom:"4px",display:"block" };
const valueStyle: React.CSSProperties = { fontSize:"15px",color:"#2D3748",fontWeight:500,minHeight:"24px" };
const inputStyle: React.CSSProperties = { borderRadius:"8px",fontSize:"14px" };

function InfoField({ label, value, isEditing, onChange, type="text", placeholder, maxLength }: {
  label:string; value:string; isEditing:boolean; onChange:(v:string)=>void;
  type?:string; placeholder?:string; maxLength?:number;
}) {
  return (
    <FormGroup style={{ marginBottom:"16px" }}>
      <Label style={labelStyle}>{label}</Label>
      {isEditing
        ? <Input type={type as any} value={value||""} onChange={e=>onChange(e.target.value)}
            placeholder={placeholder} maxLength={maxLength} style={inputStyle} />
        : <div style={valueStyle}>{value||"—"}</div>}
    </FormGroup>
  );
}

function SelectField({ label, value, isEditing, onChange, options, placeholder }: {
  label:string; value:string; isEditing:boolean; onChange:(v:string)=>void;
  options:string[]; placeholder?:string;
}) {
  return (
    <FormGroup style={{ marginBottom:"16px" }}>
      <Label style={labelStyle}>{label}</Label>
      {isEditing
        ? <Input type="select" value={value||""} onChange={e=>onChange(e.target.value)} style={inputStyle}>
            <option value="">{placeholder||`Select ${label}`}</option>
            {options.map(o=><option key={o} value={o}>{o}</option>)}
          </Input>
        : <div style={valueStyle}>{value||"—"}</div>}
    </FormGroup>
  );
}

function CheckboxField({ label, value, isEditing, onChange }: {
  label:string; value:boolean; isEditing:boolean; onChange:(v:boolean)=>void;
}) {
  return (
    <FormGroup style={{ marginBottom:"16px" }}>
      <Label style={labelStyle}>{label}</Label>
      {isEditing
        ? <div style={{ display:"flex",alignItems:"center",gap:"8px",marginTop:"4px" }}>
            <Input type="checkbox" checked={value} onChange={e=>onChange(e.target.checked)} style={{ width:"auto",margin:0 }} />
            <span style={{ fontSize:"13px" }}>{value?"Yes":"No"}</span>
          </div>
        : <div style={valueStyle}>{value?"Yes":"No"}</div>}
    </FormGroup>
  );
}

function TextareaField({ label, value, isEditing, onChange, placeholder }: {
  label:string; value:string; isEditing:boolean; onChange:(v:string)=>void; placeholder?:string;
}) {
  return (
    <FormGroup style={{ marginBottom:"16px" }}>
      <Label style={labelStyle}>{label}</Label>
      {isEditing
        ? <Input type="textarea" rows={2} value={value||""} onChange={e=>onChange(e.target.value)}
            placeholder={placeholder} style={{ ...inputStyle,resize:"vertical" }} />
        : <div style={valueStyle}>{value||"—"}</div>}
    </FormGroup>
  );
}

// ─── Owner Modal ──────────────────────────────────────────────────────────────
function AddOwnerModal({ onClose, onAdd }: { onClose:()=>void; onAdd:(o:Owner)=>void }) {
  const [form, setForm] = useState<Owner>({ firstName:"",lastName:"",email:"",phone:"",password:"" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (f: keyof Owner) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p=>({...p,[f]:e.target.value}));

  const handleSubmit = async () => {
    if (["firstName","lastName","email","password"].some(k=>!(form[k as keyof Owner] as string).trim())) {
      setError("Please fill in all required fields."); return;
    }
    setSaving(true); setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/owner/create`,{
        method:"POST",
        headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},
        body:JSON.stringify({...form,role:"Owner"}),
      });
      const data = await res.json();
      if (res.ok||data.success) { onAdd({...form,id:data.data?._id||data._id}); onClose(); }
      else setError(data.message||"Failed to create owner.");
    } catch { setError("Network error. Please try again."); }
    finally { setSaving(false); }
  };

  return (
    <Modal isOpen toggle={onClose} centered size="md">
      <ModalHeader toggle={onClose}>Add Owner / Admin</ModalHeader>
      <ModalBody>
        {error && <div style={{padding:"10px 14px",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:8,fontSize:13,color:"#b42318",marginBottom:16}}>{error}</div>}
        <Row>
          <Col md={6}><FormGroup><Label>First Name *</Label><Input style={inputStyle} value={form.firstName} onChange={setField("firstName")} /></FormGroup></Col>
          <Col md={6}><FormGroup><Label>Last Name *</Label><Input style={inputStyle} value={form.lastName} onChange={setField("lastName")} /></FormGroup></Col>
        </Row>
        <FormGroup><Label>Email *</Label><Input type="email" style={inputStyle} value={form.email} onChange={setField("email")} /></FormGroup>
        <FormGroup><Label>Phone</Label><Input style={inputStyle} value={form.phone} onChange={setField("phone")} /></FormGroup>
        <FormGroup><Label>Password *</Label><Input type="password" style={inputStyle} value={form.password} onChange={setField("password")} /></FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={onClose}>Cancel</Button>
        <Button color="primary" style={{backgroundColor:"#33A6CD",border:"none"}} onClick={handleSubmit} disabled={saving}>
          {saving?<><Spinner size="sm"/> Adding...</>:"Add Owner"}
        </Button>
      </ModalFooter>
    </Modal>
  );
}

// ─── Main OnboardingPage ──────────────────────────────────────────────────────
const OnboardingPage = () => {
  const [selectedCountry, setSelectedCountry] = useState("South Africa");
  const [currentStep, setCurrentStep]         = useState(1);
  const [isEditing, setIsEditing]             = useState(false);
  const [isSaving, setIsSaving]               = useState(false);
  const [toast, setToast]                     = useState<{message:string;type:"success"|"error"}|null>(null);
  const [logoPreview, setLogoPreview]         = useState<string|null>(null);
  const [uploadingLogo, setUploadingLogo]     = useState(false);
  const [phoneCode, setPhoneCode]             = useState("+27");
  const [customPhoneCode, setCustomPhoneCode] = useState("");
  const [customTimezone, setCustomTimezone]   = useState("");
  const [phoneNumber, setPhoneNumber]         = useState("");

  const [companyData, setCompanyData] = useState<CompanyFullData>({...EMPTY_COMPANY});

  const [departments, setDepartments] = useState<{id?:string;name:string}[]>([]);
  const [roles, setRoles]             = useState<{id?:string;name:string}[]>([]);
  const [owners, setOwners]           = useState<Owner[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [loadingOwners, setLoadingOwners] = useState(false);

  const [deptModalOpen, setDeptModalOpen]   = useState(false);
  const [roleModalOpen, setRoleModalOpen]   = useState(false);
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);
  const [newDeptName, setNewDeptName]       = useState("");
  const [newRoleName, setNewRoleName]       = useState("");
  const [savingDept, setSavingDept]         = useState(false);
  const [savingRole, setSavingRole]         = useState(false);

  const showToast = (m:string, t:"success"|"error") => setToast({message:m,type:t});

  const totalSteps = 4;
  const progress   = ((currentStep-1)/(totalSteps-1))*100;

  const phases = [
    { id:1, title:"Country",  icon:<FaGlobeAfrica size={20}/> },
    { id:2, title:"Company",  icon:<FaBuilding    size={20}/> },
    { id:3, title:"Owners",   icon:<FaUserTie     size={20}/> },
    { id:4, title:"Roles",    icon:<FaUserShield  size={20}/> },
  ];

  // Helpers to update nested fields
  const setBank  = (field:string,v:any) => setCompanyData(p=>({...p,bank:{...p.bank,[field]:v}}));
  const setAddr  = (field:string,v:any) => setCompanyData(p=>({...p,address:{...p.address,[field]:v}}));
  const setContact = (who:"ceo"|"finance"|"payroll",field:string,v:any) =>
    setCompanyData(p=>({...p,contacts:{...p.contacts,[who]:{...p.contacts[who],[field]:v}}}));
  const setField = (field:keyof CompanyFullData,v:any) => setCompanyData(p=>({...p,[field]:v}));

  // ── Fetch existing company ─────────────────────────────────────────────────
  useEffect(()=>{
    const fetch_ = async ()=>{
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/owner/company/settings`,{headers:{"Authorization":`Bearer ${token}`}});
        const data = await res.json();
        const c = data.data||data;
        if (c&&c.name) {
          setCompanyData(p=>({
            ...p,...c,
            bank:     {...EMPTY_COMPANY.bank,     ...(c.bank     ||{})},
            contacts: {...EMPTY_COMPANY.contacts, ...(c.contacts ||{})},
            address:  {...EMPTY_COMPANY.address,  ...(c.address  ||{})},
          }));
          if (c.phone) {
            const m = c.phone.match(/(\+\d+)\s*(.*)/);
            if (m) { setPhoneCode(m[1]); setPhoneNumber(m[2]); }
          }
        }
      } catch {}
    };
    fetch_();
  },[]);

  useEffect(()=>{
    if (currentStep===3) fetchOwners();
    if (currentStep===4) { fetchDepartments(); fetchRoles(); }
  },[currentStep]);

  // ── Logo ───────────────────────────────────────────────────────────────────
  const handleLogoUpload = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingLogo(true);
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    try {
      const token = localStorage.getItem("token");
      const fd = new FormData(); fd.append("logo",file);
      await fetch(`${API_URL}/owner/company/logo`,{method:"POST",headers:{"Authorization":`Bearer ${token}`},body:fd});
      showToast("Logo uploaded!","success");
    } catch { showToast("Logo preview ready — save to persist.","success"); }
    finally { setUploadingLogo(false); }
  };

  // ── Save company ───────────────────────────────────────────────────────────
  const handleSaveCompany = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem("token");
      const fullPhone = phoneNumber?`${phoneCode==="OTHER"?customPhoneCode:phoneCode} ${phoneNumber}`:"";
      const finalTimezone = companyData.timezone==="Other"?customTimezone:companyData.timezone;
      const payload: CompanyFullData = { ...companyData, phone:fullPhone, timezone:finalTimezone };

      const res = await fetch(`${API_URL}/owner/company/settings`,{
        method:"PUT",
        headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},
        body:JSON.stringify(payload),
      });
      if (res.ok) {
        showToast("Company details saved! They'll appear in Company Settings.","success");
        setIsEditing(false);
        // Update local state so display reflects saved data
        setCompanyData(payload);
      } else {
        const d = await res.json().catch(()=>({}));
        showToast(d.message||"Failed to save.","error");
      }
    } catch { showToast("Network error.","error"); }
    finally { setIsSaving(false); }
  };

  // ── Departments / Roles / Owners ───────────────────────────────────────────
  const fetchDepartments = async ()=>{
    setLoadingDepts(true);
    try {
      const token=localStorage.getItem("token");
      const res=await fetch(`${API_URL}/department`,{headers:{"Authorization":`Bearer ${token}`}});
      if(res.ok){const d=await res.json();const rows=Array.isArray(d)?d:d.data||[];setDepartments(rows.map((x:any)=>({id:x._id,name:x.name||x})));}
      else setDepartments([{name:"Engineering"},{name:"Human Resources"},{name:"Sales"},{name:"Marketing"},{name:"Operations"},{name:"Finance"}]);
    }catch{setDepartments([{name:"Engineering"},{name:"Human Resources"},{name:"Sales"},{name:"Marketing"},{name:"Operations"},{name:"Finance"}]);}
    finally{setLoadingDepts(false);}
  };

  const fetchRoles = async ()=>{
    setLoadingRoles(true);
    try {
      const token=localStorage.getItem("token");
      const res=await fetch(`${API_URL}/role`,{headers:{"Authorization":`Bearer ${token}`}});
      if(res.ok){const d=await res.json();const rows=Array.isArray(d)?d:d.data||[];setRoles(rows.map((x:any)=>({id:x._id,name:x.name||x.type||x})));}
      else setRoles([{name:"Software Engineer"},{name:"Product Manager"},{name:"HR Specialist"},{name:"Sales Representative"},{name:"Operations Manager"}]);
    }catch{setRoles([{name:"Software Engineer"},{name:"Product Manager"},{name:"HR Specialist"},{name:"Sales Representative"},{name:"Operations Manager"}]);}
    finally{setLoadingRoles(false);}
  };

  const fetchOwners = async ()=>{
    setLoadingOwners(true);
    try {
      const token=localStorage.getItem("token");
      const res=await fetch(`${API_URL}/owner`,{headers:{"Authorization":`Bearer ${token}`}});
      const d=await res.json();const rows=Array.isArray(d)?d:d.data||[];
      setOwners(rows.map((o:any)=>({id:o._id,firstName:o.firstName||"",lastName:o.lastName||"",email:o.email||"",phone:o.phone||"",password:""})));
    }catch{}
    finally{setLoadingOwners(false);}
  };

  const handleAddDepartment = async ()=>{
    if(!newDeptName.trim())return;
    setSavingDept(true);
    try{
      const token=localStorage.getItem("token");
      const res=await fetch(`${API_URL}/department/create`,{method:"POST",headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({name:newDeptName.trim()})});
      const d=await res.json();
      setDepartments(p=>[...p,{id:d.data?._id||d._id,name:newDeptName.trim()}]);
      showToast("Department created.","success");
    }catch{setDepartments(p=>[...p,{name:newDeptName.trim()}]);showToast("Department added.","success");}
    finally{setNewDeptName("");setDeptModalOpen(false);setSavingDept(false);}
  };

  const handleAddRole = async ()=>{
    if(!newRoleName.trim())return;
    setSavingRole(true);
    try{
      const token=localStorage.getItem("token");
      const res=await fetch(`${API_URL}/role/create`,{method:"POST",headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({name:newRoleName.trim()})});
      const d=await res.json();
      setRoles(p=>[...p,{id:d.data?._id||d._id,name:newRoleName.trim()}]);
      showToast("Role created.","success");
    }catch{setRoles(p=>[...p,{name:newRoleName.trim()}]);showToast("Role added.","success");}
    finally{setNewRoleName("");setRoleModalOpen(false);setSavingRole(false);}
  };

  const handleDeleteDepartment = async (dept:{id?:string;name:string})=>{
    if(!dept.id||!window.confirm(`Delete "${dept.name}"?`))return;
    try{
      const token=localStorage.getItem("token");
      await fetch(`${API_URL}/department/${dept.id}`,{method:"DELETE",headers:{"Authorization":`Bearer ${token}`}});
      setDepartments(p=>p.filter(d=>d.id!==dept.id));
      showToast("Department deleted.","success");
    }catch{showToast("Failed to delete.","error");}
  };

  const handleDeleteRole = async (role:{id?:string;name:string})=>{
    if(!role.id||!window.confirm(`Delete "${role.name}"?`))return;
    try{
      const token=localStorage.getItem("token");
      await fetch(`${API_URL}/role/${role.id}`,{method:"DELETE",headers:{"Authorization":`Bearer ${token}`}});
      setRoles(p=>p.filter(r=>r.id!==role.id));
      showToast("Role deleted.","success");
    }catch{showToast("Failed to delete.","error");}
  };

  const handleCompleteOnboarding = async ()=>{
    try{
      const token=localStorage.getItem("token");
      const res=await fetch(`${API_URL}/owner/onboarding/complete`,{
        method:"POST",
        headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},
        body:JSON.stringify({country:selectedCountry,company:companyData,departments:departments.map(d=>d.name),roles:roles.map(r=>r.name)}),
      });
      showToast(res.ok?"✅ Onboarding Completed Successfully!":"Onboarding saved locally.","success");
    }catch{showToast("Onboarding saved locally.","success");}
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding:"32px",backgroundColor:"#F8FAFC",minHeight:"100vh" }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}

      {/* Header */}
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"32px" }}>
        <div>
          <h2 style={{ fontSize:"28px",fontWeight:700,color:"#1A202C",margin:0 }}>Welcome to KagoHC</h2>
          <p style={{ color:"#718096",fontSize:"16px",marginTop:"8px" }}>Complete your setup in a few simple steps</p>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:"15px",color:"#4A5568" }}>Selected Country</div>
          <div style={{ display:"flex",alignItems:"center",gap:"8px",fontWeight:600,color:"#33A6CD",fontSize:"18px" }}>
            <FaGlobeAfrica/> {selectedCountry}
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom:"40px" }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:"12px" }}>
          {phases.map(phase=>(
            <div key={phase.id} onClick={()=>setCurrentStep(phase.id)}
              style={{ cursor:"pointer",textAlign:"center",flex:1,opacity:currentStep>=phase.id?1:0.6 }}>
              <div style={{ width:"48px",height:"48px",margin:"0 auto 8px",borderRadius:"50%",
                backgroundColor:currentStep>=phase.id?"#33A6CD":"#E2E8F0",
                display:"flex",alignItems:"center",justifyContent:"center",
                color:currentStep>=phase.id?"white":"#718096" }}>
                {phase.icon}
              </div>
              <div style={{ fontSize:"13px",fontWeight:600,color:currentStep===phase.id?"#33A6CD":"#4A5568" }}>
                {phase.title}
              </div>
            </div>
          ))}
        </div>
        <Progress value={progress} style={{ height:"6px",borderRadius:"9999px" }} color="primary"/>
      </div>

      <Row>
        {/* Sidebar */}
        <Col md={3}>
          <Card style={{ borderRadius:"16px",boxShadow:"0 4px 20px rgba(0,0,0,0.06)" }}>
            <CardBody style={{ padding:"28px" }}>
              <h5 style={{ fontWeight:700,marginBottom:"24px" }}>Setup Progress</h5>
              {phases.map(phase=>(
                <div key={phase.id} onClick={()=>setCurrentStep(phase.id)}
                  style={{ padding:"14px",borderRadius:"12px",marginBottom:"8px",
                    backgroundColor:currentStep===phase.id?"#EBF8FF":"transparent",
                    cursor:"pointer",display:"flex",alignItems:"center",gap:"12px" }}>
                  <div style={{ color:currentStep===phase.id?"#33A6CD":"#A0AEC0" }}>{phase.icon}</div>
                  <div style={{ flex:1,fontWeight:600,fontSize:"14px" }}>{phase.title}</div>
                  {currentStep>phase.id && <FaCheckCircle color="#48BB78" size={16}/>}
                  {currentStep===phase.id && <FaChevronRight color="#33A6CD" size={14}/>}
                </div>
              ))}
            </CardBody>
          </Card>
        </Col>

        {/* Main Content */}
        <Col md={9}>
          <Card style={{ borderRadius:"16px",boxShadow:"0 4px 20px rgba(0,0,0,0.06)" }}>
            <CardBody style={{ padding:"40px" }}>

              {/* ── STEP 1: Country ───────────────────────────────────────── */}
              {currentStep===1 && (
                <>
                  <h3 style={{ fontWeight:700,marginBottom:"8px" }}>Step 1: Country Selection</h3>
                  <p style={{ color:"#718096",marginBottom:"32px" }}>
                    Select your SADC country to auto-load local compliance rules.
                  </p>
                  <FormGroup>
                    <Label style={{ fontWeight:600 }}>SADC Country</Label>
                    <Input type="select" value={selectedCountry} onChange={e=>setSelectedCountry(e.target.value)}
                      style={{ borderRadius:"12px",padding:"14px" }}>
                      {SADC_COUNTRIES.map(c=><option key={c} value={c}>{c}</option>)}
                    </Input>
                  </FormGroup>
                  <Button color="primary" size="lg"
                    style={{ backgroundColor:"#33A6CD",border:"none",borderRadius:"9999px",padding:"14px 40px",marginTop:"40px" }}
                    onClick={()=>setCurrentStep(2)}>
                    Continue to Company Information <FaChevronRight style={{ marginLeft:"8px" }}/>
                  </Button>
                </>
              )}

              {/* ── STEP 2: Company ───────────────────────────────────────── */}
              {currentStep===2 && (
                <>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"24px" }}>
                    <div>
                      <h3 style={{ fontWeight:700,margin:0 }}>Company Information</h3>
                      <p style={{ color:"#718096",margin:"4px 0 0",fontSize:"14px" }}>
                        All fields here appear in Company Settings after saving.
                      </p>
                    </div>
                    <Button color="primary"
                      style={{ backgroundColor:isEditing?"#ef4444":"#33A6CD",border:"none",borderRadius:"20px" }}
                      onClick={()=>setIsEditing(e=>!e)}>
                      {isEditing?"Cancel":"Edit Details"}
                    </Button>
                  </div>

                  {/* Logo */}
                  <div style={{ display:"flex",justifyContent:"center",marginBottom:"32px" }}>
                    <div style={{ position:"relative" }}>
                      <div style={{ width:"120px",height:"120px",borderRadius:"50%",backgroundColor:"#33A6CD",
                        display:"flex",alignItems:"center",justifyContent:"center",
                        color:"white",fontSize:"52px",fontWeight:"700",overflow:"hidden" }}>
                        {logoPreview
                          ? <img src={logoPreview} alt="Logo" style={{ width:"100%",height:"100%",objectFit:"cover" }}/>
                          : (companyData.name?.charAt(0)||"K")}
                      </div>
                      {isEditing && (
                        <label style={{ position:"absolute",bottom:"-6px",right:"-6px",backgroundColor:"white",
                          borderRadius:"50%",width:"38px",height:"38px",display:"flex",alignItems:"center",
                          justifyContent:"center",cursor:"pointer",boxShadow:"0 2px 10px rgba(0,0,0,0.15)" }}>
                          {uploadingLogo?<Spinner size="sm" color="#33A6CD"/>:<FaUpload size={18} color="#33A6CD"/>}
                          <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display:"none" }}/>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* ── BASIC INFORMATION ── */}
                  <SectionHeader icon={<FaBuilding/>} title="Basic Information"/>
                  <Row>
                    <Col md={6}>
                      <InfoField label="Company Name" value={companyData.name} isEditing={isEditing} onChange={v=>setField("name",v)} placeholder="Kago Human Capital"/>
                      <InfoField label="Company Size (employees)" value={companyData.size} isEditing={isEditing} onChange={v=>setField("size",v)} type="number" placeholder="45"/>
                      <SelectField label="Sector / Industry" value={companyData.sector} isEditing={isEditing} onChange={v=>setField("sector",v)} options={SECTORS}/>
                      <SelectField label="Business Type" value={companyData.businessType} isEditing={isEditing} onChange={v=>setField("businessType",v)} options={["Private Company","Public Company","Non-Profit Organisation","Trust","Partnership","Sole Proprietor"]}/>
                      <InfoField label="Years in Operation" value={companyData.yearsInOperation} isEditing={isEditing} onChange={v=>setField("yearsInOperation",v)} type="number"/>
                    </Col>
                    <Col md={6}>
                      <InfoField label="Company Email" value={companyData.email} isEditing={isEditing} onChange={v=>setField("email",v)} type="email" placeholder="info@company.com"/>
                      {/* Phone */}
                      <FormGroup style={{ marginBottom:"16px" }}>
                        <Label style={labelStyle}>Phone Number</Label>
                        {isEditing
                          ? <div style={{ display:"flex",gap:"8px" }}>
                              <select value={phoneCode} onChange={e=>{
                                setPhoneCode(e.target.value);
                                if(e.target.value!=="OTHER") setCustomPhoneCode("");
                              }}
                                style={{ width:"130px",borderRadius:"8px",border:"1px solid #d0d5dd",padding:"8px 10px",fontSize:"13px",flex:"0 0 auto" }}>
                                <optgroup label="Common Codes">
                                  {PHONE_CODES.slice(0,10).map(pc=><option key={pc.code} value={pc.code}>{pc.flag} {pc.code}</option>)}
                                </optgroup>
                                <optgroup label="More Countries">
                                  {PHONE_CODES.slice(10).map(pc=><option key={pc.code} value={pc.code}>{pc.flag} {pc.code}</option>)}
                                </optgroup>
                                <option value="OTHER">Other</option>
                              </select>
                              {phoneCode==="OTHER" && (
                                <Input type="text" value={customPhoneCode} onChange={e=>setCustomPhoneCode(e.target.value)}
                                  placeholder="+1 or +44" style={{ ...inputStyle,width:"90px" }}/>
                              )}
                              <Input type="tel" value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)}
                                placeholder="11 123 4567" style={{ ...inputStyle,flex:1 }}/>
                            </div>
                          : <div style={valueStyle}>{phoneCode&&phoneNumber?`${phoneCode==="OTHER"?customPhoneCode:phoneCode} ${phoneNumber}`:"—"}</div>}
                      </FormGroup>
                      <InfoField label="Alternative Phone" value={companyData.alternativePhone} isEditing={isEditing} onChange={v=>setField("alternativePhone",v)}/>
                      <InfoField label="Fax Number" value={companyData.fax} isEditing={isEditing} onChange={v=>setField("fax",v)}/>
                      <InfoField label="Website" value={companyData.website} isEditing={isEditing} onChange={v=>setField("website",v)} placeholder="www.company.com"/>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      <SelectField label="Language" value={companyData.language} isEditing={isEditing} onChange={v=>setField("language",v)} options={["English","Afrikaans","isiZulu","isiXhosa","Sepedi","Setswana","Other"]}/>
                    </Col>
                    <Col md={4}>
                      {/* Timezone with custom option */}
                      <FormGroup style={{ marginBottom:"16px" }}>
                        <Label style={labelStyle}>Timezone</Label>
                        {isEditing
                          ? <>
                              <Input type="select" value={companyData.timezone} onChange={e=>{
                                setField("timezone",e.target.value);
                                if(e.target.value!=="Other") setCustomTimezone("");
                              }} style={inputStyle}>
                                <optgroup label="Africa">
                                  {TIMEZONES.filter(t=>t.startsWith("Africa/")).map(t=><option key={t} value={t}>{t.replace("_"," ")}</option>)}
                                </optgroup>
                                <optgroup label="Americas">
                                  {TIMEZONES.filter(t=>t.startsWith("America/")).map(t=><option key={t} value={t}>{t.replace("_"," ")}</option>)}
                                </optgroup>
                                <optgroup label="Europe">
                                  {TIMEZONES.filter(t=>t.startsWith("Europe/")).map(t=><option key={t} value={t}>{t.replace("_"," ")}</option>)}
                                </optgroup>
                                <optgroup label="Asia">
                                  {TIMEZONES.filter(t=>t.startsWith("Asia/")).map(t=><option key={t} value={t}>{t.replace("_"," ")}</option>)}
                                </optgroup>
                                <optgroup label="Pacific & Other">
                                  {TIMEZONES.filter(t=>t.startsWith("Pacific/")||t==="UTC").map(t=><option key={t} value={t}>{t.replace("_"," ")}</option>)}
                                  <option value="Other">Other (Manual Entry)</option>
                                </optgroup>
                              </Input>
                              {companyData.timezone==="Other" && (
                                <Input type="text" value={customTimezone} onChange={e=>setCustomTimezone(e.target.value)}
                                  placeholder="e.g., Pacific/Fiji" style={{ ...inputStyle,marginTop:"8px" }}/>
                              )}
                            </>
                          : <div style={valueStyle}>{companyData.timezone==="Other"?customTimezone:companyData.timezone||"—"}</div>}
                      </FormGroup>
                    </Col>
                    <Col md={4}>
                      <SelectField label="Date Format" value={companyData.dateFormat} isEditing={isEditing} onChange={v=>setField("dateFormat",v)} options={["DD/MM/YYYY","MM/DD/YYYY","YYYY-MM-DD"]}/>
                    </Col>
                  </Row>

                  {/* ── REGISTRATION & LEGAL ── */}
                  <SectionHeader icon={<FaIdCard/>} title="Registration & Legal Information"/>
                  <Row>
                    <Col md={6}>
                      <InfoField label="Registration Number" value={companyData.registrationNumber} isEditing={isEditing} onChange={v=>setField("registrationNumber",v)} placeholder="2020/123456/07"/>
                      <SelectField label="Company Type" value={companyData.companyType} isEditing={isEditing} onChange={v=>setField("companyType",v)} options={COMPANY_TYPES}/>
                      <InfoField label="Registration Date" value={companyData.registrationDate} isEditing={isEditing} onChange={v=>setField("registrationDate",v)} type="date"/>
                      <InfoField label="Tax ID" value={companyData.taxId} isEditing={isEditing} onChange={v=>setField("taxId",v)} placeholder="1234567890"/>
                      <InfoField label="VAT Number" value={companyData.vatNumber} isEditing={isEditing} onChange={v=>setField("vatNumber",v)}/>
                      <InfoField label="UIF Reference" value={companyData.uifReference} isEditing={isEditing} onChange={v=>setField("uifReference",v)}/>
                    </Col>
                    <Col md={6}>
                      <InfoField label="SDL Reference" value={companyData.sdlReference} isEditing={isEditing} onChange={v=>setField("sdlReference",v)}/>
                      <InfoField label="Work Injury Fund Ref" value={companyData.workInjuryFundRef} isEditing={isEditing} onChange={v=>setField("workInjuryFundRef",v)}/>
                      <InfoField label="Income Tax Number" value={companyData.incomeTaxNumber} isEditing={isEditing} onChange={v=>setField("incomeTaxNumber",v)}/>
                      <InfoField label="PAYE Reference" value={companyData.payeReference} isEditing={isEditing} onChange={v=>setField("payeReference",v)}/>
                      <InfoField label="SARS Branch" value={companyData.sarsBranch} isEditing={isEditing} onChange={v=>setField("sarsBranch",v)}/>
                      <CheckboxField label="Provisional Taxpayer" value={companyData.provisionalTaxpayer} isEditing={isEditing} onChange={v=>setField("provisionalTaxpayer",v)}/>
                      <InfoField label="Tax Compliance Status" value={companyData.taxComplianceStatus} isEditing={isEditing} onChange={v=>setField("taxComplianceStatus",v)}/>
                    </Col>
                  </Row>

                  {/* ── BANKING ── */}
                  <SectionHeader icon={<FaUniversity/>} title="Banking Information"/>
                  <Row>
                    <Col md={6}>
                      <SelectField label="Bank Name" value={companyData.bank.bankName} isEditing={isEditing} onChange={v=>setBank("bankName",v)} options={BANKS}/>
                      <InfoField label="Account Name" value={companyData.bank.accountName} isEditing={isEditing} onChange={v=>setBank("accountName",v)}/>
                      <InfoField label="Account Number" value={companyData.bank.accountNumber} isEditing={isEditing} onChange={v=>setBank("accountNumber",v)}/>
                    </Col>
                    <Col md={6}>
                      <InfoField label="Branch Code" value={companyData.bank.branchCode} isEditing={isEditing} onChange={v=>setBank("branchCode",v)}/>
                      <SelectField label="Account Type" value={companyData.bank.accountType} isEditing={isEditing} onChange={v=>setBank("accountType",v)} options={ACCOUNT_TYPES}/>
                      <InfoField label="SWIFT Code" value={companyData.bank.swiftCode} isEditing={isEditing} onChange={v=>setBank("swiftCode",v)}/>
                    </Col>
                  </Row>

                  {/* ── KEY CONTACTS ── */}
                  <SectionHeader icon={<FaUserTie/>} title="Key Contact Persons"/>

                  <div style={{ marginBottom:"12px",fontSize:"13px",fontWeight:700,color:"#4A5568" }}>CEO / Managing Director</div>
                  <Row>
                    <Col md={4}><InfoField label="Name" value={companyData.contacts.ceo.name} isEditing={isEditing} onChange={v=>setContact("ceo","name",v)}/></Col>
                    <Col md={4}><InfoField label="Email" value={companyData.contacts.ceo.email} isEditing={isEditing} onChange={v=>setContact("ceo","email",v)} type="email"/></Col>
                    <Col md={4}><InfoField label="Phone" value={companyData.contacts.ceo.phone} isEditing={isEditing} onChange={v=>setContact("ceo","phone",v)}/></Col>
                  </Row>

                  <div style={{ marginBottom:"12px",fontSize:"13px",fontWeight:700,color:"#4A5568" }}>Finance Director / CFO</div>
                  <Row>
                    <Col md={4}><InfoField label="Name" value={companyData.contacts.finance.name} isEditing={isEditing} onChange={v=>setContact("finance","name",v)}/></Col>
                    <Col md={4}><InfoField label="Email" value={companyData.contacts.finance.email} isEditing={isEditing} onChange={v=>setContact("finance","email",v)} type="email"/></Col>
                    <Col md={4}><InfoField label="Phone" value={companyData.contacts.finance.phone} isEditing={isEditing} onChange={v=>setContact("finance","phone",v)}/></Col>
                  </Row>

                  <div style={{ marginBottom:"12px",fontSize:"13px",fontWeight:700,color:"#4A5568" }}>Payroll Manager</div>
                  <Row>
                    <Col md={4}><InfoField label="Name" value={companyData.contacts.payroll.name} isEditing={isEditing} onChange={v=>setContact("payroll","name",v)}/></Col>
                    <Col md={4}><InfoField label="Email" value={companyData.contacts.payroll.email} isEditing={isEditing} onChange={v=>setContact("payroll","email",v)} type="email"/></Col>
                    <Col md={4}><InfoField label="Phone" value={companyData.contacts.payroll.phone} isEditing={isEditing} onChange={v=>setContact("payroll","phone",v)}/></Col>
                  </Row>

                  {/* ── ADDRESS ── */}
                  <SectionHeader icon={<FaMapMarkerAlt/>} title="Address Information"/>
                  <Row>
                    <Col md={6}><TextareaField label="Physical Address" value={companyData.address.physicalAddress} isEditing={isEditing} onChange={v=>setAddr("physicalAddress",v)}/></Col>
                    <Col md={6}><TextareaField label="Postal Address" value={companyData.address.postalAddress} isEditing={isEditing} onChange={v=>setAddr("postalAddress",v)}/></Col>
                    <Col md={6}><InfoField label="Street" value={companyData.address.street} isEditing={isEditing} onChange={v=>setAddr("street",v)}/></Col>
                    <Col md={6}><InfoField label="City" value={companyData.address.city} isEditing={isEditing} onChange={v=>setAddr("city",v)}/></Col>
                    <Col md={4}>
                      {selectedCountry==="South Africa"
                        ? <SelectField label="Province" value={companyData.address.state} isEditing={isEditing} onChange={v=>setAddr("state",v)} options={SA_PROVINCES}/>
                        : <InfoField label="State / Province" value={companyData.address.state} isEditing={isEditing} onChange={v=>setAddr("state",v)}/>}
                    </Col>
                    <Col md={4}><InfoField label="Country" value={companyData.address.country} isEditing={isEditing} onChange={v=>setAddr("country",v)}/></Col>
                    <Col md={4}><InfoField label="Postal Code" value={companyData.address.postalCode} isEditing={isEditing} onChange={v=>setAddr("postalCode",v)}/></Col>
                  </Row>

                  {/* ── FISCAL YEAR ── */}
                  <SectionHeader icon={<FaCalendarAlt/>} title="Fiscal Year & Status"/>
                  <Row>
                    <Col md={3}><InfoField label="Fiscal Year Start" value={companyData.fiscalYearStart} isEditing={isEditing} onChange={v=>setField("fiscalYearStart",v)} type="date"/></Col>
                    <Col md={3}><InfoField label="Fiscal Year End" value={companyData.fiscalYearEnd} isEditing={isEditing} onChange={v=>setField("fiscalYearEnd",v)} type="date"/></Col>
                    <Col md={3}>
                      <SelectField label="Company Status" value={companyData.status} isEditing={isEditing} onChange={v=>setField("status",v)} options={["Active","Inactive","Suspended","Pending Verification"]}/>
                    </Col>
                    <Col md={3}><InfoField label="Last Audit Date" value={companyData.lastAuditDate} isEditing={isEditing} onChange={v=>setField("lastAuditDate",v)} type="date"/></Col>
                  </Row>

                  {/* Save button */}
                  {isEditing && (
                    <div style={{ marginTop:"28px",display:"flex",justifyContent:"flex-end",gap:"12px" }}>
                      <Button color="secondary" outline onClick={()=>setIsEditing(false)} style={{ borderRadius:"9999px",padding:"12px 28px" }}>
                        Cancel
                      </Button>
                      <Button color="success" onClick={handleSaveCompany} disabled={isSaving}
                        style={{ backgroundColor:"#48BB78",border:"none",borderRadius:"9999px",padding:"12px 32px" }}>
                        {isSaving?<><Spinner size="sm"/> Saving...</>:"💾 Save Company Details"}
                      </Button>
                    </div>
                  )}

                  <div style={{ marginTop:"32px" }}>
                    <Button color="primary" size="lg"
                      style={{ backgroundColor:"#33A6CD",border:"none",borderRadius:"9999px",padding:"14px 36px" }}
                      onClick={()=>setCurrentStep(3)}>
                      Continue to Owners Setup <FaChevronRight style={{ marginLeft:"8px" }}/>
                    </Button>
                  </div>
                </>
              )}

              {/* ── STEP 3: Owners ──────────────────────────────────────────── */}
              {currentStep===3 && (
                <>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px" }}>
                    <h3 style={{ fontWeight:700,margin:0 }}>Owners / Admins</h3>
                    <Button color="primary" style={{ backgroundColor:"#33A6CD",border:"none",borderRadius:"9999px" }} onClick={()=>setOwnerModalOpen(true)}>
                      <FaPlus style={{ marginRight:"8px" }}/> Add Owner
                    </Button>
                  </div>
                  <p style={{ color:"#718096",marginBottom:"24px" }}>Owners have full administrative access to the system.</p>

                  {loadingOwners
                    ? <div style={{ textAlign:"center",padding:"32px" }}><Spinner color="primary"/></div>
                    : owners.length===0
                      ? <div style={{ padding:"32px",textAlign:"center",background:"#f9fafb",borderRadius:12,border:"1px dashed #d1d5db",color:"#9ca3af" }}>
                          No owners added yet. Click "Add Owner" to create one.
                        </div>
                      : <div style={{ display:"flex",flexDirection:"column",gap:12 }}>
                          {owners.map((o,i)=>(
                            <div key={o.id||i} style={{ display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:"#f9fafb",borderRadius:12,border:"1px solid #e4e7ec" }}>
                              <div style={{ width:42,height:42,borderRadius:"50%",background:"#33A6CD",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:16,flexShrink:0 }}>
                                {o.firstName?.[0]?.toUpperCase()}{o.lastName?.[0]?.toUpperCase()}
                              </div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:15,fontWeight:600,color:"#1d2939" }}>{o.firstName} {o.lastName}</div>
                                <div style={{ fontSize:13,color:"#667085" }}>{o.email}</div>
                              </div>
                              <span style={{ fontSize:11,padding:"3px 10px",background:"#e0f2fe",color:"#0369a1",borderRadius:20,fontWeight:700 }}>Owner</span>
                            </div>
                          ))}
                        </div>}

                  <Button color="success" style={{ marginTop:"32px",borderRadius:"9999px",padding:"14px 36px" }} onClick={()=>setCurrentStep(4)}>
                    Continue to Roles &amp; Departments <FaChevronRight style={{ marginLeft:"8px" }}/>
                  </Button>
                </>
              )}

              {/* ── STEP 4: Roles & Departments ─────────────────────────────── */}
              {currentStep===4 && (
                <>
                  <h3 style={{ fontWeight:700,marginBottom:"8px" }}>Roles & Departments</h3>
                  <p style={{ color:"#718096",marginBottom:"24px" }}>Create the structure for your organisation.</p>

                  {/* Departments */}
                  <div style={{ padding:"24px",border:"1px solid #E2E8F0",borderRadius:"12px",marginBottom:"20px" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                      <h5 style={{ margin:0 }}>Departments ({departments.length})</h5>
                      <Button color="primary" size="sm" style={{ backgroundColor:"#33A6CD",border:"none",borderRadius:"9999px" }} onClick={()=>setDeptModalOpen(true)}>
                        <FaPlus style={{ marginRight:"6px" }}/> Add
                      </Button>
                    </div>
                    {loadingDepts
                      ? <div style={{ textAlign:"center",padding:16 }}><Spinner size="sm"/></div>
                      : departments.length===0
                        ? <div style={{ color:"#9ca3af",fontSize:14,padding:"12px 0" }}>No departments yet.</div>
                        : <div style={{ display:"flex",flexWrap:"wrap",gap:10 }}>
                            {departments.map((d,i)=>(
                              <div key={d.id||i} style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"6px 14px",background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:20,fontSize:13,fontWeight:600,color:"#1d4ed8" }}>
                                {d.name}
                                {d.id && <button onClick={()=>handleDeleteDepartment(d)} style={{ background:"none",border:"none",cursor:"pointer",color:"#6b7280",padding:0,display:"flex",lineHeight:1 }}><FaTrash size={10}/></button>}
                              </div>
                            ))}
                          </div>}
                  </div>

                  {/* Roles */}
                  <div style={{ padding:"24px",border:"1px solid #E2E8F0",borderRadius:"12px",marginBottom:"24px" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16 }}>
                      <h5 style={{ margin:0 }}>Roles ({roles.length})</h5>
                      <Button color="primary" size="sm" style={{ backgroundColor:"#33A6CD",border:"none",borderRadius:"9999px" }} onClick={()=>setRoleModalOpen(true)}>
                        <FaPlus style={{ marginRight:"6px" }}/> Add
                      </Button>
                    </div>
                    {loadingRoles
                      ? <div style={{ textAlign:"center",padding:16 }}><Spinner size="sm"/></div>
                      : roles.length===0
                        ? <div style={{ color:"#9ca3af",fontSize:14,padding:"12px 0" }}>No roles yet.</div>
                        : <div style={{ display:"flex",flexWrap:"wrap",gap:10 }}>
                            {roles.map((r,i)=>(
                              <div key={r.id||i} style={{ display:"inline-flex",alignItems:"center",gap:8,padding:"6px 14px",background:"#ecfdf3",border:"1px solid #bbf7d0",borderRadius:20,fontSize:13,fontWeight:600,color:"#065f46" }}>
                                {r.name}
                                {r.id && <button onClick={()=>handleDeleteRole(r)} style={{ background:"none",border:"none",cursor:"pointer",color:"#6b7280",padding:0,display:"flex",lineHeight:1 }}><FaTrash size={10}/></button>}
                              </div>
                            ))}
                          </div>}
                  </div>

                  <Button color="success" size="lg"
                    style={{ borderRadius:"9999px",padding:"14px 36px",backgroundColor:"#48BB78",border:"none" }}
                    onClick={handleCompleteOnboarding}>
                    ✅ Complete Onboarding
                  </Button>
                </>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* ── Modals ── */}
      <Modal isOpen={deptModalOpen} toggle={()=>setDeptModalOpen(false)} centered>
        <ModalHeader toggle={()=>setDeptModalOpen(false)}>Create New Department</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label>Department Name</Label>
            <Input value={newDeptName} onChange={e=>setNewDeptName(e.target.value)} placeholder="e.g. Operations" onKeyDown={e=>e.key==="Enter"&&handleAddDepartment()}/>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={()=>setDeptModalOpen(false)}>Cancel</Button>
          <Button color="primary" style={{ backgroundColor:"#33A6CD" }} onClick={handleAddDepartment} disabled={savingDept||!newDeptName.trim()}>
            {savingDept?<><Spinner size="sm"/> Saving...</>:"Add Department"}
          </Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={roleModalOpen} toggle={()=>setRoleModalOpen(false)} centered>
        <ModalHeader toggle={()=>setRoleModalOpen(false)}>Create New Role</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label>Role Name</Label>
            <Input value={newRoleName} onChange={e=>setNewRoleName(e.target.value)} placeholder="e.g. Talent Acquisition Specialist" onKeyDown={e=>e.key==="Enter"&&handleAddRole()}/>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={()=>setRoleModalOpen(false)}>Cancel</Button>
          <Button color="primary" style={{ backgroundColor:"#33A6CD" }} onClick={handleAddRole} disabled={savingRole||!newRoleName.trim()}>
            {savingRole?<><Spinner size="sm"/> Saving...</>:"Add Role"}
          </Button>
        </ModalFooter>
      </Modal>

      {ownerModalOpen && (
        <AddOwnerModal
          onClose={()=>setOwnerModalOpen(false)}
          onAdd={o=>{
            setOwners(p=>[...p,o]);
            showToast(`${o.firstName} ${o.lastName} added as owner.`,"success");
          }}
        />
      )}
    </div>
  );
};

export default OnboardingPage;