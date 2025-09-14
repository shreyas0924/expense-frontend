/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { ExpenseDto } from "../types/expense";
import axios from "axios";
import { SERVER_EXPENSE_URL } from "../utils/constants";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Spends = () => {
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshAuth, logout } = useAuth();
  const navigate = useNavigate();

  const fetchExpenses = async () => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const userId = localStorage.getItem("userId"); // Add this line to get userId

      if (!accessToken) {
        throw new Error("No access token found.");
      }

      if (!userId) {
        throw new Error("No user ID found.");
      }

      const response = await axios.get(
        `${SERVER_EXPENSE_URL}/expense/v1/getExpense`,
        {
          params: {
            user_id: userId, // Add the query parameter
          },
          headers: {
            "X-Requested-With": "XMLHttpRequest",
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/json",
          },
        }
      );

      if (response.status === 401) {
        // Token expired, try to refresh
        const refreshed = await refreshAuth();
        if (!refreshed) {
          // If refresh failed, logout and redirect to login
          logout();
          navigate("/login");
          return;
        }
        // Retry the request with new token
        return fetchExpenses();
      }

      if (response.status !== 200) {
        throw new Error(`Failed to fetch expenses. Status: ${response.status}`);
      }

      const data = response.data;
      const transformedExpenses: ExpenseDto[] = data.map(
        (expense: any, index: number) => ({
          key: index + 1,
          amount: expense["amount"],
          merchant: expense["merchant"],
          currency: expense["currency"],
          createdAt: new Date(expense["created_at"]),
        })
      );
      // When storing tokens after successful login
      localStorage.setItem("userId", response.data.userId);
      setExpenses(transformedExpenses);
      setError(null);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        // Token expired, try to refresh
        const refreshed = await refreshAuth();
        if (!refreshed) {
          logout();
          navigate("/login");
          return;
        }
        // Retry the request with new token
        return fetchExpenses();
      }

      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching expenses:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Spends</h1>
        <div className="p-4 bg-gray-100 rounded-md">
          <p className="text-gray-700">Loading expenses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Spends</h1>
        <div className="p-4 bg-red-100 rounded-md">
          <p className="text-red-700">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Spends</h1>
      <div className="p-4 bg-gray-100 rounded-md">
        <div className="space-y-4">
          {expenses.map((expense) => (
            <div
              key={expense.key}
              className="p-4 bg-white rounded-md shadow-md"
            >
              <p className="text-gray-800">Amount: {expense.amount}</p>
              <p className="text-gray-800">Merchant: {expense.merchant}</p>
              <p className="text-gray-800">Currency: {expense.currency}</p>
              <p className="text-gray-800">
                Date: {expense.createdAt.toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Spends;


