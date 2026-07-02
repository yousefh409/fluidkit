import { LiquidTabs as Bar } from "./LiquidTabs";
import { TabsGroup } from "./TabsGroup";
import { TabPanel } from "./TabPanel";

/**
 * Public LiquidTabs API: the bar, with `.Group` (shared state for panels) and
 * `.Panel` (content bound to a tab id) attached as static members.
 */
export const LiquidTabs = Object.assign(Bar, {
  Group: TabsGroup,
  Panel: TabPanel,
});

export type {
  LiquidTabsProps,
  LiquidTabsItem,
  LiquidTabsMaterial,
  LiquidTabsSize,
} from "./LiquidTabs";
export type { TabsGroupProps } from "./TabsGroup";
export type { TabPanelProps } from "./TabPanel";
export type { FlowName } from "./flows";
