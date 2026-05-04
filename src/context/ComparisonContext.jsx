import React, { createContext, useContext, useState } from 'react';

const ComparisonContext = createContext();

export const ComparisonProvider = ({ children }) => {
  const [comparisonList, setComparisonList] = useState([]);

  const addToCompare = (product) => {
    setComparisonList((prev) => {
      // Limit to 4 products
      if (prev.find((p) => p._id === product._id)) {
        return prev.filter((p) => p._id !== product._id);
      }
      if (prev.length >= 4) {
        alert("You can only compare up to 4 products at a time.");
        return prev;
      }
      return [...prev, product];
    });
  };

  const removeFromCompare = (productId) => {
    setComparisonList((prev) => prev.filter((p) => p._id !== productId));
  };

  const clearComparison = () => setComparisonList([]);

  return (
    <ComparisonContext.Provider value={{ 
      comparisonList, 
      addToCompare, 
      removeFromCompare, 
      clearComparison 
    }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => useContext(ComparisonContext);
