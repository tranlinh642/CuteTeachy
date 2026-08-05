import React from 'react';
import { Text, TextProps } from 'react-native';
import { theme } from '@/theme';

type TypographyVariant = 
  | 'displayLg'
  | 'displayLgMobile'
  | 'headlineMd'
  | 'titleLg'
  | 'bodyLg'
  | 'bodySm'
  | 'labelMd';


interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
}

export const Typography: React.FC<TypographyProps> = ({
    variant = 'bodyLg',
    color = theme.colors.onSurface,
    style,
    children,
    ...props
}) => {
    const typographyStyle = theme.typography[variant];
    return(
        <Text
        style={[
            {
                fontFamily: typographyStyle.fontFamily,
                fontSize: typographyStyle.fontSize,
                fontWeight: typographyStyle.fontWeight as any,
                lineHeight: typographyStyle.lineHeight,
                letterSpacing: (typographyStyle as any).letterSpacing,
                color: color,
            },
            style
        ]}
        {...props}
        >
            {children}
        </Text>
    )
}