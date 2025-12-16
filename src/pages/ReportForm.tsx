import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Report, ReportFormData } from '@/types/report';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Save, 
  Calendar,
  Users,
  MapPin,
  Clock,
  MessageSquare,
  Package,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const initialFormData: ReportFormData = {
  date: new Date().toISOString().split('T')[0],
  team: '',
  installer1: '',
  installer2: '',
  installer3: '',
  installer4: '',
  address: '',
  actualDuration: '',
  difficulties: '',
  measuringColleague: '',
  customerFeedback: '',
  customerWitness: '',
  doorsInstalled: 0,
  windowsInstalled: 0,
  aluminumInstalled: 0,
  oldGrillesRemoved: 0,
  amendmentAddress: '',
  materialsCut: 0,
  materialsSupplemented: 0,
  reorders: 0,
  reorderLocation: '',
  responsibility: '',
  urgency: '正常',
  followUpDetails: '',
  reportCode: '',
};

const ReportForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isViewMode = searchParams.get('view') === 'true';
  const isEditMode = !!id && id !== 'new';
  const { username, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ReportFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    if (isEditMode) {
      setIsLoading(true);
      const storedReports = localStorage.getItem('reports');
      if (storedReports) {
        const reports: Report[] = JSON.parse(storedReports);
        const report = reports.find(r => r.id === id && r.username === username);
        if (report) {
          setFormData({
            date: report.date,
            team: report.team,
            installer1: report.installer1,
            installer2: report.installer2,
            installer3: report.installer3,
            installer4: report.installer4,
            address: report.address,
            actualDuration: report.actualDuration,
            difficulties: report.difficulties,
            measuringColleague: report.measuringColleague,
            customerFeedback: report.customerFeedback,
            customerWitness: report.customerWitness,
            doorsInstalled: report.doorsInstalled,
            windowsInstalled: report.windowsInstalled,
            aluminumInstalled: report.aluminumInstalled,
            oldGrillesRemoved: report.oldGrillesRemoved,
            amendmentAddress: report.amendmentAddress,
            materialsCut: report.materialsCut,
            materialsSupplemented: report.materialsSupplemented,
            reorders: report.reorders,
            reorderLocation: report.reorderLocation,
            responsibility: report.responsibility,
            urgency: report.urgency,
            followUpDetails: report.followUpDetails,
            reportCode: report.reportCode,
          });
        } else {
          toast.error('找不到報告或無權限查看');
          navigate('/dashboard');
        }
      }
      setIsLoading(false);
    }
  }, [isAuthenticated, isEditMode, id, username, navigate]);

  const handleInputChange = (field: keyof ReportFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.team || !formData.address) {
      toast.error('請填寫必要欄位（日期、分隊、地址）');
      return;
    }

    setIsSaving(true);

    try {
      const storedReports = localStorage.getItem('reports');
      let reports: Report[] = storedReports ? JSON.parse(storedReports) : [];

      if (isEditMode) {
        reports = reports.map(r => {
          if (r.id === id && r.username === username) {
            return {
              ...r,
              ...formData,
              updatedAt: new Date().toISOString(),
            };
          }
          return r;
        });
        toast.success('報告已更新');
      } else {
        const newReport: Report = {
          id: crypto.randomUUID(),
          username: username!,
          ...formData,
          reportCode: `RPT-${Date.now().toString(36).toUpperCase()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        reports.push(newReport);
        toast.success('報告已提交');
      }

      localStorage.setItem('reports', JSON.stringify(reports));
      navigate('/dashboard');
    } catch (error) {
      toast.error('儲存失敗，請重試');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-foreground">
                {isViewMode ? '查看報告' : isEditMode ? '修改報告' : '新增報告'}
              </h1>
              <p className="text-sm text-muted-foreground">{username}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
          {/* Basic Info */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                基本資料
              </CardTitle>
              <CardDescription>填寫報告的基本資訊</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">日期 *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  disabled={isViewMode}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">分隊 *</Label>
                <Input
                  id="team"
                  placeholder="輸入分隊名稱"
                  value={formData.team}
                  onChange={(e) => handleInputChange('team', e.target.value)}
                  disabled={isViewMode}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="address">地址 *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="address"
                    placeholder="輸入安裝地址"
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="pl-10"
                    disabled={isViewMode}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installers */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                安裝同事
              </CardTitle>
              <CardDescription>填寫參與安裝的同事名稱</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="installer1">安裝同事 1</Label>
                <Input
                  id="installer1"
                  placeholder="同事名稱"
                  value={formData.installer1}
                  onChange={(e) => handleInputChange('installer1', e.target.value)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installer2">安裝同事 2</Label>
                <Input
                  id="installer2"
                  placeholder="同事名稱"
                  value={formData.installer2}
                  onChange={(e) => handleInputChange('installer2', e.target.value)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installer3">安裝同事 3</Label>
                <Input
                  id="installer3"
                  placeholder="同事名稱"
                  value={formData.installer3}
                  onChange={(e) => handleInputChange('installer3', e.target.value)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="installer4">安裝同事 4</Label>
                <Input
                  id="installer4"
                  placeholder="同事名稱"
                  value={formData.installer4}
                  onChange={(e) => handleInputChange('installer4', e.target.value)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="measuringColleague">度尺同事</Label>
                <Input
                  id="measuringColleague"
                  placeholder="度尺同事名稱"
                  value={formData.measuringColleague}
                  onChange={(e) => handleInputChange('measuringColleague', e.target.value)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actualDuration">安裝實際時長</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="actualDuration"
                    placeholder="例如：3小時"
                    value={formData.actualDuration}
                    onChange={(e) => handleInputChange('actualDuration', e.target.value)}
                    className="pl-10"
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installation Numbers */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                安裝數量
              </CardTitle>
              <CardDescription>填寫安裝項目的數量</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="doorsInstalled">安裝門數</Label>
                <Input
                  id="doorsInstalled"
                  type="number"
                  min="0"
                  value={formData.doorsInstalled}
                  onChange={(e) => handleInputChange('doorsInstalled', parseInt(e.target.value) || 0)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="windowsInstalled">安裝窗數</Label>
                <Input
                  id="windowsInstalled"
                  type="number"
                  min="0"
                  value={formData.windowsInstalled}
                  onChange={(e) => handleInputChange('windowsInstalled', parseInt(e.target.value) || 0)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aluminumInstalled">安裝鋁料數</Label>
                <Input
                  id="aluminumInstalled"
                  type="number"
                  min="0"
                  value={formData.aluminumInstalled}
                  onChange={(e) => handleInputChange('aluminumInstalled', parseInt(e.target.value) || 0)}
                  disabled={isViewMode}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="oldGrillesRemoved">拆舊拆拉釘窗花數</Label>
                <Input
                  id="oldGrillesRemoved"
                  type="number"
                  min="0"
                  value={formData.oldGrillesRemoved}
                  onChange={(e) => handleInputChange('oldGrillesRemoved', parseInt(e.target.value) || 0)}
                  disabled={isViewMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                現場狀況及反饋
              </CardTitle>
              <CardDescription>填寫現場遇到的困難及客戶反饋</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="difficulties">現場困難解決和建議</Label>
                <Textarea
                  id="difficulties"
                  placeholder="描述遇到的困難及解決方案..."
                  value={formData.difficulties}
                  onChange={(e) => handleInputChange('difficulties', e.target.value)}
                  rows={3}
                  disabled={isViewMode}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerFeedback">客戶反饋</Label>
                  <Textarea
                    id="customerFeedback"
                    placeholder="客戶的意見及反饋..."
                    value={formData.customerFeedback}
                    onChange={(e) => handleInputChange('customerFeedback', e.target.value)}
                    rows={2}
                    disabled={isViewMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerWitness">客戶親證</Label>
                  <Input
                    id="customerWitness"
                    placeholder="客戶簽名/確認"
                    value={formData.customerWitness}
                    onChange={(e) => handleInputChange('customerWitness', e.target.value)}
                    disabled={isViewMode}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Amendment Section */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                修改報告資料
              </CardTitle>
              <CardDescription>如需修改報告，請填寫以下資料</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amendmentAddress">修改地址</Label>
                  <Input
                    id="amendmentAddress"
                    placeholder="如地址有變更"
                    value={formData.amendmentAddress}
                    onChange={(e) => handleInputChange('amendmentAddress', e.target.value)}
                    disabled={isViewMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorderLocation">重訂位置</Label>
                  <Input
                    id="reorderLocation"
                    placeholder="重訂的位置"
                    value={formData.reorderLocation}
                    onChange={(e) => handleInputChange('reorderLocation', e.target.value)}
                    disabled={isViewMode}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="materialsCut">開料數</Label>
                  <Input
                    id="materialsCut"
                    type="number"
                    min="0"
                    value={formData.materialsCut}
                    onChange={(e) => handleInputChange('materialsCut', parseInt(e.target.value) || 0)}
                    disabled={isViewMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="materialsSupplemented">補料數</Label>
                  <Input
                    id="materialsSupplemented"
                    type="number"
                    min="0"
                    value={formData.materialsSupplemented}
                    onChange={(e) => handleInputChange('materialsSupplemented', parseInt(e.target.value) || 0)}
                    disabled={isViewMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorders">重訂數</Label>
                  <Input
                    id="reorders"
                    type="number"
                    min="0"
                    value={formData.reorders}
                    onChange={(e) => handleInputChange('reorders', parseInt(e.target.value) || 0)}
                    disabled={isViewMode}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgency">正常/加急</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value) => handleInputChange('urgency', value)}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="正常">正常</SelectItem>
                      <SelectItem value="加急">加急</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="responsibility">責任選項</Label>
                  <Select
                    value={formData.responsibility}
                    onValueChange={(value) => handleInputChange('responsibility', value)}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇責任方" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="安裝">安裝</SelectItem>
                      <SelectItem value="度尺">度尺</SelectItem>
                      <SelectItem value="廠方">廠方</SelectItem>
                      <SelectItem value="客戶">客戶</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reportCode">報告編號</Label>
                  <Input
                    id="reportCode"
                    placeholder="系統自動生成"
                    value={formData.reportCode}
                    onChange={(e) => handleInputChange('reportCode', e.target.value)}
                    disabled={isViewMode || !isEditMode}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="followUpDetails">跟進詳情</Label>
                <Textarea
                  id="followUpDetails"
                  placeholder="需要跟進的事項..."
                  value={formData.followUpDetails}
                  onChange={(e) => handleInputChange('followUpDetails', e.target.value)}
                  rows={3}
                  disabled={isViewMode}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          {!isViewMode && (
            <div className="flex justify-end gap-4 pb-8">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/dashboard')}
              >
                取消
              </Button>
              <Button 
                type="submit" 
                className="gradient-primary text-primary-foreground gap-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  '儲存中...'
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {isEditMode ? '更新報告' : '提交報告'}
                  </>
                )}
              </Button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default ReportForm;
