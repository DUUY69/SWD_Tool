import React from "react";
import { List, Avatar, Space, Tag, Typography, Button } from "antd";
import { UserOutlined, FileTextOutlined, InfoCircleOutlined, EditOutlined } from "@ant-design/icons";

const StudentList = ({ students, onSelect, getStatusInfo, onCreateNewGrade }) => {
  return (
    <List
      itemLayout="vertical"
      dataSource={students}
      renderItem={(student) => {
        const statusInfo = getStatusInfo(student.status);
        const clickable = student.docFiles && student.docFiles.length > 0;
        return (
          <List.Item
            key={student.examStudentId}
            onClick={() => clickable && onSelect(student)}
            style={{
              cursor: clickable ? "pointer" : "default",
              borderRadius: 12,
              border: "1px solid #f0f0f0",
              marginBottom: 12,
              padding: 20,
            }}
          >
            <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
              <Space align="start">
                <Avatar
                  size={48}
                  icon={<UserOutlined />}
                  style={{ backgroundColor: "#e6f4ff", color: "#1677ff" }}
                />
                <Space direction="vertical" size={4}>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    {student.studentName || `Học sinh ${student.examStudentId}`}
                  </Typography.Title>
                  <Space wrap>
                    {student.studentCode && (
                      <Typography.Text type="secondary">{student.studentCode}</Typography.Text>
                    )}
                    {statusInfo.label && (
                      <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                    )}
                    {student.docFiles && student.docFiles.length > 0 && (
                      <Space size={4}>
                        <FileTextOutlined />
                        <Typography.Text type="secondary">
                          {student.docFiles.length} file
                        </Typography.Text>
                      </Space>
                    )}
                    {student.note && (
                      <Space size={4}>
                        <InfoCircleOutlined />
                        <Typography.Text type="secondary">{student.note}</Typography.Text>
                      </Space>
                    )}
                  </Space>
                </Space>
              </Space>
              <Space direction="vertical" align="end">
                <Typography.Text type="secondary">ID: {student.examStudentId}</Typography.Text>
                {student.docFiles && student.docFiles.length > 0 && student.status === "GRADED" && onCreateNewGrade && (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateNewGrade(student);
                    }}
                    size="small"
                  >
                    Tạo lượt chấm mới
                  </Button>
                )}
              </Space>
            </Space>
          </List.Item>
        );
      }}
    />
  );
};

export default StudentList;

