<script module>
  let graph_uid = 0;
  function next_graph_uid() {
    graph_uid += 1;
    return graph_uid;
  }

  const SIZE = 380;
  const CENTER = SIZE / 2;
  const RADIUS = 135;
  const NODE_RADIUS = 22;

  const norm = (name) =>
    String(name || "")
      .trim()
      .toLowerCase();

  function clean_dynamic_text(text) {
    if (!text || typeof text !== "string") return "";
    return text
      .replace(/\s*\|\s*(?:hide|show|private)\b/gi, "")
      .replace(/\s*\|\s*w:\s*\d+\b/gi, "")
      .trim();
  }

  function summarize_links(links) {
    return links?.present?.[0] || links?.eternal?.[0] || links?.past?.[0] || links?.future?.[0] || "Connected";
  }
</script>

<script>
  /**
   * @file src/ui/organisms/RelationalGraph.svelte
   * Radial relationship constellation graph visualizing outgoing and incoming entity bonds.
   */
  import { Avatar, Icon, pin_tooltip_menu, tooltip } from "@atoms";
  import { list_entities } from "@data";
  import { extract_entity_relationships, parse_relationship_brackets } from "@simulation";
  import { app, session } from "@state";
  import { entity_avatar_props, format_entity_handle, get_signature_color, match_entity_in_roster, render_display_macros } from "@utils";

  let { entity, on_select_entity = () => {}, class: custom_class = "" } = $props();

  const uid = next_graph_uid();
  let fallback_db_entities = $state([]);
  let hovered_edge = $state(null);
  let hovered_node = $state(null);
  let center_hovered = $state(false);

  $effect(() => {
    if (app.entities_loaded) return;
    let cancelled = false;
    Promise.all([list_entities("character"), list_entities("fractal")]).then(([chars, fracs]) => {
      if (!cancelled) fallback_db_entities = [...chars, ...fracs];
    });
    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    void (entity?.id || entity?.name);
    hovered_node = null;
    hovered_edge = null;
    center_hovered = false;
  });

  const all_entities = $derived.by(() => {
    const seen = new Set();
    const merged = [];
    const pool = [...(session.known_entities || []), ...fallback_db_entities];
    for (const item of pool) {
      if (!item) continue;
      const key = norm(item.id) || norm(item.name);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      merged.push(item);
    }
    return merged;
  });

  const roster_context = $derived({ ...session.display_entities, ALL: all_entities });

  function resolve_target_entity(target_name) {
    if (!target_name) return null;
    return match_entity_in_roster(target_name, roster_context, entity) || { name: String(target_name).replace(/_/g, " ") };
  }

  const resolved_edges = $derived.by(() => {
    if (!entity?.name) return [];
    const current_name = norm(entity.name);
    const current_id = norm(entity.id);
    const is_self = (k) => k === current_name || (Boolean(current_id) && k === current_id);
    const incoming_perspective = app?.settings?.dev_mode ? "omniscient" : "other";
    const edges = [];

    for (const [target_key, links] of extract_entity_relationships(entity, all_entities, "owner")) {
      if (is_self(norm(target_key))) continue;
      const target_entity = resolve_target_entity(target_key);
      edges.push({
        source_name: entity.name,
        target_name: target_entity?.name || target_key,
        dynamic: summarize_links(links),
        is_outgoing: true,
        source_entity: entity,
        target_entity,
        temporal_links: links,
      });
    }

    for (const other of all_entities) {
      if (is_self(norm(other.name)) || (other.id && is_self(norm(other.id)))) continue;
      for (const [key, links] of extract_entity_relationships(other, [entity], incoming_perspective)) {
        if (!is_self(norm(key))) continue;
        edges.push({
          source_name: other.name,
          target_name: entity.name,
          dynamic: summarize_links(links),
          is_outgoing: false,
          source_entity: other,
          target_entity: entity,
          temporal_links: links,
        });
        break;
      }
    }

    return edges;
  });

  const satellite_nodes = $derived.by(() => {
    if (!entity?.name) return [];
    const current_name = norm(entity.name);
    const map = new Map();

    for (const edge of resolved_edges) {
      const other_name = edge.is_outgoing ? edge.target_name : edge.source_name;
      const other_entity = edge.is_outgoing ? edge.target_entity : edge.source_entity;
      const resolved = other_entity?.id ? other_entity : resolve_target_entity(other_name);
      const key = norm(resolved?.name || other_name);
      if (!key || key === current_name) continue;

      let existing = map.get(key);
      if (!existing) {
        existing = { name: resolved?.name || other_name, entity: resolved, outgoing_links: [], incoming_links: [] };
        map.set(key, existing);
      }
      if (edge.temporal_links) (edge.is_outgoing ? existing.outgoing_links : existing.incoming_links).push(edge.temporal_links);
    }

    const items = Array.from(map.values());
    return items.map((item, idx) => {
      const is_incoming_only = item.outgoing_links.length === 0 && item.incoming_links.length > 0;
      const angle = (idx * 2 * Math.PI) / items.length - Math.PI / 2;
      const sat_entity = item.entity;
      const bracket_items = is_incoming_only ? [] : parse_relationship_brackets(item.outgoing_links, false);
      return {
        ...item,
        key: norm(item.name),
        is_incoming_only,
        bracket_items,
        x: CENTER + RADIUS * Math.cos(angle),
        y: CENTER + RADIUS * Math.sin(angle),
        color: get_signature_color(sat_entity),
        handle: format_entity_handle(sat_entity, item.name),
        preview_payload: { entity: sat_entity || { name: item.name }, bracket_items, description_owner: entity, incoming_only: is_incoming_only },
      };
    });
  });

  const visual_edges = $derived.by(() => {
    const pos_by_key = new Map(satellite_nodes.map((n) => [n.key, n]));
    const pair_counts = new Map();
    for (const e of resolved_edges) {
      const other = norm(e.is_outgoing ? e.target_name : e.source_name);
      pair_counts.set(other, (pair_counts.get(other) || 0) + 1);
    }

    const list = [];
    for (const edge of resolved_edges) {
      const other_key = norm(edge.is_outgoing ? edge.target_name : edge.source_name);
      const pos = pos_by_key.get(other_key);
      if (!pos) continue;

      const p_start = edge.is_outgoing ? { x: CENTER, y: CENTER } : { x: pos.x, y: pos.y };
      const p_end = edge.is_outgoing ? { x: pos.x, y: pos.y } : { x: CENTER, y: CENTER };
      const dx = p_end.x - p_start.x;
      const dy = p_end.y - p_start.y;
      const dist = Math.hypot(dx, dy) || 1;
      const ux = dx / dist;
      const uy = dy / dist;

      const start_x = p_start.x + ux * (NODE_RADIUS + 4);
      const start_y = p_start.y + uy * (NODE_RADIUS + 4);
      const end_x = p_end.x - ux * (NODE_RADIUS + 6);
      const end_y = p_end.y - uy * (NODE_RADIUS + 6);

      const is_bidirectional = (pair_counts.get(other_key) || 0) > 1;
      const path_d =
        is_bidirectional ?
          `M ${start_x.toFixed(1)} ${start_y.toFixed(1)} Q ${((start_x + end_x) / 2 - uy * 24).toFixed(1)} ${((start_y + end_y) / 2 + ux * 24).toFixed(1)} ${end_x.toFixed(1)} ${end_y.toFixed(1)}`
        : `M ${start_x.toFixed(1)} ${start_y.toFixed(1)} L ${end_x.toFixed(1)} ${end_y.toFixed(1)}`;

      list.push({
        edge,
        marker_id: `rel-m-${uid}-${list.length}`,
        color: get_signature_color(edge.source_entity),
        path_d,
        is_outgoing: edge.is_outgoing,
        target_key: norm(edge.target_name),
        tooltip_text:
          edge.is_outgoing ?
            `${format_entity_handle(edge.source_entity)} → ${format_entity_handle(edge.target_entity)}: ${render_display_macros(clean_dynamic_text(edge.dynamic), edge.source_entity, roster_context)}`
          : null,
      });
    }
    return list;
  });

  const incoming_edges = $derived(resolved_edges.filter((edge) => !edge.is_outgoing));
  const incoming_tooltip_text = $derived(
    incoming_edges
      .map(
        (edge) =>
          `${format_entity_handle(edge.source_entity, edge.source_name)}: ${render_display_macros(clean_dynamic_text(edge.dynamic), edge.source_entity, roster_context)}`,
      )
      .join("\n") || null,
  );
  const center_color = $derived(get_signature_color(entity));
</script>

<div class={["relative flex w-full items-center justify-center", custom_class]}>
  {#if resolved_edges.length === 0}
    <div
      class="flex w-full flex-col items-center justify-center rounded-standard border border-white/10 bg-glass-sunken p-6 text-center [backdrop-filter:var(--blur-mist)]">
      <div class="flex size-10 items-center justify-center rounded-full bg-white/5 text-frisk/60">
        <Icon name="relations" class="size-5" />
      </div>
      <span class="mt-tight text-xs font-semibold text-frisk/80">No recorded relationships yet</span>
      <p class="mt-tight max-w-xs text-xs text-frisk/55">This entity has not yet established directed bonds with other entities.</p>
    </div>
  {:else}
    <div class="relative flex items-center justify-center overflow-visible" style:width="{SIZE}px" style:height="{SIZE}px">
      <svg class="absolute inset-0 z-0 size-full overflow-visible" viewBox="0 0 {SIZE} {SIZE}">
        <defs>
          <filter id="mesh-glow-{uid}" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {#each visual_edges as ve (ve.marker_id)}
            <marker id={ve.marker_id} viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill={ve.color} opacity="0.9" />
            </marker>
          {/each}
        </defs>

        {#each visual_edges as ve (ve.marker_id)}
          {@const is_highlighted =
            hovered_edge === ve.edge || (center_hovered && !ve.is_outgoing) || (hovered_node != null && ve.is_outgoing && ve.target_key === hovered_node.key)}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <path
            d={ve.path_d}
            fill="none"
            stroke="transparent"
            stroke-width="18"
            class="pointer-events-auto cursor-pointer"
            onpointerenter={() => (hovered_edge = ve.edge)}
            onpointerleave={() => (hovered_edge = null)}
            use:tooltip={ve.tooltip_text} />
          <path
            d={ve.path_d}
            fill="none"
            stroke={ve.color}
            stroke-width={is_highlighted ? "2.75" : "1.75"}
            stroke-opacity={is_highlighted ? "1" : "0.75"}
            marker-end="url(#{ve.marker_id})"
            class="pointer-events-none transition-[stroke-opacity,filter] duration-fast"
            filter={is_highlighted ? `url(#mesh-glow-${uid})` : undefined} />
        {/each}
      </svg>

      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        data-testid="relational-center-node"
        class="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center"
        style:left="{CENTER}px"
        style:top="{CENTER}px"
        use:tooltip={incoming_tooltip_text}
        onpointerenter={() => (center_hovered = true)}
        onpointerleave={() => (center_hovered = false)}>
        <div
          class={[
            "relative flex size-14 items-center justify-center overflow-hidden rounded-full border-2 bg-glass-sunken shadow-standard transition-transform duration-fast",
            center_hovered && incoming_edges.length > 0 && "scale-lift",
          ]}
          style:border-color={center_color}
          style:box-shadow={`0 0 20px color-mix(in srgb, ${center_color} 25%, transparent)`}>
          <Avatar {...entity_avatar_props(entity)} class="rounded-full" />
        </div>
        <span class="mt-tight max-w-22.5 truncate text-center type-data drop-shadow-md" style:color={center_color}>
          {format_entity_handle(entity, "ACTIVE")}
        </span>
      </div>

      {#each satellite_nodes as node (node.key)}
        <button
          type="button"
          data-testid="relational-satellite-node"
          aria-label={`Open profile for ${node.name} (${node.handle})`}
          use:tooltip={{ preview: node.preview_payload, text: node.name, delay: 0 }}
          onpointerenter={() => (hovered_node = node)}
          onpointerleave={() => (hovered_node = null)}
          onfocus={() => (hovered_node = node)}
          onblur={() => (hovered_node = null)}
          onclick={() => on_select_entity?.(node.entity || { name: node.name })}
          oncontextmenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            pin_tooltip_menu(e.currentTarget, { preview: node.preview_payload, text: node.name, x: e.clientX, y: e.clientY });
          }}
          class={[
            "group absolute z-10 flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center justify-center transition-opacity duration-fast focus:outline-hidden",
            node.is_incoming_only && "opacity-muted grayscale hover:opacity-100",
          ]}
          style:left="{node.x}px"
          style:top="{node.y}px">
          <div
            class="relative flex size-11 items-center justify-center overflow-hidden rounded-full border-2 bg-glass-sunken shadow-standard transition-transform duration-fast group-hover:scale-lift"
            style:border-color={node.color}
            style:box-shadow={`0 0 12px color-mix(in srgb, ${node.color} 20%, transparent)`}>
            <Avatar {...entity_avatar_props(node.entity || node)} class="rounded-full" />
          </div>
          <span class="mt-tight max-w-20 truncate text-center type-data drop-shadow-md" style:color={node.color}>
            {node.handle}
          </span>
        </button>
      {/each}
    </div>
  {/if}
</div>
