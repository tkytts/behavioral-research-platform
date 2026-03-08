import client from './client';

export const getSuggestions = () => client.get('/suggestions');
