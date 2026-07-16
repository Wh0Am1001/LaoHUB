export const APP_NAME = 'LaoHUB';

export const STORAGE_BUCKETS = {
  avatars: 'avatars',
  covers: 'covers',
  posts: 'posts',
} as const;

export const PROVINCES = [
  'Vientiane Capital',
  'Vientiane Province',
  'Luang Prabang',
  'Champasak',
  'Savannakhet',
  'Khammouane',
  'Bolikhamxay',
  'Xayaboury',
  'Xieng Khouang',
  'Houaphanh',
  'Oudomxay',
  'Bokeo',
  'Luang Namtha',
  'Phongsaly',
  'Salavan',
  'Sekong',
  'Attapeu',
  'Xaisomboun',
];

export const GENDERS: { value: string; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export const RELATIONSHIP_STATUSES: { value: string; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'in_relationship', label: 'In a relationship' },
  { value: 'married', label: 'Married' },
  { value: 'complicated', label: "It's complicated" },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

export const PAGE_SIZE = 12;
export const FEED_PAGE_SIZE = 8;
