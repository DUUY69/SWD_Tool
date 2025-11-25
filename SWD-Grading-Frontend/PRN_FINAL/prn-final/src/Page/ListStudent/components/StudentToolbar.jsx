import React from "react";
import { Card, Space, Typography, Segmented, Button } from "antd";
import { AppstoreOutlined, OrderedListOutlined, UploadOutlined, ArrowLeftOutlined, TableOutlined, DownloadOutlined } from "@ant-design/icons";

const StudentToolbar = ({ totalItems, viewMode, onViewChange, onUploadClick, onBack, examInfo, examLoading, onExport, onViewExportHistory, role, exportLoading }) => {
  return (
    <Card bodyStyle={{ padding: 24 }}>
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Space align="center" style={{ width: "100%", justifyContent: "space-between", flexWrap: "wrap", gap: 16, }} >
          <Space direction="vertical" size={4}>
            <Typography.Title level={2} style={{ margin: 0 }}>
              {examLoading
                ? "Đang tải thông tin bài thi..."
                : `Bài thi: [${examInfo?.examCode || ""}] ${examInfo?.title || ""
                }`}
            </Typography.Title>
            <Typography.Title level={4} style={{ margin: 0 }}>
              Danh sách học sinh
            </Typography.Title>
            <Typography.Text type="secondary">
              Tổng số: {totalItems} học sinh
            </Typography.Text>
          </Space>
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
              Quay lại
            </Button>
          </Space>
        </Space>
        <Space wrap>
          {role === "EXAMINATION" && (
            <Button type="primary" icon={<UploadOutlined />} onClick={onUploadClick}>
              Upload
            </Button>
          )}
          <Button type="primary" icon={<DownloadOutlined />} onClick={onExport} loading={exportLoading} disabled={exportLoading}>
            {exportLoading ? "Đang xuất..." : "Xuất danh sách điểm"}
          </Button>
          <Button onClick={onViewExportHistory}>Lịch sử chấm điểm</Button>
        </Space>
      </Space>
    </Card>
  );
};

export default StudentToolbar;

