import React from 'react';
import classNames from 'classnames';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className }) => {
  return (
    <div className={classNames(
      'bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden transition-colors',
      className
    )}>
      {children}
    </div>
  );
};

export default Card;
