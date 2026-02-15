/**
 * src/data/config.js
 * Configuration for the Data module, including Profile field definitions.
 */

export const PROFILE_SECTIONS = [
    {
        id: "eternal",
        label: "Eternal",
        sublabel: "Permanent traits",
        layout: "split",
        fields: [
            {
                label: "Non-Physical",
                key: "eternal.mental",
                placeholder: "Core identity, archetype, essence...",
            },
            {
                label: "Physical",
                key: "eternal.physical",
                placeholder: "Eternal appearance, species, form...",
            },
        ],
    },
    {
        id: "present",
        label: "Present",
        sublabel: "Current state",
        layout: "split",
        fields: [
            {
                key: "present.mental",
                placeholder: "Current mood, goals, immediate thoughts...",
            },
            {
                key: "present.physical",
                placeholder: "Current outfit, equipment, physical status...",
            },
        ],
    },
    {
        id: "past",
        label: "Past",
        sublabel: "History",
        layout: "full",
        fields: [
            {
                key: "past",
                placeholder: "Backstory, origin, key memories...",
            },
        ],
    },
    {
        id: "future",
        label: "Future",
        sublabel: "Destiny",
        layout: "full",
        fields: [
            {
                key: "future",
                placeholder: "Ambitions, prophecies, vector...",
            },
        ],
    },
]
