
CREATE TABLE menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price REAL NOT NULL,
  category TEXT NOT NULL,
  image TEXT NOT NULL,
  is_popular BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_popular ON menu_items(is_popular);

INSERT INTO menu_items (name, description, price, category, image, is_popular) VALUES
('Original Fried Chicken', 'Our signature recipe - crispy golden coating with juicy meat inside', 12.99, 'Chicken Pieces', 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&q=80', 1),
('Spicy Fried Chicken', 'Extra kick with our special hot sauce blend', 13.99, 'Chicken Pieces', 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&q=80', 1),
('Honey Glazed Chicken', 'Sweet and savory with a sticky honey glaze', 14.99, 'Chicken Pieces', 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80', 0),
('Garlic Butter Chicken', 'Tossed in rich garlic butter sauce', 14.99, 'Chicken Pieces', 'https://images.unsplash.com/photo-1594221708779-94832f4320d1?w=800&q=80', 0),
('Family Feast', '12 pieces of mixed chicken, 4 sides, 4 biscuits', 39.99, 'Combo Meals', 'https://images.unsplash.com/photo-1633964913295-ceb43826dea7?w=800&q=80', 1),
('Classic Combo', '3 pieces chicken, 1 side, 1 biscuit, 1 drink', 15.99, 'Combo Meals', 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=800&q=80', 0),
('Deluxe Meal', '5 pieces chicken, 2 sides, 2 biscuits, 1 drink', 22.99, 'Combo Meals', 'https://images.unsplash.com/photo-1627662168781-d4099009f27a?w=800&q=80', 0),
('Mac & Cheese', 'Creamy, cheesy comfort food', 4.99, 'Sides', 'https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=800&q=80', 0),
('Coleslaw', 'Fresh and tangy cabbage slaw', 3.99, 'Sides', 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=800&q=80', 0),
('Mashed Potatoes & Gravy', 'Smooth, buttery potatoes with rich gravy', 4.49, 'Sides', 'https://images.unsplash.com/photo-1528607929212-2636ec44253e?w=800&q=80', 0),
('Corn on the Cob', 'Sweet buttered corn', 3.99, 'Sides', 'https://images.unsplash.com/photo-1551462147-37764e4b2f8e?w=800&q=80', 0),
('Biscuits', 'Warm, flaky buttermilk biscuits', 2.99, 'Sides', 'https://images.unsplash.com/photo-1618164436241-4473940d1f5c?w=800&q=80', 0),
('Soft Drinks', 'Coca-Cola, Sprite, Fanta, or Dr Pepper', 2.49, 'Drinks', 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=800&q=80', 0),
('Sweet Tea', 'Southern-style sweet iced tea', 2.99, 'Drinks', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80', 0),
('Lemonade', 'Fresh squeezed lemonade', 2.99, 'Drinks', 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9d?w=800&q=80', 0);
