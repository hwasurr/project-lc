import { useQuery } from 'react-query';
import axios from '../../axios';

export type SocialAccount = {
  provider: string;
  registDate: Date;
  serviceId: string;
  name: string;
};

export type SocialAccounts = SocialAccount[];

export const getSocialAccounts = async (email: string): Promise<SocialAccounts> => {
  return axios
    .get<SocialAccounts>('/social/accounts', { params: { email } })
    .then((res) => {
      return res.data;
    });
};

export const useSocialAccounts = (email: string) => {
  return useQuery<SocialAccounts>(
    ['SocialAccounts', email],
    () => getSocialAccounts(email),
    {
      enabled: !!email,
    },
  );
};
