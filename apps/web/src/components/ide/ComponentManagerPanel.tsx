"use client";

import React, { useMemo, useState } from "react";
import { Package, Search } from "lucide-react";
import { useCircuit } from "@/contexts/CircuitContext";
import {
  createDefaultComponentState,
  getComponentCatalog,
  getComponentDefinition,
  normalizeComponentType,
} from "@/lib/wiring/componentDefinitions";

import ComponentPreview from "./circuit-lab/ComponentPreview";

const CATEGORY_ORDER = ["Basic", "Sensors", "Actuators", "Displays", "Boards"] as const;

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
  const canonicalType = normalizeComponentType(type).toLowerCase();
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
  const { circuitData, addComponent, selectComponent } = useCircuit();
  const [searchQuery, setSearchQuery] = useState("");

  const catalog = useMemo(() => getComponentCatalog(), []);

  const placedSingletonTypes = useMemo(() => {
    const types = new Set<string>();
    circuitData.components.forEach((component) => {
      const normalized = normalizeComponentType(component.type);
      if (normalized === "BREADBOARD" || normalized === "ARDUINO_UNO") {
        types.add(normalized);
      }
    });
    return types;
  }, [circuitData.components]);

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filteredItems = query
      ? catalog.filter((definition) => {
          return (
            definition.name.toLowerCase().includes(query) ||
            definition.id.toLowerCase().includes(query) ||
            definition.category.toLowerCase().includes(query)
          );
        })
      : catalog;

    return CATEGORY_ORDER.map((category) => ({
      category,
      items: filteredItems.filter((definition) => definition.category === category),
    })).filter((group) => group.items.length > 0);
  }, [catalog, searchQuery]);

  const handleAdd = (type: string) => {
    const definition = getComponentDefinition(type);
    if (!definition || definition.placeable === false) {
      return;
    }

    const canonicalType = normalizeComponentType(type);
    const isSingleton = canonicalType === "BREADBOARD" || canonicalType === "ARDUINO_UNO";

    if (isSingleton) {
      const existing = circuitData.components.find(
        (component) => normalizeComponentType(component.type) === canonicalType
      );

      if (existing) {
        selectComponent(existing.id);
        return;
      }
    }

    const placement = createSuggestedPlacement(
      circuitData.components.length + 1,
      definition.size.width,
      definition.size.height
    );

    addComponent({
      id: createComponentInstanceId(
        circuitData.components.map((component) => component.id),
        canonicalType,
        "circuit"
      ),
      type: canonicalType,
      x: placement.x,
      y: placement.y,
      rotation: 0,
      state: createDefaultComponentState(canonicalType),
    });
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
            {circuitData.components.length} placed
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
        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map((group) => (
              <section key={group.category}>
                <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                  {group.category}
                </div>
                <div className="space-y-1">
                  {group.items.map((definition) => {
                    const normalizedType = normalizeComponentType(definition.id);
                    const isSingleton = normalizedType === "BREADBOARD" || normalizedType === "ARDUINO_UNO";
                    const alreadyPlaced = isSingleton && placedSingletonTypes.has(normalizedType);

                    return (
                      <button
                        key={definition.id}
                        type="button"
                        draggable={definition.placeable !== false}
                        onDragStart={(event) => {
                          event.dataTransfer.setData("componentType", definition.id);
                          event.dataTransfer.effectAllowed = "copy";
                        }}
                        onDoubleClick={() => handleAdd(definition.id)}
                        disabled={definition.placeable === false}
                        className="group flex w-full items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 text-left transition-colors hover:border-slate-700 hover:bg-slate-900/75 disabled:cursor-not-allowed disabled:opacity-45"
                        title="Drag into the workspace or double-click to quick add"
                      >
                        <div className="pointer-events-none flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-800 bg-slate-950/85 p-1 [&_svg]:h-full [&_svg]:w-full [&_svg]:object-contain">
                          <ComponentPreview definition={definition} className="h-full w-full" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-slate-200">{definition.name}</div>
                          <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-slate-500">
                            {definition.placeable === false
                              ? "System mounted"
                              : alreadyPlaced
                                ? "Already placed"
                                : "Drag or double-click"}
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
