import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, User, UserPlus, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Input validation
const validateUsername = (username: string): string | null => {
  const trimmed = username.trim();
  if (!trimmed) return '請輸入使用者名稱';
  if (trimmed.length < 2) return '使用者名稱至少需要2個字元';
  if (trimmed.length > 50) return '使用者名稱不能超過50個字元';
  // Allow alphanumeric, Chinese characters, underscores, hyphens
  if (!/^[\w\u4e00-\u9fa5-]+$/u.test(trimmed)) {
    return '使用者名稱只能包含字母、數字、中文、底線和連字符';
  }
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return '請輸入密碼';
  if (password.length < 6) return '密碼至少需要6個字元';
  if (password.length > 72) return '密碼不能超過72個字元';
  return null;
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const usernameError = validateUsername(username);
    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    setIsLoading(true);
    
    try {
      // Use secure RPC function for login verification
      const { data: userData, error: loginError } = await supabase
        .rpc('verify_user_login', {
          input_username: username.trim(),
          input_password: password
        });
      
      if (loginError) {
        toast.error('登入失敗，請重試');
        setIsLoading(false);
        return;
      }

      if (!userData || userData.length === 0) {
        toast.error('用戶名稱或密碼錯誤');
        setIsLoading(false);
        return;
      }

      const user = userData[0];
      
      // Create session token
      const { data: sessionToken, error: sessionError } = await supabase
        .rpc('create_user_session', { input_user_id: user.user_id });

      if (sessionError || !sessionToken) {
        toast.error('登入失敗，請重試');
        setIsLoading(false);
        return;
      }
      
      login(user.user_id, user.username, sessionToken);
      toast.success(`歡迎，${user.username}！`);
      navigate('/report/new');
    } catch (error) {
      toast.error('登入失敗，請重試');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate username
    const usernameError = validateUsername(registerUsername);
    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    // Validate password
    const passwordError = validatePassword(registerPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (registerPassword !== confirmPassword) {
      toast.error('兩次輸入的密碼不一致');
      return;
    }

    setIsRegistering(true);
    
    try {
      // Check if username already exists using secure RPC
      const { data: exists, error: checkError } = await supabase
        .rpc('check_username_exists', { check_username: registerUsername.trim() });
      
      if (checkError) {
        toast.error('註冊失敗，請重試');
        setIsRegistering(false);
        return;
      }

      if (exists) {
        toast.error('此用戶名稱已被使用，請選擇其他名稱');
        setIsRegistering(false);
        return;
      }

      // Hash password using database function
      const { data: hashedPassword, error: hashError } = await supabase
        .rpc('hash_password', { password: registerPassword });

      if (hashError || !hashedPassword) {
        toast.error('註冊失敗，請重試');
        setIsRegistering(false);
        return;
      }
      
      // Register new user with hashed password
      const { error } = await supabase
        .from('registered_users')
        .insert({ 
          username: registerUsername.trim(),
          password_hash: hashedPassword
        });
      
      if (error) {
        if (error.code === '23505') {
          toast.error('此用戶名稱已被使用，請選擇其他名稱');
        } else {
          toast.error('註冊失敗，請重試');
        }
        setIsRegistering(false);
        return;
      }
      
      toast.success('註冊成功！請登入');
      setUsername(registerUsername.trim());
      setRegisterUsername('');
      setRegisterPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('註冊失敗，請重試');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-soft mb-4">
            <ClipboardList className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">安裝報告系統</h1>
          <p className="text-muted-foreground mt-2">提交及管理您的安裝報告</p>
        </div>

        <Card className="shadow-card border-border/50">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">登入</TabsTrigger>
              <TabsTrigger value="register">註冊</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="w-5 h-5" />
                  登入
                </CardTitle>
                <CardDescription>輸入已註冊的使用者名稱和密碼</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">使用者名稱</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="請輸入使用者名稱"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10"
                        autoComplete="username"
                        autoFocus
                        maxLength={50}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">密碼</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="請輸入密碼"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10"
                        autoComplete="current-password"
                        maxLength={72}
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    disabled={isLoading}
                  >
                    {isLoading ? '登入中...' : '登入'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="register">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  註冊
                </CardTitle>
                <CardDescription>建立新的使用者帳號</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="registerUsername">使用者名稱</Label>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="registerUsername"
                        type="text"
                        placeholder="請輸入使用者名稱"
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        className="pl-10"
                        autoComplete="off"
                        maxLength={50}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      使用者名稱至少需要2個字元
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerPassword">密碼</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="registerPassword"
                        type="password"
                        placeholder="請輸入密碼"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="pl-10"
                        autoComplete="new-password"
                        maxLength={72}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      密碼至少需要6個字元
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">確認密碼</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="請再次輸入密碼"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        autoComplete="new-password"
                        maxLength={72}
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full gradient-primary text-primary-foreground hover:opacity-90 transition-opacity"
                    disabled={isRegistering}
                  >
                    {isRegistering ? '註冊中...' : '註冊'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          註冊後即可登入並提交安裝報告
        </p>
      </div>
    </div>
  );
};

export default Login;
