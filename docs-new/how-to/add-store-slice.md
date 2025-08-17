# How to: Add a Store Slice (Zustand)

1) Add slice
- src/features/store/slices/<slice-name>.ts
- Export actions and state; mark readonly shapes

2) Add selectors
- src/features/store/selectors/store.selectors.ts (or feature-specific selectors)
- Use reselect for memoization

3) Constants
- src/features/store/constants/

4) Tests
- Co-locate <slice-name>.test.ts; test actions and selectors

Do
- Keep slice responsibility focused
- Use immer or immutable updates

Don’t
- Don’t put UI logic in slices; keep data/domain only

