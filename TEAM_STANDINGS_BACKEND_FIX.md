LAMSL team/standings backend persistence fix

Implemented:
- Division standings pages keep existing displayed records on initial load when backend standings have no completed scores yet.
- When scores exist, division standings update from backend /api/content.standings.
- team.html loads backend content and roster/team player data before initial render.
- Team schedule, standings snapshot, latest results, roster cards, and player manager panel use backend data first.
- Roster uploads and player profile edits save to /api/rosters.
- Team profile photos save to persistent backend storage and content.teamPhotos.
- Team manager/admin sessions are accepted for team roster/photo saves.
