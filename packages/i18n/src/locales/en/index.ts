import type { TranslationSchema } from '../../translation.types';
import { auth } from './auth';
import { calendar } from './calendar';
import { common } from './common';
import { home } from './home';
import { navigation } from './navigation';
import { notes } from './notes';
import { pickers } from './pickers';
import { profile } from './profile';
import { tags } from './tags';
import { tasks } from './tasks';
import { errors, validation } from './validation';
import { weekly } from './weekly';

export const en: TranslationSchema = {
  common,
  navigation,
  auth,
  home,
  weekly,
  calendar,
  notes,
  tasks,
  tags,
  pickers,
  profile,
  validation,
  errors,
};
