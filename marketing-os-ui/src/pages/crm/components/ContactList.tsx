import { useState } from 'react';
import { Table, Space, Button, Input, Tag, Avatar } from 'antd';
import { UserOutlined, SearchOutlined, MessageOutlined, PhoneOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { crmApi } from '../../../api/crm';
import type { Contact } from '../../../api/crm';
import { useResponsive } from '../../../hooks/useResponsive';

export default function ContactList() {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const { isMobile } = useResponsive();

    // We can add debounce here later
    const { data: contacts, isLoading } = useQuery({
        queryKey: ['crm-contacts', search],
        queryFn: () => crmApi.getContacts({ search })
    });

    const columns = [
        {
            title: 'Name',
            key: 'name',
            render: (_: any, record: Contact) => (
                <Space>
                    <Avatar icon={<UserOutlined />} src={record.whatsapp ? undefined : undefined} />
                    <a onClick={() => navigate(`/crm/contacts/${record.id}`)}>{record.firstName} {record.lastName}</a>
                </Space>
            ),
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            render: (phone: string) => phone ? <Space><PhoneOutlined /> {phone}</Space> : '-',
        },
        {
            title: 'WhatsApp',
            dataIndex: 'whatsapp',
            key: 'whatsapp',
            render: (wa: string) => wa ? <Tag color="green"><MessageOutlined /> {wa}</Tag> : <Tag>None</Tag>,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            responsive: ['md'] as any,
        },
        {
            title: 'Tags',
            dataIndex: 'tags',
            key: 'tags',
            render: (tags: string[]) => (
                <>
                    {tags?.map(tag => (
                        <Tag key={tag} color="blue">{tag}</Tag>
                    ))}
                </>
            ),
        },
        {
            title: 'Created',
            dataIndex: 'createdAt',
            key: 'createdAt',
            responsive: ['lg'] as any,
            render: (date: string) => new Date(date).toLocaleDateString(),
        }
    ];

    return (
        <div>
            <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} wrap>
                <Input
                    prefix={<SearchOutlined />}
                    placeholder={isMobile ? 'Search...' : 'Search contacts by name, phone, or email...'}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    style={{ width: isMobile ? '100%' : 300 }}
                    allowClear
                />
                <Button type="primary" onClick={() => navigate('/crm/contacts/new')}>{isMobile ? 'Add' : 'Add Contact'}</Button>
            </Space>
            <div className="responsive-table-wrapper">
                <Table
                    columns={columns}
                    dataSource={Array.isArray(contacts) ? contacts : []}
                    rowKey="id"
                    loading={isLoading}
                    pagination={{ pageSize: 10 }}
                    size={isMobile ? 'small' : 'middle'}
                />
            </div>
        </div>
    );
}
