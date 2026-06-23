import React, { useState, useContext } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Image, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartContext } from '../../context/CartContext';
import * as ImagePicker from 'expo-image-picker';
import api, { getImageUri } from '../../config/api';
import AppHeader from '../../components/AppHeader';
import EmptyState from '../../components/EmptyState';
import GreenButton from '../../components/GreenButton';
import InputField from '../../components/InputField';
import { shadows } from '../../theme/styles';

const CARD_COLORS = ['#FFE0B2', '#FFCDD2', '#FFF9C4', '#E8F5E9', '#F3E5F5', '#FBE9E7', '#E1F5FE', '#FCE4EC'];
const getCardColor = (name = '', id = '') => {
  let hash = 0;
  const str = name + id;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return CARD_COLORS[Math.abs(hash) % CARD_COLORS.length];
};

const DELIVERY_FEE = 200;

function CartItem({ item, onUpdateQty, onRemove }) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <View style={[S.itemCard, shadows.small]}>
      <View style={[S.itemImgWrap, { backgroundColor: item.imageUrl && !imgErr ? 'transparent' : getCardColor(item.name, item._id) }]}>
        {item.imageUrl && !imgErr ? (
          <Image source={{ uri: getImageUri(item.imageUrl) }} style={S.itemImg} onError={() => setImgErr(true)} />
        ) : (
          <Ionicons name="bag-outline" size={26} color="#2E7D32" />
        )}
      </View>
      <View style={S.itemBody}>
        <Text style={S.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={S.itemUnit}>LKR {Number(item.price).toFixed(2)} / unit</Text>
        <View style={S.qtyRow}>
          <TouchableOpacity
            style={[S.qtyBtn, { borderColor: '#ef4444' }]}
            onPress={() => onUpdateQty(item._id, item.quantity - 1)}
          >
            <Ionicons name="remove" size={13} color="#ef4444" />
          </TouchableOpacity>
          <Text style={S.qtyNum}>{item.quantity}</Text>
          <TouchableOpacity
            style={[S.qtyBtn, { borderColor: '#2E7D32' }]}
            onPress={() => onUpdateQty(item._id, item.quantity + 1)}
            disabled={item.quantity >= Number(item.stock ?? item.stockQuantity ?? Infinity)}
          >
            <Ionicons
              name="add"
              size={13}
              color={item.quantity >= Number(item.stock ?? item.stockQuantity ?? Infinity) ? '#94a3b8' : '#2E7D32'}
            />
          </TouchableOpacity>
        </View>
      </View>
      <View style={S.itemRight}>
        <Text style={S.itemTotal}>LKR {(item.price * item.quantity).toFixed(2)}</Text>
        <TouchableOpacity style={S.trashBtn} onPress={() => onRemove(item._id)} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={18} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function CartFooter({ address, setAddress, landmark, setLandmark, cartTotal, cartStore, placeOrder, loading }) {
  return (
    <View style={S.footer}>
      {/* Edit window note */}
      <View style={S.editNote}>
        <Ionicons name="time-outline" size={14} color="#2E7D32" />
        <Text style={S.editNoteText}>You can edit your order within 1 hour of placing it</Text>
      </View>

      {/* Delivery address */}
      <View style={[S.addressCard, shadows.small]}>
        {cartStore?.name ? (
          <View style={S.selectedStoreRow}>
            <Ionicons name="storefront-outline" size={16} color="#2E7D32" />
            <Text style={S.selectedStoreText} numberOfLines={1}>{cartStore.name}</Text>
          </View>
        ) : null}
        <View style={S.cardHeaderRow}>
          <Ionicons name="location-outline" size={18} color="#2E7D32" />
          <Text style={S.cardHeaderText}>Delivery Address</Text>
        </View>
        <InputField
          placeholder="Enter your full delivery address..."
          value={address}
          onChangeText={setAddress}
          leftIcon="map-outline"
          multiline
          numberOfLines={2}
        />
        
        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#0f172a', marginTop: 12, marginBottom: 8 }}>landmark</Text>
        {landmark?.uri ? (
          <TouchableOpacity style={S.imagePreviewWrap} onPress={async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'], allowsEditing: true, aspect: [4, 3], quality: 0.7, base64: true,
            });
            if (!result.canceled) setLandmark(result.assets[0]);
          }} activeOpacity={0.85}>
            <Image source={{ uri: landmark.uri }} style={S.imagePreview} />
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
            if (!result.canceled) setLandmark(result.assets[0]);
          }} activeOpacity={0.8}>
            <Ionicons name="camera-outline" size={32} color="#94a3b8" />
            <Text style={S.imagePickerText}>Add Photo</Text>
            <Text style={S.imagePickerSub}>Tap to select from gallery</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Order summary */}
      <View style={[S.summaryCard, shadows.medium]}>
        <Text style={S.summaryTitle}>Order Summary</Text>
        <View style={S.summaryRow}>
          <Text style={S.summaryLabel}>Subtotal</Text>
          <Text style={S.summaryValue}>LKR {cartTotal.toFixed(2)}</Text>
        </View>
        <View style={S.summaryRow}>
          <Text style={S.summaryLabel}>Delivery Fee</Text>
          <Text style={S.summaryValue}>LKR {DELIVERY_FEE.toFixed(2)}</Text>
        </View>
        <View style={S.summaryDivider} />
        <View style={S.summaryRow}>
          <Text style={S.summaryTotalLabel}>Total</Text>
          <Text style={S.summaryTotalAmt}>LKR {(cartTotal + DELIVERY_FEE).toFixed(2)}</Text>
        </View>
        <View style={{ marginTop: 16 }}>
          <GreenButton title="Place Order" onPress={placeOrder} loading={loading} fullWidth />
        </View>
      </View>
    </View>
  );
}

export default function CartScreen({ navigation }) {
  const { cartItems, cartStore, updateQuantity, removeFromCart, clearCart, cartTotal } = useContext(CartContext);
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState(null);
  const [loading, setLoading] = useState(false);

  const placeOrder = async () => {
    if (!address.trim()) { Alert.alert('Required', 'Please enter a delivery address'); return; }
    setLoading(true);
    try {
      const items = cartItems.map(i => ({
        productId: i._id,
        productName: i.name,
        quantity: i.quantity,
        priceAtOrder: i.price,
      }));
      const payload = { items, deliveryAddress: address, storeId: cartStore?._id };
      if (landmark) {
        payload.landmarkImageBase64 = `data:${landmark.mimeType || 'image/jpeg'};base64,${landmark.base64}`;
      }
      const { data: order } = await api.post('/orders', payload);
      clearCart();
       Alert.alert('Order Placed! 🎉', 'Your order has been placed successfully.', [
        {
          text: 'View Order',
          onPress: () => {
            navigation.getParent()?.navigate('Orders', {
              screen: 'OrderDetail',
              params: { orderId: order._id },
            });
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Error', !err.response ? 'Cannot connect to server' : err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={S.container}>
        <AppHeader title="My Cart" subtitle="0 items" onBack={() => navigation.goBack()} />
        <EmptyState
          icon="cart-outline"
          title="Your cart is empty"
          subtitle="Add some fresh items to get started"
          buttonTitle="Browse Products"
          onButtonPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <CartItem item={item} onUpdateQty={updateQuantity} onRemove={removeFromCart} />
  );

  return (
    <KeyboardAvoidingView
      style={S.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <AppHeader
        title="My Cart"
        subtitle={`${cartItems.length} item${cartItems.length !== 1 ? 's' : ''}`}
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={cartItems}
        keyExtractor={i => i._id}
        contentContainerStyle={S.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={renderItem}
        ListFooterComponent={
          <CartFooter
            address={address}
            setAddress={setAddress}
            landmark={landmark}
            setLandmark={setLandmark}
            cartTotal={cartTotal}
            cartStore={cartStore}
            placeOrder={placeOrder}
            loading={loading}
          />
        }
      />
    </KeyboardAvoidingView>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  list: { padding: 16, paddingBottom: 40 },

  // ── Item card ───────────────────────────────────────
  itemCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  itemImgWrap: {
    width: 70,
    height: 70,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  itemImg: { width: 60, height: 60, resizeMode: 'contain' },
  itemBody:  { flex: 1, marginLeft: 12 },
  itemName:  { fontSize: 14, fontWeight: 'bold', color: '#0f172a', marginBottom: 4 },
  itemUnit:  { fontSize: 12, color: '#64748b', marginBottom: 8 },
  qtyRow:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyNum:    { fontSize: 15, fontWeight: 'bold', color: '#0f172a', minWidth: 24, textAlign: 'center' },
  itemRight: { alignItems: 'flex-end', justifyContent: 'space-between', paddingLeft: 8 },
  itemTotal: { fontSize: 15, fontWeight: 'bold', color: '#2E7D32' },
  trashBtn:  { padding: 4 },

  // ── Footer ──────────────────────────────────────────
  footer: { gap: 12, marginTop: 4 },

  editNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  editNoteText: { fontSize: 12, color: '#2E7D32', fontWeight: '600', flex: 1 },

  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeaderText: { fontSize: 15, fontWeight: 'bold', color: '#0f172a' },
  selectedStoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  selectedStoreText: { flex: 1, fontSize: 13, color: '#2E7D32', fontWeight: '700' },

  addressCard: { backgroundColor: '#ffffff', borderRadius: 16, padding: 16 },

  summaryCard:  { backgroundColor: '#ffffff', borderRadius: 16, padding: 16 },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#0f172a', marginBottom: 14 },
  summaryRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  summaryLabel: { fontSize: 14, color: '#64748b' },
  summaryValue: { fontSize: 14, color: '#0f172a', fontWeight: '600' },
  summaryDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },
  summaryTotalLabel: { fontSize: 16, fontWeight: 'bold', color: '#0f172a' },
  summaryTotalAmt:   { fontSize: 18, fontWeight: 'bold', color: '#2E7D32' },

  imagePreviewWrap: { height: 140, borderRadius: 12, overflow: 'hidden', position: 'relative', marginTop: 8 },
  imagePreview: { width: '100%', height: '100%', resizeMode: 'cover' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
  imageOverlayText: { color: '#ffffff', fontWeight: '600', fontSize: 13 },
  imagePicker: { height: 120, borderWidth: 2, borderColor: '#cbd5e1', borderStyle: 'dashed', borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', gap: 6, marginTop: 8 },
  imagePickerText: { fontSize: 14, fontWeight: '600', color: '#64748b' },
  imagePickerSub:  { fontSize: 12, color: '#94a3b8' },
});
