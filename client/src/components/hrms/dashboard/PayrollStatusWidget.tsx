/**
 * Payroll Status Widget
 * Shows current payroll run status and progress
 */
import { Link } from 'react-router-dom';
import { 
  DollarSign, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Loader,
} from 'lucide-react';

type PayrollStatus = 'not_started' | 'processing' | 'pending_approval' | 'approved' | 'paid';

interface PayrollProgress {
  status: PayrollStatus;
  month: string;
  totalEmployees: number;
  processed: number;
  approved: number;
  paid: number;
}

export function PayrollStatusWidget() {
  // Mock data (replace with real API call)
  const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  
  const payrollProgress: PayrollProgress = {
    status: 'processing',
    month: currentMonth,
    totalEmployees: 48,
    processed: 45,
    approved: 0,
    paid: 0,
  };

  const getStatusInfo = (status: PayrollStatus) => {
    switch (status) {
      case 'not_started':
        return {
          icon: <Clock className="w-5 h-5" />,
          label: 'Not Started',
          color: 'text-gray-500 bg-gray-100',
        };
      case 'processing':
        return {
          icon: <Loader className="w-5 h-5 animate-spin" />,
          label: 'Processing',
          color: 'text-blue-600 bg-blue-100',
        };
      case 'pending_approval':
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          label: 'Pending Approval',
          color: 'text-yellow-600 bg-yellow-100',
        };
      case 'approved':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          label: 'Approved',
          color: 'text-green-600 bg-green-100',
        };
      case 'paid':
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          label: 'Paid',
          color: 'text-green-600 bg-green-100',
        };
    }
  };

  const statusInfo = getStatusInfo(payrollProgress.status);
  const progressPercentage = Math.round(
    (payrollProgress.processed / payrollProgress.totalEmployees) * 100
  );

  return (
    <div className="bg-white rounded-xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          <h2 className="font-semibold text-gray-800">Payroll Status</h2>
        </div>
        <Link 
          to="/hrms/payroll" 
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
        >
          Manage <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold text-gray-800">
            {payrollProgress.month} Payroll
          </span>
          <span className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.icon}
            {statusInfo.label}
          </span>
        </div>
        
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-500">
              {payrollProgress.processed}/{payrollProgress.totalEmployees} payslips generated
            </span>
            <span className="font-medium text-gray-700">{progressPercentage}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            payrollProgress.processed > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {payrollProgress.processed > 0 ? <CheckCircle className="w-4 h-4" /> : '1'}
          </div>
          <span className="mt-1 text-gray-500">Generate</span>
        </div>
        <div className="flex-1 h-px bg-gray-200 mx-2" />
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            payrollProgress.approved > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {payrollProgress.approved > 0 ? <CheckCircle className="w-4 h-4" /> : '2'}
          </div>
          <span className="mt-1 text-gray-500">Approve</span>
        </div>
        <div className="flex-1 h-px bg-gray-200 mx-2" />
        <div className="flex flex-col items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            payrollProgress.paid > 0 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
          }`}>
            {payrollProgress.paid > 0 ? <CheckCircle className="w-4 h-4" /> : '3'}
          </div>
          <span className="mt-1 text-gray-500">Pay</span>
        </div>
      </div>

      {/* Action Button */}
      <Link
        to="/hrms/payroll"
        className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        <span>
          {payrollProgress.status === 'processing' ? 'Review & Approve' :
           payrollProgress.status === 'pending_approval' ? 'Approve Payroll' :
           payrollProgress.status === 'approved' ? 'Process Payments' :
           'Start Payroll Run'}
        </span>
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
