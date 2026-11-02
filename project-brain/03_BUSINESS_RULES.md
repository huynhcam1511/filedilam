# Business Rules

- Material unit cost = purchase price / usable quantity.
- Component cost = quantity × unit cost.
- Batch cost = component costs + direct extra cost; batch unit cost = batch cost / actual output.
- Finished cost = raw components + semi-finished components + packaging + direct costs.
- Food cost % = finished cost / selling price when selling price > 0.
- Suggested price = finished cost / target food cost when target is valid.
- One-level semi-finished recipes only; circular references are rejected.
- Missing price, quantity, output or broken ID makes the affected record incomplete.
