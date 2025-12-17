import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, UserPlus, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import logoImage from '@/assets/logo.jpg';

// Input validation
const validateUsername = (username: string): string | null => {
  const trimmed = username.trim();
  if (!trimmed) return '请输入用户名';
  if (trimmed.length < 2) return '用户名至少需要2个字符';
  if (trimmed.length > 50) return '用户名不能超过50个字符';
  // Allow alphanumeric, Chinese characters, underscores, hyphens
  if (!/^[\w\u4e00-\u9fa5-]+$/u.test(trimmed)) {
    return '用户名只能包含字母、数字、中文、下划线和连字符';
  }
  return null;
};

const validatePassword = (password: string): string | null => {
  if (!password) return '请输入密码';
  if (password.length < 6) return '密码至少需要6个字符';
  if (password.length > 72) return '密码不能超过72个字符';
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
        toast.error('登录失败，请重试');
        setIsLoading(false);
        return;
      }

      if (!userData || userData.length === 0) {
        toast.error('用户名或密码错误');
        setIsLoading(false);
        return;
      }

      const user = userData[0];
      
      // Create session token
      const { data: sessionToken, error: sessionError } = await supabase
        .rpc('create_user_session', { input_user_id: user.user_id });

      if (sessionError || !sessionToken) {
        toast.error('登录失败，请重试');
        setIsLoading(false);
        return;
      }

      login(user.user_id, user.username, sessionToken);
      toast.success(`欢迎，${user.username}！`);
    } catch (error) {
      toast.error('登录失败，请重试');
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
      toast.error('两次输入的密码不一致');
      return;
    }

    setIsRegistering(true);
    
    try {
      // Check if username already exists using secure RPC
      const { data: exists, error: checkError } = await supabase
        .rpc('check_username_exists', { check_username: registerUsername.trim() });
      
      if (checkError) {
        toast.error('注册失败，请重试');
        setIsRegistering(false);
        return;
      }

      if (exists) {
        toast.error('此用户名已被使用，请选择其他名称');
        setIsRegistering(false);
        return;
      }

      // Hash password using database function
      const { data: hashedPassword, error: hashError } = await supabase
        .rpc('hash_password', { password: registerPassword });

      if (hashError || !hashedPassword) {
        toast.error('注册失败，请重试');
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
          toast.error('此用户名已被使用，请选择其他名称');
        } else {
          toast.error('注册失败，请重试');
        }
        setIsRegistering(false);
        return;
      }
      
      toast.success('注册成功！请登录');
      setUsername(registerUsername.trim());
      setRegisterUsername('');
      setRegisterPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast.error('注册失败，请重试');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-bl from-primary/5 via-transparent to-transparent rounded-full blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-accent/5 via-transparent to-transparent rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white shadow-glow mb-4 overflow-hidden">
            <img src={logoImage} alt="HENNESA Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">HENNESA 安装报告系统</h1>
          <p className="text-muted-foreground mt-2">提交及管理您的安装报告</p>
        </div>

        <Card className="shadow-card border-border/50 glass-effect">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50">
              <TabsTrigger value="login" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">登录</TabsTrigger>
              <TabsTrigger value="register" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">注册</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  登录
                </CardTitle>
                <CardDescription>输入已注册的用户名和密码</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">用户名</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="请输入用户名"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="pl-10 bg-background/50"
                        autoComplete="username"
                        autoFocus
                        maxLength={50}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="请输入密码"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-background/50"
                        autoComplete="current-password"
                        maxLength={72}
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full gradient-primary text-primary-foreground shadow-soft hover-lift"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        登录中...
                      </>
                    ) : '登录'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
            
            <TabsContent value="register">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-primary" />
                  注册
                </CardTitle>
                <CardDescription>创建新的用户账号</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="registerUsername">用户名</Label>
                    <div className="relative">
                      <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="registerUsername"
                        type="text"
                        placeholder="请输入用户名"
                        value={registerUsername}
                        onChange={(e) => setRegisterUsername(e.target.value)}
                        className="pl-10 bg-background/50"
                        autoComplete="off"
                        maxLength={50}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      用户名至少需要2个字符
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registerPassword">密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="registerPassword"
                        type="password"
                        placeholder="请输入密码"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        className="pl-10 bg-background/50"
                        autoComplete="new-password"
                        maxLength={72}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      密码至少需要6个字符
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">确认密码</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="请再次输入密码"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 bg-background/50"
                        autoComplete="new-password"
                        maxLength={72}
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full gradient-primary text-primary-foreground shadow-soft hover-lift"
                    disabled={isRegistering}
                  >
                    {isRegistering ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        注册中...
                      </>
                    ) : '注册'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          注册后即可登录并提交安装报告
        </p>
      </div>
    </div>
  );
};

export default Login;
