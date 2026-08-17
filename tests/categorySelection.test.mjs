import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toggleParentCategorySelection,
  toggleSubcategorySelection,
} from '../utils/categorySelection.js';

const categoryTree = [
  {
    _id: 'parent-1',
    subcategories: [
      { _id: 'child-1' },
      { _id: 'child-2' },
    ],
  },
  {
    _id: 'parent-2',
    subcategories: [{ _id: 'child-3' }],
  },
];

test('clicking parent selects all subcategories', () => {
  const next = toggleParentCategorySelection(categoryTree[0], []);
  assert.deepEqual(next.sort(), ['parent-1', 'child-1', 'child-2'].sort());
});

test('clicking parent deselects all subcategories when already selected', () => {
  const next = toggleParentCategorySelection(categoryTree[0], ['parent-1', 'child-1', 'child-2']);
  assert.deepEqual(next, []);
});

test('clicking subcategory adds parent when all children selected', () => {
  const next = toggleSubcategorySelection(categoryTree[0], ['child-1'], 'child-2');
  assert.deepEqual(next.sort(), ['child-1', 'child-2', 'parent-1'].sort());
});

test('removing one child clears parent when it is the last selected child', () => {
  const next = toggleSubcategorySelection(categoryTree[0], ['parent-1', 'child-1', 'child-2'], 'child-2');
  assert.deepEqual(next.sort(), ['parent-1', 'child-1'].sort());
});
