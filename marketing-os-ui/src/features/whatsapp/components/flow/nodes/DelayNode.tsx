import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Card, Typography, Space } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface DelayNodeData extends Record<string, unknown> {
    duration?: number;
    unit?: string;
}

const DelayNode = ({ data }: NodeProps<Node<DelayNodeData>>) => {
    return (
        <Card
            size="small"
            style={{
                border: '1px solid #faad14',
                borderRadius: '8px',
                width: '180px',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            bodyStyle={{ padding: '8px' }}
        >
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#faad14', width: '10px', height: '10px' }}
            />
            <Space>
                <ClockCircleOutlined style={{ color: '#faad14', fontSize: '18px' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Text strong>Delay</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {data.duration ? `${data.duration} ${data.unit}` : 'Not set'}
                    </Text>
                </div>
            </Space>
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#faad14', width: '10px', height: '10px' }}
            />
        </Card>
    );
};

export default memo(DelayNode);
