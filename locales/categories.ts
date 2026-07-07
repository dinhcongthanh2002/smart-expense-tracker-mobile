// Categories list, category create/edit form, and the category picker sheet.
// Shared keys reused from `common`: cancel, note, saveChanges, delete,
// enums.txType.* (type toggle labels).
export default {
  vi: {
    title: "Danh mục",
    empty: "Chưa có danh mục nào",
    create: "Tạo danh mục",
    childCount: "{{count}} danh mục con",
    noChildren: "Chưa có danh mục con",
    addChild: "Thêm danh mục con",

    // form
    newTitle: "Danh mục mới",
    editTitle: "Sửa danh mục",
    childTitle: "Danh mục con",
    name: "Tên danh mục",
    namePlaceholder: "VD: Ăn uống",
    parentLabel: "Danh mục cha (tuỳ chọn)",
    topLevelOption: "— Cấp cha —",
    childInheritType: "Danh mục con — loại kế thừa từ danh mục cha",
    typeLabel: "Loại",
    color: "Màu sắc",
    icon: "Biểu tượng",
    update: "Cập nhật",
    deleteCategory: "Xoá danh mục",

    // picker sheet
    pickTitle: "Chọn danh mục",
    pickEmpty: "Chưa có danh mục. Tạo trong mục Quản lý danh mục.",
    pickSearch: "Tìm danh mục",
    pickNoResult: "Không tìm thấy danh mục phù hợp",
    createNew: "Tạo danh mục mới",
  },
  en: {
    title: "Categories",
    empty: "No categories yet",
    create: "Create category",
    childCount: "{{count}} subcategory",
    childCount_plural: "{{count}} subcategories",
    noChildren: "No subcategories",
    addChild: "Add subcategory",

    // form
    newTitle: "New category",
    editTitle: "Edit category",
    childTitle: "Subcategory",
    name: "Category name",
    namePlaceholder: "e.g. Food & drink",
    parentLabel: "Parent category (optional)",
    topLevelOption: "— Top level —",
    childInheritType: "Subcategory — type inherited from the parent",
    typeLabel: "Type",
    color: "Color",
    icon: "Icon",
    update: "Update",
    deleteCategory: "Delete category",

    // picker sheet
    pickTitle: "Select category",
    pickEmpty: "No categories yet. Create some in Manage categories.",
    pickSearch: "Search categories",
    pickNoResult: "No matching categories found",
    createNew: "Create new category",
  },
};
