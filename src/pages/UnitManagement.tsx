import React, { useState } from 'react';
import { Input, Row, Col, Button, Spin, Card, Empty, message, Upload, Modal, Table, Space } from 'antd';
import { SearchOutlined, PlusOutlined, RestOutlined, UploadOutlined, DownloadOutlined, CloseCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload/interface';
import { saveAs } from 'file-saver';
import { useMutation } from '@apollo/client';
import { gql } from '@apollo/client';
import UnitContent from '../components/unitContent';

// 定义GraphQL请求
const IMPORT_UNITS = gql`
  mutation ImportUnits($base64String: String!) {
    importUnits(base64String: $base64String) {
      successCount
      failed {
        data
        error
      }
      total
    }
  }
`;

const EXPORT_UNITS = gql`
  mutation ExportUnits($searchTerm: String) {
    exportUnits(searchTerm: $searchTerm)
  }
`;

// 单位数据接口
interface UnitItem {
  key: string;
  id: number;
  unitCode: string;
  unitName: string;
  userCount: number;
  users?: {
    id: number;
    username: string;
  }[];
  createTime?: string;
}

interface UnitManagementProps {
  searchTerm: string;
  handleSearch: (value: string) => void;
  unitsToDisplay: UnitItem[];
  loading: boolean;
  handleDeleteUnit: (id: number) => void;
  handleEditClick: (unit: UnitItem) => void;
  showUnitModal: () => void;
  onImportSuccess?: () => void;
  refetchAllUnits: () => void;
}

const UnitManagement: React.FC<UnitManagementProps> = ({
  searchTerm,
  handleSearch,
  unitsToDisplay,
  loading,
  handleDeleteUnit,
  handleEditClick,
  showUnitModal,
  onImportSuccess,
  refetchAllUnits,
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [importLoading, setImportLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{
    visible: boolean;
    success: number;
    failures: Array<{ row: number; error: string }>;
  }>({
    visible: false,
    success: 0,
    failures: []
  });
  // 导入单位的GraphQL请求
  const [importUnits] = useMutation(IMPORT_UNITS, {
    onError: (error) => {
      message.error(`导入失败：${error.message || '服务器处理错误'}`);
      setImportLoading(false);
    },
  });

  // 导出单位的GraphQL请求
  const [exportUnits] = useMutation(EXPORT_UNITS, {
    onError: (error) => {
      message.error(`导出失败：${error.message || '服务器处理错误'}`);
      setExportLoading(false);
    },
  });

  // 搜索相关处理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSearchTerm(e.target.value);
  };

  const handleReset = () => {
    setLocalSearchTerm('');
    handleSearch('');
  };

  const handleSearchSubmit = () => {
    handleSearch(localSearchTerm);
  };

  /**
   * 处理导出：调用后端接口获取文件并下载
   */
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const { data } = await exportUnits({
        variables: { searchTerm: localSearchTerm.trim() || null },
      });

      const downloadUrl = data?.exportUnits;
      if (!downloadUrl) {
        throw new Error('未获取到有效下载链接');
      }

      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error(`文件下载失败：${response.statusText}`);
      }

      const blob = await response.blob();
      saveAs(blob, `单位数据_${new Date().toISOString().slice(0, 10)}.xlsx`);
      message.success('导出成功');
    } catch (error) {
      console.error('导出处理失败:', error);
      message.error(`导出失败：${(error as Error).message}`);
    } finally {
      setExportLoading(false);
    }
  };

  /**
   * 处理导入：将文件转换为Base64并上传
   */
  const handleFileImport = async (file: RcFile) => {
    setImportLoading(true);

    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          if (!event.target?.result) {
            throw new Error('文件读取失败');
          }

          const base64String = event.target.result.toString();
          const { data, errors } = await importUnits({ // 解构出errors
            variables: { base64String },
          });

          // 处理GraphQL错误
          if (errors) {
            const errorMessage = errors.map(err => err.message).join('; ');
            throw new Error(errorMessage);
          }

          if (data?.importUnits) {
            const { successCount, failed } = data.importUnits;
            message.success(`导入成功 ${successCount} 条记录`);

            if (failed.length > 0) {
              // 显示前3条失败记录（避免消息太长）
              const displayedFailures = failed.slice(0, 3);
              const moreCount = failed.length - 3;

              displayedFailures.forEach((fail, index) => {
                message.error(`第${fail.data.rowNumber}行: ${fail.error}`);
              });

              if (moreCount > 0) {
                message.warning(`另有${moreCount}条记录失败，请查看控制台`);
              }

              console.table(failed); // 在控制台打印完整失败信息
            }
            setImportResult({
              visible: true,
              success: successCount,
              failures: failed.map(f => ({
                row: f.data.rowNumber,
                error: f.error
              }))
            });
            refetchAllUnits();
            onImportSuccess?.();
          }

          resolve('导入成功');
        } catch (error) {
          // 更详细的错误处理
          let errorMessage = '导入失败';
          if (error instanceof Error) {
            errorMessage += `: ${error.message}`;

            // 处理特定错误类型
            if (error.message.includes('单位编码')) {
              errorMessage = '单位编码已存在或格式不正确';
            } else if (error.message.includes('用户ID')) {
              errorMessage = '包含无效的用户ID';
            }
          }

          message.error(errorMessage);
          console.error('导入详细错误:', error);
          reject(error);
        } finally {
          setImportLoading(false);
        }
      };

      reader.onerror = () => {
        const error = new Error('文件读取失败，请检查文件格式');
        message.error(error.message);
        setImportLoading(false);
        reject(error);
      };

      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      {/* 搜索与操作区域 */}
      <Card className="mb-6">
        <Row gutter={16} justify="space-between" align="middle">
          {/* 搜索部分 - 左侧 */}
          <Col flex="auto">
            <Row gutter={23}>
              <Col flex="auto" span={5}>
                <Input
                  placeholder="请输入单位编码或名称..."
                  value={localSearchTerm}
                  onChange={handleInputChange}
                  onPressEnter={handleSearchSubmit}
                  size="large"
                  prefix={<SearchOutlined className="text-gray-400" />}
                  style={{ width: '100%' }}
                />
              </Col>
              <Col span={3}>
                <Button
                  type="primary"
                  onClick={handleSearchSubmit}
                  size="large"
                  icon={<SearchOutlined />}
                  className="bg-[#1C9A91] hover:bg-[#16857c]"
                  style={{ width: '100%' }}
                >
                  搜索
                </Button>
              </Col>
              <Col span={3}>
                <Button
                  onClick={handleReset}
                  size="large"
                  icon={<RestOutlined />}
                  style={{ width: '100%' }}
                >
                  重置
                </Button>
              </Col>
            </Row>
          </Col>

          {/* 操作按钮 - 右侧 */}
          <Col>
            <Space>
              <Upload
                name="unit-import"
                accept=".xlsx,.xls"
                showUploadList={false}
                beforeUpload={handleFileImport}
                maxCount={1}
                disabled={importLoading}
              >
                <Button
                  size="large"
                  icon={<UploadOutlined />}
                  loading={importLoading}
                >
                  {importLoading ? '导入中...' : '批量导入'}
                </Button>
              </Upload>

              <Button
                size="large"
                icon={<DownloadOutlined />}
                onClick={handleExport}
                loading={exportLoading}
                disabled={loading}
              >
                批量导出
              </Button>

              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={showUnitModal}
                className="bg-[#1C9A91] hover:bg-[#16857c]"
              >
                添加单位
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>
      <Modal
        title="导入结果"
        visible={importResult.visible}
        onOk={() => setImportResult({ ...importResult, visible: false })}
        onCancel={() => setImportResult({ ...importResult, visible: false })}
        footer={[
          <Button
            key="ok"
            type="primary"
            onClick={() => setImportResult({ ...importResult, visible: false })}
          >
            确定
          </Button>
        ]}
      >
        <div style={{ marginBottom: 16 }}>
          <CheckCircleOutlined style={{ color: '#6cdb2cff', marginRight: 8 }} />
          <span>成功导入: {importResult.success} 条</span>
        </div>

        {importResult.failures.length > 0 && (
          <div>
            <CloseCircleOutlined style={{ color: '#f5222d', marginRight: 8 }} />
            <span>失败记录: {importResult.failures.length} 条</span>

            <Table
              size="small"
              style={{ marginTop: 12 }}
              columns={[
                { title: '行号', dataIndex: 'row', key: 'row' },
                { title: '错误原因', dataIndex: 'error', key: 'error' }
              ]}
              dataSource={importResult.failures}
              pagination={false}
              scroll={{ y: 200 }}
            />
          </div>
        )}
      </Modal>
      {/* 数据展示区域 */}
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <Spin size="large" tip="加载单位数据中..." />
        </div>
      ) : unitsToDisplay.length === 0 && localSearchTerm.trim() !== '' ? (
        <div className="text-center py-10">
          <SearchOutlined style={{ fontSize: 24, color: '#ccc', marginBottom: 16 }} />
          <h3>未找到匹配的单位</h3>
          <p className="text-gray-500 mb-4">请尝试调整搜索条件或添加新单位</p>
          <Button
            type="primary"
            onClick={showUnitModal}
            icon={<PlusOutlined />}
            className="bg-[#1C9A91] hover:bg-[#16857c]"
          >
            添加单位
          </Button>
        </div>
      ) : unitsToDisplay.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Empty
            description="暂无单位数据"
            style={{ margin: '20px 0' }}
          >
            <Button
              type="primary"
              onClick={showUnitModal}
              icon={<PlusOutlined />}
              className="bg-[#1C9A91] hover:bg-[#16857c]"
            >
              添加单位
            </Button>
          </Empty>
        </div>
      ) : (
        <UnitContent
          units={unitsToDisplay}
          loading={loading}
          onDelete={handleDeleteUnit}
          onEdit={handleEditClick}
          onManageUsers={(unitId, unitName) => {
            console.log(`管理单位[${unitName}]的用户，ID: ${unitId}`);
          }}
        />
      )}
    </div>

  );
};

export default UnitManagement;