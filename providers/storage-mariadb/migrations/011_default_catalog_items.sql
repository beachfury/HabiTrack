-- Migration 011: Default Shopping Catalog Items
-- Pre-populated catalog items shipped with HabiTrack

SET NAMES utf8mb4;

-- ============================================
-- DEFAULT CATALOG ITEMS
-- Organized by category
-- ============================================

-- Categories from migration 009:
-- 1=Produce, 2=Dairy, 3=Meat, 4=Bakery, 5=Frozen,
-- 6=Pantry, 7=Beverages, 8=Household, 9=Personal Care, 10=Other

-- ---------------------------------------------
-- PRODUCE (categoryId = 1)
-- ---------------------------------------------
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  -- Fruits
  ('Apples', 1, 1),
  ('Bananas', 1, 1),
  ('Oranges', 1, 1),
  ('Lemons', 1, 1),
  ('Limes', 1, 1),
  ('Grapes', 1, 1),
  ('Strawberries', 1, 1),
  ('Blueberries', 1, 1),
  ('Raspberries', 1, 1),
  ('Blackberries', 1, 1),
  ('Watermelon', 1, 1),
  ('Cantaloupe', 1, 1),
  ('Honeydew', 1, 1),
  ('Pineapple', 1, 1),
  ('Mango', 1, 1),
  ('Peaches', 1, 1),
  ('Pears', 1, 1),
  ('Plums', 1, 1),
  ('Cherries', 1, 1),
  ('Kiwi', 1, 1),
  ('Avocado', 1, 1),
  -- Vegetables
  ('Lettuce', 1, 1),
  ('Spinach', 1, 1),
  ('Kale', 1, 1),
  ('Arugula', 1, 1),
  ('Mixed Greens', 1, 1),
  ('Tomatoes', 1, 1),
  ('Cherry Tomatoes', 1, 1),
  ('Cucumbers', 1, 1),
  ('Bell Peppers', 1, 1),
  ('Jalapeños', 1, 1),
  ('Onions', 1, 1),
  ('Red Onions', 1, 1),
  ('Green Onions', 1, 1),
  ('Garlic', 1, 1),
  ('Ginger', 1, 1),
  ('Carrots', 1, 1),
  ('Celery', 1, 1),
  ('Broccoli', 1, 1),
  ('Cauliflower', 1, 1),
  ('Cabbage', 1, 1),
  ('Brussels Sprouts', 1, 1),
  ('Asparagus', 1, 1),
  ('Green Beans', 1, 1),
  ('Zucchini', 1, 1),
  ('Yellow Squash', 1, 1),
  ('Eggplant', 1, 1),
  ('Mushrooms', 1, 1),
  ('Corn on the Cob', 1, 1),
  ('Potatoes', 1, 1),
  ('Sweet Potatoes', 1, 1),
  ('Russet Potatoes', 1, 1),
  ('Red Potatoes', 1, 1),
  -- Herbs
  ('Fresh Basil', 1, 1),
  ('Fresh Cilantro', 1, 1),
  ('Fresh Parsley', 1, 1),
  ('Fresh Mint', 1, 1),
  ('Fresh Rosemary', 1, 1),
  ('Fresh Thyme', 1, 1);

-- ---------------------------------------------
-- DAIRY (categoryId = 2)
-- ---------------------------------------------
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  -- Milk
  ('Whole Milk', 2, 1),
  ('2% Milk', 2, 1),
  ('Skim Milk', 2, 1),
  ('Almond Milk', 2, 1),
  ('Oat Milk', 2, 1),
  ('Soy Milk', 2, 1),
  ('Half and Half', 2, 1),
  ('Heavy Cream', 2, 1),
  ('Whipping Cream', 2, 1),
  -- Cheese
  ('Cheddar Cheese', 2, 1),
  ('Shredded Cheddar', 2, 1),
  ('Mozzarella Cheese', 2, 1),
  ('Shredded Mozzarella', 2, 1),
  ('Parmesan Cheese', 2, 1),
  ('Swiss Cheese', 2, 1),
  ('Provolone Cheese', 2, 1),
  ('American Cheese', 2, 1),
  ('Cream Cheese', 2, 1),
  ('Cottage Cheese', 2, 1),
  ('Ricotta Cheese', 2, 1),
  ('Feta Cheese', 2, 1),
  ('Blue Cheese', 2, 1),
  ('Goat Cheese', 2, 1),
  ('String Cheese', 2, 1),
  -- Yogurt
  ('Greek Yogurt', 2, 1),
  ('Regular Yogurt', 2, 1),
  ('Vanilla Yogurt', 2, 1),
  ('Strawberry Yogurt', 2, 1),
  -- Eggs & Butter
  ('Eggs (dozen)', 2, 1),
  ('Eggs (18 count)', 2, 1),
  ('Egg Whites', 2, 1),
  ('Butter', 2, 1),
  ('Unsalted Butter', 2, 1),
  ('Margarine', 2, 1),
  ('Sour Cream', 2, 1);

-- ---------------------------------------------
-- MEAT & SEAFOOD (categoryId = 3)
-- ---------------------------------------------
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  -- Beef
  ('Ground Beef', 3, 1),
  ('Ground Beef (lean)', 3, 1),
  ('Beef Steaks', 3, 1),
  ('Ribeye Steak', 3, 1),
  ('Sirloin Steak', 3, 1),
  ('Beef Roast', 3, 1),
  ('Stew Meat', 3, 1),
  -- Chicken
  ('Chicken Breasts', 3, 1),
  ('Chicken Thighs', 3, 1),
  ('Chicken Wings', 3, 1),
  ('Chicken Drumsticks', 3, 1),
  ('Whole Chicken', 3, 1),
  ('Ground Chicken', 3, 1),
  ('Rotisserie Chicken', 3, 1),
  -- Pork
  ('Pork Chops', 3, 1),
  ('Pork Tenderloin', 3, 1),
  ('Pork Roast', 3, 1),
  ('Ground Pork', 3, 1),
  ('Bacon', 3, 1),
  ('Ham', 3, 1),
  ('Sausage Links', 3, 1),
  ('Italian Sausage', 3, 1),
  ('Breakfast Sausage', 3, 1),
  ('Hot Dogs', 3, 1),
  -- Turkey
  ('Ground Turkey', 3, 1),
  ('Turkey Breast', 3, 1),
  ('Deli Turkey', 3, 1),
  -- Seafood
  ('Salmon Fillets', 3, 1),
  ('Tilapia Fillets', 3, 1),
  ('Cod Fillets', 3, 1),
  ('Tuna Steaks', 3, 1),
  ('Shrimp', 3, 1),
  ('Crab Meat', 3, 1),
  ('Lobster Tails', 3, 1),
  -- Deli
  ('Deli Ham', 3, 1),
  ('Deli Roast Beef', 3, 1),
  ('Deli Salami', 3, 1),
  ('Pepperoni', 3, 1);

-- ---------------------------------------------
-- BAKERY (categoryId = 4)
-- ---------------------------------------------
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  ('White Bread', 4, 1),
  ('Wheat Bread', 4, 1),
  ('Whole Grain Bread', 4, 1),
  ('Sourdough Bread', 4, 1),
  ('French Bread', 4, 1),
  ('Italian Bread', 4, 1),
  ('Rye Bread', 4, 1),
  ('Hamburger Buns', 4, 1),
  ('Hot Dog Buns', 4, 1),
  ('Dinner Rolls', 4, 1),
  ('Croissants', 4, 1),
  ('Bagels', 4, 1),
  ('English Muffins', 4, 1),
  ('Tortillas (flour)', 4, 1),
  ('Tortillas (corn)', 4, 1),
  ('Pita Bread', 4, 1),
  ('Naan Bread', 4, 1),
  ('Muffins', 4, 1),
  ('Donuts', 4, 1),
  ('Cookies', 4, 1),
  ('Cake', 4, 1),
  ('Pie', 4, 1),
  ('Cupcakes', 4, 1),
  ('Brownies', 4, 1);

-- ---------------------------------------------
-- FROZEN (categoryId = 5)
-- ---------------------------------------------
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  -- Frozen Meals
  ('Frozen Pizza', 5, 1),
  ('Frozen Lasagna', 5, 1),
  ('Frozen Burritos', 5, 1),
  ('TV Dinners', 5, 1),
  ('Frozen Chicken Nuggets', 5, 1),
  ('Frozen Fish Sticks', 5, 1),
  ('Frozen Pot Pies', 5, 1),
  -- Frozen Vegetables
  ('Frozen Peas', 5, 1),
  ('Frozen Corn', 5, 1),
  ('Frozen Green Beans', 5, 1),
  ('Frozen Broccoli', 5, 1),
  ('Frozen Mixed Vegetables', 5, 1),
  ('Frozen Spinach', 5, 1),
  ('Frozen Stir Fry Mix', 5, 1),
  -- Frozen Fruits
  ('Frozen Strawberries', 5, 1),
  ('Frozen Blueberries', 5, 1),
  ('Frozen Mixed Berries', 5, 1),
  ('Frozen Mango', 5, 1),
  -- Frozen Breakfast
  ('Frozen Waffles', 5, 1),
  ('Frozen Pancakes', 5, 1),
  ('Frozen Breakfast Sandwiches', 5, 1),
  ('Frozen Hash Browns', 5, 1),
  -- Ice Cream & Desserts
  ('Ice Cream', 5, 1),
  ('Frozen Yogurt', 5, 1),
  ('Popsicles', 5, 1),
  ('Ice Cream Sandwiches', 5, 1),
  ('Frozen Pie', 5, 1),
  ('Frozen Cookie Dough', 5, 1),
  -- Other Frozen
  ('Frozen French Fries', 5, 1),
  ('Frozen Tater Tots', 5, 1),
  ('Frozen Onion Rings', 5, 1),
  ('Frozen Mozzarella Sticks', 5, 1),
  ('Frozen Shrimp', 5, 1),
  ('Frozen Salmon', 5, 1);

-- ---------------------------------------------
-- PANTRY (categoryId = 6)
-- ---------------------------------------------
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  -- Pasta & Grains
  ('Spaghetti', 6, 1),
  ('Penne Pasta', 6, 1),
  ('Fettuccine', 6, 1),
  ('Macaroni', 6, 1),
  ('Lasagna Noodles', 6, 1),
  ('Egg Noodles', 6, 1),
  ('White Rice', 6, 1),
  ('Brown Rice', 6, 1),
  ('Jasmine Rice', 6, 1),
  ('Basmati Rice', 6, 1),
  ('Quinoa', 6, 1),
  ('Oatmeal', 6, 1),
  ('Instant Oatmeal', 6, 1),
  ('Couscous', 6, 1),
  -- Canned Goods
  ('Canned Tomatoes', 6, 1),
  ('Tomato Sauce', 6, 1),
  ('Tomato Paste', 6, 1),
  ('Pasta Sauce', 6, 1),
  ('Canned Beans (black)', 6, 1),
  ('Canned Beans (kidney)', 6, 1),
  ('Canned Beans (pinto)', 6, 1),
  ('Canned Chickpeas', 6, 1),
  ('Canned Corn', 6, 1),
  ('Canned Green Beans', 6, 1),
  ('Canned Peas', 6, 1),
  ('Canned Tuna', 6, 1),
  ('Canned Salmon', 6, 1),
  ('Canned Chicken', 6, 1),
  ('Chicken Broth', 6, 1),
  ('Beef Broth', 6, 1),
  ('Vegetable Broth', 6, 1),
  ('Canned Soup', 6, 1),
  ('Canned Chili', 6, 1),
  -- Baking
  ('All-Purpose Flour', 6, 1),
  ('Whole Wheat Flour', 6, 1),
  ('Sugar', 6, 1),
  ('Brown Sugar', 6, 1),
  ('Powdered Sugar', 6, 1),
  ('Baking Soda', 6, 1),
  ('Baking Powder', 6, 1),
  ('Vanilla Extract', 6, 1),
  ('Chocolate Chips', 6, 1),
  ('Cocoa Powder', 6, 1),
  ('Yeast', 6, 1),
  ('Cornstarch', 6, 1),
  -- Oils & Condiments
  ('Olive Oil', 6, 1),
  ('Vegetable Oil', 6, 1),
  ('Canola Oil', 6, 1),
  ('Coconut Oil', 6, 1),
  ('Cooking Spray', 6, 1),
  ('Vinegar (white)', 6, 1),
  ('Apple Cider Vinegar', 6, 1),
  ('Balsamic Vinegar', 6, 1),
  ('Soy Sauce', 6, 1),
  ('Worcestershire Sauce', 6, 1),
  ('Hot Sauce', 6, 1),
  ('Ketchup', 6, 1),
  ('Mustard', 6, 1),
  ('Mayonnaise', 6, 1),
  ('BBQ Sauce', 6, 1),
  ('Salsa', 6, 1),
  ('Ranch Dressing', 6, 1),
  ('Italian Dressing', 6, 1),
  -- Spices
  ('Salt', 6, 1),
  ('Black Pepper', 6, 1),
  ('Garlic Powder', 6, 1),
  ('Onion Powder', 6, 1),
  ('Paprika', 6, 1),
  ('Cumin', 6, 1),
  ('Chili Powder', 6, 1),
  ('Oregano', 6, 1),
  ('Basil (dried)', 6, 1),
  ('Italian Seasoning', 6, 1),
  ('Cinnamon', 6, 1),
  ('Nutmeg', 6, 1),
  ('Cayenne Pepper', 6, 1),
  -- Breakfast & Snacks
  ('Cereal', 6, 1),
  ('Granola', 6, 1),
  ('Pancake Mix', 6, 1),
  ('Maple Syrup', 6, 1),
  ('Honey', 6, 1),
  ('Peanut Butter', 6, 1),
  ('Almond Butter', 6, 1),
  ('Jelly/Jam', 6, 1),
  ('Nutella', 6, 1),
  ('Crackers', 6, 1),
  ('Chips', 6, 1),
  ('Tortilla Chips', 6, 1),
  ('Popcorn', 6, 1),
  ('Pretzels', 6, 1),
  ('Nuts (mixed)', 6, 1),
  ('Almonds', 6, 1),
  ('Peanuts', 6, 1),
  ('Cashews', 6, 1),
  ('Trail Mix', 6, 1),
  ('Granola Bars', 6, 1),
  ('Dried Fruit', 6, 1),
  ('Raisins', 6, 1);

-- ---------------------------------------------
-- BEVERAGES (categoryId = 7)
-- ---------------------------------------------
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  ('Bottled Water', 7, 1),
  ('Sparkling Water', 7, 1),
  ('Orange Juice', 7, 1),
  ('Apple Juice', 7, 1),
  ('Grape Juice', 7, 1),
  ('Cranberry Juice', 7, 1),
  ('Lemonade', 7, 1),
  ('Iced Tea', 7, 1),
  ('Coca-Cola', 7, 1),
  ('Pepsi', 7, 1),
  ('Sprite', 7, 1),
  ('Ginger Ale', 7, 1),
  ('Root Beer', 7, 1),
  ('Dr Pepper', 7, 1),
  ('Mountain Dew', 7, 1),
  ('Diet Coke', 7, 1),
  ('Coffee (ground)', 7, 1),
  ('Coffee (whole bean)', 7, 1),
  ('K-Cups', 7, 1),
  ('Instant Coffee', 7, 1),
  ('Tea Bags', 7, 1),
  ('Green Tea', 7, 1),
  ('Herbal Tea', 7, 1),
  ('Hot Chocolate Mix', 7, 1),
  ('Sports Drinks', 7, 1),
  ('Energy Drinks', 7, 1),
  ('Coconut Water', 7, 1),
  ('Kombucha', 7, 1),
  ('Beer', 7, 1),
  ('Wine', 7, 1);

-- ---------------------------------------------
-- HOUSEHOLD (categoryId = 8)
-- ---------------------------------------------
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  -- Cleaning Supplies
  ('Paper Towels', 8, 1),
  ('Toilet Paper', 8, 1),
  ('Tissues', 8, 1),
  ('Napkins', 8, 1),
  ('Dish Soap', 8, 1),
  ('Dishwasher Detergent', 8, 1),
  ('Laundry Detergent', 8, 1),
  ('Fabric Softener', 8, 1),
  ('Dryer Sheets', 8, 1),
  ('Bleach', 8, 1),
  ('All-Purpose Cleaner', 8, 1),
  ('Glass Cleaner', 8, 1),
  ('Bathroom Cleaner', 8, 1),
  ('Toilet Bowl Cleaner', 8, 1),
  ('Floor Cleaner', 8, 1),
  ('Disinfecting Wipes', 8, 1),
  ('Sponges', 8, 1),
  ('Scrub Brushes', 8, 1),
  ('Mop Refills', 8, 1),
  ('Broom', 8, 1),
  ('Dustpan', 8, 1),
  -- Trash & Storage
  ('Trash Bags (kitchen)', 8, 1),
  ('Trash Bags (large)', 8, 1),
  ('Recycling Bags', 8, 1),
  ('Ziplock Bags', 8, 1),
  ('Aluminum Foil', 8, 1),
  ('Plastic Wrap', 8, 1),
  ('Parchment Paper', 8, 1),
  ('Food Storage Containers', 8, 1),
  -- Other Household
  ('Light Bulbs', 8, 1),
  ('Batteries (AA)', 8, 1),
  ('Batteries (AAA)', 8, 1),
  ('Batteries (9V)', 8, 1),
  ('Air Freshener', 8, 1),
  ('Candles', 8, 1),
  ('Matches/Lighter', 8, 1),
  ('Duct Tape', 8, 1),
  ('Scotch Tape', 8, 1),
  ('Glue', 8, 1),
  ('Scissors', 8, 1),
  ('Paper Plates', 8, 1),
  ('Plastic Cups', 8, 1),
  ('Plastic Utensils', 8, 1);

-- ---------------------------------------------
-- PERSONAL CARE (categoryId = 9)
-- ---------------------------------------------
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  -- Oral Care
  ('Toothpaste', 9, 1),
  ('Toothbrush', 9, 1),
  ('Mouthwash', 9, 1),
  ('Dental Floss', 9, 1),
  -- Hair Care
  ('Shampoo', 9, 1),
  ('Conditioner', 9, 1),
  ('Hair Gel', 9, 1),
  ('Hair Spray', 9, 1),
  ('Hair Brush', 9, 1),
  -- Body Care
  ('Body Wash', 9, 1),
  ('Bar Soap', 9, 1),
  ('Hand Soap', 9, 1),
  ('Lotion', 9, 1),
  ('Sunscreen', 9, 1),
  ('Deodorant', 9, 1),
  ('Razors', 9, 1),
  ('Shaving Cream', 9, 1),
  -- Face Care
  ('Face Wash', 9, 1),
  ('Face Moisturizer', 9, 1),
  ('Makeup Remover', 9, 1),
  ('Cotton Balls', 9, 1),
  ('Cotton Swabs', 9, 1),
  -- Health
  ('Band-Aids', 9, 1),
  ('Pain Reliever (Advil)', 9, 1),
  ('Pain Reliever (Tylenol)', 9, 1),
  ('Antihistamines', 9, 1),
  ('Cold Medicine', 9, 1),
  ('Cough Drops', 9, 1),
  ('Vitamins', 9, 1),
  ('First Aid Kit', 9, 1),
  -- Baby
  ('Diapers', 9, 1),
  ('Baby Wipes', 9, 1),
  ('Baby Formula', 9, 1),
  ('Baby Food', 9, 1),
  ('Baby Shampoo', 9, 1),
  -- Feminine Care
  ('Tampons', 9, 1),
  ('Pads', 9, 1),
  ('Panty Liners', 9, 1);

-- ---------------------------------------------
-- OTHER (categoryId = 10)
-- ---------------------------------------------
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  -- Pet Supplies
  ('Dog Food', 10, 1),
  ('Cat Food', 10, 1),
  ('Dog Treats', 10, 1),
  ('Cat Treats', 10, 1),
  ('Cat Litter', 10, 1),
  ('Pet Shampoo', 10, 1),
  ('Pet Toys', 10, 1),
  -- Office/School
  ('Printer Paper', 10, 1),
  ('Pens', 10, 1),
  ('Pencils', 10, 1),
  ('Notebooks', 10, 1),
  ('Folders', 10, 1),
  ('Stapler', 10, 1),
  ('Staples', 10, 1),
  ('Paper Clips', 10, 1),
  ('Envelopes', 10, 1),
  ('Stamps', 10, 1),
  -- Seasonal
  ('Sunscreen', 10, 1),
  ('Bug Spray', 10, 1),
  ('Ice Melt', 10, 1),
  -- Miscellaneous
  ('Gift Cards', 10, 1),
  ('Greeting Cards', 10, 1),
  ('Wrapping Paper', 10, 1),
  ('Party Supplies', 10, 1),
  ('Balloons', 10, 1);
