'use client'
// Category → Phosphor icon mapping. One icon family for the whole project.
import {
  ShoppingCart, GasPump, ForkKnife, Confetti,
  Sparkle, UsersThree, Crown, UserCircle,
  Bag, Package, Lightning, House,
  WifiHigh, Phone, Robot,
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
