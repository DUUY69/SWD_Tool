import React from "react";
import { Row, Col, Card, Space, Typography, Tag, Avatar, Button } from "antd";
import { UserOutlined, FileTextOutlined, InfoCircleOutlined, EditOutlined } from "@ant-design/icons";

const StudentGrid = ({ students, onSelect, getStatusInfo, onCreateNewGrade }) => {
  return (
    <Row gutter={[16, 16]}>
      {students.map((student) => {
        const statusInfo = getStatusInfo(student.status);
        return (
          <Col xs={24} sm={12} lg={8} key={student.examStudentId}>
            <Card
              hoverable
              onClick={() => onSelect(student)}
              style={{ height: "100%" }}
              bodyStyle={{ padding: 20 }}
            >
              <Space direction="vertical" style={{ width: "100%" }} size="middle">
                <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                  <Space align="start">
                    <Avatar
                      size={48}
                      icon={<UserOutlined />}
                      style={{ backgroundColor: "#e6f4ff", color: "#1677ff" }}
                    />
                    <Space direction="vertical" size={2}>
                      <Typography.Title level={5} style={{ margin: 0 }}>
                        {student.studentName || `Học sinh ${student.examStudentId}`}
                      </Typography.Title>
                      {student.studentCode && (
                        <Typography.Text type="secondary">{student.studentCode}</Typography.Text>
                      )}
                    </Space>
                  </Space>
                  {statusInfo.label && (
                    <Tag color={statusInfo.color}>{statusInfo.label}</Tag>
                  )}
                </Space>

                {student.note && (
                  <Space size={8}>
                    <InfoCircleOutlined style={{ color: "#1677ff" }} />
                    <Typography.Text type="secondary">{student.note}</Typography.Text>
                  </Space>
                )}

                {student.docFiles && student.docFiles.length > 0 && (
                  <Space size={8}>
                    <FileTextOutlined style={{ color: "#8c8c8c" }} />
                    <Typography.Text type="secondary">
                      {student.docFiles.length} file
                    </Typography.Text>
                  </Space>
                )}

                <Typography.Text type="secondary">ID: {student.examStudentId}</Typography.Text>

                {student.docFiles && student.docFiles.length > 0 && student.status === "GRADED" && onCreateNewGrade && (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateNewGrade(student);
                    }}
                    style={{ width: "100%", marginTop: 8 }}
                  >
                    Tạo lượt chấm mới
                  </Button>
                )}
              </Space>
            </Card>
          </Col>
        );
      })}
    </Row>
  );
};

export default StudentGrid;

