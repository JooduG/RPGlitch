<!--
  src/ui/profile/RelationalGraph.svelte
  🌐 RADIAL RELATIONAL CONSTELLATION GRAPH

  Visualizes outgoing & incoming relationship vectors for an entity in a sleek
  radial constellation.
  - Center Sun Node: The current active entity (@ID); hovering highlights incoming arrows and shows incoming bonds.
  - Satellite Nodes: Surrounding related entities (@ID); hovering lights up the outgoing arrow and triggers the global Tooltip EntityCard preview.
  - SVG Curved Arcs: Directional arrows colored with the source entity's signature color.
  - Navigation: Clicking a satellite node triggers on_select_entity(entity).
-->
<script>
  import { list_entities } from "@data";
  import { extract_entity_relationships } from "@simulation";
  import { app, session } from "@state";
  import { open_image_preview } from "./ImagePreview.svelte.js";
  import { get_signature_color, render_display_macros } from "@utils";
  import { Icon, pin_tooltip_menu, tooltip } from "@primitives";
  import { build_entity_preview_actions } from "./ContextMenu.svelte.js";
  import ProfilePicture from "./ProfilePicture.svelte";

  /**
   * @typedef {Object} Props
   * @property {any} entity - The central active entity.
   * @property {(selected: any) => void} [on_select_entity] - Callback when a satellite node is clicked.
   * @property {string} [class] - Additional container class.
   */

  /** @type {Props} */
  let { entity, on_select_entity = () => {}, class: custom_class = "" } = $props();

  let db_entities = $state([]);
  let hovered_edge = $state(null);
  let hovered_node = $state(null);
  let center_hovered = $state(false);

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

  // Load all known characters and fractals from DB to resolve incoming relationships and satellite entity profiles
  $effect(() => {
    Promise.all([list_entities("character"), list_entities("fractal")]).then(([chars, fracs]) => {
      db_entities = [...chars, ...fracs];
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

  const all_entities = $derived.by(() => {
    const seen = new Set();
    const merged = [];
    const pool = [
      ...db_entities,
      session.active_ai,
      session.active_user,
      session.active_fractal,
      ...(app.ai_list || []),
      ...(app.user_list || []),
      ...(app.fractal_list || []),
    ];
    for (const item of pool) {
      if (!item) continue;
      const key = norm(item.id) || norm(item.name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
    return merged;
  });

  const display_entities = $derived({
    AI: session.active_ai || app.selected_ai,
    USER: session.active_user || app.selected_user,
    FRACTAL: session.active_fractal || app.selected_fractal,
    ALL: all_entities,
  });

  function collect_bracket_items(links_list, force_hidden = false) {
    const items = [];
    const seen = new Set();
    const list = Array.isArray(links_list) ? links_list : [links_list];
    for (const links of list) {
      if (!links) continue;
      for (const [quadrant, bucket] of [
        ["present", links.present],
        ["eternal", links.eternal],
        ["past", links.past],
        ["future", links.future],
      ]) {
        if (!Array.isArray(bucket)) continue;
        for (const raw_entry of bucket) {
          const text = String(raw_entry || "").trim();
          if (!text) continue;
          const match = text.match(/^\[([^:\]]+):([\s\S]*)\]$/);
          const key = match ? match[1].trim() : "BOND";
          const raw_val = match ? match[2].trim() : text;
          const is_hidden = force_hidden || /(?:^|\s)\|(?:\s*(?:hide|private)\b)/i.test(raw_val);
          const value = clean_dynamic_text(raw_val);
          if (!value) continue;
          const dedupe_key = `${quadrant}:${key.toUpperCase()}:${value}`;
          if (seen.has(dedupe_key)) continue;
          seen.add(dedupe_key);
          items.push({ key, value, is_hidden, quadrant });
        }
      }
    }
    return items;
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
    return { name: target_name.replace(/_/g, " ") };
  }

  // 1. Resolve Outgoing & Incoming Edges relative to the central entity
  const resolved_edges = $derived.by(() => {
    if (!entity?.name) return [];
    const current_name = norm(entity.name);
    const current_id = norm(entity.id);
    const incoming_perspective = app?.settings?.dev_mode ? "omniscient" : "other";
    const edges = [];

    const summarize_links = (links) => links?.present?.[0] || links?.eternal?.[0] || links?.past?.[0] || links?.future?.[0] || "Connected";

    // Harvest bracket relationships for the central entity across all 6 quadrant fields
    const bracket_rel_map = extract_entity_relationships(entity, all_entities, "owner");

    // Outgoing edges (harvested from central entity's value-referenced brackets)
    for (const [target_key, links] of bracket_rel_map) {
      const target_norm = norm(target_key);
      if (target_norm === current_name || (current_id && target_norm === current_id)) continue;
      const target_entity = find_matched_entity(target_key);
      const dynamic = summarize_links(links);
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

    // B. Incoming edges (harvested from other entities pointing to current entity, respecting Epistemic Wall)
    for (const other of all_entities) {
      if (norm(other.name) === current_name || (current_id && norm(other.id) === current_id)) continue;
      const other_bracket_map = extract_entity_relationships(other, [entity], incoming_perspective);
      for (const [key, links] of other_bracket_map) {
        const key_norm = norm(key);
        if (key_norm === current_name || (current_id && key_norm === current_id)) {
          const dynamic = summarize_links(links);
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
      if (!key || key === current_name) continue;
      let existing = map.get(key);
      if (!existing) {
        existing = { name: resolved?.name || other_name, entity: resolved, outgoing_links: [], incoming_links: [], is_incoming_only: false, bracket_items: [] };
        map.set(key, existing);
      }
      if (edge.temporal_links) {
        if (edge.is_outgoing) {
          existing.outgoing_links.push(edge.temporal_links);
        } else {
          existing.incoming_links.push(edge.temporal_links);
        }
      }
    }

    for (const node_item of map.values()) {
      const is_incoming_only = node_item.outgoing_links.length === 0 && node_item.incoming_links.length > 0;
      node_item.is_incoming_only = is_incoming_only;
      node_item.bracket_items = is_incoming_only ? [] : collect_bracket_items(node_item.outgoing_links, false);
    }

    return Array.from(map.values());
  });

  const incoming_edges = $derived(resolved_edges.filter((edge) => !edge.is_outgoing));

  const incoming_tooltip_text = $derived(
    incoming_edges
      .map(
        (edge) =>
          `@${get_entity_slug(edge.source_entity || { name: edge.source_name })}: ${render_display_macros(clean_dynamic_text(edge.dynamic), edge.source_entity, display_entities)}`,
      )
      .join("\n"),
  );

  // Reset hover states when navigating to a different central entity
  $effect(() => {
    void (entity?.id || entity?.name);
    hovered_node = null;
    hovered_edge = null;
    center_hovered = false;
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
    <div
      class="flex w-full flex-col items-center justify-center rounded-standard border border-white/10 bg-glass-sunken p-6 text-center [backdrop-filter:var(--blur-mist)]">
      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-frisk/60">
        <Icon name="relations" class="size-5" />
      </div>
      <span class="mt-tight text-xs font-semibold text-frisk/80">No recorded relationships yet</span>
      <p class="mt-tight max-w-xs text-xs text-frisk/55">This entity has not yet established directed bonds with other entities.</p>
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
            {@const is_highlighted =
              hovered_edge === ve.edge ||
              (center_hovered && !ve.is_outgoing) ||
              (Boolean(hovered_node) && ve.is_outgoing && norm(ve.edge.target_name) === norm(hovered_node.name))}
            {@const edge_tooltip =
              ve.is_outgoing ?
                `@${get_entity_slug(ve.edge.source_entity)} → @${get_entity_slug(ve.edge.target_entity)}: ${render_display_macros(clean_dynamic_text(ve.edge.dynamic), ve.edge.source_entity, display_entities)}`
              : ""}
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
              use:tooltip={edge_tooltip || null} />
            <!-- Visible Styled Curve Path -->
            <path
              d={ve.path_d}
              fill="none"
              stroke={ve.color}
              stroke-width={is_highlighted ? "2.75" : "1.75"}
              stroke-opacity={is_highlighted ? "1" : "0.75"}
              marker-end="url(#marker-{ve.id})"
              class="pointer-events-none transition-[stroke-opacity,filter] duration-fast"
              filter={is_highlighted ? "url(#mesh-glow)" : undefined} />
          {/each}
        </svg>

        <!-- Center "Sun" Node (Active Profile Entity - Incoming Relationships Hub) -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
          data-testid="relational-center-node"
          class="absolute z-10 flex flex-col items-center justify-center"
          style="left: {cx}px; top: {cy}px; transform: translate(-50%, -50%);"
          use:tooltip={incoming_tooltip_text || null}
          onpointerenter={() => (center_hovered = true)}
          onpointerleave={() => (center_hovered = false)}
          onmouseenter={() => (center_hovered = true)}
          onmouseleave={() => (center_hovered = false)}>
          <div
            class={[
              "relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 bg-glass-sunken shadow-standard transition-transform duration-fast",
              center_hovered && incoming_edges.length ? "scale-lift" : "",
            ]}
            style="border-color: {center_color}; box-shadow: 0 0 20px color-mix(in srgb, {center_color} 25%, transparent);">
            <ProfilePicture {entity} class="rounded-full" />
          </div>
          <span class="mt-tight max-w-22.5 truncate text-center font-mono text-xs font-bold drop-shadow-md" style="color: {center_color};">
            @{get_entity_slug(entity) || "ACTIVE"}
          </span>
        </div>

        <!-- Surrounding Satellite Nodes -->
        {#each Array.from(node_positions.values()) as node (node.item.name)}
          {@const sat_entity = node.item.entity}
          {@const sat_color = get_signature_color(sat_entity)}
          {@const sat_handle = `@${get_entity_slug(sat_entity || node.item)}`}
          <div
            data-testid="relational-satellite-node"
            class="absolute z-10 flex flex-col items-center justify-center transition-opacity duration-fast {node.item.is_incoming_only ?
              'opacity-muted grayscale hover:opacity-100'
            : ''}"
            style="left: {node.x}px; top: {node.y}px; transform: translate(-50%, -50%);">
            <button
              type="button"
              aria-label={`Open profile for ${node.item.name} (${sat_handle})`}
              use:tooltip={{
                entity: sat_entity || { name: node.item.name },
                text: node.item.name,
                bracket_items: node.item.bracket_items,
                description_owner: entity,
                incoming_only: node.item.is_incoming_only,
                delay: 0,
              }}
              onpointerenter={() => (hovered_node = node.item)}
              onpointerleave={() => (hovered_node = null)}
              onmouseenter={() => (hovered_node = node.item)}
              onmouseleave={() => (hovered_node = null)}
              onfocus={() => (hovered_node = node.item)}
              onblur={() => (hovered_node = null)}
              onclick={() => {
                if (typeof on_select_entity === "function") {
                  on_select_entity(sat_entity || node.item.entity || { name: node.item.name });
                }
              }}
              oncontextmenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const target_entity = sat_entity || { name: node.item.name };
                const actions = build_entity_preview_actions(target_entity, {
                  on_open_profile: (ent) => {
                    if (typeof on_select_entity === "function") on_select_entity(ent);
                  },
                  on_open_image_preview: (payload) => open_image_preview(payload),
                });
                pin_tooltip_menu(e.currentTarget, {
                  entity: target_entity,
                  text: node.item.name,
                  bracket_items: node.item.bracket_items,
                  description_owner: entity,
                  incoming_only: node.item.is_incoming_only,
                  actions,
                  x: e.clientX,
                  y: e.clientY,
                });
              }}
              class="group flex cursor-pointer flex-col items-center justify-center focus:outline-hidden">
              <div
                class="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 bg-glass-sunken shadow-standard transition-transform duration-fast group-hover:scale-lift"
                style="border-color: {sat_color}; box-shadow: 0 0 12px color-mix(in srgb, {sat_color} 20%, transparent);">
                <ProfilePicture entity={sat_entity || node.item} class="rounded-full" />
              </div>
              <span class="mt-tight max-w-20 truncate text-center font-mono text-xs font-bold drop-shadow-md" style="color: {sat_color};">
                {sat_handle}
              </span>
            </button>
          </div>
        {/each}
      </div>
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
