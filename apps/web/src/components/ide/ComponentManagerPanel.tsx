"use client";

import React, { useMemo, useState } from "react";
import { Package, Search } from "lucide-react";
import { useCircuitStore } from '@/stores/circuitStore';
import { useSplitViewEventBus } from './split-view/SplitViewEventBus';
import { useCircuitComponentRegistry } from '@/hooks/useCircuitComponentRegistry';
import {
  createDefaultComponentState,
  getComponentDefinition,
} from "@/lib/wiring/componentDefinitions";

import ComponentPreview from "./circuit-lab/ComponentPreview";

function createUserEditedPayload() {
  return { source: 'circuit' as const, timestamp: Date.now() };
}

function createSuggestedPlacement(index: number, width: number, height: number) {
  const slot = (index - 1) % 8;
  const baseX = 930 + (slot % 2) * 148;
  const baseY = 238 + Math.floor(slot / 2) * 108;

  return {
    x: baseX - width / 2,
    y: baseY - height / 2,
  };
}

function createComponentInstanceId(existingIds: string[], type: string, prefix: string) {
  const canonicalType = type.toLowerCase();
  const matcher = new RegExp(`^${prefix}-${canonicalType}-(\\d+)$`);
  const nextIndex =
    existingIds.reduce((highest, id) => {
      const match = id.match(matcher);
      if (!match) {
        return highest;
      }

      return Math.max(highest, Number(match[1]));
    }, 0) + 1;

  return `${prefix}-${canonicalType}-${nextIndex}`;
}

export default function ComponentManagerPanel() {
  const components = useCircuitStore((state) => state.components);
  const addComponent = useCircuitStore((state) => state.addComponent);
  const selectComponent = useCircuitStore((state) => state.selectComponent);
  const eventBus = useSplitViewEventBus();
  const registry = useCircuitComponentRegistry();
  const [searchQuery, setSearchQuery] = useState("");

  const placedSingletonTypes = useMemo(() => {
    const types = new Set<string>();
    components.forEach((component) => {
      const entry = registry.getEntry(component.type);
      if (entry?.singleton) {
        types.add(entry.id);
      }
    });
    return types;
  }, [components, registry]);

  const groupedEntries = useMemo(() => {
    const visibleEntries = registry.search(searchQuery, { placeableOnly: true });

    return registry
      .getCategories({ placeableOnly: true })
      .map((category) => ({
        category,
        label: registry.getCategoryLabel(category),
        items: visibleEntries.filter((entry) => entry.category === category),
      }))
      .filter((group) => group.items.length > 0);
  }, [registry, searchQuery]);

  const handleAdd = (type: string) => {
    const entry = registry.getEntry(type);
    if (!entry || !entry.placeable) {
      return;
    }

    const definition = getComponentDefinition(entry.previewSourceKey) ?? getComponentDefinition(entry.id);
    if (!definition) {
      return;
    }

    if (entry.singleton) {
      const existing = components.find((component) => registry.getEntry(component.type)?.id === entry.id);
      if (existing) {
        selectComponent(existing.id);
        return;
      }
    }

    const placement = createSuggestedPlacement(
      components.length + 1,
      definition.size.width,
      definition.size.height
    );

    addComponent({
      id: createComponentInstanceId(
        components.map((component) => component.id),
        entry.id,
        "circuit"
      ),
      type: entry.id,
      x: placement.x,
      y: placement.y,
      rotation: 0,
      state: createDefaultComponentState(entry.id),
    });
    eventBus.emit('USER_EDITED', createUserEditedPayload());
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[#101622]">
      <div className="border-b border-slate-800 px-3 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              <Package size={13} className="text-cyan-300" />
              Components
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Drag to place or double-click to add. Start with Breadboard + Arduino.
            </p>
          </div>
          <span className="rounded-full border border-slate-800 bg-slate-900/75 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">
            {components.length} placed
          </span>
        </div>

        <div className="relative mt-3">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search components"
            className="h-10 w-full rounded-xl border border-slate-800 bg-slate-900/70 pl-10 pr-3 text-sm text-slate-200 outline-none transition-colors placeholder:text-slate-500 focus:border-cyan-400/45"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {groupedEntries.length > 0 ? (
          <div className="space-y-4">
            {groupedEntries.map((group) => (
              <section key={group.category}>
                <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map((entry) => {
                    const definition = getComponentDefinition(entry.previewSourceKey) ?? getComponentDefinition(entry.id);
                    if (!definition) {
                      return null;
                    }

                    const alreadyPlaced = entry.singleton && placedSingletonTypes.has(entry.id);

                    return (
                      <button
                        key={entry.id}
                        type="button"
                        draggable={entry.placeable && !alreadyPlaced}
                        onClick={() => {
                          if (!alreadyPlaced) {
                            return;
                          }

                          const existing = components.find((component) => registry.getEntry(component.type)?.id === entry.id);
                          if (existing) {
                            selectComponent(existing.id);
                          }
                        }}
                        onDragStart={(event) => {
                          if (alreadyPlaced) {
                            event.preventDefault();
                            return;
                          }

                          event.dataTransfer.setData("componentType", entry.id);
                          event.dataTransfer.effectAllowed = "copy";
                        }}
                        onDoubleClick={() => handleAdd(entry.id)}
                        disabled={!entry.placeable}
                        className="group flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 text-left transition-colors hover:border-slate-700 hover:bg-slate-900/75 disabled:cursor-not-allowed disabled:opacity-45"
                        title={alreadyPlaced ? "Already placed in the workspace" : "Drag into the workspace or double-click to quick add"}
                      >
                        <div className="pointer-events-none flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950/85 p-1 [&_svg]:h-full [&_svg]:w-full [&_svg]:object-contain">
                          <ComponentPreview definition={definition} className="h-full w-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-200">{entry.name}</div>
                          <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                            {alreadyPlaced ? "Already placed" : "Drag or double-click"}
                          </div>
                          <div className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">
                            {entry.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-4 py-6 text-center text-xs leading-6 text-slate-500">
            No components match your search yet.
          </div>
        )}
      </div>
    </div>
  );
}

