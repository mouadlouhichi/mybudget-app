'use client'
// Category → Phosphor icon mapping. One icon family for the whole project.
import {
  ShoppingCart, GasPump, ForkKnife, Confetti,
  Sparkle, UsersThree, Crown, UserCircle,
  Bag, Package, Lightning, House,
  WifiHigh, Phone, Robot,
  Car, Airplane, Bus, Train, Bicycle,
  Book, Books, GraduationCap, Briefcase, Wrench,
  Coffee, Pizza, Wine, Cookie,
  Heart, Heartbeat, FirstAidKit, Pill,
  Gift, Star, MusicNotes, GameController, FilmSlate,
  Baby, PawPrint, Flower, Tree,
  Camera, Palette, PaintBrush, Barbell,
  Umbrella, SunHorizon,
  Bank as BankIcon, CreditCard, Coins, PiggyBank,
  Hammer, Toolbox,
  Basket, TShirt,
} from '@phosphor-icons/react/dist/ssr'
import type { Icon } from '@phosphor-icons/react'

export const CAT_ICON: Record<string, Icon> = {
  Alimentation: ShoppingCart,
  Gazoil: GasPump,
  Restaurant: ForkKnife,
  Sortie: Confetti,
  Beauté: Sparkle,
  Famille: UsersThree,
  Queen: Crown,
  King: UserCircle,
  Shopping: Bag,
  Autre: Package,
  Facture: Lightning,
  Location: House,
  Internet: WifiHigh,
  Téléphone: Phone,
  AI: Robot,
}

// Used for any custom category the user creates via "Manage categories"
// that doesn't have an icon of its own.
export const CAT_ICON_FALLBACK: Icon = Package

// Curated icon choices offered when creating a custom category. Keys are
// stored on MonthBudget.categoryIcons and resolved back to a component via
// ICON_BY_KEY - never store the component itself, only its key.
export const CUSTOM_ICON_CHOICES: { key: string; label: string; Icon: Icon }[] = [
  { key: 'shopping-cart', label: 'Groceries',   Icon: ShoppingCart },
  { key: 'bag',           label: 'Shopping',    Icon: Bag },
  { key: 'basket',        label: 'Basket',      Icon: Basket },
  { key: 'fork-knife',    label: 'Food',        Icon: ForkKnife },
  { key: 'coffee',        label: 'Coffee',      Icon: Coffee },
  { key: 'pizza',         label: 'Fast food',   Icon: Pizza },
  { key: 'wine',          label: 'Drinks',      Icon: Wine },
  { key: 'cookie',        label: 'Snacks',      Icon: Cookie },
  { key: 'gas-pump',      label: 'Fuel',        Icon: GasPump },
  { key: 'car',           label: 'Car',         Icon: Car },
  { key: 'bus',           label: 'Bus',         Icon: Bus },
  { key: 'train',         label: 'Train',       Icon: Train },
  { key: 'bicycle',       label: 'Bike',        Icon: Bicycle },
  { key: 'airplane',      label: 'Travel',      Icon: Airplane },
  { key: 'umbrella',      label: 'Vacation',    Icon: Umbrella },
  { key: 'sun',           label: 'Outdoors',    Icon: SunHorizon },
  { key: 'house',         label: 'Housing',     Icon: House },
  { key: 'lightning',     label: 'Utilities',   Icon: Lightning },
  { key: 'wifi',          label: 'Internet',    Icon: WifiHigh },
  { key: 'phone',         label: 'Phone',       Icon: Phone },
  { key: 'wrench',        label: 'Repairs',     Icon: Wrench },
  { key: 'hammer',        label: 'Maintenance', Icon: Hammer },
  { key: 'toolbox',       label: 'Tools',       Icon: Toolbox },
  { key: 'briefcase',     label: 'Work',        Icon: Briefcase },
  { key: 'graduation-cap', label: 'Education',  Icon: GraduationCap },
  { key: 'book',          label: 'Books',       Icon: Book },
  { key: 'books',         label: 'Study',       Icon: Books },
  { key: 'heart',         label: 'Love',        Icon: Heart },
  { key: 'heartbeat',     label: 'Health',      Icon: Heartbeat },
  { key: 'first-aid',     label: 'Medical',     Icon: FirstAidKit },
  { key: 'pill',          label: 'Pharmacy',    Icon: Pill },
  { key: 'baby',          label: 'Baby',        Icon: Baby },
  { key: 'paw-print',     label: 'Pet',         Icon: PawPrint },
  { key: 'flower',        label: 'Garden',      Icon: Flower },
  { key: 'tree',          label: 'Nature',      Icon: Tree },
  { key: 'tshirt',        label: 'Clothing',    Icon: TShirt },
  { key: 'sparkle',       label: 'Beauty',      Icon: Sparkle },
  { key: 'confetti',      label: 'Party',       Icon: Confetti },
  { key: 'gift',          label: 'Gifts',       Icon: Gift },
  { key: 'star',          label: 'Favorites',   Icon: Star },
  { key: 'music',         label: 'Music',       Icon: MusicNotes },
  { key: 'game',          label: 'Gaming',      Icon: GameController },
  { key: 'film',          label: 'Movies',      Icon: FilmSlate },
  { key: 'camera',        label: 'Photography', Icon: Camera },
  { key: 'palette',       label: 'Art',         Icon: Palette },
  { key: 'paint-brush',   label: 'Hobbies',     Icon: PaintBrush },
  { key: 'barbell',       label: 'Fitness',     Icon: Barbell },
  { key: 'users',         label: 'Family',      Icon: UsersThree },
  { key: 'crown',         label: 'Personal',    Icon: Crown },
  { key: 'bank',          label: 'Bank',        Icon: BankIcon },
  { key: 'card',          label: 'Card',        Icon: CreditCard },
  { key: 'coins',         label: 'Money',       Icon: Coins },
  { key: 'piggy-bank',    label: 'Savings',     Icon: PiggyBank },
  { key: 'robot',         label: 'Subscriptions', Icon: Robot },
  { key: 'package',       label: 'Other',       Icon: Package },
]

export const ICON_BY_KEY: Record<string, Icon> = Object.fromEntries(
  CUSTOM_ICON_CHOICES.map(c => [c.key, c.Icon])
)
