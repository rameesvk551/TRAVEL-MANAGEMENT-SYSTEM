import { Card, Statistic, Row, Col, Table, Tag, Spin, Empty, Progress } from 'antd';
import {
    UserOutlined,
    EyeOutlined,
    RiseOutlined,
    DollarOutlined,
    GlobalOutlined,
    MobileOutlined,
    DesktopOutlined,
    TabletOutlined,
    ThunderboltOutlined,
    FundOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { growthApi } from '../api/growth';
import { useResponsive } from '../hooks/useResponsive';
import type {
    SourceBreakdown,
    GeoData,
    DeviceData,
    MetaAudienceInsights,
    GoogleKeywordPerformance,
    GoogleSearchTermPerformance,
    GA4BehaviorData,
    GA4FunnelData,
} from '../api/growth';

const SOURCE_COLORS: Record<string, string> = {
    organic: '#52c41a',
    paid: '#1890ff',
    direct: '#722ed1',
    referral: '#fa8c16',
    social: '#eb2f96',
    email: '#13c2c2',
};

const DEVICE_ICONS: Record<string, React.ReactNode> = {
    desktop: <DesktopOutlined />,
    mobile: <MobileOutlined />,
    tablet: <TabletOutlined />,
};

export default function GrowthDashboard() {
    const { isMobile } = useResponsive();
    const { data: overview, isLoading: overviewLoading } = useQuery({
        queryKey: ['growth', 'overview'],
        queryFn: () => growthApi.getOverview(),
    });

    const { data: costMetrics, isLoading: costLoading } = useQuery({
        queryKey: ['growth', 'cost-metrics'],
        queryFn: () => growthApi.getCostMetrics(),
    });

    const { data: utmData } = useQuery({
        queryKey: ['growth', 'utm'],
        queryFn: () => growthApi.getUTM(),
    });

    const { data: realtime } = useQuery({
        queryKey: ['growth', 'realtime'],
        queryFn: () => growthApi.getRealtimeCount(),
        refetchInterval: 10000,
    });

    const { data: metaAudience, isLoading: metaAudienceLoading } = useQuery({
        queryKey: ['growth', 'meta-audience'],
        queryFn: () => growthApi.getMetaAudienceInsights(),
    });

    const { data: googleKeywords, isLoading: googleKeywordsLoading } = useQuery({
        queryKey: ['growth', 'google-keywords'],
        queryFn: () => growthApi.getGoogleKeywordPerformance(),
    });

    const { data: googleSearchTerms, isLoading: googleSearchTermsLoading } = useQuery({
        queryKey: ['growth', 'google-search-terms'],
        queryFn: () => growthApi.getGoogleSearchTerms(),
    });

    const { data: ga4Behavior, isLoading: ga4BehaviorLoading } = useQuery({
        queryKey: ['growth', 'ga4-behavior'],
        queryFn: () => growthApi.getGA4Behavior(),
    });

    const { data: ga4Funnels, isLoading: ga4FunnelsLoading } = useQuery({
        queryKey: ['growth', 'ga4-funnels'],
        queryFn: () => growthApi.getGA4Funnels(),
    });

    if (overviewLoading || costLoading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
                <Spin size="large" />
            </div>
        );
    }

    const totalSources = overview?.sourceBreakdown?.reduce((s, b) => s + b.count, 0) || 1;

    return (
        <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: 1400, margin: '0 auto' }}>
            {/* Header */}
            <div className="page-header" style={{ marginBottom: isMobile ? 16 : 24 }}>
                <div>
                    <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Growth & Acquisition
                    </h1>
                    <p style={{ color: '#8c8c8c', margin: '4px 0 0', fontSize: isMobile ? 13 : 14 }}>Track visitors, sources, conversions, and ad performance</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'linear-gradient(135deg, #52c41a22, #52c41a11)',
                        border: '1px solid #52c41a44',
                        borderRadius: 20, padding: '6px 16px',
                    }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a', animation: 'pulse 2s infinite' }} />
                        <span style={{ fontWeight: 600, color: '#52c41a' }}>{realtime?.count || 0} live</span>
                    </div>
                </div>
            </div>

            {/* Key Metrics Row */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #667eea11, #764ba211)', border: '1px solid #667eea33' }}>
                        <Statistic
                            title={<span style={{ color: '#8c8c8c' }}>Total Visitors</span>}
                            value={overview?.totalVisitors || 0}
                            prefix={<UserOutlined style={{ color: '#667eea' }} />}
                            valueStyle={{ color: '#667eea', fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #52c41a11, #73d13d11)', border: '1px solid #52c41a33' }}>
                        <Statistic
                            title={<span style={{ color: '#8c8c8c' }}>Pageviews</span>}
                            value={overview?.pageviews || 0}
                            prefix={<EyeOutlined style={{ color: '#52c41a' }} />}
                            valueStyle={{ color: '#52c41a', fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #fa8c1611, #ffa94011)', border: '1px solid #fa8c1633' }}>
                        <Statistic
                            title={<span style={{ color: '#8c8c8c' }}>Conversions</span>}
                            value={costMetrics?.totalConversions || 0}
                            prefix={<RiseOutlined style={{ color: '#fa8c16' }} />}
                            valueStyle={{ color: '#fa8c16', fontWeight: 700 }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={6}>
                    <Card style={{ borderRadius: 12, background: 'linear-gradient(135deg, #1890ff11, #40a9ff11)', border: '1px solid #1890ff33' }}>
                        <Statistic
                            title={<span style={{ color: '#8c8c8c' }}>Revenue</span>}
                            value={costMetrics?.totalConversionValue || 0}
                            prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
                            precision={2}
                            valueStyle={{ color: '#1890ff', fontWeight: 700 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Cost Metrics Row */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={16}>
                    <Card title={<span><FundOutlined /> Cost Metrics</span>} style={{ borderRadius: 12, height: '100%' }}>
                        <Row gutter={[16, 16]}>
                            <Col span={6}>
                                <Statistic
                                    title="CPL"
                                    value={costMetrics?.cpl || 0}
                                    prefix="$"
                                    precision={2}
                                    valueStyle={{ fontSize: 20, fontWeight: 600, color: '#722ed1' }}
                                />
                                <p style={{ color: '#8c8c8c', fontSize: 12, margin: '4px 0 0' }}>Cost per Lead</p>
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="CPA"
                                    value={costMetrics?.cpa || 0}
                                    prefix="$"
                                    precision={2}
                                    valueStyle={{ fontSize: 20, fontWeight: 600, color: '#eb2f96' }}
                                />
                                <p style={{ color: '#8c8c8c', fontSize: 12, margin: '4px 0 0' }}>Cost per Acquisition</p>
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="CAC"
                                    value={costMetrics?.cac || 0}
                                    prefix="$"
                                    precision={2}
                                    valueStyle={{ fontSize: 20, fontWeight: 600, color: '#fa541c' }}
                                />
                                <p style={{ color: '#8c8c8c', fontSize: 12, margin: '4px 0 0' }}>Customer Acq. Cost</p>
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="ROAS"
                                    value={costMetrics?.roas || 0}
                                    suffix="x"
                                    precision={2}
                                    valueStyle={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }}
                                />
                                <p style={{ color: '#8c8c8c', fontSize: 12, margin: '4px 0 0' }}>Return on Ad Spend</p>
                            </Col>
                        </Row>
                        {costMetrics?.adSpendByPlatform && costMetrics.adSpendByPlatform.length > 0 && (
                            <div style={{ marginTop: 24 }}>
                                <h4 style={{ color: '#595959', marginBottom: 12 }}>Ad Spend by Platform</h4>
                                {costMetrics.adSpendByPlatform.map((p) => (
                                    <div key={p.platform} style={{ marginBottom: 8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{p.platform}</span>
                                            <span style={{ fontWeight: 600 }}>${p.spend.toFixed(2)}</span>
                                        </div>
                                        <Progress
                                            percent={costMetrics.totalSpend > 0 ? Math.round((p.spend / costMetrics.totalSpend) * 100) : 0}
                                            showInfo={false}
                                            strokeColor={p.platform === 'meta' ? '#1877F2' : p.platform === 'google' ? '#EA4335' : '#667eea'}
                                            size="small"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card title={<span><ThunderboltOutlined /> Traffic Sources</span>} style={{ borderRadius: 12, height: '100%' }}>
                        {overview?.sourceBreakdown && overview.sourceBreakdown.length > 0 ? (
                            <div>
                                {overview.sourceBreakdown.map((src: SourceBreakdown) => (
                                    <div key={src.sourceType} style={{ marginBottom: 12 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <Tag color={SOURCE_COLORS[src.sourceType] || '#667eea'} style={{ textTransform: 'capitalize' }}>
                                                {src.sourceType}
                                            </Tag>
                                            <span style={{ fontWeight: 600 }}>{src.count} <span style={{ color: '#8c8c8c', fontWeight: 400 }}>({Math.round((src.count / totalSources) * 100)}%)</span></span>
                                        </div>
                                        <Progress
                                            percent={Math.round((src.count / totalSources) * 100)}
                                            showInfo={false}
                                            strokeColor={SOURCE_COLORS[src.sourceType] || '#667eea'}
                                            size="small"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty description="No traffic data yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Geo + Device + UTM Row */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} md={8}>
                    <Card title={<span><GlobalOutlined /> Top Countries</span>} style={{ borderRadius: 12, height: '100%' }}>
                        {overview?.geoBreakdown && overview.geoBreakdown.length > 0 ? (
                            <div>
                                {overview.geoBreakdown.map((geo: GeoData, i: number) => (
                                    <div key={geo.country} style={{
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        padding: '8px 0', borderBottom: i < overview.geoBreakdown.length - 1 ? '1px solid #f0f0f0' : 'none',
                                    }}>
                                        <span style={{ fontWeight: 500 }}>{geo.country}</span>
                                        <Tag color="blue">{geo.count}</Tag>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty description="No geo data yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card title={<span><MobileOutlined /> Devices</span>} style={{ borderRadius: 12, height: '100%' }}>
                        {overview?.deviceBreakdown && overview.deviceBreakdown.length > 0 ? (
                            <div>
                                {overview.deviceBreakdown.map((dev: DeviceData) => {
                                    const totalDevices = overview.deviceBreakdown.reduce((s: number, d: DeviceData) => s + d.count, 0) || 1;
                                    return (
                                        <div key={dev.deviceType} style={{ marginBottom: 16 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    {DEVICE_ICONS[dev.deviceType] || <DesktopOutlined />}
                                                    <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{dev.deviceType}</span>
                                                </span>
                                                <span style={{ fontWeight: 600 }}>{Math.round((dev.count / totalDevices) * 100)}%</span>
                                            </div>
                                            <Progress
                                                percent={Math.round((dev.count / totalDevices) * 100)}
                                                showInfo={false}
                                                strokeColor={dev.deviceType === 'desktop' ? '#667eea' : dev.deviceType === 'mobile' ? '#52c41a' : '#fa8c16'}
                                                size="small"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <Empty description="No device data yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card title="UTM Campaigns" style={{ borderRadius: 12, height: '100%' }}>
                        {utmData?.utmData && utmData.utmData.length > 0 ? (
                            <Table
                                dataSource={utmData.utmData}
                                rowKey={(r) => `${r.utmSource}-${r.utmCampaign}`}
                                size="small"
                                pagination={false}
                                columns={[
                                    { title: 'Source', dataIndex: 'utmSource', key: 'utmSource', ellipsis: true },
                                    { title: 'Campaign', dataIndex: 'utmCampaign', key: 'utmCampaign', ellipsis: true },
                                    {
                                        title: 'Visits', dataIndex: 'count', key: 'count',
                                        sorter: (a, b) => a.count - b.count,
                                        render: (v: number) => <Tag color="blue">{v}</Tag>,
                                    },
                                ]}
                            />
                        ) : (
                            <Empty description="No UTM data yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Landing Pages */}
            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Card title="Top Landing Pages" style={{ borderRadius: 12 }}>
                        {overview?.topLandingPages && overview.topLandingPages.length > 0 ? (
                            <Table
                                dataSource={overview.topLandingPages}
                                rowKey="landingPage"
                                size="small"
                                pagination={false}
                                columns={[
                                    {
                                        title: 'Landing Page', dataIndex: 'landingPage', key: 'landingPage',
                                        render: (url: string) => (
                                            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
                                                {url.length > 60 ? url.substring(0, 60) + '...' : url}
                                            </a>
                                        ),
                                    },
                                    {
                                        title: 'Visits', dataIndex: 'count', key: 'count', width: 100,
                                        sorter: (a, b) => a.count - b.count,
                                        render: (v: number) => <Tag color="purple">{v}</Tag>,
                                    },
                                ]}
                            />
                        ) : (
                            <Empty description="No landing page data yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Meta Audience Insights */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col span={24}>
                    <Card title="Meta Audience Insights" style={{ borderRadius: 12 }}>
                        {metaAudienceLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spin /></div>
                        ) : !metaAudience || (!metaAudience.ageGender?.length && !metaAudience.interests?.length) ? (
                            <Empty description="No Meta audience insights available. Configure Meta credentials and sync data." />
                        ) : (
                            <>
                                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                    <Col xs={12} sm={6}>
                                        <Statistic title="New Users" value={metaAudience.newVsReturning?.newUsers || 0} />
                                    </Col>
                                    <Col xs={12} sm={6}>
                                        <Statistic title="Returning Users" value={metaAudience.newVsReturning?.returningUsers || 0} />
                                    </Col>
                                    <Col xs={12} sm={6}>
                                        <Statistic title="Top Age Group" value={metaAudience.ageBreakdown?.[0]?.age || 'n/a'} />
                                    </Col>
                                    <Col xs={12} sm={6}>
                                        <Statistic title="Top Gender" value={metaAudience.genderBreakdown?.[0]?.gender || 'n/a'} />
                                    </Col>
                                </Row>
                                <Row gutter={[16, 16]}>
                                    <Col xs={24} lg={15}>
                                        <Table
                                            size="small"
                                            pagination={{ pageSize: 6 }}
                                            dataSource={metaAudience.ageGender || []}
                                            rowKey={(r: MetaAudienceInsights['ageGender'][number]) => `${r.age}-${r.gender}`}
                                            columns={[
                                                { title: 'Age', dataIndex: 'age', key: 'age' },
                                                { title: 'Gender', dataIndex: 'gender', key: 'gender' },
                                                { title: 'Impressions', dataIndex: 'impressions', key: 'impressions' },
                                                { title: 'Clicks', dataIndex: 'clicks', key: 'clicks' },
                                                { title: 'Conversions', dataIndex: 'conversions', key: 'conversions' },
                                                { title: 'Spend', dataIndex: 'spend', key: 'spend', render: (v: number) => `$${(v || 0).toFixed(2)}` },
                                            ]}
                                        />
                                    </Col>
                                    <Col xs={24} lg={9}>
                                        <Table
                                            size="small"
                                            pagination={{ pageSize: 6 }}
                                            dataSource={metaAudience.interests || []}
                                            rowKey={(r: { interest: string }) => r.interest}
                                            columns={[
                                                { title: 'Interest', dataIndex: 'interest', key: 'interest' },
                                                { title: 'Count', dataIndex: 'count', key: 'count', render: (v: number) => <Tag color="blue">{v}</Tag> },
                                            ]}
                                        />
                                    </Col>
                                </Row>
                            </>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* Google Ads Keyword / Search Term Panels */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col span={24}>
                    <Card title="Google Ads Keywords & Search Terms" style={{ borderRadius: 12 }}>
                        {(googleKeywordsLoading || googleSearchTermsLoading) ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spin /></div>
                        ) : (
                            <Row gutter={[16, 16]}>
                                <Col xs={24} lg={12}>
                                    <Table
                                        title={() => 'Keyword Performance'}
                                        size="small"
                                        pagination={{ pageSize: 7 }}
                                        dataSource={googleKeywords || []}
                                        rowKey={(r: GoogleKeywordPerformance, idx) => `${r.keyword}-${idx}`}
                                        locale={{ emptyText: 'No keyword data' }}
                                        columns={[
                                            { title: 'Keyword', dataIndex: 'keyword', key: 'keyword', ellipsis: true },
                                            { title: 'Campaign', dataIndex: 'campaignName', key: 'campaignName', ellipsis: true },
                                            { title: 'Clicks', dataIndex: 'clicks', key: 'clicks' },
                                            { title: 'CTR', dataIndex: 'ctr', key: 'ctr', render: (v: number) => `${((v || 0) * 100).toFixed(2)}%` },
                                            { title: 'CPC', dataIndex: 'cpc', key: 'cpc', render: (v: number) => `$${(v || 0).toFixed(2)}` },
                                            { title: 'Conv', dataIndex: 'conversions', key: 'conversions' },
                                        ]}
                                    />
                                </Col>
                                <Col xs={24} lg={12}>
                                    <Table
                                        title={() => 'Search Terms'}
                                        size="small"
                                        pagination={{ pageSize: 7 }}
                                        dataSource={googleSearchTerms || []}
                                        rowKey={(r: GoogleSearchTermPerformance, idx) => `${r.searchTerm}-${idx}`}
                                        locale={{ emptyText: 'No search term data' }}
                                        columns={[
                                            { title: 'Search Term', dataIndex: 'searchTerm', key: 'searchTerm', ellipsis: true },
                                            { title: 'Campaign', dataIndex: 'campaignName', key: 'campaignName', ellipsis: true },
                                            { title: 'Impr', dataIndex: 'impressions', key: 'impressions' },
                                            { title: 'Clicks', dataIndex: 'clicks', key: 'clicks' },
                                            { title: 'CTR', dataIndex: 'ctr', key: 'ctr', render: (v: number) => `${((v || 0) * 100).toFixed(2)}%` },
                                            { title: 'Conv', dataIndex: 'conversions', key: 'conversions' },
                                        ]}
                                    />
                                </Col>
                            </Row>
                        )}
                    </Card>
                </Col>
            </Row>

            {/* GA4 Behavior + Funnel Panels */}
            <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
                <Col span={24}>
                    <Card title="GA4 Behavior & Funnel" style={{ borderRadius: 12 }}>
                        {(ga4BehaviorLoading || ga4FunnelsLoading) ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spin /></div>
                        ) : !ga4Behavior || !ga4Funnels ? (
                            <Empty description="No GA4 behavior data available." />
                        ) : (
                            <>
                                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                                    <Col xs={12} sm={6}>
                                        <Statistic title="Users" value={ga4Behavior.overview?.users || 0} />
                                    </Col>
                                    <Col xs={12} sm={6}>
                                        <Statistic title="Sessions" value={ga4Behavior.overview?.sessions || 0} />
                                    </Col>
                                    <Col xs={12} sm={6}>
                                        <Statistic title="Engaged Sessions" value={ga4Behavior.overview?.engagedSessions || 0} />
                                    </Col>
                                    <Col xs={12} sm={6}>
                                        <Statistic title="Avg Engagement (s)" value={Math.round(ga4Behavior.overview?.avgEngagementTime || 0)} />
                                    </Col>
                                </Row>

                                <Row gutter={[16, 16]}>
                                    <Col xs={24} lg={14}>
                                        <Table
                                            title={() => 'Top Pages'}
                                            size="small"
                                            pagination={{ pageSize: 6 }}
                                            dataSource={ga4Behavior.topPages || []}
                                            rowKey={(r: GA4BehaviorData['topPages'][number], idx) => `${r.pagePath}-${idx}`}
                                            locale={{ emptyText: 'No page behavior data' }}
                                            columns={[
                                                { title: 'Page', dataIndex: 'pagePath', key: 'pagePath', ellipsis: true },
                                                { title: 'Views', dataIndex: 'views', key: 'views' },
                                                { title: 'Users', dataIndex: 'users', key: 'users' },
                                                { title: 'Avg Dur (s)', dataIndex: 'avgSessionDuration', key: 'avgSessionDuration', render: (v: number) => Math.round(v || 0) },
                                            ]}
                                        />
                                    </Col>
                                    <Col xs={24} lg={10}>
                                        <Card size="small" title="Funnel Drop-off">
                                            {ga4Funnels.steps?.length ? (
                                                ga4Funnels.steps.map((step: GA4FunnelData['steps'][number]) => {
                                                    const baseline = ga4Funnels.steps?.[0]?.users || 1;
                                                    const percent = Math.round(((step.users || 0) / baseline) * 100);
                                                    return (
                                                        <div key={step.step} style={{ marginBottom: 12 }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                                <span>{step.step}</span>
                                                                <span>{step.users} users</span>
                                                            </div>
                                                            <Progress percent={percent} showInfo={false} />
                                                            {step.dropOffRate > 0 ? (
                                                                <span style={{ fontSize: 12, color: '#8c8c8c' }}>Drop-off: {step.dropOffRate.toFixed(2)}%</span>
                                                            ) : null}
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <Empty description="No funnel events found" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                                            )}
                                        </Card>
                                    </Col>
                                </Row>
                            </>
                        )}
                    </Card>
                </Col>
            </Row>

            <style>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
