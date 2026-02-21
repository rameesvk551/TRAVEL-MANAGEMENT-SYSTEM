import React, { useState } from 'react';
import {
    Button, Modal, Form, Input, InputNumber, Switch, Space,
    Tag, message, Popconfirm, Card, Typography, Row, Col,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, StarFilled,
    ShoppingOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { storeApi } from '../../../api/modules';

const { Text, Title, Paragraph } = Typography;
const { TextArea } = Input;

interface Product {
    id: string;
    name: string;
    description?: string;
    price: number;
    currency: string;
    image_url?: string;
    category?: string;
    is_enabled: boolean;
    is_featured: boolean;
    sort_order: number;
}

const StoreProducts: React.FC = () => {
    const [formVisible, setFormVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [form] = Form.useForm();
    const queryClient = useQueryClient();

    const { data: productsData, isLoading } = useQuery({
        queryKey: ['store-products'],
        queryFn: () => storeApi.getProducts(),
    });

    const products: Product[] = productsData?.data || [];

    const createMutation = useMutation({
        mutationFn: (values: any) => storeApi.createProduct(values),
        onSuccess: () => {
            message.success('Product created!');
            queryClient.invalidateQueries({ queryKey: ['store-products'] });
            closeForm();
        },
        onError: () => message.error('Failed to create product'),
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, ...values }: any) => storeApi.updateProduct(id, values),
        onSuccess: () => {
            message.success('Product updated!');
            queryClient.invalidateQueries({ queryKey: ['store-products'] });
            closeForm();
        },
        onError: () => message.error('Failed to update product'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => storeApi.deleteProduct(id),
        onSuccess: () => {
            message.success('Product deleted');
            queryClient.invalidateQueries({ queryKey: ['store-products'] });
        },
    });

    const toggleMutation = useMutation({
        mutationFn: ({ id, is_enabled }: { id: string; is_enabled: boolean }) =>
            storeApi.updateProduct(id, { is_enabled }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['store-products'] }),
    });

    const openCreate = () => {
        setEditingProduct(null);
        form.resetFields();
        setFormVisible(true);
    };

    const openEdit = (product: Product) => {
        setEditingProduct(product);
        form.setFieldsValue(product);
        setFormVisible(true);
    };

    const closeForm = () => {
        setFormVisible(false);
        setEditingProduct(null);
        form.resetFields();
    };

    const handleSubmit = async () => {
        const values = await form.validateFields();
        if (editingProduct) {
            updateMutation.mutate({ id: editingProduct.id, ...values });
        } else {
            createMutation.mutate(values);
        }
    };

    // ─── Card View for Empty State ──────────────
    if (products.length === 0 && !isLoading) {
        return (
            <Card
                style={{
                    borderRadius: 16,
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    textAlign: 'center',
                    padding: '60px 40px',
                }}
            >
                <div
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 20,
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        boxShadow: '0 8px 24px rgba(37, 211, 102, 0.25)',
                    }}
                >
                    <ShoppingOutlined style={{ fontSize: 36, color: '#fff' }} />
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>Build Your Catalog</Title>
                <Paragraph type="secondary" style={{ maxWidth: 400, margin: '0 auto 24px', fontSize: 14 }}>
                    Add products that customers can browse and order through WhatsApp.
                    Each product will appear in the chatbot catalog.
                </Paragraph>
                <Button
                    type="primary"
                    size="large"
                    icon={<PlusOutlined />}
                    onClick={openCreate}
                    style={{
                        borderRadius: 12,
                        height: 48,
                        paddingInline: 32,
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        border: 'none',
                        fontWeight: 600,
                        boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)',
                    }}
                >
                    Add Your First Product
                </Button>

                {/* Form Modal */}
                {renderModal()}
            </Card>
        );
    }

    // ─── Product Cards Grid ──────────────
    function renderModal() {
        return (
            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <ShoppingOutlined style={{ color: '#fff', fontSize: 16 }} />
                        </div>
                        <span style={{ fontWeight: 600 }}>
                            {editingProduct ? 'Edit Product' : 'Add New Product'}
                        </span>
                    </div>
                }
                open={formVisible}
                onOk={handleSubmit}
                onCancel={closeForm}
                confirmLoading={createMutation.isPending || updateMutation.isPending}
                okText={editingProduct ? 'Update' : 'Create'}
                okButtonProps={{
                    style: {
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        border: 'none',
                        borderRadius: 8,
                    },
                }}
                cancelButtonProps={{ style: { borderRadius: 8 } }}
                width={540}
            >
                <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
                    <Form.Item name="name" label={<Text strong>Product Name</Text>} rules={[{ required: true }]}>
                        <Input
                            placeholder="e.g. Chicken Biryani"
                            style={{ borderRadius: 10, height: 42, background: '#FAFBFC' }}
                        />
                    </Form.Item>

                    <Form.Item name="description" label={<Text strong>Description</Text>}>
                        <TextArea
                            rows={2}
                            placeholder="Short description shown to customers"
                            style={{ borderRadius: 10, background: '#FAFBFC' }}
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="price" label={<Text strong>Price (₹)</Text>} rules={[{ required: true }]}>
                                <InputNumber
                                    min={0}
                                    step={0.01}
                                    style={{ width: '100%', borderRadius: 10 }}
                                    placeholder="0.00"
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="category" label={<Text strong>Category</Text>}>
                                <Input
                                    placeholder="e.g. Food"
                                    style={{ borderRadius: 10, height: 42, background: '#FAFBFC' }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="image_url" label={<Text strong>Image URL</Text>}>
                        <Input
                            placeholder="https://example.com/product.jpg"
                            style={{ borderRadius: 10, height: 42, background: '#FAFBFC' }}
                        />
                    </Form.Item>

                    <Form.Item name="is_featured" valuePropName="checked">
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                background: '#FFFBEB',
                                borderRadius: 10,
                                border: '1px solid #FDE68A',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <StarFilled style={{ color: '#F59E0B' }} />
                                <Text strong>Mark as Featured</Text>
                            </div>
                            <Switch checkedChildren="Yes" unCheckedChildren="No" />
                        </div>
                    </Form.Item>
                </Form>
            </Modal>
        );
    }

    return (
        <div>
            {/* Header Bar */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 20,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, #EEF2FF, #E0E7FF)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <AppstoreOutlined style={{ color: '#4F46E5', fontSize: 18 }} />
                    </div>
                    <div>
                        <Title level={5} style={{ margin: 0 }}>Product Catalog</Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>{products.length} items in your store</Text>
                    </div>
                </div>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openCreate}
                    style={{
                        borderRadius: 10,
                        height: 40,
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        border: 'none',
                        fontWeight: 600,
                        boxShadow: '0 4px 12px rgba(37, 211, 102, 0.25)',
                    }}
                >
                    Add Product
                </Button>
            </div>

            {/* Product Cards */}
            <Row gutter={[16, 16]}>
                {products.map((product) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                        <Card
                            hoverable
                            style={{
                                borderRadius: 14,
                                overflow: 'hidden',
                                border: '1px solid rgba(0,0,0,0.06)',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                transition: 'all 0.3s ease',
                            }}
                            styles={{ body: { padding: 0 } }}
                        >
                            {/* Image / Placeholder */}
                            <div
                                style={{
                                    height: 140,
                                    background: product.image_url
                                        ? `url(${product.image_url}) center/cover`
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                }}
                            >
                                {!product.image_url && (
                                    <ShoppingOutlined style={{ fontSize: 36, color: 'rgba(255,255,255,0.6)' }} />
                                )}

                                {/* Featured Badge */}
                                {product.is_featured && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8,
                                            background: 'rgba(245, 158, 11, 0.9)',
                                            color: '#fff',
                                            padding: '2px 8px',
                                            borderRadius: 6,
                                            fontSize: 10,
                                            fontWeight: 700,
                                            backdropFilter: 'blur(4px)',
                                        }}
                                    >
                                        <StarFilled style={{ marginRight: 3 }} />
                                        FEATURED
                                    </div>
                                )}

                                {/* Enable/Disable */}
                                <div style={{ position: 'absolute', top: 8, left: 8 }}>
                                    <Switch
                                        size="small"
                                        checked={product.is_enabled}
                                        onChange={(checked) => toggleMutation.mutate({ id: product.id, is_enabled: checked })}
                                        style={{ background: product.is_enabled ? '#25D366' : undefined }}
                                    />
                                </div>
                            </div>

                            {/* Details */}
                            <div style={{ padding: '14px 16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                    <Text strong style={{ fontSize: 14, lineHeight: '20px' }}>
                                        {product.name}
                                    </Text>
                                </div>

                                {product.category && (
                                    <Tag
                                        style={{
                                            borderRadius: 6,
                                            fontSize: 10,
                                            background: '#EEF2FF',
                                            color: '#4F46E5',
                                            border: 'none',
                                            marginBottom: 8,
                                        }}
                                    >
                                        {product.category}
                                    </Tag>
                                )}

                                {product.description && (
                                    <Paragraph
                                        type="secondary"
                                        style={{ fontSize: 12, margin: '4px 0 8px', lineHeight: '18px' }}
                                        ellipsis={{ rows: 2 }}
                                    >
                                        {product.description}
                                    </Paragraph>
                                )}

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                                    <Text
                                        strong
                                        style={{
                                            fontSize: 18,
                                            background: 'linear-gradient(135deg, #059669, #10B981)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        ₹{Number(product.price).toFixed(0)}
                                    </Text>

                                    <Space size={4}>
                                        <Button
                                            type="text"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => openEdit(product)}
                                            style={{ color: '#4F46E5', borderRadius: 6 }}
                                        />
                                        <Popconfirm
                                            title="Delete this product?"
                                            onConfirm={() => deleteMutation.mutate(product.id)}
                                        >
                                            <Button type="text" size="small" icon={<DeleteOutlined />} danger style={{ borderRadius: 6 }} />
                                        </Popconfirm>
                                    </Space>
                                </div>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            {renderModal()}
        </div>
    );
};

export default StoreProducts;
