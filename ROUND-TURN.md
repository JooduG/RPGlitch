# Refining Round Turn

So this is the loop, for the example let's say it's in the middle of round 5.
User sends a message thus completing the USER_TURN which in turn completes TURN: 5. TURN 6 begins with the SYSTEM_TURN which does all the math and engine stuff. During the SYSTEM_TURN all/almost all user inputs are disabled. When the system is done with it's stuff it sends the ai the kernel it's supposed to get with the new updated data stuff and this COMPLETES the SYSTEM_TURN, enables user inputs (and thus technically beginning the USER_TURN) and begins the AI_TURN. the AI_TURN is basically just generating  everything the AI is supposed to generate lol. When the AI has sent it's message the AI_TURN is over and now the simulation is waiting for the User to complete the USER_TURN.

Global Terminology Alignment: Rounds & Turns (Refined Lifecycle)
The User has refined the lifecycle:

A Round increments when a User message is sent.
Round X ends, and Round X+1 begins with a SYSTEM_TURN (Engine/Physics).
After the SYSTEM_TURN, user inputs are enabled (starting USER_TURN) while the AI_TURN starts generating in parallel.
The lifecycle remains in this mixed state until the User sends their next message, closing the current Round.
Files Edited
Progress Updates

Mapping User's refined 'USER_TURN' -> 'SYSTEM_TURN' -> 'AI_TURN' -> 'USER_TURN' logic.

SYSTEM_TURN: Starts the moment you send a message. Engine/Physics resolve here. UI is locked.
AI_TURN + USER_TURN: Start simultaneously once the System is finished. The AI generates its response while UI is unlocked, allowing you to begin typing your next move immediately.
End of Round: The round completes and increments when you send your next message.
🛠️ Refined Nomenclature
State: simulationState.round (renamed from storyState.turn).
Database: stories.round.
Phases: SYSTEM_TURN, AI_TURN, USER_TURN.
This creates a very fluid, "Async" feel where the world physics resolve instantly, and then the narrative and user interaction happen in parallel.

Oh and yes, so, USER_TURN and AI_TURN are beginning at the same time and this window is where the USER can interrupt the AI_TURN by sending a message.
