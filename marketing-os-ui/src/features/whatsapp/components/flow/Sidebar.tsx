import React from 'react';
import { Card, Typography, Space, Divider } from 'antd';
import {
    MessageOutlined,
    ClockCircleOutlined,
    ApartmentOutlined,
    PlayCircleOutlined,
    TagOutlined,
    UnorderedListOutlined,
    ShoppingOutlined,
    ShoppingCartOutlined,
    CreditCardOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const Sidebar = () => {
    const nodeTypes = [
        { type: 'start', label: 'Start Flow', icon: <PlayCircleOutlined /> },
        { type: 'message', label: 'Send Message', icon: <MessageOutlined /> },
        { type: 'buttons', label: 'Buttons / Menu', icon: <UnorderedListOutlined /> },
        { type: 'product_carousel', label: 'Product Carousel', icon: <ShoppingOutlined /> },
        { type: 'add_to_cart', label: 'Add to Cart', icon: <ShoppingCartOutlined /> },
        { type: 'checkout', label: 'Checkout', icon: <CreditCardOutlined /> },
        { type: 'delay', label: 'Delay', icon: <ClockCircleOutlined /> },
        { type: 'condition', label: 'Condition', icon: <ApartmentOutlined /> },
        { type: 'label', label: 'Add/Remove Tag', icon: <TagOutlined /> },
    ];

    const templates = [
        {
            type: 'message',
            label: 'Welcome Message',
            icon: <MessageOutlined />,
            data: {
                text: "👋 Welcome to our store! We're glad to have you here. \n\nHow can we help you today?",
                buttons: []
            }
        },
        {
            type: 'buttons',
            label: 'Support Menu',
            icon: <UnorderedListOutlined />,
            data: {
                text: "Please choose a topic below so we can route you to the right agent:",
                buttons: ["Order Status", "Return/Refund", "Talk to Agent"]
            }
        },
        {
            type: 'product_carousel',
            label: 'New Arrivals',
            icon: <ShoppingOutlined />,
            data: {
                message_template: "🔥 Check out our latest arrivals! Limited stock available.",
                source: 'recent',
                max_products: 5
            }
        }
    ];

    const onDragStart = (event: React.DragEvent, nodeType: string, label: string, data?: any) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow-label', label);
        if (data) {
            event.dataTransfer.setData('application/reactflow-data', JSON.stringify(data));
        }
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <div style={{ padding: '16px', borderRight: '1px solid #f0f0f0', height: '100%', background: '#fff', overflowY: 'auto' }}>
            <Text strong style={{ display: 'block', marginBottom: '16px' }}>Flow Elements</Text>
            <Space direction="vertical" style={{ width: '100%' }}>
                {nodeTypes.map((node) => (
                    <div
                        key={node.type}
                        onDragStart={(event) => onDragStart(event, node.type, node.label)}
                        draggable
                        style={{ cursor: 'grab' }}
                    >
                        <Card size="small" hoverable bodyStyle={{ padding: '12px' }}>
                            <Space>
                                {node.icon}
                                <Text>{node.label}</Text>
                            </Space>
                        </Card>
                    </div>
                ))}
            </Space>

            <Divider style={{ margin: '24px 0' }} />

            <Text strong style={{ display: 'block', marginBottom: '16px' }}>Message Templates</Text>
            <Space direction="vertical" style={{ width: '100%' }}>
                {templates.map((template, index) => (
                    <div
                        key={index}
                        onDragStart={(event) => onDragStart(event, template.type, template.label, template.data)}
                        draggable
                        style={{ cursor: 'grab' }}
                    >
                        <Card size="small" hoverable bodyStyle={{ padding: '12px', background: '#f9f0ff', borderColor: '#d3adf7' }}>
                            <Space>
                                <span style={{ color: '#722ed1' }}>{template.icon}</span>
                                <Text strong style={{ color: '#722ed1' }}>{template.label}</Text>
                            </Space>
                        </Card>
                    </div>
                ))}
            </Space>
        </div>
    );
};

export default Sidebar;
