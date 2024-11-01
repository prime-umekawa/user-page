import ButtonOriginal from '@/components/common/parts/ButtonOriginal';
import { UserInfo, userInfoState } from '@/hooks/atom/userInfo';
import { UserData } from '@/lib/userSettings';
import { LinkNameList, urls } from '@/pages';
import { useToast } from '@chakra-ui/react';
import axios from 'axios';
import {
  EmailAuthProvider,
  getAuth,
  reauthenticateWithCredential,
  updatePassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import useSWR from 'swr';
import PageListAfterSignIn from './parts/PageListAfterSignIn';

// emailがメアドとして使用可能かどうかを判定するコード
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const linkList = urls.map((url, index) => {
  return { text: LinkNameList[index], link: url };
});

// データフェッチ用の fetcher 関数
const fetcher = (url: string) => axios.get(url).then((res) => res.data);

type Status = 'email' | 'password' | 'passwordError' | 'done';

const MailAndPassChangeDialog = (): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [userInfo] = useRecoilState<UserInfo>(userInfoState);
  const auth = getAuth();
  const user = auth.currentUser;
  const { data: users, error, mutate } = useSWR<UserData[]>('/api/userActions/fetchUsers', fetcher);
  const [status, useStatus] = useState<Status>('email');

  const [email, setEmail] = useState(user?.email || '');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [message, setMessage] = useState('');

  const toast = useToast();

  useEffect(() => {
    setPassword(userInfo.uid);
    setEmail(user?.email || '');
  }, []);

  const handleEmailChange = async () => {
    if (!user) {
      console.log('user is null');
      return;
    }
    await updateUserEmail(user.uid);
  };

  // ユーザーのメールアドレスを更新する
  const updateUserEmail = async (uid: string) => {
    setLoading(true);
    let error = false;
    if (!isValidEmail(newEmail)) {
      toast({ title: '正しいメールアドレスを入力して下さい。', status: 'warning' });
      setLoading(false);
      return;
    }
    try {
      await axios.put('/api/userActions/updateEmail', {
        uid,
        newEmail,
      });
      await mutate(); // データの更新後に再フェッチ
    } catch (e) {
      error = true;
      console.error(e);
      toast({
        title: 'メールアドレスの登録に失敗しました。再度送信してください。',
        status: 'error',
      });
    } finally {
      if (!error) {
        setEmail(newEmail);
        useStatus('password');

        toast({ title: '新しいメールアドレスを登録しました。', status: 'success' });
      }
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user || !newPassword || !userInfo.uid) {
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      toast({
        title: 'パスワードが一致しません。',
        status: 'warning',
        position: 'top-right',
      });
      return;
    }
    let error = false;
    try {
      const credential = EmailAuthProvider.credential(newEmail, userInfo.uid);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
    } catch (e: any) {
      error = true;
      await submitPasswordResetEmail();
      toast({
        title:
          'パスワード更新時にエラーが発生しました。担当者に問い合わせてパスワードをリセットしてください。',
        status: 'error',
        position: 'top-right',
      });
      setMessage(`パスワード更新時にエラーが発生しました${e.message}`);
    }
    if (!error) {
      console.log(error);
      setMessage('パスワードが更新されました');
      toast({
        title: 'パスワード更新に成功しました。',
        status: 'success',
        position: 'top-right',
      });
      useStatus('done');
    } else {
      useStatus('passwordError');
    }
  };

  const submitPasswordResetEmail = async () => {
    const actionCodeSettings = {
      // パスワード再設定後のリダイレクト URL
      url: 'https://www.alt-prime.com/signin',
      handleCodeInApp: false,
    };
    await sendPasswordResetEmail(auth, newEmail, actionCodeSettings)
      .then((resp) => {
        // メール送信成功
      })
      .catch((error) => {
        // メール送信失敗
        console.log(error);
      });
  };

  if ('email' === status) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-300 opacity-80">
        <div className="rounded-lg border-2 border-primary bg-white px-10 py-10 shadow-lg">
          {/* メールアドレス変更モーダル */}
          <h1 className="mb-4 font-bold text-primary">メールアドレスを設定してください。</h1>
          <div className="mb-4">
            <label className="mb-2 block font-bold text-primary-dark">新しいメールアドレス</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full rounded-md border-2 border-gray-300 px-3 py-2"
            />
            <ButtonOriginal
              variant="primary"
              label="メールアドレスを変更"
              onClick={handleEmailChange}
              loading={loading}
            />
          </div>

          {message && <p className="text-red-500">{message}</p>}
        </div>
      </div>
    );
  }
  if ('password' === status) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-300 opacity-80">
        <div className="rounded-lg border-2 border-primary bg-white px-10 py-10 shadow-lg">
          {/* パスワード設定画面 */}
          <h1 className="mb-4 font-bold text-primary">新しいパスワードを設定してください。</h1>

          <div className="mb-4">
            <label className="mb-2 block font-bold text-primary-dark">新しいパスワード</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md border-2 border-gray-300 px-3 py-2"
            />
            <label className="mb-2 mt-4 block font-bold text-primary-dark">新しいパスワード</label>
            <input
              type="password"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              className="w-full rounded-md border-2 border-gray-300 px-3 py-2"
            />
            <ButtonOriginal
              variant="primary"
              label="パスワードを変更"
              onClick={handlePasswordChange}
            />
          </div>

          {message && <p className="max-w-60 text-red-500">{message}</p>}
        </div>
      </div>
    );
  }

  if ('passwordError' === status) {
    return (
      <div>
        <p>エラーが発生しました。</p>
        <p className="text-lg font-bold">{newEmail}あてにパスワード設定メールを送信しました。</p>
      </div>
    );
  }
  if ('done' === status) {
    return <PageListAfterSignIn linkList={linkList} />;
  }

  return <div>問題が発生しました。管理者に問い合わせてください。</div>;
};

export default MailAndPassChangeDialog;
