/** Layout chrome props passed from the DashboardLayout to each module card. */
export interface ModuleCardProps {
  id: string;
  collapsed: boolean;
  pinned: boolean;
  onToggleCollapse: () => void;
  onTogglePin: () => void;
  onHide: () => void;
}
