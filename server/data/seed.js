const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const CommunityPost = require('../models/CommunityPost');
const Comment = require('../models/Comment');
const Review = require('../models/Review');
const Notification = require('../models/Notification');

const helpers = [
  {
    id: 'helper_priya', name: 'Dr. Priya Sharma', email: 'priya@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6139, lng: 77.2090, label: 'Connaught Place, Delhi' },
    city: 'Delhi', state: 'Delhi', country: 'India',
    skills: ['medical', 'blood_donation', 'first_aid'],
    expertiseLevel: 'Expert',
    bio: 'Medical officer with 5+ years of experience in trauma care and community health operations.',
    banner: 'linear-gradient(135deg, #06b6d4, #6366f1)',
    bloodGroup: 'O+', rating: 4.9, ratingCount: 15, successCount: 47, badge: 'Expert Mentor',
    availability: 0.95, availabilityText: 'Available Now', responseSpeed: 0.92, communities: ['college', 'local_area'],
    avatar: '👩‍⚕️', isHelper: true, isVerified: true,
    points: 1250, helpRequestsCompleted: 47, acceptanceRate: 98, responseTime: 5, communityContributions: 23
  },
  {
    id: 'helper_rahul', name: 'Rahul Verma', email: 'rahul@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6519, lng: 77.1905, label: 'Karol Bagh, Delhi' },
    city: 'Delhi', state: 'Delhi', country: 'India',
    skills: ['tutoring', 'math', 'engineering', 'programming'],
    expertiseLevel: 'Advanced',
    bio: 'Computer Science graduate student at Delhi University. Enthusiastic about mentoring and web development.',
    banner: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
    bloodGroup: 'A+', rating: 4.5, ratingCount: 8, successCount: 32, badge: 'Active Helper',
    availability: 0.80, availabilityText: 'Available Today', responseSpeed: 0.85, communities: ['college', 'skill_groups'],
    avatar: '👨‍🎓', isHelper: true, isVerified: false,
    points: 820, helpRequestsCompleted: 32, acceptanceRate: 92, responseTime: 12, communityContributions: 14
  },
  {
    id: 'helper_ananya', name: 'Ananya Gupta', email: 'ananya@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6100, lng: 77.2300, label: 'India Gate, Delhi' },
    city: 'Delhi', state: 'Delhi', country: 'India',
    skills: ['blood_donation', 'volunteering', 'counseling'],
    expertiseLevel: 'Expert',
    bio: 'Social worker and crisis volunteer coordinating blood drives and food distribution across Delhi.',
    banner: 'linear-gradient(135deg, #ec4899, #f59e0b)',
    bloodGroup: 'O+', rating: 4.9, ratingCount: 22, successCount: 56, badge: 'Community Hero',
    availability: 0.90, availabilityText: 'Available Now', responseSpeed: 0.88, communities: ['local_area'],
    avatar: '👩‍🔬', isHelper: true, isVerified: true,
    points: 1540, helpRequestsCompleted: 56, acceptanceRate: 100, responseTime: 8, communityContributions: 37
  },
  {
    id: 'helper_arjun', name: 'Arjun Reddy', email: 'arjun@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6450, lng: 77.2100, label: 'Paharganj, Delhi' },
    city: 'Delhi', state: 'Delhi', country: 'India',
    skills: ['tutoring', 'programming', 'mentoring', 'React', 'NodeJS'],
    expertiseLevel: 'Expert',
    bio: 'Senior Frontend Developer. Always open to reviewing code, debugging React configurations, and guiding students.',
    banner: 'linear-gradient(135deg, #06b6d4, #10b981)',
    bloodGroup: 'AB+', rating: 4.7, ratingCount: 11, successCount: 28, badge: 'Expert Mentor',
    availability: 0.75, availabilityText: 'Available This Week', responseSpeed: 0.82, communities: ['college', 'skill_groups'],
    avatar: '👨‍💻', isHelper: true, isVerified: true,
    points: 980, helpRequestsCompleted: 28, acceptanceRate: 95, responseTime: 15, communityContributions: 18
  },
  {
    id: 'helper_meera', name: 'Meera Iyer', email: 'meera@demo.com',
    password: bcrypt.hashSync('demo123', 10),
    location: { lat: 28.6050, lng: 77.2400, label: 'Lodhi Garden, Delhi' },
    city: 'Delhi', state: 'Delhi', country: 'India',
    skills: ['counseling', 'mental_health', 'volunteering'],
    expertiseLevel: 'Advanced',
    bio: 'Certified counselor helping people deal with stress, anxiety, and general mental well-being.',
    banner: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
    bloodGroup: 'A-', rating: 4.8, ratingCount: 19, successCount: 63, badge: 'Community Hero',
    availability: 0.92, availabilityText: 'Available Now', responseSpeed: 0.95, communities: ['local_area', 'skill_groups'],
    avatar: '🧘‍♀️', isHelper: true, isVerified: true,
    points: 1820, helpRequestsCompleted: 63, acceptanceRate: 99, responseTime: 4, communityContributions: 45
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
    members: ['helper_priya', 'helper_rahul', 'helper_arjun']
  },
  {
    id: 'comm_local',
    name: 'Central Delhi Community',
    type: 'local_area',
    description: 'Residents and workers in Central Delhi area',
    icon: '📍',
    memberCount: 5231,
    members: ['helper_priya', 'helper_ananya', 'helper_meera']
  },
  {
    id: 'comm_skills',
    name: 'Professional Skills Hub',
    type: 'skill_groups',
    description: 'Professionals offering specialized skills and services',
    icon: '⚡',
    memberCount: 1456,
    members: ['helper_rahul', 'helper_arjun', 'helper_meera']
  }
];

const institutions = [
  { id: 'inst_1', name: 'AIIMS Blood Bank', type: 'hospital', icon: '🏥', responseTime: '15 min' },
  { id: 'inst_2', name: 'Red Cross Delhi', type: 'ngo', icon: '🔴', responseTime: '20 min' },
  { id: 'inst_3', name: 'Delhi Police Helpline', type: 'government', icon: '🚔', responseTime: '10 min' }
];

const mockPosts = [
  {
    _id: 'post_1',
    userId: 'helper_arjun',
    name: 'Arjun Reddy',
    avatar: '👨‍💻',
    title: 'How to structure Redux Toolkit in a large React project',
    content: 'Struggling with store configuration? Best practice is to use feature slices, slice-specific selectors, and middleware injection for API queries. Avoid keeping visual toggles in Redux—keep them in local component state!',
    type: 'knowledge',
    upvotes: ['demo-user', 'helper_priya', 'helper_rahul'],
    commentsCount: 2,
    savedBy: ['demo-user']
  },
  {
    _id: 'post_2',
    userId: 'helper_priya',
    name: 'Dr. Priya Sharma',
    avatar: '👩‍⚕️',
    title: 'Essential items to keep in a standard First-Aid Kit',
    content: 'Always ensure you have: antiseptic wipes, sterile gauze pads, medical tape, band-aids, tweezers, pain relievers (ibuprofen/paracetamol), and a digital thermometer. Check expiration dates quarterly!',
    type: 'tip',
    upvotes: ['helper_ananya', 'helper_meera'],
    commentsCount: 1,
    savedBy: []
  },
  {
    _id: 'post_3',
    userId: 'demo-user',
    name: 'Demo User',
    avatar: '👤',
    title: 'Any local study groups near Connaught Place for Python?',
    content: 'I am starting my backend engineering journey and would love to meet up at a library or cafe to code together and review basic OOP concepts. Let me know if anyone is interested!',
    type: 'question',
    upvotes: ['helper_rahul', 'helper_arjun'],
    commentsCount: 1,
    savedBy: []
  }
];

const mockComments = [
  {
    postId: 'post_1',
    userId: 'helper_rahul',
    name: 'Rahul Verma',
    avatar: '👨‍🎓',
    text: 'Thanks Arjun, this really cleared up my confusion regarding RTK Query lifecycle middleware.'
  },
  {
    postId: 'post_1',
    userId: 'demo-user',
    name: 'Demo User',
    avatar: '👤',
    text: 'Excellent tip. Can you post a Github repo example of this folder structure?'
  },
  {
    postId: 'post_2',
    userId: 'helper_ananya',
    name: 'Ananya Gupta',
    avatar: '👩‍🔬',
    text: 'Adding to this, clean the tweezers with alcohol before usage. Very basic but crucial!'
  },
  {
    postId: 'post_3',
    userId: 'helper_rahul',
    name: 'Rahul Verma',
    avatar: '👨‍🎓',
    text: 'Im down! I usually study near Patel Nagar but DU campus cafes work too. Lets sync!'
  }
];

const mockReviews = [
  {
    requestId: 'req_101',
    helperId: 'helper_priya',
    seekerId: 'demo-user',
    seekerName: 'Demo User',
    seekerAvatar: '👤',
    rating: 5,
    text: 'Incredible help. Priya guided me through emergency medical bandages over video chat and coordinates arrived so quickly.'
  },
  {
    requestId: 'req_102',
    helperId: 'helper_arjun',
    seekerId: 'seeker_2',
    seekerName: 'Kabir Dev',
    seekerAvatar: '👨',
    rating: 5,
    text: 'Arjun debugged my Node.js cluster crash in under 15 minutes. Pure genius!'
  }
];

const mockNotifications = [
  {
    userId: 'demo-user',
    type: 'reputation',
    title: 'Reputation Milestone! 🎉',
    message: 'You earned the "🌟 New Contributor" badge for participating in your first community discussions.',
    isRead: false
  },
  {
    userId: 'demo-user',
    type: 'match',
    title: 'Helper Match Found 🎯',
    message: 'Arjun Reddy matches 98% of your request for React development. Connect now.',
    isRead: false
  },
  {
    userId: 'demo-user',
    type: 'endorsement',
    title: 'Skill Endorsement 🏅',
    message: 'Dr. Priya Sharma endorsed your volunteering skill!',
    isRead: true
  }
];

async function seedData() {
    try {
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            console.log('[Database] Database is empty. Seeding FlowZint datasets...');
            
            // Seed Users
            for (const helper of helpers) {
                await User.create({
                    _id: helper.id,
                    name: helper.name,
                    email: helper.email,
                    password: helper.password,
                    location: helper.location,
                    city: helper.city,
                    state: helper.state,
                    country: helper.country,
                    skills: helper.skills,
                    expertiseLevel: helper.expertiseLevel,
                    bio: helper.bio,
                    banner: helper.banner,
                    bloodGroup: helper.bloodGroup,
                    rating: helper.rating,
                    ratingCount: helper.ratingCount,
                    successCount: helper.successCount,
                    badge: helper.badge,
                    availability: helper.availability,
                    availabilityText: helper.availabilityText,
                    responseSpeed: helper.responseSpeed,
                    communities: helper.communities,
                    avatar: helper.avatar,
                    isHelper: helper.isHelper,
                    isVerified: helper.isVerified,
                    points: helper.points,
                    helpRequestsCompleted: helper.helpRequestsCompleted,
                    acceptanceRate: helper.acceptanceRate,
                    responseTime: helper.responseTime,
                    communityContributions: helper.communityContributions
                });
            }

            // Seed Demo User
            await User.create({
                _id: 'demo-user',
                name: 'Demo User',
                email: 'demo@acin.ai',
                password: bcrypt.hashSync('demo123', 10),
                location: { lat: 28.6139, lng: 77.2090, label: 'Connaught Place, Delhi' },
                city: 'Delhi',
                state: 'Delhi',
                country: 'India',
                skills: ['programming', 'volunteering'],
                expertiseLevel: 'Beginner',
                bio: 'An aspiring engineer exploring web apps. Passionate about community service and collaborative building.',
                banner: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                isHelper: false,
                points: 150,
                helpRequestsCompleted: 2,
                acceptanceRate: 100,
                responseTime: 10,
                communityContributions: 5,
                avatar: '👤'
            });

            // Seed Community Posts
            for (const post of mockPosts) {
                await CommunityPost.create(post);
            }

            // Seed Comments
            for (const comment of mockComments) {
                await Comment.create(comment);
            }

            // Seed Reviews
            for (const review of mockReviews) {
                await Review.create(review);
            }

            // Seed Notifications
            for (const notification of mockNotifications) {
                await Notification.create(notification);
            }

            console.log('[Database] FlowZint data seeding successfully completed.');
        } else {
            console.log('[Database] Database populated. Skipping seed sequence.');
        }
    } catch (error) {
        console.error(`[Database] Seeding Error: ${error.message}`);
    }
}

module.exports = { helpers, communities, institutions, seedData };
