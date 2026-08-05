import { View } from 'react-native';
import { Typography } from '@/components/atoms/Typography';
import { theme } from '@/theme';

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
      <Typography variant="displayLg" color={theme.colors.primary}>
        Hello Linh
      </Typography>
      <Typography variant="bodyLg">
        Môi trường đã được dọn dẹp sạch sẽ!
      </Typography>
    </View>
  );
}
