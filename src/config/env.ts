import { DEV_HOST } from './devHost.generated';

const LOCAL_API_BASE_URL = `http://${DEV_HOST}:3000/api/v1`;
const PROD_API_BASE_URL = 'https://api.kalanabhalogistics.com/api/v1';

export const API_BASE_URL = __DEV__ ? LOCAL_API_BASE_URL : PROD_API_BASE_URL;
