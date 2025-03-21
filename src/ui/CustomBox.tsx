import React, { ReactNode } from 'react';

interface CustomBoxProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const CustomBox: React.FC<CustomBoxProps> = ({ children, className, style }) => {
  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
};

export default CustomBox;