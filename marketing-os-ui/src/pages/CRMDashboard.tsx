import { useMemo, useState } from 'react';
import {
    Badge,
    Button,
    Card,
    Col,
    Divider,
    Drawer,
    Form,
    Input,
    List,
    Modal,
    Row,
    Select,
    Space,
    Statistic,
    Table,
    Tag,
    Typography,
    message,
} from 'antd';
import {
    CalendarOutlined,
    CheckCircleOutlined,
    EditOutlined,
    EyeOutlined,
    MailOutlined,
    MessageOutlined,
    PhoneOutlined,
    PlusOutlined,
    SearchOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { useResponsive } from '../hooks/useResponsive';

const { Title, Text } = Typography;

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'won' | 'lost';

interface FollowUpItem {
    id: string;
    title: string;
    dueDate: string;
    done: boolean;
}

interface LeadRow {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    company: string;
    source: string;
    status: LeadStatus;
    score: number;
    assignedTo: string;
    lastContact: string;
    tags: string[];
}

const ASSIGNEES = [
    'Riya Sharma',
    'Kabir Anand',
    'Meera Joshi',
    'Arjun Das',
];

const statusColors: Record<LeadStatus, string> = {
    new: 'blue',
    contacted: 'cyan',
    qualified: 'purple',
    won: 'green',
    lost: 'red',
};
const statusOrder: LeadStatus[] = ['new', 'contacted', 'qualified', 'won', 'lost'];

const formatStatus = (status: LeadStatus) => status.charAt(0).toUpperCase() + status.slice(1);

const defaultNotes = ['Called customer', 'Interested in package', 'Follow up tomorrow'];

const dummyLeads: LeadRow[] = [
    {
        id: 'LD-1001',
        first_name: 'Aarav',
        last_name: 'Mehta',
        email: 'aarav.mehta@skyline.io',
        phone: '+91 98765 43210',
        company: 'Skyline',
        source: 'website',
        status: 'new',
        score: 8,
        assignedTo: 'Riya Sharma',
        lastContact: '2026-02-20',
        tags: ['family trip', 'summer'],
    },
    {
        id: 'LD-1002',
        first_name: 'Neha',
        last_name: 'Kapoor',
        email: 'neha.kapoor@outlook.com',
        phone: '+91 98111 22334',
        company: 'Freelance',
        source: 'referral',
        status: 'new',
        score: 12,
        assignedTo: 'Kabir Anand',
        lastContact: '2026-02-18',
        tags: ['europe', 'premium'],
    },
    {
        id: 'LD-1003',
        first_name: 'Vikram',
        last_name: 'Singh',
        email: 'vikram.singh@zenit.in',
        phone: '+91 99000 12000',
        company: 'Zenit',
        source: 'whatsapp',
        status: 'contacted',
        score: 24,
        assignedTo: 'Riya Sharma',
        lastContact: '2026-02-24',
        tags: ['corporate', 'group booking'],
    },
    {
        id: 'LD-1004',
        first_name: 'Ishita',
        last_name: 'Rao',
        email: 'ishita.rao@gmail.com',
        phone: '+91 98220 55667',
        company: 'Independent',
        source: 'website',
        status: 'contacted',
        score: 31,
        assignedTo: 'Arjun Das',
        lastContact: '2026-02-25',
        tags: ['honeymoon', 'bali'],
    },
    {
        id: 'LD-1005',
        first_name: 'Rahul',
        last_name: 'Nair',
        email: 'rahul.nair@bluepeak.net',
        phone: '+91 98888 77665',
        company: 'BluePeak',
        source: 'referral',
        status: 'qualified',
        score: 55,
        assignedTo: 'Kabir Anand',
        lastContact: '2026-02-26',
        tags: ['adventure', 'trek'],
    },
    {
        id: 'LD-1006',
        first_name: 'Priya',
        last_name: 'Bansal',
        email: 'priya.bansal@yahoo.com',
        phone: '+91 97771 88990',
        company: 'Atlas',
        source: 'whatsapp',
        status: 'qualified',
        score: 62,
        assignedTo: 'Meera Joshi',
        lastContact: '2026-02-27',
        tags: ['international', 'visa support'],
    },
    {
        id: 'LD-1007',
        first_name: 'Omkar',
        last_name: 'Patil',
        email: 'omkar.patil@gmail.com',
        phone: '+91 99123 45678',
        company: 'Patil Group',
        source: 'website',
        status: 'won',
        score: 82,
        assignedTo: 'Arjun Das',
        lastContact: '2026-02-22',
        tags: ['kashmir', 'family'],
    },
    {
        id: 'LD-1008',
        first_name: 'Sana',
        last_name: 'Ali',
        email: 'sana.ali@northstar.com',
        phone: '+91 99345 11223',
        company: 'Northstar',
        source: 'referral',
        status: 'won',
        score: 91,
        assignedTo: 'Meera Joshi',
        lastContact: '2026-02-21',
        tags: ['luxury', 'dubai'],
    },
    {
        id: 'LD-1009',
        first_name: 'Karan',
        last_name: 'Verma',
        email: 'karan.verma@zylinx.com',
        phone: '+91 98989 66778',
        company: 'Zylinx',
        source: 'website',
        status: 'lost',
        score: 17,
        assignedTo: 'Riya Sharma',
        lastContact: '2026-02-15',
        tags: ['budget', 'domestic'],
    },
    {
        id: 'LD-1010',
        first_name: 'Ananya',
        last_name: 'Das',
        email: 'ananya.das@gmail.com',
        phone: '+91 97000 44556',
        company: 'Personal',
        source: 'whatsapp',
        status: 'lost',
        score: 9,
        assignedTo: 'Kabir Anand',
        lastContact: '2026-02-17',
        tags: ['goa', 'weekend'],
    },
    {
        id: 'LD-1011',
        first_name: 'Dev',
        last_name: 'Malhotra',
        email: 'dev.malhotra@fino.in',
        phone: '+91 97654 33221',
        company: 'Fino',
        source: 'website',
        status: 'qualified',
        score: 58,
        assignedTo: 'Meera Joshi',
        lastContact: '2026-02-27',
        tags: ['thailand', 'quick close'],
    },
    {
        id: 'LD-1012',
        first_name: 'Tanya',
        last_name: 'Sen',
        email: 'tanya.sen@avion.co',
        phone: '+91 99555 77889',
        company: 'Avion',
        source: 'referral',
        status: 'contacted',
        score: 29,
        assignedTo: 'Arjun Das',
        lastContact: '2026-02-23',
        tags: ['students', 'europe'],
    },
];

const initialFollowUps = (leads: LeadRow[]) => {
    const seeded: Record<string, FollowUpItem[]> = {};
    leads.forEach((lead) => {
        seeded[lead.id] = [
            {
                id: `${lead.id}-FU-1`,
                title: 'Call back and confirm budget',
                dueDate: '2026-03-02',
                done: false,
            },
        ];
    });
    return seeded;
};

export default function CRMDashboard() {
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
    const [showAddLead, setShowAddLead] = useState(false);
    const [leads, setLeads] = useState<LeadRow[]>(dummyLeads);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [notesByLead, setNotesByLead] = useState<Record<string, string[]>>(() => {
        const seeded: Record<string, string[]> = {};
        dummyLeads.forEach((lead) => {
            seeded[lead.id] = [...defaultNotes];
        });
        return seeded;
    });
    const [followUpsByLead, setFollowUpsByLead] = useState<Record<string, FollowUpItem[]>>(
        () => initialFollowUps(dummyLeads),
    );
    const [newNote, setNewNote] = useState('');
    const [newFollowUpTitle, setNewFollowUpTitle] = useState('');
    const [newFollowUpDate, setNewFollowUpDate] = useState('');
    const [form] = Form.useForm();
    const { isMobile } = useResponsive();

    const selectedLead = useMemo(
        () => leads.find((lead) => lead.id === selectedLeadId) || null,
        [leads, selectedLeadId],
    );

    const filteredLeads = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return leads;

        return leads.filter((lead) => (
            `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(query)
            || lead.email.toLowerCase().includes(query)
            || lead.phone.toLowerCase().includes(query)
            || lead.source.toLowerCase().includes(query)
            || lead.status.toLowerCase().includes(query)
            || lead.company.toLowerCase().includes(query)
            || lead.assignedTo.toLowerCase().includes(query)
        ));
    }, [search, leads]);

    const handleOpenDrawer = (lead: LeadRow) => {
        setSelectedLeadId(lead.id);
        setDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setDrawerOpen(false);
        setNewNote('');
        setNewFollowUpTitle('');
        setNewFollowUpDate('');
    };

    const handleAddLead = (values: Record<string, string>) => {
        const firstName = values.firstName?.trim();
        const lastName = values.lastName?.trim();
        if (!firstName || !lastName) return;

        const id = `LD-${Date.now()}`;
        const nextLead: LeadRow = {
            id,
            first_name: firstName,
            last_name: lastName,
            email: values.email?.trim() || '',
            phone: values.phone?.trim() || '',
            company: values.company?.trim() || '',
            source: values.source || 'manual',
            status: 'new',
            score: 0,
            assignedTo: ASSIGNEES[0],
            lastContact: new Date().toISOString().slice(0, 10),
            tags: ['new lead'],
        };

        setLeads((current) => [nextLead, ...current]);
        setNotesByLead((current) => ({ ...current, [id]: [...defaultNotes] }));
        setFollowUpsByLead((current) => ({
            ...current,
            [id]: [],
        }));
        setShowAddLead(false);
        form.resetFields();
        message.success('Lead added (dummy data)');
    };

    const handleAssignLead = (assignee: string) => {
        if (!selectedLeadId) return;
        setLeads((current) => current.map((lead) => (
            lead.id === selectedLeadId ? { ...lead, assignedTo: assignee } : lead
        )));
        message.success('Lead reassigned');
    };

    const handleAddNote = () => {
        const note = newNote.trim();
        if (!note || !selectedLeadId) return;
        setNotesByLead((current) => ({
            ...current,
            [selectedLeadId]: [...(current[selectedLeadId] || []), note],
        }));
        setNewNote('');
    };

    const handleAddFollowUp = () => {
        const title = newFollowUpTitle.trim();
        if (!title || !newFollowUpDate || !selectedLeadId) return;

        const followUp: FollowUpItem = {
            id: `${selectedLeadId}-FU-${Date.now()}`,
            title,
            dueDate: newFollowUpDate,
            done: false,
        };

        setFollowUpsByLead((current) => ({
            ...current,
            [selectedLeadId]: [followUp, ...(current[selectedLeadId] || [])],
        }));
        setNewFollowUpTitle('');
        setNewFollowUpDate('');
    };

    const toggleFollowUpDone = (followUpId: string) => {
        if (!selectedLeadId) return;
        setFollowUpsByLead((current) => ({
            ...current,
            [selectedLeadId]: (current[selectedLeadId] || []).map((item) => (
                item.id === followUpId ? { ...item, done: !item.done } : item
            )),
        }));
    };

    const leadColumns = [
        {
            title: 'Name',
            render: (_: unknown, r: LeadRow) => (
                <Space>
                    <UserOutlined />
                    {r.first_name} {r.last_name}
                </Space>
            ),
            key: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (v: string) => (v ? <a href={`mailto:${v}`}>{v}</a> : '-'),
            responsive: ['md'] as any,
        },
        {
            title: 'Source',
            dataIndex: 'source',
            key: 'source',
            render: (v: string) => <Tag color="blue">{v || 'manual'}</Tag>,
            responsive: ['lg'] as any,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (v: LeadStatus) => <Tag color={statusColors[v] || 'default'}>{formatStatus(v)}</Tag>,
        },
        {
            title: 'Assigned',
            dataIndex: 'assignedTo',
            key: 'assignedTo',
            render: (v: string) => <Text>{v}</Text>,
            responsive: ['md'] as any,
        },
        {
            title: 'Score',
            dataIndex: 'score',
            key: 'score',
            render: (v: number) => (
                <Badge
                    count={v || 0}
                    style={{ backgroundColor: v > 50 ? '#52c41a' : v > 20 ? '#faad14' : '#d9d9d9' }}
                    showZero
                />
            ),
            responsive: ['sm'] as any,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: unknown, r: LeadRow) => (
                <Space size={4}>
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleOpenDrawer(r)}
                    >
                        View
                    </Button>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenDrawer(r)}
                    >
                        Edit
                    </Button>
                    <Button
                        size="small"
                        icon={<MessageOutlined />}
                        onClick={() => handleOpenDrawer(r)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div>
            <Title level={isMobile ? 4 : 3} style={{ marginBottom: 20 }}>
                Leads
            </Title>

            <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
                <Col xs={24} sm={12} md={8}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <Statistic
                            title={<span style={{ color: 'rgba(255,255,255,0.85)' }}>Total Leads</span>}
                            value={leads.length}
                            prefix={<UserOutlined />}
                            valueStyle={{ color: '#fff', fontSize: isMobile ? 22 : 28 }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card style={{ borderRadius: 12 }}>
                <div
                    style={{
                        marginBottom: 16,
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        gap: 12,
                        justifyContent: 'space-between',
                    }}
                >
                    <Input
                        prefix={<SearchOutlined />}
                        placeholder="Search leads..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ width: isMobile ? '100%' : 300 }}
                        allowClear
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setShowAddLead(true)}
                        block={isMobile}
                    >
                        Add Lead
                    </Button>
                </div>

                <Space style={{ marginBottom: 12 }}>
                    <Button
                        type={viewMode === 'list' ? 'primary' : 'default'}
                        onClick={() => setViewMode('list')}
                    >
                        List View
                    </Button>
                    <Button
                        type={viewMode === 'kanban' ? 'primary' : 'default'}
                        onClick={() => setViewMode('kanban')}
                    >
                        Kanban View
                    </Button>
                </Space>

                {viewMode === 'list' ? (
                    <div className="responsive-table-wrapper">
                        <Table
                            dataSource={filteredLeads}
                            columns={leadColumns}
                            rowKey="id"
                            pagination={{ pageSize: 10 }}
                            size="small"
                        />
                    </div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, minmax(0, 1fr))',
                            gap: 12,
                        }}
                    >
                        {statusOrder.map((status) => {
                            const columnLeads = filteredLeads.filter((lead) => lead.status === status);
                            return (
                                <Card
                                    key={status}
                                    size="small"
                                    title={
                                        <Space>
                                            <Tag color={statusColors[status]} style={{ marginRight: 0 }}>
                                                {formatStatus(status)}
                                            </Tag>
                                            <Badge count={columnLeads.length} />
                                        </Space>
                                    }
                                    bodyStyle={{ display: 'grid', gap: 8 }}
                                >
                                    {columnLeads.length === 0 ? (
                                        <Text type="secondary">No leads</Text>
                                    ) : (
                                        columnLeads.map((lead) => (
                                            <Card
                                                key={lead.id}
                                                size="small"
                                                hoverable
                                                onClick={() => handleOpenDrawer(lead)}
                                                bodyStyle={{ padding: 10 }}
                                            >
                                                <Space direction="vertical" size={4}>
                                                    <Text strong>{lead.first_name} {lead.last_name}</Text>
                                                    <Text type="secondary">{lead.phone}</Text>
                                                    <Text type="secondary">{lead.assignedTo}</Text>
                                                    <Space wrap>
                                                        {lead.tags.slice(0, 2).map((tag) => (
                                                            <Tag key={`${lead.id}-${tag}`}>{tag}</Tag>
                                                        ))}
                                                    </Space>
                                                </Space>
                                            </Card>
                                        ))
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                )}
            </Card>

            <Drawer
                title={selectedLead ? `${selectedLead.first_name} ${selectedLead.last_name}` : 'Lead Details'}
                open={drawerOpen}
                onClose={handleCloseDrawer}
                width={isMobile ? '100%' : 520}
                placement={isMobile ? 'bottom' : 'right'}
                height={isMobile ? '90vh' : undefined}
            >
                {selectedLead && (
                    <Space direction="vertical" style={{ width: '100%' }} size={14}>
                        <Card size="small">
                            <Space direction="vertical" style={{ width: '100%' }} size={4}>
                                <Text><PhoneOutlined /> {selectedLead.phone || '-'}</Text>
                                <Text><MailOutlined /> {selectedLead.email || '-'}</Text>
                                <Text><CalendarOutlined /> Last contact: {selectedLead.lastContact || '-'}</Text>
                                <Tag color={statusColors[selectedLead.status]}>{formatStatus(selectedLead.status)}</Tag>
                            </Space>
                        </Card>

                        <div>
                            <Text strong>Assign Lead</Text>
                            <Select
                                value={selectedLead.assignedTo}
                                onChange={handleAssignLead}
                                style={{ width: '100%', marginTop: 8 }}
                                options={ASSIGNEES.map((name) => ({ value: name, label: name }))}
                            />
                        </div>

                        <div>
                            <Text strong>Tags</Text>
                            <div style={{ marginTop: 8 }}>
                                {selectedLead.tags.map((tag) => (
                                    <Tag key={tag}>{tag}</Tag>
                                ))}
                            </div>
                        </div>

                        <Divider style={{ margin: '6px 0' }} />

                        <div>
                            <Text strong>Notes Timeline</Text>
                            <List
                                size="small"
                                style={{ marginTop: 8 }}
                                bordered
                                dataSource={notesByLead[selectedLead.id] || []}
                                renderItem={(note) => <List.Item>{note}</List.Item>}
                            />
                            <Space.Compact style={{ width: '100%', marginTop: 8 }}>
                                <Input
                                    placeholder="Add note..."
                                    value={newNote}
                                    onChange={(e) => setNewNote(e.target.value)}
                                    onPressEnter={handleAddNote}
                                />
                                <Button onClick={handleAddNote}>Add</Button>
                            </Space.Compact>
                        </div>

                        <Divider style={{ margin: '6px 0' }} />

                        <div>
                            <Text strong>Follow-ups</Text>
                            <List
                                size="small"
                                style={{ marginTop: 8 }}
                                bordered
                                dataSource={followUpsByLead[selectedLead.id] || []}
                                locale={{ emptyText: 'No follow-ups yet' }}
                                renderItem={(item) => (
                                    <List.Item
                                        actions={[
                                            <Button
                                                key={`toggle-${item.id}`}
                                                type="link"
                                                size="small"
                                                icon={<CheckCircleOutlined />}
                                                onClick={() => toggleFollowUpDone(item.id)}
                                            >
                                                {item.done ? 'Undo' : 'Done'}
                                            </Button>,
                                        ]}
                                    >
                                        <Space direction="vertical" size={0}>
                                            <Text delete={item.done}>{item.title}</Text>
                                            <Text type="secondary">Due: {item.dueDate}</Text>
                                        </Space>
                                    </List.Item>
                                )}
                            />

                            <Space
                                direction={isMobile ? 'vertical' : 'horizontal'}
                                style={{ width: '100%', marginTop: 8 }}
                            >
                                <Input
                                    placeholder="Follow-up title"
                                    value={newFollowUpTitle}
                                    onChange={(e) => setNewFollowUpTitle(e.target.value)}
                                />
                                <Input
                                    type="date"
                                    value={newFollowUpDate}
                                    onChange={(e) => setNewFollowUpDate(e.target.value)}
                                />
                                <Button onClick={handleAddFollowUp}>Add</Button>
                            </Space>
                        </div>
                    </Space>
                )}
            </Drawer>

            <Modal
                title="Add New Lead"
                open={showAddLead}
                onCancel={() => setShowAddLead(false)}
                footer={null}
                width={isMobile ? '100%' : 520}
            >
                <Form form={form} layout="vertical" onFinish={handleAddLead}>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="email" label="Email">
                        <Input prefix={<MailOutlined />} />
                    </Form.Item>
                    <Form.Item name="phone" label="Phone">
                        <Input prefix={<PhoneOutlined />} />
                    </Form.Item>
                    <Form.Item name="company" label="Company">
                        <Input />
                    </Form.Item>
                    <Form.Item name="source" label="Source">
                        <Select
                            options={[
                                { value: 'website' },
                                { value: 'referral' },
                                { value: 'ads' },
                                { value: 'social' },
                                { value: 'whatsapp' },
                                { value: 'manual' },
                            ]}
                        />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        Create Lead
                    </Button>
                </Form>
            </Modal>
        </div>
    );
}
