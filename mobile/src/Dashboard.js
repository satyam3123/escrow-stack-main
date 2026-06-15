import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { io } from 'socket.io-client';
import { api } from './api';
import { colors, fonts } from './theme';

const MAX_HISTORY = 60;
const fmt = (n) => Number(n ?? 0).toFixed(2);
const signed = (n) => `${(n ?? 0) >= 0 ? '+' : ''}${fmt(n)}`;
const pct = (n) => `${(n ?? 0) >= 0 ? '+' : ''}${fmt(n)}%`;
const time = (ts) => (ts ? new Date(ts).toLocaleTimeString('en-US', { hour12: false }) : '--:--:--');

export default function Dashboard({ token, user, onLogout }) {
  const socketRef = useRef(null);
  const [status, setStatus] = useState('connecting');
  const [subscriptions, setSubscriptions] = useState([]);
  const [prices, setPrices] = useState({});
  const [catalog, setCatalog] = useState([]);
  const [market, setMarket] = useState([]);
  const [clock, setClock] = useState(Date.now());

  useEffect(() => {
    api.stocks().then(setCatalog).catch(() => {});
    const id = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const socket = io(api.base, { auth: { token }, transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setStatus('connected'));
    socket.on('disconnect', () => setStatus('disconnected'));
    socket.on('connect_error', () => setStatus('error'));

    socket.on('snapshot', ({ subscriptions: subs, prices: snap }) => {
      setSubscriptions(subs);
      setPrices((prev) => ({ ...prev, ...snap }));
    });
    socket.on('subscriptions', (list) => {
      setSubscriptions(list);
      setPrices((prev) => Object.fromEntries(Object.entries(prev).filter(([t]) => list.includes(t))));
    });
    socket.on('price', (tick) => {
      setPrices((prev) => {
        const existing = prev[tick.ticker];
        const history = existing?.history ? [...existing.history, tick.price].slice(-MAX_HISTORY) : [tick.price];
        return { ...prev, [tick.ticker]: { ...existing, ...tick, history } };
      });
    });
    socket.on('market', (all) => setMarket(all));

    return () => socket.close();
  }, [token]);

  const subscribe = (ticker) => socketRef.current?.emit('subscribe', { ticker });
  const unsubscribe = (ticker) => socketRef.current?.emit('unsubscribe', { ticker });

  const cards = useMemo(() => subscriptions.map((t) => prices[t]).filter(Boolean), [subscriptions, prices]);
  const available = useMemo(
    () => catalog.filter((s) => !subscriptions.includes(s.ticker)),
    [catalog, subscriptions],
  );
  const dot = status === 'connected' ? colors.up : status === 'connecting' ? colors.gold : colors.down;
  const dotLabel = status === 'connected' ? 'LIVE' : status === 'connecting' ? 'CONNECTING' : 'OFFLINE';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Masthead */}
      <View style={styles.topbar}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Text style={styles.logoMark}>↗</Text>
          </View>
          <View>
            <Text style={styles.brand}>Escrow Stack</Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>
        <View style={styles.topRight}>
          <View style={styles.statusWrap}>
            <View style={[styles.dot, { backgroundColor: dot }]} />
            <Text style={styles.statusText}>{dotLabel}</Text>
          </View>
          <TouchableOpacity style={styles.signout} onPress={onLogout}>
            <Text style={styles.signoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Live market strip */}
      {market.length > 0 && (
        <View style={styles.strip}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stripInner}>
            {market.map((m) => {
              const up = (m.changePct ?? 0) >= 0;
              return (
                <View key={m.ticker} style={styles.stripItem}>
                  <Text style={styles.stripTicker}>{m.ticker}</Text>
                  <Text style={styles.stripPrice}>{fmt(m.price)}</Text>
                  <Text style={[styles.stripPct, { color: up ? colors.up : colors.down }]}>
                    {up ? '▲' : '▼'} {pct(m.changePct)}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={cards}
        keyExtractor={(item) => item.ticker}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <View style={styles.sectionRow}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.gold }]}>PORTFOLIO</Text>
                <Text style={styles.h1}>Your watchlist</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.clock}>{time(clock)}</Text>
                <Text style={styles.eyebrow}>{subscriptions.length} TRACKED · 1S</Text>
              </View>
            </View>

            <View style={styles.rule} />

            <Text style={[styles.eyebrow, { marginBottom: 10 }]}>ADD TO WATCHLIST</Text>
            {available.length === 0 ? (
              <Text style={styles.muted}>Tracking all supported instruments.</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
                {available.map((s) => (
                  <TouchableOpacity key={s.ticker} style={styles.chip} onPress={() => subscribe(s.ticker)}>
                    <Text style={styles.chipTicker}>{s.ticker}</Text>
                    <View style={styles.chipPlus}>
                      <View style={styles.plusH} />
                      <View style={styles.plusV} />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        }
        renderItem={({ item }) => <StockCard data={item} onRemove={unsubscribe} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Your terminal is quiet</Text>
            <Text style={styles.muted}>Add an instrument above to begin streaming.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function StockCard({ data, onRemove }) {
  const up = (data.change ?? 0) >= 0;
  const flash = useRef(new Animated.Value(0)).current;
  const prev = useRef(data.price);
  const dir = useRef('up');

  useEffect(() => {
    if (data.price === prev.current) return;
    dir.current = data.price > prev.current ? 'up' : 'down';
    prev.current = data.price;
    flash.setValue(1);
    Animated.timing(flash, { toValue: 0, duration: 800, useNativeDriver: false }).start();
  }, [data.price, data.ts]);

  const flashBg = flash.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(0,0,0,0)', dir.current === 'up' ? 'rgba(108,194,142,0.14)' : 'rgba(223,107,98,0.14)'],
  });

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardEyebrow}>NASDAQ · USD</Text>
          <View style={styles.tickerRow}>
            <Text style={styles.ticker}>{data.ticker}</Text>
            <View style={[styles.badge, { borderColor: up ? 'rgba(108,194,142,0.25)' : 'rgba(223,107,98,0.25)', backgroundColor: up ? 'rgba(108,194,142,0.1)' : 'rgba(223,107,98,0.1)' }]}>
              <Text style={[styles.badgeText, { color: up ? colors.up : colors.down }]}>
                {up ? '↑' : '↓'} {pct(data.changePct)}
              </Text>
            </View>
          </View>
          <Text style={styles.name} numberOfLines={1}>
            {data.name}
          </Text>
        </View>
        <TouchableOpacity onPress={() => onRemove(data.ticker)} hitSlop={12}>
          <Text style={styles.remove}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.priceRow}>
        <Animated.View style={[styles.priceWrap, { backgroundColor: flashBg }]}>
          <Text style={styles.dollar}>$</Text>
          <Text style={styles.price}>{fmt(data.price)}</Text>
        </Animated.View>
        <Text style={[styles.change, { color: up ? colors.up : colors.down }]}>{signed(data.change)}</Text>
      </View>

      <MiniChart data={data.history} up={up} />

      <View style={styles.cardFoot}>
        <View style={styles.liveRow}>
          <View style={[styles.dot, { backgroundColor: colors.up, width: 5, height: 5, borderRadius: 3 }]} />
          <Text style={styles.eyebrow}>LIVE</Text>
        </View>
        <Text style={styles.footTime}>{time(data.ts)}</Text>
      </View>
    </View>
  );
}

function MiniChart({ data, up }) {
  if (!data || data.length < 2) return <View style={{ height: 44 }} />;
  const recent = data.slice(-34);
  const min = Math.min(...recent);
  const max = Math.max(...recent);
  const range = max - min || 1;
  const color = up ? 'rgba(108,194,142,0.5)' : 'rgba(223,107,98,0.5)';
  return (
    <View style={styles.chart}>
      {recent.map((v, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            marginHorizontal: 0.5,
            height: 4 + ((v - min) / range) * 38,
            backgroundColor: color,
            borderRadius: 1,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(216,184,120,0.3)',
    backgroundColor: 'rgba(216,184,120,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoMark: { color: colors.gold, fontSize: 16, fontFamily: fonts.bodyBold },
  brand: { color: colors.ink, fontFamily: fonts.display, fontSize: 16 },
  email: { color: colors.faint, fontSize: 11, fontFamily: fonts.mono, maxWidth: 150 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { color: colors.muted, fontSize: 10, letterSpacing: 1.5, fontFamily: fonts.monoReg },
  signout: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.panel,
  },
  signoutText: { color: colors.muted, fontSize: 12, fontFamily: fonts.body },

  strip: { borderBottomColor: colors.line, borderBottomWidth: 1, backgroundColor: colors.bg2 },
  stripInner: { paddingHorizontal: 16, paddingVertical: 9, gap: 22, alignItems: 'center' },
  stripItem: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  stripTicker: { color: colors.ink, fontSize: 12, fontFamily: fonts.bodySemi },
  stripPrice: { color: colors.muted, fontSize: 12, fontFamily: fonts.mono },
  stripPct: { fontSize: 11, fontFamily: fonts.mono },

  list: { padding: 16, gap: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  eyebrow: { color: colors.faint, fontSize: 10, letterSpacing: 2, fontFamily: fonts.monoReg },
  h1: { color: colors.ink, fontSize: 26, fontFamily: fonts.display, marginTop: 5 },
  clock: { color: colors.ink, fontSize: 15, fontFamily: fonts.mono },
  rule: { height: 1, backgroundColor: colors.line, marginVertical: 18 },
  muted: { color: colors.muted, fontSize: 13, fontFamily: fonts.body },
  chips: { flexGrow: 0, marginBottom: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 9,
    marginRight: 8,
  },
  chipTicker: { color: colors.ink, fontFamily: fonts.display, fontSize: 15 },
  chipPlus: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: colors.line },
  plusH: { position: 'absolute', top: '50%', left: '50%', width: 9, height: 1.6, marginTop: -0.8, marginLeft: -4.5, borderRadius: 1, backgroundColor: colors.gold },
  plusV: { position: 'absolute', top: '50%', left: '50%', width: 1.6, height: 9, marginTop: -4.5, marginLeft: -0.8, borderRadius: 1, backgroundColor: colors.gold },

  card: {
    backgroundColor: colors.panel,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardEyebrow: { color: colors.faint, fontSize: 9, letterSpacing: 2, fontFamily: fonts.monoReg, marginBottom: 6 },
  tickerRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  ticker: { color: colors.ink, fontSize: 24, fontFamily: fonts.display },
  badge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontFamily: fonts.mono },
  name: { color: colors.muted, fontSize: 13, fontFamily: fonts.body, marginTop: 4 },
  remove: { color: colors.faint, fontSize: 15, paddingLeft: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 16 },
  priceWrap: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: 6, paddingHorizontal: 4 },
  dollar: { color: colors.faint, fontSize: 18, fontFamily: fonts.mono, marginTop: 2 },
  price: { color: colors.ink, fontSize: 32, fontFamily: fonts.mono },
  change: { fontSize: 14, fontFamily: fonts.mono, paddingBottom: 4 },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 44, marginTop: 16 },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    paddingTop: 12,
  },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footTime: { color: colors.faint, fontSize: 11, fontFamily: fonts.mono },

  empty: { alignItems: 'center', paddingVertical: 48 },
  emptyTitle: { color: colors.ink, fontFamily: fonts.display, fontSize: 20, marginBottom: 6 },
});
