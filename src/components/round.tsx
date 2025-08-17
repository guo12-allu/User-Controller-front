import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    DesktopOutlined,
    FileOutlined,
    PieChartOutlined,
    TeamOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Input, Space, Col, Row, Divider, Button, Modal, Breadcrumb, Layout, Menu, theme, Select, Form, Checkbox, message, MenuProps, Cascader } from 'antd';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { gql, useMutation, useQuery } from '@apollo/client';
import UserManagement from '../pages/UserManagement';
import UnitManagement from '../pages/UnitManagement';
import SkillManagement from '../pages/SkillManagement';
import ExperienceManagement from '../pages/ExperienceManagement';
import { regionData } from 'element-china-area-data';
const { Header, Content, Footer, Sider } = Layout;
type SearchProps = typeof Input.Search;
const { Search } = Input;
const { Option } = Select;
type MenuItem = Required<MenuProps>['items'][number];

// 生成菜单项的工具函数
function getItem(
    label: React.ReactNode,
    key: React.Key,
    icon?: React.ReactNode,
    children?: MenuItem[],
): MenuItem {
    return {
        key,
        icon,
        children,
        label,
    } as MenuItem;
}

// 用户数据接口定义
interface User {
    id: number;
    username: string;
    uuid: string;
    gender?: string;
    age?: string;
    isEnable?: boolean;
    phone?: string;
    address?: string;
    role?: string;
    unit?: {
        id: number;
        unitName: string;
    };
    skills?: {
        id: number;
        name: string;
    }[];
}
interface Unit {
    id: number;
    unitCode: string;
    unitName: string;
    users?: Array<{
        id: number;
        username: string;
    }>;
}
interface Experience {
    id: number;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    userId: number;
    user: {
        id: number;
        username: string;
    };
}
interface UnitsQueryResult {
    findAllUnit: Unit[];
}
interface ExperiencesQueryResult {
    findAllExperience: Experience[];
}
// 表单布局配置
const formItemLayout = {
    labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
    },
    wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
    },
};

const tailFormItemLayout = {
    wrapperCol: {
        xs: {
            span: 24,
            offset: 0,
        },
        sm: {
            span: 16,
            offset: 8,
        },
    },
};

// 路由路径配置
const ROUTE_PATHS = {
    USER_MANAGEMENT: '/user-management',
    UNIT_MANAGEMENT: '/unit-management',
    SKILL_MANAGEMENT: '/skill-management',
    EXPERIENCE_MANAGEMENT: '/experience-management',
};

// 侧边栏菜单项
const items: MenuItem[] = [
    getItem('量表管理', 'sub1', <UserOutlined />, [
        getItem('Tom', '3'),
        getItem('Bill', '4'),
        getItem('Alex', '5'),
    ]),
    getItem('基础管理', 'sub2', <TeamOutlined />, [
        getItem('用户管理', ROUTE_PATHS.USER_MANAGEMENT),
        getItem('单位管理', ROUTE_PATHS.UNIT_MANAGEMENT),
        getItem('技能管理', ROUTE_PATHS.SKILL_MANAGEMENT),
        getItem('经历管理', ROUTE_PATHS.EXPERIENCE_MANAGEMENT),
    ]),
];
//用戶管理
const GET_ALL_USERS = gql`
  query GetAllUsers($page: Int, $pageSize: Int) {
    getAllUser(page: $page, pageSize: $pageSize) {
      users {
        id
        username
        uuid
        gender
        age
        isEnable
        phone
        address
        unit {
          id
          unitName
        }
        skills{
          id
          name
          description
        }
      }
      total
      page
      pageSize
    }
  }
`;

const ADD_USER = gql`
  mutation CreateUser($createUserDto: CreateUserDto!) {
    createUser(createUserDto: $createUserDto) {
      id
      username
      uuid
      password
      address
      gender
      isEnable
      phone
      age
      unit {
        id
        unitName
      }
    }
  }
`;

const SEARCH_BY_NAME = gql`
  query SearchByName($username: String!, $page: Int, $pageSize: Int) {
    getUserByName(username: $username, page: $page, pageSize: $pageSize) {
      users {
        id
        username
        uuid
        gender
        age
        isEnable
        phone
        unit {
          id
          unitName
        }
        skills{  
          id
          name
          description
        }
      }
      total
      page
      pageSize
    }
  }
`;

const SEARCH_BY_UUID = gql`
  query SearchByUuid($uuid: String!, $page: Int, $pageSize: Int) {
    getUserByUuid(uuid: $uuid, page: $page, pageSize: $pageSize) {
      users {
        id
        username
        uuid
        gender
        age
        isEnable
        phone
        unit {
          id
          unitName
        }
        skills{  
          id
          name
          description
        }
      }
      total
      page
      pageSize
    }
  }
`;

const DELETE_USER = gql`
  mutation DeleteUser($id: Int!) {
    deleteUser(id: $id)
  }
`;

const UPDATE_USER = gql`
  mutation UpdateUser($id: Int!, $updateUserDto: UpdateUserDto!) {
    updateUser(id: $id, updateUserDto: $updateUserDto) {
      id
      username
      uuid
      gender
      age
      isEnable
      phone
      address
      unit {
        id
        unitName
      }
    }
  }
`;

// 单位管理
const GET_ALL_UNITS = gql`
  query GetAllUnits {
    findAllUnit {
      id
      unitCode
      unitName
      users {
        id
        username
      }
    }
  }
`;

const ADD_UNIT = gql`
  mutation CreateUnit($createUnitDto: CreateUnitDto!) {
    createUnit(createUnitDto: $createUnitDto) {
      id
      unitCode
      unitName
      users {
        id
        username
      }
    }
  }
`;

const UPDATE_UNIT = gql`
  mutation UpdateUnit($id: Int!, $updateUnitDto: UpdateUnitDto!) {
    updateUnit(id: $id, updateUnitDto: $updateUnitDto) {
      id
      unitCode
      unitName
      users {
        id
        username
      }
    }
  }
`;

const DELETE_UNIT = gql`
  mutation DeleteUnit($id: Int!) {
    deleteUnit(id: $id)
  }
`;

//技能管理
const GET_ALL_SKILLS = gql`
  query GetAllSkills {
    getAllSkills {
      id
      name
      description
      users {
        id
        username
      }
    }
  }
`;

const GET_SKILL_BY_ID = gql`
  query GetSkillById($id: Int!) {
    getSkillById(id: $id) {
      id
      name
      description
      users {
        id
        username
      }
    }
  }
`;

const CREATE_SKILL = gql`
  mutation CreateSkill($createSkillDto: CreateSkillDto!) {
    createSkill(createSkillDto: $createSkillDto) {
      id
      name
      description
      users {
        id
        username
      }
    }
  }
`;

const UPDATE_SKILL = gql`
  mutation UpdateSkill($id: Int!, $updateSkillDto: UpdateSkillDto!) {
    updateSkill(id: $id, updateSkillDto: $updateSkillDto) {
      id
      name
      description
      users {
        id
        username
      }
    }
  }
`;

const DELETE_SKILL = gql`
  mutation DeleteSkill($id: Int!) {
    deleteSkill(id: $id)
  }
`;

//经历管理
const GET_ALL_EXPERIENCES = gql`
  query GetAllExperiences {
    findAllExperience {
      id
      placeName       # 使用正确的字段名：地点名称
      address         # 使用正确的字段名：地址
      startDate
      endDate
      userId
      user {
        id
        username
      }
    }
  }
`;

const GET_EXPERIENCE_BY_ID = gql`
  query FindOneExperience($id: ID!) {
    findExperienceById(id: $id) {
      id
      placeName
      address
      startDate
      endDate
      userId
      user {
        id
        username
      }
    }
  }
`;

const ADD_EXPERIENCE = gql`
  mutation CreateExperience($createExperienceDto: CreateExperienceDto!) {
    createExperience(input: $createExperienceDto) {
      id
      placeName
      address
      startDate
      endDate
      userId
      user {
        id
        username
      }
    }
  }
`;

const UPDATE_EXPERIENCE = gql`
  mutation UpdateExperience($id: ID!, $updateExperienceDto: UpdateExperienceDto!) {
    updateExperience(id: $id, input: $updateExperienceDto) {
      id
      placeName
      address
      startDate
      endDate
      userId
      user {
        id
        username
      }
    }
  }
`;

const DELETE_EXPERIENCE = gql`
  mutation DeleteExperience($id: ID!) {
    deleteExperience(id: $id)
  }
`;
const Round: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

    // 处理菜单点击事件
    const handleMenuClick = (e: { key: string }) => {
        navigate(e.key);
    };

    useEffect(() => {
        setSelectedKeys([location.pathname]);
    }, [location.pathname]);
    const handleAddressChange = (value: any, selectedOptions: any) => {
        const addressText = selectedOptions.map((option: any) => option.label).join('/');
        return addressText;
    };

    const parseAddressToCascaderValue = (address: string) => {
        if (!address) return [];

        const addressParts = address.split('/');
        const findValue = (data: any, parts: string[], level = 0): string[] => {
            if (level >= parts.length) return [];

            const currentPart = parts[level];
            const foundItem = data.find((item: any) => item.label === currentPart);

            if (foundItem) {
                const children = foundItem.children || [];
                return [foundItem.value, ...findValue(children, parts, level + 1)];
            }

            return [];
        };

        return findValue(regionData, addressParts);
    };
    // 用户管理相关状态
    const [open, setOpen] = useState(false);
    const [createUser] = useMutation(ADD_USER);
    const [form] = Form.useForm();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [editForm] = Form.useForm();
    const [updateUserMutation] = useMutation(UPDATE_USER);

    // 用户搜索状态
    const [inputValues, setInputValues] = useState({
        username: '',
        uuid: ''
    });

    // 单位管理相关状态
    const [openUnit, setOpenUnit] = useState(false);
    const [units, setUnits] = useState<any[]>([]);
    const [unitModalVisible, setUnitModalVisible] = useState(false);
    const [editingUnit, setEditingUnit] = useState<any | null>(null);
    const [unitForm] = Form.useForm();
    const [unitSearchTerm, setUnitSearchTerm] = useState('');
    const [filteredUnits, setFilteredUnits] = useState<any[]>([]);
    const [confirmLoading, setConfirmLoading] = useState(false);

    // 单位数据查询
    const {
        data: allUnitsData,
        loading: allUnitsLoading,
        refetch: refetchAllUnits,
    } = useQuery(GET_ALL_UNITS, {
        fetchPolicy: 'cache-and-network',
        onCompleted: (data) => {
            if (data?.findAllUnit) {
                setUnits(data.findAllUnit);
                setFilteredUnits(data.findAllUnit);
            }
        }
    });

    // 单位搜索
    const handleUnitSearch = (value: string) => {
        setUnitSearchTerm(value);
        if (value.trim() === '') {
            setFilteredUnits(units);
        } else {
            const filtered = units.filter(unit =>
                unit.unitCode.toLowerCase().includes(value.toLowerCase()) ||
                unit.unitName.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredUnits(filtered);
        }
    };

    // 添加单位 mutation
    const [addUnit] = useMutation(ADD_UNIT);

    // 更新单位 mutation
    const [updateUnit] = useMutation(UPDATE_UNIT);

    // 删除单位 mutation
    const [deleteUnit] = useMutation(DELETE_UNIT);

    // 添加单位处理
    const handleAddUnit = async (values: any) => {
        try {
            const createUnitDto = {
                unitCode: values.unitCode,
                unitName: values.unitName,
                userIds: values.userIds || [] // 添加用户关联
            };

            const { data } = await addUnit({
                variables: { createUnitDto },
                update: (cache, { data: { createUnit } }) => {
                    const existingUnits = cache.readQuery<{ findAllUnit: any[] }>({
                        query: GET_ALL_UNITS
                    });

                    if (existingUnits) {
                        cache.writeQuery({
                            query: GET_ALL_UNITS,
                            data: {
                                findAllUnit: [...existingUnits.findAllUnit, createUnit]
                            }
                        });
                    }
                }
            });

            if (data.createUnit) {
                message.success('单位添加成功');
                setUnitModalVisible(false);
                unitForm.resetFields();
                refetchAllUsers();
            }
        } catch (error) {
            message.error('添加失败: ' + error.message);
        }
    };

    // 更新单位
    const handleUpdateUnit = async (values: any) => {
        try {
            const unitId = parseInt(values.id);
            const updateUnitDto = {
                unitCode: values.unitCode,
                unitName: values.unitName,
                userIds: values.userIds || [] // 更新用户关联
            };

            const { data } = await updateUnit({
                variables: {
                    id: unitId,
                    updateUnitDto: updateUnitDto
                },
                update: (cache, { data: { updateUnit } }) => {
                    const existingUnits = cache.readQuery<{ findAllUnit: any[] }>({
                        query: GET_ALL_UNITS
                    });

                    if (existingUnits) {
                        cache.writeQuery({
                            query: GET_ALL_UNITS,
                            data: {
                                findAllUnit: existingUnits.findAllUnit.map(unit =>
                                    unit.id === updateUnit.id ? updateUnit : unit
                                )
                            }
                        });
                    }
                }
            });

            if (data?.updateUnit) {
                message.success('单位更新成功');
                setUnitModalVisible(false);
                unitForm.resetFields();
                refetchAllUsers();
            }
        } catch (error) {
            message.error(`更新失败: ${error.message}`);
        }
    };


    // 删除单位处理
    const handleDeleteUnit = async (id: number) => {
        try {
            // 显示加载状态
            setConfirmLoading(true);
            const { data } = await deleteUnit({
                variables: { id: Number(id) },
                update: (cache) => {
                    // 读取当前缓存数据
                    const existingData = cache.readQuery<{ findAllUnit: Unit[] }>({
                        query: GET_ALL_UNITS
                    });

                    if (existingData) {
                        // 更新缓存数据
                        cache.writeQuery({
                            query: GET_ALL_UNITS,
                            data: {
                                findAllUnit: existingData.findAllUnit.filter(unit => unit.id !== id)
                            }
                        });
                    }
                },
                // 强制重新获取数据
                refetchQueries: [{ query: GET_ALL_UNITS }]
            });

            if (data?.deleteUnit) {
                message.success('删除成功');

                // 可选：如果refetchQueries未生效，手动更新本地状态
                setUnits(prevUnits => prevUnits.filter(unit => unit.id !== id));
                setFilteredUnits(prevFiltered => prevFiltered.filter(unit => unit.id !== id));
            } else {
                message.error('删除失败');
            }
        } catch (error) {
            console.error('删除单位错误:', error);
            message.error('删除失败: ' + error.message);
        } finally {
            setConfirmLoading(false);
        }
    };

    // 显示添加单位模态框
    const showUnitModal = () => {
        setUnitModalVisible(true);
        setEditingUnit(null);
        unitForm.resetFields();
    };

    // 处理单位模态框确认
    const handleUnitOk = async () => {
        try {
            setConfirmLoading(true);
            await unitForm.submit();
            setConfirmLoading(false);
        } catch (error) {
            console.error('表单验证失败:', error);
            setConfirmLoading(false);
        }
    };

    // 处理单位模态框取消
    const handleUnitCancel = () => {
        setUnitModalVisible(false);
        unitForm.resetFields();
    };

    // 编辑单位
    const handleEditUnit = (unit: any) => {
        setEditingUnit(unit);
        setUnitModalVisible(true);

        unitForm.setFieldsValue({
            id: unit.id,
            unitCode: unit.unitCode,
            unitName: unit.unitName,
            userIds: unit.users ? unit.users.map((user: any) => user.id) : []
        });
    };

    // 单位数据变化监听
    useEffect(() => {
        if (allUnitsData?.findAllUnit) {
            setUnits(allUnitsData.findAllUnit);

            if (unitSearchTerm.trim() !== '') {
                const filtered = allUnitsData.findAllUnit.filter(unit =>
                    unit.unitCode.toLowerCase().includes(unitSearchTerm.toLowerCase()) ||
                    unit.unitName.toLowerCase().includes(unitSearchTerm.toLowerCase())
                );
                setFilteredUnits(filtered);
            } else {
                setFilteredUnits(allUnitsData.findAllUnit);
            }
        }
    }, [allUnitsData, unitSearchTerm]);
    // 用户搜索状态管理
    const [searchCondition, setSearchCondition] = useState<{
        username: string;
        uuid: string;
        isSearching: boolean;
    }>({
        uuid: '',
        username: '',
        isSearching: false,
    });

    // 保存搜索条件的ref，避免闭包问题
    const searchConditionRef = useRef(searchCondition);
    useEffect(() => {
        searchConditionRef.current = searchCondition;
    }, [searchCondition]);

    // 分页状态管理
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    // 获取全部用户
    const {
        loading: allUserLoading,
        data: allUserData,
        refetch: refetchAllUsers,
    } = useQuery(GET_ALL_USERS, {
        variables: {
            page: pagination.current,
            pageSize: pagination.pageSize
        },
        skip: searchCondition.isSearching && (
            searchCondition.username.trim() !== '' ||
            searchCondition.uuid.trim() !== ''
        ),
        fetchPolicy: 'cache-and-network',
        nextFetchPolicy: 'cache-first',
        onCompleted: (data) => {
            if (data?.getAllUser) {
                setPagination(prev => ({
                    ...prev,
                    total: data.getAllUser.total
                }));
            }
        }
    });

    // 按名称搜索
    const {
        loading: nameLoading,
        data: nameData,
        error: nameError,
        refetch: refetchName
    } = useQuery(SEARCH_BY_NAME, {
        variables: {
            username: searchCondition.username.trim(),
            page: pagination.current,
            pageSize: pagination.pageSize
        },
        skip: !searchCondition.isSearching || !searchCondition.username.trim(),
        onCompleted: (data) => {
            if (data?.getUserByName) {
                setPagination(prev => ({
                    ...prev,
                    total: data.getUserByName.total
                }));
            }
        }
    });

    // 按UUID搜索
    const {
        loading: uuidLoading,
        data: uuidData,
        error: uuidError,
        refetch: refetchUuid,
    } = useQuery(SEARCH_BY_UUID, {
        variables: {
            uuid: searchCondition.uuid.trim(),
            page: pagination.current,
            pageSize: pagination.pageSize
        },
        skip: !searchCondition.isSearching || !searchCondition.uuid.trim(),
        onCompleted: (data) => {
            if (data?.getUserByUuid) {
                setPagination(prev => ({
                    ...prev,
                    total: data.getUserByUuid.total
                }));
            }
        }
    });

    // 统一的刷新数据函数
    const refetchData = useCallback(async () => {
        const currentCondition = searchConditionRef.current;

        try {
            if (currentCondition.isSearching) {
                if (currentCondition.username.trim()) {
                    await refetchName({
                        username: currentCondition.username.trim(),
                        page: pagination.current,
                        pageSize: pagination.pageSize,
                        fetchPolicy: 'network-only'
                    });
                } else if (currentCondition.uuid.trim()) {
                    await refetchUuid({
                        uuid: currentCondition.uuid.trim(),
                        page: pagination.current,
                        pageSize: pagination.pageSize,
                        fetchPolicy: 'network-only'
                    });
                }
            } else {
                await refetchAllUsers({
                    page: pagination.current,
                    pageSize: pagination.pageSize,
                    fetchPolicy: 'network-only'
                });
            }
        } catch (error) {
            console.error('刷新数据失败:', error);
            message.error('刷新数据失败');
        }
    }, [pagination, refetchAllUsers, refetchName, refetchUuid]);

    // 处理输入框变化
    const handleInputChange = (field: string, value: string) => {
        setInputValues(pre => ({
            ...pre,
            [field]: value
        }));
    };

    // 处理搜索提交
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setSearchCondition({
            username: inputValues.username,
            uuid: inputValues.uuid,
            isSearching: true
        });
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    // 重置搜索
    const handleResetSearch = () => {
        setInputValues({
            username: '',
            uuid: ''
        });
        setSearchCondition({
            username: '',
            uuid: '',
            isSearching: false
        });
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    // 获取当前显示的用户数据
    const getCurrentUsers = () => {
        if (searchCondition.isSearching) {
            if (searchCondition.username.trim()) {
                return nameData?.getUserByName?.users || [];
            } else if (searchCondition.uuid.trim()) {
                return uuidData?.getUserByUuid?.users || [];
            }
        }
        return allUserData?.getAllUser?.users || [];
    };

    const usersToDisplay = getCurrentUsers();
    const loading = nameLoading || allUserLoading || uuidLoading;

    // 添加用户
    const onFinish = async (values: any) => {
        try {
            const unitId = values.unitId ? parseInt(values.unitId, 10) : null;
            const skillIds = values.skillIds?.length ? values.skillIds.map(Number) : [];
            const createUserDto = {
                username: values.username,
                uuid: values.uuid,
                password: values.password,
                address: values.address,
                gender: values.gender,
                isEnable: values.isEnable === 'true',
                phone: values.phone,
                age: values.age,
                unitId: unitId,
                skillIds: skillIds
            };
            const { data, errors } = await createUser({ variables: { createUserDto } });

            if (errors) {
                const isUuidConflict = errors.some(err =>
                    err.message.includes('UUID已存在') ||
                    err.message.includes('昵称被占用了') ||
                    err.message.includes('23505')
                );

                if (isUuidConflict) {
                    message.error('该昵称已被使用,请更换后重试');
                    form.setFields([{
                        name: 'uuid',
                        errors: ['该昵称已被使用!']
                    }]);
                    return;
                }
                message.error(`添加失败: ${errors[0].message}`);
                return;
            }

            if (data.createUser) {
                message.success('用户添加成功');
                setOpen(false);
                form.resetFields();
                refetchAllSkills();
                refetchAllUnits();
                // 检查新用户是否匹配当前搜索条件
                const currentCondition = searchConditionRef.current;
                const newUser = data.createUser;
                const matchesSearch =
                    (currentCondition.username && newUser.username.includes(currentCondition.username)) ||
                    (currentCondition.uuid && newUser.uuid.includes(currentCondition.uuid));

                // 如果匹配当前搜索条件或没有搜索条件，刷新数据
                if (matchesSearch || !currentCondition.isSearching) {
                    refetchData();
                }
            } else {
                message.error('昵称重复');
            }
        } catch (error) {
            alert(error.message + ",请更换后重试");
            console.error('完整错误详情:', {
                message: error.message,
                graphQLErrors: error.graphQLErrors,
                networkError: error.networkError
            });
        }
    };

    // 显示添加用户模态框
    const showModal = () => {
        setOpen(true);
    };

    // 处理模态框确定
    const handleOk = async () => {
        try {
            setConfirmLoading(true);
            await form.submit();
        } catch (error) {
            console.error('表单验证失败:', error);
        } finally {
            setConfirmLoading(false);
        }
    };

    // 处理模态框取消
    const handleCancel = () => {
        setOpen(false);
    };

    // 折叠状态管理
    const [collapsed, setCollapsed] = useState(false);
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    const [refreshKey, setRefreshKey] = useState(0);
    // 删除用户
    const [deleteUserMutation] = useMutation(DELETE_USER, {
        update: (cache, { data: { deleteUser } }) => {
            // 1. 手动更新缓存
            cache.modify({
                fields: {
                    getAllUser(existingUsers = [], { readField }) {
                        return existingUsers.filter(
                            userRef => deleteUser.id !== readField('id', userRef)
                        );
                    },
                },
            });

            // 2. 更新分页总数
            cache.modify({
                fields: {
                    getAllUserMeta(existingMeta = { total: 0 }) {
                        return { ...existingMeta, total: existingMeta.total - 1 };
                    },
                },
            });
        },
    });

    const handleDeleteUser = async (id: number) => {
        try {
            message.loading('正在删除用户...', 0);

            await deleteUserMutation({
                variables: { id },
                refetchQueries: [
                    { query: GET_ALL_USERS },
                    { query: GET_ALL_UNITS },
                    { query: GET_ALL_SKILLS }
                ]
            });

            // 强制重新获取数据
            await refetchAllUsers({
                variables: {
                    page: pagination.current,
                    pageSize: pagination.pageSize
                },
                fetchPolicy: 'network-only'
            });

            // 更新刷新键
            setRefreshKey(prev => prev + 1);

            message.destroy();
            message.success('删除成功');
        } catch (error) {
            message.destroy();
            message.error('删除失败: ' + error.message);
        }
    };

    // 处理分页变化
    const handlePaginationChange = (page: number, pageSize: number) => {
        setPagination({
            current: page,
            pageSize,
            total: pagination.total
        });

        if (searchCondition.isSearching) {
            if (searchCondition.username.trim()) {
                refetchName({
                    username: searchCondition.username.trim(),
                    page,
                    pageSize
                });
            } else if (searchCondition.uuid.trim()) {
                refetchUuid({
                    uuid: searchCondition.uuid.trim(),
                    page,
                    pageSize
                });
            }
        } else {
            refetchAllUsers({
                page,
                pageSize
            });
        }
    };

    // 修改用户功能
    const handleEditClick = (user: User) => {
        setEditingUser(user);
        setEditModalVisible(true);

        // 填充表单数据（包括单位）
        editForm.setFieldsValue({
            id: user.id,
            username: user.username,
            uuid: user.uuid,
            address: user.address || '',
            gender: user.gender || 'male',
            isEnable: user.isEnable ? 'true' : 'false',
            phone: user.phone || '',
            age: user.age || '',
            unitId: user.unit?.id || undefined,
            skillIds: user.skills?.map(skill => skill.id) || [],
        });
    };

    const handleEditSubmit = async (values: any) => {
        try {
            const unitId = values.unitId ? parseInt(values.unitId, 10) : null;
            const skillIds = values.skillIds?.length ? values.skillIds.map(Number) : [];
            const userId = parseInt(values.id);
            if (isNaN(userId)) {
                message.error('无效的用户ID');
                return;
            }

            const updateUserDto = {
                username: values.username,
                uuid: values.uuid,
                address: values.address,
                gender: values.gender,
                isEnable: values.isEnable === 'true',
                phone: values.phone,
                age: values.age?.toString(),
                unitId: unitId,
                skillIds: skillIds
            };

            const { data } = await updateUserMutation({
                variables: {
                    id: userId,
                    updateUserDto: updateUserDto
                }
            });

            if (data.updateUser) {
                message.success('用户更新成功');
                setEditModalVisible(false);

                // 使用当前搜索条件刷新数据
                refetchData();
                refetchAllUnits();
                refetchAllSkills();
            }
        } catch (error) {
            const isUuidConflict = error.message.includes('UUID已存在') ||
                error.message.includes('昵称被占用了') ||
                error.message.includes('23505');

            if (isUuidConflict) {
                message.error('该昵称已被使用,请更换后重试');
                editForm.setFields([{
                    name: 'uuid',
                    errors: ['该昵称已被使用!']
                }]);
            } else {
                message.error(`更新失败: ${error.message}`);
            }
        }
    };
    //skill管理
    const [skills, setSkills] = useState<any[]>([]);
    const [skillModalVisible, setSkillModalVisible] = useState(false);
    const [editingSkill, setEditingSkill] = useState<any | null>(null);
    const [skillForm] = Form.useForm();
    const [skillSearchTerm, setSkillSearchTerm] = useState('');
    const [filteredSkills, setFilteredSkills] = useState<any[]>([]);
    const [addSkill] = useMutation(CREATE_SKILL);
    const [updateSkill] = useMutation(UPDATE_SKILL);
    const [deleteSkill] = useMutation(DELETE_SKILL);
    const handleSkillOk = () => {
        skillForm.submit();
    };

    const handleSkillCancel = () => {
        setSkillModalVisible(false);
    };
    // 获取所有技能数据
    const {
        data: allSkillsData,
        loading: allSkillsLoading,
        refetch: refetchAllSkills,
    } = useQuery(GET_ALL_SKILLS, {
        onCompleted: (data) => {
            if (data?.getAllSkills) {
                setSkills(data.getAllSkills);
                setFilteredSkills(data.getAllSkills);
            }
        }
    });

    // 处理技能搜索
    const handleSkillSearch = (value: string) => {
        setSkillSearchTerm(value);
        if (value.trim() === '') {
            setFilteredSkills(skills);
        } else {
            const filtered = skills.filter(skill =>
                skill.name.toLowerCase().includes(value.toLowerCase()) ||
                (skill.description || '').toLowerCase().includes(value.toLowerCase())
            );
            setFilteredSkills(filtered);
        }
    };

    // 添加技能
    const handleAddSkill = async (values: any) => {
        try {
            const createSkillDto = {
                name: values.name,
                description: values.description,
                userIds: values.userIds || [] // 添加用户ID数组
            };

            const { data, errors } = await addSkill({
                variables: { createSkillDto },
                refetchQueries: [{ query: GET_ALL_SKILLS }]
            });

            if (errors) {
                message.error(`添加失败: ${errors[0].message}`);
                return;
            }

            if (data.createSkill) {
                message.success('技能添加成功');
                setSkillModalVisible(false);
                skillForm.resetFields();
                refetchAllSkills();
                refetchAllUsers();
            }
        } catch (error) {
            message.error('添加失败: ' + error.message);
        }
    };

    // 显示添加技能模态框
    const showSkillModal = () => {
        setSkillModalVisible(true);
        setEditingSkill(null);
        skillForm.resetFields();
    };

    // 更新技能
    const handleUpdateSkill = async (values: any) => {
        try {
            const skillId = values.id;
            const updateSkillDto = {
                name: values.name,
                description: values.description,
                userIds: values.userIds || []
            };
            const numericId = Number(skillId)
            const { data } = await updateSkill({
                variables: {
                    id: numericId,
                    updateSkillDto: updateSkillDto
                },
                refetchQueries: [{ query: GET_ALL_SKILLS }, { query: GET_ALL_USERS }]
            });

            if (data.updateSkill) {
                message.success('技能更新成功');
                setSkillModalVisible(false);
                refetchAllSkills();
                refetchAllUsers();
            }
        } catch (error) {
            message.error(`更新失败: ${error.message}`);
        }
    };

    // 删除技能
    const handleDeleteSkill = async (id: number) => {
        try {
            const numericId = Number(id)
            const { data } = await deleteSkill({
                variables: { id: numericId },
                refetchQueries: [{ query: GET_ALL_SKILLS }]
            });

            if (data.deleteSkill) {
                message.success('删除成功');
                refetchAllSkills();
            } else {
                message.error('删除失败');
            }
        } catch (error) {
            message.error('删除失败: ' + error.message);
        }
    };

    // 编辑技能
    const handleEditSkill = (skill: any) => {
        console.log('Editing skill:', skill);
        setEditingSkill(skill);
        setSkillModalVisible(true);
        skillForm.setFieldsValue({
            id: skill.id,
            name: skill.name,
            description: skill.description,
            userIds: skill.users?.map((user: any) => user.id) || []
        });
    };

    // 监听技能数据变化
    useEffect(() => {
        if (allSkillsData?.getAllSkills) {
            setSkills(allSkillsData.getAllSkills);

            // 应用搜索过滤
            if (skillSearchTerm.trim() !== '') {
                const filtered = allSkillsData.getAllSkills.filter(skill =>
                    skill.name.toLowerCase().includes(skillSearchTerm.toLowerCase()) ||
                    (skill.description || '').toLowerCase().includes(skillSearchTerm.toLowerCase())
                );
                setFilteredSkills(filtered);
            } else {
                setFilteredSkills(allSkillsData.getAllSkills);
            }
        }
    }, [allSkillsData, skillSearchTerm]);


    //经历状态管理
    const [experiences, setExperiences] = useState<any[]>([]);
    const [experienceModalVisible, setExperienceModalVisible] = useState(false);
    const [editingExperience, setEditingExperience] = useState<any | null>(null);
    const [experienceForm] = Form.useForm();
    const [addExperience] = useMutation(ADD_EXPERIENCE);
    const [updateExperience] = useMutation(UPDATE_EXPERIENCE);
    const [deleteExperience] = useMutation(DELETE_EXPERIENCE);
    const [experienceSearchTerm, setExperienceSearchTerm] = useState('');
    const [filteredExperiences, setFilteredExperiences] = useState<any[]>([]);

    // 获取所有经历数据
    const {
        data: allExperiencesData,
        loading: allExperiencesLoading,
        refetch: refetchAllExperiences,
    } = useQuery(GET_ALL_EXPERIENCES, {
        onCompleted: (data) => {
            if (data?.findAllExperience) {
                setExperiences(data.findAllExperience);
                setFilteredExperiences(data.findAllExperience);
            }
        }
    });

    // 处理经历搜索
    const handleExperienceSearch = (value: string) => {
        setExperienceSearchTerm(value);
        if (value.trim() === '') {
            setFilteredExperiences(experiences);
        } else {
            const searchValue = value.toLowerCase();
            const filtered = experiences.filter(experience => {
                // 使用正确的字段名并添加空值保护
                const placeName = experience.placeName?.toLowerCase() || '';
                const address = experience.address?.toLowerCase() || '';
                const username = experience.user?.username?.toLowerCase() || '';

                return (
                    placeName.includes(searchValue) ||
                    address.includes(searchValue) ||
                    username.includes(searchValue)
                );
            });
            setFilteredExperiences(filtered);
        }
    };
    useEffect(() => {
        console.log('搜索词:', experienceSearchTerm);
        console.log('过滤后经历数:', filteredExperiences.length);
    }, [experienceSearchTerm, filteredExperiences]);
    // 添加经历
    const handleAddExperience = async (values: any) => {
        try {
            const createExperienceDto = {
                placeName: values.placeName,
                address: values.address,
                startDate: values.startDate,
                endDate: values.endDate,
                userId: parseInt(values.userId),
            };

            const { data, errors } = await addExperience({ variables: { createExperienceDto } });

            if (errors) {
                message.error(`添加失败: ${errors[0].message}`);
                return;
            }

            if (data.createExperience) {
                message.success('经历添加成功');
                setExperienceModalVisible(false);
                experienceForm.resetFields();
                refetchAllExperiences();
            }
        } catch (error) {
            message.error('添加失败: ' + error.message);
            console.error('添加经历错误:', error);
        }
    };

    // 显示添加经历模态框
    const showExperienceModal = () => {
        setExperienceModalVisible(true);
        setEditingExperience(null);
        experienceForm.resetFields();
    };

    // 处理经历模态框确认
    const handleExperienceOk = async () => {
        try {
            await experienceForm.submit();
        } catch (error) {
            console.error('表单验证失败:', error);
        }
    };

    // 处理经历模态框取消
    const handleExperienceCancel = () => {
        setExperienceModalVisible(false);
    };

    // 编辑经历
    const handleEditExperience = (experience: any) => {
        setEditingExperience(experience);
        setExperienceModalVisible(true);
        experienceForm.setFieldsValue({
            id: experience.id,
            placeName: experience.placeName,
            address: experience.address,
            startDate: experience.startDate,
            endDate: experience.endDate,
            userId: experience.userId,
        });
    };

    // 更新经历
    const handleUpdateExperience = async (values: any) => {
        try {
            const experienceId = values.id;

            // 检查userId是否存在且为有效数字
            if (!values.userId) {
                message.error('请选择有效的用户');
                return;
            }

            // 使用Number()进行更严格的类型转换
            const userId = Number(values.userId);

            // 验证转换结果是否为有效数字
            if (isNaN(userId) || !Number.isInteger(userId)) {
                message.error('用户ID无效，请选择正确的用户');
                return;
            }

            const updateExperienceDto = {
                placeName: values.placeName,
                address: values.address,
                startDate: values.startDate,
                endDate: values.endDate,
                userId: userId,
            };
            console.log('更新经历ID:', experienceId);
            console.log('用户ID:', userId);
            console.log('Sending updateExperienceDto:', updateExperienceDto);
            const { data } = await updateExperience({
                variables: {
                    id: experienceId,
                    updateExperienceDto: updateExperienceDto
                }
            });

            if (data.updateExperience) {
                message.success('经历更新成功');
                setExperienceModalVisible(false);
                refetchAllExperiences();
            }
        } catch (error) {
            message.error(`更新失败: ${error.message}`);
            console.error('更新经历错误:', error);
        }
    };
    useEffect(() => {
        console.log('所有经历ID:', experiences.map(exp => exp.id));
    }, [experiences]);
    // 删除经历
    const handleDeleteExperience = async (id: number) => {
        try {
            const { data } = await deleteExperience({ variables: { id: id.toString() } });

            if (data.deleteExperience) {
                message.success('删除成功');
                refetchAllExperiences();
            } else {
                message.error('删除失败');
            }
        } catch (error) {
            message.error('删除失败: ' + error.message);
        }
    };

    // 监听经历数据变化
    useEffect(() => {
        if (allExperiencesData?.findAllExperience) {
            setExperiences(allExperiencesData.findAllExperience);

            if (experienceSearchTerm.trim() !== '') {
                const filtered = allExperiencesData.findAllExperience.filter(experience => {
                    // 使用正确的字段名 placeName 和 address
                    const placeName = experience.placeName?.toLowerCase() || '';
                    const address = experience.address?.toLowerCase() || '';
                    const username = experience.user?.username?.toLowerCase() || '';
                    const searchValue = experienceSearchTerm.toLowerCase();

                    return (
                        placeName.includes(searchValue) ||
                        address.includes(searchValue) ||
                        username.includes(searchValue)
                    );
                });
                setFilteredExperiences(filtered);
            } else {
                setFilteredExperiences(allExperiencesData.findAllExperience);
            }
        }
    }, [allExperiencesData, experienceSearchTerm]);
    // 调试日志
    useEffect(() => {
        console.log("搜索条件:", searchCondition);
        console.log("全部用户数据:", allUserData);
        console.log("搜索结果数据:", nameData);
        console.log("搜索结果数据:", uuidData);
        console.log("分页状态:", pagination);
    }, [searchCondition, allUserData, nameData, uuidData, pagination]);

    // 单位数据调试日志
    useEffect(() => {
        console.log('单位数据:', allUnitsData);
        console.log('过滤后单位数据:', filteredUnits);
        console.log('单位搜索词:', unitSearchTerm);
    }, [allUnitsData, filteredUnits, unitSearchTerm]);

    useEffect(() => {
        console.log('经历数据:', allExperiencesData);
        console.log('过滤后经历数据:', filteredExperiences);
        console.log('经历搜索词:', experienceSearchTerm);
    }, [allExperiencesData, filteredExperiences, experienceSearchTerm]);
    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme='light'>
                <div className="demo-logo-vertical" />
                <Menu
                    onClick={handleMenuClick}
                    theme="light"
                    selectedKeys={selectedKeys}
                    mode="inline"
                    items={items}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer, backgroundColor: "#1C9A91" }} />
                <Content style={{ margin: '0 16px' }}>
                    <div style={{ padding: 24, minHeight: 700, background: colorBgContainer, borderRadius: borderRadiusLG }}>
                        {/* 路由容器 */}
                        <Routes>
                            <Route
                                path={ROUTE_PATHS.USER_MANAGEMENT}
                                element={
                                    <UserManagement
                                        inputValues={inputValues}
                                        handleInputChange={handleInputChange}
                                        handleSearch={handleSearch}
                                        handleResetSearch={handleResetSearch}
                                        usersToDisplay={usersToDisplay}
                                        loading={loading}
                                        handleDeleteUser={handleDeleteUser}
                                        handleEditClick={handleEditClick}
                                        pagination={pagination}
                                        handlePaginationChange={handlePaginationChange}
                                        showModal={showModal}
                                        nameError={nameError}
                                        uuidError={uuidError}
                                        searchCondition={searchCondition}
                                        units={units} regionTreeData={undefined} />
                                }
                            />
                            <Route
                                path={ROUTE_PATHS.UNIT_MANAGEMENT}
                                element={
                                    <UnitManagement
                                        searchTerm={unitSearchTerm}
                                        handleSearch={handleUnitSearch}
                                        unitsToDisplay={filteredUnits}
                                        loading={allUnitsLoading}
                                        handleDeleteUnit={handleDeleteUnit}
                                        handleEditClick={handleEditUnit}
                                        showUnitModal={showUnitModal}
                                        refetchAllUnits={refetchAllUnits}
                                    />
                                }
                            />
                            <Route
                                path={ROUTE_PATHS.SKILL_MANAGEMENT}
                                element={
                                    <SkillManagement
                                        searchTerm={skillSearchTerm}
                                        setSearchTerm={setSkillSearchTerm}
                                        handleSearch={handleSkillSearch}
                                        allSkills={skills}
                                        filteredSkills={filteredSkills}
                                        loading={allSkillsLoading}
                                        onDelete={handleDeleteSkill}
                                        onEdit={handleEditSkill}
                                        showModal={showSkillModal}
                                    />
                                }
                            />
                            <Route
                                path={ROUTE_PATHS.EXPERIENCE_MANAGEMENT}
                                element={<ExperienceManagement
                                    searchTerm={experienceSearchTerm}
                                    setSearchTerm={setExperienceSearchTerm}
                                    handleSearch={handleExperienceSearch}
                                    experiencesToDisplay={filteredExperiences}
                                    loading={allExperiencesLoading}
                                    handleDeleteExperience={handleDeleteExperience}
                                    handleEditClick={handleEditExperience}
                                    showModal={showExperienceModal}
                                    users={allUserData?.getAllUser?.users || []} regionTreeData={undefined} />}
                            />
                            {/* 默认重定向到用户管理 */}
                            <Route
                                index
                                element={<Navigate to={ROUTE_PATHS.USER_MANAGEMENT} replace />}
                            />
                            {/* 捕获所有未匹配的路由 */}
                            <Route
                                path="*"
                                element={<Navigate to={ROUTE_PATHS.USER_MANAGEMENT} replace />}
                            />
                        </Routes>
                    </div>
                </Content>
                {/* <Footer style={{ textAlign: 'center' }}>
                    Ant Design ©{new Date().getFullYear()} Created by Ant UED
                </Footer> */}
            </Layout>

            {/* 添加用户模态框 */}
            <Modal
                title="添加用户"
                open={open}
                onOk={handleOk}
                confirmLoading={confirmLoading}
                onCancel={handleCancel}
            >
                <Form
                    {...formItemLayout}
                    form={form}
                    name="register"
                    onFinish={onFinish}
                    style={{ maxWidth: 600 }}
                    scrollToFirstError
                >
                    <Form.Item
                        name="username"
                        label="用户名"
                        rules={[{ required: true, message: '请输入你的真实姓名!', whitespace: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="uuid"
                        label="昵称"
                        rules={[{ required: true, message: '请输入你的昵称!', whitespace: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label="密码"
                        rules={[
                            {
                                required: true,
                                message: '请输入你的密码!',
                            }, {
                                min: 6,
                                message: '密码长度至少为6位',
                            }
                        ]}
                        hasFeedback
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item
                        name="confirm"
                        label="确认密码"
                        dependencies={['password']}
                        hasFeedback
                        rules={[
                            {
                                required: true,
                                message: '请确认密码一致!',
                            },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('两次密码输入不一致!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item
                        name="age"
                        label="年龄"
                        rules={[{ required: true, message: '请输入你的年龄!' }]}
                    >
                        <Input style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="address"
                        label="地址"
                        rules={[{ message: '请选择省市区!' }]}
                        getValueFromEvent={handleAddressChange}
                    >
                        <Cascader
                            options={regionData}
                            placeholder="请选择省市区"
                            changeOnSelect
                        />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="电话"
                        rules={[{ required: true, message: '请输入你的电话号!' }]}
                    >
                        <Input style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="gender"
                        label="性别"
                        rules={[{ required: true, message: '请选择性别!' }]}
                    >
                        <Select placeholder="选择性别">
                            <Option value="male">男</Option>
                            <Option value="female">女</Option>
                        </Select>
                    </Form.Item>
                    {/* 单位选择器 */}
                    <Form.Item
                        name="unitId"
                        label="单位"
                        rules={[{ required: true, message: '请选择单位!' }]}
                    >
                        <Select placeholder="请选择单位">
                            {units.map(unit => (
                                <Option key={unit.id} value={unit.id}>
                                    {unit.unitName}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {/*技能选择器*/}
                    <Form.Item
                        name="skillIds"
                        label="绑定技能"
                        rules={[
                            { type: 'array', message: '技能必须为数组格式' },  // 仅验证格式
                        ]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="请选择技能（可多选，非必填）"
                            showSearch
                        >
                            {skills.map(skill => (
                                <Option key={skill.id} value={skill.id}>{skill.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="isEnable"
                        label="是否启用"
                        rules={[{ required: true, message: '请选择状态!' }]}
                    >
                        <Select placeholder="选择状态">
                            <Option value="true">启用</Option>
                            <Option value="false">禁用</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="agreement"
                        valuePropName="checked"
                        rules={[
                            {
                                validator: (_, value) =>
                                    value ? Promise.resolve() : Promise.reject(new Error('请同意协议')),
                            },
                        ]}
                        {...tailFormItemLayout}
                    >
                        <Checkbox>
                            我已阅读并同意 <a href="">用户协议</a>
                        </Checkbox>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 修改用户模态框 */}
            <Modal
                title="修改用户"
                open={editModalVisible}
                onOk={() => editForm.submit()}
                confirmLoading={confirmLoading}
                onCancel={() => setEditModalVisible(false)}
            >
                <Form
                    {...formItemLayout}
                    form={editForm}
                    name="editUser"
                    onFinish={handleEditSubmit}
                    style={{ maxWidth: 600 }}
                    scrollToFirstError
                >
                    <Form.Item name="id" hidden>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="username"
                        label="姓名"
                        rules={[{ required: true, message: '请输入姓名!', whitespace: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="uuid"
                        label="昵称"
                        rules={[{ required: true, message: '请输入昵称!', whitespace: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="age"
                        label="年龄"
                        rules={[{ required: true, message: '请输入年龄!' }]}
                    >
                        <Input style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="address"
                        label="地址"
                        rules={[{ message: '请选择省市区!' }]}
                        getValueFromEvent={handleAddressChange}
                    >
                        <Cascader
                            options={regionData}
                            placeholder="请选择省市区"
                            changeOnSelect
                        />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="电话"
                        rules={[{ required: true, message: '请输入电话号!' }]}
                    >
                        <Input style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="gender"
                        label="性别"
                        rules={[{ required: true, message: '请选择性别!' }]}
                    >
                        <Select placeholder="选择性别">
                            <Option value="male">男</Option>
                            <Option value="female">女</Option>
                        </Select>
                    </Form.Item>
                    {/* 单位选择器 */}
                    <Form.Item
                        name="unitId"
                        label="单位"
                        rules={[{ required: true, message: '请选择单位!' }]}
                    >
                        <Select placeholder="请选择单位">
                            {units.map(unit => (
                                <Option key={unit.id} value={unit.id}>
                                    {unit.unitName}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {/*技能选择器*/}
                    <Form.Item
                        name="skillIds"
                        label="绑定技能"
                        rules={[
                            { type: 'array', message: '技能必须为数组格式' },
                        ]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="请选择技能（可多选，非必填）"
                            showSearch
                        >
                            {skills.map(skill => (
                                <Option key={skill.id} value={skill.id}>{skill.name}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item
                        name="isEnable"
                        label="是否启用"
                        rules={[{ required: true, message: '请选择状态!' }]}
                    >
                        <Select placeholder="选择状态">
                            <Option value="true">启用</Option>
                            <Option value="false">禁用</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 添加或修改单位模态框 */}
            <Modal
                title={editingUnit ? '修改单位' : '添加单位'}
                open={unitModalVisible}
                onOk={handleUnitOk}
                onCancel={handleUnitCancel}
                confirmLoading={confirmLoading}
                destroyOnClose
            >
                <Form
                    form={unitForm}
                    onFinish={editingUnit ? handleUpdateUnit : handleAddUnit}
                    layout="vertical"
                >
                    <Form.Item name="id" hidden>
                        <Input />
                    </Form.Item>

                    {editingUnit ? (
                        <Form.Item name="unitCode" label="单位编码">
                            <Input readOnly value={editingUnit.unitCode} />
                        </Form.Item>
                    ) : (
                        <Form.Item
                            name="unitCode"
                            label="单位编码"
                            rules={[
                                { required: true, message: '请输入单位编码' },
                                {
                                    validator: (_, value) => {
                                        if (units.some(u => u.unitCode === value)) {
                                            return Promise.reject('该编码已存在');
                                        }
                                        return Promise.resolve();
                                    }
                                }
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="unitName"
                        label="单位名称"
                        rules={[{ required: true, message: '请输入单位名称' }]}
                    >
                        <Input />
                    </Form.Item>

                    {/* 新增关联用户选择器 */}
                    <Form.Item
                        name="userIds"
                        label="关联用户"
                    >
                        <Select
                            mode="multiple"
                            placeholder="请选择关联用户"
                            optionFilterProp="children"
                            showSearch
                            filterOption={(input, option) =>
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                            }
                            loading={allUserLoading}
                            notFoundContent={allUserLoading ? "加载中..." : "暂无用户数据"}
                        >
                            {(allUserData?.getAllUser?.users || []).map(user => (
                                <Option key={user.id} value={user.id}>
                                    {user.username}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 添加或修改经历模态框 */}
            <Modal
                title={editingExperience ? '修改经历' : '添加经历'}
                open={experienceModalVisible}
                onOk={handleExperienceOk}
                onCancel={handleExperienceCancel}
                confirmLoading={confirmLoading}
                destroyOnClose
            >
                <Form
                    form={experienceForm}
                    onFinish={editingExperience ? handleUpdateExperience : handleAddExperience}
                    layout="vertical"
                >
                    <Form.Item name="id" hidden>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="placeName"
                        label="地点名称"
                        rules={[{ required: true, message: '请输入经历标题' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="address"
                        label="地址"
                        rules={[{ message: '请选择省市区!' }]}
                        getValueFromEvent={handleAddressChange}
                    >
                        <Cascader
                            options={regionData}
                            placeholder="请选择省市区"
                            changeOnSelect
                        />
                    </Form.Item>
                    <Form.Item
                        name="startDate"
                        label="开始日期"
                        rules={[{ required: true, message: '请选择开始日期' }]}
                    >
                        <Input placeholder="YYYY-MM-DD" />
                    </Form.Item>
                    <Form.Item
                        name="endDate"
                        label="结束日期"
                        rules={[{ required: true, message: '请选择结束日期' }]}
                    >
                        <Input placeholder="YYYY-MM-DD" />
                    </Form.Item>
                    <Form.Item
                        name="userId"
                        label="所属用户"
                        rules={[{ required: true, message: '请选择所属用户' }]}
                    >
                        <Select placeholder="请选择用户">
                            {allUserData?.getAllUser?.users.map(user => (
                                <Option key={user.id} value={user.id}>
                                    {user.username}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* 添加或修改技能模态框 */}
            <Modal
                title={editingSkill ? '修改技能' : '添加技能'}
                open={skillModalVisible}
                onOk={handleSkillOk}
                onCancel={handleSkillCancel}
                confirmLoading={confirmLoading}
                destroyOnClose
            >
                <Form
                    form={skillForm}
                    onFinish={editingSkill ? handleUpdateSkill : handleAddSkill}
                    layout="vertical"
                >
                    <Form.Item name="id" hidden>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="name" // 确保字段名是 "name" 而不是 "技能名称"
                        label="技能名称"
                        rules={[{ required: true, message: '请输入技能名称' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="description" // 确保字段名是 "description" 而不是 "技能描述"
                        label="技能描述"
                        rules={[{ required: true, message: '请输入技能描述' }]}
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    <Form.Item
                        name="userIds"
                        label="关联用户"
                    >
                        <Select
                            mode="multiple"
                            placeholder="请选择关联用户"
                            optionFilterProp="children"
                            showSearch
                            filterOption={(input, option) =>
                                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
                            }
                            loading={allUserLoading}
                            notFoundContent={allUserLoading ? "加载中..." : "暂无用户数据"}
                        >
                            {(allUserData?.getAllUser?.users || []).map(user => (
                                <Option key={user.id} value={user.id}>
                                    {user.username}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

        </Layout>
    );
};

export default Round;