# Team Roster .XLS Upload Fix

Updated the team profile roster upload feature to support legacy Excel `.xls` files in addition to `.xlsx`, `.xlsm`, `.xlsb`, and `.csv`.

Changes made:
- Expanded the roster file input `accept` list for `.xls` and common Excel MIME types.
- Added explicit roster spreadsheet validation.
- Added a workbook reader that first tries `arrayBuffer` parsing and falls back to binary-string parsing for older `.xls` files.
- Added clearer upload error text when the selected file type is not supported.

Supported roster upload formats:
- `.xls`
- `.xlsx`
- `.xlsm`
- `.xlsb`
- `.csv`

Roster columns still support headers such as:
- `Name`
- `First Name`
- `Last Name`
- `Position`
- `Phone`
- `Email`
