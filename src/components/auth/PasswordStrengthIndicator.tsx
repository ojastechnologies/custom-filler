'use client';

interface PasswordStrengthIndicatorProps {
  password: string;
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const getStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const strength = getStrength(password);
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

  if (!password) return null;

  return (
    <div className="mt-2">
      <div className="flex space-x-1 mb-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded ${
              i < strength ? strengthColors[strength - 1] : 'bg-gray-200 dark:bg-gray-600'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${
        strength < 3 ? 'text-red-600 dark:text-red-400' : 
        strength < 4 ? 'text-yellow-600 dark:text-yellow-400' : 
        'text-green-600 dark:text-green-400'
      }`}>
        Password strength: {strengthLabels[strength - 1] || 'Very Weak'}
      </p>
    </div>
  );
}