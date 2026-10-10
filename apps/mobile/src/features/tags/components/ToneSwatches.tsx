import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from '@cute-teachy/i18n';
import { Icon } from '@/components/ui';
import { colors, layout, radius, spacing, toneNames, tones, type Tone } from '@/theme';

export interface ToneSwatchesProps {
  readonly value: Tone;
  readonly onChange: (tone: Tone) => void;
}

/** Hàng ô màu pastel (design "Create New Tag"). */
export function ToneSwatches({ value, onChange }: ToneSwatchesProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {toneNames.map((tone) => {
        const selected = tone === value;
        return (
          <Pressable
            key={tone}
            onPress={() => onChange(tone)}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={t('tags.selectTone', { tone: t(`tags.tones.${tone}`) })}
            style={styles.target}
          >
            <View
              style={[
                styles.swatch,
                { backgroundColor: tones[tone].bg },
                selected && { borderColor: tones[tone].accent },
              ]}
            >
              {selected ? <Icon name="check" size={18} color={tones[tone].fg} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const SWATCH = 40;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  target: {
    width: layout.minTouchTarget + 4,
    height: layout.minTouchTarget + 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: SWATCH,
    height: SWATCH,
    borderRadius: radius.full,
    borderWidth: 2.5,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
