import { Card, Row, Col, Tag, Spin, Typography, Space, Alert, List, Progress, Badge, Empty } from 'antd';
import { BulbOutlined, WarningOutlined, RiseOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { aiApi } from '../api/modules';
import { useResponsive } from '../hooks/useResponsive';

const { Title, Text, Paragraph } = Typography;

const impactColors: Record<string, string> = { high: '#EF4444', medium: '#F59E0B', low: '#10B981' };

export default function AIDashboard() {
    const { isMobile } = useResponsive();
    const { data, isLoading } = useQuery({ queryKey: ['ai-dashboard'], queryFn: aiApi.getDashboard });

    if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;
    if (!data) return null;

    return (
        <div>
            <Title level={isMobile ? 4 : 3} style={{ marginBottom: 20 }}>🤖 AI Growth Intelligence</Title>

            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={24} md={12}>
                    <Card title={<Space><WarningOutlined style={{ color: '#F59E0B' }} /> Anomaly Detection</Space>} style={{ borderRadius: 12, height: '100%' }}>
                        {data.anomalies?.length > 0 ? data.anomalies.map((a: any, i: number) => (
                            <Alert key={i} type={a.severity === 'critical' ? 'error' : a.severity === 'warning' ? 'warning' : 'info'} message={a.message}
                                description={<Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>Current: {a.current} | Expected: {a.expected}</Text>}
                                showIcon style={{ marginBottom: 8, borderRadius: 8 }} />
                        )) : <Empty description="No anomalies detected" />}
                    </Card>
                </Col>
                <Col xs={24} md={12}>
                    <Card title={<Space><RiseOutlined style={{ color: '#6366F1' }} /> Growth Predictions</Space>} style={{ borderRadius: 12, height: '100%' }}>
                        {data.predictions?.length > 0 ? (
                            <List dataSource={data.predictions} renderItem={(p: any) => (
                                <List.Item>
                                    <div style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                                            <Text strong style={{ textTransform: 'capitalize', fontSize: isMobile ? 13 : 14 }}>{p.metric.replace(/_/g, ' ')}</Text>
                                            <Tag color="blue">{p.timeframe.replace(/_/g, ' ')}</Tag>
                                        </div>
                                        <div style={{ marginTop: 4 }}>
                                            <Text>{p.currentValue} → <Text type="success" strong>{p.predictedValue}</Text></Text>
                                            <Progress percent={p.confidence} size="small" strokeColor="#6366F1" style={{ marginTop: 4 }} />
                                        </div>
                                    </div>
                                </List.Item>
                            )} />
                        ) : <Empty description="No predictions" />}
                    </Card>
                </Col>
            </Row>

            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                <Col xs={24} md={14}>
                    <Card title={<Space><BulbOutlined style={{ color: '#10B981' }} /> Growth Recommendations</Space>} style={{ borderRadius: 12 }}>
                        {data.recommendations?.length > 0 ? (
                            <List dataSource={data.recommendations} renderItem={(r: any) => (
                                <List.Item>
                                    <div style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            <Tag color={impactColors[r.impact]}>{r.impact} impact</Tag>
                                            <Tag>{r.effort} effort</Tag>
                                            <Tag color="purple">{r.category}</Tag>
                                        </div>
                                        <div style={{ marginTop: 8 }}>
                                            <Text strong style={{ fontSize: isMobile ? 13 : 14 }}>{r.title}</Text>
                                            <Paragraph type="secondary" style={{ marginTop: 4, marginBottom: 0, fontSize: isMobile ? 12 : 13 }}>{r.description}</Paragraph>
                                        </div>
                                    </div>
                                </List.Item>
                            )} />
                        ) : <Empty description="No recommendations" />}
                    </Card>
                </Col>
                <Col xs={24} md={10}>
                    <Card title={<Space><ExclamationCircleOutlined style={{ color: '#EF4444' }} /> Churn Risk Alerts</Space>} style={{ borderRadius: 12 }}>
                        {data.churnRisk?.length > 0 ? (
                            <List dataSource={data.churnRisk} renderItem={(c: any) => (
                                <List.Item>
                                    <div style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                                            <Text strong style={{ fontSize: isMobile ? 13 : 14 }}>{c.customerId}</Text>
                                            <Badge count={`${c.riskScore}%`} style={{ backgroundColor: c.riskScore > 70 ? '#EF4444' : c.riskScore > 40 ? '#F59E0B' : '#10B981' }} />
                                        </div>
                                        <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                            {c.factors?.map((f: string, i: number) => <Tag key={i} style={{ marginBottom: 2, fontSize: isMobile ? 11 : 12 }}>{f}</Tag>)}
                                        </div>
                                    </div>
                                </List.Item>
                            )} />
                        ) : <Empty description="No churn risk data" />}
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
