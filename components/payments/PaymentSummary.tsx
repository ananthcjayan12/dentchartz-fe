interface PaymentSummaryProps {
  totalAmount: number;
  totalPaid: number;
  balance: number;
}

export function PaymentSummary({ totalAmount, totalPaid, balance }: PaymentSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm font-medium text-gray-500 mb-1">Total Amount Billed</div>
        <div className="text-2xl font-semibold text-gray-900">
          ${totalAmount.toFixed(2)}
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm font-medium text-gray-500 mb-1">Total Paid</div>
        <div className="text-2xl font-semibold text-green-600">
          ${totalPaid.toFixed(2)}
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="text-sm font-medium text-gray-500 mb-1">Balance Due</div>
        <div className={`text-2xl font-semibold ${balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
          ${balance.toFixed(2)}
        </div>
      </div>
    </div>
  );
} 