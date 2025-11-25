import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axiosInstance from "../../Service/AxiosSetup";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const PointTurnDetail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const examId = searchParams.get("examId");
  
  const [exam, setExam] = useState(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingExam, setLoadingExam] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef(null);
  const [examZips, setExamZips] = useState([]);
  const [loadingExamZips, setLoadingExamZips] = useState(false);
  
  // Excel file states
  const [excelFile, setExcelFile] = useState(null);
  const [excelFileName, setExcelFileName] = useState("");
  const [excelUploadProgress, setExcelUploadProgress] = useState(0);
  const [excelLoading, setExcelLoading] = useState(false);
  const [excelUploaded, setExcelUploaded] = useState(false);
  const [excelError, setExcelError] = useState("");
  const [excelSuccess, setExcelSuccess] = useState("");

  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) {
        setError("Không tìm thấy bài thi.");
        setLoadingExam(false);
        return;
      }

      try {
        setLoadingExam(true);
        const res = await axiosInstance.get(`/exams/${examId}`);
        if (res.data && res.data.data) {
          setExam(res.data.data);
          // Check if exam already has details file uploaded
          // You can adjust this based on your API response structure
          if (res.data.data.hasDetailsFile) {
            setExcelUploaded(true);
          }
        }
        setLoadingExam(false);
      } catch (err) {
        console.error("Lỗi fetch bài thi:", err);
        setError("Không thể tải thông tin bài thi.");
        setLoadingExam(false);
      }
    };

    fetchExam();

    // Cleanup polling interval khi component unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [examId]);

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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError("");
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileName("");
  };

  const handleExcelFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setExcelFile(selectedFile);
      setExcelFileName(selectedFile.name);
      setExcelError("");
    }
  };

  const removeExcelFile = () => {
    setExcelFile(null);
    setExcelFileName("");
  };

  const handleExcelSubmit = async (e) => {
    e.preventDefault();
    setExcelError("");
    setExcelSuccess("");
    setExcelUploadProgress(0);

    if (!excelFile) {
      setExcelError("Vui lòng chọn file Excel để upload.");
      return;
    }

    try {
      setExcelLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("file", excelFile);

      const response = await axiosInstance.post(
        `exams/${examId}/details`,
        formDataToSend,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setExcelUploadProgress(percentCompleted);
            }
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        setExcelUploadProgress(100);
        setExcelUploaded(true);
        setExcelSuccess("Upload file Excel thành công!");
        setExcelFile(null);
        setExcelFileName("");
        setTimeout(() => {
          setExcelSuccess("");
        }, 3000);
      }
      setExcelLoading(false);
    } catch (err) {
      console.error("Lỗi upload file Excel:", err);
      if (err.response && err.response.data) {
        setExcelError(err.response.data.message || "Không thể upload file Excel.");
      } else {
        setExcelError("Không thể kết nối đến máy chủ.");
      }
      setExcelLoading(false);
      setExcelUploadProgress(0);
    }
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
      setError("Không thể kiểm tra trạng thái xử lý.");
      setIsPolling(false);
      setLoading(false);
    }
    return null;
  };

  const startPolling = (zipId) => {
    setIsPolling(true);
    setLoading(false); // Upload đã xong, bây giờ đang processing
    
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    // Check status ngay lập tức
    checkStatus(zipId).then((statusData) => {
      if (statusData) {
        const shouldContinue = handleStatusUpdate(statusData);
        if (!shouldContinue) {
          return;
        }
      }
    });

    // Polling mỗi 3 giây
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
    // Handle both string and numeric values
    if (parseStatus === "DONE" || parseStatus === 1) {
      setIsPolling(false);
      setLoading(false);
      navigate(`/list-student?examId=${examId}&status=PARSED`);
      return false; // Dừng polling
    } else if (parseStatus === "ERROR") {
      setIsPolling(false);
      setLoading(false);
      navigate(`/list-student?examId=${examId}&status=NOT_FOUND`);
      return false; // Dừng polling
    }
    // PENDING or 0 - continue polling
    return true; // Tiếp tục polling
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setUploadProgress(0);

    if (!file) {
      setError("Vui lòng chọn file để upload.");
      return;
    }

    try {
      setLoading(true);
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);

      const response = await axiosInstance.post(
        `exams/${examId}/upload-zip`,
        formDataToSend,
        {
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percentCompleted);
            }
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        const responseData = response.data?.data || response.data;
        if (responseData?.examZipId) {
          setUploadProgress(100);
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
          // Bắt đầu polling check-status
          startPolling(responseData.examZipId);
        } else {
          setError("Không nhận được examZipId từ server.");
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Lỗi upload file:", err);
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Không thể upload file.");
      } else {
        setError("Không thể kết nối đến máy chủ.");
      }
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (loadingExam) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted">Đang tải thông tin bài thi...</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="text-center">
          <i className="bi bi-exclamation-triangle text-danger" style={{ fontSize: "48px" }}></i>
          <p className="text-danger mt-3">{error || "Không tìm thấy bài thi"}</p>
          <button className="btn btn-primary mt-3" onClick={() => navigate("/point-list")}>
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0 bg-light">
      <div className="d-flex justify-content-between align-items-center p-4 shadow-sm bg-white border-bottom">
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => navigate("/point-list")}
            style={{
              borderRadius: "10px",
              padding: "8px 16px",
              fontWeight: "600",
            }}
          >
            <i className="bi bi-arrow-left me-1"></i>
            Quay lại
          </button>
          <div>
            <h4 className="mb-0 fw-bold" style={{ color: "#333" }}>
              {exam.examCode || `Bài ${exam.id}`}
            </h4>
            {exam.title && (
              <p className="mb-0 text-muted small">{exam.title}</p>
            )}
          </div>
        </div>
        {examId && (
          <button
            className="btn btn-primary"
            onClick={() => navigate(`/list-student?examId=${examId}`)}
            style={{
              borderRadius: "10px",
              padding: "8px 16px",
              fontWeight: "600",
            }}
          >
            <i className="bi bi-people me-1"></i>
            Xem danh sách học sinh
          </button>
        )}
      </div>

      <div className="flex-grow-1 p-4 overflow-auto">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-7">
            <div className="card shadow-sm border" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
                {exam.description && (
                  <div className="mb-4 p-3 bg-light rounded-3">
                    <p className="mb-0 text-muted">{exam.description}</p>
                  </div>
                )}

                {/* Upload Excel File Section */}
                <div className="mb-4 p-4 border rounded-3" style={{ backgroundColor: excelUploaded ? "#d4edda" : "#fff3cd" }}>
                  <h6 className="fw-bold mb-3" style={{ color: "#333" }}>
                    <i className={`bi ${excelUploaded ? "bi-check-circle-fill text-success" : "bi-file-excel text-warning"} me-2`}></i>
                    Bước 1: Upload file Excel (Barem điểm)
                    {excelUploaded && (
                      <span className="badge bg-success ms-2">Đã upload</span>
                    )}
                  </h6>

                  {excelUploaded ? (
                    <div className="alert alert-success d-flex align-items-center mb-0">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      <small>File Excel đã được upload thành công. Bạn có thể tiếp tục upload file ZIP.</small>
                    </div>
                  ) : (
                    <form onSubmit={handleExcelSubmit}>
                      {excelError && (
                        <div className="alert alert-danger d-flex align-items-center mb-3" style={{ borderRadius: "10px" }}>
                          <i className="bi bi-exclamation-triangle-fill me-2"></i>
                          <small>{excelError}</small>
                        </div>
                      )}

                      {excelSuccess && (
                        <div className="alert alert-success d-flex align-items-center mb-3" style={{ borderRadius: "10px" }}>
                          <i className="bi bi-check-circle-fill me-2"></i>
                          <small>{excelSuccess}</small>
                        </div>
                      )}

                      {/* Excel Upload Progress */}
                      {excelLoading && excelUploadProgress > 0 && excelUploadProgress < 100 && (
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <small className="fw-semibold text-warning">
                              <i className="bi bi-cloud-upload me-1"></i>
                              Đang upload file Excel...
                            </small>
                            <small className="text-muted">{excelUploadProgress}%</small>
                          </div>
                          <div className="progress" style={{ height: "8px", borderRadius: "10px" }}>
                            <div
                              className="progress-bar progress-bar-striped progress-bar-animated bg-warning"
                              role="progressbar"
                              style={{ width: `${excelUploadProgress}%` }}
                              aria-valuenow={excelUploadProgress}
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>
                        </div>
                      )}

                      <div className="mb-3">
                        {!excelFile ? (
                          <div
                            className="border rounded-3 p-4 text-center"
                            style={{
                              borderStyle: "dashed",
                              borderColor: "#ccc",
                              borderWidth: "2px",
                              backgroundColor: "#f8f9fa",
                              cursor: "pointer",
                              transition: "all 0.3s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = "#ffc107";
                              e.currentTarget.style.backgroundColor = "#fffbf0";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = "#ccc";
                              e.currentTarget.style.backgroundColor = "#f8f9fa";
                            }}
                          >
                            <input
                              type="file"
                              className="d-none"
                              id="excel-file-input"
                              onChange={handleExcelFileChange}
                              accept=".xlsx,.xls"
                            />
                            <label
                              htmlFor="excel-file-input"
                              className="mb-0"
                              style={{ cursor: "pointer" }}
                            >
                              <i className="bi bi-file-excel" style={{ fontSize: "32px", color: "#888" }}></i>
                              <p className="mt-2 mb-0 text-muted">
                                <small>Click để chọn file Excel hoặc kéo thả file vào đây</small>
                              </p>
                            </label>
                          </div>
                        ) : (
                          <div
                            className="border rounded-3 p-3 d-flex justify-content-between align-items-center"
                            style={{
                              backgroundColor: "#fffbf0",
                              borderColor: "#ffc107",
                            }}
                          >
                            <div className="d-flex align-items-center gap-2 flex-grow-1">
                              <i className="bi bi-file-excel text-warning" style={{ fontSize: "24px" }}></i>
                              <div className="flex-grow-1">
                                <div className="fw-semibold" style={{ color: "#333", fontSize: "14px" }}>
                                  {excelFileName}
                                </div>
                                <small className="text-muted">
                                  {formatFileSize(excelFile.size)}
                                </small>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={removeExcelFile}
                              disabled={excelLoading}
                              style={{ borderRadius: "8px" }}
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="btn btn-warning w-100"
                        disabled={excelLoading || !excelFile}
                        style={{
                          borderRadius: "10px",
                          padding: "12px",
                          fontWeight: "600",
                        }}
                      >
                        {excelLoading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Đang upload...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-cloud-upload me-2"></i>
                            Upload file Excel
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>

                {/* Upload ZIP File Section */}
                <div className={`mb-4 p-4 border rounded-3 ${!excelUploaded ? "opacity-50" : ""}`} style={{ backgroundColor: "#f8f9fa" }}>
                  <h6 className="fw-bold mb-3" style={{ color: "#333" }}>
                    <i className="bi bi-file-zip text-primary me-2"></i>
                    Bước 2: Upload file ZIP (Bài làm của học sinh)
                    {!excelUploaded && (
                      <span className="badge bg-secondary ms-2">Chưa thể upload</span>
                    )}
                  </h6>

                  {!excelUploaded && (
                    <div className="alert alert-warning d-flex align-items-center mb-3">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <small>Vui lòng upload file Excel trước khi upload file ZIP.</small>
                    </div>
                  )}

                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="alert alert-danger d-flex align-items-center mb-4" style={{ borderRadius: "10px" }}>
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <small>{error}</small>
                    </div>
                  )}

                  {success && (
                    <div className="alert alert-success d-flex align-items-center mb-4" style={{ borderRadius: "10px" }}>
                      <i className="bi bi-check-circle-fill me-2"></i>
                      <small>{success}</small>
                    </div>
                  )}

                  {/* Upload Progress */}
                  {loading && uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <small className="fw-semibold text-primary">
                          <i className="bi bi-cloud-upload me-1"></i>
                          Đang upload file...
                        </small>
                        <small className="text-muted">{uploadProgress}%</small>
                      </div>
                      <div className="progress" style={{ height: "8px", borderRadius: "10px" }}>
                        <div
                          className="progress-bar progress-bar-striped progress-bar-animated bg-primary"
                          role="progressbar"
                          style={{ width: `${uploadProgress}%` }}
                          aria-valuenow={uploadProgress}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Processing Status */}
                  {isPolling && processingStatus && (
                    <div className="mb-4 p-3 bg-light rounded-3 border">
                      <div className="d-flex align-items-center mb-2">
                        <div className="spinner-border spinner-border-sm text-primary me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <small className="fw-semibold text-primary">
                          Đang xử lý file...
                        </small>
                      </div>
                      {processingStatus.totalCount > 0 && (
                        <div className="mb-2">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small className="text-muted">
                              Đã xử lý: {processingStatus.processedCount} / {processingStatus.totalCount}
                            </small>
                            <small className="text-muted">
                              {Math.round((processingStatus.processedCount / processingStatus.totalCount) * 100)}%
                            </small>
                          </div>
                          <div className="progress" style={{ height: "6px", borderRadius: "10px" }}>
                            <div
                              className="progress-bar bg-success"
                              role="progressbar"
                              style={{ 
                                width: `${(processingStatus.processedCount / processingStatus.totalCount) * 100}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                      {processingStatus.parseSummary && (
                        <small className="text-muted d-block">
                          <i className="bi bi-info-circle me-1"></i>
                          {processingStatus.parseSummary}
                        </small>
                      )}
                      {processingStatus.errors && processingStatus.errors.length > 0 && (
                        <div className="mt-2">
                          <small className="text-danger d-block">
                            <i className="bi bi-exclamation-triangle me-1"></i>
                            Lỗi: {processingStatus.errors.join(", ")}
                          </small>
                        </div>
                      )}
                      {processingStatus.failedStudents && processingStatus.failedStudents.length > 0 && (
                        <div className="mt-2">
                          <small className="text-warning d-block">
                            <i className="bi bi-person-x me-1"></i>
                            Học sinh không tìm thấy: {processingStatus.failedStudents.join(", ")}
                          </small>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-3" style={{ color: "#333" }}>
                      <i className="bi bi-cloud-upload text-primary me-2"></i>
                      Upload file ZIP <span className="text-danger">*</span>
                    </label>

                    {!file ? (
                      <div
                        className="border rounded-3 p-4 text-center"
                        style={{
                          borderStyle: "dashed",
                          borderColor: "#ccc",
                          borderWidth: "2px",
                          backgroundColor: excelUploaded ? "#f8f9fa" : "#e9ecef",
                          cursor: excelUploaded ? "pointer" : "not-allowed",
                          transition: "all 0.3s",
                          opacity: excelUploaded ? 1 : 0.6,
                        }}
                        onMouseEnter={(e) => {
                          if (excelUploaded) {
                            e.currentTarget.style.borderColor = "#0d6efd";
                            e.currentTarget.style.backgroundColor = "#f0f7ff";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (excelUploaded) {
                            e.currentTarget.style.borderColor = "#ccc";
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                          }
                        }}
                        onClick={() => {
                          if (excelUploaded) {
                            document.getElementById("file-input").click();
                          }
                        }}
                      >
                        <input
                          type="file"
                          className="d-none"
                          id="file-input"
                          onChange={handleFileChange}
                          accept=".zip"
                          disabled={!excelUploaded}
                        />
                        <div className="mb-0" style={{ cursor: excelUploaded ? "pointer" : "not-allowed" }}>
                          <i className="bi bi-cloud-upload" style={{ fontSize: "32px", color: "#888" }}></i>
                          <p className="mt-2 mb-0 text-muted">
                            <small>
                              {excelUploaded 
                                ? "Click để chọn file ZIP hoặc kéo thả file vào đây"
                                : "Vui lòng upload file Excel trước"}
                            </small>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="border rounded-3 p-3 d-flex justify-content-between align-items-center"
                        style={{
                          backgroundColor: "#f0f7ff",
                          borderColor: "#0d6efd",
                        }}
                      >
                        <div className="d-flex align-items-center gap-2 flex-grow-1">
                          <i className="bi bi-file-earmark text-primary" style={{ fontSize: "24px" }}></i>
                          <div className="flex-grow-1">
                            <div className="fw-semibold" style={{ color: "#333", fontSize: "14px" }}>
                              {fileName}
                            </div>
                            <small className="text-muted">
                              {formatFileSize(file.size)}
                            </small>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={removeFile}
                          style={{ borderRadius: "8px" }}
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="d-flex gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary flex-grow-1"
                      onClick={() => navigate("/point-list")}
                      disabled={loading || isPolling}
                      style={{
                        borderRadius: "10px",
                        padding: "12px",
                        fontWeight: "600",
                      }}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary flex-grow-1"
                      disabled={loading || isPolling || !excelUploaded}
                      style={{
                        borderRadius: "10px",
                        padding: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {loading || isPolling ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          {loading ? "Đang upload..." : "Đang xử lý..."}
                        </>
                      ) : (
                        <>
                          <i className="bi bi-cloud-upload me-2"></i>
                          Upload file ZIP
                        </>
                      )}
                    </button>
                  </div>
                </form>
                </div>
              </div>
            </div>

            {/* Lịch sử upload */}
            <div className="mt-4">
              <div className="card shadow-sm border" style={{ borderRadius: "12px" }}>
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-4" style={{ color: "#333" }}>
                    <i className="bi bi-clock-history text-primary me-2"></i>
                    Lịch sử upload
                  </h5>

                  {loadingExamZips ? (
                    <div className="text-center py-4">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : examZips.length === 0 ? (
                    <div className="text-center py-4">
                      <i className="bi bi-inbox text-muted" style={{ fontSize: "48px" }}></i>
                      <p className="text-muted mt-3 mb-0">Chưa có lịch sử upload nào</p>
                    </div>
                  ) : (
                    <div className="list-group">
                      {examZips.map((zip) => (
                        <div
                          key={zip.examZipId}
                          className="list-group-item border rounded-3 mb-2 shadow-sm"
                          style={{
                            transition: "all 0.3s",
                            borderWidth: "1px",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = "#f8f9fa";
                            e.currentTarget.style.borderColor = "#0d6efd";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "#fff";
                            e.currentTarget.style.borderColor = "#dee2e6";
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="d-flex align-items-center gap-2 mb-2">
                                <i className="bi bi-file-zip text-primary" style={{ fontSize: "20px" }}></i>
                                <span className="fw-semibold" style={{ color: "#333" }}>
                                  {zip.zipName}
                                </span>
                                <span className={`badge ${
                                  zip.parseStatus === "DONE" ? "bg-success" :
                                  zip.parseStatus === "ERROR" ? "bg-danger" :
                                  zip.parseStatus === "PENDING" ? "bg-warning" : "bg-secondary"
                                }`}>
                                  {zip.parseStatus === "DONE" ? "Hoàn thành" :
                                   zip.parseStatus === "ERROR" ? "Lỗi" :
                                   zip.parseStatus === "PENDING" ? "Đang xử lý" : zip.parseStatus}
                                </span>
                              </div>
                              <div className="mb-2">
                                <small className="text-muted d-flex align-items-center">
                                  <i className="bi bi-calendar3 me-2"></i>
                                  {formatDate(zip.uploadedAt)}
                                </small>
                              </div>
                              {zip.totalCount > 0 ? (
                                <div className="mb-2">
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <small className="text-muted">
                                      Đã xử lý: {zip.processedCount} / {zip.totalCount}
                                    </small>
                                    <small className="text-muted">
                                      {Math.round((zip.processedCount / zip.totalCount) * 100)}%
                                    </small>
                                  </div>
                                  <div className="progress" style={{ height: "6px", borderRadius: "10px" }}>
                                    <div
                                      className={`progress-bar ${
                                        zip.parseStatus === "DONE" ? "bg-success" :
                                        zip.parseStatus === "ERROR" ? "bg-danger" : "bg-warning"
                                      }`}
                                      role="progressbar"
                                      style={{ 
                                        width: `${(zip.processedCount / zip.totalCount) * 100}%` 
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              ) : (
                                <div className="mb-2">
                                  <small className="text-muted">
                                    Đã xử lý: {zip.processedCount} / {zip.totalCount || 0}
                                  </small>
                                </div>
                              )}
                              {zip.parseSummary && (
                                <div className="mt-2">
                                  <small className="text-muted d-block" style={{ 
                                    whiteSpace: "pre-wrap",
                                    fontSize: "12px"
                                  }}>
                                    <i className="bi bi-info-circle me-1"></i>
                                    {zip.parseSummary}
                                  </small>
                                </div>
                              )}
                            </div>
                            <div className="ms-3">
                              <small className="text-muted">
                                ID: {zip.examZipId}
                              </small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointTurnDetail;

