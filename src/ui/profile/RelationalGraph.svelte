<!--
  src/ui/profile/RelationalGraph.svelte
  🌐 RADIAL RELATIONAL CONSTELLATION GRAPH
  
  Visualizes outgoing & incoming relationship vectors for an entity in a sleek
  radial constellation.
  - Center Node: The current active entity.
  - Satellite Nodes: Surrounding related entities (both outgoing & incoming).
  - SVG Curved Arcs: Directional arrows colored with the source entity's signature color.
  - Interactive Tooltips: Hover/focus over edges shows dynamic details.
  - Navigation: Clicking a satellite node triggers on_select_entity(entity).
-->
<script>
  import { entities, PREMADE_ENTITIES } from "@data";
  import { get_signature_color } from "@media";
  import { tooltip } from "@primitives";
  import { extract_entity_relationships } from "@intelligence";

  /**
   * @typedef {Object} Props
   * @property {any} entity - The central active entity.
   * @property {(selected: any) => void} [on_select_entity] - Callback when a satellite node is clicked.
   * @property {string} [class] - Additional container class.
   */

  /** @type {Props} */
  let { entity, on_select_entity = () => {}, class: custom_class = "" } = $props();

  let all_entities = $state([]);
  let hovered_edge = $state(null);
  let selected_dossier = $state(null);

  function get_entity_slug(ent) {
    if (!ent) return "";
    const raw = ent.id || ent.name || "";
    return String(raw)
      .toUpperCase()
      .replace(/[^A-Z0-9_]/g, "_");
  }

  function parse_bracket_lines(text) {
    if (!text || typeof text !== "string") return [];
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const is_hidden = /\|\s*hide\b/i.test(line);
        return {
          raw: line,
          is_hidden,
        };
      });
  }

  // Load all known characters and fractals to resolve incoming relationships and satellite entity profiles
  $effect(() => {
    Promise.all([entities.list("character"), entities.list("fractal")]).then(([chars, fracs]) => {
      const combined = [...chars, ...fracs];
      // Merge with premades so uninstantiated premades can still be clicked / mapped
      const seen_ids = new Set(combined.map((e) => e.id));
      for (const p of PREMADE_ENTITIES) {
        if (!seen_ids.has(p.id)) {
          combined.push(p);
        }
      }
      all_entities = combined;
    });
  });

  /**
   * Normalize name comparison
   * @param {string} name
   */
  function norm(name) {
    return String(name || "")
      .trim()
      .toLowerCase();
  }

  function find_matched_entity(target_name) {
    if (!target_name) return null;
    const n = norm(target_name);
    const n_no_underscore = n.replace(/_/g, " ");
    // 1. Exact match by name or id in all_entities
    const exact = all_entities.find((e) => {
      const en = norm(e.name);
      const eid = norm(e.id);
      return en === n || en === n_no_underscore || eid === n || eid === n_no_underscore;
    });
    if (exact) return exact;
    // 2. Word-boundary or token match in all_entities
    const token_match = all_entities.find((e) => {
      const en = norm(e.name);
      return (
        en === n ||
        en === n_no_underscore ||
        en.split(/\s+/).includes(n) ||
        en.split(/\s+/).includes(n_no_underscore) ||
        n_no_underscore.split(/\s+/).includes(en)
      );
    });
    if (token_match) return token_match;
    // 3. Match in premade catalog
    const pm = PREMADE_ENTITIES.find((e) => {
      const en = norm(e.name);
      const eid = norm(e.id);
      return en === n || en === n_no_underscore || eid === n || eid === n_no_underscore;
    });
    if (pm) return pm;
    return { name: target_name.replace(/_/g, " ") };
  }

  // 1. Resolve Outgoing & Incoming Edges relative to the central entity
  const resolved_edges = $derived.by(() => {
    if (!entity?.name) return [];
    const current_name = norm(entity.name);
    const edges = [];

    // Harvest bracket relationships for the central entity across eternal, present, past, future
    const bracket_rel_map = extract_entity_relationships(entity, all_entities);
    const matched_targets = new Set();

    // Outgoing edges (harvested from central entity's universal bracket predicates)
    for (const [target_key, links] of bracket_rel_map) {
      const target_norm = norm(target_key);
      if (target_norm === current_name) continue;
      matched_targets.add(target_norm);
      const target_entity = find_matched_entity(target_key);
      const dynamic = links.present || links.eternal || (links.past && links.past[0]) || links.future || "Connected";
      edges.push({
        source_name: entity.name,
        target_name: target_entity?.name || target_key,
        dynamic,
        is_outgoing: true,
        source_entity: entity,
        target_entity,
        temporal_links: links,
      });
    }

    // B. Incoming edges (harvested from other entities pointing to current entity)
    for (const other of all_entities) {
      if (norm(other.name) === current_name) continue;
      const other_bracket_map = extract_entity_relationships(other, [entity]);
      for (const [key, links] of other_bracket_map) {
        if (norm(key) === current_name) {
          const dynamic = links.present || links.eternal || (links.past && links.past[0]) || links.future || "Connected";
          edges.push({
            source_name: other.name,
            target_name: entity.name,
            dynamic,
            is_outgoing: false,
            source_entity: other,
            target_entity: entity,
            temporal_links: links,
          });
          break;
        }
      }
    }

    return edges;
  });

  // 2. Unique Connected Satellite Entities
  const satellite_nodes = $derived.by(() => {
    if (!entity?.name) return [];
    const current_name = norm(entity.name);
    const map = new Map();

    for (const edge of resolved_edges) {
      const other_name = edge.is_outgoing ? edge.target_name : edge.source_name;
      const other_entity = edge.is_outgoing ? edge.target_entity : edge.source_entity;
      const resolved = other_entity?.id ? other_entity : find_matched_entity(other_name);
      const key = norm(resolved?.name || other_name);
      if (key && key !== current_name && !map.has(key)) {
        map.set(key, {
          name: resolved?.name || other_name,
          entity: resolved,
          temporal_links: edge.temporal_links || null,
        });
      }
    }

    return Array.from(map.values());
  });

  // 3. Constellation Coordinates & Radial Geometry
  const size = 380;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 135;
  const node_radius = 22;

  const node_positions = $derived.by(() => {
    const positions = new Map();
    const count = satellite_nodes.length;
    if (!count) return positions;

    satellite_nodes.forEach((item, idx) => {
      // Offset start angle to -PI/2 (top center)
      const angle = (idx * 2 * Math.PI) / count - Math.PI / 2;
      const x = cx + radius * Math.cos(angle);
      const y = cy + radius * Math.sin(angle);
      positions.set(norm(item.name), { x, y, angle, item });
    });

    return positions;
  });

  // 4. Edge SVG Path Geometry with Dual-Directional Curved Offset
  const visual_edges = $derived.by(() => {
    const list = [];

    // Group edges by pair (norm(A) + "__" + norm(B))
    const pair_counts = new Map();
    for (const e of resolved_edges) {
      const other = norm(e.is_outgoing ? e.target_name : e.source_name);
      pair_counts.set(other, (pair_counts.get(other) || 0) + 1);
    }

    for (const edge of resolved_edges) {
      const other_name = norm(edge.is_outgoing ? edge.target_name : edge.source_name);
      const pos = node_positions.get(other_name);
      if (!pos) continue;

      const is_bidirectional = (pair_counts.get(other_name) || 0) > 1;
      const source_color = get_signature_color(edge.source_entity);

      let p_start, p_end, path_d;

      if (edge.is_outgoing) {
        p_start = { x: cx, y: cy };
        p_end = { x: pos.x, y: pos.y };
      } else {
        p_start = { x: pos.x, y: pos.y };
        p_end = { x: cx, y: cy };
      }

      // Calculate unit vector & normal for offset
      const dx = p_end.x - p_start.x;
      const dy = p_end.y - p_start.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const ux = dx / dist;
      const uy = dy / dist;

      // Adjust start and end to node boundaries
      const start_x = p_start.x + ux * (node_radius + 4);
      const start_y = p_start.y + uy * (node_radius + 4);
      const end_x = p_end.x - ux * (node_radius + 6);
      const end_y = p_end.y - uy * (node_radius + 6);

      if (is_bidirectional) {
        // Curve to the right of the direction vector
        const curvature = 24;
        const mid_x = (start_x + end_x) / 2 + -uy * curvature;
        const mid_y = (start_y + end_y) / 2 + ux * curvature;
        path_d = `M ${start_x.toFixed(1)} ${start_y.toFixed(1)} Q ${mid_x.toFixed(1)} ${mid_y.toFixed(1)} ${end_x.toFixed(1)} ${end_y.toFixed(1)}`;
      } else {
        path_d = `M ${start_x.toFixed(1)} ${start_y.toFixed(1)} L ${end_x.toFixed(1)} ${end_y.toFixed(1)}`;
      }

      list.push({
        edge,
        color: source_color,
        path_d,
        is_outgoing: edge.is_outgoing,
        id: `${norm(edge.source_name)}->${norm(edge.target_name)}_${list.length}`,
      });
    }

    return list;
  });

  function format_node_tooltip(item) {
    let tip = `${item.name} (Click to open profile)`;
    const links = item.temporal_links;
    if (!links) return tip;
    const parts = [];
    if (links.eternal) parts.push(`🏛️ Eternal: ${links.eternal}`);
    if (links.present) parts.push(`⚡ Present: ${links.present}`);
    if (links.past?.length) parts.push(`📜 Past: ${links.past[0]}`);
    if (links.future) parts.push(`🚀 Future: ${links.future}`);
    if (parts.length) {
      tip += `\n${parts.join("\n")}`;
    }
    return tip;
  }

  const center_color = $derived(get_signature_color(entity));
</script>

<div class="relative flex w-full items-center justify-center {custom_class}">
  {#if resolved_edges.length === 0}
    <!-- Empty State -->
    <div
      class="flex w-full flex-col items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-950/40 p-6 text-center backdrop-blur-md"
    >
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/60 text-slate-400">
        <svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current stroke-2">
          <circle cx="12" cy="12" r="3" />
          <circle cx="4" cy="12" r="2" />
          <circle cx="20" cy="12" r="2" />
          <path d="M6 12h3m6 0h3" />
        </svg>
      </div>
      <span class="mt-2 text-xs font-semibold text-slate-300">No recorded relationships yet</span>
      <p class="mt-1 max-w-xs text-[11px] text-slate-400">This entity has not yet established directed bonds with other entities.</p>
    </div>
  {:else}
    <!-- Radial Visual Constellation -->
    <div class="relative flex flex-col items-center justify-center overflow-visible">
      <div class="relative flex items-center justify-center" style="width: {size}px; height: {size}px;">
        <!-- SVG Canvas for Connecting Directional Curves -->
        <svg class="absolute inset-0 z-0 h-full w-full overflow-visible" viewBox="0 0 {size} {size}" style="width: {size}px; height: {size}px;">
          <defs>
            <filter id="mesh-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <!-- Dynamic Colored Arrowheads -->
            {#each visual_edges as ve (ve.id)}
              <marker id="marker-{ve.id}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={ve.color} opacity="0.9" />
              </marker>
            {/each}
          </defs>

          <!-- Render Directed Curve Lines -->
          {#each visual_edges as ve (ve.id)}
            <!-- Hitbox (wide stroke for easy mouseover hover & tooltip trigger) -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <path
              d={ve.path_d}
              fill="none"
              stroke="transparent"
              stroke-width="18"
              class="pointer-events-auto cursor-pointer"
              onmouseenter={() => (hovered_edge = ve.edge)}
              onmouseleave={() => (hovered_edge = null)}
              onclick={() => {
                selected_dossier = {
                  type: "edge",
                  edge: ve.edge,
                };
              }}
              use:tooltip={`${ve.edge.source_name} → ${ve.edge.target_name}: ${ve.edge.dynamic} (Click to inspect dossier)`}
            />
            <!-- Visible Styled Curve Path -->
            <path
              d={ve.path_d}
              fill="none"
              stroke={ve.color}
              stroke-width={hovered_edge === ve.edge ? "2.75" : "1.75"}
              stroke-opacity={hovered_edge === ve.edge ? "1" : "0.75"}
              marker-end="url(#marker-{ve.id})"
              class="pointer-events-none transition-all duration-200"
              filter={hovered_edge === ve.edge ? "url(#mesh-glow)" : undefined}
            />
          {/each}
        </svg>

        <!-- Center Node (Active Profile Entity) -->
        <div class="absolute z-10 flex flex-col items-center justify-center" style="left: {cx}px; top: {cy}px; transform: translate(-50%, -50%);">
          <button
            type="button"
            aria-label={`Inspect central entity ${entity?.name || "Active"}`}
            onclick={() => {
              selected_dossier = {
                type: "entity",
                entity,
                name: entity?.name || "Active",
                is_center: true,
              };
            }}
            class="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-2 bg-slate-900 shadow-xl transition-transform duration-300 hover:scale-105 focus:outline-hidden"
            style="border-color: {center_color}; box-shadow: 0 0 20px {center_color}33;"
          >
            {#if entity?.profile_picture}
              <img src={entity.profile_picture} alt={entity.name} class="h-full w-full rounded-full object-cover" />
            {:else}
              <span class="text-xs font-bold text-slate-200 uppercase">
                {(entity?.name || "?").slice(0, 2)}
              </span>
            {/if}
          </button>
          <span class="mt-1 max-w-[90px] truncate text-center text-[11px] font-bold text-slate-200 drop-shadow-md">
            {entity?.name || "Active"}
          </span>
        </div>

        <!-- Surrounding Satellite Nodes -->
        {#each Array.from(node_positions.values()) as node (node.item.name)}
          {@const sat_entity = node.item.entity}
          {@const sat_color = get_signature_color(sat_entity)}
          <div
            class="absolute z-10 flex flex-col items-center justify-center"
            style="left: {node.x}px; top: {node.y}px; transform: translate(-50%, -50%);"
          >
            <button
              type="button"
              aria-label={`Open profile for ${node.item.name}`}
              onclick={() => {
                selected_dossier = {
                  type: "entity",
                  entity: sat_entity || node.item.entity || { name: node.item.name },
                  name: node.item.name,
                  temporal_links: node.item.temporal_links,
                  is_center: false,
                };
              }}
              use:tooltip={format_node_tooltip(node.item)}
              class="group relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 bg-slate-900 shadow-lg transition-all duration-300 hover:scale-115 focus:outline-hidden"
              style="border-color: {sat_color}; box-shadow: 0 0 12px {sat_color}22;"
            >
              {#if sat_entity?.profile_picture}
                <img src={sat_entity.profile_picture} alt={node.item.name} class="h-full w-full rounded-full object-cover" />
              {:else}
                <span class="text-[10px] font-bold text-slate-300 uppercase">
                  {node.item.name.slice(0, 2)}
                </span>
              {/if}
            </button>
            <span class="mt-1 max-w-[80px] truncate text-center text-[10px] font-medium text-slate-400 group-hover:text-slate-200">
              {node.item.name}
            </span>
          </div>
        {/each}
      </div>

      <!-- 360° Relational Dossier Floating Card -->
      {#if selected_dossier}
        <div
          data-testid="relational-dossier-card"
          class="absolute inset-2 z-30 flex flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/95 p-4 shadow-2xl backdrop-blur-xl"
        >
          <!-- Dossier Header -->
          <div class="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div class="flex min-w-0 items-center gap-2.5">
              {#if selected_dossier.type === "entity"}
                {@const dossier_color = get_signature_color(selected_dossier.entity)}
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-slate-900 text-xs font-bold text-slate-200 uppercase"
                  style="border-color: {dossier_color};"
                >
                  {#if selected_dossier.entity?.profile_picture}
                    <img src={selected_dossier.entity.profile_picture} alt={selected_dossier.name} class="h-full w-full rounded-full object-cover" />
                  {:else}
                    {(selected_dossier.name || "?").slice(0, 2)}
                  {/if}
                </div>
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-1.5">
                    <span class="truncate text-xs font-bold text-slate-200">{selected_dossier.name}</span>
                    <span class="rounded border border-cyan-800/50 bg-cyan-950/40 px-1.5 py-0.5 font-mono text-[9px] font-medium text-cyan-300">
                      @{get_entity_slug(selected_dossier.entity)}
                    </span>
                  </div>
                  <span class="text-[10px] text-slate-400 capitalize">
                    {selected_dossier.entity?.type || "Character"} Dossier
                  </span>
                </div>
              {:else}
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 truncate text-xs font-bold text-slate-200">
                    <span>{selected_dossier.edge?.source_name}</span>
                    <span class="text-slate-500">➔</span>
                    <span>{selected_dossier.edge?.target_name}</span>
                  </div>
                  <span class="text-[10px] text-slate-400">Directed Relational Vector</span>
                </div>
              {/if}
            </div>

            <button
              type="button"
              aria-label="Close dossier"
              onclick={() => (selected_dossier = null)}
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 transition-colors hover:border-slate-700 hover:text-slate-200"
            >
              <svg viewBox="0 0 24 24" class="h-3.5 w-3.5 fill-none stroke-current stroke-2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <!-- Dossier Content -->
          <div class="my-3 flex-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent space-y-3 overflow-y-auto pr-1">
            {#if selected_dossier.type === "entity"}
              {@const ent = selected_dossier.entity}
              {@const present_brackets = parse_bracket_lines(ent?.present?.non_physical || (typeof ent?.present === "string" ? ent.present : ""))}

              <!-- 4 Quadrants -->
              <div class="grid grid-cols-1 gap-2.5">
                <!-- 1. Eternal -->
                <div class="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5">
                  <span class="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-cyan-400 uppercase"> 🏛️ Eternal </span>
                  <div class="mt-1 space-y-1 text-[11px] text-slate-300">
                    {#if ent?.eternal?.physical}
                      <p><strong class="text-slate-400">Physical:</strong> {ent.eternal.physical}</p>
                    {/if}
                    {#if ent?.eternal?.non_physical}
                      <p>{ent.eternal.non_physical}</p>
                    {:else if !ent?.eternal?.physical}
                      <p class="text-slate-500 italic">No eternal traits recorded.</p>
                    {/if}
                  </div>
                </div>

                <!-- 2. Present & Omniscient Observer Mode -->
                <div class="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5">
                  <span class="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-amber-400 uppercase"> ⚡ Present </span>
                  <div class="mt-1 space-y-1.5 text-[11px] text-slate-300">
                    {#if ent?.present?.physical}
                      <p><strong class="text-slate-400">Condition:</strong> {ent.present.physical}</p>
                    {/if}
                    {#if present_brackets.length > 0}
                      <div class="space-y-1">
                        {#each present_brackets as bracket (bracket.raw)}
                          <div
                            class="flex items-start justify-between gap-1.5 rounded-lg border p-1.5 text-[11px] {bracket.is_hidden
                              ? 'border-amber-800/50 bg-amber-950/25 text-amber-200'
                              : 'border-slate-800/60 bg-slate-950/40 text-slate-300'}"
                          >
                            <span class="font-mono text-[10.5px] leading-relaxed break-words">{bracket.raw}</span>
                            {#if bracket.is_hidden}
                              <span
                                class="inline-flex shrink-0 items-center gap-1 rounded border border-amber-700/60 bg-amber-950/80 px-1.5 py-0.5 text-[9px] font-semibold text-amber-300"
                              >
                                🔒 Epistemic Lock
                              </span>
                            {/if}
                          </div>
                        {/each}
                      </div>
                    {:else if !ent?.present?.physical}
                      <p class="text-slate-500 italic">No present condition recorded.</p>
                    {/if}
                  </div>
                </div>

                <!-- 3. Past -->
                <div class="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5">
                  <span class="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-indigo-400 uppercase"> 📜 Past </span>
                  <div class="mt-1 space-y-1 text-[11px] text-slate-300">
                    {#if Array.isArray(ent?.past) && ent.past.length > 0}
                      <ul class="list-disc space-y-0.5 pl-4">
                        {#each ent.past.slice(0, 3) as mem, mem_idx (mem_idx)}
                          <li>{typeof mem === "string" ? mem : mem.text || JSON.stringify(mem)}</li>
                        {/each}
                      </ul>
                    {:else if selected_dossier.temporal_links?.past?.length}
                      <ul class="list-disc space-y-0.5 pl-4">
                        {#each selected_dossier.temporal_links.past as past_link, link_idx (link_idx)}
                          <li>{past_link}</li>
                        {/each}
                      </ul>
                    {:else}
                      <p class="text-slate-500 italic">No historical memories indexed.</p>
                    {/if}
                  </div>
                </div>

                <!-- 4. Future -->
                <div class="rounded-xl border border-slate-800/80 bg-slate-900/40 p-2.5">
                  <span class="flex items-center gap-1 text-[10px] font-semibold tracking-wider text-emerald-400 uppercase"> 🚀 Future </span>
                  <div class="mt-1 text-[11px] text-slate-300">
                    <p>{ent?.future || "No standing agenda recorded."}</p>
                  </div>
                </div>
              </div>
            {:else if selected_dossier.type === "edge"}
              {@const edge = selected_dossier.edge}
              {@const is_hidden = /\|\s*hide\b/i.test(edge?.dynamic || "")}

              <div class="space-y-3">
                <div class="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3">
                  <span class="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">Dynamic Vector</span>
                  <p class="mt-1 font-mono text-xs text-slate-200">{edge?.dynamic}</p>
                </div>

                <div
                  class="rounded-xl border p-2.5 text-xs {is_hidden
                    ? 'border-amber-800/60 bg-amber-950/30 text-amber-200'
                    : 'border-slate-800 bg-slate-900/40 text-slate-300'}"
                >
                  {#if is_hidden}
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-amber-400">🔒</span>
                      <div>
                        <span class="font-semibold text-amber-300">Epistemic Lock Active</span>
                        <p class="mt-0.5 text-[11px] text-amber-400/80">
                          This dynamic is concealed from other participants across the Epistemic Wall in live narration.
                        </p>
                      </div>
                    </div>
                  {:else}
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-slate-400">🌐</span>
                      <div>
                        <span class="font-semibold text-slate-200">Public Dynamic</span>
                        <p class="mt-0.5 text-[11px] text-slate-400">Observable in shared scene context.</p>
                      </div>
                    </div>
                  {/if}
                </div>
              </div>
            {/if}
          </div>

          <!-- Dossier Footer -->
          <div class="flex items-center justify-end gap-2 border-t border-slate-800/80 pt-2.5">
            {#if selected_dossier.type === "entity"}
              <button
                type="button"
                aria-label={`Open full profile for ${selected_dossier.name}`}
                onclick={() => {
                  if (typeof on_select_entity === "function") {
                    on_select_entity(selected_dossier.entity);
                  }
                }}
                class="flex cursor-pointer items-center gap-1.5 rounded-xl border border-cyan-500/50 bg-cyan-600/20 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition-all hover:border-cyan-400 hover:bg-cyan-600/30"
              >
                Open Full Profile →
              </button>
            {:else if selected_dossier.edge?.target_entity}
              <button
                type="button"
                aria-label={`Open full profile for ${selected_dossier.edge.target_name}`}
                onclick={() => {
                  if (typeof on_select_entity === "function") {
                    on_select_entity(selected_dossier.edge.target_entity);
                  }
                }}
                class="flex cursor-pointer items-center gap-1.5 rounded-xl border border-cyan-500/50 bg-cyan-600/20 px-3 py-1.5 text-xs font-semibold text-cyan-200 transition-all hover:border-cyan-400 hover:bg-cyan-600/30"
              >
                Open {selected_dossier.edge.target_name} Profile →
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!--
  CHANGELOG
  ============================================================================
  - 2026-10-14: Atom 3.5 — 360° Relational Dossier & Omniscient Observer Mode.
    Interactive glassmorphic dossier card displaying 4-layer state (eternal,
    present, past, future) on node and edge click; visual epistemic lock badge
    for concealed `| hide` brackets.
  - 2026-10-01: Universal Predicates Migration — edit list and constellation nodes
    are driven 100% by universal bracket predicates (`present.non_physical`).
    Purged legacy `entity.relationships` array references under P4 Zero Backwards
    Compatibility.
  - 2026-09-30: Synchronized handle_delete_edge into present.non_physical via atomic
    [TARGET: none] bracket mutation, preventing stale bracket shadow drift.
  - 2026-09-29: Initial implementation of radial relational constellation graph.
  ============================================================================
-->
