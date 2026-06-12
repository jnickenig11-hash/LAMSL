# Schedule Upload Park Name Normalization

Updated the Administrator Schedule Upload parser so spreadsheet park names can be entered with or without the city prefix.

Supported examples:
- Stevenson Park -> Carson - Stevenson Park
- Dolphin Park -> Carson - Dolphin Park
- Calas Park -> Carson - Calas Park
- Veterans Park / Veteran Park -> Carson - Veterans Park
- Ford Park -> Bell Gardens - Ford Park

The normalized system park name appears in the upload preview before the administrator saves the uploaded schedule.
