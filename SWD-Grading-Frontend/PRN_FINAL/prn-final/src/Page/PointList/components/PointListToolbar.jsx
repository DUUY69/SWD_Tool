import React from "react";
import { Card, Space, Typography, Button, Statistic, Tag } from "antd";
import { PlusCircleOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";

const PointListToolbar = ({
  totalItems,
  onCreateTurn,
  onLogout,
  role,
  username
}) => {
  return (
    <Card bodyStyle={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Space direction="vertical" size={2}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Danh sách bài chấm điểm
          </Typography.Title>
          <Statistic
            title="Tổng số bài"
            value={totalItems}
            valueStyle={{ fontSize: 20 }}
          />
        </Space>

        <Space size="middle" align="center" wrap>
          <Tag
            color="blue"
            style={{
              fontSize: 14,
              padding: "6px 10px",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {username}
          </Tag>

          {role === "EXAMINATION" && (
            <Button
              type="primary"
              icon={<PlusCircleOutlined />}
              onClick={onCreateTurn}
            >
              Tạo lượt chấm mới
            </Button>
          )}

          <Button danger icon={<LogoutOutlined />} onClick={onLogout}>
            Đăng xuất
          </Button>
        </Space>
      </div>
    </Card>
  );
};

export default PointListToolbar;
