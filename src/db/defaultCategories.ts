/**
 * Catégories par défaut : clé i18n, icône Lucide, index de couleur dans la palette.
 * Les 8 premières portent les 8 couleurs de la palette ; les suivantes réutilisent
 * une couleur mais restent distinguables par leur icône et leur libellé.
 */
export interface DefaultCategory {
  id: string;
  nameKey: string;
  icon: string;
  colorIndex: number;
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { id: 'cat_housing', nameKey: 'housing', icon: 'House', colorIndex: 0 },
  { id: 'cat_food', nameKey: 'food', icon: 'ShoppingCart', colorIndex: 1 },
  { id: 'cat_transport', nameKey: 'transport', icon: 'Car', colorIndex: 2 },
  { id: 'cat_leisure', nameKey: 'leisure', icon: 'Ticket', colorIndex: 3 },
  { id: 'cat_health', nameKey: 'health', icon: 'HeartPulse', colorIndex: 4 },
  { id: 'cat_subscriptions', nameKey: 'subscriptions', icon: 'Tv', colorIndex: 5 },
  { id: 'cat_clothing', nameKey: 'clothing', icon: 'Shirt', colorIndex: 6 },
  { id: 'cat_restaurants', nameKey: 'restaurants', icon: 'Utensils', colorIndex: 1 },
  { id: 'cat_children', nameKey: 'children', icon: 'Baby', colorIndex: 4 },
  { id: 'cat_pets', nameKey: 'pets', icon: 'PawPrint', colorIndex: 3 },
  { id: 'cat_gifts', nameKey: 'gifts', icon: 'Gift', colorIndex: 6 },
  { id: 'cat_travel', nameKey: 'travel', icon: 'Plane', colorIndex: 2 },
  { id: 'cat_home', nameKey: 'home', icon: 'Sofa', colorIndex: 0 },
  { id: 'cat_insurance', nameKey: 'insurance', icon: 'Shield', colorIndex: 5 },
  { id: 'cat_taxes', nameKey: 'taxes', icon: 'Landmark', colorIndex: 0 },
  { id: 'cat_other', nameKey: 'other', icon: 'CircleEllipsis', colorIndex: 7 },
];

export const OTHER_CATEGORY_ID = 'cat_other';

/** Icônes proposées pour une catégorie personnalisée. */
export const CATEGORY_ICON_CHOICES = [
  'House',
  'ShoppingCart',
  'Car',
  'Ticket',
  'HeartPulse',
  'Tv',
  'Shirt',
  'Utensils',
  'Baby',
  'PawPrint',
  'Gift',
  'Plane',
  'Sofa',
  'Shield',
  'Landmark',
  'CircleEllipsis',
  'Coffee',
  'Bus',
  'Fuel',
  'Headphones',
  'Dumbbell',
  'GraduationCap',
  'Smartphone',
  'Wifi',
  'Zap',
  'Droplets',
  'Pill',
  'Scissors',
  'Wrench',
  'PiggyBank',
  'Banknote',
  'Gamepad2',
  'Film',
  'BookOpen',
  'Bike',
  'Wine',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_CHOICES)[number];
