import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Card, Typography, Space, Button } from 'antd';
import { MessageOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface MessageNodeData extends Record<string, unknown> {
    text?: string;
    buttons?: string[];
}

const MessageNode = ({ data }: NodeProps<Node<MessageNodeData>>) => {
    return (
        <Card
            size="small"
            style={{
                border: '1px solid #1890ff',
                borderRadius: '8px',
                minWidth: '250px',
                maxWidth: '300px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            headStyle={{
                background: '#e6f7ff',
                borderBottom: '1px solid #1890ff',
                padding: '0 12px',
                minHeight: '40px'
            }}
            bodyStyle={{ padding: '12px' }}
            title={
                <Space>
                    <MessageOutlined style={{ color: '#1890ff' }} />
                    <Text strong style={{ color: '#1890ff' }}>Send Message</Text>
                </Space>
            }
        >
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#1890ff', width: '10px', height: '10px' }}
            />

            <Paragraph
                ellipsis={{ rows: 3, expandable: false }}
                style={{ marginBottom: '12px', color: '#595959' }}
            >
                {data.text ? data.text : <Text type="secondary" italic>No message text configured...</Text>}
            </Paragraph>

            {data.buttons && Array.isArray(data.buttons) && (
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                    {data.buttons.map((btn, index) => (
                        <Button
                            key={index}
                            block
                            size="small"
                            style={{
                                textAlign: 'left',
                                background: '#f5f5f5',
                                borderColor: '#d9d9d9',
                                color: '#595959'
                            }}
                        >
                            {btn}
                        </Button>
                    ))}
                </Space>
            )}

            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#1890ff', width: '10px', height: '10px' }}
            />
        </Card>
    );
};

export default memo(MessageNode);
