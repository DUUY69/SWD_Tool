import React from 'react';
import { 
  Button, 
  Card, 
  InputNumber, 
  Input, 
  Space, 
  Alert, 
  Typography, 
  Divider,
  Spin,
  Empty,
  Statistic
} from 'antd';
import {
  SaveOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const GradingSidebar = ({
  isBaremCollapsed,
  setIsBaremCollapsed,
  setShowDescriptionModal,
  loadingQuestions,
  questions,
  score,
  handleInput,
  comment,
  setComment,
  setSaveMessage,
  calculateTotalScore,
  saveMessage,
  saving,
  handleSave
}) => {
  const totalMaxScore = questions.reduce((sum, q) => sum + q.maxScore, 0);
  const currentTotalScore = calculateTotalScore();

  return (
    <div style={{ padding: isBaremCollapsed ? '16px 8px' : '24px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 16
      }}>
        {!isBaremCollapsed && <Title level={5} style={{ margin: 0 }}>Barem điểm</Title>}
        <Button 
          type="text"
          icon={isBaremCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setIsBaremCollapsed(!isBaremCollapsed)}
        />
      </div>

      {!isBaremCollapsed && (
        <>
          <Button 
            block 
            icon={<FileTextOutlined />}
            onClick={() => setShowDescriptionModal(true)}
            style={{ marginBottom: 16 }}
          >
            Xem đề bài
          </Button>

          {loadingQuestions ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <Spin />
              <div style={{ marginTop: 12 }}>
                <Text type="secondary">Đang tải barem...</Text>
              </div>
            </div>
          ) : questions.length === 0 ? (
            <Empty description="Chưa có barem điểm" />
          ) : (
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {questions.map((question) => {
                const questionScore = question.rubrics.reduce((sum, rubric) => {
                  const rubricScore = parseFloat(score[rubric.id]) || 0;
                  return sum + rubricScore;
                }, 0);

                return (
                  <Card 
                    key={question.id}
                    size="small"
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Space>
                          <Text strong>Câu {question.questionNumber}:</Text>
                          <Text style={{ fontSize: '13px' }}>{question.questionText}</Text>
                        </Space>
                      </div>
                    }
                    extra={
                      <Text strong style={{ fontSize: '12px' }}>
                        Tối đa: {question.maxScore}đ
                      </Text>
                    }
                  >
                    {question.rubrics && question.rubrics.length > 0 && (
                      <Space direction="vertical" style={{ width: '100%' }} size="small">
                        {question.rubrics.map((rubric) => (
                          <div key={rubric.id} style={{ marginBottom: 8 }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'nowrap', justifyContent: 'space-between' }}>
                              <div style={{ flex: '0 1 auto', minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                  <Text strong style={{ fontSize: '12px' }}>
                                    {rubric.criterion}
                                  </Text>
                                  <Text strong style={{ fontSize: '11px', marginLeft: 8 }}>
                                    max: {rubric.maxScore}
                                  </Text>
                                </div>
                                <div style={{ color: '#6c757d', fontSize: 12 }}>{rubric.description}</div>
                              </div>

                              <div style={{ width: 165, flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                                <InputNumber
                                  style={{ width: '100%', boxSizing: 'border-box' }}
                                  min={0}
                                  max={rubric.maxScore}
                                  step={rubric.maxScore === 1 ? 0.25 : 0.5}
                                  precision={rubric.maxScore === 1 ? 2 : 1}
                                  placeholder={`0 - ${rubric.maxScore}`}
                                  value={score[rubric.id] || ""}
                                  onChange={(value) => {
                                    if (value === null || value === undefined) {
                                      handleInput(rubric.id, value);
                                      return;
                                    }
                                    if (value >= 0 && value <= rubric.maxScore) {
                                      handleInput(rubric.id, value);
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const value = parseFloat(e.target.value);
                                    if (!isNaN(value)) {
                                      if (value < 0) {
                                        handleInput(rubric.id, 0);
                                      } else if (value > rubric.maxScore) {
                                        handleInput(rubric.id, rubric.maxScore);
                                      }
                                    }
                                  }}
                                />

                                {/* Quick score buttons */}
                                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                                  {(() => {
                                    const renderButton = (b) => {
                                      const isSelected = Math.abs(parseFloat(score[rubric.id]) - parseFloat(b)) < 0.01;
                                      return (
                                        <Button
                                          key={b}
                                          size="small"
                                          onClick={() => handleInput(rubric.id, parseFloat(b))}
                                          style={{
                                            padding: '2px 6px',
                                            minWidth: 40,
                                            backgroundColor: isSelected ? '#52c41a' : undefined,
                                            borderColor: isSelected ? '#52c41a' : undefined,
                                            color: isSelected ? '#fff' : undefined
                                          }}
                                        >
                                          {Number.isInteger(b) ? `${b}` : `${b}`}
                                        </Button>
                                      );
                                    };

                                    // Chia thành các khung điểm: 0-1, 1-2, 2-3, ...
                                    const maxScore = rubric.maxScore;
                                    const numRanges = Math.ceil(maxScore);
                                    const rows = [];

                                    for (let range = 0; range < numRanges; range++) {
                                      const rangeStart = range;
                                      const rangeEnd = Math.min(range + 1, maxScore);
                                      const buttonsInRange = [];

                                      // Tạo các nút trong khung này: base + 0.25, base + 0.5, base + 0.75, base + 1
                                      const increments = [0.25, 0.5, 0.75, 1];
                                      increments.forEach(inc => {
                                        const value = rangeStart + inc;
                                        if (value <= maxScore) {
                                          buttonsInRange.push(Math.round(value * 100) / 100);
                                        }
                                      });

                                      if (buttonsInRange.length > 0) {
                                        rows.push(
                                          <div key={range} style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                            {buttonsInRange.map(renderButton)}
                                          </div>
                                        );
                                      }
                                    }

                                    return rows.length > 0 ? <>{rows}</> : null;
                                  })()}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        <Divider style={{ margin: '8px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong style={{ fontSize: '12px' }}>
                            Điểm câu này:
                          </Text>
                          <Text strong style={{ fontSize: '14px' }}>
                            {questionScore.toFixed(1)} / {question.maxScore}
                          </Text>
                        </div>
                      </Space>
                    )}
                  </Card>
                );
              })}

              {/* Comment Section */}
              <Card size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong style={{ fontSize: '12px' }}>Nhận xét:</Text>
                    <TextArea
                      rows={4}
                      placeholder="Nhập nhận xét về bài làm của học sinh..."
                      value={comment}
                      onChange={(e) => {
                        setComment(e.target.value);
                        setSaveMessage("");
                      }}
                      style={{ marginTop: 8 }}
                    />
                  </div>

                  {saveMessage === "success" && (
                    <Alert message="Lưu điểm thành công!" type="success" showIcon closable />
                  )}

                  {saveMessage === "error" && (
                    <Alert message="Không thể lưu điểm!" type="error" showIcon closable />
                  )}

                  <Button 
                    type="primary" 
                    block 
                    size="large"
                    icon={<SaveOutlined />}
                    onClick={handleSave}
                    loading={saving}
                  >
                    {saving ? "Đang lưu..." : "LƯU ĐIỂM"}
                  </Button>
                </Space>
              </Card>

              {/* Total Score Card - bottom */}
              <Card 
                size="small" 
                style={{ 
                  borderColor: '#1890ff',
                  borderWidth: 2
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 4 }}>
                    TỔNG ĐIỂM
                  </Text>
                  <Text strong style={{ fontSize: '28px', color: '#1890ff' }}>
                    {currentTotalScore.toFixed(1)}
                  </Text>
                  <Text style={{ fontSize: '16px', color: '#8c8c8c' }}>
                    {` / ${totalMaxScore}`}
                  </Text>
                </div>
              </Card>
            </Space>
          )}
        </>
      )}
    </div>
  );
};

export default GradingSidebar;

