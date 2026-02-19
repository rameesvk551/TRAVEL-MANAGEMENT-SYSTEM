import { Table, type TableProps } from 'antd';

export const AdminTable = <T extends object>(props: TableProps<T>) => (
  <Table<T>
    size="middle"
    rowKey={(record) => {
      const row = record as { id?: string };
      return row.id ?? JSON.stringify(record);
    }}
    scroll={{ x: 920 }}
    {...props}
  />
);
