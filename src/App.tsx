import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Bean, BrewLog, Category, Filters, Recipe } from './types';
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
import { BrewLogForm } from './components/BrewLogForm';
import { BeansView } from './components/BeansView';
import { LogsView } from './components/LogsView';
import { logsForRecipe } from './lib/dialIn';
import { type Calibration, calibrationForBean, findGrinder } from './lib/grinders';
import { ActiveBeanPicker } from './components/ActiveBeanPicker';
import { PourOverArt } from './components/PourOverArt';
import { type ThemePref, applyTheme } from './lib/theme';
import { type PourMotionPref, PourMotionContext } from './hooks/usePourMotion';

type Sheet =
  | { kind: 'detail'; id: string }
  | { kind: 'form'; id: string | null }
  | { kind: 'settings' }
  | { kind: 'log'; recipeId: string; logId: string | null; actualSec?: number }
  | null;

/** 최상위 화면 */
type View = 'recipes' | 'logs' | 'beans';

const VIEWS: { id: View; label: string }[] = [
  { id: 'recipes', label: '레시피' },
  { id: 'logs', label: '기록' },
  { id: 'beans', label: '원두' },
];

export default function App() {
  const [view, setView] = useState<View>('recipes');
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sheet, setSheet] = useState<Sheet>(null);

  const [favoriteIds, setFavoriteIds] = usePersistentState<string[]>(KEYS.favorites, []);
  const [customRecipes, setCustomRecipes] = usePersistentState<Recipe[]>(KEYS.customRecipes, []);
  const [myGrinder, setMyGrinder] = usePersistentState<string | null>(KEYS.myGrinder, 'femobook-a2');
  const [soundOn, setSoundOn] = usePersistentState<boolean>(KEYS.soundOn, true);
  const [brewLogs, setBrewLogs] = usePersistentState<BrewLog[]>(KEYS.brewLogs, []);
  const [beans, setBeans] = usePersistentState<Bean[]>(KEYS.beans, []);
  const [calibration, setCalibration] = usePersistentState<Calibration>(KEYS.grinderCalibration, {});

  const [activeBeanId, setActiveBeanId] = usePersistentState<string | null>(KEYS.activeBean, null);
  const [theme, setTheme] = usePersistentState<ThemePref>(KEYS.theme, 'auto');
  const [pourMotion, setPourMotion] = usePersistentState<PourMotionPref>(KEYS.pourMotion, 'auto');
  useEffect(() => applyTheme(theme), [theme]);

  /** 설정에 저장된 그라인더 id 를 프로필로 */
  const myGrinderProfile = useMemo(() => findGrinder(myGrinder), [myGrinder]);

  /** 지금 쓰는 원두 (다 마신 원두는 제외) */
  const activeBean = beans.find((b) => b.id === activeBeanId && !b.finished);

  /** 화면의 모든 환산에 쓰이는 기준 — 지금 원두의 기준점이 설정 보정값 위에 얹힌다 */
  const effectiveCalibration = useMemo(() => calibrationForBean(calibration, activeBean), [calibration, activeBean]);
  const fallbackAnchor = myGrinderProfile ? (calibration[myGrinderProfile.id] ?? myGrinderProfile.v60Anchor) : null;

  const favorites = useMemo(() => new Set(favoriteIds), [favoriteIds]);
  const allRecipes = useMemo(() => [...seedRecipes, ...customRecipes], [customRecipes]);
  const visible = useMemo(() => filterRecipes(allRecipes, filters, favorites), [allRecipes, filters, favorites]);

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

  const saveLog = (log: BrewLog) => {
    setBrewLogs((prev) => {
      const at = prev.findIndex((l) => l.id === log.id);
      return at === -1 ? [...prev, log] : prev.map((l) => (l.id === log.id ? log : l));
    });
    setSheet(null);
  };

  const saveBean = (bean: Bean) =>
    setBeans((prev) => {
      const at = prev.findIndex((b) => b.id === bean.id);
      return at === -1 ? [...prev, bean] : prev.map((b) => (b.id === bean.id ? bean : b));
    });

  /** 백업 불러오기 — 같은 id 는 덮어쓰고 나머지는 합친다 */
  const importBackup = (data: { recipes?: Recipe[]; logs?: BrewLog[]; beans?: Bean[] }) => {
    const merge = <T extends { id: string }>(prev: T[], incoming: T[] | undefined): T[] => {
      if (!incoming?.length) return prev;
      const byId = new Map(prev.map((x) => [x.id, x]));
      incoming.forEach((x) => byId.set(x.id, x));
      return [...byId.values()];
    };
    if (data.recipes?.length)
      setCustomRecipes((prev) => merge(prev, data.recipes!.map((r) => ({ ...r, custom: true }))));
    if (data.logs?.length) setBrewLogs((prev) => merge(prev, data.logs));
    if (data.beans?.length) setBeans((prev) => merge(prev, data.beans));
  };

  const detailRecipe = sheet?.kind === 'detail' ? allRecipes.find((r) => r.id === sheet.id) : undefined;
  const logSheetRecipe = sheet?.kind === 'log' ? allRecipes.find((r) => r.id === sheet.recipeId) : undefined;
  const editingRecipe = sheet?.kind === 'form' && sheet.id ? allRecipes.find((r) => r.id === sheet.id) : undefined;
  const sibling =
    detailRecipe?.family !== undefined
      ? allRecipes.find((r) => r.family === detailRecipe.family && r.id !== detailRecipe.id)
      : undefined;

  return (
    <PourMotionContext.Provider value={pourMotion}>
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-20 border-b border-line bg-canvas/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-3.5">
          <div className="flex min-w-0 shrink-0 items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-canvas ring-4 ring-ink/10">
              <Icon name="coffee" size={19} />
            </span>
            <div className="leading-none">
              <p className="eyebrow text-[9.5px]">Home Brew Bar</p>
              <h1 className="mt-1 font-display text-[21px] font-semibold tracking-tight text-ink">My Coffee Recipe</h1>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSheet({ kind: 'settings' })}
            aria-label={`설정${myGrinderProfile ? ` (${myGrinderProfile.name})` : ''}`}
            title={myGrinderProfile ? `설정 · ${myGrinderProfile.name}` : '설정'}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-card text-ink-soft shadow-card transition hover:text-ink"
          >
            <Icon name="grinder" size={18} />
          </button>
        </div>
      </header>

      {/* 최상위 화면 전환 */}
      <div className="mx-auto max-w-4xl px-5 pt-4">
        <nav aria-label="화면" className="flex gap-1 rounded-xl border border-line bg-card p-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-current={view === v.id ? 'page' : undefined}
              onClick={() => setView(v.id)}
              className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
                view === v.id ? 'bg-ink text-canvas' : 'text-ink-soft hover:bg-well hover:text-ink'
              }`}
            >
              {v.label}
              {v.id === 'logs' && brewLogs.length > 0 && (
                <span className="ml-1.5 num text-[11px] opacity-70">{brewLogs.length}</span>
              )}
              {v.id === 'beans' && beans.filter((b) => !b.finished).length > 0 && (
                <span className="ml-1.5 num text-[11px] opacity-70">{beans.filter((b) => !b.finished).length}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {view === 'logs' && (
        <main className="mx-auto max-w-4xl px-5 pt-5">
          <LogsView
            logs={brewLogs}
            beans={beans}
            onOpenRecipe={(recipeId) => {
              setView('recipes');
              setSheet({ kind: 'detail', id: recipeId });
            }}
            onEdit={(log) => setSheet({ kind: 'log', recipeId: log.recipeId, logId: log.id })}
            onDelete={(id) => setBrewLogs((prev) => prev.filter((l) => l.id !== id))}
          />
        </main>
      )}

      {view === 'beans' && (
        <main className="mx-auto max-w-4xl px-5 pt-5">
          <BeansView
            beans={beans}
            logs={brewLogs}
            myGrinder={myGrinderProfile}
            activeBeanId={activeBean?.id ?? null}
            onActivate={setActiveBeanId}
            onSave={saveBean}
            onDelete={(id) => {
              setBeans((prev) => prev.filter((b) => b.id !== id));
              if (activeBeanId === id) setActiveBeanId(null);
            }}
          />
        </main>
      )}

      <main className={`mx-auto max-w-4xl px-5 pt-5 ${view === 'recipes' ? '' : 'hidden'}`}>
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
                    ? 'border-transparent bg-ink text-canvas'
                    : 'border-line bg-card text-ink-soft hover:bg-well hover:text-ink'
                }`}
              >
                {cat.label}
                <span className={`num text-[11px] ${filters.category === cat.id ? 'text-canvas/70' : 'text-ink-faint'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        <FilterBar filters={filters} onChange={patch} favoriteCount={favorites.size} />

        <div className="mt-2.5">
          <ActiveBeanPicker
            beans={beans}
            activeBeanId={activeBeanId}
            onChange={setActiveBeanId}
            myGrinder={myGrinderProfile}
            fallbackAnchor={fallbackAnchor}
          />
        </div>

        <div className="mt-7 mb-4 flex items-end justify-between gap-3 border-b border-line pb-2">
          <div>
            <p className="eyebrow">Today&apos;s Menu</p>
            <h2 className="mt-0.5 text-xl font-bold text-ink">레시피</h2>
          </div>
          <p className="mb-0.5 text-sm text-ink-soft">
            <span className="num font-bold text-ink">{visible.length}</span>개
          </p>
        </div>

        {visible.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visible.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                favorite={favorites.has(recipe.id)}
                myGrinder={myGrinderProfile}
                calibration={effectiveCalibration}
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
        hidden={view !== 'recipes'}
        onClick={() => setSheet({ kind: 'form', id: null })}
        className="fixed right-5 bottom-5 z-20 flex items-center gap-2 rounded-full bg-crema px-5 py-3.5 font-bold text-on-crema shadow-float transition hover:bg-crema-deep"
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
          logs={logsForRecipe(brewLogs, detailRecipe.id)}
          onLogBrew={(actualSec) => setSheet({ kind: 'log', recipeId: detailRecipe.id, logId: null, actualSec })}
          onOpenLog={(log) => setSheet({ kind: 'log', recipeId: log.recipeId, logId: log.id })}
          myGrinder={myGrinderProfile}
          calibration={effectiveCalibration}
          beanPicker={
            <ActiveBeanPicker
              beans={beans}
              activeBeanId={activeBeanId}
              onChange={setActiveBeanId}
              myGrinder={myGrinderProfile}
              fallbackAnchor={fallbackAnchor}
            />
          }
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

      {sheet?.kind === 'log' && logSheetRecipe && (
        <BrewLogForm
          recipe={logSheetRecipe}
          beans={beans}
          actualSec={sheet.actualSec}
          existing={sheet.logId ? brewLogs.find((l) => l.id === sheet.logId) : undefined}
          myGrinder={myGrinderProfile}
          calibration={effectiveCalibration}
          defaultBeanId={activeBean?.id}
          onSave={saveLog}
          onClose={() => setSheet({ kind: 'detail', id: sheet.recipeId })}
        />
      )}

      {sheet?.kind === 'settings' && (
        <SettingsSheet
          onClose={() => setSheet(null)}
          myGrinder={myGrinder}
          onMyGrinderChange={setMyGrinder}
          calibration={calibration}
          onCalibrationChange={setCalibration}
          soundOn={soundOn}
          onSoundChange={setSoundOn}
          theme={theme}
          onThemeChange={setTheme}
          pourMotion={pourMotion}
          onPourMotionChange={setPourMotion}
          customRecipes={customRecipes}
          brewLogs={brewLogs}
          beans={beans}
          onImport={importBackup}
        />
      )}
    </div>
    </PourMotionContext.Provider>
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
    <div className="rounded-2xl border border-dashed border-line px-6 py-14 text-center">
      <PourOverArt className="mx-auto h-24 w-24 text-line-strong" />
      {filtered ? (
        <>
          <p className="mt-3 font-semibold text-ink-soft">조건에 맞는 레시피가 없습니다.</p>
          <button type="button" onClick={onResetFilters} className="mt-3 text-sm font-semibold text-crema hover:underline">
            필터 초기화
          </button>
        </>
      ) : (
        <>
          <p className="mt-3 font-semibold text-ink-soft">{label} 레시피가 아직 없습니다.</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-faint">
            직접 쓰는 레시피를 추가하면 여기에 쌓이고, 브라우저에 저장됩니다. 설정에서 JSON 으로 내보내
            저장소의 기본 레시피로 옮겨 심을 수도 있습니다.
          </p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-crema px-4 py-2.5 text-sm font-bold text-on-crema hover:bg-crema-deep"
          >
            <Icon name="plus" size={16} />
            {label} 레시피 추가
          </button>
        </>
      )}
    </div>
  );
}
