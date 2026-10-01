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
  import { TextField, tooltip } from "@primitives";
  import { extract_entity_relationships, apply_bracket_mutation } from "@intelligence";

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

  function handle_add_edge() {
    if (!new_target_name.trim() || !new_dynamic.trim() || !entity?.name) return;
    const clean_target = new_target_name.trim();
    const clean_dyn = new_dynamic.trim();

    // Mutate universal bracket predicates in present.non_physical
    if (!entity.present) entity.present = {};
    const target_identifier = clean_target.startsWith("@") ? clean_target : `@${clean_target}`;
    const mutation = apply_bracket_mutation(entity.present.non_physical || "", `[${target_identifier}: ${clean_dyn}]`);
    entity.present.non_physical = mutation.text;

    on_update_relationships();
    new_target_name = "";
    new_dynamic = "";
    show_add_form = false;
  }

  function handle_delete_edge(target_name) {
    console.log("handle_delete_edge called with target_name:", target_name, "entity:", entity);
    if (!target_name || !entity?.present) return;
    const clean_target = String(target_name).trim();
    const target_identifier = clean_target.startsWith("@") ? clean_target : `@${clean_target}`;

    // Purge corresponding target bracket from present.non_physical via atomic [TARGET: none] directive
    const mutation = apply_bracket_mutation(entity.present.non_physical || "", `[${target_identifier}: none]`);
    console.log("handle_delete_edge mutation result:", mutation);
    entity.present.non_physical = mutation.text;

    on_update_relationships();
  }

  function handle_update_edge_dynamic(target_name, new_dyn) {
    if (!target_name || !entity?.present) return;
    const clean_target = String(target_name).trim();
    const target_identifier = clean_target.startsWith("@") ? clean_target : `@${clean_target}`;

    const mutation = apply_bracket_mutation(entity.present.non_physical || "", `[${target_identifier}: ${String(new_dyn || "").trim()}]`);
    entity.present.non_physical = mutation.text;

    on_update_relationships();
  }

  function handle_retarget_edge(old_target, new_target, dyn) {
    if (!old_target || !new_target || !entity?.present) return;
    const old_identifier = String(old_target).trim().startsWith("@") ? String(old_target).trim() : `@${String(old_target).trim()}`;
    const new_identifier = String(new_target).trim().startsWith("@") ? String(new_target).trim() : `@${String(new_target).trim()}`;

    // Atomically clear old and apply new
    let text = entity.present.non_physical || "";
    text = apply_bracket_mutation(text, `[${old_identifier}: none]`).text;
    text = apply_bracket_mutation(text, `[${new_identifier}: ${String(dyn || "").trim()}]`).text;
    entity.present.non_physical = text;

    on_update_relationships();
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
              use:tooltip={format_node_tooltip(node.item)}
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

<!-- Edit Mode: Existing Outgoing Bonds List (Derived directly from universal bracket predicates) -->
{#if is_editing}
  {@const outgoing_edges = resolved_edges.filter((e) => e.is_outgoing)}
  {#if outgoing_edges.length > 0}
    <div class="flex w-full flex-col gap-4" style="--accent-color: {center_color}">
      {#each outgoing_edges as edge, i (edge.target_name || i)}
        {@const current_target = edge.target_name || ""}
        {@const current_dynamic = edge.dynamic || ""}
        <div class="flex animate-[slide-down-item_400ms_cubic-bezier(0.23,1,0.32,1)_forwards] items-start gap-1.5">
          <!-- Delete button rendered directly in component template (not inside snippet) for reliable event binding -->
          <button
            type="button"
            aria-label="Remove Bond"
            use:tooltip={"Remove Bond"}
            class="mt-1 inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded p-0.5 text-slate-400 transition-all duration-150 hover:bg-white/20 hover:text-white active:scale-95"
            onclick={() => handle_delete_edge(current_target)}
          >
            <svg viewBox="0 0 24 24" class="size-3.5 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]">
              <polyline points="3 6 5 6 21 6" stroke="currentColor"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor"></path>
            </svg>
          </button>
          <div class="min-w-0 flex-1">
            <TextField
              is_edit={true}
              collapsed={false}
              signature_color={center_color}
              value={current_dynamic}
              placeholder="Enter relationship dynamic detail..."
              oninput={(e) => {
                handle_update_edge_dynamic(current_target, e.currentTarget.value);
              }}
            >
              {#snippet status()}
                <div class="my-auto flex max-w-full min-w-0 items-center gap-2 text-left">
                  <select
                    value={current_target}
                    onchange={(e) => {
                      handle_retarget_edge(current_target, e.currentTarget.value, current_dynamic);
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
            </TextField>
          </div>
        </div>
      {/each}
    </div>
  {/if}
{/if}

<!--
  CHANGELOG
  ============================================================================
  - 2026-10-01: Universal Predicates Migration — edit list and constellation nodes
    are driven 100% by universal bracket predicates (`present.non_physical`).
    Purged legacy `entity.relationships` array references under P4 Zero Backwards
    Compatibility.
  - 2026-09-30: Synchronized handle_delete_edge into present.non_physical via atomic
    [TARGET: none] bracket mutation, preventing stale bracket shadow drift.
  - 2026-09-29: Initial implementation of radial relational constellation graph.
  ============================================================================
-->
