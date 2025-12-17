import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ReportFormData, CompletedCase, FollowUpCase, emptyCompletedCase, emptyFollowUpCase, Report } from '@/types/report';
import { fetchReportsByCode, submitReport, updateReport } from '@/services/googleSheetsService';
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
  Plus,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

const INSTALLERS = ['陳浩嘉', '朱沛儒', '王勇', '陳辉鸿', '小卓'];
const MEASURING_COLLEAGUES = ['黃仲柱', '彭晨陽', '李偉國'];

const toISODateForInput = (raw: string): string => {
  const value = String(raw || '').trim();
  if (!value) return '';

  // Already yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  // yyyy/m/d or yyyy-mm-dd (non-padded)
  const ymd = value.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // d/m/yyyy
  const dmy = value.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // Fallback: try Date parse
  const dt = new Date(value);
  if (!Number.isNaN(dt.getTime())) return format(dt, 'yyyy-MM-dd');

  return '';
};

const initialFormData: ReportFormData = {
  basicInfo: {
    date: format(new Date(), 'yyyy-MM-dd'),
    team: '',
    installer1: '',
    installer2: '',
    installer3: '',
    installer4: '',
  },
  completedCases: [{ ...emptyCompletedCase }],
  followUpCases: [{ ...emptyFollowUpCase }],
  reportCode: '',
};

// Convert flat Report rows to ReportFormData
const reportsToFormData = (reports: Report[]): ReportFormData => {
  if (reports.length === 0) return initialFormData;

  const first = reports[0];
  const completedCases: CompletedCase[] = [];
  const followUpCases: FollowUpCase[] = [];

  reports.forEach(r => {
    if (r.address || r.doorsInstalled || r.windowsInstalled) {
      completedCases.push({
        address: r.address || '',
        actualDuration: r.actualDuration || '',
        difficulties: r.difficulties || '',
        measuringColleague: r.measuringColleague || '',
        customerFeedback: r.customerFeedback || '',
        customerWitness: r.customerWitness || '',
        doorsInstalled: String(r.doorsInstalled || ''),
        windowsInstalled: String(r.windowsInstalled || ''),
        aluminumInstalled: String(r.aluminumInstalled || ''),
        oldGrillesRemoved: String(r.oldGrillesRemoved || ''),
      });
    }
    if (r.followUpAddress || r.followUpDoorsInstalled || r.followUpWindowsInstalled) {
      followUpCases.push({
        address: r.followUpAddress || '',
        duration: r.followUpDuration || '',
        materialsCut: String(r.materialsCut || ''),
        materialsSupplemented: String(r.materialsSupplemented || ''),
        reorders: String(r.reorders || ''),
        measuringColleague: r.followUpMeasuringColleague || '',
        reorderLocation: r.reorderLocation || '',
        responsibility: r.responsibility || '',
        urgency: r.urgency || '正常',
        details: r.followUpDetails || '',
        customerFeedback: r.followUpCustomerFeedback || '',
        doorsInstalled: String(r.followUpDoorsInstalled || ''),
        windowsInstalled: String(r.followUpWindowsInstalled || ''),
        aluminumInstalled: String(r.followUpAluminumInstalled || ''),
        oldGrillesRemoved: String(r.followUpOldGrillesRemoved || ''),
      });
    }
  });

  return {
    basicInfo: {
      date: toISODateForInput(first.date || ''),
      team: first.team || '',
      installer1: first.installer1 || '',
      installer2: first.installer2 || '',
      installer3: first.installer3 || '',
      installer4: first.installer4 || '',
    },
    completedCases: completedCases.length > 0 ? completedCases : [{ ...emptyCompletedCase }],
    followUpCases: followUpCases.length > 0 ? followUpCases : [{ ...emptyFollowUpCase }],
    reportCode: first.reportCode || '',
  };
};

const ReportForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isViewMode = searchParams.get('view') === 'true';
  const isEditMode = !!id && id !== 'new';
  const { username, isAuthenticated, validateSession } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ReportFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isAuthenticated) return;

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
  }, [isAuthenticated, navigate, validateSession]);

  // Load existing report data in edit mode
  useEffect(() => {
    if (!isEditMode || !username || !isAuthenticated) return;

    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const reports = await fetchReportsByCode(username, decodeURIComponent(id!));
        if (!cancelled && reports.length > 0) {
          setFormData(reportsToFormData(reports));
        } else if (!cancelled) {
          toast.error('找不到該報告');
          navigate('/my-reports');
        }
      } catch (error) {
        if (!cancelled) {
          toast.error('載入報告失敗');
          navigate('/my-reports');
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isEditMode, id, username, isAuthenticated, navigate]);

  const handleBasicInfoChange = (field: keyof ReportFormData['basicInfo'], value: string) => {
    setFormData(prev => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [field]: value }
    }));
  };

  const handleCompletedCaseChange = (index: number, field: keyof CompletedCase, value: string) => {
    setFormData(prev => {
      const newCases = [...prev.completedCases];
      newCases[index] = { ...newCases[index], [field]: value };
      return { ...prev, completedCases: newCases };
    });
  };

  const handleFollowUpCaseChange = (index: number, field: keyof FollowUpCase, value: string) => {
    setFormData(prev => {
      const newCases = [...prev.followUpCases];
      newCases[index] = { ...newCases[index], [field]: value };
      return { ...prev, followUpCases: newCases };
    });
  };

  const handleNumericInput = (value: string): string => {
    if (value === '' || /^\d+$/.test(value)) {
      return value;
    }
    return '';
  };

  const addCompletedCase = () => {
    setFormData(prev => ({
      ...prev,
      completedCases: [...prev.completedCases, { ...emptyCompletedCase }]
    }));
  };

  const removeCompletedCase = (index: number) => {
    if (formData.completedCases.length > 1) {
      setFormData(prev => ({
        ...prev,
        completedCases: prev.completedCases.filter((_, i) => i !== index)
      }));
    }
  };

  const addFollowUpCase = () => {
    setFormData(prev => ({
      ...prev,
      followUpCases: [...prev.followUpCases, { ...emptyFollowUpCase }]
    }));
  };

  const removeFollowUpCase = (index: number) => {
    if (formData.followUpCases.length > 1) {
      setFormData(prev => ({
        ...prev,
        followUpCases: prev.followUpCases.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username) {
      toast.error('登入狀態已失效，請重新登入');
      navigate('/');
      return;
    }
    
    if (!formData.basicInfo.date || !formData.basicInfo.team) {
      toast.error('請填寫必要欄位（日期、分隊）');
      return;
    }

    setIsSaving(true);

    try {
      if (isEditMode) {
        await updateReport(username, formData);
        toast.success('報告已更新');
      } else {
        await submitReport(username, formData);
        toast.success('報告已提交');
      }
      navigate('/my-reports');
    } catch (error) {
      console.error('Report submit/update failed:', error);
      const msg = error instanceof Error ? error.message : '';
      if (msg.includes('Session expired')) {
        toast.error('登入狀態已失效，請重新登入');
        navigate('/');
        return;
      }
      const fallback = isEditMode ? '更新失敗，請重試' : '儲存失敗，請重試';
      toast.error(msg ? `${fallback}（${msg}）` : fallback);
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
              <CardDescription>填寫報告的基本資訊（所有個案共用）</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">日期 *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.basicInfo.date}
                  onChange={(e) => handleBasicInfoChange('date', e.target.value)}
                  disabled={isViewMode}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">分隊 *</Label>
                <Input
                  id="team"
                  placeholder="輸入分隊名稱"
                  value={formData.basicInfo.team}
                  onChange={(e) => handleBasicInfoChange('team', e.target.value)}
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
                    value={formData.basicInfo[`installer${num}` as keyof typeof formData.basicInfo]}
                    onValueChange={(value) => handleBasicInfoChange(`installer${num}` as keyof typeof formData.basicInfo, value === '_empty' ? '' : value)}
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
          {formData.completedCases.map((caseData, index) => (
            <Card key={`completed-${index}`} className="shadow-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    已完成個案 {formData.completedCases.length > 1 ? `#${index + 1}` : ''}
                  </CardTitle>
                  {formData.completedCases.length > 1 && !isViewMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCompletedCase(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <CardDescription>填寫已完成安裝的個案資料</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>地址</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="輸入安裝地址"
                        value={caseData.address}
                        onChange={(e) => handleCompletedCaseChange(index, 'address', e.target.value)}
                        className="pl-10"
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>安裝實際時長</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="例如：3小時"
                        value={caseData.actualDuration}
                        onChange={(e) => handleCompletedCaseChange(index, 'actualDuration', e.target.value)}
                        className="pl-10"
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>度尺同事</Label>
                    <Select
                      value={caseData.measuringColleague}
                      onValueChange={(value) => handleCompletedCaseChange(index, 'measuringColleague', value === '_empty' ? '' : value)}
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
                  <Label>現場困難解決和建議</Label>
                  <Textarea
                    placeholder="描述遇到的困難及解決方案..."
                    value={caseData.difficulties}
                    onChange={(e) => handleCompletedCaseChange(index, 'difficulties', e.target.value)}
                    rows={3}
                    disabled={isViewMode}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>客戶反饋</Label>
                    <Textarea
                      placeholder="客戶的意見及反饋..."
                      value={caseData.customerFeedback}
                      onChange={(e) => handleCompletedCaseChange(index, 'customerFeedback', e.target.value)}
                      rows={2}
                      disabled={isViewMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>客戶親證</Label>
                    <Input
                      placeholder="客戶簽名/確認"
                      value={caseData.customerWitness}
                      onChange={(e) => handleCompletedCaseChange(index, 'customerWitness', e.target.value)}
                      disabled={isViewMode}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>安裝門數</Label>
                    <Input
                      inputMode="numeric"
                      placeholder="輸入數量"
                      value={caseData.doorsInstalled}
                      onChange={(e) => {
                        const val = handleNumericInput(e.target.value);
                        if (val !== '' || e.target.value === '') handleCompletedCaseChange(index, 'doorsInstalled', e.target.value === '' ? '' : val);
                      }}
                      disabled={isViewMode}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>安裝窗數</Label>
                    <Input
                      inputMode="numeric"
                      placeholder="輸入數量"
                      value={caseData.windowsInstalled}
                      onChange={(e) => {
                        const val = handleNumericInput(e.target.value);
                        if (val !== '' || e.target.value === '') handleCompletedCaseChange(index, 'windowsInstalled', e.target.value === '' ? '' : val);
                      }}
                      disabled={isViewMode}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>安裝鋁料數</Label>
                    <Input
                      inputMode="numeric"
                      placeholder="輸入數量"
                      value={caseData.aluminumInstalled}
                      onChange={(e) => {
                        const val = handleNumericInput(e.target.value);
                        if (val !== '' || e.target.value === '') handleCompletedCaseChange(index, 'aluminumInstalled', e.target.value === '' ? '' : val);
                      }}
                      disabled={isViewMode}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>拆舊拆拉釘窗花數</Label>
                    <Input
                      inputMode="numeric"
                      placeholder="輸入數量"
                      value={caseData.oldGrillesRemoved}
                      onChange={(e) => {
                        const val = handleNumericInput(e.target.value);
                        if (val !== '' || e.target.value === '') handleCompletedCaseChange(index, 'oldGrillesRemoved', e.target.value === '' ? '' : val);
                      }}
                      disabled={isViewMode}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Completed Case Button */}
          {!isViewMode && (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={addCompletedCase}
            >
              <Plus className="w-4 h-4" />
              <CheckCircle className="w-4 h-4 text-green-500" />
              新增已完成個案
            </Button>
          )}

          <Separator />

          {/* Follow-up Cases Section */}
          {formData.followUpCases.map((caseData, index) => (
            <Card key={`followup-${index}`} className="shadow-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-warning" />
                    需跟進個案 {formData.followUpCases.length > 1 ? `#${index + 1}` : ''}
                  </CardTitle>
                  {formData.followUpCases.length > 1 && !isViewMode && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFollowUpCase(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <CardDescription>填寫需要跟進的個案資料</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label>地址</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="輸入跟進地址"
                        value={caseData.address}
                        onChange={(e) => handleFollowUpCaseChange(index, 'address', e.target.value)}
                        className="pl-10"
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>安裝實際時長</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="例如：3小時"
                        value={caseData.duration}
                        onChange={(e) => handleFollowUpCaseChange(index, 'duration', e.target.value)}
                        className="pl-10"
                        disabled={isViewMode}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>度尺同事</Label>
                    <Select
                      value={caseData.measuringColleague}
                      onValueChange={(value) => handleFollowUpCaseChange(index, 'measuringColleague', value === '_empty' ? '' : value)}
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
                    <Label>開料數</Label>
                    <Input
                      inputMode="numeric"
                      placeholder="輸入數量"
                      value={caseData.materialsCut}
                      onChange={(e) => {
                        const val = handleNumericInput(e.target.value);
                        if (val !== '' || e.target.value === '') handleFollowUpCaseChange(index, 'materialsCut', e.target.value === '' ? '' : val);
                      }}
                      disabled={isViewMode}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>補料數</Label>
                    <Input
                      inputMode="numeric"
                      placeholder="輸入數量"
                      value={caseData.materialsSupplemented}
                      onChange={(e) => {
                        const val = handleNumericInput(e.target.value);
                        if (val !== '' || e.target.value === '') handleFollowUpCaseChange(index, 'materialsSupplemented', e.target.value === '' ? '' : val);
                      }}
                      disabled={isViewMode}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>重訂數</Label>
                    <Input
                      inputMode="numeric"
                      placeholder="輸入數量"
                      value={caseData.reorders}
                      onChange={(e) => {
                        const val = handleNumericInput(e.target.value);
                        if (val !== '' || e.target.value === '') handleFollowUpCaseChange(index, 'reorders', e.target.value === '' ? '' : val);
                      }}
                      disabled={isViewMode}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>重訂位置</Label>
                    <Input
                      placeholder="重訂的位置"
                      value={caseData.reorderLocation}
                      onChange={(e) => handleFollowUpCaseChange(index, 'reorderLocation', e.target.value)}
                      disabled={isViewMode}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>責任選項</Label>
                    <Select
                      value={caseData.responsibility}
                      onValueChange={(value) => handleFollowUpCaseChange(index, 'responsibility', value === '_empty' ? '' : value)}
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
                    <Label>正常/加急</Label>
                    <Select
                      value={caseData.urgency}
                      onValueChange={(value) => handleFollowUpCaseChange(index, 'urgency', value)}
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

                <div className="space-y-2">
                  <Label>跟進詳情</Label>
                  <Textarea
                    placeholder="需要跟進的事項..."
                    value={caseData.details}
                    onChange={(e) => handleFollowUpCaseChange(index, 'details', e.target.value)}
                    rows={3}
                    disabled={isViewMode}
                  />
                </div>

                <div className="space-y-2">
                  <Label>客戶反饋</Label>
                  <Textarea
                    placeholder="客戶的意見及反饋..."
                    value={caseData.customerFeedback}
                    onChange={(e) => handleFollowUpCaseChange(index, 'customerFeedback', e.target.value)}
                    rows={2}
                    disabled={isViewMode}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>安裝門數</Label>
                    <Input
                      inputMode="numeric"
                      placeholder="輸入數量"
                      value={caseData.doorsInstalled}
                      onChange={(e) => {
                        const val = handleNumericInput(e.target.value);
                        if (val !== '' || e.target.value === '') handleFollowUpCaseChange(index, 'doorsInstalled', e.target.value === '' ? '' : val);
                      }}
                      disabled={isViewMode}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>安裝窗數</Label>
                    <Input
                      inputMode="numeric"
                      placeholder="輸入數量"
                      value={caseData.windowsInstalled}
                      onChange={(e) => {
                        const val = handleNumericInput(e.target.value);
                        if (val !== '' || e.target.value === '') handleFollowUpCaseChange(index, 'windowsInstalled', e.target.value === '' ? '' : val);
                      }}
                      disabled={isViewMode}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>安裝鋁料數</Label>
                    <Input
                      inputMode="numeric"
                      placeholder="輸入數量"
                      value={caseData.aluminumInstalled}
                      onChange={(e) => {
                        const val = handleNumericInput(e.target.value);
                        if (val !== '' || e.target.value === '') handleFollowUpCaseChange(index, 'aluminumInstalled', e.target.value === '' ? '' : val);
                      }}
                      disabled={isViewMode}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>拆舊拆拉釘窗花數</Label>
                    <Input
                      inputMode="numeric"
                      placeholder="輸入數量"
                      value={caseData.oldGrillesRemoved}
                      onChange={(e) => {
                        const val = handleNumericInput(e.target.value);
                        if (val !== '' || e.target.value === '') handleFollowUpCaseChange(index, 'oldGrillesRemoved', e.target.value === '' ? '' : val);
                      }}
                      disabled={isViewMode}
                      className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add Follow-up Case Button */}
          {!isViewMode && (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={addFollowUpCase}
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
                    提交報告
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
