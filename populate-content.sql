-- RealSphere Content Population Script
-- This script adds 5 projects, 5 testimonials, and 5 news articles
-- Run this on your Railway PostgreSQL database

-- ============================================
-- PROJECTS (5 items)
-- ============================================

INSERT INTO projects (title, description, image_url, slug, content_html, created_at, updated_at)
VALUES 
(
  'Luxury Residential Complex - Sunset Hills',
  'A premium residential development featuring 200 luxury condominiums with state-of-the-art amenities, located in the heart of downtown.',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'luxury-residential-complex-sunset-hills',
  '<p>Sunset Hills represents the pinnacle of luxury living. This 200-unit residential complex features modern architecture, premium finishes, and world-class amenities including a rooftop pool, fitness center, and concierge services. Located in a prime downtown location with easy access to shopping, dining, and entertainment.</p><p><strong>Key Features:</strong></p><ul><li>200 luxury condominiums</li><li>Rooftop pool and terrace</li><li>State-of-the-art fitness center</li><li>24/7 concierge service</li><li>Underground parking</li><li>Pet-friendly community</li></ul>',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  content_html = EXCLUDED.content_html,
  updated_at = NOW();

INSERT INTO projects (title, description, image_url, slug, content_html, created_at, updated_at)
VALUES 
(
  'Commercial Office Tower - Tech Hub Plaza',
  'A modern 30-story commercial office building designed for tech companies and corporate headquarters with flexible floor plans and sustainable design.',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'commercial-office-tower-tech-hub-plaza',
  '<p>Tech Hub Plaza is a cutting-edge commercial development designed for the modern workforce. This LEED-certified building offers flexible office spaces, collaborative areas, and smart building technology. Perfect for tech companies, startups, and established corporations seeking premium office space.</p><p><strong>Amenities:</strong></p><ul><li>30 floors of premium office space</li><li>LEED Gold certification</li><li>High-speed fiber internet</li><li>Conference facilities</li><li>On-site café and dining</li><li>Green roof and outdoor spaces</li></ul>',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  content_html = EXCLUDED.content_html,
  updated_at = NOW();

INSERT INTO projects (title, description, image_url, slug, content_html, created_at, updated_at)
VALUES 
(
  'Mixed-Use Development - Riverside Quarter',
  'An innovative mixed-use development combining residential, retail, and entertainment spaces along the scenic riverfront.',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'mixed-use-development-riverside-quarter',
  '<p>Riverside Quarter is a vibrant mixed-use community that seamlessly blends residential living with retail and entertainment. This development features luxury apartments, boutique shops, restaurants, and a waterfront promenade, creating a self-contained community with everything residents need.</p><p><strong>Components:</strong></p><ul><li>350 luxury apartments</li><li>50,000 sq ft retail space</li><li>Waterfront restaurants</li><li>Entertainment plaza</li><li>Riverwalk promenade</li><li>Public parking garage</li></ul>',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  content_html = EXCLUDED.content_html,
  updated_at = NOW();

INSERT INTO projects (title, description, image_url, slug, content_html, created_at, updated_at)
VALUES 
(
  'Smart Home Community - Green Valley Estates',
  'An eco-friendly residential community featuring smart home technology, sustainable construction, and green spaces.',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'smart-home-community-green-valley-estates',
  '<p>Green Valley Estates combines cutting-edge smart home technology with sustainable living practices. Each home features integrated smart systems, energy-efficient appliances, and solar panel options. The community includes parks, walking trails, and community gardens.</p><p><strong>Features:</strong></p><ul><li>150 smart homes</li><li>Solar panel ready</li><li>Energy-efficient design</li><li>Community gardens</li><li>Walking trails and parks</li><li>EV charging stations</li></ul>',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  content_html = EXCLUDED.content_html,
  updated_at = NOW();

INSERT INTO projects (title, description, image_url, slug, content_html, created_at, updated_at)
VALUES 
(
  'Luxury Hotel & Residences - Grand Plaza',
  'A prestigious hotel and residential tower offering hotel services with private residences, featuring world-class amenities and stunning city views.',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'luxury-hotel-residences-grand-plaza',
  '<p>Grand Plaza represents the ultimate in luxury living and hospitality. This dual-purpose development offers hotel services to private residence owners, including housekeeping, concierge, and room service. Residents enjoy access to the hotel''s restaurants, spa, and event facilities.</p><p><strong>Amenities:</strong></p><ul><li>200 luxury residences</li><li>5-star hotel services</li><li>Fine dining restaurants</li><li>World-class spa</li><li>Rooftop infinity pool</li><li>Private event spaces</li></ul>',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  content_html = EXCLUDED.content_html,
  updated_at = NOW();

-- ============================================
-- TESTIMONIALS (5 items)
-- ============================================

INSERT INTO testimonials (name, image_url, content, date_added, created_at)
VALUES 
(
  'Sarah Johnson',
  'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  'RealSphere has transformed my investment portfolio. Their expert guidance helped me diversify into real estate, and I''ve seen consistent returns of 18% annually. The team is professional, responsive, and truly understands the market.',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

INSERT INTO testimonials (name, image_url, content, date_added, created_at)
VALUES 
(
  'Michael Chen',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  'As a first-time real estate investor, I was nervous about entering the market. RealSphere''s team provided exceptional support and education. My investment in the Sunset Hills project has already appreciated 25% in just 18 months.',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

INSERT INTO testimonials (name, image_url, content, date_added, created_at)
VALUES 
(
  'Emily Rodriguez',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  'The transparency and professionalism at RealSphere is unmatched. I receive detailed monthly reports and always know exactly how my investments are performing. The portfolio management service has been invaluable in optimizing my returns.',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

INSERT INTO testimonials (name, image_url, content, date_added, created_at)
VALUES 
(
  'David Thompson',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  'I''ve been investing with RealSphere for three years, and they continue to exceed expectations. Their risk management strategies have protected my investments during market fluctuations, and their property selection is always top-notch.',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

INSERT INTO testimonials (name, image_url, content, date_added, created_at)
VALUES 
(
  'Jennifer Martinez',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  'RealSphere made real estate investment accessible to me as a busy professional. Their hands-on approach means I don''t have to worry about property management while still earning excellent returns. Highly recommend their services!',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- ============================================
-- NEWS ARTICLES (5 items)
-- ============================================

INSERT INTO news (title, summary, content_html, image_url, slug, date, created_at)
VALUES 
(
  'Real Estate Market Shows Strong Growth in Q1 2025',
  'The real estate market continues its upward trajectory with commercial and residential properties showing significant appreciation. Experts predict sustained growth through 2025.',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'real-estate-market-shows-strong-growth-in-q1-2025',
  '<p>The first quarter of 2025 has shown remarkable strength in the real estate market, with both commercial and residential sectors experiencing significant growth. According to industry analysts, average property values have increased by 8.5% year-over-year, outpacing inflation and providing strong returns for investors.</p><p><strong>Key Highlights:</strong></p><ul><li>Commercial real estate values up 9.2%</li><li>Residential properties appreciating at 7.8%</li><li>Rental yields remain strong at 5-7%</li><li>Inventory levels stabilizing</li></ul><p>Market experts attribute this growth to several factors including low interest rates, strong economic fundamentals, and increasing demand for quality properties. The outlook for the remainder of 2025 remains positive, with continued growth expected in prime locations.</p>',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  content_html = EXCLUDED.content_html,
  image_url = EXCLUDED.image_url,
  updated_at = NOW();

INSERT INTO news (title, summary, content_html, image_url, slug, date, created_at)
VALUES 
(
  'Sustainable Building Practices Transform Real Estate Investment',
  'Green building initiatives are becoming a major factor in property investment decisions, with eco-friendly developments commanding premium prices and higher rental yields.',
  '<p>Sustainability is no longer just a trend—it''s a critical factor in real estate investment. Properties with green certifications and energy-efficient features are seeing increased demand and can command premium prices of 10-15% above comparable properties.</p><p><strong>Benefits of Sustainable Properties:</strong></p><ul><li>Lower operating costs for tenants</li><li>Higher property values</li><li>Increased tenant satisfaction</li><li>Future-proof investments</li><li>Tax incentives and rebates</li></ul><p>Investors are increasingly prioritizing LEED-certified buildings and properties with renewable energy systems. This shift reflects growing environmental awareness and the economic benefits of sustainable construction.</p>',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'sustainable-building-practices-transform-real-estate-investment',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  content_html = EXCLUDED.content_html,
  image_url = EXCLUDED.image_url,
  updated_at = NOW();

INSERT INTO news (title, summary, content_html, image_url, slug, date, created_at)
VALUES 
(
  'Technology Integration Reshapes Commercial Real Estate',
  'Smart building technology and IoT integration are revolutionizing commercial properties, creating new opportunities for investors and improving tenant experiences.',
  '<p>The integration of smart building technology is transforming commercial real estate, making properties more efficient, secure, and attractive to tenants. IoT sensors, automated systems, and AI-powered management platforms are becoming standard features in modern commercial developments.</p><p><strong>Technology Trends:</strong></p><ul><li>Automated HVAC and lighting systems</li><li>Smart security and access control</li><li>Energy monitoring and optimization</li><li>Tenant mobile apps</li><li>Predictive maintenance systems</li></ul><p>Properties with advanced technology integration are experiencing higher occupancy rates and can charge premium rents. Investors are recognizing the value of these features in attracting and retaining quality tenants.</p>',
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'technology-integration-reshapes-commercial-real-estate',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  content_html = EXCLUDED.content_html,
  image_url = EXCLUDED.image_url,
  updated_at = NOW();

INSERT INTO news (title, summary, content_html, image_url, slug, date, created_at)
VALUES 
(
  'Urban Redevelopment Projects Drive Economic Growth',
  'Major urban redevelopment initiatives are creating new investment opportunities in downtown areas, with mixed-use projects leading the way in revitalizing city centers.',
  '<p>Urban redevelopment projects are reshaping city centers across the country, creating vibrant mixed-use communities that combine residential, commercial, and entertainment spaces. These projects are generating significant economic activity and attracting investment capital.</p><p><strong>Redevelopment Benefits:</strong></p><ul><li>Job creation and economic stimulus</li><li>Improved infrastructure</li><li>Increased property values</li><li>Enhanced quality of life</li><li>Tourism and visitor attraction</li></ul><p>Investors are finding strong opportunities in these redevelopment zones, with early participants seeing substantial returns as projects mature and neighborhoods transform. The trend toward walkable, mixed-use communities is expected to continue.</p>',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'urban-redevelopment-projects-drive-economic-growth',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  content_html = EXCLUDED.content_html,
  image_url = EXCLUDED.image_url,
  updated_at = NOW();

INSERT INTO news (title, summary, content_html, image_url, slug, date, created_at)
VALUES 
(
  'Rental Market Stability Signals Strong Investment Climate',
  'The rental market remains stable with strong demand and steady rent growth, providing reliable income streams for real estate investors.',
  '<p>The rental market continues to demonstrate remarkable stability, with occupancy rates remaining high and rental income providing consistent returns for investors. Despite economic uncertainties, demand for quality rental properties remains strong.</p><p><strong>Market Indicators:</strong></p><ul><li>Average occupancy rates above 95%</li><li>Rent growth of 4-6% annually</li><li>Low vacancy rates in prime locations</li><li>Strong tenant demand</li><li>Stable rental yields</li></ul><p>This stability makes rental properties an attractive investment option for those seeking steady income streams. Property management companies are reporting strong tenant retention and minimal collection issues, indicating a healthy rental market.</p>',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  'rental-market-stability-signals-strong-investment-climate',
  NOW(),
  NOW()
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  summary = EXCLUDED.summary,
  content_html = EXCLUDED.content_html,
  image_url = EXCLUDED.image_url,
  updated_at = NOW();

-- Success message
SELECT 'Content population completed successfully! 5 projects, 5 testimonials, and 5 news articles added.' AS status;

