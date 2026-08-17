export function toggleParentCategorySelection(category, selectedIds = []) {
  const parentId = category?._id;
  const childrenIds = (category?.subcategories || []).map((sub) => sub._id);
  const hasParent = selectedIds.includes(parentId);
  const selectedSet = new Set(selectedIds);

  if (hasParent) {
    selectedSet.delete(parentId);
    childrenIds.forEach((id) => selectedSet.delete(id));
    return Array.from(selectedSet);
  }

  selectedSet.add(parentId);
  childrenIds.forEach((id) => selectedSet.add(id));
  return Array.from(selectedSet);
}

export function toggleSubcategorySelection(category, selectedIds = [], subcategoryId) {
  const parentId = category?._id;
  const childrenIds = (category?.subcategories || []).map((sub) => sub._id);
  const selectedSet = new Set(selectedIds);
  const isSelected = selectedSet.has(subcategoryId);

  if (isSelected) {
    selectedSet.delete(subcategoryId);
    if (selectedSet.has(parentId)) {
      const remainingChildren = childrenIds.filter((id) => id !== subcategoryId && selectedSet.has(id));
      if (remainingChildren.length === 0) {
        selectedSet.delete(parentId);
      }
    }
    return Array.from(selectedSet);
  }

  selectedSet.add(subcategoryId);
  const allChildrenSelected = childrenIds.every((id) => id === subcategoryId || selectedSet.has(id));
  if (allChildrenSelected) {
    selectedSet.add(parentId);
  }
  return Array.from(selectedSet);
}
