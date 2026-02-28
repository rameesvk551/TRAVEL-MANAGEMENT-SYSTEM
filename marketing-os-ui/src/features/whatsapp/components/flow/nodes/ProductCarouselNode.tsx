import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Card, Typography, Space, Tag } from 'antd';
import { ShoppingOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface ProductCarouselNodeData extends Record<string, unknown> {
    message_template?: string;
    source?: 'category' | 'featured' | 'recent' | 'search_results' | 'recommendations';
    category?: string;
    max_products?: number;
}

const ProductCarouselNode = ({ data }: NodeProps<Node<ProductCarouselNodeData>>) => {
    return (
        <Card
            size="small"
            style={{
                border: '1px solid #eb2f96',
                borderRadius: '8px',
                minWidth: '250px',
                maxWidth: '300px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            headStyle={{
                background: '#fff0f6',
                borderBottom: '1px solid #eb2f96',
                padding: '0 12px',
                minHeight: '40px'
            }}
            bodyStyle={{ padding: '12px' }}
            title={
                <Space>
                    <ShoppingOutlined style={{ color: '#eb2f96' }} />
                    <Text strong style={{ color: '#eb2f96' }}>Product Carousel</Text>
                </Space>
            }
        >
            <Handle
                type="target"
                position={Position.Left}
                style={{ background: '#eb2f96', width: '10px', height: '10px' }}
            />

            <Paragraph
                ellipsis={{ rows: 2, expandable: false }}
                style={{ marginBottom: '12px', color: '#595959' }}
            >
                {data.message_template || <Text type="secondary" italic>No header message...</Text>}
            </Paragraph>

            <Space direction="vertical" style={{ width: '100%', marginBottom: '8px' }} size={4}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Source:</Text>
                    <Tag color="magenta">{data.source || 'Featured'}</Tag>
                </div>
                {data.source === 'category' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>Category:</Text>
                        <Text strong style={{ fontSize: '12px' }}>{data.category || 'All'}</Text>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Max items:</Text>
                    <Text style={{ fontSize: '12px' }}>{data.max_products || 5}</Text>
                </div>
            </Space>

            <div style={{
                background: '#fafafa',
                border: '1px dashed #d9d9d9',
                borderRadius: '4px',
                padding: '8px',
                textAlign: 'center'
            }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} style={{
                            width: '40px',
                            height: '40px',
                            background: '#e6f7ff',
                            borderRadius: '4px',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <ShoppingOutlined style={{ color: '#1890ff', opacity: 0.5 }} />
                        </div>
                    ))}
                </div>
                <Text type="secondary" style={{ fontSize: '10px' }}>Product Preview</Text>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                style={{ background: '#eb2f96', width: '10px', height: '10px' }}
            />
        </Card>
    );
};

export default memo(ProductCarouselNode);
