import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "reactstrap";
import DataTable from "react-data-table-component";
import { AiFillEye, AiOutlineSearch, AiOutlineUser } from "react-icons/ai";
import SharedLayout from "./SharedLayout";
import { Users } from "lucide-react";
import { C } from "../../shared/utils/employee";
import { PageHero, PerformancePage, SectionCard, ownerSearch, ownerInput, ownerTableStyles, perfBtnHero } from "./ownerUi";

const API_URL = import.meta.env.VITE_API_URL || "https://employee-evaluation-kago-e63baae4d822.herokuapp.com/api/v1";

const SearchInput = ({ Title, search, setSearch }: any) => (
  <div style={ownerSearch}>
    <AiOutlineSearch size={18} color={C.muted} />
    <input type="text" placeholder={Title} value={search} onChange={(e) => setSearch(e.target.value)} style={ownerInput} />
  </div>
);

const employeeRecordId = (row: any) => String(row?._id || row?.id || row?.employeeId || "");

export const EmployeesPage = () => {
  const navigate = useNavigate();
  const [search, setSearch]           = useState("");
  const [employees, setEmployees]     = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError]   = useState("");
  const [isPhone, setIsPhone]         = useState(false);

  const openProfile = (row: any) => {
    const id = employeeRecordId(row);
    if (!id) return;
    navigate(`/owner/profile/${id}`);
  };

  const fetchEmployees = async () => {
    setLoadingData(true);
    setFetchError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/employees`, {
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const data = await res.json();
      const rows: any[] =
        Array.isArray(data)            ? data :
        Array.isArray(data.data)       ? data.data :
        Array.isArray(data.data?.data) ? data.data.data :
        [];
      setEmployees(rows);
    } catch (err) {
      console.error(err);
      setFetchError("Failed to load employees. Please try again.");
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { fetchEmployees(); }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsPhone(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const columns = [
    {
      name: <span className="font-weight-bold fs-13">Employee</span>,
      cell: (row: any) => (
        <button
          type="button"
          onClick={() => openProfile(row)}
          style={{
            width: "100%", border: "none", background: "transparent",
            textAlign: "left", cursor: "pointer", padding: 0,
          }}
        >
          <div className="w-100 d-flex align-items-center gap-2">
            <div className="d-flex justify-content-center align-items-center" style={{
              width: 35, height: 35, borderRadius: "50%", flexShrink: 0, background: C.primary,
            }}>
              {row?.photo ? (
                <img src={row.photo} alt="" style={{ width: 35, height: 35, borderRadius: "50%", objectFit: "cover" }} />
              ) : (
                <AiOutlineUser color="white" size={19} />
              )}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>{row?.firstName} {row?.lastName}</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "#A7A7A7" }}>
                {row?.email?.length < 27 ? row?.email : `${row?.email?.substring(0, 28)}...`}
              </div>
            </div>
          </div>
        </button>
      ),
    },
    {
      name: <span className="font-weight-bold fs-13">Position</span>,
      selector: (row: any) => row?.position || row?.jobTitle || row?.job_title || row?.designation || "—",
    },
    {
      name: <span className="font-weight-bold fs-13">Department</span>,
      selector: (row: any) => row?.departmentId?.name || row?.department || "—",
    },
    {
      name: <span className="font-weight-bold fs-13">Employment</span>,
      selector: (row: any) => row?.employmentType || row?.employment_type || row?.roles?.[0]?.type || "Employee",
    },
    {
      name: <span className="font-weight-bold fs-13">Action</span>,
      cell: (row: any) => (
        <button
          type="button"
          onClick={() => openProfile(row)}
          title="View profile"
          aria-label={`View profile for ${row?.firstName || ""} ${row?.lastName || ""}`.trim()}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "6px 12px", borderRadius: 8,
            border: `1px solid ${C.primary}33`, background: `${C.primary}12`,
            color: C.primary, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          <AiFillEye size={16} />
          View profile
        </button>
      ),
    },
  ];

  const filteredEmployees = employees.filter((item) => {
    if (!search) return true;
    return [item?.firstName, item?.lastName, item?.departmentId?.name, item?.department, item?.email, item?.position, item?.jobTitle].some(
      (field) => field?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <React.Fragment>
      <PerformancePage maxWidth={1200}>
        <PageHero
          icon={<Users size={24} color="#fff" />}
          title="Employees"
          subtitle="Search the directory and open a full people file."
          actions={
            <button type="button" style={perfBtnHero} onClick={() => navigate("/owner/manage-employees")}>
              Full onboarding
            </button>
          }
        />
        {fetchError && (
          <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, marginBottom: 16, fontSize: 14, color: "#b42318" }}>
            {fetchError}
          </div>
        )}
        <SectionCard>
          <div className="w-100 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
            <SearchInput Title="Search employees" search={search} setSearch={setSearch} />
          </div>
          {loadingData ? (
            <div className="d-flex justify-content-center align-items-center py-5">
              <Spinner color="primary" /> <span className="ms-2">Loading employees...</span>
            </div>
          ) : isPhone ? (
            filteredEmployees.length === 0 ? (
              <div style={{ padding: 32, color: C.muted, textAlign: "center" }}>No employees found.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filteredEmployees.map((row) => {
                  const position = row?.position || row?.jobTitle || row?.job_title || row?.designation || "—";
                  const department = row?.departmentId?.name || row?.department || "—";
                  return (
                    <button
                      key={employeeRecordId(row) || `${row?.email}-${row?.firstName}`}
                      type="button"
                      onClick={() => openProfile(row)}
                      style={{
                        display: "flex", alignItems: "center", gap: 12, textAlign: "left",
                        width: "100%", padding: 14, borderRadius: 12, cursor: "pointer",
                        border: `1px solid ${C.line}`, background: C.surface,
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: "50%", flexShrink: 0, background: C.primary,
                        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                      }}>
                        {row?.photo ? (
                          <img src={row.photo} alt="" style={{ width: 40, height: 40, objectFit: "cover" }} />
                        ) : (
                          <AiOutlineUser color="white" size={20} />
                        )}
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 650, color: C.ink }}>
                          {row?.firstName} {row?.lastName}
                        </div>
                        <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                          {position} · {department}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.primary, flexShrink: 0 }}>View</span>
                    </button>
                  );
                })}
              </div>
            )
          ) : (
            <DataTable
              customStyles={ownerTableStyles}
              fixedHeader
              fixedHeaderScrollHeight="400px"
              columns={columns}
              responsive
              data={filteredEmployees}
              pagination
              highlightOnHover
              pointerOnHover
              onRowClicked={openProfile}
              noDataComponent={<div style={{ padding: 32, color: C.muted }}>No employees found.</div>}
            />
          )}
        </SectionCard>
      </PerformancePage>
    </React.Fragment>
  );
};

export default () => (
  <SharedLayout>
    <EmployeesPage />
  </SharedLayout>
);
