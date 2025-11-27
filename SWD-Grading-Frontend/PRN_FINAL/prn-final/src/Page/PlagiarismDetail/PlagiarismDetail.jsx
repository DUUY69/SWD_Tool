import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../Service/AxiosSetup";

const PlagiarismDetail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const examId = searchParams.get("examId");
  const examStudentId = searchParams.get("examStudentId");
  const similarityResultId = searchParams.get("similarityResultId");
  const pairData = searchParams.get("pairData"); // JSON string của pair object
  const statusFilter = searchParams.get("status");
  
  const [selectedPair, setSelectedPair] = useState(null);
  const [aiVerificationResult, setAiVerificationResult] = useState(null);
  const [verifyingAI, setVerifyingAI] = useState(false);
  const [isSimilar, setIsSimilar] = useState(false);
  const [plagiarismNotes, setPlagiarismNotes] = useState("");
  const [reverifying, setReverifying] = useState(false);

  useEffect(() => {
    // Parse pair data từ URL
    if (pairData) {
      try {
        const parsedPair = JSON.parse(decodeURIComponent(pairData));
        setSelectedPair(parsedPair);
      } catch (err) {
        console.error("Lỗi parse pair data:", err);
        alert("Không thể tải thông tin cặp nghi ngờ.");
        navigate(-1);
      }
    }
  }, [pairData, navigate]);

  const extractGoogleId = (input) => {
    if (!input) return null;
    const directMatch = input.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (directMatch) return directMatch[1];
    const idParam = input.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idParam) return idParam[1];
    return null;
  };

  const buildDrivePreviewUrl = (rawUrl) => {
    if (!rawUrl) return "";
    try {
      const parsed = new URL(rawUrl);
      const isDrive =
        parsed.hostname.includes("drive.google.com") ||
        parsed.hostname.includes("docs.google.com");
      if (!isDrive) return rawUrl;

      if (parsed.pathname.includes("/preview")) {
        return parsed.toString();
      }

      if (parsed.pathname.includes("/view")) {
        parsed.pathname = parsed.pathname.replace("/view", "/preview");
        return parsed.toString();
      }

      const resourceKey = parsed.searchParams.get("resourcekey");
      const fileId = extractGoogleId(rawUrl);
      if (fileId) {
        let previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        if (resourceKey) {
          previewUrl += `?resourcekey=${resourceKey}`;
        }
        return previewUrl;
      }

      return rawUrl;
    } catch (error) {
      const fallbackId = extractGoogleId(rawUrl);
      if (fallbackId) {
        return `https://drive.google.com/file/d/${fallbackId}/preview`;
      }
      return rawUrl;
    }
  };

  const getOfficeViewerUrl = (url) => {
    if (!url) return "";

    if (url.includes("docs.google.com") || url.includes("drive.google.com")) {
      return buildDrivePreviewUrl(url);
    }

    const encodedUrl = encodeURIComponent(url);
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
  };

  const handleAIVerify = async () => {
    if (!similarityResultId) {
      alert("Không tìm thấy similarityResultId");
      return;
    }

    try {
      setVerifyingAI(true);
      const res = await axiosInstance.post(`/docfile/${similarityResultId}/verify-with-ai`);
      const result = res.data?.data || res.data;
      setAiVerificationResult(result);
    } catch (err) {
      console.error("Lỗi AI verify:", err);
      alert("Có lỗi xảy ra khi xác minh bằng AI. Vui lòng thử lại.");
    } finally {
      setVerifyingAI(false);
    }
  };

  const handleTeacherReverify = async (similarityResultId, isSimilar, notes) => {
    try {
      await axiosInstance.post(`/docfile/${similarityResultId}/teacher-reverify`, {
        isSimilar: isSimilar,
        notes: notes
      });
      return true;
    } catch (err) {
      console.error("Lỗi teacher reverify:", err);
      throw err;
    }
  };

  const handleSubmitReverify = async () => {
    if (!similarityResultId) {
      alert("Không tìm thấy similarityResultId");
      return;
    }

    try {
      setReverifying(true);
      await handleTeacherReverify(similarityResultId, isSimilar, plagiarismNotes);
      alert("Đã lưu kết quả kiểm tra đạo văn thành công!");
      // Cập nhật trạng thái teacher verification trong aiVerificationResult nếu có
      if (aiVerificationResult) {
        setAiVerificationResult({
          ...aiVerificationResult,
          teacherVerifiedSimilar: isSimilar,
          teacherNotes: plagiarismNotes,
          teacherVerifiedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Lỗi submit reverify:", err);
      alert("Có lỗi xảy ra khi lưu kết quả. Vui lòng thử lại.");
    } finally {
      setReverifying(false);
    }
  };

  if (!selectedPair) {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0 bg-light">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center p-4 shadow-sm bg-white border-bottom">
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-outline-secondary"
            onClick={() => {
              // Quay lại trang MainPoint với modal mở
              const statusParam = statusFilter ? `&status=${statusFilter}` : "";
              navigate(`/main-point?examId=${examId}&examStudentId=${examStudentId}${statusParam}&openPlagiarism=1`);
            }}
            title="Quay lại"
          >
            <i className="bi bi-arrow-left me-1"></i>
            Quay lại
          </button>
          <div>
            <h4 className="mb-1 fw-bold">
              Chi tiết kiểm tra đạo văn
            </h4>
            <small className="text-muted">
              Độ tương đồng: {(selectedPair.similarityScore * 100).toFixed(2)}%
            </small>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-grow-1 p-4 overflow-auto">
        {/* Thông tin cặp */}
        <div className="alert alert-warning mb-4">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <strong>
                <i className="bi bi-exclamation-triangle me-2"></i>
                Cặp nghi ngờ
              </strong>
              <div className="mt-2">
                <small className="d-block">
                  <strong>Học sinh 1:</strong> {selectedPair.student1Code} - {selectedPair.docFile1Name}
                </small>
                <small className="d-block">
                  <strong>Học sinh 2:</strong> {selectedPair.student2Code} - {selectedPair.docFile2Name}
                </small>
                <small className="d-block mt-2">
                  <strong>Độ tương đồng:</strong> <span className="badge bg-danger">{(selectedPair.similarityScore * 100).toFixed(2)}%</span>
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Hiển thị 2 file side-by-side */}
        <div className="row mb-4" style={{ minHeight: "500px" }}>
          <div className="col-md-6 border-end">
            <div className="p-2 bg-primary text-white rounded-top">
              <strong>
                <i className="bi bi-file-earmark me-2"></i>
                {selectedPair.docFile1Name}
              </strong>
            </div>
            <div style={{ height: "500px", border: "1px solid #dee2e6" }}>
              <iframe
                src={getOfficeViewerUrl(selectedPair.docFile1Path)}
                width="100%"
                height="100%"
                frameBorder="0"
                title={`File 1 - ${selectedPair.docFile1Name}`}
                allowFullScreen
              ></iframe>
            </div>
          </div>
          <div className="col-md-6">
            <div className="p-2 bg-danger text-white rounded-top">
              <strong>
                <i className="bi bi-file-earmark me-2"></i>
                {selectedPair.docFile2Name}
              </strong>
            </div>
            <div style={{ height: "500px", border: "1px solid #dee2e6" }}>
              <iframe
                src={getOfficeViewerUrl(selectedPair.docFile2Path)}
                width="100%"
                height="100%"
                frameBorder="0"
                title={`File 2 - ${selectedPair.docFile2Name}`}
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>

        {/* Nút Verify with AI */}
        <div className="mb-4">
          {!aiVerificationResult && (
            <button
              className="btn btn-info btn-lg"
              onClick={handleAIVerify}
              disabled={verifyingAI || !similarityResultId}
            >
              {verifyingAI ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Đang xác minh bằng AI...
                </>
              ) : (
                <>
                  <i className="bi bi-robot me-2"></i>
                  Xác minh bằng AI
                </>
              )}
            </button>
          )}
        </div>

        {/* AI Verification Result */}
        {verifyingAI && (
          <div className="text-center py-4 mb-4">
            <div className="spinner-border text-info mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Đang xác minh bằng AI...</p>
          </div>
        )}

        {aiVerificationResult && (
          <div className="mb-4">
            <div className="card border-info">
              <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold">
                  <i className="bi bi-robot me-2"></i>
                  Kết quả xác minh AI
                </h6>
                <button
                  className="btn btn-sm btn-light"
                  onClick={handleAIVerify}
                  disabled={verifyingAI}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Làm mới
                </button>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <small className="text-muted d-block">
                      <strong>Trạng thái:</strong>
                    </small>
                    <span className={`badge ${
                      aiVerificationResult.aiVerifiedSimilar ? "bg-danger" : "bg-success"
                    }`}>
                      {aiVerificationResult.verificationStatusText || 
                       (aiVerificationResult.aiVerifiedSimilar ? "Tương đồng" : "Không tương đồng")}
                    </span>
                  </div>
                  <div className="col-md-6">
                    <small className="text-muted d-block">
                      <strong>Độ tin cậy AI:</strong>
                    </small>
                    <span className="badge bg-info">
                      {(aiVerificationResult.aiConfidenceScore * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block mb-1">
                    <strong>Tóm tắt:</strong>
                  </small>
                  <div className="p-2 bg-light rounded">
                    {aiVerificationResult.aiSummary || "Không có tóm tắt"}
                  </div>
                </div>
                <div className="mb-3">
                  <small className="text-muted d-block mb-1">
                    <strong>Phân tích chi tiết:</strong>
                  </small>
                  <div className="p-3 bg-light rounded" style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    fontSize: "13px"
                  }}>
                    {aiVerificationResult.aiAnalysis || "Không có phân tích"}
                  </div>
                </div>
                {aiVerificationResult.aiVerifiedAt && (
                  <div>
                    <small className="text-muted">
                      <i className="bi bi-clock me-1"></i>
                      Xác minh lúc: {new Date(aiVerificationResult.aiVerifiedAt).toLocaleString("vi-VN")}
                    </small>
                  </div>
                )}
                {aiVerificationResult.teacherVerifiedSimilar !== null && (
                  <div className="mt-2">
                    <small className="text-muted d-block">
                      <strong>Giáo viên đã xác nhận:</strong>
                      <span className={`badge ms-2 ${
                        aiVerificationResult.teacherVerifiedSimilar ? "bg-danger" : "bg-success"
                      }`}>
                        {aiVerificationResult.teacherVerifiedSimilar ? "Có đạo văn" : "Không đạo văn"}
                      </span>
                    </small>
                    {aiVerificationResult.teacherNotes && (
                      <div className="mt-1">
                        <small className="text-muted">
                          <strong>Ghi chú:</strong> {aiVerificationResult.teacherNotes}
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form để giáo viên nhập kết quả */}
        <div className="mt-4 pt-4 border-top">
          <div className="card">
            <div className="card-header bg-warning text-white">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-clipboard-check me-2"></i>
                Xác nhận kết quả
              </h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="isSimilarCheck"
                    checked={isSimilar}
                    onChange={(e) => setIsSimilar(e.target.checked)}
                  />
                  <label className="form-check-label" htmlFor="isSimilarCheck">
                    <strong>Xác nhận có đạo văn</strong>
                  </label>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  <i className="bi bi-chat-left-text me-2"></i>
                  Ghi chú:
                </label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Nhập ghi chú về kết quả kiểm tra đạo văn..."
                  value={plagiarismNotes}
                  onChange={(e) => setPlagiarismNotes(e.target.value)}
                />
              </div>
              <button
                className="btn btn-warning"
                onClick={handleSubmitReverify}
                disabled={reverifying || !similarityResultId}
              >
                {reverifying ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="bi bi-save me-2"></i>
                    Lưu kết quả
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlagiarismDetail;

