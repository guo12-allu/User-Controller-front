import React, { useState } from 'react';
import { Input, Row, Col, Button, Spin, Card, Select } from 'antd';
import ExperienceContent from '../components/experienceContent';
import { UserOutlined, SearchOutlined, PlusOutlined, RestOutlined } from '@ant-design/icons';

const { Option } = Select;

interface ExperienceManagementProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  handleSearch: (value: string) => void;
  experiencesToDisplay: any[];
  loading: boolean;
  handleDeleteExperience: (id: number) => void;
  handleEditClick: (experience: any) => void;
  showModal: () => void;
  users: any[];
  regionTreeData: any;
}

const ExperienceManagement: React.FC<ExperienceManagementProps> = ({
  searchTerm,
  setSearchTerm,
  handleSearch,
  experiencesToDisplay,
  loading,
  handleDeleteExperience,
  handleEditClick,
  showModal,
  users,
  regionTreeData
}) => {
  const [filterByUser, setFilterByUser] = useState<string | null>(null);
  // 新增本地搜索词状态，与父组件搜索词解耦
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // 仅处理输入框文本变更，不触发搜索
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  };

  // 点击搜索按钮或回车时触发搜索
  const handleSearchClick = () => {
    setSearchTerm(localSearchTerm); // 同步到父组件
    handleSearch(localSearchTerm);   // 触发实际搜索
  };

  // 重置所有筛选条件
  const handleReset = () => {
    setLocalSearchTerm('');
    setSearchTerm('');
    setFilterByUser(null);
    handleSearch(''); // 通知父组件清空搜索
  };

  // 应用用户筛选条件
  const filteredByUser = experiencesToDisplay.filter(exp => 
    !filterByUser || exp.userId.toString() === filterByUser
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      {/* 搜索区域卡片 */}
      <Card className="mb-6">
        <Row gutter={23} align="middle">
          <Col span={4}>
            <Input
              placeholder="搜索名称、地址或用户名..."
              value={localSearchTerm}  // 使用本地搜索词状态
              onChange={handleInputChange}
              onPressEnter={handleSearchClick}  // 回车触发搜索
              size="large"
              prefix={<SearchOutlined className="text-gray-400" />}
              style={{ width: '100%' }}
            />
          </Col>

          <Col span={3}>
            <Select
              placeholder="按用户筛选"
              style={{ width: '100%' }}
              size="large"
              allowClear
              onChange={(value) => setFilterByUser(value || null)}
              suffixIcon={<UserOutlined />}
            >
              {users.map(user => (
                <Option key={user.id} value={user.id.toString()}>
                  {user.username}
                </Option>
              ))}
            </Select>
          </Col>

          <Col span={2}>
            <Button
              type="primary"
              onClick={handleSearchClick}  // 点击按钮触发搜索
              style={{ width: '100%' }}
              size="large"
              icon={<SearchOutlined />}
              className="bg-[#1C9A91] hover:bg-[#16857c]"
            >
              搜索
            </Button>
          </Col>

          <Col span={2}>
            <Button
              onClick={handleReset}  // 重置所有条件
              style={{ width: '100%' }}
              size="large"
              icon={<RestOutlined />}
            >
              重置
            </Button>
          </Col>

          <Col style={{ marginLeft: 'auto' }}>
            <Button
              type="primary"
              onClick={showModal}
              size="large"
              icon={<PlusOutlined />}
              className="bg-[#1C9A91] hover:bg-[#16857c]"
            >
              添加经历
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 加载/空状态/内容区域 */}
      {loading ? (
        <div>
          <Spin size="large" tip="加载经历数据中..." />
        </div>
      ) : filteredByUser.length === 0 && searchTerm.trim() !== '' ? (
        <div>
          <div>
            <UserOutlined />
          </div>
          <h3>未找到匹配的经历</h3>
          <p>请尝试调整搜索条件或添加新经历</p>
          <Button
            type="primary"
            onClick={showModal}
            icon={<PlusOutlined />}
            className="bg-[#1C9A91] hover:bg-[#16857c]"
          >
            添加经历
          </Button>
        </div>
      ) : (
        <ExperienceContent
          experiences={filteredByUser}
          loading={loading}
          onDelete={handleDeleteExperience}
          onEdit={handleEditClick}
          users={[]}
        />
      )}
    </div>
  );
};

export default ExperienceManagement;