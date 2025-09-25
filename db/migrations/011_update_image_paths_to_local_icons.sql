-- Migration to update image fields to use local icon paths like mockFarms.js
-- This replaces base64 encoded images and external URLs with local icon paths

-- Update fields table to use local icon paths based on category/subcategory
UPDATE fields 
SET image = CASE 
    -- Handle subcategory first (more specific)
    WHEN subcategory = 'Tangerine' THEN '/icons/products/tangerine.png'
    WHEN subcategory = 'Watermelon' THEN '/icons/products/watermelon.png'
    
    -- Handle category mappings
    WHEN category = 'Green Apple' OR category = 'green-apple' THEN '/icons/products/apple_green.png'
    WHEN category = 'Red Apple' OR category = 'red-apple' THEN '/icons/products/apple_red.png'
    WHEN category = 'Watermelon' OR category = 'watermelon' THEN '/icons/products/watermelon.png'
    WHEN category = 'Tangerine' OR category = 'tangerine' THEN '/icons/products/tangerine.png'
    WHEN category = 'Peach' OR category = 'peach' THEN '/icons/products/peach.png'
    WHEN category = 'strawberry' THEN '/icons/products/strawberry.png'
    WHEN category = 'Strawberry' THEN '/icons/products/strawberry.png'
    WHEN category = 'Corn' OR category = 'corn' THEN '/icons/products/corn.png'
    WHEN category = 'Eggplant' OR category = 'eggplant' THEN '/icons/products/eggplant.png'
    WHEN category = 'Lemon' OR category = 'lemon' THEN '/icons/products/lemon.png'
    WHEN category = 'Tomato' OR category = 'tomato' THEN '/icons/products/tomato.png'
    
    -- Default fallback for Fruits category or unknown
    WHEN category = 'Fruits' OR category = 'fruits' THEN '/icons/products/apple_green.png'
    WHEN category = 'Vegetables' OR category = 'vegetables' THEN '/icons/products/tomato.png'
    
    -- Default fallback for any other case
    ELSE '/icons/products/apple_green.png'
END;

-- Update products table if it exists and has image column
UPDATE products 
SET image = CASE 
    -- Handle category mappings for products
    WHEN category = 'Green Apple' OR category = 'green-apple' THEN '/icons/products/apple_green.png'
    WHEN category = 'Red Apple' OR category = 'red-apple' THEN '/icons/products/apple_red.png'
    WHEN category = 'Watermelon' OR category = 'watermelon' THEN '/icons/products/watermelon.png'
    WHEN category = 'Tangerine' OR category = 'tangerine' THEN '/icons/products/tangerine.png'
    WHEN category = 'Peach' OR category = 'peach' THEN '/icons/products/peach.png'
    WHEN category = 'strawberry' OR category = 'Strawberry' THEN '/icons/products/strawberry.png'
    WHEN category = 'Corn' OR category = 'corn' THEN '/icons/products/corn.png'
    WHEN category = 'Eggplant' OR category = 'eggplant' THEN '/icons/products/eggplant.png'
    WHEN category = 'Lemon' OR category = 'lemon' THEN '/icons/products/lemon.png'
    WHEN category = 'Tomato' OR category = 'tomato' THEN '/icons/products/tomato.png'
    
    -- Default fallback for Fruits category or unknown
    WHEN category = 'Fruits' OR category = 'fruits' THEN '/icons/products/apple_green.png'
    WHEN category = 'Vegetables' OR category = 'vegetables' THEN '/icons/products/tomato.png'
    
    -- Default fallback for any other case
    ELSE '/icons/products/apple_green.png'
END
WHERE image IS NOT NULL;

-- Verify the changes
SELECT id, name, category, subcategory, image FROM fields LIMIT 10;