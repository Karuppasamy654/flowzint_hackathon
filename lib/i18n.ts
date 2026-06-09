export type Language = 'en' | 'ta' | 'hi' | 'ml' | 'te';

export const LANGUAGES: { code: Language; label: string; nativeLabel: string; flag: string }[] = [
  { code: 'en', label: 'English',   nativeLabel: 'English',    flag: '🇬🇧' },
  { code: 'ta', label: 'Tamil',     nativeLabel: 'தமிழ்',      flag: '🇮🇳' },
  { code: 'hi', label: 'Hindi',     nativeLabel: 'हिन्दी',     flag: '🇮🇳' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം',    flag: '🇮🇳' },
  { code: 'te', label: 'Telugu',    nativeLabel: 'తెలుగు',     flag: '🇮🇳' },
];

export type TranslationKey =
  // Nav
  | 'nav.requestHelp'
  | 'nav.insights'
  | 'nav.conversations'
  | 'nav.notifications'
  | 'nav.myProfile'
  // Request form
  | 'request.needHelp'
  | 'request.helpOthers'
  | 'request.requestTitle'
  | 'request.category'
  | 'request.urgency'
  | 'request.location'
  | 'request.describe'
  | 'request.submit'
  | 'request.pendingMatch'
  | 'request.activeSessions'
  | 'request.noActiveSessions'
  | 'request.pendingRequests'
  | 'request.acceptChat'
  | 'request.aiAnalyzing'
  | 'request.enhanceAI'
  | 'request.requestAssistance'
  | 'request.aiSuggested'
  | 'request.aiDetected'
  | 'request.locationLabel'
  | 'request.flexibleSchedule'
  | 'request.somethingToday'
  | 'request.urgentAsap'
  | 'request.selectCategory'
  | 'request.descPlaceholder'
  | 'request.titlePlaceholder'
  | 'request.enhancing'
  | 'request.useVersion'
  | 'request.keepOriginal'
  | 'request.aiEnhanced'
  | 'request.clarityScore'
  | 'request.missingInfoTip'
  | 'request.safetyWarning'
  | 'request.editRequest'
  | 'request.contactSupport'
  | 'request.submittingRequest'
  | 'request.aiAnalyzingReq'
  | 'request.blockedSafety'
  | 'request.blockedClarity'
  | 'request.postingRequest'
  // Messages page
  | 'messages.title'
  | 'messages.subtitle'
  | 'messages.selectChat'
  | 'messages.selectChatDesc'
  | 'messages.typeMessage'
  | 'messages.resolved'
  | 'messages.resolve'
  | 'messages.smartReply'
  | 'messages.connecting'
  | 'messages.sayHello'
  | 'messages.newMessage'
  | 'messages.listening'
  | 'messages.helpRequest'
  | 'messages.autoTranslate'
  | 'messages.generatingReplies'
  // Notifications
  | 'notifications.title'
  | 'notifications.subtitle'
  | 'notifications.empty'
  | 'notifications.emptyDesc'
  | 'notifications.markAllRead'
  | 'notifications.markRead'
  | 'notifications.newMatch'
  | 'notifications.acceptRequest'
  | 'notifications.openChat'
  | 'notifications.reply'
  | 'notifications.viewRatings'
  | 'notifications.requestAgain'
  | 'notifications.signedInAs'
  // Profile
  | 'profile.editProfile'
  | 'profile.skills'
  | 'profile.helperRatings'
  | 'profile.pastRequests'
  | 'profile.pastRequestsDesc'
  | 'profile.joinedDate'
  | 'profile.reviews'
  | 'profile.noSkills'
  | 'profile.changePhoto'
  | 'profile.fullName'
  | 'profile.locationHint'
  | 'profile.shortBio'
  | 'profile.skillsLabel'
  | 'profile.saving'
  | 'profile.historyTitle'
  | 'profile.historySubtitle'
  | 'profile.myRequests'
  | 'profile.completedAssists'
  | 'profile.noRequests'
  | 'profile.noRequestsDesc'
  | 'profile.noAssists'
  | 'profile.noAssistsDesc'
  | 'profile.completed'
  | 'profile.cancelled'
  | 'profile.expired'
  | 'profile.created'
  | 'profile.helper'
  | 'profile.seeker'
  | 'profile.resolvedOn'
  // Insights
  | 'insights.title'
  | 'insights.subtitle'
  | 'insights.members'
  | 'insights.resolved'
  | 'insights.activeNow'
  | 'insights.avgRating'
  | 'insights.topCategories'
  | 'insights.successStories'
  | 'insights.poweredBy'
  | 'insights.weeklyDigest'
  | 'insights.aiSummaryLabel'
  | 'insights.realAccounts'
  | 'insights.newRequests'
  | 'insights.newMembers'
  // Waiting state
  | 'waiting.analyzing'
  | 'waiting.matching'
  | 'waiting.accepted'
  | 'waiting.redirecting'
  | 'waiting.analyzingDesc'
  | 'waiting.matchingDesc'
  | 'waiting.acceptedDesc'
  | 'waiting.redirectingDesc'
  | 'waiting.cancelRequest'
  | 'waiting.matchedNeighbors'
  | 'waiting.semanticActive'
  | 'waiting.scanning'
  | 'waiting.matchLocked'
  | 'waiting.urgency'
  | 'waiting.initializingAI'
  // Chat assistant
  | 'ai.helpNetAI'
  | 'ai.poweredByGemini'
  | 'ai.askAnything'
  | 'ai.quickQuestions'
  | 'ai.writeRequest'
  | 'ai.howMatching'
  | 'ai.howRatings'
  | 'ai.isSafe'
  // Rating modal
  | 'rating.title'
  | 'rating.question'
  | 'rating.feedbackLabel'
  | 'rating.feedbackPlaceholder'
  | 'rating.resolving'
  | 'rating.submitClose'
  // UserMenu
  | 'menu.signedInAs'
  | 'menu.myProfile'
  | 'menu.logOut'
  // ConversationList
  | 'chat.searchPlaceholder'
  | 'chat.searchResults'
  | 'chat.noNeighbors'
  | 'chat.noConversations'
  | 'chat.noConversationsDesc'
  | 'chat.active'
  | 'chat.viewProfile'
  | 'chat.you'
  | 'chat.chatOpened'
  // Common
  | 'common.loading'
  | 'common.cancel'
  | 'common.save'
  | 'common.edit'
  | 'common.back'
  | 'common.signOut'
  | 'common.viewProfile'
  | 'common.inProgress'
  | 'common.successRate'
  | 'common.from'
  | 'common.noneYet';

type Translations = Partial<Record<TranslationKey, string>>;

export const translations: Record<Language, Translations> = {
  en: {
    'nav.requestHelp':      'Request Help',
    'nav.insights':         'Insights',
    'nav.conversations':    'Conversations',
    'nav.notifications':    'Notifications',
    'nav.myProfile':        'My Profile',
    'request.needHelp':     'Need Help',
    'request.helpOthers':   'Help Others',
    'request.requestTitle': 'Request Title',
    'request.category':     'Category',
    'request.urgency':      'Urgency',
    'request.location':     'Location',
    'request.describe':     'Describe what you need',
    'request.submit':       'Submit Help Request',
    'request.pendingMatch': 'Request Pending Match',
    'request.activeSessions':'Active Help Sessions',
    'request.noActiveSessions':'No active help sessions',
    'request.pendingRequests':'Pending Requests',
    'request.acceptChat':   'Accept & Chat',
    'request.aiAnalyzing':  'AI analyzing...',
    'request.enhanceAI':    '✨ Enhance with AI',
    'messages.title':       'Conversations',
    'messages.subtitle':    'Coordinate with neighbors to solve pending help requests.',
    'messages.selectChat':  'Select a Conversation',
    'messages.selectChatDesc':'Click a conversation to open your live chat window.',
    'messages.typeMessage': 'Type a message…',
    'messages.resolved':    'Resolved',
    'messages.resolve':     'Resolve',
    'messages.smartReply':  'Smart Reply',
    'notifications.title':  'Notifications',
    'notifications.subtitle':'Keep track of requests matching your skills, messages, and feedback.',
    'notifications.empty':  'You\'re all caught up!',
    'notifications.emptyDesc':'No notifications to display yet.',
    'notifications.markAllRead':'Mark all read',
    'notifications.markRead':'Mark read',
    'notifications.newMatch':'New Match',
    'notifications.acceptRequest':'Accept Request',
    'notifications.openChat':'Open Chat',
    'notifications.reply':  'Reply',
    'notifications.viewRatings':'View Ratings',
    'notifications.requestAgain':'Request Again',
    'profile.editProfile':  'Edit Profile',
    'profile.skills':       'Skills & Help categories',
    'profile.helperRatings':'Helper Ratings',
    'profile.pastRequests': 'Past Help Requests',
    'profile.pastRequestsDesc':'View history of your requests and responses.',
    'profile.joinedDate':   'Joined',
    'profile.reviews':      'reviews',
    'profile.noSkills':     'No skills added yet. Click Edit Profile.',
    'insights.title':       'Platform Insights',
    'insights.subtitle':    'AI-powered analytics of your community impact',
    'insights.members':     'Members',
    'insights.resolved':    'Resolved',
    'insights.activeNow':   'Active Now',
    'insights.avgRating':   'Avg Rating',
    'insights.topCategories':'Top Help Categories',
    'insights.successStories':'Recent Success Stories',
    'insights.poweredBy':   'Powered by Gemini AI',
    'insights.weeklyDigest':'AI Weekly Digest',
    'common.loading':       'Loading...',
    'common.cancel':        'Cancel',
    'common.save':          'Save Changes',
    'common.edit':          'Edit',
    'common.back':          'Back',
    'common.signOut':       'Log out',
    'common.viewProfile':   'View profile',
    'common.inProgress':    'In progress',
    'common.successRate':   '% success rate',
    'common.from':          'from',
    'common.noneYet':       'None yet',
    // Messages page
    'messages.connecting':        'Connecting...',
    'messages.sayHello':          'Say Hello',
    'messages.newMessage':        'New Message',
    'messages.listening':         'Listening...',
    'messages.helpRequest':       'Help Request',
    'messages.autoTranslate':     'Auto Translate',
    'messages.generatingReplies': 'Generating Replies',
    // Notifications additional
    'notifications.signedInAs':   'Signed in as',
    // Profile additional
    'profile.completed':          'Completed',
    'profile.cancelled':          'Cancelled',
    'profile.expired':            'Expired',
    'profile.created':            'Created',
    'profile.helper':             'Helper',
    'profile.seeker':             'Seeker',
    'profile.resolvedOn':         'Resolved On',
    'profile.changePhoto':      'Change Photo',
    'profile.fullName':         'Full Name',
    'profile.locationHint':     'Location Hint',
    'profile.shortBio':         'Short Bio',
    'profile.skillsLabel':      'Skills',
    'profile.saving':           'Saving...',
    'profile.historyTitle':     'History',
    'profile.historySubtitle':  'History Details',
    'profile.myRequests':       'My Requests',
    'profile.completedAssists':'Completed Assists',
    'profile.noRequests':       'No Requests',
    'profile.noRequestsDesc':   'You have no requests',
    'profile.noAssists':        'No Assists',
    'profile.noAssistsDesc':    'You have no assists',
    // Insights additional
    'insights.aiSummaryLabel':    'AI Summary',
    'insights.realAccounts':      'Real Accounts',
    'insights.newRequests':       'New Requests',
    'insights.newMembers':        'New Members',
    // Waiting state additional
    'waiting.analyzing':          'Analyzing...',
    'waiting.matching':           'Matching...',
    'waiting.accepted':           'Accepted',
    'waiting.redirecting':        'Redirecting...',
    'waiting.analyzingDesc':      'Analyzing your request',
    'waiting.matchingDesc':       'Finding best match',
    'waiting.acceptedDesc':       'You have accepted the chat',
    'waiting.redirectingDesc':    'Redirecting to chat',
    'waiting.cancelRequest':      'Cancel Request',
    'waiting.matchedNeighbors':   'Matched Neighbors',
    'waiting.semanticActive':     'Semantic Active',
    'waiting.scanning':           'Scanning...',
    'waiting.matchLocked':        'Match Locked',
    'waiting.urgency':            'Urgency',
    'waiting.initializingAI':     'Initializing AI',
    // AI assistant additional
    'ai.helpNetAI':               'Help Net AI',
    'ai.poweredByGemini':         'Powered by Gemini',
    'ai.askAnything':             'Ask Anything',
    'ai.quickQuestions':          'Quick Questions',
    'ai.writeRequest':            'Write Request',
    'ai.howMatching':             'How Matching Works',
    'ai.howRatings':              'How Ratings Work',
    'ai.isSafe':                  'Is Safe?',
    // Rating modal additional
    'rating.title':               'Rate Your Experience',
    'rating.question':            'How would you rate this interaction?',
    'rating.feedbackLabel':       'Feedback',
    'rating.feedbackPlaceholder': 'Enter your feedback here',
    'rating.resolving':           'Resolving...',
    'rating.submitClose':         'Submit & Close',
    // UserMenu additional
    'menu.signedInAs':            'Signed in as',
    'menu.myProfile':             'My Profile',
    'menu.logOut':                'Log Out',
    // ConversationList additional
    'chat.searchPlaceholder':     'Search conversations...',
    'chat.searchResults':         'Search Results',
    'chat.noNeighbors':           'No neighbors found',
    'chat.noConversations':       'No conversations yet',
    'chat.noConversationsDesc':   'Start a request to begin chatting',
    'chat.active':                'Active',
    'chat.viewProfile':           'View Profile',
    'chat.you':                   'You',
    'chat.chatOpened':            'Chat Opened',

    'request.requestAssistance': 'Request Assistance',
    'request.aiSuggested': 'AI Suggested',
    'request.aiDetected': 'AI Detected',
    'request.locationLabel': 'Location',
    'request.flexibleSchedule': 'Flexible Schedule',
    'request.somethingToday': 'Something Today',
    'request.urgentAsap': 'Urgent ASAP',
    'request.selectCategory': 'Select Category',
    'request.descPlaceholder': 'Description...',
    'request.titlePlaceholder': 'Title...',
    'request.enhancing': 'Enhancing...',
    'request.useVersion': 'Use Version',
    'request.keepOriginal': 'Keep Original',
    'request.aiEnhanced': 'AI Enhanced',
    'request.clarityScore': 'Clarity Score',
    'request.missingInfoTip': 'Missing Info Tip',
    'request.safetyWarning': 'Safety Warning',
    'request.editRequest': 'Edit Request',
    'request.contactSupport': 'Contact Support',
    'request.submittingRequest': 'Submitting Request',
    'request.aiAnalyzingReq': 'AI Analyzing Request',
    'request.blockedSafety': 'Blocked for Safety',
    'request.blockedClarity': 'Blocked for Clarity',
    'request.postingRequest': 'Posting Request'
  },

  ta: {
    'nav.requestHelp':      'உதவி கோரு',
    'nav.insights':         'நுண்ணறிவு',
    'nav.conversations':    'உரையாடல்கள்',
    'nav.notifications':    'அறிவிப்புகள்',
    'nav.myProfile':        'என் சுயவிவரம்',
    'request.needHelp':     'உதவி தேவை',
    'request.helpOthers':   'மற்றவர்களுக்கு உதவு',
    'request.requestTitle': 'கோரிக்கை தலைப்பு',
    'request.category':     'வகை',
    'request.urgency':      'அவசரம்',
    'request.location':     'இடம்',
    'request.describe':     'உங்களுக்கு என்ன தேவை என்று விவரி',
    'request.submit':       'உதவி கோரிக்கை சமர்ப்பி',
    'request.pendingMatch': 'பொருத்தம் காத்திருக்கிறது',
    'request.activeSessions':'செயலில் உள்ள உதவி அமர்வுகள்',
    'request.noActiveSessions':'செயலில் உள்ள அமர்வுகள் இல்லை',
    'request.pendingRequests':'நிலுவையில் உள்ள கோரிக்கைகள்',
    'request.acceptChat':   'ஏற்று & அரட்டை',
    'request.aiAnalyzing':  'AI பகுப்பாய்வு...',
    'request.enhanceAI':    '✨ AI மூலம் மேம்படுத்து',
    'messages.title':       'உரையாடல்கள்',
    'messages.subtitle':    'நிலுவையில் உள்ள கோரிக்கைகளை தீர்க்க அண்டை வாசிகளுடன் ஒருங்கிணை.',
    'messages.selectChat':  'உரையாடலை தேர்ந்தெடு',
    'messages.selectChatDesc':'நேரடி அரட்டை திறக்க ஒரு உரையாடலைக் கிளிக் செய்யவும்.',
    'messages.typeMessage': 'செய்தி தட்டச்சு செய்க…',
    'messages.resolved':    'தீர்க்கப்பட்டது',
    'messages.resolve':     'தீர்',
    'messages.smartReply':  'ஸ்மார்ட் பதில்',
    'notifications.title':  'அறிவிப்புகள்',
    'notifications.subtitle':'உங்கள் திறமைகள், செய்திகள் மற்றும் கருத்துகளை கண்காணி.',
    'notifications.empty':  'நீங்கள் புதுப்பித்த நிலையில் உள்ளீர்கள்!',
    'notifications.emptyDesc':'இன்னும் எந்த அறிவிப்பும் இல்லை.',
    'notifications.markAllRead':'அனைத்தையும் படித்ததாக குறி',
    'notifications.markRead':'படித்ததாக குறி',
    'notifications.newMatch':'புதிய பொருத்தம்',
    'notifications.acceptRequest':'கோரிக்கையை ஏற்று',
    'notifications.openChat':'அரட்டை திற',
    'notifications.reply':  'பதிலளி',
    'notifications.viewRatings':'மதிப்பீடுகளை பார்',
    'notifications.requestAgain':'மீண்டும் கோரு',
    'profile.editProfile':  'சுயவிவரம் திருத்து',
    'profile.skills':       'திறன்கள் & உதவி வகைகள்',
    'profile.helperRatings':'உதவியாளர் மதிப்பீடுகள்',
    'profile.pastRequests': 'கடந்த கோரிக்கைகள்',
    'profile.pastRequestsDesc':'உங்கள் கோரிக்கைகளின் வரலாற்றை பார்க்கவும்.',
    'profile.joinedDate':   'சேர்ந்த தேதி',
    'profile.reviews':      'விமர்சனங்கள்',
    'profile.noSkills':     'இன்னும் திறன்கள் சேர்க்கப்படவில்லை.',
    'insights.title':       'தளம் நுண்ணறிவு',
    'insights.subtitle':    'உங்கள் சமூக தாக்கத்தின் AI பகுப்பாய்வு',
    'insights.members':     'உறுப்பினர்கள்',
    'insights.resolved':    'தீர்க்கப்பட்டது',
    'insights.activeNow':   'இப்போது செயலில்',
    'insights.avgRating':   'சராசரி மதிப்பீடு',
    'insights.topCategories':'முதல் உதவி வகைகள்',
    'insights.successStories':'சமீபத்திய வெற்றிக் கதைகள்',
    'insights.poweredBy':   'Gemini AI மூலம் இயக்கப்படுகிறது',
    'insights.weeklyDigest':'AI வார சுருக்கம்',
    'common.loading':       'ஏற்றுகிறது...',
    'common.cancel':        'ரத்து செய்',
    'common.save':          'மாற்றங்களை சேமி',
    'common.edit':          'திருத்து',
    'common.back':          'பின்',
    'common.signOut':       'வெளியேறு',
    'common.viewProfile':   'சுயவிவரம் பார்',
    'common.inProgress':    'நடந்துகொண்டிருக்கிறது',
    'common.successRate':   '% வெற்றி விகிதம்',
    'common.from':          'இலிருந்து',
    'common.noneYet':       'இன்னும் இல்லை',
  },

  hi: {
    'nav.requestHelp':      'सहायता माँगें',
    'nav.insights':         'अंतर्दृष्टि',
    'nav.conversations':    'बातचीत',
    'nav.notifications':    'सूचनाएं',
    'nav.myProfile':        'मेरी प्रोफ़ाइल',
    'request.needHelp':     'सहायता चाहिए',
    'request.helpOthers':   'दूसरों की मदद करें',
    'request.requestTitle': 'अनुरोध शीर्षक',
    'request.category':     'श्रेणी',
    'request.urgency':      'तात्कालिकता',
    'request.location':     'स्थान',
    'request.describe':     'बताएं आपको क्या चाहिए',
    'request.submit':       'सहायता अनुरोध भेजें',
    'request.pendingMatch': 'अनुरोध मिलान लंबित',
    'request.activeSessions':'सक्रिय सहायता सत्र',
    'request.noActiveSessions':'कोई सक्रिय सत्र नहीं',
    'request.pendingRequests':'लंबित अनुरोध',
    'request.acceptChat':   'स्वीकार करें & चैट',
    'request.aiAnalyzing':  'AI विश्लेषण...',
    'request.enhanceAI':    '✨ AI से बेहतर बनाएं',
    'messages.title':       'बातचीत',
    'messages.subtitle':    'लंबित सहायता अनुरोधों को हल करने के लिए पड़ोसियों से समन्वय करें।',
    'messages.selectChat':  'बातचीत चुनें',
    'messages.selectChatDesc':'लाइव चैट खोलने के लिए एक बातचीत पर क्लिक करें।',
    'messages.typeMessage': 'संदेश टाइप करें…',
    'messages.resolved':    'हल हो गया',
    'messages.resolve':     'हल करें',
    'messages.smartReply':  'स्मार्ट उत्तर',
    'notifications.title':  'सूचनाएं',
    'notifications.subtitle':'अपने कौशल, संदेशों और प्रतिक्रिया को ट्रैक करें।',
    'notifications.empty':  'सब कुछ अपडेट है!',
    'notifications.emptyDesc':'अभी कोई सूचना नहीं।',
    'notifications.markAllRead':'सभी पढ़ा हुआ चिह्नित करें',
    'notifications.markRead':'पढ़ा हुआ चिह्नित करें',
    'notifications.newMatch':'नया मिलान',
    'notifications.acceptRequest':'अनुरोध स्वीकार करें',
    'notifications.openChat':'चैट खोलें',
    'notifications.reply':  'उत्तर दें',
    'notifications.viewRatings':'रेटिंग देखें',
    'notifications.requestAgain':'फिर से अनुरोध करें',
    'profile.editProfile':  'प्रोफ़ाइल संपादित करें',
    'profile.skills':       'कौशल और सहायता श्रेणियाँ',
    'profile.helperRatings':'सहायक रेटिंग',
    'profile.pastRequests': 'पिछले सहायता अनुरोध',
    'profile.pastRequestsDesc':'अपने अनुरोधों और प्रतिक्रियाओं का इतिहास देखें।',
    'profile.joinedDate':   'शामिल हुए',
    'profile.reviews':      'समीक्षाएं',
    'profile.noSkills':     'अभी तक कोई कौशल नहीं जोड़ा।',
    'insights.title':       'प्लेटफ़ॉर्म अंतर्दृष्टि',
    'insights.subtitle':    'आपके सामुदायिक प्रभाव का AI-संचालित विश्लेषण',
    'insights.members':     'सदस्य',
    'insights.resolved':    'हल किए गए',
    'insights.activeNow':   'अभी सक्रिय',
    'insights.avgRating':   'औसत रेटिंग',
    'insights.topCategories':'शीर्ष सहायता श्रेणियाँ',
    'insights.successStories':'हाल की सफलता की कहानियाँ',
    'insights.poweredBy':   'Gemini AI द्वारा संचालित',
    'insights.weeklyDigest':'AI साप्ताहिक सारांश',
    'common.loading':       'लोड हो रहा है...',
    'common.cancel':        'रद्द करें',
    'common.save':          'बदलाव सहेजें',
    'common.edit':          'संपादित करें',
    'common.back':          'वापस',
    'common.signOut':       'लॉग आउट',
    'common.viewProfile':   'प्रोफ़ाइल देखें',
    'common.inProgress':    'प्रगति में',
    'common.successRate':   '% सफलता दर',
    'common.from':          'से',
    'common.noneYet':       'अभी नहीं',
  },

  ml: {
    'nav.requestHelp':      'സഹായം അഭ്യർത്ഥിക്കുക',
    'nav.insights':         'ഉൾക്കാഴ്ചകൾ',
    'nav.conversations':    'സംഭാഷണങ്ങൾ',
    'nav.notifications':    'അറിയിപ്പുകൾ',
    'nav.myProfile':        'എന്റെ പ്രൊഫൈൽ',
    'request.needHelp':     'സഹായം ആവശ്യമാണ്',
    'request.helpOthers':   'മറ്റുള്ളവരെ സഹായിക്കുക',
    'request.requestTitle': 'അഭ്യർത്ഥന തലക്കെട്ട്',
    'request.category':     'വിഭാഗം',
    'request.urgency':      'അടിയന്തരാവസ്ഥ',
    'request.location':     'സ്ഥലം',
    'request.describe':     'നിങ്ങൾക്ക് എന്ത് വേണമെന്ന് വിവരിക്കുക',
    'request.submit':       'സഹായ അഭ്യർത്ഥന സമർപ്പിക്കുക',
    'request.pendingMatch': 'അഭ്യർത്ഥന പൊരുത്തം കാക്കുന്നു',
    'request.activeSessions':'സജീവ സഹായ സെഷനുകൾ',
    'request.noActiveSessions':'സജീവ സെഷനുകൾ ഇല്ല',
    'request.pendingRequests':'തീർപ്പാക്കാത്ത അഭ്യർത്ഥനകൾ',
    'request.acceptChat':   'സ്വീകരിക്കുക & ചാറ്റ്',
    'request.aiAnalyzing':  'AI വിശകലനം...',
    'request.enhanceAI':    '✨ AI ഉപയോഗിച്ച് മെച്ചപ്പെടുത്തുക',
    'messages.title':       'സംഭാഷണങ്ങൾ',
    'messages.subtitle':    'തീർപ്പാക്കാത്ത സഹായ അഭ്യർത്ഥനകൾ പരിഹരിക്കാൻ അയൽക്കാരുമായി ഏകോപിക്കുക.',
    'messages.selectChat':  'ഒരു സംഭാഷണം തിരഞ്ഞെടുക്കുക',
    'messages.selectChatDesc':'ലൈവ് ചാറ്റ് തുറക്കാൻ ഒരു സംഭാഷണം ക്ലിക്ക് ചെയ്യുക.',
    'messages.typeMessage': 'ഒരു സന്ദേശം ടൈപ്പ് ചെയ്യുക…',
    'messages.resolved':    'പരിഹരിച്ചു',
    'messages.resolve':     'പരിഹരിക്കുക',
    'messages.smartReply':  'സ്മാർട്ട് മറുപടി',
    'notifications.title':  'അറിയിപ്പുകൾ',
    'notifications.subtitle':'നിങ്ങളുടെ കഴിവുകൾ, സന്ദേശങ്ങൾ, ഫീഡ്‌ബാക്ക് ട്രാക്ക് ചെയ്യുക.',
    'notifications.empty':  'നിങ്ങൾ അപ്ഡേറ്റ് ആണ്!',
    'notifications.emptyDesc':'ഇതുവരെ അറിയിപ്പുകൾ ഇല്ല.',
    'notifications.markAllRead':'എല്ലാം വായിച്ചതായി അടയാളപ്പെടുത്തുക',
    'notifications.markRead':'വായിച്ചതായി അടയാളപ്പെടുത്തുക',
    'notifications.newMatch':'പുതിയ പൊരുത്തം',
    'notifications.acceptRequest':'അഭ്യർത്ഥന സ്വീകരിക്കുക',
    'notifications.openChat':'ചാറ്റ് തുറക്കുക',
    'notifications.reply':  'മറുപടി നൽകുക',
    'notifications.viewRatings':'റേറ്റിംഗ് കാണുക',
    'notifications.requestAgain':'വീണ്ടും അഭ്യർത്ഥിക്കുക',
    'profile.editProfile':  'പ്രൊഫൈൽ എഡിറ്റ് ചെയ്യുക',
    'profile.skills':       'കഴിവുകൾ & സഹായ വിഭാഗങ്ങൾ',
    'profile.helperRatings':'സഹായകന്റെ റേറ്റിംഗ്',
    'profile.pastRequests': 'കഴിഞ്ഞ സഹായ അഭ്യർത്ഥനകൾ',
    'profile.pastRequestsDesc':'നിങ്ങളുടെ അഭ്യർത്ഥനകളുടെ ചരിത്രം കാണുക.',
    'profile.joinedDate':   'ചേർന്നത്',
    'profile.reviews':      'അവലോകനങ്ങൾ',
    'profile.noSkills':     'ഇതുവരെ കഴിവുകൾ ചേർക്കിട്ടില്ല.',
    'insights.title':       'പ്ലാറ്റ്ഫോം ഉൾക്കാഴ്ചകൾ',
    'insights.subtitle':    'നിങ്ങളുടെ സമൂഹ സ്വാധീനത്തിന്റെ AI വിശകലനം',
    'insights.members':     'അംഗങ്ങൾ',
    'insights.resolved':    'പരിഹരിച്ചത്',
    'insights.activeNow':   'ഇപ്പോൾ സജീവം',
    'insights.avgRating':   'ശരാശരി റേറ്റിംഗ്',
    'insights.topCategories':'മുൻനിര സഹായ വിഭാഗങ്ങൾ',
    'insights.successStories':'സമീപകാല വിജയഗാഥകൾ',
    'insights.poweredBy':   'Gemini AI ഉപയോഗിച്ച് പ്രവർത്തിക്കുന്നു',
    'insights.weeklyDigest':'AI വാരാന്ത്യ സംഗ്രഹം',
    'common.loading':       'ലോഡ് ആകുന്നു...',
    'common.cancel':        'റദ്ദാക്കുക',
    'common.save':          'മാറ്റങ്ങൾ സേവ് ചെയ്യുക',
    'common.edit':          'എഡിറ്റ് ചെയ്യുക',
    'common.back':          'മടങ്ങുക',
    'common.signOut':       'ലോഗ് ഔട്ട്',
    'common.viewProfile':   'പ്രൊഫൈൽ കാണുക',
    'common.inProgress':    'പ്രക്രിയയിൽ',
    'common.successRate':   '% വിജയ നിരക്ക്',
    'common.from':          'ൽ നിന്ന്',
    'common.noneYet':       'ഇതുവരെ ഇല്ല',
  },

  te: {
    'nav.requestHelp':      'సహాయం కోరండి',
    'nav.insights':         'అంతర్దృష్టులు',
    'nav.conversations':    'సంభాషణలు',
    'nav.notifications':    'నోటిఫికేషన్లు',
    'nav.myProfile':        'నా ప్రొఫైల్',
    'request.needHelp':     'సహాయం కావాలి',
    'request.helpOthers':   'ఇతరులకు సహాయం చేయండి',
    'request.requestTitle': 'అభ్యర్థన శీర్షిక',
    'request.category':     'వర్గం',
    'request.urgency':      'అత్యవసరం',
    'request.location':     'స్థానం',
    'request.describe':     'మీకు ఏమి కావాలో వివరించండి',
    'request.submit':       'సహాయ అభ్యర్థన సమర్పించండి',
    'request.pendingMatch': 'అభ్యర్థన మ్యాచ్ నిరీక్షణలో',
    'request.activeSessions':'యాక్టివ్ సహాయ సెషన్లు',
    'request.noActiveSessions':'యాక్టివ్ సెషన్లు లేవు',
    'request.pendingRequests':'పెండింగ్ అభ్యర్థనలు',
    'request.acceptChat':   'అంగీకరించు & చాట్',
    'request.aiAnalyzing':  'AI విశ్లేషిస్తోంది...',
    'request.enhanceAI':    '✨ AI తో మెరుగుపరచండి',
    'messages.title':       'సంభాషణలు',
    'messages.subtitle':    'పెండింగ్ సహాయ అభ్యర్థనలను పరిష్కరించడానికి పొరుగువారితో సమన్వయం చేయండి.',
    'messages.selectChat':  'సంభాషణను ఎంచుకోండి',
    'messages.selectChatDesc':'లైవ్ చాట్ తెరవడానికి సంభాషణపై క్లిక్ చేయండి.',
    'messages.typeMessage': 'సందేశం టైప్ చేయండి…',
    'messages.resolved':    'పరిష్కరించబడింది',
    'messages.resolve':     'పరిష్కరించు',
    'messages.smartReply':  'స్మార్ట్ రిప్లై',
    'notifications.title':  'నోటిఫికేషన్లు',
    'notifications.subtitle':'మీ నైపుణ్యాలు, సందేశాలు మరియు అభిప్రాయాలను ట్రాక్ చేయండి.',
    'notifications.empty':  'మీరు అప్‌డేట్‌గా ఉన్నారు!',
    'notifications.emptyDesc':'ఇంకా నోటిఫికేషన్లు లేవు.',
    'notifications.markAllRead':'అన్నీ చదివినట్టు గుర్తించండి',
    'notifications.markRead':'చదివినట్టు గుర్తించండి',
    'notifications.newMatch':'కొత్త మ్యాచ్',
    'notifications.acceptRequest':'అభ్యర్థన అంగీకరించండి',
    'notifications.openChat':'చాట్ తెరవండి',
    'notifications.reply':  'జవాబు ఇవ్వండి',
    'notifications.viewRatings':'రేటింగ్లు చూడండి',
    'notifications.requestAgain':'మళ్ళీ అభ్యర్థించండి',
    'profile.editProfile':  'ప్రొఫైల్ సవరించు',
    'profile.skills':       'నైపుణ్యాలు & సహాయ వర్గాలు',
    'profile.helperRatings':'హెల్పర్ రేటింగ్లు',
    'profile.pastRequests': 'గత సహాయ అభ్యర్థనలు',
    'profile.pastRequestsDesc':'మీ అభ్యర్థనల చరిత్రను చూడండి.',
    'profile.joinedDate':   'చేరిన తేదీ',
    'profile.reviews':      'సమీక్షలు',
    'profile.noSkills':     'ఇంకా నైపుణ్యాలు జోడించలేదు.',
    'insights.title':       'ప్లాట్‌ఫారమ్ అంతర్దృష్టులు',
    'insights.subtitle':    'మీ సమాజ ప్రభావం యొక్క AI-ఆధారిత విశ్లేషణ',
    'insights.members':     'సభ్యులు',
    'insights.resolved':    'పరిష్కరించబడింది',
    'insights.activeNow':   'ఇప్పుడు యాక్టివ్',
    'insights.avgRating':   'సగటు రేటింగ్',
    'insights.topCategories':'టాప్ సహాయ వర్గాలు',
    'insights.successStories':'ఇటీవలి విజయ గాథలు',
    'insights.poweredBy':   'Gemini AI ద్వారా నడపబడుతోంది',
    'insights.weeklyDigest':'AI వారపు సారాంశం',
    'common.loading':       'లోడ్ అవుతోంది...',
    'common.cancel':        'రద్దు చేయండి',
    'common.save':          'మార్పులు సేవ్ చేయండి',
    'common.edit':          'సవరించు',
    'common.back':          'వెనుకకు',
    'common.signOut':       'లాగ్ అవుట్',
    'common.viewProfile':   'ప్రొఫైల్ చూడండి',
    'common.inProgress':    'ప్రక్రియలో ఉంది',
    'common.successRate':   '% విజయ రేటు',
    'common.from':          'నుండి',
    'common.noneYet':       'ఇంకా లేదు',
  },
};

export function t(lang: Language, key: TranslationKey): string {
  return translations[lang]?.[key] ?? translations['en'][key] ?? key;
}
