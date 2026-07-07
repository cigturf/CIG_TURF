/**
 * CIG Design System — premium reusable UI foundation
 *
 * shadcn/ui primitives live in @/components/ui (low-level only).
 * All application components should import from here.
 */

// Typography
export { Caption, Display, Heading, Overline, Text } from "@/components/design-system/typography";

// Layout & surfaces
export {
  Card,
  CardBody,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  cardVariants,
} from "@/components/design-system/card";

// Forms
export {
  FormCheckbox,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/components/design-system/form";

// Feedback
export { EmptyState, ErrorState } from "@/components/design-system/feedback";
export {
  Skeleton,
  SkeletonBookingSlot,
  SkeletonCard,
  SkeletonStatsGrid,
  SkeletonTable,
  SkeletonText,
} from "@/components/design-system/skeletons";

// Motion
export {
  FadeIn,
  FadeUp,
  Parallax,
  Reveal,
  ScaleIn,
  SlideIn,
  Stagger,
  StaggerItem,
} from "@/components/design-system/motion";

// Navigation
export {
  DesktopNav,
  DesktopNavActions,
  DesktopNavBrand,
  DesktopNavGroup,
  DesktopNavItem,
} from "@/components/design-system/navigation-desktop";
export {
  MobileNav,
  MobileNavItem,
  MobileNavSpacer,
  MobileTabBar,
  MobileTabBarSpacer,
} from "@/components/design-system/navigation-mobile";

// Overlays
export { BottomSheet, BottomSheetClose } from "@/components/design-system/bottom-sheet";
export { DrawerClose, DrawerPanel, DrawerRoot } from "@/components/design-system/drawer";
export {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Modal,
} from "@/components/design-system/modal";

// Booking
export {
  BookingSummary,
  DateCard,
  PriceSummary,
  StatusBadge,
  TimeSlotCard,
} from "@/components/design-system/booking";

// Dashboard
export {
  AnalyticsCard,
  FilterBar,
  FilterBarGroup,
  RevenueCard,
  StatsCard,
  TableCell,
  TableHeader,
  TableRow,
  TableShell,
} from "@/components/design-system/dashboard";

// Primitives (re-export for convenience)
export { Button, buttonVariants, type ButtonProps } from "@/components/ui/button";
export { Badge, badgeVariants } from "@/components/ui/badge";
export { Input } from "@/components/ui/input";
export { Label } from "@/components/ui/label";
export { Separator } from "@/components/ui/separator";
export { Textarea } from "@/components/ui/textarea";

// Design tokens
export * from "@/lib/design-system";
