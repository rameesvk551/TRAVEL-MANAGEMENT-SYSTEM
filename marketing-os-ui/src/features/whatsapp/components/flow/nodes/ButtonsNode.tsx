import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Card, Typography, Space, Button, Badge } from 'antd';
import { UnorderedListOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface ButtonsNodeData extends Record<string, unknown> {
    text?: string;
    buttons?: string[]; // Array of button labels
}

const ButtonsNode = ({ data }: NodeProps<Node<ButtonsNodeData>>) => {
    return (
        <Card
            size="small"
            style={{
                border: '1px solid #722ed1',
                borderRadius: '8px',
                minWidth: '250px',
                maxWidth: '300px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            headStyle={{
                background: '#f9f0ff',
                borderBottom: '1px solid #722ed1',
                padding: '0 12px',
                minHeight: '40px'
            }}
            bodyStyle={{ padding: '12px' }}
            title={
                <Space>
                    <UnorderedListOutlined style={{ color: '#722ed1' }} />
                    <Text strong style={{ color: '#722ed1' }}>Buttons / Menu</Text>
                </Space>
            }
            extra={<Badge count={data.buttons?.length || 0} color="#722ed1" />}
        >
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#722ed1', width: '10px', height: '10px' }}
            />

            <Paragraph
                ellipsis={{ rows: 3, expandable: false }}
                style={{ marginBottom: '12px', color: '#595959' }}
            >
                {data.text ? data.text : <Text type="secondary" italic>No message text...</Text>}
            </Paragraph>

            <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {data.buttons && data.buttons.length > 0 ? (
                    data.buttons.map((btn, index) => (
                        <div key={index} style={{ position: 'relative' }}>
                            <Button
                                block
                                size="small"
                                style={{
                                    textAlign: 'left',
                                    background: '#fff',
                                    borderColor: '#d9d9d9',
                                    color: '#722ed1',
                                    fontWeight: 500
                                }}
                            >
                                {btn}
                            </Button>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={`button-${index}`}
                                style={{
                                    background: '#722ed1',
                                    width: '8px',
                                    height: '8px',
                                    right: '-5px',
                                    top: '50%'
                                }}
                            />
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>No buttons added</Text>
                    </div>
                )}
            </Space>
        </Card>
    );
};

export default memo(ButtonsNode);
