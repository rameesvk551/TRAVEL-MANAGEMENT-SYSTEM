import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Typography, Button, Spin, Tabs, Descriptions, Tag, Timeline, Space } from 'antd';
import { ArrowLeftOutlined, MessageOutlined, UserOutlined, MailOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { crmApi } from '../../api/crm';
import { useResponsive } from '../../hooks/useResponsive';

const { Title } = Typography;

export default function ContactDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isMobile } = useResponsive();

    const { data: contact, isLoading } = useQuery({
        queryKey: ['crm-contact', id],
        queryFn: () => crmApi.getContact(id!)
    });

    if (isLoading) return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
    if (!contact) return <div>Contact not found</div>;

    const items = [
        {
            key: 'overview',
            label: 'Overview',
            children: (
                <Descriptions bordered column={1}>
                    <Descriptions.Item label="Full Name">{contact.firstName} {contact.lastName}</Descriptions.Item>
                    <Descriptions.Item label="Phone">{contact.phone}</Descriptions.Item>
                    <Descriptions.Item label="WhatsApp">{contact.whatsapp}</Descriptions.Item>
                    <Descriptions.Item label="Email">{contact.email}</Descriptions.Item>
                    <Descriptions.Item label="Tags">
                        {contact.tags?.map((tag: string) => <Tag color="blue" key={tag}>{tag}</Tag>)}
                    </Descriptions.Item>
                </Descriptions>
            )
        },
        {
            key: 'timeline',
            label: 'Activity Timeline',
            children: (
                <Timeline
                    items={[
                        {
                            color: 'green',
                            children: 'Contact created 2024-01-01',
                        },
                        {
                            color: 'blue',
                            children: 'Sent WhatsApp message',
                        },
                    ]}
                />
            )
        }
    ];

    return (
        <div style={{ padding: isMobile ? 12 : 24 }}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/crm')} style={{ marginBottom: 16 }} size={isMobile ? 'middle' : 'large'}>Back to CRM</Button>

            <Card>
                <Row gutter={24}>
                    <Col span={24}>
                        <Space align="center" style={{ marginBottom: 24 }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <UserOutlined style={{ fontSize: 32, color: '#999' }} />
                            </div>
                            <div>
                                <Title level={isMobile ? 4 : 3} style={{ margin: 0 }}>{contact.firstName} {contact.lastName}</Title>
                                <Space>
                                    {contact.whatsapp && <Tag icon={<MessageOutlined />} color="green">WhatsApp Active</Tag>}
                                    {contact.email && <Tag icon={<MailOutlined />} color="blue">Email</Tag>}
                                </Space>
                            </div>
                        </Space>
                    </Col>
                </Row>

                <Tabs items={items} />
            </Card>
        </div>
    );
}
