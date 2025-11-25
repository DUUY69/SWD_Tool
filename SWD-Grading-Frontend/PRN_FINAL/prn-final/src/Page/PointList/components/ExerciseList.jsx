import React from "react";
import { List, Typography, Space, Tag, Button, Popconfirm } from "antd";
import { FileTextOutlined, DeleteOutlined, ArrowRightOutlined } from "@ant-design/icons";

const ExerciseList = ({ exercises, onSelect, onDelete, deletingId }) => {
  return (
    <List
      itemLayout="vertical"
      dataSource={exercises}
      renderItem={(exercise) => (
        <List.Item
          key={exercise.id}
          onClick={() => onSelect(exercise.id)}
          style={{ cursor: "pointer" }}
          actions={[
            <Tag color="geekblue" key="id">ID: {exercise.id}</Tag>,
            <ArrowRightOutlined key="arrow" style={{ color: "#1677ff" }} />,
          ]}
        >
          <Space
            align="start"
            style={{ width: "100%", justifyContent: "space-between" }}
          >
            <Space direction="vertical" size="small" style={{ flex: 1 }}>
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
              {exercise.description && (
                <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  {exercise.description}
                </Typography.Paragraph>
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
                icon={<DeleteOutlined />}
                onClick={(event) => event.stopPropagation()}
              />
            </Popconfirm>
          </Space>
        </List.Item>
      )}
    />
  );
};

export default ExerciseList;

