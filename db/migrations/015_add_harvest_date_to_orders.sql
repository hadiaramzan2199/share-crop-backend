-- Add harvest date columns to orders table
ALTER TABLE orders 
ADD COLUMN selected_harvest_date DATE,
ADD COLUMN selected_harvest_label VARCHAR(255);

-- Add comment for documentation
COMMENT ON COLUMN orders.selected_harvest_date IS 'The harvest date selected by the buyer when placing the order';
COMMENT ON COLUMN orders.selected_harvest_label IS 'Human-readable label for the selected harvest date (e.g., "Early Harvest - March 2024")';