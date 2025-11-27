import React from "react";
import {
  Modal,
  Space,
  Button,
  Divider,
  Alert,
  Upload,
  Typography,
  Progress,
  List,
  Tag,
  Spin,
  Tooltip,
  Row,
  Col,
} from "antd";
import {
  FileTextOutlined,
  FileExcelOutlined,
  FileZipOutlined,
  UploadOutlined,
} from "@ant-design/icons";

const { Dragger } = Upload;

const steps = [
  {
    key: "description",
    title: "Bước 1",
    subtitle: "Upload đề bài",
    icon: <FileTextOutlined />,
  },
  {
    key: "details",
    title: "Bước 2",
    subtitle: "Upload danh sách Excel",
    icon: <FileExcelOutlined />,
  },
  {
    key: "zip",
    title: "Bước 3",
    subtitle: "Upload file ZIP",
    icon: <FileZipOutlined />,
  },
];

const FileDragger = ({
  file,
  fileName,
  accept,
  onFileSelect,
  onRemove,
  disabled,
  placeholder,
}) => {
  const fileList = file
    ? [
        {
          uid: "selected-file",
          name: fileName || file.name,
          status: "done",
        },
      ]
    : [];

  return (
    <Dragger
      accept={accept}
      multiple={false}
      fileList={fileList}
      beforeUpload={(newFile) => {
        onFileSelect(newFile);
        return false;
      }}
      onRemove={() => {
        onRemove();
        return false;
      }}
      disabled={disabled}
      showUploadList={!!file}
    >
      <p className="ant-upload-drag-icon">
        <UploadOutlined />
      </p>
      <p className="ant-upload-text">{placeholder}</p>
    </Dragger>
  );
};

const DescriptionPanel = (props) => {
  const { error, success, loading, progress, file, fileName, onFileSelect, onRemove, onSubmit, formatFileSize } = props;
  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      {error && <Alert type="error" message={error} showIcon />}
      {success && <Alert type="success" message={success} showIcon />}
      {loading && progress > 0 && progress < 100 && <Progress percent={progress} status="active" />}

      <FileDragger
        file={file}
        fileName={fileName}
        accept=".jpg,.jpeg,.png,.gif,.webp"
        onFileSelect={onFileSelect}
        onRemove={onRemove}
        disabled={loading}
        placeholder="Nhấn hoặc kéo thả hình ảnh đề bài (jpg, png, gif, webp)"
      />

      {file && (
        <Typography.Text type="secondary">
          Kích thước: {formatFileSize(file.size)}
        </Typography.Text>
      )}

      <Button
        type="primary"
        block
        size="large"
        icon={<UploadOutlined />}
        loading={loading}
        disabled={!file || loading}
        onClick={onSubmit}
      >
        Upload Description
      </Button>
    </Space>
  );
};

const DetailsPanel = (props) => {
  const { error, success, loading, progress, file, fileName, onFileSelect, onRemove, onSubmit, formatFileSize } = props;
  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      {error && <Alert type="error" message={error} showIcon />}
      {success && <Alert type="success" message={success} showIcon />}
      {loading && progress > 0 && progress < 100 && <Progress percent={progress} status="active" />}

      <FileDragger
        file={file}
        fileName={fileName}
        accept=".xlsx,.xls"
        onFileSelect={onFileSelect}
        onRemove={onRemove}
        disabled={loading}
        placeholder="Nhấn hoặc kéo thả file Excel"
      />

      {file && (
        <Typography.Text type="secondary">
          Kích thước: {formatFileSize(file.size)}
        </Typography.Text>
      )}

      <Button
        type="primary"
        block
        size="large"
        icon={<UploadOutlined />}
        loading={loading}
        disabled={!file || loading}
        onClick={onSubmit}
      >
        Upload Excel
      </Button>
    </Space>
  );
};

const ZipPanel = (props) => {
  const {
    error,
    success,
    loading,
    progress,
    file,
    fileName,
    onFileSelect,
    onRemove,
    onSubmit,
    formatFileSize,
    canUpload,
    isPolling,
    processingStatus,
    fakeProgress,
  } = props;

  const displayPercent = Math.min(
    Math.max(fakeProgress || 0, progress || 0),
    100
  );

  return (
    <Space direction="vertical" style={{ width: "100%" }} size="large">
      {!canUpload && (
        <Alert
          type="warning"
          message="Hãy upload danh sách sinh viên trước khi upload file bài làm."
          showIcon
        />
      )}
      {error && (
        <Alert
          type="error"
          message="Có lỗi xảy ra"
          description={<Typography.Text style={{ whiteSpace: "pre-wrap" }}>{error}</Typography.Text>}
          showIcon
        />
      )}
      {success && <Alert type="success" message={success} showIcon />}
      {loading && progress > 0 && progress < 100 && <Progress percent={progress} status="active" />}

      {(isPolling || fakeProgress > 0 || displayPercent > 0) && (
        <Space direction="vertical" style={{ width: "100%" }}>
          <Typography.Text strong>Đang xử lý file...</Typography.Text>
          <Progress
            percent={displayPercent}
            status={displayPercent >= 100 ? "success" : "active"}
          />
          {processingStatus && (
            <Typography.Text type="secondary">
              Đã xử lý: {processingStatus.processedCount} file
            </Typography.Text>
          )}
          {!processingStatus && displayPercent > 0 && (
            <Typography.Text type="secondary">
              Đang xử lý khoảng {displayPercent}% (ước tính)
            </Typography.Text>
          )}
          {processingStatus?.parseSummary && (
            <Typography.Text type="secondary" style={{ whiteSpace: "pre-wrap" }}>
              {processingStatus.parseSummary}
            </Typography.Text>
          )}
        </Space>
      )}

      <FileDragger
        file={file}
        fileName={fileName}
        accept=".zip,.rar"
        onFileSelect={onFileSelect}
        onRemove={onRemove}
        disabled={loading || isPolling || !canUpload}
        placeholder={
          canUpload ? "Nhấn hoặc kéo thả file ZIP" : "Cần upload danh sách sinh viên trước"
        }
      />

      {file && (
        <Typography.Text type="secondary">
          Kích thước: {formatFileSize(file.size)}
        </Typography.Text>
      )}

      <Button
        type="primary"
        block
        size="large"
        icon={<UploadOutlined />}
        loading={loading || isPolling}
        disabled={!file || !canUpload || loading || isPolling}
        onClick={onSubmit}
      >
        {isPolling ? "Đang xử lý..." : "Upload ZIP"}
      </Button>
    </Space>
  );
};

const UploadHistory = ({ loading, items, formatDate }) => {
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "16px 0" }}>
        <Spin />
      </div>
    );
  }

  if (!items || items.length === 0) {
    return <Typography.Text type="secondary">Chưa có lịch sử upload</Typography.Text>;
  }

  const statusColor = (status) => {
    switch (status) {
      case "DONE":
        return "green";
      case "ERROR":
        return "red";
      case "PENDING":
        return "gold";
      default:
        return "default";
    }
  };

  return (
    <List
      dataSource={items}
      renderItem={(item) => (
        <List.Item key={item.examZipId}>
          <Space direction="vertical" style={{ width: "100%" }} size={4}>
            <Space align="center" style={{ justifyContent: "space-between" }}>
              <Typography.Text strong>{item.zipName}</Typography.Text>
              <Tag color={statusColor(item.parseStatus)}>
                {item.parseStatus === "DONE"
                  ? "Hoàn thành"
                  : item.parseStatus === "ERROR"
                  ? "Lỗi"
                  : item.parseStatus === "PENDING"
                  ? "Đang xử lý"
                  : item.parseStatus}
              </Tag>
            </Space>
            <Typography.Text type="secondary">
              {formatDate(item.uploadedAt)} ・ ID: {item.examZipId}
            </Typography.Text>
          </Space>
        </List.Item>
      )}
    />
  );
};

const UploadModal = ({
  open,
  section,
  onSectionChange,
  onClose,
  disableClose,
  descriptionProps,
  detailsProps,
  zipProps,
  examZips,
  loadingExamZips,
  formatFileSize,
  formatDate,
}) => {
  return (
    <Modal
      open={open}
      title="Upload files"
      onCancel={disableClose ? undefined : onClose}
      closable={!disableClose}
      maskClosable={!disableClose}
      footer={
        <Button onClick={onClose} disabled={disableClose}>
          Đóng
        </Button>
      }
      width={920}
    >
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {steps.map((step) => {
          const disabled = step.key === "zip" && !zipProps.canUpload;
          return (
            <Col xs={24} sm={8} key={step.key}>
              <Tooltip title={disabled ? "Upload danh sách sinh viên trước" : ""}>
                <Button
                  block
                  type={section === step.key ? "primary" : "default"}
                  onClick={() => onSectionChange(step.key)}
                  disabled={disabled}
                  style={{
                    height: 100,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 4,
                    borderRadius: 16,
                  }}
                >
                  <Typography.Text strong style={{ color: "inherit" }}>
                    {step.title}
                  </Typography.Text>
                  <Space align="center">
                    {step.icon}
                    <Typography.Text style={{ color: "inherit" }}>
                      {step.subtitle}
                    </Typography.Text>
                  </Space>
                </Button>
              </Tooltip>
            </Col>
          );
        })}
      </Row>

      <Divider />

      {!section && (
        <Alert
          type="info"
          message="Chọn một bước để bắt đầu upload."
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {section === "description" && (
        <DescriptionPanel {...descriptionProps} formatFileSize={formatFileSize} />
      )}

      {section === "details" && (
        <DetailsPanel {...detailsProps} formatFileSize={formatFileSize} />
      )}

      {section === "zip" && (
        <ZipPanel {...zipProps} formatFileSize={formatFileSize} />
      )}

      <Divider />

      <Space direction="vertical" style={{ width: "100%" }} size="small">
        <Typography.Title level={5} style={{ margin: 0 }}>
          Lịch sử upload
        </Typography.Title>
        <UploadHistory
          loading={loadingExamZips}
          items={examZips}
          formatDate={formatDate}
        />
      </Space>
    </Modal>
  );
};

export default UploadModal;

