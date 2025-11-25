import React from "react";
import { Segmented } from "antd";

const statusOptions = [
  { label: "Tất cả", value: "ALL" },
  { label: "Chờ chấm điểm", value: "PARSED" },
  { label: "Chưa có bài", value: "NOT_FOUND" },
  { label: "Đã chấm điểm", value: "GRADED" },
];

const StudentFilters = ({ activeStatus, onChange }) => {
  return (
    <Segmented
      block
      size="large"
      value={activeStatus}
      onChange={onChange}
      options={statusOptions}
    />
  );
};

export default StudentFilters;

