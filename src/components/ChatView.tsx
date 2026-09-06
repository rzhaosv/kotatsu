import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, Pressable, Platform, KeyboardAvoidingView, Linking, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, type } from '../theme';
import { CrewTile, sheetStyles } from './UI';
import { crew } from '../content/crew';
import { CrewId, Message } from '../logic/types';
import { snap } from '../dev/demo';

export const SUPPORT_EMAIL = 'tryformaapp@gmail.com';

type Props = {
  messages: Message[];
  typing: CrewId | null | undefined;
  busy: boolean | undefined;
  notice: string | null | undefined;
  onSend: (text: string) => void;
  onSave: (m: Message) => void;
  placeholder?: string;
  /** Rendered above the input, e.g. the free-tier "14 left today" pill. */
  footerLeft?: React.ReactNode;
  /** Empty-state content when there are no messages yet. */
  empty?: React.ReactNode;
};

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  return `${h % 12 === 0 ? 12 : h % 12}:${m < 10 ? '0' : ''}${m} ${h >= 12 ? 'pm' : 'am'}`;
};

export default function ChatView({ messages, typing, busy, notice, onSend, onSave, placeholder, footerLeft, empty }: Props) {
  const [draft, setDraft] = useState('');
  const [picked, setPicked] = useState<Message | null>(null);
  const list = useRef<FlatList<Message>>(null);

  useEffect(() => {
    const t = setTimeout(() => list.current?.scrollToEnd({ animated: !snap }), 60);
    return () => clearTimeout(t);
  }, [messages.length, typing]);

  const submit = () => {
    const t = draft.trim();
    if (!t || busy) return;
    setDraft('');
    onSend(t);
  };

  const report = (m: Message) => {
    const who = m.who ? crew(m.who).name : 'crew';
    const subject = encodeURIComponent('Kotatsu: report a message');
    const body = encodeURIComponent(`I want to report this message from ${who}:\n\n"${m.text}"\n\nWhat was wrong with it:\n`);
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() => {});
  };

  const renderItem = ({ item, index }: { item: Message; index: number }) => {
    const prev = messages[index - 1];
    if (item.role === 'user') {
      return (
        <View style={[styles.rowUser, prev?.role === 'user' && { marginTop: 4 }]}>
          <View style={styles.bubbleUser}>
            <Text style={styles.userText}>{item.text}</Text>
          </View>
        </View>
      );
    }
    const c = crew(item.who);
    const sameAsPrev = prev?.role === 'crew' && prev.who === item.who;
    return (
      <View>
        <View style={[styles.rowCrew, sameAsPrev && { marginTop: 3 }]}>
          <View style={{ width: 34 }}>{!sameAsPrev && <CrewTile emoji={c.emoji} color={c.color} />}</View>
          <View style={{ flex: 1, alignItems: 'flex-start' }}>
            {!sameAsPrev && (
              <View style={styles.nameRow}>
                <Text style={[styles.name, { color: c.color }]}>{c.name}</Text>
                <Text style={styles.time}>{fmtTime(item.at)}</Text>
              </View>
            )}
            <Pressable onLongPress={() => setPicked(item)} delayLongPress={280} style={({ pressed }) => [styles.bubbleCrew, pressed && { opacity: 0.85 }]}>
              <Text style={styles.crewText}>{item.text}</Text>
            </Pressable>
          </View>
        </View>
        {item.risk ? <RiskCard /> : null}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <View style={{ flex: 1 }}>
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={empty ? <View style={{ paddingTop: 40 }}>{empty}</View> : null}
          ListFooterComponent={
            <View>
              {typing ? (
                <View style={[styles.rowCrew, { alignItems: 'center' }]}>
                  <View style={{ width: 34 }}>
                    <CrewTile emoji={crew(typing).emoji} color={crew(typing).color} />
                  </View>
                  <View style={styles.typingBubble}>
                    <Text style={styles.typingText}>{crew(typing).name.toLowerCase()} is typing…</Text>
                  </View>
                </View>
              ) : null}
              {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            </View>
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: !snap })}
        />
        <LinearGradient colors={['rgba(224,135,58,0)', colors.glow]} style={styles.glow} />
      </View>

      <View style={styles.inputWrap}>
        {footerLeft ? <View style={styles.footerLeft}>{footerLeft}</View> : null}
        <View style={styles.inputRow}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={placeholder ?? 'say something'}
            placeholderTextColor={colors.inkFaint}
            style={styles.input}
            multiline
            maxLength={1500}
            onSubmitEditing={submit}
            blurOnSubmit
            returnKeyType="send"
          />
          <Pressable onPress={submit} disabled={!draft.trim() || !!busy} style={({ pressed }) => [styles.sendBtn, (!draft.trim() || busy) && { opacity: 0.35 }, pressed && { transform: [{ scale: 0.96 }] }]}>
            <Text style={styles.sendText}>↑</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={!!picked} transparent animationType="fade" onRequestClose={() => setPicked(null)}>
        <Pressable style={sheetStyles.backdrop} onPress={() => setPicked(null)} />
        <View style={sheetStyles.sheet}>
          {picked ? (
            <>
              <Text style={[type.caption, { color: crew(picked.who).color, fontWeight: '700' }]}>{crew(picked.who).name}</Text>
              <Text style={[type.body, { marginTop: 6 }]} numberOfLines={5}>
                {picked.text}
              </Text>
              <Pressable
                onPress={() => {
                  onSave(picked);
                  setPicked(null);
                }}
                style={styles.action}
              >
                <Text style={styles.actionText}>Save line</Text>
                <Text style={type.caption}>Keeps it in Keepsakes</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  const m = picked;
                  setPicked(null);
                  report(m);
                }}
                style={[styles.action, { borderBottomWidth: 0 }]}
              >
                <Text style={[styles.actionText, { color: colors.red }]}>Report</Text>
                <Text style={type.caption}>Emails the studio with this message</Text>
              </Pressable>
              <Pressable onPress={() => setPicked(null)} style={{ alignItems: 'center', paddingVertical: 14 }}>
                <Text style={type.sub}>Cancel</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

/** Calm resource card shown under a reply when the backend flagged risk. Never blocks the chat. */
export function RiskCard() {
  return (
    <View style={styles.risk}>
      <Text style={[type.sub, { color: colors.ink, lineHeight: 20 }]}>
        If you’re in danger or thinking about hurting yourself: US{' '}
        <Text style={styles.riskLink} onPress={() => Linking.openURL('tel:988')}>
          call
        </Text>{' '}
        or{' '}
        <Text style={styles.riskLink} onPress={() => Linking.openURL('sms:988')}>
          text 988
        </Text>{' '}
        · elsewhere{' '}
        <Text style={styles.riskLink} onPress={() => Linking.openURL('https://findahelpline.com')}>
          findahelpline.com
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 14, paddingTop: 10, paddingBottom: 26 },
  rowCrew: { flexDirection: 'row', gap: 8, marginTop: 14, alignItems: 'flex-end' },
  rowUser: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 4, marginLeft: 2 },
  name: { fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
  time: { fontSize: 11, color: colors.inkFaint, fontWeight: '500' },
  bubbleCrew: {
    backgroundColor: colors.bubbleCrew,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '88%',
    borderWidth: 1,
    borderColor: colors.line,
  },
  crewText: { fontSize: 16, lineHeight: 22, color: colors.ink },
  bubbleUser: { backgroundColor: colors.bubbleUser, borderRadius: 18, borderBottomRightRadius: 6, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '82%' },
  userText: { fontSize: 16, lineHeight: 22, color: colors.onInk },
  typingBubble: { backgroundColor: colors.cardAlt, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  typingText: { fontSize: 13, color: colors.inkSoft, fontStyle: 'italic' },
  notice: { ...type.caption, textAlign: 'center', marginTop: 14, color: colors.red },
  glow: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90, pointerEvents: 'none' },
  inputWrap: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 10, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line },
  footerLeft: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 10,
    fontSize: 16,
    color: colors.ink,
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: -1 },
  action: { paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  actionText: { fontSize: 17, fontWeight: '700', color: colors.ink },
  risk: { marginTop: 10, marginLeft: 42, backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.lineStrong, padding: 12 },
  riskLink: { color: colors.accentDeep, fontWeight: '700', textDecorationLine: 'underline' },
});
