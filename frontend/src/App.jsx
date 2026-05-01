import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import ExpenseFilters from './components/ExpenseFilters';
import ExpenseSummary from './components/ExpenseSummary';
import { useExpenses } from './hooks/useExpenses';

function App() {
  const {
    expenses,
    categories,
    total,
    categoryBreakdown,
    selectedCategory,
    setSelectedCategory,
    sortOrder,
    setSortOrder,
    loading,
    error,
    submitting,
    submitError,
    submitSuccess,
    addExpense,
  } = useExpenses();

  return (
    <div className="app">
      {/* Background decorations */}
      <div className="bg-gradient"></div>
      <div className="bg-orb bg-orb-1"></div>
      <div className="bg-orb bg-orb-2"></div>
      <div className="bg-orb bg-orb-3"></div>

      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">💰</span>
            <h1>Expense Tracker</h1>
          </div>
          <p className="header-subtitle">Track where your money goes</p>
        </div>
      </header>

      <main className="app-main">
        <div className="layout">
          {/* Left column: Form + Summary */}
          <div className="layout-sidebar">
            <ExpenseForm
              onSubmit={addExpense}
              submitting={submitting}
              submitError={submitError}
              submitSuccess={submitSuccess}
            />
            <ExpenseSummary
              total={total}
              categoryBreakdown={categoryBreakdown}
              loading={loading}
            />
          </div>

          {/* Right column: Filters + List */}
          <div className="layout-main">
            <ExpenseFilters
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
            />

            {error && (
              <div className="error-banner" role="alert">
                <span className="error-icon">⚠</span>
                {error}
                <button className="btn-retry" onClick={() => window.location.reload()}>
                  Retry
                </button>
              </div>
            )}

            <ExpenseList expenses={expenses} loading={loading} />
          </div>
        </div>
      </main>

      <footer className="app-footer">
        <p>Expense Tracker &copy; {new Date().getFullYear()} &middot; Built with React + Express + SQLite</p>
      </footer>
    </div>
  );
}

export default App;
