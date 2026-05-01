import { useState, useEffect, useCallback } from 'react';
import { getExpenses, getCategories, createExpense, ApiError } from '../utils/api';

/**
 * Custom hook for managing expenses state, filtering, and API interactions.
 * Centralizes all expense-related logic for the App component.
 */
export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortOrder, setSortOrder] = useState('date_desc');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  /**
   * Fetch expenses from the API with current filters.
   */
  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { sort: sortOrder };
      if (selectedCategory) {
        params.category = selectedCategory;
      }
      const data = await getExpenses(params);
      setExpenses(data);
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortOrder]);

  /**
   * Fetch categories for the filter dropdown.
   */
  const fetchCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      // Non-critical — silently fail, filter will just be empty
      console.warn('Failed to load categories:', err.message);
    }
  }, []);

  // Fetch data on mount and when filters change
  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /**
   * Submit a new expense.
   * Generates an idempotency key to prevent duplicates on retry.
   */
  const addExpense = useCallback(async (expenseData, idempotencyKey) => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await createExpense({
        ...expenseData,
        idempotencyKey,
      });
      setSubmitSuccess(true);

      // Refresh data
      await fetchExpenses();
      await fetchCategories();

      // Auto-clear success message after 3s
      setTimeout(() => setSubmitSuccess(false), 3000);

      return true;
    } catch (err) {
      setSubmitError(err.message || 'Failed to add expense');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [fetchExpenses, fetchCategories]);

  /**
   * Calculate total of currently visible expenses.
   */
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  /**
   * Category-wise breakdown of visible expenses.
   */
  const categoryBreakdown = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    return acc;
  }, {});

  return {
    // Data
    expenses,
    categories,
    total,
    categoryBreakdown,

    // Filters
    selectedCategory,
    setSelectedCategory,
    sortOrder,
    setSortOrder,

    // Loading / Error states
    loading,
    error,
    submitting,
    submitError,
    submitSuccess,

    // Actions
    addExpense,
    refresh: fetchExpenses,
  };
}
