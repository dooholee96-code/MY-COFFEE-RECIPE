import { useCallback, useMemo, useState } from 'react';
import type { Category, Filters, Recipe } from './types';
import { seedRecipes } from './data/recipes';
import { defaultFilters, filterRecipes, hasActiveFilters } from './lib/filter';
import { KEYS } from './lib/storage';
import { usePersistentState } from './hooks/usePersistentState';
import { CATEGORIES } from './lib/labels';
import { Icon } from './components/Icon';
import { FilterBar } from './components/FilterBar';
import { RecipeCard } from './components/RecipeCard';
import { RecipeDetail } from './components/RecipeDetail';
import { RecipeForm } from './components/RecipeForm';
import { SettingsSheet } from './components/SettingsSheet';

type Sheet = { kind: 'detail'; id: string } | { kind: 'form'; id: string | null } | { kind: 'settings' } | null;

export default function App() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sheet, setSheet] = useState<Sheet>(null);

  const [favoriteIds, setFavoriteIds] = usePersistentState<string[]>(KEYS.favorites, []);
  const [customRecipes, setCustomRecipes] = usePersistentState<Recipe[]>(KEYS.customRecipes, []);
  const [myGrinder, setMyGrinder] = usePersistentState<string | null>(KEYS.myGrinder, null);
  const [soundOn, setSoundOn] = usePersistentState<boolean>(KEYS.soundOn, true);

  const favorites = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const allRecipes = useMemo(() => [...seedRecipes, ...customRecipes], [customRecipes]);
  const visible = useMemo(() => filterRecipes(allRecipes, filters, favorites), [allRecipes, filters, favorites]);

  /** 데이터에 실제로 등장하는 그라인더 이름 */
  const grinders = useMemo(() => {
    const names = new Set<string>();
    allRecipes.forEach((r) => r.grinderSettings?.forEach((s) => names.add(s.grinder)));
    return [...names].sort();
  }, [allRecipes]);

  const patch = useCallback((p: Partial<Filters>) => setFilters((prev) => ({ ...prev, ...p })), []);

  const toggleFavorite = useCallback(
    (id: string) => setFavoriteIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    [setFavoriteIds],
  );

  const openCategory = (category: Category) => {
    // 카테고리를 바꿀 때 드리퍼 필터를 들고 가면 엉뚱하게 비어 보인다
    patch({ category, dripper: 'all' });
  };

  const saveRecipe = (recipe: Recipe) => {
    setCustomRecipes((prev) => {
      const at = prev.findIndex((r) => r.id === recipe.id);
      if (at === -1) return [...prev, recipe];
      return prev.map((r) => (r.id === recipe.id ? recipe : r));
    });
    setSheet({ kind: 'detail', id: recipe.id });
  };

  const deleteRecipe = (id: string) => {
    setCustomRecipes((prev) => prev.filter((r) => r.id !== id));
    setFavoriteIds((prev) => prev.filter((x) => x !== id));
    setSheet(null);
  };

  const importRecipes = (incoming: Recipe[]) => {
    setCustomRecipes((prev) => {
      const merged = new Map(prev.map((r) => [r.id, r]));
      incoming.forEach((r) => merged.set(r.id, r));
      return [...merged.values()];
    });
  };

  const detailRecipe = sheet?.kind === 'detail' ? allRecipes.find((r) => r.id === sheet.id) : undefined;
  const editingRecipe = sheet?.kind === 'form' && sheet.id ? allRecipes.find((r) => r.id === sheet.id) : undefined;
  const sibling =
    detailRecipe?.family !== undefined
      ? allRecipes.find((r) => r.family === detailRecipe.family && r.id !== detailRecipe.id)
      : undefined;

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-20 border-b border-stone-800 bg-stone-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="rounded-lg bg-gradient-to-br from-amber-600 to-orange-800 p-2 text-white">
              <Icon name="coffee" size={20} />
            </span>
            <h1 className="truncate text-lg font-bold tracking-tight text-stone-100">MY COFFEE RECIPE</h1>
          </div>
          <button
            type="button"
            onClick={() => setSheet({ kind: 'settings' })}
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs font-semibold text-stone-300 hover:bg-stone-700"
          >
            <Icon name="grinder" size={14} />
            {myGrinder ?? '설정'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 pt-5">
        {/* 카테고리 탭 */}
        <nav aria-label="추출 방식" className="scrollbar-hide -mx-5 mb-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {CATEGORIES.map((cat) => {
            const count = allRecipes.filter((r) => r.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                aria-current={filters.category === cat.id ? 'page' : undefined}
                onClick={() => openCategory(cat.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-bold whitespace-nowrap transition ${
                  filters.category === cat.id
                    ? 'border-transparent bg-amber-700 text-white'
                    : 'border-stone-700 bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-stone-200'
                }`}
              >
                {cat.label}
                <span className={`font-mono text-[11px] ${filters.category === cat.id ? 'text-white/70' : 'text-stone-600'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        <FilterBar filters={filters} onChange={patch} favoriteCount={favorites.size} />

        <div className="mt-7 mb-4 flex items-end justify-between gap-3 border-b border-stone-800 pb-2">
          <h2 className="text-xl font-bold text-stone-100">레시피</h2>
          <p className="mb-0.5 text-sm text-stone-400">
            <span className="font-mono font-bold text-stone-200">{visible.length}</span>개
          </p>
        </div>

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visible.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                favorite={favorites.has(recipe.id)}
                myGrinder={myGrinder}
                onOpen={() => setSheet({ kind: 'detail', id: recipe.id })}
                onToggleFavorite={() => toggleFavorite(recipe.id)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            category={filters.category}
            filtered={hasActiveFilters(filters)}
            onResetFilters={() => setFilters({ ...defaultFilters, category: filters.category })}
            onAdd={() => setSheet({ kind: 'form', id: null })}
          />
        )}
      </main>

      {/* 레시피 추가 */}
      <button
        type="button"
        onClick={() => setSheet({ kind: 'form', id: null })}
        className="fixed right-5 bottom-5 z-20 flex items-center gap-2 rounded-full bg-amber-600 px-5 py-3.5 font-bold text-white shadow-lg shadow-black/40 transition hover:bg-amber-500"
      >
        <Icon name="plus" size={18} />
        레시피 추가
      </button>

      {detailRecipe && (
        <RecipeDetail
          recipe={detailRecipe}
          sibling={sibling}
          onSwitchTo={(id) => setSheet({ kind: 'detail', id })}
          onClose={() => setSheet(null)}
          favorite={favorites.has(detailRecipe.id)}
          onToggleFavorite={() => toggleFavorite(detailRecipe.id)}
          soundOn={soundOn}
          onEdit={detailRecipe.custom ? () => setSheet({ kind: 'form', id: detailRecipe.id }) : undefined}
          onDelete={detailRecipe.custom ? () => deleteRecipe(detailRecipe.id) : undefined}
        />
      )}

      {sheet?.kind === 'form' && (
        <RecipeForm
          initial={editingRecipe}
          defaultCategory={filters.category}
          onSave={saveRecipe}
          onClose={() => setSheet(editingRecipe ? { kind: 'detail', id: editingRecipe.id } : null)}
        />
      )}

      {sheet?.kind === 'settings' && (
        <SettingsSheet
          onClose={() => setSheet(null)}
          grinders={grinders}
          myGrinder={myGrinder}
          onMyGrinderChange={setMyGrinder}
          soundOn={soundOn}
          onSoundChange={setSoundOn}
          customRecipes={customRecipes}
          onImport={importRecipes}
        />
      )}
    </div>
  );
}

function EmptyState({
  category,
  filtered,
  onResetFilters,
  onAdd,
}: {
  category: Category;
  filtered: boolean;
  onResetFilters: () => void;
  onAdd: () => void;
}) {
  const label = CATEGORIES.find((c) => c.id === category)?.label ?? category;

  return (
    <div className="rounded-2xl border border-dashed border-stone-700 px-6 py-14 text-center">
      <Icon name="coffee" size={32} className="mx-auto text-stone-700" />
      {filtered ? (
        <>
          <p className="mt-3 font-semibold text-stone-300">조건에 맞는 레시피가 없습니다.</p>
          <button type="button" onClick={onResetFilters} className="mt-3 text-sm font-semibold text-amber-500 hover:underline">
            필터 초기화
          </button>
        </>
      ) : (
        <>
          <p className="mt-3 font-semibold text-stone-300">{label} 레시피가 아직 없습니다.</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-stone-500">
            직접 쓰는 레시피를 추가하면 여기에 쌓이고, 브라우저에 저장됩니다. 설정에서 JSON 으로 내보내
            저장소의 기본 레시피로 옮겨 심을 수도 있습니다.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-500"
          >
            <Icon name="plus" size={16} />
            {label} 레시피 추가
          </button>
        </>
      )}
    </div>
  );
}
