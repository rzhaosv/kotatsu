import React, { useState } from 'react';
import { View, Text, Pressable, Linking, TextInput, Alert, Modal, ScrollView, Switch } from 'react-native';
import { Screen, Header, PrimaryButton, Card, Chip, Row, Group, SectionCaption, CrewTile, Tag, sheetStyles } from '../components/UI';
import { colors, type, switchProps } from '../theme';
import { useApp } from '../store/AppContext';
import { restore } from '../services/billing';
import { formatHour } from '../services/notifications';
import { TabProps } from '../navigation';
import { SITE } from './PaywallScreen';
import { SUPPORT_EMAIL } from '../components/ChatView';
import { CREW } from '../content/crew';
import { Pronouns, FREE_TABLE, WAITING_FOR_CHIPS } from '../logic/types';

const PRONOUNS: [Pronouns, string][] = [
  ['she/her', 'she/her'],
  ['he/him', 'he/him'],
  ['they/them', 'they/them'],
  ['', 'none'],
];
const HOURS = [7, 8, 9, 12, 18, 20, 21, 22, 23, 0, 3];

export default function SettingsScreen({ navigation }: TabProps<'Settings'>) {
  const { state, isPro, setPro, update, toggleTable, setCheckins, resetAll, setWaiting } = useApp();
  const [nameOpen, setNameOpen] = useState(false);
  const [name, setName] = useState('');
  const [pronouns, setPronouns] = useState<Pronouns>('');
  const [tableOpen, setTableOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [hourOpen, setHourOpen] = useState(false);
  const [waitingOpen, setWaitingOpen] = useState(false);
  const [waitingFor, setWaitingFor] = useState('');

  const openWaiting = () => {
    setWaitingFor(state.waitingFor);
    setWaitingOpen(true);
  };

  const onWaitingSwitch = (v: boolean) => {
    if (v && !state.waitingFor.trim()) return openWaiting();
    setWaiting(v);
  };

  const onDelete = () =>
    Alert.alert('Delete all data?', 'Chats, saved lines, what the crew remembers and your name are removed from this phone. Nothing is kept on a server to recover. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => resetAll() },
    ]);

  const onCheckins = async (v: boolean) => {
    if (!isPro) return navigation.navigate('Paywall', { reason: 'checkins' });
    const ok = await setCheckins(v);
    if (v && !ok) Alert.alert('Notifications are off', 'Allow notifications for Kotatsu in iOS Settings to get a check-in.');
  };

  return (
    <Screen scroll>
      <Header big title="Settings" />

      <Card style={{ marginTop: 4 }}>
        <Text style={type.label}>Plan</Text>
        <Text style={[type.h2, { marginTop: 6 }]}>{isPro ? 'Kotatsu Pro' : 'Free seat'}</Text>
        {!isPro && (
          <>
            <Text style={[type.sub, { marginTop: 4 }]}>20 messages a day, three at the table, one DM. Pro is unlimited, seats all six, opens every room, remembers longer and sends check-ins.</Text>
            <PrimaryButton title="Keep your seat" onPress={() => navigation.navigate('Paywall')} style={{ marginTop: 14, height: 46 }} />
          </>
        )}
      </Card>

      <SectionCaption>YOU</SectionCaption>
      <Group>
        <Row
          label="Name"
          value={state.name}
          onPress={() => {
            setName(state.name);
            setPronouns(state.pronouns);
            setNameOpen(true);
          }}
        />
        <Row label="Pronouns" value={state.pronouns || 'not set'} onPress={() => { setName(state.name); setPronouns(state.pronouns); setNameOpen(true); }} />
        <Row label="Who’s at the table" value={`${(isPro ? state.table : state.table.slice(0, FREE_TABLE)).length} of 6`} onPress={() => setTableOpen(true)} last />
      </Group>

      <SectionCaption>WAITING</SectionCaption>
      <Group>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <View style={{ flex: 1 }}>
            <Text style={[type.body, { fontWeight: '600' }]}>I’m waiting on someone</Text>
            <Text style={type.caption}>The table talks to you as the one outside the door. Both conversations are kept; nothing is erased either way.</Text>
          </View>
          <Switch value={state.waiting} onValueChange={onWaitingSwitch} trackColor={{ true: colors.accent, false: colors.lineStrong }} thumbColor="#fff" {...switchProps} />
        </View>
        <Row label="Waiting on" value={state.waitingFor || 'not set'} onPress={openWaiting} last />
      </Group>

      <SectionCaption>CHECK-INS</SectionCaption>
      <Group>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 15, gap: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[type.body, { fontWeight: '600' }]}>Daily check-in</Text>
              {!isPro ? <Tag text="PRO" tone="gold" /> : null}
            </View>
            <Text style={type.caption}>One line from whoever’s up. Scheduled on this phone only.</Text>
          </View>
          <Switch value={isPro && state.checkins.enabled} onValueChange={onCheckins} trackColor={{ true: colors.accent, false: colors.lineStrong }} thumbColor="#fff" {...switchProps} />
        </View>
        <Row label="At" value={formatHour(state.checkins.hour)} onPress={() => (isPro ? setHourOpen(true) : navigation.navigate('Paywall', { reason: 'checkins' }))} last />
      </Group>

      <SectionCaption>SUBSCRIPTION</SectionCaption>
      <Group>
        <Row
          label="Restore purchases"
          onPress={async () => {
            const ok = await restore().catch(() => false);
            if (ok) setPro(true);
            else Alert.alert('Nothing to restore', 'No active subscription was found for this Apple ID.');
          }}
        />
        <Row label="Manage subscription" onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')} last />
      </Group>

      <SectionCaption>ABOUT</SectionCaption>
      <Group>
        <Row label="About the crew" onPress={() => setAboutOpen(true)} />
        <Row label="Privacy policy" onPress={() => Linking.openURL(`${SITE}/privacy.html`)} />
        <Row label="Terms of use" onPress={() => Linking.openURL(`${SITE}/terms.html`)} />
        <Row label="Support" value={SUPPORT_EMAIL} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Kotatsu%20support`)} last />
      </Group>

      <SectionCaption>DATA</SectionCaption>
      <Group>
        <Row label="Delete all data" onPress={onDelete} danger last />
      </Group>

      <Text style={[type.caption, { marginTop: 20, lineHeight: 17 }]}>
        Kotatsu is fiction for company, not care. The crew are written characters voiced by an AI model; they are not people and not therapists. If you are in danger, call
        or text 988 in the US, or find a local line at findahelpline.com. Rated 18+.
      </Text>

      <Modal visible={nameOpen} transparent animationType="fade" onRequestClose={() => setNameOpen(false)}>
        <Pressable style={sheetStyles.backdrop} onPress={() => setNameOpen(false)} />
        <View style={sheetStyles.sheet}>
          <Text style={type.h2}>What the crew calls you</Text>
          <TextInput value={name} onChangeText={setName} maxLength={24} autoCapitalize="words" style={sheetStyles.input} placeholder="Name or nickname" placeholderTextColor={colors.inkFaint} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {PRONOUNS.map(([v, label]) => (
              <Chip key={label} text={label} selected={pronouns === v} onPress={() => setPronouns(v)} />
            ))}
          </View>
          <PrimaryButton
            title="Save"
            onPress={() => {
              if (name.trim()) update({ name: name.trim(), pronouns });
              setNameOpen(false);
            }}
            style={{ marginTop: 14 }}
          />
          <Pressable onPress={() => setNameOpen(false)} style={{ alignItems: 'center', paddingVertical: 14 }}>
            <Text style={type.sub}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={tableOpen} transparent animationType="fade" onRequestClose={() => setTableOpen(false)}>
        <Pressable style={sheetStyles.backdrop} onPress={() => setTableOpen(false)} />
        <View style={sheetStyles.sheet}>
          <Text style={type.h2}>Who’s at the table</Text>
          <Text style={[type.sub, { marginTop: 4 }]}>{isPro ? 'Anyone can sit down.' : `${FREE_TABLE} seats on the free plan.`}</Text>
          <View style={{ marginTop: 10 }}>
            {CREW.map((c, i) => {
              const on = state.table.includes(c.id);
              return (
                <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: i === CREW.length - 1 ? 0 : 1, borderBottomColor: colors.line }}>
                  <CrewTile emoji={c.emoji} color={c.color} size={32} />
                  <Text style={[type.body, { flex: 1, fontWeight: '600' }]}>{c.name}</Text>
                  <Switch
                    value={on}
                    onValueChange={() => {
                      const ok = toggleTable(c.id);
                      if (!ok && !on) {
                        setTableOpen(false);
                        navigation.navigate('Paywall', { reason: 'table' });
                      }
                    }}
                    trackColor={{ true: c.color, false: colors.lineStrong }}
                    thumbColor="#fff"
                  {...switchProps}
                  />
                </View>
              );
            })}
          </View>
          <PrimaryButton title="Done" onPress={() => setTableOpen(false)} style={{ marginTop: 14 }} />
        </View>
      </Modal>

      <Modal visible={waitingOpen} transparent animationType="fade" onRequestClose={() => setWaitingOpen(false)}>
        <Pressable style={sheetStyles.backdrop} onPress={() => setWaitingOpen(false)} />
        <View style={sheetStyles.sheet}>
          <Text style={type.h2}>Who you’re waiting on</Text>
          <Text style={[type.sub, { marginTop: 4 }]}>Your words. Change it whenever it changes.</Text>
          <TextInput
            value={waitingFor}
            onChangeText={setWaitingFor}
            maxLength={40}
            autoCapitalize="none"
            placeholder="my brother, my daughter, my oldest friend…"
            placeholderTextColor={colors.inkFaint}
            style={sheetStyles.input}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {WAITING_FOR_CHIPS.map((c) => (
              <Chip key={c} text={c} selected={waitingFor.trim().toLowerCase() === c} onPress={() => setWaitingFor(c === 'someone else' ? '' : c)} />
            ))}
          </View>
          <PrimaryButton
            title={state.waiting ? 'Save' : 'Turn waiting on'}
            onPress={() => {
              const v = waitingFor.trim();
              if (v) setWaiting(true, v);
              setWaitingOpen(false);
            }}
            disabled={!waitingFor.trim()}
            style={{ marginTop: 16 }}
          />
          <Pressable onPress={() => setWaitingOpen(false)} style={{ alignItems: 'center', paddingVertical: 14 }}>
            <Text style={type.sub}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>

      <Modal visible={hourOpen} transparent animationType="fade" onRequestClose={() => setHourOpen(false)}>
        <Pressable style={sheetStyles.backdrop} onPress={() => setHourOpen(false)} />
        <View style={sheetStyles.sheet}>
          <Text style={type.h2}>Check-in hour</Text>
          <Text style={[type.sub, { marginTop: 4 }]}>One notification a day, from a different flatmate each day.</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
            {HOURS.map((h) => (
              <Chip
                key={h}
                text={formatHour(h)}
                selected={state.checkins.hour === h}
                onPress={() => {
                  setCheckins(state.checkins.enabled, h);
                }}
              />
            ))}
          </View>
          <PrimaryButton title="Done" onPress={() => setHourOpen(false)} style={{ marginTop: 18 }} />
        </View>
      </Modal>

      <Modal visible={aboutOpen} transparent animationType="fade" onRequestClose={() => setAboutOpen(false)}>
        <Pressable style={sheetStyles.backdrop} onPress={() => setAboutOpen(false)} />
        <View style={sheetStyles.sheet}>
          <Text style={type.h2}>About the crew</Text>
          <ScrollView style={{ marginTop: 10, maxHeight: 380 }} showsVerticalScrollIndicator={false}>
            <Text style={[type.bodySoft, { lineHeight: 22 }]}>
              Haruka, Rin, Kaito, Yui, Daichi and Sora are fictional characters written by the studio. Their lines are generated by an AI model working from those
              character sheets, so they can be wrong, repeat themselves, or drift. They are not people, not partners and not therapists, and they will say so if
              you ask sincerely.
              {'\n\n'}
              The group is written to notice absence without guilt, to tease without cruelty, and to stay non-romantic. If a message crosses a line, long-press it
              and choose Report; it goes to the studio.
              {'\n\n'}
              What you type is sent to our server with the crew’s short memory of you so the reply can be generated; it is not used to train models and is not
              linked to an account. Delete all data in Settings clears this phone; the server keeps only a daily message count per device.
              {'\n\n'}
              If you are in danger or thinking about hurting yourself: in the US call or text 988; elsewhere, findahelpline.com. The crew will say this too, once,
              and stay.
            </Text>
          </ScrollView>
          <PrimaryButton title="Close" onPress={() => setAboutOpen(false)} style={{ marginTop: 18 }} />
        </View>
      </Modal>
    </Screen>
  );
}
