// Phase 4 fills this in (ports monkey.js:1067-1172: insertOssInsightButton,
// insertActiveForks, insertDelBtn, showDeleteConfirmations, deleteRepository).

export function insertActiveForks(_owner: string, _repo: string, _usePageHeadActions: boolean): void {}

export function insertOssInsightButton(_owner: string, _repo: string, _usePageHeadActions: boolean): void {}

export function insertDelBtn(
  _owner: string,
  _repo: string,
  _usePageHeadActions = true,
  _cusClass = 'dialog-show-repo-delete-home',
  _element?: Element,
): void {}
