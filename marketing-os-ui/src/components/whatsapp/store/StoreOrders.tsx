import React, { useState } from 'react';
import {
    Table, Button, Tag, Space, Card, Select, message, Typography,
    Modal, Descriptions, Row, Col, Statistic,
} from 'antd';
import {
    CheckCircleOutlined, ClockCircleOutlined, CarOutlined,
    TrophyOutlined, CloseCircleOutlined, DollarOutlined,
    EyeOutlined, ShoppingCartOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeApi } from '../../../api/modules';

const { Text, Title } = Typography;

interface OrderItem {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
}

interface Order {
    id: string;
    customer_phone: string;
    customer_name?: string;
    delivery_address?: string;
    items: OrderItem[];
    total_amount: number;
    currency: string;
    status: string;
    payment_status: string;
    payment_link?: string;
    notes?: string;
    created_at: string;
}

const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    pending: { color: 'orange', icon: <ClockCircleOutlined />, label: 'Pending' },
    confirmed: { color: 'blue', icon: <CheckCircleOutlined />, label: 'Confirmed' },
    shipped: { color: 'cyan', icon: <CarOutlined />, label: 'Shipped' },
    completed: { color: 'green', icon: <TrophyOutlined />, label: 'Completed' },
    cancelled: { color: 'red', icon: <CloseCircleOutlined />, label: 'Cancelled' },
};

const paymentConfig: Record<string, { color: string; label: string }> = {
    unpaid: { color: 'default', label: 'Unpaid' },
    awaiting: { color: 'orange', label: 'Awaiting' },
    paid: { color: 'green', label: 'Paid' },
    refunded: { color: 'purple', label: 'Refunded' },
};

const cardStyle: React.CSSProperties = {
    borderRadius: 16,
    border: '1px solid rgba(0,0,0,0.06)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.02)',
    overflow: 'hidden',
};

const StoreOrders: React.FC = () => {
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const queryClient = useQueryClient();

    const { data: ordersData, isLoading } = useQuery({
        queryKey: ['store-orders', statusFilter],
        queryFn: () => storeApi.getOrders(statusFilter ? { status: statusFilter } : undefined),
    });

    const orders: Order[] = ordersData?.data || [];
    const totalCount = ordersData?.total || 0;

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            storeApi.updateOrderStatus(id, status),
        onSuccess: () => {
            message.success('Order status updated');
            queryClient.invalidateQueries({ queryKey: ['store-orders'] });
        },
        onError: () => message.error('Failed to update status'),
    });

    const confirmPaymentMutation = useMutation({
        mutationFn: (id: string) => storeApi.confirmPayment(id),
        onSuccess: () => {
            message.success('Payment confirmed!');
            queryClient.invalidateQueries({ queryKey: ['store-orders'] });
        },
        onError: () => message.error('Failed to confirm payment'),
    });

    // ── Summary Stats ──
    const pendingCount = orders.filter((o) => o.status === 'pending').length;
    const unpaidCount = orders.filter((o) => o.payment_status !== 'paid').length;

    const columns = [
        {
            title: 'Order',
            key: 'order',
            width: 130,
            render: (_: any, record: Order) => (
                <div>
                    <Text
                        strong
                        style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: 13,
                            color: '#4F46E5',
                        }}
                    >
                        #{record.id.slice(-6).toUpperCase()}
                    </Text>
                    <div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {new Date(record.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </Text>
                    </div>
                </div>
            ),
        },
        {
            title: 'Customer',
            key: 'customer',
            render: (_: any, record: Order) => (
                <div>
                    <Text strong>{record.customer_name || 'Unknown'}</Text>
                    <div>
                        <Text
                            type="secondary"
                            style={{ fontSize: 12 }}
                            copyable={{ text: record.customer_phone, tooltips: ['Copy', 'Copied!'] }}
                        >
                            {record.customer_phone}
                        </Text>
                    </div>
                </div>
            ),
        },
        {
            title: 'Items',
            key: 'items',
            render: (_: any, record: Order) => (
                <div>
                    {record.items.slice(0, 2).map((item, i) => (
                        <div key={i} style={{ fontSize: 12, lineHeight: '20px' }}>
                            <Text>{item.name}</Text>
                            <Text type="secondary"> ×{item.quantity}</Text>
                        </div>
                    ))}
                    {record.items.length > 2 && (
                        <Tag style={{ borderRadius: 4, fontSize: 10 }}>
                            +{record.items.length - 2} more
                        </Tag>
                    )}
                </div>
            ),
        },
        {
            title: 'Total',
            key: 'total',
            width: 100,
            render: (_: any, record: Order) => (
                <Text
                    strong
                    style={{
                        fontSize: 15,
                        background: 'linear-gradient(135deg, #059669, #10B981)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    ₹{Number(record.total_amount).toFixed(0)}
                </Text>
            ),
        },
        {
            title: 'Status',
            key: 'status',
            width: 120,
            render: (_: any, record: Order) => {
                const cfg = statusConfig[record.status] || statusConfig.pending;
                return (
                    <Tag
                        color={cfg.color}
                        icon={cfg.icon}
                        style={{ borderRadius: 6, fontWeight: 500 }}
                    >
                        {cfg.label}
                    </Tag>
                );
            },
        },
        {
            title: 'Payment',
            key: 'payment',
            width: 100,
            render: (_: any, record: Order) => {
                const cfg = paymentConfig[record.payment_status] || paymentConfig.unpaid;
                return (
                    <Tag
                        color={cfg.color}
                        style={{ borderRadius: 6 }}
                    >
                        {cfg.label}
                    </Tag>
                );
            },
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 220,
            render: (_: any, record: Order) => (
                <Space wrap size={4}>
                    <Button
                        type="text"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => setSelectedOrder(record)}
                        style={{ borderRadius: 6 }}
                    />
                    <Select
                        size="small"
                        value={record.status}
                        onChange={(status) => updateStatusMutation.mutate({ id: record.id, status })}
                        style={{ width: 110 }}
                        options={Object.entries(statusConfig).map(([key, val]) => ({
                            value: key,
                            label: val.label,
                        }))}
                    />
                    {record.payment_status !== 'paid' && (
                        <Button
                            type="primary"
                            size="small"
                            icon={<DollarOutlined />}
                            onClick={() => confirmPaymentMutation.mutate(record.id)}
                            style={{
                                background: 'linear-gradient(135deg, #059669, #10B981)',
                                border: 'none',
                                borderRadius: 6,
                                fontWeight: 600,
                                fontSize: 11,
                            }}
                        >
                            Mark Paid
                        </Button>
                    )}
                </Space>
            ),
        },
    ];

    const filterTabs = [
        { label: 'All Orders', value: '' },
        { label: 'Pending', value: 'pending', emoji: '⏳' },
        { label: 'Confirmed', value: 'confirmed', emoji: '✅' },
        { label: 'Shipped', value: 'shipped', emoji: '🚚' },
        { label: 'Completed', value: 'completed', emoji: '🎉' },
    ];

    return (
        <div>
            {/* Stats Row */}
            <Row gutter={16} style={{ marginBottom: 20 }}>
                {[
                    { title: 'Total Orders', value: totalCount, color: '#4F46E5', bg: '#EEF2FF', icon: <ShoppingCartOutlined /> },
                    { title: 'Pending', value: pendingCount, color: '#D97706', bg: '#FFFBEB', icon: <ClockCircleOutlined /> },
                    { title: 'Awaiting Payment', value: unpaidCount, color: '#EA580C', bg: '#FFF7ED', icon: <DollarOutlined /> },
                ].map((stat, i) => (
                    <Col xs={24} sm={8} key={i}>
                        <Card
                            style={{ borderRadius: 14, background: stat.bg, border: 'none' }}
                            styles={{ body: { padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14 } }}
                        >
                            <div
                                style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 12,
                                    background: `${stat.color}20`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 20,
                                    color: stat.color,
                                }}
                            >
                                {stat.icon}
                            </div>
                            <Statistic
                                title={<Text style={{ color: stat.color, fontSize: 12, fontWeight: 500 }}>{stat.title}</Text>}
                                value={stat.value}
                                valueStyle={{ color: stat.color, fontWeight: 700, fontSize: 24 }}
                            />
                        </Card>
                    </Col>
                ))}
            </Row>

            {/* Orders Table */}
            <Card style={cardStyle} styles={{ body: { padding: 0 } }}>
                {/* Filter Tabs */}
                <div
                    style={{
                        padding: '14px 24px',
                        display: 'flex',
                        gap: 8,
                        borderBottom: '1px solid #f0f0f0',
                        flexWrap: 'wrap',
                        alignItems: 'center',
                    }}
                >
                    {filterTabs.map((tab) => (
                        <Button
                            key={tab.value}
                            type={statusFilter === tab.value ? 'primary' : 'default'}
                            size="small"
                            onClick={() => setStatusFilter(tab.value)}
                            style={{
                                borderRadius: 20,
                                fontWeight: 500,
                                fontSize: 12,
                                ...(statusFilter === tab.value
                                    ? {
                                        background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                        border: 'none',
                                        boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
                                    }
                                    : { background: '#F8FAFC', border: '1px solid #E2E8F0' }),
                            }}
                        >
                            {tab.emoji && <span style={{ marginRight: 4 }}>{tab.emoji}</span>}
                            {tab.label}
                        </Button>
                    ))}
                </div>

                {orders.length === 0 && !isLoading ? (
                    <div style={{ padding: 60, textAlign: 'center' }}>
                        <div
                            style={{
                                width: 64,
                                height: 64,
                                borderRadius: 16,
                                background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 16px',
                            }}
                        >
                            <ShoppingCartOutlined style={{ fontSize: 28, color: '#4F46E5' }} />
                        </div>
                        <Title level={5}>No orders yet</Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Orders will appear here when customers place them through WhatsApp
                        </Text>
                    </div>
                ) : (
                    <Table
                        dataSource={orders}
                        columns={columns}
                        rowKey="id"
                        loading={isLoading}
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: false,
                            style: { padding: '0 24px' },
                        }}
                    />
                )}
            </Card>

            {/* Order Detail Modal */}
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <ShoppingCartOutlined style={{ color: '#fff', fontSize: 16 }} />
                        </div>
                        <span style={{ fontWeight: 600 }}>
                            Order #{selectedOrder?.id.slice(-6).toUpperCase()}
                        </span>
                    </div>
                }
                open={!!selectedOrder}
                onCancel={() => setSelectedOrder(null)}
                footer={null}
                width={560}
            >
                {selectedOrder && (
                    <div style={{ marginTop: 16 }}>
                        <Descriptions column={1} bordered size="small" labelStyle={{ fontWeight: 500, width: 130 }}>
                            <Descriptions.Item label="Customer">
                                {selectedOrder.customer_name || 'Unknown'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Phone">
                                {selectedOrder.customer_phone}
                            </Descriptions.Item>
                            <Descriptions.Item label="Address">
                                {selectedOrder.delivery_address || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Items">
                                {selectedOrder.items.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                                        <Text>{item.name} × {item.quantity}</Text>
                                        <Text type="secondary">₹{(item.price * item.quantity).toFixed(0)}</Text>
                                    </div>
                                ))}
                            </Descriptions.Item>
                            <Descriptions.Item label="Total">
                                <Text strong style={{ fontSize: 18, color: '#059669' }}>
                                    ₹{Number(selectedOrder.total_amount).toFixed(0)}
                                </Text>
                            </Descriptions.Item>
                            <Descriptions.Item label="Status">
                                <Tag color={statusConfig[selectedOrder.status]?.color} style={{ borderRadius: 6 }}>
                                    {statusConfig[selectedOrder.status]?.label}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Payment">
                                <Tag color={paymentConfig[selectedOrder.payment_status]?.color} style={{ borderRadius: 6 }}>
                                    {paymentConfig[selectedOrder.payment_status]?.label}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Created">
                                {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                            </Descriptions.Item>
                        </Descriptions>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default StoreOrders;
