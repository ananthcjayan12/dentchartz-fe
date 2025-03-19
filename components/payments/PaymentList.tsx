import { Payment } from "@/services/payment.service";
import { format } from "date-fns";
import { Badge } from "../ui/badge";
import Link from "next/link";

interface PaymentListProps {
  payments: Payment[];
  showPatientName?: boolean;
  clinicId: string;
}

export function PaymentList({ payments, showPatientName = false, clinicId }: PaymentListProps) {
  // Format currency values safely
  const formatCurrency = (value: number | string | undefined): string => {
    if (value === undefined || value === null) return '0.00';
    if (typeof value === 'string') return parseFloat(value).toFixed(2);
    return value.toFixed(2);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            {showPatientName && (
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Patient
              </th>
            )}
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Method
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Paid
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {format(new Date(payment.payment_date), "MMM d, yyyy")}
              </td>
              {showPatientName && (
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <Link href={`/patients/${payment.patient.id}?clinic_id=${clinicId}`} className="text-indigo-600 hover:text-indigo-900">
                    {payment.patient.name}
                  </Link>
                </td>
              )}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {payment.payment_method_display}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {payment.is_balance_payment ? (
                  <span className="text-gray-500">Balance Payment</span>
                ) : (
                  `$${formatCurrency(payment.total_amount)}`
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${formatCurrency(payment.amount_paid)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {payment.is_balance_payment ? (
                  <Badge>Balance Payment</Badge>
                ) : payment.balance > 0 ? (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    Partial Payment
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    Paid in Full
                  </Badge>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <Link 
                  href={`/patients/${payment.patient.id}/payments/${payment.id}?clinic_id=${clinicId}`}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 