import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Modal, TextInput } from 'react-native';
import { Screen, Header, CrewTile, Card, PrimaryButton, SecondaryButton, sheetStyles } from '../components/UI';
import { colors, radius, type } from '../theme';
import { useApp } from '../store/AppContext';
import { crew } from '../content/crew';
import { TabProps } from '../navigation';

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function KeepsakesScreen(_: TabProps<'Keepsakes'>) {
  const { state, removeKeepsake, setMemory } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const forget = () =>
    Alert.alert('Forget everything?', 'The crew’s notes about you are cleared on this phone and not sent again. Your chats and saved lines stay.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Forget', style: 'destructive', onPress: () => setMemory('') },
    ]);

  const remove = (id: string) =>
    Alert.alert('Remove this line?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeKeepsake(id) },
    ]);

  return (
    <Screen scroll>
      <Header big title="Keepsakes" />

      <Card style={{ marginTop: 4 }}>
        <Text style={type.label}>What they remember about you</Text>
        <Text style={[type.body, { marginTop: 8, fontSize: 15, lineHeight: 22 }]}>
          {state.memory ? state.memory : 'Nothing yet. They learn one true thing at a time.'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <SecondaryButton
            title="Edit"
            small
            onPress={() => {
              setDraft(state.memory);
              setEditing(true);
            }}
          />
          <SecondaryButton title="Forget everything" small onPress={forget} disabled={!state.memory} />
        </View>
        <Text style={[type.caption, { marginTop: 12, lineHeight: 16 }]}>
          Kept on this phone and sent with each message so the crew stays consistent. Nothing else is stored about you.
        </Text>
      </Card>

      <Text style={[type.caption, { marginTop: 22, marginBottom: 8 }]}>SAVED LINES</Text>
      {state.keepsakes.length === 0 ? (
        <Card>
          <Text style={type.bodySoft}>Long-press any crew message and choose “Save line”. It lands here with the date.</Text>
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {state.keepsakes.map((k) => {
            const c = crew(k.who);
            return (
              <Pressable key={k.id} onLongPress={() => remove(k.id)} style={[styles.line, { borderLeftColor: c.color }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <CrewTile emoji={c.emoji} color={c.color} size={26} />
                  <Text style={[type.caption, { color: c.color, fontWeight: '800' }]}>{c.name}</Text>
                  <Text style={type.caption}>· {fmtDate(k.at)}</Text>
                </View>
                <Text style={styles.lineText}>{k.text}</Text>
              </Pressable>
            );
          })}
          <Text style={[type.caption, { marginTop: 4 }]}>Long-press a line to remove it.</Text>
        </View>
      )}

      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <Pressable style={sheetStyles.backdrop} onPress={() => setEditing(false)} />
        <View style={sheetStyles.sheet}>
          <Text style={type.h2}>What they remember</Text>
          <Text style={[type.sub, { marginTop: 4 }]}>Plain sentences. Fix anything wrong, or add what they should know.</Text>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={1200}
            style={[sheetStyles.input, { minHeight: 140, fontSize: 15, fontWeight: '400', textAlignVertical: 'top' }]}
            placeholder="e.g. I have a cat called Miso. I work nights."
            placeholderTextColor={colors.inkFaint}
          />
          <PrimaryButton
            title="Save"
            onPress={() => {
              setMemory(draft.trim());
              setEditing(false);
            }}
            style={{ marginTop: 14 }}
          />
          <Pressable onPress={() => setEditing(false)} style={{ alignItems: 'center', paddingVertical: 14 }}>
            <Text style={type.sub}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  line: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1, borderColor: colors.line, borderLeftWidth: 4 },
  lineText: { marginTop: 8, fontSize: 16, lineHeight: 23, color: colors.ink },
});
