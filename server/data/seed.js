const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const helpers = [
  {
    id: 'helper_priya', name: 'Dr. Priya Sharma', email: 'priya@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6139, lng: 77.2090, label: 'Connaught Place, Delhi' },
    skills: ['medical', 'blood_donation', 'first_aid'],
    bloodGroup: 'O+', rating: 4.8, successCount: 47, badge: 'Gold',
    availability: 0.95, responseSpeed: 0.92, communities: ['college', 'local_area'],
    avatar: '👩‍⚕️', isHelper: true, isVerified: true
  },
  {
    id: 'helper_rahul', name: 'Rahul Verma', email: 'rahul@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6519, lng: 77.1905, label: 'Karol Bagh, Delhi' },
    skills: ['tutoring', 'math', 'engineering'],
    bloodGroup: 'A+', rating: 4.5, successCount: 32, badge: 'Silver',
    availability: 0.80, responseSpeed: 0.85, communities: ['college', 'skill_groups'],
    avatar: '👨‍🎓', isHelper: true, isVerified: false
  },
  {
    id: 'helper_ananya', name: 'Ananya Gupta', email: 'ananya@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6100, lng: 77.2300, label: 'India Gate, Delhi' },
    skills: ['blood_donation', 'volunteering'],
    bloodGroup: 'O+', rating: 4.9, successCount: 56, badge: 'Platinum',
    availability: 0.90, responseSpeed: 0.88, communities: ['local_area'],
    avatar: '👩‍🔬', isHelper: true, isVerified: true
  },
  {
    id: 'helper_vikram', name: 'Vikram Singh', email: 'vikram@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6350, lng: 77.2250, label: 'Karol Bagh, Delhi' },
    skills: ['financial_help', 'fundraising'],
    bloodGroup: 'B+', rating: 4.3, successCount: 21, badge: 'Silver',
    availability: 0.70, responseSpeed: 0.78, communities: ['local_area', 'skill_groups'],
    avatar: '💼', isHelper: true, isVerified: false
  },
  {
    id: 'helper_sneha', name: 'Sneha Patel', email: 'sneha@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6200, lng: 77.2150, label: 'Janpath, Delhi' },
    skills: ['medical', 'nursing', 'blood_donation'],
    bloodGroup: 'O-', rating: 4.7, successCount: 39, badge: 'Gold',
    availability: 0.85, responseSpeed: 0.90, communities: ['college'],
    avatar: '👩‍⚕️', isHelper: true, isVerified: true
  },
  {
    id: 'helper_arjun', name: 'Arjun Reddy', email: 'arjun@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6450, lng: 77.2100, label: 'Paharganj, Delhi' },
    skills: ['tutoring', 'programming', 'mentoring'],
    bloodGroup: 'AB+', rating: 4.6, successCount: 28, badge: 'Silver',
    availability: 0.75, responseSpeed: 0.82, communities: ['college', 'skill_groups'],
    avatar: '👨‍💻', isHelper: true, isVerified: false
  },
  {
    id: 'helper_meera', name: 'Meera Iyer', email: 'meera@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6050, lng: 77.2400, label: 'Lodhi Garden, Delhi' },
    skills: ['counseling', 'mental_health', 'volunteering'],
    bloodGroup: 'A-', rating: 4.9, successCount: 63, badge: 'Platinum',
    availability: 0.92, responseSpeed: 0.95, communities: ['local_area', 'skill_groups'],
    avatar: '🧘‍♀️', isHelper: true, isVerified: true
  },
  {
    id: 'helper_karan', name: 'Karan Malhotra', email: 'karan@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6500, lng: 77.1900, label: 'Patel Nagar, Delhi' },
    skills: ['transport', 'logistics', 'driving'],
    bloodGroup: 'O+', rating: 4.4, successCount: 35, badge: 'Gold',
    availability: 0.88, responseSpeed: 0.91, communities: ['local_area'],
    avatar: '🚗', isHelper: true, isVerified: false
  },
  {
    id: 'helper_divya', name: 'Divya Nair', email: 'divya@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6180, lng: 77.2280, label: 'Pragati Maidan, Delhi' },
    skills: ['medical', 'blood_donation', 'emergency'],
    bloodGroup: 'O+', rating: 4.8, successCount: 51, badge: 'Platinum',
    availability: 0.93, responseSpeed: 0.89, communities: ['college', 'local_area'],
    avatar: '🏥', isHelper: true, isVerified: true
  },
  {
    id: 'helper_rohan', name: 'Rohan Kapoor', email: 'rohan@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6320, lng: 77.2350, label: 'ITO, Delhi' },
    skills: ['legal_aid', 'documentation'],
    bloodGroup: 'B-', rating: 4.2, successCount: 15, badge: 'Bronze',
    availability: 0.60, responseSpeed: 0.70, communities: ['skill_groups'],
    avatar: '⚖️', isHelper: true, isVerified: false
  },
  {
    id: 'helper_aisha', name: 'Aisha Khan', email: 'aisha@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6400, lng: 77.2180, label: 'CP Metro, Delhi' },
    skills: ['food_supply', 'volunteering', 'cooking'],
    bloodGroup: 'A+', rating: 4.6, successCount: 44, badge: 'Gold',
    availability: 0.82, responseSpeed: 0.86, communities: ['local_area', 'college'],
    avatar: '🍲', isHelper: true, isVerified: true
  },
  {
    id: 'helper_sanjay', name: 'Sanjay Mehta', email: 'sanjay@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6220, lng: 77.2050, label: 'Mandi House, Delhi' },
    skills: ['blood_donation', 'medical'],
    bloodGroup: 'O+', rating: 4.1, successCount: 12, badge: 'Bronze',
    availability: 0.55, responseSpeed: 0.65, communities: ['local_area'],
    avatar: '🩸', isHelper: true, isVerified: false
  },
  {
    id: 'helper_tanya', name: 'Tanya Joshi', email: 'tanya@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6150, lng: 77.2220, label: 'Barakhamba, Delhi' },
    skills: ['tutoring', 'science', 'research'],
    bloodGroup: 'AB-', rating: 4.7, successCount: 38, badge: 'Gold',
    availability: 0.87, responseSpeed: 0.84, communities: ['college', 'skill_groups'],
    avatar: '🔬', isHelper: true, isVerified: true
  },
  {
    id: 'helper_nikhil', name: 'Nikhil Bansal', email: 'nikhil@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6300, lng: 77.2000, label: 'RK Ashram, Delhi' },
    skills: ['financial_help', 'crowdfunding'],
    bloodGroup: 'B+', rating: 4.5, successCount: 27, badge: 'Silver',
    availability: 0.78, responseSpeed: 0.80, communities: ['skill_groups'],
    avatar: '💰', isHelper: true, isVerified: false
  },
  {
    id: 'helper_pooja', name: 'Pooja Agarwal', email: 'pooja@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6080, lng: 77.2350, label: 'Nizamuddin, Delhi' },
    skills: ['shelter', 'accommodation', 'volunteering'],
    bloodGroup: 'O+', rating: 4.8, successCount: 42, badge: 'Gold',
    availability: 0.91, responseSpeed: 0.93, communities: ['local_area', 'college'],
    avatar: '🏠', isHelper: true, isVerified: true
  }
];

const communities = [
  {
    id: 'comm_college',
    name: 'Delhi University Network',
    type: 'college',
    description: 'Students and faculty from Delhi University and nearby colleges',
    icon: '🎓',
    memberCount: 2847,
    members: helpers.filter(h => h.communities.includes('college')).map(h => h.id)
  },
  {
    id: 'comm_local',
    name: 'Central Delhi Community',
    type: 'local_area',
    description: 'Residents and workers in Central Delhi area',
    icon: '📍',
    memberCount: 5231,
    members: helpers.filter(h => h.communities.includes('local_area')).map(h => h.id)
  },
  {
    id: 'comm_skills',
    name: 'Professional Skills Hub',
    type: 'skill_groups',
    description: 'Professionals offering specialized skills and services',
    icon: '⚡',
    memberCount: 1456,
    members: helpers.filter(h => h.communities.includes('skill_groups')).map(h => h.id)
  }
];

const institutions = [
  { id: 'inst_1', name: 'AIIMS Blood Bank', type: 'hospital', icon: '🏥', responseTime: '15 min' },
  { id: 'inst_2', name: 'Red Cross Delhi', type: 'ngo', icon: '🔴', responseTime: '20 min' },
  { id: 'inst_3', name: 'Delhi Police Helpline', type: 'government', icon: '🚔', responseTime: '10 min' }
];

async function seedData() {
    try {
        const count = await User.countDocuments();
        if (count === 0) {
            console.log('[Database] User table empty. Seeding helper accounts...');
            // Inject helper accounts
            for (const helper of helpers) {
                await User.create({
                    _id: helper.id, // Keep the custom IDs for simple backward matching
                    name: helper.name,
                    email: helper.email,
                    password: helper.password,
                    location: helper.location,
                    skills: helper.skills,
                    bloodGroup: helper.bloodGroup,
                    rating: helper.rating,
                    successCount: helper.successCount,
                    badge: helper.badge,
                    availability: helper.availability,
                    responseSpeed: helper.responseSpeed,
                    communities: helper.communities,
                    avatar: helper.avatar,
                    isHelper: helper.isHelper,
                    isVerified: helper.isVerified
                });
            }
            // Seed a demo user in database
            await User.create({
                _id: 'demo-user',
                name: 'Demo User',
                email: 'demo@acin.ai',
                password: bcrypt.hashSync('demo123', 10),
                location: { lat: 28.6139, lng: 77.2090, label: 'Connaught Place, Delhi' },
                isHelper: false
            });
            console.log('[Database] Seeding completed.');
        } else {
            console.log('[Database] Database already has data. Skipping seed.');
        }
    } catch (error) {
        console.error(`[Database] Seeding Error: ${error.message}`);
    }
}

module.exports = { helpers, communities, institutions, seedData };
