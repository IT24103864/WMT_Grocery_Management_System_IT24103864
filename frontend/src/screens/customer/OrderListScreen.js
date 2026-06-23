import React, { useState, useContext, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../config/api';
import AppHeader from '../../components/AppHeader';
import OrderCard from '../../components/OrderCard';
import EmptyState from '../../components/EmptyState';

const TABS = ['All', 'Active', 'Cancelled'];

const matchesTab = (order, tab) => {
  const s = (order.orderStatus || '').toLowerCase();
  if (tab === 'All')       return true;
  if (tab === 'Cancelled') return s === 'cancelled';
  // Active = anything not cancelled, delivered, successful, or failed
  return !['cancelled', 'delivered', 'successful', 'failed'].includes(s);
};

export default function OrderListScreen({ navigation }) {
  const [orders, setOrders]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState('');
  const [activeTab, setActiveTab] = useState('All');

  const fetchOrders = async () => {
    try {
      const { data } = await api.get('/orders/my');
      setOrders(data.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt)));
      setError('');
    } catch (err) {
      setError(!err.response ? 'Cannot connect to server' : 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchOrders(); }, []));

  const visibleOrders = orders.filter(o => matchesTab(o, activeTab));

  // Map orderStatus → StatusBadge-compatible status string
  const toOrder = (item) => ({
    ...item,
    status: item.orderStatus,
    items: item.items || [],
    totalAmount: item.totalAmount,
    createdAt: item.placedAt,
  });

  return (
    <View style={S.container}>
      <AppHeader title="My Orders" />

      {/* Filter tabs */}
      <View style={S.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={S.tab}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text style={[S.tabText, activeTab === tab && S.tabTextActive]}>{tab}</Text>
            {activeTab === tab && <View style={S.tabUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={S.center}>
          <ActivityIndicator size="large" color="#2E7D32" />
        </View>
      ) : error ? (
        <EmptyState
          icon="wifi-outline"
          title="Connection Error"
          subtitle={error}
          buttonTitle="Try Again"
          onButtonPress={() => { setLoading(true); fetchOrders(); }}
        />
      ) : visibleOrders.length === 0 ? (
        <EmptyState
          icon="document-text-outline"
          title="No Orders"
          subtitle={activeTab === 'All' ? "You haven't placed any orders yet" : `No ${activeTab.toLowerCase()} orders`}
          buttonTitle={activeTab === 'All' ? 'Start Shopping' : undefined}
          onButtonPress={() => navigation.getParent()?.navigate('Products')}
        />
      ) : (
        <FlatList
          data={visibleOrders}
          keyExtractor={i => i._id}
          contentContainerStyle={S.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchOrders(); }}
              colors={['#2E7D32']}
            />
          }
          renderItem={({ item }) => (
            <OrderCard
              order={toOrder(item)}
              showEditStatus
              onPress={() => navigation.navigate('OrderDetail', { orderId: item._id })}
            />
          )}
        />
      )}
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  list:      { padding: 16, paddingBottom: 100 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },

  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tab: {
    paddingVertical: 14,
    marginRight: 24,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#2E7D32',
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 999,
    backgroundColor: '#2E7D32',
  },
});
