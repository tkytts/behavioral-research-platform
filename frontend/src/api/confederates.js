import client from './client';

export const getConfederates = () => client.get('/confederates');
export const getScript = (order) => client.get(`/scripts?order=${order}`);
