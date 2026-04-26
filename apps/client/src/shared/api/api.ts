import axios from 'axios';
import { clientEnv } from '../config/env';
import {
  attachRequestInterceptor,
  attachResponseInterceptor,
} from './api.interceptors';

export const API_BASE_URL = clientEnv.apiBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: clientEnv.apiRequestTimeoutMs,
  withCredentials: true,
});

attachRequestInterceptor(api);
attachResponseInterceptor(api);

export { api };
