import React, { useState } from 'react';
import { Input, Row, Col, Button, Spin, Card, Select } from 'antd';
import SkillContent from '../components/skillContent';
import { SearchOutlined, PlusOutlined, UserOutlined, RestOutlined } from '@ant-design/icons';

const { Option } = Select;

interface SkillManagementProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    handleSearch: (value: string) => void; // 仅在点击搜索按钮时触发
    allSkills: any[];
    filteredSkills: any[];
    loading: boolean;
    onDelete: (id: number) => void;
    onEdit: (skill: any) => void;
    showModal: () => void;
}

const SkillManagement: React.FC<SkillManagementProps> = ({
    searchTerm,
    setSearchTerm,
    handleSearch,
    allSkills,
    filteredSkills,
    loading,
    onDelete,
    onEdit,
    showModal,
}) => {
    const [filterByUser, setFilterByUser] = useState<string | null>(null);
    // 新增本地搜索词状态，与父组件搜索词解耦
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

    // 获取所有关联用户（去重）
    const getAllUsers = () => {
        const usersSet = new Set<string>();
        allSkills.forEach(skill => {
            skill.users?.forEach((user: any) => {
                if (user.username) usersSet.add(user.username);
            });
        });
        return Array.from(usersSet);
    };

    // 应用筛选条件（仅基于搜索按钮触发的结果和用户筛选）
    const applyFilters = () => {
        let result = [...filteredSkills];
        if (filterByUser) {
            result = result.filter(skill =>
                skill.users?.some((user: any) => user.username === filterByUser)
            );
        }
        return result;
    };

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

    const finalSkills = applyFilters();
    const userOptions = getAllUsers();

    return (
        <div className="p-6 bg-white rounded-lg shadow-sm">
            {/* 搜索区域卡片 */}
            <Card className="mb-6">
                <Row gutter={23} align="middle">
                    <Col span={3}>
                        <Input
                            placeholder="搜索技能或描述..." 
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
                            placeholder="按关联用户筛选"
                            style={{ width: '100%' }}
                            size="large"
                            allowClear
                            onChange={(value) => setFilterByUser(value || null)}
                            suffixIcon={<UserOutlined />}
                        >
                            {userOptions.map(user => (
                                <Option key={user} value={user}>
                                    {user}
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
                            添加技能
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* 加载/空状态/内容区域 */}
            {loading ? (
                <div>
                    <Spin size="large" tip="加载技能数据中..." />
                </div>
            ) : finalSkills.length === 0 ? (
                <div>
                    <div>
                        <UserOutlined />
                    </div>
                    <h3>暂无技能数据</h3>
                    <p>请添加新技能或调整搜索条件</p>
                    <Button
                        type="primary"
                        onClick={showModal}
                        icon={<PlusOutlined />}
                        className="bg-[#1C9A91] hover:bg-[#16857c]"
                    >
                        添加新技能
                    </Button>
                </div>
            ) : (
                <SkillContent
                    skills={finalSkills}
                    loading={loading}
                    onDelete={onDelete}
                    onEdit={onEdit}
                />
            )}
        </div>
    );
};

export default SkillManagement;