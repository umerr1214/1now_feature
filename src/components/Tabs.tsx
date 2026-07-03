export type TabId = 'fleet' | 'bookings';

interface Tab {
  id: TabId;
  label: string;
}

const TABS: Tab[] = [
  { id: 'fleet', label: 'Fleet Overview' },
  { id: 'bookings', label: 'Bookings' },
];

interface TabsProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="bg-brand-primary border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex gap-2 -mb-px" role="tablist">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                  isActive
                    ? 'border-brand-accent text-brand-text-primary'
                    : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary hover:border-brand-border'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
