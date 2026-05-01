import { formatCurrency } from '../utils/money';

/**
 * Displays the total and category-wise breakdown of visible expenses.
 */
export default function ExpenseSummary({ total, categoryBreakdown, loading }) {
  if (loading) {
    return (
      <div className="expense-summary">
        <div className="summary-total">
          <div className="skeleton-bar skeleton-bar-lg"></div>
        </div>
      </div>
    );
  }

  const sortedCategories = Object.entries(categoryBreakdown).sort(
    ([, a], [, b]) => b - a
  );

  // Find the maximum amount for calculating relative widths
  const maxAmount = sortedCategories.length > 0
    ? Math.max(...sortedCategories.map(([, amount]) => amount))
    : 0;

  return (
    <div className="expense-summary" id="expense-summary">
      {/* Main total */}
      <div className="summary-total-card">
        <div className="summary-label">Total Expenses</div>
        <div className="summary-amount">{formatCurrency(total)}</div>
      </div>

      {/* Category breakdown */}
      {sortedCategories.length > 0 && (
        <div className="summary-breakdown">
          <h3 className="breakdown-title">By Category</h3>
          <div className="breakdown-list">
            {sortedCategories.map(([category, amount]) => (
              <div key={category} className="breakdown-item">
                <div className="breakdown-header">
                  <span className="breakdown-category">{category}</span>
                  <span className="breakdown-amount">{formatCurrency(amount)}</span>
                </div>
                <div className="breakdown-bar-track">
                  <div
                    className="breakdown-bar-fill"
                    style={{
                      width: `${maxAmount > 0 ? (amount / maxAmount) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
