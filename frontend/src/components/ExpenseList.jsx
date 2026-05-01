import { formatCurrency, formatDate } from '../utils/money';

/**
 * Renders the list of expenses as a responsive table/card view.
 */
export default function ExpenseList({ expenses, loading }) {
  if (loading) {
    return (
      <div className="expense-list-container">
        <h2 className="list-title">Recent Expenses</h2>
        <div className="skeleton-list">
          {[...Array(4)].map((_, i) => (
            <div className="skeleton-row" key={i}>
              <div className="skeleton-bar skeleton-bar-sm"></div>
              <div className="skeleton-bar skeleton-bar-md"></div>
              <div className="skeleton-bar skeleton-bar-lg"></div>
              <div className="skeleton-bar skeleton-bar-sm"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="expense-list-container">
        <h2 className="list-title">Recent Expenses</h2>
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p className="empty-text">No expenses found</p>
          <p className="empty-subtext">
            Add your first expense using the form above, or try changing the filter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="expense-list-container">
      <h2 className="list-title">
        Recent Expenses
        <span className="list-count">{expenses.length}</span>
      </h2>

      {/* Desktop table view */}
      <div className="table-wrapper">
        <table className="expense-table" id="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th className="text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id} className="expense-row">
                <td className="expense-date">{formatDate(expense.date)}</td>
                <td>
                  <span className={`category-badge category-${getCategoryColor(expense.category)}`}>
                    {expense.category}
                  </span>
                </td>
                <td className="expense-description">
                  {expense.description || '—'}
                </td>
                <td className="expense-amount text-right">
                  {formatCurrency(expense.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="expense-cards">
        {expenses.map((expense) => (
          <div key={expense.id} className="expense-card">
            <div className="card-top">
              <span className={`category-badge category-${getCategoryColor(expense.category)}`}>
                {expense.category}
              </span>
              <span className="expense-amount">{formatCurrency(expense.amount)}</span>
            </div>
            <div className="card-description">
              {expense.description || '—'}
            </div>
            <div className="card-date">{formatDate(expense.date)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Map categories to color names for badge styling.
 */
function getCategoryColor(category) {
  const colorMap = {
    'Food': 'orange',
    'Transport': 'blue',
    'Shopping': 'purple',
    'Entertainment': 'pink',
    'Bills & Utilities': 'red',
    'Health': 'green',
    'Education': 'cyan',
    'Other': 'gray',
  };
  return colorMap[category] || 'gray';
}
