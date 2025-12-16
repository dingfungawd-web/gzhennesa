import { useState, useEffect, useMemo } from 'react';
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
  Users,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface GroupedReport {
  reportCode: string;
  date: string;
  team: string;
  installers: string[];
  completedCount: number;
  followUpCount: number;
}

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

  // Group reports by reportCode
  const groupedReports = useMemo(() => {
    const groups = new Map<string, Report[]>();
    
    reports.forEach(report => {
      const code = report.reportCode || report.id;
      if (!groups.has(code)) {
        groups.set(code, []);
      }
      groups.get(code)!.push(report);
    });

    const result: GroupedReport[] = [];
    
    groups.forEach((reportRows, reportCode) => {
      const firstRow = reportRows[0];
      const installers = [
        firstRow.installer1,
        firstRow.installer2,
        firstRow.installer3,
        firstRow.installer4
      ].filter(Boolean);

      let completedCount = 0;
      let followUpCount = 0;

      reportRows.forEach(row => {
        if (row.address || row.doorsInstalled || row.windowsInstalled) {
          completedCount++;
        }
        if (row.followUpAddress || row.followUpDoorsInstalled || row.followUpWindowsInstalled) {
          followUpCount++;
        }
      });

      result.push({
        reportCode,
        date: firstRow.date,
        team: firstRow.team || '-',
        installers,
        completedCount,
        followUpCount,
      });
    });

    // Sort by date descending
    return result.sort((a, b) => {
      if (a.date && b.date) {
        return b.date.localeCompare(a.date);
      }
      return 0;
    });
  }, [reports]);

  // Calculate totals from grouped reports
  const totalCompleted = useMemo(() => 
    groupedReports.reduce((sum, r) => sum + r.completedCount, 0), [groupedReports]);
  
  const totalFollowUp = useMemo(() => 
    groupedReports.reduce((sum, r) => sum + r.followUpCount, 0), [groupedReports]);

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
                  <p className="text-2xl font-bold text-foreground">{groupedReports.length}</p>
                  <p className="text-sm text-muted-foreground">總報告數</p>
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
                  <p className="text-2xl font-bold text-foreground">{totalCompleted}</p>
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
                  <p className="text-2xl font-bold text-foreground">{totalFollowUp}</p>
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
            <CardDescription>點擊報告可查看及修改詳情</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">
                載入中...
              </div>
            ) : groupedReports.length === 0 ? (
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
                      <TableHead>安裝同事</TableHead>
                      <TableHead className="text-center">已完成</TableHead>
                      <TableHead className="text-center">需跟進</TableHead>
                      <TableHead>報告編號</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedReports.map((report) => (
                      <TableRow 
                        key={report.reportCode} 
                        className="group cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/report/${encodeURIComponent(report.reportCode)}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {report.date || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{report.team}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {report.installers.length > 0 
                                ? report.installers.slice(0, 2).join('、') + (report.installers.length > 2 ? '...' : '')
                                : '-'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {report.completedCount > 0 ? (
                            <Badge variant="default" className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {report.completedCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {report.followUpCount > 0 ? (
                            <Badge variant="default" className="bg-warning/10 text-warning hover:bg-warning/20">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              {report.followUpCount}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {report.reportCode}
                          </code>
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