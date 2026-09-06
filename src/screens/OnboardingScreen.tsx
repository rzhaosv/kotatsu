import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, type } from '../theme';
import { PrimaryButton, GhostButton, Chip, ProgressDots, CrewTile, Tag } from '../components/UI';
import { useApp } from '../store/AppContext';
import { CREW, tagline } from '../content/crew';
import { CrewId, Pronouns, Since, SINCE_LABELS, FREE_TABLE, ALL_CREW } from '../logic/types';

const STEPS = 3;
const PRONOUNS: [Pronouns, string][] = [
  ['she/her', 'she/her'],
  ['he/him', 'he/him'],
  ['they/them', 'they/them'],
  ['', 'skip'],
];

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const { completeOnboarding, isPro } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [pronouns, setPronouns] = useState<Pronouns | null>(null);
  const [since, setSince] = useState<Since | null>(null);
  const [table, setTable] = useState<CrewId[]>(isPro ? ALL_CREW : []);
  const [nudge, setNudge] = useState(false);

  const toggle = (id: CrewId) => {
    setNudge(false);
    if (table.includes(id)) return setTable(table.filter((x) => x !== id));
    if (!isPro && table.length >= FREE_TABLE) return setNudge(true);
    setTable([...table, id]);
  };

  const canContinue = step === 0 ? name.trim().length > 0 : step === 1 ? since !== null : table.length > 0;

  const finish = () => {
    completeOnboarding({ name, pronouns: pronouns ?? '', since: since ?? 'skip', table });
    onDone();
  };
  const next = () => (step < STEPS - 1 ? setStep(step + 1) : finish());
  const back = () => step > 0 && setStep(step - 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.top}>
        <ProgressDots count={STEPS} index={step} />
      </View>
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {step === 0 && (
          <>
            <Text style={type.label}>Kotatsu</Text>
            <Text style={styles.q}>What should the crew call you?</Text>
            <Text style={[type.bodySoft, { marginTop: 6 }]}>Six flatmates, one low heated table, a seat that stayed yours. Fictional, written by the studio, voiced by an AI.</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              autoFocus
              autoCapitalize="words"
              maxLength={24}
              placeholder="Your name or a nickname"
              placeholderTextColor={colors.inkFaint}
              style={styles.input}
              returnKeyType="done"
            />
            <Text style={[type.caption, { marginTop: 22, marginBottom: 10 }]}>PRONOUNS (OPTIONAL)</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {PRONOUNS.map(([v, label]) => (
                <Chip key={label} text={label} selected={pronouns === v} onPress={() => setPronouns(v)} />
              ))}
            </View>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={type.label}>Since</Text>
            <Text style={styles.q}>How long has it been?</Text>
            <Text style={[type.bodySoft, { marginTop: 6 }]}>Only for the first hello. Nobody keeps count after that. No streaks, ever.</Text>
            <View style={{ gap: 10, marginTop: 22 }}>
              {SINCE_LABELS.map(([v, label]) => (
                <Pressable key={v} onPress={() => setSince(v)} style={({ pressed }) => [styles.option, since === v && styles.optionActive, pressed && { opacity: 0.85 }]}>
                  <Text style={[type.h3, since === v && { color: colors.accentDeep }]}>{label}</Text>
                  <View style={[styles.radio, since === v && styles.radioActive]}>{since === v && <View style={styles.radioDot} />}</View>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={type.label}>The table</Text>
            <Text style={styles.q}>Who’s at the table tonight?</Text>
            <Text style={[type.bodySoft, { marginTop: 6 }]}>
              {isPro ? 'All six are in. Tap to change who sits down.' : `Pick ${FREE_TABLE} for the free seat. Pro seats all six, and you can change it any time.`}
            </Text>
            <View style={{ gap: 10, marginTop: 20 }}>
              {CREW.map((c) => {
                const on = table.includes(c.id);
                return (
                  <Pressable key={c.id} onPress={() => toggle(c.id)} style={({ pressed }) => [styles.member, on && { borderColor: c.color, backgroundColor: `${c.color}14` }, pressed && { opacity: 0.85 }]}>
                    <CrewTile emoji={c.emoji} color={c.color} size={42} />
                    <View style={{ flex: 1 }}>
                      <Text style={[type.h3, on && { color: c.color }]}>{c.name}</Text>
                      <Text style={type.sub} numberOfLines={1}>
                        {tagline(c)}
                      </Text>
                    </View>
                    <View style={[styles.check, on && { backgroundColor: c.color, borderColor: c.color }]}>{on ? <Text style={{ color: '#fff', fontSize: 13, fontWeight: '800' }}>✓</Text> : null}</View>
                  </Pressable>
                );
              })}
            </View>
            {nudge ? (
              <View style={{ marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Tag text="PRO" tone="gold" />
                <Text style={[type.sub, { flex: 1 }]}>Three is the free seat. Pro brings everyone to the table. You’ll see it on the next screen.</Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton title={step === STEPS - 1 ? 'Sit down' : 'Continue'} onPress={next} disabled={!canContinue} />
        {step > 0 ? <GhostButton title="Back" onPress={back} /> : <View style={{ height: 48 }} />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  top: { paddingTop: 14, paddingBottom: 6 },
  body: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 },
  q: { ...type.display, fontSize: 31, lineHeight: 37, marginTop: 8 },
  footer: { paddingHorizontal: 24, paddingBottom: 4 },
  input: {
    marginTop: 22,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
  },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.card, borderRadius: radius.lg, padding: 18, borderWidth: 1.5, borderColor: colors.line, justifyContent: 'space-between' },
  optionActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, borderWidth: 1.5, borderColor: colors.line },
  check: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.lineStrong, alignItems: 'center', justifyContent: 'center' },
});
