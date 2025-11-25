import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../Service/AxiosSetup";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";


const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      const response = await axiosInstance.post("/auth/register", {
        name,
        email,
        password,
      });
      
      if (response.status === 200 || response.status === 201) {
        setSuccess("Đăng ký thành công! Đang chuyển đến trang đăng nhập...");
        setTimeout(() => {
          navigate("/");
        }, 2000);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Đăng ký thất bại.");
      } else {
        setError("Không thể kết nối đến máy chủ.");
      }
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center vh-100"
      style={{
        background: "linear-gradient(135deg, #6e8efb, #a777e3)",
      }}
    >
      <div className="card shadow-lg p-4" style={{ maxWidth: "400px", width: "100%", borderRadius: "1rem" }}>
        <div className="card-body">
          <h2 className="text-center mb-4" style={{ fontWeight: "700", color: "#333" }}>Đăng ký</h2>
          
          {error && <div className="alert alert-danger">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleRegister}>
            <div className="mb-3 position-relative">
              <i className="bi bi-person position-absolute" style={{ left: "10px", top: "50%", transform: "translateY(-50%)", color: "#888" }}></i>
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Họ và tên"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="mb-3 position-relative">
              <i className="bi bi-envelope position-absolute" style={{ left: "10px", top: "50%", transform: "translateY(-50%)", color: "#888" }}></i>
              <input
                type="email"
                className="form-control ps-5"
                placeholder="Email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="mb-3 position-relative">
              <i className="bi bi-lock position-absolute" style={{ left: "10px", top: "50%", transform: "translateY(-50%)", color: "#888" }}></i>
              <input
                type="password"
                className="form-control ps-5"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="mb-3 position-relative">
              <i className="bi bi-lock-fill position-absolute" style={{ left: "10px", top: "50%", transform: "translateY(-50%)", color: "#888" }}></i>
              <input
                type="password"
                className="form-control ps-5"
                placeholder="Xác nhận mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 fw-bold" style={{ padding: "10px", fontSize: "16px" }}>
              Đăng ký
            </button>
          </form>

          <div className="text-center mt-3">
            <small style={{ color: "#555" }}>
              Đã có tài khoản? <a href="/">Đăng nhập ngay</a>
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;