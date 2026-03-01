export const APP_NAME = 'CoachOS';

export const NOTE_TYPES = [
  { value: 'diet', label: 'Diet Plan' },
  { value: 'practice', label: 'Practice Plan' },
  { value: 'improvement', label: 'Improvement Area' },
  { value: 'general', label: 'General Note' }
];

export const DEFAULT_AGE_GROUPS = [
  { name: 'U10', min_age: 5, max_age: 10, gender: 'All' },
  { name: 'U14', min_age: 11, max_age: 14, gender: 'All' },
  { name: 'U16', min_age: 15, max_age: 16, gender: 'All' },
  { name: 'U19', min_age: 17, max_age: 19, gender: 'All' },
  { name: 'Seniors', min_age: 20, max_age: 99, gender: 'All' }
];

export const INVITE_DEFAULTS = {
  EXPIRY_HOURS: 48,
  MAX_USES: {
    temp_coach: 1,
    coach: 1,
    branch_admin: 1,
  } as Record<string, number>,
};
