import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../Service/AxiosSetup";
import "./Login.css";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post("/auth/login", {
        username,
        password,
      });
      if (response.status === 200) {
        // Lưu token vào localStorage
        const token = response.data?.data?.token || response.data?.token;
        if (token) {
          localStorage.setItem("token", token);
          localStorage.setItem("role", response.data.data.role);
          localStorage.setItem("username", response.data.data.username);
        }
        navigate("/point-list");
      }
    } catch (err) {
      if (err.response && err.response.data) {
        setError(err.response.data.message || "Đăng nhập thất bại.");
      } else {
        setError("Không thể kết nối đến máy chủ.");
      }
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 position-relative overflow-hidden login-container">
      {/* Decorative circles */}
      <div className="login-circle-1"></div>
      <div className="login-circle-2"></div>

      <div className="card shadow-lg border-0 login-card">
        {/* Logo/Icon Section */}
        <div className="text-center mb-4">
          <div className="d-inline-flex align-items-center justify-content-center mb-3 login-icon-box">
            <i className="bi bi-shield-lock-fill text-white login-icon"></i>
          </div>
          <h2 className="fw-bold mb-2 login-title">
            Chào mừng trở lại
          </h2>
          <p className="text-muted mb-0 login-subtitle">
            Đăng nhập vào tài khoản của bạn
          </p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-4 login-error-alert">
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            <small>{error}</small>
          </div>
        )}

        <form onSubmit={handleLogin}>
          {/* Username input */}
          <div className="mb-4">
            <label className="form-label fw-semibold mb-2 login-label">
              Tên đăng nhập
            </label>
            <div className="position-relative">
              <i className="bi bi-person-fill position-absolute login-input-icon"></i>
              <input
                type="text"
                className="form-control ps-5 py-3 login-input"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="mb-4">
            <label className="form-label fw-semibold mb-2 login-label">
              Mật khẩu
            </label>
            <div className="position-relative">
              <i className="bi bi-lock-fill position-absolute login-input-icon"></i>
              <input
                type="password"
                className="form-control ps-5 py-3 login-input"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn w-100 fw-bold py-3 mb-4 login-button"
          >
            <i className="bi bi-box-arrow-in-right me-2"></i>
            Đăng nhập
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
