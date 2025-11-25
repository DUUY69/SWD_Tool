import React from "react";
import { Row, Col, Card, Typography, Space, Tag, Button, Popconfirm } from "antd";
import { FileTextOutlined, DeleteOutlined, ArrowRightOutlined } from "@ant-design/icons";

const ExerciseGrid = ({ exercises, onSelect, onDelete, deletingId }) => {
  const renderDescription = (description) => {
    if (!description) return null;
    return (
      <Typography.Paragraph
        type="secondary"
        ellipsis={{ rows: 2 }}
        style={{ marginBottom: 0 }}
      >
        {description}
      </Typography.Paragraph>
    );
  };

  return (
    <Row gutter={[16, 16]}>
      {exercises.map((exercise) => (
        <Col xs={24} sm={12} lg={8} key={exercise.id}>
          <Card
            hoverable
            style={{ height: "100%" }}
            onClick={() => onSelect(exercise.id)}
          >
            <Space
              direction="vertical"
              size="middle"
              style={{ width: "100%" }}
            >
              <Space align="start" style={{ width: "100%", justifyContent: "space-between" }}>
                <Space direction="vertical" size={0}>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    <Space>
                      <FileTextOutlined style={{ color: "#1677ff" }} />
                      {exercise.examCode || `Bài ${exercise.id}`}
                    </Space>
                  </Typography.Title>
                  {exercise.title && (
                    <Typography.Text type="secondary" strong>
                      {exercise.title}
                    </Typography.Text>
                  )}
                </Space>
                <Popconfirm
                  title="Xóa bài thi này?"
                  description="Hành động này không thể hoàn tác."
                  okText="Xóa"
                  cancelText="Hủy"
                  okButtonProps={{ danger: true, loading: deletingId === exercise.id }}
                  onConfirm={(event) => {
                    event?.stopPropagation();
                    onDelete(exercise.id);
                  }}
                  onCancel={(event) => event?.stopPropagation()}
                >
                  <Button
                    danger
                    type="text"
                    icon={<DeleteOutlined />}
                    onClick={(event) => event.stopPropagation()}
                  />
                </Popconfirm>
              </Space>

              {renderDescription(exercise.description)}

              <Space
                style={{ width: "100%", justifyContent: "space-between" }}
                align="center"
              >
                <Tag color="geekblue">ID: {exercise.id}</Tag>
                <ArrowRightOutlined style={{ color: "#1677ff" }} />
              </Space>
            </Space>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default ExerciseGrid;

