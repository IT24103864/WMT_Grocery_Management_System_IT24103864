import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import ProductListScreen    from '../screens/customer/ProductListScreen';
import ProductDetailScreen  from '../screens/customer/ProductDetailScreen';
import CartScreen           from '../screens/customer/CartScreen';
import OrderListScreen      from '../screens/customer/OrderListScreen';
import OrderDetailScreen    from '../screens/customer/OrderDetailScreen';
import StoreListScreen      from '../screens/customer/StoreListScreen';
import TrackingScreen       from '../screens/customer/TrackingScreen';
import PaymentHistoryScreen from '../screens/customer/PaymentHistoryScreen';
import PaymentScreen        from '../screens/customer/PaymentScreen';
import SupportScreen        from '../screens/customer/SupportScreen';

const Tab          = createBottomTabNavigator();
const ProductStack = createStackNavigator();
const OrderStack   = createStackNavigator();
const PaymentStack = createStackNavigator();

const STACK_OPTIONS = {
  headerShown: false,
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,
  transitionSpec: {
    open:  { animation: 'timing', config: { duration: 300 } },
    close: { animation: 'timing', config: { duration: 250 } },
  },
};

function ProductsStackNav() {
  return (
    <ProductStack.Navigator screenOptions={STACK_OPTIONS}>
      <ProductStack.Screen name="StoreList"     component={StoreListScreen} />
      <ProductStack.Screen name="ProductList"   component={ProductListScreen} />
      <ProductStack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <ProductStack.Screen name="Cart"          component={CartScreen} />
    </ProductStack.Navigator>
  );
}

function OrdersStackNav() {
  return (
    <OrderStack.Navigator screenOptions={STACK_OPTIONS}>
      <OrderStack.Screen name="OrderList"   component={OrderListScreen} />
      <OrderStack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </OrderStack.Navigator>
  );
}

function PaymentsStackNav() {
  return (
    <PaymentStack.Navigator screenOptions={STACK_OPTIONS}>
      <PaymentStack.Screen name="PaymentHistory" component={PaymentHistoryScreen} />
      <PaymentStack.Screen name="Payment"        component={PaymentScreen} />
    </PaymentStack.Navigator>
  );
}

const TAB_SCREENS = [
  { name: 'Products', component: ProductsStackNav,  icon: 'storefront-outline', label: 'Shop' },
  { name: 'Orders',   component: OrdersStackNav,    icon: 'document-text-outline', label: 'Orders' },
  { name: 'Payments', component: PaymentsStackNav,  icon: 'card-outline',       label: 'Payments' },
  { name: 'Tracking', component: TrackingScreen,    icon: 'navigate-outline',   label: 'Track' },
  { name: 'Support',  component: SupportScreen,     icon: 'headset-outline',    label: 'Support' },
];

export default function CustomerNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
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
      })}
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

const S = StyleSheet.create({});
