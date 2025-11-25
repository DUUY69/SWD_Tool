import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../Service/AxiosSetup";

const PointTurn = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    examCode: "",
    title: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.examCode.trim()) {
      setError("Vui lòng nhập mã bài thi.");
      return;
    }

    if (!formData.title.trim()) {
      setError("Vui lòng nhập tiêu đề.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        examCode: formData.examCode.trim(),
        title: formData.title.trim(),
        description: formData.description.trim() || "",
      };

      const response = await axiosInstance.post(
        "/exams",
        payload
      );

      if (response.data.code === 200 || response.data.code === 201) {
        setSuccess("Tạo lượt chấm bài thành công!");
        navigate("/point-list"); 
      }
    } catch (err) {
      console.error("Lỗi tạo lượt chấm:", err);
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Không thể tạo lượt chấm bài.");
      } else {
        setError("Không thể kết nối đến máy chủ.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0 bg-light">
      <div className="d-flex justify-content-between align-items-center p-4 shadow-sm bg-white border-bottom">
        <div className="d-flex align-items-center gap-3">
          <h4 className="mb-0 fw-bold" style={{ color: "#333" }}>
            Tạo lượt chấm bài mới
          </h4>
        </div>
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/point-list")}
          style={{
            borderRadius: "10px",
            padding: "8px 16px",
            fontWeight: "600",
          }}
        >
          <i className="bi bi-list-check me-1"></i>
          Xem danh sách
        </button>
      </div>
      <div className="flex-grow-1 p-4 overflow-auto">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-xl-7">
            <div className="card shadow-sm border" style={{ borderRadius: "12px" }}>
              <div className="card-body p-4">
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

                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-2" style={{ color: "#333" }}>
                      <i className="bi bi-code-square text-primary me-2"></i>
                      Mã bài thi <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="examCode"
                      className="form-control"
                      placeholder="Nhập mã bài thi (ví dụ: EX001)"
                      value={formData.examCode}
                      onChange={handleInputChange}
                      required
                      style={{
                        borderRadius: "10px",
                        border: "2px solid #e0e0e0",
                        padding: "12px",
                        transition: "all 0.3s",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#0d6efd")}
                      onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-2" style={{ color: "#333" }}>
                      <i className="bi bi-card-heading text-primary me-2"></i>
                      Tiêu đề <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      className="form-control"
                      placeholder="Nhập tiêu đề bài thi"
                      value={formData.title}
                      onChange={handleInputChange}
                      required
                      style={{
                        borderRadius: "10px",
                        border: "2px solid #e0e0e0",
                        padding: "12px",
                        transition: "all 0.3s",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#0d6efd")}
                      onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold mb-2" style={{ color: "#333" }}>
                      <i className="bi bi-card-text text-primary me-2"></i>
                      Mô tả
                    </label>
                    <textarea
                      name="description"
                      className="form-control"
                      placeholder="Nhập mô tả (tùy chọn)"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      style={{
                        borderRadius: "10px",
                        border: "2px solid #e0e0e0",
                        padding: "12px",
                        transition: "all 0.3s",
                        resize: "none",
                      }}
                      onFocus={(e) => (e.target.style.borderColor = "#0d6efd")}
                      onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
                    />
                  </div>

                  <div className="d-flex gap-2 mt-4">
                    <button
                      type="button"
                      className="btn btn-outline-secondary flex-grow-1"
                      onClick={() => navigate("/point-list")}
                      disabled={loading}
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
                      disabled={loading}
                      style={{
                        borderRadius: "10px",
                        padding: "12px",
                        fontWeight: "600",
                      }}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Đang tạo...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-check-circle me-2"></i>
                          Tạo lượt chấm
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointTurn;

