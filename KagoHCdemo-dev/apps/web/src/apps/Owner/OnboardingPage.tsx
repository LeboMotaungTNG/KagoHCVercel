import React, { useState } from "react";
import { Row, Col, Card, CardBody, Button, Input, Label, FormGroup, Progress, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { 
  FaBuilding, FaUserShield, FaGlobeAfrica, FaPlus, FaChevronRight, FaCheckCircle, FaUpload 
} from "react-icons/fa";

const SADC_COUNTRIES = [
  "Angola", "Botswana", "Comoros", "Democratic Republic of Congo", 
  "Eswatini", "Lesotho", "Madagascar", "Malawi", "Mauritius", 
  "Mozambique", "Namibia", "Seychelles", "South Africa", 
  "Tanzania", "Zambia", "Zimbabwe"
];

const OnboardingPage = () => {
  const [selectedCountry, setSelectedCountry] = useState<string>("South Africa");
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Company Details - Editable
  const [companyData, setCompanyData] = useState({
    name: "Kago Human Capital",
    size: "45",
    sector: "Technology",
    email: "info@kagohc.com",
    phone: "+27 11 123 4567",
    website: "www.kagohc.com",
    taxId: "1234567890",
    registrationNumber: "2018/123456/07",
    cipcNumber: "K234567890",
    companyType: "Close Corporation",
    companyStatus: "Active",
    registrationDate: "2018-05-15",
    registrationAuthority: "CIPC (Companies and Intellectual Property Commission)",
    address: "123 Business Park, Johannesburg, Gauteng, South Africa, 2196"
  });

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Modals
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  const [departments, setDepartments] = useState<string[]>(["HR", "Finance", "IT", "Sales"]);
  const [roles, setRoles] = useState<string[]>(["HR Manager", "Payroll Officer", "Line Manager"]);

  const [newDeptName, setNewDeptName] = useState("");
  const [newRoleName, setNewRoleName] = useState("");

  const totalSteps = 3;
  const progress = ((currentStep - 1) / totalSteps) * 100;

  const phases = [
    { id: 1, title: "Country Selection", icon: <FaGlobeAfrica size={22} /> },
    { id: 2, title: "Company Information", icon: <FaBuilding size={22} /> },
    { id: 3, title: "User & Role Setup", icon: <FaUserShield size={22} /> }
  ];

  // Handle Logo Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Company Details
  const handleSaveCompany = () => {
    setIsEditing(false);
    // You can add save logic here later
  };

  const handleAddDepartment = () => {
    if (newDeptName.trim()) {
      setDepartments([...departments, newDeptName.trim()]);
      setNewDeptName("");
      setDeptModalOpen(false);
    }
  };

  const handleAddRole = () => {
    if (newRoleName.trim()) {
      setRoles([...roles, newRoleName.trim()]);
      setNewRoleName("");
      setRoleModalOpen(false);
    }
  };

  return (
    <div style={{ padding: "32px", backgroundColor: "#F8FAFC", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: 700, color: "#1A202C", margin: 0 }}>Welcome to KagoHC</h2>
          <p style={{ color: "#718096", fontSize: "16px", marginTop: "8px" }}>Complete your setup in a few simple steps</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "15px", color: "#4A5568" }}>Selected Country</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, color: "#33A6CD", fontSize: "18px" }}>
            <FaGlobeAfrica /> {selectedCountry}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          {phases.map((phase) => (
            <div 
              key={phase.id}
              onClick={() => setCurrentStep(phase.id)}
              style={{ cursor: "pointer", textAlign: "center", flex: 1, opacity: currentStep >= phase.id ? 1 : 0.6 }}
            >
              <div style={{ 
                width: "48px", height: "48px", margin: "0 auto 8px", borderRadius: "50%", 
                backgroundColor: currentStep >= phase.id ? "#33A6CD" : "#E2E8F0",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: currentStep >= phase.id ? "white" : "#718096"
              }}>
                {phase.icon}
              </div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: currentStep === phase.id ? "#33A6CD" : "#4A5568" }}>
                {phase.title}
              </div>
            </div>
          ))}
        </div>
        <Progress value={progress} style={{ height: "6px", borderRadius: "9999px" }} color="primary" />
      </div>

      <Row>
        <Col md={4}>
          <Card style={{ borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <CardBody style={{ padding: "28px" }}>
              <h5 style={{ fontWeight: 700, marginBottom: "24px" }}>Onboarding Progress</h5>
              {phases.map((phase) => (
                <div 
                  key={phase.id}
                  onClick={() => setCurrentStep(phase.id)}
                  style={{
                    padding: "16px",
                    borderRadius: "12px",
                    marginBottom: "10px",
                    backgroundColor: currentStep === phase.id ? "#EBF8FF" : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "14px"
                  }}
                >
                  <div style={{ color: currentStep === phase.id ? "#33A6CD" : "#A0AEC0" }}>{phase.icon}</div>
                  <div style={{ flex: 1, fontWeight: 600, fontSize: "15px" }}>{phase.title}</div>
                  {currentStep > phase.id && <FaCheckCircle color="#48BB78" size={18} />}
                  {currentStep === phase.id && <FaChevronRight color="#33A6CD" size={16} />}
                </div>
              ))}
            </CardBody>
          </Card>
        </Col>

        <Col md={8}>
          <Card style={{ borderRadius: "16px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            <CardBody style={{ padding: "40px" }}>

              {currentStep === 1 && (
                <>
                  <h3 style={{ fontWeight: 700, marginBottom: "8px" }}>Step 1: Country Selection</h3>
                  <p style={{ color: "#718096", marginBottom: "32px" }}>
                    Select your SADC country to auto-load local compliance rules.
                  </p>
                  <FormGroup>
                    <Label style={{ fontWeight: 600 }}>SADC Country</Label>
                    <Input 
                      type="select" 
                      value={selectedCountry} 
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      style={{ borderRadius: "12px", padding: "14px" }}
                    >
                      {SADC_COUNTRIES.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </Input>
                  </FormGroup>

                  <Button 
                    color="primary" 
                    size="lg"
                    style={{ backgroundColor: "#33A6CD", border: "none", borderRadius: "9999px", padding: "14px 40px", marginTop: "40px" }}
                    onClick={() => setCurrentStep(2)}
                  >
                    Continue to Company Information <FaChevronRight style={{ marginLeft: "8px" }} />
                  </Button>
                </>
              )}

              {/* ==================== STEP 2: COMPANY INFORMATION (EDITABLE) ==================== */}
              {currentStep === 2 && (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
                    <h3 style={{ fontWeight: 700, margin: 0 }}>Company Information</h3>
                    <Button 
                      color="primary" 
                      style={{ backgroundColor: "#33A6CD", border: "none", borderRadius: "20px" }}
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      {isEditing ? "Cancel" : "Edit Details"}
                    </Button>
                  </div>

                  <Card style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <CardBody style={{ padding: "40px" }}>
                      
                      {/* Logo Upload */}
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: "32px" }}>
                        <div style={{ position: "relative" }}>
                          <div style={{ 
                            width: "120px", 
                            height: "120px", 
                            borderRadius: "50%", 
                            backgroundColor: "#33A6CD", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            color: "white", 
                            fontSize: "52px", 
                            fontWeight: "700",
                            overflow: "hidden"
                          }}>
                            {logoPreview ? (
                              <img src={logoPreview} alt="Company Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              companyData.name.charAt(0)
                            )}
                          </div>

                          {isEditing && (
                            <label style={{ 
                              position: "absolute", 
                              bottom: "-6px", 
                              right: "-6px", 
                              backgroundColor: "white", 
                              borderRadius: "50%", 
                              width: "38px", 
                              height: "38px", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center", 
                              cursor: "pointer",
                              boxShadow: "0 2px 10px rgba(0,0,0,0.15)"
                            }}>
                              <FaUpload size={18} color="#33A6CD" />
                              <input 
                                type="file" 
                                accept="image/*" 
                                onChange={handleLogoUpload} 
                                style={{ display: "none" }} 
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      <Row>
                        <Col md={6}>
                          <InfoRow label="Company Name" value={companyData.name} isEditing={isEditing} field="name" setCompanyData={setCompanyData} />
                          <InfoRow label="Company Size" value={companyData.size + " employees"} isEditing={isEditing} field="size" setCompanyData={setCompanyData} type="number" />
                          <InfoRow label="Sector" value={companyData.sector} isEditing={isEditing} field="sector" setCompanyData={setCompanyData} />
                          <InfoRow label="Company Email" value={companyData.email} isEditing={isEditing} field="email" setCompanyData={setCompanyData} />
                          <InfoRow label="Phone Number" value={companyData.phone} isEditing={isEditing} field="phone" setCompanyData={setCompanyData} />
                          <InfoRow label="Website" value={companyData.website} isEditing={isEditing} field="website" setCompanyData={setCompanyData} />
                          <InfoRow label="Tax ID / VAT Number" value={companyData.taxId} isEditing={isEditing} field="taxId" setCompanyData={setCompanyData} />
                        </Col>

                        <Col md={6}>
                          <h5 style={{ fontWeight: 600, marginBottom: "20px" }}>Company Registration Details</h5>
                          <InfoRow label="Business Registration Number" value={companyData.registrationNumber} isEditing={isEditing} field="registrationNumber" setCompanyData={setCompanyData} />
                          <InfoRow label="CIPC Registration Number" value={companyData.cipcNumber} isEditing={isEditing} field="cipcNumber" setCompanyData={setCompanyData} />
                          <InfoRow label="Company Type" value={companyData.companyType} isEditing={isEditing} field="companyType" setCompanyData={setCompanyData} />
                          <InfoRow label="Company Status" value={companyData.companyStatus} isEditing={isEditing} field="companyStatus" setCompanyData={setCompanyData} />
                          <InfoRow label="Registration Date" value={companyData.registrationDate} isEditing={isEditing} field="registrationDate" setCompanyData={setCompanyData} type="date" />
                          <InfoRow label="Registration Authority" value={companyData.registrationAuthority} isEditing={isEditing} field="registrationAuthority" setCompanyData={setCompanyData} />
                        </Col>
                      </Row>

                      <hr style={{ margin: "36px 0" }} />

                      <h5 style={{ fontWeight: 600, marginBottom: "12px" }}>Physical Address</h5>
                      <InfoRow label="" value={companyData.address} isEditing={isEditing} field="address" setCompanyData={setCompanyData} />
                    </CardBody>
                  </Card>

                  {isEditing && (
                    <Button color="success" style={{ marginTop: "20px", borderRadius: "9999px" }} onClick={handleSaveCompany}>
                      Save Company Details
                    </Button>
                  )}

                  <Button 
                    color="success" 
                    style={{ marginTop: "32px", borderRadius: "9999px", padding: "14px 36px" }}
                    onClick={() => setCurrentStep(3)}
                  >
                    Continue to User & Role Setup
                  </Button>
                </>
              )}

              {/* Step 3: User & Role Setup */}
              {currentStep === 3 && (
                <>
                  <h3 style={{ fontWeight: 700, marginBottom: "16px" }}>User & Role Setup</h3>
                  <p style={{ color: "#718096", marginBottom: "24px" }}>Create roles and invite your team members</p>

                  <div style={{ padding: "24px", border: "1px solid #E2E8F0", borderRadius: "12px", marginBottom: "24px" }}>
                    <h5>Current Roles ({roles.length})</h5>
                    <ul style={{ margin: "16px 0", paddingLeft: "20px" }}>
                      {roles.map((role, i) => <li key={i} style={{ marginBottom: "8px" }}>{role}</li>)}
                    </ul>
                    <Button 
                      color="primary" 
                      style={{ backgroundColor: "#33A6CD", border: "none", borderRadius: "9999px" }}
                      onClick={() => setRoleModalOpen(true)}
                    >
                      <FaPlus style={{ marginRight: "8px" }} /> Create New Role
                    </Button>
                  </div>

                  <Button 
                    color="success" 
                    style={{ borderRadius: "9999px", padding: "14px 36px" }}
                    onClick={() => alert("✅ Onboarding Completed Successfully!")}
                  >
                    Complete Onboarding
                  </Button>
                </>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Modals remain the same */}
      <Modal isOpen={deptModalOpen} toggle={() => setDeptModalOpen(false)} centered>
        <ModalHeader toggle={() => setDeptModalOpen(false)}>Create New Department</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label>Department Name</Label>
            <Input value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="e.g. Operations" />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setDeptModalOpen(false)}>Cancel</Button>
          <Button color="primary" style={{ backgroundColor: "#33A6CD" }} onClick={handleAddDepartment}>Add Department</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={roleModalOpen} toggle={() => setRoleModalOpen(false)} centered>
        <ModalHeader toggle={() => setRoleModalOpen(false)}>Create New Role</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label>Role Name</Label>
            <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="e.g. Talent Acquisition Specialist" />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setRoleModalOpen(false)}>Cancel</Button>
          <Button color="primary" style={{ backgroundColor: "#33A6CD" }} onClick={handleAddRole}>Add Role</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

// Editable Info Row
const InfoRow = ({ label, value, isEditing, field, setCompanyData, type = "text" }: any) => {
  const handleChange = (e: any) => {
    setCompanyData((prev: any) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <div style={{ fontSize: "13.5px", color: "#718096", fontWeight: 600, marginBottom: "4px" }}>{label}</div>
      {isEditing ? (
        <Input 
          type={type} 
          value={value} 
          onChange={handleChange} 
          style={{ borderRadius: "8px" }}
        />
      ) : (
        <div style={{ fontSize: "15.5px", color: "#2D3748", fontWeight: 500 }}>{value}</div>
      )}
    </div>
  );
};

export default OnboardingPage;