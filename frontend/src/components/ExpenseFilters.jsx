/**
 * Filter and sort controls for the expense list.
 */
export default function ExpenseFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  sortOrder,
  onSortChange,
}) {
  return (
    <div className="expense-filters" id="expense-filters">
      <div className="filter-group">
        <label htmlFor="filter-category">
          <span className="filter-icon">🔍</span>
          Filter by Category
        </label>
        <select
          id="filter-category"
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filter-sort">
          <span className="filter-icon">↕</span>
          Sort by Date
        </label>
        <select
          id="filter-sort"
          value={sortOrder}
          onChange={(e) => onSortChange(e.target.value)}
        >
          <option value="date_desc">Newest First</option>
          <option value="date_asc">Oldest First</option>
        </select>
      </div>

      {selectedCategory && (
        <button
          className="btn-clear-filter"
          onClick={() => onCategoryChange('')}
          id="clear-filter"
        >
          ✕ Clear Filter
        </button>
      )}
    </div>
  );
}
