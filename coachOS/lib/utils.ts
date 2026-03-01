export const getInitials = (name: string) => {
  if (!name) return '';
  const parts = name.split(' ');
  return parts.length > 1
    ? `${parts[0]?.[0] || ''}${parts[parts.length - 1]?.[0] || ''}`.toUpperCase()
    : `${parts[0]?.[0] || ''}`.toUpperCase();
};

export const generateSecureToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const formatDate = (dateString?: string | Date | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount);
};

export const formatRelativeTime = (dateString?: string | Date | null) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

export const createParentOnboardingUrl = (token: string) => {
  return `https://app.coachos.internal/parent-onboarding/${token}`;
};
