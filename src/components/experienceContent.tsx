import React from 'react';
import { Button, Col, message, Popconfirm, Row, Table, TableProps, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';

interface ExperienceItem {
    key: string;
    id: number;
    placeName: string;
    address: string;
    startDate: string;
    endDate: string;
    userId: number;
    user: {
        id: number;
        username: string;
    };
}

interface ExperienceContentProps {
    experiences: ExperienceItem[];
    loading: boolean;
    onDelete: (id: number) => void;
    onEdit: (experience: ExperienceItem) => void;
    users: any[];
}

interface ExperienceDataType {
    key: React.Key;
    序号: number;
    工作或学习地的名称: string;
    地址: string;
    开始日期: string;
    结束日期: string;
    所属用户: React.ReactNode;
    操作: React.Key;
    originalData: ExperienceItem;
}

type ExperienceColumnTypes = Exclude<TableProps<ExperienceDataType>['columns'], undefined>;

const ExperienceContent: React.FC<ExperienceContentProps> = ({
    experiences,
    loading,
    onDelete,
    onEdit,
    users,
}) => {
    // 格式化经历数据，同时保留原始数据
    const formattedExperiences = experiences.map((experience, index) => ({
        ...experience,
        key: experience.id,
        序号: index + 1,
        工作或学习地的名称: experience.placeName,
        地址: experience.address,
        开始日期: experience.startDate,
        结束日期: experience.endDate,
        所属用户: experience.user?.username ? (
            <Tag color="blue">{experience.user.username}</Tag>
        ) : (
            <Tag color="gray">未关联用户</Tag>
        ),
        操作: experience.id,
        originalData: experience // 保存原始数据
    }));

    const handleDelete = (key: React.Key) => {
        const numericId = parseInt(String(key), 10);
        if (isNaN(numericId)) {
            message.error('无效的经历ID');
            return;
        }
        onDelete(numericId);
    };

    const columns: ExperienceColumnTypes = [
        {
            title: '序号',
            dataIndex: '序号',
            align: 'center',
            width: 80,
        },
        {
            title: '工作或学习地的名称',
            dataIndex: '工作或学习地的名称',
            align: 'center',
        },
        {
            title: '地址',
            dataIndex: '地址',
            align: 'center',
        },
        {
            title: '开始日期',
            dataIndex: '开始日期',
            align: 'center',
            width: 140,
        },
        {
            title: '结束日期',
            dataIndex: '结束日期',
            align: 'center',
            width: 140,
        },
        {
            title: '所属用户',
            dataIndex: '所属用户',
            align: 'center',
        },
        {
            title: '操作',
            dataIndex: '操作',
            align: 'center',
            render: (_, record) => (
                <span>
                    <Row>
                        <Col span={6}></Col>
                        <Col span={8}>
                            {/* 传递原始数据以满足类型要求 */}
                            <a onClick={() => onEdit(record.originalData)}>修改</a>
                        </Col>
                        <Col span={5}>
                            <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.key)}>
                                <a>删除</a>
                            </Popconfirm>
                        </Col>
                        <Col span={5}></Col>
                    </Row>
                </span>
            ),
        },
    ];

    return (
        <div style={ {margin: "20px 0"} }>
            <Table<ExperienceDataType>
                bordered
                loading={loading}
                dataSource={formattedExperiences}
                columns={columns}
                pagination={false}
                rowKey="key"
                locale={{ emptyText: '暂无经历数据' }}
            />
        </div>
    );
};

export default ExperienceContent;