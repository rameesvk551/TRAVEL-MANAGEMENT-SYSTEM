import {
  ApiOutlined,
  BarChartOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { Card, Col, DatePicker, Row, Space, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { TrendLineChart } from '../../components/charts/TrendLineChart';
import { KpiCard } from '../../components/ui/KpiCard';
import { PageHeader } from '../../components/ui/PageHeader';
import { AsyncState } from '../../components/ui/AsyncState';
import { useAdminOverview } from '../../hooks/useAdminQueries';

const { Text } = Typography;

export default function OverviewPage() {
  const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(29, 'day'), dayjs()]);
  const overviewQuery = useAdminOverview();

  const filteredSeries = useMemo(() => {
    if (!overviewQuery.data) {
      return null;
    }

    const [start, end] = range;
    const inRange = (dateValue: string) => {
      const value = dayjs(dateValue).valueOf();
      return value >= start.startOf('day').valueOf() && value <= end.endOf('day').valueOf();
    };

    return {
      ...overviewQuery.data,
      tenantGrowth: overviewQuery.data.tenantGrowth.filter((point) => inRange(point.date)),
      userActivityTrend: overviewQuery.data.userActivityTrend.filter((point) => inRange(point.date)),
      revenueGrowth: overviewQuery.data.revenueGrowth.filter((point) => inRange(point.date)),
    };
  }, [overviewQuery.data, range]);

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Platform KPIs, growth trends, and operational health across all tenants."
        extra={
          <Space direction="vertical" size={0}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Date range
            </Text>
            <DatePicker.RangePicker
              allowClear={false}
              value={range}
              onChange={(nextRange) => {
                if (nextRange?.[0] && nextRange?.[1]) {
                  setRange([nextRange[0], nextRange[1]]);
                }
              }}
            />
          </Space>
        }
      />

      <AsyncState
        loading={overviewQuery.isLoading}
        error={overviewQuery.error as Error | null}
        onRetry={() => overviewQuery.refetch()}
      >
        {filteredSeries ? (
          <Space direction="vertical" style={{ width: '100%' }} size={18}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <KpiCard
                  title="Total Tenants"
                  value={filteredSeries.summary.totalTenants}
                  icon={<BarChartOutlined />}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <KpiCard
                  title="Active Tenants"
                  value={filteredSeries.summary.activeTenants}
                  icon={<CheckCircleOutlined />}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <KpiCard title="Total Users" value={filteredSeries.summary.totalUsers} icon={<TeamOutlined />} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <KpiCard
                  title="New Signups (30d)"
                  value={filteredSeries.summary.newSignups30d}
                  icon={<UserAddOutlined />}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <KpiCard
                  title="Active Sessions"
                  value={filteredSeries.summary.activeSessions}
                  icon={<ThunderboltOutlined />}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <KpiCard
                  title="API Requests Today"
                  value={filteredSeries.summary.apiRequestsToday.toLocaleString()}
                  icon={<ApiOutlined />}
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <KpiCard
                  title="Monthly Revenue"
                  value={filteredSeries.summary.monthlyRevenue.toLocaleString()}
                  prefix="$"
                />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <KpiCard
                  title="System Health"
                  value={filteredSeries.summary.systemHealthPercent}
                  suffix="%"
                />
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} xl={8}>
                <TrendLineChart title="Tenant Growth" data={filteredSeries.tenantGrowth} color="#1677ff" />
              </Col>
              <Col xs={24} xl={8}>
                <TrendLineChart
                  title="User Activity Trend"
                  data={filteredSeries.userActivityTrend}
                  color="#13c2c2"
                />
              </Col>
              <Col xs={24} xl={8}>
                <TrendLineChart title="Revenue Growth" data={filteredSeries.revenueGrowth} color="#52c41a" />
              </Col>
            </Row>

            <Card style={{ borderRadius: 14 }}>
              <Text type="secondary">
                Platform administration is isolated under `/admin` and does not expose tenant campaign, ads, or
                marketing analytics controls.
              </Text>
            </Card>
          </Space>
        ) : null}
      </AsyncState>
    </div>
  );
}
