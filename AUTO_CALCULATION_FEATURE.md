# Auto-Calculation Feature for Quotation Items

## Overview
When designers create quotations, the system now automatically calculates the quantity and price for materials with area-based units when length and breadth dimensions are specified.

## How It Works

### Auto-Calculation Triggers
The system automatically calculates quantity when:
1. The material unit is area-based (`sq.ft`, `sq.m`, or `per meter`)
2. Both length AND breadth values are provided
3. Both values are greater than 0

### Calculation Formula
```
Quantity = Length × Breadth
Total Amount = Quantity × Unit Price × (1 - Discount % / 100)
```

### Supported Units
- `sq.ft` (Square feet)
- `sq.m` (Square meters)
- `per meter`

For other units like `per piece`, `per kg`, `per liter`, or `per roll`, the quantity field remains manually editable.

## User Experience

### Visual Indicators
1. **Length & Breadth Fields**: Show "(for auto-calc)" label when unit is area-based
2. **Quantity Field**:
   - Shows "(Auto-calculated)" label when both dimensions are filled
   - Becomes read-only (grayed out) when auto-calculating
   - Displays the calculation below: "10 × 5 = 50.00 sq.ft"

### Example Workflow
1. Designer selects a material with unit "sq.ft"
2. Enters Length: 10 ft
3. Enters Breadth: 5 ft
4. Quantity automatically becomes: 50 sq.ft (read-only)
5. Total amount updates automatically based on unit price

### Manual Override
- If designer clears length or breadth, quantity becomes editable again
- For non-area units, quantity is always manually editable

## Technical Details

### Modified Files
- `/src/pages/DesignerQuoteGenerator.tsx`
  - Updated `handleItemChange` function to detect area-based units
  - Auto-calculates quantity when length or breadth changes
  - Recalculates amount whenever dimensions, quantity, or price changes

### Database Schema
The `quote_items` table already has:
- `length` (numeric, nullable)
- `breadth` (numeric, nullable)
- `quantity` (numeric, required)
- `unit_price` (numeric, required)
- `amount` (numeric, required)

No database changes were needed for this feature.

## Benefits
1. **Accuracy**: Eliminates manual calculation errors
2. **Speed**: Faster quotation creation
3. **User-Friendly**: Clear visual feedback on auto-calculated values
4. **Flexible**: Manual override available when needed
