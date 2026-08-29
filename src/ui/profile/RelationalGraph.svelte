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
  import { Button, TextField, tooltip } from "@primitives";
  import { parse_relational_vector, format_relational_vector } from "@utils";

  /**
   * @typedef {Object} Props
   * @property {any} entity - The central active entity.
   * @property {boolean} [is_editing=false] - Whether the profile is in edit mode.
   * @property {(selected: any) => void} [on_select_entity] - Callback when a satellite node is clicked.
   * @property {(relationships: string[]) => void} [on_update_relationships] - Callback when relationships are mutated in edit mode.
   * @property {string} [class] - Additional container class.
   */

  /** @type {Props} */
  let {
    entity,
    is_editing = false,
    show_add_form = $bindable(false),
    on_select_entity = () => {},
    on_update_relationships = () => {},
    class: custom_class = "",
  } = $props();

  let all_entities = $state([]);
  let hovered_edge = $state(null);
  let new_target_name = $state("");
  let new_dynamic = $state("");

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
    // 1. Exact match in all_entities
    const exact = all_entities.find((e) => norm(e.name) === n);
    if (exact) return exact;
    // 2. Word-boundary or token match in all_entities
    const token_match = all_entities.find((e) => {
      const en = norm(e.name);
      return en === n || en.split(/\s+/).includes(n) || n.split(/\s+/).includes(en);
    });
    if (token_match) return token_match;
    // 3. Match in premade catalog
    const pm = PREMADE_ENTITIES.find((e) => {
      const en = norm(e.name);
      return en === n || en.split(/\s+/).includes(n) || n.split(/\s+/).includes(en);
    });
    if (pm) return pm;
    return { name: target_name };
  }

  // 1. Resolve Outgoing & Incoming Edges relative to the central entity
  const resolved_edges = $derived.by(() => {
    if (!entity?.name) return [];
    const current_name = norm(entity.name);
    const edges = [];

    // A. Outgoing edges (stored directly on entity.relationships)
    const outgoing_raw = Array.isArray(entity.relationships) ? entity.relationships : [];
    for (const r of outgoing_raw) {
      const parsed = parse_relational_vector(r);
      if (parsed) {
        edges.push({
          ...parsed,
          is_outgoing: true,
          source_entity: entity,
          target_entity: find_matched_entity(parsed.target_name),
        });
      }
    }

    // B. Incoming edges (harvested from other entities pointing to current entity)
    for (const other of all_entities) {
      if (norm(other.name) === current_name) continue;
      const other_rels = Array.isArray(other.relationships) ? other.relationships : [];
      for (const r of other_rels) {
        const parsed = parse_relational_vector(r);
        if (parsed && norm(parsed.target_name) === current_name) {
          edges.push({
            ...parsed,
            is_outgoing: false,
            source_entity: other,
            target_entity: entity,
          });
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

  function handle_add_edge() {
    if (!new_target_name.trim() || !new_dynamic.trim() || !entity?.name) return;
    const clean_target = new_target_name.trim();
    const clean_dyn = new_dynamic.trim();
    const new_vector = format_relational_vector(entity.name, clean_target, clean_dyn);

    const existing = Array.isArray(entity.relationships) ? entity.relationships.slice() : [];
    const next_rels = [
      new_vector,
      ...existing.filter((r) => {
        const parsed = parse_relational_vector(r);
        return !parsed || norm(parsed.target_name) !== norm(clean_target);
      }),
    ].slice(0, 12);

    entity.relationships = next_rels;
    on_update_relationships(next_rels);
    new_target_name = "";
    new_dynamic = "";
    show_add_form = false;
  }

  function handle_delete_edge(raw_str) {
    if (!entity?.relationships) return;
    const next_rels = entity.relationships.filter((r) => r !== raw_str);
    entity.relationships = next_rels;
    on_update_relationships(next_rels);
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
      <p class="mt-1 max-w-xs text-[11px] text-slate-400">
        {is_editing
          ? "Add directed relational vectors to connect this entity to other characters or fractals in the mesh."
          : "This entity has not yet established directed bonds with other entities."}
      </p>
    </div>
  {:else}
    <!-- Radial Visual Constellation -->
    <div class="relative flex flex-col items-center justify-center overflow-visible py-2">
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
            <path
              d={ve.path_d}
              fill="none"
              stroke="transparent"
              stroke-width="18"
              class="pointer-events-auto cursor-help"
              onmouseenter={() => (hovered_edge = ve.edge)}
              onmouseleave={() => (hovered_edge = null)}
              use:tooltip={`${ve.edge.source_name} → ${ve.edge.target_name}: ${ve.edge.dynamic}`}
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
          <div
            class="relative flex h-14 w-14 items-center justify-center rounded-full border-2 bg-slate-900 shadow-xl transition-transform duration-300 hover:scale-105"
            style="border-color: {center_color}; box-shadow: 0 0 20px {center_color}33;"
          >
            {#if entity?.profile_picture}
              <img src={entity.profile_picture} alt={entity.name} class="h-full w-full rounded-full object-cover" />
            {:else}
              <span class="text-xs font-bold text-slate-200 uppercase">
                {(entity?.name || "?").slice(0, 2)}
              </span>
            {/if}
          </div>
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
                if (typeof on_select_entity === "function") {
                  on_select_entity(sat_entity);
                }
              }}
              use:tooltip={`${node.item.name} (Click to open profile)`}
              class="group relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 bg-slate-900 shadow-lg transition-all duration-300 hover:scale-115"
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
    </div>
  {/if}
</div>

<!-- Edit Mode: Create New Relationship Modal Form -->
{#if show_add_form}
  <div class="mt-4 w-full rounded-xl border border-slate-700/80 bg-slate-900/90 p-4 shadow-xl">
    <div class="mb-3 flex items-center justify-between">
      <span class="text-xs font-bold text-slate-200">Add Directed Relationship Bond</span>
      <button type="button" onclick={() => (show_add_form = false)} class="text-xs text-slate-400 hover:text-slate-200"> ✕ </button>
    </div>

    <div class="flex flex-col gap-3">
      <!-- Target Entity Selection -->
      <div>
        <label for="rel-target-select" class="mb-1 block text-[11px] font-semibold text-slate-300">Target Entity</label>
        <select
          id="rel-target-select"
          bind:value={new_target_name}
          class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-slate-500 focus:outline-none"
        >
          <option value="" disabled>Select connected character or fractal...</option>
          {#each all_entities.filter((e) => norm(e.name) !== norm(entity?.name)) as opt (opt.id || opt.name)}
            <option value={opt.name}>{opt.name} ({opt.type || "character"})</option>
          {/each}
        </select>
      </div>

      <!-- Relational Dynamic Description -->
      <div>
        <label for="rel-dynamic-desc" class="mb-1 block text-[11px] font-semibold text-slate-300">Relationship Dynamic</label>
        <input
          id="rel-dynamic-desc"
          type="text"
          bind:value={new_dynamic}
          placeholder="e.g. underground arms supplier, childhood mentor, rival hacker"
          class="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div class="mt-1 flex items-center justify-end gap-2">
        <button type="button" onclick={() => (show_add_form = false)} class="rounded-lg px-3 py-1 text-xs text-slate-400 hover:text-slate-200">
          Cancel
        </button>
        <button
          type="button"
          disabled={!new_target_name || !new_dynamic.trim()}
          onclick={handle_add_edge}
          class="rounded-lg border border-indigo-500/50 bg-indigo-600/80 px-3 py-1 text-xs font-semibold text-white shadow transition-colors hover:bg-indigo-500 disabled:opacity-40"
        >
          Save Bond
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Edit Mode: Existing Outgoing Bonds List (Matching Vector Instrument Style Exactly) -->
{#if is_editing && entity?.relationships && entity.relationships.length > 0}
  <div class="flex w-full flex-col gap-4" style="--accent-color: {center_color}">
    {#each entity.relationships as rel, i (i)}
      {@const parsed = parse_relational_vector(rel)}
      {@const current_target = parsed ? parsed.target_name : ""}
      {@const current_dynamic = parsed ? parsed.dynamic : rel}
      <div class="animate-[slide-down-item_400ms_cubic-bezier(0.23,1,0.32,1)_forwards]">
        <TextField
          is_edit={true}
          collapsed={false}
          signature_color={center_color}
          value={current_dynamic}
          placeholder="Enter relationship dynamic detail..."
          oninput={(e) => {
            const next_dyn = e.currentTarget.value;
            const target = parsed?.target_name || "Unknown";
            const next_rel = format_relational_vector(entity.name, target, next_dyn);
            const next_rels = entity.relationships.slice();
            next_rels[i] = next_rel;
            entity.relationships = next_rels;
            on_update_relationships(next_rels);
          }}
        >
          {#snippet status()}
            <div class="my-auto flex max-w-full min-w-0 items-center gap-2 text-left">
              <select
                value={current_target}
                onchange={(e) => {
                  const new_target = e.currentTarget.value;
                  const dyn = parsed?.dynamic || "";
                  const next_rel = format_relational_vector(entity.name, new_target, dyn);
                  const next_rels = entity.relationships.slice();
                  next_rels[i] = next_rel;
                  entity.relationships = next_rels;
                  on_update_relationships(next_rels);
                }}
                class="cursor-pointer rounded-sm border border-white/10 bg-white/10 px-1.5 py-0.5 font-sans text-xs font-normal tracking-normal text-white opacity-90 transition-opacity hover:opacity-100 focus:border-white/30 focus:outline-none"
              >
                {#if !current_target || !all_entities.some((e) => norm(e.name) === norm(current_target))}
                  <option value={current_target} class="bg-slate-900 text-slate-200">{current_target || "Select target..."}</option>
                {/if}
                {#each all_entities.filter((e) => norm(e.name) !== norm(entity?.name)) as opt (opt.id || opt.name)}
                  <option value={opt.name} class="bg-slate-900 text-slate-200">{opt.name} ({opt.type || "character"})</option>
                {/each}
              </select>
            </div>
          {/snippet}

          {#snippet header_actions()}
            <Button
              variant="invisible"
              size="small"
              square
              actions={[tooltip]}
              tooltip="Remove Bond"
              aria-label="Remove Bond"
              onclick={(e) => {
                e.stopPropagation();
                handle_delete_edge(rel);
              }}
            >
              <svg viewBox="0 0 24 24" class="size-icon-small fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
                <polyline points="3 6 5 6 21 6" stroke="currentColor"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor"></path>
              </svg>
            </Button>
          {/snippet}
        </TextField>
      </div>
    {/each}
  </div>
{/if}
