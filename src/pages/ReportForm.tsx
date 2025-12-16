import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Report, ReportFormData } from '@/types/report';
import { fetchUserReports, submitReport } from '@/services/googleSheetsService';
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
  FileText,
  AlertCircle,
  CheckCircle,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';

// Name lists
const INSTALLERS = ['陳浩嘉', '朱沛儒', '王勇', '陳辉鸿', '小卓'];
const MEASURING_COLLEAGUES = ['黃仲柱', '彭晨陽', '李偉國'];

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
  doorsInstalled: '',
  windowsInstalled: '',
  aluminumInstalled: '',
  oldGrillesRemoved: '',
  followUpAddress: '',
  followUpDuration: '',
  materialsCut: '',
  materialsSupplemented: '',
  reorders: '',
  followUpMeasuringColleague: '',
  reorderLocation: '',
  responsibility: '',
  urgency: '正常',
  followUpDetails: '',
  followUpCustomerFeedback: '',
  followUpDoorsInstalled: '',
  followUpWindowsInstalled: '',
  followUpAluminumInstalled: '',
  followUpOldGrillesRemoved: '',
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
      const loadReport = async () => {
        try {
          const reports = await fetchUserReports(username!);
          const report = reports.find(r => r.reportCode === id || r.id === id);
          if (report) {
            setFormData({
              date: report.date || '',
              team: report.team || '',
              installer1: report.installer1 || '',
              installer2: report.installer2 || '',
              installer3: report.installer3 || '',
              installer4: report.installer4 || '',
              address: report.address || '',
              actualDuration: report.actualDuration || '',
              difficulties: report.difficulties || '',
              measuringColleague: report.measuringColleague || '',
              customerFeedback: report.customerFeedback || '',
              customerWitness: report.customerWitness || '',
              doorsInstalled: report.doorsInstalled?.toString() || '',
              windowsInstalled: report.windowsInstalled?.toString() || '',
              aluminumInstalled: report.aluminumInstalled?.toString() || '',
              oldGrillesRemoved: report.oldGrillesRemoved?.toString() || '',
              followUpAddress: report.followUpAddress || '',
              followUpDuration: report.followUpDuration || '',
              materialsCut: report.materialsCut?.toString() || '',
              materialsSupplemented: report.materialsSupplemented?.toString() || '',
              reorders: report.reorders?.toString() || '',
              followUpMeasuringColleague: report.followUpMeasuringColleague || '',
              reorderLocation: report.reorderLocation || '',
              responsibility: report.responsibility || '',
              urgency: report.urgency || '正常',
              followUpDetails: report.followUpDetails || '',
              followUpCustomerFeedback: report.followUpCustomerFeedback || '',
              followUpDoorsInstalled: report.followUpDoorsInstalled?.toString() || '',
              followUpWindowsInstalled: report.followUpWindowsInstalled?.toString() || '',
              followUpAluminumInstalled: report.followUpAluminumInstalled?.toString() || '',
              followUpOldGrillesRemoved: report.followUpOldGrillesRemoved?.toString() || '',
              reportCode: report.reportCode || '',
            });
          } else {
            toast.error('找不到報告或無權限查看');
            navigate('/my-reports');
          }
        } catch (error) {
          toast.error('載入報告失敗');
          navigate('/my-reports');
        } finally {
          setIsLoading(false);
        }
      };
      loadReport();
    }
  }, [isAuthenticated, isEditMode, id, username, navigate]);

  const handleInputChange = (field: keyof ReportFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNumericInput = (field: keyof ReportFormData, value: string) => {
    if (value === '' || /^\d+$/.test(value)) {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.date || !formData.team) {
      toast.error('請填寫必要欄位（日期、分隊）');
      return;
    }

    setIsSaving(true);

    try {
      await submitReport(username!, formData);
      toast.success(isEditMode ? '報告已更新' : '報告已提交');
      navigate('/my-reports');
    } catch (error) {
      toast.error('儲存失敗，請重試');
    } finally {
      setIsSaving(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/my-reports')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-semibold text-foreground">
                  {isViewMode ? '查看報告' : isEditMode ? '修改報告' : '新增報告'}
                </h1>
                <p className="text-sm text-muted-foreground">{username}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/my-reports')}>
              <FileText className="w-4 h-4 mr-2" />
              我的報告
            </Button>
          </div>
        </div>
      </header>

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
            </CardContent>
          </Card>

          {/* Installers */}
          <Card className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                安裝同事
              </CardTitle>
              <CardDescription>選擇參與安裝的同事</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="space-y-2">
                  <Label>安裝同事 {num}</Label>
                  <Select
                    value={formData[`installer${num}` as keyof ReportFormData] as string}
                    onValueChange={(value) => handleInputChange(`installer${num}` as keyof ReportFormData, value === '_empty' ? '' : value)}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇同事" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_empty">不選擇</SelectItem>
                      {INSTALLERS.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>

          <Separator />

          {/* Completed Cases Section */}
          <Card id="completed-cases" className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                已完成個案
              </CardTitle>
              <CardDescription>填寫已完成安裝的個案資料</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">地址</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="address"
                      placeholder="輸入安裝地址"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="pl-10"
                      disabled={isViewMode}
                    />
                  </div>
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
                <div className="space-y-2">
                  <Label htmlFor="measuringColleague">度尺同事</Label>
                  <Select
                    value={formData.measuringColleague}
                    onValueChange={(value) => handleInputChange('measuringColleague', value === '_empty' ? '' : value)}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇度尺同事" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_empty">不選擇</SelectItem>
                      {MEASURING_COLLEAGUES.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

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

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="doorsInstalled">安裝門數</Label>
                  <Input
                    id="doorsInstalled"
                    inputMode="numeric"
                    placeholder="輸入數量"
                    value={formData.doorsInstalled}
                    onChange={(e) => handleNumericInput('doorsInstalled', e.target.value)}
                    disabled={isViewMode}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="windowsInstalled">安裝窗數</Label>
                  <Input
                    id="windowsInstalled"
                    inputMode="numeric"
                    placeholder="輸入數量"
                    value={formData.windowsInstalled}
                    onChange={(e) => handleNumericInput('windowsInstalled', e.target.value)}
                    disabled={isViewMode}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aluminumInstalled">安裝鋁料數</Label>
                  <Input
                    id="aluminumInstalled"
                    inputMode="numeric"
                    placeholder="輸入數量"
                    value={formData.aluminumInstalled}
                    onChange={(e) => handleNumericInput('aluminumInstalled', e.target.value)}
                    disabled={isViewMode}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="oldGrillesRemoved">拆舊拆拉釘窗花數</Label>
                  <Input
                    id="oldGrillesRemoved"
                    inputMode="numeric"
                    placeholder="輸入數量"
                    value={formData.oldGrillesRemoved}
                    onChange={(e) => handleNumericInput('oldGrillesRemoved', e.target.value)}
                    disabled={isViewMode}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Completed Case Button */}
          {!isViewMode && (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => scrollToSection('completed-cases')}
            >
              <Plus className="w-4 h-4" />
              <CheckCircle className="w-4 h-4 text-green-500" />
              新增已完成個案
            </Button>
          )}

          <Separator />

          {/* Follow-up Cases Section */}
          <Card id="followup-cases" className="shadow-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                需跟進個案
              </CardTitle>
              <CardDescription>填寫需要跟進的個案資料</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="followUpAddress">地址</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="followUpAddress"
                      placeholder="輸入跟進地址"
                      value={formData.followUpAddress}
                      onChange={(e) => handleInputChange('followUpAddress', e.target.value)}
                      className="pl-10"
                      disabled={isViewMode}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followUpDuration">安裝實際時長</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="followUpDuration"
                      placeholder="例如：3小時"
                      value={formData.followUpDuration}
                      onChange={(e) => handleInputChange('followUpDuration', e.target.value)}
                      className="pl-10"
                      disabled={isViewMode}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followUpMeasuringColleague">度尺同事</Label>
                  <Select
                    value={formData.followUpMeasuringColleague}
                    onValueChange={(value) => handleInputChange('followUpMeasuringColleague', value === '_empty' ? '' : value)}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇度尺同事" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_empty">不選擇</SelectItem>
                      {MEASURING_COLLEAGUES.map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="materialsCut">開料數</Label>
                  <Input
                    id="materialsCut"
                    inputMode="numeric"
                    placeholder="輸入數量"
                    value={formData.materialsCut}
                    onChange={(e) => handleNumericInput('materialsCut', e.target.value)}
                    disabled={isViewMode}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="materialsSupplemented">補料數</Label>
                  <Input
                    id="materialsSupplemented"
                    inputMode="numeric"
                    placeholder="輸入數量"
                    value={formData.materialsSupplemented}
                    onChange={(e) => handleNumericInput('materialsSupplemented', e.target.value)}
                    disabled={isViewMode}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reorders">重訂數</Label>
                  <Input
                    id="reorders"
                    inputMode="numeric"
                    placeholder="輸入數量"
                    value={formData.reorders}
                    onChange={(e) => handleNumericInput('reorders', e.target.value)}
                    disabled={isViewMode}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="responsibility">責任選項</Label>
                  <Select
                    value={formData.responsibility}
                    onValueChange={(value) => handleInputChange('responsibility', value === '_empty' ? '' : value)}
                    disabled={isViewMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇責任方" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_empty">不選擇</SelectItem>
                      <SelectItem value="安裝">安裝</SelectItem>
                      <SelectItem value="度尺">度尺</SelectItem>
                      <SelectItem value="廠方">廠方</SelectItem>
                      <SelectItem value="客戶">客戶</SelectItem>
                      <SelectItem value="其他">其他</SelectItem>
                    </SelectContent>
                  </Select>
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

              <div className="space-y-2">
                <Label htmlFor="followUpCustomerFeedback">客戶反饋</Label>
                <Textarea
                  id="followUpCustomerFeedback"
                  placeholder="客戶的意見及反饋..."
                  value={formData.followUpCustomerFeedback}
                  onChange={(e) => handleInputChange('followUpCustomerFeedback', e.target.value)}
                  rows={2}
                  disabled={isViewMode}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="followUpDoorsInstalled">安裝門數</Label>
                  <Input
                    id="followUpDoorsInstalled"
                    inputMode="numeric"
                    placeholder="輸入數量"
                    value={formData.followUpDoorsInstalled}
                    onChange={(e) => handleNumericInput('followUpDoorsInstalled', e.target.value)}
                    disabled={isViewMode}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followUpWindowsInstalled">安裝窗數</Label>
                  <Input
                    id="followUpWindowsInstalled"
                    inputMode="numeric"
                    placeholder="輸入數量"
                    value={formData.followUpWindowsInstalled}
                    onChange={(e) => handleNumericInput('followUpWindowsInstalled', e.target.value)}
                    disabled={isViewMode}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followUpAluminumInstalled">安裝鋁料數</Label>
                  <Input
                    id="followUpAluminumInstalled"
                    inputMode="numeric"
                    placeholder="輸入數量"
                    value={formData.followUpAluminumInstalled}
                    onChange={(e) => handleNumericInput('followUpAluminumInstalled', e.target.value)}
                    disabled={isViewMode}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="followUpOldGrillesRemoved">拆舊拆拉釘窗花數</Label>
                  <Input
                    id="followUpOldGrillesRemoved"
                    inputMode="numeric"
                    placeholder="輸入數量"
                    value={formData.followUpOldGrillesRemoved}
                    onChange={(e) => handleNumericInput('followUpOldGrillesRemoved', e.target.value)}
                    disabled={isViewMode}
                    className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Follow-up Case Button */}
          {!isViewMode && (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => scrollToSection('followup-cases')}
            >
              <Plus className="w-4 h-4" />
              <AlertCircle className="w-4 h-4 text-warning" />
              新增需跟進個案
            </Button>
          )}

          {/* Submit Button */}
          {!isViewMode && (
            <div className="flex justify-end gap-4 pb-8">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/my-reports')}
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
