# shadcn/ui Conversion Guide

## ✅ Completed Steps

1. **shadcn/ui Installation** - ✓ Complete
   - Initialized shadcn/ui with default config
   - Installed core components: button, dialog, form, input, label, select, textarea, card, dropdown-menu, badge, separator, tabs, table, alert, sonner, scroll-area, command, popover
   - Updated `components.json` configuration
   - Updated `lib/utils.ts` with `cn()` utility

2. **CSS Theme Integration** - ✓ Complete
   - `globals.css` updated with shadcn CSS variables
   - Tailwind CSS v4 compatibility configured

3. **Core UI Components Replaced** - ✓ Complete
   - `Button.tsx` → `button.tsx` (shadcn)
   - `Modal.tsx` → Removed (using `dialog.tsx`)
   - `Form.tsx` → `form.tsx` (shadcn with react-hook-form)

4. **Converted Modals** - ✓ Partially Complete
   - ✅ `SimpleIncomeModal.tsx` - Converted to Dialog + Form
   - ✅ `ErrorModal.tsx` - Converted to Dialog + Alert
   - ✅ `ConfirmationModal.tsx` - Converted to Dialog

## 🔄 Remaining Conversion Tasks

### Modal Components (14 remaining)

#### High Priority - User-Facing Modals

1. **ExpenseModal.tsx** - Main expense entry form
2. **IncomeModal.tsx** - Full income entry form
3. **BudgetModal.tsx** - Budget creation/editing
4. **CategoryModal.tsx** - Category management
5. **CompanyModal.tsx** - Company information
6. **AssetModal.tsx** - Asset tracking

#### Medium Priority - Feature Modals

7. **DebtModal.tsx** - Debt management
8. **GoalModal.tsx** - Financial goals
9. **PaymentModal.tsx** - Payment tracking
10. **PaymentMethodModal.tsx** - Payment method config
11. **TeamMemberModal.tsx** - Team collaboration
12. **SettingsModal.tsx** - User settings

#### Lower Priority - Utility Modals

13. **NotificationModal.tsx** - Simple notifications
14. **SimpleDebtModal.tsx** - Quick debt entry
15. **ReceiptScannerModal.tsx** - Receipt OCR scanner

### Layout & Dashboard Components

1. **Sidebar.tsx** - Convert to shadcn navigation
2. **AppLayout.tsx** - Update with shadcn components
3. **GlobalSearch.tsx** - Convert to Command component
4. **DashboardStats.tsx** - Convert to Card components
5. **FinancialDashboard.tsx** - Update charts with Card
6. **DashboardExpenseCard.tsx** - Convert to Card
7. **UpcomingPayments.tsx** - Convert to Card + Badge
8. **UpcomingSubscriptions.tsx** - Convert to Card + Badge
9. **ExpenseCard.tsx** - Convert to Card component

### Page Components (in app/ directory)

- All `page.tsx` files using tables, forms, tabs, etc.
- Update to use shadcn Table, Tabs, and other components

## 📋 Conversion Pattern Reference

### Modal to Dialog Conversion Pattern

**Before (Custom Modal):**

```tsx
import {
  Modal,
  ModalHeader,
  ModalContent,
  ModalFooter,
} from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

<Modal isOpen={isOpen} onClose={onClose} size="md">
  <ModalHeader icon={<Icon />} onClose={onClose}>
    <ModalTitle>Title</ModalTitle>
  </ModalHeader>
  <ModalContent>
    <FormField>
      <FormLabel>Label</FormLabel>
      <FormInput value={value} onChange={handleChange} />
    </FormField>
  </ModalContent>
  <ModalFooter>
    <button onClick={onClose} className="btn-secondary">
      Cancel
    </button>
    <button onClick={handleSubmit} className="btn-primary">
      Submit
    </button>
  </ModalFooter>
</Modal>;
```

**After (shadcn Dialog):**

```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" />
        <DialogTitle>Title</DialogTitle>
      </div>
      <DialogDescription>Optional description text</DialogDescription>
    </DialogHeader>

    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="field">Label</Label>
        <Input id="field" value={value} onChange={handleChange} />
      </div>
    </div>

    <DialogFooter className="gap-2 sm:gap-0">
      <Button variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button onClick={handleSubmit}>Submit</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>;
```

### Form Components Mapping

| Old Component  | New Component                              | Import                     |
| -------------- | ------------------------------------------ | -------------------------- |
| `FormField`    | `<div className="space-y-2">`              | N/A                        |
| `FormLabel`    | `Label`                                    | `@/components/ui/label`    |
| `FormInput`    | `Input`                                    | `@/components/ui/input`    |
| `FormSelect`   | `Select` + components                      | `@/components/ui/select`   |
| `FormTextarea` | `Textarea`                                 | `@/components/ui/textarea` |
| `FormError`    | `<p className="text-sm text-destructive">` | N/A                        |

### Button Variants Mapping

| Old Variant     | New Variant                  |
| --------------- | ---------------------------- |
| `"primary"`     | `"default"`                  |
| `"secondary"`   | `"secondary"` or `"outline"` |
| `"ghost"`       | `"ghost"`                    |
| `"destructive"` | `"destructive"`              |
| `"outline"`     | `"outline"`                  |

### Select Component Pattern

**Old:**

```tsx
<FormSelect value={value} onChange={(e) => setValue(e.target.value)}>
  <option value="option1">Option 1</option>
  <option value="option2">Option 2</option>
</FormSelect>
```

**New:**

```tsx
<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select an option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Icon Positioning in Inputs

**Old:**

```tsx
<div className="input-field-with-icon">
  <DollarSign className="icon w-5 h-5" />
  <input className="input-field" />
</div>
```

**New:**

```tsx
<div className="relative">
  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
  <Input className="pl-9" />
</div>
```

## 🔧 Quick Conversion Commands

### Find all components using old Modal:

```bash
grep -r "from.*@/components/ui/Modal" src/components/
grep -r "from.*\./ui/Modal" src/components/
```

### Find all components using old Button:

```bash
grep -r "from.*@/components/ui/Button" src/
grep -r "variant=\"primary\"" src/
```

### Find all components using old Form components:

```bash
grep -r "FormInput\|FormField\|FormLabel" src/components/
```

## 🎨 CSS Class Replacements

| Old Class          | New Approach                                                       |
| ------------------ | ------------------------------------------------------------------ |
| `.btn-primary`     | `<Button>` (default variant)                                       |
| `.btn-secondary`   | `<Button variant="outline">`                                       |
| `.input-field`     | `<Input>` component                                                |
| `.card`            | `<Card>` + `<CardContent>`                                         |
| Custom text colors | Use `text-foreground`, `text-muted-foreground`, `text-destructive` |

## 🚀 Next Steps

1. **Test Current Changes**

   ```bash
   npm run dev
   ```

   Check that SimpleIncomeModal, ErrorModal, and ConfirmationModal work correctly.

2. **Convert Remaining Modals**
   - Start with high-priority modals (ExpenseModal, IncomeModal, BudgetModal)
   - Use the conversion patterns above
   - Test each modal after conversion

3. **Update Layout Components**
   - Convert Sidebar to use shadcn navigation patterns
   - Update AppLayout with shadcn components
   - Convert GlobalSearch to use Command component

4. **Update Dashboard Components**
   - Replace custom cards with shadcn Card component
   - Use Badge component for status indicators
   - Update tables with shadcn Table component

5. **Final Testing**
   - Build the project: `npm run build`
   - Fix any TypeScript errors
   - Test all user flows
   - Verify responsive design

## 📦 Additional shadcn Components to Install

You may need these as you convert more components:

```bash
# For navigation
npx shadcn@latest add navigation-menu

# For data tables
npx shadcn@latest add checkbox
npx shadcn@latest add data-table

# For advanced forms
npx shadcn@latest add calendar
npx shadcn@latest add date-picker
npx shadcn@latest add switch
npx shadcn@latest add radio-group

# For tooltips and popovers
npx shadcn@latest add tooltip
npx shadcn@latest add hover-card

# For charts (if needed)
npx shadcn@latest add chart
```

## 💡 Tips

1. **Component Naming**: shadcn uses lowercase file names (`button.tsx` not `Button.tsx`)
2. **Imports**: Always use lowercase: `@/components/ui/button`
3. **Props**: `isOpen` → `open`, `onClose` → `onOpenChange` for Dialog
4. **Variants**: shadcn Button uses string literals for variants
5. **Accessibility**: shadcn components include ARIA attributes by default
6. **Dark Mode**: shadcn supports dark mode out of the box with CSS variables

## 📝 Common Issues & Solutions

**Issue**: Modal not closing

- **Solution**: Use `onOpenChange` instead of `onClose` for Dialog

**Issue**: Select not updating

- **Solution**: Use `onValueChange` instead of `onChange`

**Issue**: Button variant not working

- **Solution**: Replace `"primary"` with `"default"`

**Issue**: Icons not aligned in inputs

- **Solution**: Use relative positioning with absolute icon placement

---

**Progress**: 3/17 Modals Converted (18%)
**Status**: In Progress 🚧
**Last Updated**: October 4, 2025
