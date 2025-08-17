import React, { useState } from 'react';
import {
  Button,
  Col,
  Popconfirm,
  Row,
  Table,
  Tag,
  Tooltip,
  TableColumnsType,
  Modal,
  Upload,
  List,
  message,
  Popover
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  UploadOutlined,
  DownloadOutlined,
  FileTextOutlined,
  DeleteTwoTone
} from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';
import { gql, useMutation, useQuery } from '@apollo/client';

// 上传用户文件
const UPLOAD_USER_FILE_MUTATION = gql`
  mutation UploadUserFile($input: CreateUserFileInput!) {
    uploadUserFile(input: $input) {
      id
      name
      url
      size
      type
      uploadTime
      userId
    }
  }
`;

// 查询用户文件
const GET_USER_FILES_QUERY = gql`
  query GetUserFiles($userId: Int!) {
    getUserFiles(userId: $userId) {
      id
      name
      size
      type
      url
      uploadTime
      userId
    }
  }
`;

// 删除用户文件
const DELETE_USER_FILE_MUTATION = gql`
  mutation DeleteUserFile($fileId: String!, $userId: Int!) {
    deleteUserFile(fileId: $fileId, userId: $userId)
  }
`;

interface UserFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadTime: string;
  userId: number;
}

interface UnitItem {
  key: string;
  id: number;
  unitCode: string;
  unitName: string;
  userCount: number;
  users?: {
    id: number;
    username: string;
    files?: UserFile[];
  }[];
}

interface UnitContentProps {
  units: UnitItem[];
  loading: boolean;
  onDelete: (id: number) => void;
  onEdit: (unit: UnitItem) => void;
  onManageUsers: (unitId: number, unitName: string) => void;
  onDownloadFile?: (file: UserFile) => void;
}

interface FormattedUnit extends Omit<UnitItem, 'key'> {
  key: string;
  序号: number;
  单位编码: string;
  单位名称: string;
  用户列表: React.ReactNode;
}

// 为查询结果定义类型
interface GetUserFilesResponse {
  getUserFiles: UserFile[];
}

const UnitContent: React.FC<UnitContentProps> = ({
  units,
  loading,
  onDelete,
  onEdit,
  onManageUsers,
  onDownloadFile,
}) => {
  const [visible, setVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; files?: UserFile[] } | null>(null);

  // 初始化mutation和查询
  const [uploadUserFile, { loading: uploadLoading }] = useMutation(UPLOAD_USER_FILE_MUTATION);
  const [deleteUserFile, { loading: deleteLoading }] = useMutation(DELETE_USER_FILE_MUTATION); // 新增：删除mutation
  const { data, refetch: refetchUserFiles } = useQuery<GetUserFilesResponse>(GET_USER_FILES_QUERY, {
    skip: !currentUser,
    variables: { userId: currentUser?.id },
  });

  // 处理用户点击事件
  const handleUserClick = (user: { id: number; username: string; files?: UserFile[] }) => {
    setCurrentUser(user);
    setVisible(true);
    if (user.id) {
      refetchUserFiles({ userId: user.id });
    }
  };

  // 处理用户列表显示
  const formatUserList = (users: UnitItem['users']) => {
    if (!Array.isArray(users) || users.length === 0) {
      return <Tag color="gray">暂无用户</Tag>;
    }

    const maxVisible = 5;
    const visibleUsers = users.slice(0, maxVisible);
    const remaining = users.length - maxVisible;

    const allUsers = users.map(user => (
      <Tag
        key={user.id}
        color="blue"
        style={{ cursor: 'pointer', margin: 2 }}
        onClick={() => handleUserClick(user)}
      >
        {user.username}
      </Tag>
    ));

    return (
      <Popover
        content={<div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{allUsers}</div>}
        title={`共 ${users.length} 个用户`}
        trigger="hover"
        placement="top"
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          {visibleUsers.map(user => (
            <Tag
              key={user.id}
              color="blue"
              style={{ cursor: 'pointer' }}
              onClick={() => handleUserClick(user)}
            >
              {user.username}
            </Tag>
          ))}
          {remaining > 0 && (
            <Tag color="orange" style={{ cursor: 'default' }}>
              +{remaining}
            </Tag>
          )}
        </div>
      </Popover>
    );
  };

  const formattedUnits: FormattedUnit[] = units.map((unit, index) => ({
    ...unit,
    key: unit.id.toString(),
    序号: index + 1,
    单位编码: unit.unitCode || '无编码',
    单位名称: unit.unitName || '未命名',
    用户列表: formatUserList(unit.users),
  }));

  // 将文件转换为Base64
  const getBase64 = (file: RcFile): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    showUploadList: false,
    beforeUpload: async (file: RcFile) => {
      // 保持原有上传逻辑不变
      if (!currentUser) {
        message.error('请先选择用户');
        return false;
      }
      try {
        const base64Data = await getBase64(file);
        const result = await uploadUserFile({
          variables: {
            input: {
              userId: currentUser.id,
              name: file.name,
              type: file.type,
              base64Content: base64Data
            }
          }
        });
        if (result.data?.uploadUserFile) {
          message.success('文件上传成功');
          await refetchUserFiles({ userId: currentUser.id });
        }
      } catch (error) {
        message.error(`上传失败: ${(error as Error).message || '未知错误'}`);
      }
      return false;
    },
    disabled: uploadLoading,
  };

  const handleDownload = async (file: UserFile) => {
    if (!currentUser) {
      message.error('请先选择用户');
      return;
    }

    try {
      // 显示下载中状态
      message.loading({ content: '准备下载...', key: 'download' });

      // 调用后端下载接口
      const response = await fetch(`/files/download/${file.id}/${currentUser.id}`);

      if (!response.ok) {
        throw new Error(response.status === 404 ? '文件不存在' : '下载失败');
      }

      // 获取文件名从Content-Disposition头或使用原文件名
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = file.name;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?(;|$)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1]);
        }
      }

      // 创建Blob对象并触发下载
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      // 清理
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        message.success({ content: '下载完成', key: 'download', duration: 2 });
      }, 100);

    } catch (error) {
      console.error('下载失败:', error);
      message.error({ content: `下载失败: ${(error as Error).message}`, key: 'download', duration: 3 });
    }
  };

  // 完善删除文件逻辑
  const handleDeleteFile = async (fileId: string) => {
    if (!currentUser) return;

    try {
      const result = await deleteUserFile({
        variables: {
          fileId,
          userId: currentUser.id // 传递userId用于后端验证
        }
      });

      if (result.data?.deleteUserFile) {
        message.success('文件删除成功');
        await refetchUserFiles({ userId: currentUser.id }); // 刷新文件列表
      } else {
        message.error('删除失败：后端未确认删除');
      }
    } catch (error) {
      console.error('删除文件错误', error);
      message.error(`删除失败：${(error as Error).message || '未知错误'}`);
    }
  };

  const columns: TableColumnsType<FormattedUnit> = [
    // 保持原有列定义不变
    {
      title: '序号',
      dataIndex: '序号',
      align: 'center',
      width: 80,
    },
    {
      title: '单位编码',
      dataIndex: '单位编码',
      align: 'center',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          {text}
        </Tooltip>
      ),
    },
    {
      title: '单位名称',
      dataIndex: '单位名称',
      align: 'center',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          {text}
        </Tooltip>
      ),
    },
    {
      title: '用户列表',
      dataIndex: '用户列表',
      align: 'center',
      width: '40%',
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
              onClick={() => onEdit(record as UnitItem)}
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
        dataSource={formattedUnits}
        columns={columns}
        pagination={false}
        rowKey="key"
        locale={{ emptyText: '暂无单位数据' }}
      />

      <Modal
        title={`${currentUser?.username} 的资料文件`}
        open={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 16 }}>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />} loading={uploadLoading}>
              上传文件
            </Button>
          </Upload>
        </div>

        <div>
          <h4 style={{ marginBottom: 12 }}>文件列表</h4>
          {data?.getUserFiles && data.getUserFiles.length > 0 ? (
            <List<UserFile>
              itemLayout="horizontal"
              dataSource={data.getUserFiles}
              renderItem={(item: UserFile) => (
                <List.Item
                  actions={[
                    <Button
                      icon={<DownloadOutlined />}
                      size="small"
                      onClick={() => handleDownload(item)}
                    >
                      下载
                    </Button>,
                    <Popconfirm
                      title="确定删除此文件吗？"
                      onConfirm={() => handleDeleteFile(item.id)}
                      okText="是"
                      cancelText="否"
                    >
                      <Button
                        icon={<DeleteTwoTone />}
                        size="small"
                        danger
                        loading={deleteLoading} // 添加删除加载状态
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<FileTextOutlined />}
                    title={item.name}
                    description={`
                                            大小: ${(item.size / 1024).toFixed(2)}KB | 
                                            类型: ${item.type} | 
                                            上传时间: ${new Date(item.uploadTime).toLocaleString()}
                                        `}
                  />
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>
              暂无文件
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default UnitContent;
