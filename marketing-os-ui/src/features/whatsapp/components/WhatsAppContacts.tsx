// WhatsAppContacts.tsx — pure render shell.
// All logic lives in hooks/useContacts.ts

import React from 'react';
import { Tag, Input, Button, Space, Typography, Table, Drawer, List, Avatar } from 'antd';
import { SearchOutlined, UserOutlined, FilterOutlined, WhatsAppOutlined, EyeOutlined } from '@ant-design/icons';
import { useContacts } from '../hooks/useContacts';

const { Title, Text } = Typography;

const WhatsAppContacts: React.FC = () => {
    const { searchText, setSearchText, selectedContact, setSelectedContact, contacts } = useContacts();

    const columns = [
        { title: 'Name', dataIndex: 'name', key: 'name', render: (text: string) => <Text strong>{text}</Text> },
        {
            title: 'Phone Number', dataIndex: 'phone', key: 'phone',
            render: (text: string) => <Space><WhatsAppOutlined style={{ color: '#25D366' }} />{text}</Space>,
        },
        {
            title: 'Status', dataIndex: 'status', key: 'status',
            render: (status: string) => <Tag color={status === 'OPTED_IN' ? 'success' : 'error'}>{status.replace('_', ' ')}</Tag>,
        },
        { title: 'Source', dataIndex: 'source', key: 'source', render: (source: string) => <Tag>{source}</Tag> },
        {
            title: 'Tags', dataIndex: 'tags', key: 'tags',
            render: (tags: string[]) => <>{tags.map(tag => <Tag key={tag} color="blue">{tag}</Tag>)}</>,
        },
        { title: 'Opt-in Date', dataIndex: 'optInDate', key: 'optInDate', render: (date: string) => new Date(date).toLocaleDateString() },
        {
            title: 'Action', key: 'action',
            render: (_: any, record: any) => (
                <Button size="small" icon={<EyeOutlined />} onClick={() => setSelectedContact(record)}>View</Button>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <Title level={4}>WhatsApp Contacts</Title>
                <Space>
                    <Input
                        placeholder="Search by phone..."
                        prefix={<SearchOutlined />}
                        style={{ width: 250 }}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                    />
                    <Button icon={<FilterOutlined />}>Filter</Button>
                </Space>
            </div>

            <Table columns={columns} dataSource={contacts} rowKey="id" pagination={{ pageSize: 10 }} />

            <Drawer
                title="Contact Details"
                placement="right"
                onClose={() => setSelectedContact(null)}
                open={!!selectedContact}
                width={400}
            >
                {selectedContact && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <Avatar size={64} icon={<UserOutlined />} style={{ backgroundColor: '#87d068', marginBottom: 12 }} />
                            <Title level={4} style={{ margin: 0 }}>{selectedContact.name}</Title>
                            <Text type="secondary">{selectedContact.phone}</Text>
                        </div>
                        <List>
                            <List.Item>
                                <List.Item.Meta title="Status" description={<Tag color={selectedContact.status === 'OPTED_IN' ? 'success' : 'error'}>{selectedContact.status}</Tag>} />
                            </List.Item>
                            <List.Item>
                                <List.Item.Meta title="Tags" description={<Space size={[0, 8]} wrap>{selectedContact.tags.map((tag: string) => <Tag key={tag} color="blue">{tag}</Tag>)}</Space>} />
                            </List.Item>
                            <List.Item><List.Item.Meta title="Source" description={selectedContact.source} /></List.Item>
                            <List.Item><List.Item.Meta title="Opt-in Date" description={new Date(selectedContact.optInDate).toLocaleString()} /></List.Item>
                            <List.Item><List.Item.Meta title="Last Active" description={new Date(selectedContact.lastActive).toLocaleString()} /></List.Item>
                        </List>
                        <div style={{ marginTop: 24 }}>
                            <Button block type="primary" style={{ marginBottom: 12 }}>Start Conversation</Button>
                            <Button block>Edit Contact</Button>
                        </div>
                    </div>
                )}
            </Drawer>
        </div>
    );
};

export default WhatsAppContacts;
