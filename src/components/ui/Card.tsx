import React from 'react';
import classNames from 'classnames';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ className, children }) => {
  return (
    <div className={classNames(
      'bg-white dark:bg-gray-800 rounded-lg shadow-md',
      className
    )}>
      {children}
    </div>
  );
};

export default Card;
