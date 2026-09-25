import React, { useState } from "react";
import DataTable from "react-data-table-component";
import { AiFillEye, AiOutlineSearch } from "react-icons/ai";
import { FaEdit } from "react-icons/fa";
import { ClipboardList } from "lucide-react";
import { C } from "../../shared/utils/employee";
import { PageHero, PerformancePage, SectionCard, ownerSearch, ownerInput, ownerTableStyles } from "./ownerUi";

const SearchInput = ({ Title, search, setSearch }: any) => {
  return (
    <div style={ownerSearch}>
      <AiOutlineSearch size={18} color={C.muted} />
      <input
        type="text"
        placeholder={Title}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={ownerInput}
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
      <PerformancePage maxWidth={1200}>
        <PageHero
          icon={<ClipboardList size={24} color="#fff" />}
          title="Employee Review"
          subtitle="Track review status across the organisation."
        />
        <SectionCard>
          <div className="w-100 mb-4 d-flex justify-content-between">
            <SearchInput Title="Search" search={search} setSearch={setSearch} />
          </div>
          <DataTable
            customStyles={ownerTableStyles}
            fixedHeader
            fixedHeaderScrollHeight="300px"
            columns={columns}
            responsive
            data={filteredEmployeeTable}
            pagination
          />
        </SectionCard>
      </PerformancePage>
    </React.Fragment>
  );
};
