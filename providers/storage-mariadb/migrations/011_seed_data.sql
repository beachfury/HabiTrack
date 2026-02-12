-- Migration 011: Seed Data
-- Default chore templates and catalog items
-- Consolidated from migrations 010, 011

SET NAMES utf8mb4;

-- ============================================
-- DEFAULT CHORE TEMPLATES
-- Organized by category
-- Categories: 1=Cleaning, 2=Kitchen, 3=Laundry, 4=Outdoor, 5=Pet Care, 6=Other
-- ============================================

-- CLEANING TEMPLATES (categoryId = 1)
INSERT IGNORE INTO `chore_templates` (`name`, `description`, `categoryId`, `defaultPoints`, `estimatedMinutes`, `difficulty`, `requiresPhoto`, `requireApproval`, `isSystem`) VALUES
  ('Vacuum Living Room', 'Vacuum all carpets and rugs in the living room', 1, 15, 20, 'medium', 0, 0, 1),
  ('Vacuum Bedrooms', 'Vacuum all bedroom floors', 1, 15, 25, 'medium', 0, 0, 1),
  ('Mop Kitchen Floor', 'Sweep and mop the kitchen floor', 1, 15, 20, 'medium', 0, 0, 1),
  ('Mop Bathroom Floor', 'Sweep and mop bathroom floors', 1, 10, 15, 'easy', 0, 0, 1),
  ('Clean Bathroom Sink', 'Wipe down and sanitize bathroom sink and counter', 1, 10, 10, 'easy', 0, 0, 1),
  ('Clean Toilet', 'Clean and sanitize the toilet inside and out', 1, 15, 15, 'medium', 0, 0, 1),
  ('Clean Shower/Tub', 'Scrub and clean the shower or bathtub', 1, 20, 25, 'hard', 0, 0, 1),
  ('Dust Furniture', 'Dust all furniture surfaces in the living areas', 1, 10, 20, 'easy', 0, 0, 1),
  ('Dust Ceiling Fans', 'Clean dust from ceiling fan blades', 1, 10, 15, 'medium', 0, 0, 1),
  ('Clean Mirrors', 'Clean all mirrors in the house', 1, 10, 15, 'easy', 0, 0, 1),
  ('Clean Windows', 'Wash windows inside and out', 1, 25, 45, 'hard', 0, 0, 1),
  ('Wipe Door Handles', 'Sanitize all door handles and light switches', 1, 5, 10, 'easy', 0, 0, 1),
  ('Clean Baseboards', 'Wipe down all baseboards', 1, 15, 30, 'medium', 0, 0, 1),
  ('Organize Closet', 'Organize and tidy up closet', 1, 20, 30, 'medium', 0, 0, 1),
  ('Make Bed', 'Make the bed with fresh sheets or tidy existing bedding', 1, 5, 5, 'easy', 0, 0, 1),
  ('Change Bed Sheets', 'Remove old sheets and put on fresh ones', 1, 10, 15, 'easy', 0, 0, 1),
  ('Tidy Living Room', 'Pick up items, fluff pillows, organize living room', 1, 10, 15, 'easy', 0, 0, 1),
  ('Clean Garage', 'Sweep and organize the garage', 1, 30, 60, 'hard', 0, 0, 1);

-- KITCHEN TEMPLATES (categoryId = 2)
INSERT IGNORE INTO `chore_templates` (`name`, `description`, `categoryId`, `defaultPoints`, `estimatedMinutes`, `difficulty`, `requiresPhoto`, `requireApproval`, `isSystem`) VALUES
  ('Wash Dishes', 'Wash all dishes in the sink', 2, 10, 15, 'easy', 0, 0, 1),
  ('Load Dishwasher', 'Load dirty dishes into the dishwasher', 2, 10, 10, 'easy', 0, 0, 1),
  ('Unload Dishwasher', 'Put away clean dishes from the dishwasher', 2, 10, 10, 'easy', 0, 0, 1),
  ('Wipe Kitchen Counters', 'Clean and sanitize all kitchen countertops', 2, 10, 10, 'easy', 0, 0, 1),
  ('Clean Stovetop', 'Clean the stovetop and burners', 2, 15, 15, 'medium', 0, 0, 1),
  ('Clean Oven', 'Deep clean the inside of the oven', 2, 25, 45, 'hard', 0, 0, 1),
  ('Clean Microwave', 'Wipe down inside and outside of microwave', 2, 10, 10, 'easy', 0, 0, 1),
  ('Clean Refrigerator', 'Clean shelves and drawers, remove old food', 2, 25, 45, 'hard', 0, 0, 1),
  ('Organize Pantry', 'Organize pantry shelves and check expiration dates', 2, 20, 30, 'medium', 0, 0, 1),
  ('Take Out Trash', 'Empty kitchen trash and replace bag', 2, 5, 5, 'easy', 0, 0, 1),
  ('Take Out Recycling', 'Empty recycling bin and sort recyclables', 2, 5, 10, 'easy', 0, 0, 1),
  ('Clean Kitchen Sink', 'Scrub and sanitize kitchen sink', 2, 10, 10, 'easy', 0, 0, 1),
  ('Clean Coffee Maker', 'Clean and descale coffee maker', 2, 10, 15, 'easy', 0, 0, 1),
  ('Wipe Kitchen Appliances', 'Wipe down exterior of all kitchen appliances', 2, 10, 15, 'easy', 0, 0, 1),
  ('Set Table', 'Set the table for a meal', 2, 5, 5, 'easy', 0, 0, 1),
  ('Clear Table', 'Clear dishes and wipe down table after meal', 2, 5, 10, 'easy', 0, 0, 1),
  ('Prep Ingredients', 'Wash and prep ingredients for cooking', 2, 10, 20, 'easy', 0, 0, 1),
  ('Cook Dinner', 'Prepare and cook dinner for the family', 2, 30, 60, 'hard', 0, 0, 1),
  ('Pack Lunches', 'Prepare and pack lunches for tomorrow', 2, 15, 20, 'medium', 0, 0, 1);

-- LAUNDRY TEMPLATES (categoryId = 3)
INSERT IGNORE INTO `chore_templates` (`name`, `description`, `categoryId`, `defaultPoints`, `estimatedMinutes`, `difficulty`, `requiresPhoto`, `requireApproval`, `isSystem`) VALUES
  ('Do Laundry Load', 'Wash a load of laundry', 3, 10, 10, 'easy', 0, 0, 1),
  ('Dry Laundry', 'Move laundry to dryer or hang to dry', 3, 5, 10, 'easy', 0, 0, 1),
  ('Fold Laundry', 'Fold clean laundry', 3, 15, 20, 'medium', 0, 0, 1),
  ('Put Away Laundry', 'Put folded clothes away in drawers/closets', 3, 10, 15, 'easy', 0, 0, 1),
  ('Iron Clothes', 'Iron wrinkled clothing', 3, 15, 30, 'medium', 0, 0, 1),
  ('Wash Towels', 'Wash bathroom and kitchen towels', 3, 10, 10, 'easy', 0, 0, 1),
  ('Wash Bedding', 'Wash sheets, pillowcases, and blankets', 3, 15, 15, 'medium', 0, 0, 1),
  ('Sort Dirty Laundry', 'Sort laundry by color and fabric type', 3, 5, 10, 'easy', 0, 0, 1),
  ('Clean Washing Machine', 'Run cleaning cycle on washing machine', 3, 10, 5, 'easy', 0, 0, 1),
  ('Clean Dryer Lint Trap', 'Empty lint trap and clean dryer vent', 3, 5, 5, 'easy', 0, 0, 1);

-- OUTDOOR TEMPLATES (categoryId = 4)
INSERT IGNORE INTO `chore_templates` (`name`, `description`, `categoryId`, `defaultPoints`, `estimatedMinutes`, `difficulty`, `requiresPhoto`, `requireApproval`, `isSystem`) VALUES
  ('Mow Lawn', 'Mow the front and back lawn', 4, 30, 60, 'hard', 0, 0, 1),
  ('Water Plants', 'Water outdoor plants and garden', 4, 10, 20, 'easy', 0, 0, 1),
  ('Water Indoor Plants', 'Water all indoor houseplants', 4, 10, 15, 'easy', 0, 0, 1),
  ('Pull Weeds', 'Remove weeds from garden beds', 4, 20, 30, 'medium', 0, 0, 1),
  ('Rake Leaves', 'Rake and bag fallen leaves', 4, 25, 45, 'hard', 0, 0, 1),
  ('Sweep Porch/Patio', 'Sweep the porch, patio, or deck', 4, 10, 15, 'easy', 0, 0, 1),
  ('Clean Gutters', 'Remove debris from rain gutters', 4, 30, 60, 'hard', 0, 0, 1),
  ('Wash Car', 'Wash and dry the car', 4, 20, 45, 'medium', 0, 0, 1),
  ('Take Out Trash Bins', 'Move trash bins to curb for pickup', 4, 5, 5, 'easy', 0, 0, 1),
  ('Bring In Trash Bins', 'Bring trash bins back after pickup', 4, 5, 5, 'easy', 0, 0, 1),
  ('Shovel Snow', 'Shovel snow from driveway and walkways', 4, 30, 45, 'hard', 0, 0, 1),
  ('Trim Bushes', 'Trim and shape bushes and hedges', 4, 25, 45, 'hard', 0, 0, 1),
  ('Clean Grill', 'Clean the barbecue grill', 4, 20, 30, 'medium', 0, 0, 1),
  ('Organize Garage', 'Organize and clean the garage', 4, 30, 60, 'hard', 0, 0, 1),
  ('Check Mailbox', 'Get mail from the mailbox', 4, 5, 5, 'easy', 0, 0, 1);

-- PET CARE TEMPLATES (categoryId = 5)
INSERT IGNORE INTO `chore_templates` (`name`, `description`, `categoryId`, `defaultPoints`, `estimatedMinutes`, `difficulty`, `requiresPhoto`, `requireApproval`, `isSystem`) VALUES
  ('Feed Pets', 'Feed the pets their meal', 5, 5, 5, 'easy', 0, 0, 1),
  ('Fill Water Bowl', 'Refill pet water bowls with fresh water', 5, 5, 5, 'easy', 0, 0, 1),
  ('Walk Dog', 'Take the dog for a walk', 5, 15, 30, 'medium', 0, 0, 1),
  ('Clean Litter Box', 'Scoop and clean the cat litter box', 5, 10, 10, 'easy', 0, 0, 1),
  ('Brush Pet', 'Brush the pet to remove loose fur', 5, 10, 15, 'easy', 0, 0, 1),
  ('Give Pet Bath', 'Bathe the pet', 5, 25, 45, 'hard', 0, 0, 1),
  ('Clean Pet Bed', 'Wash or vacuum pet bed', 5, 15, 20, 'medium', 0, 0, 1),
  ('Clean Fish Tank', 'Clean aquarium and change water', 5, 25, 45, 'hard', 0, 0, 1),
  ('Clean Pet Cage', 'Clean cage for small pets (hamster, bird, etc.)', 5, 20, 30, 'medium', 0, 0, 1),
  ('Play with Pet', 'Spend quality play time with the pet', 5, 10, 20, 'easy', 0, 0, 1),
  ('Scoop Dog Poop', 'Clean up dog waste from the yard', 5, 10, 15, 'easy', 0, 0, 1),
  ('Give Pet Medicine', 'Administer medication to pet', 5, 10, 5, 'medium', 0, 0, 1);

-- OTHER/GENERAL TEMPLATES (categoryId = 6)
INSERT IGNORE INTO `chore_templates` (`name`, `description`, `categoryId`, `defaultPoints`, `estimatedMinutes`, `difficulty`, `requiresPhoto`, `requireApproval`, `isSystem`) VALUES
  ('Homework Time', 'Complete daily homework assignments', 6, 20, 60, 'medium', 0, 0, 1),
  ('Practice Instrument', 'Practice musical instrument', 6, 15, 30, 'medium', 0, 0, 1),
  ('Read for 30 Minutes', 'Read a book for 30 minutes', 6, 15, 30, 'easy', 0, 0, 1),
  ('Clean Room', 'Tidy up and clean personal room', 6, 15, 30, 'medium', 0, 0, 1),
  ('Organize Toys', 'Put toys away and organize play area', 6, 10, 20, 'easy', 0, 0, 1),
  ('Help with Groceries', 'Help bring in and put away groceries', 6, 10, 15, 'easy', 0, 0, 1),
  ('Sort Mail', 'Sort incoming mail and discard junk', 6, 5, 5, 'easy', 0, 0, 1),
  ('Change Light Bulbs', 'Replace burned out light bulbs', 6, 10, 10, 'easy', 0, 0, 1),
  ('Replace Batteries', 'Replace batteries in remotes, smoke detectors, etc.', 6, 10, 10, 'easy', 0, 0, 1),
  ('Organize Bookshelf', 'Organize and straighten books on shelf', 6, 10, 20, 'easy', 0, 0, 1),
  ('File Paperwork', 'Organize and file important documents', 6, 15, 30, 'medium', 0, 0, 1),
  ('Back Up Computer', 'Back up important computer files', 6, 10, 15, 'easy', 0, 0, 1),
  ('Check Smoke Detectors', 'Test smoke and carbon monoxide detectors', 6, 10, 10, 'easy', 0, 0, 1),
  ('Water Garden', 'Water vegetable or flower garden', 6, 10, 20, 'easy', 0, 0, 1),
  ('Prepare Backpack', 'Pack backpack for school tomorrow', 6, 5, 10, 'easy', 0, 0, 1),
  ('Lay Out Clothes', 'Set out clothes for tomorrow', 6, 5, 5, 'easy', 0, 0, 1);

-- ============================================
-- DEFAULT CATALOG ITEMS
-- Categories: 1=Produce, 2=Dairy, 3=Meat, 4=Bakery, 5=Frozen,
--            6=Pantry, 7=Beverages, 8=Household, 9=Personal Care, 10=Other
-- ============================================

-- PRODUCE (categoryId = 1)
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  ('Apples', 1, 1), ('Bananas', 1, 1), ('Oranges', 1, 1), ('Lemons', 1, 1), ('Limes', 1, 1),
  ('Grapes', 1, 1), ('Strawberries', 1, 1), ('Blueberries', 1, 1), ('Raspberries', 1, 1),
  ('Watermelon', 1, 1), ('Cantaloupe', 1, 1), ('Pineapple', 1, 1), ('Mango', 1, 1),
  ('Peaches', 1, 1), ('Pears', 1, 1), ('Cherries', 1, 1), ('Avocado', 1, 1),
  ('Lettuce', 1, 1), ('Spinach', 1, 1), ('Kale', 1, 1), ('Mixed Greens', 1, 1),
  ('Tomatoes', 1, 1), ('Cherry Tomatoes', 1, 1), ('Cucumbers', 1, 1), ('Bell Peppers', 1, 1),
  ('Onions', 1, 1), ('Red Onions', 1, 1), ('Green Onions', 1, 1), ('Garlic', 1, 1),
  ('Carrots', 1, 1), ('Celery', 1, 1), ('Broccoli', 1, 1), ('Cauliflower', 1, 1),
  ('Asparagus', 1, 1), ('Green Beans', 1, 1), ('Zucchini', 1, 1), ('Mushrooms', 1, 1),
  ('Potatoes', 1, 1), ('Sweet Potatoes', 1, 1), ('Fresh Basil', 1, 1), ('Fresh Cilantro', 1, 1);

-- DAIRY (categoryId = 2)
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  ('Whole Milk', 2, 1), ('2% Milk', 2, 1), ('Skim Milk', 2, 1), ('Almond Milk', 2, 1),
  ('Oat Milk', 2, 1), ('Half and Half', 2, 1), ('Heavy Cream', 2, 1),
  ('Cheddar Cheese', 2, 1), ('Shredded Cheddar', 2, 1), ('Mozzarella Cheese', 2, 1),
  ('Parmesan Cheese', 2, 1), ('Cream Cheese', 2, 1), ('Cottage Cheese', 2, 1),
  ('Greek Yogurt', 2, 1), ('Regular Yogurt', 2, 1), ('Eggs (dozen)', 2, 1),
  ('Butter', 2, 1), ('Unsalted Butter', 2, 1), ('Sour Cream', 2, 1);

-- MEAT & SEAFOOD (categoryId = 3)
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  ('Ground Beef', 3, 1), ('Beef Steaks', 3, 1), ('Beef Roast', 3, 1),
  ('Chicken Breasts', 3, 1), ('Chicken Thighs', 3, 1), ('Chicken Wings', 3, 1),
  ('Whole Chicken', 3, 1), ('Ground Chicken', 3, 1), ('Rotisserie Chicken', 3, 1),
  ('Pork Chops', 3, 1), ('Pork Tenderloin', 3, 1), ('Bacon', 3, 1), ('Ham', 3, 1),
  ('Italian Sausage', 3, 1), ('Hot Dogs', 3, 1), ('Ground Turkey', 3, 1),
  ('Salmon Fillets', 3, 1), ('Tilapia Fillets', 3, 1), ('Shrimp', 3, 1);

-- BAKERY (categoryId = 4)
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  ('White Bread', 4, 1), ('Wheat Bread', 4, 1), ('Sourdough Bread', 4, 1),
  ('Hamburger Buns', 4, 1), ('Hot Dog Buns', 4, 1), ('Dinner Rolls', 4, 1),
  ('Croissants', 4, 1), ('Bagels', 4, 1), ('English Muffins', 4, 1),
  ('Tortillas (flour)', 4, 1), ('Tortillas (corn)', 4, 1), ('Pita Bread', 4, 1);

-- FROZEN (categoryId = 5)
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  ('Frozen Pizza', 5, 1), ('Frozen Lasagna', 5, 1), ('Frozen Burritos', 5, 1),
  ('Frozen Chicken Nuggets', 5, 1), ('Frozen Fish Sticks', 5, 1),
  ('Frozen Peas', 5, 1), ('Frozen Corn', 5, 1), ('Frozen Broccoli', 5, 1),
  ('Frozen Mixed Vegetables', 5, 1), ('Frozen Strawberries', 5, 1),
  ('Frozen Blueberries', 5, 1), ('Frozen Waffles', 5, 1), ('Ice Cream', 5, 1),
  ('Frozen French Fries', 5, 1), ('Frozen Tater Tots', 5, 1);

-- PANTRY (categoryId = 6)
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  ('Spaghetti', 6, 1), ('Penne Pasta', 6, 1), ('Macaroni', 6, 1),
  ('White Rice', 6, 1), ('Brown Rice', 6, 1), ('Oatmeal', 6, 1),
  ('Canned Tomatoes', 6, 1), ('Tomato Sauce', 6, 1), ('Pasta Sauce', 6, 1),
  ('Canned Beans (black)', 6, 1), ('Canned Corn', 6, 1), ('Canned Tuna', 6, 1),
  ('Chicken Broth', 6, 1), ('All-Purpose Flour', 6, 1), ('Sugar', 6, 1),
  ('Brown Sugar', 6, 1), ('Olive Oil', 6, 1), ('Vegetable Oil', 6, 1),
  ('Ketchup', 6, 1), ('Mustard', 6, 1), ('Mayonnaise', 6, 1), ('Salsa', 6, 1),
  ('Salt', 6, 1), ('Black Pepper', 6, 1), ('Garlic Powder', 6, 1),
  ('Cereal', 6, 1), ('Pancake Mix', 6, 1), ('Peanut Butter', 6, 1),
  ('Jelly/Jam', 6, 1), ('Honey', 6, 1), ('Chips', 6, 1), ('Crackers', 6, 1);

-- BEVERAGES (categoryId = 7)
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  ('Bottled Water', 7, 1), ('Sparkling Water', 7, 1), ('Orange Juice', 7, 1),
  ('Apple Juice', 7, 1), ('Lemonade', 7, 1), ('Iced Tea', 7, 1),
  ('Coca-Cola', 7, 1), ('Sprite', 7, 1), ('Coffee (ground)', 7, 1),
  ('K-Cups', 7, 1), ('Tea Bags', 7, 1), ('Hot Chocolate Mix', 7, 1);

-- HOUSEHOLD (categoryId = 8)
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  ('Paper Towels', 8, 1), ('Toilet Paper', 8, 1), ('Tissues', 8, 1), ('Napkins', 8, 1),
  ('Dish Soap', 8, 1), ('Dishwasher Detergent', 8, 1), ('Laundry Detergent', 8, 1),
  ('Fabric Softener', 8, 1), ('All-Purpose Cleaner', 8, 1), ('Glass Cleaner', 8, 1),
  ('Disinfecting Wipes', 8, 1), ('Sponges', 8, 1), ('Trash Bags (kitchen)', 8, 1),
  ('Ziplock Bags', 8, 1), ('Aluminum Foil', 8, 1), ('Plastic Wrap', 8, 1),
  ('Batteries (AA)', 8, 1), ('Batteries (AAA)', 8, 1), ('Light Bulbs', 8, 1);

-- PERSONAL CARE (categoryId = 9)
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  ('Toothpaste', 9, 1), ('Toothbrush', 9, 1), ('Mouthwash', 9, 1), ('Dental Floss', 9, 1),
  ('Shampoo', 9, 1), ('Conditioner', 9, 1), ('Body Wash', 9, 1), ('Bar Soap', 9, 1),
  ('Hand Soap', 9, 1), ('Lotion', 9, 1), ('Deodorant', 9, 1), ('Razors', 9, 1),
  ('Band-Aids', 9, 1), ('Pain Reliever (Advil)', 9, 1), ('Pain Reliever (Tylenol)', 9, 1);

-- OTHER (categoryId = 10)
INSERT IGNORE INTO `catalog_items` (`name`, `categoryId`, `active`) VALUES
  ('Dog Food', 10, 1), ('Cat Food', 10, 1), ('Dog Treats', 10, 1), ('Cat Treats', 10, 1),
  ('Cat Litter', 10, 1), ('Printer Paper', 10, 1), ('Pens', 10, 1), ('Notebooks', 10, 1);
