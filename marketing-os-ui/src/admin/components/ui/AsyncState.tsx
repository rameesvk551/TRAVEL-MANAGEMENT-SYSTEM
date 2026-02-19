import { Alert, Button, Card, Empty, Skeleton, Space } from 'antd';
import type { ReactNode } from 'react';

interface AsyncStateProps {
  loading: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyDescription?: string;
  loadingRows?: number;
  onRetry?: () => void;
  children: ReactNode;
}

export const AsyncState = ({
  children,
  emptyDescription = 'No data available for the selected filters.',
  error,
  isEmpty = false,
  loading,
  loadingRows = 4,
  onRetry,
}: AsyncStateProps) => {
  if (loading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: loadingRows }} />
      </Card>
    );
  }

  if (error) {
    return (
      <Alert
        type="error"
        message="Unable to load data"
        description={
          <Space direction="vertical" size={8}>
            <span>{error.message}</span>
            {onRetry ? <Button onClick={onRetry}>Retry</Button> : null}
          </Space>
        }
        showIcon
      />
    );
  }

  if (isEmpty) {
    return (
      <Card>
        <Empty description={emptyDescription} />
      </Card>
    );
  }

  return <>{children}</>;
};

