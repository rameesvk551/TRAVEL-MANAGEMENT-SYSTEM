import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Modal, message, Typography } from 'antd';
import { PlusOutlined, CodeOutlined, EditOutlined, DeleteOutlined, WhatsAppOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { widgetApi } from '../../../api/widgets';
import type { IWidget } from '../../../api/widgets';
import { useResponsive } from '../../../hooks/useResponsive';

const { Text, Paragraph, Title } = Typography;

const WidgetList: React.FC = () => {
    const [widgets, setWidgets] = useState<IWidget[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [embedModalVisible, setEmbedModalVisible] = useState(false);
    const [currentScript, setCurrentScript] = useState('');
    const { isMobile } = useResponsive();

    useEffect(() => {
        loadWidgets();
    }, []);

    const loadWidgets = async () => {
        try {
            setLoading(true);
            const data = await widgetApi.getAll();
            setWidgets(data);
        } catch (error) {
            message.error('Failed to load widgets');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        Modal.confirm({
            title: 'Delete Widget',
            content: 'Are you sure you want to delete this widget?',
            okText: 'Yes',
            okType: 'danger',
            cancelText: 'No',
            onOk: async () => {
                try {
                    await widgetApi.delete(id);
                    message.success('Widget deleted');
                    loadWidgets();
                } catch (error) {
                    message.error('Failed to delete widget');
                }
            },
        });
    };

    const handleShowCode = (widget: IWidget) => {
        const id = widget._id || widget.id;
        // In production, this URL should come from env config
        const script = `
<!-- MarketingOS WhatsApp Widget -->
<script>
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'widgetId':i});
  var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
  j.async=true;j.src='http://localhost:4000/api/v1/growth/pixel.js?id='+i+dl;
  f.parentNode.insertBefore(j,f);
  })(window,document,'script','mosData','${id}');
</script>
<!-- End MarketingOS Widget -->
        `.trim();
        setCurrentScript(script);
        setEmbedModalVisible(true);
    };

    const columns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <Space><WhatsAppOutlined style={{ color: '#25D366' }} /> <Text strong>{text}</Text></Space>,
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'status',
            render: (isActive: boolean) => (
                <Tag color={isActive ? 'success' : 'default'}>
                    {isActive ? 'Active' : 'Inactive'}
                </Tag>
            ),
        },
        {
            title: 'Impressions',
            dataIndex: ['stats', 'impressions'],
            key: 'impressions',
            responsive: ['md'] as any,
        },
        {
            title: 'Clicks',
            dataIndex: ['stats', 'clicks'],
            key: 'clicks',
            responsive: ['md'] as any,
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            responsive: ['lg'] as any,
            render: (date: string) => new Date(date).toLocaleDateString(),
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_: any, record: IWidget) => (
                <Space>
                    <Button
                        icon={<CodeOutlined />}
                        onClick={() => handleShowCode(record)}
                        title="Get Embed Code"
                    />
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => navigate(`/growth/widgets/edit/${record._id || record.id}`)}
                    />
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record._id || record.id)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: isMobile ? 12 : 24 }}>
            <div className="page-header" style={{ marginBottom: isMobile ? 16 : 24 }}>
                <div>
                    <Title level={isMobile ? 5 : 4} style={{ margin: 0 }}>WhatsApp Widgets</Title>
                    <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>Manage your website chat widgets</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/growth/widgets/new')}>
                    {isMobile ? 'New' : 'Create Widget'}
                </Button>
            </div>

            <div className="responsive-table-wrapper">
                <Table
                    columns={columns}
                    dataSource={widgets}
                    rowKey={(r) => r._id || r.id}
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    size={isMobile ? 'small' : 'middle'}
                />
            </div>

            <Modal
                title="Embed Code"
                open={embedModalVisible}
                onCancel={() => setEmbedModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setEmbedModalVisible(false)}>
                        Close
                    </Button>,
                    <Button key="copy" type="primary" onClick={() => {
                        navigator.clipboard.writeText(currentScript);
                        message.success('Code copied to clipboard!');
                    }}>
                        Copy Code
                    </Button>
                ]}
            >
                <Paragraph>Copy and paste this code into your website's <code>&lt;body&gt;</code> tag:</Paragraph>
                <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontFamily: 'monospace', overflowX: 'auto' }}>
                    <pre style={{ margin: 0 }}>{currentScript}</pre>
                </div>
            </Modal>
        </div>
    );
};

export default WidgetList;
