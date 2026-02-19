import {
  DollarOutlined,
  EditOutlined,
  PlusOutlined,
  SyncOutlined,
  RiseOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
  type TableProps,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { AsyncState } from '../../components/ui/AsyncState';
import { KpiCard } from '../../components/ui/KpiCard';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  useAdminBilling,
  useAdminCoupons,
  useAdminUsageConfigs,
  useBillingReconciliationMutation,
  useCreateBillingCouponMutation,
  useDeleteBillingCouponMutation,
  useMonthlyUsageBillingMutation,
  useUpdateBillingCouponMutation,
  useUpsertBillingUsageConfigMutation,
} from '../../hooks/useAdminQueries';
import type {
  BillingCoupon,
  BillingPlanType,
  BillingReconciliationResult,
  BillingUsageConfig,
  CouponDiscountType,
  CouponScope,
  Invoice,
  MonthlyUsageBillingResult,
  Payment,
  SubscriptionPlan,
  UsageFeatureConfig,
} from '../../types';

const { Text } = Typography;

const billingStatusColor: Record<Invoice['status'], string> = {
  failed: 'red',
  paid: 'green',
  pending: 'gold',
  refunded: 'purple',
};

interface CouponFormValues {
  code: string;
  scope: CouponScope;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmountPaise?: number | null;
  usageLimit?: number | null;
  validFrom?: Dayjs | null;
  validUntil?: Dayjs | null;
  applicablePlanTypes: BillingPlanType[];
  razorpayOfferId?: string;
  active: boolean;
}

interface UsageConfigFormValues {
  features: UsageFeatureConfig[];
}

const planOptions: Array<{ label: string; value: BillingPlanType }> = [
  { value: 'trial', label: 'Trial' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'lifetime', label: 'Lifetime' },
];

const formatInr = (value: number): string =>
  `Rs ${value.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;

const formatPaise = (value: number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '-';
  }

  return `Rs ${(value / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const planTypeColor: Record<BillingPlanType, string> = {
  trial: 'gold',
  monthly: 'blue',
  yearly: 'green',
  lifetime: 'purple',
};

export default function BillingPage() {
  const isMockMode = import.meta.env.VITE_ADMIN_MOCK !== 'false';
  const [couponForm] = Form.useForm<CouponFormValues>();
  const [usageForm] = Form.useForm<UsageConfigFormValues>();

  const [couponSearch, setCouponSearch] = useState('');
  const [couponScope, setCouponScope] = useState<CouponScope | 'all'>('all');
  const [couponActive, setCouponActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [couponPage, setCouponPage] = useState(1);
  const [couponPageSize, setCouponPageSize] = useState(10);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<BillingCoupon | null>(null);

  const [usageModalOpen, setUsageModalOpen] = useState(false);
  const [editingUsageConfig, setEditingUsageConfig] = useState<BillingUsageConfig | null>(null);
  const [jobResult, setJobResult] = useState<
    | { kind: 'monthly'; data: MonthlyUsageBillingResult }
    | { kind: 'reconciliation'; data: BillingReconciliationResult }
    | null
  >(null);

  const billingQuery = useAdminBilling();
  const usageConfigQuery = useAdminUsageConfigs();
  const couponsQuery = useAdminCoupons({
    page: couponPage,
    pageSize: couponPageSize,
    search: couponSearch || undefined,
    scope: couponScope === 'all' ? undefined : couponScope,
    active:
      couponActive === 'all'
        ? undefined
        : couponActive === 'active',
  });

  const createCouponMutation = useCreateBillingCouponMutation();
  const updateCouponMutation = useUpdateBillingCouponMutation();
  const deleteCouponMutation = useDeleteBillingCouponMutation();
  const upsertUsageConfigMutation = useUpsertBillingUsageConfigMutation();
  const monthlyUsageMutation = useMonthlyUsageBillingMutation();
  const reconciliationMutation = useBillingReconciliationMutation();

  const invoiceColumns: TableProps<Invoice>['columns'] = [
    {
      title: 'Invoice ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Tenant',
      dataIndex: 'tenantName',
      key: 'tenantName',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => formatInr(amount),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: Invoice['status']) => <Tag color={billingStatusColor[status]}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Issued',
      dataIndex: 'issuedAt',
      key: 'issuedAt',
      render: (value) => dayjs(value).format('MMM D, YYYY'),
    },
    {
      title: 'Due',
      dataIndex: 'dueAt',
      key: 'dueAt',
      render: (value) => dayjs(value).format('MMM D, YYYY'),
    },
  ];

  const paymentColumns: TableProps<Payment>['columns'] = [
    {
      title: 'Payment ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Tenant',
      dataIndex: 'tenantName',
      key: 'tenantName',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => formatInr(amount),
    },
    {
      title: 'Method',
      dataIndex: 'method',
      key: 'method',
      render: (method) => method.toUpperCase(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: Payment['status']) => <Tag color={billingStatusColor[status]}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Paid At',
      dataIndex: 'paidAt',
      key: 'paidAt',
      render: (value) => dayjs(value).format('MMM D, YYYY h:mm A'),
    },
  ];

  const planColumns: TableProps<SubscriptionPlan>['columns'] = [
    {
      title: 'Plan',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <Text strong>{name}</Text>
          <Tag>{record.billingCycle === 'one_time' ? 'One-Time' : record.billingCycle.toUpperCase()}</Tag>
        </Space>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (value, record) =>
        record.billingCycle === 'one_time' ? formatInr(value) : `${formatInr(value)} / ${record.billingCycle}`,
    },
    {
      title: 'Active Tenants',
      dataIndex: 'activeTenants',
      key: 'activeTenants',
    },
    {
      title: 'Included Users',
      dataIndex: 'includedUsers',
      key: 'includedUsers',
    },
    {
      title: 'Storage (GB)',
      dataIndex: 'includedStorageGb',
      key: 'includedStorageGb',
    },
  ];

  const usageConfigColumns: TableProps<BillingUsageConfig>['columns'] = useMemo(
    () => [
      {
        title: 'Plan',
        dataIndex: 'planType',
        key: 'planType',
        render: (planType: BillingPlanType) => <Tag color={planTypeColor[planType]}>{planType.toUpperCase()}</Tag>,
      },
      {
        title: 'Feature Limits & Overage',
        key: 'featureConfigs',
        render: (_, record) => (
          <Space direction="vertical" size={4}>
            {record.featureConfigs.map((feature) => (
              <Text key={`${record.planType}_${feature.featureKey}`}>
                <Text strong>{feature.featureKey}</Text>: Free {feature.freeLimit.toLocaleString('en-IN')}, Overage{' '}
                {formatPaise(feature.overageUnitPricePaise)} / unit
              </Text>
            ))}
          </Space>
        ),
      },
      {
        title: 'Updated At',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        render: (value: string) => dayjs(value).format('MMM D, YYYY h:mm A'),
      },
      {
        title: 'Action',
        key: 'action',
        render: (_, record) => (
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingUsageConfig(record);
              usageForm.setFieldsValue({
                features: record.featureConfigs,
              });
              setUsageModalOpen(true);
            }}
          >
            Edit
          </Button>
        ),
      },
    ],
    [usageForm],
  );

  const couponColumns: TableProps<BillingCoupon>['columns'] = useMemo(
    () => [
      {
        title: 'Code',
        dataIndex: 'code',
        key: 'code',
        render: (value: string) => <Text code>{value}</Text>,
      },
      {
        title: 'Scope',
        dataIndex: 'scope',
        key: 'scope',
        render: (value: CouponScope) => <Tag>{value.toUpperCase()}</Tag>,
      },
      {
        title: 'Discount',
        key: 'discount',
        render: (_, record) =>
          record.discountType === 'percent'
            ? `${record.discountValue}%`
            : formatPaise(record.discountValue),
      },
      {
        title: 'Max Discount',
        dataIndex: 'maxDiscountAmountPaise',
        key: 'maxDiscountAmountPaise',
        render: (value: number | null) => formatPaise(value),
      },
      {
        title: 'Usage',
        key: 'usage',
        render: (_, record) =>
          `${record.usedCount.toLocaleString('en-IN')} / ${record.usageLimit ?? 'Unlimited'}`,
      },
      {
        title: 'Validity',
        key: 'validity',
        render: (_, record) => {
          if (!record.validFrom && !record.validUntil) {
            return 'No expiry';
          }

          return `${record.validFrom ? dayjs(record.validFrom).format('MMM D, YYYY') : 'Now'} - ${
            record.validUntil ? dayjs(record.validUntil).format('MMM D, YYYY') : 'Open'
          }`;
        },
      },
      {
        title: 'Active',
        dataIndex: 'active',
        key: 'active',
        render: (active: boolean, record) => (
          <Switch
            checked={active}
            onChange={(checked) => {
              updateCouponMutation.mutate(
                {
                  couponId: record.id,
                  payload: { active: checked },
                },
                {
                  onSuccess: () => message.success(`Coupon ${record.code} updated`),
                  onError: () => message.error(`Failed to update ${record.code}`),
                },
              );
            }}
          />
        ),
      },
      {
        title: 'Actions',
        key: 'actions',
        render: (_, record) => (
          <Space>
            <Button
              size="small"
              onClick={() => {
                setEditingCoupon(record);
                couponForm.setFieldsValue({
                  code: record.code,
                  scope: record.scope,
                  discountType: record.discountType,
                  discountValue: record.discountValue,
                  maxDiscountAmountPaise: record.maxDiscountAmountPaise,
                  usageLimit: record.usageLimit,
                  validFrom: record.validFrom ? dayjs(record.validFrom) : null,
                  validUntil: record.validUntil ? dayjs(record.validUntil) : null,
                  applicablePlanTypes: record.applicablePlanTypes,
                  razorpayOfferId: record.razorpayOfferId ?? undefined,
                  active: record.active,
                });
                setCouponModalOpen(true);
              }}
            >
              Edit
            </Button>
            <Popconfirm
              title="Delete coupon?"
              description="Used coupons will be deactivated instead of hard deleted."
              onConfirm={() => {
                deleteCouponMutation.mutate(
                  {
                    couponId: record.id,
                    reason: 'Deleted from admin dashboard',
                  },
                  {
                    onSuccess: (result) => {
                      if (result.deactivated) {
                        message.success(`Coupon ${record.code} deactivated`);
                        return;
                      }
                      message.success(`Coupon ${record.code} deleted`);
                    },
                    onError: () => message.error(`Failed to delete ${record.code}`),
                  },
                );
              }}
            >
              <Button danger size="small" loading={deleteCouponMutation.isPending}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [couponForm, deleteCouponMutation, updateCouponMutation],
  );

  const openCreateCoupon = () => {
    setEditingCoupon(null);
    couponForm.setFieldsValue({
      code: '',
      scope: 'all',
      discountType: 'percent',
      discountValue: 10,
      maxDiscountAmountPaise: null,
      usageLimit: null,
      validFrom: null,
      validUntil: null,
      applicablePlanTypes: ['monthly', 'yearly'],
      razorpayOfferId: undefined,
      active: true,
    });
    setCouponModalOpen(true);
  };

  const submitCoupon = async () => {
    const values = await couponForm.validateFields();

    const payload = {
      code: values.code.trim().toUpperCase(),
      scope: values.scope,
      discountType: values.discountType,
      discountValue: values.discountValue,
      maxDiscountAmountPaise: values.maxDiscountAmountPaise ?? null,
      usageLimit: values.usageLimit ?? null,
      validFrom: values.validFrom ? values.validFrom.toISOString() : null,
      validUntil: values.validUntil ? values.validUntil.toISOString() : null,
      applicablePlanTypes: values.applicablePlanTypes,
      razorpayOfferId: values.razorpayOfferId?.trim() || null,
      active: values.active,
    };

    if (editingCoupon) {
      updateCouponMutation.mutate(
        {
          couponId: editingCoupon.id,
          payload,
        },
        {
          onSuccess: () => {
            message.success(`Coupon ${editingCoupon.code} updated`);
            setCouponModalOpen(false);
            setEditingCoupon(null);
            couponForm.resetFields();
          },
          onError: () => message.error('Failed to update coupon'),
        },
      );
      return;
    }

    createCouponMutation.mutate(payload, {
      onSuccess: () => {
        message.success('Coupon created');
        setCouponModalOpen(false);
        couponForm.resetFields();
      },
      onError: () => message.error('Failed to create coupon'),
    });
  };

  const submitUsageConfig = async () => {
    if (!editingUsageConfig) {
      return;
    }

    const values = await usageForm.validateFields();
    const features = (values.features ?? [])
      .map((feature) => ({
        featureKey: feature.featureKey?.trim(),
        freeLimit: Number(feature.freeLimit),
        overageUnitPricePaise: Number(feature.overageUnitPricePaise),
      }))
      .filter((feature) => Boolean(feature.featureKey));

    if (!features.length) {
      message.error('Add at least one feature limit entry');
      return;
    }

    upsertUsageConfigMutation.mutate(
      {
        planType: editingUsageConfig.planType,
        features,
      },
      {
        onSuccess: () => {
          message.success(`Usage config updated for ${editingUsageConfig.planType}`);
          setUsageModalOpen(false);
          setEditingUsageConfig(null);
          usageForm.resetFields();
        },
        onError: () => message.error('Failed to update usage config'),
      },
    );
  };

  const runMonthlyUsageBilling = () => {
    monthlyUsageMutation.mutate(undefined, {
      onSuccess: (result) => {
        setJobResult({ kind: 'monthly', data: result });
        message.success('Monthly usage billing job completed');
      },
      onError: () => message.error('Failed to run monthly usage billing job'),
    });
  };

  const runReconciliation = () => {
    reconciliationMutation.mutate(72, {
      onSuccess: (result) => {
        setJobResult({ kind: 'reconciliation', data: result });
        message.success('Reconciliation job completed');
      },
      onError: () => message.error('Failed to run reconciliation job'),
    });
  };

  return (
    <div>
      <PageHeader
        title="Subscriptions & Billing"
        subtitle="Monitor recurring revenue, subscription health, usage billing controls, invoices, payments, and coupons."
      />

      <AsyncState loading={billingQuery.isLoading} error={billingQuery.error as Error | null} onRetry={() => billingQuery.refetch()}>
        {billingQuery.data ? (
          <>
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12} lg={6}>
                <KpiCard title="MRR" value={billingQuery.data.metrics.mrr.toLocaleString('en-IN')} prefix="Rs " icon={<DollarOutlined />} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <KpiCard title="Active Subscriptions" value={billingQuery.data.metrics.activeSubscriptions} icon={<RiseOutlined />} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <KpiCard title="Trial Users" value={billingQuery.data.metrics.trialUsers} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <KpiCard title="Churn Rate" value={billingQuery.data.metrics.churnRate} suffix="%" />
              </Col>
            </Row>

            <Card
              style={{ borderRadius: 14, marginBottom: 16 }}
              title="Billing Operations"
              extra={<Text type="secondary">{isMockMode ? 'Using dummy data mode' : 'Live API mode'}</Text>}
            >
              <Space wrap>
                <Button
                  icon={<SyncOutlined />}
                  loading={monthlyUsageMutation.isPending}
                  onClick={runMonthlyUsageBilling}
                >
                  Run Monthly Usage Job
                </Button>
                <Button
                  type="primary"
                  icon={<SyncOutlined />}
                  loading={reconciliationMutation.isPending}
                  onClick={runReconciliation}
                >
                  Run Reconciliation
                </Button>
              </Space>

              {jobResult ? (
                <div style={{ marginTop: 12 }}>
                  {jobResult.kind === 'monthly' ? (
                    <Alert
                      type={jobResult.data.failedTenants.length ? 'warning' : 'success'}
                      showIcon
                      message={`Monthly usage billing: generated ${jobResult.data.generated} invoices from ${jobResult.data.scanned} cycles`}
                      description={`Cycle: ${dayjs(jobResult.data.cycleStart).format('MMM D, YYYY')} - ${dayjs(jobResult.data.cycleEnd).format('MMM D, YYYY')}${
                        jobResult.data.failedTenants.length
                          ? ` | Failures: ${jobResult.data.failedTenants
                              .map((item) => `${item.tenantId} (${item.error})`)
                              .join(', ')}`
                          : ''
                      }`}
                    />
                  ) : (
                    <Alert
                      type={jobResult.data.failures.length ? 'warning' : 'success'}
                      showIcon
                      message={`Reconciliation: ${jobResult.data.updatedSubscriptions} subscriptions updated, ${jobResult.data.paidInvoices} invoices settled`}
                      description={`Window: last ${jobResult.data.lookbackHours} hours | Scanned subscriptions: ${jobResult.data.scannedSubscriptions}, invoices: ${jobResult.data.scannedInvoices}${
                        jobResult.data.failures.length
                          ? ` | Failures: ${jobResult.data.failures
                              .map((item) => `${item.entity}:${item.id}`)
                              .join(', ')}`
                          : ''
                      }`}
                    />
                  )}
                </div>
              ) : null}
            </Card>

            <Card style={{ borderRadius: 14 }}>
              <Tabs
                items={[
                  {
                    key: 'invoices',
                    label: 'Invoices',
                    children: <Table<Invoice> rowKey="id" columns={invoiceColumns} dataSource={billingQuery.data.invoices} pagination={false} scroll={{ x: 920 }} />,
                  },
                  {
                    key: 'payments',
                    label: 'Payment History',
                    children: <Table<Payment> rowKey="id" columns={paymentColumns} dataSource={billingQuery.data.payments} pagination={false} scroll={{ x: 920 }} />,
                  },
                  {
                    key: 'plans',
                    label: 'Subscription Plans',
                    children: <Table<SubscriptionPlan> rowKey="id" columns={planColumns} dataSource={billingQuery.data.plans} pagination={false} scroll={{ x: 920 }} />,
                  },
                  {
                    key: 'usage-config',
                    label: (
                      <Space size={6}>
                        <SettingOutlined />
                        Usage Config
                      </Space>
                    ),
                    children: (
                      <AsyncState
                        loading={usageConfigQuery.isLoading}
                        error={usageConfigQuery.error as Error | null}
                        onRetry={() => usageConfigQuery.refetch()}
                      >
                        <Table<BillingUsageConfig>
                          rowKey="id"
                          columns={usageConfigColumns}
                          dataSource={usageConfigQuery.data ?? []}
                          pagination={false}
                          scroll={{ x: 1000 }}
                        />
                      </AsyncState>
                    ),
                  },
                  {
                    key: 'coupons',
                    label: 'Coupons',
                    children: (
                      <Space direction="vertical" style={{ width: '100%' }} size={12}>
                        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Space wrap>
                            <Input.Search
                              allowClear
                              placeholder="Search coupon code"
                              onSearch={(value) => {
                                setCouponPage(1);
                                setCouponSearch(value);
                              }}
                              style={{ width: 240 }}
                            />
                            <Select
                              value={couponScope}
                              style={{ width: 160 }}
                              onChange={(value) => {
                                setCouponPage(1);
                                setCouponScope(value);
                              }}
                              options={[
                                { value: 'all', label: 'All scopes' },
                                { value: 'subscription', label: 'Subscription' },
                                { value: 'usage', label: 'Usage' },
                              ]}
                            />
                            <Select
                              value={couponActive}
                              style={{ width: 160 }}
                              onChange={(value) => {
                                setCouponPage(1);
                                setCouponActive(value);
                              }}
                              options={[
                                { value: 'all', label: 'All statuses' },
                                { value: 'active', label: 'Active' },
                                { value: 'inactive', label: 'Inactive' },
                              ]}
                            />
                          </Space>
                          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateCoupon}>
                            Create Coupon
                          </Button>
                        </Space>

                        <AsyncState
                          loading={couponsQuery.isLoading}
                          error={couponsQuery.error as Error | null}
                          onRetry={() => couponsQuery.refetch()}
                        >
                          <Table<BillingCoupon>
                            rowKey="id"
                            columns={couponColumns}
                            dataSource={couponsQuery.data?.items ?? []}
                            pagination={{
                              current: couponPage,
                              pageSize: couponPageSize,
                              total: couponsQuery.data?.total ?? 0,
                              showSizeChanger: true,
                              onChange: (nextPage, nextPageSize) => {
                                setCouponPage(nextPage);
                                if (nextPageSize !== couponPageSize) {
                                  setCouponPageSize(nextPageSize);
                                }
                              },
                            }}
                            scroll={{ x: 1320 }}
                          />
                        </AsyncState>
                      </Space>
                    ),
                  },
                ]}
              />
            </Card>
          </>
        ) : (
          <Card>
            <Text type="secondary">Billing data unavailable.</Text>
          </Card>
        )}
      </AsyncState>

      <Modal
        title={editingCoupon ? `Edit Coupon - ${editingCoupon.code}` : 'Create Coupon'}
        open={couponModalOpen}
        onCancel={() => {
          setCouponModalOpen(false);
          setEditingCoupon(null);
          couponForm.resetFields();
        }}
        onOk={submitCoupon}
        okButtonProps={{ loading: createCouponMutation.isPending || updateCouponMutation.isPending }}
      >
        <Form<CouponFormValues> form={couponForm} layout="vertical">
          <Form.Item name="code" label="Coupon Code" rules={[{ required: true, message: 'Coupon code is required' }]}>
            <Input placeholder="WELCOME10" />
          </Form.Item>

          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="scope" label="Scope" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'subscription', label: 'Subscription' },
                  { value: 'usage', label: 'Usage' },
                ]}
              />
            </Form.Item>
            <Form.Item name="discountType" label="Discount Type" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select
                options={[
                  { value: 'percent', label: 'Percent' },
                  { value: 'fixed', label: 'Fixed (paise)' },
                ]}
              />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="discountValue" label="Discount Value" style={{ flex: 1 }} rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="maxDiscountAmountPaise" label="Max Discount (paise)" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="usageLimit" label="Usage Limit" style={{ flex: 1 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="razorpayOfferId" label="Razorpay Offer ID" style={{ flex: 1 }}>
              <Input placeholder="offer_xxx" />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%' }} align="start">
            <Form.Item name="validFrom" label="Valid From" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} showTime />
            </Form.Item>
            <Form.Item name="validUntil" label="Valid Until" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} showTime />
            </Form.Item>
          </Space>

          <Form.Item name="applicablePlanTypes" label="Applicable Plans" rules={[{ required: true, message: 'Select at least one plan' }]}>
            <Select mode="multiple" options={planOptions} />
          </Form.Item>

          <Form.Item name="active" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingUsageConfig ? `Edit Usage Config - ${editingUsageConfig.planType.toUpperCase()}` : 'Edit Usage Config'}
        open={usageModalOpen}
        width={760}
        onCancel={() => {
          setUsageModalOpen(false);
          setEditingUsageConfig(null);
          usageForm.resetFields();
        }}
        onOk={submitUsageConfig}
        okButtonProps={{ loading: upsertUsageConfigMutation.isPending }}
      >
        <Form<UsageConfigFormValues> form={usageForm} layout="vertical">
          <Form.List name="features">
            {(fields, { add, remove }) => (
              <Space direction="vertical" style={{ width: '100%' }} size={10}>
                {fields.map((field) => (
                  <Card key={field.key} size="small" style={{ borderRadius: 10 }}>
                    <Row gutter={10} align="middle">
                      <Col xs={24} md={8}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'featureKey']}
                          label="Feature Key"
                          rules={[{ required: true, message: 'Feature key required' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="messages" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={7}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'freeLimit']}
                          label="Free Limit"
                          rules={[{ required: true, message: 'Free limit required' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={7}>
                        <Form.Item
                          {...field}
                          name={[field.name, 'overageUnitPricePaise']}
                          label="Overage (paise/unit)"
                          rules={[{ required: true, message: 'Overage price required' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={2}>
                        <Button danger onClick={() => remove(field.name)}>
                          Remove
                        </Button>
                      </Col>
                    </Row>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() => add({ featureKey: '', freeLimit: 0, overageUnitPricePaise: 0 })}
                  block
                >
                  Add Feature
                </Button>
              </Space>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}
