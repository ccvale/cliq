import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Camera, ImagePlus, LocateFixed, Trash2 } from 'lucide-react-native';
import { Avatar } from '@/components/Avatar';
import { pickPhoto } from '@/lib/photo';
import { Button } from '@/components/Button';
import { Field } from '@/components/Field';
import { FeaturedPicker } from '@/components/FeaturedPicker';
import { InterestPicker } from '@/components/InterestPicker';
import { PromptEditor } from '@/components/PromptEditor';
import { PalettePicker } from '@/components/PalettePicker';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Section } from '@/components/Section';
import { Txt } from '@/components/Txt';
import { api } from '@/lib/api';
import { MAX_INTERESTS } from '@/lib/catalog';
import { locateMe, type Place } from '@/lib/location';
import type { Featured, Palette, Prompt, ProfilePatch } from '@/lib/types';
import { useSession } from '@/state/session';
import { useTheme } from '@/theme/ThemeProvider';

export default function EditProfile() {
  const { me, setProfile } = useSession();
  const { colors } = useTheme();
  const p = me!.profile;
  const [displayName, setDisplayName] = useState(p.displayName);
  const [bio, setBio] = useState(p.bio);
  const [gigTitle, setGigTitle] = useState(p.gigTitle);
  const [gigPlace, setGigPlace] = useState(p.gigPlace);
  const [interests, setInterests] = useState(p.interests);
  const [palette, setPalette] = useState<Palette>(p.palette);
  const [city, setCity] = useState(p.city);
  const [prompts, setPrompts] = useState<Prompt[]>(p.prompts);
  const [featured, setFeatured] = useState<Featured | null>(p.featured);
  const [place, setPlace] = useState<Place | null>(null);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  // Photos save immediately, separately from the form, so the card updates while you edit.
  const changePhoto = async (source: 'library' | 'camera' | 'remove') => {
    setPhotoBusy(true);
    setError(null);
    try {
      if (source === 'remove') {
        await api.deletePhoto();
        setProfile({ ...me!.profile, photoUrl: null });
      } else {
        const blob = await pickPhoto(source);
        if (blob) {
          const { photoUrl } = await api.uploadPhoto(blob);
          setProfile({ ...me!.profile, photoUrl });
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      // Prompts left without an answer are dropped rather than blocking the save.
      const answered = prompts.map((x) => ({ ...x, answer: x.answer.trim() })).filter((x) => x.answer);
      const patch: ProfilePatch = { displayName, bio, gigTitle, gigPlace, interests, palette, prompts: answered, featured };
      if (place) patch.location = { ...place, city };
      setProfile(await api.updateProfile(patch));
      router.back();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const relocate = async () => {
    setLocating(true);
    setError(null);
    try {
      const found = await locateMe();
      setPlace(found);
      if (found.city) setCity(found.city);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLocating(false);
    }
  };

  return (
    <Screen scroll keyboard edges={['top', 'bottom']}>
      <ScreenHeader
        title="Edit profile"
        close
        right={
          <Pressable onPress={save} disabled={busy || !displayName.trim() || !interests.length} hitSlop={12}>
            <Txt variant="heading" tone="accent">
              {busy ? 'Saving' : 'Save'}
            </Txt>
          </Pressable>
        }
      />

      <Section title="Photo" footer="Optional. Your palette still frames your card, and you can remove the photo any time.">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Avatar name={displayName} palette={palette} photo={me!.profile.photoUrl} size={76} />
          <View style={{ flex: 1, gap: 8 }}>
            <Button
              label={me!.profile.photoUrl ? 'Choose a different photo' : 'Add a photo'}
              variant="secondary"
              size="md"
              loading={photoBusy}
              icon={<ImagePlus size={16} color={colors.ink} />}
              onPress={() => changePhoto('library')}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {Platform.OS !== 'web' ? (
                <Button
                  label="Camera"
                  variant="ghost"
                  size="md"
                  icon={<Camera size={16} color={colors.inkSoft} />}
                  onPress={() => changePhoto('camera')}
                  disabled={photoBusy}
                  style={{ flex: 1 }}
                />
              ) : null}
              {me!.profile.photoUrl ? (
                <Button
                  label="Remove"
                  variant="ghost"
                  size="md"
                  icon={<Trash2 size={16} color={colors.inkSoft} />}
                  onPress={() => changePhoto('remove')}
                  disabled={photoBusy}
                  style={{ flex: 1 }}
                />
              ) : null}
            </View>
          </View>
        </View>
      </Section>

      <Section title="Basics">
        <Field label="Name" value={displayName} onChangeText={setDisplayName} maxLength={40} />
        <Field label="Bio" value={bio} onChangeText={setBio} multiline counter={300} maxLength={300} placeholder="What kind of friends are you hoping to find?" />
      </Section>

      <Section title={`Prompts · ${prompts.length}/3`} footer="Short answers people see when they open your profile.">
        <PromptEditor value={prompts} onChange={setPrompts} />
      </Section>

      <Section title="Song, show or movie" footer="Feature one thing you love. Songs come with a 30 second preview.">
        <FeaturedPicker value={featured} onChange={setFeatured} palette={palette} />
      </Section>

      <Section title="Current gig">
        <Field label="Title" value={gigTitle} onChangeText={setGigTitle} maxLength={60} placeholder="Student, barista, designer…" />
        <Field label="Where" value={gigPlace} onChangeText={setGigPlace} maxLength={60} placeholder="Ramapo College" />
      </Section>

      <Section title={`Interests · ${interests.length}/${MAX_INTERESTS}`}>
        <InterestPicker value={interests} onChange={setInterests} />
      </Section>

      <Section title="Palette" footer="Your two colors theme your card and tint the whole app for you.">
        <PalettePicker value={palette} onChange={setPalette} />
      </Section>

      <Section title="Location" footer={me!.settings.liveLocation ? "Follows you when you open Cliq (you can turn that off in Settings). Stored to the nearest kilometre; others only see miles." : "Stored to the nearest kilometre. Others only ever see a distance in miles."}>
        <Field label="Shown as" value={city} onChangeText={setCity} maxLength={80} />
        <Button
          label={place ? 'Updated to where you are' : 'Update to my current location'}
          variant="secondary"
          size="md"
          loading={locating}
          icon={<LocateFixed size={16} color={colors.ink} />}
          onPress={relocate}
        />
      </Section>

      {error ? (
        <Txt variant="label" tone="danger" style={{ marginTop: 16 }}>
          {error}
        </Txt>
      ) : null}
      <View style={{ paddingVertical: 32 }}>
        <Button label="Save changes" variant="accent" onPress={save} loading={busy} disabled={!displayName.trim() || !interests.length} />
      </View>
    </Screen>
  );
}
