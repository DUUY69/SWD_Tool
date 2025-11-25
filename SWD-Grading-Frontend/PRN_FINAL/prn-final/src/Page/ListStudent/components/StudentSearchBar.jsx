import React from "react";
import { Form, Input, Button, Space, Typography } from "antd";
import { SearchOutlined, CloseOutlined, InfoCircleOutlined } from "@ant-design/icons";

const StudentSearchBar = ({
  searchInput,
  onSearchChange,
  onSearch,
  onClear,
  searchTerm,
  loading,
}) => {
  const handleSubmit = () => {
    onSearch();
  };

  return (
    <Space direction="vertical" style={{ width: "100%" }}>
      <Form layout="inline" onFinish={handleSubmit} style={{ width: "100%" }}>
        <Form.Item style={{ flex: 1, marginBottom: 0 }}>
          <Input
            allowClear
            size="large"
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Tìm kiếm theo mã học sinh, tên hoặc email..."
            prefix={<SearchOutlined style={{ color: "#9ca3af" }} />}
          />
        </Form.Item>
        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            icon={<SearchOutlined />}
            loading={loading}
          >
            Tìm kiếm
          </Button>
        </Form.Item>
        {searchTerm && (
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              danger
              size="large"
              icon={<CloseOutlined />}
              onClick={onClear}
            >
              Xóa
            </Button>
          </Form.Item>
        )}
      </Form>
      {searchTerm && (
        <Typography.Text type="secondary">
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          Đang tìm kiếm: <Typography.Text strong>"{searchTerm}"</Typography.Text>
        </Typography.Text>
      )}
    </Space>
  );
};

export default StudentSearchBar;

