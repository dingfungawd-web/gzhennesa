import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Report } from '@/types/report';
import { fetchUserReports } from '@/services/googleSheetsService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ClipboardList, 
  Plus, 
  LogOut, 
  FileEdit, 
  Calendar,
  MapPin,
  Users,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const { username, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const loadReports = async () => {
      try {
        const userReports = await fetchUserReports(username!);
        setReports(userReports);
      } catch (error) {
        console.error('Failed to load reports:', error);
        toast.error('載入報告失敗');
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, [isAuthenticated, navigate, username]);

  const handleLogout = () => {
    logout();
    toast.success('已登出');
    navigate('/');
  };

  const handleNewReport = () => {
    navigate('/report/new');
  };

  const handleEditReport = (reportCode: string) => {
    navigate(`/report/${encodeURIComponent(reportCode)}`);
  };

  const handleViewReport = (reportCode: string) => {
    navigate(`/report/${encodeURIComponent(reportCode)}?view=true`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
                <ClipboardList className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">安裝報告系統</h1>
                <p className="text-sm text-muted-foreground">歡迎，{username}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
              <LogOut className="w-4 h-4" />
              登出
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">我的報告</h2>
            <p className="text-muted-foreground">查看及管理您提交的安裝報告</p>
          </div>
          <Button onClick={handleNewReport} className="gradient-primary text-primary-foreground gap-2">
            <Plus className="w-4 h-4" />
            新增報告
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-card border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{reports.length}</p>
                  <p className="text-sm text-muted-foreground">總報告數</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {reports.filter(r => {
                      const today = new Date().toISOString().split('T')[0];
                      return r.date === today;
                    }).length}
                  </p>
                  <p className="text-sm text-muted-foreground">今日報告</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {reports.reduce((sum, r) => sum + r.doorsInstalled + r.windowsInstalled, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">總安裝數</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Table */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle>報告列表</CardTitle>
            <CardDescription>您提交的所有安裝報告</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                載入中...
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardList className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">尚無報告記錄</p>
                <Button onClick={handleNewReport} variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  提交第一份報告
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>分隊</TableHead>
                      <TableHead>地址</TableHead>
                      <TableHead className="text-center">門數</TableHead>
                      <TableHead className="text-center">窗數</TableHead>
                      <TableHead>報告編號</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report, index) => (
                      <TableRow key={report.reportCode || index} className="group">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {report.date}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{report.team}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 max-w-[200px]">
                            <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{report.address}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">{report.doorsInstalled}</TableCell>
                        <TableCell className="text-center">{report.windowsInstalled}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {report.reportCode || '-'}
                          </code>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewReport(report.reportCode || report.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleEditReport(report.reportCode || report.id)}
                            >
                              <FileEdit className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
