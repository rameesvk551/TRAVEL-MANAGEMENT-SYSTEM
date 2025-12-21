/**
 * Payroll Page
 * View payslips and salary history
 */
import { useState } from 'react';
import { useMyPayslips } from '@/hooks/hrms';
import { PayslipCard } from '@/components/hrms';
import { Card, CardHeader, CardContent } from '@/components/ui';

export default function PayrollPage() {
    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState(currentYear);

    const { data, isLoading } = useMyPayslips({ year: selectedYear });
    const payslips = data?.data || [];

    // Calculate year summary
    const yearSummary = payslips.reduce(
        (acc, p) => ({
            totalEarnings: acc.totalEarnings + p.baseSalary + p.tripEarnings + p.overtime,
            totalDeductions: acc.totalDeductions + p.deductions,
            totalNet: acc.totalNet + p.netSalary,
        }),
        { totalEarnings: 0, totalDeductions: 0, totalNet: 0 }
    );

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">My Payslips</h1>
                <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="border rounded px-3 py-2"
                >
                    {[currentYear, currentYear - 1, currentYear - 2].map((year) => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>

            {/* Year Summary */}
            {payslips.length > 0 && (
                <Card className="mb-6">
                    <CardHeader>
                        <h2 className="text-lg font-semibold">
                            {selectedYear} Summary
                        </h2>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                                <div className="text-sm text-gray-500">Total Earnings</div>
                                <div className="text-xl font-bold text-green-600">
                                    {formatCurrency(yearSummary.totalEarnings)}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm text-gray-500">Total Deductions</div>
                                <div className="text-xl font-bold text-red-600">
                                    {formatCurrency(yearSummary.totalDeductions)}
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-sm text-gray-500">Net Paid</div>
                                <div className="text-xl font-bold">
                                    {formatCurrency(yearSummary.totalNet)}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Payslips Grid */}
            {isLoading ? (
                <div className="text-center py-8">Loading payslips...</div>
            ) : payslips.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No payslips found for {selectedYear}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {payslips.map((payroll) => (
                        <PayslipCard key={payroll.id} payroll={payroll} />
                    ))}
                </div>
            )}
        </div>
    );
}
