// WhatsAppAnalytics.tsx — pure render shell.
// All logic lives in hooks/useAnalytics.ts

import React from 'react';
import { Card, Row, Col, Statistic, Select, Typography } from 'antd';
import {
    MessageOutlined, ReadOutlined, ClockCircleOutlined,
    UsergroupAddOutlined, ArrowUpOutlined, ArrowDownOutlined,
} from '@ant-design/icons';
import { useAnalytics } from '../hooks/useAnalytics';

const { Title, Text } = Typography;
const { Option } = Select;

const WhatsAppAnalytics: React.FC = () => {
    const { period, setPeriod } = useAnalytics();

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <Title level={4}>WhatsApp Analytics</Title>
                <Select value={period} onChange={setPeriod} style={{ width: 120 }}>
                    <Option value="24h">Last 24 Hours</Option>
                    <Option value="7d">Last 7 Days</Option>
                    <Option value="30d">Last 30 Days</Option>
                </Select>
            </div>

            <Row gutter={[16, 16]}>
                <Col span={6}>
                    <Card>
                        <Statistic title="Total Messages Sent" value={12584} prefix={<MessageOutlined />} valueStyle={{ color: '#3f8600' }} />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            <ArrowUpOutlined style={{ color: '#3f8600' }} /> 12% vs last week
                        </Text>
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Delivery Rate" value={98.5} precision={1} suffix="%" prefix={<ReadOutlined />} valueStyle={{ color: '#3f8600' }} />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            <ArrowUpOutlined style={{ color: '#3f8600' }} /> 0.2% vs last week
                        </Text>
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="Avg. Response Time" value="4m 32s" prefix={<ClockCircleOutlined />} valueStyle={{ color: '#cf1322' }} />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            <ArrowDownOutlined style={{ color: '#cf1322' }} /> 15s slower vs last week
                        </Text>
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="New Opt-ins" value={342} prefix={<UsergroupAddOutlined />} valueStyle={{ color: '#3f8600' }} />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            <ArrowUpOutlined style={{ color: '#3f8600' }} /> 24% vs last week
                        </Text>
                    </Card>
                </Col>
            </Row>

            <Row gutter={24} style={{ marginTop: 24 }}>
                <Col span={12}>
                    <Card title="Message Volume Trend" style={{ height: 400 }}>
                        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 8 }}>
                            <Text type="secondary">Chart Visualization Placeholder</Text>
                        </div>
                    </Card>
                </Col>
                <Col span={12}>
                    <Card title="Campaign Performance" style={{ height: 400 }}>
                        <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', borderRadius: 8 }}>
                            <Text type="secondary">Campaign Performance Chart Placeholder</Text>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Row gutter={24} style={{ marginTop: 24 }}>
                <Col span={24}>
                    <Card title="Recent Campaigns">
                        <div style={{ textAlign: 'center', padding: 20 }}>
                            <Text type="secondary">No active campaigns in this period</Text>
                        </div>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default WhatsAppAnalytics;
