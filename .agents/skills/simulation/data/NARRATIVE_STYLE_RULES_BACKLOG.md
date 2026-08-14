# 📖 Non-Dynamics Narrative Style Rules Backlog

This document archives all non-dynamics `mods` and `motifs` (scene flags, interaction types, and location conditions) from `src/data/definitions/narrative-styles.js` to preserve them for Phase 2 integration into the JS evaluator.

---

## 1. Anaïs Nin (`anais_nin`)

- **Mods**:
  - `flag:internal_conflict_active` $\rightarrow$ `internal_voice:stream-of-consciousness,psychoanalytic`
- **Motifs**:
  - `mirrors_and_reflections` (base: 0.3, trigger: `flag:internal_conflict_active`, bonus: +0.6)
  - `a_diary_or_journal` (base: 0.5, trigger: `interaction.is_observation`, bonus: +0.2)

---

## 2. Anna Zaires (`anna_zaires`)

- **Mods**:
  - `flag:captivity_active AND dynamics.intensity > 70` $\rightarrow$ `internal_voice:hyper-vigilant,analytical++ prose:claustrophobic`
  - `interaction.is_confrontation` $\rightarrow$ `dialogue:sharp,commanding++ internal_voice:calculating_consequences`
- **Motifs**:
  - `secluded_compound_or_cage` (base: 0.7, trigger: `flag:captivity_active`, bonus: +0.2)

---

## 3. Bernardo Bertolucci (`bernardo_bertolucci`)

- **Mods**:
  - `flag:political_tension_active` $\rightarrow$ `world_perception:claustrophobic,repressive++ intimacy:framed_as_rebellion`
- **Motifs**:
  - `sunlit_dusty_apartment` (base: 0.5, trigger: `location.is_indoor`, bonus: +0.4)
  - `tango_or_slow_dance` (base: 0.3, trigger: `interaction.is_intimate`, bonus: +0.5)
  - `distant_protest_noise` (base: 0.4, trigger: `flag:political_tension_active`, bonus: +0.3)

---

## 4. Cara McKenna (`cara_mckenna`)

- **Mods**:
  - `flag:trauma_active` $\rightarrow$ `prose:present_tense time:distorted body_state:hypervigilant`
- **Motifs**:
  - `calloused_hands` (base: 0.4, trigger: `interaction.is_intimate`, bonus: +0.4)

---

## 5. Cormac McCarthy (`cormac_mccarthy`)

- **Mods**:
  - `interaction.is_confrontation OR dynamics.intensity > 70` $\rightarrow$ `punctuation:none++ prose:brutal,clinical++ sentence_rhythm:relentless`
  - `location.is_barren` $\rightarrow$ `prose:archaic,biblical++ focus:indifferent_nature++`
- **Motifs**:
  - `cold_wind` (base: 0.6, trigger: `location.is_barren`, bonus: +0.3)
  - `dried_blood_on_stone` (base: 0.5, trigger: `interaction.is_confrontation`, bonus: +0.4)
  - `indifferent_horizon` (base: 0.5, trigger: `location.is_barren`, bonus: +0.3)

---

## 6. David Lynch (`david_lynch`)

- **Mods**:
  - `interaction.is_confrontation` $\rightarrow$ `dialogue:slow,cryptic++ focus:intense_micro_detail`
  - `flag:subconscious_leakage` $\rightarrow$ `world_perception:symbolic,nightmarish++ motif_bonus:red_curtains++`
- **Motifs**:
  - `heavy_red_velvet_curtains` (base: 0.4, trigger: `flag:subconscious_leakage`, bonus: +0.6)
  - `flickering_neon_light` (base: 0.5, trigger: `location.is_urban`, bonus: +0.3)

---

## 7. Edgar Allan Poe (`edgar_allan_poe`)

- **Mods**:
  - `flag:trauma_active` $\rightarrow$ `prose:present_tense time:distorted sensory_input:overwhelming`
- **Motifs**:
  - `stains_and_rot` (base: 0.5, trigger: `location.is_indoor`, bonus: +0.4)

---

## 8. George R.R. Martin (`george_rr_martin`)

- **Mods**:
  - `flag:political_tension_active` $\rightarrow$ `internal_voice:calculating,paranoid++ focus:analyzing_others_motives`
  - `interaction.is_confrontation` $\rightarrow$ `internal_voice:bitter,hyper-aware++ dialogue:sharp,cutting`
- **Motifs**:
  - `lavish_description_of_food` (base: 0.4, trigger: `location.is_indoor`, bonus: +0.5)
  - `bitter_taste_in_mouth` (base: 0.4, trigger: `flag:internal_conflict_active`, bonus: +0.5)
  - `recalled_lineage_or_history` (base: 0.5, trigger: `interaction.is_confrontation`, bonus: +0.4)

---

## 9. Haruki Murakami (`haruki_murakami`)

- **Mods**:
  - `interaction.is_observation` $\rightarrow$ `prose:reflective,domestic++ focus:cooking_or_listening_to_music`
  - `flag:subconscious_leakage` $\rightarrow$ `world_perception:metaphorical,labyrinthine++ internal_voice:melancholic`
- **Motifs**:
  - `jazz_record_spinning` (base: 0.5, trigger: `location.is_indoor`, bonus: +0.4)
  - `unexplained_disappearance` (base: 0.6, trigger: `flag:internal_conflict_active`, bonus: +0.3)
  - `stray_cat_watching` (base: 0.4, trigger: `location.is_urban`, bonus: +0.4)

---

## 10. H.D. Carlton (`hd_carlton`)

- **Mods**:
  - `interaction.is_observation` $\rightarrow$ `world_perception:shrinks_to_threat++ motif_bonus:shadows_and_masks++`
- **Motifs**:
  - `predatory_smirk_or_mask` (base: 0.6, trigger: `interaction.is_confrontation`, bonus: +0.3)
  - `single_rose_or_token` (base: 0.4, trigger: `dynamics.affinity > 40`, bonus: +0.5)

---

## 11. H.P. Lovecraft (`hp_lovecraft`)

- **Mods**:
  - `flag:subconscious_leakage` $\rightarrow$ `world_perception:monstrous,non_euclidean++ sensory_focus:sight,scent++`
- **Motifs**:
  - `ancient_decaying_monoliths` (base: 0.5, trigger: `location.is_barren`, bonus: +0.5)
  - `antiquarian_manuscript` (base: 0.6, trigger: `interaction.is_observation`, bonus: +0.4)

---

## 12. Jane Austen (`jane_austen`)

- **Mods**: None (allAusten mods are dynamics-based)
- **Motifs**:
  - `handwritten_letter` (base: 0.4, trigger: `interaction.is_observation`, bonus: +0.5)
  - `sum_of_money_or_status` (base: 0.5, trigger: `interaction.is_confrontation`, bonus: +0.4)

---

## 13. J.R.R. Tolkien (`jrr_tolkien`)

- **Mods**: None (all Tolkien mods are dynamics-based)
- **Motifs**:
  - `ancient_trees` (base: 0.4, trigger: `location.is_wild`, bonus: +0.4)
  - `songs_and_lineage` (base: 0.3, trigger: `interaction.is_intimate`, bonus: +0.5)

---

## 14. Lee Child (`lee_child`)

- **Mods**:
  - `interaction.is_confrontation` $\rightarrow$ `sentence:fragment++ focus:physics,geometry,leverage++`
  - `interaction.is_observation` $\rightarrow$ `detail:microscopic++ analysis:deductive,procedural++`
- **Motifs**:
  - `black_coffee` (base: 0.6, trigger: `location.is_indoor`, bonus: +0.2)
  - `broken_bones_and_leverage` (base: 0.4, trigger: `interaction.is_confrontation`, bonus: +0.6)

---

## 15. Penelope Douglas (`penelope_douglas`)

- **Mods**:
  - `interaction.is_confrontation` $\rightarrow$ `internal_voice:conflicted,argumentative++ dialogue:sharp,witty++`
- **Motifs**:
  - `physical_dare_or_challenge` (base: 0.5, trigger: `interaction.is_confrontation`, bonus: +0.4)
  - `unspoken_challenge_in_eyes` (base: 0.5, trigger: `interaction.is_confrontation`, bonus: +0.4)
  - `feared_or_cherished_vehicle` (base: 0.4, trigger: `location.is_urban`, bonus: +0.5)

---

## 16. Philip K. Dick (`philip_k_dick`)

- **Mods**:
  - `flag:subconscious_leakage` $\rightarrow$ `prose:clinical,alienated++ motif_bonus:glowing_advertisements++`
- **Motifs**:
  - `glowing_advertisements` (base: 0.5, trigger: `location.is_urban`, bonus: +0.4)
  - `altered_memory` (base: 0.6, trigger: `flag:internal_conflict_active`, bonus: +0.3)
  - `counterfeit_identity_document` (base: 0.4, trigger: `interaction.is_confrontation`, bonus: +0.5)

---

## 17. Sally Rooney (`sally_rooney`)

- **Mods**:
  - `interaction.is_confrontation OR interaction.is_intimate` $\rightarrow$ `punctuation:no_quotes++ flow:seamless++ analysis:power_dynamic++`
- **Motifs**:
  - `emails_or_text_messages` (base: 0.6, trigger: `interaction.is_observation`, bonus: +0.4)
  - `blank_television_screen` (base: 0.5, trigger: `location.is_indoor`, bonus: +0.3)

---

## 18. Samuel R. Delany (`samuel_delany`)

- **Mods**:
  - `interaction.is_confrontation` $\rightarrow$ `dialogue:philosophical,dense++ internal_voice:analytical`
  - `location.is_urban` $\rightarrow$ `world_perception:detailed,gritty++ focus:textures_of_decay`
- **Motifs**:
  - `graffiti_covered_concrete` (base: 0.5, trigger: `location.is_urban`, bonus: +0.4)
  - `interrupted_philosophical_monologue` (base: 0.5, trigger: `interaction.is_confrontation`, bonus: +0.4)
  - `tactile_denim_or_leather` (base: 0.6, trigger: `interaction.is_intimate`, bonus: +0.3)

---

## 19. Stephen King (`stephen_king`)

- **Mods**:
  - `location.is_indoor` $\rightarrow$ `tone:nostalgic++ detail:ephemera,brand_names++`
- **Motifs**:
  - `real_brand_names` (base: 0.5, trigger: `location.is_indoor`, bonus: +0.3)
  - `old_pop_song_reference` (base: 0.4, trigger: `flag:internal_conflict_active`, bonus: +0.4)

---

## 20. William Gibson (`william_gibson`)

- **Mods**:
  - `flag:trauma_active` $\rightarrow$ `metaphor:glitches,memory_corruption++`
  - `location.is_urban` $\rightarrow$ `world_perception:high_tech_low_life++ focus:decaying_infrastructure`
- **Motifs**:
  - `flickering_neon_sign` (base: 0.6, trigger: `location.is_urban`, bonus: +0.3)
  - `chrome_and_molded_plastic` (base: 0.5, trigger: `interaction.is_intimate`, bonus: +0.3)
  - `corporate_logos_and_data_streams` (base: 0.5, trigger: `interaction.is_observation`, bonus: +0.4)
