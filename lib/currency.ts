/**
 * Format a number as Philippine Peso currency
 * @param value - The numeric value to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string with peso sign
 */
export const formatCurrency = (value: number | string, decimals: number = 2): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '₱0.00';
  }
  
  return '₱' + numValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format a number as Philippine Peso currency without decimals for display
 * @param value - The numeric value to format
 * @returns Formatted currency string with peso sign
 */
export const formatCurrencyCompact = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '₱0';
  }
  
  return '₱' + Math.round(numValue).toLocaleString('en-US');
};
