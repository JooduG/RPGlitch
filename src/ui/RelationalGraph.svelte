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
  import { list_entities } from "@data";
  import { extract_entity_relationships } from "@simulation";
  import { get_signature_color } from "@utils";
  import { tooltip } from "@primitives";
  import { ALL_PREMADES } from "@definitions";
  import ProfilePicture from "./ProfilePicture.svelte";

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
  let hovered_node = $state(null);

  function get_entity_slug(ent) {
    if (!ent) return "";
    const raw = ent.id || ent.name || "";
    return String(raw)
      .toUpperCase()
      .replace(/[^A-Z0-9_-]/g, "_");
  }

  function clean_dynamic_text(text) {
    if (!text || typeof text !== "string") return "";
    return text
      .replace(/\s*\|\s*(?:hide|show|private)\b/gi, "")
      .replace(/\s*\|\s*w:\s*\d+\b/gi, "")
      .trim();
  }

  // Load all known characters and fractals to resolve incoming relationships and satellite entity profiles
  $effect(() => {
    Promise.all([list_entities("character"), list_entities("fractal")]).then(([chars, fracs]) => {
      const combined = [...chars, ...fracs];
      // Merge with premades so uninstantiated premades can still be clicked / mapped
      const seen_ids = new Set(combined.map((e) => e.id));
      for (const p of ALL_PREMADES) {
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
    const pm = ALL_PREMADES.find((e) => {
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
        map.set(key, { name: resolved?.name || other_name, entity: resolved, temporal_links: edge.temporal_links || null });
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

  const center_color = $derived(get_signature_color(entity));
</script>

<div class="relative flex w-full items-center justify-center {custom_class}">
  {#if resolved_edges.length === 0}
    <!-- Empty State -->
    <div class="flex w-full flex-col items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-950/40 p-6 text-center backdrop-blur-md">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800/60 text-slate-400">
        <svg viewBox="0 0 24 24" class="h-5 w-5 fill-none stroke-current stroke-2">
          <circle cx="12" cy="12" r="3" />
          <circle cx="4" cy="12" r="2" />
          <circle cx="20" cy="12" r="2" />
          <path d="M6 12h3m6 0h3" />
        </svg>
      </div>
      <span class="mt-tight text-xs font-semibold text-slate-300">No recorded relationships yet</span>
      <p class="mt-tight max-w-xs text-[11px] text-slate-400">This entity has not yet established directed bonds with other entities.</p>
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
            <path
              d={ve.path_d}
              fill="none"
              stroke="transparent"
              stroke-width="18"
              class="pointer-events-auto cursor-pointer"
              onmouseenter={() => (hovered_edge = ve.edge)}
              onmouseleave={() => (hovered_edge = null)}
              use:tooltip={`${ve.edge.source_name} → ${ve.edge.target_name}: ${clean_dynamic_text(ve.edge.dynamic)}`} />
            <!-- Visible Styled Curve Path -->
            <path
              d={ve.path_d}
              fill="none"
              stroke={ve.color}
              stroke-width={hovered_edge === ve.edge ? "2.75" : "1.75"}
              stroke-opacity={hovered_edge === ve.edge ? "1" : "0.75"}
              marker-end="url(#marker-{ve.id})"
              class="pointer-events-none transition-[stroke-opacity,filter] duration-200"
              filter={hovered_edge === ve.edge ? "url(#mesh-glow)" : undefined} />
          {/each}
        </svg>

        <!-- Center Node (Active Profile Entity) -->
        <div class="absolute z-10 flex flex-col items-center justify-center" style="left: {cx}px; top: {cy}px; transform: translate(-50%, -50%);">
          <div
            class="relative flex h-14 w-14 items-center justify-center rounded-full border-2 bg-slate-900 shadow-xl"
            style="border-color: {center_color}; box-shadow: 0 0 20px {center_color}33;">
            {#if entity?.profile_picture}
              <img src={entity.profile_picture} alt={entity.name} class="h-full w-full rounded-full object-cover" />
            {:else}
              <span class="text-xs font-bold text-slate-200 uppercase">
                {(entity?.name || "?").slice(0, 2)}
              </span>
            {/if}
          </div>
          <span class="mt-tight max-w-22.5 truncate text-center text-[11px] font-bold text-slate-200 drop-shadow-md">
            {entity?.name || "Active"}
          </span>
        </div>

        <!-- Surrounding Satellite Nodes -->
        {#each Array.from(node_positions.values()) as node (node.item.name)}
          {@const sat_entity = node.item.entity}
          {@const sat_color = get_signature_color(sat_entity)}
          <div class="absolute z-10 flex flex-col items-center justify-center" style="left: {node.x}px; top: {node.y}px; transform: translate(-50%, -50%);">
            <button
              type="button"
              aria-label={`Open profile for ${node.item.name}`}
              onmouseenter={() => (hovered_node = node.item)}
              onmouseleave={() => (hovered_node = null)}
              onfocus={() => (hovered_node = node.item)}
              onblur={() => (hovered_node = null)}
              onclick={() => {
                if (typeof on_select_entity === "function") {
                  on_select_entity(sat_entity || node.item.entity || { name: node.item.name });
                }
              }}
              class="group relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border-2 bg-slate-900 shadow-lg transition-transform duration-fast hover:scale-lift focus:outline-hidden"
              style="border-color: {sat_color}; box-shadow: 0 0 12px {sat_color}22;">
              {#if sat_entity?.profile_picture}
                <img src={sat_entity.profile_picture} alt={node.item.name} class="h-full w-full rounded-full object-cover" />
              {:else}
                <span class="text-[10px] font-bold text-slate-300 uppercase">
                  {node.item.name.slice(0, 2)}
                </span>
              {/if}
            </button>
            <span class="mt-tight max-w-20 truncate text-center text-[10px] font-medium text-slate-400 group-hover:text-slate-200">
              {node.item.name}
            </span>
          </div>
        {/each}
      </div>

      <!-- CardHand-sized Hover Preview Card -->
      {#if hovered_node}
        {@const hover_ent = hovered_node.entity}
        {@const hover_color = get_signature_color(hover_ent)}
        {@const is_fractal = hover_ent?.type === "fractal"}
        {@const hover_dynamic = clean_dynamic_text(
          hovered_node.temporal_links?.present ||
            hovered_node.temporal_links?.eternal ||
            hovered_node.temporal_links?.past?.[0] ||
            hovered_node.temporal_links?.future ||
            "",
        )}
        <div
          data-testid="relational-hover-card"
          class="pointer-events-none absolute right-2 bottom-2 z-30 flex flex-col overflow-hidden rounded-standard border bg-glass-elevated shadow-standard backdrop-blur-md {(
            is_fractal
          ) ?
            'h-[calc(var(--spacing-fractal-card-height)*0.5)] w-[calc(var(--spacing-fractal-card-width)*0.5)]'
          : 'h-[calc(var(--spacing-character-card-height)*0.5)] w-[calc(var(--spacing-character-card-width)*0.5)]'}"
          style:--signature-color={hover_color}
          style:border-color="color-mix(in srgb, var(--signature-color) 55%, transparent)">
          <div class="relative h-full w-full overflow-hidden">
            {#if hover_ent}
              <ProfilePicture entity={hover_ent} />
            {/if}
            <div class="absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end bg-linear-to-t from-black/95 via-black/75 to-transparent p-tight text-left">
              <span class="truncate font-heading text-xs font-bold uppercase" style="color: {hover_color};">
                {hovered_node.name}
              </span>
              <span class="font-mono text-[9px] text-slate-400">
                @{get_entity_slug(hover_ent || hovered_node)}
              </span>
              {#if hover_dynamic}
                <p class="mt-0.5 line-clamp-2 text-[10px] leading-snug text-slate-200">
                  {hover_dynamic}
                </p>
              {/if}
            </div>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<!--
  CHANGELOG
  ============================================================================
  - 2026-10-14: Atom 3.5 - 360° Relational Dossier & Omniscient Observer Mode.
    Interactive glassmorphic dossier card displaying 4-layer state (eternal,
    present, past, future) on node and edge click; visual epistemic lock badge
    for concealed `| hide` brackets.
  - 2026-10-01: Universal Predicates Migration - edit list and constellation nodes
    are driven 100% by universal bracket predicates (`present.non_physical`).
    Purged legacy `entity.relationships` array references under P4 Zero Backwards
    Compatibility.
  - 2026-09-30: Synchronized handle_delete_edge into present.non_physical via atomic
    [TARGET: none] bracket mutation, preventing stale bracket shadow drift.
  - 2026-09-29: Initial implementation of radial relational constellation graph.
  ============================================================================
-->
