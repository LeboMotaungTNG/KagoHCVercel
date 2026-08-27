import React, { useState } from "react";
import { Container, Card, CardBody } from "reactstrap";
import DataTable from "react-data-table-component";
import { AiFillEye, AiOutlineSearch } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";

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

export const EmployeeReviewPage = () => {
  const [search, setSearch] = useState("");

  const mockReviewData = [
    {
      id: "1",
      createdAt: "2026-03-01T10:00:00Z",
      userId: { firstName: "Samantha", lastName: "Kgare", email: "samantha.k@company.com" },
      status: "Pending Review",
      assessment: { manager: { total: 0 } }
    },
    {
      id: "2",
      createdAt: "2026-02-15T09:30:00Z",
      userId: { firstName: "Bonolo", lastName: "Ponase", email: "bonolo.p@company.com" },
      status: "Closed",
      assessment: { manager: { total: 4.5 } }
    }
  ];

  const columns = [
    {
      name: <span className="font-weight-bold fs-13">Created Date</span>,
      selector: (row: any) => new Date(row?.createdAt).toLocaleDateString(),
    },
    {
      name: <span className="font-weight-bold fs-13">Full name</span>,
      cell: (row: any) => {
        return (
          <div className="w-100">
            {row?.userId?.firstName} {row?.userId?.lastName}
          </div>
        );
      },
    },
    {
      name: <span className="font-weight-bold fs-13">Email</span>,
      selector: (row: any) => row?.userId?.email,
    },
    {
      name: <span className="font-weight-bold fs-13">Status</span>,
      cell: (row: any) => {
        return (
          <div className="w-100">
            <span
              className={`${
                row?.status === "Not Completed"
                  ? `text-danger`
                  : row?.status === "Pending Review"
                  ? `text-warning`
                  : row?.status === "Outstanding"
                  ? `text-info`
                  : row?.status === "Closed"
                  ? `text-success`
                  : row?.status === "Not Completed"
                  ? `text-dark`
                  : ""
              }`}
              style={{
                width: 96,
                height: 32,
                borderRadius: 10,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 13,
                fontWeight: "bolder",
                color: "#fefefe",
              }}
            >
              {row?.status === "Pending Review" ? "Due" : row?.status}
            </span>
          </div>
        );
      },
    },
    {
      name: <span className="font-weight-bold fs-13">Score</span>,
      cell: (row: any) => {
        let score = row?.assessment?.manager?.total || 0;
        return (
          <span
            style={{
              fontSize: 17,
              fontWeight: "bolder",
              color: score < 3 && score > 0 ? "#ff0000" : score >= 3 ? "#08b36c" : "#fcb92c",
              marginLeft: 10,
            }}
          >
            {score.toFixed(1)}
          </span>
        );
      },
    },
    {
      name: <span className="font-weight-bold fs-13">Action</span>,
      cell: (row: any) => {
        return (
          <div style={{ display: "flex", alignItems: "center" }}>
            <div>
              {row?.status === "Pending Review" ? (
                <AiFillEye
                  size={20}
                  color="#D0D0D0"
                  className="mx-1"
                />
              ) : (
                <AiFillEye
                  size={20}
                  className="mx-1"
                  style={{ cursor: "pointer" }}
                />
              )}
            </div>
            <div>
              {row?.status === "Pending Review" ? (
                <FaEdit
                  size={16}
                  className="mx-1"
                  style={{ cursor: "pointer" }}
                />
              ) : (
                <FaEdit
                  size={16}
                  className="mx-1"
                  color="#D0D0D0"
                />
              )}
            </div>
          </div>
        );
      },
    },
  ];

  const filteredEmployeeTable = mockReviewData.filter((item) => {
    if (!search) return true;
    const fullName = `${item?.userId?.firstName} ${item?.userId?.lastName}`;
    return fullName.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <React.Fragment>
      <Container fluid={true}>
        <div className="mt-3 mb-5 w-100">
          <div className="w-100 mb-4 d-flex justify-content-between">
            <SearchInput
              Title={"Search"}
              search={search}
              setSearch={setSearch}
              radius={20}
            />
          </div>
          <Card>
            <CardBody style={employeeTbl}>
              <div style={employeeTblTitle}>Employee Review</div>
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
