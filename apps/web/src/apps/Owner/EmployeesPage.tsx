import React, { useState } from "react";
import { Container, Card, CardBody, Spinner } from "reactstrap";
import DataTable from "react-data-table-component";
import { AiFillEye, AiOutlineSearch, AiOutlineUser } from "react-icons/ai";

// Styles identical to original TableStyle.js
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

const ButtonBtn = ({ Title, BackgroundColor, ColorText, BorderColor, borderRadius, handleOnclick, pending, type }: any) => {
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
      }}
      type={type}
      onClick={handleOnclick}
    >
      <div className="d-flex justify-content-center align-items-center">
        {!pending ? <span>{Title}</span> : null}
        {pending ? (
          <>
            <Spinner size="sm">Loading...</Spinner>
            <span> Loading</span>
          </>
        ) : null}
      </div>
    </button>
  );
};

export const EmployeesPage = () => {
  const [search, setSearch] = useState("");

  const mockEmployeesData = [
    {
      id: "1",
      firstName: "Alinah",
      lastName: "Molepo",
      email: "alinah.m@company.com",
      departmentId: { name: "Design" },
      roles: [{ type: "Employee" }],
      photo: null
    },
    {
      id: "2",
      firstName: "Bonolo",
      lastName: "Ponase",
      email: "bonolo.p@company.com",
      departmentId: { name: "Marketing" },
      roles: [{ type: "Employee" }],
      photo: null
    },
    {
      id: "3",
      firstName: "Samantha",
      lastName: "Kgare",
      email: "samantha.k@company.com",
      departmentId: { name: "Design" },
      roles: [{ type: "Intern" }],
      photo: null
    }
  ];

  const columns = [
    {
      name: <span className="font-weight-bold fs-13">Employee Name</span>,
      cell: (row: any) => {
        return (
          <div style={{ width: "100%" }}>
            <div className="w-100 d-flex align-items-center gap-2">
              <div
                className="d-flex justify-content-center align-items-center bg-primary"
                style={{ width: 35, height: 35, borderRadius: "50%" }}
              >
                {row?.photo ? (
                  <img
                    src={row?.photo}
                    alt="employee-pic"
                    className="w-100 h-100"
                    style={{ borderRadius: "50%" }}
                  />
                ) : (
                  <AiOutlineUser color="white" size={19} />
                )}
              </div>
              <div className="">
                <div style={{ fontSize: 14, fontWeight: 400 }}>
                  {row?.firstName} {row?.lastName}
                </div>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#A7A7A7" }}>
                  {row?.email.length < 27
                    ? row?.email
                    : `${row?.email?.substring(0, 28)}...`}
                </div>
              </div>
            </div>
          </div>
        );
      },
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
      cell: (row: any) => {
        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div>
              <AiFillEye
                size={20}
                className="mx-1"
                style={{ cursor: "pointer" }}
              />
            </div>
          </div>
        );
      },
    },
  ];

  const filteredEmployeeTable = mockEmployeesData.filter((item) => {
    if (!search) return true;
    return [item?.firstName, item?.lastName, item?.departmentId?.name].some(
      (field) => field?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <React.Fragment>
      <Container fluid={true}>
        <div className="mt-3 mb-5 w-100">
          <div className="w-100 mb-3 d-flex justify-content-between">
            <SearchInput
              Title={"Search"}
              search={search}
              setSearch={setSearch}
              radius={20}
            />
            <div style={{ fontSize: 18, fontWeight: "bolder" }}>
              <ButtonBtn
                Title="Add Employee"
                type="button"
                BackgroundColor="#33A6CD"
                ColorText="white"
                BorderColor="#33A6CD"
                borderRadius={20}
                handleOnclick={() => {}}
                pending={false}
              />
            </div>
          </div>
          <Card style={employeeTbl}>
            <CardBody>
              <div style={employeeTblTitle}>Employees</div>
              <DataTable
                fixedHeader
                fixedHeaderScrollHeight="300px"
                columns={columns}
                responsive
                data={filteredEmployeeTable}
                pagination
              />
            </CardBody>
          </Card>
        </div>
      </Container>
    </React.Fragment>
  );
};
