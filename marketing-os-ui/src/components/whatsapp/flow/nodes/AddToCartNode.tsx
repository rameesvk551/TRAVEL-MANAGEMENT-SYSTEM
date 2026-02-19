import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Card, Typography, Space, Tag } from 'antd';
import { ShoppingCartOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface AddToCartNodeData extends Record<string, unknown> {
    product_source?: 'selected' | 'specific';
    ask_quantity?: boolean;
}

const AddToCartNode = ({ data }: NodeProps<Node<AddToCartNodeData>>) => {
    return (
        <Card
            size="small"
            style={{
                border: '1px solid #52c41a',
                borderRadius: '8px',
                minWidth: '200px',
                maxWidth: '250px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            headStyle={{
                background: '#f6ffed',
                borderBottom: '1px solid #52c41a',
                padding: '0 12px',
                minHeight: '40px'
            }}
            bodyStyle={{ padding: '12px' }}
            title={
                <Space>
                    <ShoppingCartOutlined style={{ color: '#52c41a' }} />
                    <Text strong style={{ color: '#52c41a' }}>Add to Cart</Text>
                </Space>
            }
        >
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#52c41a', width: '10px', height: '10px' }}
            />

            <Space direction="vertical" style={{ width: '100%' }} size={4}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Product:</Text>
                    <Tag>{data.product_source === 'specific' ? 'Specific ID' : 'User Selected'}</Tag>
                </div>

                {data.ask_quantity && (
                    <div style={{
                        marginTop: '8px',
                        padding: '4px 8px',
                        background: '#f0f5ff',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <QuestionCircleOutlined style={{ color: '#1890ff' }} />
                        <Text style={{ fontSize: '11px', color: '#1890ff' }}>Asks for quantity</Text>
                    </div>
                )}
            </Space>

            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#52c41a', width: '10px', height: '10px' }}
            />
        </Card>
    );
};

export default memo(AddToCartNode);
