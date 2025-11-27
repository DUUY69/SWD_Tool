import React, { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../Service/AxiosSetup";
import GradingSidebar from "./GradingSidebar";
import { 
  Layout, 
  Button, 
  Modal, 
  List, 
  Badge, 
  Typography, 
  Space, 
  Spin,
  Empty,
  InputNumber,
  Tooltip,
  Tag,
  Alert
} from 'antd';
import {
  ArrowLeftOutlined,
  SafetyOutlined,
  HistoryOutlined,
  LeftOutlined,
  RightOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  StarOutlined,
  CheckCircleOutlined,
  EyeOutlined
} from '@ant-design/icons';
import "./MainPoint.css";

const { Header, Sider, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

const MainPoint = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const examId = searchParams.get("examId");
  const examStudentId = searchParams.get("examStudentId");
  const statusFilter = searchParams.get("status");
  const openPlagiarism = searchParams.get("openPlagiarism");

  const [student, setStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [filePath, setFilePath] = useState(null);
  const [score, setScore] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [loadingExam, setLoadingExam] = useState(false);
  const [showDescriptionModal, setShowDescriptionModal] = useState(false);
  const [isBaremCollapsed, setIsBaremCollapsed] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [comment, setComment] = useState("");

  // States for grade management
  const [gradeId, setGradeId] = useState(null);
  const [gradeDetailsMap, setGradeDetailsMap] = useState({});
  const [gradeHistory, setGradeHistory] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [driveImageError, setDriveImageError] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [examDescriptionInline, setExamDescriptionInline] = useState("");
  const debounceTimerRef = useRef({});

  // States for plagiarism check
  const [docFileId, setDocFileId] = useState(null);
  const [showPlagiarismModal, setShowPlagiarismModal] = useState(false);
  const [plagiarismThreshold, setPlagiarismThreshold] = useState(30);
  const [checkingPlagiarism, setCheckingPlagiarism] = useState(false);
  const [similarityResult, setSimilarityResult] = useState(null);

  const fetchStudentData = useCallback(async () => {
    if (!examId || !examStudentId) {
      setError("Không tìm thấy examId hoặc examStudentId.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");
      const resAll = await axiosInstance.get(`/exams/${examId}/students`, {
        params: { Page: 1, Size: 1000 },
      });

      const res = await axiosInstance.get(`/exams/${examId}/students`, {
        params: { Page: 1, Size: 1000 },
      });

      if (res.data && res.data.data && res.data.data.result) {
        const studentsList = res.data.data.result.filter(
          (s) => s.docFiles && s.docFiles.length > 0
        );
        setStudents(studentsList);
        setTotalItems(studentsList.length);

        let foundStudent = null;
        if (resAll.data && resAll.data.data && resAll.data.data.result) {
          foundStudent = resAll.data.data.result.find(
            (s) => s.examStudentId === parseInt(examStudentId)
          );
        }

        if (foundStudent) {
          if (!foundStudent.docFiles || foundStudent.docFiles.length === 0) {
            setError("Học sinh này chưa có file nào.");
            setLoading(false);
            return;
          }

          const foundIndex = studentsList.findIndex(
            (s) => s.examStudentId === parseInt(examStudentId)
          );

          if (foundIndex !== -1) {
            setStudent(foundStudent);
            setCurrentIndex(foundIndex);
            const lastFile = foundStudent.docFiles[foundStudent.docFiles.length - 1];
            setFilePath(lastFile.filePath);
            setDocFileId(lastFile.id || lastFile.docFileId);
          } else {
            setError("Không tìm thấy học sinh trong danh sách có thể chấm.");
          }
        } else {
          setError("Không tìm thấy học sinh.");
        }
      } else {
        setError("Không thể tải thông tin học sinh.");
      }
      setLoading(false);
    } catch (err) {
      console.error("Lỗi fetch học sinh:", err);
      setError("Không thể tải thông tin học sinh.");
      setLoading(false);
    }
  }, [examId, examStudentId]);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  // Không load ExamPaperInline ngay khi vào trang, chỉ load khi mở modal để tăng tốc độ
  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) return;

      try {
        setLoadingExam(true);
        const res = await axiosInstance.get(`/exams/${examId}`);
        if (res.data && res.data.data) {
          const payload = res.data.data;
          // ExamPaper có thể là null (nếu ảnh được lưu trực tiếp trong DB)
          setExamDescription(payload.examPaper || "");
          // ExamPaperInline chỉ load khi mở modal để tránh load dữ liệu lớn không cần thiết
        } else {
          setExamDescription("");
        }
        setLoadingExam(false);
      } catch (err) {
        console.error("Lỗi fetch exam description:", err);
        setLoadingExam(false);
        setExamDescription("");
      }
    };

    fetchExam();
  }, [examId]);

  // Load ExamPaperInline chỉ khi mở modal
  const fetchExamPaperInline = async () => {
    if (!examId || examDescriptionInline) return; // Đã có rồi thì không load lại

    try {
      const res = await axiosInstance.get(`/exams/${examId}/paper-inline`);
      if (res.data && res.data.data) {
        setExamDescriptionInline(res.data.data);
      }
    } catch (err) {
      console.error("Lỗi fetch exam paper inline:", err);
    }
  };

  useEffect(() => {
    setDriveImageError(false);
  }, [examDescription, examDescriptionInline]);

  useEffect(() => {
    setDriveImageError(false);
  }, [examDescription]);

  // Load ExamPaperInline khi mở modal
  useEffect(() => {
    if (showDescriptionModal && !examDescriptionInline && examId) {
      fetchExamPaperInline();
    }
  }, [showDescriptionModal, examId]);

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!examId) return;

      try {
        setLoadingQuestions(true);
        const res = await axiosInstance.get(`/exams/${examId}/questions`);
        if (res.data && res.data.data && res.data.data.questions) {
          const sortedQuestions = res.data.data.questions
            .sort((a, b) => a.questionNumber - b.questionNumber)
            .map(q => ({
              ...q,
              rubrics: q.rubrics.sort((a, b) => a.orderIndex - b.orderIndex)
            }));
          setQuestions(sortedQuestions);
        } else {
          setQuestions([]);
        }
        setLoadingQuestions(false);
      } catch (err) {
        console.error("Lỗi fetch exam questions:", err);
        setLoadingQuestions(false);
        setQuestions([]);
      }
    };

    fetchQuestions();
  }, [examId]);

  useEffect(() => {
    if (openPlagiarism === "1" && docFileId) {
      setShowPlagiarismModal(true);
      const savedResult = sessionStorage.getItem(`plagiarismResult_${docFileId}`);
      if (savedResult) {
        try {
          const parsedResult = JSON.parse(savedResult);
          setSimilarityResult(parsedResult);
        } catch (err) {
          console.error("Lỗi parse saved result:", err);
        }
      }
      const statusParam = statusFilter ? `&status=${statusFilter}` : "";
      navigate(`/main-point?examId=${examId}&examStudentId=${examStudentId}${statusParam}`, { replace: true });
    }
  }, [openPlagiarism, docFileId, examId, examStudentId, statusFilter, navigate]);

  const fetchGradeHistory = async (examStudentIdParam) => {
    try {
      const res = await axiosInstance.get(`/Grade/GetByExamStudentId/${examStudentIdParam}`, {
        params: { PageIndex: 1, PageSize: 12 },
      });

      if (res.data && res.data.data && res.data.data.result && res.data.data.result.length > 0) {
        const history = res.data.data.result;
        setGradeHistory(history);

        const latestGrade = history[history.length - 1];
        const gradeIdFromResponse = latestGrade.id;
        setGradeId(gradeIdFromResponse);

        return { gradeId: gradeIdFromResponse, history };
      }
      setGradeHistory([]);
      return null;
    } catch (err) {
      console.error("Lỗi fetch grade history:", err);
      setGradeHistory([]);
      return null;
    }
  };

  const fetchGradeDetails = async (gradeIdParam) => {
    try {
      const res = await axiosInstance.get(`/Grade/${gradeIdParam}`);

      if (res.data && res.data.data) {
        if (res.data.data.comment) {
          setComment(res.data.data.comment);
        }

        if (res.data.data.details) {
          const detailsMap = {};
          const scoresMap = {};

          res.data.data.details.forEach((detail) => {
            detailsMap[detail.rubricId] = detail.id;
            if (detail.score !== null && detail.score !== undefined) {
              scoresMap[detail.rubricId] = detail.score.toString();
            }
          });

          setGradeDetailsMap(detailsMap);
          setScore(scoresMap);

          return detailsMap;
        }
      }
      return {};
    } catch (err) {
      console.error("Lỗi fetch grade details:", err);
      return {};
    }
  };

  const updateGradeDetail = async (rubricId, scoreValue, gradeDetailId, gradeIdParam) => {
    try {
      const payload = {
        gradeId: gradeIdParam || gradeId,
        rubricId: rubricId,
        score: parseFloat(scoreValue) || 0,
        comment: "",
        autoDetectResult: "",
      };

      await axiosInstance.put(`/GradeDetail/${gradeDetailId}`, payload);
      console.log(`Đã cập nhật điểm cho rubricId ${rubricId}: ${scoreValue}`);
    } catch (err) {
      console.error(`Lỗi cập nhật điểm cho rubricId ${rubricId}:`, err);
    }
  };

  const fetchGradeId = async (examStudentIdParam) => {
    try {
      const res = await axiosInstance.get(`/Grade/GetByExamStudentId/${examStudentIdParam}`, {
        params: { PageIndex: 1, PageSize: 12 },
      });

      if (res.data && res.data.data && res.data.data.result && res.data.data.result.length > 0) {
        const latestGrade = res.data.data.result[res.data.data.result.length - 1];
        return latestGrade.id;
      }
      return null;
    } catch (err) {
      console.error("Lỗi fetch gradeId:", err);
      return null;
    }
  };

  const handleSimilarityCheck = async (docFileIdParam, threshold) => {
    try {
      const res = await axiosInstance.post(`/docfile/${docFileIdParam}/similarity-check`, {
        threshold: threshold
      });
      return res.data?.data || res.data;
    } catch (err) {
      console.error("Lỗi similarity check:", err);
      throw err;
    }
  };

  const handleCheckPlagiarism = async () => {
    if (!docFileId) {
      Modal.error({ title: "Lỗi", content: "Không tìm thấy docFileId" });
      return;
    }

    try {
      setCheckingPlagiarism(true);
      setSimilarityResult(null);

      const thresholdValue = (plagiarismThreshold === "" || isNaN(plagiarismThreshold)) ? 30 : plagiarismThreshold;
      const thresholdDecimal = thresholdValue / 100;
      const result = await handleSimilarityCheck(docFileId, thresholdDecimal);
      setSimilarityResult(result);
      sessionStorage.setItem(`plagiarismResult_${docFileId}`, JSON.stringify(result));
    } catch (err) {
      console.error("Lỗi check đạo văn:", err);
      Modal.error({ title: "Lỗi", content: "Có lỗi xảy ra khi kiểm tra đạo văn. Vui lòng thử lại." });
    } finally {
      setCheckingPlagiarism(false);
    }
  };

  const handleSelectPair = (pair) => {
    if (similarityResult) {
      sessionStorage.setItem(`plagiarismResult_${docFileId}`, JSON.stringify(similarityResult));
    }
    const pairData = encodeURIComponent(JSON.stringify(pair));
    const statusParam = statusFilter ? `&status=${statusFilter}` : "";
    navigate(`/plagiarism-detail?examId=${examId}&examStudentId=${examStudentId}&similarityResultId=${pair.resultId}&pairData=${pairData}${statusParam}`);
  };

  const loadGradeFromHistory = async (gradeIdParam) => {
    setGradeId(gradeIdParam);
    await fetchGradeDetails(gradeIdParam);
  };

  useEffect(() => {
    const initializeGradeData = async () => {
      if (!examStudentId) return;

      setScore({});
      setComment("");

      const result = await fetchGradeHistory(examStudentId);
      if (result && result.gradeId) {
        await fetchGradeDetails(result.gradeId);
      }
    };

    initializeGradeData();

    return () => {
      Object.values(debounceTimerRef.current).forEach((timer) => {
        if (timer) clearTimeout(timer);
      });
      debounceTimerRef.current = {};
    };
  }, [examStudentId, fetchStudentData]);

  const handleInput = (key, value) => {
    setScore((prev) => ({ ...prev, [key]: value }));
    setSaveMessage("");

    const rubricId = parseInt(key);
    const gradeDetailId = gradeDetailsMap[rubricId];

    if (!gradeDetailId || !gradeId) {
      const initializeAndUpdate = async () => {
        if (!gradeId) {
          const fetchedGradeId = await fetchGradeId(examStudentId);
          if (fetchedGradeId) {
            const detailsMap = await fetchGradeDetails(fetchedGradeId);
            const detailId = detailsMap[rubricId];
            if (detailId) {
              setTimeout(() => {
                updateGradeDetail(rubricId, value, detailId, fetchedGradeId);
              }, 500);
            }
          }
        } else if (!gradeDetailId) {
          const detailsMap = await fetchGradeDetails(gradeId);
          const detailId = detailsMap[rubricId];
          if (detailId) {
            setTimeout(() => {
              updateGradeDetail(rubricId, value, detailId, gradeId);
            }, 500);
          }
        }
      };
      initializeAndUpdate();
      return;
    }

    if (debounceTimerRef.current[rubricId]) {
      clearTimeout(debounceTimerRef.current[rubricId]);
    }

    debounceTimerRef.current[rubricId] = setTimeout(() => {
      updateGradeDetail(rubricId, value, gradeDetailId, gradeId);
      delete debounceTimerRef.current[rubricId];
    }, 500);
  };

  const calculateTotalScore = () => {
    let total = 0;
    questions.forEach((question) => {
      if (question.rubrics) {
        question.rubrics.forEach((rubric) => {
          const rubricScore = parseFloat(score[rubric.id]) || 0;
          total += rubricScore;
        });
      }
    });
    return total;
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage("");
    try {
      const totalScore = calculateTotalScore();
      const payload = {
        examStudentId: parseInt(examStudentId),
        totalScore: totalScore,
        comment: comment || "",
        gradedAt: new Date().toISOString(),
        gradedBy: "",
        attempt: gradeHistory.length > 0 ? gradeHistory.length + 1 : 1,
        status: 1
      };

      if (student && student.status === "PARSED" && gradeId) {
        await axiosInstance.put(`/grade/${gradeId}`, payload);
      } else {
        payload.status = 1;
        await axiosInstance.post("/Grade", payload);
      }

      await fetchGradeHistory(examStudentId);
      await fetchStudentData();

      setSaveMessage("success");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (err) {
      console.error("Lỗi lưu điểm:", err);
      setSaveMessage("error");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const extractGoogleFileId = (input) => {
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
      const fileId = extractGoogleFileId(rawUrl);
      if (fileId) {
        let previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
        if (resourceKey) {
          previewUrl += `?resourcekey=${resourceKey}`;
        }
        return previewUrl;
      }

      return rawUrl;
    } catch (error) {
      const fallbackId = extractGoogleFileId(rawUrl);
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

  const getDrivePreviewInfo = (url) => {
    if (!url) return { isDrive: false, imageUrl: "", iframeUrl: "" };
    if (!url.includes("docs.google.com") && !url.includes("drive.google.com")) {
      return { isDrive: false, imageUrl: url, iframeUrl: "" };
    }

    const fileId = extractGoogleFileId(url);
    const iframeUrl = buildDrivePreviewUrl(url);

    if (!fileId) {
      return { isDrive: true, imageUrl: url, iframeUrl };
    }

    return {
      isDrive: true,
      imageUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`,
      iframeUrl
    };
  };

  const renderExamDescriptionBody = () => {
    if (examDescriptionInline) {
      return (
        <img
          src={examDescriptionInline}
          alt="Đề bài"
          style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
          onError={() => setExamDescriptionInline("")}
        />
      );
    }

    if (examDescription) {
      const preview = getDrivePreviewInfo(examDescription);
      if (preview.isDrive) {
        return (
          <>
            <iframe
              src={preview.iframeUrl}
              title="Đề bài"
              style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }}
              allowFullScreen
            ></iframe>
            <div style={{ marginTop: 16 }}>
              {!driveImageError ? (
                <img
                  src={preview.imageUrl}
                  alt="Đề bài"
                  style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
                  onError={() => setDriveImageError(true)}
                />
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary">
                    Google Drive không cho phép xem trực tiếp.{" "}
                    <a href={preview.imageUrl} target="_blank" rel="noreferrer">
                      Bấm để mở/tải ảnh
                    </a>
                  </Text>
                </div>
              )}
            </div>
          </>
        );
      }

      if (preview.imageUrl) {
        return (
          <img
            src={preview.imageUrl}
            alt="Đề bài"
            style={{ width: '100%', height: 'auto', borderRadius: 8, display: 'block' }}
          />
        );
      }
    }

    return <Empty description="Không có đề bài" />;
  };

  const handleNext = () => {
    if (currentIndex < students.length - 1) {
      const nextStudent = students[currentIndex + 1];
      if (nextStudent && (nextStudent.status === "PARSED" || nextStudent.status === "GRADED") && nextStudent.docFiles && nextStudent.docFiles.length > 0) {
        const statusParam = statusFilter ? `&status=${statusFilter}` : "";
        navigate(`/main-point?examId=${examId}&examStudentId=${nextStudent.examStudentId}${statusParam}`);
        setScore({});
        setComment("");
        setSaveMessage("");
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const prevStudent = students[currentIndex - 1];
      if (prevStudent && (prevStudent.status === "PARSED" || prevStudent.status === "GRADED") && prevStudent.docFiles && prevStudent.docFiles.length > 0) {
        const statusParam = statusFilter ? `&status=${statusFilter}` : "";
        navigate(`/main-point?examId=${examId}&examStudentId=${prevStudent.examStudentId}${statusParam}`);
        setScore({});
        setComment("");
        setSaveMessage("");
      }
    }
  };

  const canGoNext = currentIndex >= 0 && currentIndex < students.length - 1;
  const canGoPrev = currentIndex > 0;

  const getStatusInfo = (status) => {
    switch (status) {
      case "PARSED":
        return { color: "blue", label: "Chờ chấm điểm" };
      case "GRADED":
        return { color: "green", label: "Đã chấm" };
      case "NOT_FOUND":
        return { color: "red", label: "Chưa có bài" };
      default:
        return { color: "default", label: status || "Không rõ" };
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Header */}
      <Header style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
      }}>
        <Space size="middle" align="center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => {
              const statusParam = statusFilter ? `&status=${statusFilter}` : "";
              navigate(`/list-student?examId=${examId}${statusParam}`);
            }}
          >
            Danh sách
          </Button>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap'
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              {student ? `${student.studentName} (${student.studentCode})` : "Đang tải..."}
            </Title>
            {student && (
              <Tag color={getStatusInfo(student.status).color} style={{ margin: 0 }}>
                {getStatusInfo(student.status).label}
              </Tag>
            )}
            {totalItems > 0 && currentIndex >= 0 && (
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Bài {currentIndex + 1} / {totalItems}
              </Text>
            )}
          </div>
        </Space>

        <Space size="middle">
          <Button
            icon={<SafetyOutlined />}
            onClick={() => {
              setShowPlagiarismModal(true);
              setSimilarityResult(null);
            }}
            disabled={!docFileId}
          >
            Check đạo văn
          </Button>
          <Button
            icon={<HistoryOutlined />}
            onClick={async () => {
              setShowHistoryModal(true);
              setLoadingHistory(true);
              await fetchGradeHistory(examStudentId);
              setLoadingHistory(false);
            }}
          >
            Lịch sử chấm
          </Button>
          <Space>
            <Tooltip title="Bài trước">
              <Button
                shape="circle"
                icon={<LeftOutlined />}
                onClick={handlePrev}
                disabled={!canGoPrev}
              />
            </Tooltip>
            <Tooltip title="Bài tiếp theo">
              <Button
                type="primary"
                shape="circle"
                icon={<RightOutlined />}
                onClick={handleNext}
                disabled={!canGoNext}
              />
            </Tooltip>
          </Space>
        </Space>
      </Header>

      <Layout>
        {/* Main Content - Document Viewer */}
        <Content style={{ background: '#fff' }}>
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 400
            }}>
              <Spin size="large" />
              <Text type="secondary" style={{ marginTop: 16 }}>Đang tải bài làm...</Text>
            </div>
          ) : error ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 400
            }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<Text type="danger">{error}</Text>}
              >
                <Button type="primary" onClick={() => navigate(`/list-student?examId=${examId}`)}>
                  Quay lại danh sách
                </Button>
              </Empty>
            </div>
          ) : filePath ? (
            <div style={{ height: 'calc(100vh - 64px)' }}>
              <iframe
                src={getOfficeViewerUrl(filePath)}
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 'none' }}
                title="Office Document Viewer"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <Empty description="Không có file để hiển thị" />
          )}
        </Content>

        {/* Sidebar - Barem (Right Side) */}
        <Sider
          width={isBaremCollapsed ? 60 : 480}
          theme="light"
          collapsible
          collapsed={isBaremCollapsed}
          onCollapse={setIsBaremCollapsed}
          trigger={null}
          style={{
            background: '#fff',
            borderLeft: '1px solid #f0f0f0',
            overflow: 'auto',
            height: 'calc(100vh - 64px)',
            position: 'sticky',
            top: 64
          }}
        >
          <GradingSidebar
            isBaremCollapsed={isBaremCollapsed}
            setIsBaremCollapsed={setIsBaremCollapsed}
            setShowDescriptionModal={setShowDescriptionModal}
            loadingQuestions={loadingQuestions}
            questions={questions}
            score={score}
            handleInput={handleInput}
            comment={comment}
            setComment={setComment}
            setSaveMessage={setSaveMessage}
            calculateTotalScore={calculateTotalScore}
            saveMessage={saveMessage}
            saving={saving}
            handleSave={handleSave}
          />
        </Sider>
      </Layout>

      {/* Description Modal */}
      <Modal
        title={<><FileTextOutlined /> Đề bài</>}
        open={showDescriptionModal}
        centered       // <-- giúp modal nằm giữa màn hình
        width="75vw"   // <-- modal rộng 75% màn hình
        onCancel={() => setShowDescriptionModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowDescriptionModal(false)}>
            Đóng
          </Button>
        ]}
      >
        {loadingExam ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Đang tải đề bài...</Text>
            </div>
          </div>
        ) : (examDescriptionInline || examDescription) ? (
          <div
            style={{
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
              padding: 16,
              background: '#fafafa',
              borderRadius: 8,
            }}
          >
            {renderExamDescriptionBody()}
          </div>
        ) : (
          <Empty description="Không có đề bài" />
        )}
      </Modal>

      {/* History Modal */}
      <Modal
        title={<><ClockCircleOutlined /> Lịch sử chấm điểm</>}
        open={showHistoryModal}
        onCancel={() => setShowHistoryModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowHistoryModal(false)}>
            Đóng
          </Button>
        ]}
        width={800}
      >
        {loadingHistory ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">Đang tải lịch sử...</Text>
            </div>
          </div>
        ) : gradeHistory.length === 0 ? (
          <Empty description="Chưa có lịch sử chấm điểm" />
        ) : (
          <List
            dataSource={gradeHistory}
            renderItem={(grade, index) => (
              <List.Item
                key={grade.id}
                style={{
                  cursor: 'pointer',
                  padding: 16,
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  marginBottom: 8,
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#fafafa';
                  e.currentTarget.style.borderColor = '#1890ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#fff';
                  e.currentTarget.style.borderColor = '#f0f0f0';
                }}
                onClick={async () => {
                  await loadGradeFromHistory(grade.id);
                  setShowHistoryModal(false);
                }}
                actions={[
                  <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={async (e) => {
                      e.stopPropagation();
                      await loadGradeFromHistory(grade.id);
                      setShowHistoryModal(false);
                    }}
                  >
                    Tải lại
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Badge count={`Lần ${index + 1}`} style={{ backgroundColor: '#1890ff' }} />
                      <Badge
                        status={grade.status === "GRADED" ? "success" : "default"}
                        text={grade.status === "GRADED" ? "Đã chấm" : grade.status}
                      />
                      {index === gradeHistory.length - 1 && (
                        <Badge status="processing" text="Lần gần nhất" />
                      )}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <Text type="secondary">
                        <ClockCircleOutlined /> {new Date(grade.gradedAt).toLocaleString("vi-VN")}
                      </Text>
                      <Text>
                        <StarOutlined style={{ color: '#faad14' }} /> Tổng điểm: <strong>{grade.totalScore}</strong>
                      </Text>
                      {grade.comment && (
                        <Text type="secondary">Nhận xét: {grade.comment}</Text>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Modal>

      {/* Plagiarism Check Modal */}
      <Modal
        title={<><SafetyOutlined /> Kiểm tra đạo văn</>}
        open={showPlagiarismModal}
        onCancel={() => {
          if (!checkingPlagiarism) {
            setShowPlagiarismModal(false);
            setSimilarityResult(null);
          }
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setShowPlagiarismModal(false);
              setSimilarityResult(null);
            }}
            disabled={checkingPlagiarism}
          >
            Đóng
          </Button>
        ]}
        width={1000}
      >
        {!similarityResult && (
          <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
            <Text>Ngưỡng phần trăm trùng bài (1 - 100):</Text>
            <Space>
              <InputNumber
                min={1}
                max={100}
                value={plagiarismThreshold}
                onChange={(value) => {
                  if (value === null || value === undefined) {
                    setPlagiarismThreshold("");
                  } else if (value >= 1 && value <= 100) {
                    setPlagiarismThreshold(value);
                  }
                }}
                onBlur={() => {
                  if (plagiarismThreshold === "" || isNaN(plagiarismThreshold)) {
                    setPlagiarismThreshold(30);
                  }
                }}
                placeholder="30"
                disabled={checkingPlagiarism}
                style={{ width: 200 }}
              />
              <Button
                type="primary"
                onClick={handleCheckPlagiarism}
                loading={checkingPlagiarism}
                disabled={!docFileId}
              >
                Kiểm tra
              </Button>
            </Space>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Nhập ngưỡng từ 1 đến 100. Ví dụ: 30 = 30% trùng
            </Text>
          </Space>
        )}

        {checkingPlagiarism && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">Đang kiểm tra đạo văn...</Text>
            </div>
          </div>
        )}

        {similarityResult && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert
              message="Kết quả kiểm tra"
              description={
                <Space direction="vertical">
                  <Text>Tổng số cặp đã kiểm tra: <strong>{similarityResult.totalPairsChecked || 0}</strong></Text>
                  <Text>Số cặp nghi ngờ: <strong style={{ color: '#ff4d4f' }}>{similarityResult.suspiciousPairsCount || 0}</strong></Text>
                </Space>
              }
              type="info"
              showIcon
              action={
                <Button size="small" onClick={() => setSimilarityResult(null)}>
                  Kiểm tra lại
                </Button>
              }
            />

            {similarityResult.suspiciousPairs && similarityResult.suspiciousPairs.length > 0 ? (
              <List
                dataSource={similarityResult.suspiciousPairs}
                renderItem={(pair, index) => (
                  <List.Item
                    key={index}
                    style={{
                      cursor: 'pointer',
                      padding: 16,
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      marginBottom: 8,
                      transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fafafa';
                      e.currentTarget.style.borderColor = '#1890ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fff';
                      e.currentTarget.style.borderColor = '#f0f0f0';
                    }}
                    onClick={() => handleSelectPair(pair)}
                    actions={[
                      <Button
                        type="primary"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPair(pair);
                        }}
                      >
                        Xem chi tiết
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <Space>
                          <Badge count={`Cặp #${index + 1}`} style={{ backgroundColor: '#ff4d4f' }} />
                          <Badge
                            count={`${(pair.similarityScore * 100).toFixed(2)}%`}
                            style={{ backgroundColor: '#faad14' }}
                          />
                        </Space>
                      }
                      description={
                        <div style={{ display: 'flex', gap: 24 }}>
                          <div style={{ flex: 1 }}>
                            <Text strong>Học sinh 1: </Text>
                            <Text>{pair.student1Code}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              File: {pair.docFile1Name}
                            </Text>
                          </div>
                          <div style={{ flex: 1 }}>
                            <Text strong>Học sinh 2: </Text>
                            <Text>{pair.student2Code}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              File: {pair.docFile2Name}
                            </Text>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={<CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />}
                description={
                  <Space direction="vertical">
                    <Text strong style={{ color: '#52c41a' }}>Không phát hiện đạo văn!</Text>
                    <Text type="secondary">Không có cặp bài nào vượt quá ngưỡng {plagiarismThreshold}%</Text>
                  </Space>
                }
              />
            )}
          </Space>
        )}
      </Modal>
    </Layout>
  );
};

export default MainPoint;
