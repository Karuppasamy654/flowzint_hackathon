import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import LoginModal from '../components/LoginModal';
import './Home.css';

const localTexts = {
    en: {
        badge: 'Next-Gen Community Help Platform',
        title1: 'Get Help. Give Help.',
        title2: 'Grow Together.',
        desc: 'Connect instantly with people who can solve your problems. Instant matching, location-based radar, and community contributions.',
        btnGetStarted: 'Get Started',
        btnDemo: '🎬 Launch Demo Simulation',
        featuresHeading: 'Why FlowZint is Different',
        feature1: 'Instant Matching',
        feature1Desc: 'FlowZint algorithm ranks helper fits in seconds based on skills, coordinates, ratings and availability.',
        feature2: 'Real-Time Chat',
        feature2Desc: 'Connect in an active, private chat workspace featuring message typing status and seen indicators.',
        feature3: 'Verified Skills',
        feature3Desc: 'LinkedIn-style skills tagging with endorsements and expertise levels verify helper experience.',
        feature4: 'Community Reputation',
        feature4Desc: 'Help seekers rate helpers. Earn XP points, unlock helper status levels and leaderboard ranks.',
        ctaTitle: 'Ready to Join FlowZint?',
        ctaDesc: 'Experience the ultimate peer matching community network now.',
        ctaBtn: '🚀 Join FlowZint Now',
        footer: 'FlowZint — Real-time Community Assistance Platform • Built for Social Impact & Speed',
        login: 'Login',
        activeHelpers: 'Local Helpers',
        resolved: 'Incidents Solved',
        speed: 'Match Response',
        success: 'Resolution Rate'
    },
    hi: {
        badge: 'नेक्स्ट-जेन सामुदायिक सहायता मंच',
        title1: 'मदद लें। मदद दें।',
        title2: 'साथ मिलकर बढ़ें।',
        desc: 'उन लोगों से तुरंत जुड़ें जो आपकी समस्याओं का समाधान कर सकते हैं। तत्काल मिलान, स्थान-आधारित रडार, और सामुदायिक योगदान।',
        btnGetStarted: 'शुरू करें',
        btnDemo: '🎬 डेमो सिमुलेशन चलाएं',
        featuresHeading: 'फ़्लोज़िंट अलग क्यों है',
        feature1: 'त्वरित मिलान',
        feature1Desc: 'फ़्लोज़िंट एल्गोरिदम कौशल, निर्देशांक, रेटिंग और उपलब्धता के आधार पर सेकंड में सबसे उपयुक्त सहायक का पता लगाता है।',
        feature2: 'सक्रिय चैट',
        feature2Desc: 'संदेश लिखने की स्थिति और पठन सूचकांकों के साथ एक सक्रिय, निजी चैट स्थान में जुड़ें।',
        feature3: 'सत्यापित कौशल',
        feature3Desc: 'प्रमाणपत्रों और विशेषज्ञता स्तरों के साथ लिंक्डइन-शैली कौशल टैगिंग सहायक के अनुभव की पुष्टि करती है।',
        feature4: 'सामुदायिक प्रतिष्ठा',
        feature4Desc: 'सहायता चाहने वाले सहायकों को रेटिंग देते हैं। एक्सपी अंक अर्जित करें, लीडरबोर्ड स्तरों को अनलॉक करें।',
        ctaTitle: 'फ़्लोज़िंट में शामिल होने के लिए तैयार हैं?',
        ctaDesc: 'अभी अंतिम सहकर्मी मिलान समुदाय नेटवर्क का अनुभव करें।',
        ctaBtn: '🚀 अभी फ़्लोज़िंट से जुड़ें',
        footer: 'फ़्लोज़िंट — रीयल-टाइम सामुदायिक सहायता मंच • सामाजिक प्रभाव और गति के लिए निर्मित',
        login: 'लॉग इन',
        activeHelpers: 'स्थानीय सहायक',
        resolved: 'हल की गई घटनाएं',
        speed: 'त्वरित प्रतिक्रिया',
        success: 'सफलता दर'
    },
    ta: {
        badge: 'நெக்ஸ்ட்-ஜென் சமூக உதவி தளம்',
        title1: 'உதவி பெறுக. உதவி தருக.',
        title2: 'ஒன்றாக வளர்க.',
        desc: 'உங்கள் பிரச்சினைகளைத் தீர்க்கக்கூடியவர்களுடன் உடனடியாக இணையுங்கள். உடனடிப் பொருத்தம், இருப்பிடம் சார்ந்த ரேடார் மற்றும் சமூகப் பங்களிப்புகள்.',
        btnGetStarted: 'தொடங்குக',
        btnDemo: '🎬 டெமோவை இயக்குக',
        featuresHeading: 'ஃப்ளோசிண்ட் ஏன் வேறுபட்டது',
        feature1: 'உடனடிப் பொருத்தம்',
        feature1Desc: 'திறன்கள், ஒருங்கிணைப்புகள், மதிப்பீடுகள் மற்றும் கிடைக்கும் தன்மையின் அடிப்படையில் வினாடிகளில் சிறந்த உதவியாளரைத் தேர்ந்தெடுக்கிறது.',
        feature2: 'செயலில் உள்ள அரட்டை',
        feature2Desc: 'செய்தி தட்டச்சு நிலை மற்றும் பார்த்ததற்கான அறிகுறிகளுடன் அரட்டையடிக்க செயலில் உள்ள அரட்டை அறையில் இணையுங்கள்.',
        feature3: 'சரிபார்க்கப்பட்ட திறன்கள்',
        feature3Desc: 'மதிப்பீடுகள் மற்றும் நிபுணத்துவ நிலைகளுடன் கூடிய லிங்க்ட்இன்-பாணி திறன்கள் உதவியாளரின் அனுபவத்தை உறுதி செய்கின்றன.',
        feature4: 'சமூக நற்பெயர்',
        feature4Desc: 'உதவி பெறுவோர் உதவியாளர்களுக்கு மதிப்பீடு வழங்கலாம். எக்ஸ்பி புள்ளிகளைப் பெற்று, முன்னிலை அட்டவணையை திறக்கவும்.',
        ctaTitle: 'ஃப்ளோசிண்டில் இணைய தயாரா?',
        ctaDesc: 'அனைத்து வசதிகளும் கொண்ட சமூக உதவி அமைப்பை இப்போது அனுபவியுங்கள்.',
        ctaBtn: '🚀 இப்போது ஃப்ளோசிண்டில் இணைக',
        footer: 'ஃப்ளோசிண்ட் — நிகழ்நேர சமூக உதவி தளம் • சமூக தாக்கம் மற்றும் வேகத்திற்காக உருவாக்கப்பட்டது',
        login: 'உள்நுழைக',
        activeHelpers: 'உள்ளூர் உதவியாளர்கள்',
        resolved: 'தீர்க்கப்பட்ட நிகழ்வுகள்',
        speed: 'பதில் வேகம்',
        success: 'வெற்றி விகிதம்'
    }
};

export default function Home() {
    const navigate = useNavigate();
    const { demoLogin } = useAuth();
    const { language, setLanguage, theme, setTheme } = useUI();
    
    const [showLogin, setShowLogin] = useState(false);
    const [isLoginOnly, setIsLoginOnly] = useState(false);

    const txt = localTexts[language] || localTexts['en'];

    const handleGetStarted = () => {
        setIsLoginOnly(false);
        setShowLogin(true);
    };

    const handleLoginClick = () => {
        setIsLoginOnly(true);
        setShowLogin(true);
    };

    const handleDemo = async () => {
        try {
            await demoLogin();
            navigate('/dashboard?demo=true');
        } catch (err) {
            console.error('Demo login failed:', err);
        }
    };

    const features = [
        { icon: '🎯', title: txt.feature1, desc: txt.feature1Desc },
        { icon: '💬', title: txt.feature2, desc: txt.feature2Desc },
        { icon: '🛡️', title: txt.feature3, desc: txt.feature3Desc },
        { icon: '🏆', title: txt.feature4, desc: txt.feature4Desc }
    ];

    const stats = [
        { value: '500+', label: txt.activeHelpers },
        { value: '1,200+', label: txt.resolved },
        { value: '<15s', label: txt.speed },
        { value: '98.5%', label: txt.success }
    ];

    return (
        <div className="home-page" style={{ paddingTop: '80px' }}>
            {/* Top Navbar rebrand */}
            <motion.nav 
                className="navbar"
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    width: '100%',
                    height: '80px',
                    background: 'var(--bg-glass)',
                    backdropFilter: 'blur(15px)',
                    borderBottom: '1px solid var(--border-glass)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div className="navbar-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="logo-icon" style={{ fontSize: '1.6rem', color: 'var(--accent-blue)' }}>⚡</span>
                        <span className="logo-text" style={{ fontSize: '1.5rem', fontWeight: 900, background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>FlowZint</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {/* Theme Toggle Button */}
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border-glass)',
                                color: 'var(--text-primary)',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '1.1rem',
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer'
                            }}
                            title="Toggle Light/Dark Theme"
                        >
                            {theme === 'dark' ? '☀️' : '🌙'}
                        </button>

                        {/* Language Dropdown Selector */}
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border-glass)',
                                color: 'var(--text-primary)',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                fontWeight: '700',
                                outline: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            <option value="en" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🇺🇸 English</option>
                            <option value="hi" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🇮🇳 हिंदी (Hindi)</option>
                            <option value="ta" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>🇮🇳 தமிழ் (Tamil)</option>
                        </select>

                        <button className="btn-secondary" style={{ padding: '10px 22px', fontSize: '0.9rem' }} onClick={handleLoginClick}>{txt.login}</button>
                        <button className="btn-primary" style={{ padding: '10px 22px', fontSize: '0.9rem' }} onClick={handleGetStarted}>{txt.btnGetStarted}</button>
                    </div>
                </div>
            </motion.nav>

            {/* Hero Section */}
            <section className="hero" style={{ minHeight: 'calc(100vh - 80px)' }}>
                <motion.div
                    className="hero-content"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                >
                    <motion.div
                        className="hero-badge"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                        style={{ fontSize: '0.9rem', padding: '8px 22px' }}
                    >
                        <span className="badge-dot" />
                        {txt.badge}
                    </motion.div>

                    <h1 className="hero-title" style={{ fontSize: '4.2rem', fontWeight: 900, lineHeight: 1.12, marginBottom: '24px', letterSpacing: '-0.03em' }}>
                        {txt.title1}
                        <br />
                        <span className="gradient-text">{txt.title2}</span>
                    </h1>

                    <p className="hero-subtitle" style={{ fontSize: '1.35rem', color: 'var(--text-secondary)', marginBottom: '36px', maxWidth: '680px', marginLeft: 'auto', marginRight: 'auto' }}>
                        {txt.desc}
                    </p>

                    <div className="hero-actions">
                        <motion.button
                            className="btn-primary btn-lg"
                            onClick={handleGetStarted}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {txt.btnGetStarted}
                        </motion.button>
                        <motion.button
                            className="btn-secondary btn-lg demo-btn"
                            onClick={handleDemo}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                            style={{ border: '1px solid var(--border-glass)', background: 'rgba(255,255,255,0.02)' }}
                        >
                            {txt.btnDemo}
                        </motion.button>
                    </div>
                </motion.div>

                {/* Floating Orbs */}
                <div className="hero-orbs">
                    <div className="orb orb-1" />
                    <div className="orb orb-2" />
                    <div className="orb orb-3" />
                </div>
            </section>

            {/* Stats Preview */}
            <section className="stats-section container">
                <div className="stats-grid">
                    {stats.map((stat, i) => (
                        <motion.div
                            key={i}
                            className="stat-item glass-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ scale: 1.03 }}
                            style={{ padding: '28px 20px' }}
                        >
                            <span className="stat-value" style={{ fontSize: '2.5rem' }}>{stat.value}</span>
                            <span className="stat-label" style={{ fontSize: '0.85rem' }}>{stat.label}</span>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Features Preview */}
            <section className="features-section container">
                <motion.h2
                    className="section-heading"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    style={{ fontSize: '2.4rem', marginBottom: '50px' }}
                >
                    {txt.featuresHeading}
                </motion.h2>
                <div className="features-grid" style={{ gap: '24px' }}>
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            className="feature-card glass-card"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{ y: -6, borderColor: 'var(--accent-blue)', boxShadow: 'var(--shadow-glow)' }}
                            style={{ padding: '32px 28px' }}
                        >
                            <span className="feature-icon" style={{ fontSize: '2.5rem' }}>{f.icon}</span>
                            <h3 className="feature-title" style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '10px' }}>{f.title}</h3>
                            <p className="feature-desc" style={{ fontSize: '0.92rem', lineHeight: 1.65 }}>{f.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section container">
                <motion.div
                    className="cta-card glass-card-strong"
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    style={{ padding: '56px 40px' }}
                >
                    <h2 style={{ fontSize: '2.2rem', marginBottom: '14px' }}>{txt.ctaTitle}</h2>
                    <p style={{ fontSize: '1.15rem', marginBottom: '32px' }}>{txt.ctaDesc}</p>
                    <button className="btn-primary btn-lg" onClick={handleGetStarted}>
                        {txt.ctaBtn}
                    </button>
                </motion.div>
            </section>

            <footer className="home-footer">
                <p>{txt.footer}</p>
            </footer>

            <AnimatePresence>
                {showLogin && (
                    <LoginModal 
                        onClose={() => setShowLogin(false)} 
                        initialRegister={!isLoginOnly}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
