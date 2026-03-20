cat << 'PATCH' > /tmp/DynamicsEngine.patch
<<<<<<< SEARCH
        // 5. BAYESIAN SKEPTICISM (AI Only):
        // If the user tries to persuade or lie (NAIVETY trigger), we calculate how
        // suspicious the AI should be based on its current Openness (Trust).
        if (state.ai && state.ai.dynamics && state.ai.dynamics.openness !== undefined) {
            const suspicion = DynamicsEngine._resolve_naivety(triggered, state.ai.dynamics.openness)
            if (suspicion !== null) {
                if (suspicion > d_phys.NAIVETY_THRESHOLD) {
                    state.signal_prompts.push(SIGNAL_PROMPTS.naivety.breach.text)
                } else if (suspicion > 0.5) {
                    state.signal_prompts.push(SIGNAL_PROMPTS.naivety.uncertain.text)
                }
            }
        }
=======
        // 5. BAYESIAN SKEPTICISM (AI Only):
        // If the user tries to persuade or lie (NAIVETY trigger), we calculate how
        // suspicious the AI should be based on its current Openness (Trust) and its Personality Baseline.
        if (state.ai && state.ai.dynamics && state.ai.dynamics.openness !== undefined) {
            const ai_baselines = DynamicsEngine._get_baselines(state.ai)
            const baseline_openness = ai_baselines.openness ?? d_phys.DYNAMICS_GRAVITY_BASELINE

            const suspicion = DynamicsEngine._resolve_naivety(triggered, state.ai.dynamics.openness, baseline_openness)

            if (suspicion !== null) {
                if (suspicion > d_phys.NAIVETY_THRESHOLD) {
                    state.signal_prompts.push(SIGNAL_PROMPTS.naivety.breach.text)
                } else if (suspicion > 0.5) {
                    state.signal_prompts.push(SIGNAL_PROMPTS.naivety.uncertain.text)
                }
            }
        }
>>>>>>> REPLACE
PATCH
patch src/core/intelligence/DynamicsEngine.js < /tmp/DynamicsEngine.patch
