import DatePicker from '@/components/common/parts/DatePicker';
import InputRadio from '@/components/common/parts/InputRadio';
import Select from '@/components/common/parts/Select';
import SelectObject from '@/components/common/parts/SelectObject';
import TextArea from '@/components/common/parts/TextArea';
import ToggleSwitch from '@/components/common/parts/ToggleSwitch';
import { UserInfo, userInfoState } from '@/hooks/atom/userInfo';
import {
  RIKAIDO_OBJ_LIST,
  stageList,
  TeachingReportTemplateInputType,
  TIME_OPTION_LIST,
} from '@/lib/teachingReport';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify'; // 変更
import { useRecoilState } from 'recoil';
import useSWR from 'swr';

type ReportObj = {
  stageName: string;
  topic: string;
  detail: string;
};

type TeachingReportData = {
  studentUid: string;
  date: Date;
  classTime: string;
  stage: string;
  topic: string;
  detail: string;
  studentName: string;
  writer: string;
  writerUid: string;
  rikaido: string;
  comment: string;
  isPublished: boolean;
};

type UserData = {
  uid: string;
  name?: string;
  email?: string;
  displayName?: string;
};

const DEFAULT_REPORT_OBJ: ReportObj = {
  stageName: '',
  topic: '',
  detail: '',
};

// fetcher関数を定義
const fetcher = (url: string) => axios.get(url).then((res: any) => res.data);

const Page = () => {
  const {
    register,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeachingReportTemplateInputType>();
  const [userInfo] = useRecoilState<UserInfo>(userInfoState);
  const stage = watch('stage');

  // useSWRを使ってテンプレートデータをフェッチ
  const { data: reportObj = DEFAULT_REPORT_OBJ, error: templateError } = useSWR<ReportObj>(
    stage ? `/api/teachingReport/fetchTemplate?docId=stage${stage}` : null,
    fetcher,
  );

  // useSWRを使ってユーザーデータをフェッチ
  const { data: users, error: usersError } = useSWR<UserData[]>(
    '/api/userActions/fetchUsers',
    fetcher,
  );

  const getPostData = (): TeachingReportData => {
    const data: TeachingReportData = {
      date: watch('date'),
      classTime: watch('classTime'),
      stage: reportObj.stageName,
      topic: reportObj.topic,
      detail: reportObj.detail,
      studentUid: watch('studentUid'),
      studentName: String((users && users[1].displayName) || ''),
      writer: userInfo.userName || 'なし',
      writerUid: userInfo.uid,
      rikaido: watch('rikaido'),
      comment: watch('comment') || 'なし',
      isPublished: false,
    };
    return data;
  };

  const createTeachingReport = async (data: TeachingReportData) => {
    try {
      const response: any = await axios.post('/api/teachingReport/createReport', data);

      if (response.status === 201) {
        toast.success(response.data.message);
        return { success: true };
      } else {
        toast.error(response.data.message);
        return { success: false };
      }
    } catch (error: any) {
      console.error('Error while creating document:', error);
      toast.error('An error occurred while creating the document.');
      return { success: false };
    }
  };

  const onSubmit = () => {
    if (!watch('stage') || !watch('date')) {
      toast.error('必要事項を選択してください。');
      return;
    }
    createTeachingReport(getPostData());
    reset();
  };

  // エラーハンドリング
  if (templateError) {
    console.log('Error fetching template data:', templateError);
  }
  console.log('users', users);

  if (usersError) {
    console.log('Error fetching users:', usersError);
  }

  return (
    <div className="mx-12 mt-24 max-w-4xl items-center">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mt-6">
          <DatePicker label="授業日時" register={register('date')} />
          <Select<string>
            label="時間"
            className="w-full"
            register={register('classTime')}
            optionList={TIME_OPTION_LIST}
          />
          <h2 className="font-bold">生徒を選択</h2>
          {users ? (
            <SelectObject
              register={register('studentUid')}
              optionObjList={users.map((user) => ({
                value: user.uid,
                optionName: user.displayName as string,
              }))}
            />
          ) : (
            <p>ユーザー情報を取得しています...</p>
          )}
        </div>
        <p className="h-8">選択してください。</p>
        <Select<string> optionList={stageList} className="w-full" register={register('stage')} />

        <InputRadio
          label="理解度"
          className="w-full"
          register={register('rikaido')}
          options={RIKAIDO_OBJ_LIST}
        />
        <div className="mt-4 font-bold">指導報告書の内容</div>
        <div className="border p-2">
          {stage ? (
            <div>
              <div>
                【今日のステージ】
                <p>#{reportObj.stageName}</p>
              </div>
              <div>
                <p>【今日の授業内容】</p>
                <p>・{reportObj.topic}</p>
              </div>
              <div>
                <p>【今日の授業の詳細】</p>
                <p>・{reportObj.detail}</p>
                <TextArea placeholder="当日の様子を追加" register={register('behavior')} />
              </div>
            </div>
          ) : (
            <div>ステージを選択してください。</div>
          )}
          <TextArea label="コメント" register={register('comment')} />

          <ToggleSwitch label="公開" register={register('isPublished')} />
        </div>
        <input className="rounded-lg border bg-primary px-3 py-2" type="submit" />
      </form>
    </div>
  );
};

export default Page;
