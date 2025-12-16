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
    
    if (!username.trim()) {
      toast.error('請輸入使用者名稱');
      return;
    }

    if (!password) {
      toast.error('請輸入密碼');
      return;
    }

    setIsLoading(true);
    
    try {
      // Get user and verify password
      const { data: user, error: userError } = await supabase
        .from('registered_users')
        .select('username, password_hash')
        .eq('username', username.trim())
        .single();
      
      if (userError || !user) {
        toast.error('此用戶名稱未註冊，請先註冊');
        setIsLoading(false);
        return;
      }

      if (!user.password_hash) {
        toast.error('此帳號尚未設定密碼，請聯繫管理員');
        setIsLoading(false);
        return;
      }

      // Verify password using database function
      const { data: isValid, error: verifyError } = await supabase
        .rpc('verify_password', {
          input_password: password,
          stored_hash: user.password_hash
        });

      if (verifyError || !isValid) {
        toast.error('密碼錯誤');
        setIsLoading(false);
        return;
      }
      
      login(username.trim());
      toast.success(`歡迎，${username}！`);
      navigate('/report/new');
    } catch (error) {
      toast.error('登入失敗，請重試');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!registerUsername.trim()) {
      toast.error('請輸入使用者名稱');
      return;
    }

    if (registerUsername.trim().length < 2) {
      toast.error('使用者名稱至少需要2個字元');
      return;
    }

    if (!registerPassword) {
      toast.error('請輸入密碼');
      return;
    }

    if (registerPassword.length < 6) {
      toast.error('密碼至少需要6個字元');
      return;
    }

    if (registerPassword !== confirmPassword) {
      toast.error('兩次輸入的密碼不一致');
      return;
    }

    setIsRegistering(true);
    
    try {
      // Check if username already exists
      const { data: existingUser } = await supabase
        .from('registered_users')
        .select('username')
        .eq('username', registerUsername.trim())
        .single();
      
      if (existingUser) {
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
