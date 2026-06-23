import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, FlatList, Modal, ActivityIndicator,
  Alert, KeyboardAvoidingView, Platform,
  TextInput, Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useStripe } from '@stripe/stripe-react-native/lib/commonjs/hooks/useStripe';
import api, { getImageUri } from '../../config/api';
import AppHeader from '../../components/AppHeader';
import GreenButton from '../../components/GreenButton';
import EmptyState from '../../components/EmptyState';
import { shadows } from '../../theme/styles';

const METHODS = [
  { id: 'online', label: 'Online',  icon: 'globe-outline', subtitle: 'Bank or wallet transfer' },
  { id: 'card',   label: 'Card',    icon: 'card-outline', subtitle: 'Debit or credit card' },
  { id: 'cash',   label: 'Cash',    icon: 'cash-outline', subtitle: 'Pay on delivery' },
];

const ADMIN_ACCOUNT_DETAILS = [
  { label: 'Account Name', value: 'Disen Liyanage' },
  { label: 'Account Number', value: '1013 5284 0398' },
  { label: 'Bank Name', value: 'SAMPATH BANK PLC' },
  { label: 'Branch Name', value: 'MAHARAGAMA BRANCH' },
];

const fmt = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function PaymentScreen({ route, navigation }) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const preselectedOrderId = route.params?.orderId;
  const [orders, setOrders]               = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [method, setMethod]               = useState('online');
  const [loading, setLoading]             = useState(false);
  const [fetchingOrders, setFetchingOrders] = useState(true);
  const [fetchError, setFetchError]       = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [onlineRef, setOnlineRef]         = useState('');
  const [cashNote, setCashNote]           = useState('');
  const [transactionImage, setTransactionImage] = useState(null);

  const goToTracking = (orderId) => {
    navigation.getParent()?.navigate('Tracking', { orderId });
  };

  const fetchOrders = () => {
    setFetchingOrders(true);
    setFetchError('');
    api.get('/orders/my')
      .then(({ data }) =>
        setOrders(data.filter(o => o.orderStatus === 'Placed'))
      )
      .catch(err => {
        setFetchError(!err.response
          ? 'Cannot connect to server. Check your connection.'
          : 'Failed to load orders. Please try again.');
      })
      .finally(() => setFetchingOrders(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    if (!preselectedOrderId || orders.length === 0) return;
    const matchingOrder = orders.find(order => order._id === preselectedOrderId);
    if (matchingOrder) setSelectedOrder(matchingOrder);
  }, [preselectedOrderId, orders]);

  const handlePay = async () => {
    if (!selectedOrder) { Alert.alert('Required', 'Please select an order first'); return; }

    if (method === 'card') {
      await handleStripePayment();
      return;
    }

    if (method === 'online' && !onlineRef.trim()) {
      Alert.alert('Required', 'Please enter your transaction reference');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        orderId: selectedOrder._id,
        amount:  selectedOrder.totalAmount,
        method,
        transactionReference: method === 'online' ? onlineRef.trim() : undefined,
        paymentNote: method === 'cash' ? cashNote.trim() : undefined,
      };
      if (method === 'online' && transactionImage) {
        payload.transactionImageBase64 = `data:${transactionImage.mimeType || 'image/jpeg'};base64,${transactionImage.base64}`;
      }
      await api.post('/payments', payload);
      goToTracking(selectedOrder._id);
      setSelectedOrder(null);
      setOnlineRef('');
      setCashNote('');
      setTransactionImage(null);
    } catch (err) {
      Alert.alert(
        'Payment Failed',
        !err.response
          ? 'Cannot connect to server. Check your connection.'
          : err.response?.data?.message || 'Payment could not be processed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleStripePayment = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/payments/stripe/create-intent', {
        orderId: selectedOrder._id,
      });

      const initResult = await initPaymentSheet({
        merchantDisplayName: 'Grocery Management System',
        paymentIntentClientSecret: data.clientSecret,
        allowsDelayedPaymentMethods: false,
      });

      if (initResult.error) {
        Alert.alert('Stripe Error', initResult.error.message);
        return;
      }

      const paymentResult = await presentPaymentSheet();

      if (paymentResult.error) {
        Alert.alert('Payment Cancelled', paymentResult.error.message);
        return;
      }

      await api.post('/payments', {
        orderId: selectedOrder._id,
        amount: selectedOrder.totalAmount,
        method: 'card',
        stripePaymentIntentId: data.paymentIntentId,
      });

      goToTracking(selectedOrder._id);
      setSelectedOrder(null);
    } catch (err) {
      Alert.alert(
        'Payment Failed',
        !err.response
          ? 'Cannot connect to server. Check your connection.'
          : err.response?.data?.message || err.response?.data?.error || 'Stripe payment could not be processed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderMethodInterface = () => {
    if (method === 'online') {
      return (
        <View style={[S.card, shadows.medium]}>
          <View style={S.interfaceHeader}>
            <View style={S.interfaceIcon}>
              <Ionicons name="globe-outline" size={22} color="#2E7D32" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.interfaceTitle}>Online Payment</Text>
              <Text style={S.interfaceSubtitle}>Transfer the amount to this account, then enter your reference number.</Text>
            </View>
          </View>

          <View style={S.bankDetailsBox}>
            {ADMIN_ACCOUNT_DETAILS.map(detail => (
              <View key={detail.label} style={S.bankDetailRow}>
                <Text style={S.bankDetailLabel}>{detail.label}</Text>
                <Text style={S.bankDetailValue}>{detail.value}</Text>
              </View>
            ))}
          </View>

          <Text style={S.inputLabel}>Transaction Reference</Text>
          <TextInput
            style={S.textInput}
            value={onlineRef}
            onChangeText={setOnlineRef}
            placeholder="e.g. TXN-204578"
            placeholderTextColor="#94a3b8"
          />

          <Text style={[S.inputLabel, { marginTop: 12 }]}>Transaction Image (Optional)</Text>
          {transactionImage?.uri ? (
            <TouchableOpacity style={S.imagePreviewWrap} onPress={async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7, base64: true,
              });
              if (!result.canceled) setTransactionImage(result.assets[0]);
            }} activeOpacity={0.85}>
              <Image source={{ uri: transactionImage.uri }} style={S.imagePreview} />
              <View style={S.imageOverlay}>
                <Ionicons name="camera-outline" size={20} color="#ffffff" />
                <Text style={S.imageOverlayText}>Change Photo</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={S.imagePicker} onPress={async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7, base64: true,
              });
              if (!result.canceled) setTransactionImage(result.assets[0]);
            }} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={32} color="#94a3b8" />
              <Text style={S.imagePickerText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (method === 'card') {
      return (
        <View style={[S.card, shadows.medium]}>
          <View style={S.stripePanel}>
            <View>
              <Text style={S.cardPreviewLabel}>Secure Card Payment</Text>
              <Text style={S.cardPreviewNumber}>Pay safely with Stripe</Text>
            </View>
            <Ionicons name="shield-checkmark" size={30} color="#ffffff" />
          </View>

          <View style={S.stripeInfoRow}>
            <Ionicons name="lock-closed-outline" size={16} color="#2E7D32" />
            <Text style={S.stripeInfoText}>Card details are handled securely by Stripe and are not saved in this app.</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[S.card, shadows.medium]}>
        <View style={S.cashHero}>
          <View style={S.cashIcon}>
            <Ionicons name="cash-outline" size={30} color="#2E7D32" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.interfaceTitle}>Cash on Delivery</Text>
            <Text style={S.interfaceSubtitle}>Pay the delivery person when your order arrives.</Text>
          </View>
        </View>

        <View style={S.cashSteps}>
          <View style={S.cashStep}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#2E7D32" />
            <Text style={S.cashStepText}>Keep the exact amount ready if possible.</Text>
          </View>
          <View style={S.cashStep}>
            <Ionicons name="receipt-outline" size={18} color="#2E7D32" />
            <Text style={S.cashStepText}>Your payment will be marked pending until delivery.</Text>
          </View>
        </View>

        <Text style={S.inputLabel}>Delivery Note</Text>
        <TextInput
          style={[S.textInput, S.noteInput]}
          value={cashNote}
          onChangeText={setCashNote}
          placeholder="Optional note for the delivery person"
          placeholderTextColor="#94a3b8"
          multiline
        />
      </View>
    );
  };

  return (
    <View style={S.container}>
      <AppHeader
        title="Make Payment"
        subtitle="Pay for your orders"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {fetchingOrders ? (
          <View style={S.center}>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={S.loadingText}>Loading your orders...</Text>
          </View>
        ) : fetchError ? (
          <EmptyState
            icon="wifi-outline"
            title="Connection Error"
            subtitle={fetchError}
            buttonTitle="Try Again"
            onButtonPress={fetchOrders}
          />
        ) : orders.length === 0 ? (
          <EmptyState
            icon="receipt-outline"
            title="No Active Orders"
            subtitle="You have no pending orders to pay for. Place an order first."
            buttonTitle="Browse Products"
            onButtonPress={() => navigation.getParent()?.navigate('Products')}
          />
        ) : (
          <ScrollView
            contentContainerStyle={S.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Order selector */}
            <View style={[S.card, shadows.medium]}>
              <Text style={S.cardLabel}>Select Order</Text>
              <TouchableOpacity
                style={[S.orderPicker, selectedOrder && S.orderPickerSelected]}
                onPress={() => setPickerVisible(true)}
                activeOpacity={0.8}
              >
                <View style={S.orderPickerLeft}>
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={selectedOrder ? '#2E7D32' : '#94a3b8'}
                  />
                  <Text
                    style={[
                      S.orderPickerText,
                      !selectedOrder && S.orderPickerPlaceholder,
                    ]}
                    numberOfLines={1}
                  >
                    {selectedOrder
                      ? `#${selectedOrder._id.slice(-6).toUpperCase()} — ${fmt(selectedOrder.placedAt)}`
                      : 'Tap to select an order'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#94a3b8" />
              </TouchableOpacity>

              {selectedOrder && (
                <View style={S.amountBox}>
                  <Text style={S.amountLabel}>Amount Due</Text>
                  <Text style={S.amountValue}>
                    LKR {Number(selectedOrder.totalAmount).toFixed(2)}
                  </Text>
                  <Text style={S.amountItems}>
                    {(selectedOrder.items || []).length} item{(selectedOrder.items || []).length !== 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </View>

            {/* Payment method */}
            <View style={[S.card, shadows.medium]}>
              <Text style={S.cardLabel}>Payment Method</Text>
              <View style={S.methodList}>
                {METHODS.map(m => (
                  <TouchableOpacity
                    key={m.id}
                    style={[S.methodCard, method === m.id && S.methodCardActive]}
                    onPress={() => setMethod(m.id)}
                    activeOpacity={0.8}
                  >
                    <View style={S.methodLeft}>
                      <View style={[S.methodIconWrap, method === m.id && S.methodIconWrapActive]}>
                        <Ionicons
                          name={m.icon}
                          size={21}
                          color={method === m.id ? '#ffffff' : '#94a3b8'}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[S.methodLabel, method === m.id && S.methodLabelActive]}>
                          {m.label}
                        </Text>
                        <Text style={S.methodSubtitle}>{m.subtitle}</Text>
                      </View>
                    </View>
                    {method === m.id ? (
                      <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {renderMethodInterface()}

            {/* Pay button */}
            <GreenButton
              title={selectedOrder
                ? `Pay LKR ${Number(selectedOrder.totalAmount).toFixed(2)}`
                : 'Select an Order to Pay'}
              onPress={handlePay}
              loading={loading}
              disabled={!selectedOrder}
              fullWidth
            />

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {/* Order picker bottom sheet */}
      <Modal visible={pickerVisible} animationType="slide" transparent>
        <View style={S.overlay}>
          <View style={S.sheet}>
            <View style={S.sheetHandle} />
            <View style={S.sheetHeader}>
              <Text style={S.sheetTitle}>Select Order</Text>
              <TouchableOpacity onPress={() => setPickerVisible(false)} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={orders}
              keyExtractor={i => i._id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={S.orderRow}
                  onPress={() => { setSelectedOrder(item); setPickerVisible(false); }}
                  activeOpacity={0.8}
                >
                  <View>
                    <Text style={S.orderRowId}>
                      #{item._id.slice(-6).toUpperCase()}
                    </Text>
                    <Text style={S.orderRowDate}>{fmt(item.placedAt)}</Text>
                  </View>
                  <View style={S.orderRowRight}>
                    <Text style={S.orderRowAmount}>
                      LKR {Number(item.totalAmount).toFixed(2)}
                    </Text>
                    <Text style={S.orderRowItems}>
                      {(item.items || []).length} items
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={S.noOrders}>No active orders to pay for.</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll:    { padding: 16, paddingBottom: 40 },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#64748b' },

  // ── Cards ────────────────────────────────────────────
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },

  // ── Order picker ─────────────────────────────────────
  orderPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
  },
  orderPickerSelected: {
    borderColor: '#2E7D32',
    backgroundColor: '#ffffff',
  },
  orderPickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  orderPickerText:        { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  orderPickerPlaceholder: { color: '#94a3b8', fontWeight: 'normal' },

  amountBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  amountLabel: { fontSize: 12, color: '#64748b', fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  amountValue: { fontSize: 36, fontWeight: 'bold', color: '#2E7D32', marginTop: 4 },
  amountItems: { fontSize: 12, color: '#94a3b8', marginTop: 2 },

  // ── Payment method ───────────────────────────────────
  methodList: { gap: 10 },
  methodCard: {
    minHeight: 66,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  methodCardActive:  { borderColor: '#2E7D32', backgroundColor: '#E8F5E9' },
  methodLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, marginRight: 8 },
  methodIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  methodIconWrapActive: { backgroundColor: '#2E7D32' },
  methodLabel:       { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  methodLabelActive: { color: '#2E7D32' },
  methodSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2 },

  // Payment interfaces
  interfaceHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  interfaceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
  },
  interfaceTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  interfaceSubtitle: { fontSize: 12, color: '#64748b', marginTop: 2, lineHeight: 17 },
  bankDetailsBox: {
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: 12,
    backgroundColor: '#f0fdf4',
    padding: 12,
    marginBottom: 14,
    gap: 10,
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  bankDetailLabel: { fontSize: 12, color: '#64748b', fontWeight: '700', flex: 1 },
  bankDetailValue: { fontSize: 13, color: '#0f172a', fontWeight: '800', flex: 1.5, textAlign: 'right' },
  optionList: { gap: 8, marginBottom: 14 },
  optionRow: {
    minHeight: 46,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  },
  optionRowActive: { borderColor: '#2E7D32', backgroundColor: '#E8F5E9' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionText: { fontSize: 13, color: '#64748b', fontWeight: '700' },
  optionTextActive: { color: '#2E7D32' },
  inputLabel: { fontSize: 12, color: '#0f172a', fontWeight: '800', marginBottom: 7, marginTop: 4 },
  textInput: {
    minHeight: 48,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  inputRow: { flexDirection: 'row', gap: 10 },
  stripePanel: {
    minHeight: 118,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    backgroundColor: '#635bff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardPreview: {
    minHeight: 118,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    backgroundColor: '#1B5E20',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardPreviewLabel: { color: '#d9f99d', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  cardPreviewNumber: { color: '#ffffff', fontSize: 20, fontWeight: 'bold', marginTop: 34, letterSpacing: 1 },
  stripeInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#E8F5E9',
  },
  stripeInfoText: { flex: 1, fontSize: 12, color: '#166534', lineHeight: 17, fontWeight: '600' },
  cashHero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#E8F5E9',
    marginBottom: 14,
  },
  cashIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  cashSteps: { gap: 9, marginBottom: 12 },
  cashStep: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cashStepText: { flex: 1, fontSize: 13, color: '#64748b', lineHeight: 18 },
  noteInput: { minHeight: 76, textAlignVertical: 'top' },

  // ── Bottom sheet ─────────────────────────────────────
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingTop: 12,
    maxHeight: '60%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: '#0f172a' },

  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  orderRowId:     { fontSize: 14, fontWeight: 'bold', color: '#0f172a', letterSpacing: 0.3 },
  orderRowDate:   { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  orderRowRight:  { alignItems: 'flex-end' },
  orderRowAmount: { fontSize: 15, fontWeight: 'bold', color: '#2E7D32' },
  orderRowItems:  { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  noOrders:       { textAlign: 'center', color: '#64748b', padding: 20, fontSize: 14 },
  
  imagePreviewWrap: { height: 140, borderRadius: 12, overflow: 'hidden', position: 'relative', marginTop: 4 },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  imageOverlayText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  imagePicker: { height: 100, borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', gap: 6, marginTop: 4 },
  imagePickerText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
});
