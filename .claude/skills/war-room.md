THE WAR ROOM: GLOBAL THREAT DASHBOARD (v1.0)
1. OVERVIEW
The War Room is the "Command Center" of the Digital Twin. It transitions the user from a passive observer to a security analyst. It displays real-time telemetry from all users across the globe, creating a sense of a living, breathing security asset.

2. GLOBAL TELEMETRY (THE MACRO VIEW)
This section fetches aggregated data from the Neon PostgreSQL database.

Global Threat Map: A simplified SVG or Canvas world map.

Visual: Pings/Pulses appearing on countries where attacks have been detected in the last 24 hours.

System Stress Meter (Heat Map):

Logic: Sum(Total_Attacks_24h).

States: STABLE (Blue/Green), UNDER LOAD (Orange), CRITICAL (Red Glitch).

Live Incident Feed: A scrolling list of the last 10 blocked attempts worldwide.

Format: [TIMESTAMP] - [THREAT_TYPE] - [ORIGIN_CITY] - [STATUS: NEUTRALIZED]

3. PERSONAL INFAMY TRACKER (THE MICRO VIEW)
Specific stats for the current session/user.

Current Infamy Score: Points earned during this session.

Detected Crimes: A list of specific vulnerabilities the user has tried to exploit (e.g., "SQL Injection Attempt", "Directory Traversal").

Rank Progress: A visual bar showing how close they are to entering The Hall of Infamy (Top 10).

4. THE SENTINEL'S WAR ROOM PERSONA
In this area, Sentinel-02 shifts from "Greeting Mode" to "Tactical Mode."

Behavior: Instead of just reacting to the user, the AI comments on Global Trends.

Sample Dialogue: "The nodes in Eastern Europe are particularly aggressive tonight. Are you going to join them, or just keep staring at my charts?"

5. DATABASE SCHEMA (NEON / LEAN STORAGE)
To stay within free-tier limits, we use two optimized tables:

global_stats: Stores daily aggregates (Total attacks per type, per country).

session_crimes: Temporary storage for the current session's activity.

leaderboard: Stores only the Top 10 users (Username/Alias, Score, Primary Tool).

🛡️ Technical Implementation Checklist for Antigravity:
Database Initialization: Create the SQL schema in Neon to track global hits and user scores.

War Room Layout: Build a grid-based dashboard using bento-box styling (Next.js components).

Live Fetching: Implement a SWR or React Query hook to refresh global stats every 30 seconds without page reloads.

"Claim Identity" Logic: Create a small modal/input for users to set an "Alias" so their crimes can be recorded in the Leaderboard.

Stress Level Logic: Connect the Global Stress Meter to the total count of the global_stats table.