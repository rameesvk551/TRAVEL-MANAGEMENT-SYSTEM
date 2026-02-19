import { useMemo, useState } from 'react';
import { Card, Row, Col, Input, Button, Tag, Alert, message, Typography, Space, Divider, Spin, Switch } from 'antd';
import { CopyOutlined, CheckCircleOutlined, CodeOutlined, SettingOutlined, ApiOutlined, SyncOutlined, SaveOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IntegrationCredentialStatus, IntegrationStatus, SyncCostsResponse } from '../api/growth';
import { growthApi } from '../api/growth';
import { useResponsive } from '../hooks/useResponsive';

const { Text, Paragraph } = Typography;
const DEFAULT_SYNC_START_DATE = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const DEFAULT_SYNC_END_DATE = new Date().toISOString().slice(0, 10);

type SaveCredentialsVars = {
    platform: string;
    credentials: Record<string, string>;
    isActive: boolean;
};

function getErrorMessage(error: unknown, fallback: string): string {
    if (error && typeof error === 'object') {
        const maybeError = error as {
            response?: { data?: { error?: string } };
            message?: string;
        };
        if (typeof maybeError.response?.data?.error === 'string') {
            return maybeError.response.data.error;
        }
        if (typeof maybeError.message === 'string') {
            return maybeError.message;
        }
    }
    return fallback;
}

export default function TrackingSetup() {
    const { isMobile } = useResponsive();
    const tenantId = localStorage.getItem('tenantId') || 'default-tenant-id';
    const [syncStartDate, setSyncStartDate] = useState(DEFAULT_SYNC_START_DATE);
    const [syncEndDate, setSyncEndDate] = useState(DEFAULT_SYNC_END_DATE);

    const [metaEnabledOverride, setMetaEnabledOverride] = useState<boolean | undefined>(undefined);
    const [googleEnabledOverride, setGoogleEnabledOverride] = useState<boolean | undefined>(undefined);

    const [metaCredentials, setMetaCredentials] = useState({
        pixelId: '',
        accessToken: '',
        adAccountId: '',
        apiVersion: 'v21.0',
    });

    const [googleCredentials, setGoogleCredentials] = useState({
        ga4PropertyId: '',
        ga4MeasurementId: '',
        ga4ApiSecret: '',
        customerId: '',
        developerToken: '',
        refreshToken: '',
        clientId: '',
        clientSecret: '',
        loginCustomerId: '',
        conversionActionId: '',
        currency: 'USD',
    });

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const queryClient = useQueryClient();
    const pixelScriptQuery = new URLSearchParams({
        tid: tenantId,
        apiUrl: `${apiUrl}/growth/track`,
    }).toString();

    const pixelScript = `<script src="${apiUrl}/growth/pixel.js?${pixelScriptQuery}"></script>`;
    const conversionScript = `
// Track a conversion event
MOS.track('conversion', 'purchase', {
  value: 99.99,
  currency: 'USD',
  orderId: 'ORD-123',
});`;
    const customEventScript = `
// Track any custom event
MOS.track('custom', 'button_click', {
  buttonId: 'hero-cta',
  page: window.location.pathname,
});`;

    const { data: integrationStatus = [], isLoading: integrationLoading } = useQuery<IntegrationStatus[]>({
        queryKey: ['growth', 'integrations', 'status'],
        queryFn: growthApi.getIntegrationStatus,
    });

    const { data: integrationCredentials = [], isLoading: credentialsLoading } = useQuery<IntegrationCredentialStatus[]>({
        queryKey: ['growth', 'integrations', 'credentials'],
        queryFn: growthApi.getIntegrationCredentials,
    });

    const credentialMap = useMemo(
        () => new Map(integrationCredentials.map((c) => [c.platform, c])),
        [integrationCredentials]
    );
    const metaEnabled = metaEnabledOverride ?? (credentialMap.get('meta')?.isActive !== false);
    const googleEnabled = googleEnabledOverride ?? (credentialMap.get('google')?.isActive !== false);

    const saveCredentialsMutation = useMutation<IntegrationStatus, unknown, SaveCredentialsVars>({
        mutationFn: ({ platform, credentials, isActive }: SaveCredentialsVars) =>
            growthApi.saveIntegrationCredentials(platform, credentials, isActive),
        onSuccess: (data) => {
            message.success(`${data.platform} credentials saved`);
            queryClient.invalidateQueries({ queryKey: ['growth', 'integrations', 'status'] });
            queryClient.invalidateQueries({ queryKey: ['growth', 'integrations', 'credentials'] });
        },
        onError: (error) => {
            message.error(getErrorMessage(error, 'Failed to save credentials'));
        },
    });

    const testIntegrationMutation = useMutation<IntegrationStatus | IntegrationStatus[], unknown, string>({
        mutationFn: (platform: string) => growthApi.testIntegration(platform),
        onSuccess: (data) => {
            const result = Array.isArray(data) ? data[0] : data;
            message.success(`${result?.platform || 'Integration'}: ${result?.message || 'Test successful'}`);
            queryClient.invalidateQueries({ queryKey: ['growth', 'integrations', 'status'] });
        },
        onError: (error) => {
            message.error(getErrorMessage(error, 'Integration test failed'));
        },
    });

    const syncCostsMutation = useMutation<SyncCostsResponse, unknown, { startDate: string; endDate: string }>({
        mutationFn: ({ startDate, endDate }: { startDate: string; endDate: string }) =>
            growthApi.syncAdCosts(startDate, endDate),
        onSuccess: (data) => {
            const errors = data?.errors?.length || 0;
            if (errors > 0) {
                message.warning(`Synced ${data.synced} records with ${errors} platform errors`);
            } else {
                message.success(`Synced ${data.synced} ad cost records`);
            }
            queryClient.invalidateQueries({ queryKey: ['growth', 'cost-metrics'] });
            queryClient.invalidateQueries({ queryKey: ['growth', 'integrations', 'status'] });
        },
        onError: (error) => {
            message.error(getErrorMessage(error, 'Failed to sync ad costs'));
        },
    });

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            message.success('Copied to clipboard');
        } catch {
            message.error('Clipboard copy failed');
        }
    };

    const statusColor = (configured: boolean, connected: boolean): 'default' | 'green' | 'orange' => {
        if (!configured) return 'default';
        return connected ? 'green' : 'orange';
    };

    const renderMaskedSummary = (platform: string) => {
        const item = credentialMap.get(platform);
        if (!item || !item.hasCredentials || !Object.keys(item.masked || {}).length) {
            return <Text type="secondary">No stored credentials yet</Text>;
        }

        return (
            <Space wrap>
                {Object.entries(item.masked).map(([key, value]) => (
                    <Tag key={key}>{`${key}: ${value}`}</Tag>
                ))}
            </Space>
        );
    };

    return (
        <div style={{ padding: isMobile ? '12px' : '24px', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ marginBottom: isMobile ? 20 : 32 }}>
                <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, margin: 0, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    <SettingOutlined /> Tracking Setup
                </h1>
                <p style={{ color: '#8c8c8c', margin: '4px 0 0', fontSize: isMobile ? 13 : 14 }}>
                    Install tracking and manage ad integration credentials
                </p>
            </div>

            <Row gutter={[24, 24]}>
                <Col span={24}>
                    <Card title={<span><CodeOutlined /> Step 1: Install Tracking Pixel</span>} style={{ borderRadius: 12 }} extra={<Tag color="blue">Required</Tag>}>
                        <Alert
                            message="Add this script tag to your website head"
                            description="The pixel tracks pageviews, UTM parameters, device details, and session metadata."
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />
                        <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 16, position: 'relative', fontFamily: 'monospace' }}>
                            <pre style={{ color: '#e2e8f0', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: 13 }}>{pixelScript}</pre>
                            <Button type="primary" size="small" icon={<CopyOutlined />} style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => void copyToClipboard(pixelScript)}>
                                Copy
                            </Button>
                        </div>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card title={<span><CheckCircleOutlined /> Step 2: Track Conversions</span>} style={{ borderRadius: 12 }} extra={<Tag color="green">Optional</Tag>}>
                        <Paragraph style={{ color: '#595959' }}>
                            Use <Text code>MOS.track()</Text> to record conversion events such as purchases, signups, and lead submits.
                        </Paragraph>
                        <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 16, position: 'relative', fontFamily: 'monospace', marginBottom: 16 }}>
                            <pre style={{ color: '#e2e8f0', margin: 0, whiteSpace: 'pre-wrap', fontSize: 13 }}>{conversionScript}</pre>
                            <Button size="small" icon={<CopyOutlined />} style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => void copyToClipboard(conversionScript)}>
                                Copy
                            </Button>
                        </div>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card title={<span><ApiOutlined /> Step 3: Track Custom Events</span>} style={{ borderRadius: 12 }} extra={<Tag color="purple">Optional</Tag>}>
                        <Paragraph style={{ color: '#595959' }}>
                            Track any custom event using the same <Text code>MOS.track()</Text> function.
                        </Paragraph>
                        <div style={{ background: '#1a1a2e', borderRadius: 8, padding: 16, position: 'relative', fontFamily: 'monospace' }}>
                            <pre style={{ color: '#e2e8f0', margin: 0, whiteSpace: 'pre-wrap', fontSize: 13 }}>{customEventScript}</pre>
                            <Button size="small" icon={<CopyOutlined />} style={{ position: 'absolute', top: 8, right: 8 }} onClick={() => void copyToClipboard(customEventScript)}>
                                Copy
                            </Button>
                        </div>
                    </Card>
                </Col>

                <Col span={24}>
                    <Card title="Ad Platform Integrations" style={{ borderRadius: 12 }} extra={<Tag color="blue">Tenant Scoped</Tag>}>
                        <Alert
                            message="Credentials are stored on the backend per tenant."
                            description="Enter only the fields you want to update. Existing stored values are masked below each platform."
                            type="info"
                            showIcon
                            style={{ marginBottom: 16 }}
                        />

                        {credentialsLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spin /></div>
                        ) : (
                            <Row gutter={[16, 16]}>
                                <Col xs={24} lg={12}>
                                    <Card size="small" title="Meta (Pixel + CAPI)" style={{ borderRadius: 8 }}>
                                        <Space direction="vertical" style={{ width: '100%' }} size={10}>
                                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                                <Text>Active</Text>
                                                <Switch checked={metaEnabled} onChange={setMetaEnabledOverride} />
                                            </Space>
                                            <Input placeholder="Pixel ID" value={metaCredentials.pixelId} onChange={(e) => setMetaCredentials((prev) => ({ ...prev, pixelId: e.target.value }))} />
                                            <Input.Password placeholder="Access Token" value={metaCredentials.accessToken} onChange={(e) => setMetaCredentials((prev) => ({ ...prev, accessToken: e.target.value }))} />
                                            <Input placeholder="Ad Account ID (act_xxx)" value={metaCredentials.adAccountId} onChange={(e) => setMetaCredentials((prev) => ({ ...prev, adAccountId: e.target.value }))} />
                                            <Input placeholder="API Version (v21.0)" value={metaCredentials.apiVersion} onChange={(e) => setMetaCredentials((prev) => ({ ...prev, apiVersion: e.target.value }))} />
                                            <div>{renderMaskedSummary('meta')}</div>
                                            <Button
                                                type="primary"
                                                icon={<SaveOutlined />}
                                                onClick={() => saveCredentialsMutation.mutate({ platform: 'meta', credentials: metaCredentials, isActive: metaEnabled })}
                                                loading={saveCredentialsMutation.isPending && saveCredentialsMutation.variables?.platform === 'meta'}
                                            >
                                                Save Meta Credentials
                                            </Button>
                                        </Space>
                                    </Card>
                                </Col>

                                <Col xs={24} lg={12}>
                                    <Card size="small" title="Google (GA4 + Ads)" style={{ borderRadius: 8 }}>
                                        <Space direction="vertical" style={{ width: '100%' }} size={10}>
                                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                                <Text>Active</Text>
                                                <Switch checked={googleEnabled} onChange={setGoogleEnabledOverride} />
                                            </Space>
                                            <Input placeholder="GA4 Measurement ID" value={googleCredentials.ga4MeasurementId} onChange={(e) => setGoogleCredentials((prev) => ({ ...prev, ga4MeasurementId: e.target.value }))} />
                                            <Input.Password placeholder="GA4 API Secret" value={googleCredentials.ga4ApiSecret} onChange={(e) => setGoogleCredentials((prev) => ({ ...prev, ga4ApiSecret: e.target.value }))} />
                                            <Input placeholder="GA4 Property ID (required for Data API reports)" value={googleCredentials.ga4PropertyId} onChange={(e) => setGoogleCredentials((prev) => ({ ...prev, ga4PropertyId: e.target.value }))} />
                                            <Input placeholder="Google Ads Customer ID" value={googleCredentials.customerId} onChange={(e) => setGoogleCredentials((prev) => ({ ...prev, customerId: e.target.value }))} />
                                            <Input.Password placeholder="Developer Token" value={googleCredentials.developerToken} onChange={(e) => setGoogleCredentials((prev) => ({ ...prev, developerToken: e.target.value }))} />
                                            <Input.Password placeholder="Refresh Token" value={googleCredentials.refreshToken} onChange={(e) => setGoogleCredentials((prev) => ({ ...prev, refreshToken: e.target.value }))} />
                                            <Input placeholder="OAuth Client ID" value={googleCredentials.clientId} onChange={(e) => setGoogleCredentials((prev) => ({ ...prev, clientId: e.target.value }))} />
                                            <Input.Password placeholder="OAuth Client Secret" value={googleCredentials.clientSecret} onChange={(e) => setGoogleCredentials((prev) => ({ ...prev, clientSecret: e.target.value }))} />
                                            <Input placeholder="Login Customer ID (optional)" value={googleCredentials.loginCustomerId} onChange={(e) => setGoogleCredentials((prev) => ({ ...prev, loginCustomerId: e.target.value }))} />
                                            <Input placeholder="Conversion Action ID (for offline conversion upload)" value={googleCredentials.conversionActionId} onChange={(e) => setGoogleCredentials((prev) => ({ ...prev, conversionActionId: e.target.value }))} />
                                            <Input placeholder="Currency (USD/INR...)" value={googleCredentials.currency} onChange={(e) => setGoogleCredentials((prev) => ({ ...prev, currency: e.target.value }))} />
                                            <div>{renderMaskedSummary('google')}</div>
                                            <Button
                                                type="primary"
                                                icon={<SaveOutlined />}
                                                onClick={() => saveCredentialsMutation.mutate({ platform: 'google', credentials: googleCredentials, isActive: googleEnabled })}
                                                loading={saveCredentialsMutation.isPending && saveCredentialsMutation.variables?.platform === 'google'}
                                            >
                                                Save Google Credentials
                                            </Button>
                                        </Space>
                                    </Card>
                                </Col>
                            </Row>
                        )}

                        <Divider />

                        {integrationLoading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spin /></div>
                        ) : (
                            <Row gutter={[16, 16]}>
                                {integrationStatus.map((item) => (
                                    <Col xs={24} md={12} key={item.platform}>
                                        <Card size="small" style={{ borderRadius: 8 }}>
                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                                                    <Text strong style={{ textTransform: 'capitalize' }}>{item.platform}</Text>
                                                    <Tag color={statusColor(item.configured, item.connected)}>
                                                        {!item.configured ? 'Not Configured' : item.connected ? 'Connected' : 'Configured / Not Connected'}
                                                    </Tag>
                                                </Space>
                                                <Text type="secondary">{item.message}</Text>
                                                <Button
                                                    size="small"
                                                    onClick={() => testIntegrationMutation.mutate(item.platform)}
                                                    loading={testIntegrationMutation.isPending && testIntegrationMutation.variables === item.platform}
                                                >
                                                    Test Connection
                                                </Button>
                                            </Space>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}

                        <Divider />

                        <Space direction="vertical" style={{ width: '100%' }} size={12}>
                            <Text strong>Sync Ad Costs</Text>
                            <Text type="secondary">Pull spend, click, and conversion cost data from tenant-connected platforms.</Text>
                            <Space wrap>
                                <Input type="date" value={syncStartDate} onChange={(e) => setSyncStartDate(e.target.value)} style={{ width: 170 }} />
                                <Input type="date" value={syncEndDate} onChange={(e) => setSyncEndDate(e.target.value)} style={{ width: 170 }} />
                                <Button
                                    type="primary"
                                    icon={<SyncOutlined />}
                                    onClick={() => syncCostsMutation.mutate({ startDate: syncStartDate, endDate: syncEndDate })}
                                    loading={syncCostsMutation.isPending}
                                >
                                    Sync Costs
                                </Button>
                            </Space>
                            {syncCostsMutation.data?.errors?.length ? (
                                <Alert
                                    type="warning"
                                    showIcon
                                    message="Some platforms returned sync errors"
                                    description={syncCostsMutation.data.errors.map((err) => `${err.platform}: ${err.error}`).join(' | ')}
                                />
                            ) : null}
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
