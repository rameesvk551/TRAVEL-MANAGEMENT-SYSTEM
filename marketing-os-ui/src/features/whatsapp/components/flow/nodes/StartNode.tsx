import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Card, Typography, Tag, Space } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface StartNodeData extends Record<string, unknown> {
    label?: string;
    keywords?: string[];
}

const StartNode = ({ data }: NodeProps<Node<StartNodeData>>) => {
    return (
        <Card
            size="small"
            style={{
                border: '2px solid #52c41a',
                borderRadius: '8px',
                minWidth: '200px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            bodyStyle={{ padding: '8px' }}
        >
            <Space direction="vertical" style={{ width: '100%' }} size={4}>
                <Space>
                    <PlayCircleOutlined style={{ color: '#52c41a' }} />
                    <Text strong>Start Flow</Text>
                </Space>
                <div style={{ marginTop: '8px' }}>
                    <Tag color={data.triggerType === 'welcome' ? 'purple' : data.triggerType === 'away' ? 'orange' : 'blue'}>
                        {data.triggerType === 'welcome' ? 'Trigger: Welcome' : data.triggerType === 'away' ? 'Trigger: Away Message' : 'Trigger: Keyword'}
                    </Tag>
                </div>
                {data.triggerType !== 'welcome' && data.triggerType !== 'away' && data.keywords && Array.isArray(data.keywords) && (
                    <div style={{ marginTop: '8px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Keywords:</Text>
                        <div style={{ marginTop: '4px' }}>
                            {data.keywords.map((keyword, index) => (
                                <Tag key={index} color="default" style={{ marginRight: '4px', marginBottom: '4px' }}>
                                    {keyword}
                                </Tag>
                            ))}
                        </div>
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

export default memo(StartNode);
