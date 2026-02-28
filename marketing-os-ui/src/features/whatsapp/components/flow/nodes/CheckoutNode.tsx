import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Card, Typography, Space, Checkbox } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface CheckoutNodeData extends Record<string, unknown> {
    collect_name?: boolean;
    collect_address?: boolean;
    collect_phone?: boolean;
}

const CheckoutNode = ({ data }: NodeProps<Node<CheckoutNodeData>>) => {
    return (
        <Card
            size="small"
            style={{
                border: '1px solid #fa8c16',
                borderRadius: '8px',
                minWidth: '220px',
                maxWidth: '280px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            headStyle={{
                background: '#fff7e6',
                borderBottom: '1px solid #fa8c16',
                padding: '0 12px',
                minHeight: '40px'
            }}
            bodyStyle={{ padding: '12px' }}
            title={
                <Space>
                    <CreditCardOutlined style={{ color: '#fa8c16' }} />
                    <Text strong style={{ color: '#fa8c16' }}>Checkout</Text>
                </Space>
            }
        >
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#fa8c16', width: '10px', height: '10px' }}
            />

            <Text strong style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Collects info:</Text>

            <Space direction="vertical" size={0}>
                <Checkbox checked={data.collect_name !== false} disabled><Text style={{ fontSize: '12px' }}>Name</Text></Checkbox>
                <Checkbox checked={data.collect_address !== false} disabled><Text style={{ fontSize: '12px' }}>Address</Text></Checkbox>
                <Checkbox checked={data.collect_phone !== false} disabled><Text style={{ fontSize: '12px' }}>Phone</Text></Checkbox>
            </Space>

            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#fa8c16', width: '10px', height: '10px' }}
            />
        </Card>
    );
};

export default memo(CheckoutNode);
