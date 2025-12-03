// apps/rpglitch/js/physics.js

/**
 * THE PROMETHEUS PHYSICS ENGINE (V4.2)
 * Calculates the "Thermodynamics" of the narrative.
 * * @param {Object} currentDynamics - { entropy, permeability, velocity, resonance }
 * @returns {Object} - The mutated dynamics and narrative flags
 */
export function calculateDynamics(currentDynamics) {
    // 1. Clone & Sanitize
    // Default to neutral (10/50/10/10) if missing
    const d = {
        entropy: 10,
        permeability: 50,
        velocity: 10,
        resonance: 10,
        ...currentDynamics
    };

    const clamp = (n) => Math.min(100, Math.max(0, Math.round(n)));
    const flags = {
        echoChamber: false,
        glassCannon: false,
        panicSpiral: false,
        fogOfWar: false
    };

    // --- LAW 1: THE ADRENALINE SHIELD ---
    // IF Velocity > 80 (Rushing/Combat), THEN Permeability MUST decrease (Defenses Up).
    // "You can't be vulnerable while dodging bullets."
    if (d.velocity > 80) {
        const penalty = 20;
        if (d.permeability > 30) {
            d.permeability = clamp(d.permeability - penalty);
            console.log(`[PHYSICS] Adrenaline Shield: Permeability -${penalty}`);
        }
    }

    // --- LAW 2: THE FOG OF WAR ---
    // IF Entropy > 80 (Chaos), THEN Resonance MUST decrease (Noise kills Signal).
    // "Meaning is lost in the noise."
    if (d.entropy > 80) {
        d.resonance = clamp(d.resonance - 10);
        flags.fogOfWar = true;
        console.log("[PHYSICS] Fog of War: Resonance dampened.");
    }

    // --- LAW 3: THE COOL-DOWN ---
    // IF Velocity < 20 (Calm), THEN Entropy decreases (Stillness restores order).
    if (d.velocity < 20) {
        d.entropy = clamp(d.entropy - 10);
        console.log("[PHYSICS] Cool-Down: Entropy reduced.");
    }

    // --- LAW 4: THE PANIC SPIRAL (New) ---
    // IF Entropy > 90 (Total Chaos) → FORCE Velocity +20.
    // "Chaos creates panic. Panic creates speed."
    if (d.entropy > 90) {
        d.velocity = clamp(d.velocity + 20);
        flags.panicSpiral = true;
        console.log("[PHYSICS] Panic Spiral: Velocity forced up.");
    }

    // --- LAW 5: THE ECHO CHAMBER (Logic Only) ---
    // IF Resonance > 90 (Impact) AND Entropy < 20 (Quiet) → Trigger Life Change.
    if (d.resonance > 90 && d.entropy < 20) {
        flags.echoChamber = true;
    }

    // --- LAW 6: THE GLASS CANNON (Logic Only) ---
    // IF Permeability > 80 (Open Heart) → Double Resonance Gains.
    if (d.permeability > 80) {
        flags.glassCannon = true;
    }

    return {
        entropy: clamp(d.entropy),
        permeability: clamp(d.permeability),
        velocity: clamp(d.velocity),
        resonance: clamp(d.resonance),
        _flags: flags
    };
}