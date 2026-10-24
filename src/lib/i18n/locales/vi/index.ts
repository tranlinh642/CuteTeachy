import { auth } from './auth';
import { calendar } from './calendar';
import { common } from './common';
import { home } from './home';
import { navigation } from './navigation';
import { notes } from './notes';
import { onboarding } from './onboarding';
import { pickers } from './pickers';
import { profile } from './profile';
import { pwa } from './pwa';
import { tags } from './tags';
import { tasks } from './tasks';
import { errors, validation } from './validation';
import { weekly } from './weekly';

/**
 * Vietnamese – the SOURCE OF TRUTH for translation keys.
 * Every other locale is type-checked against this shape.
 */
export const vi = {
  common,
  navigation,
  auth,
  onboarding,
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
  pwa,
};
