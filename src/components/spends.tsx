/* eslint-disable @typescript-eslint/no-explicit-any */
import  { useState, useEffect } from "react";
import { ExpenseDto } from "../types/expense";
import axios from "axios";
import { SERVER_EXPENSE_URL } from "../utils/constants";
// import { SERVER_EXPENSE_URL } from "../utils/constants";

const Spends = () => {
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

 const fetchExpenses = async () => {
  try {
    const accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
      throw new Error("No access token found.");
    }

    const response = await axios.get(`${SERVER_EXPENSE_URL}/expense/v1/getExpense`, {
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("Token is:", accessToken);

    if (response.status !== 200) {
      throw new Error(`Failed to fetch expenses. Status: ${response.status}`);
    }

    const data = response.data;
    console.log("Expenses fetched:", data);

    const transformedExpenses: ExpenseDto[] = data.map(
      (expense: any, index: number) => ({
        key: index + 1,
        amount: expense["amount"],
        merchant: expense["merchant"],
        currency: expense["currency"],
        createdAt: new Date(expense["created_at"]),
      })
    );
    console.log("Transformed expenses:", transformedExpenses);

    setExpenses(transformedExpenses);
    setIsLoading(false);
    setError(null);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : "An unknown error occurred"
    );
    console.error("Error fetching expenses:", err);
    setIsLoading(false);
  }
};

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
