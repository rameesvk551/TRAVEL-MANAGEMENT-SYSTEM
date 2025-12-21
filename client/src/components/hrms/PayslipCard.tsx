/**
 * Payslip Card Component
 * Display individual payslip summary
 */
import { useDownloadPayslip } from '@/hooks/hrms';
import { Button, Badge, Card, CardContent } from '@/components/ui';
import type { Payroll, PayrollStatus } from '@/types/hrms.types';

const STATUS_COLORS: Record<PayrollStatus, string> = {
    draft: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    paid: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
};

interface PayslipCardProps {
    payroll: Payroll;
}

export function PayslipCard({ payroll }: PayslipCardProps) {
    const downloadMutation = useDownloadPayslip();

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatPeriod = () => {
        const start = new Date(payroll.periodStart);
        return `${start.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
        })}`;
    };

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                    <div>
                        <div className="font-semibold text-lg">{formatPeriod()}</div>
                        <div className="text-xs text-gray-500">
                            {new Date(payroll.periodStart).toLocaleDateString()} -{' '}
                            {new Date(payroll.periodEnd).toLocaleDateString()}
                        </div>
                    </div>
                    <Badge className={STATUS_COLORS[payroll.status]}>
                        {payroll.status}
                    </Badge>
                </div>

                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Base Salary</span>
                        <span>{formatCurrency(payroll.baseSalary)}</span>
                    </div>
                    {payroll.tripEarnings > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span>Trip Earnings</span>
                            <span>+{formatCurrency(payroll.tripEarnings)}</span>
                        </div>
                    )}
                    {payroll.overtime > 0 && (
                        <div className="flex justify-between text-blue-600">
                            <span>Overtime</span>
                            <span>+{formatCurrency(payroll.overtime)}</span>
                        </div>
                    )}
                    {payroll.deductions > 0 && (
                        <div className="flex justify-between text-red-600">
                            <span>Deductions</span>
                            <span>-{formatCurrency(payroll.deductions)}</span>
                        </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Net Pay</span>
                        <span className="text-lg">{formatCurrency(payroll.netSalary)}</span>
                    </div>
                </div>

                {payroll.status === 'paid' && (
                    <div className="mt-3 pt-3 border-t">
                        <Button
                            size="sm"
                            variant="outline"
                            className="w-full"
                            onClick={() => downloadMutation.mutate(payroll.id)}
                            disabled={downloadMutation.isPending}
                        >
                            {downloadMutation.isPending ? 'Downloading...' : '📄 Download Payslip'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
