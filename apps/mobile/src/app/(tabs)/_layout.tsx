import { Tabs } from 'expo-router';
import { useTranslation } from '@cute-teachy/i18n';
import { TAB_ITEMS, TabBarIcon, tabBarScreenOptions } from '@/components/layout';

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs screenOptions={tabBarScreenOptions}>
      {TAB_ITEMS.map((item) => (
        <Tabs.Screen
          key={item.name}
          name={item.name}
          options={{
            title: t(item.titleKey),
            tabBarAccessibilityLabel: t(item.titleKey),
            tabBarIcon: ({ color, focused }) => <TabBarIcon icon={item.icon} color={color} focused={focused} />,
          }}
        />
      ))}
    </Tabs>
  );
}
