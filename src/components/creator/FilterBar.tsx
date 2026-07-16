import { SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import type { HomeFilters, SortOption } from '../../types';
import { PROVINCES, GENDERS } from '../../constants';
import { Modal } from '../ui/Modal';
import { Select, Input } from '../ui/FormField';
import { cn } from '../../utils';

interface FilterBarProps {
  filters: HomeFilters;
  onChange: (filters: HomeFilters) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Popular' },
  { value: 'online', label: 'Online' },
];

export function FilterBar({ filters, onChange }: FilterBarProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<HomeFilters>(filters);

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  function reset() {
    const cleared: HomeFilters = {
      ...filters,
      province: '',
      gender: '',
      minAge: null,
      maxAge: null,
      minHeight: null,
      maxHeight: null,
      minWeight: null,
      maxWeight: null,
    };
    setDraft(cleared);
    onChange(cleared);
    setOpen(false);
  }

  const activeCount = [
    filters.province,
    filters.gender,
    filters.minAge,
    filters.maxAge,
    filters.minHeight,
    filters.maxHeight,
    filters.minWeight,
    filters.maxWeight,
  ].filter((v) => v !== '' && v !== null).length;

  return (
    <>
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
        <button
          onClick={() => {
            setDraft(filters);
            setOpen(true);
          }}
          className="btn-secondary flex items-center gap-2 !px-4 !py-2 text-sm shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary-500 text-white text-xs flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange({ ...filters, sort: opt.value })}
            className={cn(
              'px-4 py-2 rounded-xl text-sm font-medium shrink-0 transition-colors',
              filters.sort === opt.value
                ? 'bg-gradient-brand text-white'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Filter creators" maxWidth="max-w-lg">
        <div className="space-y-4">
          <Select
            label="Province"
            placeholder="Any province"
            options={PROVINCES.map((p) => ({ value: p, label: p }))}
            value={draft.province}
            onChange={(e) => setDraft({ ...draft, province: e.target.value })}
          />
          <Select
            label="Gender"
            placeholder="Any gender"
            options={GENDERS}
            value={draft.gender}
            onChange={(e) => setDraft({ ...draft, gender: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min age"
              type="number"
              value={draft.minAge ?? ''}
              onChange={(e) => setDraft({ ...draft, minAge: e.target.value ? Number(e.target.value) : null })}
            />
            <Input
              label="Max age"
              type="number"
              value={draft.maxAge ?? ''}
              onChange={(e) => setDraft({ ...draft, maxAge: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min height (cm)"
              type="number"
              value={draft.minHeight ?? ''}
              onChange={(e) => setDraft({ ...draft, minHeight: e.target.value ? Number(e.target.value) : null })}
            />
            <Input
              label="Max height (cm)"
              type="number"
              value={draft.maxHeight ?? ''}
              onChange={(e) => setDraft({ ...draft, maxHeight: e.target.value ? Number(e.target.value) : null })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Min weight (kg)"
              type="number"
              value={draft.minWeight ?? ''}
              onChange={(e) => setDraft({ ...draft, minWeight: e.target.value ? Number(e.target.value) : null })}
            />
            <Input
              label="Max weight (kg)"
              type="number"
              value={draft.maxWeight ?? ''}
              onChange={(e) => setDraft({ ...draft, maxWeight: e.target.value ? Number(e.target.value) : null })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={reset} className="btn-secondary flex-1 flex items-center justify-center gap-1.5">
              <X className="w-4 h-4" /> Clear
            </button>
            <button onClick={apply} className="btn-primary flex-1">
              Apply filters
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
