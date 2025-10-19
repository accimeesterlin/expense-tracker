# 🚀 Quick Start: Continue shadcn/ui Conversion

## ✅ What's Already Done

Your expense tracker project now has shadcn/ui foundation set up with:

- ✅ All core shadcn components installed (18 components)
- ✅ 3 modals converted: SimpleIncomeModal, ErrorModal, ConfirmationModal
- ✅ CSS theme configured with shadcn variables
- ✅ Helper scripts and documentation created

## 🎯 Continue from Here

### Option 1: Convert Next Modal (Recommended)

Pick any modal from the list and convert it following the pattern:

```bash
# 1. Open a modal file (e.g., ExpenseModal.tsx)
code src/components/ExpenseModal.tsx

# 2. Follow the pattern from SHADCN_CONVERSION_GUIDE.md
# - Replace Modal imports with Dialog imports
# - Replace FormInput/FormLabel with Input/Label
# - Update button variants
# - Test the changes

# 3. Test the modal
npm run dev
```

**Suggested Order:**

1. ExpenseModal.tsx (high traffic)
2. IncomeModal.tsx (high traffic)
3. BudgetModal.tsx (high traffic)
4. CompanyModal.tsx
5. CategoryModal.tsx
   ... (continue with others)

### Option 2: Use the Helper Script

```bash
# Check current status
./conversion-helper.sh --check

# Find all modals using old pattern
./conversion-helper.sh --find-modals

# Interactive menu
./conversion-helper.sh
```

### Option 3: Batch Convert Similar Patterns

Use find/replace in your editor:

1. **Convert Modal imports:**

   ```
   Find:    from "@/components/ui/Modal"
   Replace: from "@/components/ui/dialog"
   ```

2. **Convert Button imports:**

   ```
   Find:    from "@/components/ui/Button"
   Replace: from "@/components/ui/button"
   ```

3. **Convert variant="primary":**
   ```
   Find:    variant="primary"
   Replace: variant="default"
   ```

## 📖 Reference Files

- **SHADCN_CONVERSION_GUIDE.md** - Complete conversion patterns and examples
- **CONVERSION_SUMMARY.md** - Progress tracking and statistics
- **conversion-helper.sh** - Helper script for finding components

## 🔍 Conversion Checklist for Each Modal

When converting a modal, follow these steps:

- [ ] **Step 1: Update imports**

  ```tsx
  // Old
  import {
    Modal,
    ModalHeader,
    ModalContent,
    ModalFooter,
  } from "@/components/ui/Modal";
  import { Button } from "@/components/ui/Button";
  import { FormField, FormLabel, FormInput } from "@/components/ui/Form";

  // New
  import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
  } from "@/components/ui/dialog";
  import { Button } from "@/components/ui/button";
  import { Input } from "@/components/ui/input";
  import { Label } from "@/components/ui/label";
  ```

- [ ] **Step 2: Update Modal wrapper**

  ```tsx
  // Old
  <Modal isOpen={isOpen} onClose={onClose} size="md">

  // New
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent className="sm:max-w-[425px]">
  ```

- [ ] **Step 3: Update form fields**

  ```tsx
  // Old
  <FormField>
    <FormLabel>Name</FormLabel>
    <FormInput value={name} onChange={setName} />
  </FormField>

  // New
  <div className="space-y-2">
    <Label htmlFor="name">Name</Label>
    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
  </div>
  ```

- [ ] **Step 4: Update selects**

  ```tsx
  // Old
  <FormSelect value={type} onChange={(e) => setType(e.target.value)}>
    <option value="option1">Option 1</option>
  </FormSelect>

  // New
  <Select value={type} onValueChange={setType}>
    <SelectTrigger>
      <SelectValue placeholder="Select..." />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="option1">Option 1</SelectItem>
    </SelectContent>
  </Select>
  ```

- [ ] **Step 5: Update buttons**

  ```tsx
  // Old
  <button className="btn-primary" onClick={handleSubmit}>
    Save
  </button>

  // New
  <Button onClick={handleSubmit}>
    Save
  </Button>
  ```

- [ ] **Step 6: Update footer**

  ```tsx
  // Old
  <ModalFooter>
    <button className="btn-secondary">Cancel</button>
    <button className="btn-primary">Save</button>
  </ModalFooter>

  // New
  <DialogFooter className="gap-2 sm:gap-0">
    <Button variant="outline" onClick={onClose}>Cancel</Button>
    <Button onClick={handleSave}>Save</Button>
  </DialogFooter>
  ```

- [ ] **Step 7: Test the modal**
  - Open the page that uses this modal
  - Test open/close
  - Test form submission
  - Check responsive behavior
  - Verify error states

## 🧪 Testing

After each conversion:

```bash
# Check for TypeScript errors
npm run lint

# Test in browser
npm run dev

# Open the page with your converted modal
# Test all functionality
```

## 💡 Common Patterns

### Icon with Input

```tsx
<div className="relative">
  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
  <Input className="pl-9" />
</div>
```

### Loading Button

```tsx
<Button disabled={loading}>
  {loading && (
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
  )}
  {loading ? "Saving..." : "Save"}
</Button>
```

### Error Display

```tsx
{
  error && (
    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {error}
    </div>
  );
}
```

## 📊 Track Your Progress

Update the progress in CONVERSION_SUMMARY.md as you complete each modal:

```bash
# Check progress anytime
./conversion-helper.sh --check
```

## 🆘 Need Help?

1. **Check the examples:**
   - `src/components/SimpleIncomeModal.tsx` - Full form modal
   - `src/components/ErrorModal.tsx` - Simple alert modal
   - `src/components/ConfirmationModal.tsx` - Confirmation dialog

2. **Check the guide:**
   - Open `SHADCN_CONVERSION_GUIDE.md`
   - Search for your specific pattern

3. **shadcn/ui docs:**
   - https://ui.shadcn.com/docs/components

## 🎉 When Done

After converting all components:

```bash
# Final checks
npm run lint
npm run build
npm run dev

# Update documentation
# Mark all todos as complete in CONVERSION_SUMMARY.md
```

---

**Current Status**: 3/17 modals converted (17%)  
**Next Target**: ExpenseModal.tsx  
**Estimated Time**: 20-30 min per modal

Good luck! 🚀
