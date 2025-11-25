import React from "react";
import { Table, Typography, Space, Tag, Avatar, Button } from "antd";
import { UserOutlined, FileTextOutlined, InfoCircleOutlined, EditOutlined } from "@ant-design/icons";

const StudentTable = ({ students, onSelect, getStatusInfo, onCreateNewGrade }) => {
  const columns = [
    {
      title: "ID",
      dataIndex: "examStudentId",
      key: "examStudentId",
      width: 100,
      render: (id) => <Tag color="geekblue">{id}</Tag>,
    },
    {
      title: "Tên học sinh",
      dataIndex: "studentName",
      key: "studentName",
      width: 200,
      render: (name, record) => (
        <Space>
          <Typography.Text strong>
            {name || `Học sinh ${record.examStudentId}`}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Mã học sinh",
      dataIndex: "studentCode",
      key: "studentCode",
      width: 150,
      render: (code) => (
        <Typography.Text>{code || "-"}</Typography.Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status) => {
        const statusInfo = getStatusInfo(status);
        return statusInfo.label ? (
          <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        );
      },
    },
    {
      title: "Số file",
      dataIndex: "docFiles",
      key: "docFiles",
      width: 100,
      align: "center",
      render: (docFiles) => (
        docFiles && docFiles.length > 0 ? (
          <Space size={4}>
            <FileTextOutlined style={{ color: "#1677ff" }} />
            <Typography.Text>{docFiles.length}</Typography.Text>
          </Space>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        )
      ),
    },
    {
      title: "Ghi chú",
      dataIndex: "note",
      key: "note",
      ellipsis: true,
      render: (note) => (
        note ? (
          <Space size={4}>
            <InfoCircleOutlined style={{ color: "#1677ff" }} />
            <Typography.Text type="secondary">{note}</Typography.Text>
          </Space>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        )
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 280,
      align: "center",
      fixed: "right",
      render: (_, record) => {
        const clickable = record.docFiles && record.docFiles.length > 0;
        return (
          <Space size="small" wrap>
            {clickable && (
              <Button
                type="primary"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(record);
                }}
              >
                Xem
              </Button>
            )}
            {record.docFiles && record.docFiles.length > 0 && record.status === "GRADED" && onCreateNewGrade && (
              <Button
                type="default"
                size="small"
                icon={<EditOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateNewGrade(record);
                }}
              >
                Tạo lượt chấm mới
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={students}
      rowKey="examStudentId"
      pagination={false}
      onRow={(record) => {
        const clickable = record.docFiles && record.docFiles.length > 0;
        return {
          onClick: () => clickable && onSelect(record),
          style: { cursor: clickable ? "pointer" : "default" },
        };
      }}
    />
  );
};

export default StudentTable;

