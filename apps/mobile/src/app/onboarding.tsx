import { useMemo, useRef, useState } from 'react';
import { Pressable, TextInput, View, useWindowDimensions, type TextInputInstance } from 'react-native';
import Animated, { FadeInRight, FadeOutLeft, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ArrowLeft, LocateFixed, MapPin } from 'lucide-react-native';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { InterestPicker } from '@/components/InterestPicker';
import { PalettePicker } from '@/components/PalettePicker';
import { ProfileCard } from '@/components/ProfileCard';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/Txt';
import { api } from '@/lib/api';
import { locateMe, type Place } from '@/lib/location';
import { registerForPush } from '@/lib/push';
import type { Palette, ProfilePatch } from '@/lib/types';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';
import { font, radius } from '@/theme/tokens';

type Step = 'name' | 'birthday' | 'gig' | 'interests' | 'palette' | 'bio' | 'location';
const STEPS: Step[] = ['name', 'birthday', 'gig', 'interests', 'palette', 'bio', 'location'];

function ageFrom(y: string, m: string, d: string) {
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  if (y.length !== 4 || date.getUTCMonth() !== Number(m) - 1) return null;
  const now = new Date();
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  if (now.getUTCMonth() < date.getUTCMonth() || (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate())) age--;
  return age;
}

export default function Onboarding() {
  const { me, setProfile, reload } = useSession();
  const { colors, accent } = useTheme();
  const { width } = useWindowDimensions();
  const p = me!.profile;

  const [step, setStep] = useState<Step>(p.displayName ? (p.birthday ? 'gig' : 'birthday') : 'name');
  const [name, setName] = useState(p.displayName);
  const [birth, setBirth] = useState(() => {
    const [y = '', m = '', d = ''] = (p.birthday ?? '').split('-');
    return { m, d, y };
  });
  const [gigTitle, setGigTitle] = useState(p.gigTitle);
  const [gigPlace, setGigPlace] = useState(p.gigPlace);
  const [interests, setInterests] = useState<string[]>(p.interests);
  const [palette, setPalette] = useState<Palette>(p.palette);
  const [bio, setBio] = useState(p.bio);
  const [place, setPlace] = useState<Place | null>(null);
  const [city, setCity] = useState(p.city);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dayRef = useRef<TextInputInstance>(null);
  const yearRef = useRef<TextInputInstance>(null);

  const index = STEPS.indexOf(step);
  const age = ageFrom(birth.y, birth.m, birth.d);
  const progress = useAnimatedStyle(() => ({ width: withSpring(`${((index + 1) / STEPS.length) * 100}%`, { damping: 20 }) }));

  const preview = useMemo(
    () => ({
      id: 'me',
      displayName: name || 'You',
      age: age ?? 21,
      bio: bio || 'Your bio will go here.',
      gigTitle,
      gigPlace,
      interests,
      sharedInterests: [],
      palette,
      city: city || 'Your city',
      distance: 'Nearby',
      photoUrl: null,
      prompts: [],
      featured: null,
      badges: [],
    }),
    [name, age, bio, gigTitle, gigPlace, interests, palette, city],
  );

  const canContinue = {
    name: name.trim().length > 0,
    birthday: age !== null && age >= 13 && age <= 120,
    gig: true,
    interests: interests.length > 0,
    palette: true,
    bio: true,
    location: !!place && city.trim().length > 0,
  }[step];

  const patchFor = (s: Step): ProfilePatch => {
    switch (s) {
      case 'name': return { displayName: name.trim() };
      case 'birthday': return { birthday: `${birth.y}-${birth.m.padStart(2, '0')}-${birth.d.padStart(2, '0')}` };
      case 'gig': return { gigTitle, gigPlace };
      case 'interests': return { interests };
      case 'palette': return { palette };
      case 'bio': return { bio };
      case 'location': return { location: { lat: place!.lat, lng: place!.lng, city: city.trim() } };
    }
  };

  const next = async () => {
    setError(null);
    setBusy(true);
    try {
      // Every step saves as you go, so leaving halfway never loses progress.
      const saved = await api.updateProfile(patchFor(step));
      if (step === 'location') {
        await reload();
        void registerForPush({ prompt: true });
        return;
      }
      setProfile(saved);
      setStep(STEPS[index + 1]!);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const findMe = async () => {
    setError(null);
    setBusy(true);
    try {
      const found = await locateMe();
      setPlace(found);
      if (found.city) setCity(found.city);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const heading: Record<Step, [string, string]> = {
    name: ['What should friends call you?', 'Your first name or a nickname works best.'],
    birthday: ['When’s your birthday?', 'We only show your age. Under 18s and adults never see each other.'],
    gig: ['What fills your days?', 'Work, school, or something else entirely. Optional.'],
    interests: ['What are you into?', `Pick up to 5. We’ll lead with people who share them.`],
    palette: ['Choose your colors', 'On Cliq, your palette is your look. It themes your card and your whole app.'],
    bio: ['Say a little more', 'A line or two about the kind of friends you’re hoping to find.'],
    location: ['Where are you?', 'We only store your location to the nearest kilometre and never show it exactly.'],
  };

  return (
    <Screen scroll keyboard edges={['top', 'bottom']} maxWidth={520}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16 }}>
        <Pressable
          onPress={() => index > 0 && setStep(STEPS[index - 1]!)}
          hitSlop={12}
          style={{ opacity: index > 0 ? 1 : 0 }}
          accessibilityLabel="Back"
        >
          <ArrowLeft size={24} color={colors.ink} />
        </Pressable>
        <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.bgSunken, overflow: 'hidden' }}>
          <Animated.View style={[{ height: 4, borderRadius: 2, backgroundColor: accent.solid }, progress]} />
        </View>
        <Txt variant="caption" tone="muted">
          {index + 1}/{STEPS.length}
        </Txt>
      </View>

      <Animated.View key={step} entering={FadeInRight.duration(350)} exiting={FadeOutLeft.duration(200)} style={{ flex: 1, gap: 24, paddingTop: 16 }}>
        <View style={{ gap: 8 }}>
          <Txt variant="display">{heading[step][0]}</Txt>
          <Txt tone="muted">{heading[step][1]}</Txt>
        </View>

        {step === 'name' && (
          <Field value={name} onChangeText={setName} placeholder="Chris" autoFocus maxLength={40} returnKeyType="next" onSubmitEditing={() => canContinue && next()} />
        )}

        {step === 'birthday' && (
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {(
                [
                  ['m', 'MM', 2, dayRef],
                  ['d', 'DD', 2, yearRef],
                  ['y', 'YYYY', 4, null],
                ] as const
              ).map(([key, ph, len, nextRef]) => (
                <TextInput
                  key={key}
                  ref={key === 'd' ? dayRef : key === 'y' ? yearRef : undefined}
                  value={birth[key]}
                  placeholder={ph}
                  placeholderTextColor={colors.muted}
                  keyboardType="number-pad"
                  maxLength={len}
                  autoFocus={key === 'm'}
                  onChangeText={(t) => {
                    const v = t.replace(/\D/g, '');
                    setBirth((b) => ({ ...b, [key]: v }));
                    if (v.length === len) nextRef?.current?.focus();
                  }}
                  style={{
                    flex: len === 4 ? 1.6 : 1,
                    height: 72,
                    borderRadius: radius.md,
                    backgroundColor: colors.bgRaised,
                    borderWidth: 1.5,
                    borderColor: colors.line,
                    textAlign: 'center',
                    fontFamily: font.display,
                    fontSize: 28,
                    color: colors.ink,
                    outlineStyle: 'none',
                  } as any}
                />
              ))}
            </View>
            {age !== null && age >= 13 ? (
              <Txt variant="label" tone="accent">
                You’re {age}. {age < 18 ? 'You’ll only meet other 13 to 17 year olds.' : ''}
              </Txt>
            ) : age !== null && birth.y.length === 4 ? (
              <Txt variant="label" tone="danger">
                You need to be at least 13 to use Cliq.
              </Txt>
            ) : null}
          </View>
        )}

        {step === 'gig' && (
          <View style={{ gap: 16 }}>
            <Field label="Title" value={gigTitle} onChangeText={setGigTitle} placeholder="Student, barista, designer…" maxLength={60} />
            <Field label="Where" value={gigPlace} onChangeText={setGigPlace} placeholder="Ramapo College" maxLength={60} />
          </View>
        )}

        {step === 'interests' && <InterestPicker value={interests} onChange={setInterests} />}

        {step === 'palette' && (
          <View style={{ gap: 24, alignItems: 'center' }}>
            <ProfileCard card={preview} compact style={{ width: Math.min(width - 40, 340), height: 400 }} />
            <PalettePicker value={palette} onChange={setPalette} />
          </View>
        )}

        {step === 'bio' && (
          <Field
            value={bio}
            onChangeText={setBio}
            multiline
            counter={300}
            maxLength={300}
            autoFocus
            placeholder="New to town, looking for people to try every taco spot with."
          />
        )}

        {step === 'location' && (
          <View style={{ gap: 16 }}>
            <Button
              label={place ? 'Location found' : 'Use my location'}
              variant={place ? 'secondary' : 'primary'}
              icon={place ? <MapPin size={18} color={colors.ink} /> : <LocateFixed size={18} color={colors.bg} />}
              onPress={findMe}
              loading={busy && !place}
            />
            {place ? (
              <Field label="Shown on your card as" value={city} onChangeText={setCity} placeholder="Mahwah, NJ" maxLength={80} />
            ) : null}
          </View>
        )}

        {error ? (
          <Txt variant="label" tone="danger">
            {error}
          </Txt>
        ) : null}
      </Animated.View>

      <View style={{ paddingVertical: 20, gap: 8 }}>
        <Button
          label={
            step === 'location'
              ? 'Start meeting people'
              : (step === 'gig' && !gigTitle && !gigPlace) || (step === 'bio' && !bio)
                ? 'Skip for now'
                : 'Continue'
          }
          variant="accent"
          onPress={next}
          disabled={!canContinue}
          loading={busy && (step !== 'location' || !!place)}
        />
      </View>
    </Screen>
  );
}
