import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Card, Typography, Tag, Space } from 'antd';
import { TagOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface LabelNodeData extends Record<string, unknown> {
    label?: string;
    action?: 'add' | 'remove';
    tags?: string[];
}

const LabelNode = ({ data }: NodeProps<Node<LabelNodeData>>) => {
    return (
        <Card
            size="small"
            style={{
                border: '1px solid #722ed1',
                borderRadius: '8px',
                minWidth: '180px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            bodyStyle={{ padding: '8px' }}
        >
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#722ed1', width: '10px', height: '10px' }}
            />
            <Space direction="vertical" style={{ width: '100%' }} size={4}>
                <Space>
                    <TagOutlined style={{ color: '#722ed1' }} />
                    <Text strong>{data.action === 'remove' ? 'Remove Tag' : 'Add Tag'}</Text>
                </Space>
                {data.tags && Array.isArray(data.tags) && (
                    <div style={{ marginTop: '4px' }}>
                        {data.tags.map((tag, index) => (
                            <Tag key={index} color={data.action === 'remove' ? 'red' : 'purple'} style={{ marginRight: '4px', marginBottom: '4px' }}>
                                {tag}
                            </Tag>
                        ))}
                    </div>
                )}
            </Space>
            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#722ed1', width: '10px', height: '10px' }}
            />
        </Card>
    );
};

export default memo(LabelNode);
