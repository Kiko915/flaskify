export const formatPrice = (price) => {
  if (price === undefined || price === null || isNaN(price)) return '₱0.00';
  return `₱${parseFloat(price).toFixed(2)}`;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}; 