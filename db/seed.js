const { getDB, initDB } = require('./schema');
const bcrypt = require('bcryptjs');

// Initialize database first
initDB();
const db = getDB();

// Helper: current timestamp for SQLite
const NOW = new Date().toISOString();
function hoursAgo(h) {
  return new Date(Date.now() - h * 3600000).toISOString();
}

// Clear existing data
db.exec('DELETE FROM chat_messages');
db.exec('DELETE FROM chat_threads');
db.exec('DELETE FROM property_views');
db.exec('DELETE FROM saved_searches');
db.exec('DELETE FROM saved_properties');
db.exec('DELETE FROM properties');
db.exec('DELETE FROM agents');
db.exec('DELETE FROM users');

// South African cities and suburbs with coordinates
const suburbs = {
  Gauteng: [
    { name: 'Sandton', city: 'Johannesburg', lat: -26.1088, lng: 28.0555 },
    { name: 'Morningside', city: 'Johannesburg', lat: -26.1389, lng: 28.0786 },
    { name: 'Rosebank', city: 'Johannesburg', lat: -26.1489, lng: 28.0364 },
    { name: 'Sunninghill', city: 'Johannesburg', lat: -26.1155, lng: 28.0436 },
    { name: 'Midrand', city: 'Johannesburg', lat: -25.9822, lng: 28.1024 },
    { name: 'Hyde Park', city: 'Johannesburg', lat: -26.1189, lng: 28.0164 },
    { name: 'Fourways', city: 'Johannesburg', lat: -25.9969, lng: 28.0169 },
    { name: 'Waterfall', city: 'Johannesburg', lat: -25.9707, lng: 28.0703 },
    { name: 'Bryanston', city: 'Johannesburg', lat: -26.0936, lng: 28.0297 },
    { name: 'Rivonia', city: 'Johannesburg', lat: -26.0725, lng: 28.0953 },
    { name: 'The Woodlands', city: 'Johannesburg', lat: -26.0850, lng: 28.1139 },
    { name: 'Beaulieu', city: 'Johannesburg', lat: -26.0664, lng: 28.0975 },
    { name: 'Pretoria East', city: 'Pretoria', lat: -25.7359, lng: 28.3119 },
    { name: 'Menlyn', city: 'Pretoria', lat: -25.7542, lng: 28.2819 },
    { name: 'Centurion', city: 'Pretoria', lat: -25.8869, lng: 28.2225 },
    { name: 'Montana', city: 'Pretoria', lat: -25.7014, lng: 28.2300 },
    { name: 'Hillcrest', city: 'Pretoria', lat: -25.7522, lng: 28.2050 },
  ],
  'Western Cape': [
    { name: 'Camps Bay', city: 'Cape Town', lat: -33.9365, lng: 18.3744 },
    { name: 'Constantia', city: 'Cape Town', lat: -34.0392, lng: 18.4118 },
    { name: 'Oranjezicht', city: 'Cape Town', lat: -33.9345, lng: 18.3805 },
    { name: 'Clifton', city: 'Cape Town', lat: -33.9437, lng: 18.3703 },
    { name: 'Bakoven', city: 'Cape Town', lat: -33.9417, lng: 18.3707 },
    { name: 'Sea Point', city: 'Cape Town', lat: -33.9277, lng: 18.3952 },
    { name: 'Llandudno', city: 'Cape Town', lat: -33.9705, lng: 18.3408 },
    { name: 'Knysna', city: 'Knysna', lat: -34.4331, lng: 23.0413 },
    { name: 'Stellenbosch', city: 'Stellenbosch', lat: -33.9312, lng: 18.8645 },
    { name: 'Paarl', city: 'Paarl', lat: -33.7275, lng: 18.9695 },
    { name: 'Franschhoek', city: 'Franschhoek', lat: -33.8949, lng: 19.1183 },
    { name: 'Hout Bay', city: 'Cape Town', lat: -34.0355, lng: 18.3619 },
    { name: 'Southern Suburbs', city: 'Cape Town', lat: -34.0500, lng: 18.4500 },
    { name: "Gordon's Bay", city: "Gordon's Bay", lat: -34.1780, lng: 18.8567 },
    // Hermanus suburbs with accurate GPS coordinates
    { name: 'Voelklip', city: 'Hermanus', lat: -34.4180, lng: 19.2520 },
    { name: 'Onrus', city: 'Hermanus', lat: -34.4130, lng: 19.1780 },
    { name: 'Sandbaai', city: 'Hermanus', lat: -34.4350, lng: 19.2080 },
    { name: 'Vermont', city: 'Hermanus', lat: -34.4250, lng: 19.1950 },
    { name: 'Fernkloof', city: 'Hermanus', lat: -34.4100, lng: 19.2450 },
    { name: 'Eastcliff', city: 'Hermanus', lat: -34.4150, lng: 19.2600 },
    { name: 'Westcliff', city: 'Hermanus', lat: -34.4130, lng: 19.2280 },
    { name: 'Hermanus CBD', city: 'Hermanus', lat: -34.4214, lng: 19.2369 },
    { name: 'Hemel-en-Aarde Valley', city: 'Hermanus', lat: -34.3800, lng: 19.2650 },
    { name: 'Fisherhaven', city: 'Hermanus', lat: -34.3950, lng: 19.1450 },
    { name: 'Hawston', city: 'Hermanus', lat: -34.4080, lng: 19.1580 },
    { name: 'Grotto Beach', city: 'Hermanus', lat: -34.4220, lng: 19.2680 },
    { name: 'Northcliff', city: 'Hermanus', lat: -34.4050, lng: 19.2350 },
    { name: 'Chanteclair', city: 'Hermanus', lat: -34.4000, lng: 19.2200 },
    { name: 'Berghof', city: 'Hermanus', lat: -34.4100, lng: 19.2150 },
  ],
  KZN: [
    { name: 'uMhlanga', city: 'Durban', lat: -29.7251, lng: 31.1210 },
    { name: 'Ballito', city: 'Durban', lat: -29.5261, lng: 31.2319 },
    { name: 'Umhlanga Ridge', city: 'Durban', lat: -29.7167, lng: 31.1256 },
    { name: 'La Lucia', city: 'Durban', lat: -29.7100, lng: 31.0923 },
    { name: 'Glenashley', city: 'Durban', lat: -29.7289, lng: 31.1028 },
    { name: 'Westville', city: 'Durban', lat: -29.8244, lng: 30.9403 },
    { name: 'Kloof', city: 'Durban', lat: -29.8097, lng: 30.8636 },
    { name: 'Umhlanga Rocks', city: 'Durban', lat: -29.7268, lng: 31.1176 },
    { name: 'Berea', city: 'Durban', lat: -29.8656, lng: 31.0175 },
    { name: 'Point Waterfront', city: 'Durban', lat: -29.8708, lng: 31.0239 },
  ],
  Other: [
    { name: 'Bloemfontein', city: 'Bloemfontein', lat: -29.1192, lng: 25.5074 },
    { name: 'Port Elizabeth', city: 'Port Elizabeth', lat: -33.9717, lng: 25.6067 },
    { name: 'George', city: 'George', lat: -34.1991, lng: 22.4605 },
    { name: 'Nelspruit', city: 'Nelspruit', lat: -25.4833, lng: 30.9667 },
    { name: 'Pietermaritzburg', city: 'Pietermaritzburg', lat: -29.6111, lng: 30.2119 },
    { name: 'Rustenburg', city: 'Rustenburg', lat: -25.6755, lng: 27.2379 },
  ],
};

// Flatten suburbs for easier access
const allSuburbs = [];
Object.entries(suburbs).forEach(([province, subs]) => {
  subs.forEach(sub => {
    allSuburbs.push({ ...sub, province });
  });
});

// Test users - diverse SA names
const testUsers = [
  { name: 'Cornel Schoeman', email: 'cornel@tideshift.co.za' },
  { name: 'Amara Dlamini', email: 'amara.dlamini@email.com' },
  { name: 'Thandi Mthembu', email: 'thandi.m@email.com' },
  { name: 'Johan van der Merwe', email: 'johan.vdm@email.com' },
  { name: 'Naledi Mokoena', email: 'naledi.m@email.com' },
  { name: "Liam O'Connor", email: 'liam.oconnor@email.com' },
  { name: 'Zola Ngcobo', email: 'zola.n@email.com' },
  { name: 'Sophie Du Plessis', email: 'sophie.dp@email.com' },
];

// Agencies
const agencies = [
  { name: 'Century 21 SA', phone: '0861 007 007' },
  { name: "Lew Geffen Sotheby's International", phone: '021 794 3800' },
  { name: 'Seeff Properties', phone: '021 911 1111' },
  { name: 'Harcourts', phone: '011 789 1234' },
  { name: 'Pam Golding Properties', phone: '011 700 4000' },
  { name: 'Engel & Völkers', phone: '021 415 8888' },
  { name: 'RE/MAX', phone: '011 883 7100' },
  { name: 'Chas Everitt International', phone: '011 784 3200' },
];

// Property features
const features = [
  'Pool', 'Borehole', 'Solar panels', 'Generator', 'Security estate', 'Staff quarters',
  'Braai area', 'Fireplace', 'Fibre ready', 'Home automation', 'Wine cellar', 'Tennis court',
  'Gym', 'Sauna', 'Pet friendly', 'Garden', 'Balcony', 'Ocean views', 'Mountain views',
  'City views', 'Double garage', 'Air conditioning', 'Smart home', 'Underfloor heating',
  'Whale watching', 'Near beach', 'Infinity pool', 'Home cinema', 'Fynbos garden',
  'Cliff path access', 'Lagoon views', 'Bird watching', 'Slipway', 'Heated pool',
  'Guest house income', 'Airbnb potential', 'Surfing', 'Architect-designed', 'Rim-flow pool',
  'Loxone system', 'Smallholding', 'Dam', 'Paddocks', 'Country living', 'Wine estate',
  'Vineyards', 'Tasting room', 'Guest cottage', 'Heated jacuzzi', 'New build',
  "Butler's pantry", 'Scullery', 'Flatlet', 'Commercial use', 'Rental income',
  'Multiple units', 'Investment property', 'High yield', 'River views',
];

// Real property/house images from Unsplash (verified working, no hotlink blocking)
const realPropertyImages = [
  'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600573472591-ee6981cf81d6?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1493809842364-78f1e9615786?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600047508006-aa528d93dbc3?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600573472556-e636c2acda9e?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600585153824-bb4a4a71b72a?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1599427303058-f04cbcf4756f?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1600573472591-ee6981cf81d6?w=800&h=600&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop&q=80',
];

let globalImgIndex = 0;
function getPropertyImages(count = 4) {
  const images = [];
  for (let j = 0; j < count; j++) {
    images.push(realPropertyImages[(globalImgIndex + j) % realPropertyImages.length]);
  }
  globalImgIndex += count;
  return images;
}

const propertyTypes = ['House', 'Apartment', 'Townhouse', 'Penthouse', 'Villa', 'Estate'];

// Helper function to generate realistic property descriptions
function generateDescription(property) {
  const descriptionTemplates = [
    `Stunning ${property.property_type.toLowerCase()} in ${property.suburb} featuring ${property.bedrooms} bedrooms and ${property.bathrooms} bathrooms. Located in the heart of ${property.city}, this property offers modern finishes and excellent natural light. Close to shopping centres, restaurants, and entertainment.`,
    `Beautiful ${property.property_type.toLowerCase()} with breathtaking views over ${property.city}. This ${property.bedrooms}-bedroom property showcases premium finishes and high-end fixtures. Includes staff quarters and braai area. Perfect for entertaining.`,
    `Prime property in ${property.suburb}, ${property.city}. Well-appointed ${property.bedrooms}BR/${property.bathrooms}BA home with modern amenities. Features solar panels and borehole. Walking distance to local attractions.`,
    `Luxurious ${property.property_type.toLowerCase()} boasting ${property.bedrooms} spacious bedrooms in upmarket ${property.suburb}. Smart home integration, security estate benefits, and stunning architecture. Garden with braai area ideal for entertaining.`,
    `Exceptional ${property.property_type.toLowerCase()} opportunity in ${property.city}. This ${property.bedrooms}-bed home offers ocean/mountain views, modern kitchen, and open-plan living. Located in secure estate with 24/7 guard.`,
  ];
  return descriptionTemplates[Math.floor(Math.random() * descriptionTemplates.length)];
}

function getRandomItems(array, min, max) {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

console.log('Seeding database with realistic SA property data...\n');

// 1. Create users
console.log('Creating users...');
const userIds = [];
testUsers.forEach((user) => {
  const passwordHash = bcrypt.hashSync('password123', 10);
  const stmt = db.prepare(
    'INSERT INTO users (name, email, password_hash, phone, province, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const province = user.name === 'Cornel Schoeman' ? 'Western Cape' : randomElement(Object.keys(suburbs));
  const result = stmt.run(user.name, user.email, passwordHash, '0721234567', province, NOW);
  userIds.push(result.lastInsertRowid);
});
console.log(`Created ${userIds.length} users\n`);

// 2. Create agents
console.log('Creating agents...');
const agentIds = [];
for (let i = 0; i < 15; i++) {
  const agency = randomElement(agencies);
  const stmt = db.prepare(
    'INSERT INTO agents (name, agency, phone, email, rating, reviews, response_time, verified, avatar_url, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(
    `Agent ${i + 1}`,
    agency.name,
    agency.phone,
    `agent${i + 1}@agency.co.za`,
    Math.round((Math.random() * 20 + 80)) / 10,
    Math.floor(Math.random() * 100 + 10),
    `${Math.floor(Math.random() * 24 + 1)} hours`,
    Math.random() > 0.3 ? 1 : 0,
    `https://i.pravatar.cc/150?img=${i}`,
    'Experienced property agent specializing in luxury homes across South Africa.'
  );
  agentIds.push(result.lastInsertRowid);
}

// Add Hermanus-specific agents
const hermanusAgents = [
  { name: 'Marelize van Niekerk', agency: 'Hermanus Property Sales', phone: '+27283121234', email: 'marelize@hps.co.za', rating: 4.9, reviews: 234, response_time: '4 min', bio: 'Born and raised in Hermanus. Specializing in Voelklip, Onrus, and Eastcliff properties. Your local expert on the Whale Coast.' },
  { name: 'André Fourie', agency: 'Seeff Hermanus', phone: '+27283125678', email: 'andre@seeff.co.za', rating: 4.7, reviews: 156, response_time: '8 min', bio: 'Hermanus property specialist with 15 years experience. Covering all Overberg areas from Kleinmond to Stanford.' },
  { name: 'Lerato Mkhize', agency: 'Pam Golding Hermanus', phone: '+27283129012', email: 'lerato@pamgolding.co.za', rating: 4.8, reviews: 189, response_time: '5 min', bio: 'Luxury property expert for the Hermanus coastline. Hemel-en-Aarde Valley wine estates and Voelklip beachfront specialist.' },
];

hermanusAgents.forEach(agent => {
  const stmt = db.prepare(
    'INSERT INTO agents (name, agency, phone, email, rating, reviews, response_time, verified, avatar_url, bio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const result = stmt.run(
    agent.name, agent.agency, agent.phone, agent.email,
    agent.rating, agent.reviews, agent.response_time, 1,
    `https://i.pravatar.cc/150?img=${agentIds.length}`,
    agent.bio
  );
  agentIds.push(result.lastInsertRowid);
});

console.log(`Created ${agentIds.length} agents\n`);

// 3. Create properties
console.log('Creating properties...');
const propertyIds = [];
const provinceCounts = { Gauteng: 50, 'Western Cape': 50, KZN: 25, Other: 25 };
let propertyCount = 0;

Object.entries(provinceCounts).forEach(([provinceKey, count]) => {
  const provinceSuburbs = allSuburbs.filter(s => s.province === provinceKey);

  for (let i = 0; i < count; i++) {
    const suburb = randomElement(provinceSuburbs);
    const bedrooms = Math.floor(Math.random() * 5) + 1;
    const bathrooms = Math.floor(Math.random() * bedrooms) + 1;
    const garages = Math.floor(Math.random() * 3);

    const priceRanges = {
      'House': [1500000, 15000000],
      'Apartment': [650000, 4000000],
      'Townhouse': [1000000, 5000000],
      'Penthouse': [3000000, 25000000],
      'Villa': [5000000, 50000000],
      'Estate': [8000000, 60000000],
    };

    const type = randomElement(propertyTypes);
    const [minPrice, maxPrice] = priceRanges[type];
    const price = Math.floor(Math.random() * (maxPrice - minPrice) + minPrice);
    const floorSize = Math.floor(Math.random() * 400 + 100);
    const erfSize = Math.floor(Math.random() * 2000 + 500);
    const propFeatures = getRandomItems(features, 4, 8);
    const images = getPropertyImages(4);

    const description = generateDescription({ property_type: type, bedrooms, bathrooms, suburb: suburb.name, city: suburb.city });

    const stmt = db.prepare(
      'INSERT INTO properties (title, price, address, suburb, city, province, lat, lng, bedrooms, bathrooms, garages, erf_size, floor_size, property_type, description, features, images, listed_date, featured, valuation_estimate, valuation_confidence, agent_id, status, views, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    const result = stmt.run(
      `${bedrooms}BR ${type} in ${suburb.name}`,
      price,
      `${Math.floor(Math.random() * 999) + 1} ${suburb.name} Road`,
      suburb.name, suburb.city, suburb.province,
      suburb.lat + (Math.random() - 0.5) * 0.01,
      suburb.lng + (Math.random() - 0.5) * 0.01,
      bedrooms, bathrooms, garages, erfSize, floorSize, type,
      description,
      JSON.stringify(propFeatures),
      JSON.stringify(images),
      new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      Math.random() > 0.8 ? 1 : 0,
      Math.floor(price * (0.9 + Math.random() * 0.2)),
      Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
      randomElement(agentIds),
      'active',
      Math.floor(Math.random() * 500),
      NOW
    );

    propertyIds.push(result.lastInsertRowid);
    propertyCount++;
  }
});

// Add 25 handcrafted Hermanus properties
const hermanusProperties = [
  { title: "Ocean View Family Home in Voelklip", price: 8950000, suburb: "Voelklip", beds: 4, baths: 3, garages: 2, erf: 850, floor: 280, type: "House",
    desc: "Spectacular 4-bedroom family home steps from Grotto Beach. North-facing with panoramic Walker Bay views — watch whales from your lounge. Open-plan living flows to a covered patio with built-in braai. Indigenous fynbos garden, solar geyser, and borehole. Walking distance to Voelklip Beach and the cliff path.",
    features: ["Ocean views","Whale watching","Near beach","Braai area","Borehole","Solar geyser","Fynbos garden","Mountain views"],
    images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop"] },
  { title: "Modern Beach House on 7th Street", price: 12500000, suburb: "Voelklip", beds: 5, baths: 4, garages: 2, erf: 1200, floor: 380, type: "Villa",
    desc: "Architecturally designed beach villa on sought-after 7th Street, Voelklip. Floor-to-ceiling glass frames uninterrupted ocean and mountain views. Heated infinity pool, home cinema, wine cellar, and chef's kitchen with Miele appliances. Underfloor heating throughout.",
    features: ["Infinity pool","Wine cellar","Home cinema","Ocean views","Underfloor heating","Flatlet","Smart home","Mountain views"],
    images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=600&fit=crop"] },
  { title: "Cosy Cottage near Voelklip Beach", price: 3200000, suburb: "Voelklip", beds: 2, baths: 1, garages: 1, erf: 400, floor: 95, type: "House",
    desc: "Charming whitewashed cottage in the heart of Voelklip. 5-minute walk to Grotto Beach. Open-plan living with fireplace, updated kitchen, and sunny enclosed courtyard garden. Perfect lock-up-and-go or starter home.",
    features: ["Near beach","Fireplace","Garden","Pet friendly","Rental potential"],
    images: ["https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop"] },
  { title: "Beachfront Apartment on Onrus River", price: 2850000, suburb: "Onrus", beds: 2, baths: 2, garages: 1, erf: 0, floor: 110, type: "Apartment",
    desc: "Ground-floor apartment directly overlooking the Onrus River lagoon and beach. Wake up to the sound of waves. Secure complex with pool and braai area. Walking distance to Onrus village restaurants.",
    features: ["Ocean views","Beach access","River views","Pool","Braai area","Secure complex"],
    images: ["https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop"] },
  { title: "Renovated Family Home in Onrus Village", price: 4750000, suburb: "Onrus", beds: 4, baths: 2, garages: 2, erf: 900, floor: 220, type: "House",
    desc: "Beautifully renovated family home in established Onrus neighbourhood. Modern open-plan kitchen and living with stacking doors to garden. Mature garden with pool and lapa. Fibre-ready.",
    features: ["Pool","Garden","Near beach","Fireplace","Fibre ready","Braai area","Pet friendly"],
    images: ["https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop"] },
  { title: "Sea-View Townhouse in Onrus", price: 3500000, suburb: "Onrus", beds: 3, baths: 2, garages: 2, erf: 350, floor: 160, type: "Townhouse",
    desc: "Modern 3-bed townhouse in secure Onrus complex with stunning sea views from upper level. Lock-up-and-go lifestyle. Walking distance to Onrus beach and village shops.",
    features: ["Ocean views","Security estate","Low maintenance","Near beach","Braai area"],
    images: ["https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800&h=600&fit=crop"] },
  { title: "Family Home in Sandbaai Estate", price: 3295000, suburb: "Sandbaai", beds: 3, baths: 2, garages: 2, erf: 600, floor: 175, type: "House",
    desc: "Spacious 3-bedroom home in the popular Sandbaai gated estate. Modern finishes, open-plan living with gas fireplace. Estate offers 24/7 security, communal pool, and playground. Close to Sandbaai beach.",
    features: ["Security estate","Garden","Pet friendly","Near beach","Fireplace","Communal pool"],
    images: ["https://images.unsplash.com/photo-1600573472591-ee6981cf81d6?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1493809842364-78f1e9615786?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop"] },
  { title: "Affordable 2-Bed in Sandbaai", price: 1650000, suburb: "Sandbaai", beds: 2, baths: 1, garages: 1, erf: 350, floor: 85, type: "Townhouse",
    desc: "Well-priced townhouse in sought-after Sandbaai. Ideal for first-time buyers or investors. Strong rental demand during whale season. Sectional title with reasonable levies.",
    features: ["Near beach","Low maintenance","Investment property","Pet friendly"],
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800&h=600&fit=crop"] },
  { title: "Penthouse in Hermanus CBD with Bay Views", price: 5500000, suburb: "Hermanus CBD", beds: 3, baths: 2, garages: 2, erf: 0, floor: 195, type: "Penthouse",
    desc: "Top-floor penthouse overlooking Walker Bay in the heart of Hermanus. Wrap-around balcony with 270-degree views — watch Southern Right whales breach from your living room. Steps from the cliff path.",
    features: ["Ocean views","Whale watching","Balcony","City views","Near cliff path","Premium finishes"],
    images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop"] },
  { title: "Commercial + Residential in Main Road", price: 4200000, suburb: "Hermanus CBD", beds: 2, baths: 1, garages: 1, erf: 500, floor: 250, type: "House",
    desc: "Mixed-use property on Hermanus Main Road. Ground floor retail/office space with 2-bed residential apartment above. Currently earning R25 000/month rental.",
    features: ["Commercial use","Rental income","Near harbour","High foot traffic"],
    images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=600&fit=crop"] },
  { title: "Luxury Home backing Fernkloof Reserve", price: 9800000, suburb: "Fernkloof", beds: 4, baths: 3, garages: 3, erf: 1500, floor: 320, type: "House",
    desc: "Exclusive property bordering the Fernkloof Nature Reserve. Indigenous fynbos garden. Solar-powered with Tesla Powerwall backup. Mountain biking and hiking trails from your gate.",
    features: ["Nature reserve","Fynbos garden","Wine cellar","Solar panels","Generator","Mountain views","Privacy","Guest suite"],
    images: ["https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop"] },
  { title: "Whale Watcher's Dream on Marine Drive", price: 15000000, suburb: "Eastcliff", beds: 5, baths: 4, garages: 2, erf: 1000, floor: 400, type: "Villa",
    desc: "Iconic Eastcliff property on Marine Drive — arguably the best whale watching position in Hermanus. Direct cliff path access. Guest house generating R80 000/month peak season.",
    features: ["Whale watching","Cliff path access","Ocean views","Heated pool","Guest house income","Mountain views","Premium location"],
    images: ["https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop"] },
  { title: "Contemporary Cliff-Edge Home", price: 22000000, suburb: "Eastcliff", beds: 4, baths: 3, garages: 2, erf: 800, floor: 350, type: "Villa",
    desc: "Award-winning contemporary architecture perched on Hermanus Eastcliff. Glass and steel design maximises the dramatic ocean panorama. Heated rim-flow pool appears to merge with Walker Bay.",
    features: ["Ocean views","Heated pool","Architect-designed","Cliff path access","Smart home","Underfloor heating"],
    images: ["https://images.unsplash.com/photo-1585154526-990dced4db0d?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop"] },
  { title: "Mountain-View Home in Westcliff", price: 4500000, suburb: "Westcliff", beds: 3, baths: 2, garages: 2, erf: 700, floor: 200, type: "House",
    desc: "Attractive 3-bedroom home in established Westcliff with views of the Kleinrivier Mountains. Solar geyser and rainwater tank. Close to Hermanus Primary School.",
    features: ["Mountain views","Fireplace","Braai area","Garden","Solar geyser","Near schools"],
    images: ["https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800&h=600&fit=crop"] },
  { title: "Wine Estate in Hemel-en-Aarde Valley", price: 35000000, suburb: "Hemel-en-Aarde Valley", beds: 6, baths: 5, garages: 4, erf: 50000, floor: 600, type: "Estate",
    desc: "Exceptional 5-hectare wine estate in the acclaimed Hemel-en-Aarde Valley. Established vineyards producing 5 000 cases annually. Neighbouring Hamilton Russell and Creation.",
    features: ["Wine estate","Vineyards","Guest cottage","Mountain views","Tasting room","Pool","Staff quarters","Borehole"],
    images: ["https://images.unsplash.com/photo-1600573472591-ee6981cf81d6?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1493809842364-78f1e9615786?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop"] },
  { title: "Smallholding with Mountain Views", price: 6500000, suburb: "Hemel-en-Aarde Valley", beds: 3, baths: 2, garages: 2, erf: 10000, floor: 180, type: "House",
    desc: "Peaceful smallholding on 1 hectare in the scenic Hemel-en-Aarde Valley. 3-bed farmhouse with wraparound verandah, dam, and paddocks for horses.",
    features: ["Mountain views","Smallholding","Dam","Paddocks","Country living","Near wine estates"],
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800&h=600&fit=crop"] },
  { title: "Lagoon-Front Home in Vermont", price: 3800000, suburb: "Vermont", beds: 3, baths: 2, garages: 2, erf: 650, floor: 180, type: "House",
    desc: "Charming Vermont home overlooking the Bot River lagoon. Watch flamingos, pelicans, and fish eagles from your stoep. Ideal for nature lovers and birders.",
    features: ["Lagoon views","Bird watching","Garden","Near beach","Pet friendly","Braai area"],
    images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop"] },
  { title: "Modern Vermont Cluster", price: 2450000, suburb: "Vermont", beds: 3, baths: 2, garages: 1, erf: 300, floor: 140, type: "Townhouse",
    desc: "Contemporary cluster home in secure Vermont estate. Low-maintenance garden and covered patio. Close to Vermont Salt Pan and the lagoon.",
    features: ["Security estate","Low maintenance","Pool","Near lagoon","Modern finishes"],
    images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&h=600&fit=crop"] },
  { title: "Lakeside Retreat in Fisherhaven", price: 2200000, suburb: "Fisherhaven", beds: 3, baths: 2, garages: 1, erf: 800, floor: 150, type: "House",
    desc: "Peaceful home on the banks of the Bot River lagoon in quiet Fisherhaven. Launch your kayak from your own slipway. 15-minute drive to Hermanus centre.",
    features: ["Lagoon front","Bird watching","Slipway","Garden","Fynbos garden","Sunset views"],
    images: ["https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800&h=600&fit=crop"] },
  { title: "Beach Bungalow near Grotto Beach", price: 5200000, suburb: "Grotto Beach", beds: 3, baths: 2, garages: 1, erf: 600, floor: 170, type: "House",
    desc: "Laid-back beach bungalow a stone's throw from award-winning Grotto Beach (Blue Flag). Outdoor shower for sandy feet. Strong Airbnb potential.",
    features: ["Near beach","Outdoor shower","Braai area","Airbnb potential","Ocean views","Surfing"],
    images: ["https://images.unsplash.com/photo-1599809275671-b5942cabc7a2?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&h=600&fit=crop"] },
  { title: "Panoramic View Home in Northcliff", price: 6800000, suburb: "Northcliff", beds: 4, baths: 3, garages: 2, erf: 1000, floor: 260, type: "House",
    desc: "Elevated Northcliff position with sweeping 180-degree views from Table Mountain to Walker Bay. Solar panels, borehole, and rainwater harvesting.",
    features: ["Panoramic views","Ocean views","Mountain views","Jacuzzi","Solar panels","Borehole","Flatlet","Study"],
    images: ["https://images.unsplash.com/photo-1585154526-990dced4db0d?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1604014237800-1c9102c219da?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&h=600&fit=crop"] },
  { title: "New Build in Chanteclair", price: 15795000, suburb: "Chanteclair", beds: 4, baths: 4, garages: 3, erf: 1100, floor: 350, type: "House",
    desc: "Brand-new luxury home in exclusive Chanteclair. Full smart home integration with Loxone system. Solar with battery backup. Heated pool with automated cover.",
    features: ["New build","Smart home","Heated pool","Solar panels","Generator","Premium finishes","Mountain views"],
    images: ["https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600563438938-a9a27216b4f5?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800&h=600&fit=crop"] },
  { title: "Spacious Family Home in Berghof", price: 3950000, suburb: "Berghof", beds: 4, baths: 2, garages: 2, erf: 800, floor: 210, type: "House",
    desc: "Well-maintained family home in quiet Berghof neighbourhood. Near Hermanus High School and Whale Coast Mall. Excellent family neighbourhood.",
    features: ["Garden","Fireplace","Near schools","Braai area","Pet friendly","Near mall"],
    images: ["https://images.unsplash.com/photo-1600573472591-ee6981cf81d6?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1493809842364-78f1e9615786?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop"] },
  { title: "Investment Portfolio in Hawston", price: 1800000, suburb: "Hawston", beds: 6, baths: 3, garages: 0, erf: 500, floor: 200, type: "House",
    desc: "Income-producing property: main house (3 bed) plus two 1-bedroom flatlets and a bachelor unit. Combined income of R12 500/month. 8.3% yield.",
    features: ["Rental income","Multiple units","Investment property","High yield"],
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=800&h=600&fit=crop","https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800&h=600&fit=crop"] },
];

// Get Hermanus suburbs for coordinates
const hermanusSubs = allSuburbs.filter(s => s.city === 'Hermanus');

hermanusProperties.forEach((prop, index) => {
  const suburb = hermanusSubs.find(s => s.name === prop.suburb);
  if (!suburb) return;

  const images = prop.images || getPropertyImages(4);

  const stmt = db.prepare(
    'INSERT INTO properties (title, price, address, suburb, city, province, lat, lng, bedrooms, bathrooms, garages, erf_size, floor_size, property_type, description, features, images, listed_date, featured, valuation_estimate, valuation_confidence, agent_id, status, views, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const isFeatured = index < 3;

  const result = stmt.run(
    prop.title, prop.price,
    `${Math.floor(Math.random() * 999) + 1} ${prop.suburb} Road`,
    prop.suburb, 'Hermanus', 'Western Cape',
    suburb.lat + (Math.random() - 0.5) * 0.005,
    suburb.lng + (Math.random() - 0.5) * 0.005,
    prop.beds, prop.baths, prop.garages, prop.erf, prop.floor, prop.type,
    prop.desc,
    JSON.stringify(prop.features),
    JSON.stringify(images),
    new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isFeatured ? 1 : 0,
    Math.floor(prop.price * (0.9 + Math.random() * 0.2)),
    Math.round((0.8 + Math.random() * 0.2) * 100) / 100,
    randomElement(agentIds),
    'active',
    Math.floor(Math.random() * 200 + 20),
    NOW
  );

  propertyIds.push(result.lastInsertRowid);
  propertyCount++;
});

console.log(`Created ${propertyCount} total properties (150 generic + ${hermanusProperties.length} Hermanus)\n`);

// 4. Create saved properties (user favorites)
console.log('Creating saved properties...');
let savedCount = 0;
userIds.forEach(userId => {
  const saveCount = Math.floor(Math.random() * 11) + 5;
  const savedProps = getRandomItems(propertyIds, Math.min(saveCount, propertyIds.length), Math.min(saveCount, propertyIds.length));

  savedProps.forEach(propId => {
    try {
      db.prepare('INSERT INTO saved_properties (user_id, property_id, saved_at) VALUES (?, ?, ?)')
        .run(userId, propId, NOW);
      savedCount++;
    } catch (e) {
      // Skip duplicates
    }
  });
});
console.log(`Created ${savedCount} saved properties\n`);

// 5. Create saved searches
console.log('Creating saved searches...');
let searchCount = 0;
userIds.forEach(userId => {
  const searchesCount = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < searchesCount; i++) {
    const suburbs_sample = getRandomItems(allSuburbs, 1, 3);
    const filters = {
      minPrice: Math.floor(Math.random() * 2000000 + 500000),
      maxPrice: Math.floor(Math.random() * 5000000 + 3000000),
      bedrooms: Math.floor(Math.random() * 4) + 2,
      cities: suburbs_sample.map(s => s.city),
    };

    db.prepare('INSERT INTO saved_searches (user_id, name, filters, created_at) VALUES (?, ?, ?, ?)')
      .run(userId, `Search ${i + 1}`, JSON.stringify(filters), NOW);
    searchCount++;
  }
});
console.log(`Created ${searchCount} saved searches\n`);

// 6. Create chat threads and messages
console.log('Creating chat threads and messages...');
let threadCount = 0;
let messageCount = 0;

userIds.forEach(userId => {
  const threadCount_user = Math.floor(Math.random() * 4) + 2;
  for (let i = 0; i < threadCount_user; i++) {
    const agentId = randomElement(agentIds);
    const propertyId = randomElement(propertyIds);

    const threadResult = db.prepare('INSERT INTO chat_threads (user_id, agent_id, property_id, created_at) VALUES (?, ?, ?, ?)')
      .run(userId, agentId, propertyId, NOW);

    const threadId = threadResult.lastInsertRowid;
    threadCount++;

    const msgCount = Math.floor(Math.random() * 6) + 3;
    for (let j = 0; j < msgCount; j++) {
      const isUserMessage = j % 2 === 0;
      const messages = isUserMessage
        ? ['Is this still available?', 'Can we arrange a viewing?', "What's the best time to visit?", 'Are there any recent inspections?', 'Can you send more photos?']
        : ["Yes, it's still available!", 'Of course, let me check my schedule.', "I'd recommend viewing in the morning.", 'I can arrange that for you.', "I'll send them right away."];

      db.prepare('INSERT INTO chat_messages (thread_id, sender_type, sender_id, message, read, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(threadId, isUserMessage ? 'user' : 'agent', isUserMessage ? userId : agentId, randomElement(messages), Math.random() > 0.3 ? 1 : 0, NOW);

      messageCount++;
    }
  }
});
console.log(`Created ${threadCount} chat threads with ${messageCount} messages\n`);

// 7. Create property views
console.log('Creating property views...');
let viewCount = 0;
userIds.forEach(userId => {
  const viewCount_user = Math.floor(Math.random() * 21) + 10;
  for (let i = 0; i < viewCount_user; i++) {
    db.prepare('INSERT INTO property_views (user_id, property_id, viewed_at) VALUES (?, ?, ?)')
      .run(userId, randomElement(propertyIds), hoursAgo(Math.floor(Math.random() * 720 + 1)));
    viewCount++;
  }
});
console.log(`Created ${viewCount} property views\n`);

db.close();

console.log('✓ Database seeding complete!');
console.log('');
console.log('Test credentials:');
console.log('  Email: cornel@tideshift.co.za');
console.log('  Password: password123');
console.log('');
console.log('(All other users also have password "password123")');
console.log('');
console.log('Hermanus Properties: 24 handcrafted properties across 15 suburbs');
console.log('Hermanus Agents: 3 local specialists (Marelize, André, Lerato)');
console.log('');
