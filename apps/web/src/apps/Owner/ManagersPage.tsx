import React, { useState } from "react";
import { Container, Card, CardBody, Button, Spinner, Alert } from "reactstrap";
import DataTable from "react-data-table-component";
import { AiFillEye, AiOutlineSearch, AiOutlineUser, AiOutlineDownload, AiOutlineUpload } from "react-icons/ai";

const employeeTblTitle = {
  width: "100%",
  display: "flex",
  padding: 5,
  justifyContent: "center",
  alignItems: "center",
  fontSize: 16,
  fontWeight: "bolder",
};

const employeeTbl = {
  borderRadius: 10,
  padding: 5,
  borderWidth: 2,
  borderStyle: "solid",
  borderColor: "#D9D9D9",
  boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
};

const SearchInput = ({ Title, search, setSearch, radius }: any) => {
  return (
    <div
      style={{
        width: 300,
        height: "3em",
        display: "flex",
        alignItems: "center",
        background: "#ffffff",
        paddingTop: ".58rem",
        paddingBottom: ".5rem",
        paddingLeft: "1rem",
        paddingRight: "1rem",
        marginRight: 32,
        border: "solid",
        borderWidth: 0.1,
        borderRadius: radius,
      }}
    >
      <AiOutlineSearch size={24} />
      <input
        type="text"
        placeholder={Title}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          border: "none",
          marginLeft: 8,
          paddingRight: 24,
        }}
      />
    </div>
  );
};

const ButtonBtn = ({ Title, BackgroundColor, ColorText, BorderColor, borderRadius, handleOnclick, pending, type, icon }: any) => {
  return (
    <button
      className="btn"
      style={{
        fontWeight: "600",
        color: ColorText,
        borderColor: BorderColor,
        borderWidth: "2px",
        borderStyle: "solid",
        borderRadius: borderRadius,
        backgroundColor: BackgroundColor,
        padding: "10px 20px",
      }}
      type={type}
      onClick={handleOnclick}
      disabled={pending}
    >
      <div className="d-flex justify-content-center align-items-center gap-2">
        {icon && <span>{icon}</span>}
        {!pending ? <span>{Title}</span> : null}
        {pending && (
          <>
            <Spinner size="sm" />
            <span> Processing...</span>
          </>
        )}
      </div>
    </button>
  );
};

export const ManagersPage = () => {
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const mockManagersData = [
    {
      id: "101",
      firstName: "James",
      lastName: "Smith",
      email: "james.s@company.com",
      departmentId: { name: "Engineering" },
      roles: [{ type: "Manager" }],
      photo: null
    },
    {
      id: "102",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.j@company.com",
      departmentId: { name: "Design" },
      roles: [{ type: "Manager" }],
      photo: null
    },
  ];

  const columns = [
    {
      name: <span className="font-weight-bold fs-13">Employee Name</span>,
      cell: (row: any) => (
        <div style={{ width: "100%" }}>
          <div className="w-100 d-flex align-items-center gap-2">
            <div
              className="d-flex justify-content-center align-items-center bg-primary"
              style={{ width: 35, height: 35, borderRadius: "50%" }}
            >
              {row?.photo ? (
                <img src={row.photo} alt="employee" className="w-100 h-100" style={{ borderRadius: "50%" }} />
              ) : (
                <AiOutlineUser color="white" size={19} />
              )}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 400 }}>
                {row?.firstName} {row?.lastName}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#A7A7A7" }}>
                {row?.email.length < 27 ? row?.email : `${row?.email?.substring(0, 28)}...`}
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      name: <span className="font-weight-bold fs-13">Department</span>,
      selector: (row: any) => row?.departmentId?.name,
    },
    {
      name: <span className="font-weight-bold fs-13">Role</span>,
      selector: (row: any) => row?.roles[0]?.type,
    },
    {
      name: <span className="font-weight-bold fs-13">Action</span>,
      cell: () => (
        <AiFillEye size={20} style={{ cursor: "pointer", color: "#33A6CD" }} />
      ),
    },
  ];

  const filteredEmployeeTable = mockManagersData.filter((item) => {
    if (!search) return true;
    return [item?.firstName, item?.lastName, item?.departmentId?.name].some(
      (field) => field?.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Handle Template Download
  const handleDownloadTemplate = () => {
    const headers = "National ID,Full Name,Department,Job Title,Salary,Bank Account Details\n";
    const sample = "1234567890123,John Doe,Engineering,Software Engineer,45000,ZAR123456789\n";
    
    const csvContent = headers + sample;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "KagoHC_Employee_Import_Template.csv";
    link.click();
  };

  // Handle CSV Upload (Data Migration)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadedFileName(file.name);

    // Simulate processing
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);

      // You can later add logic here to parse CSV and add real employees
      console.log(`Successfully uploaded: ${file.name}`);
    }, 1800);
  };

  return (
    <React.Fragment>
      <Container fluid={true}>
        <div className="mt-3 mb-5 w-100">

          {/* ==================== DATA MIGRATION SECTION ==================== */}
          <Card style={{ ...employeeTbl, marginBottom: "30px" }}>
            <CardBody>
              <div style={{ fontSize: 18, fontWeight: "bolder", marginBottom: "20px", color: "#1A202C" }}>
                Data Migration
              </div>
              <p style={{ color: "#718096", marginBottom: "20px" }}>
                Import your employees using the pre-formatted template. Supported fields: National ID, Full Name, Department, Job Title, Salary, Bank Account Details.
              </p>

              <div className="d-flex gap-3 flex-wrap">
                <ButtonBtn
                  Title="Download Employee Import Template"
                  BackgroundColor="#33A6CD"
                  ColorText="white"
                  BorderColor="#33A6CD"
                  borderRadius={20}
                  handleOnclick={handleDownloadTemplate}
                  icon={<AiOutlineDownload size={18} />}
                />

                <label className="btn" style={{
                  fontWeight: "600",
                  color: "white",
                  backgroundColor: "#33A6CD",
                  borderRadius: 20,
                  padding: "10px 24px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <AiOutlineUpload size={18} />
                  Upload Employee Data (CSV)
                  <input
                    type="file"
                    accept=".csv,.xlsx"
                    onChange={handleFileUpload}
                    style={{ display: "none" }}
                    disabled={isUploading}
                  />
                </label>
              </div>

              {isUploading && (
                <div className="mt-3">
                  <Spinner size="sm" /> Processing uploaded file...
                </div>
              )}

              {uploadSuccess && (
                <Alert color="success" className="mt-3">
                  ✓ Successfully imported employees from <strong>{uploadedFileName}</strong>. 
                  New records have been added to the system.
                </Alert>
              )}
            </CardBody>
          </Card>

          {/* ==================== MANAGERS TABLE SECTION ==================== */}
          <div className="w-100 mb-3 d-flex justify-content-between align-items-center">
            <SearchInput
              Title="Search Managers"
              search={search}
              setSearch={setSearch}
              radius={20}
            />
            
            <ButtonBtn
              Title="Add Manager"
              BackgroundColor="#33A6CD"
              ColorText="white"
              BorderColor="#33A6CD"
              borderRadius={20}
              handleOnclick={() => alert("Add Manager modal coming soon")}
            />
          </div>

          <Card style={employeeTbl}>
            <CardBody>
              <div style={employeeTblTitle}>Managers</div>
              <DataTable
                fixedHeader
                fixedHeaderScrollHeight="400px"
                columns={columns}
                responsive
                data={filteredEmployeeTable}
                pagination
                highlightOnHover
              />
            </CardBody>
          </Card>
        </div>
      </Container>
    </React.Fragment>
  );
};