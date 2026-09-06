import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle, ActivityIndicator, ScrollView, Switch, TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, type, switchProps } from '../theme';

export function Screen({ children, scroll, contentStyle, edges }: { children: React.ReactNode; scroll?: boolean; contentStyle?: ViewStyle; edges?: ('top' | 'bottom')[] }) {
  return (
    <SafeAreaView style={styles.safe} edges={edges ?? ['top']}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.scroll, contentStyle]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.body, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function Header({ title, onBack, right, big }: { title?: string; onBack?: () => void; right?: React.ReactNode; big?: boolean }) {
  if (big) {
    return (
      <View style={[styles.header, { justifyContent: 'space-between', paddingTop: 6 }]}>
        <Text style={type.h1}>{title}</Text>
        {right}
      </View>
    );
  }
  return (
    <View style={styles.header}>
      <View style={{ width: 70 }}>
        {onBack && (
          <Pressable onPress={onBack} hitSlop={12}>
            <Text style={styles.back}>‹ Back</Text>
          </Pressable>
        )}
      </View>
      <Text style={[type.h3, { flex: 1, textAlign: 'center' }]} numberOfLines={1}>
        {title ?? ''}
      </Text>
      <View style={{ width: 70, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Label({ children, color, style }: { children: React.ReactNode; color?: string; style?: TextStyle }) {
  return <Text style={[type.label, { marginBottom: 8 }, color ? { color } : null, style]}>{children}</Text>;
}

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  style,
  color,
  textColor,
  small,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  color?: string;
  textColor?: string;
  small?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primary,
        small && { height: 44, paddingHorizontal: 18 },
        color ? { backgroundColor: color } : null,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onInk} />
      ) : (
        <Text style={[styles.primaryText, small && { fontSize: 15 }, textColor ? { color: textColor } : null]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ title, onPress, style, disabled, small }: { title: string; onPress: () => void; style?: ViewStyle; disabled?: boolean; small?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.secondary, small && { height: 40, paddingHorizontal: 14 }, disabled && { opacity: 0.5 }, pressed && { opacity: 0.7 }, style]}
    >
      <Text style={[styles.secondaryText, small && { fontSize: 14 }]}>{title}</Text>
    </Pressable>
  );
}

export function GhostButton({ title, onPress, style }: { title: string; onPress: () => void; style?: ViewStyle }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghost, pressed && { opacity: 0.6 }, style]}>
      <Text style={styles.ghostText}>{title}</Text>
    </Pressable>
  );
}

export function OptionButton({
  label,
  sub,
  selected,
  onPress,
  multi,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onPress: () => void;
  multi?: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.option, selected && styles.optionActive, pressed && { opacity: 0.85 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[type.h3, selected && { color: colors.accentDeep }]}>{label}</Text>
        {sub ? <Text style={[type.sub, { marginTop: 2 }]}>{sub}</Text> : null}
      </View>
      <View style={[styles.radio, multi && { borderRadius: 6 }, selected && styles.radioActive]}>
        {selected && <View style={[styles.radioDot, multi && { borderRadius: 2 }]} />}
      </View>
    </Pressable>
  );
}

export function Chip({ text, selected, onPress, big, color }: { text: string; selected?: boolean; onPress?: () => void; big?: boolean; color?: string }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, big && styles.chipBig, selected && styles.chipActive, selected && color ? { backgroundColor: color, borderColor: color } : null]}
    >
      <Text style={[styles.chipText, big && { fontSize: 16 }, selected && { color: color ? '#fff' : colors.onAccent }]}>{text}</Text>
    </Pressable>
  );
}

/** Small coloured tag: blanket red, kotatsu orange ("gold"), or plain. Pass `color` for a crew tint. */
export function Tag({ text, tone, color }: { text: string; tone?: 'red' | 'gold' | 'plain'; color?: string }) {
  const bg = color ? `${color}26` : tone === 'red' ? colors.redSoft : tone === 'gold' ? colors.accentSoft : colors.cardAlt;
  const fg = color ? color : tone === 'red' ? colors.red : tone === 'gold' ? colors.accentDeep : colors.inkSoft;
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 3 }}>
      <Text style={{ color: fg, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 }}>{text}</Text>
    </View>
  );
}

export function ProgressDots({ count, index }: { count: number; index: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center' }}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={{ width: i === index ? 22 : 8, height: 8, borderRadius: 4, backgroundColor: i <= index ? colors.accent : colors.lineStrong }}
        />
      ))}
    </View>
  );
}

export function StatTile({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <View style={styles.tile}>
      <Text style={[type.caption, { marginBottom: 6 }]}>{label}</Text>
      <Text style={[type.num, { fontSize: 22, color: color ?? colors.ink }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {sub ? <Text style={[type.caption, { marginTop: 2 }]}>{sub}</Text> : null}
    </View>
  );
}

export function ToggleRow({ label, sub, value, onChange, last }: { label: string; sub?: string; value: boolean; onChange: (v: boolean) => void; last?: boolean }) {
  return (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[type.body, { fontWeight: '600' }]}>{label}</Text>
        {sub ? <Text style={type.caption}>{sub}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.accent, false: colors.lineStrong }} thumbColor="#fff" {...switchProps} />
    </View>
  );
}

export function Row({ label, value, onPress, danger, last }: { label: string; value?: string; onPress: () => void; danger?: boolean; last?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={[type.body, { fontWeight: '600' }, danger && { color: colors.danger }]}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {value ? <Text style={type.sub}>{value}</Text> : null}
        <Text style={{ color: colors.inkFaint, fontSize: 18 }}>›</Text>
      </View>
    </Pressable>
  );
}

export function Group({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.group, style]}>{children}</View>;
}

export function SectionCaption({ children }: { children: React.ReactNode }) {
  return <Text style={[type.caption, { marginTop: 20, marginBottom: 6 }]}>{children}</Text>;
}

/** Locked-feature card that sends free users to the paywall. */
export function ProGate({ title, body, onPress }: { title: string; body: string; onPress: () => void }) {
  return (
    <Card style={{ marginTop: 16, alignItems: 'flex-start' }}>
      <Tag text="PRO" tone="gold" />
      <Text style={[type.h2, { marginTop: 10 }]}>{title}</Text>
      <Text style={[type.bodySoft, { marginTop: 6 }]}>{body}</Text>
      <PrimaryButton title="Keep your seat" onPress={onPress} style={{ marginTop: 16, alignSelf: 'stretch' }} />
    </Card>
  );
}

/** Emoji avatar tile tinted with the member's colour. */
export function CrewTile({ emoji, color, size = 34, style }: { emoji: string; color: string; size?: number; style?: ViewStyle }) {
  return (
    <View style={[{ width: size, height: size, borderRadius: size * 0.32, backgroundColor: `${color}2E`, borderWidth: 1, borderColor: `${color}66`, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ fontSize: size * 0.5, lineHeight: size * 0.62 }}>{emoji}</Text>
    </View>
  );
}

export const sheetStyles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: 22,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  input: {
    marginTop: 12,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, paddingHorizontal: 20 },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  back: { color: colors.inkSoft, fontSize: 17, fontWeight: '600' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, borderWidth: 1, borderColor: colors.line },
  primary: { backgroundColor: colors.ink, borderRadius: radius.pill, height: 56, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  primaryText: { color: colors.onInk, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  secondary: {
    backgroundColor: colors.cardAlt,
    borderRadius: radius.pill,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  secondaryText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  ghost: { height: 48, alignItems: 'center', justifyContent: 'center' },
  ghostText: { color: colors.inkSoft, fontSize: 15, fontWeight: '600' },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, borderWidth: 1.5, borderColor: colors.line },
  optionActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  chip: { backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: colors.lineStrong },
  chipBig: { paddingHorizontal: 20, paddingVertical: 14 },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.ink, fontSize: 14, fontWeight: '700' },
  tile: { flex: 1, backgroundColor: colors.card, borderRadius: radius.md, padding: 14, borderWidth: 1, borderColor: colors.line },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    gap: 10,
  },
  group: { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line },
});
