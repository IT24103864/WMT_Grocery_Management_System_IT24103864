import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import AdminProductScreen  from '../screens/admin/AdminProductScreen';
import AdminOrderScreen    from '../screens/admin/AdminOrderScreen';
import AdminStoreScreen    from '../screens/admin/AdminStoreScreen';
import AdminTrackingScreen from '../screens/admin/AdminTrackingScreen';
import AdminPaymentScreen  from '../screens/admin/AdminPaymentScreen';
import AdminSupportScreen  from '../screens/admin/AdminSupportScreen';

const Tab = createBottomTabNavigator();

const TAB_SCREENS = [
  { name: 'Products', component: AdminProductScreen,  icon: 'cube-outline',          label: 'Products' },
  { name: 'Orders',   component: AdminOrderScreen,    icon: 'document-text-outline', label: 'Orders'   },
  { name: 'Stores',   component: AdminStoreScreen,    icon: 'storefront-outline',    label: 'Stores'   },
  { name: 'Tracking', component: AdminTrackingScreen, icon: 'navigate-outline',      label: 'Tracking' },
  { name: 'Payments', component: AdminPaymentScreen,  icon: 'card-outline',          label: 'Payments' },
  { name: 'Support',  component: AdminSupportScreen,  icon: 'headset-outline',       label: 'Support'  },
];

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2E7D32',
        tabBarInactiveTintColor: '#bdbdbd',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          height: 64,
          borderTopWidth: 1,
          borderTopColor: '#e2e8f0',
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {TAB_SCREENS.map(({ name, component, icon, label }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            tabBarLabel: label,
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? icon.replace('-outline', '') : icon}
                size={24}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
