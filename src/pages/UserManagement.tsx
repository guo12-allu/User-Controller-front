// UserManagement.tsx 完整修改代码
import React from 'react';
import { Input, Row, Col, Button, Card, Spin, Typography, Pagination } from 'antd';  // 引入 Pagination
import Content from '../components/usercontent';
import { SearchOutlined, PlusOutlined, RestOutlined, UserOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface UserManagementProps {
  inputValues: { username: string; uuid: string };
  handleInputChange: (field: string, value: string) => void;
  handleSearch: (e: React.FormEvent) => void;
  handleResetSearch: () => void;
  usersToDisplay: any[];
  loading: boolean;
  handleDeleteUser: (id: number) => void;
  handleEditClick: (user: any) => void;
  pagination: { current: number; pageSize: number; total: number };
  handlePaginationChange: (page: number, pageSize: number) => void;
  showModal: () => void;
  nameError: any;
  uuidError: any;
  units: any[];
  searchCondition: { username: string; uuid: string; isSearching: boolean };
  regionTreeData: any;
}

const UserManagement: React.FC<UserManagementProps> = ({
  inputValues,
  handleInputChange,
  handleSearch,
  handleResetSearch,
  usersToDisplay,
  loading,
  handleDeleteUser,
  handleEditClick,
  pagination,
  handlePaginationChange,
  showModal,
  nameError,
  uuidError,
  searchCondition,
  units,
  regionTreeData
}) => {
  // 分页配置（从 Content 组件迁移过来）
  const tablePagination = {
    current: pagination.current,
    pageSize: pagination.pageSize,
    total: pagination.total,
    showTotal: (total: number) => `共 ${total} 条记录`,
    onChange: handlePaginationChange,  // 页码变化回调
    onShowSizeChange: (current: number, size: number) => {
      handlePaginationChange(1, size);  // 每页条数变化回调
    },
    // showSizeChanger: true,  // 显示每页条数切换
    // showQuickJumper: true,  // 显示快速跳转
  };

  return (
    <div style={{ 
      margin: "2px", 
      position: "relative",  // 父容器相对定位，用于子元素绝对定位
      minHeight: "calc(100vh - 200px)"  // 确保页面有足够高度让分页固定在底部
    }}>
      {/* 搜索区域 */}
      <Card className="mb-6">
        <form onSubmit={handleSearch}>
          <Row gutter={23} align="middle">
            <Col span={3}>
              <Input
                placeholder="请输入昵称"
                value={inputValues.uuid}
                onChange={(e) => handleInputChange('uuid', e.target.value)}
                size="large"
                prefix={<SearchOutlined className="text-gray-400" />}
                style={{ width: '100%' }}
              />
            </Col>

            <Col span={3}>
              <Input
                placeholder="请输入姓名"
                value={inputValues.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                size="large"
                prefix={<SearchOutlined className="text-gray-400" />}
                style={{ width: '100%' }}
              />
            </Col>

            <Col span={2}>
              <Button
                type="primary"
                htmlType="submit"
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
                onClick={handleResetSearch}
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
                添加用户
              </Button>
            </Col>
          </Row>
        </form>
      </Card>

      {/* 错误提示 */}
      {(nameError || uuidError) && (
        <div style={{
          color: 'red',
          margin: '16px 0',
          padding: '12px',
          background: '#fef0f0',
          borderRadius: 4,
          border: '1px solid #fee5e5'
        }}>
          {nameError ? `姓名搜索失败: ${nameError.message}` : ''}
          {uuidError ? `UUID搜索失败: ${uuidError.message}` : ''}
        </div>
      )}

      {/* 数据内容区域 */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <Spin size="large" tip="加载用户数据中..." />
        </div>
      ) : usersToDisplay.length === 0 && (searchCondition.username.trim() || searchCondition.uuid.trim()) ? (
        <div style={{ textAlign: 'center', padding: '50px 0' }}>
          <UserOutlined style={{ fontSize: '48px', color: '#ccc', marginBottom: '16px' }} />
          <h3>未找到匹配的用户</h3>
          <p>请尝试调整搜索条件或添加新用户</p>
          <Button
            type="primary"
            onClick={showModal}
            icon={<PlusOutlined />}
            className="bg-[#1C9A91] hover:bg-[#16857c]"
            style={{ marginTop: '16px' }}
          >
            添加用户
          </Button>
        </div>
      ) : (
        <Content
          users={usersToDisplay}
          loading={loading}
          onDelete={handleDeleteUser}
          onEdit={handleEditClick}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
        />
      )}

      {/* 固定在底部的分页控件 */}
      <div style={{
        position: 'absolute',  // 绝对定位
        bottom: '-20px',
        left: 0,
        right: 0,
        padding: '16px',
        background: '#fff',   // 背景色与页面一致，避免穿透
        display: 'flex',
        justifyContent: 'right',
        alignItems: 'center'
      }}>
        <Pagination {...tablePagination} />
      </div>
    </div>
  );
};

export default UserManagement;