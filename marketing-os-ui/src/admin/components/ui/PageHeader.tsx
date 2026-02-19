import { Space, Typography } from 'antd';
import type { ReactNode } from 'react';

const { Paragraph, Title } = Typography;

interface PageHeaderProps {
  title: string;
  subtitle: string;
  extra?: ReactNode;
}

export const PageHeader = ({ extra, subtitle, title }: PageHeaderProps) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
      gap: 16,
      marginBottom: 20,
    }}
  >
    <Space direction="vertical" size={0}>
      <Title level={3} style={{ margin: 0 }}>
        {title}
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 0 }}>
        {subtitle}
      </Paragraph>
    </Space>

    {extra}
  </div>
);

