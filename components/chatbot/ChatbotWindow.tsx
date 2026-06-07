'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { InteractiveMap } from '../ui/InteractiveMap';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { toast } from '@/components/ui/toast';
import { SKILL_CATEGORIES, SKILL_COLORS } from '@/lib/constants';
import {
  Send,
  Bot,
  User,
  Sparkles,
  MapPin,
  Star,
  MessageSquare,
  Loader2,
  Map as MapIcon,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatbotWindowProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    location: string;
    avatarUrl?: string;
    avatarColor: string;
  };
}

interface MessageItem {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: Date;
  helpers?: any[];
  requests?: any[];
  parsedCategory?: string;
  parsedLocation?: string;
  isSearchingForNeeds?: boolean;
}

// Common city coordinates for instant speed
const CITY_COORDINATES: Record<string, [number, number]> = {
  chennai: [13.0827, 80.2707],
  brooklyn: [40.7128, -74.0060],
  'new york': [40.7128, -74.0060],
  ny: [40.7128, -74.0060],
  nyc: [40.7128, -74.0060],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  mumbai: [19.0760, 72.8777],
  delhi: [28.7041, 77.1025],
  sf: [37.7749, -122.4194],
  'san francisco': [37.7749, -122.4194],
  london: [51.5074, -0.1278],
};

// Custom keyword aliases mapping to formal skill categories
const ALIAS_MAP: Record<string, string> = {
  code: 'Web Dev', coding: 'Web Dev', developer: 'Web Dev', website: 'Web Dev', software: 'Web Dev',
  design: 'Design', logo: 'Design', art: 'Design', graphics: 'Design', poster: 'Design',
  plumber: 'Plumbing', leak: 'Plumbing', pipe: 'Plumbing', faucet: 'Plumbing', sink: 'Plumbing', plumbing: 'Plumbing',
  wire: 'Electrician', electricity: 'Electrician', power: 'Electrician', electric: 'Electrician', light: 'Electrician', fuse: 'Electrician',
  teach: 'Teaching', tutor: 'Teaching', learn: 'Teaching', study: 'Teaching', math: 'Teaching', class: 'Teaching',
  doctor: 'Medical', nurse: 'Medical', sick: 'Medical', health: 'Medical', medicine: 'Medical', clinic: 'Medical',
  lawyer: 'Legal', attorney: 'Legal', contract: 'Legal', court: 'Legal',
  cook: 'Cooking', food: 'Cooking', bake: 'Cooking', meal: 'Cooking', recipe: 'Cooking', kitchen: 'Cooking',
  carpenter: 'Carpentry', wood: 'Carpentry', furniture: 'Carpentry', chair: 'Carpentry', table: 'Carpentry',
  therapy: 'Mental Health', counsel: 'Mental Health', anxiety: 'Mental Health', depress: 'Mental Health', stress: 'Mental Health',
  music: 'Music', sing: 'Music', piano: 'Music', guitar: 'Music', instrument: 'Music',
  finance: 'Finance', tax: 'Finance', money: 'Finance', accounting: 'Finance', budget: 'Finance', investment: 'Finance',
  translate: 'Language Translation', language: 'Language Translation', english: 'Language Translation', spanish: 'Language Translation', translation: 'Language Translation',
};

export function ChatbotWindow({ currentUser }: ChatbotWindowProps) {
  const router = useRouter();
  const [messages, setMessages] = React.useState<MessageItem[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Hello ${currentUser.name}! I am your HelpNet Assistant. 🤖\n\n- **If you need help**: Ask for what you need (e.g., "I need a plumber in Chennai" or "Looking for Web Dev help near Brooklyn").\n- **If you want to help**: Ask for people who need help (e.g., "Who needs a plumber in Chennai?" or "Find web dev requests near Brooklyn").`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);

  // Map state
  const [mapCenter, setMapCenter] = React.useState<[number, number]>(CITY_COORDINATES.chennai);
  const [mapMarkers, setMapMarkers] = React.useState<any[]>([]);
  const [activeHelpers, setActiveHelpers] = React.useState<any[]>([]);
  const [activeRequests, setActiveRequests] = React.useState<any[]>([]);
  
  // Mobile UI tab toggle: 'chat' or 'map'
  const [activeMobileView, setActiveMobileView] = React.useState<'chat' | 'map'>('chat');

  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Automatically scroll to bottom of chat
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Center map on user location at start
  React.useEffect(() => {
    async function centerOnUserLocation() {
      const coords = await getCoordsForLocationName(currentUser.location);
      setMapCenter(coords);
    }
    centerOnUserLocation();
  }, [currentUser.location]);

  // Locate coordinates of a location term
  async function getCoordsForLocationName(locName: string): Promise<[number, number]> {
    const normalized = locName.toLowerCase().trim();
    
    // Check static cache
    for (const key of Object.keys(CITY_COORDINATES)) {
      if (normalized.includes(key)) {
        return CITY_COORDINATES[key];
      }
    }

    // Fallback to OSM Nominatim API
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locName)}&limit=1`
      );
      const data = await res.json();
      if (data && data[0]) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (e) {
      console.warn('Geocoding search failed, using default coordinate');
    }

    return CITY_COORDINATES.chennai;
  }

  // Parse skill category and location terms from message
  const parseQuery = (text: string) => {
    const lowerText = text.toLowerCase();
    
    // 1. Identify category match
    let matchedCategory = '';
    
    // Try exact categories first
    for (const category of SKILL_CATEGORIES) {
      const regex = new RegExp(`\\b${category.toLowerCase()}\\b`, 'i');
      if (regex.test(lowerText)) {
        matchedCategory = category;
        break;
      }
    }

    // Try aliases if no category matched yet
    if (!matchedCategory) {
      for (const alias of Object.keys(ALIAS_MAP)) {
        if (lowerText.includes(alias)) {
          matchedCategory = ALIAS_MAP[alias];
          break;
        }
      }
    }

    // 2. Identify location match (look for "in [Location]" or "near [Location]")
    let matchedLocation = '';
    const locRegex = /(?:in|near|at|around)\s+([a-zA-Z\s]+?)(?:\.|\?|,|and|$)/i;
    const match = text.match(locRegex);
    if (match && match[1]) {
      matchedLocation = match[1].trim();
    } else {
      // If no location mentioned, fallback to user's registered location
      matchedLocation = currentUser.location;
    }

    // Check if searching for requests (people in need) instead of helpers
    const isSearchingForNeeds = 
      lowerText.includes('need') || 
      lowerText.includes('request') || 
      lowerText.includes('who needs') || 
      lowerText.includes('find people') || 
      lowerText.includes('task') || 
      lowerText.includes('jobs') || 
      lowerText.includes('work') ||
      lowerText.includes('seeker') ||
      lowerText.includes('seek');

    return { category: matchedCategory, location: matchedLocation, isSearchingForNeeds };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userQuery = inputValue;
    setInputValue('');

    // Append user query to chat feed
    const userMsg: MessageItem = {
      id: Math.random().toString(),
      sender: 'user',
      text: userQuery,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    const { category, location, isSearchingForNeeds } = parseQuery(userQuery);

    // Simulated delay for conversational feel
    setTimeout(async () => {
      try {
        if (!category) {
          if (location) {
            if (isSearchingForNeeds) {
              // Fetch all pending requests in location
              const url = `/api/requests?role=helper&status=pending&location=${encodeURIComponent(location)}`;
              const res = await fetch(url);
              const result = await res.json();

              let requests: any[] = [];
              if (result.success) {
                requests = result.data || [];
              }

              const centerCoords = await getCoordsForLocationName(location);
              setMapCenter(centerCoords);

              // Generate markers
              const markers = requests.map((req: any, idx: number) => {
                const angle = (idx / requests.length) * 2 * Math.PI;
                const radius = 0.015 + Math.random() * 0.01;
                const lat = centerCoords[0] + Math.sin(angle) * radius;
                const lng = centerCoords[1] + Math.cos(angle) * radius;

                return {
                  lat,
                  lng,
                  title: req.title,
                  body: req.description || 'Someone needs help nearby.',
                  name: req.seeker?.name || 'Neighbor',
                  skills: [req.category],
                  avatarColor: req.seeker?.avatarColor || '#6366F1',
                  avatarUrl: req.seeker?.avatarUrl,
                  requestId: req._id,
                };
              });

              setMapMarkers(markers);
              setActiveRequests(requests);
              setActiveHelpers([]); // clear helpers listing

              let botText = '';
              if (requests.length > 0) {
                botText = `I found **${requests.length} pending help request(s)** in **${location}**! 🤝\n\nYou can click on their markers on the map to see details, or accept requests directly from the list below to start helping!`;
                if (window.innerWidth < 768) {
                  setActiveMobileView('map');
                }
              } else {
                botText = `I couldn't find any pending help requests in **${location}** right now. 😔\n\nTry checking a broader area or looking up a different location!`;
                setMapMarkers([]);
                setActiveRequests([]);
              }

              const botMsg: MessageItem = {
                id: Math.random().toString(),
                sender: 'bot',
                text: botText,
                timestamp: new Date(),
                requests,
                parsedLocation: location,
                isSearchingForNeeds: true,
              };
              setMessages((prev) => [...prev, botMsg]);
              setIsTyping(false);
              return;
            } else {
              // Fetch all helpers in location
              const res = await fetch(`/api/users?location=${encodeURIComponent(location)}`);
              const result = await res.json();

              let helpers: any[] = [];
              if (result.success) {
                helpers = (result.data || []).filter((h: any) => h._id !== currentUser.id);
              }

              const centerCoords = await getCoordsForLocationName(location);
              setMapCenter(centerCoords);

              // Generate markers
              const markers = helpers.map((helper: any, idx: number) => {
                const angle = (idx / helpers.length) * 2 * Math.PI;
                const radius = 0.015 + Math.random() * 0.01;
                const lat = centerCoords[0] + Math.sin(angle) * radius;
                const lng = centerCoords[1] + Math.cos(angle) * radius;

                return {
                  lat,
                  lng,
                  title: helper.name,
                  body: helper.bio || 'Community helper ready to assist.',
                  name: helper.name,
                  skills: helper.skills,
                  avatarColor: helper.avatarColor,
                  avatarUrl: helper.avatarUrl,
                  helperId: helper._id,
                };
              });

              setMapMarkers(markers);
              setActiveHelpers(helpers);
              setActiveRequests([]); // clear requests

              let botText = '';
              if (helpers.length > 0) {
                botText = `I found **${helpers.length} helper(s)** in **${location}**! 🎉\n\nYou can click on their markers on the map to see their details, or start a direct conversation using the profile card list below.`;
                if (window.innerWidth < 768) {
                  setActiveMobileView('map');
                }
              } else {
                botText = `I couldn't find any helpers in **${location}** right now. 😔\n\nTry checking a broader area or looking up a different location!`;
                setMapMarkers([]);
                setActiveHelpers([]);
              }

              const botMsg: MessageItem = {
                id: Math.random().toString(),
                sender: 'bot',
                text: botText,
                timestamp: new Date(),
                helpers: helpers.map((h: any, i: number) => ({ ...h, marker: markers[i] })),
                parsedLocation: location,
                isSearchingForNeeds: false,
              };
              setMessages((prev) => [...prev, botMsg]);
              setIsTyping(false);
              return;
            }
          } else {
            // Unrecognized category and no location handler
            const botMsg: MessageItem = {
              id: Math.random().toString(),
              sender: 'bot',
              text: `I'm not sure which help category or location you're looking for. 🔍\n\nCould you specify if you need assistance with one of our main areas (e.g. **Plumbing**, **Web Dev**, **Design**, **Teaching**, etc.) or a specific city?`,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, botMsg]);
            setIsTyping(false);
            return;
          }
        }

        if (isSearchingForNeeds) {
          // Helper searching for people who need help (Pending requests)
          const url = `/api/requests?role=helper&status=pending&category=${encodeURIComponent(category)}${
            location ? `&location=${encodeURIComponent(location)}` : ''
          }`;
          const res = await fetch(url);
          const result = await res.json();
          
          let requests: any[] = [];
          if (result.success) {
            requests = result.data || [];
          }

          const centerCoords = await getCoordsForLocationName(location || currentUser.location);
          setMapCenter(centerCoords);

          // Generate markers for requests with dispersion
          const markers = requests.map((req: any, idx: number) => {
            const angle = (idx / requests.length) * 2 * Math.PI;
            const radius = 0.015 + Math.random() * 0.01;
            const lat = centerCoords[0] + Math.sin(angle) * radius;
            const lng = centerCoords[1] + Math.cos(angle) * radius;

            return {
              lat,
              lng,
              title: req.title,
              body: req.description || 'Someone needs help nearby.',
              name: req.seeker?.name || 'Neighbor',
              skills: [req.category],
              avatarColor: req.seeker?.avatarColor || '#6366F1',
              avatarUrl: req.seeker?.avatarUrl,
              requestId: req._id,
            };
          });

          setMapMarkers(markers);
          setActiveRequests(requests);
          setActiveHelpers([]); // clear helpers listing

          let botText = '';
          if (requests.length > 0) {
            botText = `I found **${requests.length} pending help request(s)** for **${category}** in **${location}**! 🤝\n\nYou can click on their markers on the map to see details, or accept requests directly from the list below to start helping!`;
            if (window.innerWidth < 768) {
              setActiveMobileView('map');
            }
          } else {
            botText = `I couldn't find any pending help requests for **${category}** in **${location}** right now. 😔\n\nTry checking a broader area or looking up a different category!`;
            setMapMarkers([]);
            setActiveRequests([]);
          }

          const botMsg: MessageItem = {
            id: Math.random().toString(),
            sender: 'bot',
            text: botText,
            timestamp: new Date(),
            requests,
            parsedCategory: category,
            parsedLocation: location,
            isSearchingForNeeds: true,
          };
          setMessages((prev) => [...prev, botMsg]);
        } else {
          // Seeker searching for helpers
          const res = await fetch(`/api/users?skill=${encodeURIComponent(category)}`);
          const result = await res.json();
          
          let helpers: any[] = [];
          if (result.success) {
            helpers = (result.data || []).filter((h: any) => h._id !== currentUser.id);
          }

          // Filter by location if specified
          let locationFiltered: any[] = helpers;
          if (location) {
            locationFiltered = helpers.filter((h: any) =>
              h.location.toLowerCase().includes(location.toLowerCase())
            );
          }

          const centerCoords = await getCoordsForLocationName(location || currentUser.location);
          setMapCenter(centerCoords);

          // Generate markers with coordinate dispersion
          const markers = locationFiltered.map((helper: any, idx: number) => {
            const angle = (idx / locationFiltered.length) * 2 * Math.PI;
            const radius = 0.015 + Math.random() * 0.01;
            const lat = centerCoords[0] + Math.sin(angle) * radius;
            const lng = centerCoords[1] + Math.cos(angle) * radius;

            return {
              lat,
              lng,
              title: helper.name,
              body: helper.bio || 'Community helper ready to assist.',
              name: helper.name,
              skills: helper.skills,
              avatarColor: helper.avatarColor,
              avatarUrl: helper.avatarUrl,
              helperId: helper._id,
            };
          });

          setMapMarkers(markers);
          setActiveHelpers(locationFiltered);
          setActiveRequests([]); // clear requests listing

          let botText = '';
          if (locationFiltered.length > 0) {
            botText = `I found **${locationFiltered.length} helper(s)** for **${category}** in **${location}**! 🎉\n\nYou can click on their markers on the map to see their details, or start a direct conversation using the profile card list below.`;
            if (window.innerWidth < 768) {
              setActiveMobileView('map');
            }
          } else {
            botText = `I couldn't find any helpers for **${category}** in **${location}** right now. 😔\n\nTry checking a broader area or looking up a different skill category!`;
            setMapMarkers([]);
            setActiveHelpers([]);
          }

          const botMsg: MessageItem = {
            id: Math.random().toString(),
            sender: 'bot',
            text: botText,
            timestamp: new Date(),
            helpers: locationFiltered.map((h: any, i: number) => ({ ...h, marker: markers[i] })),
            parsedCategory: category,
            parsedLocation: location,
            isSearchingForNeeds: false,
          };
          setMessages((prev) => [...prev, botMsg]);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to parse search query.');
      } finally {
        setIsTyping(false);
      }
    }, 1200);
  };

  const handleStartDirectChat = async (helperId: string, category: string) => {
    try {
      const res = await fetch('/api/chats/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ helperId, category }),
      });
      const result = await res.json();
      if (result.success && result.chatId) {
        toast.success('Chat initiated!');
        router.push(`/messages/${result.chatId}`);
      } else {
        toast.error(result.error || 'Failed to start chat');
      }
    } catch (e) {
      console.error(e);
      toast.error('An error occurred.');
    }
  };

  const handleAcceptRequestFromChatbot = async (requestId: string) => {
    try {
      const res = await fetch(`/api/requests/${requestId}/accept`, {
        method: 'POST',
      });
      const result = await res.json();
      if (result.success) {
        toast.success('You accepted this request!', {
          description: 'Live chat channel is now open.',
        });
        router.push(`/messages/${result.data.chat._id}`);
      } else {
        toast.error(result.error || 'Failed to accept request');
      }
    } catch (e) {
      console.error(e);
      toast.error('Could not accept request.');
    }
  };

  // Render initials avatar if no photo url
  const renderInitials = (name: string) => {
    return name
      .trim()
      .split(/\s+/)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] flex flex-col space-y-4 text-left">
      {/* Title Header */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-border shadow-sm shrink-0">
        <div>
          <h1 className="text-xl font-display font-semibold text-gray-900 flex items-center gap-2">
            <Bot className="h-5.5 w-5.5 text-primary" />
            Help Assistant
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Describe what you need, and find neighbors with matching skills.
          </p>
        </div>

        {/* Mobile View Toggle Button */}
        <div className="flex md:hidden border border-border rounded-md overflow-hidden shrink-0">
          <button
            onClick={() => setActiveMobileView('chat')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-all',
              activeMobileView === 'chat' ? 'bg-primary text-white' : 'bg-white text-gray-500'
            )}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Chat
          </button>
          <button
            onClick={() => setActiveMobileView('map')}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-all',
              activeMobileView === 'map' ? 'bg-primary text-white' : 'bg-white text-gray-500'
            )}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Map
          </button>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="flex-1 flex gap-4 overflow-hidden relative">
        {/* Panel 1: Chat Stream */}
        <div
          className={cn(
            'flex-1 flex flex-col bg-white rounded-lg border border-border overflow-hidden h-full shadow-sm',
            activeMobileView === 'chat' ? 'flex' : 'hidden md:flex'
          )}
        >
          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              return (
                <div key={msg.id} className="space-y-3">
                  {/* Chat bubble row */}
                  <div
                    className={cn(
                      'flex items-start gap-2.5 max-w-[85%]',
                      isBot ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'
                    )}
                  >
                    {/* Avatar icon */}
                    <div
                      style={{ backgroundColor: isBot ? undefined : currentUser.avatarColor }}
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm text-xs font-bold text-white',
                        isBot ? 'bg-primary-light text-primary border border-primary/10' : ''
                      )}
                    >
                      {isBot ? <Bot className="h-4.5 w-4.5" /> : renderInitials(currentUser.name)}
                    </div>

                    {/* Speech bubble */}
                    <div
                      className={cn(
                        'p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-line',
                        isBot
                          ? 'bg-white text-gray-800 rounded-tl-none border border-border'
                          : 'bg-primary text-white rounded-tr-none'
                      )}
                    >
                      {msg.text}
                    </div>
                  </div>

                  {/* Matching helpers card widget embedded in chatbot speech */}
                  {isBot && msg.helpers && msg.helpers.length > 0 && (
                    <div className="pl-10 space-y-2.5 max-w-[95%]">
                      <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        Matched Helpers Near {msg.parsedLocation || 'You'}:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {msg.helpers.map((helper) => (
                          <div
                            key={helper._id}
                            className="bg-white border border-border rounded-lg p-3 shadow-sm flex flex-col justify-between"
                          >
                            <div className="flex items-start gap-2.5">
                              <Avatar
                                src={helper.avatarUrl}
                                name={helper.name}
                                color={helper.avatarColor}
                                size="sm"
                              />
                              <div className="truncate text-left">
                                <h5 className="text-xs font-bold text-gray-800 truncate">
                                  {helper.name}
                                </h5>
                                <p className="text-[10px] text-gray-400 flex items-center gap-0.5 mt-0.5">
                                  <MapPin className="h-2.5 w-2.5" />
                                  {helper.location}
                                </p>
                              </div>
                            </div>
                            
                            {helper.bio && (
                              <p className="text-[10px] text-gray-500 italic line-clamp-2 mt-2 leading-relaxed bg-gray-50 p-1.5 rounded">
                                &ldquo;{helper.bio}&rdquo;
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                              <div className="flex items-center text-[10px] font-bold text-amber-500">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400 mr-0.5 shrink-0" />
                                {helper.avgRating ? helper.avgRating.toFixed(1) : '0.0'}
                              </div>

                              <button
                                onClick={() => handleStartDirectChat(helper._id, msg.parsedCategory || 'Other')}
                                className="text-[10px] font-bold text-primary hover:text-primary-hover flex items-center gap-1"
                              >
                                <MessageSquare className="h-3 w-3" />
                                Chat Now
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matching requests card widget embedded in chatbot speech */}
                  {isBot && msg.requests && msg.requests.length > 0 && (
                    <div className="pl-10 space-y-2.5 max-w-[95%]">
                      <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        Help Requests Near {msg.parsedLocation || 'You'}:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {msg.requests.map((request) => (
                          <div
                            key={request._id}
                            className="bg-white border border-border rounded-lg p-3 shadow-sm flex flex-col justify-between text-left"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[9px] font-bold border rounded-sm px-1.5 py-0.5 capitalize ${SKILL_COLORS[request.category] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                  {request.category}
                                </span>
                                <span className="text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-100 rounded-sm px-1.5 py-0.5 capitalize">
                                  {request.urgency}
                                </span>
                              </div>
                              <h5 className="text-xs font-bold text-gray-800 line-clamp-1">
                                {request.title}
                              </h5>
                              <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">
                                {request.description}
                              </p>
                              <div className="flex items-center gap-1 text-[9px] text-gray-400">
                                <MapPin className="h-2.5 w-2.5" />
                                {request.location}
                              </div>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                              <span className="text-[10px] text-gray-500 font-medium">
                                Seeker: {request.seeker?.name || 'Neighbor'}
                              </span>

                              <button
                                onClick={() => handleAcceptRequestFromChatbot(request._id)}
                                className="text-[10px] font-bold text-primary hover:text-primary-hover flex items-center gap-1"
                              >
                                <MessageCircle className="h-3.5 w-3.5" />
                                Accept
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Simulated typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2.5 mr-auto">
                <div className="w-8 h-8 rounded-full bg-primary-light text-primary flex items-center justify-center shrink-0 border border-primary/10">
                  <Bot className="h-4.5 w-4.5" />
                </div>
                <div className="bg-white border border-border p-3.5 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* User input box */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-border bg-white flex gap-2">
            <input
              type="text"
              placeholder="e.g. Need web developer in chennai..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isTyping}
              className="flex-1 border border-border rounded-md px-3.5 text-sm focus:outline-none focus:border-primary disabled:bg-gray-50"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="w-10 h-10 bg-primary hover:bg-primary-hover text-white rounded-md shrink-0 flex items-center justify-center shadow-md focus:outline-none"
            >
              <Send className="h-4.5 w-4.5" />
            </Button>
          </form>
        </div>

        {/* Panel 2: Interactive Map Panel */}
        <div
          className={cn(
            'w-full md:w-[380px] lg:w-[460px] flex flex-col space-y-3 h-full shrink-0 relative z-20',
            activeMobileView === 'map' ? 'flex' : 'hidden md:flex'
          )}
        >
          {/* Leaflet Map Frame */}
          <div className="flex-1 bg-white rounded-lg border border-border shadow-sm overflow-hidden relative min-h-[300px]">
            <InteractiveMap center={mapCenter} zoom={13} markers={mapMarkers} />
          </div>

          {/* Quick List overlay for matching helpers or requests */}
          {(activeHelpers.length > 0 || activeRequests.length > 0) && (
            <div className="bg-white p-3 rounded-lg border border-border shadow-sm max-h-[180px] overflow-y-auto space-y-2">
              <h4 className="text-[10px] uppercase font-extrabold text-gray-400 tracking-wider">
                List View ({activeHelpers.length || activeRequests.length})
              </h4>
              <div className="space-y-1.5">
                {activeHelpers.length > 0 ? (
                  activeHelpers.map((helper) => (
                    <div
                      key={helper._id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-100"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Avatar
                          src={helper.avatarUrl}
                          name={helper.name}
                          color={helper.avatarColor}
                          size="sm"
                        />
                        <div className="truncate text-left">
                          <span className="text-xs font-bold text-gray-800 block truncate">
                            {helper.name}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            {helper.location}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleStartDirectChat(helper._id, 'Other')}
                        className="text-[9px] font-extrabold text-primary hover:underline shrink-0"
                      >
                        Message
                      </button>
                    </div>
                  ))
                ) : (
                  activeRequests.map((request) => (
                    <div
                      key={request._id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-100"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Avatar
                          src={request.seeker?.avatarUrl}
                          name={request.seeker?.name || 'Neighbor'}
                          color={request.seeker?.avatarColor || '#6366F1'}
                          size="sm"
                        />
                        <div className="truncate text-left">
                          <span className="text-xs font-bold text-gray-800 block truncate">
                            {request.title}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            Seeker: {request.seeker?.name || 'Neighbor'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAcceptRequestFromChatbot(request._id)}
                        className="text-[9px] font-extrabold text-primary hover:underline shrink-0"
                      >
                        Accept
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
