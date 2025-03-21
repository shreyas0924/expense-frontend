import React, { ReactNode } from 'react';

interface CustomTextProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const CustomText: React.FC<CustomTextProps> = ({ children, className, style }) => {
  return (
    <span className={className} style={style}>
      {children}
    </span>
  );
};

export default CustomText;