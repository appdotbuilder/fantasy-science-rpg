
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import type { 
  User, 
  Character, 
  Realm, 
  Item, 
  Inventory, 
  MarketListing, 
  ChatMessage,
  CreateUserInput,
  CreateCharacterInput,
  LoginInput,
  StartAfkInput,
  CreateMarketListingInput
} from '../../server/src/schema';

interface GameState {
  user: User | null;
  selectedCharacter: Character | null;
  characters: Character[];
  realms: Realm[];
  items: Item[];
  inventory: Inventory[];
  marketListings: MarketListing[];
  chatMessages: ChatMessage[];
}

// Default data for when backend is not available
const defaultRealms: Realm[] = [
  {
    id: 1,
    name: 'earth',
    display_name: 'Earth Realm',
    required_level: 1,
    required_boss_defeated: null,
    description: 'The starting realm where all adventurers begin their cosmic journey. Rich with basic resources and creatures.',
    created_at: new Date()
  },
  {
    id: 2,
    name: 'moon',
    display_name: 'Lunar Colony',
    required_level: 15,
    required_boss_defeated: 'Earth Dragon',
    description: 'A mysterious lunar outpost with low gravity and rare minerals. Defeat the Earth Dragon to gain access.',
    created_at: new Date()
  },
  {
    id: 3,
    name: 'mars',
    display_name: 'Mars Station',
    required_level: 30,
    required_boss_defeated: 'Lunar Guardian',
    description: 'The red planet holds the most valuable resources and dangerous creatures. Only the strongest survive here.',
    created_at: new Date()
  }
];

const defaultItems: Item[] = [
  {
    id: 1,
    name: 'Iron Sword',
    description: 'A sturdy iron blade forged on Earth',
    type: 'weapon',
    rarity: 'common',
    equipment_slot: 'weapon',
    attack_bonus: 10,
    defense_bonus: null,
    health_bonus: null,
    required_level: 1,
    market_value: 100,
    created_at: new Date()
  },
  {
    id: 2,
    name: 'Lunar Crystal',
    description: 'A glowing crystal from the moon',
    type: 'material',
    rarity: 'rare',
    equipment_slot: null,
    attack_bonus: null,
    defense_bonus: null,
    health_bonus: null,
    required_level: 15,
    market_value: 500,
    created_at: new Date()
  },
  {
    id: 3,
    name: 'Martian Armor',
    description: 'Advanced armor from Mars technology',
    type: 'armor',
    rarity: 'epic',
    equipment_slot: 'chest',
    attack_bonus: null,
    defense_bonus: 25,
    health_bonus: 50,
    required_level: 30,
    market_value: 2000,
    created_at: new Date()
  }
];

const defaultChatMessages: ChatMessage[] = [
  {
    id: 1,
    user_id: 1,
    username: 'CosmicExplorer',
    message: 'Welcome to Cosmic Realms! 🚀',
    created_at: new Date(Date.now() - 300000)
  },
  {
    id: 2,
    user_id: 2,
    username: 'SpaceWarrior',
    message: 'Anyone want to trade some lunar crystals?',
    created_at: new Date(Date.now() - 180000)
  },
  {
    id: 3,
    user_id: 3,
    username: 'MarsAdventurer',
    message: 'Just defeated the Earth Dragon! Mars here I come! 🔥',
    created_at: new Date(Date.now() - 60000)
  }
];

function App() {
  const [gameState, setGameState] = useState<GameState>({
    user: null,
    selectedCharacter: null,
    characters: [],
    realms: [],
    items: [],
    inventory: [],
    marketListings: [],
    chatMessages: []
  });

  const [activeTab, setActiveTab] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [backendAvailable, setBackendAvailable] = useState(true);

  // Auth forms
  const [loginForm, setLoginForm] = useState<LoginInput>({
    email: '',
    password: ''
  });

  const [registerForm, setRegisterForm] = useState<CreateUserInput>({
    username: '',
    email: '',
    password: '',
    membership_type: 'free'
  });

  const [newCharacterForm, setNewCharacterForm] = useState<CreateCharacterInput>({
    user_id: 0,
    name: ''
  });

  const [afkForm, setAfkForm] = useState<StartAfkInput>({
    character_id: 0,
    duration_hours: 1
  });

  const [marketForm, setMarketForm] = useState<CreateMarketListingInput>({
    seller_id: 0,
    item_id: 1,
    quantity: 1,
    price_per_unit: 1
  });

  // Load initial game data
  const loadGameData = useCallback(async () => {
    try {
      const [realms, items, marketListings, chatMessages] = await Promise.all([
        trpc.getRealms.query(),
        trpc.getItems.query(),
        trpc.getMarketListings.query(),
        trpc.getChatMessages.query({ limit: 50 })
      ]);

      setGameState((prev: GameState) => ({
        ...prev,
        realms,
        items,
        marketListings,
        chatMessages
      }));
      setBackendAvailable(true);
    } catch (error) {
      console.error('Backend not available, using default data:', error);
      setBackendAvailable(false);
      setGameState((prev: GameState) => ({
        ...prev,
        realms: defaultRealms,
        items: defaultItems,
        marketListings: [],
        chatMessages: defaultChatMessages
      }));
    }
  }, []);

  useEffect(() => {
    loadGameData();
  }, [loadGameData]);

  // Auth handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (backendAvailable) {
        const user = await trpc.loginUser.mutate(loginForm);
        if (user) {
          setGameState((prev: GameState) => ({ ...prev, user }));
          const characters = await trpc.getUserCharacters.query({ userId: user.id });
          setGameState((prev: GameState) => ({ ...prev, characters }));
          setActiveTab('dashboard');
        }
      } else {
        const demoUser: User = {
          id: 1,
          username: 'DemoPlayer',
          email: loginForm.email,
          password_hash: 'hashed_password',
          membership_type: 'free',
          created_at: new Date(),
          updated_at: new Date()
        };
        
        setGameState((prev: GameState) => ({ ...prev, user: demoUser }));
        setActiveTab('dashboard');
        
        const demoCharacter: Character = {
          id: 1,
          user_id: demoUser.id,
          name: 'StarterHero',
          level: 5,
          experience: 1250,
          health: 80,
          max_health: 100,
          attack: 15,
          defense: 10,
          current_realm: 'earth',
          is_afk: false,
          afk_start_time: null,
          afk_end_time: null,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        setGameState((prev: GameState) => ({ 
          ...prev, 
          characters: [demoCharacter],
          selectedCharacter: demoCharacter
        }));
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (backendAvailable) {
        const user = await trpc.createUser.mutate(registerForm);
        if (user) {
          setGameState((prev: GameState) => ({ ...prev, user }));
          setActiveTab('dashboard');
        }
      } else {
        const demoUser: User = {
          id: Date.now(),
          username: registerForm.username,
          email: registerForm.email,
          password_hash: 'hashed_password',
          membership_type: registerForm.membership_type || 'free',
          created_at: new Date(),
          updated_at: new Date()
        };
        
        setGameState((prev: GameState) => ({ ...prev, user: demoUser }));
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCharacter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameState.user) return;
    
    setIsLoading(true);
    try {
      if (backendAvailable) {
        const characterData = { ...newCharacterForm, user_id: gameState.user.id };
        const character = await trpc.createCharacter.mutate(characterData);
        if (character) {
          setGameState((prev: GameState) => ({
            ...prev,
            characters: [...prev.characters, character]
          }));
          setNewCharacterForm({ user_id: gameState.user.id, name: '' });
        }
      } else {
        const newCharacter: Character = {
          id: Date.now(),
          user_id: gameState.user.id,
          name: newCharacterForm.name,
          level: 1,
          experience: 0,
          health: 100,
          max_health: 100,
          attack: 10,
          defense: 5,
          current_realm: 'earth',
          is_afk: false,
          afk_start_time: null,
          afk_end_time: null,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        setGameState((prev: GameState) => ({
          ...prev,
          characters: [...prev.characters, newCharacter]
        }));
        setNewCharacterForm({ user_id: gameState.user.id, name: '' });
      }
    } catch (error) {
      console.error('Character creation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectCharacter = async (character: Character) => {
    setGameState((prev: GameState) => ({ ...prev, selectedCharacter: character }));
    
    try {
      if (backendAvailable) {
        const inventory = await trpc.getCharacterInventory.query({ characterId: character.id });
        setGameState((prev: GameState) => ({ ...prev, inventory }));
      } else {
        const demoInventory: Inventory[] = [
          {
            id: 1,
            character_id: character.id,
            item_id: 1,
            quantity: 1,
            is_equipped: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            id: 2,
            character_id: character.id,
            item_id: 2,
            quantity: 5,
            is_equipped: false,
            created_at: new Date(),
            updated_at: new Date()
          }
        ];
        
        setGameState((prev: GameState) => ({ ...prev, inventory: demoInventory }));
      }
    } catch (error) {
      console.error('Failed to load character inventory:', error);
    }
  };

  const handleStartAfk = async () => {
    if (!gameState.selectedCharacter) return;
    
    setIsLoading(true);
    try {
      if (backendAvailable) {
        const sessionData = { ...afkForm, character_id: gameState.selectedCharacter.id };
        await trpc.startAfkSession.mutate(sessionData);
        const updatedCharacter = await trpc.getCharacter.query({ characterId: gameState.selectedCharacter.id });
        if (updatedCharacter) {
          setGameState((prev: GameState) => ({ ...prev, selectedCharacter: updatedCharacter }));
        }
      } else {
        const updatedCharacter: Character = {
          ...gameState.selectedCharacter,
          is_afk: true,
          afk_start_time: new Date(),
          afk_end_time: new Date(Date.now() + afkForm.duration_hours * 60 * 60 * 1000)
        };
        
        setGameState((prev: GameState) => ({ ...prev, selectedCharacter: updatedCharacter }));
      }
    } catch (error) {
      console.error('Failed to start AFK session:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameState.user || !chatMessage.trim()) return;

    try {
      if (backendAvailable) {
        const messageData = {
          user_id: gameState.user.id,
          message: chatMessage
        };
        await trpc.sendChatMessage.mutate(messageData);
        setChatMessage('');
        const messages = await trpc.getChatMessages.query({ limit: 50 });
        setGameState((prev: GameState) => ({ ...prev, chatMessages: messages }));
      } else {
        const newMessage: ChatMessage = {
          id: Date.now(),
          user_id: gameState.user.id,
          username: gameState.user.username,
          message: chatMessage,
          created_at: new Date()
        };
        
        setGameState((prev: GameState) => ({
          ...prev,
          chatMessages: [...prev.chatMessages, newMessage]
        }));
        setChatMessage('');
      }
    } catch (error) {
      console.error('Failed to send chat message:', error);
    }
  };

  const handleCreateMarketListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameState.selectedCharacter) return;

    setIsLoading(true);
    try {
      const listingData = { ...marketForm, seller_id: gameState.selectedCharacter.id };
      
      if (backendAvailable) {
        await trpc.createMarketListing.mutate(listingData);
        const listings = await trpc.getMarketListings.query();
        setGameState((prev: GameState) => ({ ...prev, marketListings: listings }));
      } else {
        const newListing: MarketListing = {
          id: Date.now(),
          seller_id: gameState.selectedCharacter.id,
          item_id: marketForm.item_id,
          quantity: marketForm.quantity,
          price_per_unit: marketForm.price_per_unit,
          total_price: marketForm.quantity * marketForm.price_per_unit,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        setGameState((prev: GameState) => ({
          ...prev,
          marketListings: [...prev.marketListings, newListing]
        }));
      }
      
      setMarketForm({
        seller_id: gameState.selectedCharacter.id,
        item_id: 1,
        quantity: 1,
        price_per_unit: 1
      });
    } catch (error) {
      console.error('Failed to create market listing:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'uncommon': return 'bg-green-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getRealmIcon = (realm: string) => {
    switch (realm) {
      case 'earth': return '🌍';
      case 'moon': return '🌙';
      case 'mars': return '🔴';
      default: return '🌍';
    }
  };

  if (!gameState.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/40 border-purple-500/30 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              🚀 Cosmic Realms RPG ⚔️
            </CardTitle>
            <CardDescription className="text-purple-200">
              Explore the realms from Earth to Mars in this fantasy sci-fi adventure
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-purple-900/50">
                <TabsTrigger value="login" className="data-[state=active]:bg-purple-600">Login</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-purple-600">Register</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <Input
                    type="email"
                    placeholder={backendAvailable ? "Email" : "Email (any email works)"}
                    value={loginForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginForm((prev: LoginInput) => ({ ...prev, email: e.target.value }))
                    }
                    className="bg-black/30 border-purple-500/50 text-white placeholder:text-gray-400"
                    required
                  />
                  <Input
                    type="password"
                    placeholder={backendAvailable ? "Password" : "Password (any password works)"}
                    value={loginForm.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLoginForm((prev: LoginInput) => ({ ...prev, password: e.target.value }))
                    }
                    className="bg-black/30 border-purple-500/50 text-white placeholder:text-gray-400"
                    required
                  />
                  <Button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700">
                    {isLoading ? '🔮 Connecting...' : backendAvailable ? '⚡ Login' : '⚡ Login (Demo)'}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <Input
                    placeholder="Username"
                    value={registerForm.username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterForm((prev: CreateUserInput) => ({ ...prev, username: e.target.value }))
                    }
                    className="bg-black/30 border-purple-500/50 text-white placeholder:text-gray-400"
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Email"
                    value={registerForm.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterForm((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                    }
                    className="bg-black/30 border-purple-500/50 text-white placeholder:text-gray-400"
                    required
                  />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={registerForm.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setRegisterForm((prev: CreateUserInput) => ({ ...prev, password: e.target.value }))
                    }
                    className="bg-black/30 border-purple-500/50 text-white placeholder:text-gray-400"
                    required
                  />
                  <Select 
                    value={registerForm.membership_type || 'free'} 
                    onValueChange={(value: 'free' | 'premium') =>
                      setRegisterForm((prev: CreateUserInput) => ({ ...prev, membership_type: value }))
                    }
                  >
                    <SelectTrigger className="bg-black/30 border-purple-500/50 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">🆓 Free (6h AFK)</SelectItem>
                      <SelectItem value="premium">💎 Premium (12h AFK)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700">
                    {isLoading ? '🔮 Creating...' : backendAvailable ? '🌟 Register' : '🌟 Register (Demo)'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
            
            {!backendAvailable && (
              <div className="mt-4 p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-200 text-xs text-center">
                  🚧 Backend unavailable - running in demonstration mode
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            🚀 Cosmic Realms RPG ⚔️
          </h1>
          <div className="flex items-center gap-4">
            <Badge variant={gameState.user.membership_type === 'premium' ? 'default' : 'secondary'} className="text-sm">
              {gameState.user.membership_type === 'premium' ? '💎 Premium' : '🆓 Free'}
            </Badge>
            <Avatar>
              <AvatarFallback className="bg-purple-600">
                {gameState.user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{gameState.user.username}</span>
            {!backendAvailable && (
              <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400">
                Demo Mode
              </Badge>
            )}
          </div>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-black/30">
            <TabsTrigger value="dashboard">🏠 Dashboard</TabsTrigger>
            <TabsTrigger value="realms">🌍 Realms</TabsTrigger>
            <TabsTrigger value="inventory">🎒 Inventory</TabsTrigger>
            <TabsTrigger value="market">💰 Market</TabsTrigger>
            <TabsTrigger value="professions">⚒️ Crafting</TabsTrigger>
            <TabsTrigger value="chat">💬 Chat</TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Characters */}
              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    ⚔️ Your Characters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {gameState.characters.map((character: Character) => (
                    <div
                      key={character.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        gameState.selectedCharacter?.id === character.id
                          ? 'border-purple-500 bg-purple-900/30'
                          : 'border-gray-600 bg-gray-800/30 hover:bg-gray-700/30'
                      }`}
                      onClick={() => selectCharacter(character)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">{character.name}</h3>
                          <p className="text-sm text-gray-300">Level {character.level}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs">❤️ {character.health}/{character.max_health}</span>
                            <span className="text-xs">⚔️ {character.attack}</span>
                            <span className="text-xs">🛡️ {character.defense}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">
                            {getRealmIcon(character.current_realm)} {character.current_realm}
                          </Badge>
                          {character.is_afk && (
                            <Badge variant="secondary" className="text-xs">
                              😴 AFK
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>XP Progress</span>
                          <span>{character.experience}</span>
                        </div>
                        <Progress 
                          value={(character.experience % 1000) / 10} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Create Character */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        ➕ Create New Character
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-black/90 border-purple-500/30">
                      <DialogHeader>
                        <DialogTitle>Create New Character</DialogTitle>
                        <DialogDescription>
                          Choose a name for your new cosmic adventurer
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateCharacter} className="space-y-4">
                        <Input
                          placeholder="Character name"
                          value={newCharacterForm.name}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setNewCharacterForm((prev: CreateCharacterInput) => ({ ...prev, name: e.target.value }))
                          }
                          className="bg-black/30 border-purple-500/50"
                          required
                        />
                        <Button type="submit" disabled={isLoading} className="w-full">
                          {isLoading ? 'Creating...' : '⚡ Create Character'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              {/* AFK System */}
              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    😴 AFK System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {gameState.selectedCharacter ? (
                    <>
                      <div className="text-sm text-gray-300">
                        Selected: <span className="text-white font-medium">{gameState.selectedCharacter.name}</span>
                      </div>
                      
                      {gameState.selectedCharacter.is_afk ? (
                        <div className="p-3 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
                          <p className="text-yellow-200">🌟 Character is currently AFK!</p>
                          {gameState.selectedCharacter.afk_end_time && (
                            <p className="text-xs text-yellow-300 mt-1">
                              Ends: {new Date(gameState.selectedCharacter.afk_end_time).toLocaleString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Select 
                            value={afkForm.duration_hours.toString()} 
                            onValueChange={(value: string) =>
                              setAfkForm((prev: StartAfkInput) => ({ ...prev, duration_hours: parseInt(value) }))
                            }
                          >
                            <SelectTrigger className="bg-black/30  border-purple-500/50">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 Hour</SelectItem>
                              <SelectItem value="2">2 Hours</SelectItem>
                              <SelectItem value="4">4 Hours</SelectItem>
                              <SelectItem value="6">6 Hours</SelectItem>
                              {gameState.user.membership_type === 'premium' && (
                                <>
                                  <SelectItem value="8">8 Hours</SelectItem>
                                  <SelectItem value="12">12 Hours</SelectItem>
                                </>
                              )}
                            </SelectContent>
                          </Select>
                          <Button onClick={handleStartAfk} disabled={isLoading} className="w-full">
                            {isLoading ? 'Starting...' : '🚀 Start AFK Session'}
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-gray-400 text-center py-4">
                      Select a character to start an AFK session
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Realms */}
          <TabsContent value="realms" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gameState.realms.map((realm: Realm) => (
                <Card key={realm.id} className="bg-black/40 border-purple-500/30">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getRealmIcon(realm.name)} {realm.display_name}
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      {realm.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Required Level:</span>
                        <Badge variant="outline">{realm.required_level}</Badge>
                      </div>
                      {realm.required_boss_defeated && (
                        <div className="flex justify-between">
                          <span>Boss Required:</span>
                          <Badge variant="destructive" className="text-xs">
                            {realm.required_boss_defeated}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Inventory */}
          <TabsContent value="inventory" className="space-y-6">
            {gameState.selectedCharacter ? (
              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    🎒 {gameState.selectedCharacter.name}'s Inventory
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {gameState.inventory.map((inventoryItem: Inventory) => {
                      const item = gameState.items.find((i: Item) => i.id === inventoryItem.item_id);
                      if (!item) return null;
                      
                      return (
                        <div
                          key={inventoryItem.id}
                          className={`p-3 rounded-lg border ${
                            inventoryItem.is_equipped ? 'border-yellow-500 bg-yellow-900/20' : 'border-gray-600'
                          }`}
                        >
                          <div className="text-center">
                            <Badge className={`${getRarityColor(item.rarity)} text-white text-xs mb-2`}>
                              {item.rarity}
                            </Badge>
                            <h4 className="font-medium text-sm mb-1">{item.name}</h4>
                            <p className="text-xs text-gray-400 mb-2">{item.type}</p>
                            <Badge variant="outline" className="text-xs">
                              x{inventoryItem.quantity}
                            </Badge>
                            {inventoryItem.is_equipped && (
                              <Badge variant="secondary" className="text-xs mt-1 block">
                                ⚡ Equipped
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {gameState.inventory.length === 0 && (
                    <p className="text-gray-400 text-center py-8">
                      No items in inventory. Start adventuring to collect items!
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-black/40 border-purple-500/30">
                <CardContent className="text-center py-8">
                  <p className="text-gray-400">Select a character to view their inventory</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Market */}
          <TabsContent value="market" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Market Listings */}
              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    💰 Market Listings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {gameState.marketListings.length === 0 ? (
                        <p className="text-gray-400 text-center py-8">
                          No items for sale yet. Create some listings to get started!
                        </p>
                      ) : (
                        gameState.marketListings.map((listing: MarketListing) => {
                          const item = gameState.items.find((i: Item) => i.id === listing.item_id);
                          if (!item) return null;

                          return (
                            <div key={listing.id} className="p-3 border border-gray-600 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{item.name}</h4>
                                  <Badge className={`${getRarityColor(item.rarity)} text-white text-xs`}>
                                    {item.rarity}
                                  </Badge>
                                  <p className="text-sm text-gray-300 mt-1">
                                    Quantity: {listing.quantity}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-green-400">
                                    {listing.price_per_unit} coins/unit
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Total: {listing.total_price} coins
                                  </p>
                                  <Button size="sm" className="mt-2">
                                    💰 Buy
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Create Listing */}
              <Card className="bg-black/40 border-purple-500/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📝 Create Listing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {gameState.selectedCharacter ? (
                    <form onSubmit={handleCreateMarketListing} className="space-y-4">
                      <Select 
                        value={marketForm.item_id.toString()} 
                        onValueChange={(value: string) =>
                          setMarketForm((prev: CreateMarketListingInput) => ({ 
                            ...prev, 
                            item_id: parseInt(value) 
                          }))
                        }
                      >
                        <SelectTrigger className="bg-black/30 border-purple-500/50">
                          <SelectValue placeholder="Select item to sell" />
                        </SelectTrigger>
                        <SelectContent>
                          {gameState.items.map((item: Item) => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.name} ({item.rarity})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={marketForm.quantity}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setMarketForm((prev: CreateMarketListingInput) => ({ 
                            ...prev, 
                            quantity: parseInt(e.target.value) || 1 
                          }))
                        }
                        className="bg-black/30 border-purple-500/50"
                        min="1"
                        required
                      />

                      <Input
                        type="number"
                        placeholder="Price per unit"
                        value={marketForm.price_per_unit}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setMarketForm((prev: CreateMarketListingInput) => ({ 
                            ...prev, 
                            price_per_unit: parseFloat(e.target.value) || 1 
                          }))
                        }
                        className="bg-black/30 border-purple-500/50"
                        step="0.01"
                        min="0.01"
                        required
                      />

                      <Button type="submit" disabled={isLoading} className="w-full">
                        {isLoading ? 'Creating...' : '📦 Create Listing'}
                      </Button>
                    </form>
                  ) : (
                    <p className="text-gray-400 text-center py-4">
                      Select a character to create market listings
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Professions */}
          <TabsContent value="professions">
            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚒️ Crafting & Professions
                </CardTitle>
                <CardDescription>
                  Master mining and chopping to gather materials across the realms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      ⛏️ Mining
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>🌍 Earth Crystals</span>
                        <Badge variant="outline">Level 1</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>🌙 Lunar Minerals</span>
                        <Badge variant="outline">Level 15</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>🔴 Martian Ore</span>
                        <Badge variant="outline">Level 30</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      🪓 Chopping
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>🌳 Earth Wood</span>
                        <Badge variant="outline">Level 1</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>🌌 Cosmic Timber</span>
                        <Badge variant="outline">Level 20</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>🔥 Martian Bark</span>
                        <Badge variant="outline">Level 35</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator className="my-6" />
                
                <div className="text-center">
                  <p className="text-gray-400 mb-4">
                    🚧 Crafting system coming soon! Gather materials through AFK sessions and combat.
                  </p>
                  <Button variant="outline" disabled>
                    🔨 Craft Items (Coming Soon)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat */}
          <TabsContent value="chat">
            <Card className="bg-black/40 border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💬 Global Chat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ScrollArea className="h-96 p-4 border border-gray-600 rounded-lg bg-black/20">
                    <div className="space-y-3">
                      {gameState.chatMessages.map((message: ChatMessage) => (
                        <div key={message.id} className="flex gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-purple-600 text-xs">
                              {message.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{message.username}</span>
                              <span className="text-xs text-gray-400">
                                {new Date(message.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-200">{message.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={chatMessage}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChatMessage(e.target.value)}
                      className="flex-1 bg-black/30 border-purple-500/50"
                      maxLength={500}
                    />
                    <Button type="submit" disabled={!chatMessage.trim()}>
                      🚀 Send
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
