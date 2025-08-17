import React, { useContext, useEffect, useRef, useState } from 'react';
import type { GetRef, InputRef, TableProps } from 'antd';
import { Button, Col, Form, Input, message, Popconfirm, Popover, Row, Table, Tag } from 'antd';

type FormInstance<T> = GetRef<typeof Form<T>>;

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface Item {
    key: string;
    name: string;
    age: string;
    address: string;
}

interface ContentProps {
    users: any[];
    loading: boolean;
    onDelete: (key: number) => void;
    onEdit: (user: any) => void;
    pagination: {
        current: number;
        pageSize: number;
        total: number;
    };
    onPaginationChange: (page: number, pageSize: number) => void;
}

interface EditableRowProps {
    index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
    const [form] = Form.useForm();
    return (
        <Form form={form} component={false}>
            <EditableContext.Provider value={form}>
                <tr {...props} />
            </EditableContext.Provider>
        </Form>
    );
};

interface EditableCellProps {
    title: React.ReactNode;
    editable: boolean;
    dataIndex: keyof Item;
    record: Item;
    handleSave: (record: Item) => void;
}

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
    title,
    editable,
    children,
    dataIndex,
    record,
    handleSave,
    ...restProps
}) => {
    const [editing, setEditing] = useState(false);
    const inputRef = useRef<InputRef>(null);
    const form = useContext(EditableContext)!;

    useEffect(() => {
        if (editing) {
            inputRef.current?.focus();
        }
    }, [editing]);

    const toggleEdit = () => {
        setEditing(!editing);
        form.setFieldsValue({ [dataIndex]: record[dataIndex] });
    };

    const save = async () => {
        try {
            const values = await form.validateFields();
            toggleEdit();
            handleSave({ ...record, ...values });
        } catch (errInfo) {
            console.log('Save failed:', errInfo);
        }
    };

    let childNode = children;

    if (editable) {
        childNode = editing ? (
            <Form.Item
                style={{ margin: 0 }}
                name={dataIndex}
                rules={[{ required: true, message: `${title} is required.` }]}
            >
                <Input ref={inputRef} onPressEnter={save} onBlur={save} />
            </Form.Item>
        ) : (
            <div
                className="editable-cell-value-wrap"
                style={{ paddingInlineEnd: 24 }}
                onClick={toggleEdit}
            >
                {children}
            </div>
        );
    }

    return <td {...restProps}>{childNode}</td>;
};

interface DataType {
    key: React.Key;
    序号: number;
    昵称: string;
    姓名: string;
    性别: string;
    年龄: string;
    单位: string;
    技能: any[];
    是否启用: string;
    操作: React.Key;
}

type ColumnTypes = Exclude<TableProps<DataType>['columns'], undefined>;

const Content: React.FC<ContentProps> = ({
    users,
    loading,
    onDelete,
    pagination,
    onEdit,
    onPaginationChange
}) => {
    // 格式化用户数据，提取技能数组而非直接渲染
    const formattedUsers = users.map(user => ({
        ...user,
        key: user.id,
        序号: user.id,
        昵称: user.uuid || '无昵称',
        姓名: user.username || '未命名',
        性别: user.gender || '未知',
        年龄: user.age || '未知',
        单位: user.unit?.unitName || '-',
        技能: user.skills || [], // 存储原始技能数组
        是否启用: user.isEnable ? '是' : '否',
        操作: user.id
    }));

    const handleDelete = (key: React.Key) => {
        const numericId = parseInt(String(key), 10);
        if (isNaN(numericId)) {
            message.error('无效的用户ID');
            return;
        }
        onDelete(numericId);
    };

    // 技能标签渲染函数，最多显示2个，超出部分显示+n
    const renderSkills = (skills: any[]) => {
        if (!skills || skills.length === 0) {
            return <Tag color="gray">无技能</Tag>;
        }

        const maxVisible = 2;
        const visibleSkills = skills.slice(0, maxVisible);
        const hiddenCount = skills.length - maxVisible;

        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'clip'
            }}>
                {visibleSkills.map(skill => (
                    <Tag
                        key={skill.id}
                        color="blue"
                        style={{ margin: 0, flexShrink: 0 }}
                    >
                        {skill.name}
                    </Tag>
                ))}

                {hiddenCount > 0 && (
                    <Popover
                        content={
                            <div style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 4,
                                maxWidth: '300px'
                            }}>
                                {skills.map(skill => (
                                    <Tag key={skill.id} color="blue">
                                        {skill.name}
                                    </Tag>
                                ))}
                            </div>
                        }
                        title="所有技能"
                    >
                        <Tag style={{
                            background: '#ebe8e4ff',
                            margin: 0,
                            flexShrink: 0
                        }}>
                            +{hiddenCount}
                        </Tag>
                    </Popover>
                )}
            </div>
        );
    };

    const defaultColumns: (ColumnTypes[number] & { editable?: boolean; dataIndex: string })[] = [
        {
            title: '序号',
            dataIndex: '序号',
            editable: true,
            align: 'center'
        },
        {
            title: '昵称',
            dataIndex: '昵称',
            align: 'center'
        },
        {
            title: '姓名',
            dataIndex: '姓名',
            align: 'center'
        },
        {
            title: '性别',
            dataIndex: '性别',
            align: 'center'
        },
        {
            title: '年龄',
            dataIndex: '年龄',
            align: 'center'
        },
        {
            title: '单位',
            dataIndex: '单位',
            align: 'center',
        },
        {
            title: '技能',
            dataIndex: '技能',
            align: 'center',
            width: 200,
            render: (skills) => renderSkills(skills) // 使用技能渲染函数
        },
        {
            title: '是否启用',
            dataIndex: '是否启用',
            align: 'center'
        },
        {
            title: '操作',
            dataIndex: '操作',
            align: 'center',
            render: (_, record) => (
                <span>
                    <Row>
                        <Col span={6}></Col>
                        <Col span={6}>
                            <a onClick={() => onEdit(record)} >修改</a>
                        </Col>
                        <Col span={6}>
                            <Popconfirm title="确定删除吗?" onConfirm={() => handleDelete(record.key)}>
                                <a>删除</a>
                            </Popconfirm>
                        </Col>
                        <Col span={6}></Col>
                    </Row>
                </span >
            ),
        },
    ];

    const components = {
        body: {
            row: EditableRow,
            cell: EditableCell,
        },
    };

    const columns = defaultColumns.map((col) => {
        if (!col.editable) {
            return col;
        }
        return {
            ...col,
            onCell: (record: DataType) => ({
                record,
                editable: col.editable,
                dataIndex: col.dataIndex,
                title: col.title,
            }),
        };
    });

    // 分页配置
    const tablePagination = {
        ...pagination,
        showTotal: (total: number) => `共 ${total} 条记录`,
        onChange: onPaginationChange,
        onShowSizeChange: (current: number, size: number) => {
            onPaginationChange(1, size);
        },
    };

    return (
        <div style={{ margin: "20px 0" }}>
            <Table<DataType>
                components={components}
                rowClassName={() => 'editable-row'}
                bordered
                loading={loading}
                dataSource={formattedUsers}
                columns={columns as ColumnTypes}
                pagination={false}
                rowKey="key"
            />
        </div>
    );
};

export default Content;
