# Database Schema

`MATERIALS`: id, name, category, purchaseQty, purchaseUnit, purchasePrice, usableQty, calcUnit, notes, active, updatedAt.

`SEMI_FINISHED_PRODUCTS`: id, name, outputQty, outputUnit, extraCost, notes, active, updatedAt.

`FINISHED_PRODUCTS`: id, name, sellingPrice, extraCost, targetFoodCost, notes, active, updatedAt.

`RECIPE_COMPONENTS`: id, recipeType, recipeId, componentType, componentId, quantity, componentUnit, isPackaging, updatedAt.

`SETTINGS`: key, value. `AUDIT_LOG`: timestamp, actor, action, entityType, entityId, detail.
