import React, { useEffect, useState } from 'react';
import { Form, Input, Select, InputNumber, Typography, Button, Space, Divider } from 'antd';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import type { Node } from '@xyflow/react';
import WhatsAppPreviewModal from './WhatsAppPreviewModal';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface NodePanelProps {
    selectedNode: Node | null;
    setNodes: (nodes: (nds: Node[]) => Node[]) => void;
    onDelete?: () => void;
}

const NodePanel: React.FC<NodePanelProps> = ({ selectedNode, setNodes, onDelete }) => {
    const [form] = Form.useForm();
    const [previewVisible, setPreviewVisible] = useState(false);

    useEffect(() => {
        if (selectedNode) {
            form.setFieldsValue(selectedNode.data);
        }
    }, [selectedNode, form]);

    const handleValuesChange = (_: any, allValues: any) => {
        if (!selectedNode) return;

        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === selectedNode.id) {
                    return {
                        ...node,
                        data: { ...node.data, ...allValues },
                    };
                }
                return node;
            })
        );
    };

    if (!selectedNode) {
        return (
            <div style={{ padding: '16px', borderLeft: '1px solid #f0f0f0', height: '100%', background: '#fff' }}>
                <Text type="secondary">Select a node to edit its properties.</Text>
            </div>
        );
    }

    const renderContent = () => {
        switch (selectedNode.type) {
            case 'start':
                return (
                    <>
                        <Form.Item name="triggerType" label="Trigger Type" initialValue="keyword">
                            <Select>
                                <Option value="keyword">Keyword Match</Option>
                                <Option value="welcome">Welcome Message (New Conversation)</Option>
                                <Option value="away">Away Message (Outside Business Hours)</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(prev, current) => prev.triggerType !== current.triggerType}
                        >
                            {({ getFieldValue }) =>
                                (getFieldValue('triggerType') === 'keyword' || !getFieldValue('triggerType')) ? (
                                    <Form.Item name="keywords" label="Keywords">
                                        <Select mode="tags" placeholder="Enter keywords (e.g., hello, start)" />
                                    </Form.Item>
                                ) : null
                            }
                        </Form.Item>
                    </>
                );
            case 'message':
                return (
                    <>
                        <Form.Item name="text" label="Message Text">
                            <TextArea rows={4} placeholder="Enter message text..." />
                        </Form.Item>
                        <Form.Item name="buttons" label="Reply Buttons">
                            <Select mode="tags" placeholder="Add buttons (max 3)" maxTagCount={3} />
                        </Form.Item>
                        <Form.Item name="mediaUrl" label="Media URL">
                            <Input placeholder="https://..." />
                        </Form.Item>
                    </>
                );
            case 'buttons':
                return (
                    <>
                        <Form.Item name="text" label="Message Text">
                            <TextArea rows={4} placeholder="Enter message text..." />
                        </Form.Item>
                        <Form.Item name="buttons" label="Buttons">
                            <Select mode="tags" placeholder="Type and press enter (max 3)" maxTagCount={3} />
                        </Form.Item>
                    </>
                );
            case 'product_carousel':
                return (
                    <>
                        <Form.Item name="message_template" label="Header Message">
                            <Input placeholder="Check out these products..." />
                        </Form.Item>
                        <Form.Item name="source" label="Product Source" initialValue="featured">
                            <Select>
                                <Option value="featured">Featured Products</Option>
                                <Option value="category">Specific Category</Option>
                                <Option value="recent">Recently Added</Option>
                                <Option value="recommendations">AI Recommendations</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item
                            noStyle
                            shouldUpdate={(prev, current) => prev.source !== current.source}
                        >
                            {({ getFieldValue }) =>
                                getFieldValue('source') === 'category' ? (
                                    <Form.Item name="category" label="Category">
                                        <Select placeholder="Select category">
                                            <Option value="electronics">Electronics</Option>
                                            <Option value="clothing">Clothing</Option>
                                            <Option value="accessories">Accessories</Option>
                                        </Select>
                                    </Form.Item>
                                ) : null
                            }
                        </Form.Item>
                        <Form.Item name="max_products" label="Max Items" initialValue={5}>
                            <InputNumber min={1} max={10} />
                        </Form.Item>
                    </>
                );
            case 'add_to_cart':
                return (
                    <>
                        <Form.Item name="product_source" label="Product Source" initialValue="selected">
                            <Select>
                                <Option value="selected">User Selected (Previous Node)</Option>
                                <Option value="specific">Specific Product ID</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="ask_quantity" label="Ask Quantity" valuePropName="checked">
                            <Select>
                                <Option value={true}>Yes, ask user</Option>
                                <Option value={false}>No, add 1 item</Option>
                            </Select>
                        </Form.Item>
                    </>
                );
            case 'checkout':
                return (
                    <>
                        <Text strong>Information to Collect:</Text>
                        <Form.Item name="collect_name" valuePropName="checked" initialValue={true}>
                            <Select>
                                <Option value={true}>Collect Name</Option>
                                <Option value={false}>Skip Name</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="collect_address" valuePropName="checked" initialValue={true}>
                            <Select>
                                <Option value={true}>Collect Address</Option>
                                <Option value={false}>Skip Address</Option>
                            </Select>
                        </Form.Item>
                    </>
                );
            case 'delay':
                return (
                    <Space align="baseline">
                        <Form.Item name="duration" label="Duration">
                            <InputNumber min={1} />
                        </Form.Item>
                        <Form.Item name="unit" label="Unit">
                            <Select style={{ width: 100 }}>
                                <Option value="seconds">Seconds</Option>
                                <Option value="minutes">Minutes</Option>
                                <Option value="hours">Hours</Option>
                                <Option value="days">Days</Option>
                            </Select>
                        </Form.Item>
                    </Space>
                );
            case 'condition':
                return (
                    <>
                        <Form.Item name="field" label="Field">
                            <Select>
                                <Option value="message_body">Message Body</Option>
                                <Option value="sender_phone">Sender Phone</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="operator" label="Operator">
                            <Select>
                                <Option value="equals">Equals</Option>
                                <Option value="contains">Contains</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="value" label="Value">
                            <Input />
                        </Form.Item>
                    </>
                );
            case 'label':
                return (
                    <>
                        <Form.Item name="action" label="Action">
                            <Select>
                                <Option value="add">Add Tag</Option>
                                <Option value="remove">Remove Tag</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="tags" label="Tags">
                            <Select mode="tags" placeholder="Enter tags..." />
                        </Form.Item>
                    </>
                );
            default:
                return <Text>No properties for this node type.</Text>;
        }
    };

    return (
        <div style={{ padding: '16px', borderLeft: '1px solid #f0f0f0', height: '100%', background: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title level={5} style={{ margin: 0 }}>Properties</Title>
                <Space>
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => setPreviewVisible(true)}
                    >
                        Preview
                    </Button>
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={onDelete}
                        size="small"
                    />
                </Space>
            </div>

            <Form
                form={form}
                layout="vertical"
                onValuesChange={handleValuesChange}
                initialValues={{ unit: 'seconds' }}
            >
                <Form.Item name="label" label="Label">
                    <Input placeholder="Node Label" />
                </Form.Item>

                <Divider style={{ margin: '12px 0' }} />

                {renderContent()}
            </Form>

            <WhatsAppPreviewModal
                visible={previewVisible}
                onClose={() => setPreviewVisible(false)}
                data={selectedNode.data}
                nodeType={selectedNode.type || 'unknown'}
            />
        </div>
    );
};

export default NodePanel;
