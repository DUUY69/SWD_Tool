import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../Service/AxiosSetup";
import { Layout, Space, Card, Typography, Spin, Empty, Alert, Pagination, message } from "antd";
import StudentToolbar from "./components/StudentToolbar";
import StudentFilters from "./components/StudentFilters";
import StudentSearchBar from "./components/StudentSearchBar";
import StudentGrid from "./components/StudentGrid";
import StudentList from "./components/StudentList";
import StudentTable from "./components/StudentTable";
import UploadModal from "./components/UploadModal";
import ExportHistoryModal from "./components/ExportHistoryModal";

const { Content } = Layout;
const { Text } = Typography;

const ListStudent = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const examId = searchParams.get("examId");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const role = localStorage.getItem("role");
  const [activeStatus, setActiveStatus] = useState(() => {
    const urlStatus = searchParams.get("status");
    return urlStatus && ["ALL", "PARSED", "NOT_FOUND", "GRADED"].includes(urlStatus)
      ? urlStatus
      : "ALL";
  });
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentItems: 0,
  });

  // Upload Modal States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSection, setUploadSection] = useState(null);
  const [excelUploaded, setExcelUploaded] = useState(false); // Track if Excel is uploaded

  // Exam Zips history states
  const [examZips, setExamZips] = useState([]);
  const [loadingExamZips, setLoadingExamZips] = useState(false);

  // Description upload states
  const [descriptionFile, setDescriptionFile] = useState(null);
  const [descriptionFileName, setDescriptionFileName] = useState("");
  const [descriptionLoading, setDescriptionLoading] = useState(false);
  const [descriptionProgress, setDescriptionProgress] = useState(0);
  const [descriptionError, setDescriptionError] = useState("");
  const [descriptionSuccess, setDescriptionSuccess] = useState("");

  // Details (Excel) upload states
  const [detailsFile, setDetailsFile] = useState(null);
  const [detailsFileName, setDetailsFileName] = useState("");
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsProgress, setDetailsProgress] = useState(0);
  const [detailsError, setDetailsError] = useState("");
  const [detailsSuccess, setDetailsSuccess] = useState("");

  // ZIP upload states
  const [zipFile, setZipFile] = useState(null);
  const [zipFileName, setZipFileName] = useState("");
  const [zipLoading, setZipLoading] = useState(false);
  const [zipProgress, setZipProgress] = useState(0);
  const [zipError, setZipError] = useState("");
  const [zipSuccess, setZipSuccess] = useState("");
  const [processingStatus, setProcessingStatus] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef(null);
  const [fakeZipProgress, setFakeZipProgress] = useState(0);
  const fakeProgressIntervalRef = useRef(null);
  const fakeProgressFinishTimeoutRef = useRef(null);
  const [examInfo, setExamInfo] = useState(null);
  const [examLoading, setExamLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportHistory, setExportHistory] = useState([]);
  const [showExportHistory, setShowExportHistory] = useState(false);
  // Hàm fetch tổng số items mà không thay đổi view hiện tại
  const fetchTotalItems = async () => {
    if (!examId) return;

    try {
      const res = await axiosInstance.get(`exams/${examId}/exam-students`, {
        params: {
          Page: 1,
          Size: 1, // Chỉ cần 1 item để lấy totalItems
        },
      });

      if (res.data && res.data.data) {
        setPagination(prev => ({
          ...prev,
          totalItems: res.data.data.totalItems || 0,
        }));
      }
    } catch (err) {
      console.error("Lỗi fetch tổng số items:", err);
    }
  };

  const handleExport = async () => {
    if (!examId) return;
    const loadingKey = "export-excel";

    try {
      setExportLoading(true);
      message.loading({
        content: "Đang xuất file điểm, vui lòng chờ...",
        key: loadingKey,
        duration: 0,
      });

      const response = await axiosInstance.post(`/exams/${examId}/export-excel`);

      const fileUrl = response.data?.data?.url;

      if (!fileUrl) {
        message.error({
          content: "Không tìm thấy file để tải.",
          key: loadingKey,
        });
        return;
      }

      // Tải file về
      const link = document.createElement("a");
      link.href = fileUrl;

      // Tên file excel
      link.download = `Export_Exam_${examId}.xlsx`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      message.success({
        content: "Xuất danh sách điểm thành công!",
        key: loadingKey,
      });
    } catch (err) {
      console.error("Lỗi export:", err);
      message.error({
        content: "Xuất danh sách điểm thất bại!",
        key: loadingKey,
      });
    } finally {
      setExportLoading(false);
    }
  };

  const fetchExportHistory = async () => {
    try {
      const res = await axiosInstance.get(`/exams/${examId}/grade-excel`);
      if (Array.isArray(res.data?.data)) {
        const sorted = [...res.data.data].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setExportHistory(sorted);
      }
    } catch (err) {
      console.error("Lỗi fetch lịch sử export:", err);
    }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      if (!examId) {
        setError("Không tìm thấy examId.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const params = {
          Page: page,
          Size: size,
        };

        // Chỉ thêm Status param nếu không phải "ALL"
        if (activeStatus !== "ALL") {
          params.Status = activeStatus;
        }

        if (searchTerm.trim()) {
          params.Search = searchTerm.trim();
        }

        const res = await axiosInstance.get(`/exams/${examId}/students`, {
          params,
        });

        if (res.data && res.data.data && res.data.data.result) {
          setStudents(res.data.data.result);
          setPagination({
            totalItems: res.data.data.totalItems || 0,
            totalPages: res.data.data.totalPages || 1,
            currentItems: res.data.data.currentItems || 0,
          });
        } else {
          setStudents([]);
        }
        setLoading(false);
      } catch (err) {
        console.error("Lỗi fetch danh sách học sinh:", err);
        setError("Không thể tải danh sách học sinh.");
        setLoading(false);
      }
    };

    fetchStudents();
  }, [page, size, searchTerm, activeStatus, examId]);

  useEffect(() => {
    const fetchExamInfo = async () => {
      if (!examId) return;

      try {
        setExamLoading(true);
        const res = await axiosInstance.get(`/exams/${examId}`);

        if (res.data && res.data.data) {
          setExamInfo({
            examCode: res.data.data.examCode,
            title: res.data.data.title,
          });
        }
        setExamLoading(false);
      } catch (err) {
        console.error("Lỗi fetch exam:", err);
        setExamLoading(false);
      }
    };

    fetchExamInfo();
  }, [examId]);

  // Cleanup polling interval khi component unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (fakeProgressIntervalRef.current) {
        clearInterval(fakeProgressIntervalRef.current);
        fakeProgressIntervalRef.current = null;
      }
      if (fakeProgressFinishTimeoutRef.current) {
        clearTimeout(fakeProgressFinishTimeoutRef.current);
        fakeProgressFinishTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isPolling) {
      fakeProgressIntervalRef.current = setInterval(() => {
        setFakeZipProgress((prev) => {
          if (prev >= 75) return prev;
          return Math.min(prev + 1, 75);
        });
      }, 1500);
    } else if (fakeProgressIntervalRef.current) {
      clearInterval(fakeProgressIntervalRef.current);
      fakeProgressIntervalRef.current = null;
    }

    return () => {
      if (fakeProgressIntervalRef.current) {
        clearInterval(fakeProgressIntervalRef.current);
        fakeProgressIntervalRef.current = null;
      }
    };
  }, [isPolling]);


  const handleCloseUploadModal = () => {
    if (!descriptionLoading && !detailsLoading && !zipLoading && !isPolling) {
      setShowUploadModal(false);
      setFakeZipProgress(0);
    } else if (!descriptionLoading && !detailsLoading && !zipLoading) {
      setShowUploadModal(false);
    }
  };

  const finishFakeProgress = () => {
    if (fakeProgressIntervalRef.current) {
      clearInterval(fakeProgressIntervalRef.current);
      fakeProgressIntervalRef.current = null;
    }
    setFakeZipProgress((prev) => (prev < 80 ? 80 : prev));
    if (fakeProgressFinishTimeoutRef.current) {
      clearTimeout(fakeProgressFinishTimeoutRef.current);
    }
    fakeProgressFinishTimeoutRef.current = setTimeout(() => {
      setFakeZipProgress(100);
      fakeProgressFinishTimeoutRef.current = null;
    }, 800);
  };

  // Fetch exam zips history
  useEffect(() => {
    const fetchExamZips = async () => {
      if (!examId) return;

      try {
        setLoadingExamZips(true);
        const res = await axiosInstance.get("/exam-zips", {
          params: {
            Page: 1,
            Size: 12,
            ExamId: examId,
          },
        });

        if (res.data && res.data.data && res.data.data.result) {
          setExamZips(res.data.data.result);
        } else {
          setExamZips([]);
        }
        setLoadingExamZips(false);
      } catch (err) {
        console.error("Lỗi fetch lịch sử upload:", err);
        setLoadingExamZips(false);
      }
    };

    fetchExamZips();
  }, [examId]);

  const handleSearch = () => {
    setSearchTerm(searchInput.trim());
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPage(newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleStatusChange = (status) => {
    setActiveStatus(status);
    setPage(1); // Reset về trang 1 khi đổi status
    const newParams = { examId };
    if (status !== "ALL") {
      newParams.status = status;
    }
    setSearchParams(newParams); // Update URL
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Description upload handlers
  const handleDescriptionFileChange = (file) => {
    if (file) {
      setDescriptionFile(file);
      setDescriptionFileName(file.name);
      setDescriptionError("");
    }
  };

  const removeDescriptionFile = () => {
    setDescriptionFile(null);
    setDescriptionFileName("");
  };

  const handleDescriptionSubmit = async () => {
    setDescriptionError("");
    setDescriptionSuccess("");
    setDescriptionProgress(0);

    if (!descriptionFile) {
      setDescriptionError("Vui lòng chọn file để upload.");
      return;
    }

    try {
      setDescriptionLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("file", descriptionFile);

      const response = await axiosInstance.put(
        `exams/${examId}/description`,
        formDataToSend,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setDescriptionProgress(percentCompleted);
            }
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        setDescriptionProgress(100);
        setDescriptionSuccess("Upload file description thành công!");
        message.success("Upload file description thành công!");
        setDescriptionFile(null);
        setDescriptionFileName("");
        setTimeout(() => {
          setDescriptionSuccess("");
        }, 3000);
      }
      setDescriptionLoading(false);
    } catch (err) {
      console.error("Lỗi upload file description:", err);
      if (err.response && err.response.data) {
        setDescriptionError(err.response.data.message || "Không thể upload file description.");
      } else {
        setDescriptionError("Không thể kết nối đến máy chủ.");
      }
      message.error("Upload file description thất bại.");
      setDescriptionLoading(false);
      setDescriptionProgress(0);
    }
  };

  // Details (Excel) upload handlers
  const handleDetailsFileChange = (file) => {
    if (file) {
      setDetailsFile(file);
      setDetailsFileName(file.name);
      setDetailsError("");
    }
  };

  const removeDetailsFile = () => {
    setDetailsFile(null);
    setDetailsFileName("");
  };

  const handleDetailsSubmit = async () => {
    setDetailsError("");
    setDetailsSuccess("");
    setDetailsProgress(0);

    if (!detailsFile) {
      setDetailsError("Vui lòng chọn file Excel để upload.");
      return;
    }

    try {
      setDetailsLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("file", detailsFile);

      const response = await axiosInstance.post(
        `exams/${examId}/details`,
        formDataToSend,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setDetailsProgress(percentCompleted);
            }
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        setDetailsProgress(100);
        setExcelUploaded(true); // Mark Excel as uploaded
        setDetailsSuccess("Upload file Excel thành công!");
        message.success("Upload file Excel thành công!");
        setDetailsFile(null);
        setDetailsFileName("");
        // Fetch lại tổng số items để cập nhật pagination.totalItems
        await fetchTotalItems();
        setTimeout(() => {
          setDetailsSuccess("");
        }, 3000);
      }
      setDetailsLoading(false);
    } catch (err) {
      console.error("Lỗi upload file Excel:", err);
      if (err.response && err.response.data) {
        setDetailsError(err.response.data.message || "Không thể upload file Excel.");
      } else {
        setDetailsError("Không thể kết nối đến máy chủ.");
      }
      message.error("Upload file Excel thất bại.");
      setDetailsLoading(false);
      setDetailsProgress(0);
    }
  };

  // ZIP upload handlers
  const handleZipFileChange = (file) => {
    if (file) {
      setZipFile(file);
      setZipFileName(file.name);
      setZipError("");
    }
  };

  const removeZipFile = () => {
    setZipFile(null);
    setZipFileName("");
  };

  const checkStatus = async (zipId) => {
    try {
      const res = await axiosInstance.get(`/exam-zips/${zipId}/check-status`);
      const statusData = res.data?.data || res.data;
      if (statusData) {
        setProcessingStatus(statusData);
        return statusData;
      }
    } catch (err) {
      console.error("Lỗi check status:", err);
      let errorMessage = "Không thể kiểm tra trạng thái xử lý.";
      if (err.response && err.response.data) {
        if (err.response.data.message) {
          errorMessage += `\n${err.response.data.message}`;
        }
        if (err.response.data.errors) {
          errorMessage += `\nChi tiết: ${JSON.stringify(err.response.data.errors)}`;
        }
      }
      setZipError(errorMessage);
      setIsPolling(false);
      setZipLoading(false);
    }
    return null;
  };

  const startPolling = (zipId) => {
    setIsPolling(true);
    setZipLoading(false);
    setFakeZipProgress((prev) => (prev > 0 ? prev : 1));

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    checkStatus(zipId).then((statusData) => {
      if (statusData) {
        const shouldContinue = handleStatusUpdate(statusData);
        if (!shouldContinue) {
          return;
        }
      }
    });

    pollingIntervalRef.current = setInterval(async () => {
      const statusData = await checkStatus(zipId);
      if (statusData) {
        const shouldContinue = handleStatusUpdate(statusData);
        if (!shouldContinue) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setIsPolling(false);
        }
      }
    }, 3000);
  };

  const handleStatusUpdate = (statusData) => {
    const parseStatus = statusData.parseStatus;
    if (parseStatus === "DONE" || parseStatus === 1) {
      setIsPolling(false);
      setZipLoading(false);
      setZipSuccess("Xử lý file ZIP thành công!");
      finishFakeProgress();
      setTimeout(() => {
        handleCloseUploadModal();
        window.location.reload();
      }, 2000);
      return false;
    } else if (parseStatus === "ERROR") {
      setIsPolling(false);
      setZipLoading(false);
      // Hiển thị thông tin lỗi chi tiết
      let errorMessage = "Xử lý file ZIP gặp lỗi.";
      if (statusData.parseSummary) {
        errorMessage += `\n${statusData.parseSummary}`;
      }
      if (statusData.errors && statusData.errors.length > 0) {
        errorMessage += `\nLỗi: ${statusData.errors.join(", ")}`;
      }
      if (statusData.failedStudents && statusData.failedStudents.length > 0) {
        errorMessage += `\nHọc sinh không tìm thấy: ${statusData.failedStudents.join(", ")}`;
      }
      setZipError(errorMessage);
      setFakeZipProgress(0);
      return false;
    }
    return true;
  };

  const handleZipSubmit = async () => {
    setZipError("");
    setZipSuccess("");
    setZipProgress(0);

    if (!zipFile) {
      setZipError("Vui lòng chọn file ZIP để upload.");
      return;
    }

    try {
      setZipLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("file", zipFile);

      const response = await axiosInstance.post(
        `exams/${examId}/upload-zip`,
        formDataToSend,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setZipProgress(percentCompleted);
            }
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        const responseData = response.data?.data || response.data;
        if (responseData?.examZipId) {
          setZipProgress(100);
          // Refresh danh sách exam zips
          const refreshExamZips = async () => {
            try {
              const res = await axiosInstance.get("/exam-zips", {
                params: {
                  Page: 1,
                  Size: 12,
                  ExamId: examId,
                },
              });
              if (res.data && res.data.data && res.data.data.result) {
                setExamZips(res.data.data.result);
              }
            } catch (err) {
              console.error("Lỗi refresh lịch sử upload:", err);
            }
          };
          refreshExamZips();
          startPolling(responseData.examZipId);
          message.success("Upload file ZIP thành công. Đang xử lý...");
        } else {
          setZipError("Không nhận được examZipId từ server.");
          setZipLoading(false);
        }
      }
    } catch (err) {
      console.error("Lỗi upload file ZIP:", err);
      if (err.response && err.response.data) {
        setZipError(err.response.data.message || "Không thể upload file ZIP.");
      } else {
        setZipError("Không thể kết nối đến máy chủ.");
      }
      message.error("Upload file ZIP thất bại.");
      setZipLoading(false);
      setZipProgress(0);
      setFakeZipProgress(0);
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case "PARSED":
        return { color: "blue", label: "Chờ chấm điểm" };
      case "NOT_FOUND":
        return { color: "red", label: "Chưa có bài" };
      case "GRADED":
        return { color: "green", label: "Đã chấm điểm" };
      default:
        return { color: "default", label: status || "Không rõ" };
    }
  };

  const handleSelectStudent = (student) => {
    if (student.docFiles && student.docFiles.length > 0) {
      const statusParam = activeStatus !== "ALL" ? `&status=${activeStatus}` : "";
      navigate(`/main-point?examId=${examId}&examStudentId=${student.examStudentId}${statusParam}`);
    }
  };

  const handleCreateNewGrade = async (student) => {
    if (!examId || !student.examStudentId) {
      message.error("Không tìm thấy thông tin exam hoặc học sinh.");
      return;
    }

    try {
      const response = await axiosInstance.post("/grade", {
        examStudentId: student.examStudentId,
        examId: parseInt(examId),
      });

      if (response.status === 200 || response.status === 201) {
        message.success("Tạo lượt chấm mới thành công!");
        const statusParam = activeStatus !== "ALL" ? `&status=${activeStatus}` : "";
        navigate(`/main-point?examId=${examId}&examStudentId=${student.examStudentId}${statusParam}`);
      }
    } catch (err) {
      console.error("Lỗi tạo lượt chấm mới:", err);
      if (err.response && err.response.data) {
        message.error(err.response.data.message || "Không thể tạo lượt chấm mới.");
      } else {
        message.error("Không thể kết nối đến máy chủ.");
      }
    }
  };


  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      <Content style={{ padding: 24 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <StudentToolbar
            totalItems={pagination.totalItems}
            viewMode={viewMode}
            onViewChange={setViewMode}
            onUploadClick={() => {
              setShowUploadModal(true);
              setUploadSection(null);
            }}
            onExport={handleExport}
            onViewExportHistory={() => {
              fetchExportHistory();
              setShowExportHistory(true);
            }}
            onBack={() => navigate("/point-list")}
            examInfo={examInfo}
            examLoading={examLoading}
            role={role}
            exportLoading={exportLoading}
          />

          <Card bodyStyle={{ padding: 24 }}>
            <StudentFilters
              activeStatus={activeStatus}
              onChange={handleStatusChange}
            />
          </Card>

          <Card bodyStyle={{ padding: 24 }}>
            <StudentSearchBar
              searchInput={searchInput}
              onSearchChange={setSearchInput}
              onSearch={handleSearch}
              onClear={handleClearSearch}
              searchTerm={searchTerm}
              loading={loading}
            />
          </Card>

          <Card bodyStyle={{ padding: 24 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <Spin size="large" />
                <Text type="secondary" style={{ display: "block", marginTop: 16 }}>
                  Đang tải danh sách học sinh...
                </Text>
              </div>
            ) : error ? (
              <Alert
                type="error"
                message="Không thể tải danh sách học sinh"
                description={error}
                showIcon
              />
            ) : students.length === 0 ? (
              <Empty description="Chưa có học sinh nào" />
            ) : viewMode === "grid" ? (
              <StudentGrid
                students={students}
                onSelect={handleSelectStudent}
                getStatusInfo={getStatusInfo}
                onCreateNewGrade={handleCreateNewGrade}
              />
            ) : viewMode === "table" ? (
              <StudentTable
                students={students}
                onSelect={handleSelectStudent}
                getStatusInfo={getStatusInfo}
                onCreateNewGrade={handleCreateNewGrade}
              />
            ) : (
              <StudentList
                students={students}
                onSelect={handleSelectStudent}
                getStatusInfo={getStatusInfo}
                onCreateNewGrade={handleCreateNewGrade}
              />
            )}

            {!loading && !error && pagination.totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
                <Pagination
                  current={page}
                  total={pagination.totalItems}
                  pageSize={size}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                />
              </div>
            )}

            {!loading && !error && students.length > 0 && (
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <Text type="secondary">
                  Hiển thị {((page - 1) * size) + 1} - {Math.min(page * size, pagination.totalItems)} trong tổng số {pagination.totalItems} học sinh
                </Text>
              </div>
            )}
          </Card>
        </Space>
      </Content>

      <UploadModal
        open={showUploadModal}
        section={uploadSection}
        onSectionChange={setUploadSection}
        onClose={handleCloseUploadModal}
        disableClose={descriptionLoading || detailsLoading || zipLoading || isPolling}
        descriptionProps={{
          file: descriptionFile,
          fileName: descriptionFileName,
          error: descriptionError,
          success: descriptionSuccess,
          loading: descriptionLoading,
          progress: descriptionProgress,
          onFileSelect: handleDescriptionFileChange,
          onRemove: removeDescriptionFile,
          onSubmit: handleDescriptionSubmit,
        }}
        detailsProps={{
          file: detailsFile,
          fileName: detailsFileName,
          error: detailsError,
          success: detailsSuccess,
          loading: detailsLoading,
          progress: detailsProgress,
          onFileSelect: handleDetailsFileChange,
          onRemove: removeDetailsFile,
          onSubmit: handleDetailsSubmit,
        }}
        zipProps={{
          file: zipFile,
          fileName: zipFileName,
          error: zipError,
          success: zipSuccess,
          loading: zipLoading,
          progress: zipProgress,
          onFileSelect: handleZipFileChange,
          onRemove: removeZipFile,
          onSubmit: handleZipSubmit,
          canUpload: excelUploaded || pagination.totalItems > 1,
          isPolling,
          processingStatus,
          fakeProgress: fakeZipProgress,
        }}
        examZips={examZips}
        loadingExamZips={loadingExamZips}
        formatFileSize={formatFileSize}
        formatDate={formatDate}
        excelUploaded={excelUploaded}
        totalItems={pagination.totalItems}
      />

      <ExportHistoryModal
        open={showExportHistory}
        onClose={() => setShowExportHistory(false)}
        history={exportHistory}
        formatDate={formatDate}
        role={role}        
      />

    </Layout>
  );
};

export default ListStudent;

