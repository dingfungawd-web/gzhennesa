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
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const { username, logout, isAuthenticated, validateSession } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const userReports = await fetchUserReports(username!);
      setReports(userReports);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('載入報告失敗');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadReports();
      return;
    }

    let cancelled = false;
    (async () => {
      const ok = await validateSession();
      if (!cancelled && !ok) {
        navigate('/');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, navigate, username, validateSession]);

  const handleLogout = async () => {
    await logout();
    toast.success('已登出');
    navigate('/');
  };

  const handleNewReport = () => {
    navigate('/report/new');
  };

  const handleRefresh = () => {
    loadReports();
    toast.success('已刷新');
  };

  // Determine case type based on which fields have data
  const getCaseType = (report: Report): 'completed' | 'followup' | 'unknown' => {
    if (report.address || report.doorsInstalled || report.windowsInstalled) {
      return 'completed';
    }
    if (report.followUpAddress || report.followUpDoorsInstalled || report.followUpWindowsInstalled) {
      return 'followup';
    }
    return 'unknown';
  };

  const getDisplayAddress = (report: Report): string => {
    return report.address || report.followUpAddress || '-';
  };

  const getDisplayDoors = (report: Report): string | number => {
    return report.doorsInstalled || report.followUpDoorsInstalled || '-';
  };

  const getDisplayWindows = (report: Report): string | number => {
    return report.windowsInstalled || report.followUpWindowsInstalled || '-';
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
            <p className="text-muted-foreground">查看及管理您提交的安裝報告（從Google Sheet同步）</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              刷新
            </Button>
            <Button onClick={handleNewReport} className="gradient-primary text-primary-foreground gap-2">
              <Plus className="w-4 h-4" />
              新增報告
            </Button>
          </div>
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
                  <p className="text-sm text-muted-foreground">總記錄數</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {reports.filter(r => getCaseType(r) === 'completed').length}
                  </p>
                  <p className="text-sm text-muted-foreground">已完成個案</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-card border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {reports.filter(r => getCaseType(r) === 'followup').length}
                  </p>
                  <p className="text-sm text-muted-foreground">需跟進個案</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reports Table */}
        <Card className="shadow-card border-border/50">
          <CardHeader>
            <CardTitle>報告列表</CardTitle>
            <CardDescription>您在Google Sheet中的所有安裝報告記錄</CardDescription>
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
                      <TableHead>類型</TableHead>
                      <TableHead>日期</TableHead>
                      <TableHead>分隊</TableHead>
                      <TableHead>地址</TableHead>
                      <TableHead className="text-center">門數</TableHead>
                      <TableHead className="text-center">窗數</TableHead>
                      <TableHead>報告編號</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report, index) => {
                      const caseType = getCaseType(report);
                      return (
                        <TableRow key={`${report.reportCode}-${index}`} className="group">
                          <TableCell>
                            {caseType === 'completed' ? (
                              <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                已完成
                              </Badge>
                            ) : caseType === 'followup' ? (
                              <Badge variant="default" className="bg-warning/10 text-warning hover:bg-warning/20">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                需跟進
                              </Badge>
                            ) : (
                              <Badge variant="secondary">-</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-muted-foreground" />
                              {report.date}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{report.team || '-'}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 max-w-[200px]">
                              <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{getDisplayAddress(report)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{getDisplayDoors(report)}</TableCell>
                          <TableCell className="text-center">{getDisplayWindows(report)}</TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {report.reportCode || '-'}
                            </code>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
