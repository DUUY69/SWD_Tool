import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../Service/AxiosSetup";
import { Layout, Space, Card, Spin, Empty, Alert, Pagination, Typography, message } from "antd";
import PointListToolbar from "./components/PointListToolbar";
import PointListSearch from "./components/PointListSearch";
import ExerciseGrid from "./components/ExerciseGrid";
import ExerciseList from "./components/ExerciseList";
import ExerciseTable from "./components/ExerciseTable";

const { Content } = Layout;
const { Text } = Typography;

const PointList = () => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [viewMode, setViewMode] = useState("table");
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  const [pagination, setPagination] = useState({
    totalItems: 0,
    totalPages: 1,
    currentItems: 0,
  });
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    message.success("Đã đăng xuất");
    navigate("/");
  };

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        setError("");
        const params = {
          Page: page,
          Size: size,
        };

        if (searchTerm.trim()) {
          params.Search = searchTerm.trim();
        }

        const res = await axiosInstance.get("exams", {
          params,
        });

        if (res.data && res.data.data && res.data.data.result) {
          setExercises(res.data.data.result);
          setPagination({
            totalItems: res.data.data.totalItems || 0,
            totalPages: res.data.data.totalPages || 1,
            currentItems: res.data.data.currentItems || 0,
          });
        } else {
          setExercises([]);
        }
        setLoading(false);
      } catch (err) {
        console.error("Lỗi fetch danh sách bài:", err);
        setError("Không thể tải danh sách bài.");
        setLoading(false);
      }
    };

    fetchExercises();
  }, [page, size, searchTerm]);

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

  const handleSelectExercise = (exerciseId) => {
    navigate(`/list-student?examId=${exerciseId}&status=PARSED`);
  };

  const handleDeleteExam = async (examId) => {
    try {
      setDeletingId(examId);
      await axiosInstance.delete(`/exams/${examId}`);

      // Refresh danh sách sau khi xóa thành công
      const params = {
        Page: page,
        Size: size,
      };

      if (searchTerm.trim()) {
        params.Search = searchTerm.trim();
      }

      const res = await axiosInstance.get("me/exams", {
        params,
      });

      if (res.data && res.data.data && res.data.data.result) {
        setExercises(res.data.data.result);
        setPagination({
          totalItems: res.data.data.totalItems || 0,
          totalPages: res.data.data.totalPages || 1,
          currentItems: res.data.data.currentItems || 0,
        });
      } else {
        setExercises([]);
      }

      setDeletingId(null);
      message.success("Đã xóa bài thi.");
    } catch (err) {
      console.error("Lỗi xóa bài thi:", err);
      message.error(err.response?.data?.message || "Không thể xóa bài thi. Vui lòng thử lại.");
      setDeletingId(null);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh", background: "#f5f7fa" }}>
      <Content style={{ padding: 24 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <PointListToolbar
            totalItems={pagination.totalItems}
            viewMode={viewMode}
            onViewChange={setViewMode}
            onCreateTurn={() => navigate("/point-turn")}
            onLogout={handleLogout}
            role={role}
            username={username}
          />

          <Card bodyStyle={{ padding: 24 }}>
            <PointListSearch
              searchInput={searchInput}
              onSearchChange={setSearchInput}
              onSubmit={handleSearch}
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
                  Đang tải danh sách bài...
                </Text>
              </div>
            ) : error ? (
              <Alert
                type="error"
                message="Không thể tải danh sách bài"
                description={error}
                showIcon
              />
            ) : exercises.length === 0 ? (
              <Empty description="Chưa có bài nào cần chấm" />
            ) : viewMode === "table" ? (
              <ExerciseTable
                exercises={exercises}
                onSelect={handleSelectExercise}
                onDelete={handleDeleteExam}
                deletingId={deletingId}
              />
            ) : null}



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

            {!loading && !error && exercises.length > 0 && (
              <div style={{ textAlign: "center", marginTop: 12 }}>
                <Text type="secondary">
                  Hiển thị {((page - 1) * size) + 1} - {Math.min(page * size, pagination.totalItems)} trong tổng số {pagination.totalItems} bài
                </Text>
              </div>
            )}
          </Card>
        </Space>
      </Content>
    </Layout>
  );
};

export default PointList;

