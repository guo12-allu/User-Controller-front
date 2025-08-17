import React from 'react';
import {
    Button,
    Col,
    Popconfirm,
    Row,
    Table,
    Tag,
    Tooltip,
    TableColumnsType
} from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface SkillItem {
    key: string;
    id: number;
    name: string;
    description: string;
    users: {
        id: number;
        username: string;
    }[];
}

interface SkillContentProps {
    skills: SkillItem[];
    loading: boolean;
    onDelete: (id: number) => void;
    onEdit: (skill: SkillItem) => void;
}

interface FormattedSkill extends Omit<SkillItem, 'key'> {
    key: string;
    序号: number;
    技能名称: string;
    技能描述: string;
    关联用户: React.ReactNode;
}

const SkillContent: React.FC<SkillContentProps> = ({
    skills,
    loading,
    onDelete,
    onEdit,
}) => {
    // 处理关联用户显示：最多显示4个，超出部分显示+n
    const formatUsers = (users: SkillItem['users']) => {
        if (!users || users.length === 0) {
            return <Tag color="gray">未关联用户</Tag>;
        }

        // 截取前4个用户
        const displayUsers = users.slice(0, 4);
        // 计算超出的数量
        const remaining = users.length - 4;

        // 生成完整用户列表（用于悬停提示）
        const allUsernames = users.map(user => user.username).join(', ');

        return (
            <Tooltip title={allUsernames} placement="top">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
                    {/* 显示前4个用户 */}
                    {displayUsers.map(user => (
                        <Tag key={user.id} color="blue">{user.username}</Tag>
                    ))}
                    {/* 显示超出的数量（如果有） */}
                    {remaining > 0 && (
                        <Tag color="orange">+{remaining}</Tag>
                    )}
                </div>
            </Tooltip>
        );
    };

    const formattedSkills: FormattedSkill[] = skills.map((skill, index) => ({
        ...skill,
        序号: index + 1,
        技能名称: skill.name,
        技能描述: skill.description || '无描述',
        关联用户: formatUsers(skill.users), // 使用处理函数渲染关联用户
    }));

    const columns: TableColumnsType<FormattedSkill> = [
        {
            title: '序号',
            dataIndex: '序号',
            align: 'center',
            width: 80,
        },
        {
            title: '技能名称',
            dataIndex: '技能名称',
            align: 'center',
            ellipsis: true,
            render: (text: string) => (
                <Tooltip title={text} placement="topLeft">
                    {text}
                </Tooltip>
            ),
        },
        {
            title: '技能描述',
            dataIndex: '技能描述',
            align: 'center',
            ellipsis: true,
            render: (text: string) => (
                <Tooltip title={text} placement="topLeft">
                    {text}
                </Tooltip>
            ),
        },
        {
            title: '关联用户',
            dataIndex: '关联用户',
            align: 'center',
        },
        {
            title: '操作',
            align: 'center',
            render: (_, record) => (
                <Row justify="center" gutter={8}>
                    <Col>
                        <Button
                            type="link"
                            icon={<EditOutlined />}
                            onClick={() => onEdit(record as SkillItem)}
                        >
                            修改
                        </Button>
                    </Col>
                    <Col>
                        <Popconfirm
                            title="确定删除吗?"
                            onConfirm={() => onDelete(record.id)}
                            okText="确认"
                            cancelText="取消"
                        >
                            <Button
                                type="link"
                                icon={<DeleteOutlined />}
                                danger
                            >
                                删除
                            </Button>
                        </Popconfirm>
                    </Col>
                </Row>
            ),
        }
    ];

    return (
        <div style={{ margin: "20px 0" }}>
            <Table
                bordered
                loading={loading}
                dataSource={formattedSkills}
                columns={columns}
                pagination={false}
                rowKey="key"
                locale={{ emptyText: '暂无技能数据' }}
            />
        </div>
    );
};

export default SkillContent;